// ════════════════════════════════════════════════════════════════════
// Contrats — Abonnements récurrents & facturation périodique.
//
// Chaque contrat signé est saisi ici (client, type, périodicité, montant,
// options, mode de règlement). Il « vit » avec ses options (ajout/retrait).
// À chaque période : « Générer les factures » crée UNE facture d'abonnement
// par client (via window.api.subscriptions → pipeline facture/PDF/compta),
// et « Export prélèvement SEPA » produit le fichier CSV pour la banque (BNP).
// ════════════════════════════════════════════════════════════════════
var Contrats = () => {
  var fmtEUR = window.HubConstants && window.HubConstants.fmtEUR || (n => (Number(n) || 0).toFixed(2) + " €");
  var S = window.api && window.api.subscriptions;
  var now = new Date();
  var [month, setMonth] = React.useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
  var [rows, setRows] = React.useState([]);
  var [clients, setClients] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [busy, setBusy] = React.useState("");
  var [q, setQ] = React.useState("");
  var [sel, setSel] = React.useState({});
  var [edit, setEdit] = React.useState(null); // contrat en édition (ou {} = nouveau)

  var periodTo = (() => {
    var [y, m] = month.split("-").map(Number);
    return new Date(y, m, 0).toISOString().slice(0, 10);
  })();
  var reload = React.useCallback(async () => {
    if (!S) return;
    setLoading(true);
    try {
      var [list, cls] = await Promise.all([S.list(), window.api.clients.list().catch(() => [])]);
      setRows(list || []);
      setClients(cls || []);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
  }, [reload]);
  var clientName = c => c.client_name || (clients.find(x => x.id === c.client_id) || {}).raison_sociale || (clients.find(x => x.id === c.client_id) || {}).name || "—";
  var filtered = rows.filter(c => {
    var t = (clientName(c) + " " + c.type_contrat).toLowerCase();
    return !q || t.includes(q.toLowerCase());
  });
  var monthLabel = (() => {
    var [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });
  })();
  var navMonth = d => {
    var [y, m] = month.split("-").map(Number);
    var nd = new Date(y, m - 1 + d, 1);
    setMonth(nd.getFullYear() + "-" + String(nd.getMonth() + 1).padStart(2, "0"));
  };
  var isDue = c => (c.status || "active") === "active" && (!c.next_billing || c.next_billing <= periodTo);
  var monthlyOf = c => c.options && c.options.filter(o => o.active !== false).length ? c.options.filter(o => o.active !== false).reduce((s, o) => s + (Number(o.montant_ht) || 0), 0) : Number(c.monthly_eur) || 0;
  var download = (filename, content, mime) => {
    var blob = new Blob([content], {
      type: (mime || "text/plain") + ";charset=utf-8"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  var selIds = Object.keys(sel).filter(k => sel[k]);
  var genInvoices = async () => {
    if (!(window.HubModal ? await window.HubModal.confirm({
      title: "Générer les factures d'abonnement ?",
      message: "Une facture (brouillon) sera créée par client pour les contrats dus au " + periodTo + "."
    }) : confirm("Générer les factures d'abonnement ?"))) return;
    setBusy("gen");
    try {
      var r = await S.generateInvoices({
        to: periodTo,
        ids: selIds.length ? selIds : null
      });
      await reload();
      setSel({});
      (window.HubToast ? window.HubToast.success : alert)((r.created || 0) + " facture(s) d'abonnement générée(s) (brouillon).");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setBusy("");
  };
  var exportSepa = async () => {
    setBusy("sepa");
    try {
      var {
        filename,
        content
      } = await S.sepaExport({
        to: periodTo,
        ids: selIds.length ? selIds : null
      });
      download(filename, content, "text/csv");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur SEPA : " + (e.message || e));
    }
    setBusy("");
  };
  var saveEdit = async c => {
    setBusy("save");
    try {
      await S.save(c);
      setEdit(null);
      await reload();
      (window.HubToast ? window.HubToast.success : alert)("Contrat enregistré.");
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
    setBusy("");
  };
  var removeC = async c => {
    if (!(window.HubModal ? await window.HubModal.confirm({
      title: "Supprimer le contrat ?",
      message: clientName(c) + " — " + c.type_contrat,
      okStyle: "danger"
    }) : confirm("Supprimer ?"))) return;
    try {
      await S.remove(c.id);
      await reload();
    } catch (e) {}
  };
  var dueCount = filtered.filter(isDue).length;
  var totalDue = filtered.filter(isDue).reduce((s, c) => s + monthlyOf(c), 0);
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
  }, "Contrats & abonnements")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navMonth(-1),
    style: ST.navBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      textTransform: "capitalize",
      minWidth: 130,
      textAlign: "center"
    }
  }, monthLabel), /*#__PURE__*/React.createElement("button", {
    onClick: () => navMonth(1),
    style: ST.navBtn
  }, "\u203A"))), /*#__PURE__*/React.createElement("div", {
    style: ST.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: ST.h1
  }, "\uD83D\uDCC4 Contrats & abonnements"), /*#__PURE__*/React.createElement("p", {
    style: ST.sub
  }, "Facturation r\xE9currente par client + pr\xE9l\xE8vement SEPA.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEdit({
      periodicity: "mensuel",
      payment_mode: "prelevement",
      tva_rate: 20,
      status: "active",
      options: [],
      next_billing: month + "-01"
    }),
    style: ST.btnGhost
  }, "+ Nouveau contrat"), /*#__PURE__*/React.createElement("button", {
    onClick: exportSepa,
    disabled: busy === "sepa",
    style: ST.btnGhost
  }, busy === "sepa" ? "…" : "🏦 Export prélèvement SEPA"), /*#__PURE__*/React.createElement("button", {
    onClick: genInvoices,
    disabled: busy === "gen",
    style: ST.btnPrimary
  }, busy === "gen" ? "Génération…" : "⚡ Générer les factures" + (selIds.length ? " (" + selIds.length + ")" : "")))), /*#__PURE__*/React.createElement("div", {
    style: ST.kpis
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.kpiK
  }, "Contrats actifs"), /*#__PURE__*/React.createElement("div", {
    style: ST.kpiV
  }, filtered.filter(c => c.status === "active").length)), /*#__PURE__*/React.createElement("div", {
    style: ST.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.kpiK
  }, "\xC0 facturer (", monthLabel, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.kpiV,
      color: "#4f46e5"
    }
  }, dueCount)), /*#__PURE__*/React.createElement("div", {
    style: ST.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.kpiK
  }, "Montant HT \xE0 facturer"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.kpiV,
      color: "#0e7a55"
    }
  }, fmtEUR(totalDue)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 28px 8px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Rechercher (client, type de contrat\u2026)",
    style: ST.search
  })), loading ? /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: ST.body
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.row,
      ...ST.rowH
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Client"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110
    }
  }, "Derni\xE8re fact."), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110
    }
  }, "Prochaine \xE9ch."), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Type de contrat"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90
    }
  }, "R\xE8glement"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right"
    }
  }, "Montant HT"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 150,
      textAlign: "right"
    }
  }, "Actions")), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Aucun contrat. Cliquez \xAB + Nouveau contrat \xBB.") : filtered.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      ...ST.row,
      opacity: c.status === "active" ? 1 : 0.55
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26
    }
  }, isDue(c) && /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!sel[c.id],
    onChange: e => setSel(s => ({
      ...s,
      [c.id]: e.target.checked
    }))
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, clientName(c)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      fontSize: 11.5,
      color: "#64748b"
    }
  }, c.last_billed ? c.last_billed.split("-").reverse().join("/") : "Jamais"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      fontSize: 11.5,
      color: isDue(c) ? "#c2410c" : "#64748b",
      fontWeight: isDue(c) ? 700 : 400
    }
  }, c.next_billing ? c.next_billing.split("-").reverse().join("/") : "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: ST.chip
  }, c.type_contrat || c.name)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      fontSize: 11
    }
  }, c.payment_mode === "prelevement" ? "Prélèvement" : "Virement"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums"
    }
  }, fmtEUR(monthlyOf(c))), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 150,
      textAlign: "right",
      display: "flex",
      gap: 6,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEdit(c),
    style: ST.mini
  }, "\xC9diter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeC(c),
    style: {
      ...ST.mini,
      color: "#dc2626"
    }
  }, "Suppr."))))), edit && /*#__PURE__*/React.createElement(ContratModal, {
    contrat: edit,
    clients: clients,
    onClose: () => setEdit(null),
    onSave: saveEdit,
    busy: busy === "save",
    fmtEUR: fmtEUR
  }));
};

// ── Modal création / édition d'un contrat (avec options +/-) ──────────
var ContratModal = ({
  contrat,
  clients,
  onClose,
  onSave,
  busy,
  fmtEUR
}) => {
  var [c, setC] = React.useState(() => ({
    options: [],
    ...contrat
  }));
  var set = (k, v) => setC(s => ({
    ...s,
    [k]: v
  }));
  var setOpt = (i, k, v) => setC(s => ({
    ...s,
    options: s.options.map((o, j) => j === i ? {
      ...o,
      [k]: v
    } : o)
  }));
  var addOpt = () => setC(s => ({
    ...s,
    options: [...(s.options || []), {
      label: "",
      montant_ht: 0,
      tva_rate: c.tva_rate || 20,
      active: true
    }]
  }));
  var rmOpt = i => setC(s => ({
    ...s,
    options: s.options.filter((_, j) => j !== i)
  }));
  var total = (c.options || []).filter(o => o.active !== false).reduce((s, o) => s + (Number(o.montant_ht) || 0), 0) || Number(c.monthly_eur) || 0;
  var inp = {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    boxSizing: "border-box"
  };
  var lbl = {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: "0 0 4px"
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: ST.overlay
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: ST.modal
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17
    }
  }, c.id ? "Éditer le contrat" : "Nouveau contrat"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: ST.x
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / 3"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Client"), /*#__PURE__*/React.createElement("select", {
    value: c.client_id || "",
    onChange: e => {
      var cl = clients.find(x => x.id === e.target.value);
      set("client_id", e.target.value);
      set("client_name", cl ? cl.raison_sociale || cl.name : "");
    },
    style: inp
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 S\xE9lectionner \u2014"), clients.map(cl => /*#__PURE__*/React.createElement("option", {
    key: cl.id,
    value: cl.id
  }, cl.raison_sociale || cl.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Type de contrat"), /*#__PURE__*/React.createElement("input", {
    value: c.type_contrat || "",
    onChange: e => set("type_contrat", e.target.value),
    placeholder: "Maintenance, H\xE9bergement\u2026",
    style: inp
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "P\xE9riodicit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: c.periodicity || "mensuel",
    onChange: e => set("periodicity", e.target.value),
    style: inp
  }, ["mensuel", "bimestriel", "trimestriel", "semestriel", "annuel"].map(p => /*#__PURE__*/React.createElement("option", {
    key: p,
    value: p
  }, p)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Prochaine \xE9ch\xE9ance"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: c.next_billing || "",
    onChange: e => set("next_billing", e.target.value),
    style: inp
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Statut"), /*#__PURE__*/React.createElement("select", {
    value: c.status || "active",
    onChange: e => set("status", e.target.value),
    style: inp
  }, /*#__PURE__*/React.createElement("option", {
    value: "active"
  }, "Actif"), /*#__PURE__*/React.createElement("option", {
    value: "suspended"
  }, "Suspendu"), /*#__PURE__*/React.createElement("option", {
    value: "terminated"
  }, "R\xE9sili\xE9"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Mode de r\xE8glement"), /*#__PURE__*/React.createElement("select", {
    value: c.payment_mode || "prelevement",
    onChange: e => set("payment_mode", e.target.value),
    style: inp
  }, /*#__PURE__*/React.createElement("option", {
    value: "prelevement"
  }, "Pr\xE9l\xE8vement SEPA"), /*#__PURE__*/React.createElement("option", {
    value: "virement"
  }, "Virement"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "TVA %"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: c.tva_rate != null ? c.tva_rate : 20,
    onChange: e => set("tva_rate", Number(e.target.value)),
    style: inp
  })), (c.payment_mode || "prelevement") === "prelevement" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "IBAN"), /*#__PURE__*/React.createElement("input", {
    value: c.iban || "",
    onChange: e => set("iban", e.target.value),
    style: inp
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "BIC"), /*#__PURE__*/React.createElement("input", {
    value: c.bic || "",
    onChange: e => set("bic", e.target.value),
    style: inp
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "RUM (r\xE9f. mandat)"), /*#__PURE__*/React.createElement("input", {
    value: c.rum || "",
    onChange: e => set("rum", e.target.value),
    style: inp
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Options / lignes de l'abonnement"), /*#__PURE__*/React.createElement("button", {
    onClick: addOpt,
    style: ST.mini
  }, "+ Ajouter une option")), (c.options || []).length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#94a3b8",
      margin: "4px 0"
    }
  }, "Aucune option \u2014 le montant mensuel ci-dessous sera factur\xE9. Ajoutez des options pour d\xE9tailler (factur\xE9es en +/\u2212).") : (c.options || []).map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: o.active !== false,
    onChange: e => setOpt(i, "active", e.target.checked),
    title: "Active ce mois"
  }), /*#__PURE__*/React.createElement("input", {
    value: o.label || "",
    onChange: e => setOpt(i, "label", e.target.value),
    placeholder: "Libell\xE9 de l'option",
    style: {
      ...inp,
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: o.montant_ht || 0,
    onChange: e => setOpt(i, "montant_ht", Number(e.target.value)),
    placeholder: "HT",
    style: {
      ...inp,
      width: 110
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => rmOpt(i),
    style: {
      ...ST.mini,
      color: "#dc2626"
    }
  }, "\xD7"))), (!c.options || c.options.length === 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: lbl
  }, "Montant mensuel HT"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: c.monthly_eur || 0,
    onChange: e => set("monthly_eur", Number(e.target.value)),
    style: {
      ...inp,
      width: 180
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 18,
      paddingTop: 14,
      borderTop: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, "Total HT / \xE9ch\xE9ance : ", /*#__PURE__*/React.createElement("strong", null, fmtEUR(total))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: ST.btnGhost
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSave(c),
    disabled: busy || !c.client_id,
    style: ST.btnPrimary
  }, busy ? "…" : "Enregistrer")))));
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
  navBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 7,
    fontSize: 15,
    fontWeight: 700,
    color: "#475569",
    cursor: "pointer"
  },
  titleRow: {
    padding: "20px 28px 6px",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
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
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
    padding: "16px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5"
  },
  kpi: {
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: "12px 14px"
  },
  kpiK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 700
  },
  kpiV: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 4,
    fontVariantNumeric: "tabular-nums"
  },
  search: {
    width: "100%",
    maxWidth: 420,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    marginTop: 12,
    boxSizing: "border-box"
  },
  body: {
    padding: "8px 28px 60px"
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 6px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 12.5
  },
  rowH: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid #e2e8f0"
  },
  chip: {
    fontSize: 10.5,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 700
  },
  mini: {
    padding: "4px 8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
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
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    zIndex: 1000,
    overflowY: "auto"
  },
  modal: {
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    width: "100%",
    maxWidth: 640,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
  },
  x: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 18,
    cursor: "pointer",
    color: "#64748b"
  }
};
window.Contrats = Contrats;