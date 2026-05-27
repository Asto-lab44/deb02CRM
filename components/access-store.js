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

  const GROUPS_KEY = "hubAstorya.access.groups.v1";
  const ACTIVE_KEY = "hubAstorya.access.activeGroup.v1";
  const DEFAULT_ACTIVE = "admin";

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  function loadGroups() {
    try {
      const raw = localStorage.getItem(GROUPS_KEY);
      if (!raw) return DEFAULT_GROUPS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_GROUPS;
      return parsed;
    } catch (e) { return DEFAULT_GROUPS; }
  }
  function saveGroups(groups) {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); } catch (e) {}
    emit();
  }
  function getActiveGroupId() {
    return localStorage.getItem(ACTIVE_KEY) || DEFAULT_ACTIVE;
  }
  function setActiveGroupId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
    emit();
  }
  function getActiveGroup() {
    const groups = loadGroups();
    return groups.find((g) => g.id === getActiveGroupId()) || groups[0];
  }
  function getAllowedKeys() {
    return new Set(getActiveGroup().access);
  }
  function subscribe(fn) {
    listeners.add(fn);
    // also react to changes from other tabs
    const onStorage = (e) => { if (e.key === GROUPS_KEY || e.key === ACTIVE_KEY) fn(); };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
  }
  function resetAll() {
    try {
      localStorage.removeItem(GROUPS_KEY);
      localStorage.removeItem(ACTIVE_KEY);
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
    subscribe,
    resetAll,
  };
})();
