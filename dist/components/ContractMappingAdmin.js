// ════════════════════════════════════════════════════════════════════
// ContractMappingAdmin — Back office : produits → modèle de contrat
// ════════════════════════════════════════════════════════════════════
//
// Permet au superadmin de définir des règles « si un produit contient X
// dans son SKU ou son nom, alors le contrat de type Y s'applique ». Ces
// règles sont utilisées par HubHostingContractPdf.detectKind() pour
// auto-sélectionner le bon template PDF dans NewContract.
//
// Stockage : localStorage clé "hubAstorya.contract_kind_rules.v1".
// Format   : [{ id, pattern: "TEL", kind: "phone", label: "Téléphonie" }, …]
// ════════════════════════════════════════════════════════════════════

var ContractMappingAdmin = () => {
  // KINDS disponibles depuis HubHostingContractPdf
  var KINDS = window.HubHostingContractPdf && window.HubHostingContractPdf.KINDS || {};
  var kindEntries = Object.keys(KINDS).map(k => ({
    k,
    label: KINDS[k].label,
    defaults: KINDS[k].patterns || []
  }));
  var LS_KEY = "hubAstorya.contract_kind_rules.v1";
  var [rules, setRules] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });
  var [draft, setDraft] = React.useState({
    pattern: "",
    kind: kindEntries[0] ? kindEntries[0].k : "hosting"
  });
  var [testInput, setTestInput] = React.useState("");
  var [testResult, setTestResult] = React.useState(null);
  var persist = next => {
    setRules(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {}
  };
  var addRule = () => {
    var pattern = String(draft.pattern || "").trim();
    if (!pattern) return;
    var id = "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var next = [...rules, {
      id,
      pattern,
      kind: draft.kind
    }];
    persist(next);
    setDraft({
      pattern: "",
      kind: draft.kind
    });
  };
  var removeRule = id => persist(rules.filter(r => r.id !== id));
  var updateRule = (id, patch) => persist(rules.map(r => r.id === id ? {
    ...r,
    ...patch
  } : r));
  var runTest = () => {
    if (!window.HubHostingContractPdf) {
      setTestResult({
        error: "Le générateur PDF n'est pas chargé."
      });
      return;
    }
    var fakeProducts = String(testInput).split(/[,\n;]/).map(s => s.trim()).filter(Boolean).map(s => ({
      sku: s,
      name: s,
      qty: 1,
      unit: 1
    }));
    if (!fakeProducts.length) {
      setTestResult({
        error: "Saisis au moins un SKU ou nom."
      });
      return;
    }
    var detected = window.HubHostingContractPdf.detectKind(fakeProducts);
    var label = KINDS[detected] && KINDS[detected].label || detected;
    setTestResult({
      kind: detected,
      label,
      products: fakeProducts
    });
  };
  var seedDefaults = () => {
    if (!confirm("Ajouter les règles par défaut pour chaque template ? Les règles existantes sont conservées.")) return;
    var next = [...rules];
    kindEntries.forEach(k => {
      k.defaults.forEach(pat => {
        if (!next.some(r => r.kind === k.k && (r.pattern || "").toUpperCase() === pat.toUpperCase())) {
          next.push({
            id: "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            pattern: pat,
            kind: k.k
          });
        }
      });
    });
    persist(next);
  };
  var resetAll = () => {
    if (!confirm("Effacer TOUTES les règles personnalisées ? Les patterns par défaut intégrés au code resteront actifs.")) return;
    persist([]);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.page
  }, /*#__PURE__*/React.createElement("header", {
    style: S.head
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "Mapping Produits \u2192 Mod\xE8les de contrat"), /*#__PURE__*/React.createElement("p", {
    style: S.sub
  }, "D\xE9finis les r\xE8gles qui d\xE9terminent automatiquement quel mod\xE8le de contrat utiliser selon les produits s\xE9lectionn\xE9s dans un nouveau contrat.")), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: S.ghostBtn
  }, "\u2190 Retour Hub")), /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Templates disponibles"), /*#__PURE__*/React.createElement("div", {
    style: S.kindGrid
  }, kindEntries.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.k,
    style: S.kindCard
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kindBadge
  }, k.k), /*#__PURE__*/React.createElement("div", {
    style: S.kindLabel
  }, k.label), /*#__PURE__*/React.createElement("div", {
    style: S.kindDefaults
  }, /*#__PURE__*/React.createElement("span", {
    style: S.lblDef
  }, "Patterns par d\xE9faut :"), (k.defaults || []).map(p => /*#__PURE__*/React.createElement("code", {
    key: p,
    style: S.tag
  }, p))))))), /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "R\xE8gles personnalis\xE9es (", rules.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: seedDefaults,
    style: S.ghostBtn
  }, "+ Importer patterns par d\xE9faut"), /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    style: {
      ...S.ghostBtn,
      color: "#dc2626",
      borderColor: "#fecaca"
    }
  }, "Tout effacer"))), /*#__PURE__*/React.createElement("div", {
    style: S.addRow
  }, /*#__PURE__*/React.createElement("input", {
    value: draft.pattern,
    onChange: e => setDraft({
      ...draft,
      pattern: e.target.value
    }),
    placeholder: "Pattern (SKU ou nom, ex. \xAB TEL \xBB, \xAB MAINT-HOTLINE \xBB)\u2026",
    onKeyDown: e => {
      if (e.key === "Enter") addRule();
    },
    style: S.input
  }), /*#__PURE__*/React.createElement("select", {
    value: draft.kind,
    onChange: e => setDraft({
      ...draft,
      kind: e.target.value
    }),
    style: S.input
  }, kindEntries.map(k => /*#__PURE__*/React.createElement("option", {
    key: k.k,
    value: k.k
  }, k.label))), /*#__PURE__*/React.createElement("button", {
    onClick: addRule,
    disabled: !draft.pattern.trim(),
    style: S.primaryBtn
  }, "+ Ajouter")), rules.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucune r\xE8gle personnalis\xE9e. Les patterns par d\xE9faut int\xE9gr\xE9s au code (HOST, TEL, MAINT, etc.) restent actifs.") : /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Pattern"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Template appliqu\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      width: 80
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rules.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id
  }, /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("input", {
    value: r.pattern,
    onChange: e => updateRule(r.id, {
      pattern: e.target.value
    }),
    style: {
      ...S.input,
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("select", {
    value: r.kind,
    onChange: e => updateRule(r.id, {
      kind: e.target.value
    }),
    style: {
      ...S.input,
      width: "100%"
    }
  }, kindEntries.map(k => /*#__PURE__*/React.createElement("option", {
    key: k.k,
    value: k.k
  }, k.label)))), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => removeRule(r.id),
    style: {
      ...S.ghostBtn,
      color: "#dc2626",
      borderColor: "#fecaca",
      padding: "5px 10px"
    }
  }, "\xD7"))))))), /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83E\uDDEA Tester la d\xE9tection"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "0 0 10px 0"
    }
  }, "Saisis une liste de SKU/d\xE9signations s\xE9par\xE9s par des virgules ou des retours \xE0 la ligne, puis clique ", /*#__PURE__*/React.createElement("strong", null, "Tester"), ". Le syst\xE8me renvoie le template qui serait choisi automatiquement."), /*#__PURE__*/React.createElement("textarea", {
    value: testInput,
    onChange: e => setTestInput(e.target.value),
    placeholder: "ex. AST-SERV-HEBE, OFFICE365-LIC, MAINT-HOTLINE-50",
    style: {
      ...S.input,
      width: "100%",
      minHeight: 80,
      fontVariantNumeric: "tabular-nums",
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: runTest,
    style: {
      ...S.primaryBtn,
      marginTop: 10
    }
  }, "Tester la d\xE9tection"), testResult && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 14,
      background: testResult.error ? "#fee2e2" : "#dcfce7",
      borderRadius: 8,
      fontSize: 13,
      color: testResult.error ? "#991b1b" : "#065f46"
    }
  }, testResult.error ? testResult.error : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, testResult.label), " serait s\xE9lectionn\xE9 automatiquement", /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569",
      marginTop: 4
    }
  }, "Pour ", testResult.products.length, " produit(s) : ", testResult.products.map(p => p.sku).join(", "))))), /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCD8 Comment \xE7a marche"), /*#__PURE__*/React.createElement("ol", {
    style: {
      fontSize: 12.5,
      color: "#475569",
      lineHeight: 1.7,
      paddingLeft: 18,
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("li", null, "Quand l'utilisateur cr\xE9e un nouveau contrat dans ", /*#__PURE__*/React.createElement("code", null, "/nouveau-contrat"), ", il s\xE9lectionne ses produits."), /*#__PURE__*/React.createElement("li", null, "Au moment de g\xE9n\xE9rer le PDF, le syst\xE8me scanne chaque produit (SKU + nom) \xE0 la recherche de patterns."), /*#__PURE__*/React.createElement("li", null, "Chaque match avec une r\xE8gle personnalis\xE9e ", /*#__PURE__*/React.createElement("strong", null, "compte pour 10 points"), ", chaque match avec un pattern par d\xE9faut ", /*#__PURE__*/React.createElement("strong", null, "compte pour 1 point"), "."), /*#__PURE__*/React.createElement("li", null, "Le template ayant le score le plus \xE9lev\xE9 est utilis\xE9 pour g\xE9n\xE9rer le PDF."), /*#__PURE__*/React.createElement("li", null, "L'utilisateur peut forcer manuellement un template depuis le formulaire ", /*#__PURE__*/React.createElement("em", null, "Nouveau contrat"), "."))));
};
var S = {
  page: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "30px 24px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20
  },
  h1: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
    color: "#0f172a",
    letterSpacing: -0.3
  },
  sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0 0",
    lineHeight: 1.5,
    maxWidth: 700
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    border: "1px solid #eef1f5",
    marginBottom: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 12px 0",
    color: "#0f172a"
  },
  kindGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12
  },
  kindCard: {
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "#fafbfc"
  },
  kindBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    background: "#1e293b",
    color: "#fff",
    fontSize: 9.5,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: 0.5
  },
  kindLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 6
  },
  kindDefaults: {
    marginTop: 8
  },
  lblDef: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: 0.3,
    marginRight: 4
  },
  tag: {
    display: "inline-block",
    padding: "1px 5px",
    margin: "2px 3px 2px 0",
    borderRadius: 3,
    background: "#e0e7ff",
    color: "#3730a3",
    fontSize: 10,
    fontVariantNumeric: "tabular-nums"
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginBottom: 14
  },
  input: {
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 12.5,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    flex: 1
  },
  primaryBtn: {
    padding: "8px 16px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  ghostBtn: {
    padding: "7px 12px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 6
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #eef1f5",
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: 0.3
  },
  td: {
    padding: "6px 6px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 12.5
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    background: "#fafbfc",
    border: "1px dashed #cbd5e1",
    borderRadius: 10
  }
};
window.ContractMappingAdmin = ContractMappingAdmin;