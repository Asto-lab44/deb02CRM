// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Bridge realtime call_events → HotlinePopup
// ════════════════════════════════════════════════════════════════════
//
// S'abonne à la table public.call_events. Quand un INSERT arrive avec
// agent_user_id == utilisateur courant ET status == "ringing", déclenche
// un événement window "hub:incoming-call" avec les données de l'appel
// enrichies (client matché, tickets ouverts, etc.).
//
// Le HotlinePopup (déjà présent dans certaines pages) écoute cet event
// et s'affiche. Sur les pages qui ne montent pas HotlinePopup, on injecte
// un mount global via React.createRoot dans un container dédié.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  let popupRoot = null;
  let popupContainer = null;

  // ───── Helpers ────────────────────────────────────────────────────
  async function loadCallContext(ev) {
    // Charge le client + tickets ouverts pour enrichir le popup
    const s = window.HubSupabase && window.HubSupabase.client;
    const ctx = {
      id: ev.id,
      name: ev.caller_name || "Appelant inconnu",
      phone: ev.caller_number,
      org: "",
      email: "",
      contract: "Standard",
      lastContact: null,
      tier: "STANDARD",
      openTickets: [],
      transcript: "",
      clientId: ev.matched_client_id,
    };
    if (!s) return ctx;
    try {
      if (ev.matched_client_id) {
        const { data: client } = await s
          .from("clients")
          .select("id, raison_sociale, name, email, ville, city")
          .eq("id", ev.matched_client_id)
          .single();
        if (client) {
          ctx.name = ev.caller_name || client.raison_sociale || client.name || ctx.name;
          ctx.org  = client.raison_sociale || client.name || "";
          ctx.email = client.email || "";
        }
        // Tickets ouverts pour ce client
        const { data: tickets } = await s
          .from("tickets")
          .select("id, title, status, priority, category, opened_at")
          .eq("client_id", ev.matched_client_id)
          .in("status", ["open", "in_progress", "waiting"])
          .order("opened_at", { ascending: false })
          .limit(5);
        if (tickets) ctx.openTickets = tickets.map((t) => ({
          id: t.id, title: t.title, status: t.status,
          prio: t.priority, cat: t.category, when: t.opened_at,
        }));
      }
    } catch (e) { console.warn("[hotline] loadCallContext:", e); }
    return ctx;
  }

  // ───── Mount React popup global ───────────────────────────────────
  function ensurePopupMounted(call) {
    if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
      console.warn("[hotline] React not loaded — cannot show popup");
      return;
    }
    if (typeof HotlinePopup === "undefined") {
      // HotlinePopup pas chargé sur cette page : on émet juste un toast + dispatch event
      window.dispatchEvent(new CustomEvent("hub:incoming-call", { detail: call }));
      if (window.HubToast) {
        window.HubToast.info(`📞 Appel entrant : ${call.name} (${call.phone})`);
      }
      return;
    }
    if (!popupContainer) {
      popupContainer = document.createElement("div");
      popupContainer.id = "hub-hotline-popup-root";
      document.body.appendChild(popupContainer);
      popupRoot = ReactDOM.createRoot(popupContainer);
    }
    popupRoot.render(React.createElement(HotlinePopup, {
      call,
      onClose: () => { popupRoot.render(null); },
      onCreateTicket: (t) => {
        if (window.HubToast) window.HubToast.success("✓ Ticket créé : " + (t.subject || t.id));
        popupRoot.render(null);
      },
    }));
  }

  // ───── Realtime subscribe ─────────────────────────────────────────
  function startRealtime(userId) {
    if (!window.HubSupabase || !window.HubSupabase.enabled || !userId) return;
    const supa = window.HubSupabase.client;
    const channelName = "hotline-bridge-" + userId.slice(0, 8);
    supa.channel(channelName)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "call_events",
        filter: "agent_user_id=eq." + userId,
      }, async (payload) => {
        const ev = payload.new;
        if (!ev || ev.status !== "ringing") return;
        const call = await loadCallContext(ev);
        ensurePopupMounted(call);
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
        if (user) { startRealtime(user.id); return; }
      }
      await new Promise((r) => setTimeout(r, 200));
      tries++;
    }
  }

  // Expose pour debug : window.HubHotline.simulate(...)
  window.HubHotline = {
    async simulate(phone, name) {
      const call = {
        id: "sim-" + Date.now(),
        name: name || "Test entrant",
        phone: phone || "+33 6 12 34 56 78",
        org: "Démo", email: "", contract: "Standard",
        tier: "STANDARD", openTickets: [], transcript: "",
      };
      ensurePopupMounted(call);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
