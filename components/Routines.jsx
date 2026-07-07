// ════════════════════════════════════════════════════════════════════
// Routines — plan de charge récurrent (compta) : tâches groupées par
// fréquence (quotidien / hebdo / quinzaine / mensuel), cochées PAR PÉRIODE
// (une routine hebdo se recoche chaque semaine). Chaque tâche pointe vers la
// tuile du Hub qui la réalise. S'appuie sur window.api.routines.
// ════════════════════════════════════════════════════════════════════
const Routines = () => {
  const A = window.api && window.api.routines;
  const ROUTES = (window.HubNav && window.HubNav.ROUTES) || {};
  const MODULE_LABEL = { accounting: "Comptabilité", contracts: "Contrats", treasury: "Trésorerie", commercial: "Gestion commerciale", projects: "Projets", tech: "Ticketing", reports: "Rapports", hr: "RH & Paie", intel: "Intelligence" };
  const FREQ = [
    { k: "quotidien", label: "Quotidien", color: "#dc2626" },
    { k: "hebdo", label: "Hebdomadaire", color: "#ea580c" },
    { k: "quinzaine", label: "Quinzaine", color: "#7c3aed" },
    { k: "mensuel", label: "Mensuel (clôture)", color: "#0e7a55" },
  ];

  const [tasks, setTasks] = React.useState([]);
  const [done, setDone] = React.useState(new Set());
  const [loading, setLoading] = React.useState(true);
  const [serviceF, setServiceF] = React.useState("all");
  const [edit, setEdit] = React.useState(null);
  const who = (window.HubAccess && window.HubAccess.getCurrentUser && (window.HubAccess.getCurrentUser() || {}).name) || "";

  // ── Clés de période (date du jour) ────────────────────────────────
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const isoWeek = (d) => { const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - day); const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)); const w = Math.ceil((((dt - ys) / 86400000) + 1) / 7); return dt.getUTCFullYear() + "-W" + pad(w); };
  const periodKey = (freq) => {
    if (freq === "quotidien") return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    if (freq === "hebdo") return isoWeek(now);
    if (freq === "quinzaine") return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + (now.getDate() <= 15 ? "Q1" : "Q2");
    return now.getFullYear() + "-" + pad(now.getMonth() + 1); // mensuel
  };
  const periodLabel = (freq) => {
    if (freq === "quotidien") return "aujourd'hui " + pad(now.getDate()) + "/" + pad(now.getMonth() + 1);
    if (freq === "hebdo") return "semaine " + isoWeek(now).split("-W")[1];
    if (freq === "quinzaine") return (now.getDate() <= 15 ? "1re" : "2e") + " quinzaine";
    return now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };
  const allPeriodKeys = FREQ.map((f) => periodKey(f.k));

  const reload = React.useCallback(async () => {
    if (!A) return; setLoading(true);
    try {
      const [t, ds] = await Promise.all([A.tasks(), A.doneSet(allPeriodKeys)]);
      setTasks(t || []); setDone(ds || new Set());
    } catch (e) { console.warn(e); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  const services = ["all", ...Array.from(new Set(tasks.map((t) => t.service).filter(Boolean)))];
  const visible = tasks.filter((t) => serviceF === "all" || t.service === serviceF);
  const isDone = (t) => done.has(t.id + "|" + periodKey(t.frequency));

  const toggle = async (t) => {
    const pk = periodKey(t.frequency); const key = t.id + "|" + pk; const next = !done.has(key);
    setDone((s) => { const n = new Set(s); if (next) n.add(key); else n.delete(key); return n; }); // optimiste
    try { await A.setDone(t.id, pk, next, who); } catch (e) { reload(); }
  };
  const saveEdit = async (t) => {
    if (!t.action) { (window.HubToast ? window.HubToast.error : alert)("Libellé requis"); return; }
    try { await A.saveTask(t); setEdit(null); await reload(); } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
  };
  const removeT = async (t) => { if (!confirm("Retirer « " + t.action + " » ?")) return; try { await A.removeTask(t.id); await reload(); } catch (e) {} };

  const grpStats = (freq) => { const list = visible.filter((t) => t.frequency === freq); const d = list.filter(isDone).length; return { total: list.length, done: d, pct: list.length ? Math.round(d / list.length * 100) : 0 }; };

  return (
    <div style={ST.frame}>
      <header style={ST.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span><span style={{ color: "#0f172a", fontWeight: 600 }}>Routines & clôtures</span>
        </div>
        <button onClick={() => setEdit({ service: "", action: "", frequency: "mensuel", module_key: "" })} style={ST.btnGhost}>+ Nouvelle tâche</button>
      </header>

      <div style={ST.titleRow}>
        <div><h1 style={ST.h1}>✅ Routines & clôtures</h1><p style={ST.sub}>Plan de charge récurrent de la comptabilité — coché par période.</p></div>
      </div>

      {/* Filtre service */}
      <div style={{ padding: "0 28px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {services.map((s) => <button key={s} onClick={() => setServiceF(s)} style={{ ...ST.chip, ...(serviceF === s ? { background: "#4f46e5", color: "#fff" } : {}) }}>{s === "all" ? "Tous les services" : s}</button>)}
      </div>

      {loading ? <div style={ST.empty}>Chargement…</div> : (
        <div style={ST.body}>
          {FREQ.map((f) => {
            const list = visible.filter((t) => t.frequency === f.k);
            if (!list.length) return null;
            const st = grpStats(f.k);
            return (
              <section key={f.k} style={ST.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 999, background: f.color }} /> {f.label}
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: "#94a3b8" }}>· {periodLabel(f.k)}</span>
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 120, height: 6, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: st.pct + "%", height: "100%", background: st.pct === 100 ? "#10b981" : f.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.pct === 100 ? "#10b981" : "#475569" }}>{st.done}/{st.total}</span>
                  </div>
                </div>
                {list.map((t) => {
                  const dn = isDone(t); const href = ROUTES[t.module_key];
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid #f1f5f9", opacity: dn ? 0.6 : 1 }}>
                      <input type="checkbox" checked={dn} onChange={() => toggle(t)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                      <span style={{ flex: 1, fontSize: 12.5, textDecoration: dn ? "line-through" : "none" }}>{t.action}</span>
                      {t.service && <span style={{ fontSize: 10, background: "#f1f5f9", color: "#475569", padding: "1px 7px", borderRadius: 999 }}>{t.service}</span>}
                      {href && <a href={href} style={{ fontSize: 11, color: "#3730a3", textDecoration: "none", whiteSpace: "nowrap" }}>→ {MODULE_LABEL[t.module_key] || t.module_key}</a>}
                      <button onClick={() => setEdit(t)} style={ST.mini}>✎</button>
                      <button onClick={() => removeT(t)} style={{ ...ST.mini, color: "#dc2626" }}>×</button>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      {edit && (
        <div style={ST.overlay} onClick={() => setEdit(null)}>
          <div style={ST.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16 }}>{edit.id ? "Éditer la tâche" : "Nouvelle tâche"}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={ST.lbl}>Libellé *</label><input value={edit.action || ""} onChange={(e) => setEdit({ ...edit, action: e.target.value })} style={ST.input} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={ST.lbl}>Service</label><input value={edit.service || ""} onChange={(e) => setEdit({ ...edit, service: e.target.value.toUpperCase() })} placeholder="TRESORERIE, FACTURATION…" style={ST.input} /></div>
                <div><label style={ST.lbl}>Fréquence</label>
                  <select value={edit.frequency || "mensuel"} onChange={(e) => setEdit({ ...edit, frequency: e.target.value })} style={ST.input}>
                    {FREQ.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
                  </select></div>
              </div>
              <div><label style={ST.lbl}>Tuile liée</label>
                <select value={edit.module_key || ""} onChange={(e) => setEdit({ ...edit, module_key: e.target.value })} style={ST.input}>
                  <option value="">— Aucune —</option>
                  {Object.keys(MODULE_LABEL).map((k) => <option key={k} value={k}>{MODULE_LABEL[k]}</option>)}
                </select></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setEdit(null)} style={ST.btnGhost}>Annuler</button>
              <button onClick={() => saveEdit(edit)} style={ST.btnPrimary}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ST = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  titleRow: { padding: "20px 28px 6px", background: "#fff" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  btnGhost: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", border: 0, background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  chip: { padding: "5px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" },
  body: { padding: "12px 28px 60px", display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 16 },
  mini: { padding: "3px 7px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12.5, fontStyle: "italic" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 12, padding: 22, width: "100%", maxWidth: 520 },
  lbl: { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" },
};

window.Routines = Routines;
