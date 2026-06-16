// ════════════════════════════════════════════════════════════════════
// ProjectsCalendar — Vue calendrier des projets (/projets-calendrier)
// ════════════════════════════════════════════════════════════════════
//
// Calendrier mensuel avec affichage des projets selon delivery_due.
// - Navigation mois précédent/suivant
// - Clic sur un jour → liste des projets prévus
// - Clic sur un projet → ouvre /projet?id=…
// - Code couleur par stage
//
// Source : api.projects.list() filtré côté client par delivery_due dans le mois.
// ════════════════════════════════════════════════════════════════════

const ProjectsCalendar = () => {
  const STAGES = (window.api && window.api.projects && window.api.projects.STAGES) || [];
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  const [selectedDay, setSelectedDay] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!window.api || !window.api.projects) { setLoading(false); return; }
    setLoading(true);
    const list = await window.api.projects.list();
    setProjects((list || []).filter((p) => p.delivery_due));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    reload();
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  // Navigation
  const prevMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); setSelectedDay(null); };
  const nextMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); setSelectedDay(null); };
  const today = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCurrentMonth(d); setSelectedDay(null); };

  // Compose la grille (semaine commence le lundi)
  const firstDay = new Date(currentMonth);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const grid = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    if (dayNum >= 1 && dayNum <= daysInMonth) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
      grid.push({ date, dayNum, inMonth: true });
    } else {
      grid.push({ date: null, dayNum: null, inMonth: false });
    }
  }

  // Indexe les projets par date string YYYY-MM-DD
  const projectsByDay = React.useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      const d = p.delivery_due ? p.delivery_due.slice(0, 10) : null;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(p);
    });
    return map;
  }, [projects]);

  const isoDate = (d) => {
    if (!d) return "";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  const todayStr = isoDate(new Date());
  const monthLabel = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const selectedDayProjects = selectedDay ? (projectsByDay[selectedDay] || []) : [];

  // Stats du mois
  const monthStats = React.useMemo(() => {
    const inMonth = projects.filter((p) => {
      const d = new Date(p.delivery_due);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });
    const overdue = inMonth.filter((p) => new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule").length;
    const totalAmount = inMonth.reduce((s, p) => s + (Number(p.amount_ttc) || 0), 0);
    return { count: inMonth.length, overdue, totalAmount };
  }, [projects, currentMonth]);

  return (
    <div style={S.frame}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <a href="/" style={{ ...S.brand, textDecoration: "none", color: "inherit" }}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={S.logo}>H</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Calendrier projets</div>
          </div>
        </a>
        <a href="/projets" style={{ ...S.viewBtn, ...S.viewBtnGhost, textDecoration: "none" }}>📋 Vue Kanban</a>
        <div style={{ ...S.viewBtn, ...S.viewBtnActive }}>📅 Vue Calendrier</div>
        <a href="/projets-gantt" style={{ ...S.viewBtn, ...S.viewBtnGhost, textDecoration: "none" }}>📊 Vue Gantt</a>

        <div style={S.statsCard}>
          <div style={S.statLabel}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>
          <div style={S.statValue}>{monthStats.count}</div>
          <div style={S.statSub}>livraison{monthStats.count > 1 ? "s" : ""} prévue{monthStats.count > 1 ? "s" : ""}</div>
          {monthStats.overdue > 0 && (
            <div style={{ ...S.statSub, color: "#dc2626", marginTop: 6, fontWeight: 700 }}>⚠ {monthStats.overdue} en retard</div>
          )}
        </div>

        <div style={S.legend}>
          <div style={S.legendLabel}>Légende stages</div>
          {STAGES.map((s) => (
            <div key={s.k} style={S.legendItem}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h1 style={S.h1}>Calendrier livraisons</h1>
            <p style={S.h1sub}>Vue mensuelle des projets par date de livraison souhaitée</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={prevMonth} style={S.navBtn}>‹</button>
            <button onClick={today} style={S.btnPrimary}>Aujourd'hui</button>
            <button onClick={nextMonth} style={S.navBtn}>›</button>
            <div style={{ marginLeft: 14, fontSize: 16, fontWeight: 700, color: "#0f172a", minWidth: 160 }}>
              {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Chargement…</div>
        ) : (
          <div style={S.calendarWrap}>
            {/* Calendrier */}
            <div style={S.calendar}>
              {/* Header jours semaine */}
              <div style={S.daysHeader}>
                {dayNames.map((n) => <div key={n} style={S.dayName}>{n}</div>)}
              </div>
              {/* Grille jours */}
              <div style={S.daysGrid}>
                {grid.map((cell, i) => {
                  if (!cell.inMonth) return <div key={i} style={S.dayCellEmpty} />;
                  const iso = isoDate(cell.date);
                  const dayProjects = projectsByDay[iso] || [];
                  const isToday = iso === todayStr;
                  const isSelected = iso === selectedDay;
                  return (
                    <div key={i}
                         onClick={() => setSelectedDay(isSelected ? null : iso)}
                         style={{
                           ...S.dayCell,
                           ...(isToday ? S.dayCellToday : {}),
                           ...(isSelected ? S.dayCellSelected : {}),
                           cursor: dayProjects.length > 0 ? "pointer" : "default",
                         }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? "#3730a3" : "#0f172a" }}>{cell.dayNum}</span>
                        {dayProjects.length > 0 && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "#3730a3", color: "#fff", fontWeight: 700 }}>
                            {dayProjects.length}
                          </span>
                        )}
                      </div>
                      <div style={S.dayProjects}>
                        {dayProjects.slice(0, 3).map((p) => {
                          const stage = STAGES.find((s) => s.k === p.stage) || STAGES[0];
                          const overdue = new Date(p.delivery_due) < new Date() && p.stage !== "clos" && p.stage !== "annule";
                          return (
                            <div key={p.id}
                                 onClick={(e) => { e.stopPropagation(); window.location.href = "/projet?id=" + encodeURIComponent(p.id); }}
                                 style={{
                                   ...S.dayProject,
                                   background: stage.color + "15",
                                   borderLeft: "3px solid " + (overdue ? "#dc2626" : stage.color),
                                   color: stage.color,
                                 }}
                                 title={p.name + " · " + stage.label}>
                              {p.name}
                            </div>
                          );
                        })}
                        {dayProjects.length > 3 && (
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>+{dayProjects.length - 3} autres</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panneau jour sélectionné */}
            {selectedDay && selectedDayProjects.length > 0 && (
              <div style={S.dayPanel}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    📅 {new Date(selectedDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </h2>
                  <button onClick={() => setSelectedDay(null)} style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>×</button>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                  {selectedDayProjects.length} projet{selectedDayProjects.length > 1 ? "s" : ""} avec livraison ce jour
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedDayProjects.map((p) => {
                    const stage = STAGES.find((s) => s.k === p.stage) || STAGES[0];
                    return (
                      <a key={p.id} href={"/projet?id=" + encodeURIComponent(p.id)}
                         style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 8, background: "#fafbfc", border: "1px solid #eef1f5", textDecoration: "none", color: "inherit" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: stage.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {p.sage_ref ? "Sage " + p.sage_ref + " · " : ""}{stage.label}{p.pm_name ? " · " + p.pm_name : ""}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const S = {
  frame: { display: "flex", minHeight: "100vh", background: "#f3f5f8", fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { width: 240, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 12, flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 12px", borderBottom: "1px solid #f1f5f9" },
  logo: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  viewBtn: { display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textAlign: "left", cursor: "pointer" },
  viewBtnGhost: { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" },
  viewBtnActive: { background: "#0f172a", color: "#fff", border: "1px solid #0f172a" },
  statsCard: { background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, padding: 12, marginTop: 6 },
  statLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 4 },
  statSub: { fontSize: 11.5, color: "#64748b" },
  legend: { background: "#fff", padding: "10px 0", marginTop: 8 },
  legendLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, padding: "0 8px 6px" },
  legendItem: { display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", fontSize: 11.5, color: "#475569" },

  main: { flex: 1, display: "flex", flexDirection: "column" },
  topbar: { padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  navBtn: { width: 34, height: 34, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 16, fontWeight: 700, cursor: "pointer" },
  btnPrimary: { padding: "7px 14px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },

  calendarWrap: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, padding: 20 },
  calendar: { background: "#fff", borderRadius: 10, border: "1px solid #eef1f5", overflow: "hidden" },
  daysHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  dayName: { padding: "10px 6px", textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  daysGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(110px, auto)" },
  dayCell: { padding: 8, borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 4, transition: "background .1s" },
  dayCellEmpty: { background: "#fafbfc", borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" },
  dayCellToday: { background: "#eef2ff" },
  dayCellSelected: { background: "#fff4ff", boxShadow: "inset 0 0 0 2px #a855f7" },
  dayProjects: { display: "flex", flexDirection: "column", gap: 2, marginTop: 4, overflow: "hidden" },
  dayProject: { padding: "3px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" },
  dayPanel: { background: "#fff", borderRadius: 10, border: "1px solid #eef1f5", padding: 18, alignSelf: "flex-start", position: "sticky", top: 20 },
};

window.ProjectsCalendar = ProjectsCalendar;
