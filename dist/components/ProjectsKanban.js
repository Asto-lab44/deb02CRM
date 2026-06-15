// ════════════════════════════════════════════════════════════════════
// ProjectsKanban — Page Projets & Livrables (kanban 7 stages)
// ════════════════════════════════════════════════════════════════════
//
// Vue principale du module /projets :
// - Sidebar gauche : compteurs par stage + filtres (mes projets, en retard…)
// - Topbar : recherche + bouton "Importer Sage" + bouton "+ Nouveau projet"
// - Kanban horizontal scrollable : 7 colonnes (recu → clos)
// - Drag-and-drop entre colonnes = changeStage()
// - Carte projet : nom + client + chef + montant + livraison + indicateurs
//
// Sources :
// - api.projects.list() pour tous les projets actifs
// - Realtime via HubData.subscribeChanges (sync auto multi-onglets)
// ════════════════════════════════════════════════════════════════════

var ProjectsKanban = () => {
  var STAGES = window.api && window.api.projects && window.api.projects.STAGES || [{
    k: "recu",
    label: "Reçu",
    color: "#94a3b8"
  }, {
    k: "preparation",
    label: "En préparation",
    color: "#a855f7"
  }, {
    k: "pret_livrer",
    label: "Prêt à livrer",
    color: "#ea580c"
  }, {
    k: "livre",
    label: "Livré",
    color: "#f59e0b"
  }, {
    k: "installe",
    label: "Installé",
    color: "#0ea5e9"
  }, {
    k: "clos",
    label: "Clos",
    color: "#10b981"
  }];
  var [projects, setProjects] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [search, setSearch] = React.useState("");
  var [filter, setFilter] = React.useState({
    kind: "all",
    value: null
  });
  var [draggedId, setDraggedId] = React.useState(null);
  var [filterPM, setFilterPM] = React.useState(""); // chef projet
  var [filterClient, setFilterClient] = React.useState(""); // client_id
  var [advancedOpen, setAdvancedOpen] = React.useState(false);
  var [clients, setClients] = React.useState([]);
  var [pms, setPms] = React.useState([]);

  // Charge la liste des clients + chefs projet pour les selects de filtre
  React.useEffect(() => {
    if (!window.api) return;
    if (window.api.clients) {
      window.api.clients.list().then(list => setClients(list || [])).catch(() => {});
    }
    if (window.HubData && window.HubData.fetchProfiles) {
      window.HubData.fetchProfiles().then(({
        data
      }) => setPms(data || []));
    }
  }, []);

  // User connecté (pour filtre "Mes projets")
  var currentUser = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
  var reload = React.useCallback(async () => {
    if (!window.api || !window.api.projects) {
      setLoading(false);
      return;
    }
    setLoading(true);
    var list = await window.api.projects.list();
    setProjects(list || []);
    setLoading(false);
  }, []);
  React.useEffect(() => {
    // Backfill : rattrape les opps déjà gagnées sans projet associé (avant
    // que l'auto-création soit en place). One-shot par session.
    (async () => {
      try {
        if (window.api && window.api.projects && window.api.projects.backfillFromWonOpps) {
          var res = await window.api.projects.backfillFromWonOpps();
          if (res && res.created > 0 && window.HubToast) {
            window.HubToast.success("✓ " + res.created + " projet(s) auto-créé(s) depuis opportunités gagnées");
          }
        }
      } catch (e) {}
      reload();
    })();
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  // Filtrage
  var filteredProjects = React.useMemo(() => {
    var q = search.trim().toLowerCase();
    return projects.filter(p => {
      if (q && !(p.name || "").toLowerCase().includes(q) && !(p.id || "").toLowerCase().includes(q) && !(p.sage_ref || "").toLowerCase().includes(q)) return false;
      if (filter.kind === "mine") {
        if (!currentUser) return false;
        return p.pm_name === currentUser.name || p.pm_id && currentUser.id && p.pm_id === currentUser.id;
      }
      if (filter.kind === "overdue") {
        return p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule";
      }
      // Filtres avancés
      if (filterPM && p.pm_id !== filterPM && p.pm_name !== filterPM) return false;
      if (filterClient && p.client_id !== filterClient) return false;
      return true;
    });
  }, [projects, search, filter, filterPM, filterClient, currentUser]);
  var hasAdvancedFilter = filterPM || filterClient;
  var clearAdvanced = () => {
    setFilterPM("");
    setFilterClient("");
  };
  var counts = React.useMemo(() => {
    var c = {
      all: projects.length,
      mine: 0,
      overdue: 0
    };
    STAGES.forEach(s => {
      c[s.k] = 0;
    });
    projects.forEach(p => {
      c[p.stage] = (c[p.stage] || 0) + 1;
      if (currentUser && (p.pm_name === currentUser.name || p.pm_id === currentUser.id)) c.mine++;
      if (p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule") c.overdue++;
    });
    return c;
  }, [projects, currentUser]);

  // Drag-and-drop : change le stage du projet
  var handleDrop = async newStage => {
    if (!draggedId) return;
    var proj = projects.find(p => p.id === draggedId);
    setDraggedId(null);
    if (!proj || proj.stage === newStage) return;
    // Optimistic update
    setProjects(arr => arr.map(p => p.id === draggedId ? {
      ...p,
      stage: newStage
    } : p));
    try {
      await window.api.projects.changeStage(draggedId, newStage);
      if (window.HubToast) window.HubToast.success("✓ Projet déplacé vers « " + STAGES.find(s => s.k === newStage).label + " »");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      reload(); // rollback
    }
  };
  var newProject = async initialStage => {
    if (!window.HubModal) return;
    var stage = initialStage || "recu";
    var stageLabel = (STAGES.find(s => s.k === stage) || STAGES[0]).label;
    var name = await window.HubModal.prompt({
      title: "Nouveau projet" + (initialStage ? " (étape " + stageLabel + ")" : ""),
      label: "Nom du projet",
      placeholder: "ex : Migration AD AXA Wealth",
      okLabel: "Créer"
    });
    if (!name || !name.trim()) return;
    try {
      var proj = await window.api.projects.create({
        name: name.trim(),
        stage
      });
      if (window.HubToast) window.HubToast.success("✓ Projet créé en « " + stageLabel + " »");
      window.location.href = "/projet?id=" + encodeURIComponent(proj.id);
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  // Import CSV : parse les commandes et les insère dans la BDD
  var importFileRef = React.useRef(null);
  var handleCSVImport = async file => {
    if (!file) return;
    try {
      var text = await file.text();
      var lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        if (window.HubToast) window.HubToast.warn("Fichier vide");
        return;
      }
      // Détection séparateur ; ou ,
      var sep = lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
      var header = lines[0].split(sep).map(h => h.trim().toLowerCase());
      var requiredCols = ["sage_ref", "name"];
      for (var r of requiredCols) {
        if (!header.includes(r)) {
          if (window.HubToast) window.HubToast.error("Colonne obligatoire manquante : " + r);
          return;
        }
      }
      var created = 0,
        updated = 0;
      var _loop = async function () {
        var cells = lines[i].split(sep);
        var row = {};
        header.forEach((h, idx) => {
          row[h] = (cells[idx] || "").trim().replace(/^"|"$/g, "");
        });
        if (!row.sage_ref || !row.name) return 1; // continue
        var payload = {
          sage_ref: row.sage_ref,
          name: row.name,
          client_id: row.client_id || null,
          amount_ht: row.amount_ht ? parseFloat(row.amount_ht) : null,
          amount_ttc: row.amount_ttc ? parseFloat(row.amount_ttc) : null,
          delivery_due: row.delivery_due || null,
          description: row.description || null
        };
        var res = await window.api.projects.syncFromSage(payload);
        if (res.mode === "created") created++;else updated++;
      };
      for (var i = 1; i < lines.length; i++) {
        if (await _loop()) continue;
      }
      if (window.HubToast) window.HubToast.success("✓ Import OK — " + created + " créés, " + updated + " mis à jour");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur import : " + (e.message || e));
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };
  var downloadTemplate = () => {
    var sample = "sage_ref;name;client_id;amount_ht;amount_ttc;delivery_due;description\n" + "CMD-2026-001;Migration AD AXA;;15000;18000;2026-07-15;Migration Active Directory\n" + "CMD-2026-002;Déploiement Astorya Cyber;;42000;50400;2026-08-01;Déploiement module Cyber 250 postes\n";
    var blob = new Blob(["﻿" + sample], {
      type: "text/csv;charset=utf-8;"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "import-projets-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.HubToast) window.HubToast.info("Template téléchargé — colle tes lignes Sage dedans puis ré-importe");
  };

  // Aperçu compact d'une carte projet
  // ─── ProjectCard — style identique aux cartes du CRM Pipeline
  // Logo coloré 28×28 / nom projet / client + tag stage / montant /
  // barre de progression / avatar PM + jours depuis création
  var ProjectCard = ({
    p,
    idx
  }) => {
    var stageMeta = STAGES.find(s => s.k === p.stage) || STAGES[0];
    var overdue = p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos";
    var stageIdx = STAGES.findIndex(s => s.k === p.stage);
    var progress = stageIdx >= 0 ? Math.round((stageIdx + 1) / STAGES.length * 100) : 0;
    var logoPalette = ["#1e40af", "#7e22ce", "#0f766e", "#dc2626", "#a855f7", "#0ea5e9", "#ec4899", "#f59e0b"];
    var logoBg = logoPalette[(idx || 0) % logoPalette.length];
    var initials = (p.name || "??").trim().slice(0, 2).toUpperCase();
    var tagBg = {
      recu: "#f1f5f9",
      preparation: "#f5efff",
      pret_livrer: "#fef0e6",
      livre: "#fffbeb",
      installe: "#e0f4fc",
      clos: "#dcfce7"
    }[p.stage] || "#f1f5f9";
    var tagColor = stageMeta.color;
    var amountStr = p.amount_ttc ? Math.round(p.amount_ttc).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : p.amount_ht ? Math.round(p.amount_ht).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : "—";
    var daysSince = p.created_at ? Math.floor((Date.now() - new Date(p.created_at).getTime()) / (24 * 3600 * 1000)) : 0;
    var isWon = p.stage === "clos";
    return /*#__PURE__*/React.createElement("div", {
      draggable: true,
      onDragStart: () => setDraggedId(p.id),
      onDragEnd: () => setDraggedId(null),
      onClick: () => window.location.href = "/projet?id=" + encodeURIComponent(p.id),
      style: {
        background: isWon ? "linear-gradient(180deg, #ecfdf5 0%, #fff 100%)" : "#fff",
        border: "1px solid " + (overdue ? "#fca5a5" : isWon ? "#86efac" : "#eef1f5"),
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        cursor: "pointer",
        boxShadow: draggedId === p.id ? "0 8px 24px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
        opacity: draggedId === p.id ? 0.6 : 1,
        transition: "box-shadow .12s, transform .1s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 6,
        background: logoBg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 0.3,
        flexShrink: 0
      }
    }, initials), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a",
        lineHeight: 1.3,
        wordBreak: "break-word"
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, p.client_name || (p.sage_ref ? "Réf " + p.sage_ref : "—")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: tagBg,
        color: tagColor,
        letterSpacing: 0.2
      }
    }, stageMeta.label), overdue && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: "#fee2e2",
        color: "#991b1b",
        letterSpacing: 0.2
      }
    }, "\u23F0 En retard"), isWon && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: "#dcfce7",
        color: "#065f46",
        letterSpacing: 0.2
      }
    }, "\u2713 Clos")))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 600,
        color: "#0f172a",
        letterSpacing: -0.4,
        fontFamily: "'Inter', sans-serif"
      }
    }, amountStr), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: 600
      }
    }, "Progression"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#0f172a",
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, progress, "%")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 3,
        background: "#eef1f5",
        borderRadius: 999,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: progress + "%",
        height: "100%",
        background: stageMeta.color,
        borderRadius: 999
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 9,
        paddingTop: 8,
        borderTop: "1px solid #f1f5f9"
      }
    }, p.pm_name ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 999,
        background: "#3730a3",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9.5,
        fontWeight: 700,
        border: "1.5px solid #fff"
      }
    }, p.pm_name.split(" ").map(s => s[0]).slice(0, 2).join("")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, p.pm_name.split(" ")[0])) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#cbd5e1"
      }
    }, "Sans chef"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b",
        display: "inline-flex",
        alignItems: "center",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\u25F7"), daysSince, "j")));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: S.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...S.brand,
      textDecoration: "none",
      color: "inherit"
    }
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Projets & Livrables"))), /*#__PURE__*/React.createElement("button", {
    onClick: newProject,
    style: S.newBtn
  }, "+ Nouveau projet"), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Vues"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilter({
      kind: "all",
      value: null
    }),
    style: {
      ...S.navItem,
      ...(filter.kind === "all" ? S.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Tous les projets"), /*#__PURE__*/React.createElement("span", {
    style: S.navCount
  }, counts.all)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilter({
      kind: "mine",
      value: null
    }),
    style: {
      ...S.navItem,
      ...(filter.kind === "mine" ? S.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Mes projets"), /*#__PURE__*/React.createElement("span", {
    style: S.navCount
  }, counts.mine)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilter({
      kind: "overdue",
      value: null
    }),
    style: {
      ...S.navItem,
      ...(filter.kind === "overdue" ? S.navItemActive : {}),
      color: counts.overdue > 0 ? "#dc2626" : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u26A0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "En retard"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.navCount,
      background: counts.overdue > 0 ? "#fee2e2" : "#f1f5f9",
      color: counts.overdue > 0 ? "#9b1c1c" : "#64748b"
    }
  }, counts.overdue))), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Par \xE9tape"), STAGES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    style: S.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: s.color,
      marginRight: 4
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    style: S.navCount
  }, counts[s.k] || 0)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("main", {
    style: S.main
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "Projets & Livrables"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, counts.all, " projet", counts.all > 1 ? "s" : "", " \xB7 ", counts.overdue, " en retard \xB7 sync Sage Gestion Co i7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Rechercher projet, ref Sage, client\u2026",
    value: search,
    onChange: e => setSearch(e.target.value),
    style: S.search
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdvancedOpen(v => !v),
    style: {
      ...S.btnGhost,
      ...(hasAdvancedFilter ? {
        borderColor: "#3730a3",
        color: "#3730a3",
        fontWeight: 700
      } : {})
    },
    title: "Filtres avanc\xE9s"
  }, "\u2699 Filtres", hasAdvancedFilter ? " · " + (Number(!!filterPM) + Number(!!filterClient)) : ""), /*#__PURE__*/React.createElement("a", {
    href: "/projets-calendrier",
    style: {
      ...S.btnGhost,
      textDecoration: "none"
    },
    title: "Vue calendrier mensuelle"
  }, "\uD83D\uDCC5 Calendrier"), /*#__PURE__*/React.createElement("a", {
    href: "/projets-gantt",
    style: {
      ...S.btnGhost,
      textDecoration: "none"
    },
    title: "Vue Gantt frise temporelle"
  }, "\uD83D\uDCCA Gantt"), /*#__PURE__*/React.createElement("button", {
    onClick: downloadTemplate,
    style: S.btnGhost,
    title: "T\xE9l\xE9charger un template CSV vide \xE0 remplir"
  }, "\uD83D\uDCCB Template CSV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => importFileRef.current && importFileRef.current.click(),
    style: S.btnGhost
  }, "\u21E3 Importer CSV"), /*#__PURE__*/React.createElement("input", {
    ref: importFileRef,
    type: "file",
    accept: ".csv,text/csv",
    style: {
      display: "none"
    },
    onChange: e => handleCSVImport(e.target.files[0])
  }))), advancedOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 28px",
      background: "#fafbfc",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Filtres avanc\xE9s :"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "#64748b",
      marginRight: 6
    }
  }, "Chef projet"), /*#__PURE__*/React.createElement("select", {
    value: filterPM,
    onChange: e => setFilterPM(e.target.value),
    style: {
      padding: "6px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: "inherit",
      outline: "none"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Tous"), pms.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name || p.email)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "#64748b",
      marginRight: 6
    }
  }, "Client"), /*#__PURE__*/React.createElement("select", {
    value: filterClient,
    onChange: e => setFilterClient(e.target.value),
    style: {
      padding: "6px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: "inherit",
      outline: "none"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Tous"), clients.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name || c.raison_sociale)))), hasAdvancedFilter && /*#__PURE__*/React.createElement("button", {
    onClick: clearAdvanced,
    style: {
      padding: "5px 11px",
      background: "transparent",
      color: "#dc2626",
      border: "1px solid #fecaca",
      borderRadius: 6,
      fontSize: 11.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\xD7 Effacer les filtres"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      fontSize: 11.5,
      color: "#64748b"
    }
  }, filteredProjects.length, " projet", filteredProjects.length > 1 ? "s" : "", " visible", filteredProjects.length > 1 ? "s" : "", " / ", projects.length)), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "#64748b"
    }
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: S.kanban
  }, STAGES.map(stage => {
    var stageProjects = filteredProjects.filter(p => p.stage === stage.k);
    var stageTotal = stageProjects.reduce((sum, p) => sum + (Number(p.amount_ttc) || Number(p.amount_ht) || 0), 0);
    var totalLabel = stageTotal >= 1000 ? Math.round(stageTotal / 1000) + " k€" : stageTotal > 0 ? Math.round(stageTotal) + " €" : "0 €";
    return /*#__PURE__*/React.createElement("div", {
      key: stage.k,
      onDragOver: e => e.preventDefault(),
      onDrop: () => handleDrop(stage.k),
      style: S.col
    }, /*#__PURE__*/React.createElement("div", {
      style: S.colHead
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: stage.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, stage.label), /*#__PURE__*/React.createElement("span", {
      style: S.colCount
    }, stageProjects.length), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 10.5,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500
      }
    }, totalLabel)), /*#__PURE__*/React.createElement("div", {
      style: S.colBody
    }, stageProjects.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: S.colEmpty
    }, "Aucun projet \xE0 cette \xE9tape"), stageProjects.map((p, i) => /*#__PURE__*/React.createElement(ProjectCard, {
      key: p.id,
      p: p,
      idx: i
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => newProject(stage.k),
      style: {
        display: "block",
        width: "100%",
        padding: "8px 10px",
        marginTop: 4,
        background: "transparent",
        border: "1px dashed " + stage.color + "55",
        color: stage.color,
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        textAlign: "center",
        cursor: "pointer"
      },
      title: "Créer un projet directement à l'étape " + stage.label
    }, "+ Ajouter un projet")));
  }))));
};
var S = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f5f8",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  sidebar: {
    width: 240,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: 14,
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 8px 12px",
    borderBottom: "1px solid #f1f5f9"
  },
  // Couleur module Projets & Livrables (#a855f7 violet)
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #7e22ce, #a855f7)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 12.5,
    cursor: "pointer"
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "8px 8px 4px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  bullet: {
    width: 12,
    color: "#94a3b8",
    fontSize: 11
  },
  navCount: {
    fontSize: 10.5,
    padding: "1px 7px",
    background: "#f1f5f9",
    color: "#64748b",
    borderRadius: 999,
    fontWeight: 600
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  topbar: {
    padding: "20px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    gap: 12,
    flexWrap: "wrap"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "#0f172a",
    letterSpacing: -0.3
  },
  h1sub: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  search: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    width: 260,
    outline: "none",
    fontFamily: "inherit"
  },
  btnGhost: {
    padding: "8px 14px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  kanban: {
    display: "flex",
    gap: 12,
    padding: 20,
    overflowX: "auto",
    flex: 1,
    alignItems: "flex-start"
  },
  col: {
    width: 290,
    flexShrink: 0,
    background: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column"
  },
  colHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    borderBottom: "1px solid #eef1f5",
    marginBottom: 10
  },
  colCount: {
    fontSize: 10,
    padding: "0 6px",
    background: "#fff",
    color: "#64748b",
    borderRadius: 999,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    border: "1px solid #e2e8f0"
  },
  colBody: {
    minHeight: 100,
    flex: 1
  },
  colEmpty: {
    padding: "16px 8px",
    textAlign: "center",
    fontSize: 11,
    color: "#cbd5e1",
    fontStyle: "italic",
    border: "1px dashed #e2e8f0",
    borderRadius: 6,
    background: "#fff"
  }
};
window.ProjectsKanban = ProjectsKanban;