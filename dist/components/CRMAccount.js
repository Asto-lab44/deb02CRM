// Écran CRM 2 — Fiche compte / opportunité avec timeline d'activité

var CRMAccount = () => {
  var Avatar = ({
    name,
    size = 24,
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
      M: "#a855f7",
      N: "#ec4899",
      E: "#14b8a6",
      A: "#dc2626"
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
        width: 11,
        height: 11,
        borderRadius: 999,
        background: "#0f172a",
        color: "#fff",
        fontSize: 7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #fff"
      }
    }, "\u2605"));
  };

  // Timeline events
  var activities = [{
    type: "task",
    kind: "future",
    at: "Dans 2 jours · jeu. 28 mai · 14h00",
    title: "Comité achats — présentation finale",
    meta: "Visio Teams · 4 participants AXA · présentation 30 min",
    who: "Augustin Morin",
    icon: "📅",
    color: "#4f46e5",
    attendees: ["Émilie Roux", "Antoine Mercier", "Sophie Aubry"]
  }, {
    type: "task",
    kind: "future",
    at: "Dans 5 jours · dim. 31 mai",
    title: "Envoyer proposition v3 mise à jour",
    who: "Augustin Morin",
    icon: "✓",
    color: "#f59e0b"
  }, {
    type: "divider",
    label: "Aujourd'hui · mar. 26 mai"
  }, {
    type: "email",
    at: "10:42",
    from: "Émilie Roux",
    role: "VP Innovation, AXA Wealth",
    subject: "Re: Proposition Astorya Suite v2 — questions techniques",
    body: "Bonjour Nadia,\n\nMerci pour la proposition v2 reçue vendredi. Notre équipe sécurité a quelques points à clarifier avant le comité de jeudi :\n\n1. Conformité DORA — pouvez-vous confirmer la roadmap pour Q3 ?\n2. Localisation des données (UE uniquement)\n3. Modèle de tarification au-delà de 500 utilisateurs\n\nPour le reste, l'enthousiasme est réel côté Direction. À jeudi.",
    attachments: [{
      name: "AXA-Questions-Tech.pdf",
      size: "248 Ko"
    }],
    color: "#a855f7"
  }, {
    type: "ai",
    at: "10:44",
    title: "Hub Assistant — suggestion",
    body: "Email à fort signal d'achat (3 questions techniques précises, mention « enthousiasme Direction »). Je recommande de répondre dans la journée. J'ai pré-rempli un brouillon citant les pages 12-14 de la proposition pour les points 1 et 2.",
    actions: ["Ouvrir le brouillon", "Ignorer"]
  }, {
    type: "call",
    at: "09:18",
    title: "Appel sortant — 22 min",
    who: "Romain Daviaud → Antoine Mercier (CISO)",
    note: "Validation du périmètre sécurité. Ouvert à un POC sur 50 utilisateurs.",
    color: "#10b981"
  }, {
    type: "divider",
    label: "Hier · lun. 25 mai"
  }, {
    type: "note",
    at: "16:30",
    who: "Augustin Morin",
    title: "Note privée",
    body: "Sentiment positif côté Direction. Le CFO veut voir le ROI à 18 mois. Préparer slide dédié pour jeudi.",
    color: "#64748b"
  }, {
    type: "stage",
    at: "11:05",
    title: "Étape avancée",
    from: "Discovery",
    to: "Proposition",
    who: "Augustin Morin"
  }, {
    type: "email",
    at: "09:22",
    from: "Augustin Morin",
    outbound: true,
    role: "Direction",
    subject: "Proposition Astorya Suite — version 2",
    body: "Bonjour Émilie, suite à notre échange de jeudi, vous trouverez ci-joint la proposition commerciale ajustée…",
    attachments: [{
      name: "Proposition-AXA-v2.pdf",
      size: "1,8 Mo"
    }],
    color: "#a855f7"
  }, {
    type: "divider",
    label: "Sem. dernière"
  }, {
    type: "meeting",
    at: "jeu. 21 mai · 10h",
    title: "Démo Astorya Suite",
    who: "5 participants AXA · 60 min",
    note: "Démo des modules Dashboard et Reporting. Très bon retour sur l'UX.",
    color: "#0ea5e9"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: accStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: accStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...accStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
    style: accStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya")), /*#__PURE__*/React.createElement("button", {
    style: accStyles.newBtn
  }, "+ Nouvelle opportunit\xE9 ", /*#__PURE__*/React.createElement("span", {
    style: accStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.navLabel
  }, "Espace"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...accStyles.navItem,
      ...accStyles.navItemActive
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.navCount
  }, "32")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.bullet
  }, "\u25F0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Comptes"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.navCount
  }, "412")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Contacts"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.navCount
  }, "1 184")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.bullet
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Activit\xE9s"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.navCount
  }, "27"))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.navLabel
  }, "R\xE9cents"), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...accStyles.miniLogo,
      background: "#1e40af"
    }
  }, "AX"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "AXA Wealth France")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...accStyles.miniLogo,
      background: "#0f766e"
    }
  }, "BP"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "BNP Asset Mgmt")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...accStyles.miniLogo,
      background: "#dc2626"
    }
  }, "GP"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Generali Patri.")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...accStyles.miniLogo,
      background: "#10b981"
    }
  }, "MI"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "MAIF Innovation"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: accStyles.userRow
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
      fontWeight: 600
    }
  }, "Romain Daviaud"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Direction \xB7 Astorya")))), /*#__PURE__*/React.createElement("main", {
    style: accStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: accStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("span", null, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "AXA Wealth France"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.refMono
  }, "OPP-2814")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: accStyles.iconBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.iconBtn
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.ghostBtn
  }, "Suivre"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.iconBtn
  }, "\u22EF"))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.body
  }, /*#__PURE__*/React.createElement("section", {
    style: accStyles.center
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.hero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.coLogoBig
  }, "AX"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.industryChip
  }, "Asset Management"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.metaChip
  }, "Grand compte \xB7 12 000 emp."), /*#__PURE__*/React.createElement("span", {
    style: accStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "Paris \xB7 La D\xE9fense"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.dot
  }), /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: 12,
      color: "#4f46e5",
      cursor: "pointer"
    }
  }, "axa-im.fr \u2197")), /*#__PURE__*/React.createElement("h1", {
    style: accStyles.h1
  }, "AXA Wealth France"), /*#__PURE__*/React.createElement("p", {
    style: accStyles.subtitle
  }, "Opportunit\xE9 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, "\xAB D\xE9ploiement Astorya Suite \u2014 750 si\xE8ges \xBB"), " \xB7 ouverte le 14 avril \xB7 cl\xF4ture cible 15 juin")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStats
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStat
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStatK
  }, "Montant"), /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStatV
  }, "215 000 \u20AC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "r\xE9current annuel")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStat
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStatK
  }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...accStyles.heroStatV,
      color: "#a855f7"
    }
  }, "55%"), /*#__PURE__*/React.createElement("div", {
    style: accStyles.miniBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "55%",
      height: "100%",
      background: "#a855f7",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStat
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStatK
  }, "Pond\xE9r\xE9"), /*#__PURE__*/React.createElement("div", {
    style: accStyles.heroStatV
  }, "118 250 \u20AC")))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.stageStrip
  }, [{
    k: "qualif",
    label: "Qualification",
    done: true,
    days: "3 j"
  }, {
    k: "discovery",
    label: "Discovery",
    done: true,
    days: "11 j"
  }, {
    k: "propo",
    label: "Proposition",
    active: true,
    days: "8 j"
  }, {
    k: "nego",
    label: "Négociation",
    next: true
  }, {
    k: "won",
    label: "Gagné"
  }].map((s, i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s.k
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.stageNode
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...accStyles.stageDot,
      background: s.done ? "#10b981" : s.active ? "#a855f7" : "#fff",
      border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
      color: "#fff"
    }
  }, s.done ? "✓" : s.active ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "#fff"
    }
  }) : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: s.active ? 700 : 600,
      color: s.done || s.active ? "#0f172a" : "#94a3b8",
      marginTop: 6
    }
  }, s.label), s.days && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      fontVariantNumeric: "tabular-nums",
      marginTop: 1
    }
  }, s.days)), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: s.done ? "#10b981" : "#eef1f5",
      borderRadius: 999,
      alignSelf: "flex-start",
      marginTop: 11
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.actionBar
  }, /*#__PURE__*/React.createElement("button", {
    style: accStyles.primaryBtn
  }, "Avancer en N\xE9gociation \u2192"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.ghostBtn
  }, "\uD83D\uDCE7 Envoyer un email"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.ghostBtn
  }, "\uD83D\uDCC5 Planifier RDV"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.ghostBtn
  }, "\uD83D\uDCDE Logger appel"), /*#__PURE__*/React.createElement("button", {
    style: accStyles.ghostBtn
  }, "\uD83D\uDCCE Joindre fichier"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: accStyles.dangerGhost
  }, "Marquer perdu"))), /*#__PURE__*/React.createElement("div", {
    style: accStyles.tabRow
  }, [{
    k: "act",
    label: "Activité",
    c: 47,
    active: true
  }, {
    k: "emails",
    label: "Emails",
    c: 18
  }, {
    k: "meetings",
    label: "RDV",
    c: 6
  }, {
    k: "notes",
    label: "Notes",
    c: 9
  }, {
    k: "files",
    label: "Fichiers",
    c: 12
  }, {
    k: "tasks",
    label: "Tâches",
    c: 4
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    style: {
      ...accStyles.subTab,
      ...(t.active ? accStyles.subTabActive : {})
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: t.active ? "#4f46e5" : "#94a3b8",
      marginLeft: 4,
      fontVariantNumeric: "tabular-nums"
    }
  }, t.c))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: accStyles.filterPill
  }, "Filtrer")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.timeline
  }, /*#__PURE__*/React.createElement("div", {
    style: accStyles.tlSpine
  }), activities.map((a, i) => {
    if (a.type === "divider") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlDiv
      }, /*#__PURE__*/React.createElement("span", {
        style: accStyles.tlDivLabel
      }, a.label));
    }
    if (a.type === "stage") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#a855f7"
        }
      }, "\u2197"), /*#__PURE__*/React.createElement("div", {
        style: accStyles.tlContent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5
        }
      }, /*#__PURE__*/React.createElement("strong", {
        style: {
          color: "#0f172a",
          fontWeight: 600
        }
      }, a.who), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#64748b"
        }
      }, "a avanc\xE9 l'\xE9tape"), /*#__PURE__*/React.createElement("span", {
        style: {
          ...accStyles.miniPill,
          background: "#eef4ff",
          color: "#1d4ed8"
        }
      }, a.from), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#cbd5e1"
        }
      }, "\u2192"), /*#__PURE__*/React.createElement("span", {
        style: {
          ...accStyles.miniPill,
          background: "#f5efff",
          color: "#7e22ce"
        }
      }, a.to)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#94a3b8",
          marginTop: 2
        }
      }, a.at)));
    }
    if (a.type === "ai") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#0f172a",
          color: "#fff"
        }
      }, "\u2605"), /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlContent,
          background: "#0f172a",
          borderColor: "#0f172a",
          padding: "12px 14px",
          borderRadius: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#fff"
        }
      }, "Hub Assistant"), /*#__PURE__*/React.createElement("span", {
        style: {
          ...accStyles.roleTag,
          background: "rgba(255,255,255,0.1)",
          color: "#cbd5e1",
          border: "1px solid rgba(255,255,255,0.15)"
        }
      }, "IA \xB7 Insight"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "rgba(255,255,255,0.5)"
        }
      }, a.at)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          lineHeight: 1.55,
          color: "#cbd5e1"
        }
      }, a.body), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          marginTop: 10
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: accStyles.aiBtnPrimary
      }, a.actions[0]), /*#__PURE__*/React.createElement("button", {
        style: accStyles.aiBtn
      }, a.actions[1]))));
    }
    if (a.type === "email") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: a.outbound ? "#eef2ff" : "#fff",
          color: a.outbound ? "#4f46e5" : "#a855f7",
          border: `1.5px solid ${a.outbound ? "#c7d2fe" : "#e9d5ff"}`
        }
      }, "\u2709"), /*#__PURE__*/React.createElement("div", {
        style: accStyles.tlContent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: a.from,
        size: 20,
        color: a.color
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a"
        }
      }, a.from), a.role && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#64748b"
        }
      }, "\xB7 ", a.role), a.outbound && /*#__PURE__*/React.createElement("span", {
        style: accStyles.roleTag
      }, "Sortant"), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#94a3b8"
        }
      }, a.at)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: 4
        }
      }, a.subject), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "#475569",
          lineHeight: 1.55,
          whiteSpace: "pre-line"
        }
      }, a.body), a.attachments && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          marginTop: 10
        }
      }, a.attachments.map(at => /*#__PURE__*/React.createElement("div", {
        key: at.name,
        style: accStyles.attach
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
      }, at.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: "#94a3b8",
          fontVariantNumeric: "tabular-nums"
        }
      }, at.size)))))));
    }
    if (a.type === "call") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#e8f8f1",
          color: "#0e7a55",
          border: "1.5px solid #bbf7d0"
        }
      }, "\u260E"), /*#__PURE__*/React.createElement("div", {
        style: accStyles.tlContent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a"
        }
      }, a.title), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#94a3b8"
        }
      }, a.at)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: "#64748b",
          marginTop: 2
        }
      }, a.who), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "#475569",
          marginTop: 6,
          padding: "8px 10px",
          background: "#fafbfc",
          border: "1px solid #eef1f5",
          borderRadius: 6,
          lineHeight: 1.5
        }
      }, a.note)));
    }
    if (a.type === "meeting") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#e0f2fe",
          color: "#0369a1",
          border: "1.5px solid #bae6fd"
        }
      }, "\uD83D\uDC65"), /*#__PURE__*/React.createElement("div", {
        style: accStyles.tlContent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a"
        }
      }, a.title), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#94a3b8"
        }
      }, a.at)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: "#64748b",
          marginTop: 2
        }
      }, a.who), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "#475569",
          marginTop: 6
        }
      }, a.note)));
    }
    if (a.type === "note") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#fffbeb",
          color: "#a65f00",
          border: "1.5px solid #fde68a"
        }
      }, "\u270E"), /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlContent,
          background: "#fffbeb",
          borderColor: "#fde68a"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: a.who,
        size: 20
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a"
        }
      }, a.title), /*#__PURE__*/React.createElement("span", {
        style: {
          ...accStyles.roleTag,
          background: "#fff6e6",
          color: "#a65f00",
          borderColor: "#fde68a"
        }
      }, "Priv\xE9e"), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#94a3b8"
        }
      }, a.at)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "#475569",
          marginTop: 6,
          lineHeight: 1.55
        }
      }, a.body)));
    }
    if (a.type === "task") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: accStyles.tlEvent
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlIcon,
          background: "#eef2ff",
          color: "#4f46e5",
          border: "1.5px dashed #c7d2fe"
        }
      }, a.icon), /*#__PURE__*/React.createElement("div", {
        style: {
          ...accStyles.tlContent,
          background: "#fafbff",
          borderColor: "#e0e7ff",
          borderStyle: "dashed"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a"
        }
      }, a.title), /*#__PURE__*/React.createElement("span", {
        style: {
          ...accStyles.roleTag,
          background: "#eef2ff",
          color: "#4f46e5",
          borderColor: "#c7d2fe"
        }
      }, "\xC0 venir"), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#4f46e5",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums"
        }
      }, a.at)), a.meta && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: "#64748b",
          marginTop: 4
        }
      }, a.meta), a.attendees && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#94a3b8"
        }
      }, "Participants :"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: -4
        }
      }, a.attendees.map((n, j) => /*#__PURE__*/React.createElement("span", {
        key: n,
        style: {
          marginLeft: j === 0 ? 0 : -6
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: n,
        size: 20
      })))))));
    }
    return null;
  }))), /*#__PURE__*/React.createElement("aside", {
    style: accStyles.side
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 18px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: accStyles.sideHead
  }, "Contacts cl\xE9s ", /*#__PURE__*/React.createElement("span", {
    style: accStyles.sideCount
  }, "5")), [{
    name: "Émilie Roux",
    role: "VP Innovation",
    color: "#a855f7",
    champion: true,
    last: "il y a 2 h"
  }, {
    name: "Antoine Mercier",
    role: "CISO",
    color: "#dc2626",
    last: "il y a 8 h"
  }, {
    name: "Julien Pasquier",
    role: "CFO",
    color: "#0ea5e9",
    last: "il y a 4 j"
  }, {
    name: "Marie Lopez",
    role: "Head of Ops",
    color: "#f59e0b",
    last: "il y a 1 sem."
  }, {
    name: "Sébastien Roy",
    role: "Procurement",
    color: "#10b981",
    coldZone: true,
    last: "il y a 3 sem."
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: accStyles.contactRow
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: 28,
    color: p.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, p.name), p.champion && /*#__PURE__*/React.createElement("span", {
    style: accStyles.championPill
  }, "\u2605 Champion"), p.coldZone && /*#__PURE__*/React.createElement("span", {
    style: accStyles.coldPill
  }, "\u2744 Froid")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, p.role, " \xB7 ", p.last)), /*#__PURE__*/React.createElement("button", {
    style: accStyles.iconMini
  }, "\u2709"))), /*#__PURE__*/React.createElement("button", {
    style: accStyles.addPill
  }, "+ Ajouter un contact")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: accStyles.sideHead
  }, "D\xE9tails"), /*#__PURE__*/React.createElement(Field, {
    label: "Owner",
    value: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Augustin Morin",
      size: 20,
      color: "#a855f7"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, "Augustin Morin"))
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Co-owner",
    value: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Romain Daviaud",
      size: 20,
      color: "#6366f1"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, "Romain Daviaud"))
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Source",
    value: /*#__PURE__*/React.createElement("span", {
      style: accStyles.fieldChip
    }, "Salon Finovate Paris")
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Produit",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        ...accStyles.fieldChip,
        background: "#f5efff",
        color: "#7e22ce"
      }
    }, "Astorya Suite")
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Concurrent",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#475569"
      }
    }, "Salesforce \xB7 Pega")
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Close date",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a",
        fontVariantNumeric: "tabular-nums"
      }
    }, "15 juin 2026")
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Cr\xE9ation",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#64748b"
      }
    }, "14 avril \xB7 il y a 42 j")
  })), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: accStyles.sideHead
  }, "Score d'engagement"), /*#__PURE__*/React.createElement("div", {
    style: accStyles.scoreBox
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 32,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -1,
      fontFamily: "'Inter', system-ui, sans-serif"
    }
  }, "78"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#64748b"
    }
  }, "/ 100"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.scoreTrend
  }, "\u2191 +12 sem.")), /*#__PURE__*/React.createElement("div", {
    style: accStyles.scoreBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "78%",
      height: "100%",
      background: "linear-gradient(90deg, #4f46e5, #a855f7)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 6
    }
  }, "3 d\xE9cideurs identifi\xE9s \xB7 18 emails \xE9chang\xE9s \xB7 6 RDV"))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: accStyles.sideHead
  }, "\xC9tiquettes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: accStyles.tag
  }, "# Grand-compte"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.tag
  }, "# Top-10 Q2"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.tag
  }, "# Migration Salesforce"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.tag
  }, "# DORA"), /*#__PURE__*/React.createElement("span", {
    style: accStyles.addPill
  }, "+"))))))));
};
var Field = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", {
  style: accStyles.field
}, /*#__PURE__*/React.createElement("div", {
  style: accStyles.fieldLabel
}, label), /*#__PURE__*/React.createElement("div", {
  style: accStyles.fieldValue
}, value));
var accStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
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
  bullet: {
    width: 14,
    color: "#94a3b8",
    fontSize: 11
  },
  miniLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 700
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
    padding: "0 20px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  refMono: {
    fontVariantNumeric: "tabular-nums",
    fontSize: 11,
    color: "#94a3b8",
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    marginLeft: 6
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
  dangerGhost: {
    padding: "6px 12px",
    border: "1px solid #fecaca",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12,
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 500
  },
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden"
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    borderRight: "1px solid #eef1f5",
    overflow: "hidden"
  },
  hero: {
    padding: "18px 24px 14px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff"
  },
  coLogoBig: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: "#1e40af",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
    flexShrink: 0
  },
  industryChip: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#eef2ff",
    color: "#4338ca",
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
    margin: "2px 0 0",
    color: "#0f172a",
    lineHeight: 1.2
  },
  subtitle: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "6px 0 0"
  },
  heroStats: {
    display: "flex",
    gap: 14,
    flexShrink: 0,
    paddingLeft: 16,
    borderLeft: "1px solid #eef1f5"
  },
  heroStat: {
    minWidth: 90
  },
  heroStatK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 600
  },
  heroStatV: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    letterSpacing: -0.4,
    marginTop: 2
  },
  miniBar: {
    width: "100%",
    height: 3,
    background: "#f5efff",
    borderRadius: 999,
    marginTop: 4
  },
  stageStrip: {
    display: "flex",
    alignItems: "flex-start",
    marginTop: 18,
    padding: "0 6px"
  },
  stageNode: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 80
  },
  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700
  },
  actionBar: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #eef1f5",
    flexWrap: "wrap"
  },
  tabRow: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "8px 24px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff"
  },
  subTab: {
    padding: "5px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  subTabActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
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
  // Timeline
  timeline: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 24px 24px",
    position: "relative"
  },
  tlSpine: {
    position: "absolute",
    left: 24 + 14,
    top: 24,
    bottom: 24,
    width: 1.5,
    background: "linear-gradient(180deg, transparent, #eef1f5 12px, #eef1f5 calc(100% - 12px), transparent)"
  },
  tlDiv: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "16px 0 10px"
  },
  tlDivLabel: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: 700,
    padding: "2px 8px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 999
  },
  tlEvent: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
    position: "relative",
    zIndex: 1
  },
  tlIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    background: "#fff",
    border: "1.5px solid #eef1f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    flexShrink: 0,
    color: "#475569",
    boxShadow: "0 0 0 4px #fafbfc"
  },
  tlContent: {
    flex: 1,
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    minWidth: 0
  },
  miniPill: {
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 600
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
  attach: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 6
  },
  aiBtnPrimary: {
    padding: "6px 12px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  aiBtn: {
    padding: "6px 12px",
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer"
  },
  // Side
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
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sideCount: {
    fontSize: 10,
    padding: "0 6px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "7px 4px",
    borderBottom: "1px solid #f1f5f9"
  },
  championPill: {
    fontSize: 9.5,
    padding: "0px 5px",
    borderRadius: 3,
    background: "#fffbeb",
    color: "#a65f00",
    fontWeight: 700,
    border: "1px solid #fde68a"
  },
  coldPill: {
    fontSize: 9.5,
    padding: "0px 5px",
    borderRadius: 3,
    background: "#eff6ff",
    color: "#1e40af",
    fontWeight: 600
  },
  iconMini: {
    width: 24,
    height: 24,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 11
  },
  addPill: {
    padding: "4px 9px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 999,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    marginTop: 8
  },
  field: {
    display: "flex",
    alignItems: "center",
    padding: "5px 0",
    gap: 10,
    minHeight: 28
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748b",
    width: 90,
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
  scoreBox: {
    padding: 14,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "linear-gradient(180deg, #fafbff, #f5f7fa)"
  },
  scoreTrend: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 999,
    background: "#e8f8f1",
    color: "#0e7a55",
    fontWeight: 600,
    marginLeft: "auto"
  },
  scoreBar: {
    width: "100%",
    height: 6,
    background: "#eef1f5",
    borderRadius: 999,
    marginTop: 10,
    overflow: "hidden"
  },
  tag: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    color: "#475569",
    fontWeight: 500
  }
};
window.CRMAccount = CRMAccount;