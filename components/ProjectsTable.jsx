// ════════════════════════════════════════════════════════════════════
// ProjectsTable — Vue tableau de Projets & Livrables (style Monday)
// ════════════════════════════════════════════════════════════════════
//
// Colonnes : Nom · Client · Étape · Chef de projet · Date butoir ·
//            Livré le · Sage · BL · Actions
//
// Fonctionnalités :
//  - Recherche fulltext (nom + client + sage_ref)
//  - Filtres : étape, chef de projet
//  - Tri par toute colonne (clic sur l'en-tête)
//  - Édition inline de l'étape via <select> avec confirmation
//  - Bouton « ⊞ Tuile » → ouvre ProjectQuickView (modale 3 colonnes)
//  - Liens vers Kanban / Calendrier / Gantt depuis le header
//
// ════════════════════════════════════════════════════════════════════

const ProjectsTable = () => {
  const STAGES = (window.api && window.api.projects && window.api.projects.STAGES) || [
    { k: "recu",         label: "Reçu",            color: "#94a3b8" },
    { k: "preparation",  label: "En préparation",  color: "#a855f7" },
    { k: "pret_livrer",  label: "Prêt à livrer",   color: "#ea580c" },
    { k: "livre",        label: "Livré",           color: "#f59e0b" },
    { k: "installe",     label: "Installé",        color: "#0ea5e9" },
    { k: "clos",         label: "Clos",            color: "#10b981" },
  ];
  const STAGE_BG = { recu: "#f1f5f9", preparation: "#f5efff", pret_livrer: "#fef0e6", livre: "#fffbeb", installe: "#e0f4fc", clos: "#dcfce7" };
  const STAGE_C  = { recu: "#475569", preparation: "#7e22ce", pret_livrer: "#9a3412", livre: "#854d0e", installe: "#0e7490", clos: "#065f46" };

  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterStage, setFilterStage] = React.useState("");
  const [filterPM, setFilterPM] = React.useState("");
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");
  const [quickViewId, setQuickViewId] = React.useState(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.projects.list({ limit: 500 });
      setProjects(list || []);
    } catch (e) { setProjects([]); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  // ── Filtrage + tri
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filterStage && p.stage !== filterStage) return false;
      if (filterPM && p.pm_name !== filterPM) return false;
      if (!q) return true;
      const hay = [p.name, p.client_name, p.sage_ref, p.description].filter(Boolean).join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }, [projects, search, filterStage, filterPM]);

  const sorted = React.useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const A = a[sortBy], B = b[sortBy];
      if (A == null && B == null) return 0;
      if (A == null) return 1;
      if (B == null) return -1;
      if (typeof A === "number" && typeof B === "number") return sortDir === "asc" ? A - B : B - A;
      return sortDir === "asc" ? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A));
    });
    return out;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const sortIcon = (col) => sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  // ── Changement d'étape avec confirmation
  const changeStage = async (p, newStage) => {
    if (p.stage === newStage) return;
    const fromLbl = (STAGES.find((s) => s.k === p.stage) || {}).label || p.stage;
    const toLbl = (STAGES.find((s) => s.k === newStage) || {}).label || newStage;
    const ok = window.HubModal
      ? await window.HubModal.confirm({
          title: "Confirmer le déplacement",
          message: "Déplacer « " + (p.name || "ce projet") + " » de « " + fromLbl + " » vers « " + toLbl + " » ?",
          okLabel: "Oui, déplacer", okStyle: "primary",
        })
      : confirm("Déplacer « " + (p.name || "ce projet") + " » de « " + fromLbl + " » vers « " + toLbl + " » ?");
    if (!ok) return;
    setProjects((arr) => arr.map((x) => x.id === p.id ? { ...x, stage: newStage } : x));
    try {
      await window.api.projects.changeStage(p.id, newStage);
      if (window.HubToast) window.HubToast.success("✓ « " + (p.name || "Projet") + " » → « " + toLbl + " »");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      reload();
    }
  };

  const pms = Array.from(new Set(projects.map((p) => p.pm_name).filter(Boolean))).sort();
  const overdueCount = projects.filter((p) => p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule").length;

  return (
    <div style={S.frame}>
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h1 style={S.h1}>Projets & Livrables — Tableau</h1>
            <p style={S.h1sub}>{projects.length} projet{projects.length > 1 ? "s" : ""} · {overdueCount} en retard · vue tableau (style Monday)</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Rechercher projet, ref Sage, client…" value={search}
                   onChange={(e) => setSearch(e.target.value)} style={S.search} />
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={S.btnGhost}>
              <option value="">Toutes les étapes</option>
              {STAGES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
            </select>
            <select value={filterPM} onChange={(e) => setFilterPM(e.target.value)} style={S.btnGhost}>
              <option value="">Tous les chefs de projet</option>
              {pms.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <a href="/projets" style={{ ...S.btnGhost, textDecoration: "none" }} title="Vue kanban">▦ Kanban</a>
            <a href="/projets-calendrier" style={{ ...S.btnGhost, textDecoration: "none" }} title="Vue calendrier mensuelle">📅 Calendrier</a>
            <a href="/projets-gantt" style={{ ...S.btnGhost, textDecoration: "none" }} title="Vue Gantt">📊 Gantt</a>
          </div>
        </header>

        <div style={S.tableWrap}>
          {loading ? (
            <div style={S.empty}>Chargement…</div>
          ) : sorted.length === 0 ? (
            <div style={S.empty}>Aucun projet ne correspond aux filtres actuels.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th} onClick={() => toggleSort("name")}>Projet{sortIcon("name")}</th>
                  <th style={S.th} onClick={() => toggleSort("client_name")}>Client{sortIcon("client_name")}</th>
                  <th style={{ ...S.th, width: 160 }} onClick={() => toggleSort("stage")}>Étape{sortIcon("stage")}</th>
                  <th style={S.th} onClick={() => toggleSort("pm_name")}>Chef de projet{sortIcon("pm_name")}</th>
                  <th style={{ ...S.th, width: 110 }} onClick={() => toggleSort("delivery_due")}>Date butoir{sortIcon("delivery_due")}</th>
                  <th style={{ ...S.th, width: 110 }} onClick={() => toggleSort("delivered_at")}>Livré le{sortIcon("delivered_at")}</th>
                  <th style={{ ...S.th, width: 100 }} onClick={() => toggleSort("sage_ref")}>Sage{sortIcon("sage_ref")}</th>
                  <th style={{ ...S.th, width: 60, textAlign: "center" }}>BL</th>
                  <th style={{ ...S.th, width: 90, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const overdue = p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule";
                  const hasBL = p.data && p.data.bl_pdf_url;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: overdue ? "#fef9f9" : "#fff" }}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 6, height: 24, borderRadius: 2, background: ((STAGES.find((s) => s.k === p.stage) || {}).color) || "#cbd5e1" }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.name || "—"}
                            </div>
                            {overdue && <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>⏰ En retard</span>}
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontSize: 12, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.client_name || "—"}
                        </div>
                      </td>
                      <td style={{ ...S.td, padding: 4 }}>
                        <select value={p.stage || "recu"}
                                onChange={(e) => changeStage(p, e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid " + (STAGE_C[p.stage] || "#e2e8f0"),
                                         borderRadius: 6, fontSize: 11.5, fontWeight: 700,
                                         background: STAGE_BG[p.stage] || "#fff",
                                         color: STAGE_C[p.stage] || "#0f172a", cursor: "pointer" }}>
                          {STAGES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontSize: 12, color: "#0f172a" }}>{p.pm_name || <span style={{ color: "#94a3b8" }}>—</span>}</div>
                      </td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: overdue ? "#dc2626" : "#0f172a", fontWeight: overdue ? 700 : 500 }}>
                        {fmtDate(p.delivery_due)}
                      </td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#475569" }}>
                        {fmtDate(p.delivered_at)}
                      </td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#475569" }}>
                        {p.sage_ref || <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        {hasBL ? (
                          <a href={p.data.bl_pdf_url} target="_blank" rel="noreferrer"
                             title="Télécharger le BL PDF"
                             style={{ display: "inline-block", padding: "3px 8px", fontSize: 10.5, fontWeight: 700,
                                      background: "#e0f2fe", color: "#075985", borderRadius: 4, textDecoration: "none" }}>
                            📄 PDF
                          </a>
                        ) : <span style={{ fontSize: 16, color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        <button onClick={() => setQuickViewId(p.id)}
                                title="Ouvrir la fiche rapide"
                                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700,
                                         background: "#0f172a", color: "#fff", border: 0,
                                         borderRadius: 5, cursor: "pointer" }}>
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {quickViewId && window.ProjectQuickView && (
        React.createElement(window.ProjectQuickView, {
          projectId: quickViewId,
          onClose: () => setQuickViewId(null),
          onChanged: () => reload(),
        })
      )}
    </div>
  );
};

const S = {
  frame: { display: "flex", minHeight: "100vh", background: "#f3f5f8", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  h1: { fontSize: 20, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: -0.3 },
  h1sub: { fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" },
  search: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", width: 280, fontFamily: "inherit" },
  btnGhost: { padding: "8px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  tableWrap: { padding: 16, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #eef1f5", boxShadow: "0 1px 2px rgba(15,23,42,0.04)", minWidth: 1100 },
  th: { padding: "11px 12px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, background: "#fafbfc", borderBottom: "1px solid #eef1f5", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", fontSize: 12.5, color: "#0f172a", verticalAlign: "middle" },
  empty: { padding: "60px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#fff", borderRadius: 10, border: "1px dashed #e2e8f0" },
};

window.ProjectsTable = ProjectsTable;
