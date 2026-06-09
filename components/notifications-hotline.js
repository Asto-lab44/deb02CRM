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
      company: "",
      email: "",
      contract: "Standard",
      lastContact: null,
      tier: "STANDARD",
      openTickets: [],
      transcript: "",
      clientId: ev.matched_client_id,
    };
    if (!s) return ctx;
    // Match phone number by last 9 digits (idem Edge Function)
    const last9 = (str) => (str || "").replace(/\D/g, "").slice(-9);
    const callerLast9 = last9(ev.caller_number);
    try {
      if (ev.matched_client_id) {
        const { data: client } = await s
          .from("clients")
          .select("id, name, city, website, data")
          .eq("id", ev.matched_client_id)
          .single();
        if (client) {
          // raison_sociale est dans le jsonb data, name est la colonne directe
          ctx.company  = (client.data && client.data.raison_sociale) || client.name || "";
          ctx.name = ctx.company || ctx.name;
        }
        // Cherche le contact précis dont le téléphone matche l'appelant.
        // 3 sources possibles : table contacts, client.data.contact_principal,
        // client.data.contacts_additionnels[].
        let matchedContact = null;
        const d = (client && client.data) || {};
        const checkContact = (c) => c && last9(c.phone) === callerLast9 && callerLast9.length === 9;
        if (checkContact(d.contact_principal)) matchedContact = d.contact_principal;
        if (!matchedContact && Array.isArray(d.contacts_additionnels)) {
          matchedContact = d.contacts_additionnels.find(checkContact) || null;
        }
        if (!matchedContact) {
          const { data: contacts } = await s
            .from("contacts")
            .select("id, prenom, nom, fonction, email, phone")
            .eq("client_id", ev.matched_client_id);
          matchedContact = (contacts || []).find(checkContact) || null;
        }
        if (matchedContact) {
          const fullName = [matchedContact.prenom, matchedContact.nom].filter(Boolean).join(" ").trim();
          if (fullName) ctx.name = fullName;
          if (matchedContact.email) ctx.email = matchedContact.email;
          if (matchedContact.fonction) ctx.role = matchedContact.fonction;
          if (matchedContact.id) ctx.contactId = matchedContact.id;
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

  // ─── Plan B : URL Launcher 3CX ────────────────────────────────────
  // 3CX peut être configuré dans Utilisateurs → Options → "Click2Talk"
  // (URL externe à lancer sur appel entrant). Quand un appel arrive,
  // le poste 3CX ouvre une URL avec ?caller=%CallerNumber%, ce qui nous
  // permet de matcher le client et d'afficher le popup CTI immédiatement.
  async function handleUrlLauncher() {
    const params = new URLSearchParams(window.location.search);
    const callerParam = params.get("caller") || params.get("CallerNumber") || params.get("number");
    if (!callerParam) return false;
    try {
      // Attend React + HotlinePopup
      let tries = 0;
      while (tries < 30) {
        if (typeof React !== "undefined" && typeof HotlinePopup !== "undefined") break;
        await new Promise((r) => setTimeout(r, 200));
        tries++;
      }
      const fakeEv = {
        id: "url-" + Date.now(),
        caller_number: callerParam,
        caller_name: params.get("name") || params.get("CallerName") || null,
        matched_client_id: null,
      };
      // Lookup client par téléphone (toutes variantes FR)
      const supa = window.HubSupabase && window.HubSupabase.client;
      if (supa) {
        const variants = [callerParam];
        if (callerParam.startsWith("+33")) variants.push("0" + callerParam.slice(3));
        else if (callerParam.startsWith("0") && callerParam.length === 10) variants.push("+33" + callerParam.slice(1));
        const { data: clients } = await supa.from("clients")
          .select("id").or(variants.map((v) => `phone.eq.${v}`).join(","))
          .limit(1);
        if (clients && clients.length > 0) fakeEv.matched_client_id = clients[0].id;
      }
      const call = await loadCallContext(fakeEv);
      ensurePopupMounted(call);
      // Nettoie l'URL pour ne pas re-déclencher au refresh
      ["caller", "CallerNumber", "number", "name", "CallerName", "dir"].forEach((k) => params.delete(k));
      const newQs = params.toString();
      const newUrl = window.location.pathname + (newQs ? "?" + newQs : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
      return true;
    } catch (e) { console.warn("[hotline] url-launcher:", e); return false; }
  }

  async function init() {
    if (window.location.pathname.indexOf("/login") === 0) return;
    if (window.location.pathname.indexOf("/bienvenue") === 0) return;

    // Plan B en premier (gérera immédiatement si ?caller= dans l'URL)
    await handleUrlLauncher();

    // Plan A : realtime call_events (si webhook actif un jour)
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
        company: "Démo", email: "", contract: "Standard",
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
