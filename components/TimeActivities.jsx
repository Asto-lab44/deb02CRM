// ════════════════════════════════════════════════════════════════════
// TimeActivities — Page Temps & Activités (tracking utilisateurs)
// ════════════════════════════════════════════════════════════════════
//
// Vue admin pour suivre l'activité des collaborateurs :
// - KPIs en haut : connectés maintenant, verrouillés, sessions/jour, erreurs
// - Bloc "En ligne maintenant" : utilisateurs avec session active (< 5 min)
// - Bloc "Projets bloqués" : projets sans activité depuis 7 jours
// - Timeline d'événements filtrable (login/logout/lock/unlock/error/idle)
// - Détails session : durée, % verrouillage, page la plus consultée
//
// Sources : user_sessions + user_events + project_events
// ════════════════════════════════════════════════════════════════════

const TimeActivities = () => {
  const [stats, setStats] = React.useState({ online_now: 0, locked_now: 0, sessions_today: 0, events_today: 0, errors_today: 0 });
  const [sessions, setSessions] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [stalled, setStalled] = React.useState([]);
  const [filter, setFilter] = React.useState({ types: [], severity: null, since_hours: 24 });
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    if (!window.api || !window.api.userActivity) return;
    setLoading(true);
    try {
      const [s, sess, evs, st] = await Promise.all([
        window.api.userActivity.dashboardStats(),
        window.api.userActivity.sessions({ since_hours: filter.since_hours }),
        window.api.userActivity.events({
          types: filter.types.length ? filter.types : undefined,
          severity: filter.severity || undefined,
          since_hours: filter.since_hours,
          limit: 300,
        }),
        window.api.userActivity.stalledProjects({ days: 7 }),
      ]);
      setStats(s);
      setSessions(sess);
      setEvents(evs);
      setStalled(st);
    } catch (e) {
      console.warn("[TimeActivities] reload:", e);
    }
    setLoading(false);
  }, [filter.since_hours, filter.severity, filter.types.join(",")]);

  React.useEffect(() => { reload(); }, [reload]);
  // Refresh auto toutes les 30s
  React.useEffect(() => {
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);

  const fmtDuration = (ms) => {
    if (ms < 60000) return Math.round(ms / 1000) + "s";
    if (ms < 3600000) return Math.round(ms / 60000) + " min";
    const h = Math.floor(ms / 3600000); const m = Math.round((ms % 3600000) / 60000);
    return h + "h" + (m ? " " + m + "min" : "");
  };
  const fmtTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  // Sessions actives (< 5 min depuis last_activity) groupées par user
  const onlineUsers = React.useMemo(() => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return sessions.filter((s) => !s.ended_at && new Date(s.last_activity).getTime() > fiveMinAgo);
  }, [sessions]);

  return (
    <div style={taStyles.frame}>
      {/* SIDEBAR */}
      <aside style={taStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={taStyles.logo}>H</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Temps & Activités</div>
          </div>
        </a>

        <div style={taStyles.navLabel}>Fenêtre temporelle</div>
        {[
          { k: 1,    label: "Dernière heure" },
          { k: 24,   label: "24 dernières heures" },
          { k: 168,  label: "7 derniers jours" },
          { k: 720,  label: "30 derniers jours" },
        ].map((p) => (
          <div key={p.k} onClick={() => setFilter((f) => ({ ...f, since_hours: p.k }))}
               style={{ ...taStyles.navItem, ...(filter.since_hours === p.k ? taStyles.navItemActive : {}) }}>
            <span style={{ width: 14, color: filter.since_hours === p.k ? "#3730a3" : "#94a3b8" }}>◷</span>
            <span>{p.label}</span>
          </div>
        ))}

        <div style={taStyles.navLabel}>Filtrer événements</div>
        {[
          { k: "login",    label: "Connexions",     icon: "🔓" },
          { k: "logout",   label: "Déconnexions",   icon: "🔒" },
          { k: "lock",     label: "Verrouillages",  icon: "⏸" },
          { k: "unlock",   label: "Déverrouillages",icon: "▶" },
          { k: "error",    label: "Erreurs",        icon: "⚠" },
          { k: "idle_timeout", label: "Inactivités", icon: "💤" },
        ].map((t) => {
          const active = filter.types.includes(t.k);
          return (
            <div key={t.k} onClick={() => setFilter((f) => ({ ...f, types: active ? f.types.filter((x) => x !== t.k) : [...f.types, t.k] }))}
                 style={{ ...taStyles.navItem, ...(active ? taStyles.navItemActive : {}) }}>
              <span style={{ width: 14 }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          );
        })}
        {filter.types.length > 0 && (
          <div onClick={() => setFilter((f) => ({ ...f, types: [] }))} style={{ ...taStyles.navItem, color: "#dc2626", fontSize: 11, marginTop: 4 }}>✕ Effacer les filtres</div>
        )}
      </aside>

      {/* MAIN */}
      <main style={taStyles.main}>
        <header style={taStyles.topbar}>
          <div>
            <h1 style={taStyles.h1}>Temps & Activités</h1>
            <p style={taStyles.sub}>{filter.since_hours === 1 ? "Dernière heure" : filter.since_hours === 24 ? "Aujourd'hui" : filter.since_hours === 168 ? "7 derniers jours" : "30 derniers jours"} · Refresh auto 30s</p>
          </div>
          <button onClick={reload} style={taStyles.primaryBtn}>↻ Rafraîchir</button>
        </header>

        {/* KPIs */}
        <div style={taStyles.kpiRow}>
          <KPI label="🟢 En ligne maintenant" value={stats.online_now} color="#10b981" />
          <KPI label="🔒 Verrouillés" value={stats.locked_now} color="#f59e0b" />
          <KPI label="Sessions aujourd'hui" value={stats.sessions_today} color="#0ea5e9" />
          <KPI label="Événements" value={stats.events_today} color="#3730a3" />
          <KPI label="⚠ Erreurs aujourd'hui" value={stats.errors_today} color="#dc2626" />
        </div>

        {/* GRID : Online users + Stalled projects */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          {/* En ligne maintenant */}
          <section style={taStyles.card}>
            <h2 style={taStyles.h2}>🟢 En ligne maintenant <span style={taStyles.count}>{onlineUsers.length}</span></h2>
            <p style={taStyles.h2sub}>Utilisateurs actifs dans les 5 dernières minutes</p>
            {onlineUsers.length === 0 ? (
              <div style={taStyles.empty}>Personne en ligne pour le moment.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {onlineUsers.map((u) => {
                  const sessionMs = Date.now() - new Date(u.started_at).getTime();
                  const lockedPct = sessionMs > 0 ? Math.round((u.total_locked_s * 1000 / sessionMs) * 100) : 0;
                  return (
                    <div key={u.id} style={{ padding: 10, background: u.is_locked ? "#fff7ed" : "#ecfdf5", border: "1px solid " + (u.is_locked ? "#fed7aa" : "#a7f3d0"), borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: u.is_locked ? "#f59e0b" : "#10b981", boxShadow: "0 0 0 3px " + (u.is_locked ? "#fef3c7" : "#dcfce7") }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.user_name || u.user_email || "—"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Session : {fmtDuration(sessionMs)} · {u.is_locked ? "🔒 Verrouillé" : "🟢 Actif"} · {u.platform || "?"} {u.browser || ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
                        <div>Dernière activité</div>
                        <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#0f172a" }}>{fmtTime(u.last_activity)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Projets bloqués */}
          <section style={taStyles.card}>
            <h2 style={taStyles.h2}>⏳ Projets bloqués <span style={taStyles.count}>{stalled.length}</span></h2>
            <p style={taStyles.h2sub}>Aucune activité depuis 7+ jours (à relancer)</p>
            {stalled.length === 0 ? (
              <div style={taStyles.empty}>Aucun projet en stagnation.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stalled.slice(0, 10).map((p) => (
                  <a key={p.id} href={"/projet?id=" + encodeURIComponent(p.id)}
                     style={{ padding: 10, background: p.days_stalled >= 30 ? "#fef2f2" : p.days_stalled >= 14 ? "#fef3c7" : "#f8fafc", border: "1px solid " + (p.days_stalled >= 30 ? "#fca5a5" : p.days_stalled >= 14 ? "#fde68a" : "#e2e8f0"), borderRadius: 8, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{p.client_name || "—"} · {p.pm_name || "Sans chef projet"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: p.days_stalled >= 30 ? "#991b1b" : p.days_stalled >= 14 ? "#92400e" : "#475569", fontVariantNumeric: "tabular-nums" }}>{p.days_stalled} j</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>sans activité</div>
                    </div>
                  </a>
                ))}
                {stalled.length > 10 && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: 6 }}>+ {stalled.length - 10} autres projets bloqués…</div>}
              </div>
            )}
          </section>
        </div>

        {/* TIMELINE ÉVÉNEMENTS */}
        <section style={taStyles.card}>
          <h2 style={taStyles.h2}>📜 Journal d'événements <span style={taStyles.count}>{events.length}</span></h2>
          <p style={taStyles.h2sub}>Chronologie complète des connexions, verrouillages, erreurs</p>
          {loading ? (
            <div style={taStyles.empty}>Chargement…</div>
          ) : events.length === 0 ? (
            <div style={taStyles.empty}>Aucun événement sur cette période.</div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {events.map((e) => <EventRow key={e.id} event={e} fmtDateTime={fmtDateTime} />)}
            </div>
          )}
        </section>

        {/* SESSIONS DÉTAILLÉES */}
        <section style={{ ...taStyles.card, marginTop: 14 }}>
          <h2 style={taStyles.h2}>🕐 Sessions <span style={taStyles.count}>{sessions.length}</span></h2>
          <p style={taStyles.h2sub}>Historique des sessions de travail</p>
          {sessions.length === 0 ? (
            <div style={taStyles.empty}>Aucune session sur cette période.</div>
          ) : (
            <div style={taStyles.tableWrap}>
              <div style={taStyles.tableHead}>
                <span style={{ flex: "0 0 150px" }}>Utilisateur</span>
                <span style={{ flex: "0 0 140px" }}>Début</span>
                <span style={{ flex: "0 0 100px" }}>Durée</span>
                <span style={{ flex: "0 0 90px" }}>Verrouillé</span>
                <span style={{ flex: "0 0 110px" }}>Plateforme</span>
                <span style={{ flex: 1 }}>Statut</span>
                <span style={{ flex: "0 0 80px", textAlign: "right" }}>Erreurs</span>
              </div>
              {sessions.map((s) => {
                const sessionMs = (s.ended_at ? new Date(s.ended_at).getTime() : Date.now()) - new Date(s.started_at).getTime();
                const lockedMs = (s.total_locked_s || 0) * 1000;
                return (
                  <div key={s.id} style={taStyles.tableRow}>
                    <span style={{ flex: "0 0 150px", fontSize: 12.5, fontWeight: 600 }}>{s.user_name || s.user_email || "—"}</span>
                    <span style={{ flex: "0 0 140px", fontSize: 11.5, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(s.started_at)}</span>
                    <span style={{ flex: "0 0 100px", fontSize: 12, fontWeight: 600 }}>{fmtDuration(sessionMs)}</span>
                    <span style={{ flex: "0 0 90px", fontSize: 11 }}>{lockedMs > 0 ? fmtDuration(lockedMs) : "—"}</span>
                    <span style={{ flex: "0 0 110px", fontSize: 11, color: "#64748b" }}>{(s.platform || "?")} · {s.browser || "?"}</span>
                    <span style={{ flex: 1, fontSize: 11.5 }}>
                      {!s.ended_at ? (
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: s.is_locked ? "#fef3c7" : "#dcfce7", color: s.is_locked ? "#92400e" : "#065f46", fontWeight: 600 }}>● {s.is_locked ? "Verrouillé" : "Actif"}</span>
                      ) : (
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>● Terminée ({s.end_reason || "?"})</span>
                      )}
                    </span>
                    <span style={{ flex: "0 0 80px", textAlign: "right", fontSize: 12, fontWeight: 700, color: (s.errors_count || 0) > 0 ? "#dc2626" : "#cbd5e1" }}>{s.errors_count || 0}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const KPI = ({ label, value, color }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || "#0f172a", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
  </div>
);

const EventRow = ({ event, fmtDateTime }) => {
  const TYPE_META = {
    login:        { icon: "🔓", color: "#10b981", label: "Connexion" },
    logout:       { icon: "🔒", color: "#475569", label: "Déconnexion" },
    lock:         { icon: "⏸", color: "#f59e0b", label: "Écran verrouillé" },
    unlock:       { icon: "▶",  color: "#0ea5e9", label: "Écran déverrouillé" },
    idle_timeout: { icon: "💤", color: "#a855f7", label: "Inactivité 15 min" },
    error:        { icon: "⚠",  color: "#dc2626", label: "Erreur JS" },
    page_view:    { icon: "◧", color: "#94a3b8", label: "Page consultée" },
  };
  const meta = TYPE_META[event.type] || { icon: "•", color: "#94a3b8", label: event.type };
  const [open, setOpen] = React.useState(false);
  const hasDetails = event.severity === "error" && (event.error_stack || event.error_url);
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 999, background: meta.color + "15", color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{meta.label}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
          <span style={{ fontSize: 12, color: "#475569" }}>{event.user_name || event.user_email || "—"}</span>
          {event.path && <>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: "#3730a3" }}>{event.path}</span>
          </>}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(event.occurred_at)}</span>
        </div>
        {event.message && (
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{event.message}</div>
        )}
        {hasDetails && (
          <button onClick={() => setOpen((v) => !v)} style={{ fontSize: 10, color: "#3730a3", border: 0, background: "transparent", padding: 0, marginTop: 4, cursor: "pointer" }}>
            {open ? "▾ Masquer les détails" : "▸ Voir le stack trace"}
          </button>
        )}
        {open && hasDetails && (
          <pre style={{ margin: "6px 0 0", padding: 10, background: "#0f172a", color: "#fca5a5", fontSize: 10, fontVariantNumeric: "tabular-nums", borderRadius: 6, overflow: "auto", maxHeight: 200 }}>
            {event.error_url && <span style={{ color: "#fbbf24" }}>{event.error_url}:{event.error_line || "?"}{"\n"}</span>}
            {event.error_stack || "(pas de stack)"}
          </pre>
        )}
      </div>
    </div>
  );
};

const taStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 230, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  // Couleur module Temps & Activités (#14b8a6 teal)
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },

  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  primaryBtn: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },

  kpiRow: { display: "flex", gap: 10, marginBottom: 16 },

  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 18 },
  h2: { margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 },
  h2sub: { margin: "3px 0 10px", fontSize: 11.5, color: "#64748b" },
  count: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  empty: { padding: "24px 14px", textAlign: "center", color: "#94a3b8", fontSize: 12 },

  tableWrap: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 8, overflow: "hidden" },
  tableHead: { display: "flex", alignItems: "center", padding: "9px 12px", gap: 10, background: "#f8fafc", borderBottom: "1px solid #eef1f5", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "9px 12px", gap: 10, borderBottom: "1px solid #f1f5f9" },
};
