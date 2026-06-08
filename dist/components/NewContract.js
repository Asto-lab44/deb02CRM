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
      fontFamily: "'JetBrains Mono', monospace",
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
    fontFamily: "'JetBrains Mono', monospace",
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
    fontFamily: "'JetBrains Mono', monospace",
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
  var [indexation, setIndexation] = React.useState("SYNTEC");
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
    role: ""
  });
  var [savedTick, setSavedTick] = React.useState(0);

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

  // ── Mutations
  var updateProduct = (id, patch) => setProducts(ps => ps.map(p => p.id === id ? {
    ...p,
    ...patch
  } : p));
  var removeProduct = id => setProducts(ps => ps.filter(p => p.id !== id));
  var addProduct = () => {
    var name = prompt("Nom du produit / article :");
    if (!name) return;
    var unit = parseFloat(prompt("Prix unitaire HT (€) :", "0")) || 0;
    var qty = parseFloat(prompt("Quantité :", "1")) || 1;
    var periodicity = (prompt("Périodicité (annual / oneshot) :", "annual") || "annual").trim();
    var palette = ["#a855f7", "#dc2626", "#0ea5e9", "#10b981", "#f59e0b", "#6366f1"];
    setProducts(ps => [...ps, {
      id: "p" + Date.now(),
      name,
      sku: "—",
      desc: "",
      unit,
      qty,
      discount: 0,
      periodicity,
      color: palette[ps.length % palette.length]
    }]);
  };
  var removeAnnexe = id => setAnnexes(a => a.filter(x => x.id !== id));
  var addAnnexe = () => {
    var l = prompt("Intitulé de l'annexe :");
    if (l) setAnnexes(a => [...a, {
      id: "a" + Date.now(),
      label: l
    }]);
  };
  var removeClause = id => setClauses(a => a.filter(x => x.id !== id));
  var addClause = () => {
    var l = prompt("Clause spécifique :");
    if (l) setClauses(a => [...a, {
      id: "c" + Date.now(),
      tag: "NÉGOCIÉ",
      text: l
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
      total_ht_y1: sums.totalY1HT,
      tcv: sums.tcv,
      margin_pct: sums.marginPct,
      amount: fmtEUR(sums.totalY1HT) + " / an",
      status: action === "send" ? "pending_signature" : "draft",
      created_at: new Date().toISOString()
    };
    try {
      await window.api.contracts.create(ctr);
    } catch (e) {
      console.warn("submitContract:", e);
    }
    if (action === "send") {
      alert("Contrat " + ctrRef + " envoyé pour signature à " + (signatory.name || "le signataire"));
    } else {
      alert("Brouillon enregistré : " + ctrRef);
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
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => history.back(),
    style: ncStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Import depuis devis — à venir"),
    style: ncStyles.ghostBtn
  }, "\u2193 Importer depuis devis"), /*#__PURE__*/React.createElement("button", {
    onClick: () => submitContract("send"),
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
  }, sums.marginPct, " %")))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.stepper
  }, [{
    n: 1,
    label: "Type & rattachement",
    done: true
  }, {
    n: 2,
    label: "Client & contact",
    done: true
  }, {
    n: 3,
    label: "Produits & pricing",
    active: true
  }, {
    n: 4,
    label: "Conditions juridiques"
  }, {
    n: 5,
    label: "Signature & envoi"
  }].map((s, i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s.n
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.stepItem
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.stepDot,
      background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
      border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
      color: s.done || s.active ? "#fff" : "#94a3b8"
    }
  }, s.done ? "✓" : s.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: s.active ? 700 : 500,
      color: s.done ? "#10b981" : s.active ? "#0f172a" : "#94a3b8"
    }
  }, s.label)), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...ncStyles.stepLine,
      background: s.done ? "#10b981" : "#eef1f5"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.bodyGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formCol
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
  }, clientName))), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Sélection d'opportunité — à venir"),
    style: ncStyles.changeBtn
  }, "Changer")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Rattacher une opportunité — à venir"),
    style: {
      ...ncStyles.addChip,
      padding: "8px 14px"
    }
  }, "+ Rattacher une opportunit\xE9"))), /*#__PURE__*/React.createElement("section", {
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
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "SIREN ", clientSiren)), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.location.href = "/crm",
    style: ncStyles.changeBtn
  }, "Changer"))), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Signataire habilit\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
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
  })))))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...ncStyles.section,
      ...ncStyles.sectionActive
    }
  }, /*#__PURE__*/React.createElement(NCSectionHead, {
    num: "03",
    title: "Produits & pricing",
    subtitle: "Lignes du contrat, remises, abonnement",
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
      width: 90,
      textAlign: "right"
    }
  }, "Remise %"), /*#__PURE__*/React.createElement("div", {
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
        width: 90,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: p.discount,
      onChange: e => updateProduct(p.id, {
        discount: e.target.value.replace(/[^\d.]/g, "")
      }),
      style: {
        ...ncStyles.qtyInput,
        width: 60,
        textAlign: "right"
      }
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
        fontFamily: "'JetBrains Mono', monospace"
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
    }, /*#__PURE__*/React.createElement("option", null, "SYNTEC"), /*#__PURE__*/React.createElement("option", null, "INSEE IPC"), /*#__PURE__*/React.createElement("option", null, "Aucune")), /*#__PURE__*/React.createElement("span", {
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
    }, segBill("monthly", "Mensuel"), segBill("quarterly", "Trim."), segBill("annual", "Annuel avance"))
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
  }), sums.discountTotal > 0 && /*#__PURE__*/React.createElement(NCTotalRow, {
    label: "Remise commerciale",
    v: "– " + fmtEUR(sums.discountTotal),
    color: "#10b981"
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
  }, fmtEUR(sums.margin), " \xB7 ", sums.marginPct, " %"))))))), /*#__PURE__*/React.createElement("section", {
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
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: startDate,
    onChange: e => setStartDate(e.target.value),
    style: {
      ...ncStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    }
  })), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Date de fin"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: endDate,
    readOnly: true,
    style: {
      ...ncStyles.input,
      fontFamily: "'JetBrains Mono', monospace",
      background: "#fafbfc"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.inputHelp
  }, "Auto-calcul\xE9 selon dur\xE9e d'engagement")), /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Devise"
  }, /*#__PURE__*/React.createElement("select", {
    value: currency,
    onChange: e => setCurrency(e.target.value),
    style: ncStyles.select100
  }, /*#__PURE__*/React.createElement("option", {
    value: "EUR"
  }, "EUR (\u20AC)"), /*#__PURE__*/React.createElement("option", {
    value: "USD"
  }, "USD ($)"), /*#__PURE__*/React.createElement("option", {
    value: "GBP"
  }, "GBP (\xA3)"), /*#__PURE__*/React.createElement("option", {
    value: "CHF"
  }, "CHF")))), /*#__PURE__*/React.createElement("div", {
    style: ncStyles.formGrid2
  }, /*#__PURE__*/React.createElement(NCFormRow, {
    label: "Mod\xE8le juridique",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: ncStyles.docPick
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "CGV Astorya Suite v4.2 \u2014 FR"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Mise \xE0 jour ", fmtDateFR(new Date().toISOString()), " \xB7 DORA-compliant")), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Choix du modèle — à venir"),
    style: ncStyles.changeBtn
  }, "Changer"))), /*#__PURE__*/React.createElement(NCFormRow, {
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
  }, "+ Ajouter une clause")))), /*#__PURE__*/React.createElement("section", {
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
  }, m.desc))))))), /*#__PURE__*/React.createElement("div", {
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
    onClick: () => alert("Aperçu PDF — à venir"),
    style: ncStyles.ghostBtn
  }, "\uD83D\uDC41 Pr\xE9visualiser PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: () => submitContract("draft"),
    style: ncStyles.ghostBtn
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    onClick: () => submitContract("send"),
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
      fontFamily: "'JetBrains Mono', monospace"
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
        fontFamily: "'JetBrains Mono', monospace"
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
      fontFamily: "'JetBrains Mono', monospace",
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
  }, "Points d'attention")), sums.discountTotal / Math.max(1, sums.totalY1HT + sums.discountTotal) > 0.10 && /*#__PURE__*/React.createElement("div", {
    style: ncStyles.alertItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#dc2626",
      fontSize: 10
    }
  }, "\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569",
      lineHeight: 1.5
    }
  }, "Remise globale > seuil standard 10 % \u2192 approbation Finance requise")), /*#__PURE__*/React.createElement("div", {
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
  }, "Montant ", ">", " 150 k\u20AC \u2014 validation Direction Finance obligatoire")))))));
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
    fontFamily: "'JetBrains Mono', monospace",
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
  stepper: {
    display: "flex",
    alignItems: "center",
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fafbfc",
    gap: 8,
    flexWrap: "wrap"
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    maxWidth: 100,
    minWidth: 20
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
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: "center"
  },
  qtyInput: {
    width: 50,
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12.5,
    fontFamily: "'JetBrains Mono', monospace",
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
    fontFamily: "'JetBrains Mono', monospace",
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
  }
};
window.NewContract = NewContract;