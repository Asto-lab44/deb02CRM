// PlanningCommercial — Vue calendrier Outlook des opportunités selon leurs
// deux types d'échéances : Date de décision potentielle (close_date, violet)
// et Échéance contrat concurrent (contract_end, cyan).
//
// Source de données : api.opportunities.list() — même flux que CRMPipeline.

const PlanningCommercial = () => {
  const [opps, setOpps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState("all"); // all | decision | concurrent
  // Mois affiché — par défaut le mois courant. Navigation < Aujourd'hui >.
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 7); // "YYYY-MM"
  });

  React.useEffect(() => {
    if (!window.api || !window.api.opportunities) return;
    window.api.opportunities.list().then((list) => {
      setOpps((list || []).filter((o) => o.stage !== "lost"));
      setLoading(false);
    }).catch((e) => { console.warn("[Planning]", e); setLoading(false); });
  }, []);

  const stageMeta = {
    qualif:    { label: "Prospect",    color: "#94a3b8" },
    discovery: { label: "Approche",    color: "#3b82f6" },
    propo:     { label: "Négociation", color: "#a855f7" },
    nego:      { label: "Conclusion",  color: "#ea580c" },
    won:       { label: "Ordre",       color: "#10b981" },
  };
  const kindMeta = {
    decision:   { color: "#a855f7", bg: "#f5efff", border: "#d8b4fe", label: "Décision potentielle" },
    concurrent: { color: "#0ea5e9", bg: "#e0f2fe", border: "#7dd3fc", label: "Fin contrat concurrent" },
  };

  // Aplatit chaque opp en 1 ou 2 entrées (une par date renseignée)
  const allEntries = React.useMemo(() => {
    const out = [];
    opps.forEach((o) => {
      const dec = o.close_date || (o.data && (o.data.close_date || o.data.decision_date)) || null;
      const con = o.contract_end || (o.data && o.data.contract_end) || null;
      if (dec && (filterType === "all" || filterType === "decision")) {
        out.push({ opp: o, date: dec.slice(0, 10), kind: "decision" });
      }
      if (con && (filterType === "all" || filterType === "concurrent")) {
        out.push({ opp: o, date: con.slice(0, 10), kind: "concurrent" });
      }
    });
    return out;
  }, [opps, filterType]);

  // Index des entrées par YYYY-MM-DD
  const byDate = React.useMemo(() => {
    const m = {};
    allEntries.forEach((e) => { (m[e.date] = m[e.date] || []).push(e); });
    return m;
  }, [allEntries]);

  // Construit la grille du mois courant (semaines de Lundi à Dimanche).
  const [year, month] = cursor.split("-").map((n) => parseInt(n, 10));
  const firstOfMonth = new Date(year, month - 1, 1);
  const monthLabel = firstOfMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  // Décalage en jours pour que la grille commence un lundi
  // (getDay() : 0=dim, 1=lun, ..., 6=sam → on veut 1=lun donc shift = (day+6)%7)
  const shiftStart = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - shiftStart);
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((shiftStart + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    return { date: iso, day: d.getDate(), inMonth: d.getMonth() === month - 1, weekday: (d.getDay() + 6) % 7 };
  });

  // Stats du mois affiché
  const monthEntries = allEntries.filter((e) => e.date.slice(0, 7) === cursor);
  const monthAmount = monthEntries.reduce((acc, e) => acc + (Number(e.opp.amount_eur) || 0), 0);
  const uniqueOppsMonth = new Set(monthEntries.map((e) => e.opp.id || e.opp.ref)).size;

  const navMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setCursor(d.toISOString().slice(0, 7));
  };
  const today = new Date().toISOString().slice(0, 10);

  const fmtAmount = (n) => n != null ? Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : "—";

  // Modal "voir tous les événements d'un jour" si > N
  const [dayPopup, setDayPopup] = React.useState(null);
  const MAX_VISIBLE_PER_DAY = 3;

  return (
    <div style={S.frame}>
      {/* Topbar */}
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", flexWrap: "wrap" }}>
          <a href="/crm" style={{ color: "#64748b", textDecoration: "none" }}>CRM</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Planning commercial</span>
        </div>
        <a href="/crm" style={S.btnGhost}>← Pipeline</a>
      </header>

      {/* Title row */}
      <div style={S.titleRow}>
        <div>
          <h1 style={S.h1}>Planning commercial</h1>
          <p style={S.h1sub}>
            {uniqueOppsMonth} opportunité{uniqueOppsMonth > 1 ? "s" : ""} · {monthEntries.length} échéance{monthEntries.length > 1 ? "s" : ""} ce mois · {fmtAmount(monthAmount)} cumulés
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Filtre type d'échéance */}
          <div style={{ display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" }}>
            {[
              { k: "all",        label: "Toutes" },
              { k: "decision",   label: "Décision" },
              { k: "concurrent", label: "Concurrent" },
            ].map((f) => (
              <button key={f.k} onClick={() => setFilterType(f.k)}
                      style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                               fontSize: 12, fontWeight: 600,
                               background: filterType === f.k ? "#0f172a" : "transparent",
                               color: filterType === f.k ? "#fff" : "#64748b" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Navigation mois */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => navMonth(-1)} style={S.navBtn} title="Mois précédent">‹</button>
            <button onClick={() => {
              const d = new Date(); d.setDate(1);
              setCursor(d.toISOString().slice(0, 7));
            }} style={{ ...S.navBtn, padding: "6px 14px", width: "auto" }}>Aujourd'hui</button>
            <button onClick={() => navMonth(1)} style={S.navBtn} title="Mois suivant">›</button>
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", textTransform: "capitalize", minWidth: 160 }}>
            {monthLabel}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div style={S.legend}>
        <span style={S.legendItem}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: kindMeta.decision.color }} />
          Date de décision potentielle
        </span>
        <span style={S.legendItem}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: kindMeta.concurrent.color }} />
          Échéance contrat concurrent
        </span>
      </div>

      {/* Calendrier */}
      <div style={S.body}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Chargement…</div>
        ) : (
          <div style={S.calendar}>
            {/* En-tête jours de la semaine */}
            <div style={S.weekHeader}>
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((d) => (
                <div key={d} style={S.weekHeaderCell}>{d}</div>
              ))}
            </div>

            {/* Grille des cellules jour */}
            <div style={S.grid}>
              {cells.map((c) => {
                const dayEntries = byDate[c.date] || [];
                const isToday = c.date === today;
                const isWeekend = c.weekday >= 5;
                const visible = dayEntries.slice(0, MAX_VISIBLE_PER_DAY);
                const hidden = dayEntries.length - visible.length;
                return (
                  <div key={c.date}
                       style={{
                         ...S.dayCell,
                         background: !c.inMonth ? "#fafbfc" : isToday ? "#fff7ed" : isWeekend ? "#fafbfc" : "#fff",
                         opacity: c.inMonth ? 1 : 0.5,
                       }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? "#fff" : c.inMonth ? "#0f172a" : "#94a3b8",
                        background: isToday ? "#dc2626" : "transparent",
                        width: 22, height: 22, borderRadius: 999,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}>{c.day}</span>
                      {dayEntries.length > 0 && (
                        <span style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600 }}>
                          {dayEntries.length} évén.
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {visible.map((e, i) => {
                        const k = kindMeta[e.kind];
                        const stage = stageMeta[e.opp.stage || "qualif"] || stageMeta.qualif;
                        return (
                          <a key={i}
                             href={"/avancer-opportunite?opp=" + encodeURIComponent(e.opp.id || e.opp.ref)}
                             title={(e.opp.name || "") + " — " + (e.opp.client_name || "") + " · " + k.label + " · " + fmtAmount(e.opp.amount_eur)}
                             style={{
                               display: "block",
                               padding: "3px 6px",
                               borderRadius: 4,
                               background: k.bg,
                               borderLeft: "3px solid " + k.color,
                               fontSize: 10.5,
                               color: "#0f172a",
                               textDecoration: "none",
                               overflow: "hidden",
                               textOverflow: "ellipsis",
                               whiteSpace: "nowrap",
                               fontWeight: 600,
                             }}>
                            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 999, background: stage.color, marginRight: 4, verticalAlign: "middle" }} />
                            {e.opp.name || "Opp."}
                          </a>
                        );
                      })}
                      {hidden > 0 && (
                        <button onClick={() => setDayPopup({ date: c.date, entries: dayEntries })}
                                style={{ background: "transparent", border: 0, padding: "2px 6px", fontSize: 10,
                                         color: "#3730a3", cursor: "pointer", fontWeight: 700, textAlign: "left" }}>
                          + {hidden} de plus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Popup détail d'une journée chargée */}
      {dayPopup && (
        <div onClick={() => setDayPopup(null)}
             style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
               style={{ background: "#fff", borderRadius: 12, padding: 20, maxWidth: 480, width: "90%",
                        maxHeight: "80vh", overflow: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                {new Date(dayPopup.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </h3>
              <button onClick={() => setDayPopup(null)}
                      style={{ width: 28, height: 28, border: 0, background: "#f1f5f9", borderRadius: 6,
                               cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayPopup.entries.map((e, i) => {
                const k = kindMeta[e.kind];
                const stage = stageMeta[e.opp.stage || "qualif"] || stageMeta.qualif;
                return (
                  <a key={i}
                     href={"/avancer-opportunite?opp=" + encodeURIComponent(e.opp.id || e.opp.ref)}
                     style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                              border: "1px solid " + k.border, background: k.bg, borderRadius: 8,
                              textDecoration: "none", color: "inherit" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{e.opp.name || "Opportunité"}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{e.opp.client_name || (e.opp.data && e.opp.data.client_name) || "—"}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 3,
                                       background: stage.color + "1a", color: stage.color, fontWeight: 700 }}>
                          {stage.label}
                        </span>
                        <span style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 3,
                                       background: k.color, color: "#fff", fontWeight: 700 }}>
                          {k.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                        {fmtAmount(e.opp.amount_eur)}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
  frame: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fafbfc",
           fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  btnGhost: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8,
              fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500, textDecoration: "none" },
  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eef1f5", background: "#fff", flexWrap: "wrap", gap: 16 },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0 },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  navBtn: { width: 32, height: 32, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8,
            fontSize: 15, fontWeight: 700, color: "#475569", cursor: "pointer", padding: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center" },
  legend: { display: "flex", gap: 18, padding: "12px 28px", borderBottom: "1px solid #eef1f5",
            background: "#fafbfc" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#475569" },
  body: { padding: "20px 28px 60px" },
  calendar: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden",
              boxShadow: "0 2px 6px rgba(15,23,42,0.04)" },
  weekHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#fafbfc",
                borderBottom: "1px solid #eef1f5" },
  weekHeaderCell: { padding: "10px 8px", fontSize: 11, fontWeight: 700, color: "#475569",
                    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" },
  dayCell: { minHeight: 110, padding: 6, borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
             display: "flex", flexDirection: "column", overflow: "hidden" },
};

window.PlanningCommercial = PlanningCommercial;
