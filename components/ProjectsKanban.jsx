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

const ProjectsKanban = () => {
  const STAGES = (window.api && window.api.projects && window.api.projects.STAGES) || [
    { k: "recu",         label: "Reçu",            color: "#94a3b8" },
    { k: "devis_valide", label: "Devis validé",    color: "#3b82f6" },
    { k: "preparation",  label: "En préparation",  color: "#a855f7" },
    { k: "pret_livrer",  label: "Prêt à livrer",   color: "#ea580c" },
    { k: "livre",        label: "Livré",           color: "#f59e0b" },
    { k: "installe",     label: "Installé",        color: "#0ea5e9" },
    { k: "clos",         label: "Clos",            color: "#10b981" },
  ];

  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState({ kind: "all", value: null });
  const [draggedId, setDraggedId] = React.useState(null);

  // User connecté (pour filtre "Mes projets")
  const currentUser = (window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null;

  const reload = React.useCallback(async () => {
    if (!window.api || !window.api.projects) { setLoading(false); return; }
    setLoading(true);
    const list = await window.api.projects.list();
    setProjects(list || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    reload();
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  // Filtrage
  const filteredProjects = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !(p.name || "").toLowerCase().includes(q) && !(p.id || "").toLowerCase().includes(q) && !(p.sage_ref || "").toLowerCase().includes(q)) return false;
      if (filter.kind === "mine") {
        // user connecté = chef projet
        if (!currentUser) return false;
        return (p.pm_name === currentUser.name) || (p.pm_id && currentUser.id && p.pm_id === currentUser.id);
      }
      if (filter.kind === "overdue") {
        return p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule";
      }
      return true;
    });
  }, [projects, search, filter, currentUser]);

  const counts = React.useMemo(() => {
    const c = { all: projects.length, mine: 0, overdue: 0 };
    STAGES.forEach((s) => { c[s.k] = 0; });
    projects.forEach((p) => {
      c[p.stage] = (c[p.stage] || 0) + 1;
      if (currentUser && (p.pm_name === currentUser.name || p.pm_id === currentUser.id)) c.mine++;
      if (p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule") c.overdue++;
    });
    return c;
  }, [projects, currentUser]);

  // Drag-and-drop : change le stage du projet
  const handleDrop = async (newStage) => {
    if (!draggedId) return;
    const proj = projects.find((p) => p.id === draggedId);
    setDraggedId(null);
    if (!proj || proj.stage === newStage) return;
    // Optimistic update
    setProjects((arr) => arr.map((p) => p.id === draggedId ? { ...p, stage: newStage } : p));
    try {
      await window.api.projects.changeStage(draggedId, newStage);
      if (window.HubToast) window.HubToast.success("✓ Projet déplacé vers « " + STAGES.find(s => s.k === newStage).label + " »");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      reload(); // rollback
    }
  };

  const newProject = async () => {
    if (!window.HubModal) return;
    const name = await window.HubModal.prompt({ title: "Nouveau projet", label: "Nom du projet", placeholder: "ex : Migration AD AXA Wealth", okLabel: "Créer" });
    if (!name || !name.trim()) return;
    try {
      const proj = await window.api.projects.create({ name: name.trim(), stage: "recu" });
      if (window.HubToast) window.HubToast.success("✓ Projet créé");
      window.location.href = "/projet?id=" + encodeURIComponent(proj.id);
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  // Aperçu compact d'une carte projet
  const ProjectCard = ({ p }) => {
    const overdue = p.delivery_due && new Date(p.delivery_due) < new Date() && p.stage !== "clos";
    return (
      <div
        draggable
        onDragStart={() => setDraggedId(p.id)}
        onDragEnd={() => setDraggedId(null)}
        onClick={() => window.location.href = "/projet?id=" + encodeURIComponent(p.id)}
        style={{
          background: "#fff",
          border: "1px solid " + (overdue ? "#fca5a5" : "#eef1f5"),
          borderLeft: "3px solid " + (overdue ? "#dc2626" : STAGES.find(s => s.k === p.stage)?.color || "#94a3b8"),
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 8,
          cursor: "pointer",
          boxShadow: draggedId === p.id ? "0 8px 24px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
          opacity: draggedId === p.id ? 0.6 : 1,
          transition: "box-shadow .12s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {p.sage_ref || p.id.slice(0, 12)}
          </div>
          {overdue && <span style={{ fontSize: 9, color: "#fff", background: "#dc2626", padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 }}>EN RETARD</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 3, lineHeight: 1.3 }}>{p.name}</div>
        {p.amount_ttc && (
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {Math.round(p.amount_ttc / 1000)} k€ TTC
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: "#64748b" }}>
          <span>{p.pm_name || "— Non assigné"}</span>
          {p.delivery_due && <span>📅 {new Date(p.delivery_due).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={S.frame}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <a href="/" style={{ ...S.brand, textDecoration: "none", color: "inherit" }}>
          <div style={S.logo}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Projets & Livrables</div>
          </div>
        </a>

        <button onClick={newProject} style={S.newBtn}>+ Nouveau projet</button>

        <div style={S.navSection}>
          <div style={S.navLabel}>Vues</div>
          <div onClick={() => setFilter({ kind: "all", value: null })} style={{ ...S.navItem, ...(filter.kind === "all" ? S.navItemActive : {}) }}>
            <span style={S.bullet}>▦</span><span style={{ flex: 1 }}>Tous les projets</span><span style={S.navCount}>{counts.all}</span>
          </div>
          <div onClick={() => setFilter({ kind: "mine", value: null })} style={{ ...S.navItem, ...(filter.kind === "mine" ? S.navItemActive : {}) }}>
            <span style={S.bullet}>◉</span><span style={{ flex: 1 }}>Mes projets</span><span style={S.navCount}>{counts.mine}</span>
          </div>
          <div onClick={() => setFilter({ kind: "overdue", value: null })} style={{ ...S.navItem, ...(filter.kind === "overdue" ? S.navItemActive : {}), color: counts.overdue > 0 ? "#dc2626" : undefined }}>
            <span style={S.bullet}>⚠</span><span style={{ flex: 1 }}>En retard</span><span style={{ ...S.navCount, background: counts.overdue > 0 ? "#fee2e2" : "#f1f5f9", color: counts.overdue > 0 ? "#9b1c1c" : "#64748b" }}>{counts.overdue}</span>
          </div>
        </div>

        <div style={S.navSection}>
          <div style={S.navLabel}>Par étape</div>
          {STAGES.map((s) => (
            <div key={s.k} style={S.navItem}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, marginRight: 4 }} />
              <span style={{ flex: 1 }}>{s.label}</span>
              <span style={S.navCount}>{counts[s.k] || 0}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h1 style={S.h1}>Projets & Livrables</h1>
            <p style={S.h1sub}>{counts.all} projet{counts.all > 1 ? "s" : ""} · {counts.overdue} en retard · sync Sage Gestion Co i7</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Rechercher projet, ref Sage, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={S.search}
            />
            <button onClick={() => {
              if (window.HubToast) window.HubToast.info("Sync Sage manuelle — branchement script ODBC à venir. Documentation dans /scripts/sage-sync.md");
            }} style={S.btnGhost}>⇣ Importer Sage</button>
          </div>
        </header>

        {/* KANBAN */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Chargement…</div>
        ) : (
          <div style={S.kanban}>
            {STAGES.map((stage) => {
              const stageProjects = filteredProjects.filter((p) => p.stage === stage.k);
              return (
                <div key={stage.k}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={() => handleDrop(stage.k)}
                     style={S.col}>
                  <div style={S.colHead}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: stage.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{stage.label}</span>
                    <span style={S.colCount}>{stageProjects.length}</span>
                  </div>
                  <div style={S.colBody}>
                    {stageProjects.length === 0 && (
                      <div style={S.colEmpty}>Aucun projet à cette étape</div>
                    )}
                    {stageProjects.map((p) => <ProjectCard key={p.id} p={p} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const S = {
  frame: { display: "flex", minHeight: "100vh", background: "#f3f5f8", fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { width: 240, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 14, flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 12px", borderBottom: "1px solid #f1f5f9" },
  logo: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  newBtn: { display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 12px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 8, fontWeight: 600, fontSize: 12.5, cursor: "pointer" },
  navSection: { display: "flex", flexDirection: "column", gap: 2 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 8px 4px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  bullet: { width: 12, color: "#94a3b8", fontSize: 11 },
  navCount: { fontSize: 10.5, padding: "1px 7px", background: "#f1f5f9", color: "#64748b", borderRadius: 999, fontWeight: 600 },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a", letterSpacing: -0.3 },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  search: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, width: 260, outline: "none", fontFamily: "inherit" },
  btnGhost: { padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },

  kanban: { display: "flex", gap: 12, padding: 20, overflowX: "auto", flex: 1 },
  col: { width: 260, flexShrink: 0, background: "#f8fafc", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column" },
  colHead: { display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1px solid #eef1f5", marginBottom: 10 },
  colCount: { fontSize: 10.5, padding: "2px 8px", background: "#fff", color: "#64748b", borderRadius: 999, fontWeight: 700, marginLeft: "auto" },
  colBody: { minHeight: 100, flex: 1 },
  colEmpty: { padding: 14, textAlign: "center", fontSize: 11, color: "#cbd5e1", border: "1px dashed #e2e8f0", borderRadius: 6, background: "#fff" },
};

window.ProjectsKanban = ProjectsKanban;
