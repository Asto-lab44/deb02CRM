// ════════════════════════════════════════════════════════════════════
// IntelligenceConcurrentielle — Échéances commerciales à anticiper
// ════════════════════════════════════════════════════════════════════
//
// Agrège 3 sources de tâches commerciales :
//   1. Leasing : fin de contrats Locam / Grenke / autres bailleurs
//   2. Garanties : fin de garantie constructeur serveur (CMDB)
//   3. Concurrents : date d'anniversaire / fin de contrat concurrent
//      (extraits des opportunités ouvertes du CRM avec concurrent renseigné)
//
// Affiche :
//   - KPIs : tâches urgentes (≤30j), à venir (≤90j), totales
//   - Liste filtrée par source / urgence / client
//   - Détail au clic : édition + lien vers la fiche client
//   - Boutons d'ajout direct pour leasing et garanties
//
// Tables : leasing_contracts + warranties + opportunities
// ════════════════════════════════════════════════════════════════════

var IntelligenceConcurrentielle = () => {
  var [tasks, setTasks] = React.useState([]);
  var locamFileRef = React.useRef(null);
  var grenkeFileRef = React.useRef(null);
  var [loading, setLoading] = React.useState(true);
  var [filter, setFilter] = React.useState({
    source: "all",
    urgency: "all"
  });
  var [editing, setEditing] = React.useState(null); // {type: 'leasing'|'warranty', data: {...}}

  var reload = React.useCallback(async () => {
    setLoading(true);
    try {
      var list = await window.api.intelTasks.list({
        horizon_days: 365
      });
      setTasks(list || []);
      // Auto-création d'opportunités de renouvellement à J-90 des concurrents.
      // Idempotent : ne recrée pas si déjà fait (clé data.renewal_for_task_id).
      try {
        var res = await window.api.intelTasks.autoCreateRenewalOpps({
          threshold_days: 90
        });
        if (res && res.created > 0) {
          if (window.HubToast) window.HubToast.success("🎯 " + res.created + " opportunité(s) de renouvellement créée(s) automatiquement à J-90 — visibles dans les fiches clients.");
        }
      } catch (e) {
        console.warn("[auto renewal]", e);
      }
    } catch (e) {
      setTasks([]);
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
  }, [reload]);
  var SOURCE_META = {
    leasing: {
      icon: "💼",
      label: "Leasing",
      color: "#3b82f6"
    },
    warranty: {
      icon: "🛡",
      label: "Garantie",
      color: "#a855f7"
    },
    concurrent: {
      icon: "⚔",
      label: "Concurrent",
      color: "#dc2626"
    }
  };

  // Filtrage
  var filtered = React.useMemo(() => tasks.filter(t => {
    if (filter.source !== "all" && t.source !== filter.source) return false;
    if (filter.urgency === "urgent" && t.days_left > 30) return false;
    if (filter.urgency === "soon" && (t.days_left <= 30 || t.days_left > 90)) return false;
    if (filter.urgency === "later" && t.days_left <= 90) return false;
    return true;
  }), [tasks, filter]);

  // KPIs
  var stats = React.useMemo(() => {
    var s = {
      urgent: 0,
      soon: 0,
      later: 0,
      total: tasks.length,
      by_source: {}
    };
    tasks.forEach(t => {
      if (t.days_left <= 30) s.urgent++;else if (t.days_left <= 90) s.soon++;else s.later++;
      s.by_source[t.source] = (s.by_source[t.source] || 0) + 1;
    });
    return s;
  }, [tasks]);
  var fmtDate = s => s ? new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "—";
  var newLeasing = () => setEditing({
    type: "leasing",
    data: {
      bailleur: "Locam",
      duree_mois: 36,
      status: "actif"
    }
  });
  var newWarranty = () => setEditing({
    type: "warranty",
    data: {
      type: "serveur",
      manufacturer: "Dell",
      status: "actif",
      garantie_type: "standard"
    }
  });
  var editTask = t => {
    if (t.source === "leasing") setEditing({
      type: "leasing",
      data: t.raw
    });else if (t.source === "warranty") setEditing({
      type: "warranty",
      data: t.raw
    });else if (t.source === "concurrent") window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(t.opp_id) + (t.client_id ? "&client=" + encodeURIComponent(t.client_id) : "");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: icStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: icStyles.sidebar
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
    style: icStyles.logo
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
  }, "Intelligence concurrentielle"))), /*#__PURE__*/React.createElement("button", {
    onClick: newLeasing,
    style: {
      ...icStyles.newBtn,
      background: "#3b82f6"
    }
  }, "+ Leasing"), /*#__PURE__*/React.createElement("button", {
    onClick: newWarranty,
    style: {
      ...icStyles.newBtn,
      background: "#a855f7"
    }
  }, "+ Garantie"), /*#__PURE__*/React.createElement("div", {
    style: icStyles.navLabel
  }, "Urgence"), [{
    k: "all",
    label: "Toutes",
    count: stats.total
  }, {
    k: "urgent",
    label: "≤ 30 jours",
    count: stats.urgent
  }, {
    k: "soon",
    label: "31 – 90 j",
    count: stats.soon
  }, {
    k: "later",
    label: "> 90 jours",
    count: stats.later
  }].map(u => /*#__PURE__*/React.createElement("div", {
    key: u.k,
    onClick: () => setFilter(f => ({
      ...f,
      urgency: u.k
    })),
    style: {
      ...icStyles.navItem,
      ...(filter.urgency === u.k ? icStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, u.label), /*#__PURE__*/React.createElement("span", {
    style: icStyles.navCount
  }, u.count))), /*#__PURE__*/React.createElement("div", {
    style: icStyles.navLabel
  }, "Source"), [{
    k: "all",
    label: "Toutes les sources",
    count: stats.total,
    color: "#0f172a"
  }, {
    k: "leasing",
    label: "💼 Leasing",
    count: stats.by_source.leasing || 0,
    color: "#3b82f6"
  }, {
    k: "warranty",
    label: "🛡 Garanties",
    count: stats.by_source.warranty || 0,
    color: "#a855f7"
  }, {
    k: "concurrent",
    label: "⚔ Concurrents",
    count: stats.by_source.concurrent || 0,
    color: "#dc2626"
  }].map(sc => /*#__PURE__*/React.createElement("div", {
    key: sc.k,
    onClick: () => setFilter(f => ({
      ...f,
      source: sc.k
    })),
    style: {
      ...icStyles.navItem,
      ...(filter.source === sc.k ? icStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: filter.source === sc.k ? sc.color : undefined
    }
  }, sc.label), /*#__PURE__*/React.createElement("span", {
    style: icStyles.navCount
  }, sc.count)))), /*#__PURE__*/React.createElement("main", {
    style: icStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: icStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: icStyles.h1
  }, "Intelligence concurrentielle"), /*#__PURE__*/React.createElement("p", {
    style: icStyles.sub
  }, "\xC9ch\xE9ances commerciales \xE0 anticiper \xB7 Leasing \xB7 Garanties \xB7 Contrats concurrents")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: locamFileRef,
    type: "file",
    accept: ".csv,text/csv,application/vnd.ms-excel",
    style: {
      display: "none"
    },
    onChange: async e => {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      e.target.value = "";
      try {
        if (window.HubToast) window.HubToast.info("Import LOCAM en cours…");
        var res = await window.api.leasingContracts.importLocamCSV(f);
        console.log("[LOCAM import]", res);
        var total = res.imported + res.updated;
        if (total === 0 && res.skipped > 0) {
          if (window.HubToast) window.HubToast.error("⚠ LOCAM : 0 importé · " + res.skipped + " ignorés. Ouvre la console (F12) pour voir les erreurs.");
          if (res.errors && res.errors.length) console.error("[LOCAM ERRORS]", res.errors);
        } else {
          var msg = "✓ LOCAM : " + res.imported + " nouveau(x) · " + res.updated + " mis à jour" + (res.skipped ? " · " + res.skipped + " ignorés" : "");
          if (window.HubToast) window.HubToast.success(msg);
          if (res.errors && res.errors.length) console.warn("[LOCAM import warnings]", res.errors);
        }
        reload();
      } catch (err) {
        console.error("[LOCAM import exception]", err);
        if (window.HubToast) window.HubToast.error("Import LOCAM : " + (err.message || err));
      }
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => locamFileRef.current && locamFileRef.current.click(),
    style: {
      ...icStyles.primaryBtn,
      background: "#2563eb"
    },
    title: "Importer le fichier CSV \xAB Export_Location_Folders \xBB export\xE9 depuis l'extranet LOCAM"
  }, "\u21E3 Importer LOCAM (CSV)"), /*#__PURE__*/React.createElement("input", {
    ref: grenkeFileRef,
    type: "file",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    style: {
      display: "none"
    },
    onChange: async e => {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      e.target.value = "";
      try {
        if (window.HubToast) window.HubToast.info("Import GRENKE en cours…");
        var res = await window.api.leasingContracts.importGrenkeXLSX(f);
        console.log("[GRENKE import]", res);
        var total = res.imported + res.updated;
        if (total === 0 && res.skipped > 0) {
          if (window.HubToast) window.HubToast.error("⚠ GRENKE : 0 importé · " + res.skipped + " ignorés. Ouvre la console (F12) pour voir les erreurs.");
          if (res.errors && res.errors.length) console.error("[GRENKE ERRORS]", res.errors);
        } else {
          var msg = "✓ GRENKE : " + res.imported + " nouveau(x) · " + res.updated + " mis à jour" + (res.skipped ? " · " + res.skipped + " ignorés" : "");
          if (window.HubToast) window.HubToast.success(msg);
          if (res.errors && res.errors.length) console.warn("[GRENKE import warnings]", res.errors);
        }
        reload();
      } catch (err) {
        console.error("[GRENKE import exception]", err);
        if (window.HubToast) window.HubToast.error("Import GRENKE : " + (err.message || err));
      }
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => grenkeFileRef.current && grenkeFileRef.current.click(),
    style: {
      ...icStyles.primaryBtn,
      background: "#0d9488"
    },
    title: "Importer le fichier XLSX \xAB MyContracts \xBB export\xE9 depuis l'extranet GRENKE"
  }, "\u21E3 Importer GRENKE (XLSX)"), /*#__PURE__*/React.createElement("button", {
    onClick: reload,
    style: icStyles.primaryBtn
  }, "\u21BB Rafra\xEEchir"))), /*#__PURE__*/React.createElement("div", {
    style: icStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDD25 URGENT (\u2264 30j)",
    value: stats.urgent,
    color: "#dc2626",
    big: true
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\u23F3 \xC0 venir (\u2264 90j)",
    value: stats.soon,
    color: "#f59e0b"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDCC6 Plus tard",
    value: stats.later,
    color: "#0ea5e9"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Total \xE9ch\xE9ances",
    value: stats.total,
    color: "#3730a3"
  })), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: icStyles.empty
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Aucune \xE9ch\xE9ance dans cette cat\xE9gorie"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 6
    }
  }, "Ajoute un contrat de leasing ou une garantie via les boutons en haut \xE0 gauche,", /*#__PURE__*/React.createElement("br", null), "ou renseigne un concurrent + date de fin de contrat dans une opportunit\xE9 CRM.")) : /*#__PURE__*/React.createElement("div", {
    style: icStyles.list
  }, filtered.map(t => {
    var meta = SOURCE_META[t.source] || {
      icon: "•",
      color: "#64748b",
      label: t.source
    };
    var urgencyColor = t.days_left <= 30 ? "#dc2626" : t.days_left <= 90 ? "#f59e0b" : "#64748b";
    var urgencyBg = t.days_left <= 30 ? "#fee2e2" : t.days_left <= 90 ? "#fef3c7" : "#f1f5f9";
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      onClick: () => editTask(t),
      style: icStyles.taskRow
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: meta.color + "20",
        color: meta.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0
      }
    }, meta.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "1px 7px",
        borderRadius: 999,
        background: meta.color + "15",
        color: meta.color,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase"
      }
    }, meta.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, t.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 3
      }
    }, t.subtitle), t.client_name && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#475569",
        marginTop: 2
      }
    }, "\uD83D\uDCCD ", /*#__PURE__*/React.createElement("strong", null, t.client_name), t.commercial ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, " \xB7 \uD83D\uDC64 ", t.commercial) : null)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        flexShrink: 0,
        marginLeft: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, "\xC9ch\xE9ance"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a",
        fontVariantNumeric: "tabular-nums"
      }
    }, fmtDate(t.date_echeance)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "inline-block",
        marginTop: 4,
        padding: "2px 10px",
        borderRadius: 999,
        background: urgencyBg,
        color: urgencyColor,
        fontSize: 12,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums"
      }
    }, "J", t.days_left >= 0 ? "−" : "+", Math.abs(t.days_left))), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#cbd5e1",
        fontSize: 16,
        marginLeft: 8
      }
    }, "\u203A"));
  }))), editing && /*#__PURE__*/React.createElement(EditModal, {
    editing: editing,
    onClose: () => setEditing(null),
    onSaved: () => {
      setEditing(null);
      reload();
    }
  }));
};
var KPI = ({
  label,
  value,
  color,
  big
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
    fontSize: big ? 26 : 22,
    fontWeight: 700,
    color: color || "#0f172a",
    marginTop: 4,
    fontVariantNumeric: "tabular-nums"
  }
}, value));
var EditModal = ({
  editing,
  onClose,
  onSaved
}) => {
  var [d, setD] = React.useState(editing.data);
  var [saving, setSaving] = React.useState(false);
  var isLeasing = editing.type === "leasing";
  var setF = (k, v) => setD(cur => ({
    ...cur,
    [k]: v
  }));
  var save = async () => {
    setSaving(true);
    try {
      var apiObj = isLeasing ? window.api.leasingContracts : window.api.warranties;
      if (!d.client_name || !d.date_fin) {
        if (window.HubToast) window.HubToast.error("Client et date de fin obligatoires");
        setSaving(false);
        return;
      }
      if (d.id) await apiObj.update(d.id, d);else await apiObj.create(d);
      if (window.HubToast) window.HubToast.success("✓ Enregistré");
      onSaved && onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };
  var remove = async () => {
    if (!d.id) return;
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      var apiObj = isLeasing ? window.api.leasingContracts : window.api.warranties;
      await apiObj.remove(d.id);
      if (window.HubToast) window.HubToast.success("✓ Supprimé");
      onSaved && onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: icStyles.modalOverlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: icStyles.modalCard,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("header", {
    style: icStyles.modalHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 700
    }
  }, isLeasing ? "💼 Contrat de leasing" : "🛡 Garantie constructeur"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: icStyles.closeBtn
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
    style: icStyles.lbl
  }, isLeasing ? "Bailleur" : "Constructeur", " *"), isLeasing ? /*#__PURE__*/React.createElement("select", {
    value: d.bailleur || "",
    onChange: e => setF("bailleur", e.target.value),
    style: icStyles.input
  }, /*#__PURE__*/React.createElement("option", null, "Locam"), /*#__PURE__*/React.createElement("option", null, "Grenke"), /*#__PURE__*/React.createElement("option", null, "BNP Lease"), /*#__PURE__*/React.createElement("option", null, "Autre")) : /*#__PURE__*/React.createElement("select", {
    value: d.manufacturer || "",
    onChange: e => setF("manufacturer", e.target.value),
    style: icStyles.input
  }, /*#__PURE__*/React.createElement("option", null, "Dell"), /*#__PURE__*/React.createElement("option", null, "HP"), /*#__PURE__*/React.createElement("option", null, "Lenovo"), /*#__PURE__*/React.createElement("option", null, "Cisco"), /*#__PURE__*/React.createElement("option", null, "APC"), /*#__PURE__*/React.createElement("option", null, "Autre"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, isLeasing ? "N° contrat" : "Modèle"), /*#__PURE__*/React.createElement("input", {
    value: isLeasing ? d.ref_contrat || "" : d.model || "",
    onChange: e => setF(isLeasing ? "ref_contrat" : "model", e.target.value),
    placeholder: isLeasing ? "LCM-2023-XXX" : "PowerEdge T440",
    style: icStyles.input
  }))), !isLeasing && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    value: d.type || "",
    onChange: e => setF("type", e.target.value),
    style: icStyles.input
  }, /*#__PURE__*/React.createElement("option", null, "serveur"), /*#__PURE__*/React.createElement("option", null, "switch"), /*#__PURE__*/React.createElement("option", null, "poste"), /*#__PURE__*/React.createElement("option", null, "onduleur"), /*#__PURE__*/React.createElement("option", null, "autre"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Niveau garantie"), /*#__PURE__*/React.createElement("select", {
    value: d.garantie_type || "",
    onChange: e => setF("garantie_type", e.target.value),
    style: icStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "standard"
  }, "Standard"), /*#__PURE__*/React.createElement("option", {
    value: "next_business_day"
  }, "NBD"), /*#__PURE__*/React.createElement("option", {
    value: "4h"
  }, "4h sur site"), /*#__PURE__*/React.createElement("option", {
    value: "premium"
  }, "Premium"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "N\xB0 s\xE9rie"), /*#__PURE__*/React.createElement("input", {
    value: d.serial_number || "",
    onChange: e => setF("serial_number", e.target.value),
    placeholder: "ABC123XYZ",
    style: icStyles.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Client *"), /*#__PURE__*/React.createElement("input", {
    value: d.client_name || "",
    onChange: e => setF("client_name", e.target.value),
    placeholder: "Nom raison sociale",
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, isLeasing ? "Désignation matériel financé" : "Description"), /*#__PURE__*/React.createElement("input", {
    value: d.designation || "",
    onChange: e => setF("designation", e.target.value),
    placeholder: isLeasing ? "Serveur Dell + 5 PC HP + switches" : "Couverture, particularités",
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isLeasing ? "1fr 1fr 1fr 1fr" : "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Date d\xE9but"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: isLeasing ? d.date_debut || "" : d.date_achat || "",
    onChange: e => setF(isLeasing ? "date_debut" : "date_achat", e.target.value),
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Date fin *"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: d.date_fin || "",
    onChange: e => setF("date_fin", e.target.value),
    style: icStyles.input
  })), isLeasing && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Dur\xE9e (mois)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: d.duree_mois || 36,
    onChange: e => setF("duree_mois", Number(e.target.value)),
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Loyer mensuel (\u20AC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: d.loyer_mensuel || "",
    onChange: e => setF("loyer_mensuel", Number(e.target.value)),
    style: icStyles.input
  })))), isLeasing && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Montant total HT (\u20AC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: d.montant_ht || "",
    onChange: e => setF("montant_ht", Number(e.target.value)),
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Commercial en charge"), /*#__PURE__*/React.createElement("input", {
    value: d.commercial || "",
    onChange: e => setF("commercial", e.target.value),
    placeholder: "Romain Daviaud",
    style: icStyles.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Statut"), /*#__PURE__*/React.createElement("select", {
    value: d.status || "actif",
    onChange: e => setF("status", e.target.value),
    style: icStyles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "actif"
  }, "Actif"), /*#__PURE__*/React.createElement("option", {
    value: isLeasing ? "termine" : "expire"
  }, isLeasing ? "Terminé" : "Expiré"), /*#__PURE__*/React.createElement("option", {
    value: isLeasing ? "rachat" : "renouvele"
  }, isLeasing ? "Rachat" : "Renouvelé"), /*#__PURE__*/React.createElement("option", {
    value: "annule"
  }, "Annul\xE9")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: icStyles.lbl
  }, "Notes"), /*#__PURE__*/React.createElement("textarea", {
    value: d.notes || "",
    onChange: e => setF("notes", e.target.value),
    rows: 2,
    style: {
      ...icStyles.input,
      resize: "vertical"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 14
    }
  }, d.id ? /*#__PURE__*/React.createElement("button", {
    onClick: remove,
    style: {
      ...icStyles.ghostBtn,
      color: "#dc2626",
      borderColor: "#fecaca"
    }
  }, "\uD83D\uDDD1 Supprimer") : /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: icStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: saving,
    style: icStyles.primaryBtn
  }, saving ? "Enregistrement…" : "Enregistrer"))))));
};
var icStyles = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 230,
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
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13
  },
  newBtn: {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 6
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
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 600
  },
  navCount: {
    fontSize: 10.5,
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums"
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
    background: "#dc2626",
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
  list: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    overflow: "hidden"
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    gap: 12,
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer"
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