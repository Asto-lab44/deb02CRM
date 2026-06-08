// ════════════════════════════════════════════════════════════════════
// ERPHome — Page d'accueil de l'ERP (route : /)
// ════════════════════════════════════════════════════════════════════
//
// Affiche :
//  - Sidebar avec navigation, user actif, switcher de groupe
//  - Topbar avec recherche globale (clients + opportunités)
//  - Hero "Bonjour {prénom}" + KPI live (clients, opps, signées)
//  - Grille de tuiles ERP filtrée par les droits du groupe actif
//  - Panel "Mes actions à mener" depuis api.actions
//
// État principal :
//  - activeGroup, allGroups, localUser : lus depuis HubAccess au mount
//  - supaUser : email Supabase fetched async (api.auth.getUser)
//  - crmStats : compteurs en live (api.clients.list + api.opportunities.list)
//  - actionsTodo : actions status="todo" (api.actions.list)
//  - searchQ + searchData : barre de recherche globale
//
// Le filtre `allowedKeys` = Set des modules autorisés pour le groupe actif.
// Les tuiles dont la clé n'est pas dans allowedKeys sont masquées.
// ════════════════════════════════════════════════════════════════════

var ERPHome = () => {
  // Lecture une seule fois au mount. La session Supabase est récupérée dans
  // un useEffect séparé avec un setTimeout pour laisser le temps à
  // _supaSession d'être peuplée. Pas de subscribe → pas de risque de boucle.
  var HA = typeof window !== "undefined" && window.HubAccess ? window.HubAccess : null;
  var defaultGroup = {
    id: "admin",
    name: "Administrateurs",
    color: "#dc2626",
    access: ["crm", "intel", "marketing", "tech", "projects", "inventory", "accounting", "billing", "treasury", "hr", "time", "reports", "settings"]
  };
  var [activeGroup, setActiveGroup] = React.useState(() => HA && HA.getActiveGroup && HA.getActiveGroup() || defaultGroup);
  var [allGroups, setAllGroups] = React.useState(() => HA && HA.loadGroups && HA.loadGroups() || []);
  var [localUser, setLocalUser] = React.useState(() => HA && HA.getCurrentUser ? HA.getCurrentUser() : null);
  React.useEffect(() => {
    if (!HA) return;
    // Laisser 200ms pour que _supaSession soit peuplé après getSession()
    var t = setTimeout(() => {
      var ag = HA.getActiveGroup && HA.getActiveGroup();
      var lg = HA.loadGroups && HA.loadGroups();
      var lu = HA.getCurrentUser && HA.getCurrentUser();
      if (ag) setActiveGroup(ag);
      if (lg) setAllGroups(lg);
      if (lu) setLocalUser(lu);
    }, 200);
    return () => clearTimeout(t);
  }, []);
  var allowedKeys = React.useMemo(() => new Set(activeGroup.access || []), [activeGroup]);
  // Identité Supabase réelle si dispo, sinon fallback access-store
  var [supaUser, setSupaUser] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.auth) return;
    window.api.auth.getUser().then(u => {
      if (u) setSupaUser(u);
    }).catch(() => {});
  }, []);
  var currentUser = supaUser ? {
    name: supaUser.email,
    role: "Astorya"
  } : localUser;
  var [loginOpen, setLoginOpen] = React.useState(false);
  var Avatar = ({
    name,
    size = 22,
    color
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      C: "#a855f7",
      N: "#a855f7",
      K: "#6366f1"
    };
    var bg = color || palette[initials[0]] || "#64748b";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0
      }
    }, initials);
  };

  // ───── modules organisés par catégorie
  // Stats live CRM (depuis Supabase) injectées dans la tuile CRM
  var [crmStats, setCrmStats] = React.useState({
    clients: 0,
    opps: 0,
    won: 0
  });
  var [actionsTodo, setActionsTodo] = React.useState([]);
  var [searchQ, setSearchQ] = React.useState("");
  var [searchData, setSearchData] = React.useState({
    clients: [],
    opps: []
  });
  React.useEffect(() => {
    if (!window.api) return;
    Promise.all([window.api.clients.list(), window.api.opportunities.list()]).then(([cl, op]) => setSearchData({
      clients: cl || [],
      opps: op || []
    })).catch(() => {});
  }, []);
  var searchResults = React.useMemo(() => {
    var q = searchQ.trim().toLowerCase();
    if (q.length < 2) return [];
    var results = [];
    searchData.clients.forEach(c => {
      var name = c.raison_sociale || c.name || "";
      if (name.toLowerCase().includes(q) || (c.siren || "").includes(q)) {
        results.push({
          kind: "client",
          id: c.id,
          label: name,
          sub: (c.status === "client" ? "Client" : "Prospect") + " · " + (c.ville || c.city || "—"),
          href: "/fiche-client?id=" + encodeURIComponent(c.id)
        });
      }
    });
    searchData.opps.forEach(o => {
      var name = o.name || "";
      if (name.toLowerCase().includes(q) || (o.id || "").toLowerCase().includes(q)) {
        results.push({
          kind: "opp",
          id: o.id,
          label: name,
          sub: "Opportunité · " + (o.stage || "—"),
          href: "/avancer-opportunite?opp=" + encodeURIComponent(o.id)
        });
      }
    });
    return results.slice(0, 10);
  }, [searchQ, searchData]);
  // Stats + actions todo. Re-fetch automatique sur changement BDD (realtime
  // multi-onglets) via HubData.subscribeChanges.
  React.useEffect(() => {
    if (!window.api) return;
    var reload = () => {
      Promise.all([window.api.clients.list(), window.api.opportunities.list(), window.api.actions.list({
        status: "todo"
      })]).then(([clients, opps, todos]) => {
        var won = (opps || []).filter(o => o.stage === "won").length;
        setCrmStats({
          clients: (clients || []).length,
          opps: (opps || []).length,
          won
        });
        setActionsTodo(todos || []);
      }).catch(() => {});
    };
    reload();
    if (window.HubData && window.HubData.subscribeChanges) {
      return window.HubData.subscribeChanges(reload);
    }
  }, []);
  var modules = [
  // COMMERCIAL
  {
    cat: "Commercial",
    key: "crm",
    title: "CRM",
    subtitle: "Pipeline, comptes, opportunités",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v18h18"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7 17l4-4 4 4 5-7"
    })),
    color: "#4f46e5",
    bg: "#eef2ff",
    stats: [{
      k: "Comptes",
      v: String(crmStats.clients)
    }, {
      k: "Opportunités",
      v: String(crmStats.opps)
    }, {
      k: "Signées",
      v: String(crmStats.won)
    }],
    trendUp: true
  }, {
    cat: "Commercial",
    key: "intel",
    title: "Intelligence concurrentielle",
    subtitle: "Radar fin contrats · battle cards",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"
    })),
    color: "#dc2626",
    bg: "#fdecec",
    stats: []
  }, {
    cat: "Commercial",
    key: "marketing",
    title: "Marketing & Campagnes",
    subtitle: "Emailing, leads, conversion",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 8l9 6 9-6"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "5",
      width: "18",
      height: "14",
      rx: "2"
    })),
    color: "#ec4899",
    bg: "#fdf2f8",
    stats: [{
      k: "Campagnes",
      v: "12"
    }, {
      k: "Leads",
      v: "284"
    }, {
      k: "CTR",
      v: "4,2 %"
    }]
  },
  // PRODUCTION / TECHNIQUE
  {
    cat: "Production",
    key: "tech",
    title: "Support technique",
    subtitle: "Tickets, SLA, file d'attente",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M14.7 6.3a4 4 0 015 5L12 19l-4 1 1-4 6.7-9.7z"
    })),
    color: "#0ea5e9",
    bg: "#e0f4fc",
    stats: [{
      k: "Tickets ouverts",
      v: "47"
    }, {
      k: "SLA respect",
      v: "94 %"
    }, {
      k: "MTTR",
      v: "6h12"
    }],
    badge: {
      label: "2 critiques",
      tone: "danger"
    }
  }, {
    cat: "Production",
    key: "projects",
    title: "Projets & Livrables",
    subtitle: "Roadmap, jalons, ressources",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "16",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 9h18M9 4v16"
    })),
    color: "#a855f7",
    bg: "#f5efff",
    stats: [{
      k: "Projets actifs",
      v: "18"
    }, {
      k: "Jalons 30 j",
      v: "7"
    }, {
      k: "En retard",
      v: "2"
    }]
  }, {
    cat: "Production",
    key: "inventory",
    title: "Stock & Catalogue",
    subtitle: "Articles, achats, mouvements",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M21 8l-9 4-9-4 9-4 9 4z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 8v8l9 4 9-4V8M3 12l9 4 9-4"
    })),
    color: "#0891b2",
    bg: "#cffafe",
    stats: [{
      k: "Références",
      v: "1 412"
    }, {
      k: "Rupture",
      v: "8"
    }, {
      k: "Valeur",
      v: "428 k€"
    }]
  },
  // FINANCE
  {
    cat: "Finance",
    key: "accounting",
    title: "Comptabilité",
    subtitle: "Écritures, journaux, clôtures",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"
    })),
    color: "#10b981",
    bg: "#e8f8f1",
    stats: [{
      k: "CA mois",
      v: "284 k€"
    }, {
      k: "Marge",
      v: "32 %"
    }, {
      k: "Clôture",
      v: "J-3"
    }],
    trendUp: true
  }, {
    cat: "Finance",
    key: "billing",
    title: "Facturation & Devis",
    subtitle: "Factures, devis, relances",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 2v6h6M9 13h6M9 17h6M9 9h2"
    })),
    color: "#f59e0b",
    bg: "#fef0e6",
    stats: [{
      k: "Factures mois",
      v: "127"
    }, {
      k: "Devis envoyés",
      v: "42"
    }, {
      k: "Impayés",
      v: "18,4 k€"
    }],
    badge: {
      label: "3 relances",
      tone: "warn"
    }
  }, {
    cat: "Finance",
    key: "treasury",
    title: "Trésorerie",
    subtitle: "Cash flow, banques, échéances",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "6",
      width: "18",
      height: "14",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 10h18M7 15h4"
    })),
    color: "#0e7a55",
    bg: "#d1fae5",
    stats: [{
      k: "Trésorerie",
      v: "1,24 M€"
    }, {
      k: "Échéances 30 j",
      v: "62 k€"
    }, {
      k: "Runway",
      v: "14 mois"
    }]
  },
  // RH
  {
    cat: "Ressources humaines",
    key: "hr",
    title: "RH & Paie",
    subtitle: "Salariés, contrats, paie",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "7",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"
    })),
    color: "#8b5cf6",
    bg: "#f3e8ff",
    stats: [{
      k: "Effectif",
      v: "127"
    }, {
      k: "Absents",
      v: "8"
    }, {
      k: "Recrutements",
      v: "5"
    }]
  }, {
    cat: "Ressources humaines",
    key: "time",
    title: "Temps & Activités",
    subtitle: "Pointage, CRA, congés",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 6v6l4 2"
    })),
    color: "#14b8a6",
    bg: "#ccfbf1",
    stats: [{
      k: "CRA à valider",
      v: "23"
    }, {
      k: "Heures sem.",
      v: "4 412 h"
    }, {
      k: "Demandes",
      v: "11"
    }],
    badge: {
      label: "À valider",
      tone: "warn"
    }
  },
  // ADMIN / ANALYTICS
  {
    cat: "Pilotage",
    key: "reports",
    title: "Rapports & BI",
    subtitle: "Tableaux de bord, exports",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v18h18M7 14l4-4 4 4 5-5"
    })),
    color: "#3730a3",
    bg: "#e0e7ff",
    stats: [{
      k: "Dashboards",
      v: "12"
    }, {
      k: "Partagés",
      v: "47"
    }, {
      k: "Sources",
      v: "8"
    }]
  }, {
    cat: "Pilotage",
    key: "settings",
    title: "Administration",
    subtitle: "Utilisateurs, rôles, sécurité",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
    })),
    color: "#64748b",
    bg: "#f1f3f6",
    stats: [{
      k: "Utilisateurs",
      v: "184"
    }, {
      k: "Actifs 7 j",
      v: "147"
    }, {
      k: "Intégrations",
      v: "23"
    }]
  }];
  var visibleModules = modules.filter(m => allowedKeys.has(m.key));
  var categories = [...new Set(visibleModules.map(m => m.cat))];
  var badgeTones = {
    new: {
      bg: "#4f46e5",
      color: "#fff"
    },
    danger: {
      bg: "#fdecec",
      color: "#dc2626",
      border: "#fecaca"
    },
    warn: {
      bg: "#fff6e6",
      color: "#a65f00",
      border: "#fde68a"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: erpStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: erpStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...erpStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "ERP unifi\xE9"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...erpStyles.search,
      paddingLeft: 32
    },
    placeholder: "Rechercher client, opp, ticket\u2026",
    value: searchQ,
    onChange: e => setSearchQ(e.target.value)
  }), searchQ.trim().length >= 2 && searchResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      zIndex: 100,
      maxHeight: 320,
      overflowY: "auto"
    }
  }, searchResults.map(r => /*#__PURE__*/React.createElement("a", {
    key: r.kind + "-" + r.id,
    href: r.href,
    style: {
      display: "block",
      padding: "8px 12px",
      textDecoration: "none",
      color: "#0f172a",
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, r.sub)))), searchQ.trim().length >= 2 && searchResults.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: "10px 12px",
      fontSize: 12,
      color: "#94a3b8",
      boxShadow: "0 8px 24px rgba(15,23,42,0.12)"
    }
  }, "Aucun r\xE9sultat")), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.navLabel
  }, "Navigation"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...erpStyles.navItem,
      ...erpStyles.navItemActive
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: erpStyles.bullet
  }, "\u2302"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Accueil"))), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.navLabel
  }, "Modules"), visibleModules.map(m => {
    var href = window.HubNav && window.HubNav.ROUTES[m.key];
    var item = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        color: m.color,
        display: "flex",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: m.color,
        display: "inline-block"
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, m.title));
    return href ? /*#__PURE__*/React.createElement("a", {
      key: m.key,
      href: href,
      style: {
        ...erpStyles.navItem,
        textDecoration: "none",
        color: "inherit"
      }
    }, item) : /*#__PURE__*/React.createElement("div", {
      key: m.key,
      style: {
        ...erpStyles.navItem,
        opacity: 0.5,
        cursor: "not-allowed"
      },
      title: "Module \xE0 venir"
    }, item);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      borderRadius: 8,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Groupe actif"), /*#__PURE__*/React.createElement("a", {
    href: "administration-utilisateurs.html",
    style: {
      fontSize: 10.5,
      color: "#3730a3",
      fontWeight: 600,
      textDecoration: "none"
    }
  }, "Admin \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: activeGroup.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, activeGroup.name)), /*#__PURE__*/React.createElement("select", {
    value: activeGroup.id,
    onChange: e => window.HubAccess.setActiveGroupId(e.target.value),
    style: {
      width: "100%",
      padding: "5px 8px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 11.5,
      color: "#475569",
      background: "#fff",
      cursor: "pointer"
    }
  }, allGroups.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.name, " (", g.access.length, "/", window.HubAccess.ALL_KEYS.length, ")"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 11,
      color: "#64748b"
    }
  }, allowedKeys.size, " tuile", allowedKeys.size > 1 ? "s" : "", " sur ", window.HubAccess.ALL_KEYS.length, " visible", allowedKeys.size > 1 ? "s" : "")), currentUser ? /*#__PURE__*/React.createElement("div", {
    style: erpStyles.userRow
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: currentUser.name,
    size: 26
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, currentUser.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, currentUser.role)), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
      if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
      if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout();
      window.location.href = "/login";
    },
    title: "Se d\xE9connecter",
    style: {
      background: "transparent",
      border: 0,
      color: "#94a3b8",
      fontSize: 14,
      cursor: "pointer",
      padding: 4
    }
  }, "\u23FB")) : /*#__PURE__*/React.createElement("a", {
    href: "/login",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 8,
      background: "#0f172a",
      border: 0,
      color: "#fff",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none"
    }
  }, "\u2192 Se connecter")), /*#__PURE__*/React.createElement(LoginModal, {
    open: loginOpen,
    onClose: () => setLoginOpen(false)
  }), /*#__PURE__*/React.createElement("main", {
    style: erpStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: erpStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Accueil"), /*#__PURE__*/React.createElement("span", {
    style: erpStyles.todayChip
  }, new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }), " \xB7 ", new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/administration-utilisateurs",
    style: {
      ...erpStyles.iconBtn,
      textDecoration: "none",
      color: "inherit"
    },
    title: "Administration"
  }, "\u2699"))), /*#__PURE__*/React.createElement("section", {
    style: erpStyles.hero
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.heroGlow1
  }), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.heroGlow2
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.65)",
      marginBottom: 6,
      fontWeight: 500
    }
  }, "Bonjour ", currentUser ? currentUser.name.split(" ")[0].split("@")[0] : "", " \u2014 voici votre tableau de bord"), /*#__PURE__*/React.createElement("h1", {
    style: erpStyles.heroH1
  }, (() => {
    var h = new Date().getHours();
    return h < 12 ? "Bonne matinée" : h < 18 ? "Bon après-midi" : "Bonne soirée";
  })(), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a78bfa"
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: erpStyles.heroSub
  }, crmStats.opps, " opportunit\xE9", crmStats.opps > 1 ? "s" : "", " en cours \xB7 ", crmStats.clients, " compte", crmStats.clients > 1 ? "s" : "", " en base"))), /*#__PURE__*/React.createElement("section", {
    style: erpStyles.pulseRow
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.pulseHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: erpStyles.h2
  }, "Pouls du jour"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#10b981",
      fontWeight: 600
    }
  }, "\u25CF Live")), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.pulseGrid
  }, [{
    k: "Comptes",
    v: String(crmStats.clients),
    color: "#4f46e5"
  }, {
    k: "Opportunités",
    v: String(crmStats.opps),
    color: "#a855f7"
  }, {
    k: "Signées",
    v: String(crmStats.won),
    color: "#10b981"
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.k,
    style: erpStyles.pulse
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, p.k)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -0.4,
      marginTop: 4
    }
  }, p.v))))), /*#__PURE__*/React.createElement("section", {
    style: erpStyles.modulesSection
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: erpStyles.h2
  }, "Modules"), /*#__PURE__*/React.createElement("p", {
    style: erpStyles.h2sub
  }, "Acc\xE9dez \xE0 vos espaces de travail \xB7 \xE9pinglez vos favoris en haut"))), categories.map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat,
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.catHead
  }, /*#__PURE__*/React.createElement("span", {
    style: erpStyles.catLabel
  }, cat), /*#__PURE__*/React.createElement("span", {
    style: erpStyles.catLine
  }), /*#__PURE__*/React.createElement("span", {
    style: erpStyles.catCount
  }, visibleModules.filter(m => m.cat === cat).length, " modules")), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tiles
  }, visibleModules.filter(m => m.cat === cat).map(m => /*#__PURE__*/React.createElement("div", {
    key: m.key,
    style: {
      ...erpStyles.tile,
      cursor: window.HubNav && window.HubNav.ROUTES[m.key] ? "pointer" : "default"
    },
    onClick: () => {
      var r = window.HubNav && window.HubNav.ROUTES[m.key];
      if (r) window.location.href = r;
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...erpStyles.tileGlow,
      background: m.bg
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...erpStyles.tileIcon,
      background: m.bg,
      color: m.color
    }
  }, m.icon), m.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      ...erpStyles.tileBadge,
      background: badgeTones[m.badge.tone].bg,
      color: badgeTones[m.badge.tone].color,
      border: badgeTones[m.badge.tone].border ? `1px solid ${badgeTones[m.badge.tone].border}` : "none"
    }
  }, m.badge.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: erpStyles.tileTitle
  }, m.title), m.trendUp && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#10b981",
      fontSize: 13
    }
  }, "\u2197")), /*#__PURE__*/React.createElement("p", {
    style: erpStyles.tileSub
  }, m.subtitle)), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileStats
  }, m.stats.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s.k
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileStat
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileStatV
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileStatK
  }, s.k)), i < m.stats.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileStatDiv
  })))), /*#__PURE__*/React.createElement("div", {
    style: erpStyles.tileFoot
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: m.color,
      fontWeight: 600
    }
  }, "Ouvrir le module"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...erpStyles.tileArrow,
      color: m.color
    }
  }, "\u2192")))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...erpStyles.bottomGrid,
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.bottomPanel
  }, /*#__PURE__*/React.createElement("div", {
    style: erpStyles.panelHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: erpStyles.h3
  }, "Actions \xE0 mener ", /*#__PURE__*/React.createElement("span", {
    style: erpStyles.count
  }, actionsTodo.length)), /*#__PURE__*/React.createElement("p", {
    style: erpStyles.h3sub
  }, "Toutes cat\xE9gories confondues")), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...erpStyles.smBtn,
      textDecoration: "none",
      display: "inline-block",
      cursor: "pointer"
    }
  }, "Voir tout")), actionsTodo.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 14px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc"
    }
  }, "Aucune action planifi\xE9e. Cr\xE9ez-en une depuis une fiche client.") : actionsTodo.slice(0, 8).map(a => {
    var dueIso = a.due_at;
    var overdue = dueIso && new Date(dueIso).getTime() < Date.now();
    var catColor = a.type === "email" ? "#a855f7" : a.type === "call" ? "#10b981" : a.type === "rdv" ? "#0ea5e9" : "#475569";
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      onClick: () => {
        if (a.client_id) window.location.href = "/fiche-client?id=" + encodeURIComponent(a.client_id);
      },
      style: {
        ...erpStyles.todoRow,
        ...(overdue ? erpStyles.todoRowOverdue : {}),
        cursor: a.client_id ? "pointer" : "default"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...erpStyles.catChip,
        background: catColor + "15",
        color: catColor
      }
    }, (a.type || "task").toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12.5,
        color: "#0f172a",
        fontWeight: 500
      }
    }, a.title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: overdue ? "#dc2626" : "#64748b",
        fontWeight: overdue ? 600 : 500,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, overdue ? "⏰ " : "", a.due_text || (dueIso ? new Date(dueIso).toLocaleDateString("fr-FR") : "—")));
  })))));
};
var MiniSparkline = ({
  data,
  color,
  w = 50,
  h = 18
}) => {
  var max = Math.max(...data);
  var min = Math.min(...data);
  var range = max - min || 1;
  var step = w / (data.length - 1);
  var points = data.map((v, i) => `${i * step},${h - (v - min) / range * h}`).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: points,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
};
var erpStyles = {
  frame: {
    width: 1440,
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    minHeight: 1700
  },
  sidebar: {
    width: 248,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: 14,
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
    minHeight: 1700
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px"
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #312e81 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(67,56,202,0.3)"
  },
  logoMark: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: -0.5
  },
  search: {
    width: "100%",
    padding: "8px 12px 8px 30px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    background: "#fafbfc",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit"
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: 13
  },
  searchKbd: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 10,
    padding: "1px 5px",
    borderRadius: 4,
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: 1
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    padding: "0 6px 6px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 8px",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  navCount: {
    fontSize: 10.5,
    padding: "1px 6px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace"
  },
  bullet: {
    width: 14,
    color: "#94a3b8",
    fontSize: 12
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 6px",
    borderTop: "1px solid #eef1f5",
    marginTop: 4
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  topbar: {
    height: 48,
    padding: "0 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  },
  todayChip: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace"
  },
  iconBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    fontSize: 13,
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    background: "#dc2626",
    borderRadius: 999,
    border: "1.5px solid #fff"
  },
  // Hero
  hero: {
    margin: "20px 28px 16px",
    padding: "30px 32px",
    borderRadius: 18,
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)",
    color: "#fff",
    position: "relative",
    overflow: "hidden"
  },
  heroGlow1: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(168,85,247,0.35), transparent 65%)",
    pointerEvents: "none"
  },
  heroGlow2: {
    position: "absolute",
    bottom: -60,
    left: 200,
    width: 240,
    height: 240,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(79,70,229,0.4), transparent 65%)",
    pointerEvents: "none"
  },
  heroH1: {
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: -1.2,
    margin: 0,
    color: "#fff",
    lineHeight: 1.05
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    margin: "10px 0 0",
    lineHeight: 1.5
  },
  quickActions: {
    display: "flex",
    gap: 8,
    marginTop: 18,
    flexWrap: "wrap",
    alignItems: "center"
  },
  quickBtn: {
    padding: "7px 14px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 500,
    backdropFilter: "blur(8px)"
  },
  quickBtnPrimary: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #fff",
    fontWeight: 600
  },
  quickSep: {
    width: 1,
    height: 18,
    background: "rgba(255,255,255,0.2)",
    margin: "0 6px"
  },
  // Pulse
  pulseRow: {
    padding: "0 28px 14px"
  },
  pulseHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  h2: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.4,
    margin: 0,
    color: "#0f172a"
  },
  h2sub: {
    fontSize: 12,
    color: "#64748b",
    margin: "3px 0 0"
  },
  pulseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10
  },
  pulse: {
    padding: "14px 16px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  // Modules
  modulesSection: {
    padding: "20px 28px 14px"
  },
  sectionHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18
  },
  viewBtn: {
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  viewBtnActive: {
    background: "#0f172a",
    color: "#fff",
    borderColor: "#0f172a"
  },
  catHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  catLabel: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  catLine: {
    flex: 1,
    height: 1,
    background: "#eef1f5"
  },
  catCount: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  },
  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14
  },
  tile: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 14,
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 200
  },
  tileGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    opacity: 0.5,
    pointerEvents: "none"
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  tileBadge: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  tileTitle: {
    fontSize: 15.5,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  tileSub: {
    fontSize: 12,
    color: "#64748b",
    margin: "3px 0 0",
    lineHeight: 1.4
  },
  tileStats: {
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    padding: "10px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    position: "relative",
    zIndex: 1
  },
  tileStat: {
    flex: 1,
    minWidth: 0
  },
  tileStatV: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.3,
    fontFamily: "'Inter', sans-serif"
  },
  tileStatK: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600,
    marginTop: 1
  },
  tileStatDiv: {
    width: 1,
    background: "#eef1f5",
    margin: "0 10px"
  },
  tileFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    position: "relative",
    zIndex: 1
  },
  tileArrow: {
    fontSize: 16,
    fontWeight: 700
  },
  tileAdd: {
    padding: 18,
    background: "transparent",
    border: "1.5px dashed #cbd5e1",
    borderRadius: 14,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    gap: 4
  },
  // Bottom grid
  bottomGrid: {
    padding: "0 28px 28px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14
  },
  bottomPanel: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  panelHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12
  },
  h3: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.2
  },
  h3sub: {
    fontSize: 11.5,
    color: "#64748b",
    margin: "3px 0 0"
  },
  count: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600
  },
  smBtn: {
    padding: "4px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  todoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  todoRowOverdue: {
    background: "#fff8f7",
    padding: "8px 10px",
    borderRadius: 6,
    borderBottom: "none",
    marginBottom: 2
  },
  checkbox: {
    accentColor: "#4f46e5"
  },
  catChip: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  activityRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "9px 0",
    borderBottom: "1px solid #f1f5f9"
  }
};
window.ERPHome = ERPHome;