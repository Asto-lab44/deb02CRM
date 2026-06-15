// Centralise les routes et la navigation entre les pages du Hub.
// Charger en plain JS avant les composants pour qu'ils s'y réfèrent.

(function () {
  // Map clé module → URL. Les modules "Bientôt" pointent vers une page
  // placeholder qui explique la roadmap. Aucun module ne renvoie à null.
  const ROUTES = {
    home:       "/",
    crm:        "/crm",
    intel:      "/intelligence-concurrentielle",
    marketing:  "/marketing",
    tech:       "/ticketing",
    projects:   "/projets",
    commercial: "/gestion-commerciale",
    commercial_admin: "/gestion-commerciale-admin",
    inventory:  "/stock",
    accounting: "/comptabilite",
    billing:    "/facturation",
    treasury:   "/tresorerie",
    hr:         "/ressources-humaines",
    time:       "/temps-activites",
    reports:    "/rapports",
    settings:   "/administration-utilisateurs",
    // pages d'appoint
    client:     "/fiche-client",
    sales_team: "/equipe-commerciale",
    new_opp:    "/nouvelle-opportunite",
    new_prospect: "/nouveau-prospect",
    renewals:   "/fins-contrats-concurrents",
  };

  // Sidebar par défaut (utilisée par les composants qui veulent une nav globale)
  const PRIMARY_NAV = [
    { key: "home",     label: "Accueil",                     icon: "⌂", href: ROUTES.home },
    { key: "crm",      label: "CRM",                         icon: "▦", href: ROUTES.crm },
    { key: "client",   label: "Fiche client",                icon: "◉", href: ROUTES.client },
    { key: "tech",     label: "Ticketing",                   icon: "✎", href: ROUTES.tech },
    { key: "intel",    label: "Intelligence concurrentielle", icon: "◎", href: ROUTES.intel },
    { key: "new_opp",  label: "Nouvelle opportunité",        icon: "+", href: ROUTES.new_opp },
    { key: "sales_team", label: "Équipe commerciale",        icon: "★", href: ROUTES.sales_team },
    { key: "renewals", label: "Fins contrats concurrents",   icon: "⚑", href: ROUTES.renewals },
    { key: "settings", label: "Administration",              icon: "⚙", href: ROUTES.settings },
  ];

  // URL courante normalisée (avec / sans trailing slash, avec ou sans .html)
  function currentPath() {
    const p = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "");
    return p === "" ? "/" : p;
  }

  function isActive(href) {
    if (!href) return false;
    const c = currentPath();
    if (href === "/") return c === "/" || c === "/index";
    return c === href;
  }

  function go(href) {
    if (href) window.location.href = href;
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value == null || value === "") url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState({}, "", url);
  }

  // Style/icone par clé module — cohérent avec les tuiles de l'Accueil ERP.
  // Utilisé par chaque page pour afficher son logo dans la sidebar avec
  // la couleur + l'icône SVG du module correspondant.
  const MODULE_STYLES = {
    home:       { color: "#3730a3", bg: "#eef2ff", label: "Accueil",                   iconPath: "M3 12l9-9 9 9M5 10v10h14V10" },
    crm:        { color: "#4f46e5", bg: "#eef2ff", label: "CRM",                       iconPath: "M3 3v18h18M7 17l4-4 4 4 5-7" },
    intel:      { color: "#dc2626", bg: "#fdecec", label: "Intelligence concurrentielle", iconPath: "M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6l4 4M5 19l4-4m6-6l4-4" },
    marketing:  { color: "#ec4899", bg: "#fdf2f8", label: "Marketing",                 iconPath: "M3 11l18-5v12L3 14v-3zM11 12v3l3 1" },
    tech:       { color: "#0ea5e9", bg: "#e0f4fc", label: "Ticketing",                 iconPath: "M11 3a9 9 0 109 9M12 7v5l4 2" },
    projects:   { color: "#a855f7", bg: "#f5efff", label: "Projets & Livrables",       iconPath: "M3 7h18v13H3zM3 7l4-4h10l4 4M9 11h6" },
    commercial: { color: "#f59e0b", bg: "#fef0e6", label: "Gestion commerciale",       iconPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2" },
    inventory:  { color: "#0891b2", bg: "#cffafe", label: "Stock",                     iconPath: "M3 7l9-4 9 4M3 7v10l9 4 9-4V7M3 7l9 4 9-4" },
    accounting: { color: "#10b981", bg: "#e8f8f1", label: "Comptabilité",              iconPath: "M3 10h18M5 10v10h14V10M9 14h2M13 14h2M9 18h2M13 18h2" },
    billing:    { color: "#f59e0b", bg: "#fef0e6", label: "Facturation",               iconPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2" },
    treasury:   { color: "#0e7a55", bg: "#d1fae5", label: "Trésorerie",                iconPath: "M3 6h18v14H3zM3 10h18M7 15h4" },
    hr:         { color: "#8b5cf6", bg: "#f3e8ff", label: "Ressources humaines",       iconPath: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" },
    time:       { color: "#14b8a6", bg: "#ccfbf1", label: "Temps & Activités",         iconPath: "M11 3a9 9 0 109 9M12 6v6l4 2" },
    reports:    { color: "#3730a3", bg: "#e0e7ff", label: "Rapports",                  iconPath: "M3 3v18h18M7 14l3-3 4 4 5-7" },
    settings:   { color: "#64748b", bg: "#f1f3f6", label: "Administration",            iconPath: "M12 8a4 4 0 100 8 4 4 0 000-8zM3 12c0-1 1-2 1.5-2.5l-1-2 2-2 2 1c.5-.5 1.5-1 2.5-1l1-2h2l1 2c1 0 2 .5 2.5 1l2-1 2 2-1 2c.5.5 1 1.5 1 2.5l2 1v2l-2 1c0 1-.5 2-1 2.5l1 2-2 2-2-1c-.5.5-1.5 1-2.5 1l-1 2h-2l-1-2c-1 0-2-.5-2.5-1l-2 1-2-2 1-2c-.5-.5-1-1.5-1-2.5l-2-1v-2z" },
    // Pages d'appoint qui héritent du module
    client:       { color: "#4f46e5", bg: "#eef2ff", label: "Fiche client",          iconPath: "M3 3v18h18M7 17l4-4 4 4 5-7" },
    sales_team:   { color: "#4f46e5", bg: "#eef2ff", label: "Équipe commerciale",    iconPath: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8z" },
    new_opp:      { color: "#4f46e5", bg: "#eef2ff", label: "Nouvelle opportunité",  iconPath: "M12 5v14m-7-7h14" },
    new_prospect: { color: "#4f46e5", bg: "#eef2ff", label: "Nouveau prospect",      iconPath: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" },
    renewals:     { color: "#dc2626", bg: "#fdecec", label: "Fins contrats concurrents", iconPath: "M12 2v6m0 8v6M2 12h6m8 0h6" },
  };

  // Mapping URL → clé module pour identifier le contexte courant
  const PATH_TO_KEY = {
    "/": "home",
    "/crm": "crm",
    "/intelligence-concurrentielle": "intel",
    "/marketing": "marketing",
    "/ticketing": "tech",
    "/projets": "projects",
    "/projets-gantt": "projects",
    "/projets-calendrier": "projects",
    "/projet": "projects",
    "/gestion-commerciale": "commercial",
    "/gestion-commerciale-admin": "commercial",
    "/stock": "inventory",
    "/comptabilite": "accounting",
    "/facturation": "billing",
    "/tresorerie": "treasury",
    "/ressources-humaines": "hr",
    "/temps-activites": "time",
    "/rapports": "reports",
    "/administration-utilisateurs": "settings",
    "/fiche-client": "client",
    "/equipe-commerciale": "sales_team",
    "/nouvelle-opportunite": "new_opp",
    "/avancer-opportunite": "new_opp",
    "/nouveau-prospect": "new_prospect",
    "/nouveau-contrat": "commercial",
    "/fins-contrats-concurrents": "renewals",
  };

  /** Renvoie le style + l'icône SVG du module en fonction de l'URL courante. */
  function getCurrentModuleStyle() {
    const path = currentPath();
    const key = PATH_TO_KEY[path] || "home";
    const style = MODULE_STYLES[key] || MODULE_STYLES.home;
    return { key, ...style };
  }

  /** Composant React global qui affiche le logo du module courant.
   *  Usage dans JSX : React.createElement(window.HubModuleLogo, { size: 36 })
   *  ou en raccourci : HubModuleLogo({ size: 36 }) si exposé. */
  function HubModuleLogo(props) {
    const size = (props && props.size) || 36;
    const style = getCurrentModuleStyle();
    const iconSize = Math.round(size * 0.55);
    return React.createElement(
      "div",
      {
        style: {
          width: size, height: size, borderRadius: 9,
          background: style.bg, color: style.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        },
      },
      React.createElement(
        "svg",
        {
          viewBox: "0 0 24 24", width: iconSize, height: iconSize,
          fill: "none", stroke: "currentColor", strokeWidth: 2,
          strokeLinecap: "round", strokeLinejoin: "round",
        },
        React.createElement("path", { d: style.iconPath })
      )
    );
  }
  window.HubModuleLogo = HubModuleLogo;

  window.HubNav = { ROUTES, PRIMARY_NAV, currentPath, isActive, go, getQueryParam, setQueryParam, MODULE_STYLES, PATH_TO_KEY, getCurrentModuleStyle, HubModuleLogo };
})();
