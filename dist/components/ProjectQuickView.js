// ════════════════════════════════════════════════════════════════════
// ProjectQuickView — fenêtre modale "fiche projet rapide" depuis le Kanban
// ════════════════════════════════════════════════════════════════════
//
// Inspiré du tableau Monday "1.0 - ADV Astorya".
// 3 colonnes :
//   • Gauche  : infos détaillées du projet
//   • Centre  : aperçu PDF du Bon de Livraison (si disponible)
//   • Droite  : fil de discussion / messages collaboratifs
//
// L'utilisateur peut toujours aller voir la fiche complète via le bouton
// "Voir la fiche complète".
// ════════════════════════════════════════════════════════════════════

var ProjectQuickView = ({
  projectId,
  onClose,
  onChanged
}) => {
  var [proj, setProj] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [messageDraft, setMessageDraft] = React.useState("");
  var [posting, setPosting] = React.useState(false);
  var [generatingBL, setGeneratingBL] = React.useState(false);
  // savingField : nom du champ en cours de sauvegarde (affiche un petit indicateur)
  var [savingField, setSavingField] = React.useState(null);
  var reload = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      var p = await window.api.projects.getById(projectId);
      setProj(p || null);
    } catch (e) {
      console.warn("[ProjectQuickView]", e);
    }
    setLoading(false);
  }, [projectId]);
  React.useEffect(() => {
    reload();
  }, [reload]);

  // ── Workflow Astorya — détection auto + override manuel + checklist ──
  var WF = window.HubProjectWorkflows;
  var productNames = React.useMemo(() => {
    if (!proj || !proj.items) return [];
    return proj.items.map(it => (it.designation || "") + " " + (it.ref || "")).filter(Boolean);
  }, [proj]);
  var detected = React.useMemo(() => {
    if (!WF || !productNames.length) return {
      family: null,
      category: null
    };
    var stored = proj && proj.data && proj.data.workflow_kind;
    if (stored && stored.family) return {
      family: stored.family,
      category: stored.category
    };
    return WF.detect(productNames);
  }, [proj, productNames, WF]);
  var wfFamily = proj && proj.data && proj.data.workflow_kind && proj.data.workflow_kind.family || detected.family;
  var wfCategory = proj && proj.data && proj.data.workflow_kind && proj.data.workflow_kind.category || detected.category;
  var workflowSteps = WF && wfFamily && wfCategory ? WF.getWorkflow(wfFamily, wfCategory) : [];
  var workflowDone = proj && proj.data && proj.data.workflow_done || {};
  var dateAchat = proj && proj.data && proj.data.date_achat || null;
  var dateReception = proj && proj.data && proj.data.date_reception || null;

  // ── Planning prévisionnel : map chaque étape à un offset en jours
  // à partir de 2 ancres (achat / réception). Heuristique par mots-clés.
  var PHASES = [
  // [regex sur etape, ancre, offset en jours]
  {
    rx: /demande|devis/i,
    anchor: "achat",
    offset: -10
  }, {
    rx: /signature/i,
    anchor: "achat",
    offset: -3
  }, {
    rx: /commande|achat/i,
    anchor: "achat",
    offset: 0
  }, {
    rx: /réception\s*mat|reception\s*mat|réception|reception/i,
    anchor: "reception",
    offset: 0
  }, {
    rx: /prépa|prepa|préparation|preparation/i,
    anchor: "reception",
    offset: 1
  }, {
    rx: /rdv|rendez-vous|prise\s*de\s*rdv/i,
    anchor: "reception",
    offset: 1
  }, {
    rx: /portab/i,
    anchor: "reception",
    offset: 2
  }, {
    rx: /planif|provisioning|config\s*serveur|config\s*&\s*portabilité/i,
    anchor: "reception",
    offset: 3
  }, {
    rx: /installation|déploiement|deploiement|livraison|raccordement|mise\s*en\s*œuvre|mise\s*en\s*service|config\s*&\s*envoi/i,
    anchor: "reception",
    offset: 7
  }, {
    rx: /recette/i,
    anchor: "reception",
    offset: 9
  }, {
    rx: /identification\s*glpi|glpi/i,
    anchor: "reception",
    offset: 7
  }, {
    rx: /validation\s*dossier|validation\s*technique/i,
    anchor: "reception",
    offset: 8
  }, {
    rx: /passage\s*en\s*comptabilité|comptabilité|compta/i,
    anchor: "reception",
    offset: 10
  }, {
    rx: /facturation/i,
    anchor: "reception",
    offset: 13
  }, {
    rx: /clôture|cloture|archivage/i,
    anchor: "reception",
    offset: 15
  }];
  var stepScheduledDate = step => {
    if (!dateAchat && !dateReception) return null;
    var phase = PHASES.find(p => p.rx.test(step.etape || ""));
    if (!phase) return null;
    var anchor = phase.anchor === "achat" ? dateAchat : dateReception || dateAchat;
    if (!anchor) return null;
    var d = new Date(anchor);
    d.setDate(d.getDate() + phase.offset);
    return d.toISOString().slice(0, 10);
  };
  var setWorkflowKind = async (family, category) => {
    var nextData = {
      ...(proj && proj.data || {}),
      workflow_kind: {
        family,
        category
      }
    };
    setProj(cur => cur ? {
      ...cur,
      data: nextData
    } : cur);
    try {
      await window.api.projects.update(proj.id, {
        data: nextData
      });
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
  };
  var setAnchorDate = async (key, value) => {
    var nextData = {
      ...(proj && proj.data || {}),
      [key]: value || null
    };
    setProj(cur => cur ? {
      ...cur,
      data: nextData
    } : cur);
    try {
      await window.api.projects.update(proj.id, {
        data: nextData
      });
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
  };
  var toggleStep = async stepKey => {
    var next = {
      ...workflowDone
    };
    if (next[stepKey]) delete next[stepKey];else next[stepKey] = {
      done_at: new Date().toISOString()
    };
    var nextData = {
      ...(proj && proj.data || {}),
      workflow_done: next
    };
    setProj(cur => cur ? {
      ...cur,
      data: nextData
    } : cur);
    try {
      await window.api.projects.update(proj.id, {
        data: nextData
      });
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
  };

  // Sauvegarde inline d'un champ projet (top-level column).
  var saveField = async (key, value) => {
    if (!proj) return;
    setSavingField(key);
    try {
      await window.api.projects.update(proj.id, {
        [key]: value
      });
      setProj(cur => cur ? {
        ...cur,
        [key]: value
      } : cur);
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSavingField(null);
  };
  // Sauvegarde d'un champ stocké dans data jsonb.
  var saveDataField = async (key, value) => {
    if (!proj) return;
    setSavingField("data." + key);
    try {
      var nextData = {
        ...(proj.data || {}),
        [key]: value
      };
      await window.api.projects.update(proj.id, {
        data: nextData
      });
      setProj(cur => cur ? {
        ...cur,
        data: nextData
      } : cur);
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSavingField(null);
  };

  // ── BL : génération + affichage immédiat ──
  // localBlobUrl = PDF généré côté client (affiché instantanément, pas besoin de Storage).
  // proj.data.bl_pdf_url = URL Storage persistée (chargée à la réouverture du projet).
  var [localBlobUrl, setLocalBlobUrl] = React.useState(null);
  React.useEffect(() => () => {
    if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
  }, [localBlobUrl]);

  // Récupère le BL doc lié au projet, en remontant la chaîne devis→commande→BL
  // et en créant les maillons manquants si besoin.
  var ensureBLDoc = async () => {
    // 1. Déjà mémorisé sur le projet ?
    var blId = proj.data && proj.data.bl_doc_id;
    if (blId) {
      var exists = await window.api.commercialDocs.getById(blId);
      if (exists && exists.type === "bl") return exists;
      blId = null;
    }
    // 2. Recherche dans commercial_docs via commande_id / opportunity_id
    var found = await window.api.commercialDocs.findBLForProject(proj);
    if (found) {
      var full = await window.api.commercialDocs.getById(found.id);
      if (full) return full;
    }
    // 3. Recherche d'une COMMANDE liée → cascade vers BL
    var oppId = proj.opportunity_id || proj.data && proj.data.opportunity_id;
    var cmdId = proj.data && proj.data.commande_id;
    var candidates = [];
    if (cmdId) {
      var c = await window.api.commercialDocs.getById(cmdId);
      if (c && c.type === "commande") candidates.push(c);
    }
    if (!candidates.length && oppId) {
      var all = await window.api.commercialDocs.list({
        opportunity_id: oppId
      });
      candidates = (all || []).filter(d => d.type === "commande" && d.status !== "annule" && d.status !== "refuse");
    }
    if (candidates.length) {
      var cmd = candidates[0];
      var bl = await window.api.commercialDocs.transform(cmd.id, "bl");
      if (bl) return bl;
    }
    // 4. Recherche d'un DEVIS lié → cascade vers commande → BL
    if (oppId) {
      var _all = await window.api.commercialDocs.list({
        opportunity_id: oppId
      });
      var devis = (_all || []).filter(d => d.type === "devis" && d.status !== "annule" && d.status !== "refuse");
      if (devis.length) {
        var _cmd = await window.api.commercialDocs.transform(devis[0].id, "commande");
        if (_cmd) {
          var _bl = await window.api.commercialDocs.transform(_cmd.id, "bl");
          if (_bl) return _bl;
        }
      }
    }
    return null;
  };
  var regenerateBL = async () => {
    if (!proj) return;
    if (!window.HubCommercialPdf) {
      if (window.HubToast) window.HubToast.error("Le générateur PDF n'est pas chargé. Recharge la page (Ctrl+F5).");
      return;
    }
    setGeneratingBL(true);
    try {
      // 1. Trouve ou crée le BL doc (cascade devis→commande→BL si nécessaire)
      var blDoc = await ensureBLDoc();
      if (!blDoc) {
        if (window.HubToast) window.HubToast.warn("Aucun devis/commande lié à ce projet — impossible de générer un BL.");
        setGeneratingBL(false);
        return;
      }
      var full = blDoc.lines ? blDoc : await window.api.commercialDocs.getById(blDoc.id);
      // 2. Génère le PDF côté client → blob URL → affichage immédiat
      var blob = await window.HubCommercialPdf.toBlob({
        ...full
      });
      if (blob) {
        var url = URL.createObjectURL(blob);
        if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
        setLocalBlobUrl(url);
        if (window.HubToast) window.HubToast.success("✓ BL généré (affiché ci-dessous)");
      }
      // 3. En arrière-plan : upload vers Storage + persiste sur le projet
      try {
        await window.api.commercialDocs.regenerateBLPdf(full.id);
        await reload();
        if (onChanged) onChanged();
      } catch (eUp) {
        console.warn("[BL upload Storage]", eUp.message || eUp);
        // Le PDF reste affiché en local même si l'upload échoue
      }
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Génération : " + (e.message || e));
    }
    setGeneratingBL(false);
  };

  // Esc → fermer
  React.useEffect(() => {
    var h = e => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  var postMessage = async () => {
    var txt = messageDraft.trim();
    if (!txt || !proj) return;
    setPosting(true);
    try {
      await window.api.projects.addEvent(proj.id, "message", {
        text: txt
      });
      setMessageDraft("");
      await reload();
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Envoi : " + (e.message || e));
    }
    setPosting(false);
  };
  var STAGE_LABEL = {
    recu: "Reçu",
    preparation: "Préparation",
    pret_livrer: "Prêt à livrer",
    livre: "Livré",
    installe: "Installé",
    clos: "Clos",
    annule: "Annulé"
  };
  var STAGE_COLOR = {
    recu: {
      bg: "#f1f5f9",
      c: "#475569"
    },
    preparation: {
      bg: "#f5efff",
      c: "#7e22ce"
    },
    pret_livrer: {
      bg: "#fef0e6",
      c: "#9a3412"
    },
    livre: {
      bg: "#fffbeb",
      c: "#854d0e"
    },
    installe: {
      bg: "#e0f4fc",
      c: "#075985"
    },
    clos: {
      bg: "#dcfce7",
      c: "#065f46"
    },
    annule: {
      bg: "#fee2e2",
      c: "#991b1b"
    }
  };
  var fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) : "—";
  var fmtDateTime = d => d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "—";
  var fmtEUR = n => n != null ? (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + " €" : "—";

  // Fil de discussion : on garde les events de type "message" + qq events système clés
  var messages = (proj && proj.events || []).slice().sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.55)",
      zIndex: 9999,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      padding: 24,
      backdropFilter: "blur(2px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 1500,
      background: "#fff",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 24px 60px rgba(0,0,0,0.35)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 22px",
      borderBottom: "1px solid #eef1f5",
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, "Fiche projet rapide"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, proj ? proj.name : loading ? "Chargement…" : "Projet introuvable")), proj && proj.stage && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 700,
      background: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).bg,
      color: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).c
    }
  }, STAGE_LABEL[proj.stage] || proj.stage), proj && /*#__PURE__*/React.createElement("a", {
    href: "/projet?id=" + encodeURIComponent(proj.id),
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
  }, "Voir la fiche compl\xE8te \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      fontSize: 18,
      color: "#475569",
      cursor: "pointer"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      gridTemplateColumns: "320px 1fr 360px",
      minHeight: 0,
      height: "calc(100vh - 130px)"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      borderRight: "1px solid #eef1f5",
      overflowY: "auto",
      background: "#fafbfc"
    }
  }, !proj ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 30,
      color: "#94a3b8",
      fontSize: 12
    }
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px"
    }
  }, /*#__PURE__*/React.createElement(EditSelect, {
    label: "Groupe",
    value: proj.stage || "recu",
    savingKey: "stage",
    saving: savingField,
    onSave: v => saveField("stage", v),
    options: Object.keys(STAGE_LABEL).map(k => ({
      k,
      label: STAGE_LABEL[k],
      colored: STAGE_COLOR[k]
    }))
  }), /*#__PURE__*/React.createElement(EditText, {
    label: "Nom",
    value: proj.name || "",
    bold: true,
    savingKey: "name",
    saving: savingField,
    onSave: v => saveField("name", v)
  }), /*#__PURE__*/React.createElement(EditText, {
    label: "Client",
    value: proj.client_name || "",
    savingKey: "client_name",
    saving: savingField,
    onSave: v => saveField("client_name", v)
  }), proj.client_id && /*#__PURE__*/React.createElement(InfoRow, {
    label: "ID client",
    value: proj.client_id,
    mono: true
  }), /*#__PURE__*/React.createElement(EditDate, {
    label: "Date butoir",
    value: proj.delivery_due,
    savingKey: "delivery_due",
    saving: savingField,
    onSave: v => saveField("delivery_due", v)
  }), /*#__PURE__*/React.createElement(EditDate, {
    label: "Date confirm\xE9e",
    value: proj.delivered_at,
    savingKey: "delivered_at",
    saving: savingField,
    onSave: v => saveField("delivered_at", v)
  }), /*#__PURE__*/React.createElement(EditText, {
    label: "Cat\xE9gorie",
    value: proj.data && proj.data.category || "",
    placeholder: "Mat\xE9riel",
    savingKey: "data.category",
    saving: savingField,
    onSave: v => saveDataField("category", v)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "BL",
    value: proj.data && proj.data.bl_doc_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Commande li\xE9e",
    value: proj.data && proj.data.commande_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Opportunit\xE9 li\xE9e",
    value: proj.opportunity_id || proj.data && proj.data.opportunity_id || "—",
    mono: true
  }), /*#__PURE__*/React.createElement(EditText, {
    label: "Chef de projet",
    value: proj.pm_name || "",
    savingKey: "pm_name",
    saving: savingField,
    onSave: v => saveField("pm_name", v)
  }), /*#__PURE__*/React.createElement(EditText, {
    label: "R\xE9f. Sage",
    value: proj.sage_ref || "",
    mono: true,
    savingKey: "sage_ref",
    saving: savingField,
    onSave: v => saveField("sage_ref", v)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    label: "Journal de cr\xE9ation",
    value: fmtDateTime(proj.created_at)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "Description"), /*#__PURE__*/React.createElement(EditTextarea, {
    value: proj.description || "",
    savingKey: "description",
    saving: savingField,
    onSave: v => saveField("description", v),
    placeholder: "Ajoute des notes internes sur ce projet\u2026"
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      background: "#f3f5f8"
    }
  }, WF && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      margin: "12px 12px 0 12px",
      borderRadius: 10,
      border: "1px solid #e2e8f0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCCB Workflow Astorya"), /*#__PURE__*/React.createElement("select", {
    value: wfFamily || "",
    onChange: e => {
      var fam = e.target.value || null;
      var firstCat = fam && WF.listCategories(fam)[0];
      setWorkflowKind(fam, firstCat || null);
    },
    style: {
      fontSize: 11.5,
      padding: "4px 8px",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      background: "#fff",
      color: "#0f172a",
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Famille \u2014"), WF.listFamilies().map(f => /*#__PURE__*/React.createElement("option", {
    key: f,
    value: f
  }, f))), /*#__PURE__*/React.createElement("select", {
    value: wfCategory || "",
    onChange: e => setWorkflowKind(wfFamily, e.target.value || null),
    disabled: !wfFamily,
    style: {
      fontSize: 11.5,
      padding: "4px 8px",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      background: wfFamily ? "#fff" : "#f8fafc",
      color: "#0f172a",
      fontFamily: "inherit",
      cursor: wfFamily ? "pointer" : "not-allowed",
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Sous-cat\xE9gorie \u2014"), wfFamily && WF.listCategories(wfFamily).map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), workflowSteps.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#475569",
      fontVariantNumeric: "tabular-nums"
    }
  }, Object.keys(workflowDone).filter(k => k.startsWith(wfFamily + "/" + wfCategory + "::")).length, "/", workflowSteps.length, " \xE9tapes")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      background: "#fafbfc",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Planning :"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      color: "#475569"
    }
  }, "\uD83D\uDED2 Date d'achat", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateAchat || "",
    onChange: e => setAnchorDate("date_achat", e.target.value || null),
    style: {
      padding: "3px 6px",
      border: "1px solid #cbd5e1",
      borderRadius: 5,
      fontSize: 11.5,
      fontFamily: "inherit",
      color: "#0f172a"
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      color: "#475569"
    }
  }, "\uD83D\uDCE6 Date de r\xE9ception", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateReception || "",
    onChange: e => setAnchorDate("date_reception", e.target.value || null),
    style: {
      padding: "3px 6px",
      border: "1px solid #cbd5e1",
      borderRadius: 5,
      fontSize: 11.5,
      fontFamily: "inherit",
      color: "#0f172a"
    }
  })), !dateAchat && !dateReception && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontStyle: "italic"
    }
  }, "Renseigne les dates pour activer le planning automatique.")), workflowSteps.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      fontSize: 12,
      color: "#94a3b8",
      textAlign: "center"
    }
  }, !wfFamily ? "Sélectionne une famille puis une sous-catégorie pour afficher le workflow." : "Aucune étape trouvée pour cette sous-catégorie.") : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px"
    }
  }, workflowSteps.map((step, idx) => {
    var stepKey = wfFamily + "/" + wfCategory + "::" + idx + "::" + step.etape;
    var isDone = !!workflowDone[stepKey];
    var doneAt = isDone && workflowDone[stepKey] && workflowDone[stepKey].done_at ? new Date(workflowDone[stepKey].done_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short"
    }) : null;
    var scheduledISO = stepScheduledDate(step);
    var scheduledLabel = scheduledISO ? new Date(scheduledISO).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short"
    }) : null;
    // Couleur du badge : rouge si en retard, orange si aujourd'hui/+3j, gris sinon
    var schedColor = {
      bg: "#f1f5f9",
      c: "#475569",
      border: "#e2e8f0"
    };
    if (scheduledISO && !isDone) {
      var todayISO = new Date().toISOString().slice(0, 10);
      var inDays = Math.floor((new Date(scheduledISO) - new Date(todayISO)) / (24 * 3600 * 1000));
      if (inDays < 0) schedColor = {
        bg: "#fee2e2",
        c: "#991b1b",
        border: "#fca5a5"
      };else if (inDays <= 3) schedColor = {
        bg: "#fef3c7",
        c: "#92400e",
        border: "#fcd34d"
      };else if (inDays <= 7) schedColor = {
        bg: "#dbeafe",
        c: "#1e40af",
        border: "#93c5fd"
      };
    }
    var roleColor = {
      "COM": "#1d4ed8",
      "COM + RS": "#1d4ed8",
      "ADV": "#7e22ce",
      "ADV/RS": "#7e22ce",
      "ADV / RS": "#7e22ce",
      "RS": "#9a3412",
      "TECH": "#0d9488",
      "TECH terrain": "#0d9488",
      "SUPPORT": "#0e7490",
      "COMPTA": "#065f46"
    }[step.role] || "#475569";
    return /*#__PURE__*/React.createElement("div", {
      key: stepKey,
      onClick: () => toggleStep(stepKey),
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 8,
        marginBottom: 6,
        cursor: "pointer",
        background: isDone ? "#f0fdf4" : "#fafbfc",
        border: "1px solid " + (isDone ? "#86efac" : "#eef1f5"),
        opacity: isDone ? 0.75 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 5,
        flexShrink: 0,
        border: "2px solid " + (isDone ? "#10b981" : "#cbd5e1"),
        background: isDone ? "#10b981" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        marginTop: 1
      }
    }, isDone ? "✓" : ""), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 3,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "#fff",
        background: roleColor,
        padding: "1px 6px",
        borderRadius: 3,
        letterSpacing: 0.3
      }
    }, step.role || "—"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "#0f172a",
        textDecoration: isDone ? "line-through" : "none"
      }
    }, step.etape), step.intervenant && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#64748b"
      }
    }, "\xB7 ", step.intervenant)), step.action && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#475569",
        lineHeight: 1.45
      }
    }, step.action), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap"
      }
    }, isDone && doneAt && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#065f46",
        background: "#dcfce7",
        border: "1px solid #86efac",
        padding: "1px 6px",
        borderRadius: 3,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums"
      }
    }, "\u2713 Fait le ", doneAt), !isDone && scheduledLabel && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: schedColor.c,
        background: schedColor.bg,
        border: "1px solid " + schedColor.border,
        padding: "1px 6px",
        borderRadius: 3,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums"
      }
    }, "\uD83D\uDCC5 Pr\xE9vu ", scheduledLabel), step.validation && step.validation !== "—" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#92400e",
        background: "#fef3c7",
        padding: "1px 6px",
        borderRadius: 3
      }
    }, "\u2713 ", step.validation), step.board && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#3730a3",
        background: "#e0e7ff",
        padding: "1px 6px",
        borderRadius: 3,
        fontVariantNumeric: "tabular-nums"
      }
    }, "\uD83D\uDCCB ", step.board), step.automation && step.automation !== "—" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#0e7490",
        background: "#cffafe",
        padding: "1px 6px",
        borderRadius: 3
      }
    }, "\u2699 ", step.automation))));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 18px",
      borderBottom: "1px solid #eef1f5",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCC4 Bon de livraison"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), (localBlobUrl || proj && proj.data && proj.data.bl_pdf_url) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: regenerateBL,
    disabled: generatingBL,
    style: {
      fontSize: 11,
      padding: "5px 10px",
      borderRadius: 6,
      border: "1px solid #cbd5e1",
      background: "#fff",
      color: "#0f172a",
      fontWeight: 600,
      cursor: generatingBL ? "wait" : "pointer"
    }
  }, generatingBL ? "…" : "↻ Régénérer"), /*#__PURE__*/React.createElement("a", {
    href: localBlobUrl || proj.data.bl_pdf_url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 11.5,
      color: "#1d4ed8",
      textDecoration: "none",
      fontWeight: 600
    }
  }, "\u2197 Ouvrir en plein \xE9cran"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: 12
    }
  }, localBlobUrl || proj && proj.data && proj.data.bl_pdf_url ? /*#__PURE__*/React.createElement("object", {
    data: localBlobUrl || proj.data.bl_pdf_url,
    type: "application/pdf",
    style: {
      width: "100%",
      height: "100%",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("iframe", {
    src: localBlobUrl || proj.data.bl_pdf_url,
    title: "BL PDF",
    style: {
      width: "100%",
      height: "100%",
      border: 0,
      borderRadius: 10,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 30,
      textAlign: "center",
      color: "#64748b"
    }
  }, "Ton navigateur ne supporte pas l'aper\xE7u int\xE9gr\xE9.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
    href: localBlobUrl || proj.data.bl_pdf_url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: "#1d4ed8"
    }
  }, "T\xE9l\xE9charger le PDF"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#94a3b8",
      textAlign: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      marginBottom: 10
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#475569"
    }
  }, "Aucun BL pour ce projet"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      marginTop: 6,
      lineHeight: 1.5,
      maxWidth: 380
    }
  }, "Le BL est g\xE9n\xE9r\xE9 \xE0 partir des articles du devis li\xE9. Clique sur le bouton ci-dessous pour le g\xE9n\xE9rer et l'afficher :", generatingBL && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "\u23F3 Cascade Devis \u2192 Commande \u2192 BL puis g\xE9n\xE9ration PDF en cours\u2026")), /*#__PURE__*/React.createElement("button", {
    onClick: regenerateBL,
    disabled: generatingBL || !proj,
    style: {
      marginTop: 16,
      padding: "10px 18px",
      borderRadius: 8,
      background: "#0f172a",
      color: "#fff",
      border: "none",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: generatingBL ? "wait" : "pointer"
    }
  }, generatingBL ? "Génération en cours…" : "📄 Générer le BL maintenant")))), /*#__PURE__*/React.createElement("aside", {
    style: {
      borderLeft: "1px solid #eef1f5",
      display: "flex",
      flexDirection: "column",
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 18px",
      borderBottom: "1px solid #eef1f5",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, "\uD83D\uDCAC Mises \xE0 jour", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "\xB7 ", messages.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "12px 14px"
    }
  }, messages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#94a3b8",
      fontSize: 12,
      textAlign: "center",
      marginTop: 30
    }
  }, "Aucun message pour l'instant. R\xE9dige ci-dessous pour partager une info avec l'\xE9quipe.") : messages.map(m => /*#__PURE__*/React.createElement(MessageBubble, {
    key: m.id || m.created_at,
    m: m
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #eef1f5",
      padding: 12,
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: messageDraft,
    onChange: e => setMessageDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postMessage();
    },
    placeholder: "R\xE9digez une mise \xE0 jour (Ctrl/Cmd + Entr\xE9e pour envoyer)",
    style: {
      width: "100%",
      minHeight: 68,
      resize: "vertical",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 10,
      fontSize: 12.5,
      fontFamily: "inherit",
      color: "#0f172a",
      background: "#fff",
      boxSizing: "border-box",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 8,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: postMessage,
    disabled: !messageDraft.trim() || posting,
    style: {
      padding: "8px 14px",
      borderRadius: 8,
      background: messageDraft.trim() ? "#0f172a" : "#cbd5e1",
      color: "#fff",
      border: "none",
      fontSize: 12,
      fontWeight: 600,
      cursor: messageDraft.trim() ? "pointer" : "not-allowed"
    }
  }, posting ? "Envoi…" : "Publier")))))));
};

// ─── Helpers locaux ───
var InfoRow = ({
  label,
  value,
  mono,
  bold,
  colored
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #eef1f5"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  }
}, label), colored ? /*#__PURE__*/React.createElement("span", {
  style: {
    justifySelf: "start",
    padding: "3px 10px",
    borderRadius: 999,
    background: colored.bg,
    color: colored.c,
    fontSize: 11.5,
    fontWeight: 700
  }
}, value || "—") : /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12.5,
    color: "#0f172a",
    fontWeight: bold ? 700 : 500,
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
}, value || "—"));
var MessageBubble = ({
  m
}) => {
  var EVENT_META = {
    message: {
      icon: "💬",
      label: null,
      bg: "#fff",
      c: "#0f172a"
    },
    created: {
      icon: "🆕",
      label: "Projet créé",
      bg: "#f1f5f9",
      c: "#475569"
    },
    stage_change: {
      icon: "🔁",
      label: "Changement d'étape",
      bg: "#fef3c7",
      c: "#92400e"
    },
    team_add: {
      icon: "👥",
      label: "Membre ajouté",
      bg: "#dbeafe",
      c: "#1e40af"
    },
    delivery_note_created: {
      icon: "📄",
      label: "BL généré",
      bg: "#dcfce7",
      c: "#065f46"
    },
    delivery_note_signed: {
      icon: "✍️",
      label: "BL signé",
      bg: "#dcfce7",
      c: "#065f46"
    }
  };
  var meta = EVENT_META[m.type] || {
    icon: "•",
    label: m.type,
    bg: "#f1f5f9",
    c: "#475569"
  };
  var created = m.created_at ? new Date(m.created_at).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }) : "";
  var text = m.payload && m.payload.text || (meta.label ? meta.label + (m.payload && m.payload.from ? " : " + m.payload.from : m.payload && m.payload.to ? " → " + m.payload.to : "") : "");
  if (m.type === "message") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10,
        padding: "10px 12px",
        background: "#fff",
        border: "1px solid #eef1f5",
        borderRadius: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#7e22ce",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700
      }
    }, (m.author_name || "?").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "#0f172a",
        flex: 1
      }
    }, m.author_name || "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8"
      }
    }, created)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "#0f172a",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap"
      }
    }, text));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8,
      padding: "6px 10px",
      background: meta.bg,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", null, meta.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: meta.c,
      fontWeight: 500
    }
  }, text), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: meta.c,
      opacity: 0.7
    }
  }, created));
};

// ─── Cellules éditables inline ───
// Pattern : la valeur n'est sauvegardée que sur blur ou Entrée (pas pendant la saisie).
var labelStyle = {
  fontSize: 10.5,
  color: "#64748b",
  fontWeight: 600,
  letterSpacing: 0.3,
  textTransform: "uppercase"
};
var rowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: 10,
  alignItems: "center",
  padding: "7px 0",
  borderBottom: "1px solid #eef1f5"
};
var inputStyle = {
  width: "100%",
  padding: "5px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 12.5,
  fontFamily: "inherit",
  color: "#0f172a",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none"
};
var SavingDot = ({
  on
}) => on ? /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 9,
    color: "#94a3b8",
    marginLeft: 6
  }
}, "\uD83D\uDCBE") : null;
var EditText = ({
  label,
  value,
  onSave,
  bold,
  mono,
  placeholder,
  savingKey,
  saving
}) => {
  var [local, setLocal] = React.useState(value || "");
  var [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    if (!dirty) setLocal(value || "");
  }, [value]);
  var commit = () => {
    if (dirty && local !== (value || "")) {
      setDirty(false);
      onSave(local);
    } else setDirty(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: rowStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, label, /*#__PURE__*/React.createElement(SavingDot, {
    on: saving === savingKey
  })), /*#__PURE__*/React.createElement("input", {
    value: local,
    onChange: e => {
      setLocal(e.target.value);
      setDirty(true);
    },
    onBlur: commit,
    onKeyDown: e => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
    placeholder: placeholder || "",
    style: {
      ...inputStyle,
      fontWeight: bold ? 700 : 500,
      fontVariantNumeric: mono ? "tabular-nums" : "normal",
      borderColor: dirty ? "#f59e0b" : "#e2e8f0",
      background: dirty ? "#fffbeb" : "#fff"
    }
  }));
};
var EditNumber = ({
  label,
  value,
  onSave,
  suffix,
  savingKey,
  saving
}) => {
  var [local, setLocal] = React.useState(value != null ? String(value) : "");
  var [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    if (!dirty) setLocal(value != null ? String(value) : "");
  }, [value]);
  var commit = () => {
    var num = local === "" ? null : Number(local);
    if (dirty && num !== (value == null ? null : Number(value))) {
      setDirty(false);
      onSave(num);
    } else setDirty(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: rowStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, label, /*#__PURE__*/React.createElement(SavingDot, {
    on: saving === savingKey
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: local,
    onChange: e => {
      setLocal(e.target.value);
      setDirty(true);
    },
    onBlur: commit,
    onKeyDown: e => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
    style: {
      ...inputStyle,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 600,
      borderColor: dirty ? "#f59e0b" : "#e2e8f0",
      background: dirty ? "#fffbeb" : "#fff"
    }
  }), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8"
    }
  }, suffix)));
};
var EditDate = ({
  label,
  value,
  onSave,
  savingKey,
  saving
}) => {
  var cur = value ? String(value).slice(0, 10) : "";
  return /*#__PURE__*/React.createElement("div", {
    style: rowStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, label, /*#__PURE__*/React.createElement(SavingDot, {
    on: saving === savingKey
  })), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: cur,
    onChange: e => onSave(e.target.value || null),
    style: {
      ...inputStyle,
      fontVariantNumeric: "tabular-nums"
    }
  }));
};
var EditSelect = ({
  label,
  value,
  onSave,
  options,
  savingKey,
  saving
}) => {
  var cur = options.find(o => o.k === value);
  var colored = cur && cur.colored;
  return /*#__PURE__*/React.createElement("div", {
    style: rowStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, label, /*#__PURE__*/React.createElement(SavingDot, {
    on: saving === savingKey
  })), /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onSave(e.target.value),
    style: {
      ...inputStyle,
      fontWeight: 700,
      background: colored ? colored.bg : "#fff",
      color: colored ? colored.c : "#0f172a",
      borderColor: colored ? colored.bg : "#e2e8f0"
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.k,
    value: o.k
  }, o.label))));
};
var EditTextarea = ({
  value,
  onSave,
  placeholder,
  savingKey,
  saving
}) => {
  var [local, setLocal] = React.useState(value || "");
  var [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    if (!dirty) setLocal(value || "");
  }, [value]);
  var commit = () => {
    if (dirty && local !== (value || "")) {
      setDirty(false);
      onSave(local);
    } else setDirty(false);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    value: local,
    onChange: e => {
      setLocal(e.target.value);
      setDirty(true);
    },
    onBlur: commit,
    placeholder: placeholder || "",
    style: {
      width: "100%",
      minHeight: 70,
      resize: "vertical",
      padding: 10,
      border: "1px solid " + (dirty ? "#f59e0b" : "#eef1f5"),
      borderRadius: 8,
      fontSize: 12.5,
      lineHeight: 1.55,
      color: "#0f172a",
      background: dirty ? "#fffbeb" : "#fff",
      fontFamily: "inherit",
      boxSizing: "border-box",
      outline: "none"
    }
  }), dirty && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: "#b45309",
      marginTop: 4
    }
  }, "\u270E clique en dehors pour sauvegarder"));
};
window.ProjectQuickView = ProjectQuickView;