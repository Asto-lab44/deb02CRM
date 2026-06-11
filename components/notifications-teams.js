// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Bridge notifications → Microsoft Teams webhook
// ════════════════════════════════════════════════════════════════════
//
// S'abonne aux INSERT sur table notifications via Supabase realtime
// et POSTe vers le webhook Teams configuré dans /administration-utilisateurs
// → Intégrations API → Microsoft Teams.
//
// URL webhook stockée dans localStorage clé : hubAstorya.teams.webhookUrl
//
// Si pas d'URL → ne fait rien (gracieux).
//
// Format MessageCard standard Teams :
//   https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const STORAGE_KEY = "hubAstorya.teams.webhookUrl";
  const SEEN_NOTIF_KEY = "hubAstorya.teams.lastNotifId.v1";

  function getWebhook() {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; }
  }

  function severityColor(s) {
    return { info: "0078D7", success: "00B294", warn: "FFB900", error: "E81123" }[s] || "0078D7";
  }
  function severityEmoji(s) {
    return { info: "ℹ", success: "✅", warn: "⚠", error: "🚨" }[s] || "ℹ";
  }

  async function postToTeams(notif) {
    const url = getWebhook();
    if (!url) return;
    // Construit le MessageCard Teams
    const card = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "themeColor": severityColor(notif.severity),
      "summary": notif.title || "Notification Hub Astorya",
      "title": severityEmoji(notif.severity) + " " + (notif.title || "Notification"),
      "text": notif.body || "",
      "sections": notif.payload && Object.keys(notif.payload).length > 0 ? [{
        "facts": Object.keys(notif.payload).slice(0, 8).map((k) => ({
          "name": k, "value": String(notif.payload[k] || "—")
        }))
      }] : undefined,
      "potentialAction": notif.link ? [{
        "@type": "OpenUri",
        "name": "Ouvrir dans Hub Astorya",
        "targets": [{ "os": "default", "uri": (window.location.origin + notif.link) }]
      }] : undefined,
    };
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });
    } catch (e) {
      console.warn("[teams] post error:", e);
    }
  }

  function startRealtime() {
    if (!window.HubSupabase || !window.HubSupabase.enabled) return;
    if (!getWebhook()) return; // skip si pas configuré
    const supa = window.HubSupabase.client;
    let lastSeen = "";
    try { lastSeen = localStorage.getItem(SEEN_NOTIF_KEY) || ""; } catch (e) {}
    supa.channel("teams-bridge-" + Math.random().toString(36).slice(2, 8))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, async (payload) => {
        const n = payload.new;
        if (!n || n.id === lastSeen) return;
        lastSeen = n.id;
        try { localStorage.setItem(SEEN_NOTIF_KEY, n.id); } catch (e) {}
        await postToTeams(n);
      })
      .subscribe();
  }

  async function init() {
    if (window.location.pathname.indexOf("/login") === 0) return;
    if (window.location.pathname.indexOf("/bienvenue") === 0) return;
    let tries = 0;
    while (tries < 30) {
      if (window.HubSupabase && window.HubSupabase.enabled && window.api && window.api.auth) {
        const user = await window.api.auth.getUser();
        if (user) { startRealtime(); return; }
      }
      await new Promise((r) => setTimeout(r, 200));
      tries++;
    }
  }

  // Expose pour debug / test depuis l'admin
  window.HubTeams = {
    getWebhook,
    setWebhook(url) {
      try {
        if (url && url.trim()) localStorage.setItem(STORAGE_KEY, url.trim());
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    },
    async test() {
      const url = getWebhook();
      if (!url) throw new Error("Aucun webhook Teams configuré");
      const sample = {
        title: "Test depuis Hub Astorya",
        body: "Si tu vois ce message dans Teams, l'intégration fonctionne 🎉",
        severity: "success",
        link: "/",
        payload: { test: true, sent_at: new Date().toISOString() },
      };
      await postToTeams(sample);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
