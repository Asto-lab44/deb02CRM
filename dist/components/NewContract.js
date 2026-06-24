// Nouveau contrat — formulaire de création fonctionnel

var NCAvatar = ({
  name,
  size = 22,
  color
}) => {
  if (!name) return null;
  var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
  var palette = {
    N: "#a855f7",
    K: "#6366f1",
    S: "#10b981",
    T: "#f59e0b",
    E: "#0ea5e9",
    L: "#dc2626",
    J: "#8b5cf6",
    M: "#dc2626",
    C: "#dc2626"
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
      fontSize: size * 0.4,
      fontWeight: 600,
      flexShrink: 0
    }
  }, initials);
};
var NCSectionHead = ({
  num,
  title,
  subtitle,
  status
}) => {
  var statusMeta = {
    done: {
      bg: "#e8f8f1",
      color: "#0e7a55",
      icon: "✓"
    },
    active: {
      bg: "#eef2ff",
      color: "#4f46e5",
      icon: num
    },
    todo: {
      bg: "#fafbfc",
      color: "#94a3b8",
      icon: num
    }
  };
  var s = statusMeta[status] || statusMeta.todo;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: s.bg,
      color: s.color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      flexShrink: 0
    }
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: -0.2
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, subtitle)));
};
var NCFormRow = ({
  label,
  subtitle,
  required,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 14
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 6
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a"
  }
}, label), required && /*#__PURE__*/React.createElement("span", {
  style: {
    color: "#dc2626",
    fontWeight: 700
  }
}, "*"), subtitle && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 4
  }
}, subtitle)), children);
var NCCondRow = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
    gap: 14
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11.5,
    color: "#64748b",
    width: 150,
    flexShrink: 0
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}, value));
var NCTotalRow = ({
  label,
  v,
  color,
  strong,
  strongLarge
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: strong || strongLarge ? "2px solid #eef1f5" : "1px solid #f1f5f9",
    marginTop: strongLarge ? 4 : 0
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: strongLarge ? 13 : 11.5,
    color: strong || strongLarge ? "#0f172a" : "#64748b",
    fontWeight: strong || strongLarge ? 700 : 500
  }
}, label), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: strongLarge ? 14 : strong ? 13 : 12,
    fontVariantNumeric: "tabular-nums",
    fontWeight: strong || strongLarge ? 700 : 600,
    color: color || "#0f172a"
  }
}, v));
var NCLifecycleItem = ({
  date,
  label,
  active,
  warn,
  final
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 5,
    background: active ? "#4f46e5" : warn ? "#f59e0b" : final ? "#dc2626" : "#cbd5e1",
    boxShadow: active ? "0 0 0 4px rgba(79,70,229,0.2)" : "none",
    flexShrink: 0
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    fontVariantNumeric: "tabular-nums",
    color: "#0f172a",
    fontWeight: 600
  }
}, date), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1
  }
}, label)));
var fmtEUR = n => {
  if (!isFinite(n)) return "0 €";
  return Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};
var fmtDateFR = iso => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch (e) {
    return iso;
  }
};
var NewContract = () => {
  var params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  var clientId = params.get("client") || "";
  var oppId = params.get("opp") || "";

  // ── Client lookup
  var [clientObj, setClientObj] = React.useState(null);
  React.useEffect(() => {
    if (!clientId || !window.api) return;
    window.api.clients.getById(clientId).then(data => {
      if (data) setClientObj(data);
    }).catch(() => {});
  }, [clientId]);
  var clientName = clientObj && (clientObj.name || clientObj.raison_sociale) || (clientId ? "Chargement…" : "Aucun client sélectionné");
  var clientSiren = clientObj && (clientObj.siren || clientObj.siret) || "—";
  var clientInitials = (clientName.split(" ").slice(0, 2).map(s => s[0]).join("") || "??").toUpperCase();

  // ── State
  var [contractType, setContractType] = React.useState("saas"); // saas | licence | service | renew
  var [category, setCategory] = React.useState("new"); // new | extension | upsell
  var [duration, setDuration] = React.useState(36); // mois
  var [tacite, setTacite] = React.useState(true);
  var [indexation, setIndexation] = React.useState("Aucune");
  var [indexCap, setIndexCap] = React.useState(3);
  var [paymentDelay, setPaymentDelay] = React.useState("30j"); // 15j | 30j | 45fdm | 60j
  var [billingPeriod, setBillingPeriod] = React.useState("annual"); // monthly | quarterly | annual
  var [startDate, setStartDate] = React.useState(() => {
    var d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  var [currency, setCurrency] = React.useState("EUR");
  var [signMethod, setSignMethod] = React.useState("qualified");
  var [signatory, setSignatory] = React.useState({
    name: "",
    role: "",
    email: "",
    phone: ""
  });
  // Contacts du client (pour sélection du signataire)
  var [clientContacts, setClientContacts] = React.useState([]);
  var [showNewContactForm, setShowNewContactForm] = React.useState(false);
  var [newContact, setNewContact] = React.useState({
    prenom: "",
    nom: "",
    fonction: "",
    email: "",
    phone: ""
  });
  React.useEffect(() => {
    if (!clientId || !window.api || !window.api.contacts) return;
    window.api.contacts.list({
      client_id: clientId
    }).then(list => setClientContacts(list || [])).catch(() => {});
  }, [clientId]);
  var reloadContacts = async () => {
    if (!clientId || !window.api || !window.api.contacts) return;
    var list = await window.api.contacts.list({
      client_id: clientId
    });
    setClientContacts(list || []);
  };
  var saveNewContact = async () => {
    var prenom = (newContact.prenom || "").trim();
    var nom = (newContact.nom || "").trim();
    if (!prenom && !nom) {
      if (window.HubToast) window.HubToast.error("Renseigne au moins un prénom ou un nom.");
      return;
    }
    try {
      var created = await window.api.contacts.create({
        client_id: clientId,
        prenom,
        nom,
        fonction: (newContact.fonction || "").trim(),
        email: (newContact.email || "").trim(),
        phone: (newContact.phone || "").trim()
      });
      if (window.HubToast) window.HubToast.success("✓ Contact " + (prenom + " " + nom).trim() + " créé");
      await reloadContacts();
      // Pré-sélection automatique en signataire
      var fullName = ((created.prenom || prenom) + " " + (created.nom || nom)).trim();
      setSignatory({
        name: fullName,
        role: created.fonction || newContact.fonction || "",
        email: created.email || newContact.email || "",
        phone: created.phone || newContact.phone || ""
      });
      setShowNewContactForm(false);
      setNewContact({
        prenom: "",
        nom: "",
        fonction: "",
        email: "",
        phone: ""
      });
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Création contact : " + (e.message || e));
    }
  };
  var [savedTick, setSavedTick] = React.useState(0);
  // Preview avant envoi pour signature
  var [previewOpen, setPreviewOpen] = React.useState(false);
  // Modèles juridiques (CGV) chargés depuis l'admin
  var [templates, setTemplates] = React.useState([]);
  var [selectedTemplate, setSelectedTemplate] = React.useState(null);
  // Articles du contrat — chargés depuis window.HubContractArticles (texte par défaut).
  // Chaque article : { n, title, body, edited, originalBody }.
  // edited === true ⇒ texte différent de la version source.
  var [contractArticles, setContractArticles] = React.useState(() => {
    var src = typeof window !== "undefined" && window.HubContractArticles || [];
    return src.map(a => ({
      n: a.n,
      title: a.title,
      body: a.body,
      originalBody: a.body,
      edited: false
    }));
  });
  var [expandedArticles, setExpandedArticles] = React.useState({});
  // Panneau articles ouvert par défaut — c'est l'élément le plus important
  // de la section Conditions juridiques (16 articles personnalisables).
  var [articlesPanelOpen, setArticlesPanelOpen] = React.useState(true);
  var toggleArticle = n => setExpandedArticles(m => ({
    ...m,
    [n]: !m[n]
  }));
  var updateArticleBody = (n, body) => setContractArticles(arr => arr.map(a => a.n === n ? {
    ...a,
    body,
    edited: body !== a.originalBody
  } : a));
  var resetArticleBody = n => setContractArticles(arr => arr.map(a => a.n === n ? {
    ...a,
    body: a.originalBody,
    edited: false
  } : a));
  var editedCount = contractArticles.filter(a => a.edited).length;
  React.useEffect(() => {
    if (!window.api || !window.api.contractTemplates) return;
    window.api.contractTemplates.list().then(list => {
      setTemplates(list || []);
      // Pré-sélectionne le modèle marqué par défaut, sinon le premier
      var def = (list || []).find(t => t.is_default) || (list || [])[0];
      if (def) setSelectedTemplate(def);
    }).catch(() => {});
  }, []);

  // ── Products
  var [products, setProducts] = React.useState([{
    id: "p1",
    name: "Astorya Suite Enterprise",
    sku: "AST-SUITE-ENT",
    desc: "Plateforme commerciale complète · accès illimité modules · support N2 inclus",
    unit: 240,
    qty: 750,
    discount: 12,
    periodicity: "annual",
    color: "#a855f7"
  }, {
    id: "p2",
    name: "Astorya Cyber — module conformité",
    sku: "AST-CYBER",
    desc: "Add-on DORA · audits trimestriels · 5 utilisateurs admin",
    unit: 22000,
    qty: 1,
    discount: 0,
    periodicity: "annual",
    color: "#dc2626"
  }, {
    id: "p3",
    name: "Implémentation & onboarding",
    sku: "SVC-ONB-ENT",
    desc: "Déploiement 12 semaines · formation 30 utilisateurs clés · migration données",
    unit: 3600,
    qty: 12,
    discount: 0,
    periodicity: "oneshot",
    color: "#0ea5e9"
  }]);
  var [annexes, setAnnexes] = React.useState([{
    id: "a1",
    label: "SLA niveau Premium"
  }, {
    id: "a2",
    label: "DPA — RGPD"
  }]);
  var [clauses, setClauses] = React.useState([{
    id: "c1",
    tag: "NÉGOCIÉ",
    text: "Pénalité SLA à 5 % si dispo < 99,5 %"
  }, {
    id: "c2",
    tag: "NÉGOCIÉ",
    text: "Sortie anticipée possible à M+18 si non-conformité DORA"
  }]);

  // ── Totals (computed)
  var sums = React.useMemo(() => {
    var recurringHT = 0,
      oneshotHT = 0,
      discountTotal = 0;
    products.forEach(p => {
      var gross = (Number(p.unit) || 0) * (Number(p.qty) || 0);
      var disc = gross * (Number(p.discount) || 0) / 100;
      var net = gross - disc;
      discountTotal += disc;
      if (p.periodicity === "oneshot") oneshotHT += net;else recurringHT += net;
    });
    var totalY1HT = recurringHT + oneshotHT;
    var tva = totalY1HT * 0.20;
    var totalY1TTC = totalY1HT + tva;
    var years = duration / 12;
    var tcv = recurringHT * years + oneshotHT;
    var cost = tcv * 0.62;
    var margin = tcv - cost;
    var marginPct = tcv > 0 ? Math.round(margin / tcv * 100) : 0;
    return {
      recurringHT,
      oneshotHT,
      discountTotal,
      totalY1HT,
      tva,
      totalY1TTC,
      tcv,
      cost,
      margin,
      marginPct
    };
  }, [products, duration]);

  // ── Auto-save (mocked)
  React.useEffect(() => {
    var t = setInterval(() => setSavedTick(v => v + 1), 8000);
    return () => clearInterval(t);
  }, []);

  // ── Dates
  var endDate = React.useMemo(() => {
    if (!startDate) return "";
    var d = new Date(startDate);
    d.setMonth(d.getMonth() + duration);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [startDate, duration]);

  // ── Génération PDF du Contrat (multi-templates)
  var [contractKind, setContractKind] = React.useState("auto");
  var KINDS = window.HubHostingContractPdf && window.HubHostingContractPdf.KINDS || {};
  var detectedKind = React.useMemo(() => {
    if (!window.HubHostingContractPdf) return "hosting";
    return window.HubHostingContractPdf.detectKind(products);
  }, [products]);
  var effectiveKind = contractKind === "auto" ? detectedKind : contractKind;
  var generateContractPdf = async () => {
    if (!window.HubHostingContractPdf) {
      alert("Le générateur PDF n'est pas chargé. Recharge la page (Ctrl+F5).");
      return;
    }
    var payload = {
      kind: effectiveKind,
      client: {
        name: clientName !== "Chargement…" && clientName !== "Aucun client sélectionné" ? clientName : "",
        address: clientObj && (clientObj.address || clientObj.adresse) || "",
        cp: clientObj && (clientObj.cp || clientObj.zip_code) || "",
        city: clientObj && (clientObj.city || clientObj.ville) || "",
        siren: clientSiren !== "—" ? clientSiren : "",
        billing_email: clientObj && (clientObj.billing_email || clientObj.email) || "",
        tel: clientObj && (clientObj.tel || clientObj.phone) || "",
        iban: clientObj && clientObj.iban || "",
        bic: clientObj && clientObj.bic || ""
      },
      products,
      duration,
      billingPeriod,
      tacite,
      paymentDelay,
      indexation,
      indexCap,
      startDate,
      endDate,
      signatory,
      referent: {
        name: signatory.name,
        email: clientObj && clientObj.email || ""
      },
      sums
    };
    try {
      await window.HubHostingContractPdf.preview(payload);
    } catch (e) {
      alert("Génération PDF : " + (e.message || e));
    }
  };

  // ── Mutations
  var updateProduct = (id, patch) => setProducts(ps => ps.map(p => p.id === id ? {
    ...p,
    ...patch
  } : p));
  var removeProduct = id => setProducts(ps => ps.filter(p => p.id !== id));
  // addProduct : ajoute une ligne directement avec valeurs par défaut, l'user
  // édite ensuite les champs inline (prix/qty/périodicité) — UX plus rapide
  // qu'une suite de prompts.
  var addProduct = () => {
    var palette = ["#a855f7", "#dc2626", "#0ea5e9", "#10b981", "#f59e0b", "#6366f1"];
    setProducts(ps => [...ps, {
      id: "p" + Date.now(),
      name: "Nouveau produit",
      sku: "—",
      desc: "",
      unit: 0,
      qty: 1,
      discount: 0,
      periodicity: "annual",
      color: palette[ps.length % palette.length]
    }]);
    if (window.HubToast) window.HubToast.info("Ligne ajoutée — éditez les champs ci-dessus");
  };
  var removeAnnexe = id => setAnnexes(a => a.filter(x => x.id !== id));
  var addAnnexe = async () => {
    var l = window.HubModal ? await window.HubModal.prompt({
      title: "Nouvelle annexe",
      label: "Intitulé",
      placeholder: "ex : RIB Astorya"
    }) : prompt("Intitulé de l'annexe :");
    if (l && l.trim()) setAnnexes(a => [...a, {
      id: "a" + Date.now(),
      label: l.trim()
    }]);
  };
  var removeClause = id => setClauses(a => a.filter(x => x.id !== id));
  var addClause = async () => {
    var l = window.HubModal ? await window.HubModal.prompt({
      title: "Clause spécifique",
      label: "Texte de la clause",
      multiline: true,
      placeholder: "Description de la clause négociée…"
    }) : prompt("Clause spécifique :");
    if (l && l.trim()) setClauses(a => [...a, {
      id: "c" + Date.now(),
      tag: "NÉGOCIÉ",
      text: l.trim()
    }]);
  };

  // ── Submit
  var submitContract = async action => {
    if (products.length === 0) {
      alert("Ajoutez au moins une ligne produit");
      return;
    }
    var ctrRef = "CTR-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
    var titleParts = products.slice(0, 2).map(p => p.name).join(" + ");
    var ctr = {
      id: ctrRef,
      client_id: clientId || "ACC-DEMO",
      client_name: clientName,
      opp_id: oppId || null,
      name: titleParts || "Contrat " + clientName,
      type: {
        saas: "Abonnement SaaS",
        licence: "Licence perpétuelle",
        service: "Prestation",
        renew: "Renouvellement"
      }[contractType] || "Contrat",
      category,
      products,
      duration,
      tacite,
      indexation,
      indexCap,
      payment_delay: paymentDelay,
      billing_period: billingPeriod,
      currency,
      start: startDate,
      end: endDate,
      sign_method: signMethod,
      annexes,
      clauses,
      // Articles personnalisés — ne stocke que les diffs pour rester léger
      articles_overrides: contractArticles.filter(a => a.edited).map(a => ({
        n: a.n,
        title: a.title,
        body: a.body
      })),
      total_ht_y1: sums.totalY1HT,
      tcv: sums.tcv,
      margin_pct: sums.marginPct,
      amount: fmtEUR(sums.totalY1HT) + " / an",
      status: action === "send" ? "pending_signature" : "draft",
      created_at: new Date().toISOString()
    };
    // Validation côté "envoyer pour signature" : signataire obligatoire
    if (action === "send" && !signatory.name.trim()) {
      alert("⚠ Renseignez le nom du signataire avant d'envoyer pour signature");
      return;
    }
    var saved = null;
    try {
      saved = await window.api.contracts.create(ctr);
    } catch (e) {
      console.warn("submitContract:", e);
      alert("Erreur de sauvegarde : " + (e.message || e));
      return;
    }
    // Si "envoyer pour signature" : crée aussi une action de suivi pour
    // le commercial (rappel signature) si on a une API actions.
    if (action === "send" && window.api.actions && window.api.actions.create) {
      try {
        await window.api.actions.create({
          client_id: clientId,
          type: "task",
          title: "Suivi signature contrat " + ctrRef + " — " + (signatory.name || ""),
          meta: "Envoyer relance si pas signé sous 5 jours",
          due_text: "Sous 5 jours",
          priority: "haute",
          icon: "✍",
          tag: "Signature",
          tagColor: "#a855f7"
        });
      } catch (e) {
        console.warn("[NewContract] action création:", e);
      }
    }
    if (action === "send") {
      alert("✓ Contrat " + ctrRef + " envoyé pour signature à " + (signatory.name || "le signataire") + " — action de suivi créée");
    } else {
      alert("✓ Brouillon enregistré : " + ctrRef);
    }
    if (clientId) window.location.href = "/fiche-client?id=" + encodeURIComponent(clientId);else window.location.href = "/crm";
  };

  // ── helpers de rendu pour le segmented control durée
  var segDur = (val, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setDuration(val),
    style: {
      ...ncStyles.segBtn,
      ...(duration === val ? ncStyles.segBtnActive : {})
    }
  }, label);
  var segPay = (val, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setPaymentDelay(val),
    style: {
      ...ncStyles.segBtn,
      ...(paymentDelay === val ? ncStyles.segBtnActive : {})
    }
  }, label);
  var segBill = (val, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setBillingPeriod(val),
    style: {
      ...ncStyles.segBtn,
      ...(billingPeriod === val ? ncStyles.segBtnActive : {})
    }
  }, label);
  var segCat = (val, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setCategory(val),
    style: {
      ...ncStyles.segBtn,
      ...(category === val ? ncStyles.segBtnActive : {})
    }
  }, label);
  var typeCards = [{
    k: "saas",
    icon: "↻",
    label: "Abonnement SaaS",
    hint: "Récurrent annuel"
  }, {
    k: "licence",
    icon: "📦",
    label: "Licence perpétuelle",
    hint: "One-shot"
  }, {
    k: "service",
    icon: "🛠",
    label: "Prestation",
    hint: "Régie / forfait"
  }, {
    k: "renew",
    icon: "🔄",
    label: "Renouvellement",
    hint: "Reconduction"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: ncStyles.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: ncStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b",
      flexWrap: "wrap"
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
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Contrats"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Nouveau contrat"), /*#__PURE__*/React.createElement("span", {
    style: ncStyles.refMono
  }, "CTR-", new Date().getFullYear(), "-DRAFT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#10b981",
      fontWeight: 500
    }
  }, "\u25CF Auto-save \xB7 il y a ", savedTick * 8 % 60, " sec")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => history.back(),
    style: ncStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 8px",
      border: "1px solid #fecdd3",
      borderRadius: 7,
      background: "#fff5f6"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#c91c45",
      letterSpacing: 0.3,
      textTransform: "uppercase"
    }
  }, "\uD83D\uDCC4 Mod\xE8le"), /*#__PURE__*/React.createElement("select", {
    value: contractKind,
    onChange: e => setContractKind(e.target.value),
    title: contractKind === "auto" ? "Auto-détecté : " + (KINDS[detectedKind] && KINDS[detectedKind].label || detectedKind) : "",
    style: {
      border: "none",
      background: "transparent",
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a",
      cursor: "pointer",
      outline: "none"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "auto"
  }, "Auto (", KINDS[detectedKind] && KINDS[detectedKind].label || detectedKind, ")"), Object.keys(KINDS).map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, KINDS[k].label)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setArticlesPanelOpen(true);
      setTimeout(() => {
        var el = document.getElementById("nc-articles-panel");
        if (el) el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 50);
    },
    style: {
      ...ncStyles.ghostBtn,
      color: "#3730a3",
      borderColor: "#c7d2fe"
    },
    title: "Voir et personnaliser les 16 articles du contrat de services"
  }, "\uD83D\uDCD1 Articles du contrat ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 5px",
      marginLeft: 4,
      borderRadius: 3,
      background: "#eef2ff",
      color: "#3730a3",
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums"
    }
  }, contractArticles.length)), /*#__PURE__*/React.createElement("button", {
    onClick: generateContractPdf,
    style: {
      ...ncStyles.ghostBtn,
      color: "#c91c45",
      borderColor: "#fecdd3"
    },
    title: "G\xE9n\xE8re le PDF du contrat pr\xE9-rempli avec les valeurs ci-dessous"
  }, "\uD83D\uDCC4 Aper\xE7u PDF du contrat"), /*#__PURE__*/React.createElement("a", {
    href: "/administration-contrats-mapping",
    title: "Configurer les r\xE8gles de d\xE9tection automatique du mod\xE8le de contrat",
    style: {
      ...ncStyles.ghostBtn,
      textDecoration: "none",
      color: "#475569"
    }
  }, "\u2699"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreviewOpen(true),
    style: ncStyles.primaryBtn
  }, "Cr\xE9er & envoyer pour signature"))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.heroIcon
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6M9 13l2 2 4-4"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: ncStyles.h1
  }, "Nouveau contrat"), /*#__PURE__*/React.createElement("p", {
    style: ncStyles.subtitle
  }, "Configurer un contrat \u2014 abonnement, services ou prestation ponctuelle"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpiK
  }, "Total HT"), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpiV
  }, fmtEUR(sums.totalY1HT))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpiK
  }, "TCV ", duration, " mois"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.liveKpiV,
      color: "#4f46e5"
    }
  }, fmtEUR(sums.tcv))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpi
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.liveKpiK
  }, "Marge estim\xE9e"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.liveKpiV,
      color: "#10b981"
    }
  }, sums.marginPct, " %")))), (() => {
    // Étape active calculée selon le remplissage : type → contact → produits → conditions → signature
    var steps = [{
      k: "type",
      label: "Type & rattachement",
      letter: "T",
      proba: 15,
      color: "#94a3b8",
      done: !!contractType
    }, {
      k: "client",
      label: "Client & contact",
      letter: "C",
      proba: 35,
      color: "#3b82f6",
      done: !!(clientId && (signatory.name || clientContacts.length > 0))
    }, {
      k: "prods",
      label: "Produits & pricing",
      letter: "P",
      proba: 60,
      color: "#a855f7",
      done: products.length > 0 && sums.totalY1HT > 0
    }, {
      k: "cond",
      label: "Conditions juridiques",
      letter: "J",
      proba: 85,
      color: "#ea580c",
      done: !!startDate && !!selectedTemplate
    }, {
      k: "sign",
      label: "Signature & envoi",
      letter: "S",
      proba: 100,
      color: "#10b981",
      done: false
    }];
    // Étape courante = première non-faite (ou dernière si tout est fait)
    var curIdx = (() => {
      var i = steps.findIndex(s => !s.done);
      return i === -1 ? steps.length - 1 : i;
    })();
    return /*#__PURE__*/React.createElement("div", {
      style: ncStyles.spancoStepper
    }, steps.map((s, i) => {
      var isCurrent = i === curIdx;
      var isPast = i < curIdx;
      return /*#__PURE__*/React.createElement("div", {
        key: s.k,
        style: ncStyles.spancoStep
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...ncStyles.spancoDot,
          background: isPast || isCurrent ? s.color : "#fff",
          borderColor: isPast || isCurrent ? s.color : "#e2e8f0",
          color: isPast || isCurrent ? "#fff" : "#94a3b8",
          boxShadow: isCurrent ? "0 0 0 5px " + s.color + "33" : "none"
        }
      }, isPast || isCurrent ? "✓" : s.letter), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 6,
          fontSize: 11.5,
          fontWeight: isCurrent ? 700 : 500,
          color: isPast || isCurrent ? s.color : "#94a3b8"
        }
      }, s.label, isCurrent && /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          fontSize: 9.5,
          color: s.color,
          marginTop: 1,
          letterSpacing: 0.4,
          textTransform: "uppercase"
        }
      }, "\u25CF \xC9tape actuelle")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: "#94a3b8",
          marginTop: 2,
          fontVariantNumeric: "tabular-nums"
        }
      }, s.proba, "%"), i < steps.length - 1 && /*#__PURE__*/React.createElement("div", {
        style: {
          ...ncStyles.spancoLine,
          background: i < curIdx ? s.color : "#e2e8f0"
        }
      }));
    }));
  })(), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.bodyGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formCol
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pairGrid
  }, /*#__PURE__*/React.createElement("section", {
    style: ncStyles.section
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "01",
    title: "Type & rattachement",
    subtitle: "Nature du contrat et opportunit\xE9 d'origine",
    status: "done"
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formGrid2
  }, /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Type de contrat",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.typeRow
  }, typeCards.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.k,
    onClick: () => setContractType(t.k),
    style: {
      ...ncStyles.typeCard,
      ...(contractType === t.k ? ncStyles.typeCardOn : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.typeIcon
  }, t.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: contractType === t.k ? 700 : 600,
      color: contractType === t.k ? "#0f172a" : "#475569"
    }
  }, t.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: contractType === t.k ? "#64748b" : "#94a3b8"
    }
  }, t.hint)))))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Cat\xE9gorie"
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.segCtrl
  }, segCat("new", "Nouveau"), segCat("extension", "Extension"), segCat("upsell", "Upsell")))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Opportunit\xE9 d'origine",
    subtitle: "Reprise automatique des conditions n\xE9goci\xE9es"
  }, oppId ? /*#__PURE__*/React.createElement("div", {
    style: ncStyles.linkedOpp
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "#1e40af",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700
    }
  }, clientInitials), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", {
    style: ncStyles.refMono
  }, oppId), /*#__PURE__*/React.createElement("span", {
    style: {
      ...ncStyles.stagePill,
      background: "#fef0e6",
      color: "#ea580c"
    }
  }, "\u25CF N\xE9gociation")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      marginTop: 3
    }
  }, clientName)))) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (clientId) window.location.href = "/nouvelle-opportunite?client=" + encodeURIComponent(clientId);
    },
    style: {
      ...ncStyles.addChip,
      padding: "8px 14px",
      cursor: "pointer"
    }
  }, "+ Cr\xE9er une opportunit\xE9"))), /*#__PURE__*/React.createElement("section", {
    style: ncStyles.section
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "02",
    title: "Client & contact signataire",
    subtitle: "Entit\xE9 contractante et signataire habilit\xE9",
    status: "done"
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formGrid2
  }, /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Entit\xE9 contractante",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.linkedCardMini
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 6,
      background: "#1e40af",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10.5,
      fontWeight: 700
    }
  }, clientInitials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, clientName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      fontVariantNumeric: "tabular-nums"
    }
  }, "SIREN ", clientSiren)))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Signataire habilit\xE9",
    required: true
  }, clientContacts.length > 0 && /*#__PURE__*/React.createElement("select", {
    value: "",
    onChange: e => {
      var c = clientContacts.find(x => x.id === e.target.value);
      if (c) {
        var full = ((c.prenom || "") + " " + (c.nom || "")).trim();
        setSignatory({
          name: full,
          role: c.fonction || "",
          email: c.email || "",
          phone: c.phone || ""
        });
      }
    },
    style: {
      ...ncStyles.select100,
      marginBottom: 6,
      fontSize: 12,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir un contact existant (", clientContacts.length, ") \u2014"), clientContacts.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, ((c.prenom || "") + " " + (c.nom || "")).trim() || "(sans nom)", c.fonction ? " · " + c.fonction : ""))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.linkedCardMini
  }, /*#__PURE__*/React.createElement(NCAvatar, {
    name: signatory.name || "?",
    size: 26,
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: signatory.name,
    onChange: e => setSignatory({
      ...signatory,
      name: e.target.value
    }),
    placeholder: "Nom complet",
    style: {
      ...ncStyles.input,
      padding: "4px 8px",
      fontSize: 12,
      border: "none",
      background: "transparent"
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: signatory.role,
    onChange: e => setSignatory({
      ...signatory,
      role: e.target.value
    }),
    placeholder: "Fonction",
    style: {
      ...ncStyles.input,
      padding: "4px 8px",
      fontSize: 11,
      border: "none",
      background: "transparent",
      color: "#64748b"
    }
  }))), !showNewContactForm && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowNewContactForm(true),
    style: {
      marginTop: 8,
      padding: "5px 10px",
      fontSize: 11.5,
      fontWeight: 600,
      background: "transparent",
      color: "#4f46e5",
      border: "1px dashed #c7d2fe",
      borderRadius: 6,
      cursor: "pointer",
      width: "100%"
    }
  }, "+ Ajouter un nouveau contact pour ce client"), showNewContactForm && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: 10,
      background: "#fafbfc",
      border: "1px solid #c7d2fe",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#4f46e5",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 8
    }
  }, "Nouveau contact"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: newContact.prenom,
    onChange: e => setNewContact({
      ...newContact,
      prenom: e.target.value
    }),
    placeholder: "Pr\xE9nom",
    style: {
      ...ncStyles.input,
      padding: "5px 8px",
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: newContact.nom,
    onChange: e => setNewContact({
      ...newContact,
      nom: e.target.value
    }),
    placeholder: "Nom *",
    style: {
      ...ncStyles.input,
      padding: "5px 8px",
      fontSize: 12
    }
  })), /*#__PURE__*/React.createElement("input", {
    value: newContact.fonction,
    onChange: e => setNewContact({
      ...newContact,
      fonction: e.target.value
    }),
    placeholder: "Fonction (ex. G\xE9rant, DAF, Resp. SI\u2026)",
    style: {
      ...ncStyles.input,
      padding: "5px 8px",
      fontSize: 12,
      marginBottom: 6,
      width: "100%",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: newContact.email,
    onChange: e => setNewContact({
      ...newContact,
      email: e.target.value
    }),
    placeholder: "Email",
    type: "email",
    style: {
      ...ncStyles.input,
      padding: "5px 8px",
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: newContact.phone,
    onChange: e => setNewContact({
      ...newContact,
      phone: e.target.value
    }),
    placeholder: "T\xE9l\xE9phone",
    type: "tel",
    style: {
      ...ncStyles.input,
      padding: "5px 8px",
      fontSize: 12
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowNewContactForm(false);
      setNewContact({
        prenom: "",
        nom: "",
        fonction: "",
        email: "",
        phone: ""
      });
    },
    style: {
      ...ncStyles.ghostBtn,
      padding: "6px 12px",
      fontSize: 11.5
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: saveNewContact,
    style: {
      ...ncStyles.primaryBtn,
      padding: "6px 14px",
      fontSize: 11.5
    }
  }, "\u2713 Cr\xE9er & s\xE9lectionner"))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...ncStyles.section,
      ...ncStyles.sectionActive
    }
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "03",
    title: "Produits & pricing",
    subtitle: "Lignes du contrat & abonnement",
    status: "active"
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.table
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.tableHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24
    }
  }, "\u2261"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.5
    }
  }, "Produit / r\xE9f\xE9rence"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 90,
      textAlign: "right"
    }
  }, "PU HT"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 70,
      textAlign: "center"
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      textAlign: "right"
    }
  }, "Total HT"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32
    }
  })), products.map(p => {
    var gross = (Number(p.unit) || 0) * (Number(p.qty) || 0);
    var net = gross * (1 - (Number(p.discount) || 0) / 100);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: ncStyles.tableRow
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 24,
        color: "#cbd5e1",
        cursor: "grab"
      }
    }, "\u22EE\u22EE"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1.5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: p.color
      }
    }), /*#__PURE__*/React.createElement("input", {
      value: p.name,
      onChange: e => updateProduct(p.id, {
        name: e.target.value
      }),
      style: {
        ...ncStyles.input,
        padding: "3px 6px",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        background: "transparent"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: ncStyles.skuChip
    }, p.sku), p.periodicity === "oneshot" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "1px 5px",
        borderRadius: 3,
        background: "#fffbeb",
        color: "#a65f00",
        fontWeight: 700
      }
    }, "ONE-SHOT")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 3,
        paddingLeft: 16
      }
    }, p.desc)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 90,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: p.unit,
      onChange: e => updateProduct(p.id, {
        unit: e.target.value.replace(/[^\d.]/g, "")
      }),
      style: {
        ...ncStyles.qtyInput,
        width: 80,
        textAlign: "right"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 70,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: p.qty,
      onChange: e => updateProduct(p.id, {
        qty: e.target.value.replace(/[^\d.]/g, "")
      }),
      style: ncStyles.qtyInput
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 110,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "#0f172a",
        fontVariantNumeric: "tabular-nums"
      }
    }, fmtEUR(net)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8"
      }
    }, p.periodicity === "oneshot" ? "one-shot" : "annuel")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => removeProduct(p.id),
      style: ncStyles.rowMenu,
      title: "Supprimer"
    }, "\xD7")));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addProduct,
    style: ncStyles.addLine
  }, "+ Ajouter une ligne \xB7 rechercher un article du catalogue")), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.totalsGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.condBlock
  }, /*#__PURE__*/React.createElement("h4", {
    style: ncStyles.condH
  }, "Conditions commerciales"), /*#__PURE__*/React.createElement(NCCondRow, {
    label: "Dur\xE9e d'engagement",
    value: /*#__PURE__*/React.createElement("div", {
      style: ncStyles.segCtrl
    }, segDur(12, "12 mois"), segDur(36, "36 mois"), segDur(60, "60 mois"))
  }), /*#__PURE__*/React.createElement(NCCondRow, {
    label: "Tacite reconduction",
    value: /*#__PURE__*/React.createElement("div", {
      style: ncStyles.toggleRow
    }, /*#__PURE__*/React.createElement("span", {
      onClick: () => setTacite(v => !v),
      style: {
        ...ncStyles.toggle,
        background: tacite ? "#4f46e5" : "#cbd5e1"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...ncStyles.toggleDot,
        left: tacite ? 14 : 2
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#0f172a",
        fontWeight: 600
      }
    }, tacite ? "Activée — préavis 90 j" : "Désactivée"))
  }), /*#__PURE__*/React.createElement(NCCondRow, {
    label: "Indexation annuelle",
    value: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("select", {
      value: indexation,
      onChange: e => setIndexation(e.target.value),
      style: {
        ...ncStyles.select100,
        padding: "5px 10px"
      }
    }, /*#__PURE__*/React.createElement("option", null, "Aucune"), /*#__PURE__*/React.createElement("option", null, "SYNTEC"), /*#__PURE__*/React.createElement("option", null, "INSEE IPC")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, "plafonn\xE9e \xE0"), /*#__PURE__*/React.createElement("input", {
      value: indexCap,
      onChange: e => setIndexCap(e.target.value.replace(/[^\d.]/g, "")),
      style: ncStyles.numInput
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569"
      }
    }, "%"))
  }), /*#__PURE__*/React.createElement(NCCondRow, {
    label: "D\xE9lai paiement",
    value: /*#__PURE__*/React.createElement("div", {
      style: ncStyles.segCtrl
    }, segPay("15j", "15 j"), segPay("30j", "30 j net"), segPay("45fdm", "45 j fdm"), segPay("60j", "60 j"))
  }), /*#__PURE__*/React.createElement(NCCondRow, {
    label: "P\xE9riodicit\xE9 facturation",
    value: /*#__PURE__*/React.createElement("div", {
      style: ncStyles.segCtrl
    }, segBill("monthly", "Mensuel"), segBill("quarterly", "Trim."), segBill("quarterly_due", "Trim. terme à échoir"), segBill("annual", "Annuel avance"))
  })), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.totalsBlock
  }, /*#__PURE__*/React.createElement("h4", {
    style: ncStyles.condH
  }, "R\xE9capitulatif financier"), /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "Sous-total abonnement HT",
    v: fmtEUR(sums.recurringHT)
  }), /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "Sous-total services HT",
    v: fmtEUR(sums.oneshotHT)
  }), /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "Total HT ann\xE9e 1",
    v: fmtEUR(sums.totalY1HT),
    strong: true
  }), /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "TVA 20 %",
    v: fmtEUR(sums.tva)
  }), /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "Total TTC ann\xE9e 1",
    v: fmtEUR(sums.totalY1TTC),
    strongLarge: true
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.totalBox
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "rgba(255,255,255,0.7)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "TCV sur ", duration, " mois (HT)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -0.7,
      marginTop: 4
    }
  }, fmtEUR(sums.tcv)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2
    }
  }, fmtEUR(sums.recurringHT), " r\xE9current annuel + ", fmtEUR(sums.oneshotHT), " one-shot"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 12,
      paddingTop: 10,
      borderTop: "1px solid rgba(255,255,255,0.15)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontWeight: 600
    }
  }, "Co\xFBts estim\xE9s"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#fff",
      marginTop: 2
    }
  }, fmtEUR(sums.cost))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#a7f3d0",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontWeight: 600
    }
  }, "Marge nette"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#86efac",
      marginTop: 2
    }
  }, fmtEUR(sums.margin), " \xB7 ", sums.marginPct, " %"))))))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pairGrid
  }, /*#__PURE__*/React.createElement("section", {
    style: ncStyles.section
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "04",
    title: "Conditions juridiques & dates",
    subtitle: "Cadre l\xE9gal et calendrier contractuel",
    status: "todo"
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formGrid3
  }, /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Date de d\xE9but",
    required: true
  }, (() => {
    var V = window.HubValidators;
    var dateErr = V && V.date(startDate, {
      notInPast: true
    });
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
      type: "date",
      value: startDate,
      onChange: e => setStartDate(e.target.value),
      style: {
        ...ncStyles.input,
        fontVariantNumeric: "tabular-nums",
        ...(dateErr ? V.errorStyle(dateErr) : {})
      }
    }), dateErr && /*#__PURE__*/React.createElement("div", {
      style: V.errorMsgStyle(dateErr)
    }, dateErr.message));
  })()), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Date de fin"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: endDate,
    readOnly: true,
    style: {
      ...ncStyles.input,
      fontVariantNumeric: "tabular-nums",
      background: "#fafbfc"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.inputHelp
  }, "Auto-calcul\xE9 selon dur\xE9e d'engagement")), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Devise"
  }, /*#__PURE__*/React.createElement("input", {
    value: "EUR (\u20AC)",
    readOnly: true,
    disabled: true,
    title: "Devise verrouill\xE9e",
    style: {
      ...ncStyles.input,
      fontVariantNumeric: "tabular-nums",
      background: "#fafbfc",
      color: "#475569",
      cursor: "not-allowed"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formGrid2
  }, /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Mod\xE8le juridique",
    required: true
  }, templates.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.docPick,
      background: "#fff7ed",
      borderColor: "#fdba74"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\u26A0"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#9a3412"
    }
  }, "Aucun mod\xE8le CGV upload\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Va dans ", /*#__PURE__*/React.createElement("a", {
    href: "/administration-utilisateurs",
    style: {
      color: "#3730a3",
      textDecoration: "underline"
    }
  }, "Administration \u2192 Mod\xE8les de contrat"), " pour uploader ton PDF."))) : /*#__PURE__*/React.createElement("select", {
    value: selectedTemplate ? selectedTemplate.id : "",
    onChange: e => setSelectedTemplate(templates.find(t => t.id === e.target.value) || null),
    style: {
      ...ncStyles.input,
      fontSize: 13
    }
  }, templates.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name, " \xB7 ", t.version, t.is_default ? " · DÉFAUT" : ""))), selectedTemplate && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC4 ", selectedTemplate.pdf_size_kb || "?", " Ko"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, selectedTemplate.cgv_text ? Math.round(selectedTemplate.cgv_text.length / 100) / 10 + "k caractères extraits" : "Aucun texte extrait"), selectedTemplate.pdf_url && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("a", {
    href: selectedTemplate.pdf_url,
    target: "_blank",
    rel: "noopener",
    style: {
      color: "#3730a3",
      fontWeight: 600
    }
  }, "\uD83D\uDC41 Voir PDF source")))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Annexes"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, annexes.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: ncStyles.annexRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a855f7"
    }
  }, "\uD83D\uDCCE"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: "#0f172a"
    }
  }, a.label), /*#__PURE__*/React.createElement("span", {
    onClick: () => removeAnnexe(a.id),
    style: {
      ...ncStyles.removeChip,
      cursor: "pointer"
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("button", {
    onClick: addAnnexe,
    style: {
      ...ncStyles.addChip,
      alignSelf: "flex-start"
    }
  }, "+ Ajouter une annexe")))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Clauses sp\xE9cifiques",
    subtitle: "N\xE9goci\xE9es hors standard"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, clauses.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: ncStyles.clauseRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...ncStyles.clauseTag,
      background: "#eef2ff",
      color: "#4338ca"
    }
  }, c.tag), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: "#0f172a"
    }
  }, c.text), /*#__PURE__*/React.createElement("span", {
    onClick: () => removeClause(c.id),
    style: {
      ...ncStyles.removeChip,
      cursor: "pointer"
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("button", {
    onClick: addClause,
    style: {
      ...ncStyles.addChip,
      alignSelf: "flex-start"
    }
  }, "+ Ajouter une clause"))), contractArticles.length > 0 && /*#__PURE__*/React.createElement("div", {
    id: "nc-articles-panel",
    style: ncStyles.articlesPanel
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticlesPanelOpen(v => !v),
    style: ncStyles.articlesPanelHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\uD83D\uDCD1"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Articles du contrat"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "\xB7 ", contractArticles.length, " articles"), editedCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#fef3c7",
      color: "#a65f00",
      fontWeight: 700
    }
  }, "\u25CF ", editedCount, " modifi\xE9", editedCount > 1 ? "s" : "")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#64748b",
      transition: "transform 180ms",
      transform: articlesPanelOpen ? "rotate(180deg)" : "none"
    }
  }, "\u2304")), articlesPanelOpen && /*#__PURE__*/React.createElement("div", {
    style: ncStyles.articlesPanelBody
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      padding: "6px 12px 10px",
      lineHeight: 1.5
    }
  }, "Personnalisez chaque article pour ce contrat. Le texte modifi\xE9 remplacera celui du mod\xE8le standard lors de la g\xE9n\xE9ration du PDF. Cliquez sur un article pour le d\xE9plier."), contractArticles.map(a => {
    var open = !!expandedArticles[a.n];
    return /*#__PURE__*/React.createElement("div", {
      key: a.n,
      style: ncStyles.articleItem
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleArticle(a.n),
      style: ncStyles.articleHead
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: ncStyles.articleNum
    }, "Art. ", a.n), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.title), a.edited && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        padding: "1px 5px",
        borderRadius: 3,
        background: "#fef3c7",
        color: "#a65f00",
        fontWeight: 700,
        flexShrink: 0
      }
    }, "MODIFI\xC9")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#94a3b8",
        transition: "transform 180ms",
        transform: open ? "rotate(180deg)" : "none"
      }
    }, "\u2304")), open && /*#__PURE__*/React.createElement("div", {
      style: ncStyles.articleBody
    }, /*#__PURE__*/React.createElement("textarea", {
      value: a.body,
      onChange: e => updateArticleBody(a.n, e.target.value),
      rows: Math.min(20, Math.max(6, a.body.split("\n").length + 1)),
      style: ncStyles.articleTextarea,
      spellCheck: false
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, a.body.length, " caract\xE8res \xB7 ", a.body.split(/\s+/).filter(Boolean).length, " mots"), a.edited && /*#__PURE__*/React.createElement("button", {
      onClick: () => resetArticleBody(a.n),
      style: {
        ...ncStyles.ghostBtn,
        padding: "4px 10px",
        fontSize: 11
      }
    }, "\u21BA Restaurer le texte original"))));
  })))), /*#__PURE__*/React.createElement("section", {
    style: ncStyles.section
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "05",
    title: "Signature & workflow",
    subtitle: "Validation interne et signature \xE9lectronique",
    status: "todo"
  }), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Mode de signature",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.signMethods
  }, [{
    k: "qualified",
    emoji: "✍",
    title: "Signature électronique qualifiée",
    desc: "Via DocuSign — valeur juridique probante · délai moyen 2 j",
    badge: "eIDAS"
  }, {
    k: "simple",
    emoji: "📧",
    title: "Signature simple",
    desc: "Scan retour PDF · à éviter > 50 k€"
  }, {
    k: "manual",
    emoji: "🖋",
    title: "Signature manuscrite",
    desc: "Original papier — RDV physique requis"
  }].map(m => /*#__PURE__*/React.createElement("label", {
    key: m.k,
    onClick: () => setSignMethod(m.k),
    style: {
      ...ncStyles.signMethod,
      ...(signMethod === m.k ? ncStyles.signMethodOn : {})
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "sign",
    checked: signMethod === m.k,
    onChange: () => setSignMethod(m.k)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, m.emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: signMethod === m.k ? 700 : 600,
      color: signMethod === m.k ? "#0f172a" : "#475569"
    }
  }, m.title), m.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      padding: "1px 5px",
      borderRadius: 3,
      background: "#4f46e5",
      color: "#fff",
      fontWeight: 700
    }
  }, m.badge)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: signMethod === m.k ? "#64748b" : "#94a3b8",
      marginTop: 3
    }
  }, m.desc)))))))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.actionsRow
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => history.back(),
    style: ncStyles.ghostBtn
  }, "\u2190 Pr\xE9c\xE9dent"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => submitContract("draft"),
    style: ncStyles.ghostBtn
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreviewOpen(true),
    style: ncStyles.primaryBtn
  }, "Continuer \u2192 Envoi signature")))), /*#__PURE__*/React.createElement("aside", {
    style: ncStyles.previewCol
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfMock
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase"
    }
  }, "Aper\xE7u document"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#10b981",
      color: "#fff",
      fontWeight: 700
    }
  }, "\u25CF LIVE")), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfPaper
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfHeader
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfLogo
  }, "H"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: 0.5
    }
  }, "HUB ASTORYA SAS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 7,
      color: "#64748b"
    }
  }, "184 rue de Rivoli \u2014 75001 Paris")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 7.5,
      color: "#94a3b8",
      fontWeight: 600
    }
  }, "CONTRAT N\xB0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums"
    }
  }, "CTR-", new Date().getFullYear(), "-DRAFT"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -0.2
    }
  }, "Contrat de souscription"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#64748b",
      marginTop: 1
    }
  }, products[0] ? products[0].name : "—", " \u2014 ", clientName), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 8,
      background: "#fafbfc",
      borderRadius: 4,
      fontSize: 8,
      lineHeight: 1.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, "Entre les soussign\xE9s :"), /*#__PURE__*/React.createElement("br", null), "Hub Astorya SAS, ci-apr\xE8s \xAB le Prestataire \xBB", /*#__PURE__*/React.createElement("br", null), "et ", clientName, ", ci-apr\xE8s \xAB le Client \xBB"), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.pdfTableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      textAlign: "center"
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 60,
      textAlign: "right"
    }
  }, "Total HT")), products.map(p => {
    var net = (Number(p.unit) || 0) * (Number(p.qty) || 0) * (1 - (Number(p.discount) || 0) / 100);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: ncStyles.pdfLine
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        color: "#0f172a",
        fontWeight: 600
      }
    }, p.name), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        textAlign: "center"
      }
    }, p.qty), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 60,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums"
      }
    }, fmtEUR(net)));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.pdfLine,
      background: "#0f172a",
      color: "#fff",
      padding: "5px 8px",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: 700
    }
  }, "TOTAL HT ANN\xC9E 1"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 60,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700
    }
  }, fmtEUR(sums.totalY1HT))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "5px 8px",
      background: "#eef2ff",
      borderRadius: 4,
      fontSize: 7,
      color: "#3730a3",
      textAlign: "center"
    }
  }, "Page 1 / ", products.length + 3, " \xB7 ", annexes.length, " annexe", annexes.length > 1 ? "s" : "")))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.lifecycle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10
    }
  }, "Cycle de vie du contrat"), /*#__PURE__*/React.createElement(NCLifecycleItem, {
    date: fmtDateFR(startDate),
    label: "Date de d\xE9but",
    active: true
  }), /*#__PURE__*/React.createElement(NCLifecycleItem, {
    date: fmtDateFR((() => {
      var d = new Date(startDate);
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    })()),
    label: "Échéance récurrente · " + fmtEUR(sums.recurringHT)
  }), tacite && /*#__PURE__*/React.createElement(NCLifecycleItem, {
    date: fmtDateFR((() => {
      var d = new Date(endDate);
      d.setDate(d.getDate() - 90);
      return d.toISOString();
    })()),
    label: "Pr\xE9avis non-reconduction (T-90j)",
    warn: true
  }), /*#__PURE__*/React.createElement(NCLifecycleItem, {
    date: fmtDateFR(endDate),
    label: "Fin du contrat" + (tacite ? " · renouvellement auto" : ""),
    final: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.alertBlock,
      background: "#fff8f7",
      borderColor: "#fecaca"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\u26A0"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#dc2626"
    }
  }, "Points d'attention")), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.alertItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: sums.marginPct >= 35 ? "#10b981" : "#f59e0b",
      fontSize: 10
    }
  }, "\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569",
      lineHeight: 1.5
    }
  }, "Marge nette ", sums.marginPct, " % ", sums.marginPct >= 35 ? "> objectif équipe (35 %)" : "< objectif équipe (35 %)")), sums.totalY1HT > 150000 && /*#__PURE__*/React.createElement("div", {
    style: ncStyles.alertItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b",
      fontSize: 10
    }
  }, "\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569",
      lineHeight: 1.5
    }
  }, "Montant ", ">", " 150 k\u20AC \u2014 validation Direction Finance obligatoire")))))), previewOpen && window.ContractPreview && /*#__PURE__*/React.createElement(ContractPreview, {
    contract: {
      id: "CTR-" + new Date().getFullYear() + "-DRAFT",
      client_id: clientId,
      client_name: clientName,
      name: products.slice(0, 2).map(p => p.name).join(" + "),
      products,
      annexes,
      clauses,
      sums,
      start: startDate,
      end: endDate,
      duration,
      tacite,
      indexation,
      indexCap,
      payment_delay: paymentDelay,
      billing_period: billingPeriod,
      signatory
    },
    clientObj: clientObj,
    templateName: selectedTemplate ? selectedTemplate.name + " " + selectedTemplate.version : "CGV Astorya Suite v4.2 — FR",
    cgvText: selectedTemplate ? selectedTemplate.cgv_text : null,
    templatePdfUrl: selectedTemplate ? selectedTemplate.pdf_url : null,
    onClose: () => setPreviewOpen(false),
    onConfirm: () => {
      setPreviewOpen(false);
      submitContract("send");
    }
  }));
};
var ncStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column"
  },
  topbar: {
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10
  },
  refMono: {
    fontVariantNumeric: "tabular-nums",
    fontSize: 11,
    color: "#94a3b8",
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    marginLeft: 4
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
    padding: "7px 16px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  titleRow: {
    padding: "20px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    flexWrap: "wrap",
    gap: 16
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.7,
    margin: 0
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  liveKpi: {
    padding: "10px 16px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  liveKpiK: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 700
  },
  liveKpiV: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.4,
    marginTop: 2
  },
  // Stepper SPANCO — gros cercles colorés, alignés avec lignes connectrices
  spancoStepper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    gap: 8
  },
  spancoStep: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    textAlign: "center"
  },
  spancoDot: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 180ms",
    zIndex: 1
  },
  spancoLine: {
    position: "absolute",
    top: 18,
    left: "calc(50% + 22px)",
    right: "calc(-50% + 22px)",
    height: 2,
    background: "#e2e8f0",
    zIndex: 0,
    pointerEvents: "none"
  },
  body: {
    padding: 20
  },
  bodyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 14,
    gridAutoRows: "min-content"
  },
  formCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minWidth: 0
  },
  pairGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    alignItems: "start"
  },
  section: {
    padding: 20,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  sectionActive: {
    boxShadow: "0 0 0 1px rgba(79,70,229,0.08), 0 4px 16px rgba(79,70,229,0.06)"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box"
  },
  inputHelp: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4
  },
  select100: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "#0f172a"
  },
  numInput: {
    width: 50,
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12.5,
    fontVariantNumeric: "tabular-nums",
    textAlign: "center"
  },
  qtyInput: {
    width: 50,
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12.5,
    fontVariantNumeric: "tabular-nums",
    textAlign: "center",
    fontWeight: 600
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14
  },
  formGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14
  },
  segCtrl: {
    display: "inline-flex",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 2,
    background: "#fff",
    flexWrap: "wrap"
  },
  segBtn: {
    padding: "5px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  segBtnActive: {
    background: "#0f172a",
    color: "#fff",
    fontWeight: 600
  },
  typeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8
  },
  typeCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    background: "#fff"
  },
  typeCardOn: {
    background: "linear-gradient(180deg, #eef2ff, #fff)",
    borderColor: "#4f46e5",
    boxShadow: "0 0 0 3px rgba(79,70,229,0.08)"
  },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: "#eef2ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0
  },
  linkedOpp: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "linear-gradient(135deg, #fafbff, #fff)",
    border: "1px solid #c7d2fe",
    borderRadius: 10
  },
  linkedCardMini: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  changeBtn: {
    padding: "3px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  stagePill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "1px 6px",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  contactChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999
  },
  removeChip: {
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 13,
    lineHeight: 1
  },
  addChip: {
    padding: "3px 10px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 999,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  table: {
    border: "1px solid #eef1f5",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14
  },
  tableHead: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    background: "#fafbfc",
    borderBottom: "1px solid #eef1f5",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff"
  },
  skuChip: {
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#eef1f5",
    color: "#475569",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600
  },
  rowMenu: {
    width: 24,
    height: 24,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 16
  },
  addLine: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderTop: "1px dashed #cbd5e1",
    background: "#fafbfc",
    fontSize: 12,
    color: "#4f46e5",
    cursor: "pointer",
    fontWeight: 600,
    textAlign: "left",
    paddingLeft: 14
  },
  totalsGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 14
  },
  condBlock: {
    padding: 14,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  condH: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  totalsBlock: {
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  toggle: {
    width: 28,
    height: 16,
    borderRadius: 999,
    position: "relative",
    display: "inline-block",
    cursor: "pointer"
  },
  toggleDot: {
    position: "absolute",
    top: 2,
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "#fff",
    transition: "left .2s"
  },
  totalBox: {
    padding: 14,
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)",
    borderRadius: 10,
    marginTop: 12,
    color: "#fff"
  },
  docPick: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  annexRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 10px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 6
  },
  clauseRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 6
  },
  clauseTag: {
    fontSize: 9,
    padding: "1px 5px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.4
  },
  signMethods: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8
  },
  signMethod: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer"
  },
  signMethodOn: {
    background: "linear-gradient(180deg, #fafbff, #fff)",
    borderColor: "#4f46e5",
    boxShadow: "0 0 0 3px rgba(79,70,229,0.08)"
  },
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    marginTop: 4,
    flexWrap: "wrap",
    gap: 12
  },
  previewCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    position: "sticky",
    top: 20,
    alignSelf: "start"
  },
  pdfMock: {
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  pdfHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  pdfPaper: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(15,23,42,0.08)"
  },
  pdfHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderBottom: "2px solid #0f172a"
  },
  pdfLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700
  },
  pdfTableHead: {
    display: "flex",
    padding: "5px 8px",
    borderBottom: "1px solid #cbd5e1",
    marginTop: 10,
    fontSize: 7,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 700
  },
  pdfLine: {
    display: "flex",
    padding: "4px 8px",
    fontSize: 8,
    color: "#475569",
    borderBottom: "1px solid #f1f5f9"
  },
  lifecycle: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  alertBlock: {
    padding: 14,
    border: "1px solid",
    borderRadius: 12
  },
  alertItem: {
    display: "flex",
    gap: 8,
    padding: "5px 0"
  },
  // Panneau articles dépliable
  articlesPanel: {
    marginTop: 16,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "#fff",
    overflow: "hidden"
  },
  articlesPanelHead: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: "linear-gradient(180deg, #fafbfc, #fff)",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left"
  },
  articlesPanelBody: {
    borderTop: "1px solid #eef1f5",
    background: "#fafbfc",
    padding: "8px 8px 10px"
  },
  articleItem: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    marginBottom: 6,
    overflow: "hidden"
  },
  articleHead: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "9px 12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left"
  },
  articleNum: {
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
    background: "#4f46e5",
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: 0.3,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums"
  },
  articleBody: {
    padding: "10px 12px 12px",
    borderTop: "1px solid #f1f5f9",
    background: "#fafbfc"
  },
  articleTextarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'SF Mono', Consolas, monospace",
    lineHeight: 1.55,
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    resize: "vertical",
    outline: "none"
  }
};
window.NewContract = NewContract;