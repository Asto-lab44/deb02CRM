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

  window.HubNav = { ROUTES, PRIMARY_NAV, currentPath, isActive, go, getQueryParam, setQueryParam };
})();
