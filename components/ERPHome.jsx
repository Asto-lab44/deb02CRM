// Page d'accueil ERP — tuiles des modules

const ERPHome = () => {
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
        { k: "Pipeline", v: "1,75 M€" },
        { k: "Deals", v: "32" },
        { k: "Win rate", v: "57 %" },
      ],
      badge: { label: "3 SLA risk", tone: "danger" },
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
      stats: [
        { k: "Comptes radar", v: "24" },
        { k: "≤ 90 j", v: "5" },
        { k: "Hot leads", v: "8" },
      ],
      badge: { label: "Nouveau", tone: "new" },
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

  const categories = [...new Set(modules.map(m => m.cat))];
  const badgeTones = {
    new: { bg: "#4f46e5", color: "#fff" },
    danger: { bg: "#fdecec", color: "#dc2626", border: "#fecaca" },
    warn: { bg: "#fff6e6", color: "#a65f00", border: "#fde68a" },
  };

  return (
    <div style={erpStyles.frame}>
      {/* SIDEBAR */}
      <aside style={erpStyles.sidebar}>
        <div style={erpStyles.brandRow}>
          <div style={erpStyles.logo}><div style={erpStyles.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>ERP unifié</div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <input style={erpStyles.search} placeholder="Rechercher partout…" readOnly />
          <span style={erpStyles.searchIcon}>⌕</span>
          <span style={erpStyles.searchKbd}>⌘K</span>
        </div>

        <div style={erpStyles.navSection}>
          <div style={erpStyles.navLabel}>Navigation</div>
          <div style={{ ...erpStyles.navItem, ...erpStyles.navItemActive }}><span style={erpStyles.bullet}>⌂</span><span style={{ flex: 1 }}>Accueil</span></div>
          <div style={erpStyles.navItem}><span style={erpStyles.bullet}>★</span><span style={{ flex: 1 }}>Favoris</span><span style={erpStyles.navCount}>6</span></div>
          <div style={erpStyles.navItem}><span style={erpStyles.bullet}>◷</span><span style={{ flex: 1 }}>Récents</span></div>
          <div style={erpStyles.navItem}><span style={erpStyles.bullet}>◔</span><span style={{ flex: 1 }}>Notifications</span><span style={{ ...erpStyles.navCount, background: "#dc2626", color: "#fff", fontWeight: 700 }}>5</span></div>
        </div>

        <div style={erpStyles.navSection}>
          <div style={erpStyles.navLabel}>Modules</div>
          {modules.map((m) => (
            <div key={m.key} style={erpStyles.navItem}>
              <span style={{ width: 14, color: m.color, display: "flex", alignItems: "center" }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: m.color, display: "inline-block" }} />
              </span>
              <span style={{ flex: 1 }}>{m.title}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={erpStyles.userRow}>
          <Avatar name="Claire Renaud" size={26} color="#dc2626" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Claire Renaud</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>VP Sales · EMEA</div>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>⋯</span>
        </div>
      </aside>

      {/* MAIN */}
      <main style={erpStyles.main}>
        {/* Topbar */}
        <header style={erpStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 600 }}>Accueil</div>
            <span style={erpStyles.todayChip}>mardi 26 mai 2026 · 09:42</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={erpStyles.iconBtn} title="Notifications">
              <span style={{ fontSize: 13 }}>◔</span>
              <span style={erpStyles.notifDot} />
            </button>
            <button style={erpStyles.iconBtn}>?</button>
            <button style={erpStyles.iconBtn}>⚙</button>
          </div>
        </header>

        {/* HERO greeting */}
        <section style={erpStyles.hero}>
          <div style={erpStyles.heroGlow1} />
          <div style={erpStyles.heroGlow2} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 6, fontWeight: 500 }}>Bonjour Claire — voici votre tableau de bord</div>
            <h1 style={erpStyles.heroH1}>Bonne matinée<span style={{ color: "#a78bfa" }}>.</span></h1>
            <p style={erpStyles.heroSub}>5 notifications en attente · 3 tickets urgents · 1 réunion à venir dans 18 minutes</p>

            <div style={erpStyles.quickActions}>
              <button style={{ ...erpStyles.quickBtn, ...erpStyles.quickBtnPrimary }}>+ Nouvelle opportunité</button>
              <button style={erpStyles.quickBtn}>+ Facture</button>
              <button style={erpStyles.quickBtn}>+ Ticket</button>
              <button style={erpStyles.quickBtn}>+ Devis</button>
              <span style={erpStyles.quickSep} />
              <button style={erpStyles.quickBtn}>⌘K · Recherche globale</button>
            </div>
          </div>
        </section>

        {/* Today's pulse — KPI strip */}
        <section style={erpStyles.pulseRow}>
          <div style={erpStyles.pulseHead}>
            <h2 style={erpStyles.h2}>Pouls du jour</h2>
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>● Mis à jour il y a 2 min</span>
          </div>
          <div style={erpStyles.pulseGrid}>
            {[
              { k: "Chiffre d'affaires jour", v: "12 480 €", delta: "+8 %", color: "#10b981", spark: [3, 4, 5, 4, 6, 7, 8] },
              { k: "Nouveaux deals", v: "3", delta: "vs 2 hier", color: "#4f46e5", spark: [1, 2, 2, 3, 2, 4, 3] },
              { k: "Tickets ouverts", v: "47", delta: "↑ 4 depuis hier", color: "#0ea5e9", spark: [40, 42, 44, 43, 45, 46, 47] },
              { k: "Encours impayés", v: "18,4 k€", delta: "3 relances dues", color: "#f59e0b", spark: [22, 21, 20, 19, 18, 19, 18] },
              { k: "Trésorerie", v: "1,24 M€", delta: "+62 k€ semaine", color: "#0e7a55", spark: [1.18, 1.20, 1.21, 1.22, 1.21, 1.23, 1.24] },
            ].map((p) => (
              <div key={p.k} style={erpStyles.pulse}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{p.k}</span>
                  <MiniSparkline data={p.spark} color={p.color} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: -0.4, marginTop: 4 }}>{p.v}</div>
                <div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginTop: 2 }}>{p.delta}</div>
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
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...erpStyles.viewBtn, ...erpStyles.viewBtnActive }}>▦ Tuiles</button>
              <button style={erpStyles.viewBtn}>☰ Liste</button>
            </div>
          </div>

          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 22 }}>
              <div style={erpStyles.catHead}>
                <span style={erpStyles.catLabel}>{cat}</span>
                <span style={erpStyles.catLine} />
                <span style={erpStyles.catCount}>{modules.filter(m => m.cat === cat).length} modules</span>
              </div>

              <div style={erpStyles.tiles}>
                {modules.filter(m => m.cat === cat).map((m) => (
                  <div key={m.key} style={erpStyles.tile}>
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

                {/* Add tile placeholder for last categorie row, or just one */}
                {cat === "Pilotage" && (
                  <div style={erpStyles.tileAdd}>
                    <div style={{ fontSize: 32, color: "#cbd5e1", marginBottom: 4 }}>+</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Ajouter un module</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, textAlign: "center" }}>Catalogue · intégrations · sur-mesure</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Recent activity row */}
        <section style={erpStyles.bottomGrid}>
          <div style={erpStyles.bottomPanel}>
            <div style={erpStyles.panelHead}>
              <div>
                <h3 style={erpStyles.h3}>Mes actions à mener <span style={erpStyles.count}>9</span></h3>
                <p style={erpStyles.h3sub}>Toutes catégories confondues</p>
              </div>
              <button style={erpStyles.smBtn}>Voir tout</button>
            </div>
            {[
              { p: "haute", time: "Aujourd'hui · 14:00", cat: "CRM", catColor: "#4f46e5", title: "Comité achats AXA — présentation Suite", overdue: false },
              { p: "haute", time: "Aujourd'hui · 18:00", cat: "CRM", catColor: "#4f46e5", title: "Répondre questions techniques Émilie Roux", overdue: true },
              { p: "moyenne", time: "Demain", cat: "Finance", catColor: "#10b981", title: "Valider relance impayés ≥ 30 j", overdue: false },
              { p: "moyenne", time: "Ven. 29 mai", cat: "Production", catColor: "#0ea5e9", title: "Revue ticket INC-2837 — VPN", overdue: false },
              { p: "basse", time: "Sem. 23", cat: "RH", catColor: "#8b5cf6", title: "Valider CRA mai (23 collaborateurs)", overdue: false },
            ].map((a, i) => (
              <div key={i} style={{ ...erpStyles.todoRow, ...(a.overdue ? erpStyles.todoRowOverdue : {}) }}>
                <input type="checkbox" style={erpStyles.checkbox} readOnly />
                <span style={{ ...erpStyles.catChip, background: a.catColor + "15", color: a.catColor }}>{a.cat}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>{a.title}</span>
                <span style={{ fontSize: 11, color: a.overdue ? "#dc2626" : "#64748b", fontWeight: a.overdue ? 600 : 500, fontFamily: "'JetBrains Mono', monospace" }}>{a.overdue ? "⏰ " : ""}{a.time}</span>
              </div>
            ))}
          </div>

          <div style={erpStyles.bottomPanel}>
            <div style={erpStyles.panelHead}>
              <div>
                <h3 style={erpStyles.h3}>Activité de l'équipe</h3>
                <p style={erpStyles.h3sub}>Dernières actions notables</p>
              </div>
            </div>
            {[
              { who: "Nadia Lefèvre", color: "#a855f7", action: "a signé", what: "Crédit Mutuel Océan", value: "142 k€", cat: "CRM", time: "il y a 8 min" },
              { who: "Karim Ben Salah", color: "#6366f1", action: "a envoyé", what: "Proposition AXA Suite v2", cat: "CRM", time: "il y a 22 min" },
              { who: "Sophie Aubry", color: "#10b981", action: "a clôturé", what: "INC-2829 — Dock Dell", cat: "Support", time: "il y a 1 h" },
              { who: "Tom Verdier", color: "#f59e0b", action: "a édité", what: "Devis DEV-2042", value: "32 k€", cat: "Facturation", time: "il y a 2 h" },
              { who: "Hub Assistant", color: "#0f172a", action: "a détecté", what: "Notice contrat échue chez Banque Méridionale", cat: "Intelligence", time: "il y a 3 h", bot: true },
            ].map((e, i) => (
              <div key={i} style={erpStyles.activityRow}>
                <Avatar name={e.who} size={26} color={e.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.4 }}>
                    <strong style={{ color: "#0f172a", fontWeight: 600 }}>{e.who}</strong>
                    {e.bot && <span style={{ fontSize: 9, padding: "1px 4px", background: "#0f172a", color: "#fff", borderRadius: 3, marginLeft: 4, fontWeight: 700 }}>IA</span>}
                    {" "}{e.action}{" "}
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{e.what}</span>
                    {e.value && <span style={{ color: "#10b981", fontWeight: 700, marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>· {e.value}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{e.cat} · {e.time}</div>
                </div>
              </div>
            ))}
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
