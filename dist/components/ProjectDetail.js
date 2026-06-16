// ════════════════════════════════════════════════════════════════════
// ProjectDetail — Fiche détaillée d'un projet (/projet?id=…)
// ════════════════════════════════════════════════════════════════════
//
// Structure :
//   [Sidebar gauche]  Stages workflow + retour kanban
//   [Topbar]          ref Sage, client, badge stage, boutons avancer/clore
//   [Colonne main]    Stepper visuel 7 stages + sections
//                     - Infos projet (nom, description, montants, dates)
//                     - Livrables (project_items)
//                     - Timeline événements
//   [Colonne side]    Chef de projet + équipe + propriétés éditables
//
// Sources : api.projects.getById (qui joint items + team + events)
// Realtime : reload auto via HubData.subscribeChanges
// ════════════════════════════════════════════════════════════════════

var ProjectDetail = () => {
  var STAGES = window.api && window.api.projects && window.api.projects.STAGES || [];
  var urlId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
  var [project, setProject] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [profiles, setProfiles] = React.useState([]);
  var [deliveryNotes, setDeliveryNotes] = React.useState([]);
  var [signingBlId, setSigningBlId] = React.useState(null);
  var [previewBl, setPreviewBl] = React.useState(null);
  var [previewClient, setPreviewClient] = React.useState(null);
  var reload = React.useCallback(async () => {
    if (!urlId || !window.api || !window.api.projects) {
      setLoading(false);
      return;
    }
    setLoading(true);
    var [p, bls] = await Promise.all([window.api.projects.getById(urlId), window.api.deliveryNotes ? window.api.deliveryNotes.list({
      project_id: urlId
    }) : Promise.resolve([])]);
    setProject(p);
    setDeliveryNotes(bls || []);
    setLoading(false);
  }, [urlId]);
  React.useEffect(() => {
    reload();
    if (window.HubData && window.HubData.fetchProfiles) {
      window.HubData.fetchProfiles().then(({
        data
      }) => setProfiles(data || []));
    }
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  // ⚠️ Hooks AVANT les early returns (règles React)
  // Filtre des profils par groupe technique (Support, Ops, Techniciens)
  var technicianProfiles = React.useMemo(() => {
    try {
      var groups = window.HubAccess && window.HubAccess.loadGroups ? window.HubAccess.loadGroups() : [];
      var memberIds = new Set();
      (groups || []).forEach(g => {
        var isTechGroup = (g.access || []).includes("tech") || /technicien|support|operation|ops/i.test(g.id || "") || /technicien|support|opérations?/i.test(g.name || "");
        if (isTechGroup) {
          (g.members || []).forEach(m => memberIds.add(typeof m === "string" ? m : m.id));
        }
      });
      if (memberIds.size === 0) {
        return (profiles || []).filter(p => /tech|support|ops|opérations?/i.test((p.team || "") + " " + (p.role || "")));
      }
      return (profiles || []).filter(p => memberIds.has(p.id));
    } catch (e) {
      return profiles || [];
    }
  }, [profiles]);
  if (!urlId) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 60,
        textAlign: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#64748b"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: 8
      }
    }, "Aucun projet s\xE9lectionn\xE9"), /*#__PURE__*/React.createElement("a", {
      href: "/projets",
      style: {
        padding: "9px 16px",
        background: "#0f172a",
        color: "#fff",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none"
      }
    }, "\u2190 Retour au kanban"));
  }
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 60,
        textAlign: "center",
        fontFamily: "'Inter', system-ui, sans-serif"
      }
    }, "Chargement du projet\u2026");
  }
  if (!project) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 60,
        textAlign: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#64748b"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: 8
      }
    }, "Projet introuvable"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        marginBottom: 18
      }
    }, "ID : ", /*#__PURE__*/React.createElement("code", null, urlId)), /*#__PURE__*/React.createElement("a", {
      href: "/projets",
      style: {
        padding: "9px 16px",
        background: "#0f172a",
        color: "#fff",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none"
      }
    }, "\u2190 Retour au kanban"));
  }
  var fmtEUR = n => n != null ? Math.round(n).toLocaleString("fr-FR") + " €" : "—";
  var fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) : "—";
  var fmtDateTime = d => d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }) : "—";
  var stage = STAGES.find(s => s.k === project.stage) || STAGES[0];
  var overdue = project.delivery_due && new Date(project.delivery_due) < new Date() && project.stage !== "clos";

  // ───── Actions
  var advance = async () => {
    var idx = STAGES.findIndex(s => s.k === project.stage);
    if (idx === -1 || idx >= STAGES.length - 1) {
      if (window.HubToast) window.HubToast.warn("Le projet est déjà au stade final.");
      return;
    }
    var next = STAGES[idx + 1];
    try {
      await window.api.projects.changeStage(project.id, next.k);
      if (window.HubToast) window.HubToast.success("✓ Passé en « " + next.label + " »");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var setStageManual = async newK => {
    if (newK === project.stage) return;
    try {
      await window.api.projects.changeStage(project.id, newK);
      if (window.HubToast) window.HubToast.success("✓ Stage maj");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var cancel = async () => {
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Annuler ce projet ?",
      message: "Le projet sera marqué comme annulé. Tu pourras le restaurer en changeant son stage manuellement.",
      okLabel: "Annuler le projet",
      okStyle: "danger"
    }) : confirm("Annuler ce projet ?");
    if (!ok) return;
    await window.api.projects.changeStage(project.id, "annule");
    if (window.HubToast) window.HubToast.success("✓ Projet annulé");
    reload();
  };
  var editField = async (field, currentVal, label) => {
    var val = window.HubModal ? await window.HubModal.prompt({
      title: "Modifier " + label,
      label,
      default: currentVal || "",
      okLabel: "Enregistrer"
    }) : prompt(label, currentVal || "");
    if (val == null) return;
    await window.api.projects.update(project.id, {
      [field]: val
    });
    reload();
    if (window.HubToast) window.HubToast.success("✓ " + label + " mis à jour");
  };
  var setDueDate = async () => {
    var val = window.HubModal ? await window.HubModal.prompt({
      title: "Date de livraison souhaitée",
      label: "Date (YYYY-MM-DD)",
      default: project.delivery_due || new Date().toISOString().slice(0, 10),
      inputType: "date",
      okLabel: "Enregistrer"
    }) : prompt("Date livraison (YYYY-MM-DD)", project.delivery_due || "");
    if (!val) return;
    await window.api.projects.update(project.id, {
      delivery_due: val
    });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Date de livraison enregistrée");
  };
  var assignPM = async () => {
    var techs = technicianProfiles;
    if (!techs.length) {
      if (window.HubToast) window.HubToast.warn("Aucun technicien disponible — ajoute des membres au groupe Support/Techniciens dans l'admin.");
      return;
    }
    if (!window.HubModal) return;
    var chosen = await window.HubModal.choice({
      title: "Affecter un technicien",
      message: "Choisis le technicien qui prend en charge ce projet (liste filtrée sur les groupes techniques).",
      options: techs.map(p => ({
        value: p.id,
        label: p.name || p.email,
        sub: p.team || p.role || "Technicien"
      }))
    });
    if (!chosen) return;
    var p = techs.find(x => x.id === chosen);
    await window.api.projects.update(project.id, {
      pm_id: chosen,
      pm_name: p ? p.name : null
    });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Technicien affecté : " + (p ? p.name : "—"));
  };
  var addTeamMember = async () => {
    if (!profiles.length || !window.HubModal) return;
    var chosen = await window.HubModal.choice({
      title: "Ajouter un membre à l'équipe",
      options: profiles.filter(p => !(project.team || []).find(t => t.profile_id === p.id)).map(p => ({
        value: p.id,
        label: p.name || p.email,
        sub: p.team || p.role || "—"
      }))
    });
    if (!chosen) return;
    var role = await window.HubModal.choice({
      title: "Rôle dans le projet",
      options: [{
        value: "technicien",
        label: "Technicien"
      }, {
        value: "livreur",
        label: "Livreur"
      }, {
        value: "installateur",
        label: "Installateur"
      }, {
        value: "support",
        label: "Support"
      }, {
        value: "membre",
        label: "Membre (générique)"
      }]
    });
    if (!role) return;
    await window.api.projects.addTeamMember(project.id, chosen, role);
    reload();
    if (window.HubToast) window.HubToast.success("✓ Membre ajouté");
  };
  var removeTeamMember = async (profileId, name) => {
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Retirer " + (name || "ce membre") + " ?",
      okLabel: "Retirer",
      okStyle: "danger"
    }) : confirm("Retirer ce membre ?");
    if (!ok) return;
    await window.api.projects.removeTeamMember(project.id, profileId);
    reload();
    if (window.HubToast) window.HubToast.success("✓ Membre retiré");
  };
  var addComment = async () => {
    var text = window.HubModal ? await window.HubModal.prompt({
      title: "Ajouter un commentaire",
      label: "Message",
      multiline: true,
      okLabel: "Publier"
    }) : prompt("Commentaire :");
    if (!text || !text.trim()) return;
    await window.api.projects.addEvent(project.id, "comment", {
      text: text.trim()
    });
    reload();
    if (window.HubToast) window.HubToast.success("✓ Commentaire publié");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("style", null, `
        @media print {
          aside, .topbar-actions, .pdf-hide { display: none !important; }
          body * { visibility: hidden; }
          .pdf-page, .pdf-page * { visibility: visible; }
          .pdf-page { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; box-shadow: none !important; }
          .pdf-page table, .pdf-page .card { box-shadow: none !important; }
          @page { margin: 12mm; }
        }
      `), /*#__PURE__*/React.createElement("aside", {
    style: S.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...S.brand,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
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
  }, "Projet"))), /*#__PURE__*/React.createElement("a", {
    href: "/projets",
    style: {
      ...S.backBtn,
      textDecoration: "none"
    }
  }, "\u2190 Tous les projets"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.navSection,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Stage actuel"), STAGES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    onClick: () => setStageManual(s.k),
    style: {
      ...S.navItem,
      ...(project.stage === s.k ? S.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      marginLeft: 4
    }
  }, s.label), project.stage === s.k && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#3730a3",
      fontWeight: 700
    }
  }, "\u25CF ACTUEL")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("main", {
    style: S.main,
    className: "pdf-page"
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/projets",
    style: {
      fontSize: 12,
      color: "#64748b",
      textDecoration: "none"
    }
  }, "Projets"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\u203A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, project.sage_ref || project.id), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.stageBadge,
      background: stage.color + "15",
      color: stage.color,
      border: "1px solid " + stage.color + "30"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: stage.color
    }
  }), stage.label), overdue && /*#__PURE__*/React.createElement("span", {
    style: S.overdueBadge
  }, "\u23F0 EN RETARD")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    style: S.btnGhost,
    title: "T\xE9l\xE9charger en PDF (via dialog impression)"
  }, "\u2193 PDF"), project.stage !== "clos" && project.stage !== "annule" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: cancel,
    style: S.btnDanger
  }, "\u2715 Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: advance,
    style: S.btnPrimary
  }, "Avancer \u2192")))), /*#__PURE__*/React.createElement("div", {
    style: S.stepperWrap
  }, STAGES.map((s, i) => {
    var passed = STAGES.findIndex(x => x.k === project.stage) >= i;
    var current = project.stage === s.k;
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      style: S.stepperItem
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.stepperDot,
        background: passed ? s.color : "#e2e8f0",
        color: passed ? "#fff" : "#94a3b8",
        boxShadow: current ? "0 0 0 4px " + s.color + "30" : "none"
      }
    }, passed ? "✓" : i + 1), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: current ? 700 : 500,
        color: passed ? "#0f172a" : "#94a3b8",
        textAlign: "center",
        marginTop: 6
      }
    }, s.label), i < STAGES.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.stepperLine,
        background: passed ? s.color : "#e2e8f0"
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, /*#__PURE__*/React.createElement("section", {
    style: S.colMain
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, project.name), project.description && /*#__PURE__*/React.createElement("p", {
    style: S.descr
  }, project.description)), /*#__PURE__*/React.createElement("button", {
    onClick: () => editField("name", project.name, "Nom du projet"),
    style: S.editBtn
  }, "\u270E \xC9diter")), /*#__PURE__*/React.createElement("div", {
    style: S.metaGrid
  }, /*#__PURE__*/React.createElement(Meta, {
    label: "Livraison souhait\xE9e",
    val: fmtDate(project.delivery_due),
    onClick: setDueDate,
    editable: true
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Livr\xE9 le",
    val: fmtDate(project.delivery_done)
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Install\xE9 le",
    val: fmtDate(project.install_done)
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Recette le",
    val: fmtDate(project.recette_done)
  }))), /*#__PURE__*/React.createElement(ItemsBlock, {
    project: project,
    reload: reload,
    fmtEUR: fmtEUR,
    S: S
  }), project.data && project.data.bl_pdf_url && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCC4 Bon de livraison (PDF)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 16,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "BL g\xE9n\xE9r\xE9 automatiquement"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Doc commercial : ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      color: "#3730a3"
    }
  }, project.data.bl_doc_id || "—"), project.data.bl_pdf_uploaded_at && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 Mis \xE0 jour le ", new Date(project.data.bl_pdf_uploaded_at).toLocaleString("fr-FR")))), /*#__PURE__*/React.createElement("a", {
    href: project.data.bl_pdf_url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      padding: "8px 14px",
      borderRadius: 8,
      background: "#0f172a",
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDCE5 T\xE9l\xE9charger"), /*#__PURE__*/React.createElement("a", {
    href: project.data.bl_pdf_url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      padding: "8px 14px",
      borderRadius: 8,
      background: "#fff",
      border: "1px solid #cbd5e1",
      color: "#0f172a",
      fontSize: 12,
      fontWeight: 600,
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDC41 Aper\xE7u"))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCCB Bons de livraison (", deliveryNotes.length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        var bl = await window.api.deliveryNotes.createForProject(project.id);
        if (window.HubToast) window.HubToast.success("✓ BL " + bl.number + " créé");
        reload();
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      }
    },
    style: S.smallBtn
  }, "+ \xC9mettre un BL")), deliveryNotes.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun bon de livraison \xE9mis. Clique \xAB + \xC9mettre un BL \xBB quand tu pr\xE9pares la livraison.") : /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "N\xB0 BL"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Date"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Signataire"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      width: 140
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, deliveryNotes.map(bl => {
    var statusMap = {
      draft: {
        l: "Brouillon",
        bg: "#f1f5f9",
        c: "#475569"
      },
      sent: {
        l: "Envoyé",
        bg: "#dbeafe",
        c: "#1e40af"
      },
      signed: {
        l: "✓ Signé",
        bg: "#dcfce7",
        c: "#065f46"
      },
      refused: {
        l: "Refusé",
        bg: "#fee2e2",
        c: "#991b1b"
      },
      cancelled: {
        l: "Annulé",
        bg: "#f1f5f9",
        c: "#64748b"
      }
    };
    var sm = statusMap[bl.status] || statusMap.draft;
    return /*#__PURE__*/React.createElement("tr", {
      key: bl.id
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600
      }
    }, bl.number), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, fmtDate(bl.delivery_date)), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        background: sm.bg,
        color: sm.c,
        fontWeight: 700,
        letterSpacing: 0.3
      }
    }, sm.l)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        fontSize: 12
      }
    }, bl.signed_by_name ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, bl.signed_by_name), bl.signed_by_role && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b"
      }
    }, bl.signed_by_role)) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\u2014")), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, bl.status === "signed" ? /*#__PURE__*/React.createElement("button", {
      onClick: async () => {
        var full = await window.api.deliveryNotes.getById(bl.id);
        var client = null;
        if (project.client_id && window.api.clients) {
          client = await window.api.clients.getById(project.client_id);
        }
        setPreviewClient(client);
        setPreviewBl(full);
      },
      style: {
        padding: "5px 10px",
        fontSize: 11.5,
        color: "#065f46",
        border: "1px solid #86efac",
        borderRadius: 6,
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600
      }
    }, "\uD83D\uDCC4 PDF") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setSigningBlId(bl.id),
      style: {
        padding: "5px 10px",
        fontSize: 11.5,
        color: "#3730a3",
        border: "1px solid #c7d2fe",
        borderRadius: 6,
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600
      }
    }, "\u270D Signer"))));
  })))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCDC Timeline (", (project.events || []).length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: addComment,
    style: S.smallBtn
  }, "+ Commentaire")), (project.events || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun \xE9v\xE9nement. L'historique se remplit automatiquement aux changements de stage.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 0
    }
  }, project.events.map(e => /*#__PURE__*/React.createElement(EventRow, {
    key: e.id,
    ev: e,
    STAGES: STAGES
  }))))), /*#__PURE__*/React.createElement("aside", {
    style: S.colSide
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDD27 Technicien"), project.pm_name ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: project.pm_name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, project.pm_name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, "Technicien en charge")), /*#__PURE__*/React.createElement("button", {
    onClick: assignPM,
    style: S.smallBtn
  }, "Changer")) : /*#__PURE__*/React.createElement("button", {
    onClick: assignPM,
    style: {
      ...S.btnPrimary,
      width: "100%",
      marginTop: 6
    }
  }, "+ Affecter un technicien")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDC65 \xC9quipe (", (project.team || []).length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: addTeamMember,
    style: S.smallBtn
  }, "+ Ajouter")), (project.team || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.empty,
      padding: 12,
      fontSize: 11.5
    }
  }, "Aucun membre. Clique \xAB + Ajouter \xBB.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, project.team.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.profile_id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: t.profile && t.profile.name || "?",
    size: 26
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, t.profile && t.profile.name || "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, t.role)), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeTeamMember(t.profile_id, t.profile && t.profile.name),
    title: "Retirer",
    style: {
      background: "transparent",
      border: 0,
      color: "#cbd5e1",
      fontSize: 14,
      cursor: "pointer",
      padding: 4
    }
  }, "\xD7"))))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDD17 Liens"), project.client_id && /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client?id=" + encodeURIComponent(project.client_id),
    style: S.linkRow
  }, "\u25C9 Voir le client"), project.opp_id && /*#__PURE__*/React.createElement("a", {
    href: "/avancer-opportunite?opp=" + encodeURIComponent(project.opp_id),
    style: S.linkRow
  }, "\u20AC Opportunit\xE9 d'origine"), project.sage_ref && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.linkRow,
      color: "#94a3b8",
      cursor: "default"
    }
  }, "\uD83E\uDDFE Sage : ", project.sage_ref)), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\u2139 M\xE9tadonn\xE9es"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("div", null, "Cr\xE9\xE9 le : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, fmtDateTime(project.created_at))), /*#__PURE__*/React.createElement("div", null, "Maj : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, fmtDateTime(project.updated_at))), project.closed_at && /*#__PURE__*/React.createElement("div", null, "Cl\xF4tur\xE9 : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, fmtDateTime(project.closed_at)))))))), signingBlId && window.DeliveryNoteSign && /*#__PURE__*/React.createElement(DeliveryNoteSign, {
    blId: signingBlId,
    onClose: () => setSigningBlId(null),
    onSigned: () => {
      setSigningBlId(null);
      reload();
    }
  }), previewBl && window.DeliveryNotePreview && /*#__PURE__*/React.createElement(DeliveryNotePreview, {
    bl: previewBl,
    project: project,
    client: previewClient,
    onClose: () => {
      setPreviewBl(null);
      setPreviewClient(null);
    }
  }));
};

// ───── Sous-composants
var ItemsBlock = ({
  project,
  reload,
  fmtEUR,
  S
}) => {
  var [editingId, setEditingId] = React.useState(null);
  var [draft, setDraft] = React.useState({});
  var startEdit = it => {
    setEditingId(it.id);
    setDraft({
      ...it
    });
  };
  var cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };
  var saveEdit = async () => {
    if (!editingId) return;
    // Recalcule total_ht à partir de quantity * unit_price_ht
    var qty = parseFloat(draft.quantity) || 0;
    var pu = parseFloat(draft.unit_price_ht) || 0;
    var total = qty * pu;
    var patch = {
      designation: draft.designation,
      quantity: qty,
      unit: draft.unit || "u",
      unit_price_ht: pu,
      total_ht: total,
      status: draft.status,
      ref_produit: draft.ref_produit || null,
      delivered_qty: parseFloat(draft.delivered_qty) || 0
    };
    await window.api.projects.updateItem(editingId, patch);
    if (window.HubToast) window.HubToast.success("✓ Livrable mis à jour");
    cancelEdit();
    reload();
  };
  var addItem = async () => {
    if (!window.HubModal) return;
    var designation = await window.HubModal.prompt({
      title: "Nouveau livrable",
      label: "Désignation",
      placeholder: "ex : Astorya Suite Enterprise 250 licences",
      okLabel: "Continuer"
    });
    if (!designation || !designation.trim()) return;
    try {
      await window.api.projects.addItem(project.id, {
        designation: designation.trim(),
        quantity: 1,
        unit: "u",
        unit_price_ht: 0,
        total_ht: 0,
        status: "todo"
      });
      if (window.HubToast) window.HubToast.success("✓ Livrable ajouté — édite les détails inline");
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  // Import des lignes depuis le devis lié à l'opportunité du projet
  var importFromDevis = async () => {
    try {
      var oppId = project.opportunity_id || project.data && project.data.opportunity_id;
      if (!oppId) {
        if (window.HubToast) window.HubToast.warn("Ce projet n'est lié à aucune opportunité — pas de devis à importer");
        return;
      }
      // Cherche les devis (et autres docs) liés à cette opportunité
      var docs = await window.api.commercialDocs.list({
        opportunity_id: oppId
      });
      // Préfère facture > BL > commande > devis pour avoir la version la plus aboutie
      var order = ["facture", "bl", "commande", "devis"];
      var chosen = null;
      var _loop = async function (t) {
        chosen = (docs || []).find(d => d.type === t && d.status !== "annule" && d.status !== "refuse");
        if (chosen) return 1; // break
      };
      for (var t of order) {
        if (await _loop(t)) break;
      }
      if (!chosen) {
        if (window.HubToast) window.HubToast.warn("Aucun document commercial trouvé pour cette opportunité");
        return;
      }
      var full = await window.api.commercialDocs.getById(chosen.id);
      if (!full || !full.lines || full.lines.length === 0) {
        if (window.HubToast) window.HubToast.warn(chosen.id + " n'a aucune ligne");
        return;
      }
      var ok = (project.items || []).length === 0 || confirm("Importer " + full.lines.length + " ligne(s) depuis " + chosen.id + " ?\n\n" + "Le projet a déjà " + (project.items || []).length + " livrable(s). Les nouvelles lignes seront ajoutées (pas de remplacement).");
      if (!ok) return;
      var added = 0;
      for (var l of full.lines) {
        if (l.is_text_only) continue;
        try {
          await window.api.projects.addItem(project.id, {
            ref_produit: l.ref || null,
            designation: l.designation || "—",
            quantity: Number(l.quantity) || 1,
            unit: l.unit || "u",
            unit_price_ht: Number(l.unit_price_ht) || 0,
            total_ht: Number(l.total_ht) || 0,
            status: "todo"
          });
          added++;
        } catch (e) {}
      }
      if (window.HubToast) window.HubToast.success("✓ " + added + " ligne(s) importée(s) depuis " + chosen.id);
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var removeItem = async it => {
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Supprimer ce livrable ?",
      message: it.designation,
      okLabel: "Supprimer",
      okStyle: "danger"
    }) : confirm("Supprimer ?");
    if (!ok) return;
    await window.api.projects.removeItem(it.id);
    if (window.HubToast) window.HubToast.success("✓ Livrable supprimé");
    reload();
  };
  var cellInput = {
    width: "100%",
    border: "1px solid #cbd5e1",
    padding: "4px 8px",
    borderRadius: 5,
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCE6 Livrables (", (project.items || []).length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: addItem,
    style: S.smallBtn
  }, "+ Ajouter un livrable")), (project.items || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun livrable. Clique \xAB + Ajouter un livrable \xBB ou importe via CSV.") : /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right",
      width: 70
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      width: 110
    }
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      width: 60
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, project.items.map(it => {
    var isEdit = editingId === it.id;
    if (isEdit) {
      return /*#__PURE__*/React.createElement("tr", {
        key: it.id,
        style: {
          background: "#fafbfc"
        }
      }, /*#__PURE__*/React.createElement("td", {
        style: S.td
      }, /*#__PURE__*/React.createElement("input", {
        value: draft.designation || "",
        onChange: e => setDraft({
          ...draft,
          designation: e.target.value
        }),
        style: cellInput,
        placeholder: "D\xE9signation"
      }), /*#__PURE__*/React.createElement("input", {
        value: draft.ref_produit || "",
        onChange: e => setDraft({
          ...draft,
          ref_produit: e.target.value
        }),
        style: {
          ...cellInput,
          marginTop: 4,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace"
        },
        placeholder: "Ref produit (optionnel)"
      })), /*#__PURE__*/React.createElement("td", {
        style: {
          ...S.td,
          textAlign: "right"
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "number",
        value: draft.quantity || 0,
        onChange: e => setDraft({
          ...draft,
          quantity: e.target.value
        }),
        style: {
          ...cellInput,
          textAlign: "right",
          fontFamily: "'JetBrains Mono', monospace"
        }
      })), /*#__PURE__*/React.createElement("td", {
        style: S.td
      }, /*#__PURE__*/React.createElement("select", {
        value: draft.status || "todo",
        onChange: e => setDraft({
          ...draft,
          status: e.target.value
        }),
        style: cellInput
      }, /*#__PURE__*/React.createElement("option", {
        value: "todo"
      }, "\xC0 faire"), /*#__PURE__*/React.createElement("option", {
        value: "in_progress"
      }, "En cours"), /*#__PURE__*/React.createElement("option", {
        value: "delivered"
      }, "Livr\xE9"), /*#__PURE__*/React.createElement("option", {
        value: "installed"
      }, "Install\xE9"), /*#__PURE__*/React.createElement("option", {
        value: "validated"
      }, "Valid\xE9"), /*#__PURE__*/React.createElement("option", {
        value: "cancelled"
      }, "Annul\xE9"))), /*#__PURE__*/React.createElement("td", {
        style: S.td
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: saveEdit,
        title: "Enregistrer",
        style: {
          padding: "4px 8px",
          background: "#10b981",
          color: "#fff",
          border: 0,
          borderRadius: 5,
          fontSize: 11,
          cursor: "pointer"
        }
      }, "\u2713"), /*#__PURE__*/React.createElement("button", {
        onClick: cancelEdit,
        title: "Annuler",
        style: {
          padding: "4px 8px",
          background: "transparent",
          color: "#64748b",
          border: "1px solid #cbd5e1",
          borderRadius: 5,
          fontSize: 11,
          cursor: "pointer"
        }
      }, "\xD7"))));
    }
    return /*#__PURE__*/React.createElement("tr", {
      key: it.id,
      onDoubleClick: () => startEdit(it),
      title: "Double-clique pour \xE9diter"
    }, /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, it.designation), it.ref_produit && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: 2
      }
    }, it.ref_produit), it.serial_numbers && it.serial_numbers.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#0e7a55",
        marginTop: 2
      }
    }, "SN : ", it.serial_numbers.join(", "))), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, Number(it.quantity).toFixed(0), " ", it.unit), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement(ItemStatusBadge, {
      status: it.status
    })), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => startEdit(it),
      title: "\xC9diter",
      style: {
        padding: "4px 8px",
        background: "transparent",
        color: "#3730a3",
        border: "1px solid #c7d2fe",
        borderRadius: 5,
        fontSize: 11,
        cursor: "pointer"
      }
    }, "\u270E"), /*#__PURE__*/React.createElement("button", {
      onClick: () => removeItem(it),
      title: "Supprimer",
      style: {
        padding: "4px 8px",
        background: "transparent",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: 5,
        fontSize: 11,
        cursor: "pointer"
      }
    }, "\xD7"))));
  }))));
};
var Meta = ({
  label,
  val,
  strong,
  editable,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 10,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    cursor: editable ? "pointer" : "default"
  },
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: strong ? 16 : 13.5,
    fontWeight: strong ? 700 : 600,
    color: "#0f172a",
    marginTop: 3,
    fontFamily: strong ? "'JetBrains Mono', monospace" : "inherit"
  }
}, val, editable && /*#__PURE__*/React.createElement("span", {
  style: {
    color: "#94a3b8",
    marginLeft: 6,
    fontSize: 11
  }
}, "\u270E")));
var ItemStatusBadge = ({
  status
}) => {
  var map = {
    todo: {
      l: "À faire",
      bg: "#f1f5f9",
      c: "#64748b"
    },
    in_progress: {
      l: "En cours",
      bg: "#fef3c7",
      c: "#92400e"
    },
    delivered: {
      l: "Livré",
      bg: "#dbeafe",
      c: "#1e40af"
    },
    installed: {
      l: "Installé",
      bg: "#cffafe",
      c: "#155e75"
    },
    validated: {
      l: "Validé",
      bg: "#dcfce7",
      c: "#065f46"
    },
    cancelled: {
      l: "Annulé",
      bg: "#fee2e2",
      c: "#991b1b"
    }
  };
  var m = map[status] || map.todo;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "2px 8px",
      borderRadius: 999,
      background: m.bg,
      color: m.c,
      fontWeight: 700,
      letterSpacing: 0.3
    }
  }, m.l);
};
var EventRow = ({
  ev,
  STAGES
}) => {
  var fmtWhen = d => new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
  var icon = "•",
    text = "Événement",
    color = "#94a3b8";
  if (ev.type === "created") {
    icon = "+";
    text = "Projet créé";
    color = "#0ea5e9";
  } else if (ev.type === "stage_change") {
    icon = "→";
    color = "#a855f7";
    var to = STAGES.find(s => s.k === ev.payload?.to);
    text = "Passé en « " + (to ? to.label : ev.payload?.to) + " »";
    if (ev.payload?.reason) text += " — " + ev.payload.reason;
  } else if (ev.type === "team_add") {
    icon = "+";
    text = "Membre ajouté à l'équipe";
    color = "#10b981";
  } else if (ev.type === "comment") {
    icon = "💬";
    text = ev.payload?.text || "Commentaire";
    color = "#475569";
  } else if (ev.type === "delivery") {
    icon = "🚚";
    text = "Livraison enregistrée";
    color = "#ea580c";
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: color + "20",
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#0f172a",
      whiteSpace: "pre-wrap"
    }
  }, text), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 2
    }
  }, ev.author_name || "Système", " \xB7 ", fmtWhen(ev.created_at))));
};
var Avatar = ({
  name,
  size = 32
}) => {
  var init = (name || "?").split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 999,
      background: "linear-gradient(135deg, #4f46e5, #a855f7)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0
    }
  }, init);
};
var S = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f5f8",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  sidebar: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: 14,
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 8px 12px",
    borderBottom: "1px solid #f1f5f9"
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #4f46e5, #a855f7)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  },
  backBtn: {
    display: "block",
    padding: "9px 12px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center"
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
    gap: 4,
    padding: "7px 10px",
    borderRadius: 6,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  main: {
    flex: 1
  },
  topbar: {
    padding: "16px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  stageBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    marginLeft: 8
  },
  overdueBadge: {
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
    letterSpacing: 0.4
  },
  btnPrimary: {
    padding: "8px 16px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer"
  },
  btnDanger: {
    padding: "8px 12px",
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnGhost: {
    padding: "8px 12px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  stepperWrap: {
    display: "flex",
    padding: "20px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    gap: 0,
    overflowX: "auto"
  },
  stepperItem: {
    flex: 1,
    minWidth: 90,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  stepperDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all .12s"
  },
  stepperLine: {
    position: "absolute",
    top: 16,
    left: "50%",
    right: "-50%",
    height: 2,
    zIndex: 0
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 18,
    padding: 20
  },
  colMain: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  colSide: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: 16
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  h1: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0
  },
  descr: {
    fontSize: 13,
    color: "#475569",
    margin: "6px 0 0",
    lineHeight: 1.5
  },
  editBtn: {
    padding: "5px 10px",
    background: "transparent",
    color: "#3730a3",
    border: "1px solid #e0e7ff",
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  smallBtn: {
    padding: "5px 10px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 14
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    padding: "8px 10px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #eef1f5",
    textAlign: "left",
    background: "#fafbfc"
  },
  td: {
    padding: "10px",
    fontSize: 12.5,
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a"
  },
  empty: {
    padding: 20,
    textAlign: "center",
    fontSize: 12.5,
    color: "#94a3b8",
    border: "1px dashed #e2e8f0",
    borderRadius: 8,
    background: "#fafbfc"
  },
  linkRow: {
    display: "block",
    padding: "8px 0",
    fontSize: 12.5,
    color: "#3730a3",
    textDecoration: "none",
    borderBottom: "1px solid #f1f5f9"
  }
};
window.ProjectDetail = ProjectDetail;