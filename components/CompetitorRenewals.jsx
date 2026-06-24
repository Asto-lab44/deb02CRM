// Module « Fin de contrats concurrents » — radar opportunités

const CompetitorRenewals = () => {
  const [renewalSearch, setRenewalSearch] = React.useState("");
  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", M: "#a855f7", N: "#ec4899", J: "#8b5cf6", P: "#0891b2" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  // Concurrents — palette de marque (fictive, identifiable)
  const competitors = {
    salesforce:  { name: "Salesforce",  abbr: "SF",  color: "#00A1E0", bg: "#e0f4fc" },
    pega:        { name: "Pega",        abbr: "PG",  color: "#0e7a55", bg: "#e8f8f1" },
    appian:      { name: "Appian",      abbr: "AP",  color: "#1e40af", bg: "#dde6f7" },
    guidewire:   { name: "Guidewire",   abbr: "GW",  color: "#dc2626", bg: "#fdecec" },
    sapiens:     { name: "Sapiens",     abbr: "SA",  color: "#ea580c", bg: "#fef0e6" },
    duck_creek:  { name: "Duck Creek",  abbr: "DC",  color: "#7c3aed", bg: "#f3e8ff" },
    msft:        { name: "Microsoft D365", abbr: "MS", color: "#0f172a", bg: "#e2e8f0" },
    insurity:    { name: "Insurity",    abbr: "IN",  color: "#0891b2", bg: "#cffafe" },
  };

  // Dates clés : prospects avec contrats concurrents arrivant à terme
  const renewals = [
    {
      id: "REN-2026-001",
      company: "Mutuelle des Hauts-de-Seine",
      logo: "MH", logoBg: "#dc2626",
      industry: "Santé · Mutuelle",
      size: "850 emp.",
      competitor: "salesforce",
      product: "Sales Cloud Enterprise",
      value: 142,
      endDate: "12 juin 2026",
      endIn: 17,
      contractStart: "12 juin 2023",
      autoRenew: true,
      noticeDays: 90,
      noticeDeadline: "13 mars 2026",
      noticeStatus: "passed",
      score: 92,
      tier: "A",
      signals: [
        { type: "hot", label: "RFP lancé semaine dernière" },
        { type: "hot", label: "Téléchargé 4 white papers Astorya" },
        { type: "hot", label: "VP Tech contacté Nadia sur LinkedIn" },
      ],
      owner: "Romain Daviaud", ownerColor: "#a855f7",
      contacts: 3,
      lastTouch: "il y a 2 j",
      action: "Pitch programmé jeudi 28 mai · 14h",
      productMatch: "Astorya Suite",
    },
    {
      id: "REN-2026-002",
      company: "Banque Méridionale",
      logo: "BM", logoBg: "#0f172a",
      industry: "Banque privée",
      size: "1 200 emp.",
      competitor: "pega",
      product: "Pega Platform Cloud",
      value: 218,
      endDate: "30 juin 2026",
      endIn: 35,
      contractStart: "01 juil. 2022",
      autoRenew: false,
      noticeDays: 60,
      noticeDeadline: "01 mai 2026",
      noticeStatus: "passed",
      score: 87,
      tier: "A",
      signals: [
        { type: "hot", label: "Insatisfaction publique du CIO en interview" },
        { type: "neutral", label: "Budget IT 2026 voté en hausse de 22 %" },
      ],
      owner: "Romain Daviaud", ownerColor: "#6366f1",
      contacts: 2,
      lastTouch: "il y a 5 j",
      action: "Préparer use-case bancaire dédié",
      productMatch: "Astorya Suite + Cyber",
    },
    {
      id: "REN-2026-003",
      company: "Crédit Provence",
      logo: "CP", logoBg: "#10b981",
      industry: "Banque mutualiste",
      size: "640 emp.",
      competitor: "msft",
      product: "Dynamics 365 Sales",
      value: 64,
      endDate: "15 juil. 2026",
      endIn: 50,
      contractStart: "15 juil. 2024",
      autoRenew: true,
      noticeDays: 60,
      noticeDeadline: "16 mai 2026",
      noticeStatus: "soon",
      score: 71,
      tier: "B",
      signals: [
        { type: "neutral", label: "Migration data en cours côté SI" },
      ],
      owner: "Sophie Aubry", ownerColor: "#10b981",
      contacts: 1,
      lastTouch: "il y a 3 sem.",
      action: "Relance avant deadline notice 16/05",
      productMatch: "Astorya Hub",
    },
    {
      id: "REN-2026-004",
      company: "Helios Mutuelle",
      logo: "HM", logoBg: "#f59e0b",
      industry: "Mutuelle santé",
      size: "320 emp.",
      competitor: "sapiens",
      product: "Sapiens IDIT Suite",
      value: 86,
      endDate: "30 sept. 2026",
      endIn: 127,
      contractStart: "01 oct. 2021",
      autoRenew: false,
      noticeDays: 90,
      noticeDeadline: "02 juil. 2026",
      noticeStatus: "open",
      score: 78,
      tier: "B",
      signals: [
        { type: "hot", label: "Renouvellement annoncé difficile (presse)" },
      ],
      owner: "Tom Verdier", ownerColor: "#f59e0b",
      contacts: 2,
      lastTouch: "hier",
      action: "Démo prévue 04 juin",
      productMatch: "Astorya Cyber",
      isNew: true,
    },
    {
      id: "REN-2026-005",
      company: "Allianz France PME",
      logo: "AL", logoBg: "#1e3a8a",
      industry: "Assurance entreprise",
      size: "4 500 emp.",
      competitor: "guidewire",
      product: "Guidewire InsurancePlatform",
      value: 412,
      endDate: "31 déc. 2026",
      endIn: 219,
      contractStart: "01 janv. 2022",
      autoRenew: false,
      noticeDays: 180,
      noticeDeadline: "04 juil. 2026",
      noticeStatus: "open",
      score: 88,
      tier: "A",
      signals: [
        { type: "hot", label: "Appel d'offres prévu T3 2026 (confirmé)" },
        { type: "hot", label: "DSI ex-client Astorya chez Aviva" },
      ],
      owner: "Romain Daviaud", ownerColor: "#a855f7",
      contacts: 5,
      lastTouch: "il y a 4 j",
      action: "Audit pré-RFP en cours",
      productMatch: "Astorya Suite Enterprise",
    },
    {
      id: "REN-2026-006",
      company: "Cabinet Renard & Fils",
      logo: "RF", logoBg: "#a855f7",
      industry: "Courtage",
      size: "85 emp.",
      competitor: "salesforce",
      product: "Sales Cloud Pro",
      value: 18,
      endDate: "15 nov. 2026",
      endIn: 173,
      contractStart: "15 nov. 2024",
      autoRenew: true,
      noticeDays: 30,
      noticeDeadline: "16 oct. 2026",
      noticeStatus: "open",
      score: 54,
      tier: "C",
      signals: [
        { type: "neutral", label: "Croissance équipe commerciale +40 %" },
      ],
      owner: "Pierre Dubois", ownerColor: "#0891b2",
      contacts: 1,
      lastTouch: "il y a 1 sem.",
      action: "Nurturing — webinar invité",
      productMatch: "Astorya Hub",
    },
    {
      id: "REN-2026-007",
      company: "Atlantique Patrimoine",
      logo: "AP", logoBg: "#0ea5e9",
      industry: "Gestion de patrimoine",
      size: "210 emp.",
      competitor: "appian",
      product: "Appian Platform",
      value: 58,
      endDate: "31 août 2026",
      endIn: 97,
      contractStart: "01 sept. 2024",
      autoRenew: false,
      noticeDays: 60,
      noticeDeadline: "02 juil. 2026",
      noticeStatus: "open",
      score: 66,
      tier: "B",
      signals: [
        { type: "neutral", label: "Nouvelle gouvernance IT depuis 02/2026" },
      ],
      owner: "Sophie Aubry", ownerColor: "#10b981",
      contacts: 2,
      lastTouch: "il y a 12 j",
      action: "Mapping décideurs à compléter",
      productMatch: "Astorya Hub",
    },
    {
      id: "REN-2026-008",
      company: "Compagnie Helvétique d'Assurance",
      logo: "CH", logoBg: "#dc2626",
      industry: "Assurance vie",
      size: "1 800 emp.",
      competitor: "duck_creek",
      product: "Duck Creek OnDemand",
      value: 304,
      endDate: "30 juin 2026",
      endIn: 35,
      contractStart: "01 juil. 2023",
      autoRenew: false,
      noticeDays: 120,
      noticeDeadline: "03 mars 2026",
      noticeStatus: "passed",
      score: 81,
      tier: "A",
      signals: [
        { type: "hot", label: "Notice émise — phase concurrentielle ouverte" },
        { type: "hot", label: "Demande de démo via formulaire 18 mai" },
      ],
      owner: "Émilie Garnier", ownerColor: "#0ea5e9",
      contacts: 4,
      lastTouch: "il y a 1 j",
      action: "Présentation comité IT 12 juin",
      productMatch: "Astorya Suite",
    },
  ];

  const scoreColor = (s) => s >= 85 ? "#10b981" : s >= 70 ? "#a855f7" : s >= 55 ? "#f59e0b" : "#94a3b8";
  const tierColor = (t) => t === "A" ? { bg: "#fef3c7", color: "#a16207", border: "#fde68a" } : t === "B" ? { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" } : { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };

  const totalValue = renewals.reduce((s, r) => s + r.value, 0);
  const next90 = renewals.filter(r => r.endIn <= 90);
  const next90Value = next90.reduce((s, r) => s + r.value, 0);
  const hotCount = renewals.filter(r => r.score >= 80).length;

  // Buckets pour la timeline
  const months = ["Juin 26", "Juil. 26", "Août 26", "Sept. 26", "Oct.-Nov. 26", "Déc. 26+"];
  const inMonth = (r, m) => {
    if (m === 0) return r.endDate.includes("juin");
    if (m === 1) return r.endDate.includes("juil");
    if (m === 2) return r.endDate.includes("août");
    if (m === 3) return r.endDate.includes("sept");
    if (m === 4) return r.endDate.includes("oct") || r.endDate.includes("nov");
    return r.endDate.includes("déc") || r.endDate.includes("janv");
  };

  return (
    <div style={crStyles.frame}>
      {/* SIDEBAR */}
      <aside style={crStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...crStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={crStyles.logo}><div style={crStyles.logoMark}>H</div></div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>CRM commercial</div>
          </div>
        </a>
        <button style={crStyles.newBtn}>+ Nouvelle opportunité <span style={crStyles.kbd}>N</span></button>

        <div style={crStyles.navSection}>
          <div style={crStyles.navLabel}>Espace</div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>▦</span><span style={{ flex: 1 }}>Pipeline</span><span style={crStyles.navCount}>32</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>◰</span><span style={{ flex: 1 }}>Comptes</span><span style={crStyles.navCount}>412</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>◉</span><span style={{ flex: 1 }}>Contacts</span><span style={crStyles.navCount}>1 184</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>✦</span><span style={{ flex: 1 }}>Activités</span><span style={crStyles.navCount}>27</span></div>
        </div>

        <div style={crStyles.navSection}>
          <div style={crStyles.navLabel}>Intelligence</div>
          <div style={{ ...crStyles.navItem, ...crStyles.navItemActive }}><span style={crStyles.bullet}>◷</span><span style={{ flex: 1 }}>Fins de contrats concurrents</span><span style={crStyles.navCount}>{renewals.length}</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>◊</span><span style={{ flex: 1 }}>Watchlist comptes</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>◇</span><span style={{ flex: 1 }}>Signaux marché</span><span style={crStyles.navCount}>14</span></div>
          <div style={crStyles.navItem}><span style={crStyles.bullet}>↻</span><span style={{ flex: 1 }}>Battle cards</span></div>
        </div>

        <div style={crStyles.navSection}>
          <div style={crStyles.navLabel}>Concurrents suivis</div>
          {Object.entries(competitors).slice(0, 6).map(([k, c]) => {
            const count = renewals.filter(r => r.competitor === k).length;
            return (
              <div key={k} style={crStyles.navItem}>
                <span style={{ ...crStyles.compMark, background: c.bg, color: c.color, borderColor: c.color }}>{c.abbr}</span>
                <span style={{ flex: 1, fontSize: 12 }}>{c.name}</span>
                {count > 0 && <span style={crStyles.navCount}>{count}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={crStyles.userRow}>
          <Avatar name="Augustin Morin" size={26} color="#0e7a55" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Augustin Morin</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Astorya · Nantes</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={crStyles.main}>
        <header style={crStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>CRM</div>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Intelligence</div>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Fins de contrats concurrents</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={crStyles.search}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>⌕</span>
              <input value={renewalSearch} onChange={(e) => setRenewalSearch(e.target.value)} placeholder="Rechercher un compte, concurrent…" style={crStyles.searchInput} />
            </div>
          </div>
        </header>

        {/* Title row */}
        <div style={crStyles.titleRow}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={crStyles.liveBadge}>● Mis à jour à l'instant</span>
            </div>
            <h1 style={crStyles.h1}>Radar fin de contrats concurrents</h1>
            <p style={crStyles.h1sub}>{renewals.length} comptes prioritaires en zone d'opportunité · {totalValue.toLocaleString("fr-FR")} k€ de valeur en compétition d'ici 12 mois</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/nouveau-prospect" style={{ ...crStyles.primaryBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>+ Ajouter un compte</a>
          </div>
        </div>

        {/* KPI strip */}
        <div style={crStyles.kpiStrip}>
          <div style={{ ...crStyles.kpi, ...crStyles.kpiHero }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Échéances 90 jours</span>
              <span style={{ ...crStyles.trendChip, background: "rgba(248,113,113,0.2)", color: "#fca5a5" }}>⚡ Action immédiate</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.8 }}>{next90.length}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>comptes · {next90Value.toLocaleString("fr-FR")} k€</div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 8, lineHeight: 1.5 }}>
              Sur les {next90.length} prochaines échéances, <strong style={{ color: "#fff" }}>{next90.filter(r => r.noticeStatus === "passed").length} sont déjà en phase concurrentielle</strong> (notice de non-reconduction émise ou échue).
            </div>
          </div>
          <div style={crStyles.kpi}>
            <span style={crStyles.kpiLabel}>Hot leads (score ≥ 80)</span>
            <div style={{ ...crStyles.kpiValue, color: "#10b981" }}>{hotCount}</div>
            <div style={crStyles.kpiSub}>Signaux d'achat confirmés</div>
          </div>
          <div style={crStyles.kpi}>
            <span style={crStyles.kpiLabel}>Top concurrent ciblé</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ ...crStyles.compMarkBig, background: competitors.salesforce.bg, color: competitors.salesforce.color, border: `1.5px solid ${competitors.salesforce.color}` }}>SF</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Salesforce</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>2 deals · 160 k€</div>
              </div>
            </div>
          </div>
          <div style={crStyles.kpi}>
            <span style={crStyles.kpiLabel}>Win rate vs. concurrents</span>
            <div style={crStyles.kpiValue}>42 %</div>
            <div style={crStyles.kpiSub}>Astorya en displacement 2026</div>
          </div>
        </div>

        {/* Filters bar */}
        <div style={crStyles.filterBar}>
          <div style={crStyles.tabs}>
            {[
              { k: "all", label: "Toutes", c: renewals.length, active: true },
              { k: "30", label: "≤ 30 j", c: renewals.filter(r => r.endIn <= 30).length },
              { k: "90", label: "≤ 90 j", c: next90.length },
              { k: "180", label: "≤ 180 j", c: renewals.filter(r => r.endIn <= 180).length },
              { k: "more", label: "Plus tard", c: renewals.filter(r => r.endIn > 180).length },
            ].map((t) => (
              <button key={t.k} style={{ ...crStyles.tab, ...(t.active ? crStyles.tabActive : {}) }}>
                {t.label}
                <span style={{ ...crStyles.tabCount, ...(t.active ? crStyles.tabCountActive : {}) }}>{t.c}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={crStyles.filterPill}>+ Concurrent</button>
            <button style={crStyles.filterPill}>+ Tier</button>
            <button style={crStyles.filterPill}>+ Owner</button>
            <button style={crStyles.filterPill}>+ Statut notice</button>
            <span style={crStyles.divider} />
            <button style={crStyles.filterPill}>↕ Score décroissant</button>
            <button style={crStyles.filterPill}>📅 Timeline</button>
            <button style={crStyles.filterPill}>☰ Liste</button>
          </div>
        </div>

        {/* TIMELINE */}
        <div style={crStyles.timelineWrap}>
          <div style={crStyles.timelineHead}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Chronologie des échéances</div>
              <div style={{ fontSize: 11.5, color: "#64748b" }}>De juin 2026 à début 2027 · taille des marqueurs = valeur contrat</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Legend dot="#dc2626" label="Notice passée" />
              <Legend dot="#f59e0b" label="Notice imminente" />
              <Legend dot="#10b981" label="Notice ouverte" />
            </div>
          </div>

          {/* Months strip */}
          <div style={crStyles.tlMonths}>
            {months.map((m, i) => {
              const items = renewals.filter(r => inMonth(r, i));
              const sum = items.reduce((s, r) => s + r.value, 0);
              const isUrgent = i <= 1;
              return (
                <div key={m} style={{ ...crStyles.tlMonth, ...(isUrgent ? crStyles.tlMonthUrgent : {}) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: isUrgent ? "#dc2626" : "#0f172a", letterSpacing: 0.2 }}>{m}</span>
                    <span style={{ fontSize: 10.5, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{items.length} · {sum} k€</span>
                  </div>
                  <div style={crStyles.tlBubbles}>
                    {items.map((r) => {
                      const size = Math.max(28, Math.min(54, 28 + r.value / 12));
                      const noticeMeta = r.noticeStatus === "passed" ? "#dc2626" : r.noticeStatus === "soon" ? "#f59e0b" : "#10b981";
                      return (
                        <div key={r.id} style={{
                          ...crStyles.tlBubble,
                          width: size, height: size,
                          background: r.logoBg,
                          fontSize: size > 42 ? 11 : 9.5,
                          boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${noticeMeta}`,
                        }} title={`${r.company} · ${r.value} k€`}>{r.logo}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLE / CARDS */}
        <div style={crStyles.tableHead}>
          <div style={{ width: 22 }}><input type="checkbox" readOnly /></div>
          <div style={{ flex: 1.4 }}>Compte</div>
          <div style={{ flex: 1.1 }}>Contrat concurrent</div>
          <div style={{ width: 130 }}>Échéance</div>
          <div style={{ width: 100 }}>Notice</div>
          <div style={{ width: 110 }}>Score</div>
          <div style={{ width: 150 }}>Owner</div>
          <div style={{ width: 28 }}></div>
        </div>

        <div style={crStyles.rows}>
          {renewals.map((r) => {
            const c = competitors[r.competitor];
            const tc = tierColor(r.tier);
            const isUrgent = r.endIn <= 60;
            return (
              <div key={r.id} style={{ ...crStyles.row, ...(isUrgent ? crStyles.rowUrgent : {}) }}>
                <div style={{ width: 22, paddingTop: 4 }}><input type="checkbox" readOnly /></div>

                {/* Account */}
                <div style={{ flex: 1.4, minWidth: 0, paddingRight: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ ...crStyles.coLogo, background: r.logoBg }}>{r.logo}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.company}</span>
                        <span style={{ ...crStyles.tierBadge, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>Tier {r.tier}</span>
                        {r.isNew && <span style={crStyles.newPill}>NOUVEAU</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{r.industry} · {r.size}</div>
                      {/* Signals */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 7 }}>
                        {r.signals.slice(0, 2).map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11, color: s.type === "hot" ? "#a65f00" : "#475569" }}>
                            <span style={{ color: s.type === "hot" ? "#dc2626" : "#94a3b8", flexShrink: 0, fontWeight: 700 }}>{s.type === "hot" ? "▲" : "·"}</span>
                            <span>{s.label}</span>
                          </div>
                        ))}
                        {r.signals.length > 2 && (
                          <span style={{ fontSize: 10.5, color: "#94a3b8" }}>+{r.signals.length - 2} signal(aux)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitor */}
                <div style={{ flex: 1.1, minWidth: 0, paddingRight: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...crStyles.compMark, background: c.bg, color: c.color, borderColor: c.color }}>{c.abbr}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{r.product}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Valeur</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums", marginLeft: 2 }}>{r.value} k€/an</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Match</span>
                    <span style={{ fontSize: 11.5, color: "#4f46e5", fontWeight: 600, marginLeft: 2 }}>→ {r.productMatch}</span>
                  </div>
                </div>

                {/* End date */}
                <div style={{ width: 130, paddingRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isUrgent ? "#dc2626" : "#0f172a", fontVariantNumeric: "tabular-nums", letterSpacing: -0.2 }}>{r.endDate}</div>
                  <div style={{ fontSize: 11, color: isUrgent ? "#dc2626" : "#64748b", marginTop: 2 }}>
                    Dans <strong>{r.endIn} jours</strong>
                  </div>
                  <div style={{ ...crStyles.miniBar, marginTop: 5 }}>
                    <div style={{
                      width: `${Math.max(5, Math.min(100, 100 - (r.endIn / 220) * 100))}%`,
                      height: "100%",
                      background: r.endIn <= 30 ? "#dc2626" : r.endIn <= 90 ? "#f59e0b" : r.endIn <= 180 ? "#a855f7" : "#10b981",
                      borderRadius: 999,
                    }} />
                  </div>
                </div>

                {/* Notice */}
                <div style={{ width: 100, paddingRight: 8 }}>
                  <div style={{
                    ...crStyles.noticePill,
                    background: r.noticeStatus === "passed" ? "#fdecec" : r.noticeStatus === "soon" ? "#fff6e6" : "#e8f8f1",
                    color: r.noticeStatus === "passed" ? "#dc2626" : r.noticeStatus === "soon" ? "#a65f00" : "#0e7a55",
                  }}>
                    {r.noticeStatus === "passed" ? "✓ Échue" : r.noticeStatus === "soon" ? "⏰ Imminente" : "○ Ouverte"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{r.noticeDeadline}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{r.autoRenew ? "Tacite reconduct." : "Pas de tacite"}</div>
                </div>

                {/* Score */}
                <div style={{ width: 110, paddingRight: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor(r.score), letterSpacing: -0.5, fontFamily: "'Inter', system-ui, sans-serif" }}>{r.score}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>/ 100</span>
                  </div>
                  <div style={crStyles.scoreBar}>
                    <div style={{ width: `${r.score}%`, height: "100%", background: scoreColor(r.score), borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 4 }}>{r.signals.filter(s => s.type === "hot").length} signal(aux) chaud(s)</div>
                </div>

                {/* Owner + action */}
                <div style={{ width: 150 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Avatar name={r.owner} size={22} color={r.ownerColor} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.owner}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Contact {r.lastTouch}</div>
                    </div>
                  </div>
                  <div style={crStyles.nextAction}>
                    <span style={{ color: "#4f46e5" }}>→</span> {r.action}
                  </div>
                </div>

                <div style={{ width: 28 }}>
                  <button style={crStyles.rowMenu}>⋯</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={crStyles.foot}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            8 comptes affichés sur 24 surveillés · Prochaine collecte automatique demain 06:00
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              // Export CSV des comptes surveillés actuellement affichés
              const rows = [["Compte", "Concurrent", "Fin contrat estimée", "ARR €", "Score", "Tier"]];
              try {
                const cards = document.querySelectorAll("[data-renewal-row]");
                if (!cards.length) { alert("Aucune ligne à exporter (rechargez la page)."); return; }
                cards.forEach((c) => {
                  rows.push([
                    c.dataset.name || "",
                    c.dataset.competitor || "",
                    c.dataset.endDate || "",
                    c.dataset.arr || "",
                    c.dataset.score || "",
                    c.dataset.tier || "",
                  ]);
                });
              } catch (e) {}
              if (rows.length === 1) {
                // Fallback : message instructif
                alert("⚠ Export CSV vide. Cette page de démo n'expose pas encore les données via data-attributes — la version BDD permettra l'export automatique.");
                return;
              }
              const csv = rows.map((r) => r.map((c) => `"${String(c||"").replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "concurrents-renouvellements-" + new Date().toISOString().slice(0,10) + ".csv";
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} style={{ ...crStyles.ghostBtn, cursor: "pointer" }}>Exporter CSV</button>
            <button onClick={() => {
              try {
                localStorage.setItem("hubAstorya.competitorAlerts.enabled", "1");
                alert("✓ Alertes activées. Tu recevras un email quand un contrat concurrent approche de sa date de fin (à brancher avec SendGrid/Mailgun côté backend).");
              } catch (e) { alert("Erreur : " + e.message); }
            }} style={{ ...crStyles.ghostBtn, cursor: "pointer" }}>S'abonner aux alertes</button>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </main>
    </div>
  );
};

const Legend = ({ dot, label }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
    <span style={{ width: 8, height: 8, borderRadius: 999, background: dot }} />
    <span>{label}</span>
  </div>
);

const crStyles = {
  frame: { width: "100%", minHeight: "100vh", display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a",  },

  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14, flexShrink: 0 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10.5, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontVariantNumeric: "tabular-nums" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 11 },
  compMark: { width: 22, height: 18, borderRadius: 4, border: "1px solid", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 700, letterSpacing: 0.3 },
  compMarkBig: { width: 30, height: 24, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, letterSpacing: 0.3 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" },
  topbar: { height: 48, padding: "0 24px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  search: { display: "flex", alignItems: "center", gap: 8, width: 320, height: 30, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  searchInput: { border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 12.5 },
  kbdLight: { fontSize: 10.5, padding: "1px 5px", borderRadius: 4, background: "#fff", border: "1px solid #e2e8f0", color: "#94a3b8", fontVariantNumeric: "tabular-nums" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },

  titleRow: { padding: "16px 24px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  liveBadge: { fontSize: 11, color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.6, margin: "4px 0 0", color: "#0f172a" },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 13px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  kpiStrip: { display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 10, padding: "4px 24px 14px" },
  kpi: { padding: "12px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },
  kpiHero: { background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%)", border: "none", color: "#fff", boxShadow: "0 4px 16px rgba(220,38,38,0.25)" },
  kpiLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" },
  kpiValue: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 4 },
  kpiSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  trendChip: { fontSize: 10, padding: "1px 7px", borderRadius: 999, fontWeight: 700 },

  filterBar: { padding: "10px 24px", borderTop: "1px solid #eef1f5", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  tabs: { display: "flex", gap: 2 },
  tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#0f172a", color: "#fff" },
  tabCount: { fontSize: 11, padding: "0 5px", borderRadius: 4, background: "#eef1f5", color: "#64748b", fontVariantNumeric: "tabular-nums" },
  tabCountActive: { background: "rgba(255,255,255,0.15)", color: "#cbd5e1" },
  filterPill: { padding: "5px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  divider: { width: 1, height: 18, background: "#eef1f5", alignSelf: "center", margin: "0 4px" },

  // Timeline
  timelineWrap: { padding: "18px 24px 14px", background: "#fafbfc" },
  timelineHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
  tlMonths: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },
  tlMonth: { padding: 10, borderRight: "1px dashed #eef1f5", minHeight: 90 },
  tlMonthUrgent: { background: "linear-gradient(180deg, #fff5f5, transparent)", borderRadius: 6 },
  tlBubbles: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  tlBubble: { borderRadius: 999, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, letterSpacing: 0.3 },

  // Table
  tableHead: { display: "flex", alignItems: "center", padding: "8px 24px", borderBottom: "1px solid #eef1f5", background: "#fff", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, gap: 4 },
  rows: { background: "#fff" },
  row: { display: "flex", alignItems: "flex-start", padding: "14px 24px", borderBottom: "1px solid #f1f5f9", gap: 4 },
  rowUrgent: { background: "linear-gradient(90deg, #fff8f7, transparent 30%)", borderLeft: "2px solid #dc2626", paddingLeft: 22 },

  coLogo: { width: 36, height: 36, borderRadius: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 },
  tierBadge: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 },
  newPill: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: "#4f46e5", color: "#fff", fontWeight: 700, letterSpacing: 0.4 },

  noticePill: { display: "inline-block", fontSize: 10.5, padding: "2px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.2 },

  miniBar: { width: "100%", height: 4, background: "#eef1f5", borderRadius: 999, overflow: "hidden" },
  scoreBar: { width: "100%", height: 4, background: "#eef1f5", borderRadius: 999, marginTop: 4, overflow: "hidden" },

  nextAction: { fontSize: 11, color: "#475569", marginTop: 8, padding: "4px 6px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 5, lineHeight: 1.4 },
  rowMenu: { width: 24, height: 24, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, borderRadius: 4 },

  foot: { padding: "12px 24px", borderTop: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
};

window.CompetitorRenewals = CompetitorRenewals;
