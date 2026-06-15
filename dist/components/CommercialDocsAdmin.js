// ════════════════════════════════════════════════════════════════════
// CommercialDocsAdmin — Administration de la Gestion Commerciale
// ════════════════════════════════════════════════════════════════════
//
// Onglets :
// - Catalogue articles (CRUD)
// - Taux TVA (lecture, modifiables si admin)
// - Conditions de paiement (lecture)
// - Compteurs de numérotation (reset annuel)
//
// Sources : commercial_articles + commercial_tva_rates + commercial_payment_terms
//           + commercial_doc_counters
// ════════════════════════════════════════════════════════════════════

var CommercialDocsAdmin = () => {
  var [tab, setTab] = React.useState("company");
  return /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: cdaStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 0 18px",
      textDecoration: "none",
      color: "inherit",
      borderBottom: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Admin commerciale"))), /*#__PURE__*/React.createElement("a", {
    href: "/gestion-commerciale",
    style: {
      ...cdaStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      color: "#94a3b8"
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", null, "Retour aux documents")), /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.navLabel
  }, "Param\xE8tres"), [{
    k: "company",
    label: "Société émettrice",
    icon: "🏢"
  }, {
    k: "articles",
    label: "Catalogue articles",
    icon: "📦"
  }, {
    k: "tva",
    label: "Taux TVA",
    icon: "%"
  }, {
    k: "payment",
    label: "Cond. paiement",
    icon: "💳"
  }, {
    k: "counters",
    label: "Numérotation",
    icon: "#"
  }, {
    k: "sends",
    label: "Audit envois",
    icon: "✉"
  }].map(t => /*#__PURE__*/React.createElement("div", {
    key: t.k,
    onClick: () => setTab(t.k),
    style: {
      ...cdaStyles.navItem,
      ...(tab === t.k ? cdaStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      color: tab === t.k ? "#3730a3" : "#94a3b8"
    }
  }, t.icon), /*#__PURE__*/React.createElement("span", null, t.label)))), /*#__PURE__*/React.createElement("main", {
    style: cdaStyles.main
  }, tab === "company" && /*#__PURE__*/React.createElement(CompanyTab, null), tab === "articles" && /*#__PURE__*/React.createElement(ArticlesTab, null), tab === "tva" && /*#__PURE__*/React.createElement(TvaTab, null), tab === "payment" && /*#__PURE__*/React.createElement(PaymentTab, null), tab === "counters" && /*#__PURE__*/React.createElement(CountersTab, null), tab === "sends" && /*#__PURE__*/React.createElement(SendsTab, null)));
};

// ─────────────────────────────────────────────────────────────────
// COMPANY TAB — Coordonnées société émettrice (BDD : commercial_company_settings)
// ─────────────────────────────────────────────────────────────────
var CompanyTab = () => {
  var [c, setC] = React.useState(null);
  var [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => setC(await window.api.commercialCompany.get()))();
  }, []);
  if (!c) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      color: "#94a3b8"
    }
  }, "Chargement\u2026");
  var setField = (k, v) => setC(cur => ({
    ...cur,
    [k]: v
  }));
  var save = async () => {
    setSaving(true);
    try {
      await window.api.commercialCompany.update(c);
      if (window.HubToast) window.HubToast.success("✓ Société enregistrée");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Soci\xE9t\xE9 \xE9mettrice"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, "Coordonn\xE9es imprim\xE9es sur tous les Devis / Commandes / BL / Factures")), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: saving,
    style: cdaStyles.primaryBtn
  }, saving ? "Enregistrement…" : "Enregistrer")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 14px",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83C\uDFE2 Identit\xE9 l\xE9gale"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Raison sociale"), /*#__PURE__*/React.createElement("input", {
    value: c.raison_sociale || "",
    onChange: e => setField("raison_sociale", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Forme juridique"), /*#__PURE__*/React.createElement("select", {
    value: c.forme_juridique || "",
    onChange: e => setField("forme_juridique", e.target.value),
    style: cdaStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), /*#__PURE__*/React.createElement("option", null, "SARL"), /*#__PURE__*/React.createElement("option", null, "SAS"), /*#__PURE__*/React.createElement("option", null, "SA"), /*#__PURE__*/React.createElement("option", null, "SASU"), /*#__PURE__*/React.createElement("option", null, "EURL"), /*#__PURE__*/React.createElement("option", null, "EI"), /*#__PURE__*/React.createElement("option", null, "Auto-entrepreneur")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Adresse"), /*#__PURE__*/React.createElement("input", {
    value: c.adresse || "",
    onChange: e => setField("adresse", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Code postal"), /*#__PURE__*/React.createElement("input", {
    value: c.cp || "",
    onChange: e => setField("cp", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Ville"), /*#__PURE__*/React.createElement("input", {
    value: c.ville || "",
    onChange: e => setField("ville", e.target.value),
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Tel"), /*#__PURE__*/React.createElement("input", {
    value: c.tel || "",
    onChange: e => setField("tel", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Email contact"), /*#__PURE__*/React.createElement("input", {
    value: c.email || "",
    onChange: e => setField("email", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Site web"), /*#__PURE__*/React.createElement("input", {
    value: c.site_web || "",
    onChange: e => setField("site_web", e.target.value),
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "SIRET"), /*#__PURE__*/React.createElement("input", {
    value: c.siret || "",
    onChange: e => setField("siret", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "NAF"), /*#__PURE__*/React.createElement("input", {
    value: c.naf || "",
    onChange: e => setField("naf", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "TVA intracom."), /*#__PURE__*/React.createElement("input", {
    value: c.tva_intra || "",
    onChange: e => setField("tva_intra", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Capital (\u20AC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: c.capital_eur || "",
    onChange: e => setField("capital_eur", e.target.value ? Number(e.target.value) : null),
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 14px",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCB3 Coordonn\xE9es bancaires"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "IBAN"), /*#__PURE__*/React.createElement("input", {
    value: c.iban || "",
    onChange: e => setField("iban", e.target.value),
    style: {
      ...cdaStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "BIC"), /*#__PURE__*/React.createElement("input", {
    value: c.bic || "",
    onChange: e => setField("bic", e.target.value),
    style: {
      ...cdaStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Banque"), /*#__PURE__*/React.createElement("input", {
    value: c.banque_nom || "",
    onChange: e => setField("banque_nom", e.target.value),
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 14px",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDC65 Contacts en pied de page PDF"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, [{
    prefix: "commercial",
    label: "Service Commercial"
  }, {
    prefix: "admin",
    label: "Administratif"
  }, {
    prefix: "compta",
    label: "Comptabilité"
  }].map(c2 => /*#__PURE__*/React.createElement("div", {
    key: c2.prefix,
    style: {
      border: "1px solid #eef1f5",
      borderRadius: 7,
      padding: 12,
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3730a3",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, c2.label), /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Nom"), /*#__PURE__*/React.createElement("input", {
    value: c["contact_" + c2.prefix + "_nom"] || "",
    onChange: e => setField("contact_" + c2.prefix + "_nom", e.target.value),
    style: {
      ...cdaStyles.input,
      marginBottom: 6
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Tel"), /*#__PURE__*/React.createElement("input", {
    value: c["contact_" + c2.prefix + "_tel"] || "",
    onChange: e => setField("contact_" + c2.prefix + "_tel", e.target.value),
    style: {
      ...cdaStyles.input,
      marginBottom: 6
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    value: c["contact_" + c2.prefix + "_email"] || "",
    onChange: e => setField("contact_" + c2.prefix + "_email", e.target.value),
    style: cdaStyles.input
  })))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "18px 0 14px",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCDD Mentions & conditions"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Conditions de paiement par d\xE9faut (encart signature)"), /*#__PURE__*/React.createElement("input", {
    value: c.conditions_paiement_default || "",
    onChange: e => setField("conditions_paiement_default", e.target.value),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Mention \"R\xE9serve de propri\xE9t\xE9\" (pied de page tous docs)"), /*#__PURE__*/React.createElement("textarea", {
    value: c.mention_reserve_propriete || "",
    onChange: e => setField("mention_reserve_propriete", e.target.value),
    rows: 3,
    style: {
      ...cdaStyles.input,
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "D\xE9lai de validit\xE9 Devis (jours)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: c.delai_validite_devis_jours || 30,
    onChange: e => setField("delai_validite_devis_jours", Number(e.target.value)),
    style: {
      ...cdaStyles.input,
      maxWidth: 120
    }
  }))));
};

// ─────────────────────────────────────────────────────────────────
// SENDS TAB — Audit log de tous les envois (BDD : commercial_doc_sends)
// ─────────────────────────────────────────────────────────────────
var SendsTab = () => {
  var [list, setList] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setList((await window.api.commercialSends.list({})) || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Audit log des envois"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, "Trace permanente de tous les documents envoy\xE9s / t\xE9l\xE9charg\xE9s / imprim\xE9s"))), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.empty
  }, "Aucun envoi enregistr\xE9.") : /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.list
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 140px"
    }
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px"
    }
  }, "Doc"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 70px"
    }
  }, "Canal"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Destinataire"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 130px"
    }
  }, "Envoy\xE9 par"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, "Statut")), list.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: cdaStyles.tableRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 140px",
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#475569"
    }
  }, new Date(s.sent_at).toLocaleString("fr-FR")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#3730a3",
      fontWeight: 600
    }
  }, s.doc_id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 70px",
      fontSize: 12,
      color: "#64748b"
    }
  }, s.channel), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#0f172a",
      fontWeight: 500
    }
  }, s.recipient_email || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, s.subject || "")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 130px",
      fontSize: 12,
      color: "#64748b"
    }
  }, s.sent_by_name || "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 999,
      background: s.status === "sent" ? "#dcfce7" : s.status === "failed" ? "#fee2e2" : "#f1f5f9",
      color: s.status === "sent" ? "#065f46" : s.status === "failed" ? "#991b1b" : "#475569",
      fontWeight: 600
    }
  }, s.status))))));
};
var ArticlesTab = () => {
  var [list, setList] = React.useState([]);
  var [editing, setEditing] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var reload = async () => {
    setLoading(true);
    try {
      setList((await window.api.commercialArticles.list({
        active: true
      })) || []);
    } catch (e) {}
    setLoading(false);
  };
  React.useEffect(() => {
    reload();
  }, []);
  var newArticle = () => setEditing({
    ref: "",
    name: "",
    category: "Service",
    unit: "u",
    price_ht: 0,
    tva_rate: 20,
    is_service: true,
    is_recurring: false,
    description: ""
  });
  var save = async a => {
    // Validation minimale
    if (!a.ref || !a.ref.trim()) {
      if (window.HubToast) window.HubToast.error("Référence obligatoire");
      return;
    }
    if (!a.name || !a.name.trim()) {
      if (window.HubToast) window.HubToast.error("Désignation obligatoire");
      return;
    }
    if (a.price_ht == null || a.price_ht === "") {
      if (window.HubToast) window.HubToast.error("Prix HT obligatoire (peut être 0)");
      return;
    }
    try {
      if (a.id) await window.api.commercialArticles.update(a.id, a);else await window.api.commercialArticles.create(a);
      if (window.HubToast) window.HubToast.success("✓ Article enregistré");
      setEditing(null);
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var remove = async id => {
    if (!confirm("Désactiver cet article ?")) return;
    try {
      await window.api.commercialArticles.remove(id);
      reload();
    } catch (e) {}
  };
  var fmtEUR = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2
  }).replace(/,/g, " ") + " €";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Catalogue d'articles"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, list.length, " article(s) actif(s) \u2014 utilis\xE9s dans Devis/Commandes/Factures")), /*#__PURE__*/React.createElement("button", {
    onClick: newArticle,
    style: cdaStyles.primaryBtn
  }, "+ Nouvel article")), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.empty
  }, "Aucun article dans le catalogue.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("button", {
    onClick: newArticle,
    style: {
      ...cdaStyles.primaryBtn,
      marginTop: 12
    }
  }, "+ Cr\xE9er le premier")) : /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.list
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 140px"
    }
  }, "R\xE9f\xE9rence"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px"
    }
  }, "Cat\xE9gorie"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 60px",
      textAlign: "center"
    }
  }, "Unit\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px",
      textAlign: "right"
    }
  }, "P.U. HT"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 70px",
      textAlign: "center"
    }
  }, "TVA"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 80px"
    }
  })), list.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: cdaStyles.tableRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 140px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#3730a3",
      fontWeight: 600
    }
  }, a.ref), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13,
      fontWeight: 500
    }
  }, a.name, a.is_recurring ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 10,
      padding: "1px 6px",
      background: "#eef2ff",
      color: "#3730a3",
      borderRadius: 999
    }
  }, "\uD83D\uDD01 R\xE9current") : null), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px",
      fontSize: 12,
      color: "#64748b"
    }
  }, a.category || "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 60px",
      textAlign: "center",
      fontSize: 12,
      color: "#64748b"
    }
  }, a.unit), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px",
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      fontWeight: 600
    }
  }, fmtEUR(a.price_ht)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 70px",
      textAlign: "center",
      fontSize: 12
    }
  }, a.tva_rate, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 80px",
      textAlign: "right",
      display: "flex",
      gap: 4,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditing(a),
    style: cdaStyles.iconBtn,
    title: "\xC9diter"
  }, "\u270E"), /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(a.id),
    style: {
      ...cdaStyles.iconBtn,
      color: "#dc2626"
    },
    title: "D\xE9sactiver"
  }, "\xD7"))))), editing && /*#__PURE__*/React.createElement(ArticleEditor, {
    article: editing,
    onSave: save,
    onClose: () => setEditing(null)
  }));
};
var ArticleEditor = ({
  article,
  onSave,
  onClose
}) => {
  var [a, setA] = React.useState({
    ...article
  });
  var setField = (k, v) => setA(cur => ({
    ...cur,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.modalOverlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.modalCard,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.modalHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 700
    }
  }, article.id ? "Modifier l'article" : "Nouvel article"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: cdaStyles.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "R\xE9f\xE9rence (code Sage)"), /*#__PURE__*/React.createElement("input", {
    value: a.ref || "",
    onChange: e => setField("ref", e.target.value),
    placeholder: "AST-SUITE-USR",
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("input", {
    value: a.name || "",
    onChange: e => setField("name", e.target.value),
    placeholder: "Astorya Suite \u2014 Licence utilisateur",
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Description (optionnelle)"), /*#__PURE__*/React.createElement("textarea", {
    value: a.description || "",
    onChange: e => setField("description", e.target.value),
    rows: 2,
    style: {
      ...cdaStyles.input,
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Cat\xE9gorie"), /*#__PURE__*/React.createElement("select", {
    value: a.category || "",
    onChange: e => setField("category", e.target.value),
    style: cdaStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), /*#__PURE__*/React.createElement("option", null, "Suite"), /*#__PURE__*/React.createElement("option", null, "Cyber"), /*#__PURE__*/React.createElement("option", null, "Hub"), /*#__PURE__*/React.createElement("option", null, "Service"), /*#__PURE__*/React.createElement("option", null, "Mat\xE9riel"), /*#__PURE__*/React.createElement("option", null, "Formation"), /*#__PURE__*/React.createElement("option", null, "Support"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Unit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: a.unit || "u",
    onChange: e => setField("unit", e.target.value),
    style: cdaStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "u"
  }, "Unit\xE9 (u)"), /*#__PURE__*/React.createElement("option", {
    value: "h"
  }, "Heure (h)"), /*#__PURE__*/React.createElement("option", {
    value: "j"
  }, "Journ\xE9e (j)"), /*#__PURE__*/React.createElement("option", {
    value: "mois"
  }, "Mois"), /*#__PURE__*/React.createElement("option", {
    value: "an"
  }, "Ann\xE9e (an)"), /*#__PURE__*/React.createElement("option", {
    value: "forfait"
  }, "Forfait"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "TVA"), /*#__PURE__*/React.createElement("select", {
    value: a.tva_rate,
    onChange: e => setField("tva_rate", Number(e.target.value)),
    style: cdaStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "20"
  }, "20% \u2014 normal"), /*#__PURE__*/React.createElement("option", {
    value: "10"
  }, "10% \u2014 interm\xE9diaire"), /*#__PURE__*/React.createElement("option", {
    value: "5.5"
  }, "5,5% \u2014 r\xE9duit"), /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "0% \u2014 exon\xE9r\xE9")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Prix unitaire HT (\u20AC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: a.price_ht,
    onChange: e => setField("price_ht", Number(e.target.value)),
    style: cdaStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdaStyles.lbl
  }, "Co\xFBt d'achat HT (marge \u2014 optionnel)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: a.cost_ht || "",
    onChange: e => setField("cost_ht", e.target.value ? Number(e.target.value) : null),
    style: cdaStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: a.is_service || false,
    onChange: e => setField("is_service", e.target.checked)
  }), " Service (vs Bien)"), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: a.is_recurring || false,
    onChange: e => setField("is_recurring", e.target.checked)
  }), " Abonnement / r\xE9current")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: cdaStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSave(a),
    style: cdaStyles.primaryBtn
  }, "Enregistrer")))));
};
var TvaTab = () => {
  var [list, setList] = React.useState([]);
  React.useEffect(() => {
    (async () => setList(await window.api.commercialRefs.tvaRates()))();
  }, []);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Taux de TVA"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, "R\xE9f\xE9rentiel utilis\xE9 dans les lignes des documents"))), /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.list
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px"
    }
  }, "Taux"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Libell\xE9")), list.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.rate,
    style: cdaStyles.tableRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      fontSize: 14,
      color: "#3730a3"
    }
  }, t.rate, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13
    }
  }, t.label)))));
};
var PaymentTab = () => {
  var [list, setList] = React.useState([]);
  React.useEffect(() => {
    (async () => setList(await window.api.commercialRefs.paymentTerms()))();
  }, []);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Conditions de paiement"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, "D\xE9lais propos\xE9s sur les factures"))), /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.list
  }, /*#__PURE__*/React.createElement("div", {
    style: cdaStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px"
    }
  }, "Code"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Libell\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px",
      textAlign: "right"
    }
  }, "Jours")), list.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: cdaStyles.tableRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#3730a3"
    }
  }, p.id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13
    }
  }, p.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px",
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, p.days || 0)))));
};
var CountersTab = () => {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: cdaStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdaStyles.h1
  }, "Num\xE9rotation des documents"), /*#__PURE__*/React.createElement("p", {
    style: cdaStyles.sub
  }, "Format : TYPE-AAAA-NNNN (s\xE9quence par type, reset annuel)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "#475569",
      lineHeight: 1.6,
      margin: "0 0 16px"
    }
  }, "La num\xE9rotation est g\xE9r\xE9e par la table ", /*#__PURE__*/React.createElement("code", {
    style: {
      background: "#f1f5f9",
      padding: "1px 6px",
      borderRadius: 4,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11
    }
  }, "commercial_doc_counters"), " : un compteur s\xE9par\xE9 par type (devis/commande/bl/facture) et par ann\xE9e."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    }
  }, [{
    k: "devis",
    label: "Devis",
    prefix: "DEV",
    color: "#3b82f6"
  }, {
    k: "commande",
    label: "Commandes",
    prefix: "BC",
    color: "#a855f7"
  }, {
    k: "bl",
    label: "BL",
    prefix: "BL",
    color: "#ea580c"
  }, {
    k: "facture",
    label: "Factures",
    prefix: "FAC",
    color: "#10b981"
  }].map(t => /*#__PURE__*/React.createElement("div", {
    key: t.k,
    style: {
      border: "1px solid #eef1f5",
      borderRadius: 8,
      padding: 14,
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "uppercase"
    }
  }, t.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: t.color,
      fontFamily: "'JetBrains Mono', monospace",
      marginTop: 4
    }
  }, t.prefix, "-", new Date().getFullYear(), "-XXXX"))))));
};
var cdaStyles = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 220,
    padding: "20px 16px",
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(135deg, #3730a3, #6366f1)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
    padding: "0 6px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 7,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  main: {
    flex: 1,
    padding: "20px 28px",
    overflow: "auto"
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700
  },
  sub: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#64748b"
  },
  primaryBtn: {
    padding: "8px 14px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  ghostBtn: {
    padding: "7px 12px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontSize: 18,
    cursor: "pointer"
  },
  iconBtn: {
    background: "transparent",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "4px 8px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 12
  },
  list: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    overflow: "hidden"
  },
  tableHead: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    gap: 10,
    background: "#f8fafc",
    borderBottom: "1px solid #eef1f5",
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    gap: 10,
    borderBottom: "1px solid #f1f5f9"
  },
  empty: {
    padding: 40,
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 720,
    boxShadow: "0 20px 60px rgba(15,23,42,0.4)",
    overflow: "hidden"
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 22px",
    borderBottom: "1px solid #eef1f5",
    background: "#fafbfc"
  },
  lbl: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 4
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box"
  }
};