// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Store d'identité et de droits (HubAccess)
// ════════════════════════════════════════════════════════════════════
//
// SOMMAIRE
//   §1. Constants     : ALL_KEYS (modules ERP), DEFAULT_GROUPS (9 groupes seed)
//   §2. USERS         : tableau démo (sera remplacé par une lecture BDD à terme)
//   §3. Storage       : caches localStorage (groups, activeGroup, session, transcripts)
//   §4. Listeners     : système subscribe/emit pour les re-renders React
//   §5. Groups API    : loadGroups, saveGroups, getActiveGroup, setActiveGroupId
//   §6. Transcripts   : retranscriptions d'appel 3CX rattachées à un ticket
//   §7. Session       : getCurrentUser (Supabase OR localStorage demo), login, logout
//   §8. resetAll      : purge complète localStorage (utilisé par le bouton Reset)
//   §9. Export window.HubAccess
//
// ARCHITECTURE
//   - Plain JS (pas de JSX) → loadé en SYNC avant les composants React.
//   - State persisté en localStorage. Les composants React s'abonnent via
//     useSyncExternalStore(subscribe, () => HubAccess.getCurrentUser()).
//   - Cache des refs : chaque getter (getCurrentUser, getActiveGroup, loadGroups)
//     renvoie la MÊME référence tant que rien n'a changé → snapshot stable pour
//     useSyncExternalStore (cf React error #185).
//   - emit() est déclenché à chaque mutation (saveGroups, login, logout, …) et
//     invalide tous les caches.
//
// USAGE
//   const user = window.HubAccess.getCurrentUser()
//   const group = window.HubAccess.getActiveGroup()
//   window.HubAccess.subscribe(() => myComponent.forceRefresh())
// ════════════════════════════════════════════════════════════════════

(function () {
  // ───────────────────────────────────────────────────────────────────
  // §1. CONSTANTS
  // ───────────────────────────────────────────────────────────────────

  /** Les 13 modules ERP/CRM disponibles. Sert de "feature flag" par groupe :
   *  un groupe a un sous-ensemble de ces clés dans son `access` array. */
  const ALL_KEYS = [
    "crm", "intel", "marketing",
    "tech", "projects", "inventory",
    "accounting", "billing", "treasury",
    "hr", "time",
    "reports", "settings",
  ];

  const DEFAULT_GROUPS = [
    {
      id: "admin", name: "Administrateurs", color: "#dc2626",
      description: "Accès complet à l'ERP, gestion des utilisateurs et de la sécurité.",
      access: ALL_KEYS.slice(),
      members: ["Romain Daviaud", "Augustin Morin"],
    },
    {
      id: "supervision", name: "Administrateur · Supervision", color: "#7c3aed",
      description: "Cellule supervision — réception des escalades tickets, monitoring SLA et arbitrage des incidents critiques.",
      access: ALL_KEYS.slice(),
      members: ["Romain Daviaud", "Augustin Morin"],
    },
    {
      id: "direction", name: "Direction", color: "#4f46e5",
      description: "Comité exécutif — vue 360 sur tous les modules, lecture étendue.",
      access: ALL_KEYS.slice(),
      members: ["Romain Daviaud", "Augustin Morin"],
    },
    {
      id: "commercial", name: "Commercial", color: "#0ea5e9",
      description: "Équipes vente et avant-vente — pipeline, comptes, opportunités.",
      access: ["crm", "intel", "marketing", "billing", "reports"],
      members: [],
    },
    {
      id: "support", name: "Support technique", color: "#0891b2",
      description: "Hotline N1/N2 — tickets, SLA, base de connaissances.",
      access: ["tech", "projects", "crm", "reports"],
      members: [],
    },
    {
      id: "finance", name: "Finance & Compta", color: "#10b981",
      description: "Comptabilité, facturation, trésorerie et reporting financier.",
      access: ["accounting", "billing", "treasury", "reports", "hr"],
      members: [],
    },
    {
      id: "marketing", name: "Marketing", color: "#ec4899",
      description: "Campagnes, contenu, génération de leads et analytics.",
      access: ["marketing", "crm", "reports", "intel"],
      members: [],
    },
    {
      id: "rh", name: "Ressources humaines", color: "#8b5cf6",
      description: "Paie, contrats, recrutement et gestion des temps.",
      access: ["hr", "time", "reports"],
      members: [],
    },
    {
      id: "ops", name: "Opérations & Produit", color: "#a855f7",
      description: "Roadmap produit, livrables clients, gestion du stock.",
      access: ["projects", "inventory", "tech", "reports"],
      members: [],
    },
  ];

  // ───────────────────────────────────────────────────────────────────
  // §2. USERS — utilisateurs Astorya réels
  // ───────────────────────────────────────────────────────────────────
  // Sert UNIQUEMENT au fallback display name + groupes par email quand
  // Supabase Auth est utilisé (cf §7. getCurrentUser).
  // Les mots de passe sont gérés par Supabase Auth (BDD), PAS ici.
  const USERS = [
    { email: "r.daviaud@astorya.fr",  name: "Romain Daviaud",  role: "Super Admin", groups: ["admin", "supervision", "direction"] },
    { email: "achat@astorya.fr",      name: "Romain Daviaud",  role: "Super Admin", groups: ["admin", "supervision", "direction"] },
    { email: "a.morin@astorya.fr",    name: "Augustin Morin",  role: "Super Admin", groups: ["admin", "supervision", "direction"] },
  ];

  // v2 ajoute le groupe "Administrateur · Supervision".
  const GROUPS_KEY = "hubAstorya.access.groups.v2";
  const ACTIVE_KEY = "hubAstorya.access.activeGroup.v1";
  const SESSION_KEY = "hubAstorya.access.session.v1";
  const TRANSCRIPTS_KEY = "hubAstorya.hotline.transcripts.v1";
  const DEFAULT_ACTIVE = "admin";

  const listeners = new Set();
  // Caches : useSyncExternalStore exige une référence stable entre rendus tant
  // que rien n'a changé. On mémorise la chaîne brute de localStorage et on
  // ne recalcule l'objet que si elle bouge.
  let _groupsRaw = undefined, _groupsCache = null;
  let _activeId = undefined;
  let _activeGroupKey = null, _activeGroupCache = null;
  let _sessionRaw = undefined, _sessionCache = null;
  let _transcriptsRaw = undefined, _transcriptsCache = null;
  const invalidate = () => {
    _groupsRaw = _sessionRaw = _transcriptsRaw = undefined;
    _activeId = undefined;
    _activeGroupKey = null;
    _supaUserKey = null;
  };
  const emit = () => { invalidate(); listeners.forEach((fn) => { try { fn(); } catch (e) {} }); };

  function loadGroups() {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (raw === _groupsRaw) return _groupsCache;
    _groupsRaw = raw;
    try {
      if (!raw) { _groupsCache = DEFAULT_GROUPS; return _groupsCache; }
      const parsed = JSON.parse(raw);
      _groupsCache = (Array.isArray(parsed) && parsed.length > 0) ? parsed : DEFAULT_GROUPS;
    } catch (e) { _groupsCache = DEFAULT_GROUPS; }
    return _groupsCache;
  }
  function saveGroups(groups) {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); } catch (e) {}
    emit();
  }
  function getActiveGroupId() {
    if (_activeId === undefined) _activeId = localStorage.getItem(ACTIVE_KEY) || DEFAULT_ACTIVE;
    return _activeId;
  }
  function setActiveGroupId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
    emit();
  }
  function getActiveGroup() {
    const groups = loadGroups();
    const id = getActiveGroupId();
    const key = (_groupsRaw || "") + "|" + id;
    if (key !== _activeGroupKey) {
      _activeGroupKey = key;
      _activeGroupCache = groups.find((g) => g.id === id) || groups[0];
    }
    return _activeGroupCache;
  }
  function getAllowedKeys() {
    return new Set(getActiveGroup().access);
  }
  function subscribe(fn) {
    listeners.add(fn);
    const onStorage = (e) => {
      if (e.key === GROUPS_KEY || e.key === ACTIVE_KEY || e.key === SESSION_KEY || e.key === TRANSCRIPTS_KEY) fn();
    };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
  }

  // ───── Retranscriptions d'appel 3CX rattachées à un ticket
  function loadTranscripts() {
    const raw = localStorage.getItem(TRANSCRIPTS_KEY);
    if (raw === _transcriptsRaw) return _transcriptsCache;
    _transcriptsRaw = raw;
    try {
      _transcriptsCache = raw ? JSON.parse(raw) : {};
      if (!_transcriptsCache || typeof _transcriptsCache !== "object") _transcriptsCache = {};
    } catch (e) { _transcriptsCache = {}; }
    return _transcriptsCache;
  }
  const EMPTY = [];
  function getTranscriptsForTicket(ticketId) {
    const all = loadTranscripts();
    return all[ticketId] || EMPTY;
  }
  function addTranscript(ticketId, entry) {
    const all = { ...loadTranscripts() };
    all[ticketId] = [...(all[ticketId] || []), entry];
    try { localStorage.setItem(TRANSCRIPTS_KEY, JSON.stringify(all)); } catch (e) {}
    emit();
  }
  function clearTranscripts() {
    try { localStorage.removeItem(TRANSCRIPTS_KEY); } catch (e) {}
    emit();
  }

  // ───── Session
  // Si Supabase est configuré → vraie auth (magic link). Sinon → login factice.
  const supa = (typeof window !== "undefined" && window.HubSupabase && window.HubSupabase.enabled) ? window.HubSupabase.client : null;

  // Cache de la session Supabase (rafraîchi via onAuthStateChange)
  let _supaSession = null;
  let _supaUserCache = null;
  let _supaUserKey = null;
  if (supa) {
    supa.auth.getSession().then(({ data }) => { _supaSession = data.session; _supaUserKey = null; emit(); });
    supa.auth.onAuthStateChange((_event, session) => { _supaSession = session; _supaUserKey = null; emit(); });
  }

  function getCurrentUser() {
    if (supa) {
      // Mode auth Supabase — null si pas connecté (la page redirige vers /login)
      if (!_supaSession || !_supaSession.user) return null;
      const u = _supaSession.user;
      const key = u.id + "::" + (u.email || "");
      if (key === _supaUserKey && _supaUserCache) return _supaUserCache;
      const meta = u.user_metadata || {};
      const fallback = USERS.find((x) => x.email.toLowerCase() === (u.email || "").toLowerCase());
      const groups = meta.groups || (fallback ? fallback.groups : ["admin"]);
      const name = meta.name || (fallback ? fallback.name : (u.email || "Utilisateur"));
      const role = meta.role || (fallback ? fallback.role : "—");
      _supaUserKey = key;
      _supaUserCache = { email: u.email, name, role, groups };
      return _supaUserCache;
    }
    // Mode démo (pas de Supabase) — utilisateur depuis localStorage
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === _sessionRaw) return _sessionCache;
    _sessionRaw = raw;
    try {
      if (!raw) { _sessionCache = null; return null; }
      const session = JSON.parse(raw);
      const user = USERS.find((u) => u.email === session.email);
      _sessionCache = user ? { email: user.email, name: user.name, role: user.role, groups: user.groups } : null;
    } catch (e) { _sessionCache = null; }
    return _sessionCache;
  }

  // Démo uniquement — login email/password factice
  function login(email, password) {
    if (supa) {
      // En mode auth réelle, le login passe par sendMagicLink (pas de password)
      return { ok: false, error: "Auth réelle activée — utilisez le lien magique par email." };
    }
    const user = USERS.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: "Email ou mot de passe incorrect." };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, at: Date.now() }));
      if (user.groups[0]) localStorage.setItem(ACTIVE_KEY, user.groups[0]);
    } catch (e) {}
    emit();
    return { ok: true, user: { email: user.email, name: user.name, role: user.role, groups: user.groups } };
  }

  // Auth réelle — envoie un magic link à l'email indiqué
  async function sendMagicLink(email) {
    if (!supa) return { ok: false, error: "Supabase non configuré — éditez components/supabase-config.js." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email invalide." };
    const { error } = await supa.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function logout() {
    if (supa) {
      await supa.auth.signOut();
    } else {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    }
    emit();
  }

  function listUsers() {
    // Renvoie une copie sans les mots de passe (pour l'UI quick-login)
    return USERS.map(({ password, ...u }) => u);
  }

  function authMode() { return supa ? "supabase" : "demo"; }

  function resetAll() {
    try {
      localStorage.removeItem(GROUPS_KEY);
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TRANSCRIPTS_KEY);
    } catch (e) {}
    emit();
  }

  window.HubAccess = {
    ALL_KEYS: ALL_KEYS.slice(),
    DEFAULT_GROUPS,
    loadGroups,
    saveGroups,
    getActiveGroupId,
    setActiveGroupId,
    getActiveGroup,
    getAllowedKeys,
    getCurrentUser,
    login,
    sendMagicLink,
    logout,
    listUsers,
    authMode,
    loadTranscripts,
    getTranscriptsForTicket,
    addTranscript,
    clearTranscripts,
    subscribe,
    resetAll,
  };
})();
