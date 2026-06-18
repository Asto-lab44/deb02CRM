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
  var [topTab, setTopTab] = React.useState(() => {
    try {
      return localStorage.getItem("hubAstorya.stock.topTab") || "achats";
    } catch (e) {
      return "achats";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("hubAstorya.stock.topTab", topTab);
    } catch (e) {}
  }, [topTab]);
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

  // Liste complète des fournisseurs du dropdown Monday "1.0 - Achat hebdomadaire"
  // (column fournisseur_mkm6r10y, board 745054784). Snapshot du 2026-06-16.
  // Le bulkImport ne crée que ceux qui n'existent pas déjà (idempotent).
  var MONDAY_SUPPLIERS = ["SENETIC", "OVH", "AMAZON", "ACTUAL SYSTEM", "WITHSECURE", "ASTORYA", "EDOX", "ONEDIRECT", "GLOBALSIGN", "INMAC", "BE-CLOUD", "FACTORIAL", "UNYC", "CID-IT", "EN STOCK", "PC21", "WATESOFT", "GRENKE", "INGRAM", "MAILINBLACK", "Athena global services", "SAGE", "ESET", "3CX", "COLISSIMO", "SOFT4EUROPE", "SUPPORT MURAUX", "AUTODESK", "FOXIT", "SendBlaster", "NEZUMI", "EBP", "UBIQUITI", "SITE MARCHAND", "ALTOSPAM", "ITANCIA", "ALSO", "TS2log", "TD SYNNEX", "CDISCOUNT", "STUDIOCALL", "BATTERY DIRECT", "LDLC PRO", "WEBSOFTSOLUS", "LENOVO", "ALIEXPRESS", "BACKMARKET", "ADHOC CUSTY", "BROTHER MPS", "APOGEA", "LOCAM", "ADAPTATEUR-PC", "TRADEMOS", "HP", "MGF", "DARTY", "Free Pro", "MARCEA", "BOOST MY MAIL", "GOOGLE", "Renewtech", "DEXXON"];
  var importMondaySuppliers = async () => {
    if (!confirm("Importer " + MONDAY_SUPPLIERS.length + " fournisseurs depuis Monday ?\n\nSeuls les fournisseurs absents seront créés (idempotent).")) return;
    try {
      var res = await window.api.suppliers.bulkImport(MONDAY_SUPPLIERS);
      if (window.HubToast) window.HubToast.success("✓ " + res.created + " fournisseur(s) créé(s) · " + res.skipped + " déjà présent(s)");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Import : " + (e.message || e));
    }
  };

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
  }, "Module"), [{
    k: "achats",
    label: "🛒 Achats",
    color: "#0891b2"
  }, {
    k: "stock",
    label: "📦 Stock interne",
    color: "#10b981"
  }, {
    k: "catalogue",
    label: "📚 Catalogue produits",
    color: "#a855f7"
  }].map(v => /*#__PURE__*/React.createElement("div", {
    key: v.k,
    onClick: () => setTopTab(v.k),
    style: {
      ...scStyles.navItem,
      ...(topTab === v.k ? {
        background: v.color + "18",
        color: v.color,
        fontWeight: 700
      } : {})
    }
  }, /*#__PURE__*/React.createElement("span", null, v.label))), topTab === "achats" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: scStyles.navLabel
  }, "Vue achats"), [{
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
  }))), /*#__PURE__*/React.createElement("main", {
    style: scStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: scStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: scStyles.h1
  }, "Stock & Catalogue"), /*#__PURE__*/React.createElement("p", {
    style: scStyles.sub
  }, topTab === "achats" && "Achats hebdomadaires — lignes des devis acceptés / commandes en cours", topTab === "stock" && "Parc matériel interne — instances physiques suivies du fournisseur au client", topTab === "catalogue" && "Référentiel produits — articles disponibles à la vente avec compteurs de stock")), /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDDD1 Purger cache local"), topTab === "achats" && /*#__PURE__*/React.createElement("button", {
    onClick: importMondaySuppliers,
    style: {
      ...scStyles.ghostBtn,
      color: "#7e22ce",
      borderColor: "#e9d5ff"
    },
    title: "Importe la liste des fournisseurs depuis le board Monday \xAB 1.0 - Achat hebdomadaire \xBB"
  }, "\u2B07 Importer fournisseurs Monday"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.location.href = "/stock-article-nouveau";
    },
    style: {
      ...scStyles.ghostBtn,
      color: "#0f766e",
      borderColor: "#a7f3d0",
      fontWeight: 600
    },
    title: "Cr\xE9er un nouvel article au catalogue"
  }, "+ Cr\xE9ation d'article"), /*#__PURE__*/React.createElement("button", {
    onClick: reload,
    style: scStyles.primaryBtn
  }, "\u21BB Rafra\xEEchir"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: 4,
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 10,
      marginBottom: 14,
      width: "fit-content"
    }
  }, [{
    k: "achats",
    label: "🛒 Achats",
    color: "#0891b2",
    desc: "Ce qu'il faut acheter cette semaine"
  }, {
    k: "stock",
    label: "📦 Stock interne",
    color: "#10b981",
    desc: "Matériel reçu non encore affecté"
  }, {
    k: "catalogue",
    label: "📚 Catalogue produits",
    color: "#a855f7",
    desc: "Référentiel articles + compteurs"
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTopTab(t.k),
    title: t.desc,
    style: {
      padding: "8px 16px",
      border: 0,
      borderRadius: 7,
      background: topTab === t.k ? t.color : "transparent",
      color: topTab === t.k ? "#fff" : "#475569",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: topTab === t.k ? "0 2px 6px " + t.color + "55" : "none",
      transition: "all 150ms"
    }
  }, t.label))), topTab === "achats" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
    onSuppliersChanged: reload,
    isArchive: view === "archive"
  })), topTab === "stock" && /*#__PURE__*/React.createElement(StockInternView, {
    fmtEUR: fmtEUR,
    fmtEURP: fmtEURP
  }), topTab === "catalogue" && /*#__PURE__*/React.createElement(CatalogueProduitsView, {
    fmtEUR: fmtEUR,
    onSwitchToStock: articleId => {
      setTopTab("stock");
      window.__stockFilterArticle = articleId;
    }
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
// SupplierCombo — combobox fournisseur : recherche + ajout + suppression
// ─────────────────────────────────────────────────────────────────
var SupplierCombo = ({
  value,
  suppliers,
  cellInput,
  onChange,
  onSuppliersChanged
}) => {
  var [open, setOpen] = React.useState(false);
  var [query, setQuery] = React.useState("");
  var ref = React.useRef(null);

  // Fermeture au clic extérieur
  React.useEffect(() => {
    var h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  var q = query.trim().toLowerCase();
  var filtered = (suppliers || []).filter(s => !q || (s.name || "").toLowerCase().indexOf(q) !== -1);
  var exact = (suppliers || []).some(s => (s.name || "").toLowerCase() === q);
  var canCreate = q && !exact;
  var select = name => {
    onChange && onChange(name || null);
    setQuery("");
    setOpen(false);
  };
  var createNew = async () => {
    var name = query.trim();
    if (!name) return;
    try {
      await window.api.suppliers.create({
        name
      });
      if (window.HubToast) window.HubToast.success("✓ Fournisseur « " + name + " » ajouté");
      onSuppliersChanged && onSuppliersChanged();
      select(name);
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Création : " + (e.message || e));
    }
  };
  var removeSupplier = async (e, sup) => {
    e.stopPropagation();
    if (!confirm("Désactiver le fournisseur « " + sup.name + " » ?\n\nIl sera caché de la liste mais l'historique des achats est préservé.")) return;
    try {
      await window.api.suppliers.remove(sup.id);
      if (window.HubToast) window.HubToast.success("✓ Fournisseur retiré");
      onSuppliersChanged && onSuppliersChanged();
    } catch (e2) {
      if (window.HubToast) window.HubToast.error("Suppression : " + (e2.message || e2));
    }
  };
  var trigger = /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(v => !v),
    style: {
      ...cellInput,
      textAlign: "left",
      cursor: "pointer",
      borderColor: !value ? "#fca5a5" : "#e2e8f0",
      color: !value ? "#dc2626" : "#0f172a",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, value || "⚠ À assigner"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "#94a3b8"
    }
  }, "\u25BE"));
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "relative"
    }
  }, trigger, open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      zIndex: 1000,
      background: "#fff",
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(15,23,42,0.15)",
      maxHeight: 320,
      display: "flex",
      flexDirection: "column",
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "text",
    value: query,
    onChange: e => setQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        if (filtered[0]) select(filtered[0].name);else if (canCreate) createNew();
      }
      if (e.key === "Escape") setOpen(false);
    },
    placeholder: "\uD83D\uDD0D Rechercher un fournisseur\u2026",
    style: {
      padding: "8px 10px",
      border: "none",
      borderBottom: "1px solid #eef1f5",
      outline: "none",
      fontSize: 12,
      fontFamily: "inherit",
      color: "#0f172a"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, value && /*#__PURE__*/React.createElement("div", {
    onClick: () => select(""),
    style: {
      padding: "8px 10px",
      fontSize: 11.5,
      color: "#dc2626",
      cursor: "pointer",
      borderBottom: "1px solid #f1f5f9",
      fontWeight: 600
    }
  }, "\u2715 Retirer la s\xE9lection"), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      fontSize: 11.5,
      color: "#94a3b8",
      textAlign: "center"
    }
  }, "Aucun fournisseur ne correspond.") : filtered.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    onClick: () => select(s.name),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 10px",
      fontSize: 12,
      cursor: "pointer",
      background: s.name === value ? "#eff6ff" : "transparent",
      borderBottom: "1px solid #f8fafc"
    },
    onMouseEnter: e => {
      if (s.name !== value) e.currentTarget.style.background = "#f8fafc";
    },
    onMouseLeave: e => {
      if (s.name !== value) e.currentTarget.style.background = "transparent";
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: "#0f172a",
      fontWeight: s.name === value ? 700 : 500
    }
  }, s.name, s.category && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      marginLeft: 6
    }
  }, "\xB7 ", s.category)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => removeSupplier(e, s),
    title: "D\xE9sactiver ce fournisseur",
    style: {
      width: 20,
      height: 20,
      borderRadius: 4,
      border: "none",
      background: "transparent",
      color: "#94a3b8",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\xD7")))), canCreate && /*#__PURE__*/React.createElement("div", {
    onClick: createNew,
    style: {
      padding: "10px 12px",
      fontSize: 12,
      fontWeight: 600,
      color: "#065f46",
      background: "#d1fae5",
      cursor: "pointer",
      borderTop: "1px solid #a7f3d0"
    }
  }, "+ Ajouter \xAB ", /*#__PURE__*/React.createElement("strong", null, query.trim()), " \xBB")));
};

// ─────────────────────────────────────────────────────────────────
// EditableRow — chaque ligne avec édition inline directe
// ─────────────────────────────────────────────────────────────────
var EditableRow = ({
  r,
  suppliers,
  fmtEURP,
  onUpdated,
  onSuppliersChanged
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
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement(SupplierCombo, {
    value: local.supplier || "",
    suppliers: suppliers,
    cellInput: cellInput,
    onChange: v => updateField("supplier", v || null),
    onSuppliersChanged: onSuppliersChanged
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      ...scStyles.td,
      padding: "6px 8px",
      width: 130
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
      paddingRight: 22,
      fontSize: 11.5
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
  onSuppliersChanged,
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
    style: {
      ...scStyles.thHead,
      width: 130
    }
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
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
        fontSize: 10.5,
        width: 130
      }
    }, "Statut"))), /*#__PURE__*/React.createElement("tbody", null, g.lines.map(r => /*#__PURE__*/React.createElement(EditableRow, {
      key: r.line_id,
      r: r,
      suppliers: suppliers,
      fmtEURP: fmtEURP,
      onUpdated: onReload,
      onSuppliersChanged: onSuppliersChanged
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

// ════════════════════════════════════════════════════════════════════
// STOCK INTERNE — Liste des assets (instances physiques)
// ════════════════════════════════════════════════════════════════════
var ASSET_STATUS = [{
  k: "disponible",
  label: "Disponible",
  bg: "#dcfce7",
  color: "#065f46",
  dot: "#16a34a"
}, {
  k: "reserve",
  label: "Réservé",
  bg: "#fef3c7",
  color: "#92400e",
  dot: "#f59e0b"
}, {
  k: "affecte",
  label: "Affecté client",
  bg: "#dbeafe",
  color: "#1e40af",
  dot: "#3b82f6"
}, {
  k: "sav",
  label: "SAV",
  bg: "#fee2e2",
  color: "#991b1b",
  dot: "#dc2626"
}, {
  k: "hs",
  label: "HS",
  bg: "#f1f5f9",
  color: "#475569",
  dot: "#64748b"
}, {
  k: "vendu",
  label: "Vendu",
  bg: "#ede9fe",
  color: "#5b21b6",
  dot: "#a855f7"
}];
var StockInternView = ({
  fmtEUR,
  fmtEURP
}) => {
  var [items, setItems] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [statusFilter, setStatusFilter] = React.useState("all");
  var [search, setSearch] = React.useState("");
  var [editing, setEditing] = React.useState(null);
  var [creatingOpen, setCreatingOpen] = React.useState(false);
  var reload = React.useCallback(async () => {
    setLoading(true);
    try {
      var list = await window.api.assets.list({});
      setItems(list || []);
    } catch (e) {
      setItems([]);
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
    if (window.__stockFilterArticle) {
      var id = window.__stockFilterArticle;
      window.__stockFilterArticle = null;
      setSearch(id);
    }
  }, [reload]);
  var filtered = React.useMemo(() => {
    var arr = items;
    if (statusFilter !== "all") arr = arr.filter(a => a.status === statusFilter);
    var q = search.trim().toLowerCase();
    if (q) arr = arr.filter(a => [a.serial_number, a.article_label, a.article_ref, a.client_name, a.location, a.supplier, a.article_id].some(v => String(v || "").toLowerCase().includes(q)));
    return arr;
  }, [items, statusFilter, search]);
  var counts = React.useMemo(() => {
    var c = {
      all: items.length
    };
    ASSET_STATUS.forEach(s => {
      c[s.k] = items.filter(a => a.status === s.k).length;
    });
    return c;
  }, [items]);
  var updateStatus = async (id, status) => {
    try {
      await window.api.assets.update(id, {
        status
      });
      reload();
      if (window.HubToast) window.HubToast.success("✓ Statut mis à jour");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + (e.message || e));
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: 4,
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStatusFilter("all"),
    style: pillBtn(statusFilter === "all", "#475569")
  }, "Tous ", /*#__PURE__*/React.createElement("span", {
    style: pillCount
  }, counts.all)), ASSET_STATUS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.k,
    onClick: () => setStatusFilter(s.k),
    style: pillBtn(statusFilter === s.k, s.color, s.bg)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      width: 7,
      height: 7,
      borderRadius: 4,
      background: s.dot,
      marginRight: 5
    }
  }), s.label, " ", /*#__PURE__*/React.createElement("span", {
    style: pillCount
  }, counts[s.k] || 0)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Rechercher n\xB0 s\xE9rie, article, client, emplacement\u2026",
    style: {
      width: "100%",
      padding: "8px 12px 8px 32px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      outline: "none",
      background: "#fff",
      boxSizing: "border-box"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCreatingOpen(true),
    style: {
      padding: "8px 14px",
      background: "#10b981",
      color: "#fff",
      border: 0,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "+ Entr\xE9e stock")), /*#__PURE__*/React.createElement("div", {
    style: scStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDCE6 En stock disponible",
    value: counts.disponible || 0,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDD12 R\xE9serv\xE9s",
    value: counts.reserve || 0,
    color: "#f59e0b"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\u2713 Affect\xE9s clients",
    value: counts.affecte || 0,
    color: "#3b82f6"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDEE0 SAV en cours",
    value: counts.sav || 0,
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\u274C HS / sortis",
    value: (counts.hs || 0) + (counts.vendu || 0),
    color: "#64748b"
  })), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement du parc\u2026") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: scStyles.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Aucun mat\xE9riel en stock"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, "Une fois un BL fournisseur re\xE7u dans l'onglet ", /*#__PURE__*/React.createElement("strong", null, "Achats"), ", ajoute ici une entr\xE9e stock pour chaque num\xE9ro de s\xE9rie.", /*#__PURE__*/React.createElement("br", null), "Tu pourras ensuite le r\xE9server, l'affecter \xE0 un client, ou le passer en SAV.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: 12
    }
  }, filtered.map(a => {
    var sm = ASSET_STATUS.find(s => s.k === a.status) || ASSET_STATUS[0];
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      onClick: () => setEditing(a),
      style: {
        background: "#fff",
        border: "1px solid #eef1f5",
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
        borderLeft: "4px solid " + sm.dot,
        transition: "border-color 120ms"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.article_label || "—"), a.article_ref && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: 2
      }
    }, a.article_ref)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 999,
        background: sm.bg,
        color: sm.color,
        fontWeight: 700,
        whiteSpace: "nowrap"
      }
    }, sm.label)), a.serial_number && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#475569",
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "SN :"), " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        color: "#0f172a",
        fontWeight: 600
      }
    }, a.serial_number)), a.location && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 4
      }
    }, "\uD83D\uDCCD ", a.location), a.supplier && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 4
      }
    }, "\uD83C\uDFED ", a.supplier), a.client_name && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#1e40af",
        fontWeight: 600,
        marginTop: 6,
        paddingTop: 6,
        borderTop: "1px solid #f1f5f9"
      }
    }, "\u2192 ", a.client_name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        marginTop: 8,
        flexWrap: "wrap"
      },
      onClick: e => e.stopPropagation()
    }, ASSET_STATUS.filter(s => s.k !== a.status).slice(0, 3).map(s => /*#__PURE__*/React.createElement("button", {
      key: s.k,
      onClick: () => updateStatus(a.id, s.k),
      style: {
        padding: "3px 8px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        color: s.color,
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 600,
        cursor: "pointer"
      },
      title: "Passer en " + s.label
    }, "\u2192 ", s.label))));
  })), (editing || creatingOpen) && /*#__PURE__*/React.createElement(AssetEditModal, {
    asset: editing,
    onClose: () => {
      setEditing(null);
      setCreatingOpen(false);
    },
    onSaved: () => {
      setEditing(null);
      setCreatingOpen(false);
      reload();
    }
  }));
};
var pillBtn = (active, color, bg) => ({
  padding: "5px 10px",
  border: 0,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
  background: active ? bg || color + "20" : "transparent",
  color: active ? color : "#64748b",
  display: "inline-flex",
  alignItems: "center",
  gap: 4
});
var pillCount = {
  fontSize: 10,
  padding: "0px 6px",
  background: "rgba(15,23,42,0.08)",
  borderRadius: 999,
  fontWeight: 700,
  marginLeft: 3
};

// ─── Modale de création/édition d'un asset ───
var AssetEditModal = ({
  asset,
  onClose,
  onSaved
}) => {
  var isNew = !asset;
  var [form, setForm] = React.useState(asset || {
    status: "disponible",
    received_at: new Date().toISOString().slice(0, 10)
  });
  var [articles, setArticles] = React.useState([]);
  var [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    if (window.api && window.api.commercialArticles) {
      window.api.commercialArticles.list({
        active: true
      }).then(setArticles).catch(() => {});
    }
    var onKey = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  var set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  var onPickArticle = id => {
    var a = articles.find(x => x.id === id);
    setForm(f => ({
      ...f,
      article_id: id,
      article_ref: a ? a.ref : f.article_ref,
      article_label: a ? a.designation : f.article_label
    }));
  };
  var submit = async () => {
    setSaving(true);
    try {
      if (isNew) await window.api.assets.create(form);else await window.api.assets.update(asset.id, form);
      if (window.HubToast) window.HubToast.success(isNew ? "✓ Entrée stock créée" : "✓ Asset mis à jour");
      onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + (e.message || e));
    } finally {
      setSaving(false);
    }
  };
  var remove = async () => {
    if (!confirm("Retirer cet asset du parc ? (soft-delete, peut être restauré)")) return;
    try {
      await window.api.assets.remove(asset.id);
      if (window.HubToast) window.HubToast.success("✓ Asset retiré");
      onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + (e.message || e));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: scStyles.modalOverlay
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: scStyles.modalCard
  }, /*#__PURE__*/React.createElement("div", {
    style: scStyles.modalHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: 700
    }
  }, "Stock interne"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "2px 0 0",
      fontSize: 15,
      fontWeight: 700
    }
  }, isNew ? "Nouvelle entrée stock" : "Asset " + asset.id)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: scStyles.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Article catalogue"), /*#__PURE__*/React.createElement("select", {
    value: form.article_id || "",
    onChange: e => onPickArticle(e.target.value),
    style: scStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Hors catalogue \u2014"), articles.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.ref ? a.ref + " · " : "", a.designation)))), !form.article_id && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "R\xE9f article (libre)"), /*#__PURE__*/React.createElement("input", {
    value: form.article_ref || "",
    onChange: e => set("article_ref", e.target.value),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("input", {
    value: form.article_label || "",
    onChange: e => set("article_label", e.target.value),
    style: scStyles.input
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "N\xB0 s\xE9rie / IMEI"), /*#__PURE__*/React.createElement("input", {
    value: form.serial_number || "",
    onChange: e => set("serial_number", e.target.value),
    style: {
      ...scStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Lot / palette"), /*#__PURE__*/React.createElement("input", {
    value: form.lot || "",
    onChange: e => set("lot", e.target.value),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Fournisseur"), /*#__PURE__*/React.createElement("input", {
    value: form.supplier || "",
    onChange: e => set("supplier", e.target.value),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Prix d'achat HT"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: form.purchase_price_ht || "",
    onChange: e => set("purchase_price_ht", e.target.value ? Number(e.target.value) : null),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Re\xE7u le"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: (form.received_at || "").slice(0, 10),
    onChange: e => set("received_at", e.target.value || null),
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Emplacement"), /*#__PURE__*/React.createElement("input", {
    value: form.location || "",
    onChange: e => set("location", e.target.value),
    placeholder: "\xC9tag\xE8re A3, Salle stock\u2026",
    style: scStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Statut"), /*#__PURE__*/React.createElement("select", {
    value: form.status || "disponible",
    onChange: e => set("status", e.target.value),
    style: scStyles.input
  }, ASSET_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.k,
    value: s.k
  }, s.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Fin de garantie"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: (form.warranty_end || "").slice(0, 10),
    onChange: e => set("warranty_end", e.target.value || null),
    style: scStyles.input
  })), (form.status === "affecte" || form.status === "reserve") && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Client"), /*#__PURE__*/React.createElement("input", {
    value: form.client_name || "",
    onChange: e => set("client_name", e.target.value),
    placeholder: "Raison sociale",
    style: scStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: scStyles.lbl
  }, "Notes"), /*#__PURE__*/React.createElement("textarea", {
    value: form.notes || "",
    onChange: e => set("notes", e.target.value),
    rows: 2,
    style: {
      ...scStyles.input,
      resize: "vertical"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 22px",
      borderTop: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, !isNew && /*#__PURE__*/React.createElement("button", {
    onClick: remove,
    style: {
      ...scStyles.ghostBtn,
      color: "#dc2626",
      borderColor: "#fecaca"
    }
  }, "Retirer du parc")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: scStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: saving,
    style: {
      ...scStyles.primaryBtn,
      background: "#10b981",
      opacity: saving ? 0.6 : 1
    }
  }, saving ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer")))));
};

// ════════════════════════════════════════════════════════════════════
// CATALOGUE PRODUITS — Référentiel articles + compteurs live
// ════════════════════════════════════════════════════════════════════
var CatalogueProduitsView = ({
  fmtEUR,
  onSwitchToStock
}) => {
  var [articles, setArticles] = React.useState([]);
  var [counters, setCounters] = React.useState({});
  var [loading, setLoading] = React.useState(true);
  var [search, setSearch] = React.useState("");
  var [category, setCategory] = React.useState("all");
  var reload = React.useCallback(async () => {
    setLoading(true);
    try {
      var [arts, cnts] = await Promise.all([window.api.commercialArticles.list({
        active: true
      }), window.api.assets.counters()]);
      setArticles(arts || []);
      var map = {};
      (cnts || []).forEach(c => {
        map[c.article_id] = c;
      });
      setCounters(map);
    } catch (e) {
      setArticles([]);
      setCounters({});
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
  }, [reload]);
  var categories = React.useMemo(() => {
    var set = new Set();
    articles.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return ["all", ...Array.from(set).sort()];
  }, [articles]);
  var filtered = React.useMemo(() => {
    var arr = articles;
    if (category !== "all") arr = arr.filter(a => a.category === category);
    var q = search.trim().toLowerCase();
    if (q) arr = arr.filter(a => [a.ref, a.designation, a.category, a.supplier].some(v => String(v || "").toLowerCase().includes(q)));
    return arr;
  }, [articles, category, search]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: 4,
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 8,
      flexWrap: "wrap"
    }
  }, categories.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setCategory(c),
    style: pillBtn(category === c, "#a855f7", "#ede9fe")
  }, c === "all" ? "Toutes catégories" : c))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Rechercher ref, d\xE9signation, cat\xE9gorie\u2026",
    style: {
      width: "100%",
      padding: "8px 12px 8px 32px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      outline: "none",
      background: "#fff",
      boxSizing: "border-box"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.location.href = "/stock-article-nouveau";
    },
    style: {
      padding: "8px 14px",
      background: "#a855f7",
      color: "#fff",
      border: 0,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "+ Nouvel article")), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement du catalogue\u2026") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: scStyles.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Aucun article au catalogue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 6
    }
  }, "Cr\xE9e un premier article via le bouton \xAB + Nouvel article \xBB.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 12
    }
  }, filtered.map(a => {
    var c = counters[a.id] || {};
    var inStock = Number(c.in_stock || 0);
    var reserved = Number(c.reserved || 0);
    var sold = Number(c.sold || 0);
    var sav = Number(c.in_sav || 0);
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        background: "#fff",
        border: "1px solid #eef1f5",
        borderRadius: 10,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.designation || "—"), a.ref && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: 2
      }
    }, a.ref)), a.category && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 999,
        background: "#ede9fe",
        color: "#5b21b6",
        fontWeight: 700,
        whiteSpace: "nowrap"
      }
    }, a.category)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 6,
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#065f46",
        fontWeight: 700,
        fontSize: 16,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, inStock), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#16a34a",
        fontSize: 10,
        fontWeight: 600
      }
    }, "en stock")), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: 6,
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#92400e",
        fontWeight: 700,
        fontSize: 16,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, reserved), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#f59e0b",
        fontSize: 10,
        fontWeight: 600
      }
    }, "r\xE9serv\xE9s")), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 6,
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#1e40af",
        fontWeight: 700,
        fontSize: 16,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, sold), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#3b82f6",
        fontSize: 10,
        fontWeight: 600
      }
    }, "affect\xE9s")), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 6,
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#991b1b",
        fontWeight: 700,
        fontSize: 16,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, sav), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#dc2626",
        fontSize: 10,
        fontWeight: 600
      }
    }, "en SAV"))), a.unit_price_ht != null && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        display: "flex",
        justifyContent: "space-between",
        borderTop: "1px solid #f1f5f9",
        paddingTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", null, "Tarif HT"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#0f172a",
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmtEUR(a.unit_price_ht))), /*#__PURE__*/React.createElement("button", {
      onClick: () => onSwitchToStock && onSwitchToStock(a.id),
      style: {
        padding: "6px 10px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#475569",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "Voir les instances en stock \u2192"));
  })));
};
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