// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Call Control 3CX (Edge Function Deno)
// ════════════════════════════════════════════════════════════════════
//
// Proxy entre le navigateur Hub et l'API REST 3CX V20 Call Control :
//   - Authentifie via OAuth client_credentials (config dans app_settings)
//   - Cache le bearer token entre les invocations chaudes
//   - Expose 3 actions : answer, drop, status
//
// ENDPOINTS
//   POST  /3cx-call-control { action: "answer"|"drop"|"status", extension: "704" }
//
// PRÉREQUIS BDD (table app_settings)
//   3cx_server_url      ex: https://telcomastorya.my3cx.fr:5001
//   3cx_client_id       depuis Console 3CX → Intégrations → API
//   3cx_client_secret   idem
//
// AUTH CLIENT
//   Le navigateur doit envoyer l'Authorization Bearer JWT Supabase de
//   l'utilisateur courant — l'Edge Function s'assure que seul un user
//   authentifié peut piloter la téléphonie.
// ════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY")!;

// Cache token en mémoire (par instance chaude — disparaît au scale-down)
let cachedToken: { value: string; expiresAt: number } | null = null;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

const json = (body: any, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS_HEADERS, "content-type": "application/json" },
});

// ───── OAuth client_credentials → Bearer token 3CX ─────────────────
async function get3CXToken(serverUrl: string, clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const tokenUrl = `${serverUrl.replace(/\/$/, "")}/connect/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`3CX token HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  if (!data.access_token) throw new Error("3CX token response sans access_token");
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000),
  };
  return cachedToken.value;
}

// ───── Find the active ringing/connected call on the given DN ──────
async function findActiveCall(serverUrl: string, token: string, extension: string) {
  const url = `${serverUrl.replace(/\/$/, "")}/callcontrol/${extension}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`3CX GET dn HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  // Schema 3CX V20 : { Participants: [{ Id, Status, ... }], Devices: [...] }
  const participants = data?.Participants || data?.participants || [];
  // Prioritise ringing, sinon connected
  const ringing = participants.find((p: any) => /ring/i.test(p.Status || p.status || ""));
  const connected = participants.find((p: any) => /connect|talking/i.test(p.Status || p.status || ""));
  return ringing || connected || null;
}

// ───── Action : answer ─────────────────────────────────────────────
async function answer(serverUrl: string, token: string, extension: string, participantId: string | number) {
  const url = `${serverUrl.replace(/\/$/, "")}/callcontrol/${extension}/participants/${participantId}/answer`;
  const resp = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`3CX answer HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  return await resp.json().catch(() => ({ ok: true }));
}

// ───── Action : drop (hangup / refuser) ────────────────────────────
async function drop(serverUrl: string, token: string, extension: string, participantId: string | number) {
  const url = `${serverUrl.replace(/\/$/, "")}/callcontrol/${extension}/participants/${participantId}/drop`;
  const resp = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`3CX drop HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  return await resp.json().catch(() => ({ ok: true }));
}

// ════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method === "GET") return new Response("3CX Call Control OK", { status: 200 });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ─── 1. Vérifie que l'utilisateur est authentifié côté Supabase ──
  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing Authorization Bearer JWT" }, 401);

  const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !userData?.user) return json({ error: "Invalid JWT" }, 401);

  // ─── 2. Parse de la requête ──────────────────────────────────────
  let body: any = {};
  try { body = await req.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400); }
  const action    = String(body.action || "").toLowerCase();
  const extension = String(body.extension || "").trim();
  if (!action || !extension) return json({ error: "Missing fields : action, extension" }, 400);
  if (!["answer", "drop", "status"].includes(action)) return json({ error: "Action invalide" }, 400);

  // ─── 3. Charge la config 3CX depuis app_settings (service role) ──
  const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: settings } = await supaAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["3cx_server_url", "3cx_client_id", "3cx_client_secret"]);
  const cfg = Object.fromEntries((settings || []).map((s: any) => [s.key, s.value]));
  const serverUrl    = cfg["3cx_server_url"];
  const clientId     = cfg["3cx_client_id"];
  const clientSecret = cfg["3cx_client_secret"];

  if (!serverUrl || !clientId || !clientSecret) {
    return json({ error: "Config 3CX incomplète — renseignez server URL / client_id / secret dans Admin → Intégrations API" }, 503);
  }

  // ─── 4. Token 3CX ────────────────────────────────────────────────
  let token: string;
  try {
    token = await get3CXToken(serverUrl, clientId, clientSecret);
  } catch (e: any) {
    console.error("[3cx-cc] token error:", e.message);
    return json({ error: "Auth 3CX échouée : " + e.message }, 502);
  }

  // ─── 5. Trouve l'appel actif sur l'extension ─────────────────────
  let activeCall: any = null;
  try {
    activeCall = await findActiveCall(serverUrl, token, extension);
  } catch (e: any) {
    console.error("[3cx-cc] findActiveCall error:", e.message);
    return json({ error: "Pas pu lire l'état de l'extension : " + e.message }, 502);
  }

  if (action === "status") {
    return json({ extension, active_call: activeCall });
  }

  if (!activeCall) {
    return json({ error: "Aucun appel actif sur l'extension " + extension }, 404);
  }

  const participantId = activeCall.Id || activeCall.id;
  if (!participantId) return json({ error: "Participant ID introuvable", debug: activeCall }, 500);

  // ─── 6. Exécute l'action ─────────────────────────────────────────
  try {
    if (action === "answer") {
      const result = await answer(serverUrl, token, extension, participantId);
      return json({ ok: true, action, result });
    }
    if (action === "drop") {
      const result = await drop(serverUrl, token, extension, participantId);
      return json({ ok: true, action, result });
    }
  } catch (e: any) {
    console.error("[3cx-cc] action error:", e.message);
    return json({ error: e.message }, 502);
  }

  return json({ error: "Action non gérée" }, 500);
});
