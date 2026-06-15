// ════════════════════════════════════════════════════════════════════
// activity-tracker.js — Tracking minimal (sessions + verrouillage + erreurs)
// ════════════════════════════════════════════════════════════════════
//
// Chargé sur chaque page du Hub. Au DOMContentLoaded :
//   1. Démarre une session si l'utilisateur est connecté (Supabase Auth)
//   2. Heartbeat toutes les 60s pour maintenir last_activity
//   3. Page Visibility API → détecte verrouillage / dévérouillage écran
//   4. window.onerror + unhandledrejection → log toutes les erreurs JS
//   5. beforeunload → ferme proprement la session (best-effort)
//   6. Inactivité 15 min → idle_timeout
//
// Tables : user_sessions + user_events
// Tracking strict minimum : aucun clic, scroll, frappe — RGPD friendly.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const HEARTBEAT_MS = 60 * 1000;       // 60s
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 min

  let _session = null;       // { id, started_at, locked_at }
  let _user = null;          // { id, name, email }
  let _heartbeatTimer = null;
  let _idleTimer = null;
  let _lockStart = null;
  let _totalLockedSeconds = 0;

  function supa() { return window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null; }
  function genId(prefix) {
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function detectPlatform() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return "Windows";
    if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Android/i.test(ua)) return "Android";
    return "Other";
  }
  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//i.test(ua)) return "Edge";
    if (/Chrome\//i.test(ua)) return "Chrome";
    if (/Firefox\//i.test(ua)) return "Firefox";
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
    return "Other";
  }
  // Hash l'IP côté client (on n'a pas l'IP réelle, juste une empreinte stable)
  function fingerprintHash() {
    const seed = navigator.userAgent + screen.width + screen.height + (navigator.language || "");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i), h |= 0;
    return "fp_" + Math.abs(h).toString(36);
  }

  async function getCurrentUser() {
    const s = supa();
    if (!s) return null;
    try {
      const { data } = await s.auth.getSession();
      if (!data || !data.session || !data.session.user) return null;
      const u = data.session.user;
      // Cherche le profil pour récupérer le nom
      let name = u.email;
      try {
        const { data: prof } = await s.from("profiles").select("name").eq("id", u.id).maybeSingle();
        if (prof && prof.name) name = prof.name;
      } catch (e) {}
      return { id: u.id, email: u.email, name };
    } catch (e) { return null; }
  }

  async function startSession() {
    const s = supa();
    if (!s || !_user) return;
    const sessionId = genId("SES");
    const row = {
      id: sessionId,
      user_id: _user.id,
      user_name: _user.name,
      user_email: _user.email,
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      user_agent: navigator.userAgent.slice(0, 500),
      ip_hash: fingerprintHash(),
      platform: detectPlatform(),
      browser: detectBrowser(),
      page_views: 1,
    };
    const { error } = await s.from("user_sessions").insert(row);
    if (error) { console.warn("[activity] startSession:", error.message); return; }
    _session = { id: sessionId, started_at: row.started_at };
    // Event login
    await logEvent("login", { path: location.pathname });
  }

  async function endSession(reason) {
    if (!_session) return;
    const s = supa();
    if (!s) return;
    try {
      await s.from("user_sessions").update({
        ended_at: new Date().toISOString(),
        end_reason: reason || "closed",
        total_locked_s: _totalLockedSeconds,
      }).eq("id", _session.id);
      await logEvent("logout", { path: location.pathname, reason });
    } catch (e) {}
    _session = null;
  }

  async function heartbeat() {
    if (!_session) return;
    const s = supa();
    if (!s) return;
    try { await s.rpc("activity_heartbeat", { p_session_id: _session.id }); }
    catch (e) {
      // Fallback : update direct si la RPC n'existe pas
      try { await s.from("user_sessions").update({ last_activity: new Date().toISOString() }).eq("id", _session.id); }
      catch (e2) {}
    }
  }

  async function logEvent(type, opts = {}) {
    if (!_user) return;
    const s = supa();
    if (!s) return;
    const row = {
      id: genId("EVT"),
      user_id: _user.id,
      user_name: _user.name,
      user_email: _user.email,
      session_id: _session ? _session.id : null,
      type,
      severity: opts.severity || (type === "error" ? "error" : "info"),
      path: opts.path || location.pathname,
      message: opts.message || null,
      error_type: opts.error_type || null,
      error_stack: opts.error_stack ? String(opts.error_stack).slice(0, 4000) : null,
      error_url: opts.error_url || null,
      error_line: opts.error_line || null,
      payload: opts.payload || {},
      occurred_at: new Date().toISOString(),
    };
    try { await s.from("user_events").insert(row); }
    catch (e) { /* silent */ }
  }

  // Visibility API : page hidden = verrouillage écran / changement d'onglet
  function setupVisibilityTracking() {
    document.addEventListener("visibilitychange", async () => {
      if (!_session) return;
      const s = supa();
      if (!s) return;
      if (document.hidden) {
        _lockStart = Date.now();
        await s.from("user_sessions").update({
          is_locked: true,
          locked_at: new Date().toISOString(),
        }).eq("id", _session.id);
        await logEvent("lock", { path: location.pathname, message: "Écran verrouillé / onglet caché" });
      } else {
        const lockedFor = _lockStart ? Math.round((Date.now() - _lockStart) / 1000) : 0;
        _totalLockedSeconds += lockedFor;
        _lockStart = null;
        await s.from("user_sessions").update({
          is_locked: false,
          total_locked_s: _totalLockedSeconds,
          last_activity: new Date().toISOString(),
        }).eq("id", _session.id);
        await logEvent("unlock", { path: location.pathname, message: "Écran déverrouillé · verrouillé " + lockedFor + "s" });
      }
    });
  }

  // Inactivité : 15 min sans activité utilisateur → idle_timeout
  function setupIdleTracking() {
    const reset = () => {
      clearTimeout(_idleTimer);
      _idleTimer = setTimeout(async () => {
        await logEvent("idle_timeout", { severity: "warn", path: location.pathname, message: "Inactivité 15 min détectée" });
      }, IDLE_TIMEOUT_MS);
    };
    ["mousemove", "keydown", "scroll", "touchstart"].forEach((e) => {
      window.addEventListener(e, reset, { passive: true });
    });
    reset();
  }

  // Capture des erreurs JS
  function setupErrorTracking() {
    window.addEventListener("error", (e) => {
      logEvent("error", {
        severity: "error",
        message: (e && e.message) || "Erreur JS",
        error_type: e.error ? e.error.constructor.name : "Error",
        error_stack: e.error ? e.error.stack : null,
        error_url: e.filename,
        error_line: e.lineno,
      });
    });
    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason || {};
      logEvent("error", {
        severity: "error",
        message: "Promesse rejetée : " + (reason.message || String(reason)).slice(0, 200),
        error_type: "UnhandledPromiseRejection",
        error_stack: reason.stack || null,
      });
    });
  }

  function setupBeforeUnload() {
    window.addEventListener("beforeunload", () => {
      if (!_session) return;
      const s = supa();
      if (!s) return;
      // Best-effort : navigator.sendBeacon est plus fiable que fetch sync,
      // mais le client Supabase ne l'utilise pas → on tente un fire-and-forget
      try {
        s.from("user_sessions").update({
          ended_at: new Date().toISOString(),
          end_reason: "browser_close",
          total_locked_s: _totalLockedSeconds,
        }).eq("id", _session.id);
      } catch (e) {}
    });
  }

  async function init() {
    _user = await getCurrentUser();
    if (!_user) return;       // pas connecté → on ne tracke rien
    await startSession();
    _heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
    setupVisibilityTracking();
    setupIdleTracking();
    setupErrorTracking();
    setupBeforeUnload();
  }

  // Exposition pour debug + utilisation manuelle (logout button → manualLogout)
  window.HubActivity = {
    init,
    log: logEvent,
    endSession: () => endSession("logout"),
    getSession: () => _session,
    getUser: () => _user,
  };

  // Auto-init au chargement (mais après que supabase soit prêt)
  function tryInit() {
    if (window.HubSupabase && window.HubSupabase.enabled) init();
    else setTimeout(tryInit, 200);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit);
  } else {
    tryInit();
  }
})();
