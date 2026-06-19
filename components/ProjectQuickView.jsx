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

const ProjectQuickView = ({ projectId, onClose, onChanged }) => {
  const [proj, setProj] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [messageDraft, setMessageDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [generatingBL, setGeneratingBL] = React.useState(false);
  // savingField : nom du champ en cours de sauvegarde (affiche un petit indicateur)
  const [savingField, setSavingField] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const p = await window.api.projects.getById(projectId);
      setProj(p || null);
    } catch (e) { console.warn("[ProjectQuickView]", e); }
    setLoading(false);
  }, [projectId]);
  React.useEffect(() => { reload(); }, [reload]);

  // ── Workflow Astorya — détection auto + override manuel + checklist ──
  const WF = window.HubProjectWorkflows;
  const productNames = React.useMemo(() => {
    if (!proj || !proj.items) return [];
    return proj.items.map((it) => (it.designation || "") + " " + (it.ref || "")).filter(Boolean);
  }, [proj]);
  const detected = React.useMemo(() => {
    if (!WF || !productNames.length) return { family: null, category: null };
    const stored = proj && proj.data && proj.data.workflow_kind;
    if (stored && stored.family) return { family: stored.family, category: stored.category };
    return WF.detect(productNames);
  }, [proj, productNames, WF]);
  const wfFamily = (proj && proj.data && proj.data.workflow_kind && proj.data.workflow_kind.family) || detected.family;
  const wfCategory = (proj && proj.data && proj.data.workflow_kind && proj.data.workflow_kind.category) || detected.category;
  const workflowSteps = WF && wfFamily && wfCategory ? WF.getWorkflow(wfFamily, wfCategory) : [];
  const workflowDone = (proj && proj.data && proj.data.workflow_done) || {};
  const dateAchat = (proj && proj.data && proj.data.date_achat) || null;
  const dateReception = (proj && proj.data && proj.data.date_reception) || null;

  // ── Planning prévisionnel : map chaque étape à un offset en jours
  // à partir de 2 ancres (achat / réception). Heuristique par mots-clés.
  const PHASES = [
    // [regex sur etape, ancre, offset en jours]
    { rx: /demande|devis/i,                                    anchor: "achat",     offset: -10 },
    { rx: /signature/i,                                        anchor: "achat",     offset:  -3 },
    { rx: /commande|achat/i,                                   anchor: "achat",     offset:   0 },
    { rx: /réception\s*mat|reception\s*mat|réception|reception/i, anchor: "reception", offset:   0 },
    { rx: /prépa|prepa|préparation|preparation/i,             anchor: "reception", offset:   1 },
    { rx: /rdv|rendez-vous|prise\s*de\s*rdv/i,                anchor: "reception", offset:   1 },
    { rx: /portab/i,                                           anchor: "reception", offset:   2 },
    { rx: /planif|provisioning|config\s*serveur|config\s*&\s*portabilité/i, anchor: "reception", offset: 3 },
    { rx: /installation|déploiement|deploiement|livraison|raccordement|mise\s*en\s*œuvre|mise\s*en\s*service|config\s*&\s*envoi/i, anchor: "reception", offset: 7 },
    { rx: /recette/i,                                          anchor: "reception", offset:   9 },
    { rx: /identification\s*glpi|glpi/i,                       anchor: "reception", offset:   7 },
    { rx: /validation\s*dossier|validation\s*technique/i,     anchor: "reception", offset:   8 },
    { rx: /passage\s*en\s*comptabilité|comptabilité|compta/i, anchor: "reception", offset:  10 },
    { rx: /facturation/i,                                      anchor: "reception", offset:  13 },
    { rx: /clôture|cloture|archivage/i,                       anchor: "reception", offset:  15 },
  ];
  const stepScheduledDate = (step) => {
    if (!dateAchat && !dateReception) return null;
    const phase = PHASES.find((p) => p.rx.test(step.etape || ""));
    if (!phase) return null;
    const anchor = phase.anchor === "achat" ? dateAchat : (dateReception || dateAchat);
    if (!anchor) return null;
    const d = new Date(anchor); d.setDate(d.getDate() + phase.offset);
    return d.toISOString().slice(0, 10);
  };

  const setWorkflowKind = async (family, category) => {
    const nextData = { ...((proj && proj.data) || {}), workflow_kind: { family, category } };
    setProj((cur) => cur ? { ...cur, data: nextData } : cur);
    try { await window.api.projects.update(proj.id, { data: nextData }); }
    catch (e) { if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e)); }
  };
  const setAnchorDate = async (key, value) => {
    const nextData = { ...((proj && proj.data) || {}), [key]: value || null };
    setProj((cur) => cur ? { ...cur, data: nextData } : cur);
    try { await window.api.projects.update(proj.id, { data: nextData }); }
    catch (e) { if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e)); }
  };
  const toggleStep = async (stepKey) => {
    const next = { ...workflowDone };
    if (next[stepKey]) delete next[stepKey];
    else next[stepKey] = { done_at: new Date().toISOString() };
    const nextData = { ...((proj && proj.data) || {}), workflow_done: next };
    setProj((cur) => cur ? { ...cur, data: nextData } : cur);
    try { await window.api.projects.update(proj.id, { data: nextData }); }
    catch (e) { if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e)); }
  };

  // Sauvegarde inline d'un champ projet (top-level column).
  const saveField = async (key, value) => {
    if (!proj) return;
    setSavingField(key);
    try {
      await window.api.projects.update(proj.id, { [key]: value });
      setProj((cur) => cur ? { ...cur, [key]: value } : cur);
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSavingField(null);
  };
  // Sauvegarde d'un champ stocké dans data jsonb.
  const saveDataField = async (key, value) => {
    if (!proj) return;
    setSavingField("data." + key);
    try {
      const nextData = { ...((proj.data) || {}), [key]: value };
      await window.api.projects.update(proj.id, { data: nextData });
      setProj((cur) => cur ? { ...cur, data: nextData } : cur);
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSavingField(null);
  };

  // ── BL : génération + affichage immédiat ──
  // localBlobUrl = PDF généré côté client (affiché instantanément, pas besoin de Storage).
  // proj.data.bl_pdf_url = URL Storage persistée (chargée à la réouverture du projet).
  const [localBlobUrl, setLocalBlobUrl] = React.useState(null);
  React.useEffect(() => () => { if (localBlobUrl) URL.revokeObjectURL(localBlobUrl); }, [localBlobUrl]);

  // Récupère le BL doc lié au projet, en remontant la chaîne devis→commande→BL
  // et en créant les maillons manquants si besoin.
  const ensureBLDoc = async () => {
    // 1. Déjà mémorisé sur le projet ?
    let blId = proj.data && proj.data.bl_doc_id;
    if (blId) {
      const exists = await window.api.commercialDocs.getById(blId);
      if (exists && exists.type === "bl") return exists;
      blId = null;
    }
    // 2. Recherche dans commercial_docs via commande_id / opportunity_id
    const found = await window.api.commercialDocs.findBLForProject(proj);
    if (found) {
      const full = await window.api.commercialDocs.getById(found.id);
      if (full) return full;
    }
    // 3. Recherche d'une COMMANDE liée → cascade vers BL
    const oppId = proj.opportunity_id || (proj.data && proj.data.opportunity_id);
    const cmdId = proj.data && proj.data.commande_id;
    let candidates = [];
    if (cmdId) {
      const c = await window.api.commercialDocs.getById(cmdId);
      if (c && c.type === "commande") candidates.push(c);
    }
    if (!candidates.length && oppId) {
      const all = await window.api.commercialDocs.list({ opportunity_id: oppId });
      candidates = (all || []).filter((d) => d.type === "commande" && d.status !== "annule" && d.status !== "refuse");
    }
    if (candidates.length) {
      const cmd = candidates[0];
      const bl = await window.api.commercialDocs.transform(cmd.id, "bl");
      if (bl) return bl;
    }
    // 4. Recherche d'un DEVIS lié → cascade vers commande → BL
    if (oppId) {
      const all = await window.api.commercialDocs.list({ opportunity_id: oppId });
      const devis = (all || []).filter((d) => d.type === "devis" && d.status !== "annule" && d.status !== "refuse");
      if (devis.length) {
        const cmd = await window.api.commercialDocs.transform(devis[0].id, "commande");
        if (cmd) {
          const bl = await window.api.commercialDocs.transform(cmd.id, "bl");
          if (bl) return bl;
        }
      }
    }
    return null;
  };

  const regenerateBL = async () => {
    if (!proj) return;
    if (!window.HubCommercialPdf) {
      if (window.HubToast) window.HubToast.error("Le générateur PDF n'est pas chargé. Recharge la page (Ctrl+F5).");
      return;
    }
    setGeneratingBL(true);
    try {
      // 1. Trouve ou crée le BL doc (cascade devis→commande→BL si nécessaire)
      const blDoc = await ensureBLDoc();
      if (!blDoc) {
        if (window.HubToast) window.HubToast.warn("Aucun devis/commande lié à ce projet — impossible de générer un BL.");
        setGeneratingBL(false);
        return;
      }
      const full = blDoc.lines ? blDoc : await window.api.commercialDocs.getById(blDoc.id);
      // 2. Génère le PDF côté client → blob URL → affichage immédiat
      const blob = await window.HubCommercialPdf.toBlob({ ...full });
      if (blob) {
        const url = URL.createObjectURL(blob);
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
    const h = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const postMessage = async () => {
    const txt = messageDraft.trim();
    if (!txt || !proj) return;
    setPosting(true);
    try {
      await window.api.projects.addEvent(proj.id, "message", { text: txt });
      setMessageDraft("");
      await reload();
      if (onChanged) onChanged();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Envoi : " + (e.message || e));
    }
    setPosting(false);
  };

  const STAGE_LABEL = {
    recu:         "Reçu",
    preparation:  "Préparation",
    pret_livrer:  "Prêt à livrer",
    livre:        "Livré",
    installe:     "Installé",
    clos:         "Clos",
    annule:       "Annulé",
  };
  const STAGE_COLOR = {
    recu:         { bg: "#f1f5f9", c: "#475569" },
    preparation:  { bg: "#f5efff", c: "#7e22ce" },
    pret_livrer:  { bg: "#fef0e6", c: "#9a3412" },
    livre:        { bg: "#fffbeb", c: "#854d0e" },
    installe:     { bg: "#e0f4fc", c: "#075985" },
    clos:         { bg: "#dcfce7", c: "#065f46" },
    annule:       { bg: "#fee2e2", c: "#991b1b" },
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const fmtEUR = (n) => n != null ? (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €" : "—";

  // Fil de discussion : on garde les events de type "message" + qq events système clés
  const messages = ((proj && proj.events) || [])
    .slice()
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));

  return (
    <div onClick={onClose}
         style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999,
                  display: "flex", alignItems: "stretch", justifyContent: "center", padding: 24,
                  backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ width: "100%", maxWidth: 1500, background: "#fff", borderRadius: 16,
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px",
                      borderBottom: "1px solid #eef1f5", background: "#fff" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5,
                          textTransform: "uppercase", color: "#94a3b8" }}>
              Fiche projet rapide
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {proj ? proj.name : (loading ? "Chargement…" : "Projet introuvable")}
            </div>
          </div>
          {proj && proj.stage && (
            <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                           background: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).bg,
                           color: (STAGE_COLOR[proj.stage] || STAGE_COLOR.recu).c }}>
              {STAGE_LABEL[proj.stage] || proj.stage}
            </span>
          )}
          {proj && (
            <a href={"/projet?id=" + encodeURIComponent(proj.id)}
               style={{ padding: "8px 14px", borderRadius: 8, background: "#0f172a", color: "#fff",
                        fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              Voir la fiche complète →
            </a>
          )}
          <button onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
                           background: "#fff", fontSize: 18, color: "#475569", cursor: "pointer" }}>×</button>
        </div>

        {/* 3-column body */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr 360px",
                      minHeight: 0, height: "calc(100vh - 130px)" }}>
          {/* ─── LEFT : infos ─── */}
          <aside style={{ borderRight: "1px solid #eef1f5", overflowY: "auto", background: "#fafbfc" }}>
            {!proj ? (
              <div style={{ padding: 30, color: "#94a3b8", fontSize: 12 }}>Chargement…</div>
            ) : (
              <div style={{ padding: "18px 20px" }}>
                <EditSelect label="Groupe" value={proj.stage || "recu"} savingKey="stage" saving={savingField}
                            onSave={(v) => saveField("stage", v)}
                            options={Object.keys(STAGE_LABEL).map((k) => ({ k, label: STAGE_LABEL[k], colored: STAGE_COLOR[k] }))} />
                <EditText label="Nom" value={proj.name || ""} bold savingKey="name" saving={savingField}
                          onSave={(v) => saveField("name", v)} />
                <EditText label="Client" value={proj.client_name || ""} savingKey="client_name" saving={savingField}
                          onSave={(v) => saveField("client_name", v)} />
                {proj.client_id && <InfoRow label="ID client" value={proj.client_id} mono />}
                <EditDate label="Date butoir" value={proj.delivery_due} savingKey="delivery_due" saving={savingField}
                          onSave={(v) => saveField("delivery_due", v)} />
                <EditDate label="Date confirmée" value={proj.delivered_at} savingKey="delivered_at" saving={savingField}
                          onSave={(v) => saveField("delivered_at", v)} />
                <EditText label="Catégorie" value={(proj.data && proj.data.category) || ""}
                          placeholder="Matériel" savingKey="data.category" saving={savingField}
                          onSave={(v) => saveDataField("category", v)} />
                <InfoRow label="BL" value={(proj.data && proj.data.bl_doc_id) || "—"} mono />
                <InfoRow label="Commande liée" value={(proj.data && proj.data.commande_id) || "—"} mono />
                <InfoRow label="Opportunité liée"
                         value={proj.opportunity_id || (proj.data && proj.data.opportunity_id) || "—"} mono />
                <EditText label="Chef de projet" value={proj.pm_name || ""} savingKey="pm_name" saving={savingField}
                          onSave={(v) => saveField("pm_name", v)} />
                <EditText label="Réf. Sage" value={proj.sage_ref || ""} mono savingKey="sage_ref" saving={savingField}
                          onSave={(v) => saveField("sage_ref", v)} />
                <InfoRow label="Journal de création" value={fmtDateTime(proj.created_at)} />
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700,
                                letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
                    Description
                  </div>
                  <EditTextarea value={proj.description || ""} savingKey="description" saving={savingField}
                                onSave={(v) => saveField("description", v)}
                                placeholder="Ajoute des notes internes sur ce projet…" />
                </div>
              </div>
            )}
          </aside>

          {/* ─── CENTER : Workflow + BL PDF empilés ─── */}
          <section style={{ overflow: "auto", display: "flex", flexDirection: "column", background: "#f3f5f8" }}>
            {/* WORKFLOW PANEL — référentiel Astorya v7 */}
            {WF && (
              <div style={{ background: "#fff", margin: "12px 12px 0 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #eef1f5", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>📋 Workflow Astorya</div>
                  <select value={wfFamily || ""}
                          onChange={(e) => {
                            const fam = e.target.value || null;
                            const firstCat = fam && WF.listCategories(fam)[0];
                            setWorkflowKind(fam, firstCat || null);
                          }}
                          style={{ fontSize: 11.5, padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", color: "#0f172a", fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">— Famille —</option>
                    {WF.listFamilies().map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={wfCategory || ""}
                          onChange={(e) => setWorkflowKind(wfFamily, e.target.value || null)}
                          disabled={!wfFamily}
                          style={{ fontSize: 11.5, padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: wfFamily ? "#fff" : "#f8fafc", color: "#0f172a", fontFamily: "inherit", cursor: wfFamily ? "pointer" : "not-allowed", minWidth: 200 }}>
                    <option value="">— Sous-catégorie —</option>
                    {wfFamily && WF.listCategories(wfFamily).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ flex: 1 }} />
                  {workflowSteps.length > 0 && (
                    <span style={{ fontSize: 10.5, color: "#475569", fontVariantNumeric: "tabular-nums" }}>
                      {Object.keys(workflowDone).filter((k) => k.startsWith(wfFamily + "/" + wfCategory + "::")).length}/{workflowSteps.length} étapes
                    </span>
                  )}
                </div>
                {/* Dates d'ancrage pour le planning prévisionnel */}
                <div style={{ padding: "10px 14px", background: "#fafbfc", borderBottom: "1px solid #eef1f5",
                              display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Planning :
                  </span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#475569" }}>
                    🛒 Date d'achat
                    <input type="date" value={dateAchat || ""}
                           onChange={(e) => setAnchorDate("date_achat", e.target.value || null)}
                           style={{ padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 11.5, fontFamily: "inherit", color: "#0f172a" }} />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#475569" }}>
                    📦 Date de réception
                    <input type="date" value={dateReception || ""}
                           onChange={(e) => setAnchorDate("date_reception", e.target.value || null)}
                           style={{ padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 11.5, fontFamily: "inherit", color: "#0f172a" }} />
                  </label>
                  {!dateAchat && !dateReception && (
                    <span style={{ fontSize: 10.5, color: "#94a3b8", fontStyle: "italic" }}>
                      Renseigne les dates pour activer le planning automatique.
                    </span>
                  )}
                </div>
                {workflowSteps.length === 0 ? (
                  <div style={{ padding: 18, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                    {!wfFamily ? "Sélectionne une famille puis une sous-catégorie pour afficher le workflow." : "Aucune étape trouvée pour cette sous-catégorie."}
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px" }}>
                    {workflowSteps.map((step, idx) => {
                      const stepKey = wfFamily + "/" + wfCategory + "::" + idx + "::" + step.etape;
                      const isDone = !!workflowDone[stepKey];
                      const doneAt = isDone && workflowDone[stepKey] && workflowDone[stepKey].done_at
                        ? new Date(workflowDone[stepKey].done_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : null;
                      const scheduledISO = stepScheduledDate(step);
                      const scheduledLabel = scheduledISO ? new Date(scheduledISO).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : null;
                      // Couleur du badge : rouge si en retard, orange si aujourd'hui/+3j, gris sinon
                      let schedColor = { bg: "#f1f5f9", c: "#475569", border: "#e2e8f0" };
                      if (scheduledISO && !isDone) {
                        const todayISO = new Date().toISOString().slice(0, 10);
                        const inDays = Math.floor((new Date(scheduledISO) - new Date(todayISO)) / (24 * 3600 * 1000));
                        if (inDays < 0) schedColor = { bg: "#fee2e2", c: "#991b1b", border: "#fca5a5" };
                        else if (inDays <= 3) schedColor = { bg: "#fef3c7", c: "#92400e", border: "#fcd34d" };
                        else if (inDays <= 7) schedColor = { bg: "#dbeafe", c: "#1e40af", border: "#93c5fd" };
                      }
                      const roleColor = {
                        "COM": "#1d4ed8", "COM + RS": "#1d4ed8",
                        "ADV": "#7e22ce", "ADV/RS": "#7e22ce", "ADV / RS": "#7e22ce",
                        "RS": "#9a3412",
                        "TECH": "#0d9488", "TECH terrain": "#0d9488",
                        "SUPPORT": "#0e7490",
                        "COMPTA": "#065f46",
                      }[step.role] || "#475569";
                      return (
                        <div key={stepKey} onClick={() => toggleStep(stepKey)}
                             style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px",
                                      borderRadius: 8, marginBottom: 6, cursor: "pointer",
                                      background: isDone ? "#f0fdf4" : "#fafbfc",
                                      border: "1px solid " + (isDone ? "#86efac" : "#eef1f5"),
                                      opacity: isDone ? 0.75 : 1 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                        border: "2px solid " + (isDone ? "#10b981" : "#cbd5e1"),
                                        background: isDone ? "#10b981" : "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#fff", fontSize: 12, fontWeight: 700, marginTop: 1 }}>
                            {isDone ? "✓" : ""}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: roleColor,
                                             padding: "1px 6px", borderRadius: 3, letterSpacing: 0.3 }}>
                                {step.role || "—"}
                              </span>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a",
                                             textDecoration: isDone ? "line-through" : "none" }}>
                                {step.etape}
                              </span>
                              {step.intervenant && (
                                <span style={{ fontSize: 10.5, color: "#64748b" }}>· {step.intervenant}</span>
                              )}
                            </div>
                            {step.action && (
                              <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                                {step.action}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                              {/* Date planifiée (calculée depuis date_achat + date_reception) */}
                              {isDone && doneAt && (
                                <span style={{ fontSize: 10, color: "#065f46", background: "#dcfce7", border: "1px solid #86efac", padding: "1px 6px", borderRadius: 3, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                  ✓ Fait le {doneAt}
                                </span>
                              )}
                              {!isDone && scheduledLabel && (
                                <span style={{ fontSize: 10, color: schedColor.c, background: schedColor.bg, border: "1px solid " + schedColor.border, padding: "1px 6px", borderRadius: 3, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                  📅 Prévu {scheduledLabel}
                                </span>
                              )}
                              {step.validation && step.validation !== "—" && (
                                <span style={{ fontSize: 10, color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: 3 }}>
                                  ✓ {step.validation}
                                </span>
                              )}
                              {step.board && (
                                <span style={{ fontSize: 10, color: "#3730a3", background: "#e0e7ff", padding: "1px 6px", borderRadius: 3, fontVariantNumeric: "tabular-nums" }}>
                                  📋 {step.board}
                                </span>
                              )}
                              {step.automation && step.automation !== "—" && (
                                <span style={{ fontSize: 10, color: "#0e7490", background: "#cffafe", padding: "1px 6px", borderRadius: 3 }}>
                                  ⚙ {step.automation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: "10px 18px", borderBottom: "1px solid #eef1f5", background: "#fff",
                          display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>📄 Bon de livraison</div>
              <span style={{ flex: 1 }} />
              {(localBlobUrl || (proj && proj.data && proj.data.bl_pdf_url)) && (
                <>
                  <button onClick={regenerateBL} disabled={generatingBL}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6,
                                   border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a",
                                   fontWeight: 600, cursor: generatingBL ? "wait" : "pointer" }}>
                    {generatingBL ? "…" : "↻ Régénérer"}
                  </button>
                  <a href={localBlobUrl || proj.data.bl_pdf_url} target="_blank" rel="noreferrer"
                     style={{ fontSize: 11.5, color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>
                    ↗ Ouvrir en plein écran
                  </a>
                </>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, padding: 12 }}>
              {(localBlobUrl || (proj && proj.data && proj.data.bl_pdf_url)) ? (
                <object data={localBlobUrl || proj.data.bl_pdf_url} type="application/pdf"
                        style={{ width: "100%", height: "100%", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
                  <iframe src={localBlobUrl || proj.data.bl_pdf_url} title="BL PDF"
                          style={{ width: "100%", height: "100%", border: 0, borderRadius: 10, background: "#fff" }} />
                  <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                    Ton navigateur ne supporte pas l'aperçu intégré.<br/>
                    <a href={localBlobUrl || proj.data.bl_pdf_url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                      Télécharger le PDF
                    </a>
                  </div>
                </object>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              height: "100%", color: "#94a3b8", textAlign: "center", padding: 30 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    Aucun BL pour ce projet
                  </div>
                  <div style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5, maxWidth: 380 }}>
                    Le BL est généré à partir des articles du devis lié.
                    Clique sur le bouton ci-dessous pour le générer et l'afficher :
                    {generatingBL && <><br/><br/>⏳ Cascade Devis → Commande → BL puis génération PDF en cours…</>}
                  </div>
                  <button onClick={regenerateBL} disabled={generatingBL || !proj}
                          style={{ marginTop: 16, padding: "10px 18px", borderRadius: 8, background: "#0f172a",
                                   color: "#fff", border: "none", fontSize: 12.5, fontWeight: 600,
                                   cursor: generatingBL ? "wait" : "pointer" }}>
                    {generatingBL ? "Génération en cours…" : "📄 Générer le BL maintenant"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ─── RIGHT : messages ─── */}
          <aside style={{ borderLeft: "1px solid #eef1f5", display: "flex", flexDirection: "column", background: "#fff" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #eef1f5",
                          fontSize: 12.5, fontWeight: 700, color: "#0f172a",
                          display: "flex", alignItems: "center", gap: 8 }}>
              💬 Mises à jour
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>· {messages.length}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px" }}>
              {messages.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginTop: 30 }}>
                  Aucun message pour l'instant. Rédige ci-dessous pour partager une info avec l'équipe.
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id || m.created_at} m={m} />)
              )}
            </div>
            <div style={{ borderTop: "1px solid #eef1f5", padding: 12, background: "#fafbfc" }}>
              <textarea value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postMessage(); }}
                        placeholder="Rédigez une mise à jour (Ctrl/Cmd + Entrée pour envoyer)"
                        style={{ width: "100%", minHeight: 68, resize: "vertical", border: "1px solid #e2e8f0",
                                 borderRadius: 8, padding: 10, fontSize: 12.5, fontFamily: "inherit",
                                 color: "#0f172a", background: "#fff", boxSizing: "border-box", outline: "none" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
                <button onClick={postMessage} disabled={!messageDraft.trim() || posting}
                        style={{ padding: "8px 14px", borderRadius: 8,
                                 background: messageDraft.trim() ? "#0f172a" : "#cbd5e1", color: "#fff",
                                 border: "none", fontSize: 12, fontWeight: 600,
                                 cursor: messageDraft.trim() ? "pointer" : "not-allowed" }}>
                  {posting ? "Envoi…" : "Publier"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ─── Helpers locaux ───
const InfoRow = ({ label, value, mono, bold, colored }) => (
  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center",
                padding: "7px 0", borderBottom: "1px solid #eef1f5" }}>
    <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, letterSpacing: 0.3,
                  textTransform: "uppercase" }}>{label}</div>
    {colored ? (
      <span style={{ justifySelf: "start", padding: "3px 10px", borderRadius: 999,
                     background: colored.bg, color: colored.c, fontSize: 11.5, fontWeight: 700 }}>
        {value || "—"}
      </span>
    ) : (
      <div style={{ fontSize: 12.5, color: "#0f172a",
                    fontWeight: bold ? 700 : 500,
                    fontVariantNumeric: mono ? "tabular-nums" : "normal",
                    overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || "—"}
      </div>
    )}
  </div>
);

const MessageBubble = ({ m }) => {
  const EVENT_META = {
    message:                 { icon: "💬", label: null,                  bg: "#fff",     c: "#0f172a" },
    created:                 { icon: "🆕", label: "Projet créé",        bg: "#f1f5f9", c: "#475569" },
    stage_change:            { icon: "🔁", label: "Changement d'étape", bg: "#fef3c7", c: "#92400e" },
    team_add:                { icon: "👥", label: "Membre ajouté",      bg: "#dbeafe", c: "#1e40af" },
    delivery_note_created:   { icon: "📄", label: "BL généré",          bg: "#dcfce7", c: "#065f46" },
    delivery_note_signed:    { icon: "✍️", label: "BL signé",           bg: "#dcfce7", c: "#065f46" },
  };
  const meta = EVENT_META[m.type] || { icon: "•", label: m.type, bg: "#f1f5f9", c: "#475569" };
  const created = m.created_at ? new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const text = (m.payload && m.payload.text)
    || (meta.label ? meta.label + (m.payload && m.payload.from ? " : " + m.payload.from : (m.payload && m.payload.to ? " → " + m.payload.to : "")) : "");

  if (m.type === "message") {
    return (
      <div style={{ marginBottom: 10, padding: "10px 12px", background: "#fff",
                    border: "1px solid #eef1f5", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#7e22ce", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700 }}>
            {(m.author_name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", flex: 1 }}>{m.author_name || "—"}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{created}</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#0f172a", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8, padding: "6px 10px", background: meta.bg, borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
      <span>{meta.icon}</span>
      <span style={{ flex: 1, color: meta.c, fontWeight: 500 }}>{text}</span>
      <span style={{ fontSize: 10, color: meta.c, opacity: 0.7 }}>{created}</span>
    </div>
  );
};

// ─── Cellules éditables inline ───
// Pattern : la valeur n'est sauvegardée que sur blur ou Entrée (pas pendant la saisie).
const labelStyle = { fontSize: 10.5, color: "#64748b", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" };
const rowStyle = { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: "1px solid #eef1f5" };
const inputStyle = { width: "100%", padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box", outline: "none" };
const SavingDot = ({ on }) => on ? <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 6 }}>💾</span> : null;

const EditText = ({ label, value, onSave, bold, mono, placeholder, savingKey, saving }) => {
  const [local, setLocal] = React.useState(value || "");
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { if (!dirty) setLocal(value || ""); }, [value]);
  const commit = () => { if (dirty && local !== (value || "")) { setDirty(false); onSave(local); } else setDirty(false); };
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}<SavingDot on={saving === savingKey} /></div>
      <input value={local} onChange={(e) => { setLocal(e.target.value); setDirty(true); }}
             onBlur={commit}
             onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
             placeholder={placeholder || ""}
             style={{ ...inputStyle, fontWeight: bold ? 700 : 500,
                      fontVariantNumeric: mono ? "tabular-nums" : "normal",
                      borderColor: dirty ? "#f59e0b" : "#e2e8f0",
                      background: dirty ? "#fffbeb" : "#fff" }} />
    </div>
  );
};

const EditNumber = ({ label, value, onSave, suffix, savingKey, saving }) => {
  const [local, setLocal] = React.useState(value != null ? String(value) : "");
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { if (!dirty) setLocal(value != null ? String(value) : ""); }, [value]);
  const commit = () => {
    const num = local === "" ? null : Number(local);
    if (dirty && num !== (value == null ? null : Number(value))) { setDirty(false); onSave(num); } else setDirty(false);
  };
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}<SavingDot on={saving === savingKey} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input type="number" step="0.01" value={local}
               onChange={(e) => { setLocal(e.target.value); setDirty(true); }}
               onBlur={commit}
               onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
               style={{ ...inputStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600,
                        borderColor: dirty ? "#f59e0b" : "#e2e8f0",
                        background: dirty ? "#fffbeb" : "#fff" }} />
        {suffix && <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{suffix}</span>}
      </div>
    </div>
  );
};

const EditDate = ({ label, value, onSave, savingKey, saving }) => {
  const cur = value ? String(value).slice(0, 10) : "";
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}<SavingDot on={saving === savingKey} /></div>
      <input type="date" value={cur}
             onChange={(e) => onSave(e.target.value || null)}
             style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }} />
    </div>
  );
};

const EditSelect = ({ label, value, onSave, options, savingKey, saving }) => {
  const cur = options.find((o) => o.k === value);
  const colored = cur && cur.colored;
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}<SavingDot on={saving === savingKey} /></div>
      <select value={value} onChange={(e) => onSave(e.target.value)}
              style={{ ...inputStyle, fontWeight: 700,
                       background: colored ? colored.bg : "#fff",
                       color: colored ? colored.c : "#0f172a",
                       borderColor: colored ? colored.bg : "#e2e8f0" }}>
        {options.map((o) => <option key={o.k} value={o.k}>{o.label}</option>)}
      </select>
    </div>
  );
};

const EditTextarea = ({ value, onSave, placeholder, savingKey, saving }) => {
  const [local, setLocal] = React.useState(value || "");
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { if (!dirty) setLocal(value || ""); }, [value]);
  const commit = () => { if (dirty && local !== (value || "")) { setDirty(false); onSave(local); } else setDirty(false); };
  return (
    <div>
      <textarea value={local}
                onChange={(e) => { setLocal(e.target.value); setDirty(true); }}
                onBlur={commit}
                placeholder={placeholder || ""}
                style={{ width: "100%", minHeight: 70, resize: "vertical", padding: 10,
                         border: "1px solid " + (dirty ? "#f59e0b" : "#eef1f5"), borderRadius: 8,
                         fontSize: 12.5, lineHeight: 1.55, color: "#0f172a",
                         background: dirty ? "#fffbeb" : "#fff", fontFamily: "inherit",
                         boxSizing: "border-box", outline: "none" }} />
      {dirty && <div style={{ fontSize: 9.5, color: "#b45309", marginTop: 4 }}>✎ clique en dehors pour sauvegarder</div>}
    </div>
  );
};

window.ProjectQuickView = ProjectQuickView;
