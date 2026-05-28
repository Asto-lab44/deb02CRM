// Écran CRM 1 — Pipeline commercial (kanban + KPIs)

const CRMPipeline = () => {
  // Filtre actif sur le pipeline (vue, produit, savedView…)
  const [crmFilter, setCrmFilter] = React.useState({ kind: "all", value: null });
  const isCrmActive = (kind, value) => crmFilter.kind === kind && (value === undefined || crmFilter.value === value);
  const setCrmIfDiff = (kind, value) => setCrmFilter(isCrmActive(kind, value) ? { kind: "all", value: null } : { kind, value });
  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", M: "#a855f7", N: "#ec4899", J: "#14b8a6" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
        border: "1.5px solid #fff",
      }}>{initials}</div>
    );
  };

  const columns = [
    {
      key: "qualif", label: "Qualification", count: 8, total: "184 k€", color: "#94a3b8",
      cards: [
        { co: "Banque Méridionale", amount: "32 000 €", days: 3, owner: "Nadia Lefèvre", proba: 20, tag: "Cyber", logo: "BM", logoBg: "#0f172a" },
        { co: "Crédit Provence", amount: "18 500 €", days: 5, owner: "Tom Verdier", proba: 15, tag: "Hub", logo: "CP", logoBg: "#10b981" },
        { co: "Helios Mutuelle", amount: "24 000 €", days: 1, owner: "Sophie Aubry", proba: 25, tag: "Cyber", logo: "HM", logoBg: "#f59e0b", isNew: true },
      ],
    },
    {
      key: "discovery", label: "Discovery", count: 11, total: "412 k€", color: "#3b82f6",
      cards: [
        { co: "Groupe Vatel Assurances", amount: "85 000 €", days: 6, owner: "Nadia Lefèvre", proba: 35, tag: "Suite", logo: "VA", logoBg: "#4f46e5", contacts: 3, hot: true },
        { co: "MACIF Régionale Nord", amount: "47 000 €", days: 2, owner: "Karim Ben Salah", proba: 40, tag: "Hub", logo: "MN", logoBg: "#dc2626", contacts: 2 },
        { co: "Atlantique Patrimoine", amount: "29 500 €", days: 9, owner: "Sophie Aubry", proba: 30, tag: "Cyber", logo: "AP", logoBg: "#0ea5e9", warning: "Pas de contact 12 j" },
        { co: "Cabinet Renard & Fils", amount: "12 000 €", days: 4, owner: "Tom Verdier", proba: 35, tag: "Hub", logo: "RF", logoBg: "#a855f7" },
      ],
    },
    {
      key: "propo", label: "Proposition", count: 6, total: "548 k€", color: "#a855f7",
      cards: [
        { co: "AXA Wealth France", amount: "215 000 €", days: 11, owner: "Nadia Lefèvre", proba: 55, tag: "Suite", logo: "AX", logoBg: "#1e40af", contacts: 5, hot: true, meeting: "Comité achats jeudi" },
        { co: "Generali Patrimoine", amount: "92 000 €", days: 7, owner: "Karim Ben Salah", proba: 60, tag: "Cyber", logo: "GP", logoBg: "#dc2626", contacts: 4 },
        { co: "MAIF Innovation", amount: "78 500 €", days: 5, owner: "Sophie Aubry", proba: 50, tag: "Hub", logo: "MI", logoBg: "#10b981", contacts: 3 },
        { co: "Caisse d'Épargne IDF", amount: "54 000 €", days: 14, owner: "Tom Verdier", proba: 45, tag: "Hub", logo: "CE", logoBg: "#ea580c", warning: "Relance attendue" },
      ],
    },
    {
      key: "nego", label: "Négociation", count: 4, total: "327 k€", color: "#ea580c",
      cards: [
        { co: "BNP Asset Management", amount: "168 000 €", days: 8, owner: "Nadia Lefèvre", proba: 75, tag: "Suite", logo: "BP", logoBg: "#0f766e", contacts: 6, hot: true, meeting: "Signature prévue 30/05" },
        { co: "Allianz France PME", amount: "96 000 €", days: 13, owner: "Karim Ben Salah", proba: 70, tag: "Cyber", logo: "AL", logoBg: "#1e3a8a", contacts: 4 },
        { co: "Société Générale Pri.", amount: "63 000 €", days: 21, owner: "Sophie Aubry", proba: 65, tag: "Hub", logo: "SG", logoBg: "#dc2626", warning: "Stagne 21 j" },
      ],
    },
    {
      key: "won", label: "Gagné", count: 3, total: "276 k€", color: "#10b981",
      cards: [
        { co: "Crédit Mutuel Océan", amount: "142 000 €", days: 2, owner: "Nadia Lefèvre", proba: 100, tag: "Suite", logo: "CM", logoBg: "#0f766e", contacts: 5, won: true },
        { co: "Aviva Investors FR", amount: "88 000 €", days: 4, owner: "Karim Ben Salah", proba: 100, tag: "Cyber", logo: "AV", logoBg: "#fbbf24", won: true },
        { co: "Crédit Agricole Sud", amount: "46 000 €", days: 6, owner: "Tom Verdier", proba: 100, tag: "Hub", logo: "CA", logoBg: "#10b981", won: true },
      ],
    },
  ];

  const tagMeta = {
    Cyber: { bg: "#fdecec", color: "#dc2626" },
    Hub: { bg: "#eef2ff", color: "#4338ca" },
    Suite: { bg: "#f5efff", color: "#7e22ce" },
  };

  return (
    <div style={crmStyles.frame}>
      {/* ───── SIDEBAR ───── */}
      <aside style={crmStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...crmStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          <div style={crmStyles.logo}><div style={crmStyles.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>CRM commercial</div>
          </div>
        </a>

        <button style={crmStyles.newBtn}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          <span>Nouvelle opportunité</span>
          <span style={crmStyles.kbd}>N</span>
        </button>

        <div style={crmStyles.navSection}>
          <div style={crmStyles.navLabel}>Espace de travail</div>
          {[
            { label: "Pipeline",    count: "32",    icon: "▦", href: "/crm",                      active: isCrmActive("all") },
            { label: "Comptes",     count: "412",   icon: "◰", href: "/fiche-client" },
            { label: "Contacts",    count: "1 184", icon: "◉", onClick: () => alert("Carnet contacts — 1 184 fiches\n(Sera connecté à la table profiles + clients de Supabase.)") },
            { label: "Activités",   count: "27",    icon: "✦", onClick: () => alert("Activités — Appels, emails, RDV, tâches\n(Sera connecté à la timeline d'événements.)") },
            { label: "Prévisions",  icon: "↗", onClick: () => alert("Prévisions trimestrielles\n(Sera connecté au pipeline pondéré.)") },
            { label: "Rapports",    icon: "▤", onClick: () => alert("Rapports BI\n(Sera connecté à la vue stats Supabase.)") },
          ].map((n) => {
            const inner = (
              <>
                <span style={{ width: 14, color: n.active ? "#4f46e5" : "#94a3b8", fontSize: 11 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.count && <span style={crmStyles.navCount}>{n.count}</span>}
              </>
            );
            const styleAct = { ...crmStyles.navItem, ...(n.active ? crmStyles.navItemActive : {}), cursor: "pointer" };
            if (n.href) return <a key={n.label} href={n.href} style={{ ...styleAct, textDecoration: "none", color: n.active ? "#3730a3" : "inherit" }}>{inner}</a>;
            return <div key={n.label} onClick={n.onClick} style={styleAct}>{inner}</div>;
          })}
        </div>

        <div style={crmStyles.navSection}>
          <div style={crmStyles.navLabel}>Vues sauvegardées</div>
          {[
            { label: "Mon pipeline Q2",      color: "#4f46e5", value: "q2" },
            { label: "Deals > 50 k€",        color: "#10b981", value: "big" },
            { label: "À relancer cette sem.", color: "#f59e0b", value: "follow" },
            { label: "Stagnants 14 j+",      color: "#dc2626", value: "stale" },
          ].map((n) => {
            const active = isCrmActive("view", n.value);
            return (
              <div key={n.label}
                   onClick={() => setCrmIfDiff("view", n.value)}
                   style={{ ...crmStyles.navItem, ...(active ? crmStyles.navItemActive : {}), cursor: "pointer" }}>
                <span style={{ width: 14, display: "flex" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: n.color }} />
                </span>
                <span style={{ flex: 1 }}>{n.label}</span>
              </div>
            );
          })}
        </div>

        <div style={crmStyles.navSection}>
          <div style={crmStyles.navLabel}>Produits</div>
          {[
            { label: "Astorya Suite", c: "12", color: "#a855f7" },
            { label: "Astorya Hub",   c: "11", color: "#4f46e5" },
            { label: "Astorya Cyber", c: "9",  color: "#dc2626" },
          ].map((n) => {
            const active = isCrmActive("product", n.label);
            return (
              <div key={n.label}
                   onClick={() => setCrmIfDiff("product", n.label)}
                   style={{ ...crmStyles.navItem, ...(active ? crmStyles.navItemActive : {}), cursor: "pointer" }}>
                <span style={{ width: 14 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: n.color, display: "inline-block" }} /></span>
                <span style={{ flex: 1 }}>{n.label}</span>
                <span style={crmStyles.navCount}>{n.c}</span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={crmStyles.userRow}>
          <Avatar name="Nadia Lefèvre" size={26} color="#a855f7" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>Nadia Lefèvre</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Account Executive · EMEA</div>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>⋯</span>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={crmStyles.main}>
        <header style={crmStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>CRM</div>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Pipeline</div>
            <span style={crmStyles.totalChip}>Q2 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={crmStyles.search}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>⌕</span>
              <input placeholder="Rechercher un compte, contact, opportunité…" style={crmStyles.searchInput} readOnly />
              <span style={crmStyles.kbdLight}>⌘K</span>
            </div>
            <button style={crmStyles.iconBtn} title="Notifications">
              <span style={{ fontSize: 13 }}>◔</span>
              <span style={crmStyles.notifDot} />
            </button>
            <button style={crmStyles.iconBtn}>?</button>
          </div>
        </header>

        <div style={crmStyles.titleRow}>
          <div>
            <h1 style={crmStyles.h1}>Pipeline commercial</h1>
            <p style={crmStyles.h1sub}>32 opportunités actives · 1,75 M€ pondéré · clôture Q2 dans 5 semaines</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={crmStyles.ghostBtn}>Importer</button>
            <button style={crmStyles.ghostBtn}>Exporter</button>
            <button style={crmStyles.primaryBtn}>+ Nouvelle opportunité</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={crmStyles.kpiStrip}>
          {[
            { label: "Pipeline total", value: "1,75 M€", delta: "+18 % vs Q1", color: "#4f46e5" },
            { label: "Pondéré (probabilité)", value: "742 k€", delta: "Objectif Q2 : 900 k€", color: "#a855f7" },
            { label: "Closing ce mois", value: "276 k€", delta: "3 deals · 4 j moy.", color: "#10b981" },
            { label: "Vélocité moy.", value: "31 j", delta: "–4 j vs trimestre", color: "#0ea5e9" },
            { label: "Deals à risque", value: "5", delta: "Stagnation > 14 j", color: "#dc2626" },
          ].map((k) => (
            <div key={k.label} style={crmStyles.kpi}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: k.color }} />
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: 0.2, textTransform: "uppercase" }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", letterSpacing: -0.5 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={crmStyles.filterBar}>
          <div style={crmStyles.tabs}>
            {[
              { k: "all", label: "Pipeline", active: true },
              { k: "mine", label: "Mes deals", c: 9 },
              { k: "team", label: "Équipe EMEA", c: 32 },
              { k: "lost", label: "Perdus 30j", c: 4 },
            ].map((t) => (
              <button key={t.k} style={{ ...crmStyles.tab, ...(t.active ? crmStyles.tabActive : {}) }}>
                {t.label}
                {t.c != null && <span style={{ ...crmStyles.tabCount, ...(t.active ? crmStyles.tabCountActive : {}) }}>{t.c}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={crmStyles.filterPill}>+ Produit</button>
            <button style={crmStyles.filterPill}>+ Montant</button>
            <button style={crmStyles.filterPill}>+ Owner</button>
            <button style={crmStyles.filterPill}>+ Date close</button>
            <span style={crmStyles.divider} />
            <button style={crmStyles.filterPill}>↕ Montant</button>
            <button style={crmStyles.filterPill} title="Vue Kanban">▦</button>
            <button style={crmStyles.filterPill} title="Vue Liste">☰</button>
          </div>
        </div>

        {/* Kanban */}
        <div style={crmStyles.kanban}>
          {columns.map((col) => (
            <div key={col.key} style={crmStyles.column}>
              {/* col head */}
              <div style={crmStyles.colHead}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: col.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{col.label}</span>
                  <span style={crmStyles.colCount}>{col.count}</span>
                </div>
                <span style={{ fontSize: 11.5, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{col.total}</span>
              </div>
              <div style={crmStyles.colBar}>
                <div style={{ width: `${Math.min(100, parseInt(col.total))}%`, height: "100%", background: col.color, opacity: 0.7, borderRadius: 999 }} />
              </div>

              {/* cards */}
              <div style={crmStyles.cards}>
                {col.cards.map((c, i) => {
                  const tag = tagMeta[c.tag];
                  return (
                    <div key={i} style={{ ...crmStyles.card, ...(c.hot ? crmStyles.cardHot : {}), ...(c.won ? crmStyles.cardWon : {}) }}>
                      {c.isNew && <div style={crmStyles.newRibbon}>Nouveau</div>}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 8 }}>
                        <div style={{ ...crmStyles.coLogo, background: c.logoBg }}>{c.logo}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, wordBreak: "break-word" }}>{c.co}</div>
                          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                            <span style={{ ...crmStyles.tagPill, background: tag.bg, color: tag.color }}>{c.tag}</span>
                            {c.hot && <span style={{ ...crmStyles.tagPill, background: "#fff1d6", color: "#a65f00" }}>🔥 Hot</span>}
                            {c.won && <span style={{ ...crmStyles.tagPill, background: "#e8f8f1", color: "#0e7a55" }}>✓ Signé</span>}
                          </div>
                        </div>
                      </div>

                      <div style={crmStyles.cardAmount}>{c.amount}</div>

                      {c.meeting && (
                        <div style={crmStyles.meetingNote}>
                          <span style={{ color: "#4f46e5" }}>◷</span> {c.meeting}
                        </div>
                      )}
                      {c.warning && (
                        <div style={crmStyles.warnNote}>
                          <span>⚠</span> {c.warning}
                        </div>
                      )}

                      {/* probability */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Probabilité</span>
                          <span style={{ fontSize: 11, color: "#0f172a", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{c.proba}%</span>
                        </div>
                        <div style={crmStyles.probaBar}>
                          <div style={{ width: `${c.proba}%`, height: "100%", background: col.color, borderRadius: 999 }} />
                        </div>
                      </div>

                      <div style={crmStyles.cardFoot}>
                        <Avatar name={c.owner} size={20} />
                        <div style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 11, color: "#64748b" }}>
                          {c.contacts != null && (
                            <span title="Contacts" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <span style={{ color: "#94a3b8" }}>◉</span>{c.contacts}
                            </span>
                          )}
                          <span title="Dernière activité" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <span style={{ color: "#94a3b8" }}>◷</span>{c.days}j
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button style={crmStyles.addCard}>+ Ajouter une opportunité</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const crmStyles = {
  frame: { width: 1440, height: 900, display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a", overflow: "hidden" },

  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 1px 2px rgba(67,56,202,0.3)" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10.5, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 20px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  totalChip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace" },
  search: { display: "flex", alignItems: "center", gap: 8, width: 340, height: 30, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  searchInput: { border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 12.5, color: "#0f172a", fontFamily: "inherit" },
  kbdLight: { fontSize: 10.5, padding: "1px 5px", borderRadius: 4, background: "#fff", border: "1px solid #e2e8f0", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", position: "relative", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 6, right: 7, width: 6, height: 6, background: "#ef4444", borderRadius: 999, border: "1.5px solid #fff" },

  titleRow: { padding: "18px 24px 10px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  h1: { fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: "#0f172a" },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 13px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  kpiStrip: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, padding: "4px 24px 14px" },
  kpi: { padding: "12px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },

  filterBar: { padding: "10px 24px", borderTop: "1px solid #eef1f5", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  tabs: { display: "flex", gap: 2 },
  tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#0f172a", color: "#fff" },
  tabCount: { fontSize: 11, padding: "0 5px", borderRadius: 4, background: "#eef1f5", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" },
  tabCountActive: { background: "rgba(255,255,255,0.15)", color: "#cbd5e1" },
  filterPill: { padding: "5px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  divider: { width: 1, height: 18, background: "#eef1f5", alignSelf: "center", margin: "0 4px" },

  // Kanban
  kanban: { flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, padding: "14px 24px 24px", overflow: "hidden", background: "#fafbfc" },
  column: { display: "flex", flexDirection: "column", minWidth: 0, background: "#f1f3f6", borderRadius: 10, padding: 10, gap: 8 },
  colHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px" },
  colCount: { fontSize: 11, padding: "0 6px", borderRadius: 999, background: "#fff", color: "#475569", fontFamily: "'JetBrains Mono', monospace", border: "1px solid #e2e8f0" },
  colBar: { height: 2, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", margin: "0 2px 4px" },

  cards: { display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" },
  card: { position: "relative", padding: 11, background: "#fff", border: "1px solid #eef1f5", borderRadius: 8, boxShadow: "0 1px 0 rgba(15,23,42,0.02)" },
  cardHot: { borderColor: "#fed7aa", boxShadow: "0 0 0 1px #fed7aa, 0 1px 0 rgba(15,23,42,0.02)" },
  cardWon: { background: "linear-gradient(180deg, #ffffff, #f0fdf6)", borderColor: "#bbf7d0" },
  newRibbon: { position: "absolute", top: -6, right: 8, padding: "1px 7px", background: "#4f46e5", color: "#fff", fontSize: 9.5, fontWeight: 700, borderRadius: 999, letterSpacing: 0.3, textTransform: "uppercase" },
  coLogo: { width: 28, height: 28, borderRadius: 6, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 },
  tagPill: { display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, letterSpacing: 0.2 },
  cardAmount: { fontSize: 18, fontWeight: 600, color: "#0f172a", letterSpacing: -0.4, fontFamily: "'Inter', sans-serif" },

  meetingNote: { fontSize: 11, color: "#3730a3", background: "#eef2ff", padding: "4px 7px", borderRadius: 6, marginTop: 6 },
  warnNote: { fontSize: 11, color: "#a65f00", background: "#fff6e6", padding: "4px 7px", borderRadius: 6, marginTop: 6, display: "flex", gap: 4, alignItems: "center" },

  probaBar: { width: "100%", height: 3, background: "#eef1f5", borderRadius: 999, overflow: "hidden" },
  cardFoot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, paddingTop: 8, borderTop: "1px solid #f1f5f9" },

  addCard: { padding: "8px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 8, fontSize: 11.5, color: "#94a3b8", cursor: "pointer", fontWeight: 500 },
};

window.CRMPipeline = CRMPipeline;
