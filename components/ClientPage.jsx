// Fiche client 360 — pipe multi-contrats + actions menées / à mener

const ClientPage = () => {
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [assetsOpen, setAssetsOpen] = React.useState(false);

  const Avatar = ({ name, size = 24, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", M: "#a855f7", N: "#ec4899", E: "#14b8a6", A: "#dc2626", J: "#0ea5e9", P: "#8b5cf6" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  // ── Pipe : opportunités du client AXA Wealth France
  const pipeStages = [
    { k: "qualif", label: "Qualification", color: "#94a3b8" },
    { k: "discovery", label: "Discovery", color: "#3b82f6" },
    { k: "propo", label: "Proposition", color: "#a855f7" },
    { k: "nego", label: "Négociation", color: "#ea580c" },
    { k: "won", label: "Signé", color: "#10b981" },
  ];

  const opportunities = [
    { name: "Astorya Suite — 750 sièges", amount: "215 000 €", stage: "propo", proba: 55, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "15 juin 2026", days: 8, hot: true, ref: "OPP-2814" },
    { name: "Module Cyber — POC 50 utilisateurs", amount: "48 000 €", stage: "discovery", proba: 40, owner: "Karim Ben Salah", ownerColor: "#6366f1", close: "30 juin 2026", days: 4, ref: "OPP-2841" },
    { name: "Extension Hub — filiale Belgique", amount: "92 000 €", stage: "qualif", proba: 20, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "15 sept. 2026", days: 2, isNew: true, ref: "OPP-2867" },
    { name: "Renouvellement Suite 2024-2026", amount: "184 000 €", stage: "won", proba: 100, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "01 mars 2026", days: 0, won: true, ref: "OPP-2698" },
  ];

  // ── Actions menées (passé, dernières)
  const past = [
    { type: "email", icon: "✉", color: "#a855f7", title: "Email envoyé — Proposition Suite v2", who: "Nadia Lefèvre → Émilie Roux", at: "il y a 4 h", meta: "Pièce jointe : Proposition-AXA-v2.pdf" },
    { type: "call", icon: "☎", color: "#10b981", title: "Appel sortant — 22 min", who: "Karim Ben Salah → Antoine Mercier (CISO)", at: "hier · 09:18", meta: "Validation périmètre sécurité — ouvert à POC 50 utilisateurs" },
    { type: "meeting", icon: "👥", color: "#0ea5e9", title: "RDV — Démo Astorya Suite", who: "5 participants AXA · 60 min", at: "jeu. 21 mai", meta: "Très bon retour UX sur les modules Dashboard et Reporting" },
    { type: "stage", icon: "↗", color: "#a855f7", title: "Étape avancée : Discovery → Proposition", who: "OPP-2814 · par Nadia Lefèvre", at: "lun. 25 mai", meta: null },
    { type: "note", icon: "✎", color: "#a65f00", title: "Note privée — Sentiment décideurs", who: "Nadia Lefèvre", at: "lun. 25 mai", meta: "CFO veut ROI à 18 mois. Préparer slide dédié pour comité." },
    { type: "email", icon: "✉", color: "#a855f7", title: "Email reçu — Questions techniques", who: "Émilie Roux (VP Innovation)", at: "il y a 2 j", meta: "3 points à clarifier : DORA, localisation UE, tarif > 500 users" },
    { type: "meeting", icon: "👥", color: "#0ea5e9", title: "RDV — Cadrage besoins métier", who: "3 participants · 45 min", at: "ven. 16 mai", meta: "Priorités confirmées : reporting client, conformité, mobilité" },
    { type: "doc", icon: "📄", color: "#64748b", title: "Document partagé — RFP Astorya", who: "Téléchargé 7 fois par AXA", at: "08 mai", meta: "RFP-Astorya-2026.pdf · 2,4 Mo" },
  ];

  // ── Actions à mener (futur, à faire)
  const future = [
    {
      priority: "haute", overdue: true, icon: "📧",
      title: "Répondre aux 3 questions techniques d'Émilie", due: "Aujourd'hui · 18:00",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Brouillon IA pré-rempli (citations p.12-14 de la proposition)",
      tag: "OPP-2814", tagColor: "#a855f7",
    },
    {
      priority: "haute", icon: "📅",
      title: "Comité achats AXA — présentation finale Suite", due: "Jeu. 28 mai · 14h00 · 30 min",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Visio Teams · 4 participants AXA (Roux, Mercier, Pasquier, Lopez)",
      tag: "OPP-2814", tagColor: "#a855f7",
      attendees: ["Émilie Roux", "Antoine Mercier", "Julien Pasquier", "Marie Lopez"],
    },
    {
      priority: "moyenne", icon: "📞",
      title: "Appel de cadrage POC Cyber avec Antoine Mercier", due: "Ven. 29 mai · 10h00",
      assigned: "Karim Ben Salah", assignedColor: "#6366f1",
      meta: "Préparer planning d'installation et plan de test",
      tag: "OPP-2841", tagColor: "#dc2626",
    },
    {
      priority: "moyenne", icon: "✉",
      title: "Envoyer proposition v3 Suite mise à jour", due: "Dim. 31 mai",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Intégrer commentaires CFO sur le ROI 18 mois",
      tag: "OPP-2814", tagColor: "#a855f7",
    },
    {
      priority: "basse", icon: "👥",
      title: "RDV de découverte filiale Belgique", due: "Sem. du 02 juin",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Identifier interlocuteurs locaux à Bruxelles",
      tag: "OPP-2867", tagColor: "#94a3b8",
    },
    {
      priority: "basse", icon: "🔄",
      title: "Préparer renouvellement Suite 2026-2028", due: "Sept. 2026",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Renouvellement automatique en mars — anticiper négociation",
      tag: "Recurring", tagColor: "#10b981",
    },
    {
      priority: "ai", icon: "★",
      title: "Suggestion IA — Inviter Émilie Roux à user-group Astorya",
      due: "Ce mois",
      meta: "Émilie a téléchargé 3 white papers ce trimestre. Signal champion fort.",
      tag: "Insight", tagColor: "#0f172a",
    },
  ];

  const prioMeta = {
    haute: { label: "Haute", color: "#dc2626", bg: "#fdecec" },
    moyenne: { label: "Moyenne", color: "#ea580c", bg: "#fef0e6" },
    basse: { label: "Basse", color: "#475569", bg: "#eef1f5" },
    ai: { label: "IA", color: "#fff", bg: "#0f172a" },
  };

  return (
    <div style={cliStyles.frame}>
      {/* ───── SIDEBAR ───── */}
      <aside style={cliStyles.sidebar}>
        <div style={cliStyles.brandRow}>
          <div style={cliStyles.logo}><div style={cliStyles.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>CRM commercial</div>
          </div>
        </div>
        <button style={cliStyles.newBtn}>+ Nouvelle opportunité <span style={cliStyles.kbd}>N</span></button>

        <div style={cliStyles.navSection}>
          <div style={cliStyles.navLabel}>Espace</div>
          <div style={cliStyles.navItem}><span style={cliStyles.bullet}>▦</span><span style={{ flex: 1 }}>Pipeline</span><span style={cliStyles.navCount}>32</span></div>
          <div style={{ ...cliStyles.navItem, ...cliStyles.navItemActive }}><span style={cliStyles.bullet}>◰</span><span style={{ flex: 1 }}>Comptes</span><span style={cliStyles.navCount}>412</span></div>
          <div style={cliStyles.navItem}><span style={cliStyles.bullet}>◉</span><span style={{ flex: 1 }}>Contacts</span><span style={cliStyles.navCount}>1 184</span></div>
          <div style={cliStyles.navItem}><span style={cliStyles.bullet}>✦</span><span style={{ flex: 1 }}>Activités</span><span style={cliStyles.navCount}>27</span></div>
        </div>

        <div style={cliStyles.navSection}>
          <div style={cliStyles.navLabel}>Clients récents</div>
          <div style={{ ...cliStyles.navItem, ...cliStyles.navItemActive }}><span style={{ ...cliStyles.miniLogo, background: "#1e40af" }}>AX</span><span style={{ flex: 1, fontWeight: 600 }}>AXA Wealth France</span></div>
          <div style={cliStyles.navItem}><span style={{ ...cliStyles.miniLogo, background: "#0f766e" }}>BP</span><span style={{ flex: 1 }}>BNP Asset Mgmt</span></div>
          <div style={cliStyles.navItem}><span style={{ ...cliStyles.miniLogo, background: "#dc2626" }}>GP</span><span style={{ flex: 1 }}>Generali Patri.</span></div>
          <div style={cliStyles.navItem}><span style={{ ...cliStyles.miniLogo, background: "#10b981" }}>MI</span><span style={{ flex: 1 }}>MAIF Innovation</span></div>
          <div style={cliStyles.navItem}><span style={{ ...cliStyles.miniLogo, background: "#ea580c" }}>CE</span><span style={{ flex: 1 }}>Caisse Épargne IDF</span></div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={cliStyles.userRow}>
          <Avatar name="Nadia Lefèvre" size={26} color="#a855f7" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Nadia Lefèvre</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>AE · EMEA</div>
          </div>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={cliStyles.main}>
        {/* Topbar */}
        <header style={cliStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
            <span>CRM</span><span style={{ color: "#cbd5e1" }}>/</span>
            <span>Comptes</span><span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>AXA Wealth France</span>
            <span style={cliStyles.refMono}>ACC-0184</span>
            <span style={cliStyles.healthChip}>● Compte sain</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={cliStyles.iconBtn}>‹</button>
            <button style={cliStyles.iconBtn}>›</button>
            <button style={cliStyles.ghostBtn}>★ Suivre</button>
            <button style={cliStyles.iconBtn}>⋯</button>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={cliStyles.scroll}>
          {/* HERO */}
          <section style={cliStyles.hero}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div style={cliStyles.coLogoBig}>AX</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={cliStyles.industryChip}>Asset Management</span>
                  <span style={cliStyles.metaChip}>Grand compte</span>
                  <span style={cliStyles.metaChip}>12 000 employés</span>
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>📍 Paris · La Défense</span>
                  <span style={cliStyles.dot} />
                  <a style={{ fontSize: 12, color: "#4f46e5", cursor: "pointer" }}>axa-im.fr ↗</a>
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Client depuis mars 2024</span>
                </div>
                <h1 style={cliStyles.h1}>AXA Wealth France</h1>
                <p style={cliStyles.subtitle}>
                  Filiale française gestion de patrimoine du groupe AXA. Direction : Émilie Roux (VP Innovation).
                </p>

                {/* tags */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={cliStyles.tag}># Grand-compte</span>
                  <span style={cliStyles.tag}># Top-10 Q2</span>
                  <span style={cliStyles.tag}># Migration Salesforce</span>
                  <span style={cliStyles.tag}># DORA</span>
                </div>
              </div>

              {/* Quick stats */}
              <div style={cliStyles.heroStats}>
                <div style={cliStyles.heroStat}>
                  <div style={cliStyles.heroStatK}>ARR actuel</div>
                  <div style={cliStyles.heroStatV}>184 k€</div>
                  <div style={{ fontSize: 10.5, color: "#0e7a55", marginTop: 2 }}>↑ +12 % YoY</div>
                </div>
                <div style={cliStyles.heroStat}>
                  <div style={cliStyles.heroStatK}>Pipe ouvert</div>
                  <div style={{ ...cliStyles.heroStatV, color: "#4f46e5" }}>355 k€</div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>3 opportunités</div>
                </div>
                <div style={cliStyles.heroStat}>
                  <div style={cliStyles.heroStatK}>Health score</div>
                  <div style={{ ...cliStyles.heroStatV, color: "#10b981" }}>78<span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}> / 100</span></div>
                  <div style={cliStyles.miniBar}><div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #10b981)", borderRadius: 999 }} /></div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div style={cliStyles.actionBar}>
              <button style={cliStyles.primaryBtn}>+ Nouvelle opportunité</button>
              <button style={cliStyles.ghostBtn}>✉ Email</button>
              <button style={cliStyles.ghostBtn}>📅 RDV</button>
              <button style={cliStyles.ghostBtn}>📞 Appel</button>
              <button style={cliStyles.ghostBtn}>✓ Tâche</button>
              <button style={cliStyles.ghostBtn}>✎ Note</button>
              <button
                onClick={() => setStatsOpen(true)}
                style={{ ...cliStyles.ghostBtn, background: "#eef2ff", borderColor: "#c7d2fe", color: "#3730a3", fontWeight: 600 }}
                title="Statistiques d'appels hotline sur 12 mois"
              >
                📊 Stats appels
              </button>
              <button
                onClick={() => setAssetsOpen(true)}
                style={{ ...cliStyles.ghostBtn, background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46", fontWeight: 600 }}
                title="Extraction du parc informatique du client (CMDB)"
              >
                💻 Parc IT
              </button>
              <span style={{ flex: 1 }} />
              <button style={cliStyles.ghostBtn}>Exporter compte ↓</button>
            </div>
          </section>

          {/* PIPE — Contrats / opportunités */}
          <section style={cliStyles.block}>
            <div style={cliStyles.blockHead}>
              <div>
                <h2 style={cliStyles.h2}>Pipe contrats <span style={cliStyles.blockCount}>{opportunities.length}</span></h2>
                <p style={cliStyles.h2sub}>Vue d'ensemble des opportunités et contrats actifs pour ce client</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={cliStyles.filterPill}>Vue Kanban ▦</button>
                <button style={cliStyles.filterPill}>Vue Liste ☰</button>
              </div>
            </div>

            {/* Stage progression strip */}
            <div style={cliStyles.stagesStrip}>
              {pipeStages.map((s, i) => {
                const opps = opportunities.filter(o => o.stage === s.k);
                const sum = opps.reduce((acc, o) => acc + parseInt(o.amount.replace(/\s/g, "").replace(" €", "").replace(/[^\d]/g, "")), 0);
                return (
                  <div key={s.k} style={cliStyles.stageCol}>
                    <div style={cliStyles.stageColHead}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>{s.label}</span>
                      <span style={cliStyles.stageCount}>{opps.length}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", padding: "0 4px" }}>
                      {opps.length ? `${(sum/1000).toFixed(0)} k€` : "—"}
                    </div>
                    <div style={cliStyles.stageColBar}>
                      <div style={{ width: opps.length ? "100%" : "0%", height: "100%", background: s.color, opacity: 0.6, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Opp cards */}
            <div style={cliStyles.oppGrid}>
              {opportunities.map((o, i) => {
                const stage = pipeStages.find(s => s.k === o.stage);
                return (
                  <div key={i} style={{ ...cliStyles.oppCard, ...(o.won ? cliStyles.oppCardWon : {}), ...(o.hot ? cliStyles.oppCardHot : {}) }}>
                    {o.isNew && <span style={cliStyles.newRibbon}>NOUVEAU</span>}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={cliStyles.oppRef}>{o.ref}</span>
                          <span style={{ ...cliStyles.stagePill, background: stage.color + "20", color: stage.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: 999, background: stage.color }} />
                            {stage.label}
                          </span>
                          {o.hot && <span style={cliStyles.hotPill}>🔥 Hot</span>}
                          {o.won && <span style={cliStyles.wonPill}>✓ Signé</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, marginBottom: 8 }}>{o.name}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={cliStyles.oppAmount}>{o.amount}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Clôture {o.close}</div>
                      </div>
                    </div>

                    {/* Probability */}
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Probabilité</span>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: stage.color }}>{o.proba}%</span>
                      </div>
                      <div style={cliStyles.probaBar}>
                        <div style={{ width: `${o.proba}%`, height: "100%", background: stage.color, borderRadius: 999 }} />
                      </div>
                    </div>

                    <div style={cliStyles.oppFoot}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={o.owner} size={20} color={o.ownerColor} />
                        <span style={{ fontSize: 11.5, color: "#475569" }}>{o.owner}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {o.won ? "Renouvellement actif" : `MAJ il y a ${o.days} j`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ACTIONS — split en 2 colonnes */}
          <section style={cliStyles.block}>
            <div style={cliStyles.actionsGrid}>

              {/* Actions à mener */}
              <div style={cliStyles.actionsCol}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>
                      <span style={{ color: "#4f46e5" }}>→</span> Actions à mener <span style={cliStyles.blockCount}>{future.length}</span>
                    </h2>
                    <p style={cliStyles.h2sub}>Tâches, relances et événements planifiés</p>
                  </div>
                  <button style={cliStyles.primaryBtnSm}>+ Ajouter</button>
                </div>

                <div style={cliStyles.actionsList}>
                  {future.map((a, i) => {
                    const p = prioMeta[a.priority];
                    return (
                      <div key={i} style={{
                        ...cliStyles.actionItem,
                        ...(a.overdue ? cliStyles.actionItemOverdue : {}),
                        ...(a.priority === "ai" ? cliStyles.actionItemAI : {}),
                      }}>
                        <input type="checkbox" style={cliStyles.checkbox} readOnly />
                        <div style={{
                          ...cliStyles.actionIcon,
                          background: a.priority === "ai" ? "#0f172a" : "#fff",
                          color: a.priority === "ai" ? "#fff" : "#475569",
                          borderColor: a.priority === "ai" ? "#0f172a" : "#eef1f5",
                        }}>{a.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ ...cliStyles.prioPill, background: p.bg, color: p.color }}>{p.label}</span>
                            {a.tag && <span style={{ ...cliStyles.linkRef, color: a.tagColor, borderColor: a.tagColor + "40" }}>{a.tag}</span>}
                            {a.overdue && <span style={cliStyles.overdueChip}>⏰ En retard</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.35 }}>{a.title}</div>
                          {a.meta && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{a.meta}</div>}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: a.overdue ? "#dc2626" : a.priority === "ai" ? "#94a3b8" : "#0f172a",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>⏱ {a.due}</span>
                            {a.assigned && (
                              <>
                                <span style={cliStyles.dot} />
                                <Avatar name={a.assigned} size={18} color={a.assignedColor} />
                                <span style={{ fontSize: 11, color: "#64748b" }}>{a.assigned}</span>
                              </>
                            )}
                            {a.attendees && (
                              <>
                                <span style={cliStyles.dot} />
                                <div style={{ display: "flex" }}>
                                  {a.attendees.slice(0, 4).map((n, j) => (
                                    <span key={n} style={{ marginLeft: j === 0 ? 0 : -6, border: "1.5px solid #fff", borderRadius: 999, display: "inline-block" }}>
                                      <Avatar name={n} size={18} />
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <button style={cliStyles.actionMenu}>⋯</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions menées */}
              <div style={cliStyles.actionsCol}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>
                      <span style={{ color: "#94a3b8" }}>✓</span> Actions menées <span style={cliStyles.blockCount}>47</span>
                    </h2>
                    <p style={cliStyles.h2sub}>Historique complet · 8 dernières affichées</p>
                  </div>
                  <button style={cliStyles.filterPill}>Tout voir</button>
                </div>

                <div style={cliStyles.pastList}>
                  <div style={cliStyles.pastSpine} />
                  {past.map((a, i) => (
                    <div key={i} style={cliStyles.pastItem}>
                      <div style={{ ...cliStyles.pastIcon, color: a.color, borderColor: a.color + "30" }}>{a.icon}</div>
                      <div style={cliStyles.pastContent}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", flex: 1 }}>{a.title}</span>
                          <span style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{a.at}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{a.who}</div>
                        {a.meta && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4, padding: "5px 8px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 5, lineHeight: 1.45 }}>{a.meta}</div>}
                      </div>
                    </div>
                  ))}

                  <button style={cliStyles.loadMore}>↓ Charger plus (39 actions de plus)</button>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACTS + DETAILS row */}
          <section style={cliStyles.block}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

              {/* Contacts */}
              <div style={cliStyles.subBlock}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>Contacts clés <span style={cliStyles.blockCount}>5</span></h2>
                    <p style={cliStyles.h2sub}>Décideurs et interlocuteurs identifiés</p>
                  </div>
                  <button style={cliStyles.filterPill}>+ Ajouter</button>
                </div>
                <div style={cliStyles.contactsGrid}>
                  {[
                    { name: "Émilie Roux", role: "VP Innovation", email: "e.roux@axa-im.fr", phone: "+33 1 40 76 ••", color: "#a855f7", champion: true, last: "il y a 2 h" },
                    { name: "Antoine Mercier", role: "CISO", email: "a.mercier@axa-im.fr", phone: "+33 1 40 76 ••", color: "#dc2626", last: "il y a 8 h" },
                    { name: "Julien Pasquier", role: "CFO", email: "j.pasquier@axa-im.fr", phone: "+33 1 40 76 ••", color: "#0ea5e9", last: "il y a 4 j" },
                    { name: "Marie Lopez", role: "Head of Ops", email: "m.lopez@axa-im.fr", phone: "+33 1 40 76 ••", color: "#f59e0b", last: "il y a 1 sem." },
                    { name: "Sébastien Roy", role: "Procurement", email: "s.roy@axa-im.fr", phone: "+33 1 40 76 ••", color: "#10b981", coldZone: true, last: "il y a 3 sem." },
                  ].map((p) => (
                    <div key={p.name} style={cliStyles.contactCard}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Avatar name={p.name} size={36} color={p.color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                            {p.champion && <span style={cliStyles.championPill}>★ Champion</span>}
                            {p.coldZone && <span style={cliStyles.coldPill}>❄ Froid</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>{p.role}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{p.email}</div>
                          <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{p.phone}</div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 6 }}>Dernier contact · {p.last}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <button style={cliStyles.iconMini}>✉</button>
                          <button style={cliStyles.iconMini}>☎</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails */}
              <div style={cliStyles.subBlock}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>Informations compte</h2>
                  </div>
                  <button style={cliStyles.filterPill}>Éditer</button>
                </div>
                <div style={{ padding: 4 }}>
                  <DetailRow label="Owner" value={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name="Nadia Lefèvre" size={22} color="#a855f7" />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>Nadia Lefèvre</span>
                    </div>
                  } />
                  <DetailRow label="Co-owner" value={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name="Karim Ben Salah" size={22} color="#6366f1" />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>Karim Ben Salah</span>
                    </div>
                  } />
                  <DetailRow label="Secteur" value={<span style={cliStyles.fieldChip}>Asset Management</span>} />
                  <DetailRow label="Source" value={<span style={cliStyles.fieldChip}>Salon Finovate Paris</span>} />
                  <DetailRow label="Concurrent" value={<span style={{ fontSize: 12.5, color: "#475569" }}>Salesforce · Pega</span>} />
                  <DetailRow label="Client depuis" value={<span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", fontWeight: 600 }}>14 mars 2024</span>} />
                  <DetailRow label="Renouvellement" value={<span style={{ fontSize: 12.5, color: "#0e7a55", fontWeight: 600 }}>01 mars 2026 ✓</span>} />
                  <DetailRow label="Contrats actifs" value={<span style={{ fontSize: 12.5, fontWeight: 600 }}>1 (Suite 2024-2026)</span>} />
                  <DetailRow label="Adresse" value={<span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>Tour Majunga<br/>6 place de la Pyramide<br/>92800 Puteaux</span>} />
                </div>
              </div>
            </div>
          </section>

          <div style={{ height: 24 }} />
        </div>
      </main>

      <CallStatsModal
        open={statsOpen}
        client={{ name: "AXA Wealth France" }}
        onClose={() => setStatsOpen(false)}
      />
      <AssetInventoryModal
        open={assetsOpen}
        client={{ name: "AXA Wealth France" }}
        onClose={() => setAssetsOpen(false)}
      />
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", padding: "8px 4px", gap: 10, minHeight: 32, borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ fontSize: 11.5, color: "#64748b", width: 110, flexShrink: 0, paddingTop: 2 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0 }}>{value}</div>
  </div>
);

const cliStyles = {
  frame: { width: 1440, height: 1500, display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a", overflow: "hidden" },

  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14, position: "sticky", top: 0, height: 1500 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 11 },
  miniLogo: { width: 22, height: 22, borderRadius: 5, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 24px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 6 },
  healthChip: { fontSize: 11, padding: "1px 8px", borderRadius: 999, background: "#e8f8f1", color: "#0e7a55", fontWeight: 600, marginLeft: 6 },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },
  ghostBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 14px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },
  primaryBtnSm: { padding: "4px 10px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 6, fontSize: 11.5, cursor: "pointer", fontWeight: 600 },

  scroll: { flex: 1, overflowY: "auto", padding: "0 24px" },

  hero: { padding: "20px 0 16px", borderBottom: "1px solid #eef1f5" },
  coLogoBig: { width: 60, height: 60, borderRadius: 12, background: "linear-gradient(135deg, #1e40af, #1e3a8a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0, boxShadow: "0 4px 12px rgba(30,64,175,0.25)" },
  industryChip: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#eef2ff", color: "#4338ca", fontWeight: 600 },
  metaChip: { fontSize: 11.5, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#eef1f5", fontWeight: 500 },
  dot: { width: 3, height: 3, background: "#cbd5e1", borderRadius: 999 },
  h1: { fontSize: 26, fontWeight: 700, letterSpacing: -0.8, margin: "2px 0 0", color: "#0f172a", lineHeight: 1.15 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 },
  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },

  heroStats: { display: "flex", gap: 18, flexShrink: 0, paddingLeft: 18, borderLeft: "1px solid #eef1f5" },
  heroStat: { minWidth: 95 },
  heroStatK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  heroStatV: { fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 2 },
  miniBar: { width: "100%", height: 3, background: "#eef1f5", borderRadius: 999, marginTop: 6 },

  actionBar: { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #eef1f5", flexWrap: "wrap" },

  block: { padding: "20px 0", borderBottom: "1px solid #eef1f5" },
  subBlock: { border: "1px solid #eef1f5", borderRadius: 10, padding: 16, background: "#fff" },
  blockHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12 },
  h2: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 6 },
  h2sub: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
  blockCount: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: 2 },
  filterPill: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },

  // Pipe
  stagesStrip: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14, padding: 12, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },
  stageCol: { display: "flex", flexDirection: "column", gap: 4 },
  stageColHead: { display: "flex", alignItems: "center", gap: 6 },
  stageCount: { fontSize: 10.5, padding: "0 6px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: "auto" },
  stageColBar: { height: 3, background: "#eef1f5", borderRadius: 999, overflow: "hidden", marginTop: 2 },

  oppGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  oppCard: { position: "relative", padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 },
  oppCardHot: { borderColor: "#fed7aa", boxShadow: "0 0 0 1px #fed7aa" },
  oppCardWon: { background: "linear-gradient(180deg, #fff, #f0fdf6)", borderColor: "#bbf7d0" },
  newRibbon: { position: "absolute", top: -7, right: 12, padding: "1px 7px", background: "#4f46e5", color: "#fff", fontSize: 9.5, fontWeight: 700, borderRadius: 999, letterSpacing: 0.4 },
  oppRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#94a3b8", fontWeight: 500 },
  stagePill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 7px", borderRadius: 999, fontSize: 10.5, fontWeight: 600 },
  hotPill: { fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#fff1d6", color: "#a65f00", fontWeight: 700 },
  wonPill: { fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#e8f8f1", color: "#0e7a55", fontWeight: 700 },
  oppAmount: { fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: -0.4, fontFamily: "'Inter', sans-serif" },
  probaBar: { width: "100%", height: 4, background: "#eef1f5", borderRadius: 999, overflow: "hidden" },
  oppFoot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: "1px solid #f1f5f9" },

  // Actions split
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  actionsCol: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  actionsHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },

  // À mener
  actionsList: { display: "flex", flexDirection: "column", gap: 8 },
  actionItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: "1px solid #eef1f5", borderRadius: 8, background: "#fafbfc", position: "relative" },
  actionItemOverdue: { background: "#fff8f7", borderColor: "#fecaca" },
  actionItemAI: { background: "linear-gradient(180deg, #fafbfc, #f5f3ff)", borderColor: "#e9d5ff", borderStyle: "dashed" },
  checkbox: { marginTop: 4, accentColor: "#4f46e5" },
  actionIcon: { width: 30, height: 30, borderRadius: 7, border: "1.5px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  prioPill: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 },
  linkRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, padding: "1px 5px", borderRadius: 3, border: "1px solid", fontWeight: 600 },
  overdueChip: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: "#dc2626", color: "#fff", fontWeight: 700, letterSpacing: 0.3 },
  actionMenu: { width: 24, height: 24, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, borderRadius: 4 },

  // Menées
  pastList: { display: "flex", flexDirection: "column", gap: 0, position: "relative" },
  pastSpine: { position: "absolute", left: 12, top: 14, bottom: 28, width: 1.5, background: "#eef1f5" },
  pastItem: { display: "flex", gap: 12, padding: "8px 0", position: "relative", zIndex: 1 },
  pastIcon: { width: 26, height: 26, borderRadius: 999, background: "#fff", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, boxShadow: "0 0 0 3px #fff" },
  pastContent: { flex: 1, minWidth: 0, paddingTop: 1 },
  loadMore: { padding: "8px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", marginTop: 10, fontWeight: 500 },

  // Contacts
  contactsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 },
  contactCard: { padding: 12, border: "1px solid #eef1f5", borderRadius: 8, background: "#fafbfc" },
  championPill: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#fffbeb", color: "#a65f00", fontWeight: 700, border: "1px solid #fde68a" },
  coldPill: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#eff6ff", color: "#1e40af", fontWeight: 600 },
  iconMini: { width: 24, height: 24, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 11 },

  fieldChip: { fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "#eef1f5", color: "#475569", fontWeight: 500 },
};

window.ClientPage = ClientPage;
