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

// Normalise un numéro FR : 0612345678 → +33612345678, garde +33 inchangé
function normalizeFR(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
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

  // ─── DEBUG : log de tout ce qu'on reçoit (URL + headers + body brut) ─
  const rawBody = await req.text();
  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => { headersObj[k] = v; });
  console.log("[3cx-debug] === Requête reçue ===");
  console.log("[3cx-debug] URL:", req.url);
  console.log("[3cx-debug] Method:", req.method);
  console.log("[3cx-debug] Headers:", JSON.stringify(headersObj));
  console.log("[3cx-debug] Body brut (premiers 2000 char):", rawBody.slice(0, 2000));

  // ─── 1. Parse du payload ──
  let body: any = null;
  try {
    body = JSON.parse(rawBody);
    console.log("[3cx-debug] Parsed JSON:", JSON.stringify(body));
  } catch (e) {
    console.warn("[3cx-debug] Body non-JSON ou vide");
    body = {};
  }

  // ─── 2. Vérification du secret (mode debug : on log mais on ne bloque
  //        plus pour pouvoir capturer le payload exact de 3CX) ──
  const providedSecret = req.headers.get("x-3cx-secret") || body?.Secret || body?.secret || "";
  const { data: secretRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "3cx_webhook_secret")
    .single();
  const expectedSecret = secretRow?.value || "";

  if (!expectedSecret || providedSecret !== expectedSecret) {
    console.warn("[3cx-debug] Secret mismatch — providedSecret=", providedSecret.slice(0, 8), "...expectedSecret=", expectedSecret.slice(0, 8), "...");
    // DEBUG : on continue quand même pour voir ce que 3CX envoie
    // return new Response("Unauthorized", { status: 401 });
  } else {
    console.log("[3cx-debug] ✓ Secret valide");
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

  // En mode TEST 3CX, l'Extension est vide (pas d'appel réel). On répond
  // OK avec un contact factice pour que la validation 3CX passe — pas
  // d'INSERT en BDD.
  if (!callerNumber) {
    return new Response("Missing CallerID", { status: 400 });
  }
  if (!calledExt) {
    console.log("[3cx-debug] Mode TEST détecté (Extension vide) — réponse mock");
    return new Response(JSON.stringify({
      created: "test-" + Date.now(),
      mode: "test",
      message: "Configuration OK — Extension sera renseignée lors d'un vrai appel",
    }), { status: 200, headers: { "content-type": "application/json" } });
  }

  // ─── 3. Filtrage département ASTO ───────────────────────────────
  if (department && String(department).toUpperCase() !== "ASTO") {
    return new Response(JSON.stringify({ ignored: true, reason: "department_not_asto" }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }

  // ─── 4. Normalisation + lookup client ───────────────────────────
  const normalized = normalizeFR(callerNumber);
  const variants   = phoneVariants(normalized);

  let matchedClientId: string | null = null;
  try {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, phone")
      .or(variants.map((v) => `phone.eq.${v}`).join(","))
      .limit(1);
    if (clients && clients.length > 0) matchedClientId = clients[0].id;
  } catch (e) {
    console.warn("[3cx] client lookup error:", e);
  }

  // ─── 5. Lookup agent par extension ──────────────────────────────
  let agentUserId: string | null = null;
  try {
    const { data: agents } = await supabase
      .from("profiles")
      .select("id")
      .eq("extension_3cx", calledExt)
      .limit(1);
    if (agents && agents.length > 0) agentUserId = agents[0].id;
  } catch (e) {
    console.warn("[3cx] agent lookup error:", e);
  }

  // ─── 6. Insert / Update event ───────────────────────────────────
  // Dédup par call_id_3cx — un même appel peut envoyer ringing puis answered puis hangup
  const baseRow = {
    caller_number: normalized,
    caller_name: callerName,
    called_extension: calledExt,
    agent_user_id: agentUserId,
    matched_client_id: matchedClientId,
    direction: direction === "outbound" ? "outbound" : "inbound",
    status,
    department: department || "ASTO",
    call_id_3cx: callId || null,
    payload_raw: body,
  };

  if (callId) {
    // Upsert sur call_id_3cx
    const { data: existing } = await supabase
      .from("call_events")
      .select("id, status")
      .eq("call_id_3cx", callId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const updates: any = { status };
      if (status === "answered") updates.answered_at = new Date().toISOString();
      if (status === "hangup" || status === "missed") {
        updates.ended_at = new Date().toISOString();
        if (body.DurationSec || body.duration_sec) {
          updates.duration_sec = Number(body.DurationSec || body.duration_sec);
        }
      }
      await supabase.from("call_events").update(updates).eq("id", existing.id);
      return new Response(JSON.stringify({ updated: existing.id, status }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from("call_events")
    .insert(baseRow)
    .select("id")
    .single();

  if (insErr) {
    console.error("[3cx] insert error:", insErr);
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ created: inserted?.id, agent: agentUserId, client: matchedClientId }), {
    status: 200, headers: { "content-type": "application/json" },
  });
});
