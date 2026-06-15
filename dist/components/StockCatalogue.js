// ════════════════════════════════════════════════════════════════════
// StockCatalogue — Matrice des achats hebdomadaires
// ════════════════════════════════════════════════════════════════════
//
// Inspiré du tableau Monday "1.0 - Achat hebdomadaire".
//
// 2 vues :
//  1. MATRICE : fournisseurs en colonnes, semaines en lignes,
//     montants HT et nb d'items en cellule (cliquable)
//  2. LISTE   : table détaillée par article avec édition inline du
//     fournisseur, prix d'achat, statuts achat/réception
//
// Source : v_purchase_matrix (extrait des devis acceptés / commandes)
// ════════════════════════════════════════════════════════════════════

var StockCatalogue = () => {
  var [view, setView] = React.useState("list"); // "matrix" | "list" | "archive"
  var [rows, setRows] = React.useState([]);
  var [suppliers, setSuppliers] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [filter, setFilter] = React.useState({
    article_status: "all",
    supplier: "all"
  });
  var [editing, setEditing] = React.useState(null);
  var reload = React.useCallback(async () => {
    setLoading(true);
    try {
      var isArchive = view === "archive";
      var [r, sup] = await Promise.all([window.api.purchaseMatrix.list({
        since_days: isArchive ? 365 : 90,
        archived: isArchive
      }), window.api.suppliers.list({
        active: true
      })]);
      setRows(r || []);
      setSuppliers(sup || []);
    } catch (e) {
      setRows([]);
    }
    setLoading(false);
  }, [view]);
  React.useEffect(() => {
    reload();
  }, [reload]);

  // ── Filtres
  var filtered = React.useMemo(() => rows.filter(r => {
    if (filter.article_status !== "all") {
      var s = deriveArticleStatus(r.purchase_status, r.reception_status);
      if (s !== filter.article_status) return false;
    }
    if (filter.supplier !== "all" && (r.supplier || "") !== filter.supplier) return false;
    return true;
  }), [rows, filter]);

  // ── KPIs
  var kpis = React.useMemo(() => {
    var k = {
      total_items: filtered.length,
      total_purchase: 0,
      total_sell: 0,
      margin_eur: 0,
      no_supplier: 0,
      panier: 0,
      recu: 0
    };
    filtered.forEach(r => {
      k.total_purchase += r.total_purchase_ht;
      k.total_sell += r.total_sell_ht;
      k.margin_eur += r.margin_eur;
      if (!r.supplier) k.no_supplier++;
      if (r.purchase_status === "panier") k.panier++;
      if (r.reception_status === "ok" || r.reception_status === "en_stock") k.recu++;
    });
    k.margin_pct = k.total_purchase > 0 ? k.margin_eur / k.total_purchase * 100 : 0;
    return k;
  }, [filtered]);

  // ── Matrice : { "YYYY-WW": { supplierName: { items, total_purchase, total_sell } } }
  var matrix = React.useMemo(() => {
    var m = {};
    var weeksSet = new Set();
    var suppliersSet = new Set();
    filtered.forEach(r => {
      var week = r.year_number + "-W" + String(r.week_number).padStart(2, "0");
      var sup = r.supplier || "— Non assigné —";
      weeksSet.add(week);
      suppliersSet.add(sup);
      if (!m[week]) m[week] = {};
      if (!m[week][sup]) m[week][sup] = {
        items: 0,
        total_purchase: 0,
        total_sell: 0,
        margin: 0,
        rows: []
      };
      var cell = m[week][sup];
      cell.items += 1;
      cell.total_purchase += r.total_purchase_ht;
      cell.total_sell += r.total_sell_ht;
      cell.margin += r.margin_eur;
      cell.rows.push(r);
    });
    return {
      data: m,
      weeks: Array.from(weeksSet).sort((a, b) => b.localeCompare(a)),
      suppliers: Array.from(suppliersSet).sort((a, b) => {
        if (a.startsWith("—")) return 1;
        if (b.startsWith("—")) return -1;
        return a.localeCompare(b);
      })
    };
  }, [filtered]);
  var fmtEUR = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + " €";
  var fmtEURP = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
  return /*#__PURE__*/React.createElement("div", {
    style: scStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: scStyles.sidebar
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
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
    style: scStyles.logo
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
  }, "Stock & Catalogue"))), /*#__PURE__*/React.createElement("div", {
    style: scStyles.navLabel
  }, "Vue"), [{
    k: "matrix",
    label: "📊 Matrice fournisseurs"
  }, {
    k: "list",
    label: "📋 Liste détaillée"
  }, {
    k: "archive",
    label: "🗄️ Archivage"
  }].map(v => /*#__PURE__*/React.createElement("div", {
    key: v.k,
    onClick: () => setView(v.k),
    style: {
      ...scStyles.navItem,
      ...(view === v.k ? scStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", null, v.label))), /*#__PURE__*/React.createElement("div", {
    style: scStyles.navLabel
  }, "Statut article"), [{
    k: "all",
    label: "Tous"
  }, {
    k: "panier",
    label: "🛒 Panier"
  }, {
    k: "commande",
    label: "✅ Commandé"
  }, {
    k: "partielle",
    label: "◐ Réception partielle"
  }, {
    k: "recu",
    label: "✓ Reçu"
  }, {
    k: "en_stock",
    label: "📦 En stock"
  }, {
    k: "bloque",
    label: "⛔ Bloqué"
  }, {
    k: "differe",
    label: "⏸ Différé"
  }].map(s => {
    var count = s.k === "all" ? rows.length : rows.filter(r => deriveArticleStatus(r.purchase_status, r.reception_status) === s.k).length;
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      onClick: () => setFilter(f => ({
        ...f,
        article_status: s.k
      })),
      style: {
        ...scStyles.navItem,
        ...(filter.article_status === s.k ? scStyles.navItemActive : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, s.label), /*#__PURE__*/React.createElement("span", {
      style: scStyles.navCount
    }, count));
  })), /*#__PURE__*/React.createElement("main", {
    style: scStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: scStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: scStyles.h1
  }, "Stock & Catalogue"), /*#__PURE__*/React.createElement("p", {
    style: scStyles.sub
  }, "Achats hebdomadaires \u2014 lignes des devis accept\xE9s / commandes en cours")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!confirm("Purger les données locales de test ?\n\nVa effacer :\n• Compteurs de numérotation locaux\n• Cache des docs commerciaux\n• Cache des projets\n• Cache des envois\n\n⚠ Ne touche PAS à la BDD Supabase — il faut exécuter sql/PURGE_test_data.sql en plus.")) return;
      try {
        ["hubAstorya.commercial_docs.v1", "hubAstorya.cdoc_counters.v1", "hubAstorya.commercial_doc_sends.v1", "hubAstorya.projects.v1", "hubAstorya.commercial_articles.v1"].forEach(k => localStorage.removeItem(k));
        if (window.HubToast) window.HubToast.success("✓ Cache local purgé — recharge la page");
        setTimeout(() => location.reload(), 600);
      } catch (e) {}
    },
    style: {
      ...scStyles.ghostBtn,
      color: "#dc2626",
      borderColor: "#fecaca"
    },
    title: "Purge le cache localStorage du navigateur (ne touche pas la BDD)"
  }, "\uD83D\uDDD1 Purger cache local"), /*#__PURE__*/React.createElement("button", {
    onClick: reload,
    style: scStyles.primaryBtn
  }, "\u21BB Rafra\xEEchir"))), /*#__PURE__*/React.createElement("div", {
    style: scStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDED2 Articles \xE0 acheter",
    value: kpis.total_items,
    color: "#0ea5e9"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Total achat HT",
    value: fmtEUR(kpis.total_purchase),
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Total vente HT",
    value: fmtEUR(kpis.total_sell),
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Marge pr\xE9vue",
    value: fmtEUR(kpis.margin_eur),
    sub: (kpis.margin_pct || 0).toFixed(1) + " %",
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\u26A0 Sans fournisseur",
    value: kpis.no_supplier,
    color: "#f59e0b"
  })), loading && rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: scStyles.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, view === "archive" ? "Aucun devis archivé" : "Aucun article à acheter"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, view === "archive" ? /*#__PURE__*/React.createElement(React.Fragment, null, "Les devis archiv\xE9s appara\xEEtront ici. Pour archiver, clique sur \uD83D\uDDC4\uFE0F sur la ligne parent dans la vue Liste d\xE9taill\xE9e.") : /*#__PURE__*/React.createElement(React.Fragment, null, "Cette page agr\xE8ge les ", /*#__PURE__*/React.createElement("strong", null, "lignes des devis accept\xE9s et des commandes"), ".", /*#__PURE__*/React.createElement("br", null), "Cr\xE9e un devis dans Gestion Commerciale, fais-le passer en \xAB Accept\xE9 \xBB,", /*#__PURE__*/React.createElement("br", null), "et ses lignes appara\xEEtront ici pour \xEAtre achet\xE9es chez tes fournisseurs."))) : view === "matrix" ? /*#__PURE__*/React.createElement(MatrixView, {
    matrix: matrix,
    fmtEUR: fmtEUR,
    onCellClick: rows => setEditing({
      type: "cell",
      rows
    })
  }) : /*#__PURE__*/React.createElement(ListView, {
    rows: filtered,
    suppliers: suppliers,
    fmtEUR: fmtEUR,
    fmtEURP: fmtEURP,
    onEdit: r => setEditing({
      type: "line",
      row: r
    }),
    onReload: reload,
    isArchive: view === "archive"
  })), editing && editing.type === "line" && /*#__PURE__*/React.createElement(EditLineModal, {
    row: editing.row,
    suppliers: suppliers,
    onClose: () => setEditing(null),
    onSaved: () => {
      setEditing(null);
      reload();
    }
  }), editing && editing.type === "cell" && /*#__PURE__*/React.createElement(CellDetailModal, {
    rows: editing.rows,
    fmtEUR: fmtEURP,
    onClose: () => setEditing(null),
    onOpenLine: r => setEditing({
      type: "line",
      row: r
    })
  }));
};
var KPI = ({
  label,
  value,
  color,
  sub
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: "12px 14px"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 700
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 20,
    fontWeight: 700,
    color: color || "#0f172a",
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace"
  }
}, value), sub && /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2
  }
}, sub));

// ─────────────────────────────────────────────────────────────────
// MATRICE — fournisseurs × semaines
// ─────────────────────────────────────────────────────────────────
var MatrixView = ({
  matrix,
  fmtEUR,
  onCellClick
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      borderCollapse: "collapse",
      width: "100%",
      minWidth: 900
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.matrixHead,
      position: "sticky",
      left: 0,
      zIndex: 2,
      background: "#f8fafc",
      minWidth: 110
    }
  }, "Semaine"), matrix.suppliers.map(sup => /*#__PURE__*/React.createElement("th", {
    key: sup,
    style: scStyles.matrixHead
  }, sup)), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.matrixHead,
      background: "#0f172a",
      color: "#fff"
    }
  }, "TOTAL"))), /*#__PURE__*/React.createElement("tbody", null, matrix.weeks.map(week => {
    var rowData = matrix.data[week] || {};
    var weekTotal = 0;
    matrix.suppliers.forEach(sup => {
      if (rowData[sup]) weekTotal += rowData[sup].total_purchase;
    });
    return /*#__PURE__*/React.createElement("tr", {
      key: week
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.matrixCell,
        position: "sticky",
        left: 0,
        background: "#fff",
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, week), matrix.suppliers.map(sup => {
      var cell = rowData[sup];
      if (!cell) return /*#__PURE__*/React.createElement("td", {
        key: sup,
        style: scStyles.matrixCellEmpty
      }, "\u2014");
      return /*#__PURE__*/React.createElement("td", {
        key: sup,
        onClick: () => onCellClick(cell.rows),
        style: {
          ...scStyles.matrixCell,
          cursor: "pointer",
          background: cell.margin > 0 ? "#ecfdf5" : "#fef2f2",
          borderLeft: "2px solid " + (cell.margin > 0 ? "#10b981" : "#dc2626")
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          fontWeight: 700,
          color: "#0f172a",
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, fmtEUR(cell.total_purchase)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: "#64748b",
          marginTop: 2
        }
      }, cell.items, " ligne(s) \xB7 vente ", fmtEUR(cell.total_sell)));
    }), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.matrixCell,
        fontWeight: 700,
        background: "#f8fafc",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmtEUR(weekTotal)));
  }))));
};

// ─────────────────────────────────────────────────────────────────
// LISTE — table détaillée éditable
// ─────────────────────────────────────────────────────────────────
// ─── Statut unifié de l'article (fusion Achat × Réception) ───
// Cycle de vie : panier → demande → transmis → commande →
//                (partielle | recu | en_stock) | bloque | differe | na
var ARTICLE_STATUS = {
  panier: {
    label: "🛒 Panier",
    color: "#0c4a6e",
    bg: "#e0f2fe",
    order: 1
  },
  commande: {
    label: "✅ Commandé",
    color: "#854d0e",
    bg: "#fef3c7",
    order: 4
  },
  partielle: {
    label: "◐ Réception partielle",
    color: "#6b21a8",
    bg: "#f3e8ff",
    order: 5
  },
  recu: {
    label: "✓ Reçu",
    color: "#0d9488",
    bg: "#ccfbf1",
    order: 6
  },
  en_stock: {
    label: "📦 En stock",
    color: "#075985",
    bg: "#dbeafe",
    order: 7
  },
  bloque: {
    label: "⛔ Bloqué",
    color: "#991b1b",
    bg: "#fee2e2",
    order: 99
  },
  differe: {
    label: "⏸ Différé",
    color: "#9f1239",
    bg: "#ffe4e6",
    order: 99
  },
  na: {
    label: "N/A",
    color: "#475569",
    bg: "#f1f5f9",
    order: 99
  }
};

// Dérive le statut unifié depuis les 2 colonnes existantes (rétrocompat).
// Les anciens statuts "demande" et "transmis" sont remappés vers "panier".
var deriveArticleStatus = (purchase, reception) => {
  if (reception === "bloque") return "bloque";
  if (reception === "differe") return "differe";
  if (reception === "na") return "na";
  if (reception === "en_stock") return "en_stock";
  if (reception === "ok") return "recu";
  if (reception === "partielle") return "partielle";
  if (purchase === "demande" || purchase === "transmis") return "panier";
  return purchase || "panier";
};

// Convertit un statut unifié en patch {purchase_status, reception_status}.
var applyArticleStatus = status => {
  switch (status) {
    case "panier":
      return {
        purchase_status: "panier",
        reception_status: "en_cours"
      };
    case "commande":
      return {
        purchase_status: "commande",
        reception_status: "en_cours"
      };
    case "partielle":
      return {
        purchase_status: "commande",
        reception_status: "partielle"
      };
    case "recu":
      return {
        purchase_status: "commande",
        reception_status: "ok"
      };
    case "en_stock":
      return {
        purchase_status: "commande",
        reception_status: "en_stock"
      };
    case "bloque":
      return {
        purchase_status: "commande",
        reception_status: "bloque"
      };
    case "differe":
      return {
        purchase_status: "commande",
        reception_status: "differe"
      };
    case "na":
      return {
        purchase_status: "commande",
        reception_status: "na"
      };
    default:
      return {
        purchase_status: "panier",
        reception_status: "en_cours"
      };
  }
};

// ─────────────────────────────────────────────────────────────────
// EditableRow — chaque ligne avec édition inline directe
// ─────────────────────────────────────────────────────────────────
var EditableRow = ({
  r,
  suppliers,
  fmtEURP,
  onUpdated
}) => {
  var [local, setLocal] = React.useState(r);
  var [saving, setSaving] = React.useState(null);
  // Champs en cours de saisie : on n'écrase pas local depuis r tant que l'utilisateur tape.
  var dirtyRef = React.useRef(new Set());
  React.useEffect(() => {
    // Sync local depuis r SAUF pour les champs en cours de saisie
    setLocal(cur => {
      var next = {
        ...r
      };
      dirtyRef.current.forEach(k => {
        next[k] = cur[k];
      });
      return next;
    });
  }, [r.line_id, r.purchase_price_ht, r.supplier, r.purchase_status, r.reception_status]);
  var doSave = async patch => {
    setSaving(Object.keys(patch)[0]);
    try {
      await window.api.purchaseMatrix.updateLine(r.line_id, patch);
      Object.keys(patch).forEach(k => dirtyRef.current.delete(k));
      if (onUpdated) onUpdated();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSaving(null);
  };

  // Saisie locale uniquement (pas de sauvegarde auto). Marque le champ comme « dirty ».
  var typeField = (k, v) => {
    dirtyRef.current.add(k);
    setLocal(cur => ({
      ...cur,
      [k]: v
    }));
  };
  // Save immédiat (pour les select : status, supplier, reception, etc.)
  var updateField = (k, v) => {
    setLocal(cur => ({
      ...cur,
      [k]: v
    }));
    doSave({
      [k]: v
    });
  };
  // Save au blur uniquement si la valeur a changé
  var blurSave = k => {
    if (!dirtyRef.current.has(k)) return;
    doSave({
      [k]: local[k]
    });
  };
  var articleStatusKey = deriveArticleStatus(local.purchase_status, local.reception_status);
  var as = ARTICLE_STATUS[articleStatusKey] || ARTICLE_STATUS.panier;
  var purchaseN = Number(local.purchase_price_ht) || 0;
  var sellN = Number(r.sell_price_ht) || 0;
  var marginPct = purchaseN > 0 ? (sellN - purchaseN) / purchaseN * 100 : null;
  var cellInput = {
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12.5,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    width: "100%"
  };
  return /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: scStyles.td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#0f172a",
      fontWeight: 500
    }
  }, r.client_name || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#3730a3"
    }
  }, r.doc_ref)), /*#__PURE__*/React.createElement("td", {
    style: scStyles.td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, r.designation || r.ref || "—"), r.ref && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, r.ref)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      textAlign: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600
    }
  }, r.quantity), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      padding: "6px 8px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: local.purchase_price_ht == null ? "" : local.purchase_price_ht,
    placeholder: "\u2014",
    onChange: e => typeField("purchase_price_ht", e.target.value === "" ? null : Number(e.target.value)),
    onBlur: () => blurSave("purchase_price_ht"),
    onKeyDown: e => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
    title: "Tape le prix puis appuie sur Entr\xE9e ou clique ailleurs pour sauvegarder",
    style: {
      ...cellInput,
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
      borderColor: !local.purchase_price_ht ? "#fca5a5" : dirtyRef.current.has("purchase_price_ht") ? "#f59e0b" : "#e2e8f0",
      background: !local.purchase_price_ht ? "#fef2f2" : dirtyRef.current.has("purchase_price_ht") ? "#fffbeb" : "#fff"
    }
  }), saving === "purchase_price_ht" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      textAlign: "right",
      marginTop: 2
    }
  }, "\uD83D\uDCBE"), dirtyRef.current.has("purchase_price_ht") && saving !== "purchase_price_ht" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#b45309",
      textAlign: "right",
      marginTop: 2
    }
  }, "\u270E non sauvegard\xE9")), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
      color: "#10b981"
    }
  }, fmtEURP(r.sell_price_ht)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      textAlign: "right"
    }
  }, marginPct != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      color: marginPct >= 20 ? "#10b981" : marginPct >= 10 ? "#f59e0b" : "#dc2626"
    }
  }, marginPct.toFixed(1), " %") : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      padding: "6px 8px",
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: local.supplier || "",
    onChange: e => updateField("supplier", e.target.value || null),
    style: {
      ...cellInput,
      borderColor: !local.supplier ? "#fca5a5" : "#e2e8f0",
      color: !local.supplier ? "#dc2626" : "#0f172a",
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u26A0 \xC0 assigner"), suppliers.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.name
  }, s.name)))), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      padding: "6px 8px",
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: articleStatusKey,
    onChange: e => {
      var patch = applyArticleStatus(e.target.value);
      setLocal(cur => ({
        ...cur,
        ...patch
      }));
      doSave(patch);
    },
    style: {
      ...cellInput,
      background: as.bg,
      color: as.color,
      fontWeight: 700,
      borderColor: as.color,
      borderWidth: 2,
      paddingRight: 22
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "panier",
    style: {
      background: ARTICLE_STATUS.panier.bg,
      color: ARTICLE_STATUS.panier.color
    }
  }, "\uD83D\uDED2 Panier"), /*#__PURE__*/React.createElement("option", {
    value: "commande",
    style: {
      background: ARTICLE_STATUS.commande.bg,
      color: ARTICLE_STATUS.commande.color
    }
  }, "\u2705 Command\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "partielle",
    style: {
      background: ARTICLE_STATUS.partielle.bg,
      color: ARTICLE_STATUS.partielle.color
    }
  }, "\u25D0 R\xE9ception partielle"), /*#__PURE__*/React.createElement("option", {
    value: "recu",
    style: {
      background: ARTICLE_STATUS.recu.bg,
      color: ARTICLE_STATUS.recu.color
    }
  }, "\u2713 Re\xE7u"), /*#__PURE__*/React.createElement("option", {
    value: "en_stock",
    style: {
      background: ARTICLE_STATUS.en_stock.bg,
      color: ARTICLE_STATUS.en_stock.color
    }
  }, "\uD83D\uDCE6 En stock"), /*#__PURE__*/React.createElement("option", {
    value: "bloque",
    style: {
      background: ARTICLE_STATUS.bloque.bg,
      color: ARTICLE_STATUS.bloque.color
    }
  }, "\u26D4 Bloqu\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "differe",
    style: {
      background: ARTICLE_STATUS.differe.bg,
      color: ARTICLE_STATUS.differe.color
    }
  }, "\u23F8 Diff\xE9r\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "na",
    style: {
      background: ARTICLE_STATUS.na.bg,
      color: ARTICLE_STATUS.na.color
    }
  }, "N/A"))));
};

// Cellule date d'achat sur la ligne parent du groupe : édite la date
// d'achat de TOUTES les lignes du devis simultanément.
var GroupDateCell = ({
  g,
  defaultDate,
  onReload
}) => {
  // Date actuelle : si toutes les lignes ont la même purchase_date explicite, on l'affiche ;
  // sinon on prend la première date explicite trouvée ; sinon le défaut (jeudi suivant).
  var explicit = g.lines.map(l => l.purchase_date ? String(l.purchase_date).slice(0, 10) : null).filter(Boolean);
  var uniq = Array.from(new Set(explicit));
  var isMixed = uniq.length > 1;
  var value = uniq[0] || defaultDate || "";
  var isCustom = !!uniq[0];
  var [local, setLocal] = React.useState(value);
  var [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    setLocal(value);
  }, [value]);
  var onChange = async newDate => {
    setLocal(newDate);
    setSaving(true);
    try {
      await Promise.all(g.lines.map(l => window.api.purchaseMatrix.updateLine(l.line_id, {
        purchase_date: newDate || null
      })));
      if (window.HubToast) window.HubToast.success("✓ Date achat appliquée à " + g.lines.length + " article(s)");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };
  var cellInput = {
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    width: "100%"
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: local || "",
    onChange: e => onChange(e.target.value || null),
    title: isMixed ? "⚠ Les articles ont des dates différentes — modifier applique à tous" : isCustom ? "Date personnalisée" : "Défaut = jeudi suivant la validation du devis (" + (defaultDate || "—") + ")",
    style: {
      ...cellInput,
      borderColor: isMixed ? "#f59e0b" : isCustom ? "#a855f7" : "#e2e8f0",
      background: isMixed ? "#fffbeb" : isCustom ? "#faf5ff" : "#fff",
      color: isMixed ? "#92400e" : isCustom ? "#7e22ce" : "#0f172a",
      fontWeight: isCustom || isMixed ? 600 : 400
    }
  }), !isCustom && !isMixed && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      marginTop: 2,
      textAlign: "center"
    }
  }, "\uD83D\uDCCC jeudi par d\xE9faut"), isMixed && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#b45309",
      marginTop: 2,
      textAlign: "center"
    }
  }, "\u26A0 dates mixtes"), saving && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      textAlign: "center"
    }
  }, "\uD83D\uDCBE"));
};

// Bouton d'archivage / désarchivage sur la ligne parent.
// Activé seulement quand TOUT le matériel est au moins « commandé »
// (statut >= commande dans le cycle de vie).
var ArchiveButton = ({
  g,
  isArchive,
  onReload
}) => {
  var [busy, setBusy] = React.useState(false);
  var allCommanded = g.lines.every(l => {
    var s = deriveArticleStatus(l.purchase_status, l.reception_status);
    return ARTICLE_STATUS[s] && ARTICLE_STATUS[s].order >= 4 || s === "bloque" || s === "differe" || s === "na";
  });
  var doArchive = async () => {
    if (!confirm("Archiver le devis " + (g.doc_number || g.doc_ref.slice(0, 8)) + " ? Il disparaîtra de cette vue et sera visible dans « Archivage ».")) return;
    setBusy(true);
    try {
      await window.api.purchaseMatrix.archiveDoc(g.doc_ref);
      if (window.HubToast) window.HubToast.success("🗄️ Devis archivé");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Archivage : " + (e.message || e));
    }
    setBusy(false);
  };
  var doUnarchive = async () => {
    setBusy(true);
    try {
      await window.api.purchaseMatrix.unarchiveDoc(g.doc_ref);
      if (window.HubToast) window.HubToast.success("↩ Devis restauré");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Restauration : " + (e.message || e));
    }
    setBusy(false);
  };
  if (isArchive) {
    return /*#__PURE__*/React.createElement("button", {
      onClick: doUnarchive,
      disabled: busy,
      style: {
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #a855f7",
        background: "#faf5ff",
        color: "#7e22ce",
        fontSize: 11,
        fontWeight: 700,
        cursor: busy ? "wait" : "pointer",
        whiteSpace: "nowrap"
      }
    }, busy ? "…" : "↩ Restaurer");
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: doArchive,
    disabled: busy || !allCommanded,
    title: allCommanded ? "Archiver ce devis (tout le matériel est commandé)" : "Tous les articles doivent être au moins « Commandé » pour archiver",
    style: {
      padding: "6px 10px",
      borderRadius: 6,
      border: "1px solid " + (allCommanded ? "#10b981" : "#cbd5e1"),
      background: allCommanded ? "#d1fae5" : "#f1f5f9",
      color: allCommanded ? "#065f46" : "#94a3b8",
      fontSize: 11,
      fontWeight: 700,
      cursor: busy ? "wait" : allCommanded ? "pointer" : "not-allowed",
      whiteSpace: "nowrap"
    }
  }, busy ? "…" : "🗄️ Archiver");
};
var ListView = ({
  rows,
  suppliers,
  fmtEUR,
  fmtEURP,
  onEdit,
  onReload,
  isArchive
}) => {
  var [expanded, setExpanded] = React.useState({});
  var [search, setSearch] = React.useState("");
  var toggle = k => setExpanded(cur => ({
    ...cur,
    [k]: !cur[k]
  }));

  // Filtre fulltext sur tous les champs visibles d'une ligne
  var filteredRows = React.useMemo(() => {
    var q = search.trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter(r => {
      var hay = [r.client_name, r.doc_ref, r.doc_number, r.doc_title, r.designation, r.ref, r.description, r.supplier, r.supplier_ref].filter(Boolean).join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }, [rows, search]);

  // Si un terme de recherche cible un article précis, on déplie automatiquement son groupe.
  React.useEffect(() => {
    if (!search.trim()) return;
    var docs = new Set(filteredRows.map(r => r.doc_ref));
    setExpanded(cur => {
      var next = {
        ...cur
      };
      docs.forEach(d => {
        next[d] = true;
      });
      return next;
    });
  }, [search, filteredRows]);

  // Regroupe les lignes par devis/commande
  var groups = React.useMemo(() => {
    var map = new Map();
    (filteredRows || []).forEach(r => {
      var k = r.doc_ref;
      if (!map.has(k)) {
        map.set(k, {
          doc_ref: r.doc_ref,
          doc_number: r.doc_number,
          doc_type: r.doc_type,
          doc_status: r.doc_status,
          doc_title: r.doc_title,
          doc_date: r.doc_date,
          client_name: r.client_name,
          opportunity_id: r.opportunity_id,
          lines: []
        });
      }
      map.get(k).lines.push(r);
    });
    // Tri stable : doc_date desc, puis doc_ref pour départager (jamais
    // basé sur le total acheté ou la quantité, pour que l'ordre des groupes
    // ne change pas quand l'utilisateur modifie un PU).
    var out = Array.from(map.values()).sort((a, b) => {
      var d = String(b.doc_date || "").localeCompare(String(a.doc_date || ""));
      if (d !== 0) return d;
      return String(a.doc_ref).localeCompare(String(b.doc_ref));
    });
    // Tri stable des articles à l'intérieur de chaque groupe (line_id)
    out.forEach(g => {
      g.lines.sort((a, b) => String(a.line_id).localeCompare(String(b.line_id)));
    });
    return out;
  }, [filteredRows]);
  var SearchBar = /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      padding: "8px 12px",
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#94a3b8"
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    type: "search",
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Rechercher un client, un article, un fournisseur, un n\xB0 de devis\u2026",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: 13,
      fontFamily: "inherit",
      background: "transparent",
      padding: "4px 0",
      color: "#0f172a"
    }
  }), search && /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearch(""),
    style: {
      background: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: 18,
      cursor: "pointer",
      padding: 0,
      lineHeight: 1
    }
  }, "\xD7"), search && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      whiteSpace: "nowrap"
    }
  }, filteredRows.length, " ligne(s) \xB7 ", new Set(filteredRows.map(r => r.doc_ref)).size, " devis"));
  if (!rows || !rows.length) {
    return /*#__PURE__*/React.createElement("div", null, SearchBar, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 50,
        background: "#fff",
        border: "1px dashed #cbd5e1",
        borderRadius: 12,
        textAlign: "center",
        color: "#94a3b8"
      }
    }, "Aucun article \xE0 afficher avec les filtres actuels."));
  }
  if (!filteredRows.length) {
    return /*#__PURE__*/React.createElement("div", null, SearchBar, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 50,
        background: "#fff",
        border: "1px dashed #cbd5e1",
        borderRadius: 12,
        textAlign: "center",
        color: "#94a3b8"
      }
    }, "Aucun r\xE9sultat pour \xAB ", /*#__PURE__*/React.createElement("strong", null, search), " \xBB."));
  }
  var TYPE_META = {
    devis: {
      icon: "📄",
      label: "Devis",
      color: "#1d4ed8",
      bg: "#dbeafe"
    },
    commande: {
      icon: "📋",
      label: "Commande",
      color: "#7c3aed",
      bg: "#f3e8ff"
    },
    facture: {
      icon: "🧾",
      label: "Facture",
      color: "#0e7490",
      bg: "#cffafe"
    },
    bl: {
      icon: "📦",
      label: "BL",
      color: "#9a3412",
      bg: "#ffedd5"
    }
  };

  // Barre de complétion : distribution des statuts dans le groupe.
  var ArticleStatusBar = ({
    lines
  }) => {
    var counts = {};
    lines.forEach(l => {
      var s = deriveArticleStatus(l.purchase_status, l.reception_status);
      counts[s] = (counts[s] || 0) + 1;
    });
    var total = lines.length;
    var segments = Object.keys(counts).map(k => ({
      key: k,
      count: counts[k],
      meta: ARTICLE_STATUS[k] || ARTICLE_STATUS.panier
    })).sort((a, b) => (a.meta.order || 99) - (b.meta.order || 99));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 180
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        width: "100%",
        height: 12,
        borderRadius: 7,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#f8fafc"
      }
    }, segments.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s.key,
      title: s.meta.label + " · " + s.count + "/" + total + " article(s)",
      style: {
        width: s.count / total * 100 + "%",
        background: s.meta.color,
        borderRight: i < segments.length - 1 ? "1px solid rgba(255,255,255,0.45)" : "none"
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 5
      }
    }, segments.map(s => /*#__PURE__*/React.createElement("span", {
      key: s.key,
      style: {
        fontSize: 9.5,
        padding: "1.5px 6px",
        borderRadius: 999,
        background: s.meta.bg,
        color: s.meta.color,
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: "nowrap"
      }
    }, s.meta.label, " \xB7 ", s.count))));
  };
  // Calcule le jeudi suivant la date de validation du devis (date du doc).
  // Si le doc est validé un jeudi, on garde le même jour.
  var nextThursday = isoDate => {
    if (!isoDate) return null;
    var d = new Date(String(isoDate).slice(0, 10));
    if (isNaN(d)) return null;
    var day = d.getDay(); // 0=Dim, 4=Jeu
    var add = (4 - day + 7) % 7;
    d.setDate(d.getDate() + add);
    return d.toISOString().slice(0, 10);
  };
  return /*#__PURE__*/React.createElement("div", null, SearchBar, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 1280
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "#f8fafc"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      width: 32
    }
  }), /*#__PURE__*/React.createElement("th", {
    style: scStyles.thHead
  }, "Document"), /*#__PURE__*/React.createElement("th", {
    style: scStyles.thHead
  }, "Client"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "center"
    }
  }, "Articles"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "center",
      minWidth: 140
    }
  }, "\uD83D\uDCC5 Date achat"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "right"
    }
  }, "Total Achat HT"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "right"
    }
  }, "Total Vente HT"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "right"
    }
  }, "Marge"), /*#__PURE__*/React.createElement("th", {
    style: scStyles.thHead
  }, "Statut article"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...scStyles.thHead,
      textAlign: "center",
      width: 110
    }
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", null, groups.map(g => {
    var isOpen = !!expanded[g.doc_ref];
    var tm = TYPE_META[g.doc_type] || {
      icon: "📄",
      label: g.doc_type,
      color: "#475569",
      bg: "#f1f5f9"
    };
    var totalAchat = g.lines.reduce((s, l) => s + (Number(l.purchase_price_ht) || 0) * (Number(l.quantity) || 0), 0);
    var totalVente = g.lines.reduce((s, l) => s + (Number(l.sell_price_ht) || 0) * (Number(l.quantity) || 0), 0);
    var marge = totalVente - totalAchat;
    var margePct = totalAchat > 0 ? marge / totalAchat * 100 : null;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: g.doc_ref
    }, /*#__PURE__*/React.createElement("tr", {
      onClick: () => toggle(g.doc_ref),
      style: {
        borderBottom: "1px solid #e2e8f0",
        background: isOpen ? "#f8fafc" : "#fff",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "center",
        fontSize: 14,
        color: "#475569"
      }
    }, isOpen ? "▼" : "▶"), /*#__PURE__*/React.createElement("td", {
      style: scStyles.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 999,
        background: tm.bg,
        color: tm.color
      }
    }, tm.icon, " ", tm.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#0f172a"
      }
    }, g.doc_number || g.doc_ref.slice(0, 8))), g.doc_title && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 3
      }
    }, g.doc_title), g.doc_date && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, "\uD83D\uDCC5 ", String(g.doc_date).slice(0, 10))), /*#__PURE__*/React.createElement("td", {
      style: scStyles.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, g.client_name || "—")), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        color: "#0f172a"
      }
    }, g.lines.length), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        padding: "6px 8px",
        minWidth: 140
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(GroupDateCell, {
      g: g,
      defaultDate: nextThursday(g.doc_date),
      onReload: onReload
    })), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "right",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: "#dc2626"
      }
    }, fmtEURP ? fmtEURP(totalAchat) : totalAchat.toFixed(2)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "right",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: "#10b981"
      }
    }, fmtEURP ? fmtEURP(totalVente) : totalVente.toFixed(2)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        color: marge >= 0 ? "#10b981" : "#dc2626"
      }
    }, fmtEURP ? fmtEURP(marge) : marge.toFixed(2)), margePct != null && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: margePct >= 20 ? "#10b981" : margePct >= 10 ? "#f59e0b" : "#dc2626",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, margePct.toFixed(1), " %")), /*#__PURE__*/React.createElement("td", {
      style: scStyles.td
    }, /*#__PURE__*/React.createElement(ArticleStatusBar, {
      lines: g.lines
    })), /*#__PURE__*/React.createElement("td", {
      style: {
        ...scStyles.td,
        textAlign: "center"
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(ArchiveButton, {
      g: g,
      isArchive: isArchive,
      onReload: onReload
    }))), isOpen && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: 10,
      style: {
        padding: 0,
        background: "#fafbfc",
        borderBottom: "1px solid #e2e8f0"
      }
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse"
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
      style: {
        background: "#eef2f7"
      }
    }, /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5
      }
    }, "Client / Doc"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5
      }
    }, "Article"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5,
        textAlign: "center"
      }
    }, "Qt\xE9"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5,
        textAlign: "right"
      }
    }, "PU Achet\xE9"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5,
        textAlign: "right"
      }
    }, "PU Vendu"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5,
        textAlign: "right"
      }
    }, "Marge"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5
      }
    }, "Fournisseur"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...scStyles.thHead,
        fontSize: 10.5
      }
    }, "Statut article"))), /*#__PURE__*/React.createElement("tbody", null, g.lines.map(r => /*#__PURE__*/React.createElement(EditableRow, {
      key: r.line_id,
      r: r,
      suppliers: suppliers,
      fmtEURP: fmtEURP,
      onUpdated: onReload
    })))))));
  })))));
};

// ─────────────────────────────────────────────────────────────────
// MODAL — Édition d'une ligne d'achat
// ─────────────────────────────────────────────────────────────────
var EditLineModal = ({
  row,
  suppliers,
  onClose,
  onSaved
}) => {
  var [d, setD] = React.useState({
    ...row
  });
  var [saving, setSaving] = React.useState(false);
  var setF = (k, v) => setD(cur => ({
    ...cur,
    [k]: v
  }));
  var save = async () => {
    setSaving(true);
    try {
      await window.api.purchaseMatrix.updateLine(row.line_id, {
        supplier: d.supplier || null,
        supplier_ref: d.supplier_ref || null,
        purchase_price_ht: d.purchase_price_ht ? Number(d.purchase_price_ht) : null,
        purchase_status: d.purchase_status,
        reception_status: d.reception_status,
        received_at: d.reception_status === "ok" || d.reception_status === "en_stock" ? d.received_at || new Date().toISOString() : d.received_at,
        serial_number: d.serial_number || null,
        purchase_date: d.purchase_date || null
      });
      if (window.HubToast) window.HubToast.success("✓ Ligne mise à jour");
      onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: scStyles.modalOverlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: scStyles.modalCard,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("header", {
    style: scStyles.modalHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      fontWeight: 700
    }
  }, "Article \xE0 acheter"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 700
    }
  }, row.designation || row.ref)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: scStyles.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 14,
      padding: 12,
      background: "#f8fafc",
      borderRadius: 8,
      border: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: scStyles.miniLbl
  }, "Client"), /*#__PURE__*/React.createElement("div", null, row.client_name || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: scStyles.miniLbl
  }, "Doc"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      color: "#3730a3"
    }
  }, row.doc_ref)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: scStyles.miniLbl
  }, "Quantit\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700
    }
  }, row.quantity, " ", row.unit || "u")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: scStyles.miniLbl
  }, "Prix de vente HT"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      color: "#10b981"
    }
  }, (Number(row.sell_price_ht) || 0).toFixed(2), " \u20AC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Fournisseur *"), /*#__PURE__*/React.createElement("select", {
    value: d.supplier || "",
    onChange: e => setF("supplier", e.target.value),
    style: scStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 \xC0 assigner \u2014"), suppliers.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.name
  }, s.name, s.category ? " · " + s.category : "")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "R\xE9f\xE9rence fournisseur"), /*#__PURE__*/React.createElement("input", {
    value: d.supplier_ref || "",
    onChange: e => setF("supplier_ref", e.target.value),
    placeholder: "Code article chez le fournisseur",
    style: scStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Prix d'achat HT *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: d.purchase_price_ht || "",
    onChange: e => setF("purchase_price_ht", e.target.value),
    placeholder: "0.00",
    style: scStyles.input
  }), d.purchase_price_ht && row.sell_price_ht ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 4
    }
  }, "Marge : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: (row.sell_price_ht - d.purchase_price_ht) / d.purchase_price_ht * 100 >= 20 ? "#10b981" : "#dc2626"
    }
  }, ((row.sell_price_ht - d.purchase_price_ht) / d.purchase_price_ht * 100).toFixed(1), " %")) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / span 2"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Statut article"), /*#__PURE__*/React.createElement("select", {
    value: deriveArticleStatus(d.purchase_status, d.reception_status),
    onChange: e => {
      var patch = applyArticleStatus(e.target.value);
      setD(cur => ({
        ...cur,
        ...patch
      }));
    },
    style: scStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "panier"
  }, "\uD83D\uDED2 Panier"), /*#__PURE__*/React.createElement("option", {
    value: "commande"
  }, "\u2705 Command\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "partielle"
  }, "\u25D0 R\xE9ception partielle"), /*#__PURE__*/React.createElement("option", {
    value: "recu"
  }, "\u2713 Re\xE7u"), /*#__PURE__*/React.createElement("option", {
    value: "en_stock"
  }, "\uD83D\uDCE6 En stock"), /*#__PURE__*/React.createElement("option", {
    value: "bloque"
  }, "\u26D4 Bloqu\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "differe"
  }, "\u23F8 Diff\xE9r\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "na"
  }, "N/A")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Date achat pr\xE9vue"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: d.purchase_date ? String(d.purchase_date).slice(0, 10) : "",
    onChange: e => setF("purchase_date", e.target.value),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "N\xB0 de s\xE9rie (apr\xE8s r\xE9ception)"), /*#__PURE__*/React.createElement("input", {
    value: d.serial_number || "",
    onChange: e => setF("serial_number", e.target.value),
    placeholder: "SN",
    style: scStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: scStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: saving,
    style: scStyles.primaryBtn
  }, saving ? "Enregistrement…" : "Enregistrer")))));
};

// ─────────────────────────────────────────────────────────────────
// MODAL — Détail d'une cellule de la matrice
// ─────────────────────────────────────────────────────────────────
var CellDetailModal = ({
  rows,
  fmtEUR,
  onClose,
  onOpenLine
}) => /*#__PURE__*/React.createElement("div", {
  style: scStyles.modalOverlay,
  onClick: onClose
}, /*#__PURE__*/React.createElement("div", {
  style: {
    ...scStyles.modalCard,
    maxWidth: 900
  },
  onClick: e => e.stopPropagation()
}, /*#__PURE__*/React.createElement("header", {
  style: scStyles.modalHead
}, /*#__PURE__*/React.createElement("h2", {
  style: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700
  }
}, "\uD83D\uDCE6 ", rows.length, " article(s) \xE0 acheter"), /*#__PURE__*/React.createElement("button", {
  onClick: onClose,
  style: scStyles.closeBtn
}, "\xD7")), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 18,
    maxHeight: "70vh",
    overflowY: "auto"
  }
}, rows.map(r => /*#__PURE__*/React.createElement("div", {
  key: r.line_id,
  onClick: () => onOpenLine(r),
  style: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    gap: 12
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 13,
    fontWeight: 600
  }
}, r.designation), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#64748b"
  }
}, r.client_name, " \xB7 ", r.doc_ref, " \xB7 Qt\xE9 ", r.quantity)), /*#__PURE__*/React.createElement("div", {
  style: {
    textAlign: "right"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#dc2626"
  }
}, fmtEUR(r.total_purchase_ht)), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    color: "#10b981",
    fontFamily: "'JetBrains Mono', monospace"
  }
}, "vente ", fmtEUR(r.total_sell_ht))))))));
var scStyles = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 240,
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
    background: "linear-gradient(135deg, #0e7490, #0891b2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
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
    background: "#cffafe",
    color: "#155e75",
    fontWeight: 600
  },
  navCount: {
    fontSize: 10.5,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
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
    background: "#0891b2",
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
  kpiRow: {
    display: "flex",
    gap: 10,
    marginBottom: 16
  },
  empty: {
    padding: 60,
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    textAlign: "center"
  },
  matrixHead: {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left"
  },
  matrixCell: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    borderRight: "1px solid #f1f5f9",
    fontSize: 12
  },
  matrixCellEmpty: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    borderRight: "1px solid #f1f5f9",
    fontSize: 12,
    color: "#cbd5e1",
    textAlign: "center"
  },
  thHead: {
    padding: "10px 12px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid #eef1f5",
    textAlign: "left"
  },
  td: {
    padding: "10px 12px",
    fontSize: 12.5
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
    maxWidth: 760,
    boxShadow: "0 20px 60px rgba(15,23,42,0.4)"
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
  miniLbl: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2
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