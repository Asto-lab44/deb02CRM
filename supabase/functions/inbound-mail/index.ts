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
// Normalise une raison sociale pour comparaison floue : majuscules,
// sans accents, sans suffixes juridiques ni ponctuation.
function normalizeName(s: string): string {
  return (s || "")
    .toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")     // accents
    .replace(/\b(SARL|SAS|SASU|SA|EURL|SCOP|SCI|SNC|SELARL|SELAS|GIE|ASSOCIATION)\b/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrait les champs structurés récurrents du corps (format technicien
// Astorya : "Société : X", "Clé abonnement : Y", "Numero de série : Z"...).
// Renvoie { societe, fields: {...} }.
function parseBodyFields(body: string): { societe: string | null; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  let societe: string | null = null;
  const lines = (body || "").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-zÀ-ÿ' ]+?)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    if (!val) continue;
    fields[key] = val;
    if (/soci[ée]t[ée]|client|entreprise|raison sociale/.test(key)) societe = val;
  }
  return { societe, fields };
}

async function matchClient(supabase: any, fromEmail: string, bodyText: string) {
  const email = (fromEmail || "").toLowerCase().trim();
  const domain = email.split("@")[1] || "";
  const generic = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.fr", "free.fr", "orange.fr", "wanadoo.fr", "laposte.net", "astorya.fr"];
  const parsed = parseBodyFields(bodyText);

  // 1. Société déclarée dans le corps (ligne « Société : X ») — prioritaire
  //    car le workflow Astorya envoie l'email depuis une adresse interne.
  if (parsed.societe) {
    const target = normalizeName(parsed.societe);
    const { data: candidates } = await supabase.from("clients").select("id, raison_sociale, name");
    if (candidates && target) {
      // a) Égalité normalisée
      let hit = (candidates as any[]).find((c) => normalizeName(c.raison_sociale || c.name || "") === target);
      // b) Inclusion (le nom client contient la société ou inversement)
      if (!hit) {
        hit = (candidates as any[]).find((c) => {
          const n = normalizeName(c.raison_sociale || c.name || "");
          return n && (n.includes(target) || target.includes(n));
        });
      }
      if (hit) return { client_id: hit.id, contact_id: null, method: "body_societe", societe: parsed.societe, fields: parsed.fields };
    }
  }
  // 2. Email exact sur un contact (si expéditeur externe)
  if (email && !generic.includes(domain)) {
    const { data: contact } = await supabase
      .from("contacts").select("id, client_id").ilike("email", email).maybeSingle();
    if (contact && contact.client_id) {
      return { client_id: contact.client_id, contact_id: contact.id, method: "email_exact", societe: parsed.societe, fields: parsed.fields };
    }
  }
  // 3. Email exact sur un client
  if (email && !generic.includes(domain)) {
    const { data: client } = await supabase
      .from("clients").select("id").ilike("email", email).maybeSingle();
    if (client) return { client_id: client.id, contact_id: null, method: "email_exact", societe: parsed.societe, fields: parsed.fields };
  }
  // 4. Domaine
  if (domain && !generic.includes(domain)) {
    const { data: byDomain } = await supabase
      .from("clients").select("id, email, website")
      .or(`email.ilike.%@${domain},website.ilike.%${domain}%`).limit(1).maybeSingle();
    if (byDomain) return { client_id: byDomain.id, contact_id: null, method: "domain", societe: parsed.societe, fields: parsed.fields };
  }
  // 5. Aucun match → tâche « Client à identifier » mais on remonte la société
  //    devinée + les champs parsés pour aider le commercial.
  return { client_id: null, contact_id: null, method: "none", societe: parsed.societe, fields: parsed.fields };
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
    // 3. Nom du client (pour titre tâche). Si pas de match mais société
    //    devinée dans le corps → on l'utilise pour le titre + à identifier.
    let clientName = "Client à identifier";
    if (match.client_id) {
      const { data: c } = await supabase.from("clients").select("raison_sociale, name").eq("id", match.client_id).maybeSingle();
      clientName = (c && (c.raison_sociale || c.name)) || clientName;
    } else if (match.societe) {
      clientName = match.societe + " (à confirmer)";
    }

    const reqId = genId("INB");
    const excerpt = (bodyText || "").slice(0, 280);

    // Champs structurés parsés (clé abonnement, n° série, modèle poste…)
    // → pré-remplis dans la note du devis et stockés pour le commercial.
    const fields = match.fields || {};
    const fieldLines = Object.keys(fields)
      .filter((k) => !/soci[ée]t[ée]|client|entreprise|raison sociale/.test(k))
      .map((k) => "• " + k.charAt(0).toUpperCase() + k.slice(1) + " : " + fields[k]);
    const fieldsNote = fieldLines.length ? "\n\nInfos techniques extraites :\n" + fieldLines.join("\n") : "";

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
      data: { source: "inbound_mail", inbound_id: reqId, from_email: fromEmail, ai_products: ai.products, societe_hint: match.societe || null, parsed_fields: fields },
    });

    // 5. Crée l'entrée inbound_requests
    await supabase.from("inbound_requests").insert({
      id: reqId,
      from_name: fromName, from_email: fromEmail, to_email: toEmail,
      subject, body_text: bodyText, body_excerpt: excerpt,
      has_attachments: attachments.length > 0, attachments,
      client_id: match.client_id, contact_id: match.contact_id, match_method: match.method,
      needs_identification: !match.client_id,
      ai_summary: (ai.summary || "") + fieldsNote,
      ai_products: ai.products, ai_urgency: ai.urgency,
      ai_amount_hint: ai.amount_hint,
      ai_raw: { ...ai.raw, societe_hint: match.societe || null, parsed_fields: fields },
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
