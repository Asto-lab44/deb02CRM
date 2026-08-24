// ════════════════════════════════════════════════════════════════════
// Fournisseurs — annuaire fournisseurs Astorya (importé du tableau compta).
// Chaque fournisseur porte une NOTE D'IMPORTANCE pour l'entreprise, dérivée
// de la répartition par coûts annuels (data.cost_bracket) mais réglable à la
// main : stratégique (5★) / important (4★) / standard (3★) / secondaire (2★).
// Table éditable + fiche détaillée : n° de compte, type & délai de paiement,
// boîte mail de réception de la facture, TVA intracom, contacts, notes.
// S'appuie sur window.api.suppliers (Supabase → fallback localStorage).
// ════════════════════════════════════════════════════════════════════
var Fournisseurs = () => {
  var A = window.api && window.api.suppliers;

  // Niveaux d'importance (note) — ordre décroissant.
  var TIERS = [{
    k: "strategique",
    label: "Stratégique",
    note: 5,
    color: "#b91c1c",
    bg: "#fef2f2",
    hint: "Achats > 50 000 € / an — dépendance forte"
  }, {
    k: "important",
    label: "Important",
    note: 4,
    color: "#c2410c",
    bg: "#fff7ed",
    hint: "Achats 10 000 – 50 000 € / an"
  }, {
    k: "standard",
    label: "Standard",
    note: 3,
    color: "#a16207",
    bg: "#fefce8",
    hint: "Achats 5 000 – 10 000 € / an"
  }, {
    k: "secondaire",
    label: "Secondaire",
    note: 2,
    color: "#0369a1",
    bg: "#f0f9ff",
    hint: "Achats < 5 000 € / an — ponctuel"
  }];
  var tierOf = k => TIERS.find(t => t.k === k) || TIERS[3];
  var stars = n => "★".repeat(n) + "☆".repeat(5 - n);
  var [rows, setRows] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [q, setQ] = React.useState("");
  var [tierF, setTierF] = React.useState("all");
  var [sort, setSort] = React.useState("importance"); // importance | name
  var [edit, setEdit] = React.useState(null);

  // Enrichissement d'affichage : si une ligne (venue de la base) n'a pas
  // encore les détails du tableau compta, on les superpose depuis les défauts
  // (match sur nom normalisé). Les valeurs déjà saisies priment toujours.
  var norm = n => String(n || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  var enrich = list => {
    var defs = A && A.defaults && A.defaults() || [];
    var byName = {};
    defs.forEach(d => {
      byName[norm(d.name)] = d;
    });
    return (list || []).map(r => {
      var d = byName[norm(r.name)];
      if (!d) return r;
      var hasDetail = r.data && (r.data.importance || r.data.account_number || r.data.payment_type || r.data.invoice_mailbox);
      if (hasDetail) return r; // déjà renseigné → on ne touche pas
      return {
        ...r,
        payment_terms: r.payment_terms || d.payment_terms,
        data: {
          ...(d.data || {}),
          ...(r.data || {})
        }
      };
    });
  };
  var reload = React.useCallback(async () => {
    if (!A) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(enrich((await A.list({
        active: true
      })) || []));
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
  }, [reload]);
  var impOf = r => r.data && r.data.importance || "secondaire";
  var noteOf = r => r.data && r.data.importance_note || tierOf(impOf(r)).note;
  var filtered = rows.filter(r => tierF === "all" || impOf(r) === tierF).filter(r => {
    if (!q.trim()) return true;
    var s = q.toLowerCase();
    var d = r.data || {};
    return [r.name, r.category, d.account_number, d.payment_type, r.payment_terms, d.invoice_mailbox].some(v => String(v || "").toLowerCase().includes(s));
  }).sort((a, b) => sort === "name" ? String(a.name).localeCompare(String(b.name)) : noteOf(b) - noteOf(a) || String(a.name).localeCompare(String(b.name)));
  var counts = TIERS.map(t => ({
    ...t,
    n: rows.filter(r => impOf(r) === t.k).length
  }));
  var openNew = () => setEdit({
    name: "",
    category: "",
    payment_terms: "",
    data: {
      importance: "secondaire",
      importance_note: 2
    }
  });
  var openEdit = r => setEdit(JSON.parse(JSON.stringify(r)));
  var setD = patch => setEdit(e => ({
    ...e,
    data: {
      ...(e.data || {}),
      ...patch
    }
  }));
  var setImportance = k => setD({
    importance: k,
    importance_note: tierOf(k).note
  });
  var save = async () => {
    var e = edit;
    if (!e.name || !e.name.trim()) {
      (window.HubToast ? window.HubToast.error : alert)("Nom du fournisseur requis");
      return;
    }
    try {
      var payload = {
        name: e.name.trim(),
        category: e.category || null,
        payment_terms: e.payment_terms || null,
        notes: e.notes || null,
        data: e.data || {}
      };
      if (e.id) await A.update(e.id, payload);else await A.create(payload);
      setEdit(null);
      await reload();
      if (window.HubToast) window.HubToast.success("Fournisseur enregistré");
    } catch (err) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (err.message || err));
    }
  };
  var remove = async r => {
    if (!confirm("Retirer « " + r.name + " » de l'annuaire ?")) return;
    try {
      await A.remove(r.id);
      await reload();
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
  };
  var [importing, setImporting] = React.useState(false);
  var importDefaults = async () => {
    if (!A.importDefaults) return;
    if (!confirm("Importer / compléter l'annuaire depuis le tableau compta (109 fournisseurs) ?\n\nLes fournisseurs existants sont enrichis sans écraser vos saisies ; les manquants sont créés.")) return;
    setImporting(true);
    try {
      var r = await A.importDefaults();
      await reload();
      (window.HubToast ? window.HubToast.success : alert)("Import terminé : " + r.created + " créé(s), " + r.updated + " mis à jour.");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setImporting(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: ST.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: ST.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
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
  }, "Fournisseurs")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: importDefaults,
    disabled: importing,
    style: {
      ...ST.btnGhost,
      opacity: importing ? 0.6 : 1
    },
    title: "Importer / compl\xE9ter depuis le tableau compta (109 fournisseurs)"
  }, importing ? "Import…" : "⟳ Importer le tableau compta"), /*#__PURE__*/React.createElement("button", {
    onClick: openNew,
    style: ST.btnPrimary
  }, "+ Nouveau fournisseur"))), /*#__PURE__*/React.createElement("div", {
    style: ST.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: ST.h1
  }, "\uD83C\uDFF7\uFE0F Fournisseurs"), /*#__PURE__*/React.createElement("p", {
    style: ST.sub
  }, "Annuaire fournisseurs class\xE9s par importance pour l'entreprise. Cliquez une ligne pour l'\xE9diter."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 28px 4px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setTierF("all"),
    style: {
      ...ST.statCard,
      ...(tierF === "all" ? ST.statOn : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800
    }
  }, rows.length), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      fontWeight: 600
    }
  }, "Tous")), counts.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTierF(tierF === t.k ? "all" : t.k),
    style: {
      ...ST.statCard,
      background: t.bg,
      ...(tierF === t.k ? {
        boxShadow: "0 0 0 2px " + t.color + " inset"
      } : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: t.color
    }
  }, t.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: t.color
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      letterSpacing: -1
    }
  }, "★".repeat(t.note)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 28px 4px",
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Rechercher un fournisseur, compte, mode de paiement\u2026",
    style: {
      ...ST.input,
      flex: 1,
      minWidth: 240
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: sort,
    onChange: e => setSort(e.target.value),
    style: {
      ...ST.input,
      width: 190
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "importance"
  }, "Trier par importance"), /*#__PURE__*/React.createElement("option", {
    value: "name"
  }, "Trier par nom (A\u2192Z)")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#94a3b8"
    }
  }, filtered.length, " affich\xE9", filtered.length > 1 ? "s" : "")), loading ? /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 28px 60px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "#f8fafc",
      textAlign: "left",
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "Fournisseur"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "Importance"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "Compte"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "Paiement"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "D\xE9lai"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "R\xE9cup. facture"), /*#__PURE__*/React.createElement("th", {
    style: ST.th
  }, "TVA intracom"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...ST.th,
      textAlign: "right"
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, filtered.map(r => {
    var t = tierOf(impOf(r));
    var d = r.data || {};
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id,
      style: {
        borderTop: "1px solid #f1f5f9",
        cursor: "pointer"
      },
      onClick: () => openEdit(r),
      onMouseEnter: e => e.currentTarget.style.background = "#fafbff",
      onMouseLeave: e => e.currentTarget.style.background = "#fff"
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...ST.td,
        fontWeight: 600
      }
    }, r.name, r.category ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        background: "#f1f5f9",
        color: "#64748b",
        padding: "1px 6px",
        borderRadius: 999
      }
    }, r.category) : null), /*#__PURE__*/React.createElement("td", {
      style: ST.td
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        fontSize: 10.5,
        fontWeight: 700,
        color: t.color,
        background: t.bg,
        padding: "2px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        letterSpacing: -1
      }
    }, stars(noteOf(r))), " ", t.label)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...ST.td,
        fontFamily: "monospace",
        color: "#475569"
      }
    }, d.account_number || "—"), /*#__PURE__*/React.createElement("td", {
      style: ST.td
    }, d.payment_type || "—"), /*#__PURE__*/React.createElement("td", {
      style: ST.td
    }, r.payment_terms || "—"), /*#__PURE__*/React.createElement("td", {
      style: {
        ...ST.td,
        maxWidth: 220,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: "#64748b"
      },
      title: d.invoice_mailbox || ""
    }, d.invoice_mailbox || "—"), /*#__PURE__*/React.createElement("td", {
      style: {
        ...ST.td,
        textAlign: "center"
      }
    }, d.tva_intracom ? "✔ " + d.tva_intracom : "—"), /*#__PURE__*/React.createElement("td", {
      style: {
        ...ST.td,
        textAlign: "right",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        openEdit(r);
      },
      style: ST.mini
    }, "\u270E"), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        remove(r);
      },
      style: {
        ...ST.mini,
        color: "#dc2626",
        marginLeft: 4
      }
    }, "\xD7")));
  }), !filtered.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    style: ST.empty
  }, "Aucun fournisseur ne correspond.")))))), edit && /*#__PURE__*/React.createElement("div", {
    style: ST.overlay,
    onClick: () => setEdit(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 4px",
      fontSize: 16
    }
  }, edit.id ? "Éditer le fournisseur" : "Nouveau fournisseur"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 14px",
      fontSize: 11.5,
      color: "#94a3b8"
    }
  }, "La note d'importance sert \xE0 prioriser le suivi et les relances fournisseurs."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Nom *"), /*#__PURE__*/React.createElement("input", {
    value: edit.name || "",
    onChange: e => setEdit({
      ...edit,
      name: e.target.value
    }),
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Cat\xE9gorie"), /*#__PURE__*/React.createElement("input", {
    value: edit.category || "",
    onChange: e => setEdit({
      ...edit,
      category: e.target.value
    }),
    placeholder: "Distributeur, SaaS\u2026",
    style: ST.input
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Importance pour l'entreprise (note)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 6
    }
  }, TIERS.map(t => {
    var on = ((edit.data || {}).importance || "secondaire") === t.k;
    return /*#__PURE__*/React.createElement("button", {
      key: t.k,
      onClick: () => setImportance(t.k),
      style: {
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        border: on ? "2px solid " + t.color : "1px solid #e2e8f0",
        background: on ? t.bg : "#fff"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: t.color
      }
    }, t.label, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        letterSpacing: -1
      }
    }, "★".repeat(t.note))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        marginTop: 2
      }
    }, t.hint));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "N\xB0 de compte"), /*#__PURE__*/React.createElement("input", {
    value: (edit.data || {}).account_number || "",
    onChange: e => setD({
      account_number: e.target.value
    }),
    placeholder: "401XXX",
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "TVA intracom (n\xB0)"), /*#__PURE__*/React.createElement("input", {
    value: (edit.data || {}).tva_intracom || "",
    onChange: e => setD({
      tva_intracom: e.target.value
    }),
    style: ST.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Type de paiement"), /*#__PURE__*/React.createElement("input", {
    value: (edit.data || {}).payment_type || "",
    onChange: e => setD({
      payment_type: e.target.value
    }),
    placeholder: "pr\xE9l\xE8vement, virement, carte\u2026",
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "D\xE9lai de paiement"), /*#__PURE__*/React.createElement("input", {
    value: edit.payment_terms || "",
    onChange: e => setEdit({
      ...edit,
      payment_terms: e.target.value
    }),
    placeholder: "30 jours FdM\u2026",
    style: ST.input
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "O\xF9 r\xE9cup\xE9rer / router la facture"), /*#__PURE__*/React.createElement("textarea", {
    value: (edit.data || {}).invoice_mailbox || "",
    onChange: e => setD({
      invoice_mailbox: e.target.value
    }),
    rows: 2,
    style: {
      ...ST.input,
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Contacts"), /*#__PURE__*/React.createElement("input", {
    value: (edit.data || {}).contacts || "",
    onChange: e => setD({
      contacts: e.target.value
    }),
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Notes internes"), /*#__PURE__*/React.createElement("textarea", {
    value: edit.notes || "",
    onChange: e => setEdit({
      ...edit,
      notes: e.target.value
    }),
    rows: 2,
    style: {
      ...ST.input,
      resize: "vertical"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, edit.id && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      remove(edit);
      setEdit(null);
    },
    style: {
      ...ST.btnGhost,
      color: "#dc2626"
    }
  }, "Supprimer")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEdit(null),
    style: ST.btnGhost
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: ST.btnPrimary
  }, "Enregistrer"))))));
};
var ST = {
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
    justifyContent: "space-between"
  },
  titleRow: {
    padding: "20px 28px 6px",
    background: "#fff"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    letterSpacing: -0.5
  },
  sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0"
  },
  btnGhost: {
    padding: "8px 14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "8px 14px",
    border: 0,
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer"
  },
  statOn: {
    boxShadow: "0 0 0 2px #4f46e5 inset"
  },
  th: {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    whiteSpace: "nowrap"
  },
  td: {
    padding: "9px 12px",
    verticalAlign: "middle"
  },
  mini: {
    padding: "3px 8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    fontStyle: "italic"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    width: "100%",
    maxWidth: 620,
    maxHeight: "90vh",
    overflowY: "auto"
  },
  lbl: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "inherit"
  }
};
window.Fournisseurs = Fournisseurs;