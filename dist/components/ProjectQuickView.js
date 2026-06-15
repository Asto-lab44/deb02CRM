// ════════════════════════════════════════════════════════════════════
// ProjectQuickView — fenêtre modale "fiche projet rapide" depuis le Kanban
// ════════════════════════════════════════════════════════════════════
//
// Inspiré du tableau Monday "1.0 - ADV Astorya".
// 3 colonnes :
//   • Gauche  : infos détaillées du projet
//   • Centre  : aperçu PDF du Bon de Livraison (si disponible)
//   • Droite  : fil de discussion / messages collaboratifs
//
// L'utilisateur peut toujours aller voir la fiche complète via le bouton
// "Voir la fiche complète".
// ════════════════════════════════════════════════════════════════════

var ProjectQuickView = ({
  projectId,
  onClose,
  onChanged
}) => {
  var [proj, setProj] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [messageDraft, setMessageDraft] = React.useState("");
  var [posting, setPosting] = React.useState(false);
  var reload = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      var p = await window.api.projects.getById(projectId);
      setProj(p || null);
    } catch (e) {
      console.warn("[ProjectQuickView]", e);
    }
    setLoading(false);
  }, [projectId]);
  React.useEffect(() => {
    reload();
  }, [reload]);

  // Esc → fermer
  React.useEffect(() => {
    var h = e => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  var postMessage = async () => {
    var txt = messageDraft.trim();
    if (!txt || !proj) return;
    setPosting(true);
    try {
      await window.api.projects.addEvent(proj.id, "message", {
        text: txt
      });
      setMessageDraft("");
      await reload();
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Envoi : " + (e.message || e));
    }
    setPosting(false);
  };
  var STAGE_LABEL = {
    recu: "Reçu",
    preparation: "Préparation",
    pret_livrer: "Prêt à livrer",
    livre: "Livré",
    installe: "Installé",
    clos: "Clos",
    annule: "Annulé"
  };
  var STAGE_COLOR = {
    recu: {
      bg: "#f1f5f9",
      c: "#475569"
    },
    preparation: {
      bg: "#f5efff",
      c: "#7e22ce"
    },
    pret_livrer: {
      bg: "#fef0e6",
      c: "#9a3412"
    },
    livre: {
      bg: "#fffbeb",
      c: "#854d0e"
    },
    installe: {
      bg: "#e0f4fc",
      c: "#075985"
    },
    clos: {
      bg: "#dcfce7",
      c: "#065f46"
    },
    annule: {
      bg: "#fee2e2",
      c: "#991b1b"
    }
  };
  var fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) : "—";
  var fmtDateTime = d => d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "—";
  var fmtEUR = n => n != null ? (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + " €" : "—";

  // Fil de discussion : on garde les events de type "message" + qq events système clés
  var messages = (proj && proj.events || []).slice().sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.55)",
      zIndex: 9999,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      padding: 24,
      backdropFilter: "blur(2px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 1500,
      background: "#fff",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 24px 60px rgba(0,0,0,0.35)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 22px",
      borderBottom: "1px solid #eef1f5",
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, "Fiche projet rapide"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, proj ? proj.name : loading ? "Chargement…" : "Projet introuvable")), proj && proj.stage && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 700,
      background: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).bg,
      color: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).c
    }
  }, STAGE_LABEL[proj.stage] || proj.stage), proj && /*#__PURE__*/React.createElement("a", {
    href: "/projet?id=" + encodeURIComponent(proj.id),
    style: {
      padding: "8px 14px",
      borderRadius: 8,
      background: "#0f172a",
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, "Voir la fiche compl\xE8te \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      fontSize: 18,
      color: "#475569",
      cursor: "pointer"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      gridTemplateColumns: "320px 1fr 360px",
      minHeight: 0,
      height: "calc(100vh - 130px)"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      borderRight: "1px solid #eef1f5",
      overflowY: "auto",
      background: "#fafbfc"
    }
  }, !proj ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 30,
      color: "#94a3b8",
      fontSize: 12
    }
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px"
    }
  }, /*#__PURE__*/React.createElement(InfoRow, {
    label: "Groupe",
    value: STAGE_LABEL[proj.stage] || proj.stage,
    colored: STAGE_COLOR[proj.stage]
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Nom",
    value: proj.name,
    bold: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Client",
    value: proj.client_name || "—"
  }), proj.client_id && /*#__PURE__*/React.createElement(InfoRow, {
    label: "ID client",
    value: proj.client_id,
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Date butoir",
    value: fmtDate(proj.delivery_due)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Date confirm\xE9e",
    value: fmtDate(proj.delivered_at)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Cat\xE9gorie",
    value: proj.data && proj.data.category || "Matériel",
    colored: {
      bg: "#dbeafe",
      c: "#1d4ed8"
    }
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Statut g\xE9n\xE9ral",
    value: STAGE_LABEL[proj.stage] || proj.stage,
    colored: STAGE_COLOR[proj.stage]
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "BL",
    value: proj.data && proj.data.bl_doc_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Commande li\xE9e",
    value: proj.data && proj.data.commande_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Opportunit\xE9 li\xE9e",
    value: proj.opportunity_id || proj.data && proj.data.opportunity_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Chef de projet",
    value: proj.pm_name || "—"
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Montant HT",
    value: fmtEUR(proj.amount_ht)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Montant TTC",
    value: fmtEUR(proj.amount_ttc)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "R\xE9f. Sage",
    value: proj.sage_ref || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Journal de cr\xE9ation",
    value: fmtDateTime(proj.created_at)
  }), proj.description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "Description"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#0f172a",
      lineHeight: 1.55,
      background: "#fff",
      padding: 12,
      borderRadius: 8,
      border: "1px solid #eef1f5",
      whiteSpace: "pre-wrap"
    }
  }, proj.description)))), /*#__PURE__*/React.createElement("section", {
    style: {
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: "#f3f5f8"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 18px",
      borderBottom: "1px solid #eef1f5",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCC4 Bon de livraison"), proj && proj.data && proj.data.bl_pdf_url && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: proj.data.bl_pdf_url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 11.5,
      color: "#1d4ed8",
      textDecoration: "none",
      fontWeight: 600
    }
  }, "\u2197 Ouvrir en plein \xE9cran"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: 12
    }
  }, proj && proj.data && proj.data.bl_pdf_url ? /*#__PURE__*/React.createElement("iframe", {
    src: proj.data.bl_pdf_url,
    title: "BL PDF",
    style: {
      width: "100%",
      height: "100%",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      background: "#fff"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#94a3b8",
      textAlign: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      marginBottom: 10
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#475569"
    }
  }, "Aucun BL PDF disponible"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      marginTop: 6,
      lineHeight: 1.5,
      maxWidth: 360
    }
  }, "Le BL PDF est g\xE9n\xE9r\xE9 automatiquement quand le cascade workflow transforme la commande en bon de livraison. Si ce projet a \xE9t\xE9 cr\xE9\xE9 avant ce flux, il sera disponible au prochain BL.")))), /*#__PURE__*/React.createElement("aside", {
    style: {
      borderLeft: "1px solid #eef1f5",
      display: "flex",
      flexDirection: "column",
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 18px",
      borderBottom: "1px solid #eef1f5",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, "\uD83D\uDCAC Mises \xE0 jour", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "\xB7 ", messages.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "12px 14px"
    }
  }, messages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#94a3b8",
      fontSize: 12,
      textAlign: "center",
      marginTop: 30
    }
  }, "Aucun message pour l'instant. R\xE9dige ci-dessous pour partager une info avec l'\xE9quipe.") : messages.map(m => /*#__PURE__*/React.createElement(MessageBubble, {
    key: m.id || m.created_at,
    m: m
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #eef1f5",
      padding: 12,
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: messageDraft,
    onChange: e => setMessageDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postMessage();
    },
    placeholder: "R\xE9digez une mise \xE0 jour (Ctrl/Cmd + Entr\xE9e pour envoyer)",
    style: {
      width: "100%",
      minHeight: 68,
      resize: "vertical",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 10,
      fontSize: 12.5,
      fontFamily: "inherit",
      color: "#0f172a",
      background: "#fff",
      boxSizing: "border-box",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 8,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: postMessage,
    disabled: !messageDraft.trim() || posting,
    style: {
      padding: "8px 14px",
      borderRadius: 8,
      background: messageDraft.trim() ? "#0f172a" : "#cbd5e1",
      color: "#fff",
      border: "none",
      fontSize: 12,
      fontWeight: 600,
      cursor: messageDraft.trim() ? "pointer" : "not-allowed"
    }
  }, posting ? "Envoi…" : "Publier")))))));
};

// ─── Helpers locaux ───
var InfoRow = ({
  label,
  value,
  mono,
  bold,
  colored
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #eef1f5"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  }
}, label), colored ? /*#__PURE__*/React.createElement("span", {
  style: {
    justifySelf: "start",
    padding: "3px 10px",
    borderRadius: 999,
    background: colored.bg,
    color: colored.c,
    fontSize: 11.5,
    fontWeight: 700
  }
}, value || "—") : /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12.5,
    color: "#0f172a",
    fontWeight: bold ? 700 : 500,
    fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
}, value || "—"));
var MessageBubble = ({
  m
}) => {
  var EVENT_META = {
    message: {
      icon: "💬",
      label: null,
      bg: "#fff",
      c: "#0f172a"
    },
    created: {
      icon: "🆕",
      label: "Projet créé",
      bg: "#f1f5f9",
      c: "#475569"
    },
    stage_change: {
      icon: "🔁",
      label: "Changement d'étape",
      bg: "#fef3c7",
      c: "#92400e"
    },
    team_add: {
      icon: "👥",
      label: "Membre ajouté",
      bg: "#dbeafe",
      c: "#1e40af"
    },
    delivery_note_created: {
      icon: "📄",
      label: "BL généré",
      bg: "#dcfce7",
      c: "#065f46"
    },
    delivery_note_signed: {
      icon: "✍️",
      label: "BL signé",
      bg: "#dcfce7",
      c: "#065f46"
    }
  };
  var meta = EVENT_META[m.type] || {
    icon: "•",
    label: m.type,
    bg: "#f1f5f9",
    c: "#475569"
  };
  var created = m.created_at ? new Date(m.created_at).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }) : "";
  var text = m.payload && m.payload.text || (meta.label ? meta.label + (m.payload && m.payload.from ? " : " + m.payload.from : m.payload && m.payload.to ? " → " + m.payload.to : "") : "");
  if (m.type === "message") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10,
        padding: "10px 12px",
        background: "#fff",
        border: "1px solid #eef1f5",
        borderRadius: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#7e22ce",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700
      }
    }, (m.author_name || "?").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "#0f172a",
        flex: 1
      }
    }, m.author_name || "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8"
      }
    }, created)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "#0f172a",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap"
      }
    }, text));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8,
      padding: "6px 10px",
      background: meta.bg,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", null, meta.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: meta.c,
      fontWeight: 500
    }
  }, text), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: meta.c,
      opacity: 0.7
    }
  }, created));
};
window.ProjectQuickView = ProjectQuickView;