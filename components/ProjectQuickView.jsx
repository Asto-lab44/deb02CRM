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

  const regenerateBL = async () => {
    if (!proj) return;
    setGeneratingBL(true);
    try {
      // 1. Si on a déjà un bl_doc_id en data, regen direct
      let blId = proj.data && proj.data.bl_doc_id;
      // 2. Sinon, chercher le BL lié via commande_id / opportunity_id
      if (!blId) {
        const found = await window.api.commercialDocs.findBLForProject(proj);
        if (found) blId = found.id;
      }
      if (!blId) {
        if (window.HubToast) window.HubToast.warn("Aucun BL trouvé pour ce projet. Le cascade workflow doit d'abord créer un BL.");
        setGeneratingBL(false);
        return;
      }
      await window.api.commercialDocs.regenerateBLPdf(blId);
      if (window.HubToast) window.HubToast.success("✓ PDF du BL généré et attaché");
      await reload();
      if (onChanged) onChanged();
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
                <EditNumber label="Montant HT" value={proj.amount_ht} suffix=" €" savingKey="amount_ht" saving={savingField}
                            onSave={(v) => saveField("amount_ht", v)} />
                <EditNumber label="Montant TTC" value={proj.amount_ttc} suffix=" €" savingKey="amount_ttc" saving={savingField}
                            onSave={(v) => saveField("amount_ttc", v)} />
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

          {/* ─── CENTER : BL PDF ─── */}
          <section style={{ overflow: "hidden", display: "flex", flexDirection: "column", background: "#f3f5f8" }}>
            <div style={{ padding: "10px 18px", borderBottom: "1px solid #eef1f5", background: "#fff",
                          display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>📄 Bon de livraison</div>
              {proj && proj.data && proj.data.bl_pdf_url && (
                <>
                  <span style={{ flex: 1 }} />
                  <a href={proj.data.bl_pdf_url} target="_blank" rel="noreferrer"
                     style={{ fontSize: 11.5, color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>
                    ↗ Ouvrir en plein écran
                  </a>
                </>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, padding: 12 }}>
              {proj && proj.data && proj.data.bl_pdf_url ? (
                <iframe src={proj.data.bl_pdf_url} title="BL PDF"
                        style={{ width: "100%", height: "100%", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              height: "100%", color: "#94a3b8", textAlign: "center", padding: 30 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    Aucun BL PDF disponible
                  </div>
                  <div style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5, maxWidth: 360 }}>
                    Le BL PDF est généré automatiquement quand le cascade workflow
                    transforme la commande en bon de livraison. Pour ce projet,
                    tu peux générer (ou régénérer) le PDF manuellement :
                  </div>
                  <button onClick={regenerateBL} disabled={generatingBL || !proj}
                          style={{ marginTop: 16, padding: "10px 18px", borderRadius: 8, background: "#0f172a",
                                   color: "#fff", border: "none", fontSize: 12.5, fontWeight: 600,
                                   cursor: generatingBL ? "wait" : "pointer" }}>
                    {generatingBL ? "Génération en cours…" : "📄 Générer le BL"}
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
                    fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
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
                      fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
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
               style={{ ...inputStyle, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
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
             style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
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
