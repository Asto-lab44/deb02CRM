// Module équipe commerciale — vue manager 10 commerciaux

const SalesTeam = () => {
  const Avatar = ({ name, size = 24, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", M: "#a855f7", N: "#ec4899", E: "#14b8a6", A: "#dc2626", J: "#8b5cf6", P: "#0891b2", R: "#f97316", D: "#84cc16" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  // Équipe Astorya — chargée + stats live depuis Supabase
  const [reps, setReps] = React.useState([
    { id: 1, name: "Romain Daviaud",  role: "Direction · Achat",  color: "#4f46e5", region: "France", quotaTarget: 0, quotaDone: 0, deals: 0, pipe: 0, won: 0, lost: 0, calls: 0, emails: 0, meetings: 0, winRate: 0, velocity: 0, trend: "up", rank: 1, status: "online", topDeal: "—" },
    { id: 2, name: "Augustin Morin",  role: "Direction · Commercial", color: "#10b981", region: "France", quotaTarget: 0, quotaDone: 0, deals: 0, pipe: 0, won: 0, lost: 0, calls: 0, emails: 0, meetings: 0, winRate: 0, velocity: 0, trend: "up", rank: 2, status: "online", topDeal: "—" },
  ]);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.opportunities.list().then((opps) => {
      setReps((arr) => arr.map((r) => {
        const mine = (opps || []).filter((o) => (o.owner || "").toLowerCase().includes(r.name.split(" ")[0].toLowerCase()));
        const won = mine.filter((o) => o.stage === "won");
        const lost = mine.filter((o) => o.stage === "lost");
        const active = mine.filter((o) => o.stage !== "won" && o.stage !== "lost");
        const sum = (lst, f = "amount_eur") => lst.reduce((s, o) => s + (Number(o[f]) || 0), 0);
        const topOpp = mine.slice().sort((a, b) => (b.amount_eur || 0) - (a.amount_eur || 0))[0];
        const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
        return {
          ...r,
          deals: mine.length,
          pipe: Math.round(sum(active) / 1000),
          won: Math.round(sum(won) / 1000),
          lost: Math.round(sum(lost) / 1000),
          quotaDone: Math.round(sum(won) / 1000),
          winRate,
          topDeal: topOpp ? `${topOpp.name} · ${Math.round((topOpp.amount_eur || 0) / 1000)} k€` : "—",
        };
      }));
    }).catch(() => {});
  }, []);

  // Team aggregates
  const team = {
    totalQuota: reps.reduce((s, r) => s + r.quotaTarget, 0),
    totalDone: reps.reduce((s, r) => s + r.quotaDone, 0),
    totalPipe: reps.reduce((s, r) => s + r.pipe, 0),
    totalDeals: reps.reduce((s, r) => s + r.deals, 0),
    totalCalls: reps.reduce((s, r) => s + r.calls, 0),
    totalEmails: reps.reduce((s, r) => s + r.emails, 0),
    totalMeetings: reps.reduce((s, r) => s + r.meetings, 0),
    avgWinRate: Math.round(reps.reduce((s, r) => s + r.winRate, 0) / reps.length),
  };

  const fmt = (n) => `${(n).toLocaleString("fr-FR")} k€`;
  const teamAttainment = team.totalQuota > 0 ? Math.round((team.totalDone / team.totalQuota) * 100) : 0;

  const statusColor = { online: "#10b981", away: "#f59e0b", offline: "#cbd5e1" };
  const trendIcon = (t) => t === "up" ? <span style={{ color: "#10b981" }}>▲</span> : t === "down" ? <span style={{ color: "#dc2626" }}>▼</span> : <span style={{ color: "#94a3b8" }}>—</span>;

  // Sparkline data (fake per rep)
  const sparks = {
    1: [40, 55, 48, 62, 70, 68, 78, 85, 82, 92, 88, 95],
    2: [35, 42, 48, 55, 58, 62, 68, 72, 78, 82, 85, 88],
    3: [30, 38, 45, 52, 48, 58, 62, 68, 65, 72, 78, 76],
    4: [55, 58, 62, 65, 68, 62, 58, 55, 52, 48, 50, 52],
    5: [25, 32, 38, 42, 48, 52, 55, 58, 62, 65, 68, 72],
    6: [60, 65, 62, 58, 55, 52, 48, 45, 42, 38, 42, 45],
    7: [40, 42, 38, 44, 42, 45, 43, 46, 44, 47, 45, 46],
    8: [22, 28, 32, 35, 38, 42, 46, 48, 52, 54, 58, 62],
    9: [50, 48, 52, 45, 42, 38, 35, 32, 28, 30, 28, 32],
    10: [12, 15, 18, 22, 26, 30, 34, 38, 42, 46, 48, 52],
  };

  return (
    <div style={teamStyles.frame}>
      {/* SIDEBAR */}
      <aside style={teamStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...teamStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={teamStyles.logo}><div style={teamStyles.logoMark}>H</div></div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>CRM commercial</div>
          </div>
        </a>
        <button style={teamStyles.newBtn}>+ Nouvelle opportunité <span style={teamStyles.kbd}>N</span></button>

        <div style={teamStyles.navSection}>
          <div style={teamStyles.navLabel}>Espace</div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>▦</span><span style={{ flex: 1 }}>Pipeline</span><span style={teamStyles.navCount}>32</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>◰</span><span style={{ flex: 1 }}>Comptes</span><span style={teamStyles.navCount}>412</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>◉</span><span style={{ flex: 1 }}>Contacts</span><span style={teamStyles.navCount}>1 184</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>✦</span><span style={{ flex: 1 }}>Activités</span><span style={teamStyles.navCount}>27</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>↗</span><span style={{ flex: 1 }}>Prévisions</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>▤</span><span style={{ flex: 1 }}>Rapports</span></div>
        </div>

        <div style={teamStyles.navSection}>
          <div style={teamStyles.navLabel}>Management</div>
          <div style={{ ...teamStyles.navItem, ...teamStyles.navItemActive }}><span style={teamStyles.bullet}>◉</span><span style={{ flex: 1 }}>Équipe commerciale</span><span style={teamStyles.navCount}>10</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>◷</span><span style={{ flex: 1 }}>Quotas trimestre</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>✦</span><span style={{ flex: 1 }}>Coaching 1:1</span><span style={teamStyles.navCount}>3</span></div>
          <div style={teamStyles.navItem}><span style={teamStyles.bullet}>◇</span><span style={{ flex: 1 }}>Territoires</span></div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={teamStyles.userRow}>
          <Avatar name="Augustin Morin" size={26} color="#0e7a55" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Augustin Morin</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Astorya · Nantes</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={teamStyles.main}>
        <header style={teamStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>CRM</div>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Équipe commerciale</div>
            <span style={teamStyles.totalChip}>Q2 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={teamStyles.search}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>⌕</span>
              <input placeholder="Rechercher un commercial…" style={teamStyles.searchInput} readOnly />
              <span style={teamStyles.kbdLight}>⌘K</span>
            </div>
            <button style={teamStyles.iconBtn}>◔</button>
            <button style={teamStyles.iconBtn}>?</button>
          </div>
        </header>

        {/* Title row */}
        <div style={teamStyles.titleRow}>
          <div>
            <h1 style={teamStyles.h1}>Équipe commerciale</h1>
            <p style={teamStyles.h1sub}>{reps.length} commercial{reps.length > 1 ? "iaux" : ""} · {team.totalDeals} opportunité{team.totalDeals > 1 ? "s" : ""} · {fmt(team.totalDone)} signé{team.totalDone > 0 ? "" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={teamStyles.segCtrl}>
              <button style={teamStyles.segBtn}>Mois</button>
              <button style={{ ...teamStyles.segBtn, ...teamStyles.segBtnActive }}>Trimestre</button>
              <button style={teamStyles.segBtn}>Année</button>
            </div>
            <button
              onClick={() => {
                const rows = [["Nom", "Rôle", "Deals", "Pipe (k€)", "Won (k€)", "Win rate %"]];
                reps.forEach((r) => rows.push([r.name, r.role, r.deals, r.pipe, r.won, r.winRate]));
                const csv = rows.map((r) => r.map((c) => `"${String(c || "")}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "equipe-commerciale.csv";
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              style={{ ...teamStyles.ghostBtn, cursor: "pointer" }}
            >Exporter CSV</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={teamStyles.kpiStrip}>
          <div style={{ ...teamStyles.kpi, ...teamStyles.kpiHero }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Quota trimestre</span>
              <span style={{ ...teamStyles.trendChip, background: "rgba(16,185,129,0.2)", color: "#86efac" }}>↑ +18 % vs Q1</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.8 }}>{teamAttainment}%</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{fmt(team.totalDone)} / {fmt(team.totalQuota)}</div>
            </div>
            <div style={teamStyles.kpiBar}><div style={{ width: `${teamAttainment}%`, height: "100%", background: "linear-gradient(90deg, #a78bfa, #10b981)", borderRadius: 999 }} /></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{team.totalQuota > 0 ? `Reste ${fmt(team.totalQuota - team.totalDone)}` : "Objectif équipe non défini"}</div>
          </div>

          <div style={teamStyles.kpi}>
            <span style={teamStyles.kpiLabel}>Pipeline total</span>
            <div style={teamStyles.kpiValue}>{fmt(team.totalPipe)}</div>
            <div style={teamStyles.kpiSub}>{team.totalDeals} deal{team.totalDeals > 1 ? "s" : ""} actif{team.totalDeals > 1 ? "s" : ""}</div>
          </div>
          <div style={teamStyles.kpi}>
            <span style={teamStyles.kpiLabel}>Win rate moy.</span>
            <div style={teamStyles.kpiValue}>{team.avgWinRate}%</div>
            <div style={teamStyles.kpiSub}><span style={{ color: "#10b981" }}>↑</span> +4 pts vs Q1</div>
          </div>
          <div style={teamStyles.kpi}>
            <span style={teamStyles.kpiLabel}>Activité 30 j</span>
            <div style={teamStyles.kpiValue}>{team.totalCalls + team.totalEmails + team.totalMeetings}</div>
            <div style={teamStyles.kpiSub}>{team.totalCalls} appels · {team.totalEmails} emails · {team.totalMeetings} RDV</div>
          </div>
          <div style={teamStyles.kpi}>
            <span style={teamStyles.kpiLabel}>À risque</span>
            <div style={{ ...teamStyles.kpiValue, color: "#dc2626" }}>3</div>
            <div style={teamStyles.kpiSub}>Sous 60% du quota à J-35</div>
          </div>
        </div>

        {/* Tabs + filters */}
        <div style={teamStyles.filterBar}>
          <div style={teamStyles.tabs}>
            <button style={{ ...teamStyles.tab, ...teamStyles.tabActive }}>Vue détaillée</button>
            <button style={teamStyles.tab}>Leaderboard</button>
            <button style={teamStyles.tab}>Coaching</button>
            <button style={teamStyles.tab}>Forecast</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={teamStyles.filterPill}>Tous (10)</button>
            <button style={teamStyles.filterPill}>+ Région</button>
            <button style={teamStyles.filterPill}>+ Séniorité</button>
            <span style={teamStyles.divider} />
            <button style={teamStyles.filterPill}>↕ Quota %</button>
            <button style={teamStyles.filterPill}>▦ Cartes</button>
            <button style={teamStyles.filterPill}>☰ Table</button>
          </div>
        </div>

        {/* Reps grid */}
        <div style={teamStyles.repsGrid}>
          {reps.map((r) => {
            const pct = Math.round((r.quotaDone / r.quotaTarget) * 100);
            const isTop = r.rank <= 3;
            const isRisk = pct < 60;
            const isLeader = r.rank === 1;
            return (
              <div key={r.id} style={{
                ...teamStyles.repCard,
                ...(isLeader ? teamStyles.repCardLeader : {}),
                ...(isRisk ? teamStyles.repCardRisk : {}),
              }}>
                {/* Top: rank + identity */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    ...teamStyles.rankBadge,
                    background: isTop ? (r.rank === 1 ? "#facc15" : r.rank === 2 ? "#cbd5e1" : "#fbbf24") : "#fff",
                    color: isTop ? "#0f172a" : "#94a3b8",
                    border: isTop ? "none" : "1.5px solid #e2e8f0",
                  }}>
                    {isTop ? (r.rank === 1 ? "🏆" : r.rank === 2 ? "🥈" : "🥉") : `#${r.rank}`}
                  </div>
                  <div style={{ position: "relative" }}>
                    <Avatar name={r.name} size={42} color={r.color} />
                    <span style={{ ...teamStyles.statusDot, background: statusColor[r.status] }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.role}</div>
                  </div>
                  <button style={teamStyles.cardMenu}>⋯</button>
                </div>

                {/* Quota progress (hero metric) */}
                <div style={teamStyles.quotaBlock}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Quota Q2</span>
                    <span style={{ fontSize: 11, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{fmt(r.quotaDone)} / {fmt(r.quotaTarget)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: pct >= 80 ? "#10b981" : pct >= 60 ? "#0f172a" : "#dc2626", letterSpacing: -0.5 }}>{pct}%</span>
                    {trendIcon(r.trend)}
                  </div>
                  <div style={teamStyles.quotaBar}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: "100%",
                      background: pct >= 80 ? "linear-gradient(90deg, #10b981, #34d399)" : pct >= 60 ? r.color : "linear-gradient(90deg, #dc2626, #ef4444)",
                      borderRadius: 999,
                    }} />
                  </div>
                </div>

                {/* Sparkline */}
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Tendance 12 sem.</span>
                    <span style={{ fontSize: 10.5, color: "#475569" }}>Win rate {r.winRate}%</span>
                  </div>
                  <Sparkline data={sparks[r.id]} color={r.color} />
                </div>

                {/* Mini metrics */}
                <div style={teamStyles.miniMetrics}>
                  <div style={teamStyles.miniMetric}>
                    <div style={teamStyles.miniK}>Pipe</div>
                    <div style={teamStyles.miniV}>{fmt(r.pipe)}</div>
                  </div>
                  <div style={teamStyles.miniMetric}>
                    <div style={teamStyles.miniK}>Deals</div>
                    <div style={teamStyles.miniV}>{r.deals}</div>
                  </div>
                  <div style={teamStyles.miniMetric}>
                    <div style={teamStyles.miniK}>Activité</div>
                    <div style={teamStyles.miniV}>{r.calls + r.emails + r.meetings}</div>
                  </div>
                </div>

                {/* Activity bars */}
                <div style={teamStyles.actBars}>
                  <ActBar label="Appels" value={r.calls} max={60} color="#10b981" icon="☎" />
                  <ActBar label="Emails" value={r.emails} max={200} color="#a855f7" icon="✉" />
                  <ActBar label="RDV" value={r.meetings} max={25} color="#0ea5e9" icon="👥" />
                </div>

                {/* Top deal */}
                <div style={teamStyles.topDeal}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>Top deal :</span>
                  <span style={{ fontSize: 11.5, color: "#0f172a", fontWeight: 600 }}>{r.topDeal}</span>
                </div>

                {/* Footer actions */}
                <div style={teamStyles.cardFoot}>
                  <span style={teamStyles.regionPill}>📍 {r.region}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={teamStyles.iconMini} title="Pipeline">▦</button>
                    <button style={teamStyles.iconMini} title="Message">✉</button>
                    <button style={teamStyles.iconMini} title="Coaching 1:1">✦</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 24 }} />
      </main>
    </div>
  );
};

// Mini components
const Sparkline = ({ data, color, w = 220, h = 32 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const last = data[data.length - 1];
  const lastY = h - ((last - min) / range) * h;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#sp-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={lastY} r="2.5" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
};

const ActBar = ({ label, value, max, color, icon }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", width: 12 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "#475569", width: 42 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "#f1f3f6", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, opacity: 0.75 }} />
      </div>
      <span style={{ fontSize: 11, color: "#0f172a", fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 26, textAlign: "right" }}>{value}</span>
    </div>
  );
};

const teamStyles = {
  frame: { width: "100%", minHeight: "100vh", display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a",  },

  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14, flexShrink: 0 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontVariantNumeric: "tabular-nums" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 11 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 24px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  totalChip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontVariantNumeric: "tabular-nums" },
  search: { display: "flex", alignItems: "center", gap: 8, width: 320, height: 30, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  searchInput: { border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 12.5 },
  kbdLight: { fontSize: 10.5, padding: "1px 5px", borderRadius: 4, background: "#fff", border: "1px solid #e2e8f0", color: "#94a3b8", fontVariantNumeric: "tabular-nums" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },

  titleRow: { padding: "18px 24px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.6, margin: 0, color: "#0f172a" },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  segCtrl: { display: "flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" },
  segBtn: { padding: "5px 12px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  segBtnActive: { background: "#0f172a", color: "#fff" },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 13px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  kpiStrip: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 10, padding: "4px 24px 14px" },
  kpi: { padding: "12px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },
  kpiHero: { background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)", border: "none", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.25)" },
  kpiLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" },
  kpiValue: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 2 },
  kpiSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  kpiBar: { width: "100%", height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 999, marginTop: 10, overflow: "hidden" },
  trendChip: { fontSize: 10, padding: "1px 7px", borderRadius: 999, fontWeight: 700 },

  filterBar: { padding: "10px 24px", borderTop: "1px solid #eef1f5", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  tabs: { display: "flex", gap: 2 },
  tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#0f172a", color: "#fff" },
  filterPill: { padding: "5px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  divider: { width: 1, height: 18, background: "#eef1f5", alignSelf: "center", margin: "0 4px" },

  // Reps grid
  repsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, padding: "18px 24px" },
  repCard: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, position: "relative" },
  repCardLeader: { background: "linear-gradient(180deg, #fffdf5, #fff)", borderColor: "#fde68a", boxShadow: "0 0 0 1px #fde68a, 0 4px 12px rgba(251,191,36,0.08)" },
  repCardRisk: { borderLeft: "3px solid #dc2626", paddingLeft: 14 },

  rankBadge: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 },
  statusDot: { position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 999, border: "2px solid #fff" },
  cardMenu: { width: 26, height: 26, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, borderRadius: 4 },

  quotaBlock: { padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  quotaBar: { width: "100%", height: 6, background: "#eef1f5", borderRadius: 999, overflow: "hidden" },

  miniMetrics: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12, padding: "10px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" },
  miniMetric: { textAlign: "left" },
  miniK: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  miniV: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2, letterSpacing: -0.3, fontFamily: "'Inter', system-ui, sans-serif" },

  actBars: { display: "flex", flexDirection: "column", gap: 6 },

  topDeal: { display: "flex", gap: 6, alignItems: "center", marginTop: 12, padding: "8px 10px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 6 },

  cardFoot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" },
  regionPill: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#eef1f5", color: "#475569", fontWeight: 500 },
  iconMini: { width: 26, height: 26, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 12 },
};

window.SalesTeam = SalesTeam;
