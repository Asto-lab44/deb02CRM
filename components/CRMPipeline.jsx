// Écran CRM 1 — Pipeline commercial (kanban + KPIs)

const CRMPipeline = () => {
  // Filtre actif sur le pipeline (vue, produit, savedView…)
  const [crmFilter, setCrmFilter] = React.useState({ kind: "all", value: null });
  const isCrmActive = (kind, value) => crmFilter.kind === kind && (value === undefined || crmFilter.value === value);
  const setCrmIfDiff = (kind, value) => setCrmFilter(isCrmActive(kind, value) ? { kind: "all", value: null } : { kind, value });

  // ───── Recherche globale (topbar) — comptes / contacts / opportunités
  const [globalSearch, setGlobalSearch] = React.useState("");
  const [searchClients, setSearchClients] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    if (!window.api) return;
    window.api.clients.list().then((list) => {
      setSearchClients((list || []).map((p) => ({
        id: p.id,
        name: p.raison_sociale || p.name,
        sector: p.secteur || p.industry,
        city: p.ville || p.city,
        siren: p.siren,
        contact: p.contact_principal,
        source: p.status === "client" ? "supabase" : "local",
      })));
    }).catch(() => {});
  }, []);

  const [searchOpps, setSearchOpps] = React.useState([]);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.opportunities.list().then((list) => setSearchOpps(list || [])).catch(() => {});
  }, []);

  const gq = globalSearch.trim().toLowerCase();
  const globalResults = gq.length >= 2 ? {
    clients:  searchClients.filter((c) => [c.name, c.sector, c.city, c.siren].some((v) => String(v || "").toLowerCase().includes(gq))).slice(0, 5),
    contacts: searchClients.filter((c) => c.contact && [c.contact.prenom, c.contact.nom, c.contact.email, c.contact.fonction].some((v) => String(v || "").toLowerCase().includes(gq))).slice(0, 5),
    opps:     searchOpps.filter((o) => [o.name, o.client_name].some((v) => String(v || "").toLowerCase().includes(gq))).slice(0, 5),
  } : null;
  const noResults = globalResults && globalResults.clients.length + globalResults.contacts.length + globalResults.opps.length === 0;
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

        <a href="/nouvelle-opportunite" style={{ ...crmStyles.newBtn, textDecoration: "none", cursor: "pointer" }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          <span>Nouvelle opportunité</span>
          <span style={crmStyles.kbd}>N</span>
        </a>
        <a href="/nouveau-prospect" style={{ ...crmStyles.newBtn, textDecoration: "none", cursor: "pointer", background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          <span>Nouveau prospect</span>
          <span style={{ ...crmStyles.kbd, background: "#f1f5f9", color: "#475569" }}>P</span>
        </a>

        <div style={crmStyles.navSection}>
          <div style={crmStyles.navLabel}>Espace de travail</div>
          {[
            { label: "Pipeline",    icon: "▦", href: "/crm",                      active: isCrmActive("all") },
            { label: "Comptes",     icon: "◰", href: "/crm#comptes" },
            { label: "Contacts",    icon: "◉", href: "/crm#contacts" },
            { label: "Activités",   icon: "✦", href: "/crm#actions" },
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
            <div style={{ ...crmStyles.search, position: "relative" }}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>⌕</span>
              <input placeholder="Rechercher un compte, contact, opportunité…"
                     value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setSearchOpen(true); }}
                     onFocus={() => setSearchOpen(true)}
                     onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                     style={crmStyles.searchInput} />
              <span style={crmStyles.kbdLight}>⌘K</span>

              {searchOpen && globalResults && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 420, overflowY: "auto" }}>
                  {noResults && (
                    <div style={{ padding: "14px", fontSize: 12.5, color: "#94a3b8", textAlign: "center" }}>
                      Aucun résultat pour « {globalSearch} ». <a href="/nouveau-prospect" style={{ color: "#3730a3", fontWeight: 600 }}>+ Nouveau prospect</a>
                    </div>
                  )}

                  {globalResults.clients.length > 0 && (
                    <>
                      <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, background: "#fafbfc", borderBottom: "1px solid #f1f5f9" }}>Comptes ({globalResults.clients.length})</div>
                      {globalResults.clients.map((c) => (
                        <a key={c.id} href={"/fiche-client?id=" + encodeURIComponent(c.id)}
                           style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                          <div style={{ width: 24, height: 24, borderRadius: 5, background: c.source === "local" ? "#fef3c7" : "#dcfce7", color: c.source === "local" ? "#78350f" : "#065f46", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, flexShrink: 0 }}>{(c.name || "?").slice(0, 2).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{c.sector || "—"}{c.city && ` · ${c.city}`}</div>
                          </div>
                          <span style={{ color: "#cbd5e1" }}>›</span>
                        </a>
                      ))}
                    </>
                  )}

                  {globalResults.contacts.length > 0 && (
                    <>
                      <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, background: "#fafbfc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>Contacts ({globalResults.contacts.length})</div>
                      {globalResults.contacts.map((c) => (
                        <a key={"ct-" + c.id} href={"/fiche-client?id=" + encodeURIComponent(c.id)}
                           style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                          <div style={{ width: 24, height: 24, borderRadius: 999, background: "#6366f1", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {((c.contact.prenom || "") + (c.contact.nom || "")).slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.contact.prenom} {c.contact.nom}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{c.contact.fonction || "—"} · {c.name}</div>
                          </div>
                          <span style={{ color: "#cbd5e1" }}>›</span>
                        </a>
                      ))}
                    </>
                  )}

                  {globalResults.opps.length > 0 && (
                    <>
                      <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, background: "#fafbfc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>Opportunités ({globalResults.opps.length})</div>
                      {globalResults.opps.map((o) => (
                        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: 10.5, padding: "2px 7px", background: "#eef2ff", color: "#3730a3", borderRadius: 4, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{o.id}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{o.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{o.client_name} · {o.amount && o.amount + " €"}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
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
            <a href="/nouveau-prospect" style={{ ...crmStyles.primaryBtn, background: "#fff", color: "#3730a3", border: "1px solid #c7d2fe", textDecoration: "none", display: "inline-block", cursor: "pointer", boxShadow: "none" }}>+ Nouveau prospect</a>
            <a href="/nouvelle-opportunite" style={{ ...crmStyles.primaryBtn, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>+ Nouvelle opportunité</a>
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
            <button style={crmStyles.filterPill}>+ Commercial</button>
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

        {/* ─── COMPTES & CONTACTS ─────────────────────────────────────── */}
        <CRMAccountsList />

        {/* ─── ACTIONS À MENER ────────────────────────────────────────── */}
        <CRMActionsList />
      </main>
    </div>
  );
};

const crmStyles = {
  frame: { width: "100%", minHeight: "100vh", display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a" },

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
  kanban: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, padding: "14px 24px 24px", background: "#fafbfc" },
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

// ───── Sous-composant : Comptes & Contacts avec recherche
const CRMAccountsList = () => {
  const [search, setSearch] = React.useState("");
  const [localProspects, setLocalProspects] = React.useState([]);
  const [supaClients, setSupaClients] = React.useState([]);

  React.useEffect(() => {
    if (!window.api) return;
    window.api.clients.list().then((list) => {
      const prospects = (list || []).filter((p) => (p.status || "prospect") === "prospect");
      const clients = (list || []).filter((p) => p.status === "client");
      setLocalProspects(prospects);
      setSupaClients(clients);
    }).catch(() => {});
  }, []);

  // Auto-scroll vers la section si URL contient #comptes
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#comptes") {
      setTimeout(() => {
        const el = document.getElementById("comptes-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  // Fusionne les deux sources en évitant les doublons par id
  const ids = new Set();
  const merged = [];
  for (const p of localProspects) { if (!ids.has(p.id)) { ids.add(p.id); merged.push({ ...p, _source: "local" }); } }
  for (const c of supaClients)    { if (!ids.has(c.id)) { ids.add(c.id); merged.push({ ...c, _source: "supabase", raison_sociale: c.name, ville: c.city, secteur: c.industry, site_web: c.website }); } }

  // Filtrage live
  const q = search.trim().toLowerCase();
  const filtered = q ? merged.filter((c) =>
    [c.raison_sociale, c.ville, c.siren, c.secteur, c.site_web].some((v) => String(v || "").toLowerCase().includes(q))
  ) : merged;

  return (
    <section id="comptes-section" style={{ background: "#fff", borderTop: "1px solid #eef1f5", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Comptes & contacts</h2>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
            {merged.length} compte{merged.length > 1 ? "s" : ""} ({localProspects.length} créé{localProspects.length > 1 ? "s" : ""} récemment · {supaClients.length} en base)
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 480 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="Rechercher (raison sociale, ville, SIREN, secteur…)"
                   style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }} />
          </div>
          <a href="/nouveau-prospect" style={{ padding: "8px 14px", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>+ Nouveau prospect</a>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0" }}>
          {merged.length === 0 ? "Aucun compte pour l'instant. Créez votre premier prospect via le bouton ci-dessus." : "Aucun compte ne correspond à la recherche."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
          {filtered.map((c) => (
            <a key={c.id} href={`/fiche-client?id=${encodeURIComponent(c.id)}`}
               style={{ display: "block", padding: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, textDecoration: "none", color: "inherit", cursor: "pointer", transition: "border-color 120ms" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.raison_sociale || c.name || "—"}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                    {c.secteur || "Secteur non renseigné"}
                    {c.ville && <> · 📍 {c.ville}</>}
                  </div>
                  {c.siren && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>SIREN {c.siren}</div>}
                </div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, fontWeight: 700, background: c._source === "local" ? "#fef3c7" : "#dcfce7", color: c._source === "local" ? "#78350f" : "#065f46", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {c._source === "local" ? "Nouveau" : "Client"}
                </span>
              </div>
              {c.contact_principal && (c.contact_principal.prenom || c.contact_principal.nom) && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#475569" }}>
                  👤 {c.contact_principal.prenom} {c.contact_principal.nom}
                  {c.contact_principal.fonction && <span style={{ color: "#94a3b8" }}> · {c.contact_principal.fonction}</span>}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
};

window.CRMAccountsList = CRMAccountsList;

// ───── Sous-composant : Actions à mener (vue commerciale globale)
const CRMActionsList = () => {
  const [actions, setActions] = React.useState([]);
  const load = React.useCallback(() => {
    if (!window.api) return;
    window.api.actions.list({ status: "todo" }).then((rows) => {
      setActions((rows || []).map((a) => ({
        id: a.id,
        client_id: a.client_id,
        priority: a.priority || "moyenne",
        overdue: false,
        icon: a.icon || (a.type === "call" ? "📞" : a.type === "email" ? "✉" : a.type === "rdv" ? "📅" : "✓"),
        title: a.title || "",
        due: a.due_text || a.due || "",
        assigned: a.assigned_to || a.assigned || "Vous",
        color: "#3730a3",
        meta: a.meta || "",
        tag: a.tag || "",
      })));
    }).catch(() => {});
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const prioMeta = {
    haute:   { label: "Haute",   color: "#dc2626", bg: "#fdecec" },
    moyenne: { label: "Moyenne", color: "#ea580c", bg: "#fef0e6" },
    basse:   { label: "Basse",   color: "#475569", bg: "#eef1f5" },
    ai:      { label: "IA",      color: "#fff",    bg: "#0f172a" },
  };

  const [filter, setFilter] = React.useState("all");
  const filtered = filter === "all" ? actions : actions.filter((a) => a.priority === filter);
  const counts = { all: actions.length, haute: actions.filter(a => a.priority === "haute").length, moyenne: actions.filter(a => a.priority === "moyenne").length, basse: actions.filter(a => a.priority === "basse").length, ai: actions.filter(a => a.priority === "ai").length };

  return (
    <section id="actions-section" style={{ background: "#fafbfc", borderTop: "1px solid #eef1f5", padding: "20px 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Actions à mener</h2>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>{actions.length} action{actions.length > 1 ? "s" : ""} commerciale{actions.length > 1 ? "s" : ""} en file — triées par priorité</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { k: "all",     label: "Toutes",  c: counts.all },
            { k: "haute",   label: "Haute",   c: counts.haute },
            { k: "moyenne", label: "Moyenne", c: counts.moyenne },
            { k: "basse",   label: "Basse",   c: counts.basse },
            { k: "ai",      label: "★ IA",   c: counts.ai },
          ].map((t) => (
            <button key={t.k} onClick={() => setFilter(t.k)}
                    style={{ padding: "5px 10px", border: "1px solid " + (filter === t.k ? "#0f172a" : "#e2e8f0"), background: filter === t.k ? "#0f172a" : "#fff", color: filter === t.k ? "#fff" : "#475569", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {t.label} <span style={{ marginLeft: 4, fontWeight: 700, opacity: 0.7 }}>{t.c}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((a, i) => {
          const pm = prioMeta[a.priority] || prioMeta.basse;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: a.overdue ? "#fff7ed" : "#fff", border: "1px solid " + (a.overdue ? "#fdba74" : "#e2e8f0"), borderRadius: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: pm.color, background: pm.bg, textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0 }}>
                {a.overdue ? "⚠ EN RETARD" : pm.label}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{a.meta}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, color: a.overdue ? "#c2410c" : "#475569", fontWeight: 600 }}>{a.due}</span>
                <span style={{ fontSize: 11, color: a.color, fontWeight: 600 }}>{a.assigned}</span>
              </div>
              <span style={{ fontSize: 10.5, padding: "2px 7px", background: "#eef2ff", color: "#3730a3", borderRadius: 4, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{a.tag}</span>
              <button onClick={async () => { if (!a.id) return; try { await window.api.actions.complete(a.id); load(); } catch (e) {} }}
                      style={{ padding: "5px 9px", background: "#10b981", color: "#fff", border: 0, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Traiter</button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
window.CRMActionsList = CRMActionsList;

window.CRMPipeline = CRMPipeline;
