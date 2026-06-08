// Écran 1 — Liste des tickets (vue utilisateur final, helpdesk IT interne)

var TicketList = () => {
  // ───── Hotline CTI : popup déclenchée par un appel entrant (simulé en démo,
  // brancher sur le webhook 3CX en prod). Cycle séquentiel des 4 scénarios.
  var [activeCall, setActiveCall] = React.useState(null);
  var [callIdx, setCallIdx] = React.useState(0);
  var [lastCreated, setLastCreated] = React.useState(null);
  var callers = typeof window !== "undefined" && window.HOTLINE_DEMO_CALLERS || [];
  var simulateCall = () => {
    if (!callers.length) return;
    setActiveCall(callers[callIdx % callers.length]);
    setCallIdx(i => i + 1);
  };
  var handleCreateTicket = ticket => {
    setLastCreated(ticket);
    setTimeout(() => setLastCreated(null), 6000);
  };

  // ───── Création d'un nouveau ticket : ouvre la modale complète
  // Auto-ouverture si URL contient ?new=1 (depuis le bouton de la fiche détail)
  var [newTicketOpen, setNewTicketOpen] = React.useState(() => {
    if (typeof window === "undefined") return false;
    var sp = new URLSearchParams(window.location.search);
    return sp.get("new") === "1" || !!sp.get("client");
  });
  var newTicketPrefill = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    var sp = new URLSearchParams(window.location.search);
    return sp.get("client") ? {
      client_id: sp.get("client")
    } : null;
  }, []);
  var openNewTicket = () => setNewTicketOpen(true);

  // ───── Sélection d'un ticket : ouvre la fiche détail (auto-ouvre si ?id= dans l'URL)
  var [selectedTicketId, setSelectedTicketId] = React.useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("id") || null;
  });

  // ───── Filtre actif sur la liste : { kind, value }
  // Lu depuis l'URL au montage (ex. /ticketing?status=open ou ?assignee=me)
  var initialFilter = (() => {
    if (typeof window === "undefined") return {
      kind: "all",
      value: null
    };
    var sp = new URLSearchParams(window.location.search);
    if (sp.get("status")) return {
      kind: "status",
      value: sp.get("status")
    };
    if (sp.get("priority")) return {
      kind: "priority",
      value: sp.get("priority")
    };
    if (sp.get("category")) return {
      kind: "category",
      value: sp.get("category")
    };
    if (sp.get("assignee")) return {
      kind: "assignee",
      value: sp.get("assignee") === "me" ? window.HubAccess?.getCurrentUser()?.name || "__unassigned__" : sp.get("assignee")
    };
    if (sp.get("escalated")) return {
      kind: "escalated",
      value: null
    };
    if (sp.get("lifecycle")) return {
      kind: "lifecycle",
      value: sp.get("lifecycle")
    };
    if (sp.get("billable")) return {
      kind: "billable",
      value: null
    };
    return {
      kind: "all",
      value: null
    };
  })();
  var [filter, setFilterRaw] = React.useState(initialFilter);
  var setFilter = f => {
    setFilterRaw(f);
    setPage(1);
  };
  var isFilterActive = (kind, value) => filter.kind === kind && (value === undefined || filter.value === value);
  var setFilterIfDifferent = (kind, value) => {
    if (isFilterActive(kind, value)) setFilter({
      kind: "all",
      value: null
    });else setFilter({
      kind,
      value
    });
  };

  // ───── Recherche libre, tri et pagination
  var [searchText, setSearchText] = React.useState("");
  var [sortBy, setSortBy] = React.useState({
    field: "updated",
    dir: "desc"
  });
  var [page, setPage] = React.useState(1);
  var PAGE_SIZE = 13;
  var toggleSort = field => setSortBy(s => s.field === field ? {
    field,
    dir: s.dir === "asc" ? "desc" : "asc"
  } : {
    field,
    dir: "asc"
  });
  var exportCsv = () => {
    var rows = [["ID", "Client", "Sujet", "Statut", "Priorité", "Catégorie", "Assigné", "SLA", "Mise à jour"]];
    tickets.forEach(t => rows.push([t.id, t.client?.name || "", t.title, t.status, t.prio, t.cat, t.assignee?.name || "Non assigné", t.sla?.left || "", t.updated]));
    var csv = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    var blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ───── Menu utilisateur (pied de sidebar)
  var [userMenuOpen, setUserMenuOpen] = React.useState(false);
  var handleLogout = () => {
    if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout();
    setUserMenuOpen(false);
  };
  var handleTicketCreated = ticket => {
    setLastCreated({
      ticketId: ticket.id,
      client: ticket.client_id || "—",
      subject: ticket.title || ticket.subject || "",
      localOnly: ticket._localOnly,
      reason: ticket._reason
    });
    setTimeout(() => setLastCreated(null), 8000);
  };

  // ───── Données live depuis Supabase si configuré, sinon fallback inline
  var dataEnabled = typeof window !== "undefined" && window.HubData && window.HubData.enabled();
  var [liveTickets, setLiveTickets] = React.useState(null);
  React.useEffect(() => {
    if (!dataEnabled) return;
    var cancelled = false;
    var load = async () => {
      var {
        data,
        error
      } = await window.HubData.fetchTickets({
        limit: 50
      });
      if (cancelled || error) return;
      // Transforme le shape Supabase → shape attendu par le rendu existant
      setLiveTickets((data || []).map(mapSupaTicket));
    };
    load();
    var off = window.HubData.subscribeChanges(load);
    return () => {
      cancelled = true;
      off && off();
    };
  }, [dataEnabled]);
  var tickets = liveTickets || [{
    id: "REQ-1198",
    client: {
      name: "AXA Wealth France",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 28 fév. 2027"
    },
    title: "Arrivée Lucas Bernard — création comptes & matériel",
    status: "open",
    prio: "haute",
    cat: "Gestion comptes RH · Onboarding",
    lifecycle: "onboarding",
    billable: true,
    billableNote: "Prestation hors contrat de maintenance — facturée 380 € HT",
    assignee: {
      name: "Équipe IT",
      team: "Pool"
    },
    opened: "il y a 1 h",
    updated: "il y a 18 min",
    sla: {
      left: "2 j 06 h",
      risk: "ok"
    },
    msgs: 2,
    unread: 1,
    hasAttach: false,
    isNew: true
  }, {
    id: "REQ-1197",
    client: {
      name: "Crédit Agricole Sud",
      maintenance: "none",
      contract: "Aucun contrat actif — intervention facturable"
    },
    title: "Départ Élise Chevalier — désactivation comptes & restitution",
    status: "in_progress",
    prio: "normale",
    cat: "Gestion comptes RH · Offboarding",
    lifecycle: "offboarding",
    billable: true,
    billableNote: "Prestation facturée 240 € HT (extinction AD + Microsoft 365 + restitution)",
    assignee: {
      name: "Sophie Aubry",
      team: "Sécurité"
    },
    opened: "il y a 4 h",
    updated: "il y a 1 h",
    sla: {
      left: "4 h 12",
      risk: "warn"
    },
    msgs: 3,
    unread: 0,
    hasAttach: true
  }, {
    id: "INC-2841",
    client: {
      name: "MAIF Innovation",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 31 déc. 2026"
    },
    title: "Imprimante 3e étage en erreur PCL",
    status: "in_progress",
    prio: "haute",
    cat: "Matériel · Imprimante",
    assignee: {
      name: "Karim Ben Salah",
      team: "Support N1"
    },
    opened: "il y a 2 h",
    updated: "il y a 12 min",
    sla: {
      left: "3 h 48",
      risk: "ok"
    },
    msgs: 4,
    unread: 2,
    hasAttach: true
  }, {
    id: "INC-2840",
    client: {
      name: "AXA Wealth France",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 28 fév. 2027"
    },
    title: "Impossible d'accéder à SharePoint Direction",
    title2: "Erreur 403 depuis ce matin sur tous les navigateurs",
    status: "open",
    prio: "critique",
    cat: "Accès & Droits",
    assignee: null,
    opened: "il y a 28 min",
    updated: "il y a 9 min",
    sla: {
      left: "47 min",
      risk: "warn"
    },
    msgs: 1,
    unread: 0,
    hasAttach: false,
    isNew: true,
    escalated: {
      to: "Léa Marchand",
      group: "Supervision",
      at: "il y a 14 min",
      reason: "Aucune réponse sous 15 min sur ticket critique — escalade automatique"
    }
  }, {
    id: "REQ-1192",
    client: {
      name: "Crédit Agricole Sud",
      maintenance: "none",
      contract: "Aucun contrat actif — intervention facturable"
    },
    title: "Demande d'installation d'AutoCAD 2025",
    status: "waiting",
    prio: "normale",
    cat: "Logiciel · Installation",
    assignee: {
      name: "Léa Marchand",
      team: "Support N2"
    },
    opened: "il y a 1 j",
    updated: "il y a 4 h",
    sla: {
      left: "1 j 02 h",
      risk: "ok"
    },
    msgs: 6,
    unread: 0,
    hasAttach: true,
    waiting: "Validation manager"
  }, {
    id: "INC-2837",
    client: {
      name: "AXA Wealth France",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 28 fév. 2027"
    },
    title: "VPN se déconnecte toutes les 10 min",
    status: "in_progress",
    prio: "haute",
    cat: "Réseau · VPN",
    assignee: {
      name: "Tom Verdier",
      team: "Support N2"
    },
    opened: "il y a 1 j",
    updated: "il y a 35 min",
    sla: {
      left: "00 h 22",
      risk: "danger"
    },
    msgs: 11,
    unread: 1,
    hasAttach: true,
    escalated: {
      to: "Léa Marchand",
      group: "Supervision",
      at: "il y a 35 min",
      reason: "SLA résolution < 30 min — escalade manuelle par Tom Verdier"
    }
  }, {
    id: "INC-2833",
    client: {
      name: "Allianz France",
      maintenance: "expiring",
      contract: "Standard 9-18h · expire le 12 juil. 2026 (46 j)"
    },
    title: "Outlook : pièces jointes >25 Mo bloquées",
    status: "in_progress",
    prio: "normale",
    cat: "Messagerie",
    assignee: {
      name: "Karim Ben Salah",
      team: "Support N1"
    },
    opened: "il y a 2 j",
    updated: "hier",
    sla: {
      left: "5 h 10",
      risk: "ok"
    },
    msgs: 3,
    unread: 0,
    hasAttach: false
  }, {
    id: "REQ-1188",
    client: {
      name: "AXA Wealth France",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 28 fév. 2027"
    },
    title: "Nouveau poste — onboarding Camille Dufour",
    status: "open",
    prio: "normale",
    cat: "Gestion comptes RH · Onboarding",
    lifecycle: "onboarding",
    billable: true,
    billableNote: "Prestation hors contrat — facturée 380 € HT",
    assignee: {
      name: "Équipe IT",
      team: "Pool"
    },
    opened: "il y a 2 j",
    updated: "il y a 1 j",
    sla: {
      left: "2 j 04 h",
      risk: "ok"
    },
    msgs: 2,
    unread: 0,
    hasAttach: false
  }, {
    id: "INC-2829",
    client: {
      name: "BNP Paribas AM",
      maintenance: "none",
      contract: "Aucun contrat actif — intervention facturable"
    },
    title: "Écran secondaire non détecté sur dock Dell",
    status: "resolved",
    prio: "basse",
    cat: "Matériel · Périphérique",
    assignee: {
      name: "Léa Marchand",
      team: "Support N2"
    },
    opened: "il y a 3 j",
    updated: "il y a 6 h",
    sla: {
      left: "—",
      risk: "done"
    },
    msgs: 8,
    unread: 0,
    hasAttach: true
  }, {
    id: "INC-2826",
    client: {
      name: "La Banque Postale",
      maintenance: "active",
      contract: "Standard 9-18h · jusqu'au 30 sept. 2027"
    },
    title: "Téléphonie Teams — micro saturé en réunion",
    status: "resolved",
    prio: "normale",
    cat: "Téléphonie",
    assignee: {
      name: "Tom Verdier",
      team: "Support N2"
    },
    opened: "il y a 4 j",
    updated: "il y a 2 j",
    sla: {
      left: "—",
      risk: "done"
    },
    msgs: 5,
    unread: 0,
    hasAttach: false
  }, {
    id: "REQ-1180",
    client: {
      name: "AXA Wealth France",
      maintenance: "active",
      contract: "Premium 24/7 · jusqu'au 28 fév. 2027"
    },
    title: "Accès lecture base RH pour audit interne",
    status: "closed",
    prio: "normale",
    cat: "Accès & Droits",
    assignee: {
      name: "Sophie Aubry",
      team: "Sécurité"
    },
    opened: "il y a 6 j",
    updated: "il y a 3 j",
    sla: {
      left: "—",
      risk: "done"
    },
    msgs: 14,
    unread: 0,
    hasAttach: true
  }];

  // Ajoute aux compteurs de messages les commentaires stockés en localStorage
  // par ticket (mode démo, sans Supabase). Sans effet pour les tickets live
  // de Supabase qui ont déjà leur compteur via mapSupaTicket.
  if (!liveTickets) {
    try {
      for (var t of tickets) {
        var extra = JSON.parse(localStorage.getItem("hubAstorya.ticketMsgs.v1." + t.id) || "[]").length;
        if (extra) t.msgs = (t.msgs || 0) + extra;
      }
    } catch (e) {}
  }

  // Indicateur visuel du contrat de maintenance parc IT — green/amber/red.
  var maintMeta = {
    active: {
      color: "#10b981",
      soft: "#dcfce7",
      label: "Contrat actif",
      icon: "●"
    },
    expiring: {
      color: "#f59e0b",
      soft: "#fef3c7",
      label: "Contrat expire",
      icon: "●"
    },
    none: {
      color: "#dc2626",
      soft: "#fee2e2",
      label: "Pas de contrat",
      icon: "●"
    }
  };

  // Cycle de vie collaborateur — création/désactivation de comptes, facturable.
  var lifecycleMeta = {
    onboarding: {
      icon: "👤+",
      label: "Arrivée",
      color: "#0e7a55",
      soft: "#dcfce7",
      border: "#86efac"
    },
    offboarding: {
      icon: "👤−",
      label: "Départ",
      color: "#7c2d12",
      soft: "#ffedd5",
      border: "#fdba74"
    }
  };
  var billableCount = tickets.filter(t => t.billable).length;
  var onboardingCount = tickets.filter(t => t.lifecycle === "onboarding").length;
  var offboardingCount = tickets.filter(t => t.lifecycle === "offboarding").length;
  var escalatedCount = tickets.filter(t => t.escalated).length;
  var statusMeta = {
    open: {
      label: "Ouvert",
      dot: "#3b82f6",
      soft: "#eff4ff",
      text: "#1d4ed8"
    },
    in_progress: {
      label: "En cours",
      dot: "#a855f7",
      soft: "#f5efff",
      text: "#7e22ce"
    },
    waiting: {
      label: "En attente",
      dot: "#f59e0b",
      soft: "#fff6e6",
      text: "#a65f00"
    },
    resolved: {
      label: "Résolu",
      dot: "#10b981",
      soft: "#e8f8f1",
      text: "#0e7a55"
    },
    closed: {
      label: "Fermé",
      dot: "#94a3b8",
      soft: "#f1f3f6",
      text: "#475569"
    }
  };
  var prioMeta = {
    critique: {
      label: "Critique",
      color: "#dc2626",
      soft: "#fdecec"
    },
    haute: {
      label: "Haute",
      color: "#ea580c",
      soft: "#fef0e6"
    },
    normale: {
      label: "Normale",
      color: "#475569",
      soft: "#eef1f5"
    },
    basse: {
      label: "Basse",
      color: "#64748b",
      soft: "#f1f3f6"
    }
  };
  var slaColor = {
    ok: "#10b981",
    warn: "#f59e0b",
    danger: "#dc2626",
    done: "#94a3b8"
  };

  // counts
  // Identité utilisateur courant (pour filtre "Mes tickets")
  var [currentUserEmail, setCurrentUserEmail] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.auth) return;
    window.api.auth.getUser().then(u => {
      if (u) setCurrentUserEmail(u.email);
    }).catch(() => {});
  }, []);
  var isMyTicket = t => {
    if (!currentUserEmail) return false;
    var name = t.assignee && t.assignee.name || "";
    var email = t.assignee && t.assignee.email || "";
    return name === currentUserEmail || email === currentUserEmail || name.toLowerCase().split(" ")[0] === currentUserEmail.split("@")[0].toLowerCase();
  };
  var myCount = tickets.filter(isMyTicket).length;
  var counts = {
    all: tickets.length,
    mine: myCount,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    danger: tickets.filter(t => t.sla && t.sla.risk === "danger").length,
    escalated: tickets.filter(t => !!t.escalated).length
  };
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
      É: "#a855f7",
      C: "#ef4444"
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
        flexShrink: 0
      }
    }, initials);
  };

  // ───── Vue détail inline : si un ticket est sélectionné, on rend TicketDetail
  // à la place de la liste (même page, pas de modal par-dessus).
  if (selectedTicketId) {
    var selected = tickets.find(t => t.id === selectedTicketId) || {
      id: selectedTicketId
    };
    return /*#__PURE__*/React.createElement(TicketDetail, {
      ticketId: selectedTicketId,
      ticketData: selected,
      onBack: () => {
        setSelectedTicketId(null);
        if (window.HubData && window.HubData.invalidate) window.HubData.invalidate("tickets");
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: tlStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: tlStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...tlStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.logoMark
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
  }, "Support IT interne"))), /*#__PURE__*/React.createElement("button", {
    onClick: openNewTicket,
    style: tlStyles.newBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1
    }
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Nouveau ticket"), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navLabel
  }, "Navigation"), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...tlStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#94a3b8",
      fontSize: 11
    }
  }, "\u2302"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Accueil")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilter({
      kind: "all",
      value: null
    }),
    style: {
      ...tlStyles.navItem,
      ...(filter.kind === "all" ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: filter.kind === "all" ? "#4f46e5" : "#94a3b8",
      fontSize: 11
    }
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Tous les tickets"), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.navCount
  }, counts.all)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilterIfDifferent("assignee", "__me__"),
    style: {
      ...tlStyles.navItem,
      ...(isFilterActive("assignee", "__me__") ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: isFilterActive("assignee", "__me__") ? "#4f46e5" : "#94a3b8",
      fontSize: 11
    }
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Mes tickets"), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.navCount
  }, counts.mine)), /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client",
    style: {
      ...tlStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#94a3b8",
      fontSize: 11
    }
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Fiche client")), /*#__PURE__*/React.createElement("a", {
    href: "/administration-utilisateurs",
    style: {
      ...tlStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#94a3b8",
      fontSize: 11
    }
  }, "\u2699"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Administration"))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navLabel
  }, "Statuts"), [{
    k: "open",
    label: "Ouverts",
    c: counts.open
  }, {
    k: "in_progress",
    label: "En cours",
    c: counts.in_progress
  }, {
    k: "waiting",
    label: "En attente",
    c: counts.waiting
  }, {
    k: "resolved",
    label: "Résolus",
    c: counts.resolved
  }].map(n => {
    var active = isFilterActive("status", n.k);
    return /*#__PURE__*/React.createElement("div", {
      key: n.k,
      onClick: () => setFilterIfDifferent("status", n.k),
      style: {
        ...tlStyles.navItem,
        ...(active ? tlStyles.navItemActive : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        display: "flex",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: statusMeta[n.k].dot
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.label), /*#__PURE__*/React.createElement("span", {
      style: tlStyles.navCount
    }, n.c));
  }), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilterIfDifferent("escalated"),
    style: {
      ...tlStyles.navItem,
      ...(isFilterActive("escalated") ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    },
    title: "Tickets escalad\xE9s au groupe Administrateur \xB7 Supervision"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#7c3aed",
      fontWeight: 800
    }
  }, "\u2191")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Escalad\xE9s (supervision)"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...tlStyles.navCount,
      background: "#ede9fe",
      color: "#5b21b6",
      fontWeight: 700
    }
  }, escalatedCount))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navLabel
  }, "Cycle collaborateur"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilterIfDifferent("lifecycle", "onboarding"),
    style: {
      ...tlStyles.navItem,
      ...(isFilterActive("lifecycle", "onboarding") ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#0e7a55",
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uD83D\uDC64+"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Arriv\xE9es \xB7 onboarding"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...tlStyles.navCount,
      background: "#dcfce7",
      color: "#065f46"
    }
  }, onboardingCount)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilterIfDifferent("lifecycle", "offboarding"),
    style: {
      ...tlStyles.navItem,
      ...(isFilterActive("lifecycle", "offboarding") ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#7c2d12",
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uD83D\uDC64\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "D\xE9parts \xB7 offboarding"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...tlStyles.navCount,
      background: "#ffedd5",
      color: "#7c2d12"
    }
  }, offboardingCount)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilterIfDifferent("billable"),
    style: {
      ...tlStyles.navItem,
      ...(isFilterActive("billable") ? tlStyles.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: "#a16207",
      fontSize: 11
    }
  }, "\u20AC"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Prestations facturables"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...tlStyles.navCount,
      background: "#fef3c7",
      color: "#78350f"
    }
  }, billableCount))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.navLabel
  }, "Cat\xE9gories"), [{
    label: "Matériel",
    match: "Matériel"
  }, {
    label: "Logiciel",
    match: "Logiciel"
  }, {
    label: "Réseau & VPN",
    match: "Réseau"
  }, {
    label: "Accès & Droits",
    match: "Accès & Droits"
  }, {
    label: "Messagerie",
    match: "Messagerie"
  }].map(n => {
    var count = tickets.filter(t => (t.cat || "").toLowerCase().includes(n.match.toLowerCase())).length;
    var active = isFilterActive("category", n.match);
    return /*#__PURE__*/React.createElement("div", {
      key: n.label,
      onClick: () => setFilterIfDifferent("category", n.match),
      style: {
        ...tlStyles.navItem,
        ...(active ? tlStyles.navItemActive : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        color: "#cbd5e1",
        fontSize: 12
      }
    }, "\u2014"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.label), /*#__PURE__*/React.createElement("span", {
      style: tlStyles.navCount
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), (() => {
    var cu = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var nm = cu && cu.name || "Utilisateur";
    var rl = cu && cu.role || "—";
    return /*#__PURE__*/React.createElement("div", {
      onClick: () => setUserMenuOpen(v => !v),
      style: {
        ...tlStyles.userRow,
        cursor: "pointer",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: nm,
      size: 26,
      color: "#4f46e5"
    }), /*#__PURE__*/React.createElement("div", {
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
    }, nm), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, rl)), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8",
        fontSize: 14
      }
    }, "\u22EF"), userMenuOpen && /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,.12)",
        padding: 4,
        zIndex: 100
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "/administration-utilisateurs",
      style: {
        display: "block",
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 12.5,
        color: "#0f172a",
        textDecoration: "none",
        cursor: "pointer"
      }
    }, "\u2699 Mon profil & pr\xE9f\xE9rences"), /*#__PURE__*/React.createElement("a", {
      href: "/fiche-client",
      style: {
        display: "block",
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 12.5,
        color: "#0f172a",
        textDecoration: "none",
        cursor: "pointer"
      }
    }, "\u25C9 Voir ma fiche client"), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid #f1f5f9",
        margin: "4px 0"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: handleLogout,
      style: {
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 12.5,
        color: "#dc2626",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        fontWeight: 600
      }
    }, "\u23FB Se d\xE9connecter")));
  })()), /*#__PURE__*/React.createElement("main", {
    style: tlStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: tlStyles.topbar
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
  }, "Support IT"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Mes tickets"), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.totalChip
  }, tickets.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.search
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontSize: 12
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    placeholder: "Rechercher par sujet, ID, technicien\u2026",
    style: tlStyles.searchInput,
    value: searchText,
    onChange: e => {
      setSearchText(e.target.value);
      setPage(1);
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.kbdLight
  }, "\u2318K")), /*#__PURE__*/React.createElement("button", {
    onClick: simulateCall,
    title: "D\xE9clenche la popup hotline (en prod : webhook 3CX)",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 11px",
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#0e7a55",
      borderRadius: 8,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\uD83D\uDCDE"), "Simuler appel entrant", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginLeft: 4
    }
  }, callIdx % (callers.length || 1) + 1, "/", callers.length || 0)))), lastCreated && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 20px 0",
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 12.5,
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      background: lastCreated.localOnly ? "#fffbeb" : "#dcfce7",
      border: lastCreated.localOnly ? "1px solid #fde68a" : "1px solid #86efac",
      color: lastCreated.localOnly ? "#78350f" : "#065f46"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "\u2713 ", lastCreated.attached ? "Retranscription ajoutée au ticket " + lastCreated.ticketId : "Ticket " + lastCreated.ticketId + " créé"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.85
    }
  }, lastCreated.attached ? "(appel de " + lastCreated.client + ")" : "pour " + lastCreated.client + " — " + lastCreated.subject), lastCreated.localOnly && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11.5,
      fontWeight: 600,
      opacity: 0.9
    }
  }, lastCreated.reason === "rls" && "⚠ Local seulement — exécuter supabase/rls-anon.sql ou se connecter pour persister.", lastCreated.reason === "no-schema" && "⚠ Tables Supabase manquantes — exécuter supabase/schema.sql.", lastCreated.reason === "demo" && "⚠ Mode démo — Supabase non configuré.")), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: tlStyles.h1
  }, filter.kind === "all" ? "Tous les tickets" : filter.kind === "status" ? statusMeta[filter.value]?.label || "Tickets" : filter.kind === "assignee" && filter.value === "__me__" ? "Mes tickets" : filter.kind === "assignee" && filter.value === "__unassigned__" ? "Tickets non assignés" : filter.kind === "escalated" ? "Tickets escaladés" : filter.kind === "billable" ? "Prestations facturables" : filter.kind === "lifecycle" ? filter.value === "onboarding" ? "Onboarding" : "Offboarding" : "Tickets"), /*#__PURE__*/React.createElement("p", {
    style: tlStyles.h1sub
  }, counts.all === 0 ? "Aucun ticket pour l'instant." : `${counts.all} ticket${counts.all > 1 ? "s" : ""} au total · ${counts.danger} SLA à risque · ${counts.escalated} escaladé${counts.escalated > 1 ? "s" : ""}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: exportCsv,
    style: tlStyles.ghostBtn,
    title: "T\xE9l\xE9charger CSV de tous les tickets"
  }, "\u2193 Exporter"), /*#__PURE__*/React.createElement("button", {
    onClick: openNewTicket,
    style: tlStyles.primaryBtn
  }, "+ Nouveau ticket"))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.kpiStrip
  }, [{
    label: "Ouverts",
    value: counts.open,
    delta: "+1 cette semaine",
    color: "#3b82f6",
    click: () => setFilter({
      kind: "status",
      value: "open"
    })
  }, {
    label: "En cours",
    value: counts.in_progress,
    delta: "En traitement",
    color: "#a855f7",
    click: () => setFilter({
      kind: "status",
      value: "in_progress"
    })
  }, {
    label: "En attente",
    value: counts.waiting,
    delta: "Bloqués / validation",
    color: "#f59e0b",
    click: () => setFilter({
      kind: "status",
      value: "waiting"
    })
  }, {
    label: "SLA à risque",
    value: counts.danger,
    delta: counts.danger > 0 ? "Action requise" : "RAS",
    color: "#dc2626",
    click: () => {
      /* on filtre les tickets avec danger en localSearch */var dangerIds = tickets.filter(t => t.sla?.risk === "danger" || t.sla?.risk === "warn").map(t => t.id).join(" ");
      setSearchText(dangerIds);
    }
  }, {
    label: "Résolus",
    value: counts.resolved,
    delta: "Total résolus",
    color: "#10b981",
    click: () => setFilter({
      kind: "status",
      value: "resolved"
    })
  }].map(k => /*#__PURE__*/React.createElement("div", {
    key: k.label,
    onClick: k.click,
    style: {
      ...tlStyles.kpi,
      cursor: "pointer"
    },
    title: "Cliquer pour filtrer"
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
      fontSize: 24,
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
  }, k.delta)))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.filterBar
  }, /*#__PURE__*/React.createElement("div", {
    style: tlStyles.tabs
  }, [{
    k: "all",
    label: "Tous",
    c: counts.all
  }, {
    k: "open",
    label: "Ouverts",
    c: counts.open
  }, {
    k: "in_progress",
    label: "En cours",
    c: counts.in_progress
  }, {
    k: "waiting",
    label: "En attente",
    c: counts.waiting
  }, {
    k: "resolved",
    label: "Résolus",
    c: counts.resolved
  }, {
    k: "closed",
    label: "Fermés",
    c: tickets.filter(t => t.status === "closed").length
  }].map(t => {
    var active = t.k === "all" ? filter.kind === "all" : isFilterActive("status", t.k);
    return /*#__PURE__*/React.createElement("button", {
      key: t.k,
      onClick: () => t.k === "all" ? setFilter({
        kind: "all",
        value: null
      }) : setFilterIfDifferent("status", t.k),
      style: {
        ...tlStyles.tab,
        ...(active ? tlStyles.tabActive : {})
      }
    }, t.label, /*#__PURE__*/React.createElement("span", {
      style: {
        ...tlStyles.tabCount,
        ...(active ? tlStyles.tabCountActive : {})
      }
    }, t.c));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) setFilter({
        kind: "status",
        value: e.target.value
      });
      e.target.value = "";
    },
    style: {
      ...tlStyles.filterPill,
      padding: "4px 9px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Statut"), /*#__PURE__*/React.createElement("option", {
    value: "open"
  }, "Ouverts"), /*#__PURE__*/React.createElement("option", {
    value: "in_progress"
  }, "En cours"), /*#__PURE__*/React.createElement("option", {
    value: "waiting"
  }, "En attente"), /*#__PURE__*/React.createElement("option", {
    value: "resolved"
  }, "R\xE9solus"), /*#__PURE__*/React.createElement("option", {
    value: "closed"
  }, "Ferm\xE9s")), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) setFilter({
        kind: "priority",
        value: e.target.value
      });
      e.target.value = "";
    },
    style: {
      ...tlStyles.filterPill,
      padding: "4px 9px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Priorit\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "critique"
  }, "Critique"), /*#__PURE__*/React.createElement("option", {
    value: "haute"
  }, "Haute"), /*#__PURE__*/React.createElement("option", {
    value: "normale"
  }, "Normale"), /*#__PURE__*/React.createElement("option", {
    value: "basse"
  }, "Basse")), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) setFilter({
        kind: "category",
        value: e.target.value
      });
      e.target.value = "";
    },
    style: {
      ...tlStyles.filterPill,
      padding: "4px 9px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Cat\xE9gorie"), Array.from(new Set(tickets.map(t => t.cat).filter(Boolean))).map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) setFilter({
        kind: "assignee",
        value: e.target.value
      });
      e.target.value = "";
    },
    style: {
      ...tlStyles.filterPill,
      padding: "4px 9px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Assign\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "__unassigned__"
  }, "Non assign\xE9"), Array.from(new Set(tickets.map(t => t.assignee?.name).filter(Boolean))).map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n))), /*#__PURE__*/React.createElement("span", {
    style: tlStyles.divider
  }), /*#__PURE__*/React.createElement("select", {
    value: sortBy.field + ":" + sortBy.dir,
    onChange: e => {
      var [f, d] = e.target.value.split(":");
      setSortBy({
        field: f,
        dir: d
      });
    },
    style: {
      ...tlStyles.filterPill,
      padding: "4px 9px",
      cursor: "pointer"
    },
    title: "Trier"
  }, /*#__PURE__*/React.createElement("option", {
    value: "updated:desc"
  }, "\u2195 Derni\xE8re activit\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "updated:asc"
  }, "\u2191 Plus anciens d'abord"), /*#__PURE__*/React.createElement("option", {
    value: "id:asc"
  }, "ID croissant"), /*#__PURE__*/React.createElement("option", {
    value: "id:desc"
  }, "ID d\xE9croissant"), /*#__PURE__*/React.createElement("option", {
    value: "prio:asc"
  }, "Priorit\xE9 \u2191"), /*#__PURE__*/React.createElement("option", {
    value: "prio:desc"
  }, "Priorit\xE9 \u2193")))), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.tableHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...tlStyles.col,
      width: 18
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    readOnly: true,
    onClick: e => e.stopPropagation()
  })), [{
    field: "id",
    label: "Ref.",
    w: 92
  }, {
    field: "title",
    label: "Sujet",
    flex: 1
  }, {
    field: "status",
    label: "Statut",
    w: 110
  }, {
    field: "prio",
    label: "Priorité",
    w: 92
  }, {
    field: null,
    label: "Assigné à",
    w: 170
  }, {
    field: null,
    label: "SLA",
    w: 130
  }, {
    field: "updated",
    label: "Mise à jour",
    w: 110,
    right: true
  }].map(c => {
    var sortable = !!c.field;
    var active = sortBy.field === c.field;
    return /*#__PURE__*/React.createElement("div", {
      key: c.label,
      onClick: sortable ? () => toggleSort(c.field) : undefined,
      style: {
        ...tlStyles.col,
        ...(c.w ? {
          width: c.w
        } : {
          flex: c.flex
        }),
        textAlign: c.right ? "right" : "left",
        cursor: sortable ? "pointer" : "default",
        color: active ? "#3730a3" : undefined
      }
    }, c.label, sortable && active && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 4
      }
    }, sortBy.dir === "asc" ? "↑" : "↓"));
  })), filter.kind !== "all" && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 20px 0",
      padding: "8px 12px",
      background: "#eef2ff",
      border: "1px solid #c7d2fe",
      borderRadius: 8,
      fontSize: 12.5,
      color: "#3730a3",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "Filtre actif :"), /*#__PURE__*/React.createElement("span", null, filter.kind === "status" && /*#__PURE__*/React.createElement(React.Fragment, null, "statut ", /*#__PURE__*/React.createElement("strong", null, filter.value)), filter.kind === "escalated" && /*#__PURE__*/React.createElement(React.Fragment, null, "tickets escalad\xE9s \xE0 la supervision"), filter.kind === "lifecycle" && /*#__PURE__*/React.createElement(React.Fragment, null, filter.value === "onboarding" ? "arrivées (onboarding)" : "départs (offboarding)"), filter.kind === "billable" && /*#__PURE__*/React.createElement(React.Fragment, null, "prestations facturables"), filter.kind === "category" && /*#__PURE__*/React.createElement(React.Fragment, null, "cat\xE9gorie ", /*#__PURE__*/React.createElement("strong", null, filter.value))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilter({
      kind: "all",
      value: null
    }),
    style: {
      marginLeft: "auto",
      background: "transparent",
      border: 0,
      color: "#3730a3",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: 12
    }
  }, "\u2715 Retirer le filtre")), /*#__PURE__*/React.createElement("div", {
    style: tlStyles.rows
  }, (() => {
    var lower = searchText.trim().toLowerCase();
    var list = tickets.filter(t => {
      if (lower && !`${t.id} ${t.title} ${t.cat} ${t.client?.name || ""} ${t.assignee?.name || ""}`.toLowerCase().includes(lower)) return false;
      if (filter.kind === "all") return true;
      if (filter.kind === "status") return t.status === filter.value;
      if (filter.kind === "priority") return t.prio === filter.value;
      if (filter.kind === "assignee") {
        if (filter.value === "__unassigned__") return !t.assignee;
        if (filter.value === "__me__") return isMyTicket(t);
        return t.assignee?.name === filter.value;
      }
      if (filter.kind === "escalated") return !!t.escalated;
      if (filter.kind === "lifecycle") return t.lifecycle === filter.value;
      if (filter.kind === "billable") return !!t.billable;
      if (filter.kind === "category") return (t.cat || "").toLowerCase().includes(String(filter.value).toLowerCase());
      return true;
    });
    // Tri
    var cmp = (a, b) => {
      var f = sortBy.field;
      var va = f === "id" ? a.id : f === "title" ? a.title : f === "status" ? a.status : f === "prio" ? a.prio : f === "updated" ? a.updated : a.id;
      var vb = f === "id" ? b.id : f === "title" ? b.title : f === "status" ? b.status : f === "prio" ? b.prio : f === "updated" ? b.updated : b.id;
      var r = String(va || "").localeCompare(String(vb || ""));
      return sortBy.dir === "asc" ? r : -r;
    };
    list = list.slice().sort(cmp);
    // Pagination
    var start = (page - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  })().map((t, i) => {
    var sm = statusMeta[t.status];
    var pm = prioMeta[t.prio];
    var isHighlight = i === 3; // VPN row — SLA risk
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      onClick: e => {
        // Ne pas ouvrir si on a cliqué sur une checkbox
        if (e.target.tagName === "INPUT") return;
        setSelectedTicketId(t.id);
      },
      style: {
        ...tlStyles.row,
        ...(isHighlight ? tlStyles.rowDanger : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 18
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      readOnly: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 92
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, t.client && (() => {
      var m = maintMeta[t.client.maintenance];
      return /*#__PURE__*/React.createElement("span", {
        title: `${t.client.name} — ${m.label} (${t.client.contract})`,
        style: {
          width: 8,
          height: 8,
          borderRadius: 999,
          background: m.color,
          boxShadow: `0 0 0 2px ${m.soft}`,
          flexShrink: 0,
          cursor: "help"
        }
      });
    })(), /*#__PURE__*/React.createElement("span", {
      style: tlStyles.refMono
    }, t.id))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0
      }
    }, t.isNew && /*#__PURE__*/React.createElement("span", {
      style: tlStyles.newDot,
      title: "Non lu"
    }), t.escalated && /*#__PURE__*/React.createElement("span", {
      title: `Escaladé à ${t.escalated.to} (${t.escalated.group}) — ${t.escalated.at}\n${t.escalated.reason}`,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 800,
        color: "#fff",
        background: "#7c3aed",
        letterSpacing: 0.4,
        flexShrink: 0
      }
    }, "\u2191 ESCALAD\xC9"), t.lifecycle && (() => {
      var lm = lifecycleMeta[t.lifecycle];
      return /*#__PURE__*/React.createElement("span", {
        title: `Cycle collaborateur : ${lm.label} (création/désactivation de comptes)`,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "1px 7px",
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 800,
          color: lm.color,
          background: lm.soft,
          border: `1px solid ${lm.border}`,
          letterSpacing: 0.3,
          flexShrink: 0
        }
      }, lm.icon, " ", lm.label.toUpperCase());
    })(), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: t.unread ? 600 : 500,
        color: "#0f172a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, t.title), t.hasAttach && /*#__PURE__*/React.createElement("span", {
      style: tlStyles.metaIcon,
      title: "Pi\xE8ce jointe"
    }, "\uD83D\uDCCE"), t.unread > 0 && /*#__PURE__*/React.createElement("span", {
      style: tlStyles.unread
    }, t.unread)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 2,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap"
      }
    }, t.client && /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: "#475569"
      }
    }, t.client.name), t.client && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#cbd5e1"
      }
    }, "\xB7"), /*#__PURE__*/React.createElement("span", null, t.cat, " \xB7 ", t.msgs, " message", t.msgs > 1 ? "s" : ""), t.waiting && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#a65f00"
      }
    }, "\xB7 \u23F8 ", t.waiting))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 110
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...tlStyles.statusPill,
        background: sm.soft,
        color: sm.text
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: sm.dot
      }
    }), sm.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 92
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...tlStyles.prioPill,
        background: pm.soft,
        color: pm.color
      }
    }, t.prio === "critique" && "▲ ", t.prio === "haute" && "▲ ", pm.label), t.billable && /*#__PURE__*/React.createElement("span", {
      title: t.billableNote || "Prestation facturable",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 9.5,
        fontWeight: 700,
        color: "#78350f",
        background: "#fef3c7",
        border: "1px solid #fde68a",
        letterSpacing: 0.3,
        cursor: "help"
      }
    }, "\u20AC FACTURABLE"))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 170
      }
    }, t.assignee ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: t.assignee.name
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "#0f172a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, t.assignee.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, t.assignee.team))) : /*#__PURE__*/React.createElement("span", {
      style: tlStyles.unassigned
    }, "\u25CB Non assign\xE9")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 130
      }
    }, /*#__PURE__*/React.createElement(SLA, {
      bar: t.sla,
      color: slaColor[t.sla.risk]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tlStyles.col,
        width: 110,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#64748b"
      }
    }, t.updated)));
  })), (() => {
    var lower = searchText.trim().toLowerCase();
    var filteredCount = tickets.filter(t => {
      if (lower && !`${t.id} ${t.title} ${t.cat} ${t.client?.name || ""} ${t.assignee?.name || ""}`.toLowerCase().includes(lower)) return false;
      if (filter.kind === "all") return true;
      if (filter.kind === "status") return t.status === filter.value;
      if (filter.kind === "priority") return t.prio === filter.value;
      if (filter.kind === "assignee") {
        if (filter.value === "__unassigned__") return !t.assignee;
        if (filter.value === "__me__") return isMyTicket(t);
        return t.assignee?.name === filter.value;
      }
      if (filter.kind === "escalated") return !!t.escalated;
      if (filter.kind === "lifecycle") return t.lifecycle === filter.value;
      if (filter.kind === "billable") return !!t.billable;
      if (filter.kind === "category") return (t.cat || "").toLowerCase().includes(String(filter.value).toLowerCase());
      return true;
    }).length;
    var totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
    var start = (page - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, filteredCount);
    return /*#__PURE__*/React.createElement("div", {
      style: tlStyles.foot
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#64748b"
      }
    }, filteredCount === 0 ? "Aucun ticket" : `${start + 1}–${end} sur ${filteredCount} ticket${filteredCount > 1 ? "s" : ""}`, filter.kind !== "all" && /*#__PURE__*/React.createElement(React.Fragment, null, " (filtr\xE9 sur ", tickets.length, ")")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setPage(p => Math.max(1, p - 1)),
      disabled: page === 1,
      style: {
        ...tlStyles.filterPill,
        opacity: page === 1 ? 0.5 : 1,
        cursor: page === 1 ? "not-allowed" : "pointer"
      }
    }, "\u2039"), Array.from({
      length: Math.min(totalPages, 5)
    }, (_, i) => i + 1).map(n => /*#__PURE__*/React.createElement("button", {
      key: n,
      onClick: () => setPage(n),
      style: {
        ...tlStyles.filterPill,
        ...(page === n ? tlStyles.tabActive : {}),
        cursor: "pointer"
      }
    }, n)), /*#__PURE__*/React.createElement("button", {
      onClick: () => setPage(p => Math.min(totalPages, p + 1)),
      disabled: page === totalPages,
      style: {
        ...tlStyles.filterPill,
        opacity: page === totalPages ? 0.5 : 1,
        cursor: page === totalPages ? "not-allowed" : "pointer"
      }
    }, "\u203A")));
  })()), /*#__PURE__*/React.createElement(HotlinePopup, {
    call: activeCall,
    onClose: () => setActiveCall(null),
    onCreateTicket: handleCreateTicket
  }), /*#__PURE__*/React.createElement(NewTicketModal, {
    open: newTicketOpen,
    onClose: () => setNewTicketOpen(false),
    prefill: newTicketPrefill,
    onCreated: t => {
      handleTicketCreated(t);
      if (!t._localOnly) setSelectedTicketId(t.id);
    }
  }));
};
var SLA = ({
  bar,
  color
}) => {
  if (bar.risk === "done") return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#94a3b8"
    }
  }, "\u2014");
  var pct = bar.risk === "danger" ? 92 : bar.risk === "warn" ? 78 : 38;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: color,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: -0.2
    }
  }, bar.left), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 4,
      background: "#eef1f5",
      borderRadius: 999,
      marginTop: 4,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: "100%",
      background: color,
      borderRadius: 999
    }
  })));
};
var tlStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  // sidebar
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
    cursor: "pointer",
    letterSpacing: -0.1
  },
  kbd: {
    marginLeft: "auto",
    fontSize: 10.5,
    padding: "2px 5px",
    borderRadius: 4,
    background: "rgba(255,255,255,0.12)",
    color: "#cbd5e1",
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
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  },
  kbHint: {
    padding: "10px 11px",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    background: "linear-gradient(180deg, #fafbfc, #f5f7fa)"
  },
  kbLink: {
    fontSize: 11.5,
    color: "#4f46e5",
    fontWeight: 500,
    marginTop: 6,
    display: "inline-block",
    cursor: "pointer"
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 6px",
    borderTop: "1px solid #eef1f5",
    marginTop: 4
  },
  // main
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
    fontFamily: "'JetBrains Mono', monospace"
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: 320,
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
    padding: "20px 24px 12px",
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
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    padding: "4px 24px 16px"
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
    fontFamily: "'JetBrains Mono', monospace"
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
  tableHead: {
    display: "flex",
    alignItems: "center",
    padding: "8px 24px",
    borderBottom: "1px solid #eef1f5",
    background: "#fafbfc",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  col: {
    padding: "0 8px"
  },
  rows: {
    flex: 1,
    overflow: "hidden"
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "11px 24px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    cursor: "pointer"
  },
  rowDanger: {
    background: "#fff8f7",
    borderLeft: "2px solid #dc2626",
    paddingLeft: 22
  },
  refMono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: "#475569",
    letterSpacing: -0.2
  },
  newDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "#4f46e5",
    flexShrink: 0
  },
  metaIcon: {
    fontSize: 10.5,
    color: "#94a3b8"
  },
  unread: {
    fontSize: 10.5,
    padding: "1px 6px",
    borderRadius: 999,
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace"
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 500
  },
  prioPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 7px",
    borderRadius: 4,
    fontSize: 11.5,
    fontWeight: 600
  },
  unassigned: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic"
  },
  foot: {
    padding: "10px 24px",
    borderTop: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }
};

// Convertit un ticket lu depuis Supabase au format attendu par le rendu
// (lignes inline) pour ne pas avoir à refactorer tout le JSX d'un coup.
function mapSupaTicket(t) {
  var contract = t.client && t.client.contracts && t.client.contracts[0] || null;
  var fmtRel = iso => {
    if (!iso) return "—";
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.round(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
    if (diff < 86400 * 2) return "hier";
    return `il y a ${Math.round(diff / 86400)} j`;
  };
  var slaLeft = iso => {
    if (!iso) return {
      left: "—",
      risk: "done"
    };
    var diff = (new Date(iso).getTime() - Date.now()) / 1000;
    if (diff < 0) return {
      left: "Dépassé",
      risk: "danger"
    };
    var h = Math.floor(diff / 3600);
    var m = Math.floor(diff % 3600 / 60);
    var risk = diff < 3600 ? "danger" : diff < 6 * 3600 ? "warn" : "ok";
    return {
      left: h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')}`,
      risk
    };
  };
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    prio: t.priority,
    cat: t.category,
    lifecycle: t.lifecycle,
    billable: t.billable,
    billableNote: t.billable_note,
    opened: fmtRel(t.opened_at),
    updated: fmtRel(t.updated_at),
    sla: slaLeft(t.sla_due_at),
    msgs: (() => {
      // Compte des commentaires : DB d'abord, sinon localStorage en mode démo
      if (Array.isArray(t.comments) && t.comments[0] && typeof t.comments[0].count === "number") return t.comments[0].count;
      try {
        return JSON.parse(localStorage.getItem("hubAstorya.ticketMsgs.v1." + t.id) || "[]").length;
      } catch (e) {
        return 0;
      }
    })(),
    unread: 0,
    hasAttach: false,
    client: t.client ? {
      name: t.client.name,
      maintenance: contract ? contract.status : "none",
      contract: contract ? `${contract.name} · jusqu'au ${new Date(contract.end_date).toLocaleDateString('fr-FR')}` : "Aucun contrat actif"
    } : null,
    assignee: t.assignee ? {
      name: t.assignee.name,
      team: t.assignee.team || t.assignee_team
    } : null,
    escalated: t.escalated_at ? {
      to: t.escalated_to_user && t.escalated_to_user.name || "Supervision",
      group: t.escalated_group || "Supervision",
      at: fmtRel(t.escalated_at),
      reason: t.escalated_reason || ""
    } : undefined
  };
}
window.TicketList = TicketList;