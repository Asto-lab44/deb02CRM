// ════════════════════════════════════════════════════════════════════
// CRMPipeline — Pipeline commercial (route : /crm)
// ════════════════════════════════════════════════════════════════════
//
// Composé de 2 sections (deux composants empilés) :
//   1. <CRMPipeline>      → header + kanban des opportunités + KPI strip
//   2. <CRMAccountsList>  → sous-composant tableau Comptes & Contacts
//   3. <ActionsRow>       → sous-composant liste "Actions à mener"
//
// Sources de données :
//   - opportunités : api.opportunities.list() — colonne kanban par stage
//   - clients      : api.clients.list() — table Comptes
//   - contacts     : api.contacts.list() — compteur sidebar
//   - actions      : api.actions.list() — compteur sidebar
//
// Filtres :
//   - crmFilter { kind: "all"|"view"|"product"|"status", value }
//     → contrôle ce qui apparaît dans le kanban
//   - globalSearch → recherche transversale (clients + opps + contacts)
//
// Compteurs sidebar (Comptes/Contacts/Activités) sont mis à jour live au mount.
// ════════════════════════════════════════════════════════════════════

var CRMPipeline = () => {
  // Filtre actif sur le pipeline (vue, produit, savedView…)
  var [crmFilter, setCrmFilter] = React.useState({
    kind: "all",
    value: null
  });
  var isCrmActive = (kind, value) => crmFilter.kind === kind && (value === undefined || crmFilter.value === value);
  var setCrmIfDiff = (kind, value) => setCrmFilter(isCrmActive(kind, value) ? {
    kind: "all",
    value: null
  } : {
    kind,
    value
  });

  // ───── Recherche globale (topbar) — comptes / contacts / opportunités
  var [globalSearch, setGlobalSearch] = React.useState("");
  var [searchClients, setSearchClients] = React.useState([]);
  var [searchOpen, setSearchOpen] = React.useState(false);

  // ───── Comptes : décomptes pour la sidebar (Comptes / Contacts / Activités)
  var [sidebarCounts, setSidebarCounts] = React.useState({
    comptes: 0,
    contacts: 0,
    activites: 0
  });
  React.useEffect(() => {
    if (!window.api) return;
    Promise.all([window.api.clients.list(), window.api.contacts.list(), window.api.actions.list({
      status: "todo"
    })]).then(([cl, co, ac]) => {
      setSidebarCounts({
        comptes: (cl || []).length,
        contacts: (co || []).length,
        activites: (ac || []).length
      });
    }).catch(() => {});
  }, []);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.clients.list().then(list => {
      setSearchClients((list || []).map(p => ({
        id: p.id,
        name: p.raison_sociale || p.name,
        sector: p.secteur || p.industry,
        city: p.ville || p.city,
        siren: p.siren,
        contact: p.contact_principal,
        source: p.status === "client" ? "supabase" : "local"
      })));
    }).catch(() => {});
  }, []);
  var [searchOpps, setSearchOpps] = React.useState([]);
  var [userMenuOpen, setUserMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (!userMenuOpen) return;
    var onDoc = () => setUserMenuOpen(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [userMenuOpen]);

  // Applique le filtre sidebar (Vues sauvegardées / Produits) sur les opps
  var filteredOpps = React.useMemo(() => {
    var all = searchOpps || [];
    if (crmFilter.kind === "all") return all;
    if (crmFilter.kind === "view") {
      var now = Date.now();
      switch (crmFilter.value) {
        case "q2":
          return all.filter(o => {
            if (!o.close_date) return false;
            var d = new Date(o.close_date);
            return d.getFullYear() === new Date().getFullYear() && d.getMonth() >= 3 && d.getMonth() <= 5;
          });
        case "big":
          return all.filter(o => (Number(o.amount_eur) || 0) >= 50000);
        case "follow":
          return all.filter(o => {
            if (!o.updated_at) return true;
            return now - new Date(o.updated_at).getTime() > 7 * 24 * 3600 * 1000 && o.stage !== "won" && o.stage !== "lost";
          });
        case "stale":
          return all.filter(o => {
            if (!o.updated_at) return false;
            return now - new Date(o.updated_at).getTime() > 14 * 24 * 3600 * 1000 && o.stage !== "won" && o.stage !== "lost";
          });
        default:
          return all;
      }
    }
    if (crmFilter.kind === "product") {
      var tag = String(crmFilter.value || "").toLowerCase();
      return all.filter(o => {
        var blob = ((o.modules || []).join(" ") + " " + (o.produit || "") + " " + (o.name || "")).toLowerCase();
        return blob.includes(tag.replace("astorya ", ""));
      });
    }
    return all;
  }, [searchOpps, crmFilter]);
  // Charge initial + s'abonne aux changements realtime (multi-onglets).
  React.useEffect(() => {
    if (!window.api) return;
    var reload = () => {
      window.api.opportunities.list().then(list => setSearchOpps(list || [])).catch(() => {});
      if (window.api.clients && window.api.contacts && window.api.actions) {
        Promise.all([window.api.clients.list(), window.api.contacts.list(), window.api.actions.list({
          status: "todo"
        })]).then(([cl, co, ac]) => {
          setSidebarCounts({
            comptes: (cl || []).length,
            contacts: (co || []).length,
            activites: (ac || []).length
          });
        }).catch(() => {});
      }
    };
    reload();
    // Realtime : tout changement sur opportunities/clients/contacts/actions
    // recharge automatiquement.
    if (window.HubData && window.HubData.subscribeChanges) {
      return window.HubData.subscribeChanges(reload);
    }
  }, []);
  var gq = globalSearch.trim().toLowerCase();
  var globalResults = gq.length >= 2 ? {
    clients: searchClients.filter(c => [c.name, c.sector, c.city, c.siren].some(v => String(v || "").toLowerCase().includes(gq))).slice(0, 5),
    contacts: searchClients.filter(c => c.contact && [c.contact.prenom, c.contact.nom, c.contact.email, c.contact.fonction].some(v => String(v || "").toLowerCase().includes(gq))).slice(0, 5),
    opps: searchOpps.filter(o => [o.name, o.client_name].some(v => String(v || "").toLowerCase().includes(gq))).slice(0, 5)
  } : null;
  var noResults = globalResults && globalResults.clients.length + globalResults.contacts.length + globalResults.opps.length === 0;
  var Avatar = ({
    name,
    size = 22,
    color
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      K: "#6366f1",
      L: "#0ea5e9",
      T: "#f59e0b",
      S: "#10b981",
      C: "#ef4444",
      M: "#a855f7",
      N: "#ec4899",
      J: "#14b8a6"
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
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: 0.2,
        flexShrink: 0,
        border: "1.5px solid #fff"
      }
    }, initials);
  };

  // Colonnes du Kanban — alimentées par les opportunités Supabase
  // Pipeline SPANCO — cohérent avec la page Faire avancer l'opportunité.
  // Mapping interne stage BDD → label SPANCO (pas de migration de données).
  var stageMeta = [{
    key: "qualif",
    label: "Prospect",
    color: "#94a3b8"
  }, {
    key: "discovery",
    label: "Approche",
    color: "#3b82f6"
  }, {
    key: "propo",
    label: "Négociation",
    color: "#a855f7"
  }, {
    key: "nego",
    label: "Conclusion",
    color: "#ea580c"
  }, {
    key: "won",
    label: "Ordre",
    color: "#10b981"
  }];
  var palette = ["#1e40af", "#dc2626", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#0f766e", "#ec4899", "#a855f7"];
  var moduleTag = (modules, produit) => {
    if (Array.isArray(modules) && modules.length > 0) return modules[0];
    if (typeof produit === "string") {
      if (produit.includes("Cyber")) return "Cyber";
      if (produit.includes("Hub")) return "Hub";
      if (produit.includes("Suite")) return "Suite";
    }
    return "Suite";
  };
  var columns = stageMeta.map((s, idx) => {
    var stageOpps = (filteredOpps || []).filter(o => (o.stage || "qualif") === s.key);
    var total = stageOpps.reduce((sum, o) => sum + (Number(o.amount_eur) || 0), 0);
    return {
      ...s,
      count: stageOpps.length,
      total: total > 0 ? Math.round(total / 1000) + " k€" : "0 €",
      cards: stageOpps.map((o, i) => ({
        id: o.id,
        co: o.name || o.data && o.data.name || "Opportunité",
        client: o.client_name || o.data && o.data.client_name || "—",
        amount: o.amount_eur != null ? Math.round(o.amount_eur).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : "—",
        days: 0,
        owner: o.owner || "—",
        proba: o.proba || {
          qualif: 20,
          discovery: 35,
          propo: 55,
          nego: 75,
          won: 100
        }[s.key] || 20,
        tag: moduleTag(o.modules, o.produit),
        // Initiales du client (prend la 1ʳᵉ lettre de chaque mot, max 2).
        // client_name peut être au top-level OU dans o.data.client_name (jsonb).
        // On NE prend PAS le nom de l'opp en fallback : si pas de client → "?".
        logo: (() => {
          var clientName = o.client_name && o.client_name.trim() || o.data && o.data.client_name && String(o.data.client_name).trim() || "";
          if (!clientName) return "?";
          var ini = clientName.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return ini || clientName.slice(0, 2).toUpperCase();
        })(),
        logoBg: palette[(idx * 3 + i) % palette.length],
        won: o.stage === "won"
      }))
    };
  });
  var tagMeta = {
    Cyber: {
      bg: "#fdecec",
      color: "#dc2626"
    },
    Hub: {
      bg: "#eef2ff",
      color: "#4338ca"
    },
    Suite: {
      bg: "#f5efff",
      color: "#7e22ce"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: crmStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: crmStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...crmStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
    style: crmStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: crmStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "CRM commercial"))), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navLabel
  }, "Espace de travail"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      fontSize: 12
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: globalSearch,
    onChange: e => setGlobalSearch(e.target.value),
    placeholder: "Rechercher\u2026",
    style: {
      width: "100%",
      padding: "7px 10px 7px 28px",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12,
      color: "#0f172a",
      outline: "none",
      background: "#fafbfc",
      boxSizing: "border-box"
    }
  }), globalSearch && /*#__PURE__*/React.createElement("span", {
    onClick: () => setGlobalSearch(""),
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\xD7")), [{
    label: "Pipeline",
    icon: "▦",
    href: "/crm",
    active: isCrmActive("all")
  }, {
    label: "Comptes",
    icon: "◰",
    href: "/crm#comptes-section",
    count: sidebarCounts.comptes
  }, {
    label: "Contacts",
    icon: "◉",
    href: "/crm#comptes-section",
    count: sidebarCounts.contacts
  }, {
    label: "Activités",
    icon: "✦",
    href: "/crm#actions-section",
    count: sidebarCounts.activites
  }].map(n => {
    var inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        color: n.active ? "#4f46e5" : "#94a3b8",
        fontSize: 11
      }
    }, n.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.label), n.count > 0 && /*#__PURE__*/React.createElement("span", {
      style: crmStyles.navCount
    }, n.count));
    var styleAct = {
      ...crmStyles.navItem,
      ...(n.active ? crmStyles.navItemActive : {}),
      cursor: "pointer"
    };
    if (n.href) return /*#__PURE__*/React.createElement("a", {
      key: n.label,
      href: n.href,
      style: {
        ...styleAct,
        textDecoration: "none",
        color: n.active ? "#3730a3" : "inherit"
      }
    }, inner);
    return /*#__PURE__*/React.createElement("div", {
      key: n.label,
      onClick: n.onClick,
      style: styleAct
    }, inner);
  })), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navLabel
  }, "Vues sauvegard\xE9es"), [{
    label: "Mon pipeline Q2",
    color: "#4f46e5",
    value: "q2"
  }, {
    label: "Deals > 50 k€",
    color: "#10b981",
    value: "big"
  }, {
    label: "À relancer cette sem.",
    color: "#f59e0b",
    value: "follow"
  }, {
    label: "Stagnants 14 j+",
    color: "#dc2626",
    value: "stale"
  }].map(n => {
    var active = isCrmActive("view", n.value);
    return /*#__PURE__*/React.createElement("div", {
      key: n.label,
      onClick: () => setCrmIfDiff("view", n.value),
      style: {
        ...crmStyles.navItem,
        ...(active ? crmStyles.navItemActive : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: n.color
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.label));
  })), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crmStyles.navLabel
  }, "Produits"), [{
    label: "Astorya Suite",
    c: "12",
    color: "#a855f7"
  }, {
    label: "Astorya Hub",
    c: "11",
    color: "#4f46e5"
  }, {
    label: "Astorya Cyber",
    c: "9",
    color: "#dc2626"
  }].map(n => {
    var active = isCrmActive("product", n.label);
    return /*#__PURE__*/React.createElement("div", {
      key: n.label,
      onClick: () => setCrmIfDiff("product", n.label),
      style: {
        ...crmStyles.navItem,
        ...(active ? crmStyles.navItemActive : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: n.color,
        display: "inline-block"
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.label), /*#__PURE__*/React.createElement("span", {
      style: crmStyles.navCount
    }, n.c));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...crmStyles.userRow,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Romain Daviaud",
    size: 26,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Romain Daviaud"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Direction \xB7 Astorya")), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setUserMenuOpen(v => !v);
    },
    title: "Menu utilisateur",
    style: {
      background: "transparent",
      border: 0,
      color: "#94a3b8",
      fontSize: 14,
      cursor: "pointer",
      padding: 4,
      borderRadius: 6
    }
  }, "\u22EF"), userMenuOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: "absolute",
      bottom: "calc(100% + 6px)",
      right: 4,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
      zIndex: 1000,
      minWidth: 200,
      padding: 6
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/administration-utilisateurs",
    style: crmStyles.userMenuItem
  }, "\uD83D\uDC64 Administration"), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: crmStyles.userMenuItem
  }, "\uD83C\uDFE0 Accueil ERP"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "#eef1f5",
      margin: "4px 0"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Se déconnecter ?",
        okLabel: "Déconnexion",
        okStyle: "danger"
      }) : confirm("Se déconnecter ?");
      if (!ok) return;
      if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
      if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout();
      window.location.href = "/login";
    },
    style: {
      ...crmStyles.userMenuItem,
      color: "#dc2626",
      textAlign: "left",
      cursor: "pointer",
      border: 0,
      background: "transparent",
      width: "100%"
    }
  }, "\u23FB Se d\xE9connecter")))), /*#__PURE__*/React.createElement("main", {
    style: crmStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: crmStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: crmStyles.totalChip
  }, "Q2 2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...crmStyles.search,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontSize: 12
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    placeholder: "Rechercher un compte, contact, opportunit\xE9\u2026",
    value: globalSearch,
    onChange: e => {
      setGlobalSearch(e.target.value);
      setSearchOpen(true);
    },
    onFocus: () => setSearchOpen(true),
    onBlur: () => setTimeout(() => setSearchOpen(false), 200),
    style: crmStyles.searchInput
  }), /*#__PURE__*/React.createElement("span", {
    style: crmStyles.kbdLight
  }, "\u2318K"), searchOpen && globalResults && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 10px 30px rgba(0,0,0,.12)",
      zIndex: 100,
      maxHeight: 420,
      overflowY: "auto"
    }
  }, noResults && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px",
      fontSize: 12.5,
      color: "#94a3b8",
      textAlign: "center"
    }
  }, "Aucun r\xE9sultat pour \xAB ", globalSearch, " \xBB. ", /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      color: "#3730a3",
      fontWeight: 600
    }
  }, "+ Nouveau prospect")), globalResults.clients.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      background: "#fafbfc",
      borderBottom: "1px solid #f1f5f9"
    }
  }, "Comptes (", globalResults.clients.length, ")"), globalResults.clients.map(c => /*#__PURE__*/React.createElement("a", {
    key: c.id,
    href: "/fiche-client?id=" + encodeURIComponent(c.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderBottom: "1px solid #f1f5f9",
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 5,
      background: c.source === "local" ? "#fef3c7" : "#dcfce7",
      color: c.source === "local" ? "#78350f" : "#065f46",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9.5,
      fontWeight: 700,
      flexShrink: 0
    }
  }, (c.name || "?").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, c.sector || "—", c.city && ` · ${c.city}`)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\u203A")))), globalResults.contacts.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      background: "#fafbfc",
      borderTop: "1px solid #f1f5f9",
      borderBottom: "1px solid #f1f5f9"
    }
  }, "Contacts (", globalResults.contacts.length, ")"), globalResults.contacts.map(c => /*#__PURE__*/React.createElement("a", {
    key: "ct-" + c.id,
    href: "/fiche-client?id=" + encodeURIComponent(c.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderBottom: "1px solid #f1f5f9",
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: "#6366f1",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 700,
      flexShrink: 0
    }
  }, ((c.contact.prenom || "") + (c.contact.nom || "")).slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, c.contact.prenom, " ", c.contact.nom), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, c.contact.fonction || "—", " \xB7 ", c.name)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\u203A")))), globalResults.opps.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      background: "#fafbfc",
      borderTop: "1px solid #f1f5f9",
      borderBottom: "1px solid #f1f5f9"
    }
  }, "Opportunit\xE9s (", globalResults.opps.length, ")"), globalResults.opps.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "2px 7px",
      background: "#eef2ff",
      color: "#3730a3",
      borderRadius: 4,
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums"
    }
  }, o.id), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, o.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, o.client_name, " \xB7 ", o.amount && o.amount + " €"))))))))), (() => {
    var active = (filteredOpps || []).filter(o => o.stage !== "won" && o.stage !== "lost");
    var totalActive = active.reduce((s, o) => s + (Number(o.amount_eur) || 0), 0);
    var pondere = active.reduce((s, o) => s + (Number(o.amount_eur) || 0) * (Number(o.proba) || 0) / 100, 0);
    var wonOpps = (filteredOpps || []).filter(o => o.stage === "won");
    var wonAmount = wonOpps.reduce((s, o) => s + (Number(o.amount_eur) || 0), 0);
    var fmtK = n => n > 999999 ? (n / 1000000).toFixed(2).replace(".", ",") + " M€" : Math.round(n / 1000) + " k€";
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: crmStyles.titleRow
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: crmStyles.h1
    }, "Pipeline commercial"), /*#__PURE__*/React.createElement("p", {
      style: crmStyles.h1sub
    }, active.length, " opportunit\xE9", active.length > 1 ? "s" : "", " active", active.length > 1 ? "s" : "", " \xB7 ", fmtK(pondere), " pond\xE9r\xE9")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "/nouveau-prospect",
      style: {
        ...crmStyles.primaryBtn,
        background: "#fff",
        color: "#3730a3",
        border: "1px solid #c7d2fe",
        textDecoration: "none",
        display: "inline-block",
        cursor: "pointer",
        boxShadow: "none"
      }
    }, "+ Nouveau prospect"), /*#__PURE__*/React.createElement("a", {
      href: "/nouvelle-opportunite",
      style: {
        ...crmStyles.primaryBtn,
        textDecoration: "none",
        display: "inline-block",
        cursor: "pointer"
      }
    }, "+ Nouvelle opportunit\xE9"))), /*#__PURE__*/React.createElement("div", {
      style: crmStyles.kpiStrip
    }, [{
      label: "Pipeline total",
      value: fmtK(totalActive),
      delta: active.length + " opp. actives",
      color: "#4f46e5"
    }, {
      label: "Pondéré (probabilité)",
      value: fmtK(pondere),
      delta: "Selon stage de chaque opp.",
      color: "#a855f7"
    }, {
      label: "Signées",
      value: fmtK(wonAmount),
      delta: wonOpps.length + " deal" + (wonOpps.length > 1 ? "s" : ""),
      color: "#10b981"
    }, {
      label: "Total opportunités",
      value: String((filteredOpps || []).length),
      delta: crmFilter.kind !== "all" ? "Filtré" : "Toutes étapes",
      color: "#0ea5e9"
    }].map(k => /*#__PURE__*/React.createElement("div", {
      key: k.label,
      style: crmStyles.kpi
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: k.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: 500,
        letterSpacing: 0.2,
        textTransform: "uppercase"
      }
    }, k.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 600,
        color: "#0f172a",
        letterSpacing: -0.5
      }
    }, k.value), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2
      }
    }, k.delta)))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.kanban
  }, columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.key,
    onDragOver: e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      e.currentTarget.style.background = col.color + "0d";
    },
    onDragLeave: e => {
      e.currentTarget.style.background = "";
    },
    onDrop: async e => {
      e.preventDefault();
      e.currentTarget.style.background = "";
      var oppId = e.dataTransfer.getData("oppId");
      if (!oppId || !window.api) return;
      // Garde-fou : ignore le drop sur la colonne d'origine
      // (évite un appel inutile à l'API et toute notification trompeuse).
      var allOpps = await window.api.opportunities.list();
      var dragged = (allOpps || []).find(o => o.id === oppId || o.ref === oppId);
      if (!dragged) return;
      if (dragged.stage === col.key) return;
      // Pop-up de confirmation pour éviter un déplacement par mégarde.
      var stageLabels = {
        qualif: "Prospect",
        discovery: "Approche",
        propo: "Négociation",
        nego: "Conclusion",
        won: "Ordre",
        lost: "Perdu"
      };
      var fromLbl = stageLabels[dragged.stage] || dragged.stage;
      var toLbl = stageLabels[col.key] || col.label;
      var oppName = dragged.name || dragged.client_name || oppId;
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Confirmer le déplacement",
        message: "Déplacer « " + oppName + " » de l'étape « " + fromLbl + " » vers « " + toLbl + " » ?\n\nCette action met à jour le SPANCO et la probabilité associée.",
        okLabel: "Oui, déplacer",
        okStyle: "primary"
      }) : confirm("Déplacer « " + oppName + " » de « " + fromLbl + " » vers « " + toLbl + " » ?");
      if (!ok) {
        if (window.HubToast) window.HubToast.info("Déplacement annulé — l'opportunité reste en « " + fromLbl + " »");
        return;
      }
      var stageProba = {
        qualif: 20,
        discovery: 35,
        propo: 55,
        nego: 75,
        won: 100
      };
      try {
        await window.api.opportunities.update(oppId, {
          stage: col.key,
          proba: stageProba[col.key] || 20
        });
        if (window.HubToast) window.HubToast.success("✓ « " + oppName + " » déplacée en « " + toLbl + " »");
        // Reload opps
        var list = await window.api.opportunities.list();
        setSearchOpps(list || []);
      } catch (err) {
        if (window.HubToast) window.HubToast.error("Erreur : " + (err.message || err));
      }
    },
    style: crmStyles.column
  }, /*#__PURE__*/React.createElement("div", {
    style: crmStyles.colHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: col.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, col.label), /*#__PURE__*/React.createElement("span", {
    style: crmStyles.colCount
  }, col.count)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 500
    }
  }, col.total)), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.colBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(100, parseInt(col.total))}%`,
      height: "100%",
      background: col.color,
      opacity: 0.7,
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: crmStyles.cards
  }, col.cards.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 12px",
      fontSize: 11.5,
      color: "#94a3b8",
      textAlign: "center",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc"
    }
  }, "Aucune opportunit\xE9"), col.cards.map((c, i) => {
    var tag = tagMeta[c.tag] || {
      bg: "#eef1f5",
      color: "#475569"
    };
    var goto = () => {
      if (c.id) window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(c.id);
    };
    return /*#__PURE__*/React.createElement("div", {
      key: c.id || i,
      draggable: !!c.id,
      onDragStart: e => {
        if (c.id) {
          e.dataTransfer.setData("oppId", c.id);
          e.dataTransfer.effectAllowed = "move";
        }
      },
      onClick: goto,
      style: {
        ...crmStyles.card,
        ...(c.hot ? crmStyles.cardHot : {}),
        ...(c.won ? crmStyles.cardWon : {}),
        cursor: c.id ? "pointer" : "default"
      }
    }, c.isNew && /*#__PURE__*/React.createElement("div", {
      style: crmStyles.newRibbon
    }, "Nouveau"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...crmStyles.coLogo,
        background: c.logoBg
      }
    }, c.logo), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a",
        lineHeight: 1.3,
        wordBreak: "break-word"
      }
    }, c.co), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 1
      }
    }, c.client), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...crmStyles.tagPill,
        background: tag.bg,
        color: tag.color
      }
    }, c.tag), c.hot && /*#__PURE__*/React.createElement("span", {
      style: {
        ...crmStyles.tagPill,
        background: "#fff1d6",
        color: "#a65f00"
      }
    }, "\uD83D\uDD25 Hot"), c.won && /*#__PURE__*/React.createElement("span", {
      style: {
        ...crmStyles.tagPill,
        background: "#e8f8f1",
        color: "#0e7a55"
      }
    }, "\u2713 Sign\xE9")))), /*#__PURE__*/React.createElement("div", {
      style: crmStyles.cardAmount
    }, c.amount), c.meeting && /*#__PURE__*/React.createElement("div", {
      style: crmStyles.meetingNote
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#4f46e5"
      }
    }, "\u25F7"), " ", c.meeting), c.warning && /*#__PURE__*/React.createElement("div", {
      style: crmStyles.warnNote
    }, /*#__PURE__*/React.createElement("span", null, "\u26A0"), " ", c.warning), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: 600
      }
    }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#0f172a",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums"
      }
    }, c.proba, "%")), /*#__PURE__*/React.createElement("div", {
      style: crmStyles.probaBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${c.proba}%`,
        height: "100%",
        background: col.color,
        borderRadius: 999
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: crmStyles.cardFoot
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.owner,
      size: 20
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 7,
        alignItems: "center",
        fontSize: 11,
        color: "#64748b"
      }
    }, c.contacts != null && /*#__PURE__*/React.createElement("span", {
      title: "Contacts",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\u25C9"), c.contacts), /*#__PURE__*/React.createElement("span", {
      title: "Derni\xE8re activit\xE9",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\u25F7"), c.days, "j"))));
  }), /*#__PURE__*/React.createElement("a", {
    href: "/nouvelle-opportunite?stage=" + col.key,
    style: {
      ...crmStyles.addCard,
      textDecoration: "none",
      display: "block",
      textAlign: "center",
      cursor: "pointer"
    }
  }, "+ Ajouter une opportunit\xE9"))))), /*#__PURE__*/React.createElement(CRMAccountsList, null), /*#__PURE__*/React.createElement(CRMActionsList, null)));
};
var crmStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 248,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "14px 12px",
    gap: 14
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px"
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 1px 2px rgba(67,56,202,0.3)"
  },
  logoMark: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: -0.5
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    marginLeft: "auto",
    fontSize: 10.5,
    padding: "2px 5px",
    borderRadius: 4,
    background: "rgba(255,255,255,0.12)",
    color: "#cbd5e1",
    fontVariantNumeric: "tabular-nums"
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
    fontSize: 11,
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums"
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 6px",
    borderTop: "1px solid #eef1f5",
    marginTop: 4
  },
  userMenuItem: {
    display: "block",
    padding: "8px 10px",
    fontSize: 12.5,
    color: "#0f172a",
    textDecoration: "none",
    borderRadius: 6,
    fontWeight: 500
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  topbar: {
    height: 48,
    padding: "0 20px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  totalChip: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontVariantNumeric: "tabular-nums"
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: 340,
    height: 30,
    padding: "0 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fafbfc"
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    flex: 1,
    fontSize: 12.5,
    color: "#0f172a",
    fontFamily: "inherit"
  },
  kbdLight: {
    fontSize: 10.5,
    padding: "1px 5px",
    borderRadius: 4,
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums"
  },
  iconBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    position: "relative",
    fontSize: 13,
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
    background: "#ef4444",
    borderRadius: 999,
    border: "1.5px solid #fff"
  },
  titleRow: {
    padding: "18px 24px 10px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16
  },
  h1: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: -0.6,
    margin: 0,
    color: "#0f172a"
  },
  h1sub: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  ghostBtn: {
    padding: "7px 13px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  primaryBtn: {
    padding: "7px 13px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    padding: "4px 24px 14px"
  },
  kpi: {
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  filterBar: {
    padding: "10px 24px",
    borderTop: "1px solid #eef1f5",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  tabs: {
    display: "flex",
    gap: 2
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  tabActive: {
    background: "#0f172a",
    color: "#fff"
  },
  tabCount: {
    fontSize: 11,
    padding: "0 5px",
    borderRadius: 4,
    background: "#eef1f5",
    color: "#64748b",
    fontVariantNumeric: "tabular-nums"
  },
  tabCountActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#cbd5e1"
  },
  filterPill: {
    padding: "5px 9px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  divider: {
    width: 1,
    height: 18,
    background: "#eef1f5",
    alignSelf: "center",
    margin: "0 4px"
  },
  // Kanban
  kanban: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    padding: "14px 24px 24px",
    background: "#fafbfc"
  },
  column: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "#f1f3f6",
    borderRadius: 10,
    padding: 10,
    gap: 8
  },
  colHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "2px 4px"
  },
  colCount: {
    fontSize: 11,
    padding: "0 6px",
    borderRadius: 999,
    background: "#fff",
    color: "#475569",
    fontVariantNumeric: "tabular-nums",
    border: "1px solid #e2e8f0"
  },
  colBar: {
    height: 2,
    background: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
    margin: "0 2px 4px"
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflow: "hidden"
  },
  card: {
    position: "relative",
    padding: 11,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    boxShadow: "0 1px 0 rgba(15,23,42,0.02)"
  },
  cardHot: {
    borderColor: "#fed7aa",
    boxShadow: "0 0 0 1px #fed7aa, 0 1px 0 rgba(15,23,42,0.02)"
  },
  cardWon: {
    background: "linear-gradient(180deg, #ffffff, #f0fdf6)",
    borderColor: "#bbf7d0"
  },
  newRibbon: {
    position: "absolute",
    top: -6,
    right: 8,
    padding: "1px 7px",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 9.5,
    fontWeight: 700,
    borderRadius: 999,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  coLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.3,
    flexShrink: 0
  },
  tagPill: {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.2
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    letterSpacing: -0.4,
    fontFamily: "'Inter', sans-serif"
  },
  meetingNote: {
    fontSize: 11,
    color: "#3730a3",
    background: "#eef2ff",
    padding: "4px 7px",
    borderRadius: 6,
    marginTop: 6
  },
  warnNote: {
    fontSize: 11,
    color: "#a65f00",
    background: "#fff6e6",
    padding: "4px 7px",
    borderRadius: 6,
    marginTop: 6,
    display: "flex",
    gap: 4,
    alignItems: "center"
  },
  probaBar: {
    width: "100%",
    height: 3,
    background: "#eef1f5",
    borderRadius: 999,
    overflow: "hidden"
  },
  cardFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
    paddingTop: 8,
    borderTop: "1px solid #f1f5f9"
  },
  addCard: {
    padding: "8px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 8,
    fontSize: 11.5,
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: 500
  }
};

// ───── Sous-composant : Comptes & Contacts avec recherche
var CRMAccountsList = () => {
  var [search, setSearch] = React.useState("");
  var [localProspects, setLocalProspects] = React.useState([]);
  var [supaClients, setSupaClients] = React.useState([]);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.clients.list().then(list => {
      var prospects = (list || []).filter(p => (p.status || "prospect") === "prospect");
      var clients = (list || []).filter(p => p.status === "client");
      setLocalProspects(prospects);
      setSupaClients(clients);
    }).catch(() => {});
  }, []);

  // Auto-scroll vers la section ciblée par le hash URL (Comptes, Contacts, Activités)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    var scrollToHash = () => {
      var h = window.location.hash || "";
      // Mappe les anciens #comptes/#contacts/#actions vers les vrais IDs DOM
      var mapping = {
        "#comptes": "comptes-section",
        "#contacts": "comptes-section",
        "#actions": "actions-section",
        "#comptes-section": "comptes-section",
        "#actions-section": "actions-section"
      };
      var targetId = mapping[h];
      if (!targetId) return;
      setTimeout(() => {
        var el = document.getElementById(targetId);
        if (el) el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  // Fusionne les deux sources en évitant les doublons par id
  var ids = new Set();
  var merged = [];
  for (var p of localProspects) {
    if (!ids.has(p.id)) {
      ids.add(p.id);
      merged.push({
        ...p,
        _source: "local"
      });
    }
  }
  for (var c of supaClients) {
    if (!ids.has(c.id)) {
      ids.add(c.id);
      merged.push({
        ...c,
        _source: "supabase",
        raison_sociale: c.name,
        ville: c.city,
        secteur: c.industry,
        site_web: c.website
      });
    }
  }

  // Filtrage live
  var q = search.trim().toLowerCase();
  var filtered = q ? merged.filter(c => [c.raison_sociale, c.ville, c.siren, c.secteur, c.site_web].some(v => String(v || "").toLowerCase().includes(q))) : merged;
  return /*#__PURE__*/React.createElement("section", {
    id: "comptes-section",
    style: {
      background: "#fff",
      borderTop: "1px solid #eef1f5",
      padding: "20px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
      flexWrap: "wrap",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Comptes & contacts"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      marginTop: 2
    }
  }, merged.length, " compte", merged.length > 1 ? "s" : "", " (", localProspects.length, " cr\xE9\xE9", localProspects.length > 1 ? "s" : "", " r\xE9cemment \xB7 ", supaClients.length, " en base)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 320
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Rechercher (raison sociale, ville, SIREN\u2026)",
    style: {
      width: "100%",
      padding: "8px 12px 8px 32px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      outline: "none",
      background: "#fff",
      boxSizing: "border-box"
    }
  })), /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      padding: "8px 14px",
      background: "#4f46e5",
      color: "#fff",
      borderRadius: 8,
      fontSize: 12.5,
      fontWeight: 600,
      textDecoration: "none",
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, "+ Nouveau prospect"))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px 24px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 13,
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px dashed #e2e8f0"
    }
  }, merged.length === 0 ? "Aucun compte pour l'instant. Créez votre premier prospect via le bouton ci-dessus." : "Aucun compte ne correspond à la recherche.") : (() => {
    var isProspect = c => c._source === "local" || c.status && /prospect|nouveau/i.test(c.status);
    var prospects = filtered.filter(isProspect);
    var clients = filtered.filter(c => !isProspect(c));
    var cardStyle = {
      display: "block",
      padding: 14,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer",
      transition: "border-color 120ms"
    };
    var renderCard = c => /*#__PURE__*/React.createElement("a", {
      key: c.id,
      href: `/fiche-client?id=${encodeURIComponent(c.id)}`,
      style: cardStyle
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, c.raison_sociale || c.name || "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 3
      }
    }, c.secteur || "Secteur non renseigné", c.ville && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 \uD83D\uDCCD ", c.ville)), c.siren && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 2,
        fontVariantNumeric: "tabular-nums"
      }
    }, "SIREN ", c.siren)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 999,
        fontWeight: 700,
        background: isProspect(c) ? "#fef3c7" : "#dcfce7",
        color: isProspect(c) ? "#78350f" : "#065f46",
        textTransform: "uppercase",
        letterSpacing: 0.4
      }
    }, isProspect(c) ? "Prospect" : "Client")), c.contact_principal && (c.contact_principal.prenom || c.contact_principal.nom) && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid #f1f5f9",
        fontSize: 12,
        color: "#475569"
      }
    }, "\uD83D\uDC64 ", c.contact_principal.prenom, " ", c.contact_principal.nom, c.contact_principal.fonction && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, " \xB7 ", c.contact_principal.fonction)));
    var bandHeader = (label, count, color, bg) => /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color,
        background: bg,
        padding: "3px 9px",
        borderRadius: 999,
        letterSpacing: 0.3,
        textTransform: "uppercase"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#64748b"
      }
    }, count, " ", label === "Clients" ? "client" : "prospect", count > 1 ? "s" : ""));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", null, bandHeader("Prospects", prospects.length, "#78350f", "#fef3c7"), prospects.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        color: "#94a3b8",
        fontSize: 12.5,
        fontStyle: "italic",
        background: "#fffbeb",
        borderRadius: 10,
        border: "1px dashed #fcd34d"
      }
    }, "Aucun prospect \xE0 afficher.") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 10
      }
    }, prospects.map(renderCard))), /*#__PURE__*/React.createElement("div", null, bandHeader("Clients", clients.length, "#065f46", "#dcfce7"), clients.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        color: "#94a3b8",
        fontSize: 12.5,
        fontStyle: "italic",
        background: "#f0fdf4",
        borderRadius: 10,
        border: "1px dashed #86efac"
      }
    }, "Aucun client \xE0 afficher.") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 10
      }
    }, clients.map(renderCard))));
  })());
};
window.CRMAccountsList = CRMAccountsList;

// ───── Sous-composant : Actions à mener (vue commerciale globale)
var CRMActionsList = () => {
  var [actions, setActions] = React.useState([]);
  var load = React.useCallback(() => {
    if (!window.api) return;
    window.api.actions.list({
      status: "todo"
    }).then(rows => {
      setActions((rows || []).map(a => ({
        id: a.id,
        client_id: a.client_id,
        priority: a.priority || "moyenne",
        overdue: false,
        icon: a.icon || (a.type === "call" ? "📞" : a.type === "email" ? "✉" : a.type === "rdv" ? "📅" : "✓"),
        title: a.title || "",
        due: a.due_text || a.due || "",
        assigned: a.assigned_to || a.assigned || "Vous",
        color: "#3730a3",
        meta: a.meta || "",
        tag: a.tag || ""
      })));
    }).catch(() => {});
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  var prioMeta = {
    haute: {
      label: "Haute",
      color: "#dc2626",
      bg: "#fdecec"
    },
    moyenne: {
      label: "Moyenne",
      color: "#ea580c",
      bg: "#fef0e6"
    },
    basse: {
      label: "Basse",
      color: "#475569",
      bg: "#eef1f5"
    },
    ai: {
      label: "IA",
      color: "#fff",
      bg: "#0f172a"
    }
  };
  var [filter, setFilter] = React.useState("all");
  var filtered = filter === "all" ? actions : actions.filter(a => a.priority === filter);
  var counts = {
    all: actions.length,
    haute: actions.filter(a => a.priority === "haute").length,
    moyenne: actions.filter(a => a.priority === "moyenne").length,
    basse: actions.filter(a => a.priority === "basse").length,
    ai: actions.filter(a => a.priority === "ai").length
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "actions-section",
    style: {
      background: "#fafbfc",
      borderTop: "1px solid #eef1f5",
      padding: "20px 24px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
      flexWrap: "wrap",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Actions \xE0 mener"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      marginTop: 2
    }
  }, actions.length, " action", actions.length > 1 ? "s" : "", " commerciale", actions.length > 1 ? "s" : "", " en file \u2014 tri\xE9es par priorit\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, [{
    k: "all",
    label: "Toutes",
    c: counts.all
  }, {
    k: "haute",
    label: "Haute",
    c: counts.haute
  }, {
    k: "moyenne",
    label: "Moyenne",
    c: counts.moyenne
  }, {
    k: "basse",
    label: "Basse",
    c: counts.basse
  }, {
    k: "ai",
    label: "★ IA",
    c: counts.ai
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setFilter(t.k),
    style: {
      padding: "5px 10px",
      border: "1px solid " + (filter === t.k ? "#0f172a" : "#e2e8f0"),
      background: filter === t.k ? "#0f172a" : "#fff",
      color: filter === t.k ? "#fff" : "#475569",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 4,
      fontWeight: 700,
      opacity: 0.7
    }
  }, t.c))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, filtered.map((a, i) => {
    var pm = prioMeta[a.priority] || prioMeta.basse;
    // Icône cliquable selon le type d'action :
    //   email → mailto: (Outlook/webmail par défaut OS)
    //   appel → 3CX Web Client dialer
    //   rdv   → Outlook Calendar deeplink
    var tagL = (a.tag || "").toLowerCase();
    var titleL = (a.title || "").toLowerCase();
    var isEmail = tagL === "email" || titleL.includes("email") || a.icon === "✉" || a.icon === "📧";
    var isCall = tagL === "appel" || tagL === "call" || titleL.includes("appel") || titleL.includes("relance") || a.icon === "📞" || a.icon === "☎";
    var isMeeting = tagL === "rdv" || tagL === "visio" || titleL.includes("rdv") || titleL.includes("rendez-vous") || a.icon === "📅" || a.icon === "🗓" || a.icon === "💻";
    var actionable = isEmail || isCall || isMeeting;
    var iconBaseStyle = {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: "#f8fafc",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      flexShrink: 0
    };
    var fetchClientCtx = async () => {
      if (!a.client_id || !window.api) return {
        contact: null,
        client: null
      };
      try {
        var [conts, client] = await Promise.all([window.api.contacts.list({
          client_id: a.client_id
        }), window.api.clients.getById(a.client_id)]);
        var contact = (conts || []).find(c => c.is_principal) || (conts || [])[0] || null;
        return {
          contact,
          client
        };
      } catch (e) {
        return {
          contact: null,
          client: null
        };
      }
    };
    var handleIconClick = async e => {
      e.stopPropagation();
      if (!actionable) return;
      var {
        contact,
        client
      } = await fetchClientCtx();
      if (isEmail) {
        var email = contact && contact.email || client && client.email || "";
        if (!email) {
          if (window.HubToast) window.HubToast.warn("Aucun email — ouvre la fiche client pour ajouter un contact");
          return;
        }
        var lastName = (contact && contact.nom || "").trim();
        var body = ["Bonjour Madame, Monsieur" + (lastName ? " " + lastName : "") + ",", "", "Suite à notre entretien vous pouvez trouver ci-joint la plaquette de notre entreprise en pièce jointe."].join("\n");
        // Téléchargement local de la plaquette → l'utilisateur la
        // glisse dans son mail (mailto: ne supporte pas les pièces
        // jointes, contrainte sécurité navigateur)
        var link = document.createElement("a");
        link.href = "/assets/Plaquette-Astorya.pdf";
        link.download = "Plaquette-Astorya.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.location.href = "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent("Prise de contact - Plaquette Astorya") + "&body=" + encodeURIComponent(body);
        if (window.HubToast) window.HubToast.success("📎 Plaquette téléchargée — glisse-la dans le mail");
        return;
      }
      if (isCall) {
        var phone = contact && contact.phone || client && client.phone || "";
        if (!phone) {
          if (window.HubToast) window.HubToast.warn("Aucun téléphone — ouvre la fiche client pour ajouter un contact");
          return;
        }
        var tel = phone.replace(/[^\d+]/g, "");
        var supa = window.HubSupabase && window.HubSupabase.client;
        var launch = server => {
          var url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
          window.open(url, "3cx-webclient");
          if (window.HubToast) window.HubToast.info("📞 Appel via 3CX");
        };
        if (supa) {
          supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle().then(({
            data
          }) => launch(data && data.value)).catch(() => launch(null));
        } else {
          launch(null);
        }
        return;
      }
      if (isMeeting) {
        var attendeeEmail = contact && contact.email || "";
        var clientName = client && (client.raison_sociale || client.name) || "";
        var tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
        tomorrow.setHours(9, 0, 0, 0);
        var end = new Date(tomorrow.getTime() + 60 * 60 * 1000);
        var toIso = d => d.toISOString().replace(/\.\d{3}Z$/, "Z");
        var subject = (a.title || "Rendez-vous") + (clientName ? " — " + clientName : "");
        var params = new URLSearchParams({
          subject,
          body: a.meta || "Préparé via Hub Astorya",
          startdt: toIso(tomorrow),
          enddt: toIso(end),
          path: "/calendar/action/compose",
          rru: "addevent"
        });
        if (attendeeEmail) params.set("to", attendeeEmail);
        window.open("https://outlook.office.com/calendar/0/deeplink/compose?" + params.toString(), "_blank", "noopener");
        if (window.HubToast) window.HubToast.info("📅 RDV — Outlook ouvert");
        return;
      }
    };
    var iconEl = actionable ? /*#__PURE__*/React.createElement("button", {
      onClick: handleIconClick,
      title: isEmail ? "Envoyer un email" : isCall ? "Lancer l'appel via 3CX" : "Créer le RDV Outlook",
      style: {
        ...iconBaseStyle,
        border: 0,
        cursor: "pointer",
        transition: "transform 120ms"
      },
      onMouseEnter: e => e.currentTarget.style.transform = "scale(1.1)",
      onMouseLeave: e => e.currentTarget.style.transform = "scale(1)"
    }, a.icon) : /*#__PURE__*/React.createElement("span", {
      style: iconBaseStyle
    }, a.icon);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: a.overdue ? "#fff7ed" : "#fff",
        border: "1px solid " + (a.overdue ? "#fdba74" : "#e2e8f0"),
        borderRadius: 10
      }
    }, iconEl, /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        color: pm.color,
        background: pm.bg,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        flexShrink: 0
      }
    }, a.overdue ? "⚠ EN RETARD" : pm.label), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, a.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 2
      }
    }, a.meta)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: a.overdue ? "#c2410c" : "#475569",
        fontWeight: 600
      }
    }, a.due), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: a.color,
        fontWeight: 600
      }
    }, a.assigned)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        padding: "2px 7px",
        background: "#eef2ff",
        color: "#3730a3",
        borderRadius: 4,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums"
      }
    }, a.tag), /*#__PURE__*/React.createElement("button", {
      onClick: async () => {
        if (!a.id) return;
        try {
          await window.api.actions.complete(a.id);
          load();
        } catch (e) {}
      },
      style: {
        padding: "5px 9px",
        background: "#10b981",
        color: "#fff",
        border: 0,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap"
      }
    }, "\u2713 Traiter"));
  })));
};
window.CRMActionsList = CRMActionsList;
window.CRMPipeline = CRMPipeline;