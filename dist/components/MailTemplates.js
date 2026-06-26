// MailTemplates — Gestion des modèles d'emails réutilisables
//
// Permet de créer / éditer / supprimer des templates, de prévisualiser
// avec un contexte fictif, et de tester l'ouverture Outlook Web.

var MailTemplates = () => {
  var [templates, setTemplates] = React.useState([]);
  var [editing, setEditing] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [filter, setFilter] = React.useState("all");
  var load = async () => {
    setLoading(true);
    try {
      var list = await window.api.emailTemplates.list();
      setTemplates(list || []);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };
  React.useEffect(() => {
    load();
  }, []);
  var categories = [{
    k: "introduction",
    label: "Introduction",
    color: "#3b82f6",
    bg: "#dbeafe"
  }, {
    k: "relance",
    label: "Relance",
    color: "#ea580c",
    bg: "#fed7aa"
  }, {
    k: "devis",
    label: "Devis",
    color: "#a855f7",
    bg: "#e9d5ff"
  }, {
    k: "remerciement",
    label: "Remerciement",
    color: "#10b981",
    bg: "#d1fae5"
  }, {
    k: "rdv",
    label: "RDV",
    color: "#0ea5e9",
    bg: "#bae6fd"
  }, {
    k: "autre",
    label: "Autre",
    color: "#64748b",
    bg: "#e2e8f0"
  }];
  var catMeta = k => categories.find(c => c.k === k) || categories[5];
  var filtered = filter === "all" ? templates : templates.filter(t => t.category === filter);
  var startNew = () => {
    setEditing({
      id: null,
      name: "",
      category: "introduction",
      subject: "",
      body: ""
    });
  };
  var startEdit = t => setEditing({
    ...t
  });
  var cancelEdit = () => setEditing(null);
  var save = async () => {
    if (!editing.name.trim()) {
      window.HubToast && window.HubToast.warn("Renseigne un nom");
      return;
    }
    try {
      if (editing.id) {
        await window.api.emailTemplates.update(editing.id, {
          name: editing.name,
          category: editing.category,
          subject: editing.subject,
          body: editing.body
        });
        window.HubToast && window.HubToast.success("✓ Template mis à jour");
      } else {
        await window.api.emailTemplates.create({
          name: editing.name,
          category: editing.category,
          subject: editing.subject,
          body: editing.body
        });
        window.HubToast && window.HubToast.success("✓ Template créé");
      }
      setEditing(null);
      load();
    } catch (e) {
      window.HubToast && window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var removeTemplate = async t => {
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Supprimer ce template ?",
      message: "« " + t.name + " » sera supprimé.",
      okStyle: "danger",
      okLabel: "Supprimer"
    }) : confirm("Supprimer « " + t.name + " » ?");
    if (!ok) return;
    await window.api.emailTemplates.remove(t.id);
    window.HubToast && window.HubToast.success("✓ Template supprimé");
    load();
  };
  var previewCompose = t => {
    var ctx = {
      client_name: "ATPS",
      raison_sociale: "ATPS Conseils",
      contact_prenom: "Jean",
      contact_nom: "Dupont",
      contact_fonction: "Directeur",
      opportunity_name: "Refonte infra",
      amount: "12 500 €",
      owner_name: "Romain Daviaud"
    };
    window.api.emailTemplates.composeOutlookWeb({
      to: "",
      template: t,
      ctx
    });
    window.HubToast && window.HubToast.info("📧 Outlook Web ouvert avec contexte fictif");
  };
  var insertVar = variable => {
    var ta = document.getElementById("tpl-body-textarea");
    if (!ta) return;
    var start = ta.selectionStart,
      end = ta.selectionEnd;
    var newVal = editing.body.slice(0, start) + "{" + variable + "}" + editing.body.slice(end);
    setEditing({
      ...editing,
      body: newVal
    });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 10);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/accueil-simple",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, "Accueil"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Templates email")), /*#__PURE__*/React.createElement("button", {
    onClick: startNew,
    style: S.primaryBtn
  }, "+ Nouveau template")), /*#__PURE__*/React.createElement("div", {
    style: S.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "\uD83D\uDCE7 Templates d'emails"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, "Mod\xE8les r\xE9utilisables \u2014 pr\xE9-remplissent le compose Outlook Web avec contexte client/opportunit\xE9."))), /*#__PURE__*/React.createElement("div", {
    style: S.filters
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilter("all"),
    style: {
      ...S.filterBtn,
      ...(filter === "all" ? S.filterBtnActive : {})
    }
  }, "Toutes ", /*#__PURE__*/React.createElement("span", {
    style: S.count
  }, templates.length)), categories.map(c => {
    var n = templates.filter(t => t.category === c.k).length;
    return /*#__PURE__*/React.createElement("button", {
      key: c.k,
      onClick: () => setFilter(c.k),
      style: {
        ...S.filterBtn,
        ...(filter === c.k ? {
          ...S.filterBtnActive,
          background: c.color,
          borderColor: c.color
        } : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: c.color,
        display: "inline-block",
        marginRight: 6
      }
    }), c.label, " ", /*#__PURE__*/React.createElement("span", {
      style: S.count
    }, n));
  })), /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, loading && /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Chargement\u2026"), !loading && filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun template \u2014 clique sur \xAB + Nouveau template \xBB pour cr\xE9er ton premier mod\xE8le."), /*#__PURE__*/React.createElement("div", {
    style: S.grid
  }, filtered.map(t => {
    var meta = catMeta(t.category);
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: S.card
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.chip,
        background: meta.bg,
        color: meta.color
      }
    }, meta.label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => previewCompose(t),
      title: "Pr\xE9visualiser dans Outlook Web",
      style: S.iconBtn
    }, "\uD83D\uDCE4"), /*#__PURE__*/React.createElement("button", {
      onClick: () => startEdit(t),
      title: "Modifier",
      style: S.iconBtn
    }, "\u270E"), /*#__PURE__*/React.createElement("button", {
      onClick: () => removeTemplate(t),
      title: "Supprimer",
      style: {
        ...S.iconBtn,
        color: "#dc2626"
      }
    }, "\uD83D\uDDD1"))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 4
      }
    }, t.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginBottom: 8,
        fontStyle: "italic"
      }
    }, t.subject || "(sans sujet)"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#475569",
        maxHeight: 80,
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        lineHeight: 1.4,
        textOverflow: "ellipsis"
      }
    }, (t.body || "").slice(0, 200), (t.body || "").length > 200 ? "…" : ""));
  }))), editing && /*#__PURE__*/React.createElement("div", {
    onClick: cancelEdit,
    style: S.modalOverlay
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: S.modal
  }, /*#__PURE__*/React.createElement("header", {
    style: S.modalHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, editing.id ? "✎ Modifier le template" : "+ Nouveau template"), /*#__PURE__*/React.createElement("button", {
    onClick: cancelEdit,
    style: S.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Nom du template *"), /*#__PURE__*/React.createElement("input", {
    value: editing.name,
    onChange: e => setEditing({
      ...editing,
      name: e.target.value
    }),
    placeholder: "Ex : Relance J+5 sans r\xE9ponse",
    style: S.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Cat\xE9gorie"), /*#__PURE__*/React.createElement("select", {
    value: editing.category,
    onChange: e => setEditing({
      ...editing,
      category: e.target.value
    }),
    style: S.input
  }, categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.k,
    value: c.k
  }, c.label))))), /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Sujet"), /*#__PURE__*/React.createElement("input", {
    value: editing.subject,
    onChange: e => setEditing({
      ...editing,
      subject: e.target.value
    }),
    placeholder: "Ex : Suivi devis {opportunity_name}",
    style: {
      ...S.input,
      marginBottom: 14
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Corps du message"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginBottom: 6
    }
  }, "Variables disponibles (clique pour ins\xE9rer) :"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginBottom: 8
    }
  }, ["client_name", "contact_prenom", "contact_nom", "contact_fonction", "opportunity_name", "amount", "owner_name", "date_du_jour"].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => insertVar(v),
    style: S.varBtn
  }, "{" + v + "}"))), /*#__PURE__*/React.createElement("textarea", {
    id: "tpl-body-textarea",
    value: editing.body,
    onChange: e => setEditing({
      ...editing,
      body: e.target.value
    }),
    rows: 12,
    placeholder: "Bonjour {contact_prenom} {contact_nom},\n\nSuite à notre échange concernant {opportunity_name}, je vous adresse...",
    style: {
      ...S.input,
      fontFamily: "'SF Mono', Consolas, monospace",
      fontSize: 12,
      lineHeight: 1.6,
      resize: "vertical"
    }
  }), /*#__PURE__*/React.createElement("footer", {
    style: S.modalFoot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: cancelEdit,
    style: S.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => previewCompose(editing),
    style: {
      ...S.ghostBtn,
      color: "#0e7a55",
      borderColor: "#a7f3d0",
      background: "#ecfdf5"
    }
  }, "\uD83D\uDCE4 Tester avec Outlook Web"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: S.primaryBtn
  }, editing.id ? "💾 Mettre à jour" : "+ Créer")))));
};
var S = {
  frame: {
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  topbar: {
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  titleRow: {
    padding: "20px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    letterSpacing: -0.5
  },
  h1sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0"
  },
  filters: {
    display: "flex",
    gap: 6,
    padding: "12px 28px",
    background: "#fafbfc",
    borderBottom: "1px solid #eef1f5",
    flexWrap: "wrap"
  },
  filterBtn: {
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  },
  filterBtnActive: {
    background: "#0f172a",
    color: "#fff",
    borderColor: "#0f172a"
  },
  count: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.06)",
    marginLeft: 4
  },
  body: {
    padding: "20px 28px 60px"
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontStyle: "italic"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 14
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: 14,
    transition: "box-shadow 120ms",
    cursor: "default"
  },
  chip: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  iconBtn: {
    width: 26,
    height: 26,
    padding: 0,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12
  },
  primaryBtn: {
    padding: "8px 16px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  ghostBtn: {
    padding: "8px 14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 600
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 720,
    maxHeight: "92vh",
    overflow: "auto",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)"
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  modalFoot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
    paddingTop: 14,
    borderTop: "1px solid #eef1f5"
  },
  closeBtn: {
    width: 32,
    height: 32,
    border: "none",
    background: "#f1f5f9",
    borderRadius: 8,
    fontSize: 18,
    cursor: "pointer",
    fontWeight: 700
  },
  lbl: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
    display: "block"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none"
  },
  varBtn: {
    padding: "3px 8px",
    border: "1px dashed #c7d2fe",
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 600,
    fontFamily: "'SF Mono', Consolas, monospace",
    cursor: "pointer"
  }
};
window.MailTemplates = MailTemplates;