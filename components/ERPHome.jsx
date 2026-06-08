// Page d'accueil ERP — tuiles des modules (filtrées par le groupe actif)

const ERPHome = () => {
  // Garde-fou : si HubAccess pas encore chargé, on ne crash pas
  const HA = (typeof window !== "undefined" && window.HubAccess) ? window.HubAccess : null;
  const noopSubscribe = React.useCallback(() => () => {}, []);
  // Identité active + accès aux tuiles, partagés avec la page Administration.
  // useSyncExternalStore re-render dès qu'un toggle d'accès change l'état.
  const subscribe = React.useCallback((fn) => HA ? HA.subscribe(fn) : (() => {}), [HA]);
  const activeGroup = React.useSyncExternalStore(
    HA ? subscribe : noopSubscribe,
    () => (HA && HA.getActiveGroup ? HA.getActiveGroup() : null) || { id: "admin", name: "Administrateurs", color: "#dc2626", access: ["crm","intel","marketing","tech","projects","inventory","accounting","billing","treasury","hr","time","reports"] }
  );
  const allowedKeys = React.useMemo(() => new Set(activeGroup.access || []), [activeGroup]);
  const allGroups = React.useSyncExternalStore(
    HA ? subscribe : noopSubscribe,
    () => (HA && HA.loadGroups ? HA.loadGroups() : []) || []
  );
  const localUser = React.useSyncExternalStore(
    HA ? subscribe : noopSubscribe,
    () => HA && HA.getCurrentUser ? HA.getCurrentUser() : null
  );
  // Identité Supabase réelle si dispo, sinon fallback access-store
  const [supaUser, setSupaUser] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.auth) return;
    window.api.auth.getUser().then((u) => { if (u) setSupaUser(u); }).catch(() => {});
  }, []);
  const currentUser = supaUser
    ? { name: supaUser.email, role: "Astorya" }
    : localUser;
  const [loginOpen, setLoginOpen] = React.useState(false);

  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { C: "#a855f7", N: "#a855f7", K: "#6366f1" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  // ───── modules organisés par catégorie
  // Stats live CRM (depuis Supabase) injectées dans la tuile CRM
  const [crmStats, setCrmStats] = React.useState({ clients: 0, opps: 0, won: 0 });
  const [actionsTodo, setActionsTodo] = React.useState([]);
  const [searchQ, setSearchQ] = React.useState("");
  const [searchData, setSearchData] = React.useState({ clients: [], opps: [] });
  React.useEffect(() => {
    if (!window.api) return;
    Promise.all([window.api.clients.list(), window.api.opportunities.list()])
      .then(([cl, op]) => setSearchData({ clients: cl || [], opps: op || [] }))
      .catch(() => {});
  }, []);
  const searchResults = React.useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (q.length < 2) return [];
    const results = [];
    searchData.clients.forEach((c) => {
      const name = c.raison_sociale || c.name || "";
      if (name.toLowerCase().includes(q) || (c.siren || "").includes(q)) {
        results.push({ kind: "client", id: c.id, label: name, sub: (c.status === "client" ? "Client" : "Prospect") + " · " + (c.ville || c.city || "—"), href: "/fiche-client?id=" + encodeURIComponent(c.id) });
      }
    });
    searchData.opps.forEach((o) => {
      const name = o.name || "";
      if (name.toLowerCase().includes(q) || (o.id || "").toLowerCase().includes(q)) {
        results.push({ kind: "opp", id: o.id, label: name, sub: "Opportunité · " + (o.stage || "—"), href: "/avancer-opportunite?opp=" + encodeURIComponent(o.id) });
      }
    });
    return results.slice(0, 10);
  }, [searchQ, searchData]);
  React.useEffect(() => {
    if (!window.api) return;
    Promise.all([
      window.api.clients.list(),
      window.api.opportunities.list(),
      window.api.actions.list({ status: "todo" }),
    ]).then(([clients, opps, todos]) => {
      const won = (opps || []).filter((o) => o.stage === "won").length;
      setCrmStats({
        clients: (clients || []).length,
        opps: (opps || []).length,
        won,
      });
      setActionsTodo(todos || []);
    }).catch(() => {});
  }, []);

  const modules = [
    // COMMERCIAL
    {
      cat: "Commercial",
      key: "crm",
      title: "CRM",
      subtitle: "Pipeline, comptes, opportunités",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17l4-4 4 4 5-7"/></svg>,
      color: "#4f46e5",
      bg: "#eef2ff",
      stats: [
        { k: "Comptes", v: String(crmStats.clients) },
        { k: "Opportunités", v: String(crmStats.opps) },
        { k: "Signées", v: String(crmStats.won) },
      ],
      trendUp: true,
    },
    {
      cat: "Commercial",
      key: "intel",
      title: "Intelligence concurrentielle",
      subtitle: "Radar fin contrats · battle cards",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>,
      color: "#dc2626",
      bg: "#fdecec",
      stats: [],
    },
    {
      cat: "Commercial",
      key: "marketing",
      title: "Marketing & Campagnes",
      subtitle: "Emailing, leads, conversion",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>,
      color: "#ec4899",
      bg: "#fdf2f8",
      stats: [
        { k: "Campagnes", v: "12" },
        { k: "Leads", v: "284" },
        { k: "CTR", v: "4,2 %" },
      ],
    },

    // PRODUCTION / TECHNIQUE
    {
      cat: "Production",
      key: "tech",
      title: "Support technique",
      subtitle: "Tickets, SLA, file d'attente",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 015 5L12 19l-4 1 1-4 6.7-9.7z"/></svg>,
      color: "#0ea5e9",
      bg: "#e0f4fc",
      stats: [
        { k: "Tickets ouverts", v: "47" },
        { k: "SLA respect", v: "94 %" },
        { k: "MTTR", v: "6h12" },
      ],
      badge: { label: "2 critiques", tone: "danger" },
    },
    {
      cat: "Production",
      key: "projects",
      title: "Projets & Livrables",
      subtitle: "Roadmap, jalons, ressources",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/></svg>,
      color: "#a855f7",
      bg: "#f5efff",
      stats: [
        { k: "Projets actifs", v: "18" },
        { k: "Jalons 30 j", v: "7" },
        { k: "En retard", v: "2" },
      ],
    },
    {
      cat: "Production",
      key: "inventory",
      title: "Stock & Catalogue",
      subtitle: "Articles, achats, mouvements",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9 4-9-4 9-4 9 4z"/><path d="M3 8v8l9 4 9-4V8M3 12l9 4 9-4"/></svg>,
      color: "#0891b2",
      bg: "#cffafe",
      stats: [
        { k: "Références", v: "1 412" },
        { k: "Rupture", v: "8" },
        { k: "Valeur", v: "428 k€" },
      ],
    },

    // FINANCE
    {
      cat: "Finance",
      key: "accounting",
      title: "Comptabilité",
      subtitle: "Écritures, journaux, clôtures",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>,
      color: "#10b981",
      bg: "#e8f8f1",
      stats: [
        { k: "CA mois", v: "284 k€" },
        { k: "Marge", v: "32 %" },
        { k: "Clôture", v: "J-3" },
      ],
      trendUp: true,
    },
    {
      cat: "Finance",
      key: "billing",
      title: "Facturation & Devis",
      subtitle: "Factures, devis, relances",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h2"/></svg>,
      color: "#f59e0b",
      bg: "#fef0e6",
      stats: [
        { k: "Factures mois", v: "127" },
        { k: "Devis envoyés", v: "42" },
        { k: "Impayés", v: "18,4 k€" },
      ],
      badge: { label: "3 relances", tone: "warn" },
    },
    {
      cat: "Finance",
      key: "treasury",
      title: "Trésorerie",
      subtitle: "Cash flow, banques, échéances",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>,
      color: "#0e7a55",
      bg: "#d1fae5",
      stats: [
        { k: "Trésorerie", v: "1,24 M€" },
        { k: "Échéances 30 j", v: "62 k€" },
        { k: "Runway", v: "14 mois" },
      ],
    },

    // RH
    {
      cat: "Ressources humaines",
      key: "hr",
      title: "RH & Paie",
      subtitle: "Salariés, contrats, paie",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/></svg>,
      color: "#8b5cf6",
      bg: "#f3e8ff",
      stats: [
        { k: "Effectif", v: "127" },
        { k: "Absents", v: "8" },
        { k: "Recrutements", v: "5" },
      ],
    },
    {
      cat: "Ressources humaines",
      key: "time",
      title: "Temps & Activités",
      subtitle: "Pointage, CRA, congés",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
      color: "#14b8a6",
      bg: "#ccfbf1",
      stats: [
        { k: "CRA à valider", v: "23" },
        { k: "Heures sem.", v: "4 412 h" },
        { k: "Demandes", v: "11" },
      ],
      badge: { label: "À valider", tone: "warn" },
    },

    // ADMIN / ANALYTICS
    {
      cat: "Pilotage",
      key: "reports",
      title: "Rapports & BI",
      subtitle: "Tableaux de bord, exports",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></svg>,
      color: "#3730a3",
      bg: "#e0e7ff",
      stats: [
        { k: "Dashboards", v: "12" },
        { k: "Partagés", v: "47" },
        { k: "Sources", v: "8" },
      ],
    },
    {
      cat: "Pilotage",
      key: "settings",
      title: "Administration",
      subtitle: "Utilisateurs, rôles, sécurité",
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
      color: "#64748b",
      bg: "#f1f3f6",
      stats: [
        { k: "Utilisateurs", v: "184" },
        { k: "Actifs 7 j", v: "147" },
        { k: "Intégrations", v: "23" },
      ],
    },
  ];

  const visibleModules = modules.filter(m => allowedKeys.has(m.key));
  const categories = [...new Set(visibleModules.map(m => m.cat))];
  const badgeTones = {
    new: { bg: "#4f46e5", color: "#fff" },
    danger: { bg: "#fdecec", color: "#dc2626", border: "#fecaca" },
    warn: { bg: "#fff6e6", color: "#a65f00", border: "#fde68a" },
  };

  return (
    <div style={erpStyles.frame}>
      {/* SIDEBAR */}
      <aside style={erpStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...erpStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          <div style={erpStyles.logo}><div style={erpStyles.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>ERP unifié</div>
          </div>
        </a>

        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>⌕</span>
          <input
            style={{ ...erpStyles.search, paddingLeft: 32 }}
            placeholder="Rechercher client, opp, ticket…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ.trim().length >= 2 && searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 100, maxHeight: 320, overflowY: "auto" }}>
              {searchResults.map((r) => (
                <a key={r.kind + "-" + r.id} href={r.href} style={{ display: "block", padding: "8px 12px", textDecoration: "none", color: "#0f172a", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{r.sub}</div>
                </a>
              ))}
            </div>
          )}
          {searchQ.trim().length >= 2 && searchResults.length === 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#94a3b8", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}>
              Aucun résultat
            </div>
          )}
        </div>

        <div style={erpStyles.navSection}>
          <div style={erpStyles.navLabel}>Navigation</div>
          <div style={{ ...erpStyles.navItem, ...erpStyles.navItemActive }}><span style={erpStyles.bullet}>⌂</span><span style={{ flex: 1 }}>Accueil</span></div>
        </div>

        <div style={erpStyles.navSection}>
          <div style={erpStyles.navLabel}>Modules</div>
          {visibleModules.map((m) => {
            const href = window.HubNav && window.HubNav.ROUTES[m.key];
            const item = (
              <>
                <span style={{ width: 14, color: m.color, display: "flex", alignItems: "center" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: m.color, display: "inline-block" }} />
                </span>
                <span style={{ flex: 1 }}>{m.title}</span>
              </>
            );
            return href
              ? <a key={m.key} href={href} style={{ ...erpStyles.navItem, textDecoration: "none", color: "inherit" }}>{item}</a>
              : <div key={m.key} style={{ ...erpStyles.navItem, opacity: 0.5, cursor: "not-allowed" }} title="Module à venir">{item}</div>;
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Identité active — détermine quelles tuiles sont visibles */}
        <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 11.5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Groupe actif</span>
            <a href="administration-utilisateurs.html" style={{ fontSize: 10.5, color: "#3730a3", fontWeight: 600, textDecoration: "none" }}>Admin →</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: activeGroup.color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{activeGroup.name}</span>
          </div>
          <select
            value={activeGroup.id}
            onChange={(e) => window.HubAccess.setActiveGroupId(e.target.value)}
            style={{ width: "100%", padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11.5, color: "#475569", background: "#fff", cursor: "pointer" }}
          >
            {allGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.access.length}/{window.HubAccess.ALL_KEYS.length})</option>
            ))}
          </select>
          <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
            {allowedKeys.size} tuile{allowedKeys.size > 1 ? "s" : ""} sur {window.HubAccess.ALL_KEYS.length} visible{allowedKeys.size > 1 ? "s" : ""}
          </div>
        </div>

        {currentUser ? (
          <div style={erpStyles.userRow}>
            <Avatar name={currentUser.name} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.role}</div>
            </div>
            <button
              onClick={async () => {
                if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
                if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout();
                window.location.href = "/login";
              }}
              title="Se déconnecter"
              style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 14, cursor: "pointer", padding: 4 }}
            >⏻</button>
          </div>
        ) : (
          <a href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "#0f172a", border: 0, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            → Se connecter
          </a>
        )}
      </aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* MAIN */}
      <main style={erpStyles.main}>
        {/* Topbar */}
        <header style={erpStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 600 }}>Accueil</div>
            <span style={erpStyles.todayChip}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/administration-utilisateurs" style={{ ...erpStyles.iconBtn, textDecoration: "none", color: "inherit" }} title="Administration">⚙</a>
          </div>
        </header>

        {/* HERO greeting */}
        <section style={erpStyles.hero}>
          <div style={erpStyles.heroGlow1} />
          <div style={erpStyles.heroGlow2} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 6, fontWeight: 500 }}>Bonjour {currentUser ? currentUser.name.split(" ")[0].split("@")[0] : ""} — voici votre tableau de bord</div>
            <h1 style={erpStyles.heroH1}>{(() => { const h = new Date().getHours(); return h < 12 ? "Bonne matinée" : h < 18 ? "Bon après-midi" : "Bonne soirée"; })()}<span style={{ color: "#a78bfa" }}>.</span></h1>
            <p style={erpStyles.heroSub}>{crmStats.opps} opportunité{crmStats.opps > 1 ? "s" : ""} en cours · {crmStats.clients} compte{crmStats.clients > 1 ? "s" : ""} en base</p>

          </div>
        </section>

        {/* Today's pulse — KPI strip */}
        <section style={erpStyles.pulseRow}>
          <div style={erpStyles.pulseHead}>
            <h2 style={erpStyles.h2}>Pouls du jour</h2>
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>● Live</span>
          </div>
          <div style={erpStyles.pulseGrid}>
            {[
              { k: "Comptes", v: String(crmStats.clients), color: "#4f46e5" },
              { k: "Opportunités", v: String(crmStats.opps), color: "#a855f7" },
              { k: "Signées", v: String(crmStats.won), color: "#10b981" },
            ].map((p) => (
              <div key={p.k} style={erpStyles.pulse}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{p.k}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: -0.4, marginTop: 4 }}>{p.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MODULES TILES */}
        <section style={erpStyles.modulesSection}>
          <div style={erpStyles.sectionHead}>
            <div>
              <h2 style={erpStyles.h2}>Modules</h2>
              <p style={erpStyles.h2sub}>Accédez à vos espaces de travail · épinglez vos favoris en haut</p>
            </div>
          </div>

          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 22 }}>
              <div style={erpStyles.catHead}>
                <span style={erpStyles.catLabel}>{cat}</span>
                <span style={erpStyles.catLine} />
                <span style={erpStyles.catCount}>{visibleModules.filter(m => m.cat === cat).length} modules</span>
              </div>

              <div style={erpStyles.tiles}>
                {visibleModules.filter(m => m.cat === cat).map((m) => (
                  <div key={m.key}
                       style={{ ...erpStyles.tile, cursor: (window.HubNav && window.HubNav.ROUTES[m.key]) ? "pointer" : "default" }}
                       onClick={() => { const r = window.HubNav && window.HubNav.ROUTES[m.key]; if (r) window.location.href = r; }}>
                    {/* Hover indicator */}
                    <div style={{ ...erpStyles.tileGlow, background: m.bg }} />

                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                      <div style={{ ...erpStyles.tileIcon, background: m.bg, color: m.color }}>{m.icon}</div>
                      {m.badge && (
                        <span style={{
                          ...erpStyles.tileBadge,
                          background: badgeTones[m.badge.tone].bg,
                          color: badgeTones[m.badge.tone].color,
                          border: badgeTones[m.badge.tone].border ? `1px solid ${badgeTones[m.badge.tone].border}` : "none",
                        }}>{m.badge.label}</span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ position: "relative", zIndex: 1, marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <h3 style={erpStyles.tileTitle}>{m.title}</h3>
                        {m.trendUp && <span style={{ color: "#10b981", fontSize: 13 }}>↗</span>}
                      </div>
                      <p style={erpStyles.tileSub}>{m.subtitle}</p>
                    </div>

                    {/* Stats */}
                    <div style={erpStyles.tileStats}>
                      {m.stats.map((s, i) => (
                        <React.Fragment key={s.k}>
                          <div style={erpStyles.tileStat}>
                            <div style={erpStyles.tileStatV}>{s.v}</div>
                            <div style={erpStyles.tileStatK}>{s.k}</div>
                          </div>
                          {i < m.stats.length - 1 && <div style={erpStyles.tileStatDiv} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Footer arrow */}
                    <div style={erpStyles.tileFoot}>
                      <span style={{ fontSize: 11.5, color: m.color, fontWeight: 600 }}>Ouvrir le module</span>
                      <span style={{ ...erpStyles.tileArrow, color: m.color }}>→</span>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          ))}
        </section>

        {/* Actions à mener — live depuis Supabase */}
        <section style={{ ...erpStyles.bottomGrid, gridTemplateColumns: "1fr" }}>
          <div style={erpStyles.bottomPanel}>
            <div style={erpStyles.panelHead}>
              <div>
                <h3 style={erpStyles.h3}>Actions à mener <span style={erpStyles.count}>{actionsTodo.length}</span></h3>
                <p style={erpStyles.h3sub}>Toutes catégories confondues</p>
              </div>
              <a href="/crm" style={{ ...erpStyles.smBtn, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>Voir tout</a>
            </div>
            {actionsTodo.length === 0 ? (
              <div style={{ padding: "24px 14px", textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc" }}>
                Aucune action planifiée. Créez-en une depuis une fiche client.
              </div>
            ) : actionsTodo.slice(0, 8).map((a) => {
              const dueIso = a.due_at;
              const overdue = dueIso && new Date(dueIso).getTime() < Date.now();
              const catColor = a.type === "email" ? "#a855f7" : a.type === "call" ? "#10b981" : a.type === "rdv" ? "#0ea5e9" : "#475569";
              return (
                <div key={a.id} onClick={() => { if (a.client_id) window.location.href = "/fiche-client?id=" + encodeURIComponent(a.client_id); }} style={{ ...erpStyles.todoRow, ...(overdue ? erpStyles.todoRowOverdue : {}), cursor: a.client_id ? "pointer" : "default" }}>
                  <span style={{ ...erpStyles.catChip, background: catColor + "15", color: catColor }}>{(a.type || "task").toUpperCase()}</span>
                  <span style={{ flex: 1, fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: overdue ? "#dc2626" : "#64748b", fontWeight: overdue ? 600 : 500, fontFamily: "'JetBrains Mono', monospace" }}>{overdue ? "⏰ " : ""}{a.due_text || (dueIso ? new Date(dueIso).toLocaleDateString("fr-FR") : "—")}</span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

const MiniSparkline = ({ data, color, w = 50, h = 18 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const erpStyles = {
  frame: { width: 1440, display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", minHeight: 1700 },

  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 14, flexShrink: 0, position: "sticky", top: 0, height: "100vh", minHeight: 1700 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #312e81 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(67,56,202,0.3)" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: -0.5 },
  search: { width: "100%", padding: "8px 12px 8px 30px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, background: "#fafbfc", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 },
  searchKbd: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#fff", border: "1px solid #e2e8f0", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 10.5, padding: "1px 6px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 12 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  todayChip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 6, right: 7, width: 6, height: 6, background: "#dc2626", borderRadius: 999, border: "1.5px solid #fff" },

  // Hero
  hero: { margin: "20px 28px 16px", padding: "30px 32px", borderRadius: 18, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)", color: "#fff", position: "relative", overflow: "hidden" },
  heroGlow1: { position: "absolute", top: -80, right: -40, width: 280, height: 280, borderRadius: 999, background: "radial-gradient(circle, rgba(168,85,247,0.35), transparent 65%)", pointerEvents: "none" },
  heroGlow2: { position: "absolute", bottom: -60, left: 200, width: 240, height: 240, borderRadius: 999, background: "radial-gradient(circle, rgba(79,70,229,0.4), transparent 65%)", pointerEvents: "none" },
  heroH1: { fontSize: 38, fontWeight: 700, letterSpacing: -1.2, margin: 0, color: "#fff", lineHeight: 1.05 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", margin: "10px 0 0", lineHeight: 1.5 },
  quickActions: { display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" },
  quickBtn: { padding: "7px 14px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 500, backdropFilter: "blur(8px)" },
  quickBtnPrimary: { background: "#fff", color: "#0f172a", border: "1px solid #fff", fontWeight: 600 },
  quickSep: { width: 1, height: 18, background: "rgba(255,255,255,0.2)", margin: "0 6px" },

  // Pulse
  pulseRow: { padding: "0 28px 14px" },
  pulseHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: -0.4, margin: 0, color: "#0f172a" },
  h2sub: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
  pulseGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
  pulse: { padding: "14px 16px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },

  // Modules
  modulesSection: { padding: "20px 28px 14px" },
  sectionHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 },
  viewBtn: { padding: "5px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  viewBtnActive: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },

  catHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  catLabel: { fontSize: 11.5, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.8 },
  catLine: { flex: 1, height: 1, background: "#eef1f5" },
  catCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },

  tiles: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  tile: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 14, cursor: "pointer", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14, minHeight: 200 },
  tileGlow: { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 999, opacity: 0.5, pointerEvents: "none" },
  tileIcon: { width: 44, height: 44, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tileBadge: { fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.3 },
  tileTitle: { fontSize: 15.5, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 },
  tileSub: { fontSize: 12, color: "#64748b", margin: "3px 0 0", lineHeight: 1.4 },

  tileStats: { display: "flex", alignItems: "stretch", gap: 0, padding: "10px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", position: "relative", zIndex: 1 },
  tileStat: { flex: 1, minWidth: 0 },
  tileStatV: { fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: -0.3, fontFamily: "'Inter', sans-serif" },
  tileStatK: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginTop: 1 },
  tileStatDiv: { width: 1, background: "#eef1f5", margin: "0 10px" },

  tileFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", position: "relative", zIndex: 1 },
  tileArrow: { fontSize: 16, fontWeight: 700 },

  tileAdd: { padding: 18, background: "transparent", border: "1.5px dashed #cbd5e1", borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 4 },

  // Bottom grid
  bottomGrid: { padding: "0 28px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  bottomPanel: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  panelHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
  h3: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.2 },
  h3sub: { fontSize: 11.5, color: "#64748b", margin: "3px 0 0" },
  count: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },
  smBtn: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },

  todoRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  todoRowOverdue: { background: "#fff8f7", padding: "8px 10px", borderRadius: 6, borderBottom: "none", marginBottom: 2 },
  checkbox: { accentColor: "#4f46e5" },
  catChip: { fontSize: 10, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.3 },

  activityRow: { display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid #f1f5f9" },
};

window.ERPHome = ERPHome;
