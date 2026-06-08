// Écran 2 — Détail ticket + conversation (vue utilisateur final)

var TicketDetail = ({
  ticketId,
  ticketData,
  onBack
} = {}) => {
  if (!ticketId) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: 40,
        color: "#64748b"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: 8
      }
    }, "Aucun ticket s\xE9lectionn\xE9"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        marginBottom: 16
      }
    }, "S\xE9lectionnez un ticket dans la liste pour voir le d\xE9tail."), /*#__PURE__*/React.createElement("a", {
      href: "/ticketing",
      style: {
        padding: "8px 14px",
        borderRadius: 8,
        background: "#4f46e5",
        color: "#fff",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600
      }
    }, "\u2190 Voir la liste des tickets"));
  }
  var TICKET_ID = ticketId;
  var [flash, setFlash] = React.useState(null);
  var [composerTabState, setComposerTabState] = React.useState("reply");
  var [replyText, setReplyText] = React.useState("");
  var dataOn = typeof window !== "undefined" && window.HubData && window.HubData.enabled();

  // Si on a un ID mais pas de data complète (ouverture directe via URL ?id=…)
  // on charge la fiche complète depuis Supabase.
  var [loadedTicket, setLoadedTicket] = React.useState(null);
  React.useEffect(() => {
    if (!dataOn || !TICKET_ID || !window.HubData.fetchTicketById) return;
    if (ticketData && ticketData.title && ticketData.client) return; // déjà complet
    window.HubData.fetchTicketById(TICKET_ID).then(({
      data
    }) => {
      if (data) setLoadedTicket(data);
    }).catch(() => {});
  }, [dataOn, TICKET_ID, ticketData]);
  var refreshTicket = React.useCallback(async () => {
    if (!dataOn || !window.HubData.fetchTicketById) return;
    try {
      var {
        data
      } = await window.HubData.fetchTicketById(TICKET_ID);
      if (data) setLoadedTicket(data);
    } catch (e) {}
  }, [dataOn, TICKET_ID]);

  // ───── Messages ajoutés par l'agent — Supabase si configuré, fallback localStorage.
  // En mode DB : lecture initiale + abonnement realtime pour la collaboration multi-agents.
  var MSG_KEY = `hubAstorya.ticketMsgs.v1.${TICKET_ID}`;
  var [addedMessages, setAddedMessages] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(MSG_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });
  var loadComments = React.useCallback(async () => {
    if (!dataOn || !window.HubData.fetchCommentsByTicket) return;
    var {
      data,
      error
    } = await window.HubData.fetchCommentsByTicket(TICKET_ID);
    if (error || !data) return;
    setAddedMessages(data.map(c => ({
      id: c.id,
      type: "msg",
      from: c.author_name,
      role: c.kind === "note" ? "note" : "agent",
      isNote: c.kind === "note",
      at: new Date(c.created_at).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }),
      atIso: c.created_at,
      body: c.body,
      color: "#3730a3"
    })));
  }, [TICKET_ID, dataOn]);
  React.useEffect(() => {
    if (!dataOn) return;
    loadComments();
    var off = window.HubData.subscribeCommentsForTicket && window.HubData.subscribeCommentsForTicket(TICKET_ID, loadComments);
    return () => {
      off && off();
    };
  }, [TICKET_ID, dataOn, loadComments]);

  // Persistance localStorage uniquement en mode démo (sans Supabase)
  React.useEffect(() => {
    if (dataOn) return;
    try {
      localStorage.setItem(MSG_KEY, JSON.stringify(addedMessages));
    } catch (e) {}
  }, [addedMessages, MSG_KEY, dataOn]);

  // Données du ticket : prop si fournie (depuis TicketList), sinon valeurs par défaut
  // pour la maquette INC-2837 (Camille Dufour, VPN).
  var t = loadedTicket || ticketData || {};
  var display = {
    title: t.title || "VPN se déconnecte toutes les 10 minutes",
    status: t.status || "in_progress",
    priority: t.priority || t.prio || "haute",
    category: t.category || t.cat || "Réseau · VPN",
    client: t.client && t.client.name || "Client inconnu",
    clientId: t.client && t.client.id || null,
    contract: t.client && t.client.contracts && t.client.contracts[0] ? t.client.contracts[0] : t.client && t.client.maintenance ? {
      status: t.client.maintenance,
      name: t.client.contract
    } : null,
    requester: t.requester_name || "Camille Dufour",
    escalated: t.escalated_at ? {
      at: t.escalated_at,
      group: t.escalated_group,
      reason: t.escalated_reason
    } : t.escalated || null,
    sla_due_at: t.sla_due_at || null,
    opened_at: t.opened_at || null
  };
  var ticket = t;
  var statusMap = {
    open: {
      label: "Ouvert",
      color: "#3b82f6",
      soft: "#eff4ff",
      text: "#1d4ed8"
    },
    in_progress: {
      label: "En cours",
      color: "#a855f7",
      soft: "#f5efff",
      text: "#7e22ce"
    },
    waiting: {
      label: "En attente",
      color: "#f59e0b",
      soft: "#fff6e6",
      text: "#a65f00"
    },
    resolved: {
      label: "Résolu",
      color: "#10b981",
      soft: "#e8f8f1",
      text: "#0e7a55"
    },
    closed: {
      label: "Fermé",
      color: "#94a3b8",
      soft: "#f1f3f6",
      text: "#475569"
    }
  };
  var priorityMap = {
    critique: {
      label: "Critique",
      color: "#dc2626",
      soft: "#fdecec",
      arrow: "▲"
    },
    haute: {
      label: "Haute",
      color: "#ea580c",
      soft: "#fef0e6",
      arrow: "▲"
    },
    normale: {
      label: "Normale",
      color: "#475569",
      soft: "#eef1f5",
      arrow: ""
    },
    basse: {
      label: "Basse",
      color: "#64748b",
      soft: "#f1f3f6",
      arrow: ""
    }
  };
  var sMeta = statusMap[display.status] || statusMap.in_progress;
  var pMeta = priorityMap[display.priority] || priorityMap.normale;
  var showFlash = (msg, tone = "ok") => {
    setFlash({
      msg,
      tone
    });
    setTimeout(() => setFlash(null), 3000);
  };
  var resolveTicket = async () => {
    if (!dataOn) {
      showFlash("Mode démo — branchement DB nécessaire", "warn");
      return;
    }
    var note = prompt("Note de résolution (visible client) :", "");
    if (note === null) return; // cancel
    var {
      error
    } = await window.HubData.updateTicket(TICKET_ID, {
      status: "resolved",
      closed_at: new Date().toISOString()
    });
    if (error) {
      showFlash("Erreur : " + error.message, "err");
      return;
    }
    if (note && note.trim() && window.HubData.createComment) {
      var currentUser = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
      await window.HubData.createComment({
        ticket_id: TICKET_ID,
        body: "✓ Résolu — " + note.trim(),
        author_id: currentUser?.id || null,
        author_name: currentUser?.name || null,
        author_email: currentUser?.email || null
      });
    }
    showFlash("✓ Ticket marqué comme résolu");
    refreshTicket();
  };
  var assignTicket = async () => {
    if (!dataOn) {
      showFlash("Mode démo — branchement DB nécessaire", "warn");
      return;
    }
    // Liste des utilisateurs depuis Supabase profiles (fallback : Romain + Augustin)
    var users = [];
    try {
      if (window.HubData.fetchProfiles) {
        var {
          data
        } = await window.HubData.fetchProfiles();
        users = (data || []).map(p => ({
          id: p.id,
          name: p.name || p.email,
          team: p.team || "Astorya"
        }));
      }
    } catch (e) {}
    if (!users.length) {
      users = [{
        id: null,
        name: "Romain Daviaud",
        team: "Direction"
      }, {
        id: null,
        name: "Augustin Morin",
        team: "Direction"
      }];
    }
    var list = users.map((u, i) => `${i + 1}. ${u.name} · ${u.team}`).join("\n");
    var choice = prompt("Assigner à :\n\n" + list + "\n\nTapez le numéro :", "1");
    var idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= users.length) return;
    var target = users[idx];
    var {
      error
    } = await window.HubData.updateTicket(TICKET_ID, {
      assignee_id: target.id,
      assignee_team: target.team,
      status: "in_progress"
    });
    if (error) showFlash("Erreur : " + error.message, "err");else {
      showFlash("✓ Ticket assigné à " + target.name);
      refreshTicket();
    }
  };
  var closeTicket = async () => {
    if (!dataOn) {
      showFlash("Mode démo — branchement DB nécessaire", "warn");
      return;
    }
    if (!confirm("Fermer définitivement ce ticket ? Le client ne pourra plus y répondre.")) return;
    var {
      error
    } = await window.HubData.updateTicket(TICKET_ID, {
      status: "closed",
      closed_at: new Date().toISOString()
    });
    if (error) showFlash("Erreur : " + error.message, "err");else {
      showFlash("✓ Ticket fermé");
      refreshTicket();
    }
  };
  var escalateTicket = async () => {
    if (!dataOn) {
      showFlash("Mode démo — branchement DB nécessaire", "warn");
      return;
    }
    var reason = prompt("Motif de l'escalade :", "Demande arbitrage Supervision");
    if (!reason) return;
    var currentUser = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var {
      error
    } = await window.HubData.escalateTicket(TICKET_ID, {
      toUserId: currentUser?.id || null,
      groupId: "supervision",
      reason
    });
    if (error) showFlash("Erreur : " + error.message, "err");else {
      showFlash("✓ Ticket escaladé à Supervision");
      refreshTicket();
    }
  };
  var sendReply = async () => {
    var text = replyText.trim();
    if (!text) {
      showFlash("Réponse vide", "warn");
      return;
    }
    var isNote = composerTabState === "note";
    var currentUser = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var fromName = currentUser?.name || "Vous";
    var fromEmail = currentUser?.email || null;

    // En mode Supabase : on persiste en base et on laisse le realtime rafraîchir le fil
    if (dataOn && window.HubData.createComment) {
      var {
        error
      } = await window.HubData.createComment({
        ticket_id: TICKET_ID,
        author_name: fromName,
        author_email: fromEmail,
        body: text,
        kind: isNote ? "note" : "reply"
      });
      if (error) {
        // Fallback local si l'insert échoue (RLS, etc.)
        var msg = {
          type: "msg",
          from: fromName,
          role: isNote ? "note" : "agent",
          isNote,
          at: new Date().toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          }),
          atIso: new Date().toISOString(),
          body: text,
          color: "#3730a3"
        };
        setAddedMessages(prev => [...prev, msg]);
        showFlash("Sauvegarde locale uniquement : " + (error.message || "permission DB"), "warn");
      } else {
        showFlash(isNote ? "✓ Note interne enregistrée" : "✓ Réponse envoyée à " + (ticketData?.client?.name || display.requester || "demandeur"));
        // Le subscribe realtime ajoutera le message au fil
        loadComments();
      }
    } else {
      // Mode démo
      var _msg = {
        type: "msg",
        from: fromName,
        role: isNote ? "note" : "agent",
        isNote,
        at: new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        }),
        atIso: new Date().toISOString(),
        body: text,
        color: "#3730a3"
      };
      setAddedMessages(prev => [...prev, _msg]);
      showFlash(isNote ? "✓ Note interne enregistrée (local)" : "✓ Réponse envoyée (local)");
    }
    setReplyText("");
  };

  // Retranscriptions d'appel 3CX rattachées à ce ticket (alimentées par la
  // popup hotline). Affichées dans le fil de conversation, sous le dernier
  // message bot.
  var subscribe = React.useCallback(fn => window.HubAccess && window.HubAccess.subscribe ? window.HubAccess.subscribe(fn) : () => {}, []);
  var callNotes = React.useSyncExternalStore(subscribe, () => window.HubAccess && window.HubAccess.getTranscriptsForTicket ? window.HubAccess.getTranscriptsForTicket(TICKET_ID) : []);
  var fmtDur = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  var fmtWhen = iso => {
    try {
      var d = new Date(iso);
      return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  };
  var Avatar = ({
    name,
    size = 28,
    color,
    role
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      K: "#6366f1",
      L: "#0ea5e9",
      T: "#f59e0b",
      S: "#10b981",
      C: "#ef4444",
      B: "#a855f7"
    };
    var bg = color || palette[initials[0]] || "#64748b";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
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
        letterSpacing: 0.2
      }
    }, initials), role === "bot" && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 999,
        background: "#0f172a",
        color: "#fff",
        fontSize: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #fff"
      }
    }, "\u2605"));
  };
  var events = [{
    type: "system",
    at: "il y a 2 j · 09:14",
    text: "Ticket créé par Camille Dufour depuis le portail self-service.",
    icon: "+"
  }, {
    type: "msg",
    from: "Camille Dufour",
    role: "user",
    at: "il y a 2 j · 09:14",
    color: "#6366f1",
    body: "Bonjour, depuis ce matin mon VPN se déconnecte toutes les 10 minutes environ. Cela m'oblige à me reconnecter en plein milieu de mes appels Teams. J'ai redémarré le poste, sans amélioration.",
    meta: "Envoyé depuis le portail · DESKTOP-CD24 · Windows 11 23H2",
    attachments: [{
      name: "vpn-log-extract.txt",
      size: "12 Ko"
    }]
  }, {
    type: "system",
    at: "il y a 2 j · 09:18",
    text: "Auto-classification : Réseau · VPN · priorité Haute (impact individuel, urgence haute).",
    icon: "◇"
  }, {
    type: "system",
    at: "il y a 2 j · 09:18",
    text: "Assigné automatiquement à Tom Verdier (Support N2 — Réseau).",
    icon: "◉",
    actor: "Tom Verdier"
  }, {
    type: "msg",
    from: "Tom Verdier",
    role: "agent",
    at: "il y a 2 j · 10:02",
    color: "#f59e0b",
    body: "Bonjour Camille, merci pour le log. Je vois plusieurs renégociations IKEv2 toutes les 8–10 min. Pouvez-vous tester en filaire (port Ethernet du dock) sur la même journée et me dire si le problème persiste ? En parallèle je regarde côté concentrateur Astorya-VPN-02.",
    reactions: [{
      emoji: "👍",
      count: 1
    }]
  }, {
    type: "msg",
    from: "Camille Dufour",
    role: "user",
    at: "il y a 1 j · 11:47",
    color: "#6366f1",
    body: "Testé en filaire toute la matinée — aucune coupure. Donc effectivement c'est bien le Wi-Fi qui pose problème."
  }, {
    type: "status",
    at: "il y a 1 j · 14:20",
    text: "Statut passé de Ouvert à En cours.",
    actor: "Tom Verdier",
    from: "Ouvert",
    to: "En cours"
  }, {
    type: "msg",
    from: "Tom Verdier",
    role: "agent",
    at: "il y a 1 j · 14:22",
    color: "#f59e0b",
    body: "J'ai identifié un correctif : mise à jour du driver Intel AX211 vers la 23.50.1. Je pousse l'update via Intune ce soir 19h00, redémarrage automatique. Pourriez-vous laisser le poste allumé et branché ce soir ?",
    attachments: [{
      name: "intune-deployment-AX211.png",
      size: "184 Ko"
    }]
  }, {
    type: "system",
    at: "hier · 19:03",
    text: "Déploiement Intune appliqué — driver Wi-Fi v23.50.1 installé.",
    icon: "✓",
    actor: "Système"
  }, {
    type: "escalation",
    at: "il y a 35 min",
    from: "Tom Verdier",
    to: "Léa Marchand",
    group: "Administrateur · Supervision",
    reason: "Récurrence détectée sur 3 utilisateurs dock Dell étage 4. SLA résolution < 30 min, demande arbitrage Supervision pour déploiement groupé en heures ouvrées."
  }, {
    type: "msg",
    from: "Hub Assistant",
    role: "bot",
    at: "il y a 35 min",
    color: "#0f172a",
    body: "Bonjour Camille, j'ai détecté que le correctif a été appliqué hier soir. Le ticket est-il résolu de votre côté ? Vous pouvez répondre par oui / non, ou marquer comme résolu directement.",
    isBot: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: tdStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: tdStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...tdStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: tdStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: tdStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya")), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing?new=1",
    style: {
      ...tdStyles.newBtn,
      textDecoration: "none",
      cursor: "pointer"
    },
    title: "Cr\xE9er un nouveau ticket"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1
    }
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Nouveau ticket"), /*#__PURE__*/React.createElement("span", {
    style: tdStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tdStyles.navLabel
  }, "Mes vues"), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing",
    style: {
      ...tdStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    },
    title: "Retour \xE0 la liste compl\xE8te"
  }, /*#__PURE__*/React.createElement("span", {
    style: tdStyles.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Tous mes tickets"), /*#__PURE__*/React.createElement("span", {
    style: tdStyles.navCount
  }, "9")), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing?assignee=me",
    style: {
      ...tdStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    },
    title: "Tickets assign\xE9s \xE0 moi"
  }, /*#__PURE__*/React.createElement("span", {
    style: tdStyles.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Assign\xE9s \xE0 moi"), /*#__PURE__*/React.createElement("span", {
    style: tdStyles.navCount
  }, "4"))), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: tdStyles.navLabel
  }, "Statuts"), [{
    k: "open",
    label: "Ouverts",
    c: 2,
    color: "#3b82f6"
  }, {
    k: "in_progress",
    label: "En cours",
    c: 3,
    color: "#a855f7"
  }, {
    k: "waiting",
    label: "En attente",
    c: 1,
    color: "#f59e0b"
  }, {
    k: "resolved",
    label: "Résolus",
    c: 2,
    color: "#10b981"
  }].map(s => {
    var active = display.status === s.k;
    return /*#__PURE__*/React.createElement("a", {
      key: s.k,
      href: `/ticketing?status=${s.k}`,
      style: {
        ...tdStyles.navItem,
        ...(active ? tdStyles.navItemActive : {}),
        textDecoration: "none",
        color: active ? "#3730a3" : "inherit"
      },
      title: `Voir tous les tickets ${s.label.toLowerCase()}`
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: s.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        marginLeft: 6
      }
    }, s.label), /*#__PURE__*/React.createElement("span", {
      style: tdStyles.navCount
    }, s.c));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), (() => {
    var u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var name = u?.name || "Camille Dufour";
    var role = u?.role || "Direction Marketing";
    return /*#__PURE__*/React.createElement("a", {
      href: "/administration-utilisateurs",
      title: "Profil & pr\xE9f\xE9rences",
      style: {
        ...tdStyles.userRow,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: name,
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
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, role)));
  })()), /*#__PURE__*/React.createElement("main", {
    style: tdStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: tdStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b",
      flexWrap: "wrap"
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      ...tdStyles.ghostBtn,
      marginRight: 4,
      cursor: "pointer"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("span", null, "Support IT"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Mes tickets"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, TICKET_ID), /*#__PURE__*/React.createElement("button", {
    style: tdStyles.copyBtn,
    title: "Copier la r\xE9f\xE9rence",
    onClick: () => navigator.clipboard && navigator.clipboard.writeText(TICKET_ID)
  }, "\u29C9"), display.client && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "#475569",
      fontWeight: 600
    }
  }, display.client)), display.contract && display.contract.status && /*#__PURE__*/React.createElement("span", {
    title: `${display.client} — ${display.contract.name || ""}`,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 9px",
      borderRadius: 999,
      background: display.contract.status === "active" ? "#dcfce7" : display.contract.status === "expiring" ? "#fef3c7" : "#fee2e2",
      border: `1px solid ${display.contract.status === "active" ? "#86efac" : display.contract.status === "expiring" ? "#fde68a" : "#fecaca"}`,
      marginLeft: 8,
      cursor: "help"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: display.contract.status === "active" ? "#10b981" : display.contract.status === "expiring" ? "#f59e0b" : "#dc2626"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: display.contract.status === "active" ? "#065f46" : display.contract.status === "expiring" ? "#78350f" : "#991b1b",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Contrat parc ", display.contract.status === "active" ? "actif" : display.contract.status === "expiring" ? "expire" : "absent"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...tdStyles.iconBtn,
      cursor: "pointer"
    },
    onClick: onBack,
    title: "Retour \xE0 la liste"
  }, "\u2039"))), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.body
  }, /*#__PURE__*/React.createElement("section", {
    style: tdStyles.convCol
  }, display.escalated && /*#__PURE__*/React.createElement("div", {
    style: escStyles.banner
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: escStyles.bannerIcon
  }, "\u2191"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#fff"
    }
  }, "Ticket escalad\xE9 \xB7 ", display.escalated.group || "Supervision"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      marginTop: 2
    }
  }, display.escalated.at && (typeof display.escalated.at === "string" ? display.escalated.at : new Date(display.escalated.at).toLocaleString("fr-FR")), display.escalated.reason && /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 ", display.escalated.reason)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!dataOn) {
        showFlash("Mode démo — branchement DB nécessaire", "warn");
        return;
      }
      var {
        error
      } = await window.HubData.updateTicket(TICKET_ID, {
        escalated_to: null,
        escalated_at: null,
        escalated_reason: null,
        escalated_group: null
      });
      if (error) showFlash("Erreur : " + error.message, "err");else showFlash("✓ Vous avez repris la main sur le ticket");
    },
    style: {
      ...escStyles.bannerBtnPrimary,
      cursor: "pointer"
    }
  }, "Reprendre la main"))), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.titleBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...tdStyles.statusPill,
      background: sMeta.soft,
      color: sMeta.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: sMeta.color
    }
  }), " ", sMeta.label), /*#__PURE__*/React.createElement("span", {
    style: {
      ...tdStyles.prioPill,
      background: pMeta.soft,
      color: pMeta.color
    }
  }, pMeta.arrow, " ", pMeta.label), display.escalated && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      borderRadius: 999,
      background: "#ede9fe",
      color: "#5b21b6",
      fontSize: 11.5,
      fontWeight: 700,
      border: "1px solid #c4b5fd"
    }
  }, "\u2191 Escalad\xE9 \xB7 ", display.escalated.group || "Supervision"), /*#__PURE__*/React.createElement("span", {
    style: tdStyles.metaChip
  }, display.category), /*#__PURE__*/React.createElement("span", {
    style: tdStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, t.opened || "Ouvert il y a 1 j 22 h")), /*#__PURE__*/React.createElement("h1", {
    style: tdStyles.h1
  }, display.title), /*#__PURE__*/React.createElement("p", {
    style: tdStyles.subtitle
  }, "Ticket ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      color: "#475569"
    }
  }, TICKET_ID), " \xB7 Demandeur ", display.requester, " \xB7 ", t.msgs != null ? t.msgs : 11, " messages"), (() => {
    // SLA par priorité (heures jusqu'à résolution attendue)
    var slaHoursByPrio = {
      critique: 2,
      haute: 4,
      normale: 24,
      basse: 72
    };
    var openedIso = ticket && (ticket.opened_at || ticket.created_at) || display.opened_at;
    var dueIso = ticket && ticket.sla_due_at || display.sla_due_at;
    // Fallback : si pas d'opened_at, on prend maintenant
    if (!openedIso) openedIso = new Date().toISOString();
    // Fallback : si pas de sla_due_at, on calcule depuis la priorité
    if (!dueIso) {
      var prio = ticket && (ticket.priority || ticket.prio) || display.priority || "normale";
      var h = slaHoursByPrio[prio] != null ? slaHoursByPrio[prio] : 24;
      dueIso = new Date(new Date(openedIso).getTime() + h * 3600 * 1000).toISOString();
    }
    var now = Date.now();
    var due = new Date(dueIso).getTime();
    var opened = new Date(openedIso).getTime();
    var totalMs = due - opened;
    var remainingMs = due - now;
    var pct = totalMs > 0 ? Math.max(0, Math.min(100, (totalMs - remainingMs) / totalMs * 100)) : 100;
    var overdue = remainingMs < 0;
    var fmtRem = ms => {
      var abs = Math.abs(ms);
      var h = Math.floor(abs / 3600000);
      var m = Math.floor(abs % 3600000 / 60000);
      return h >= 24 ? Math.floor(h / 24) + " j " + h % 24 + " h" : h + " h " + String(m).padStart(2, "0");
    };
    var color = overdue ? "#dc2626" : remainingMs < 3600000 ? "#dc2626" : remainingMs < 6 * 3600000 ? "#f59e0b" : "#10b981";
    var label = overdue ? "Dépassée de " + fmtRem(remainingMs) : fmtRem(remainingMs) + " restantes";
    return /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaStrip
    }, /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaBlock
    }, /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaLabel
    }, "Ouvert le"), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaValueOk
    }, new Date(openedIso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }))), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaSep
    }), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaBlock
    }, /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaLabel
    }, "SLA r\xE9solution"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tdStyles.slaValueOk,
        color
      }
    }, overdue ? "⚠ " : "⏱ ", label), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + "%",
        height: "100%",
        background: color,
        borderRadius: 999
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaSep
    }), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaBlock
    }, /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaLabel
    }, "\xC9ch\xE9ance"), /*#__PURE__*/React.createElement("div", {
      style: tdStyles.slaValueOk
    }, new Date(dueIso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }))));
  })()), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.thread
  }, [...events, ...addedMessages].map((e, i) => {
    if (e.type === "escalation") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: escStyles.timelineRow
      }, /*#__PURE__*/React.createElement("div", {
        style: escStyles.timelineIcon
      }, "\u2191"), /*#__PURE__*/React.createElement("div", {
        style: escStyles.timelineCard
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          fontWeight: 700,
          color: "#0f172a"
        }
      }, /*#__PURE__*/React.createElement("strong", null, e.from), " a escalad\xE9 le ticket", /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#cbd5e1",
          margin: "0 6px"
        }
      }, "\u2192"), /*#__PURE__*/React.createElement("strong", {
        style: {
          color: "#5b21b6"
        }
      }, e.to), /*#__PURE__*/React.createElement("span", {
        style: {
          marginLeft: 6,
          fontSize: 10.5,
          fontWeight: 700,
          color: "#5b21b6",
          background: "#ede9fe",
          padding: "1px 7px",
          borderRadius: 999,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          border: "1px solid #c4b5fd"
        }
      }, e.group))), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11.5,
          color: "#94a3b8",
          whiteSpace: "nowrap"
        }
      }, e.at)), /*#__PURE__*/React.createElement("div", {
        style: escStyles.timelineReason
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10.5,
          fontWeight: 700,
          color: "#5b21b6",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginRight: 6
        }
      }, "Motif"), e.reason)));
    }
    if (e.type === "system" || e.type === "status") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: tdStyles.sysRow
      }, /*#__PURE__*/React.createElement("div", {
        style: tdStyles.sysLine
      }), /*#__PURE__*/React.createElement("div", {
        style: tdStyles.sysPill
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#94a3b8",
          marginRight: 6
        }
      }, e.icon || "↻"), e.type === "status" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", {
        style: {
          color: "#0f172a",
          fontWeight: 600
        }
      }, e.actor), " a chang\xE9 le statut", /*#__PURE__*/React.createElement("span", {
        style: {
          ...tdStyles.miniPill,
          background: "#eef4ff",
          color: "#1d4ed8",
          marginLeft: 6
        }
      }, e.from), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#cbd5e1",
          margin: "0 4px"
        }
      }, "\u2192"), /*#__PURE__*/React.createElement("span", {
        style: {
          ...tdStyles.miniPill,
          background: "#f5efff",
          color: "#7e22ce"
        }
      }, e.to)) : /*#__PURE__*/React.createElement("span", null, e.text), /*#__PURE__*/React.createElement("span", {
        style: tdStyles.sysTime
      }, e.at)), /*#__PURE__*/React.createElement("div", {
        style: tdStyles.sysLine
      }));
    }
    var isUser = e.role === "user";
    var isBot = e.role === "bot";
    var isNote = e.role === "note" || e.isNote;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        ...tdStyles.msgRow,
        ...(isUser ? tdStyles.msgRowMine : {})
      }
    }, !isUser && /*#__PURE__*/React.createElement(Avatar, {
      name: e.from,
      size: 32,
      color: e.color,
      role: isBot ? "bot" : null
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tdStyles.bubbleWrap,
        alignItems: isUser ? "flex-end" : "flex-start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, e.from), isNote && /*#__PURE__*/React.createElement("span", {
      style: {
        ...tdStyles.roleTag,
        background: "#fef3c7",
        color: "#78350f",
        borderColor: "#fde68a"
      }
    }, "\uD83D\uDD12 Note interne"), e.role === "agent" && !isNote && /*#__PURE__*/React.createElement("span", {
      style: tdStyles.roleTag
    }, "Technicien \xB7 Support"), isBot && /*#__PURE__*/React.createElement("span", {
      style: {
        ...tdStyles.roleTag,
        background: "#0f172a",
        color: "#fff",
        borderColor: "#0f172a"
      }
    }, "Assistant IA"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#94a3b8"
      }
    }, e.at)), /*#__PURE__*/React.createElement("div", {
      style: {
        ...tdStyles.bubble,
        ...(isUser ? tdStyles.bubbleUser : {}),
        ...(isBot ? tdStyles.bubbleBot : {}),
        ...(isNote ? {
          background: "#fffbeb",
          borderColor: "#fde68a",
          borderStyle: "dashed",
          borderWidth: 1
        } : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        lineHeight: 1.55,
        color: isUser ? "#fff" : "#0f172a",
        whiteSpace: "pre-wrap"
      }
    }, e.body), e.attachments && /*#__PURE__*/React.createElement("div", {
      style: tdStyles.attachRow
    }, e.attachments.map(a => /*#__PURE__*/React.createElement("div", {
      key: a.name,
      style: tdStyles.attach
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\uD83D\uDCCE"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: "#0f172a"
      }
    }, a.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, a.size))))), isBot && /*#__PURE__*/React.createElement("div", {
      style: tdStyles.botActions
    }, /*#__PURE__*/React.createElement("button", {
      onClick: resolveTicket,
      style: {
        ...tdStyles.botBtnPrimary,
        cursor: "pointer"
      }
    }, "\u2713 Oui, c'est r\xE9solu"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        dataOn ? window.HubData.updateTicket(TICKET_ID, {
          status: "in_progress"
        }) : null;
        showFlash("Statut remis à 'En cours' — un technicien va reprendre.");
      },
      style: {
        ...tdStyles.botBtn,
        cursor: "pointer"
      }
    }, "Non, probl\xE8me persistant")), e.meta && /*#__PURE__*/React.createElement("div", {
      style: tdStyles.bubbleMeta
    }, e.meta)), e.reactions && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        display: "flex",
        gap: 4
      }
    }, e.reactions.map(r => /*#__PURE__*/React.createElement("span", {
      key: r.emoji,
      style: tdStyles.reaction
    }, r.emoji, " ", r.count)))), isUser && /*#__PURE__*/React.createElement(Avatar, {
      name: e.from,
      size: 32,
      color: e.color
    }));
  }), callNotes.map((n, i) => /*#__PURE__*/React.createElement("div", {
    key: "call-" + i,
    style: callStyles.row
  }, /*#__PURE__*/React.createElement("div", {
    style: callStyles.iconCol
  }, /*#__PURE__*/React.createElement("div", {
    style: callStyles.phoneIcon
  }, "\uD83D\uDCDE")), /*#__PURE__*/React.createElement("div", {
    style: callStyles.card
  }, /*#__PURE__*/React.createElement("div", {
    style: callStyles.cardHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: callStyles.badge3cx
  }, "3CX \xB7 Speech-to-text"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Appel entrant de ", n.from)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8"
    }
  }, fmtWhen(n.at))), /*#__PURE__*/React.createElement("div", {
    style: callStyles.meta
  }, /*#__PURE__*/React.createElement("span", null, n.phone), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1",
      margin: "0 6px"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Dur\xE9e ", fmtDur(n.durationSec || 0)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1",
      margin: "0 6px"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Enregistrement archiv\xE9 sur PBX 3CX")), /*#__PURE__*/React.createElement("div", {
    style: callStyles.audioBar
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (n.recording_url) {
        window.open(n.recording_url, "_blank");
        return;
      }
      alert("⚠ Aucun enregistrement audio disponible pour cet appel.\n\nLes enregistrements 3CX seront accessibles dès que le PBX poussera leur URL dans la table calls (champ recording_url).");
    },
    style: {
      ...callStyles.playBtn,
      cursor: "pointer"
    },
    title: n.recording_url ? "Lire l'enregistrement" : "Audio indisponible"
  }, "\u25B6"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 4,
      background: "#e2e8f0",
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "0%",
      height: "100%",
      background: "#10b981",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "00:00 / ", fmtDur(n.durationSec || 0)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (n.recording_url) {
        var a = document.createElement("a");
        a.href = n.recording_url;
        a.download = "appel-" + (n.atIso || Date.now()) + ".mp3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      alert("⚠ Aucun enregistrement audio à télécharger.");
    },
    style: {
      ...callStyles.dlBtn,
      cursor: "pointer"
    },
    title: n.recording_url ? "Télécharger" : "Audio indisponible"
  }, "\u2B07")), /*#__PURE__*/React.createElement("div", {
    style: callStyles.transcriptLabel
  }, "Retranscription"), /*#__PURE__*/React.createElement("div", {
    style: callStyles.transcriptBox
  }, n.text))))), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.composer
  }, /*#__PURE__*/React.createElement("div", {
    style: tdStyles.composerTabs
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setComposerTabState("reply"),
    style: {
      ...tdStyles.composerTab,
      ...(composerTabState === "reply" ? tdStyles.composerTabActive : {}),
      cursor: "pointer"
    }
  }, "R\xE9ponse"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setComposerTabState("note"),
    style: {
      ...tdStyles.composerTab,
      ...(composerTabState === "note" ? tdStyles.composerTabActive : {}),
      cursor: "pointer"
    }
  }, "Note interne ", composerTabState === "note" && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 9.5,
      fontWeight: 700,
      color: "#a16207",
      background: "#fef3c7",
      padding: "1px 5px",
      borderRadius: 4
    }
  }, "PRIV\xC9")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Markdown support\xE9 \xB7 \u2318\u21B5 pour envoyer")), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...tdStyles.composerArea,
      background: composerTabState === "note" ? "#fffbeb" : "#fff"
    },
    placeholder: composerTabState === "note" ? "Note interne visible uniquement par l'équipe support…" : "Écrire une réponse à " + display.requester + "…",
    value: replyText,
    onChange: e => setReplyText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        sendReply();
      }
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: tdStyles.composerFoot
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setReplyText(t => t + " @"),
    style: {
      ...tdStyles.composerIcon,
      cursor: "pointer"
    },
    title: "Mentionner un coll\xE8gue"
  }, "@"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setReplyText(t => t + " **gras**"),
    style: {
      ...tdStyles.composerIcon,
      cursor: "pointer"
    },
    title: "Gras (Markdown)"
  }, "\uD835\uDC01"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setReplyText(t => t + "\n```\ncode\n```"),
    style: {
      ...tdStyles.composerIcon,
      cursor: "pointer"
    },
    title: "Bloc de code"
  }, "</>")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, flash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 6,
      background: flash.tone === "err" ? "#fee2e2" : flash.tone === "warn" ? "#fef3c7" : "#dcfce7",
      color: flash.tone === "err" ? "#991b1b" : flash.tone === "warn" ? "#78350f" : "#065f46"
    }
  }, flash.msg), /*#__PURE__*/React.createElement("button", {
    onClick: assignTicket,
    style: {
      ...tdStyles.ghostBtn,
      cursor: "pointer"
    },
    title: "Assigner \xE0 un technicien"
  }, "\u21C4 Assigner"), /*#__PURE__*/React.createElement("button", {
    onClick: escalateTicket,
    style: {
      ...tdStyles.ghostBtn,
      color: "#5b21b6",
      borderColor: "#c4b5fd",
      background: "#f5f3ff",
      fontWeight: 600,
      cursor: "pointer"
    },
    title: "Remonter le ticket au groupe Administrateur \xB7 Supervision"
  }, "\u2191 Escalader"), /*#__PURE__*/React.createElement("button", {
    onClick: resolveTicket,
    style: {
      ...tdStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2713 R\xE9soudre"), /*#__PURE__*/React.createElement("button", {
    onClick: closeTicket,
    style: {
      ...tdStyles.ghostBtn,
      color: "#64748b",
      cursor: "pointer"
    },
    title: "Fermer d\xE9finitivement le ticket"
  }, "\u2715 Fermer"), /*#__PURE__*/React.createElement("button", {
    onClick: sendReply,
    style: {
      ...tdStyles.primaryBtn,
      cursor: "pointer"
    }
  }, "Envoyer \u21B5"))))), /*#__PURE__*/React.createElement("aside", {
    style: tdStyles.side
  }, /*#__PURE__*/React.createElement(SidePanel, {
    Avatar: Avatar
  })))));
};
var SidePanel = ({
  Avatar
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: "18px 18px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 18
  }
}, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.sideHead
}, "Propri\xE9t\xE9s"), /*#__PURE__*/React.createElement(Field, {
  label: "Statut",
  value: /*#__PURE__*/React.createElement("span", {
    style: {
      ...tdStyles.statusPill,
      background: "#f5efff",
      color: "#7e22ce"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "#a855f7"
    }
  }), " En cours")
}), /*#__PURE__*/React.createElement(Field, {
  label: "Priorit\xE9",
  value: /*#__PURE__*/React.createElement("span", {
    style: {
      ...tdStyles.prioPill,
      background: "#fef0e6",
      color: "#ea580c"
    }
  }, "\u25B2 Haute")
}), /*#__PURE__*/React.createElement(Field, {
  label: "Urgence",
  value: /*#__PURE__*/React.createElement("span", {
    style: tdStyles.fieldChip
  }, "Haute")
}), /*#__PURE__*/React.createElement(Field, {
  label: "Impact",
  value: /*#__PURE__*/React.createElement("span", {
    style: tdStyles.fieldChip
  }, "Individuel")
}), /*#__PURE__*/React.createElement(Field, {
  label: "Cat\xE9gorie",
  value: /*#__PURE__*/React.createElement("span", {
    style: tdStyles.fieldChip
  }, "R\xE9seau \xB7 VPN")
}), /*#__PURE__*/React.createElement(Field, {
  label: "Source",
  value: /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "#475569"
    }
  }, "Portail self-service")
})), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.sideHead
}, "Personnes"), /*#__PURE__*/React.createElement(Field, {
  label: "Demandeur",
  value: /*#__PURE__*/React.createElement("div", {
    style: tdStyles.person
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Camille Dufour",
    size: 22,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, "Camille Dufour"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Marketing \xB7 Paris")))
}), /*#__PURE__*/React.createElement(Field, {
  label: "Assign\xE9",
  value: /*#__PURE__*/React.createElement("div", {
    style: tdStyles.person
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Tom Verdier",
    size: 22,
    color: "#f59e0b"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, "Tom Verdier"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Support N2 \xB7 R\xE9seau")))
})), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.sideHead
}, "\xC9quipement concern\xE9"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdb
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10
  }
}, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbIcon
}, "\uD83D\uDCBB"), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12.5,
    fontWeight: 600
  }
}, "DESKTOP-CD24"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  }
}, "Dell Latitude 7440 \xB7 S/N 7HX29Z3"))), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbGrid
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbK
}, "OS"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbV
}, "Windows 11 23H2")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbK
}, "Wi-Fi"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbV
}, "Intel AX211 \xB7 23.50.1")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbK
}, "VPN"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbV
}, "Astorya-VPN-02")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbK
}, "Site"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.cmdbV
}, "Paris HQ \u2014 4\u1D49 \xE9t."))))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.sideHead
}, "Liens"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.linkRow
}, /*#__PURE__*/React.createElement("span", {
  style: tdStyles.linkRef
}, "INC-2812"), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    fontSize: 12,
    color: "#475569"
  }
}, "VPN \u2014 d\xE9connexions Wi-Fi (r\xE9solu)"), /*#__PURE__*/React.createElement("span", {
  style: {
    ...tdStyles.statusDot,
    background: "#10b981"
  }
})), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.linkRow
}, /*#__PURE__*/React.createElement("span", {
  style: tdStyles.linkRef
}, "KB-0148"), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    fontSize: 12,
    color: "#475569"
  }
}, "Driver Intel AX211 \u2014 proc\xE9dure"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10.5,
    color: "#94a3b8"
  }
}, "\uD83D\uDCD8"))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.sideHead
}, "M\xE9triques"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricGrid
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricK
}, "Temps \xE9coul\xE9"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricV
}, "1 j 22 h")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricK
}, "R\xE9ponses"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricV
}, "11")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricK
}, "R\xE9ouvertures"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricV
}, "0")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricK
}, "Pi\xE8ces jointes"), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.metricV
}, "3")))));
var Field = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", {
  style: tdStyles.field
}, /*#__PURE__*/React.createElement("div", {
  style: tdStyles.fieldLabel
}, label), /*#__PURE__*/React.createElement("div", {
  style: tdStyles.fieldValue
}, value));
var tdStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  // sidebar (compact)
  sidebar: {
    width: 220,
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
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoMark: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 13
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    marginLeft: "auto",
    fontSize: 10,
    padding: "1px 5px",
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
  bullet: {
    width: 14,
    color: "#94a3b8",
    fontSize: 11
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
  copyBtn: {
    width: 22,
    height: 22,
    border: "1px solid #e2e8f0",
    background: "#fafbfc",
    borderRadius: 5,
    fontSize: 11,
    color: "#94a3b8",
    cursor: "pointer"
  },
  iconBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    fontSize: 13
  },
  ghostBtn: {
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  primaryBtn: {
    padding: "7px 14px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden"
  },
  convCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    borderRight: "1px solid #eef1f5",
    overflow: "hidden"
  },
  // Title block
  titleBlock: {
    padding: "20px 28px 18px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff"
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 9px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 500
  },
  prioPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11.5,
    fontWeight: 600
  },
  metaChip: {
    fontSize: 11.5,
    color: "#475569",
    padding: "2px 8px",
    borderRadius: 4,
    background: "#eef1f5",
    fontWeight: 500
  },
  dot: {
    width: 3,
    height: 3,
    background: "#cbd5e1",
    borderRadius: 999
  },
  h1: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: -0.7,
    margin: 0,
    color: "#0f172a",
    lineHeight: 1.25
  },
  subtitle: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "6px 0 0"
  },
  slaStrip: {
    display: "flex",
    alignItems: "stretch",
    gap: 18,
    marginTop: 14,
    padding: "12px 16px",
    background: "linear-gradient(180deg, #fafbfc, #f5f7fa)",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  slaBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1
  },
  slaLabel: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 600
  },
  slaValueOk: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0e7a55"
  },
  slaValueDanger: {
    fontSize: 13,
    fontWeight: 600,
    color: "#dc2626",
    fontFamily: "'JetBrains Mono', monospace"
  },
  slaBar: {
    width: "100%",
    height: 3,
    background: "#fde2e2",
    borderRadius: 999,
    marginTop: 2
  },
  slaSep: {
    width: 1,
    background: "#eef1f5"
  },
  kbLink: {
    fontSize: 12.5,
    color: "#4f46e5",
    fontWeight: 500,
    cursor: "pointer"
  },
  // Thread
  thread: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#fafbfc"
  },
  // System rows
  sysRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "2px 0"
  },
  sysLine: {
    flex: 1,
    height: 1,
    background: "#eef1f5"
  },
  sysPill: {
    fontSize: 11.5,
    color: "#64748b",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 10px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 999,
    whiteSpace: "nowrap"
  },
  sysTime: {
    color: "#94a3b8",
    marginLeft: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5
  },
  miniPill: {
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 600
  },
  // Messages
  msgRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start"
  },
  msgRowMine: {
    flexDirection: "row"
  },
  bubbleWrap: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "78%",
    flex: 1
  },
  bubble: {
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    borderTopLeftRadius: 4
  },
  bubbleUser: {
    background: "#4f46e5",
    border: "1px solid #4338ca",
    borderRadius: 12,
    borderTopRightRadius: 4,
    color: "#fff"
  },
  bubbleBot: {
    background: "#0f172a",
    borderColor: "#0f172a",
    color: "#fff"
  },
  bubbleMeta: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.55)",
    marginTop: 8,
    fontFamily: "'JetBrains Mono', monospace"
  },
  roleTag: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 4,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  attachRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap"
  },
  attach: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8
  },
  reaction: {
    fontSize: 11,
    padding: "2px 8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    color: "#475569"
  },
  botActions: {
    display: "flex",
    gap: 8,
    marginTop: 12
  },
  botBtnPrimary: {
    padding: "6px 12px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  botBtn: {
    padding: "6px 12px",
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer"
  },
  // Composer
  composer: {
    background: "#fff",
    borderTop: "1px solid #eef1f5",
    padding: "10px 18px 14px"
  },
  composerTabs: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 8
  },
  composerTab: {
    padding: "4px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  composerTabActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  composerArea: {
    width: "100%",
    minHeight: 80,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0f172a",
    resize: "none",
    outline: "none",
    lineHeight: 1.5,
    boxSizing: "border-box"
  },
  composerFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  composerIcon: {
    width: 28,
    height: 28,
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: 6,
    color: "#64748b",
    cursor: "pointer",
    fontSize: 13
  },
  // Side panel
  side: {
    width: 320,
    background: "#fff",
    overflowY: "auto",
    flexShrink: 0
  },
  sideHead: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10
  },
  field: {
    display: "flex",
    alignItems: "center",
    padding: "6px 0",
    gap: 10,
    minHeight: 30
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748b",
    width: 96,
    flexShrink: 0
  },
  fieldValue: {
    flex: 1,
    minWidth: 0
  },
  fieldChip: {
    fontSize: 12,
    padding: "1px 8px",
    borderRadius: 4,
    background: "#eef1f5",
    color: "#475569",
    fontWeight: 500
  },
  person: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  addPill: {
    padding: "3px 9px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 999,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer"
  },
  cmdb: {
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "#fafbfc",
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  cmdbIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #eef1f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16
  },
  cmdbGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 16px"
  },
  cmdbK: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 600
  },
  cmdbV: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 500,
    marginTop: 1
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    border: "1px solid transparent",
    borderRadius: 6,
    cursor: "pointer"
  },
  linkRef: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#4f46e5",
    fontWeight: 600
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    flexShrink: 0
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12
  },
  metricK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 600
  },
  metricV: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    marginTop: 2,
    letterSpacing: -0.3
  }
};
var escStyles = {
  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 18px",
    background: "linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)",
    borderRadius: 12,
    marginBottom: 14
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800
  },
  bannerBtnGhost: {
    padding: "6px 12px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 7,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  bannerBtnPrimary: {
    padding: "6px 12px",
    background: "#fff",
    border: 0,
    borderRadius: 7,
    color: "#5b21b6",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer"
  },
  timelineRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    margin: "10px 0"
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#ede9fe",
    color: "#5b21b6",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px #c4b5fd",
    flexShrink: 0
  },
  timelineCard: {
    flex: 1,
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  timelineReason: {
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "#334155",
    padding: "9px 12px",
    background: "#fff",
    border: "1px dashed #c4b5fd",
    borderRadius: 8
  }
};
var callStyles = {
  row: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    margin: "14px 0"
  },
  iconCol: {
    width: 32,
    display: "flex",
    justifyContent: "center",
    flexShrink: 0
  },
  phoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#dcfce7",
    color: "#10b981",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px #bbf7d0"
  },
  card: {
    flex: 1,
    background: "#fff",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  badge3cx: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    padding: "2px 7px",
    borderRadius: 999,
    background: "#10b981",
    color: "#fff"
  },
  meta: {
    fontSize: 11.5,
    color: "#64748b"
  },
  audioBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#10b981",
    color: "#fff",
    border: 0,
    fontSize: 11,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2
  },
  dlBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    background: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontSize: 12,
    cursor: "pointer"
  },
  transcriptLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2
  },
  transcriptBox: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: "#334155",
    padding: "10px 12px",
    background: "#f0fdf4",
    border: "1px dashed #bbf7d0",
    borderRadius: 8,
    fontStyle: "italic"
  }
};
window.TicketDetail = TicketDetail;