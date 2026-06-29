// InboundRequests — File des demandes de devis entrantes (devis.astorya@gmail.com)
//
// Liste les emails reçus → tâches « Devis à faire ». Permet de :
//  - voir le contenu de l'email + l'extraction IA
//  - rattacher manuellement un client si non identifié
//  - créer le devis pré-rempli (ouvre /gestion-commerciale)
//  - marquer comme traité / ignorer
//  - saisir manuellement une demande (copier-coller d'un email)

var InboundRequests = () => {
  var [requests, setRequests] = React.useState([]);
  var [clients, setClients] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [filter, setFilter] = React.useState("all");
  var [selected, setSelected] = React.useState(null);
  var [showManual, setShowManual] = React.useState(false);
  var [manual, setManual] = React.useState({
    from_name: "",
    from_email: "",
    subject: "",
    body_text: ""
  });
  var load = async () => {
    setLoading(true);
    try {
      var [reqs, cls] = await Promise.all([window.api.inboundRequests.list(), window.api.clients.list().catch(() => [])]);
      setRequests(reqs || []);
      setClients(cls || []);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };
  React.useEffect(() => {
    load();
  }, []);
  var statusMeta = {
    a_traiter: {
      label: "À traiter",
      color: "#ea580c",
      bg: "#fed7aa"
    },
    client_identifie: {
      label: "Client identifié",
      color: "#3730a3",
      bg: "#e0e7ff"
    },
    devis_cree: {
      label: "Devis créé",
      color: "#10b981",
      bg: "#d1fae5"
    },
    ignore: {
      label: "Ignoré",
      color: "#64748b",
      bg: "#e2e8f0"
    }
  };
  var urgencyMeta = {
    haute: {
      label: "Urgent",
      color: "#dc2626",
      bg: "#fee2e2"
    },
    moyenne: {
      label: "Normal",
      color: "#a16207",
      bg: "#fef3c7"
    },
    basse: {
      label: "Faible",
      color: "#64748b",
      bg: "#e2e8f0"
    }
  };
  var filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  var counts = {
    all: requests.length,
    a_traiter: requests.filter(r => r.status === "a_traiter").length,
    client_identifie: requests.filter(r => r.status === "client_identifie").length,
    devis_cree: requests.filter(r => r.status === "devis_cree").length
  };
  var fmtDate = iso => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };
  var clientName = id => {
    var c = clients.find(x => x.id === id);
    return c ? c.raison_sociale || c.name : null;
  };
  var attachClient = async (req, client_id) => {
    if (!client_id) return;
    await window.api.inboundRequests.attachClient(req.id, client_id);
    window.HubToast && window.HubToast.success("✓ Client rattaché");
    load();
  };
  var createDevis = req => {
    var cid = req.client_id || "";
    if (!cid) {
      window.HubToast && window.HubToast.warn("Rattache d'abord un client");
      return;
    }
    // Pré-remplit la note du devis avec le besoin extrait
    var note = encodeURIComponent("Demande reçue par email — " + (req.ai_summary || req.subject || ""));
    window.location.href = "/gestion-commerciale?client=" + encodeURIComponent(cid) + "&inbound=" + encodeURIComponent(req.id) + "&note=" + note;
  };
  var markCreated = async req => {
    await window.api.inboundRequests.markDevisCreated(req.id, null);
    window.HubToast && window.HubToast.success("✓ Marqué comme devis créé");
    load();
  };
  var ignore = async req => {
    await window.api.inboundRequests.update(req.id, {
      status: "ignore"
    });
    load();
  };
  var saveManual = async () => {
    if (!manual.from_email.trim()) {
      window.HubToast && window.HubToast.warn("Email expéditeur requis");
      return;
    }
    // Match auto par email
    var match = await window.api.inboundRequests.matchClientByEmail(manual.from_email);
    await window.api.inboundRequests.create({
      ...manual,
      client_id: match ? match.client_id : null,
      match_method: match ? match.method : "none",
      ai_summary: manual.subject
    });
    window.HubToast && window.HubToast.success("✓ Demande enregistrée + tâche « Devis à faire » créée");
    setShowManual(false);
    setManual({
      from_name: "",
      from_email: "",
      subject: "",
      body_text: ""
    });
    load();
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
    href: "/crm",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Demandes de devis entrantes")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManual(true),
    style: S.primaryBtn
  }, "+ Saisir une demande")), /*#__PURE__*/React.createElement("div", {
    style: S.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "\uD83D\uDCE5 Demandes de devis entrantes"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, "Emails re\xE7us sur ", /*#__PURE__*/React.createElement("strong", null, "devis.astorya@gmail.com"), " \u2014 chaque demande g\xE9n\xE8re une t\xE2che \xAB Devis \xE0 faire \xBB."))), /*#__PURE__*/React.createElement("div", {
    style: S.filters
  }, [{
    k: "all",
    label: "Toutes",
    c: counts.all
  }, {
    k: "a_traiter",
    label: "À traiter",
    c: counts.a_traiter
  }, {
    k: "client_identifie",
    label: "Client identifié",
    c: counts.client_identifie
  }, {
    k: "devis_cree",
    label: "Devis créé",
    c: counts.devis_cree
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setFilter(t.k),
    style: {
      ...S.filterBtn,
      ...(filter === t.k ? S.filterBtnActive : {})
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: S.count
  }, t.c)))), /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, loading && /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Chargement\u2026"), !loading && filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucune demande ", filter !== "all" ? "dans ce statut" : "pour le moment", ".", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Les emails re\xE7us sur ", /*#__PURE__*/React.createElement("strong", null, "devis.astorya@gmail.com"), " appara\xEEtront ici automatiquement."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, filtered.map(req => {
    var sm = statusMeta[req.status] || statusMeta.a_traiter;
    var um = urgencyMeta[req.ai_urgency] || urgencyMeta.moyenne;
    var cName = clientName(req.client_id);
    var open = selected === req.id;
    return /*#__PURE__*/React.createElement("div", {
      key: req.id,
      style: S.card
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: S.mailIcon
    }, "\u2709"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, req.subject || "(sans sujet)"), /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.chip,
        background: sm.bg,
        color: sm.color
      }
    }, sm.label), /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.chip,
        background: um.bg,
        color: um.color
      }
    }, um.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b"
      }
    }, "De : ", /*#__PURE__*/React.createElement("strong", null, req.from_name || req.from_email), " <", req.from_email, "> \xB7 ", fmtDate(req.received_at)), req.ai_summary && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#475569",
        marginTop: 6,
        padding: "6px 10px",
        background: "#f8fafc",
        borderRadius: 6,
        borderLeft: "3px solid #a855f7"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "#a855f7",
        textTransform: "uppercase",
        letterSpacing: 0.4
      }
    }, "R\xE9sum\xE9 IA"), /*#__PURE__*/React.createElement("br", null), req.ai_summary, req.ai_amount_hint && /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, " \xB7 ", req.ai_amount_hint)), Array.isArray(req.ai_products) && req.ai_products.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        marginTop: 6,
        flexWrap: "wrap"
      }
    }, req.ai_products.map((p, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        fontSize: 10.5,
        padding: "2px 7px",
        borderRadius: 4,
        background: "#eef2ff",
        color: "#3730a3",
        fontWeight: 600
      }
    }, p)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelected(open ? null : req.id),
      style: S.miniBtn
    }, open ? "Masquer" : "Voir l'email"))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap"
      }
    }, req.client_id ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#0f172a"
      }
    }, "\uD83C\uDFE2 Client : ", /*#__PURE__*/React.createElement("strong", null, cName || req.client_id), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        marginLeft: 6
      }
    }, "(", req.match_method === "email_exact" ? "match email" : req.match_method === "domain" ? "match domaine" : "manuel", ")")) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#dc2626",
        fontWeight: 600
      }
    }, "\u26A0 Client \xE0 identifier :"), /*#__PURE__*/React.createElement("select", {
      onChange: e => e.target.value && attachClient(req, e.target.value),
      defaultValue: "",
      style: {
        ...S.input,
        width: 240,
        padding: "5px 8px",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "\u2014 Rattacher \xE0 un client \u2014"), clients.map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.raison_sociale || c.name)))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), req.status !== "devis_cree" && req.status !== "ignore" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => createDevis(req),
      disabled: !req.client_id,
      style: {
        ...S.actionBtn,
        background: req.client_id ? "#4f46e5" : "#cbd5e1",
        cursor: req.client_id ? "pointer" : "not-allowed"
      }
    }, "\uD83D\uDCC4 Cr\xE9er le devis"), /*#__PURE__*/React.createElement("button", {
      onClick: () => markCreated(req),
      style: S.ghostBtn
    }, "\u2713 Devis fait"), /*#__PURE__*/React.createElement("button", {
      onClick: () => ignore(req),
      style: {
        ...S.ghostBtn,
        color: "#dc2626"
      }
    }, "Ignorer"))), open && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        padding: 12,
        background: "#fafbfc",
        border: "1px solid #eef1f5",
        borderRadius: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#334155",
        whiteSpace: "pre-wrap",
        lineHeight: 1.5,
        maxHeight: 320,
        overflow: "auto"
      }
    }, req.body_text || req.body_excerpt || "(corps vide)")));
  }))), showManual && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowManual(false),
    style: S.overlay
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: S.modal
  }, /*#__PURE__*/React.createElement("header", {
    style: S.modalHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 700
    }
  }, "+ Saisir une demande manuellement"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManual(false),
    style: S.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 0
    }
  }, "Copie-colle un email re\xE7u. Le client sera match\xE9 automatiquement par email/domaine, et une t\xE2che \xAB Devis \xE0 faire \xBB sera cr\xE9\xE9e."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Nom exp\xE9diteur"), /*#__PURE__*/React.createElement("input", {
    value: manual.from_name,
    onChange: e => setManual({
      ...manual,
      from_name: e.target.value
    }),
    style: S.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Email exp\xE9diteur *"), /*#__PURE__*/React.createElement("input", {
    value: manual.from_email,
    onChange: e => setManual({
      ...manual,
      from_email: e.target.value
    }),
    placeholder: "contact@client.fr",
    style: S.input
  }))), /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Sujet"), /*#__PURE__*/React.createElement("input", {
    value: manual.subject,
    onChange: e => setManual({
      ...manual,
      subject: e.target.value
    }),
    style: {
      ...S.input,
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: S.lbl
  }, "Corps de l'email"), /*#__PURE__*/React.createElement("textarea", {
    value: manual.body_text,
    onChange: e => setManual({
      ...manual,
      body_text: e.target.value
    }),
    rows: 8,
    style: {
      ...S.input,
      resize: "vertical",
      lineHeight: 1.5
    }
  }), /*#__PURE__*/React.createElement("footer", {
    style: S.modalFoot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManual(false),
    style: S.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: saveManual,
    style: S.primaryBtn
  }, "+ Cr\xE9er la demande + t\xE2che")))));
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
    cursor: "pointer"
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
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: 14
  },
  mailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#fef3c7",
    color: "#a16207",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0
  },
  chip: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  miniBtn: {
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap"
  },
  actionBtn: {
    padding: "7px 14px",
    border: "none",
    color: "#fff",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700
  },
  ghostBtn: {
    padding: "7px 12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 7,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 600
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
  lbl: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
    display: "block"
  },
  overlay: {
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
    maxWidth: 640,
    maxHeight: "92vh",
    overflow: "auto",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)"
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  modalFoot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
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
  }
};
window.InboundRequests = InboundRequests;