// Module Administration — Gestion utilisateurs, groupes et accès aux tuiles
// Les groupes et l'identité active sont persistés via window.HubAccess (localStorage).

const UserManagement = () => {
  // Données partagées avec l'Accueil ERP
  const subscribeStore = React.useCallback(fn => window.HubAccess.subscribe(fn), []);
  const persistedGroups = React.useSyncExternalStore(subscribeStore, () => window.HubAccess.loadGroups());
  const activeGroupId = React.useSyncExternalStore(subscribeStore, () => window.HubAccess.getActiveGroupId());
  const currentUser = React.useSyncExternalStore(subscribeStore, () => window.HubAccess.getCurrentUser());
  const [selectedGroupId, setSelectedGroupId] = React.useState(() => persistedGroups[0]?.id || "admin");
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(null);
  const flashTimer = React.useRef(null);
  const flash = text => {
    setSavedFlash(text);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(null), 1800);
  };
  const updateGroupAccess = (groupId, mutator) => {
    const next = persistedGroups.map(g => {
      if (g.id !== groupId) return g;
      const access = mutator(g.access);
      return {
        ...g,
        access
      };
    });
    window.HubAccess.saveGroups(next);
  };
  const toggleTile = (groupId, key) => {
    updateGroupAccess(groupId, access => {
      const set = new Set(access);
      if (set.has(key)) set.delete(key);else set.add(key);
      return Array.from(set);
    });
    flash("Accès mis à jour");
  };
  const Avatar = ({
    name,
    size = 24,
    color
  }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = {
      K: "#6366f1",
      L: "#0ea5e9",
      T: "#f59e0b",
      S: "#10b981",
      C: "#ef4444",
      M: "#a855f7",
      N: "#ec4899",
      E: "#14b8a6",
      A: "#dc2626",
      J: "#8b5cf6",
      P: "#0891b2",
      R: "#f97316",
      D: "#84cc16",
      F: "#4f46e5",
      H: "#475569",
      O: "#0e7a55",
      V: "#b45309"
    };
    const bg = color || palette[initials[0]] || "#64748b";
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
        letterSpacing: 0.2,
        flexShrink: 0
      }
    }, initials);
  };

  // ───── modules ERP (mêmes clés que l'Accueil ERP)
  const modules = [{
    key: "crm",
    cat: "Commercial",
    title: "CRM",
    color: "#4f46e5",
    bg: "#eef2ff"
  }, {
    key: "intel",
    cat: "Commercial",
    title: "Intelligence concurrentielle",
    color: "#dc2626",
    bg: "#fdecec"
  }, {
    key: "marketing",
    cat: "Commercial",
    title: "Marketing & Campagnes",
    color: "#ec4899",
    bg: "#fdf2f8"
  }, {
    key: "tech",
    cat: "Production",
    title: "Support technique",
    color: "#0ea5e9",
    bg: "#e0f4fc"
  }, {
    key: "projects",
    cat: "Production",
    title: "Projets & Livrables",
    color: "#a855f7",
    bg: "#f5efff"
  }, {
    key: "inventory",
    cat: "Production",
    title: "Stock & Catalogue",
    color: "#0891b2",
    bg: "#cffafe"
  }, {
    key: "accounting",
    cat: "Finance",
    title: "Comptabilité",
    color: "#10b981",
    bg: "#e8f8f1"
  }, {
    key: "billing",
    cat: "Finance",
    title: "Facturation & Devis",
    color: "#f59e0b",
    bg: "#fef0e6"
  }, {
    key: "treasury",
    cat: "Finance",
    title: "Trésorerie",
    color: "#0e7a55",
    bg: "#d1fae5"
  }, {
    key: "hr",
    cat: "RH",
    title: "RH & Paie",
    color: "#8b5cf6",
    bg: "#f3e8ff"
  }, {
    key: "time",
    cat: "RH",
    title: "Temps & Activités",
    color: "#14b8a6",
    bg: "#ccfbf1"
  }, {
    key: "reports",
    cat: "Pilotage",
    title: "Rapports & BI",
    color: "#3730a3",
    bg: "#e0e7ff"
  }, {
    key: "settings",
    cat: "Pilotage",
    title: "Administration",
    color: "#64748b",
    bg: "#f1f3f6"
  }];
  const ALL = modules.map(m => m.key);
  const groups = persistedGroups;

  // ───── utilisateurs (avec leurs groupes)
  const users = [{
    name: "Nadia Lefèvre",
    email: "n.lefevre@astorya.fr",
    role: "Directrice technique",
    groups: ["admin", "direction"],
    status: "online",
    last: "il y a 3 min"
  }, {
    name: "Hugo Bertrand",
    email: "h.bertrand@astorya.fr",
    role: "IT Manager",
    groups: ["admin", "finance"],
    status: "online",
    last: "il y a 8 min"
  }, {
    name: "Catherine Marchand",
    email: "c.marchand@astorya.fr",
    role: "CEO",
    groups: ["direction"],
    status: "away",
    last: "il y a 1 h"
  }, {
    name: "Olivier Vasseur",
    email: "o.vasseur@astorya.fr",
    role: "COO",
    groups: ["direction", "ops"],
    status: "online",
    last: "à l'instant"
  }, {
    name: "Karim Ben Salah",
    email: "k.bensalah@astorya.fr",
    role: "AE Senior Cyber",
    groups: ["commercial"],
    status: "online",
    last: "il y a 12 min"
  }, {
    name: "Sophie Aubry",
    email: "s.aubry@astorya.fr",
    role: "AE & DRH",
    groups: ["direction", "rh"],
    status: "away",
    last: "il y a 2 h"
  }, {
    name: "Tom Verdier",
    email: "t.verdier@astorya.fr",
    role: "AE Hub",
    groups: ["commercial"],
    status: "online",
    last: "il y a 5 min"
  }, {
    name: "Émilie Garnier",
    email: "e.garnier@astorya.fr",
    role: "AE BENELUX",
    groups: ["commercial", "marketing"],
    status: "offline",
    last: "hier 18:42"
  }, {
    name: "Antoine Mercier",
    email: "a.mercier@astorya.fr",
    role: "AE DACH",
    groups: ["commercial"],
    status: "online",
    last: "il y a 22 min"
  }, {
    name: "Julien Pasquier",
    email: "j.pasquier@astorya.fr",
    role: "AE Suite",
    groups: ["commercial"],
    status: "online",
    last: "il y a 4 min"
  }, {
    name: "Marie Lopez",
    email: "m.lopez@astorya.fr",
    role: "AE UK & Marketing Ops",
    groups: ["commercial", "marketing"],
    status: "online",
    last: "il y a 18 min"
  }, {
    name: "Pierre Dubois",
    email: "p.dubois@astorya.fr",
    role: "Comptable senior",
    groups: ["finance"],
    status: "away",
    last: "il y a 45 min"
  }, {
    name: "Romain Faure",
    email: "r.faure@astorya.fr",
    role: "AE Junior · Support",
    groups: ["commercial", "support"],
    status: "online",
    last: "il y a 2 min"
  }, {
    name: "Léo Tanaka",
    email: "l.tanaka@astorya.fr",
    role: "Tech Lead Support",
    groups: ["support", "ops"],
    status: "online",
    last: "il y a 1 min"
  }, {
    name: "Diane Roussel",
    email: "d.roussel@astorya.fr",
    role: "Ingénieure support N2",
    groups: ["support", "ops"],
    status: "online",
    last: "il y a 7 min"
  }, {
    name: "Farid Belkacem",
    email: "f.belkacem@astorya.fr",
    role: "Technicien N1",
    groups: ["support"],
    status: "offline",
    last: "hier 17:10"
  }, {
    name: "Valérie Chen",
    email: "v.chen@astorya.fr",
    role: "DAF",
    groups: ["finance", "rh"],
    status: "online",
    last: "il y a 32 min"
  }];
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const statusColor = {
    online: "#10b981",
    away: "#f59e0b",
    offline: "#cbd5e1"
  };
  const groupChip = g => /*#__PURE__*/React.createElement("span", {
    key: g.id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: g.color + "15",
      color: g.color,
      border: `1px solid ${g.color}30`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: g.color
    }
  }), g.name);
  const Toggle = ({
    on
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 18,
      borderRadius: 999,
      background: on ? "#4f46e5" : "#e2e8f0",
      position: "relative",
      flexShrink: 0,
      transition: "background 120ms"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 2,
      left: on ? 14 : 2,
      width: 14,
      height: 14,
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.15)"
    }
  }));
  const accessSet = new Set(selectedGroup.access);
  const grantedCount = accessSet.size;
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: S.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...S.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Administration"))), /*#__PURE__*/React.createElement("button", {
    style: S.newBtn
  }, "+ Inviter un utilisateur ", /*#__PURE__*/React.createElement("span", {
    style: S.kbd
  }, "I")), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Navigation"), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u2302"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Accueil")), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u270E"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Ticketing")), /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Fiche client")), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "CRM"))), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Administration"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.navItem,
      ...S.navItemActive
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25D0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Groupes & acc\xE8s"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.navCount,
      background: "#3730a3",
      color: "#fff"
    }
  }, groups.length)), /*#__PURE__*/React.createElement("div", {
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25EF"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Utilisateurs"), /*#__PURE__*/React.createElement("span", {
    style: S.navCount
  }, users.length)), /*#__PURE__*/React.createElement("div", {
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25C7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Invitations"), /*#__PURE__*/React.createElement("span", {
    style: S.navCount
  }, "3")), /*#__PURE__*/React.createElement("div", {
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25D1"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "R\xF4les & permissions")), /*#__PURE__*/React.createElement("div", {
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25E7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "S\xE9curit\xE9 & SSO")), /*#__PURE__*/React.createElement("div", {
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25E8"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Audit & journal"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: 10,
      borderRadius: 8,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      fontSize: 11.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: 4
    }
  }, "17 utilisateurs actifs"), "14 en ligne \xB7 3 invitations en attente"), currentUser ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 8,
      background: "#fff",
      border: "1px solid #e2e8f0"
    }
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
    onClick: () => window.HubAccess.logout(),
    title: "Se d\xE9connecter",
    style: {
      background: "transparent",
      border: 0,
      color: "#94a3b8",
      fontSize: 14,
      cursor: "pointer",
      padding: 4
    }
  }, "\u23FB")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setLoginOpen(true),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "10px 12px",
      borderRadius: 8,
      background: "#0f172a",
      border: 0,
      color: "#fff",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\u2192 Se connecter")), /*#__PURE__*/React.createElement(LoginModal, {
    open: loginOpen,
    onClose: () => setLoginOpen(false)
  }), /*#__PURE__*/React.createElement("main", {
    style: S.main
  }, /*#__PURE__*/React.createElement("header", {
    style: S.header
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.breadcrumb
  }, "Administration ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .4,
      margin: "0 6px"
    }
  }, "/"), " Groupes & acc\xE8s"), /*#__PURE__*/React.createElement("div", {
    style: S.title
  }, "Gestion des groupes"), /*#__PURE__*/React.createElement("div", {
    style: S.subtitle
  }, "D\xE9finissez les modules ERP accessibles \xE0 chaque groupe. ", users.length, " utilisateurs r\xE9partis dans ", groups.length, " groupes.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 999,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Vue Accueil ERP comme"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: activeGroup.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "#0f172a"
    }
  }, activeGroup.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("a", {
    href: "./",
    style: {
      color: "#3730a3",
      fontWeight: 600,
      textDecoration: "none"
    }
  }, "Ouvrir \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (confirm("Réinitialiser tous les groupes et accès aux valeurs par défaut ?")) {
        window.HubAccess.resetAll();
        flash("Réinitialisé");
      }
    },
    style: S.btnGhost
  }, "\u27F2 R\xE9initialiser"), /*#__PURE__*/React.createElement("button", {
    style: S.btnGhost
  }, "\u27F3 Synchroniser SSO"), /*#__PURE__*/React.createElement("button", {
    style: S.btnPrimary
  }, "+ Nouveau groupe")))), /*#__PURE__*/React.createElement("div", {
    style: S.tabsRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.tab,
      ...S.tabActive
    }
  }, "Groupes ", /*#__PURE__*/React.createElement("span", {
    style: S.tabBadge
  }, groups.length)), /*#__PURE__*/React.createElement("div", {
    style: S.tab
  }, "Utilisateurs ", /*#__PURE__*/React.createElement("span", {
    style: S.tabBadge
  }, users.length)), /*#__PURE__*/React.createElement("div", {
    style: S.tab
  }, "Invitations ", /*#__PURE__*/React.createElement("span", {
    style: S.tabBadge
  }, "3")), /*#__PURE__*/React.createElement("div", {
    style: S.tab
  }, "Journal d'audit")), /*#__PURE__*/React.createElement("section", {
    style: S.splitRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.groupsCol
  }, /*#__PURE__*/React.createElement("div", {
    style: S.colHeader
  }, /*#__PURE__*/React.createElement("span", null, "Groupes"), /*#__PURE__*/React.createElement("input", {
    style: S.search,
    placeholder: "Rechercher\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, groups.map(g => {
    const active = g.id === selectedGroup.id;
    const isViewer = g.id === activeGroup.id;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      onClick: () => setSelectedGroupId(g.id),
      style: {
        ...S.groupItem,
        ...(active ? S.groupItemActive : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        background: g.color + "18",
        color: g.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0
      }
    }, g.name[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        color: "#0f172a"
      }
    }, g.name), isViewer && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "#10b981",
        background: "#dcfce7",
        padding: "1px 6px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: 0.3
      }
    }, "Vue actuelle")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, g.members.length, " membre", g.members.length > 1 ? "s" : "", " \xB7 ", g.access.length, "/", ALL.length, " modules")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        marginLeft: 4
      }
    }, g.members.slice(0, 3).map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: m,
      style: {
        marginLeft: i === 0 ? 0 : -6,
        border: "1.5px solid #fff",
        borderRadius: 999
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: m,
      size: 20
    }))), g.members.length > 3 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: -6,
        width: 20,
        height: 20,
        borderRadius: 999,
        background: "#f1f5f9",
        border: "1.5px solid #fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9.5,
        fontWeight: 700,
        color: "#475569"
      }
    }, "+", g.members.length - 3)));
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.detailCol
  }, /*#__PURE__*/React.createElement("div", {
    style: S.detailHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: selectedGroup.color + "18",
      color: selectedGroup.color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 800
    }
  }, selectedGroup.name[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, selectedGroup.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: selectedGroup.color,
      background: selectedGroup.color + "18",
      padding: "2px 8px",
      borderRadius: 999,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "actif")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      marginTop: 2,
      maxWidth: 560
    }
  }, selectedGroup.description))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, savedFlash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#10b981"
    }
  }, "\u2713 ", savedFlash), /*#__PURE__*/React.createElement("button", {
    style: S.btnGhost
  }, "Renommer"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.HubAccess.setActiveGroupId(selectedGroup.id),
    style: selectedGroup.id === activeGroup.id ? {
      ...S.btnGhost,
      color: "#10b981",
      borderColor: "#bbf7d0",
      background: "#f0fdf4"
    } : S.btnPrimary
  }, selectedGroup.id === activeGroup.id ? "✓ Connecté à l'Accueil ERP" : "↗ Voir l'Accueil comme ce groupe"))), /*#__PURE__*/React.createElement("div", {
    style: S.kpiRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Membres"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, selectedGroup.members.length)), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Modules autoris\xE9s"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, grantedCount, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "/ ", ALL.length))), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Derni\xE8re modification"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV,
    title: "Catherine Marchand \xB7 il y a 2 j"
  }, "il y a 2 j")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Connexions 7 j"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, "148"))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionHead
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionTitle
  }, "Membres du groupe"), /*#__PURE__*/React.createElement("button", {
    style: S.linkBtn
  }, "+ Ajouter un membre")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, selectedGroup.members.map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: S.memberChip
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500,
      color: "#1e293b"
    }
  }, m), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      cursor: "pointer"
    }
  }, "\xD7"))))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.sectionTitle
  }, "Acc\xE8s aux modules ERP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2
    }
  }, "Cochez les tuiles visibles depuis l'Accueil ERP pour ce groupe.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: S.linkBtn,
    onClick: () => {
      updateGroupAccess(selectedGroup.id, () => ALL.slice());
      flash("Tous les modules autorisés");
    }
  }, "Tout cocher"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("button", {
    style: S.linkBtn,
    onClick: () => {
      updateGroupAccess(selectedGroup.id, () => []);
      flash("Tous les modules retirés");
    }
  }, "Tout d\xE9cocher"))), [...new Set(modules.map(m => m.cat))].map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.catLabel
  }, cat), /*#__PURE__*/React.createElement("div", {
    style: S.tilesGrid
  }, modules.filter(m => m.cat === cat).map(m => {
    const on = accessSet.has(m.key);
    return /*#__PURE__*/React.createElement("div", {
      key: m.key,
      onClick: () => toggleTile(selectedGroup.id, m.key),
      style: {
        ...S.tile,
        ...(on ? S.tileOn : S.tileOff)
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: m.bg,
        color: m.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 700,
        flexShrink: 0,
        opacity: on ? 1 : 0.45
      }
    }, m.title[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: on ? "#0f172a" : "#94a3b8"
      }
    }, m.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 1
      }
    }, on ? "Visible sur l'Accueil" : "Masqué pour ce groupe")), /*#__PURE__*/React.createElement(Toggle, {
      on: on
    }));
  }))))))), /*#__PURE__*/React.createElement("section", {
    style: S.usersCard
  }, /*#__PURE__*/React.createElement("div", {
    style: S.colHeader
  }, /*#__PURE__*/React.createElement("span", null, "Tous les utilisateurs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: S.search,
    placeholder: "Filtrer par nom, email, groupe\u2026"
  }), /*#__PURE__*/React.createElement("button", {
    style: S.btnGhost
  }, "Filtres"))), /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Utilisateur"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "R\xF4le"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Groupes"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Derni\xE8re connexion"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, users.map(u => /*#__PURE__*/React.createElement("tr", {
    key: u.email,
    style: S.tr
  }, /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    size: 28
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 8,
      height: 8,
      borderRadius: 999,
      background: statusColor[u.status],
      border: "1.5px solid #fff"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8"
    }
  }, u.email)))), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "#475569"
    }
  }, u.role)), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4
    }
  }, u.groups.map(gid => {
    const g = groups.find(x => x.id === gid);
    return g ? groupChip(g) : null;
  }))), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: "#475569",
      textTransform: "capitalize"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: statusColor[u.status]
    }
  }), u.status === "online" ? "En ligne" : u.status === "away" ? "Absent" : "Hors ligne")), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      color: "#64748b",
      fontSize: 12
    }
  }, u.last), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: S.iconBtn
  }, "\u22EF")))))), /*#__PURE__*/React.createElement("div", {
    style: S.tableFoot
  }, /*#__PURE__*/React.createElement("div", null, "Affichage 1\u2013", users.length, " sur ", users.length, " utilisateurs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: S.pageBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.pageBtn,
      ...S.pageBtnActive
    }
  }, "1"), /*#__PURE__*/React.createElement("button", {
    style: S.pageBtn
  }, "\u203A"))))));
};

// ───────── STYLES
const S = {
  frame: {
    display: "flex",
    height: "100%",
    minHeight: 1900,
    background: "#f3f5f8",
    color: "#0f172a",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13
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
    minHeight: 1900
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 4px 8px"
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700
  },
  logoMark: {
    fontSize: 14,
    letterSpacing: -0.5
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    background: "rgba(255,255,255,.15)",
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10.5,
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
    padding: "6px 8px",
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
  bullet: {
    width: 14,
    display: "inline-flex",
    justifyContent: "center",
    fontSize: 12,
    color: "#94a3b8"
  },
  navCount: {
    fontSize: 10.5,
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#64748b",
    padding: "1px 7px",
    borderRadius: 999
  },
  main: {
    flex: 1,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16
  },
  breadcrumb: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 4
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    maxWidth: 720
  },
  btnPrimary: {
    padding: "8px 14px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnGhost: {
    padding: "8px 12px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  tabsRow: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0"
  },
  tab: {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  tabActive: {
    color: "#3730a3",
    fontWeight: 700,
    borderBottomColor: "#3730a3"
  },
  tabBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    background: "#eef2ff",
    color: "#3730a3",
    padding: "1px 7px",
    borderRadius: 999
  },
  splitRow: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 18,
    alignItems: "flex-start"
  },
  groupsCol: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden"
  },
  colHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 700
  },
  search: {
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    color: "#475569",
    background: "#f8fafc",
    outline: "none",
    width: 180
  },
  groupItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid #f1f5f9",
    cursor: "pointer"
  },
  groupItemActive: {
    background: "#f8faff",
    borderLeft: "3px solid #3730a3",
    paddingLeft: 11
  },
  detailCol: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18
  },
  detailHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #f1f5f9"
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10
  },
  kpi: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "10px 12px",
    border: "1px solid #eef2f7"
  },
  kpiK: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600
  },
  kpiV: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 4
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  linkBtn: {
    background: "transparent",
    border: 0,
    color: "#3730a3",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0
  },
  memberChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px 4px 4px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0"
  },
  catLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8
  },
  tilesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10
  },
  tile: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "background 120ms"
  },
  tileOn: {
    background: "#fff",
    borderColor: "#c7d2fe"
  },
  tileOff: {
    background: "#f8fafc",
    borderColor: "#eef2f7"
  },
  usersCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13
  },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9"
  },
  td: {
    padding: "10px 16px",
    verticalAlign: "middle"
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "transparent",
    border: "1px solid transparent",
    color: "#94a3b8",
    fontSize: 16,
    cursor: "pointer"
  },
  tableFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid #f1f5f9",
    fontSize: 12,
    color: "#64748b"
  },
  pageBtn: {
    padding: "4px 10px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer"
  },
  pageBtnActive: {
    background: "#3730a3",
    borderColor: "#3730a3",
    color: "#fff",
    fontWeight: 700
  }
};
window.UserManagement = UserManagement;