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

const IntelligenceConcurrentielle = () => {
  const [tasks, setTasks] = React.useState([]);
  const locamFileRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState({ source: "all", urgency: "all" });
  const [editing, setEditing] = React.useState(null); // {type: 'leasing'|'warranty', data: {...}}

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.intelTasks.list({ horizon_days: 365 });
      setTasks(list || []);
    } catch (e) { setTasks([]); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  const SOURCE_META = {
    leasing:    { icon: "💼", label: "Leasing",     color: "#3b82f6" },
    warranty:   { icon: "🛡", label: "Garantie",    color: "#a855f7" },
    concurrent: { icon: "⚔", label: "Concurrent",  color: "#dc2626" },
  };

  // Filtrage
  const filtered = React.useMemo(() => tasks.filter((t) => {
    if (filter.source !== "all" && t.source !== filter.source) return false;
    if (filter.urgency === "urgent" && t.days_left > 30) return false;
    if (filter.urgency === "soon" && (t.days_left <= 30 || t.days_left > 90)) return false;
    if (filter.urgency === "later" && t.days_left <= 90) return false;
    return true;
  }), [tasks, filter]);

  // KPIs
  const stats = React.useMemo(() => {
    const s = { urgent: 0, soon: 0, later: 0, total: tasks.length, by_source: {} };
    tasks.forEach((t) => {
      if (t.days_left <= 30) s.urgent++;
      else if (t.days_left <= 90) s.soon++;
      else s.later++;
      s.by_source[t.source] = (s.by_source[t.source] || 0) + 1;
    });
    return s;
  }, [tasks]);

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const newLeasing = () => setEditing({ type: "leasing", data: { bailleur: "Locam", duree_mois: 36, status: "actif" } });
  const newWarranty = () => setEditing({ type: "warranty", data: { type: "serveur", manufacturer: "Dell", status: "actif", garantie_type: "standard" } });
  const editTask = (t) => {
    if (t.source === "leasing") setEditing({ type: "leasing", data: t.raw });
    else if (t.source === "warranty") setEditing({ type: "warranty", data: t.raw });
    else if (t.source === "concurrent") window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(t.opp_id) + (t.client_id ? "&client=" + encodeURIComponent(t.client_id) : "");
  };

  return (
    <div style={icStyles.frame}>
      <aside style={icStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={icStyles.logo}>H</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Intelligence concurrentielle</div>
          </div>
        </a>

        <button onClick={newLeasing} style={{ ...icStyles.newBtn, background: "#3b82f6" }}>+ Leasing</button>
        <button onClick={newWarranty} style={{ ...icStyles.newBtn, background: "#a855f7" }}>+ Garantie</button>

        <div style={icStyles.navLabel}>Urgence</div>
        {[
          { k: "all",    label: "Toutes",      count: stats.total },
          { k: "urgent", label: "≤ 30 jours",  count: stats.urgent },
          { k: "soon",   label: "31 – 90 j",   count: stats.soon },
          { k: "later",  label: "> 90 jours",  count: stats.later },
        ].map((u) => (
          <div key={u.k} onClick={() => setFilter((f) => ({ ...f, urgency: u.k }))}
               style={{ ...icStyles.navItem, ...(filter.urgency === u.k ? icStyles.navItemActive : {}) }}>
            <span style={{ flex: 1 }}>{u.label}</span>
            <span style={icStyles.navCount}>{u.count}</span>
          </div>
        ))}

        <div style={icStyles.navLabel}>Source</div>
        {[
          { k: "all", label: "Toutes les sources", count: stats.total, color: "#0f172a" },
          { k: "leasing", label: "💼 Leasing", count: stats.by_source.leasing || 0, color: "#3b82f6" },
          { k: "warranty", label: "🛡 Garanties", count: stats.by_source.warranty || 0, color: "#a855f7" },
          { k: "concurrent", label: "⚔ Concurrents", count: stats.by_source.concurrent || 0, color: "#dc2626" },
        ].map((sc) => (
          <div key={sc.k} onClick={() => setFilter((f) => ({ ...f, source: sc.k }))}
               style={{ ...icStyles.navItem, ...(filter.source === sc.k ? icStyles.navItemActive : {}) }}>
            <span style={{ flex: 1, color: filter.source === sc.k ? sc.color : undefined }}>{sc.label}</span>
            <span style={icStyles.navCount}>{sc.count}</span>
          </div>
        ))}
      </aside>

      <main style={icStyles.main}>
        <header style={icStyles.topbar}>
          <div>
            <h1 style={icStyles.h1}>Intelligence concurrentielle</h1>
            <p style={icStyles.sub}>Échéances commerciales à anticiper · Leasing · Garanties · Contrats concurrents</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={locamFileRef} type="file" accept=".csv,text/csv,application/vnd.ms-excel"
                   style={{ display: "none" }}
                   onChange={async (e) => {
                     const f = e.target.files && e.target.files[0];
                     if (!f) return;
                     e.target.value = "";
                     try {
                       if (window.HubToast) window.HubToast.info("Import LOCAM en cours…");
                       const res = await window.api.leasingContracts.importLocamCSV(f);
                       const msg = "✓ LOCAM importé · " + res.imported + " nouveaux · " + res.updated + " mis à jour · " + res.skipped + " ignorés";
                       if (window.HubToast) window.HubToast.success(msg);
                       if (res.errors && res.errors.length) console.warn("[LOCAM import errors]", res.errors);
                       reload();
                     } catch (err) {
                       if (window.HubToast) window.HubToast.error("Import LOCAM : " + (err.message || err));
                     }
                   }} />
            <button onClick={() => locamFileRef.current && locamFileRef.current.click()}
                    style={{ ...icStyles.primaryBtn, background: "#2563eb" }}
                    title="Importer le fichier CSV « Export_Location_Folders » exporté depuis l'extranet LOCAM">
              ⇣ Importer LOCAM (CSV)
            </button>
            <button onClick={reload} style={icStyles.primaryBtn}>↻ Rafraîchir</button>
          </div>
        </header>

        <div style={icStyles.kpiRow}>
          <KPI label="🔥 URGENT (≤ 30j)" value={stats.urgent} color="#dc2626" big />
          <KPI label="⏳ À venir (≤ 90j)" value={stats.soon} color="#f59e0b" />
          <KPI label="📆 Plus tard" value={stats.later} color="#0ea5e9" />
          <KPI label="Total échéances" value={stats.total} color="#3730a3" />
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={icStyles.empty}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Aucune échéance dans cette catégorie</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Ajoute un contrat de leasing ou une garantie via les boutons en haut à gauche,<br/>
              ou renseigne un concurrent + date de fin de contrat dans une opportunité CRM.
            </div>
          </div>
        ) : (
          <div style={icStyles.list}>
            {filtered.map((t) => {
              const meta = SOURCE_META[t.source] || { icon: "•", color: "#64748b", label: t.source };
              const urgencyColor = t.days_left <= 30 ? "#dc2626" : t.days_left <= 90 ? "#f59e0b" : "#64748b";
              const urgencyBg = t.days_left <= 30 ? "#fee2e2" : t.days_left <= 90 ? "#fef3c7" : "#f1f5f9";
              return (
                <div key={t.id} onClick={() => editTask(t)} style={icStyles.taskRow}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: meta.color + "20", color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: meta.color + "15", color: meta.color, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>{meta.label}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{t.title}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3 }}>{t.subtitle}</div>
                    {t.client_name && (
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        📍 <strong>{t.client_name}</strong>
                        {t.commercial ? <span style={{ color: "#94a3b8" }}> · 👤 {t.commercial}</span> : null}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Échéance</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtDate(t.date_echeance)}</div>
                    <div style={{ display: "inline-block", marginTop: 4, padding: "2px 10px", borderRadius: 999, background: urgencyBg, color: urgencyColor, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      J{t.days_left >= 0 ? "−" : "+"}{Math.abs(t.days_left)}
                    </div>
                  </div>
                  <span style={{ color: "#cbd5e1", fontSize: 16, marginLeft: 8 }}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editing && <EditModal editing={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
};

const KPI = ({ label, value, color, big }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: big ? 26 : 22, fontWeight: 700, color: color || "#0f172a", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
  </div>
);

const EditModal = ({ editing, onClose, onSaved }) => {
  const [d, setD] = React.useState(editing.data);
  const [saving, setSaving] = React.useState(false);
  const isLeasing = editing.type === "leasing";
  const setF = (k, v) => setD((cur) => ({ ...cur, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const apiObj = isLeasing ? window.api.leasingContracts : window.api.warranties;
      if (!d.client_name || !d.date_fin) {
        if (window.HubToast) window.HubToast.error("Client et date de fin obligatoires");
        setSaving(false); return;
      }
      if (d.id) await apiObj.update(d.id, d);
      else await apiObj.create(d);
      if (window.HubToast) window.HubToast.success("✓ Enregistré");
      onSaved && onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!d.id) return;
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      const apiObj = isLeasing ? window.api.leasingContracts : window.api.warranties;
      await apiObj.remove(d.id);
      if (window.HubToast) window.HubToast.success("✓ Supprimé");
      onSaved && onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  return (
    <div style={icStyles.modalOverlay} onClick={onClose}>
      <div style={icStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <header style={icStyles.modalHead}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{isLeasing ? "💼 Contrat de leasing" : "🛡 Garantie constructeur"}</h2>
          <button onClick={onClose} style={icStyles.closeBtn}>×</button>
        </header>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={icStyles.lbl}>{isLeasing ? "Bailleur" : "Constructeur"} *</label>
              {isLeasing ? (
                <select value={d.bailleur || ""} onChange={(e) => setF("bailleur", e.target.value)} style={icStyles.input}>
                  <option>Locam</option><option>Grenke</option><option>BNP Lease</option><option>Autre</option>
                </select>
              ) : (
                <select value={d.manufacturer || ""} onChange={(e) => setF("manufacturer", e.target.value)} style={icStyles.input}>
                  <option>Dell</option><option>HP</option><option>Lenovo</option><option>Cisco</option><option>APC</option><option>Autre</option>
                </select>
              )}
            </div>
            <div>
              <label style={icStyles.lbl}>{isLeasing ? "N° contrat" : "Modèle"}</label>
              <input value={isLeasing ? (d.ref_contrat || "") : (d.model || "")}
                onChange={(e) => setF(isLeasing ? "ref_contrat" : "model", e.target.value)}
                placeholder={isLeasing ? "LCM-2023-XXX" : "PowerEdge T440"} style={icStyles.input} />
            </div>
          </div>
          {!isLeasing && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={icStyles.lbl}>Type</label>
                <select value={d.type || ""} onChange={(e) => setF("type", e.target.value)} style={icStyles.input}>
                  <option>serveur</option><option>switch</option><option>poste</option><option>onduleur</option><option>autre</option>
                </select>
              </div>
              <div>
                <label style={icStyles.lbl}>Niveau garantie</label>
                <select value={d.garantie_type || ""} onChange={(e) => setF("garantie_type", e.target.value)} style={icStyles.input}>
                  <option value="standard">Standard</option>
                  <option value="next_business_day">NBD</option>
                  <option value="4h">4h sur site</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label style={icStyles.lbl}>N° série</label>
                <input value={d.serial_number || ""} onChange={(e) => setF("serial_number", e.target.value)} placeholder="ABC123XYZ" style={icStyles.input} />
              </div>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={icStyles.lbl}>Client *</label>
            <input value={d.client_name || ""} onChange={(e) => setF("client_name", e.target.value)} placeholder="Nom raison sociale" style={icStyles.input} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={icStyles.lbl}>{isLeasing ? "Désignation matériel financé" : "Description"}</label>
            <input value={d.designation || ""} onChange={(e) => setF("designation", e.target.value)}
              placeholder={isLeasing ? "Serveur Dell + 5 PC HP + switches" : "Couverture, particularités"}
              style={icStyles.input} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isLeasing ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={icStyles.lbl}>Date début</label>
              <input type="date" value={isLeasing ? (d.date_debut || "") : (d.date_achat || "")}
                onChange={(e) => setF(isLeasing ? "date_debut" : "date_achat", e.target.value)} style={icStyles.input} />
            </div>
            <div>
              <label style={icStyles.lbl}>Date fin *</label>
              <input type="date" value={d.date_fin || ""} onChange={(e) => setF("date_fin", e.target.value)} style={icStyles.input} />
            </div>
            {isLeasing && (
              <>
                <div>
                  <label style={icStyles.lbl}>Durée (mois)</label>
                  <input type="number" value={d.duree_mois || 36} onChange={(e) => setF("duree_mois", Number(e.target.value))} style={icStyles.input} />
                </div>
                <div>
                  <label style={icStyles.lbl}>Loyer mensuel (€)</label>
                  <input type="number" step="0.01" value={d.loyer_mensuel || ""} onChange={(e) => setF("loyer_mensuel", Number(e.target.value))} style={icStyles.input} />
                </div>
              </>
            )}
          </div>
          {isLeasing && (
            <div style={{ marginBottom: 12 }}>
              <label style={icStyles.lbl}>Montant total HT (€)</label>
              <input type="number" step="0.01" value={d.montant_ht || ""} onChange={(e) => setF("montant_ht", Number(e.target.value))} style={icStyles.input} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={icStyles.lbl}>Commercial en charge</label>
              <input value={d.commercial || ""} onChange={(e) => setF("commercial", e.target.value)} placeholder="Romain Daviaud" style={icStyles.input} />
            </div>
            <div>
              <label style={icStyles.lbl}>Statut</label>
              <select value={d.status || "actif"} onChange={(e) => setF("status", e.target.value)} style={icStyles.input}>
                <option value="actif">Actif</option>
                <option value={isLeasing ? "termine" : "expire"}>{isLeasing ? "Terminé" : "Expiré"}</option>
                <option value={isLeasing ? "rachat" : "renouvele"}>{isLeasing ? "Rachat" : "Renouvelé"}</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={icStyles.lbl}>Notes</label>
            <textarea value={d.notes || ""} onChange={(e) => setF("notes", e.target.value)} rows={2} style={{ ...icStyles.input, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14 }}>
            {d.id ? <button onClick={remove} style={{ ...icStyles.ghostBtn, color: "#dc2626", borderColor: "#fecaca" }}>🗑 Supprimer</button> : <div />}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={icStyles.ghostBtn}>Annuler</button>
              <button onClick={save} disabled={saving} style={icStyles.primaryBtn}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const icStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 230, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #b91c1c, #dc2626)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "block", width: "100%", padding: "8px 12px", color: "#fff", border: 0, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 6 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#fef2f2", color: "#991b1b", fontWeight: 600 },
  navCount: { fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },

  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  primaryBtn: { padding: "8px 14px", background: "#dc2626", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" },

  kpiRow: { display: "flex", gap: 10, marginBottom: 16 },
  empty: { padding: 60, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center" },

  list: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" },
  taskRow: { display: "flex", alignItems: "center", padding: "14px 16px", gap: 12, borderBottom: "1px solid #f1f5f9", cursor: "pointer" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 720, boxShadow: "0 20px 60px rgba(15,23,42,0.4)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },
};
