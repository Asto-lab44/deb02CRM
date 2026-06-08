// Shared access/identity store for the Hub Astorya design canvas.
// Plain JS (no JSX) so it loads synchronously before the Babel-transformed
// component scripts. State is persisted in localStorage; subscribers are
// notified whenever groups or the active identity change so React views can
// re-render via useSyncExternalStore.

(function () {
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
      members: ["Nadia Lefèvre", "Hugo Bertrand"],
    },
    {
      id: "supervision", name: "Administrateur · Supervision", color: "#7c3aed",
      description: "Cellule supervision — réception des escalades tickets, monitoring SLA et arbitrage des incidents critiques.",
      access: ALL_KEYS.slice(),
      members: ["Hugo Bertrand", "Léa Marchand", "Tom Verdier"],
    },
    {
      id: "direction", name: "Direction", color: "#4f46e5",
      description: "Comité exécutif — vue 360 sur tous les modules, lecture étendue.",
      access: ALL_KEYS.slice(),
      members: ["Catherine Marchand", "Olivier Vasseur", "Sophie Aubry"],
    },
    {
      id: "commercial", name: "Commercial", color: "#0ea5e9",
      description: "Équipes vente et avant-vente — pipeline, comptes, opportunités.",
      access: ["crm", "intel", "marketing", "billing", "reports"],
      members: ["Karim Ben Salah", "Tom Verdier", "Émilie Garnier", "Antoine Mercier", "Julien Pasquier", "Marie Lopez", "Pierre Dubois", "Romain Faure"],
    },
    {
      id: "support", name: "Support technique", color: "#0891b2",
      description: "Hotline N1/N2 — tickets, SLA, base de connaissances.",
      access: ["tech", "projects", "crm", "reports"],
      members: ["Léo Tanaka", "Diane Roussel", "Farid Belkacem", "Romain Faure"],
    },
    {
      id: "finance", name: "Finance & Compta", color: "#10b981",
      description: "Comptabilité, facturation, trésorerie et reporting financier.",
      access: ["accounting", "billing", "treasury", "reports", "hr"],
      members: ["Valérie Chen", "Pierre Dubois", "Hugo Bertrand"],
    },
    {
      id: "marketing", name: "Marketing", color: "#ec4899",
      description: "Campagnes, contenu, génération de leads et analytics.",
      access: ["marketing", "crm", "reports", "intel"],
      members: ["Émilie Garnier", "Marie Lopez"],
    },
    {
      id: "rh", name: "Ressources humaines", color: "#8b5cf6",
      description: "Paie, contrats, recrutement et gestion des temps.",
      access: ["hr", "time", "reports"],
      members: ["Sophie Aubry", "Valérie Chen"],
    },
    {
      id: "ops", name: "Opérations & Produit", color: "#a855f7",
      description: "Roadmap produit, livrables clients, gestion du stock.",
      access: ["projects", "inventory", "tech", "reports"],
      members: ["Olivier Vasseur", "Léo Tanaka", "Diane Roussel"],
    },
  ];

  // Comptes de démonstration — mot de passe en clair, JAMAIS utiliser en prod.
  // Le login factice ne sert qu'à pré-positionner l'identité active.
  const USERS = [
    // Comptes réels Astorya (super admin, accès complet)
    { email: "r.daviaud@astorya.fr",   password: "demo", name: "Romain Daviaud",    role: "Super Admin",            groups: ["admin", "supervision", "direction"] },
    { email: "achat@astorya.fr",       password: "demo", name: "Romain Daviaud",    role: "Super Admin",            groups: ["admin", "supervision", "direction"] },
    { email: "a.morin@astorya.fr",     password: "demo", name: "Augustin Morin",    role: "Super Admin",            groups: ["admin", "supervision", "direction"] },
    { email: "n.lefevre@astorya.fr",   password: "demo", name: "Nadia Lefèvre",      role: "Directrice technique",   groups: ["admin", "direction"] },
    { email: "h.bertrand@astorya.fr",  password: "demo", name: "Hugo Bertrand",      role: "IT Manager",             groups: ["admin", "finance"] },
    { email: "c.marchand@astorya.fr",  password: "demo", name: "Catherine Marchand", role: "CEO",                    groups: ["direction"] },
    { email: "o.vasseur@astorya.fr",   password: "demo", name: "Olivier Vasseur",    role: "COO",                    groups: ["direction", "ops"] },
    { email: "k.bensalah@astorya.fr",  password: "demo", name: "Karim Ben Salah",    role: "AE Senior Cyber",        groups: ["commercial"] },
    { email: "s.aubry@astorya.fr",     password: "demo", name: "Sophie Aubry",       role: "AE & DRH",               groups: ["direction", "rh"] },
    { email: "t.verdier@astorya.fr",   password: "demo", name: "Tom Verdier",        role: "AE Hub",                 groups: ["commercial"] },
    { email: "e.garnier@astorya.fr",   password: "demo", name: "Émilie Garnier",     role: "AE BENELUX",             groups: ["commercial", "marketing"] },
    { email: "a.mercier@astorya.fr",   password: "demo", name: "Antoine Mercier",    role: "AE DACH",                groups: ["commercial"] },
    { email: "j.pasquier@astorya.fr",  password: "demo", name: "Julien Pasquier",    role: "AE Suite",               groups: ["commercial"] },
    { email: "m.lopez@astorya.fr",     password: "demo", name: "Marie Lopez",        role: "AE UK & Marketing Ops",  groups: ["commercial", "marketing"] },
    { email: "p.dubois@astorya.fr",    password: "demo", name: "Pierre Dubois",      role: "Comptable senior",       groups: ["finance"] },
    { email: "r.faure@astorya.fr",     password: "demo", name: "Romain Faure",       role: "AE Junior · Support",    groups: ["commercial", "support"] },
    { email: "l.tanaka@astorya.fr",    password: "demo", name: "Léo Tanaka",         role: "Tech Lead Support",      groups: ["support", "ops"] },
    { email: "d.roussel@astorya.fr",   password: "demo", name: "Diane Roussel",      role: "Ingénieure support N2",  groups: ["support", "ops"] },
    { email: "f.belkacem@astorya.fr",  password: "demo", name: "Farid Belkacem",     role: "Technicien N1",          groups: ["support"] },
    { email: "v.chen@astorya.fr",      password: "demo", name: "Valérie Chen",       role: "DAF",                    groups: ["finance", "rh"] },
    { email: "l.marchand@astorya.fr",  password: "demo", name: "Léa Marchand",       role: "Superviseure Support N2", groups: ["supervision", "support"] },
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
