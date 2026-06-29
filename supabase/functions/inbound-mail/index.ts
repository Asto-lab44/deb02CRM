// ════════════════════════════════════════════════════════════════════
// Edge Function : inbound-mail
// ════════════════════════════════════════════════════════════════════
//
// Webhook qui reçoit un email entrant (depuis l'adresse dédiée
// devis.astorya@gmail.com, via un service de parsing email entrant type
// CloudMailin / Mailgun routes / Postmark inbound, ou un forward OVH).
//
// Pipeline :
//   1. Parse le payload email (from, subject, body, attachments)
//   2. Matche le client (email exact → domaine → fuzzy nom → aucun)
//   3. Extrait le besoin via l'API Anthropic (résumé, produits, urgence)
//   4. Crée une entrée inbound_requests
//   5. Crée une tâche « 📋 Devis à faire » dans actions
//   6. (option) notifie Teams
//
// Sécurité : token partagé dans le header X-Inbound-Token (vérifié contre
// INBOUND_WEBHOOK_TOKEN) — empêche les soumissions non autorisées.
// ════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const WEBHOOK_TOKEN = Deno.env.get("INBOUND_WEBHOOK_TOKEN") || "";
const TEAMS_WEBHOOK = Deno.env.get("TEAMS_WEBHOOK_URL") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-inbound-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genId(prefix: string) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Matching client en cascade
async function matchClient(supabase: any, fromEmail: string, bodyText: string) {
  const email = (fromEmail || "").toLowerCase().trim();
  const domain = email.split("@")[1] || "";

  // 1. Email exact sur un contact
  if (email) {
    const { data: contact } = await supabase
      .from("contacts").select("id, client_id").ilike("email", email).maybeSingle();
    if (contact && contact.client_id) {
      return { client_id: contact.client_id, contact_id: contact.id, method: "email_exact" };
    }
  }
  // 2. Email exact sur un client
  if (email) {
    const { data: client } = await supabase
      .from("clients").select("id").ilike("email", email).maybeSingle();
    if (client) return { client_id: client.id, contact_id: null, method: "email_exact" };
  }
  // 3. Domaine — match sur l'email client ou website
  if (domain && !["gmail.com", "outlook.com", "hotmail.com", "yahoo.fr", "free.fr", "orange.fr", "wanadoo.fr"].includes(domain)) {
    const { data: byDomain } = await supabase
      .from("clients").select("id, email, website")
      .or(`email.ilike.%@${domain},website.ilike.%${domain}%`).limit(1).maybeSingle();
    if (byDomain) return { client_id: byDomain.id, contact_id: null, method: "domain" };
  }
  // 4. Fuzzy sur la raison sociale présente dans le corps (best effort)
  // (laissé au commercial — on ne devine pas pour éviter les faux positifs)
  return { client_id: null, contact_id: null, method: "none" };
}

// ── Extraction IA du besoin
async function extractNeed(subject: string, body: string) {
  if (!ANTHROPIC_KEY) {
    return { summary: subject || "Demande de devis", products: [], urgency: "moyenne", amount_hint: null, raw: null };
  }
  const prompt = `Tu es un assistant commercial. Analyse cet email de demande et extrais les informations au format JSON strict.

EMAIL — Sujet : ${subject}
EMAIL — Corps :
${(body || "").slice(0, 3000)}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "summary": "résumé du besoin en une phrase courte (max 120 caractères)",
  "products": ["liste des produits/services mentionnés"],
  "urgency": "haute | moyenne | basse",
  "amount_hint": "montant évoqué ou null"
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text || "{}";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      summary: json.summary || subject || "Demande de devis",
      products: Array.isArray(json.products) ? json.products : [],
      urgency: ["haute", "moyenne", "basse"].includes(json.urgency) ? json.urgency : "moyenne",
      amount_hint: json.amount_hint || null,
      raw: json,
    };
  } catch (e) {
    return { summary: subject || "Demande de devis", products: [], urgency: "moyenne", amount_hint: null, raw: { error: String(e) } };
  }
}

async function notifyTeams(title: string, text: string) {
  if (!TEAMS_WEBHOOK) return;
  try {
    await fetch(TEAMS_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard", "@context": "http://schema.org/extensions",
        themeColor: "ea580c", summary: title,
        sections: [{ activityTitle: "📋 " + title, text }],
      }),
    });
  } catch {}
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Vérif token webhook
    if (WEBHOOK_TOKEN && req.headers.get("X-Inbound-Token") !== WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: "Token invalide" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const payload = await req.json();

    // Normalisation du payload (gère plusieurs formats de services email)
    const fromEmail = (payload.from_email || payload.from || payload.sender || "").replace(/.*<(.+)>.*/, "$1").trim();
    const fromName = payload.from_name || (payload.from && payload.from.replace(/<.*>/, "").trim()) || "";
    const subject = payload.subject || "(sans sujet)";
    const bodyText = payload.body_text || payload.text || payload.plain || payload.body || "";
    const toEmail = payload.to_email || payload.to || "devis.astorya@gmail.com";
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

    if (!fromEmail) throw new Error("Expéditeur manquant");

    // 1. Matching client
    const match = await matchClient(supabase, fromEmail, bodyText);
    // 2. Extraction IA
    const ai = await extractNeed(subject, bodyText);
    // 3. Nom du client (pour titre tâche)
    let clientName = "Client à identifier";
    if (match.client_id) {
      const { data: c } = await supabase.from("clients").select("raison_sociale, name").eq("id", match.client_id).maybeSingle();
      clientName = (c && (c.raison_sociale || c.name)) || clientName;
    }

    const reqId = genId("INB");
    const excerpt = (bodyText || "").slice(0, 280);

    // 4. Crée la tâche « Devis à faire »
    const actionId = genId("EX");
    await supabase.from("actions").insert({
      id: actionId,
      client_id: match.client_id || null,
      opp_id: null,
      type: "task",
      title: "📋 Devis à faire — " + clientName,
      meta: ai.summary + (ai.amount_hint ? " · Montant évoqué : " + ai.amount_hint : ""),
      due_text: ai.urgency === "haute" ? "Urgent — sous 24h" : "Sous 3 jours",
      priority: ai.urgency === "haute" ? "haute" : "moyenne",
      assigned_to: null,
      tag: "Devis entrant",
      tag_color: "#ea580c",
      icon: "📋",
      status: "todo",
      data: { source: "inbound_mail", inbound_id: reqId, from_email: fromEmail, ai_products: ai.products },
    });

    // 5. Crée l'entrée inbound_requests
    await supabase.from("inbound_requests").insert({
      id: reqId,
      from_name: fromName, from_email: fromEmail, to_email: toEmail,
      subject, body_text: bodyText, body_excerpt: excerpt,
      has_attachments: attachments.length > 0, attachments,
      client_id: match.client_id, contact_id: match.contact_id, match_method: match.method,
      needs_identification: !match.client_id,
      ai_summary: ai.summary, ai_products: ai.products, ai_urgency: ai.urgency,
      ai_amount_hint: ai.amount_hint, ai_raw: ai.raw,
      status: match.client_id ? "client_identifie" : "a_traiter",
      action_id: actionId,
    });

    // 6. Notification Teams
    await notifyTeams(
      "Devis à faire — " + clientName,
      ai.summary + "\n\nDe : " + fromName + " <" + fromEmail + ">\nSujet : " + subject +
      (match.client_id ? "" : "\n⚠ Client à identifier manuellement")
    );

    return new Response(JSON.stringify({ ok: true, inbound_id: reqId, action_id: actionId, matched: match.method, client_id: match.client_id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message || String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
