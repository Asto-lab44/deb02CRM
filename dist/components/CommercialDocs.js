// ════════════════════════════════════════════════════════════════════
// RichDescriptionEditor — mini WYSIWYG (gras / italique / souligné + 4 couleurs)
// ════════════════════════════════════════════════════════════════════
var RichDescriptionEditor = ({
  value,
  onChange,
  placeholder
}) => {
  var ref = React.useRef(null);
  var lastValueRef = React.useRef(value || "");
  React.useEffect(() => {
    if (document.getElementById("rich-desc-styles")) return;
    var s = document.createElement("style");
    s.id = "rich-desc-styles";
    s.textContent = '.rich-desc[contenteditable]:empty:before{content:attr(data-placeholder);color:#94a3b8;font-style:italic;pointer-events:none;}';
    document.head.appendChild(s);
  }, []);
  React.useEffect(() => {
    if (!ref.current) return;
    var v = value || "";
    if (ref.current.innerHTML !== v && document.activeElement !== ref.current) {
      ref.current.innerHTML = v;
      lastValueRef.current = v;
    }
  }, [value]);
  var exec = (cmd, arg) => {
    if (!ref.current) return;
    ref.current.focus();
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch (e) {}
    document.execCommand(cmd, false, arg);
    var html = ref.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };
  var btnStyle = {
    minWidth: 26,
    height: 26,
    padding: "0 6px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 12,
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };
  var colorBtn = (color, title) => React.createElement("button", {
    type: "button",
    title,
    onMouseDown: e => e.preventDefault(),
    onClick: () => exec("foreColor", color),
    style: {
      width: 20,
      height: 20,
      border: "1px solid #cbd5e1",
      background: color,
      borderRadius: 10,
      cursor: "pointer",
      padding: 0
    }
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "5px 6px",
      border: "1px solid #e2e8f0",
      borderBottom: 0,
      borderRadius: "6px 6px 0 0",
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Gras",
    onMouseDown: e => e.preventDefault(),
    onClick: () => exec("bold"),
    style: {
      ...btnStyle,
      fontWeight: 700
    }
  }, "B"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Italique",
    onMouseDown: e => e.preventDefault(),
    onClick: () => exec("italic"),
    style: {
      ...btnStyle,
      fontStyle: "italic"
    }
  }, "I"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Soulign\xE9",
    onMouseDown: e => e.preventDefault(),
    onClick: () => exec("underline"),
    style: {
      ...btnStyle,
      textDecoration: "underline"
    }
  }, "U"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 16,
      background: "#e2e8f0",
      margin: "0 4px"
    }
  }), colorBtn("#0f172a", "Noir"), colorBtn("#16a34a", "Vert"), colorBtn("#ea580c", "Orange"), colorBtn("#dc2626", "Rouge"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 10,
      color: "#94a3b8",
      fontStyle: "italic"
    }
  }, "Mise en forme reprise sur le PDF")), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: "rich-desc",
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder || "",
    onInput: e => {
      lastValueRef.current = e.currentTarget.innerHTML;
      onChange(e.currentTarget.innerHTML);
    },
    onBlur: e => onChange(e.currentTarget.innerHTML),
    style: {
      minHeight: 48,
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: "0 0 6px 6px",
      fontSize: 12,
      color: "#475569",
      lineHeight: 1.5,
      background: "#fff",
      outline: "none",
      boxSizing: "border-box"
    }
  }));
};

// Code client = "CLI" + 3 premières lettres du nom (alphanumériques, MAJ).
// Ex : "ASTORYA SGI" → "CLIAST" · "INIT 2" → "CLIINI" · "CHEVAL SHOP" → "CLICHE".
var computeClientCode = clientName => {
  if (!clientName) return "";
  var cleaned = String(clientName).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return "CLI" + cleaned.slice(0, 3).padEnd(3, "X");
};

// ════════════════════════════════════════════════════════════════════
// CommercialDocs — Gestion Commerciale (Devis / Commande / BL / Facture)
// ════════════════════════════════════════════════════════════════════
//
// Inspirée Sage 50c Gestion Commerciale :
// - 4 types de documents : devis → commande → BL → facture
// - Chaque type a son propre tab + son kanban par statut
// - Bouton "Nouveau" crée un brouillon ; édition inline des lignes
// - Bouton "Transformer en …" enchaîne sur le document suivant
// - Rattachement optionnel à un projet (CRM Projets & Livrables)
//
// Sources Supabase : commercial_docs + commercial_doc_lines + commercial_articles
// ════════════════════════════════════════════════════════════════════

var CommercialDocs = () => {
  var TYPES = [{
    k: "devis",
    label: "Devis",
    newLabel: "Nouveau devis",
    color: "#3b82f6",
    icon: "📄"
  }, {
    k: "commande",
    label: "Commandes",
    newLabel: "Nouvelle commande",
    color: "#a855f7",
    icon: "📋"
  }, {
    k: "bl",
    label: "Bons livraison",
    newLabel: "Nouveau bon de livraison",
    color: "#ea580c",
    icon: "🚚"
  }, {
    k: "facture",
    label: "Factures",
    newLabel: "Nouvelle facture",
    color: "#10b981",
    icon: "💶"
  }, {
    k: "commande_achat",
    label: "Achats fournisseurs",
    newLabel: "Nouvelle commande d'achat",
    color: "#0ea5e9",
    icon: "🛒"
  }];
  var STATUS_META = {
    brouillon: {
      label: "Brouillon",
      color: "#94a3b8",
      bg: "#f1f5f9"
    },
    envoye: {
      label: "Envoyé",
      color: "#3b82f6",
      bg: "#dbeafe"
    },
    accepte: {
      label: "Accepté",
      color: "#10b981",
      bg: "#dcfce7"
    },
    refuse: {
      label: "Refusé",
      color: "#dc2626",
      bg: "#fee2e2"
    },
    transforme: {
      label: "Transformé",
      color: "#7e22ce",
      bg: "#f3e8ff"
    },
    livre: {
      label: "Livré",
      color: "#f59e0b",
      bg: "#fef3c7"
    },
    facture: {
      label: "Facturé",
      color: "#0ea5e9",
      bg: "#e0f2fe"
    },
    paye: {
      label: "Payé",
      color: "#065f46",
      bg: "#d1fae5"
    },
    annule: {
      label: "Annulé",
      color: "#475569",
      bg: "#e2e8f0"
    }
  };
  var [activeType, setActiveType] = React.useState("devis");
  var [statusFilter, setStatusFilter] = React.useState("all");
  var [clientFilter, setClientFilter] = React.useState("");
  var [dateFrom, setDateFrom] = React.useState("");
  var [dateTo, setDateTo] = React.useState("");
  var [docs, setDocs] = React.useState([]);
  var [allDocs, setAllDocs] = React.useState([]); // tous types confondus, pour calculer les chaînes
  var [loading, setLoading] = React.useState(true);
  var [search, setSearch] = React.useState("");
  var [clients, setClients] = React.useState([]);
  var [opps, setOpps] = React.useState([]);
  var [editing, setEditing] = React.useState(null); // null ou doc en cours d'édition

  var reload = React.useCallback(async () => {
    setLoading(true);
    try {
      var [typed, all] = await Promise.all([window.api.commercialDocs.list({
        type: activeType
      }), window.api.commercialDocs.list({}) // pour les chaînes Devis→Commande→BL→Facture
      ]);
      setDocs(typed || []);
      setAllDocs(all || []);
    } catch (e) {
      setDocs([]);
      setAllDocs([]);
    }
    setLoading(false);
  }, [activeType]);

  // Map parent_doc_id → enfant unique (chaque doc n'a qu'un enfant max)
  var childrenMap = React.useMemo(() => {
    var map = {};
    (allDocs || []).forEach(d => {
      if (d.parent_doc_id) map[d.parent_doc_id] = d;
    });
    return map;
  }, [allDocs]);

  // Pour un doc devis, retourne la chaîne complète : { devis, commande, bl, facture }
  var buildChain = React.useCallback(rootDoc => {
    var chain = {
      devis: null,
      commande: null,
      bl: null,
      facture: null
    };
    var current = rootDoc;
    while (current) {
      chain[current.type] = current;
      current = childrenMap[current.id] || null;
    }
    return chain;
  }, [childrenMap]);

  // Pour un doc enfant (ex commande), remonte la chaîne et retourne les 4 docs
  var buildChainFromAny = React.useCallback(doc => {
    if (!doc) return {
      devis: null,
      commande: null,
      bl: null,
      facture: null
    };
    // Remonte au devis racine
    var root = doc;
    var seen = new Set();
    while (root.parent_doc_id && !seen.has(root.id)) {
      seen.add(root.id);
      var parent = (allDocs || []).find(d => d.id === root.parent_doc_id);
      if (!parent) break;
      root = parent;
    }
    return buildChain(root);
  }, [allDocs, buildChain]);
  React.useEffect(() => {
    reload();
  }, [reload]);
  React.useEffect(() => {
    (async () => {
      try {
        setClients((await window.api.clients.list()) || []);
      } catch (e) {}
      try {
        var all = (await window.api.opportunities.list()) || [];
        // Pipeline ouvert ET récent : on garde tout sauf won/lost,
        // ET on limite aux opp créées (ou updatées) dans les 30 derniers jours.
        // Évite de polluer le picker avec des vieilles opps dormantes.
        var thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
        setOpps(all.filter(o => {
          if (o.stage === "won" || o.stage === "lost") return false;
          var ts = new Date(o.updated_at || o.created_at || 0).getTime();
          return ts >= thirtyDaysAgo;
        }));
      } catch (e) {}
    })();
  }, []);
  var filtered = React.useMemo(() => {
    var q = search.trim().toLowerCase();
    var cf = clientFilter.trim().toLowerCase();
    return docs.filter(d => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (q && ![d.id, d.client_name, d.title, d.owner].some(v => String(v || "").toLowerCase().includes(q))) return false;
      if (cf) {
        var code = computeClientCode(d.client_name || "").toLowerCase();
        if (!String(d.client_name || "").toLowerCase().includes(cf) && !code.includes(cf)) return false;
      }
      if (dateFrom && (!d.doc_date || d.doc_date < dateFrom)) return false;
      if (dateTo && (!d.doc_date || d.doc_date > dateTo)) return false;
      return true;
    });
  }, [docs, search, statusFilter, clientFilter, dateFrom, dateTo]);

  // Liste unique des clients présents dans les docs (pour autocomplete)
  var clientOptions = React.useMemo(() => {
    var set = new Set();
    docs.forEach(d => {
      if (d.client_name) set.add(d.client_name);
    });
    return Array.from(set).sort();
  }, [docs]);

  // Map client_id / client_name → status (client | prospect) pour la liste.
  var clientStatusMap = React.useMemo(() => {
    var byId = {};
    var byName = {};
    (clients || []).forEach(c => {
      var s = c.status === "client" ? "client" : "prospect";
      if (c.id) byId[c.id] = s;
      if (c.name) byName[String(c.name).toLowerCase()] = s;
    });
    return {
      byId,
      byName
    };
  }, [clients]);
  var docKind = React.useCallback(d => {
    if (d.client_id && clientStatusMap.byId[d.client_id]) return clientStatusMap.byId[d.client_id];
    var nameKey = String(d.client_name || "").toLowerCase();
    if (nameKey && clientStatusMap.byName[nameKey]) return clientStatusMap.byName[nameKey];
    return null;
  }, [clientStatusMap]);
  React.useEffect(() => {
    setStatusFilter("all");
  }, [activeType]);

  // Compteurs par statut (pour les pills de filtre)
  var statusCounts = React.useMemo(() => {
    var c = {
      all: docs.length
    };
    docs.forEach(d => {
      c[d.status] = (c[d.status] || 0) + 1;
    });
    return c;
  }, [docs]);
  var totals = React.useMemo(() => {
    var t = {
      count: filtered.length,
      ht: 0,
      ttc: 0,
      pending: 0
    };
    filtered.forEach(d => {
      t.ht += Number(d.total_ht) || 0;
      t.ttc += Number(d.total_ttc) || 0;
      if (d.status === "brouillon" || d.status === "envoye") t.pending++;
    });
    return t;
  }, [filtered]);
  var newDoc = async () => {
    try {
      var doc = await window.api.commercialDocs.create({
        type: activeType,
        title: TYPES.find(t => t.k === activeType).label + " — Nouveau",
        status: "brouillon",
        lines: []
      });
      if (window.HubToast) window.HubToast.success("✓ " + doc.id + " créé");
      setEditing(doc);
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var openDoc = async id => {
    var full = await window.api.commercialDocs.getById(id);
    setEditing(full);
  };

  // Si URL ?open=DEV-XXXX → ouvre le doc en éditeur au chargement
  // (ex : depuis AdvanceOpportunity > "Créer un devis")
  React.useEffect(() => {
    var params = new URLSearchParams(window.location.search);
    var openId = params.get("open");
    if (openId && !editing) {
      // Bascule au bon type selon préfixe pour que la liste soit cohérente
      var prefix = openId.split("-")[0];
      var typeByPrefix = {
        DEV: "devis",
        BC: "commande",
        BL: "bl",
        FAC: "facture",
        CA: "commande_achat"
      };
      var matched = typeByPrefix[prefix];
      if (matched && matched !== activeType) setActiveType(matched);
      (async () => {
        try {
          var full = await window.api.commercialDocs.getById(openId);
          if (full) setEditing(full);
        } catch (e) {}
      })();
    }
  }, []);
  var closeEditor = () => {
    setEditing(null);
    reload();
  };

  // Format euro fr-FR : la virgule est le séparateur décimal légal, ne PAS la remplacer.
  var fmtEUR = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
  return /*#__PURE__*/React.createElement("div", {
    style: cdStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: cdStyles.sidebar
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
    style: cdStyles.logo
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
  }, "Gestion commerciale"))), /*#__PURE__*/React.createElement("button", {
    onClick: newDoc,
    style: cdStyles.newBtn
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "+"), /*#__PURE__*/React.createElement("span", null, TYPES.find(t => t.k === activeType).newLabel)), /*#__PURE__*/React.createElement("div", {
    style: cdStyles.navLabel
  }, "Documents"), TYPES.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.k,
    onClick: () => setActiveType(t.k),
    style: {
      ...cdStyles.navItem,
      ...(activeType === t.k ? cdStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      color: activeType === t.k ? t.color : "#94a3b8"
    }
  }, t.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, t.label), /*#__PURE__*/React.createElement("span", {
    style: cdStyles.navCount
  }, activeType === t.k ? docs.length : ""))), /*#__PURE__*/React.createElement("div", {
    style: cdStyles.navLabel
  }, "Administration"), /*#__PURE__*/React.createElement("a", {
    href: "/gestion-commerciale-admin",
    style: {
      ...cdStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      color: "#94a3b8"
    }
  }, "\u2699"), /*#__PURE__*/React.createElement("span", null, "Catalogue & param\xE8tres"))), /*#__PURE__*/React.createElement("main", {
    style: cdStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: cdStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: cdStyles.h1
  }, TYPES.find(t => t.k === activeType).label), /*#__PURE__*/React.createElement("p", {
    style: cdStyles.sub
  }, totals.count, " document(s) \xB7 ", fmtEUR(totals.ttc), " TTC \xB7 ", totals.pending, " en attente")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Rechercher (r\xE9f, client, titre\u2026)",
    style: cdStyles.searchInput
  }), /*#__PURE__*/React.createElement("button", {
    onClick: newDoc,
    style: cdStyles.primaryBtn
  }, "+ Nouveau"))), /*#__PURE__*/React.createElement("div", {
    style: cdStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "Total HT",
    value: fmtEUR(totals.ht),
    color: "#3730a3"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Total TTC",
    value: fmtEUR(totals.ttc),
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "En attente",
    value: totals.pending,
    color: "#f59e0b"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Documents",
    value: totals.count,
    color: "#0ea5e9"
  })), docs.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, [{
    k: "all",
    label: "Tous"
  }, {
    k: "brouillon",
    label: "Brouillons",
    c: "#94a3b8"
  }, {
    k: "envoye",
    label: "Envoyés",
    c: "#3b82f6"
  }, activeType === "devis" && {
    k: "accepte",
    label: "Acceptés",
    c: "#10b981"
  }, activeType === "devis" && {
    k: "refuse",
    label: "Refusés",
    c: "#dc2626"
  }, {
    k: "transforme",
    label: "Transformés",
    c: "#7e22ce"
  }, activeType === "bl" && {
    k: "livre",
    label: "Livrés",
    c: "#f59e0b"
  }, activeType === "facture" && {
    k: "paye",
    label: "Payés",
    c: "#065f46"
  }, {
    k: "annule",
    label: "Annulés",
    c: "#475569"
  }].filter(Boolean).map(s => {
    var count = s.k === "all" ? statusCounts.all : statusCounts[s.k] || 0;
    var active = statusFilter === s.k;
    if (s.k !== "all" && count === 0) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: s.k,
      onClick: () => setStatusFilter(s.k),
      style: {
        padding: "5px 11px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid " + (active ? s.c || "#0f172a" : "#e2e8f0"),
        background: active ? s.c || "#0f172a" : "#fff",
        color: active ? "#fff" : "#475569",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, s.label, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        opacity: 0.85
      }
    }, count));
  })), docs.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 14,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px 5px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      background: "#fff",
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Client"), /*#__PURE__*/React.createElement("input", {
    value: clientFilter,
    onChange: e => setClientFilter(e.target.value),
    list: "cdoc-clients-list",
    placeholder: "raison sociale ou CLIxxx",
    style: {
      border: 0,
      outline: "none",
      flex: 1,
      fontSize: 13,
      padding: "3px 4px",
      background: "transparent",
      minWidth: 0
    }
  }), clientFilter && /*#__PURE__*/React.createElement("button", {
    onClick: () => setClientFilter(""),
    title: "Effacer",
    style: {
      border: 0,
      background: "transparent",
      color: "#94a3b8",
      cursor: "pointer",
      fontSize: 14
    }
  }, "\xD7"), /*#__PURE__*/React.createElement("datalist", {
    id: "cdoc-clients-list"
  }, clientOptions.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, computeClientCode(c), " \u2014 ", c)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px 5px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateFrom,
    onChange: e => setDateFrom(e.target.value),
    style: {
      border: 0,
      outline: "none",
      fontSize: 12.5,
      padding: "3px 4px",
      background: "transparent",
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontSize: 12
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateTo,
    onChange: e => setDateTo(e.target.value),
    style: {
      border: 0,
      outline: "none",
      fontSize: 12.5,
      padding: "3px 4px",
      background: "transparent",
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a"
    }
  }), (dateFrom || dateTo) && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setDateFrom("");
      setDateTo("");
    },
    title: "Effacer",
    style: {
      border: 0,
      background: "transparent",
      color: "#94a3b8",
      cursor: "pointer",
      fontSize: 14
    }
  }, "\xD7")), (clientFilter || dateFrom || dateTo) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#64748b"
    }
  }, filtered.length, " r\xE9sultat", filtered.length > 1 ? "s" : "")), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: cdStyles.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Aucun ", TYPES.find(t => t.k === activeType).label.toLowerCase(), " pour le moment"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 4
    }
  }, "Cliquez sur \xAB + Nouveau \xBB pour cr\xE9er le premier."), /*#__PURE__*/React.createElement("button", {
    onClick: newDoc,
    style: {
      ...cdStyles.primaryBtn,
      marginTop: 14
    }
  }, "+ Cr\xE9er le premier")) : /*#__PURE__*/React.createElement("div", {
    style: cdStyles.docList
  }, /*#__PURE__*/React.createElement("div", {
    style: cdStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 130px"
    }
  }, "R\xE9f\xE9rence"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Client / Titre"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, "Type"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px"
    }
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, "Code client"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px",
      textAlign: "right"
    }
  }, "Montant HT"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px",
      textAlign: "right"
    }
  }, "Montant TTC"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px"
    }
  }, "Statut"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 170px"
    }
  }, "Workflow"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 60px"
    }
  })), filtered.map(d => /*#__PURE__*/React.createElement(DocRow, {
    key: d.id,
    doc: d,
    chain: buildChainFromAny(d),
    statusMeta: STATUS_META,
    fmtEUR: fmtEUR,
    onOpen: openDoc,
    onReload: reload,
    kind: docKind(d)
  })))), editing && /*#__PURE__*/React.createElement(CommercialDocEditor, {
    doc: editing,
    clients: clients,
    opps: opps,
    chain: buildChainFromAny(editing),
    onClose: closeEditor,
    onSaved: reload
  }));
};

// ─────────────────────────────────────────────────────────────────
// WorkflowBar — Visualisation du cycle Devis→Commande→BL→Facture
//                avec étape courante + portes de validation
// ─────────────────────────────────────────────────────────────────
var WorkflowBar = ({
  doc,
  canTransform,
  chain
}) => {
  var STEPS = [{
    k: "devis",
    label: "Devis",
    icon: "📄"
  }, {
    k: "commande",
    label: "Commande",
    icon: "📋"
  }, {
    k: "bl",
    label: "BL",
    icon: "🚚"
  }, {
    k: "facture",
    label: "Facture",
    icon: "💶"
  }];
  var curIdx = STEPS.findIndex(s => s.k === doc.type);
  var isLocked = doc.status === "transforme";
  // Étape "future" qui existe déjà en BDD (créée par cascade) → violet plein
  var hasDescendant = k => !!(chain && chain[k]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg, #f0f9ff, #eef2ff)",
      border: "1px solid #c7d2fe",
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3730a3",
      letterSpacing: 0.4,
      textTransform: "uppercase"
    }
  }, "Workflow Sage"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569"
    }
  }, isLocked ? "✓ Doc transformé — lignes & champs restent éditables" : canTransform.ok ? "✅ Transformation autorisée" : "⚠ Bloqué : " + canTransform.reason)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, STEPS.map((s, i) => {
    var isCurrent = i === curIdx;
    var isPast = i < curIdx;
    var isFuture = i > curIdx;
    var isCreated = isFuture && hasDescendant(s.k); // doc enfant déjà créé
    var child = chain && chain[s.k];
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s.k
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => {
        if (isCreated && child && child.id !== doc.id && typeof window !== "undefined" && window.location) {
          window.location.hash = "#doc=" + child.id;
        }
      },
      title: isCreated && child ? "Ouvrir " + child.id : "",
      style: {
        flex: 1,
        padding: "8px 10px",
        borderRadius: 7,
        background: isCurrent ? "#3730a3" : isPast ? "#dcfce7" : isCreated ? "#7c3aed" : "#fff",
        color: isCurrent ? "#fff" : isPast ? "#065f46" : isCreated ? "#fff" : "#94a3b8",
        border: "1px solid " + (isCurrent ? "#3730a3" : isPast ? "#86efac" : isCreated ? "#7c3aed" : "#e2e8f0"),
        boxShadow: isCreated ? "0 2px 6px rgba(124,58,237,0.35)" : "none",
        cursor: isCreated ? "pointer" : "default",
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, s.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, s.label), isCurrent && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.25)",
        fontWeight: 700
      }
    }, (doc.status || "").toUpperCase()), isPast && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, "\u2713"), isCreated && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.25)",
        fontWeight: 700
      }
    }, "CR\xC9\xC9")), i < STEPS.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: isPast || isCreated ? "#10b981" : isCurrent && canTransform.ok ? "#10b981" : "#cbd5e1"
      }
    }, isPast || isCreated ? "→" : isCurrent && canTransform.ok ? "→" : "✕"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "\uD83D\uDCA1 ", /*#__PURE__*/React.createElement("strong", null, "R\xE8gles de validation"), " : un devis doit \xEAtre ", /*#__PURE__*/React.createElement("strong", null, "Accept\xE9"), " pour \xEAtre transform\xE9 en commande \xB7 une commande doit \xEAtre ", /*#__PURE__*/React.createElement("strong", null, "Accept\xE9e"), " pour g\xE9n\xE9rer un BL \xB7 un BL doit \xEAtre ", /*#__PURE__*/React.createElement("strong", null, "Livr\xE9"), " pour produire une facture. M\xEAme apr\xE8s transformation, les ", /*#__PURE__*/React.createElement("strong", null, "lignes et champs restent \xE9ditables"), " (ajout, modification, suppression d'articles autoris\xE9s)."));
};

// ─────────────────────────────────────────────────────────────────
// DocRow — Ligne de la liste avec menu d'actions rapides
// ─────────────────────────────────────────────────────────────────
var DocRow = ({
  doc,
  chain,
  statusMeta,
  fmtEUR,
  onOpen,
  onReload,
  kind
}) => {
  var [menuOpen, setMenuOpen] = React.useState(false);
  var [menuPos, setMenuPos] = React.useState({
    top: 0,
    right: 0
  });
  var menuRef = React.useRef(null);
  var btnRef = React.useRef(null);
  var sm = statusMeta[doc.status] || statusMeta.brouillon;

  // Click outside : on attend la frame suivante pour ne pas catcher
  // le click qui vient d'ouvrir le menu (sinon il se referme aussitôt).
  React.useEffect(() => {
    if (!menuOpen) return;
    var close = e => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    var id = window.requestAnimationFrame(() => {
      document.addEventListener("mousedown", close);
    });
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("mousedown", close);
    };
  }, [menuOpen]);
  var stop = e => e.stopPropagation();
  var duplicate = async () => {
    try {
      var full = await window.api.commercialDocs.getById(doc.id);
      if (!full) throw new Error("Doc introuvable");
      var lines = (full.lines || []).map(l => ({
        article_id: l.article_id,
        ref: l.ref,
        designation: l.designation,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price_ht: l.unit_price_ht,
        discount_pct: l.discount_pct,
        tva_rate: l.tva_rate,
        total_ht: l.total_ht,
        total_tva: l.total_tva,
        total_ttc: l.total_ttc,
        is_text_only: l.is_text_only
      }));
      var copy = await window.api.commercialDocs.create({
        type: doc.type,
        status: "brouillon",
        client_id: full.client_id,
        client_name: full.client_name,
        client_address: full.client_address,
        client_cp: full.client_cp,
        client_city: full.client_city,
        client_siren: full.client_siren,
        client_tva: full.client_tva,
        contact_name: full.contact_name,
        contact_email: full.contact_email,
        project_id: full.project_id,
        opportunity_id: full.opportunity_id,
        title: "Copie de " + (full.title || full.id),
        notes: full.notes,
        payment_terms_id: full.payment_terms_id,
        owner: full.owner,
        lines
      });
      if (window.HubToast) window.HubToast.success("✓ " + copy.id + " créé (copie)");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var quickStatus = async (status, label) => {
    try {
      var patch = {
        status
      };
      if (status === "paye") patch.paid_at = new Date().toISOString();
      if (status === "livre") patch.delivered_at = new Date().toISOString();
      await window.api.commercialDocs.update(doc.id, patch);
      if (window.HubToast) window.HubToast.success("✓ Statut → " + label);
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var downloadPdf = async () => {
    if (!window.HubCommercialPdf) {
      if (window.HubToast) window.HubToast.error("Module PDF non chargé — rechargez la page (F5)");else alert("Module PDF non chargé — rechargez la page");
      return;
    }
    try {
      await window.HubCommercialPdf.download(doc.id);
      // Log téléchargement (best-effort, ne bloque pas si la table n'existe pas)
      try {
        await window.api.commercialSends.log({
          doc_id: doc.id,
          doc_type: doc.type,
          channel: "download",
          status: "sent",
          provider: "browser"
        });
      } catch (e) {}
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur PDF : " + (e.message || e));
    }
  };
  var remove = async () => {
    if (!confirm("Supprimer " + doc.id + " ? (soft-delete)")) return;
    try {
      await window.api.commercialDocs.remove(doc.id);
      if (window.HubToast) window.HubToast.success("✓ " + doc.id + " supprimé");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onOpen(doc.id),
    style: cdStyles.tableRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 130px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#3730a3",
      fontWeight: 600
    }
  }, doc.id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, doc.client_name || "— Client non renseigné —"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, doc.title || "(sans titre)")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, kind === "client" ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 999,
      background: "#dcfce7",
      color: "#065f46",
      fontSize: 10.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Client") : kind === "prospect" ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 999,
      background: "#fef3c7",
      color: "#78350f",
      fontSize: 10.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Prospect") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#cbd5e1"
    }
  }, "\u2014")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px",
      fontSize: 12,
      color: "#475569",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, doc.doc_date), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, doc.client_name ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      padding: "2px 7px",
      borderRadius: 5,
      background: "#eef2ff",
      color: "#3730a3",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: 0.5
    }
  }, computeClientCode(doc.client_name)) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#cbd5e1"
    }
  }, "\u2014")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px",
      textAlign: "right",
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtEUR(doc.total_ht)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 120px",
      textAlign: "right",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtEUR(doc.total_ttc)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      background: sm.bg,
      color: sm.color,
      fontSize: 11,
      fontWeight: 600
    }
  }, sm.label)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 170px"
    }
  }, /*#__PURE__*/React.createElement(WorkflowChain, {
    chain: chain,
    currentType: doc.type
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 60px",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    ref: btnRef,
    onClick: e => {
      stop(e);
      // Calcule la position du menu en viewport (position fixed) pour
      // qu'il échappe à l'overflow:hidden du parent docList
      if (btnRef.current) {
        var r = btnRef.current.getBoundingClientRect();
        setMenuPos({
          top: r.bottom + 4,
          right: window.innerWidth - r.right
        });
      }
      setMenuOpen(v => !v);
    },
    style: {
      background: "transparent",
      border: 0,
      color: "#94a3b8",
      fontSize: 18,
      cursor: "pointer",
      padding: "4px 10px",
      borderRadius: 4
    },
    title: "Actions"
  }, "\u22EF"), menuOpen && /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    onClick: stop,
    onMouseDown: stop,
    style: {
      position: "fixed",
      top: menuPos.top,
      right: menuPos.right,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
      zIndex: 9999,
      minWidth: 220,
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\uD83D\uDC41",
    label: "Aper\xE7u PDF",
    onClick: async () => {
      setMenuOpen(false);
      if (!window.HubCommercialPdf) {
        if (window.HubToast) window.HubToast.error("Module PDF non chargé — rechargez la page");
        return;
      }
      try {
        await window.HubCommercialPdf.preview(doc.id);
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur PDF : " + (e.message || e));
      }
    }
  }), /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\u21E9",
    label: "T\xE9l\xE9charger PDF",
    onClick: () => {
      setMenuOpen(false);
      downloadPdf();
    }
  }), /*#__PURE__*/React.createElement(MenuDivider, null), /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\uD83D\uDCCB",
    label: "Dupliquer",
    onClick: () => {
      setMenuOpen(false);
      duplicate();
    }
  }), doc.type === "devis" && doc.status !== "accepte" && /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\u2713",
    label: "Marquer accept\xE9",
    onClick: () => {
      setMenuOpen(false);
      quickStatus("accepte", "Accepté");
    }
  }), doc.type === "devis" && doc.status !== "refuse" && /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\u2715",
    label: "Marquer refus\xE9",
    onClick: () => {
      setMenuOpen(false);
      quickStatus("refuse", "Refusé");
    }
  }), doc.type === "facture" && doc.status !== "paye" && /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\uD83D\uDCB6",
    label: "Marquer pay\xE9e",
    onClick: () => {
      setMenuOpen(false);
      quickStatus("paye", "Payée");
    }
  }), doc.type === "bl" && doc.status !== "livre" && /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\uD83D\uDE9A",
    label: "Marquer livr\xE9",
    onClick: () => {
      setMenuOpen(false);
      quickStatus("livre", "Livré");
    }
  }), /*#__PURE__*/React.createElement(MenuDivider, null), /*#__PURE__*/React.createElement(MenuItem, {
    icon: "\uD83D\uDDD1",
    label: "Supprimer",
    danger: true,
    onClick: () => {
      setMenuOpen(false);
      remove();
    }
  }))));
};

// ─────────────────────────────────────────────────────────────────
// WorkflowChain — Affiche l'état Devis→Commande→BL→Facture en mini-pills
// ─────────────────────────────────────────────────────────────────
var WorkflowChain = ({
  chain,
  currentType
}) => {
  var STEPS = [{
    k: "devis",
    label: "D",
    title: "Devis",
    color: "#3b82f6"
  }, {
    k: "commande",
    label: "C",
    title: "Commande",
    color: "#a855f7"
  }, {
    k: "bl",
    label: "B",
    title: "BL",
    color: "#ea580c"
  }, {
    k: "facture",
    label: "F",
    title: "Facture",
    color: "#10b981"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2
    }
  }, STEPS.map((s, i) => {
    var doc = chain && chain[s.k];
    var isCurrent = s.k === currentType;
    var exists = !!doc;
    var isPaid = exists && doc.status === "paye";
    var isLivre = exists && doc.status === "livre";
    var isAccepted = exists && doc.status === "accepte";
    var isTransforme = exists && doc.status === "transforme";
    var isCancelled = exists && (doc.status === "annule" || doc.status === "refuse");
    // Couleur : vert si validé/terminé, couleur stage si en cours, gris si pas créé
    var bg = !exists ? "#f1f5f9" : isCancelled ? "#fee2e2" : isPaid || isLivre || isAccepted || isTransforme ? s.color : s.color + "30";
    var color = !exists ? "#cbd5e1" : isCancelled ? "#991b1b" : isPaid || isLivre || isAccepted || isTransforme ? "#fff" : s.color;
    var border = isCurrent ? "2px solid #0f172a" : "1px solid " + (exists ? s.color : "#e2e8f0");
    var tooltip = exists ? s.title + " " + doc.id + " · " + doc.status : s.title + " — non créé";
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s.k
    }, /*#__PURE__*/React.createElement("span", {
      title: tooltip,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 6,
        background: bg,
        color,
        border,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, s.label), i < STEPS.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: chain && chain[STEPS[i + 1].k] ? "#10b981" : "#cbd5e1"
      }
    }, "\u203A"));
  }));
};
var MenuItem = ({
  icon,
  label,
  onClick,
  danger
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    border: 0,
    background: "transparent",
    fontSize: 12.5,
    color: danger ? "#dc2626" : "#0f172a",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 5
  },
  onMouseEnter: e => e.currentTarget.style.background = danger ? "#fee2e2" : "#f1f5f9",
  onMouseLeave: e => e.currentTarget.style.background = "transparent"
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 16
  }
}, icon), label);
var MenuDivider = () => /*#__PURE__*/React.createElement("div", {
  style: {
    height: 1,
    background: "#eef1f5",
    margin: "2px 6px"
  }
});
var KPI = ({
  label,
  value,
  color
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
    fontWeight: 600
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 18,
    fontWeight: 700,
    color: color || "#0f172a",
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace"
  }
}, value));

// ─────────────────────────────────────────────────────────────────
// EDITOR : édition d'un doc + ses lignes
// ─────────────────────────────────────────────────────────────────
var CommercialDocEditor = ({
  doc,
  clients,
  opps,
  chain,
  onClose,
  onSaved
}) => {
  var [d, setD] = React.useState(doc);
  var [articles, setArticles] = React.useState([]);
  var [tvaRates, setTvaRates] = React.useState([]);
  var [paymentTerms, setPaymentTerms] = React.useState([]);
  var [suppliers, setSuppliers] = React.useState([]);
  var [saving, setSaving] = React.useState(false);
  var [sendOpen, setSendOpen] = React.useState(false);
  var reloadSuppliers = React.useCallback(async () => {
    try {
      setSuppliers((await window.api.suppliers.list({
        active: true
      })) || []);
    } catch (e) {}
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        setArticles((await window.api.commercialArticles.list({
          active: true
        })) || []);
      } catch (e) {}
      try {
        setTvaRates((await window.api.commercialRefs.tvaRates()) || []);
      } catch (e) {}
      try {
        setPaymentTerms((await window.api.commercialRefs.paymentTerms()) || []);
      } catch (e) {}
      reloadSuppliers();
    })();
  }, [reloadSuppliers]);

  // Si on ouvre un doc existant avec un client mais sans contact rempli,
  // on récupère le contact principal pour pré-remplir contact_name + email
  React.useEffect(() => {
    if (!d.client_id) return;
    if (d.contact_name && d.contact_email) return;
    (async () => {
      try {
        var contacts = await window.api.contacts.list({
          client_id: d.client_id
        });
        var principal = (contacts || []).find(ct => ct.is_principal) || (contacts || [])[0];
        if (principal) {
          var fullName = [principal.prenom, principal.nom].filter(Boolean).join(" ").trim();
          setD(cur => ({
            ...cur,
            contact_name: cur.contact_name || fullName || null,
            contact_email: cur.contact_email || principal.email || null
          }));
        }
      } catch (e) {}
    })();
  }, [d.client_id]);
  var setField = (k, v) => setD(cur => ({
    ...cur,
    [k]: v
  }));
  var pickClient = async clientId => {
    var c = clients.find(x => x.id === clientId);
    if (!c) {
      setField("client_id", null);
      return;
    }
    setD(cur => ({
      ...cur,
      client_id: c.id,
      client_name: c.raison_sociale || c.name,
      client_address: c.adresse || c.address || "",
      client_cp: c.cp || c.code_postal || "",
      client_city: c.ville || c.city || "",
      client_siren: c.siren || "",
      client_tva: c.tva || c.tva_intracom || ""
    }));
    // Récupère le contact principal du client → pré-remplit contact_name + contact_email
    try {
      var contacts = await window.api.contacts.list({
        client_id: c.id
      });
      var principal = (contacts || []).find(ct => ct.is_principal) || (contacts || [])[0];
      if (principal) {
        var fullName = [principal.prenom, principal.nom].filter(Boolean).join(" ").trim();
        setD(cur => ({
          ...cur,
          contact_name: fullName || cur.contact_name,
          contact_email: principal.email || cur.contact_email
        }));
      }
    } catch (e) {
      // Fallback : si la fiche client a un contact_principal dans son data jsonb
      if (c.contact_principal) {
        var cp = c.contact_principal;
        var _fullName = [cp.prenom, cp.nom].filter(Boolean).join(" ").trim();
        setD(cur => ({
          ...cur,
          contact_name: _fullName || cur.contact_name,
          contact_email: cp.email || cur.contact_email
        }));
      }
    }
  };
  var addLine = article => {
    var line = article ? {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      article_id: article.id,
      ref: article.ref,
      designation: article.name,
      description: article.description || "",
      quantity: 1,
      unit: article.unit || "u",
      unit_price_ht: Number(article.price_ht) || 0,
      discount_pct: 0,
      tva_rate: Number(article.tva_rate) || 20,
      _new: true
    } : {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      designation: "",
      quantity: 1,
      unit: "u",
      unit_price_ht: 0,
      discount_pct: 0,
      tva_rate: 20,
      _new: true
    };
    line.total_ht = line.quantity * line.unit_price_ht * (1 - line.discount_pct / 100);
    line.total_tva = line.total_ht * line.tva_rate / 100;
    line.total_ttc = line.total_ht + line.total_tva;
    setD(cur => ({
      ...cur,
      lines: [...(cur.lines || []), line]
    }));
  };
  var updateLineField = (idx, k, v) => {
    setD(cur => {
      var lines = [...(cur.lines || [])];
      var l = {
        ...lines[idx],
        [k]: v
      };
      var qty = Number(l.quantity) || 0;
      var pu = Number(l.unit_price_ht) || 0;
      var disc = Number(l.discount_pct) || 0;
      var tvaR = Number(l.tva_rate) != null ? Number(l.tva_rate) : 20;
      l.total_ht = Math.round(qty * pu * (1 - disc / 100) * 100) / 100;
      l.total_tva = Math.round(l.total_ht * tvaR / 100 * 100) / 100;
      l.total_ttc = Math.round((l.total_ht + l.total_tva) * 100) / 100;
      lines[idx] = l;
      return {
        ...cur,
        lines
      };
    });
  };
  var removeLine = async idx => {
    var line = d.lines[idx];
    if (line && line.id && !String(line.id).startsWith("tmp_")) {
      try {
        await window.api.commercialDocs.removeLine(line.id);
      } catch (e) {}
    }
    setD(cur => ({
      ...cur,
      lines: cur.lines.filter((_, i) => i !== idx)
    }));
  };

  // Déplace une ligne d'un cran (delta = -1 monter / +1 descendre).
  // Met aussi à jour line.position pour cohérence avec la BDD ; la sauvegarde
  // effective survient au prochain Save (ou au Cascade).
  var moveLine = (idx, delta) => {
    setD(cur => {
      var lines = [...(cur.lines || [])];
      var j = idx + delta;
      if (j < 0 || j >= lines.length) return cur;
      [lines[idx], lines[j]] = [lines[j], lines[idx]];
      lines.forEach((l, i) => {
        l.position = i + 1;
      });
      return {
        ...cur,
        lines
      };
    });
  };

  // Duplique la ligne juste en dessous. Le nouvel id est temporaire
  // (tmp_…), il sera créé en BDD au prochain Save.
  var duplicateLine = idx => {
    setD(cur => {
      var lines = [...(cur.lines || [])];
      var src = lines[idx];
      if (!src) return cur;
      var clone = {
        ...src,
        id: "tmp_" + Math.random().toString(36).slice(2, 10)
      };
      lines.splice(idx + 1, 0, clone);
      lines.forEach((l, i) => {
        l.position = i + 1;
      });
      return {
        ...cur,
        lines
      };
    });
  };

  // Totaux calculés à la volée
  var totals = React.useMemo(() => {
    var ht = 0,
      tva = 0;
    (d.lines || []).forEach(l => {
      if (l.is_text_only) return;
      ht += Number(l.total_ht) || 0;
      tva += Number(l.total_tva) || 0;
    });
    return {
      ht: Math.round(ht * 100) / 100,
      tva: Math.round(tva * 100) / 100,
      ttc: Math.round((ht + tva) * 100) / 100
    };
  }, [d.lines]);
  var save = async (options = {}) => {
    setSaving(true);
    try {
      // Normalisation : pas de string vide pour les FKs (sinon erreur Supabase)
      var cleanFK = v => v && String(v).trim() ? v : null;
      var cleanDate = v => v && String(v).trim() ? v : null;
      var numOrNull = v => {
        var n = Number(v);
        return isFinite(n) ? n : null;
      };

      // 1. Update du doc principal (hors lignes)
      var patch = {
        status: d.status,
        title: d.title || null,
        notes: d.notes || null,
        internal_notes: d.internal_notes || null,
        client_id: cleanFK(d.client_id),
        client_name: d.client_name || null,
        client_address: d.client_address || null,
        client_cp: d.client_cp || null,
        client_city: d.client_city || null,
        client_siren: d.client_siren || null,
        client_tva: d.client_tva || null,
        contact_name: d.contact_name || null,
        contact_email: d.contact_email || null,
        project_id: cleanFK(d.project_id),
        opportunity_id: cleanFK(d.opportunity_id),
        doc_date: cleanDate(d.doc_date) || new Date().toISOString().slice(0, 10),
        valid_until: cleanDate(d.valid_until),
        payment_due: cleanDate(d.payment_due),
        payment_terms_id: cleanFK(d.payment_terms_id),
        owner: d.owner || null,
        total_ht: numOrNull(totals.ht) || 0,
        total_tva: numOrNull(totals.tva) || 0,
        total_ttc: numOrNull(totals.ttc) || 0
      };
      await window.api.commercialDocs.update(d.id, patch);

      // 2. Lignes : insère les nouvelles avec conversion Number + ré-hydrate les ids
      var updatedLines = [];
      for (var i = 0; i < (d.lines || []).length; i++) {
        var line = d.lines[i];
        var normalizedLine = {
          article_id: cleanFK(line.article_id),
          ref: line.ref || null,
          designation: line.designation || "",
          description: line.description || null,
          quantity: Number(line.quantity) || 0,
          unit: line.unit || "u",
          unit_price_ht: Number(line.unit_price_ht) || 0,
          discount_pct: Number(line.discount_pct) || 0,
          tva_rate: Number(line.tva_rate) || 0,
          is_text_only: !!line.is_text_only,
          position: i,
          // Champs internes (jamais sur PDF client)
          manufacturer_ref: line.manufacturer_ref || null,
          purchase_price_indicative: line.purchase_price_indicative == null ? null : Number(line.purchase_price_indicative),
          supplier: line.supplier || null
        };
        if (line._new || String(line.id || "").startsWith("tmp_")) {
          var created = await window.api.commercialDocs.addLine(d.id, normalizedLine);
          if (created) updatedLines.push(created);
        } else {
          var updated = await window.api.commercialDocs.updateLine(line.id, normalizedLine);
          if (updated) updatedLines.push(updated);else updatedLines.push(line);
        }
      }
      // Met à jour le state local avec les vrais IDs (au cas où l'utilisateur ne ferme pas)
      setD(cur => ({
        ...cur,
        lines: updatedLines
      }));
      if (window.HubToast) window.HubToast.success("✓ Document enregistré");
      onSaved && onSaved();
      if (!options.keepOpen) {
        // Si ?returnTo=URL dans la query, on y retourne plutôt que de fermer.
        // SÉCURITÉ : whitelist same-origin (empêche open redirect vers phishing).
        // le modal (ex: depuis AdvanceOpportunity → édition devis → save → retour pipeline)
        var params = new URLSearchParams(window.location.search);
        var returnTo = params.get("returnTo");
        // N'accepte que les URLs relatives same-origin (commence par "/" et pas par "//")
        var safeReturn = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null;
        if (safeReturn) {
          setTimeout(() => {
            window.location.href = safeReturn;
          }, 400);
        } else {
          onClose && onClose();
        }
      }
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      throw e;
    }
    setSaving(false);
  };

  // ─── Portes de validation Sage : un doc ne peut passer à l'étape suivante
  //     que si son statut est conforme. Évite que brouillon→commande→BL→facture
  //     puisse se faire en chaîne sans aucune validation intermédiaire.
  var TRANSITION_REQ = {
    devis: {
      next: "commande",
      requires: "accepte",
      reqLabel: "Accepté"
    },
    commande: {
      next: "bl",
      requires: "accepte",
      reqLabel: "Accepté"
    },
    bl: {
      next: "facture",
      requires: "livre",
      reqLabel: "Livré"
    }
  };
  var canTransform = (() => {
    var rule = TRANSITION_REQ[d.type];
    if (!rule) return {
      ok: false,
      hard: true,
      reason: "Aucune étape suivante (document final)"
    };
    if (d.status === "transforme") return {
      ok: false,
      hard: true,
      reason: "Ce document a déjà été transformé"
    };
    if (d.status === "refuse" || d.status === "annule") return {
      ok: false,
      hard: true,
      reason: "Document " + (d.status === "refuse" ? "refusé" : "annulé") + " — transformation impossible"
    };
    if (d.status !== rule.requires) {
      // Bloqué doux : statut peut être mis à jour automatiquement pour passer
      return {
        ok: false,
        hard: false,
        reason: "Statut requis : « " + rule.reqLabel + " ». Actuellement : « " + d.status + " »",
        needStatus: rule.requires,
        needStatusLbl: rule.reqLabel,
        nextType: rule.next
      };
    }
    return {
      ok: true,
      nextType: rule.next
    };
  })();
  var transformTo = async () => {
    // Si bloqué dur (déjà transformé/refusé/annulé) → on s'arrête
    if (!canTransform.ok && canTransform.hard) {
      if (window.HubToast) window.HubToast.error("Transformation refusée — " + canTransform.reason);else alert("Transformation refusée : " + canTransform.reason);
      return;
    }
    var next = canTransform.nextType;
    var labels = {
      commande: "bon de commande",
      bl: "bon de livraison",
      facture: "facture"
    };
    // Cascade pour un devis : devis → commande → BL en un seul clic
    if (d.type === "devis") {
      var confirmMsg = !canTransform.ok && !canTransform.hard ? "Le devis est en « " + d.status + " ». Le passer en « Accepté » puis cascader en Commande et BL ?\n\n• Devis marqué Accepté\n• Commande créée et marquée Acceptée\n• BL créé\n• Commande d'achat fournisseur générée" : "Cascader ce devis en Commande puis BL ?\n\n• Commande créée et marquée Acceptée\n• BL créé\n• Commande d'achat fournisseur générée";
      if (!confirm(confirmMsg)) return;
      try {
        if (!canTransform.ok && !canTransform.hard) setField("status", canTransform.needStatus);
        await save({
          keepOpen: true
        });
        if (d.status !== "accepte") await window.api.commercialDocs.update(d.id, {
          status: "accepte"
        });
        var commande = await window.api.commercialDocs.transform(d.id, "commande");
        if (!commande) throw new Error("Échec création commande");
        await window.api.commercialDocs.update(commande.id, {
          status: "accepte"
        });
        var bl = await window.api.commercialDocs.transform(commande.id, "bl");
        if (window.HubToast) window.HubToast.success("✓ " + commande.id + " + " + (bl ? bl.id : "") + " créés");
        onSaved && onSaved();
        onClose && onClose();
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur cascade : " + (e.message || e));
      }
      return;
    }
    // Cas "blocage doux" : on propose d'updater le statut et transformer
    if (!canTransform.ok && !canTransform.hard) {
      var ok = confirm("Le " + d.type + " est actuellement en « " + d.status + " ».\n\nPour le transformer en " + labels[next] + ", il doit d'abord être marqué « " + canTransform.needStatusLbl + " ».\n\n• Cliquer OK : on bascule le statut sur « " + canTransform.needStatusLbl + " » puis on crée le " + labels[next] + ".\n• Annuler : aucun changement.");
      if (!ok) return;
      try {
        setField("status", canTransform.needStatus);
        await save({
          keepOpen: true
        });
        var child = await window.api.commercialDocs.transform(d.id, next);
        if (window.HubToast) window.HubToast.success("✓ Statut → " + canTransform.needStatusLbl + " · " + child.id + " créé");
        onSaved && onSaved();
        onClose && onClose();
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      }
      return;
    }
    // Cas nominal : statut OK
    if (!confirm("Transformer ce " + d.type + " (statut « " + d.status + " ») en " + labels[next] + " ?\n\n• Le " + d.type + " sera figé avec le statut « Transformé » et ne pourra plus être modifié.\n• Un nouveau document " + next + " sera créé en brouillon.\n• Les modifications en cours seront sauvegardées avant.")) return;
    try {
      await save({
        keepOpen: true
      });
      var _child = await window.api.commercialDocs.transform(d.id, next);
      if (window.HubToast) window.HubToast.success("✓ " + _child.id + " créé · " + d.id + " figé en Transformé");
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var fmtEUR = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
  return /*#__PURE__*/React.createElement("div", {
    style: cdStyles.modalOverlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: cdStyles.modalCard,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("header", {
    style: cdStyles.modalHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "uppercase"
    }
  }, d.type), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, d.id)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        await save({
          keepOpen: true
        });
        if (window.HubCommercialPdf) await window.HubCommercialPdf.preview(d.id);
      } catch (e) {}
    },
    style: cdStyles.ghostBtn,
    title: "G\xE9n\xE8re le PDF et l'ouvre"
  }, "\uD83D\uDC41 Aper\xE7u PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        await save({
          keepOpen: true
        });
        if (window.HubCommercialPdf) await window.HubCommercialPdf.download(d.id);
        try {
          await window.api.commercialSends.log({
            doc_id: d.id,
            doc_type: d.type,
            channel: "download",
            status: "sent",
            provider: "browser"
          });
        } catch (e) {}
      } catch (e) {}
    },
    style: cdStyles.ghostBtn
  }, "\u21E9 T\xE9l\xE9charger PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        await save({
          keepOpen: true
        });
        setSendOpen(true);
      } catch (e) {}
    },
    style: cdStyles.ghostBtn
  }, "\u2709 Envoyer"), d.type !== "facture" && d.status !== "transforme" && (() => {
    // 2 états visuels : Cliquable (vert sur vert) · Hard-block (gris, désactivé)
    // Le soft-block (statut pas conforme) reste vert et cliquable :
    // le clic propose alors de basculer le statut automatiquement.
    var isHard = !canTransform.ok && canTransform.hard; // figé/annulé/refusé
    return /*#__PURE__*/React.createElement("button", {
      onClick: transformTo,
      disabled: isHard,
      title: canTransform.ok ? "Transformer ce document à l'étape suivante" : isHard ? "Bloqué : " + canTransform.reason : "Cliquer pour basculer le statut sur « " + canTransform.needStatusLbl + " » et transformer",
      style: {
        ...cdStyles.ghostBtn,
        opacity: isHard ? 0.45 : 1,
        cursor: isHard ? "not-allowed" : "pointer",
        borderColor: isHard ? "#e2e8f0" : "#10b981",
        color: isHard ? "#94a3b8" : "#065f46",
        background: isHard ? "#fff" : "#ecfdf5",
        fontWeight: 600
      }
    }, isHard ? "🔒 " : "✓ ", "Transformer en ", {
      devis: "commande",
      commande: "BL",
      bl: "facture"
    }[d.type]);
  })(), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: saving,
    style: cdStyles.primaryBtn
  }, saving ? "Enregistrement…" : "Enregistrer"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: cdStyles.closeBtn
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    style: cdStyles.modalBody
  }, /*#__PURE__*/React.createElement(WorkflowBar, {
    doc: d,
    canTransform: canTransform,
    chain: chain
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Client"), /*#__PURE__*/React.createElement("select", {
    value: d.client_id || "",
    onChange: e => pickClient(e.target.value),
    style: cdStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 S\xE9lectionner \u2014"), clients.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.raison_sociale || c.name))), /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search),
    target: "_blank",
    rel: "noopener",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      padding: "6px 10px",
      background: "#eef2ff",
      color: "#3730a3",
      border: "1px solid #c7d2fe",
      borderRadius: 6,
      fontSize: 11.5,
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer"
    },
    title: "Ouvrir la fiche de cr\xE9ation de prospect dans un nouvel onglet"
  }, "+ Nouveau prospect"), d.client_address && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: 8,
      background: "#f8fafc",
      borderRadius: 6,
      fontSize: 11,
      color: "#475569"
    }
  }, d.client_address, /*#__PURE__*/React.createElement("br", null), d.client_cp, " ", d.client_city, d.client_siren ? " · SIREN " + d.client_siren : "")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Titre du document"), /*#__PURE__*/React.createElement("input", {
    value: d.title || "",
    onChange: e => setField("title", e.target.value),
    placeholder: "Ex : Devis migration AD AXA",
    style: cdStyles.input
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Date document"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: d.doc_date || "",
    onChange: e => setField("doc_date", e.target.value),
    style: cdStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, d.type === "devis" ? "Valide jusqu'au" : d.type === "facture" ? "Échéance paiement" : "Date prévue"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: (d.type === "devis" ? d.valid_until : d.payment_due) || "",
    onChange: e => setField(d.type === "devis" ? "valid_until" : "payment_due", e.target.value),
    style: cdStyles.input
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Rattacher \xE0 une opportunit\xE9 (\u2264 30 jours)"), /*#__PURE__*/React.createElement("select", {
    value: d.opportunity_id || "",
    onChange: e => {
      var oppId = e.target.value || null;
      setField("opportunity_id", oppId);
      // Si on sélectionne une opp ET qu'aucun client n'est encore choisi,
      // on récupère le client de l'opp
      if (oppId && !d.client_id) {
        var opp = opps.find(o => o.id === oppId);
        if (opp && opp.client_id) {
          var c = clients.find(c => c.id === opp.client_id);
          if (c) pickClient(c.id);
        }
      }
    },
    style: cdStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Aucune \u2014"), opps.map(o => {
    var stages = {
      qualif: "Prospect",
      discovery: "Approche",
      propo: "Négociation",
      nego: "Conclusion"
    };
    var stageLbl = stages[o.stage] || o.stage;
    return /*#__PURE__*/React.createElement("option", {
      key: o.id,
      value: o.id
    }, o.name || o.id, " \xB7 ", o.client_name || "—", " (", stageLbl, ")");
  })), opps.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, "Aucune opportunit\xE9 ouverte des 30 derniers jours") : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, opps.length, " opp(s) r\xE9cente(s) du pipeline ouvert")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Statut"), (() => {
    // Workflow Sage : statuts autorisés et transitions valides selon le type
    var STATUS_FLOW = {
      devis: ["brouillon", "envoye", "accepte", "refuse", "transforme", "annule"],
      commande: ["brouillon", "envoye", "accepte", "refuse", "transforme", "annule"],
      bl: ["brouillon", "envoye", "livre", "transforme", "annule"],
      facture: ["brouillon", "envoye", "paye", "annule"]
    };
    var STATUS_LABEL = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      transforme: "Transformé (figé)",
      livre: "Livré",
      paye: "Payé",
      annule: "Annulé"
    };
    var allowed = STATUS_FLOW[d.type] || [];
    var isLocked = d.status === "transforme";
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("select", {
      value: d.status,
      onChange: e => {
        var next = e.target.value;
        // Garde-fou : avertit avant de quitter « Transformé »
        if (isLocked && next !== "transforme") {
          if (!confirm("⚠ Ce document a déjà été transformé en " + (d.type === "devis" ? "commande" : d.type === "commande" ? "BL" : "facture") + ".\n\nDébloquer son statut peut créer une incohérence avec le document enfant déjà émis.\n\nContinuer et passer au statut « " + (STATUS_LABEL[next] || next) + " » ?")) return;
        }
        setField("status", next);
      },
      style: {
        ...cdStyles.input,
        background: isLocked ? "#fef3c7" : "#fff",
        borderColor: isLocked ? "#f59e0b" : "#cbd5e1",
        cursor: "pointer"
      }
    }, allowed.map(st => /*#__PURE__*/React.createElement("option", {
      key: st,
      value: st
    }, STATUS_LABEL[st] || st))), isLocked && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (!confirm("Débloquer le statut « Transformé » et le repasser à « Accepté » ?\n\nAttention : le document enfant (commande/BL/facture) déjà généré reste en place. À toi de gérer la cohérence.")) return;
        setField("status", "accepte");
      },
      style: {
        marginTop: 4,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        background: "transparent",
        color: "#b45309",
        border: "1px solid #fcd34d",
        borderRadius: 5,
        cursor: "pointer"
      }
    }, "\uD83D\uDD13 D\xE9bloquer le statut"));
  })()), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Conditions de paiement"), /*#__PURE__*/React.createElement("select", {
    value: d.payment_terms_id || "",
    onChange: e => setField("payment_terms_id", e.target.value || null),
    style: cdStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir \u2014"), paymentTerms.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.label))))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Lignes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, (d.lines || []).length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      border: "1px dashed #cbd5e1",
      borderRadius: 8,
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 12.5,
      background: "#fafbfc"
    }
  }, "Aucune ligne pour le moment. Ajoute une ligne libre ou choisis dans le catalogue ci-dessous."), (d.lines || []).map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: l.id || i,
    style: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 6,
      background: "#eef2ff",
      color: "#3730a3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0
    }
  }, i + 1), /*#__PURE__*/React.createElement("input", {
    value: l.ref || "",
    onChange: e => updateLineField(i, "ref", e.target.value),
    placeholder: "N\xB0 Article",
    title: "Num\xE9ro / r\xE9f\xE9rence article \u2014 appara\xEEt dans la colonne \xAB Article \xBB du PDF",
    style: {
      width: 140,
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
      color: "#3730a3",
      textTransform: "uppercase",
      flexShrink: 0,
      background: l.ref ? "#eef2ff" : "#fff"
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: l.designation || "",
    onChange: e => updateLineField(i, "designation", e.target.value),
    placeholder: "D\xE9signation de la ligne (ex : Astorya Suite \u2014 Licence utilisateur)",
    style: {
      flex: 1,
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 13,
      fontFamily: "inherit",
      fontWeight: 500,
      color: "#0f172a"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 130,
      textAlign: "right",
      padding: "8px 12px",
      background: "#f8fafc",
      border: "1px solid #eef1f5",
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Total HT"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtEUR(l.total_ht))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => moveLine(i, -1),
    disabled: i === 0,
    title: "Monter cette ligne",
    style: {
      width: 32,
      height: 15,
      background: "#fff",
      border: "1px solid #e2e8f0",
      color: i === 0 ? "#cbd5e1" : "#475569",
      fontSize: 10,
      cursor: i === 0 ? "not-allowed" : "pointer",
      borderRadius: "6px 6px 0 0",
      padding: 0,
      lineHeight: 1,
      fontWeight: 700
    }
  }, "\u25B2"), /*#__PURE__*/React.createElement("button", {
    onClick: () => moveLine(i, +1),
    disabled: i === (d.lines || []).length - 1,
    title: "Descendre cette ligne",
    style: {
      width: 32,
      height: 15,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderTop: 0,
      color: i === (d.lines || []).length - 1 ? "#cbd5e1" : "#475569",
      fontSize: 10,
      cursor: i === (d.lines || []).length - 1 ? "not-allowed" : "pointer",
      borderRadius: "0 0 6px 6px",
      padding: 0,
      lineHeight: 1,
      fontWeight: 700
    }
  }, "\u25BC")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => removeLine(i),
    title: "Supprimer la ligne",
    style: {
      width: 32,
      height: 32,
      background: "#fff",
      border: "1px solid #fecaca",
      color: "#dc2626",
      fontSize: 14,
      cursor: "pointer",
      borderRadius: 6
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("button", {
    onClick: () => duplicateLine(i),
    title: "Dupliquer la ligne en dessous",
    style: {
      width: 32,
      height: 32,
      background: "#fff",
      border: "1px solid #c7d2fe",
      color: "#3730a3",
      fontSize: 14,
      cursor: "pointer",
      borderRadius: 6
    }
  }, "\u2398"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "\uD83D\uDCDD Description (champ libre)", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 9.5,
      fontWeight: 500,
      color: "#94a3b8",
      fontStyle: "italic"
    }
  }, "appara\xEEtra sous la d\xE9signation sur le PDF")), /*#__PURE__*/React.createElement(RichDescriptionEditor, {
    value: l.description || "",
    onChange: html => updateLineField(i, "description", html),
    placeholder: "Ex. caract\xE9ristiques techniques, conditions, r\xE9f\xE9rences produit\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "100px 110px 1fr 110px 110px",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.001",
    value: l.quantity,
    onChange: e => updateLineField(i, "quantity", e.target.value),
    style: cdStyles.miniInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "Unit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: l.unit || "u",
    onChange: e => updateLineField(i, "unit", e.target.value),
    style: cdStyles.miniInput
  }, /*#__PURE__*/React.createElement("option", {
    value: "u"
  }, "u (unit\xE9)"), /*#__PURE__*/React.createElement("option", {
    value: "h"
  }, "h (heure)"), /*#__PURE__*/React.createElement("option", {
    value: "j"
  }, "j (journ\xE9e)"), /*#__PURE__*/React.createElement("option", {
    value: "mois"
  }, "mois"), /*#__PURE__*/React.createElement("option", {
    value: "an"
  }, "an"), /*#__PURE__*/React.createElement("option", {
    value: "forfait"
  }, "forfait"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "Prix unitaire HT"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: l.unit_price_ht,
    onChange: e => updateLineField(i, "unit_price_ht", e.target.value),
    style: {
      ...cdStyles.miniInput,
      paddingRight: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 11,
      color: "#94a3b8",
      pointerEvents: "none"
    }
  }, "\u20AC"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "Remise"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    min: "0",
    max: "100",
    value: l.discount_pct == null ? "" : l.discount_pct,
    onFocus: e => e.target.select(),
    onChange: e => updateLineField(i, "discount_pct", e.target.value === "" ? 0 : Number(e.target.value)),
    style: {
      ...cdStyles.miniInput,
      paddingRight: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 11,
      color: "#94a3b8",
      pointerEvents: "none"
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.miniLbl
  }, "TVA"), /*#__PURE__*/React.createElement("select", {
    value: l.tva_rate,
    onChange: e => updateLineField(i, "tva_rate", e.target.value),
    style: cdStyles.miniInput
  }, tvaRates.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.rate,
    value: t.rate
  }, t.rate, " %"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 220px 180px",
      gap: 10,
      marginTop: 8,
      padding: "8px 10px",
      background: "#fafbfc",
      borderRadius: 6,
      border: "1px dashed #e2e8f0"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      ...cdStyles.miniLbl,
      color: "#94a3b8"
    }
  }, "\uD83D\uDD12 R\xE9f\xE9rence constructeur ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 500,
      fontStyle: "italic"
    }
  }, "(interne \u2014 non imprim\xE9e)")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: l.manufacturer_ref || "",
    onChange: e => updateLineField(i, "manufacturer_ref", e.target.value),
    placeholder: "ex. HP-EB840-G11-A26S0EA",
    style: {
      ...cdStyles.miniInput,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11.5
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      ...cdStyles.miniLbl,
      color: "#94a3b8"
    }
  }, "\uD83D\uDD12 Fournisseur ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 500,
      fontStyle: "italic"
    }
  }, "(interne)")), window.HubSupplierCombo ? React.createElement(window.HubSupplierCombo, {
    value: l.supplier || "",
    suppliers: suppliers,
    cellInput: {
      ...cdStyles.miniInput,
      fontSize: 12,
      fontWeight: 600
    },
    onChange: v => updateLineField(i, "supplier", v || null),
    onSuppliersChanged: reloadSuppliers,
    placeholder: "— Choisir —"
  }) : /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: l.supplier || "",
    onChange: e => updateLineField(i, "supplier", e.target.value || null),
    placeholder: "ex. INMAC, LDLC PRO\u2026",
    style: cdStyles.miniInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      ...cdStyles.miniLbl,
      color: "#94a3b8"
    }
  }, "\uD83D\uDD12 Prix d'achat indicatif ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 500,
      fontStyle: "italic"
    }
  }, "(interne)")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: l.purchase_price_indicative == null ? "" : l.purchase_price_indicative,
    onChange: e => updateLineField(i, "purchase_price_indicative", e.target.value === "" ? null : Number(e.target.value)),
    placeholder: "ex. 850.00",
    style: {
      ...cdStyles.miniInput,
      paddingRight: 26,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 11,
      color: "#94a3b8",
      pointerEvents: "none"
    }
  }, "\u20AC")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 8px",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => addLine(null),
    style: cdStyles.ghostBtn
  }, "+ Ligne libre"), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) {
        addLine(articles.find(a => a.id === e.target.value));
        e.target.value = "";
      }
    },
    style: {
      ...cdStyles.input,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Ajouter article du catalogue\u2026"), articles.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.ref, " \u2014 ", a.name, " (", fmtEUR(a.price_ht), ")"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#f8fafc",
      border: "1px solid #eef1f5",
      borderRadius: 10,
      padding: 14,
      minWidth: 280
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#475569",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total HT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600
    }
  }, fmtEUR(totals.ht))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#475569",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "TVA"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600
    }
  }, fmtEUR(totals.tva))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #e2e8f0",
      marginTop: 6,
      paddingTop: 6,
      display: "flex",
      justifyContent: "space-between",
      fontSize: 14,
      color: "#0f172a",
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total TTC"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtEUR(totals.ttc))))), /*#__PURE__*/React.createElement(DocSendHistory, {
    docId: d.id
  }))), sendOpen && /*#__PURE__*/React.createElement(DocSendModal, {
    doc: d,
    onSave: save,
    onClose: () => setSendOpen(false)
  }));
};

// ─────────────────────────────────────────────────────────────────
// Historique des envois d'un doc (depuis commercial_doc_sends)
// ─────────────────────────────────────────────────────────────────
var DocSendHistory = ({
  docId
}) => {
  var [list, setList] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        setList((await window.api.commercialSends.list({
          doc_id: docId
        })) || []);
      } catch (e) {}
    })();
  }, [docId]);
  if (list.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 14,
      background: "#f8fafc",
      border: "1px solid #eef1f5",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#475569",
      marginBottom: 8
    }
  }, "\u2709 Historique des envois (", list.length, ")"), list.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "6px 0",
      fontSize: 12,
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 999,
      background: s.status === "sent" ? "#10b981" : s.status === "failed" ? "#dc2626" : "#94a3b8"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#64748b"
    }
  }, new Date(s.sent_at).toLocaleString("fr-FR")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: "#0f172a"
    }
  }, s.channel === "email" ? "✉ " + (s.recipient_email || "—") : s.channel === "download" ? "⇩ Téléchargement" : s.channel), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 4,
      background: s.status === "sent" ? "#dcfce7" : "#f1f5f9",
      color: s.status === "sent" ? "#065f46" : "#475569",
      fontWeight: 600
    }
  }, s.status), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "par ", s.sent_by_name || "—"))));
};

// ─────────────────────────────────────────────────────────────────
// Modal "Envoyer le doc par email" — log dans commercial_doc_sends
// ─────────────────────────────────────────────────────────────────
var DocSendModal = ({
  doc,
  onSave,
  onClose
}) => {
  var [recipientEmail, setRecipientEmail] = React.useState(doc.contact_email || "");
  var [recipientName, setRecipientName] = React.useState(doc.contact_name || doc.client_name || "");
  var [cc, setCc] = React.useState("");
  var TYPE_LABEL = {
    devis: "Devis",
    commande: "Bon de commande",
    bl: "Bon de livraison",
    facture: "Facture"
  };
  var typeLbl = TYPE_LABEL[doc.type] || doc.type;
  var [subject, setSubject] = React.useState(typeLbl + " " + doc.id + (doc.title ? " — " + doc.title : ""));
  var [body, setBody] = React.useState("Bonjour" + (recipientName ? " " + recipientName.split(" ")[0] : "") + ",\n\n" + "Veuillez trouver ci-joint le " + typeLbl.toLowerCase() + " " + doc.id + ".\n\n" + "N'hésitez pas à revenir vers moi pour toute question.\n\n" + "Cordialement,\n" + (doc.owner || "Romain Daviaud") + "\nAstorya");
  var [sending, setSending] = React.useState(false);
  var [aiLoading, setAiLoading] = React.useState(false);
  var [aiInstructions, setAiInstructions] = React.useState("");
  var send = async () => {
    if (!recipientEmail) {
      alert("Email destinataire requis");
      return;
    }
    var emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(recipientEmail)) {
      alert("Format email invalide : " + recipientEmail);
      return;
    }
    if (cc) {
      var ccList = cc.split(",").map(s => s.trim()).filter(Boolean);
      var bad = ccList.find(e => !emailRx.test(e));
      if (bad) {
        alert("Email CC invalide : " + bad);
        return;
      }
    }
    if (!doc.client_name) {
      if (!confirm("Le document n'a pas de client. Envoyer quand même ?")) return;
    }
    if ((doc.lines || []).length === 0) {
      if (!confirm("Le document n'a aucune ligne. Envoyer quand même ?")) return;
    }
    setSending(true);
    try {
      // Le doc a déjà été sauvé via save({keepOpen:true}) avant l'ouverture de cette modal
      var pdfBase64 = null;
      try {
        if (window.HubCommercialPdf) pdfBase64 = await window.HubCommercialPdf.toBase64(doc.id);
      } catch (e) {
        console.warn("PDF gen failed:", e);
      }

      // Téléchargement local du PDF (pour drag-drop manuel dans le mail)
      if (pdfBase64) {
        try {
          var a = document.createElement("a");
          a.href = "data:application/pdf;base64," + pdfBase64;
          a.download = doc.id + ".pdf";
          a.click();
        } catch (e) {}
      }

      // Ouvre Outlook (Web ou Desktop) avec subject/body pré-remplis
      // Office 365 deeplink — fonctionne aussi via le protocol handler outlook:
      // sur Windows si Outlook Desktop est installé.
      var bodyWithNote = body + "\n\n[Le PDF a été téléchargé localement — glissez-le en pièce jointe.]";
      var outlookUrl = "https://outlook.office.com/mail/deeplink/compose" + "?to=" + encodeURIComponent(recipientEmail) + (cc ? "&cc=" + encodeURIComponent(cc) : "") + "&subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyWithNote);
      // Ouverture dans un nouvel onglet pour ne pas perdre le contexte Hub
      window.open(outlookUrl, "_blank", "noopener");

      // Log permanent en BDD
      await window.api.commercialSends.log({
        doc_id: doc.id,
        doc_type: doc.type,
        channel: "email",
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        cc: cc || null,
        subject,
        body,
        attachment_url: pdfBase64 ? doc.id + ".pdf" : null,
        status: "sent",
        provider: "outlook_web"
      });

      // Met à jour le statut du doc → "envoye"
      if (doc.status === "brouillon") {
        try {
          await window.api.commercialDocs.update(doc.id, {
            status: "envoye"
          });
        } catch (e) {}
      }
      if (window.HubToast) window.HubToast.success("✓ Envoi enregistré — PDF téléchargé pour pièce jointe");
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSending(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: cdStyles.modalOverlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cdStyles.modalCard,
      maxWidth: 640
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("header", {
    style: cdStyles.modalHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 15,
      fontWeight: 700
    }
  }, "\u2709 Envoyer ", doc.id, " par email"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: cdStyles.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Destinataire (Nom)"), /*#__PURE__*/React.createElement("input", {
    value: recipientName,
    onChange: e => setRecipientName(e.target.value),
    style: cdStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Destinataire (Email) *"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: recipientEmail,
    onChange: e => setRecipientEmail(e.target.value),
    style: cdStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Cc (copies)"), /*#__PURE__*/React.createElement("input", {
    value: cc,
    onChange: e => setCc(e.target.value),
    placeholder: "email1@ex.com, email2@ex.com",
    style: cdStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: cdStyles.lbl
  }, "Objet"), /*#__PURE__*/React.createElement("input", {
    value: subject,
    onChange: e => setSubject(e.target.value),
    style: cdStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...cdStyles.lbl,
      marginBottom: 0
    }
  }, "Corps du message"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!window.HubAI) {
        alert("Assistant IA non chargé");
        return;
      }
      setAiLoading(true);
      try {
        // Récupère tous les docs liés à la même opp pour donner du contexte
        var relatedDocs = [doc];
        if (doc.opportunity_id) {
          try {
            var all = await window.api.commercialDocs.list({
              opportunity_id: doc.opportunity_id
            });
            relatedDocs = (all || []).filter(d => d.status !== "annule" && d.status !== "refuse");
            if (relatedDocs.length === 0) relatedDocs = [doc];
          } catch (e) {}
        }
        var newBody = await window.HubAI.generateSalesMail({
          client_name: doc.client_name,
          contact_name: recipientName,
          contact_title: doc.contact_title,
          docs: relatedDocs.map(d => ({
            id: d.id,
            type: d.type,
            title: d.title,
            total_ttc: d.total_ttc,
            status: d.status
          })),
          custom_notes: aiInstructions
        });
        if (newBody && newBody.trim()) setBody(newBody.trim());
        if (window.HubToast) window.HubToast.success("✓ Mail rédigé par Claude IA");
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur IA : " + (e.message || e));else alert("Erreur IA : " + (e.message || e));
      }
      setAiLoading(false);
    },
    disabled: aiLoading,
    style: {
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 600,
      background: "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 5,
      cursor: aiLoading ? "wait" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    },
    title: "G\xE9n\xE8re un mail commercial structur\xE9 avec Claude IA en analysant tous les devis li\xE9s \xE0 la m\xEAme opportunit\xE9"
  }, "\uD83E\uDD16 ", aiLoading ? "Rédaction…" : "Rédiger avec IA")), /*#__PURE__*/React.createElement("input", {
    value: aiInstructions,
    onChange: e => setAiInstructions(e.target.value),
    placeholder: "Instructions IA (optionnel) : ex. mettre l'accent sur la s\xE9curit\xE9, ton plus direct, mentionner l'urgence\u2026",
    style: {
      ...cdStyles.input,
      fontSize: 11.5,
      marginBottom: 6,
      padding: "6px 10px",
      background: "#fafbfc"
    }
  }), /*#__PURE__*/React.createElement("textarea", {
    value: body,
    onChange: e => setBody(e.target.value),
    rows: 8,
    style: {
      ...cdStyles.input,
      resize: "vertical",
      fontFamily: "inherit"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      background: "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: 7,
      fontSize: 11.5,
      color: "#92400e",
      marginBottom: 14
    }
  }, "\u2139 Outlook s'ouvrira dans un nouvel onglet avec destinataire, objet et corps pr\xE9-remplis. Le PDF est t\xE9l\xE9charg\xE9 localement \u2014 glissez-le en pi\xE8ce jointe dans la fen\xEAtre Outlook. Chaque envoi est trac\xE9 en BDD pour audit permanent."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: cdStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    disabled: sending,
    style: cdStyles.primaryBtn
  }, sending ? "Envoi…" : "✉ Ouvrir dans Outlook + Tracer")))));
};
var cdStyles = {
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
  // Couleur exacte de la tuile Accueil "Devis & Factures" : bg orange clair + icône orange foncé
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "#fef0e6",
    color: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 12px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    margin: "14px 0 8px"
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
  navCount: {
    fontSize: 11,
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
    marginBottom: 16,
    gap: 12
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a"
  },
  sub: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#64748b"
  },
  searchInput: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    width: 280,
    fontFamily: "inherit"
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
  docList: {
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
    padding: "12px 14px",
    gap: 10,
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.1s"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 20px",
    overflowY: "auto"
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 1100,
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
  modalBody: {
    padding: 22,
    maxHeight: "calc(100vh - 140px)",
    overflowY: "auto"
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
  },
  miniLbl: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3
  },
  miniInput: {
    width: "100%",
    padding: "7px 9px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12.5,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box"
  }
};