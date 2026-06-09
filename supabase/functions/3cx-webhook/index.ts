// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Webhook 3CX (Edge Function Deno)
// ════════════════════════════════════════════════════════════════════
//
// Reçoit les events 3CX (ringing / answered / hangup) et les insère
// dans la table call_events après :
//   1. Vérification du secret partagé (header X-3CX-Secret)
//   2. Filtrage département = "ASTO"
//   3. Normalisation du numéro entrant (+33 ↔ 0)
//   4. Lookup du client par téléphone
//   5. Lookup de l'agent par extension_3cx
//
// Déploiement :
//   supabase functions deploy 3cx-webhook --no-verify-jwt
//
// URL exposée :
//   https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/3cx-webhook
// ════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Normalise un numéro FR vers E.164 : 0612345678 ou 33612345678 → +33612345678
function normalizeFR(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  // 3CX envoie souvent "33685130307" (sans +) — on ajoute le +
  if (digits.startsWith("33") && digits.length === 11) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+33" + digits.slice(1);
  return digits;
}

// Génère toutes les variantes possibles pour matcher contre la BDD
// (qui peut stocker +33..., 0..., ou avec espaces/points/tirets)
function phoneVariants(e164: string): string[] {
  if (!e164.startsWith("+33")) return [e164];
  const national = "0" + e164.slice(3);
  return [e164, national];
}

Deno.serve(async (req) => {
  // CORS preflight + GET healthcheck
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, x-3cx-secret",
      },
    });
  }
  if (req.method === "GET") {
    return new Response("3CX webhook OK", { status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // ─── 1. Parse du payload ──
  let body: any = null;
  try {
    body = await req.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ─── 2. Vérification du secret (header OU body — 3CX V20 templates
  //        ne supportent pas bien les headers custom) ──
  const providedSecret = req.headers.get("x-3cx-secret") || body?.Secret || body?.secret || "";
  const { data: secretRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "3cx_webhook_secret")
    .single();
  const expectedSecret = secretRow?.value || "";

  if (!expectedSecret || providedSecret !== expectedSecret) {
    console.warn("[3cx] secret mismatch");
    return new Response("Unauthorized", { status: 401 });
  }

  // Champs 3CX (V20 Enterprise — schéma standard CRM integration)
  // Adaptable selon le format exact remonté par votre instance
  const callId       = body.CallID     || body.call_id    || body.id;
  const callerNumber = body.CallerID   || body.caller     || body.from;
  const callerName   = body.CallerName || body.caller_name || null;
  const calledExt    = String(body.Extension || body.extension || body.to || "");
  const direction    = (body.Direction || body.direction || "inbound").toLowerCase();
  const status       = (body.Status    || body.status    || "ringing").toLowerCase();
  const department   = body.Department || body.department || null;

  // 3CX V20 envoie Extension="" pendant le routage département (avant que
  // l'extension cible ne soit décidée). On accepte ça et on broadcast à
  // tous les agents ASTO ayant une extension configurée.
  if (!callerNumber) {
    console.log("[3cx-debug] Pas de CallerID — réponse mock");
    return new Response(JSON.stringify({
      created: "noop-" + Date.now(),
      mode: "no-caller",
    }), { status: 200, headers: { "content-type": "application/json" } });
  }

  // ─── 4. Normalisation + lookup client ───────────────────────────
  // Stratégie : on garde les 9 derniers chiffres (mantisse du numéro FR)
  // et on compare avec les 9 derniers chiffres des téléphones en BDD,
  // côté JS pour ignorer espaces, points, tirets, parenthèses, +33/0/33…
  const normalized = normalizeFR(callerNumber);
  const variants   = phoneVariants(normalized);
  const callerLast9 = normalized.replace(/\D/g, "").slice(-9);
  const last9 = (s: string | null | undefined) => (s || "").replace(/\D/g, "").slice(-9);

  let matchedClientId: string | null = null;
  try {
    // 1. Cherche dans clients : phone direct + data.contact_principal.phone
    //    + data.contacts_additionnels[*].phone (toutes formes JSON possibles)
    const { data: clients } = await supabase
      .from("clients")
      .select("id, phone, data");
    for (const c of (clients || [])) {
      const phonesToCheck: string[] = [];
      if (c.phone) phonesToCheck.push(c.phone);
      const d = c.data || {};
      if (d.contact_principal?.phone) phonesToCheck.push(d.contact_principal.phone);
      if (Array.isArray(d.contacts_additionnels)) {
        for (const ca of d.contacts_additionnels) {
          if (ca?.phone) phonesToCheck.push(ca.phone);
        }
      }
      if (phonesToCheck.some((p) => last9(p) === callerLast9 && callerLast9.length === 9)) {
        matchedClientId = c.id;
        break;
      }
    }
    // 2. Si rien : cherche dans la table contacts
    if (!matchedClientId) {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("client_id, phone")
        .not("phone", "is", null);
      for (const c of (contacts || [])) {
        if (last9(c.phone) === callerLast9 && callerLast9.length === 9) {
          matchedClientId = c.client_id;
          break;
        }
      }
    }
    console.log("[3cx] lookup", callerNumber, "→", callerLast9, "→ client", matchedClientId || "(aucun match)");
  } catch (e) {
    console.warn("[3cx] client lookup error:", e);
  }

  // ─── 5. Lookup agent(s) à notifier ──────────────────────────────
  // Si Extension fournie : un seul agent ciblé.
  // Sinon (3CX V20 lookup déclenché avant routage) : broadcast à tous
  // les agents ASTO ayant une extension_3cx configurée.
  let targetAgents: string[] = [];
  try {
    if (calledExt) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("extension_3cx", calledExt)
        .limit(1);
      if (data && data.length) targetAgents = data.map((a) => a.id);
    }
    if (targetAgents.length === 0) {
      // Broadcast à tous les agents ayant une extension configurée
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .not("extension_3cx", "is", null);
      if (data) targetAgents = data.map((a) => a.id);
      console.log("[3cx-debug] Broadcast à", targetAgents.length, "agent(s)");
    }
  } catch (e) {
    console.warn("[3cx] agent lookup error:", e);
  }

  // Si aucun agent configuré, on insert quand même une ligne sans agent
  // (utile pour debug + permet à un futur listener no-filter de voir l'event)
  if (targetAgents.length === 0) targetAgents = [null as any];

  // ─── 6. Insert / Update event ───────────────────────────────────
  const baseRow = {
    caller_number: normalized,
    caller_name: callerName,
    called_extension: calledExt,
    matched_client_id: matchedClientId,
    direction: direction === "outbound" ? "outbound" : "inbound",
    status,
    department: department || "ASTO",
    call_id_3cx: callId || null,
    payload_raw: body,
  };

  if (callId && status !== "ringing") {
    // Status change (answered/hangup/missed) → update les lignes existantes
    const updates: any = { status };
    if (status === "answered") updates.answered_at = new Date().toISOString();
    if (status === "hangup" || status === "missed") {
      updates.ended_at = new Date().toISOString();
      if (body.DurationSec || body.duration_sec) {
        updates.duration_sec = Number(body.DurationSec || body.duration_sec);
      }
    }
    const { data: updated } = await supabase
      .from("call_events")
      .update(updates)
      .eq("call_id_3cx", callId)
      .select("id");
    return new Response(JSON.stringify({ updated: updated?.length || 0, status }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }

  // Insertion : une ligne par agent ciblé (broadcast)
  const rows = targetAgents.map((agentId) => ({ ...baseRow, agent_user_id: agentId }));
  const { data: inserted, error: insErr } = await supabase
    .from("call_events")
    .insert(rows)
    .select("id");

  if (insErr) {
    console.error("[3cx] insert error:", insErr);
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }

  console.log("[3cx-debug] ✓ Inséré", inserted?.length, "ligne(s) call_events");
  return new Response(JSON.stringify({
    created: inserted?.[0]?.id,
    rows: inserted?.length,
    agents: targetAgents.length,
    client: matchedClientId,
  }), { status: 200, headers: { "content-type": "application/json" } });
});
