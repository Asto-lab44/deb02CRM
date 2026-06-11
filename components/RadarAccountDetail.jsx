// Détail compte radar — drill-down Mutuelle des Hauts-de-Seine

const RadarAccountDetail = () => {
  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { N: "#a855f7", K: "#6366f1", M: "#dc2626", J: "#0ea5e9", E: "#14b8a6", T: "#f59e0b" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  return (
    <div style={radStyles.frame}>
      {/* Header */}
      <div style={radStyles.head}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
          <span>Intelligence</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span>Fins de contrats concurrents</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Mutuelle des Hauts-de-Seine</span>
          <span style={radStyles.refMono}>REN-2026-001</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/fins-contrats-concurrents" style={{ ...radStyles.ghostBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>← Retour radar</a>
          <a href="/nouvelle-opportunite" style={{ ...radStyles.primaryBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>→ Convertir en opportunité</a>
        </div>
      </div>

      <div style={radStyles.body}>
        {/* LEFT — main */}
        <div style={radStyles.main}>

          {/* Hero */}
          <section style={radStyles.hero}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div style={radStyles.coLogo}>MH</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ ...radStyles.tierBadge, background: "#fef3c7", color: "#a16207", border: "1px solid #fde68a" }}>Tier A</span>
                  <span style={radStyles.metaChip}>Santé · Mutuelle</span>
                  <span style={radStyles.metaChip}>850 emp.</span>
                  <span style={radStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>📍 Nanterre</span>
                  <span style={radStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>CA 2024 : 184 M€</span>
                </div>
                <h1 style={radStyles.h1}>Mutuelle des Hauts-de-Seine</h1>
                <p style={radStyles.subtitle}>Mutuelle santé régionale créée en 1958 · 124 000 adhérents · DSI dirigée par Élise Vasseur depuis 2024</p>
              </div>

              <div style={radStyles.scoreCircle}>
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="36" fill="none" stroke="#eef1f5" strokeWidth="8" />
                  <circle cx="42" cy="42" r="36" fill="none" stroke="#10b981" strokeWidth="8"
                    strokeDasharray={`${(92/100) * 226} 226`} strokeLinecap="round" transform="rotate(-90 42 42)" />
                </svg>
                <div style={radStyles.scoreInner}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.6 }}>92</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: 0.4 }}>SCORE</div>
                </div>
              </div>
            </div>

            {/* contract banner */}
            <div style={radStyles.contractBanner}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <div style={radStyles.compLogo}>SF</div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Contrat en cours</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>Salesforce Sales Cloud Enterprise</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>3 ans · signé 12 juin 2023 · 142 k€/an</div>
                </div>
              </div>
              <div style={radStyles.banDivider} />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Échéance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>12 juin 2026</div>
                <div style={{ fontSize: 11.5, color: "#dc2626", fontWeight: 600, marginTop: 1 }}>⏱ Dans 17 jours</div>
              </div>
              <div style={radStyles.banDivider} />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Statut notice</div>
                <div style={{ ...radStyles.noticePill, background: "#fdecec", color: "#dc2626", marginTop: 4 }}>✓ Échue 13 mars</div>
                <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginTop: 4 }}>🟢 Phase concurrentielle ouverte</div>
              </div>
            </div>

            {/* Action bar */}
            <div style={radStyles.actionBar}>
              <a href="/nouvelle-opportunite" style={{ ...radStyles.primaryBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>+ Créer opportunité</a>
              <a href="mailto:elise.vasseur@example.com" style={{ ...radStyles.ghostBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>✉ Envoyer un email</a>
              <a href="tel:+33000000000" style={{ ...radStyles.ghostBtn, textDecoration: "none", cursor: "pointer", display: "inline-block" }}>📞 Appeler</a>
              <button style={radStyles.ghostBtn}>📎 Joindre signal</button>
              <span style={{ flex: 1 }} />
              <button style={radStyles.dangerGhost}>Marquer non-pertinent</button>
            </div>
          </section>

          {/* Signals timeline */}
          <section style={radStyles.block}>
            <div style={radStyles.blockHead}>
              <div>
                <h2 style={radStyles.h2}>Signaux d'achat détectés <span style={radStyles.count}>7</span></h2>
                <p style={radStyles.h2sub}>Chronologie des indicateurs collectés sur ce compte</p>
              </div>
              <button style={radStyles.filterPill}>+ Ajouter manuellement</button>
            </div>

            <div style={radStyles.signalsTL}>
              <div style={radStyles.signalsSpine} />
              {[
                { type: "hot", date: "il y a 6 j · 20 mai", source: "Site appels d'offres", title: "RFP CRM/CDP publié", desc: "Cahier des charges : modernisation outil commercial, conformité DORA, hébergement UE obligatoire, time-to-value < 4 mois. Date de remise : 18 juillet.", auto: true },
                { type: "hot", date: "il y a 8 j · 18 mai", source: "Activité Hub Astorya", title: "VP Tech Élise Vasseur ouvre 4 white papers", desc: "Téléchargement de : « DORA pour mutuelles », « Migrer de Salesforce », « ROI CRM 18 mois », « Hub Astorya vs SF FinServ ». Visite x3 site Astorya.", auto: true },
                { type: "hot", date: "il y a 10 j · 16 mai", source: "LinkedIn Sales Nav.", title: "Élise Vasseur (VP Tech) ajoute Nadia Lefèvre", desc: "Connexion acceptée immédiatement. Bio mise à jour : « Modernisation SI mutualiste – chantier 2026 ».", auto: true },
                { type: "neutral", date: "il y a 14 j · 12 mai", source: "Presse spécialisée", title: "L'Argus de l'Assurance — interview DG", desc: "« Notre CRM actuel ne répond plus aux exigences DORA. Une refonte est sur la table pour Q3 2026. »", auto: true },
                { type: "neutral", date: "il y a 21 j · 05 mai", source: "Crawl publique", title: "Recrutement Chef de projet CRM (CDI)", desc: "Annonce sur LinkedIn + APEC. Profil cherché : expérience implémentation CRM nouvelle génération, conformité DORA.", auto: true },
                { type: "hot", date: "il y a 28 j · 28 avril", source: "Renseignement commercial", title: "Insatisfaction interne Salesforce", desc: "Source informelle (consultant ex-MutuHDS) : « Plus personne en interne ne défend Salesforce. Le module FSC ne couvre pas les spécificités mutualistes. » Tom Verdier · note de RDV salon.", auto: false },
                { type: "neutral", date: "il y a 42 j · 14 avril", source: "Bilan financier", title: "Budget IT 2026 voté +18 %", desc: "Conseil d'administration AGA — augmentation budget SI 2026 actée. Ligne « modernisation outils commerciaux » : 280 k€.", auto: true },
              ].map((s, i) => (
                <div key={i} style={radStyles.signal}>
                  <div style={{
                    ...radStyles.signalDot,
                    background: s.type === "hot" ? "#dc2626" : "#cbd5e1",
                    color: "#fff",
                  }}>{s.type === "hot" ? "▲" : "·"}</div>
                  <div style={radStyles.signalBody}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ ...radStyles.signalPill, background: s.type === "hot" ? "#fdecec" : "#f1f3f6", color: s.type === "hot" ? "#dc2626" : "#475569" }}>
                        {s.type === "hot" ? "🔥 Signal chaud" : "Signal neutre"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.source}</span>
                      {s.auto && <span style={radStyles.autoTag}>Auto</span>}
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{s.date}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strategy / battle plan */}
          <section style={radStyles.block}>
            <div style={radStyles.blockHead}>
              <div>
                <h2 style={radStyles.h2}>Plan d'action concurrentiel <span style={radStyles.count}>5 étapes</span></h2>
                <p style={radStyles.h2sub}>Roadmap personnalisée pour gagner ce compte avant le 12 juin</p>
              </div>
            </div>

            <div style={radStyles.steps}>
              {[
                { done: true, who: "Nadia Lefèvre", when: "21 mai", title: "Connexion LinkedIn Élise Vasseur", desc: "Acceptée. Envoyer message ressources DORA." },
                { done: true, who: "Nadia Lefèvre", when: "24 mai", title: "Brief équipe + génération battle card", desc: "Battle card SF mise à jour, équipe pré-vente alertée." },
                { active: true, who: "Nadia Lefèvre", when: "28 mai", title: "Premier RDV — Pitch DORA + différenciants", desc: "14h00 visio · 30 min. Préparer : démo Cyber, calcul TCO comparatif, témoignage Crédit Mutuel Océan." },
                { who: "Romain Daviaud", when: "06 juin", title: "Réponse RFP", desc: "Date butoir : 18 juillet (avant échéance contrat SF — possible négociation reconduction)." },
                { who: "Augustin Morin", when: "12 juin", title: "Date pivot — fin contrat SF", desc: "Disponibilité immédiate Astorya garantie en SLA." },
              ].map((s, i) => (
                <div key={i} style={{ ...radStyles.step, ...(s.active ? radStyles.stepActive : {}), ...(s.done ? radStyles.stepDone : {}) }}>
                  <div style={{
                    ...radStyles.stepNum,
                    background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
                    color: s.done || s.active ? "#fff" : "#94a3b8",
                    border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
                  }}>{s.done ? "✓" : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.title}</span>
                      {s.active && <span style={radStyles.nowTag}>▶ En cours</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 4 }}>{s.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
                      <Avatar name={s.who} size={16} />
                      <span style={{ fontWeight: 500 }}>{s.who}</span>
                      <span style={{ color: "#cbd5e1" }}>·</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>{s.when}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — side */}
        <aside style={radStyles.side}>
          {/* Owner */}
          <section style={radStyles.sideBlock}>
            <div style={radStyles.sideHead}>Owner & équipe</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <Avatar name="Nadia Lefèvre" size={36} color="#a855f7" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Nadia Lefèvre</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>AE Senior · EMEA</div>
              </div>
              <button style={radStyles.iconMini}>✉</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
              <Avatar name="Romain Daviaud" size={28} color="#6366f1" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Romain Daviaud</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Avant-vente Cyber</div>
              </div>
            </div>
            <button style={radStyles.addPill}>+ Ajouter</button>
          </section>

          {/* Contacts cibles */}
          <section style={radStyles.sideBlock}>
            <div style={radStyles.sideHead}>Contacts cibles <span style={radStyles.miniCount}>3</span></div>
            {[
              { name: "Élise Vasseur", role: "VP Technologie & SI", color: "#0ea5e9", champion: true, last: "Connectée LinkedIn il y a 8 j" },
              { name: "Marc Olivier", role: "Directeur Commercial", color: "#f59e0b", last: "Aucun contact" },
              { name: "Julie Bréant", role: "CFO", color: "#10b981", last: "Aucun contact" },
            ].map((p) => (
              <div key={p.name} style={radStyles.sideContact}>
                <Avatar name={p.name} size={28} color={p.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                    {p.champion && <span style={radStyles.championPill}>★</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{p.role}</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{p.last}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Match score breakdown */}
          <section style={radStyles.sideBlock}>
            <div style={radStyles.sideHead}>Décomposition du score</div>
            {[
              { k: "Timing échéance", v: 30, max: 30 },
              { k: "Signaux d'achat", v: 24, max: 25 },
              { k: "Fit secteur", v: 20, max: 20 },
              { k: "Concurrent ciblé", v: 13, max: 15 },
              { k: "Engagement existant", v: 5, max: 10 },
            ].map((b) => (
              <div key={b.k} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                  <span style={{ color: "#475569" }}>{b.k}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a" }}>{b.v}/{b.max}</span>
                </div>
                <div style={{ height: 4, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${(b.v / b.max) * 100}%`, height: "100%", background: "#10b981", borderRadius: 999 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#10b981", letterSpacing: -0.5 }}>92/100</span>
            </div>
          </section>

          {/* Produits recommandés */}
          <section style={radStyles.sideBlock}>
            <div style={radStyles.sideHead}>Match produit Astorya</div>
            <div style={radStyles.match}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Astorya Suite</div>
              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Best fit pour mutuelle santé · couvre 100 % du RFP</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Estimation</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>~110 k€/an</span>
              </div>
            </div>
            <div style={{ ...radStyles.match, opacity: 0.7, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>+ Astorya Cyber</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Optionnel — module conformité DORA</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const radStyles = {
  frame: { width: 1440, display: "flex", flexDirection: "column", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },

  head: { padding: "16px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 6 },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 14px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },
  dangerGhost: { padding: "6px 12px", border: "1px solid #fecaca", background: "#fff", borderRadius: 8, fontSize: 12, color: "#dc2626", cursor: "pointer", fontWeight: 500 },

  body: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, padding: 14 },
  main: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  side: { display: "flex", flexDirection: "column", gap: 14 },

  hero: { padding: 20, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  coLogo: { width: 60, height: 60, borderRadius: 12, background: "linear-gradient(135deg, #b91c1c, #dc2626)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0, boxShadow: "0 4px 12px rgba(220,38,38,0.25)" },
  tierBadge: { fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 },
  metaChip: { fontSize: 11.5, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#eef1f5", fontWeight: 500 },
  dot: { width: 3, height: 3, background: "#cbd5e1", borderRadius: 999 },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: "2px 0 0", color: "#0f172a", lineHeight: 1.15 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 },

  scoreCircle: { position: "relative", flexShrink: 0 },
  scoreInner: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },

  contractBanner: { marginTop: 18, padding: 16, background: "linear-gradient(135deg, #fff5f5, #ffffff)", border: "1px solid #fecaca", borderRadius: 10, display: "flex", alignItems: "center", gap: 18 },
  compLogo: { width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #00A1E0, #0066b0)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
  banDivider: { width: 1, height: 50, background: "#fecaca" },
  noticePill: { display: "inline-block", fontSize: 10.5, padding: "2px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.2 },

  actionBar: { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #eef1f5", flexWrap: "wrap" },

  block: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  blockHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 },
  h2: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 6 },
  h2sub: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
  count: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },
  filterPill: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },

  signalsTL: { position: "relative", paddingLeft: 8 },
  signalsSpine: { position: "absolute", left: 19, top: 8, bottom: 8, width: 1.5, background: "#eef1f5" },
  signal: { display: "flex", gap: 14, paddingBottom: 14, position: "relative" },
  signalDot: { width: 24, height: 24, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, boxShadow: "0 0 0 4px #fff", zIndex: 1 },
  signalBody: { flex: 1, minWidth: 0, padding: "10px 14px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  signalPill: { fontSize: 10.5, padding: "1px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.3 },
  autoTag: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#0f172a", color: "#fff", fontWeight: 700, letterSpacing: 0.3 },

  steps: { display: "flex", flexDirection: "column", gap: 8 },
  step: { display: "flex", gap: 14, padding: 14, border: "1px solid #eef1f5", borderRadius: 10, background: "#fff" },
  stepActive: { borderColor: "#c7d2fe", background: "linear-gradient(180deg, #fafbff, #fff)", boxShadow: "0 0 0 3px rgba(79,70,229,0.06)" },
  stepDone: { opacity: 0.75 },
  stepNum: { width: 28, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 },
  nowTag: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: "#4f46e5", color: "#fff", fontWeight: 700, letterSpacing: 0.4 },

  sideBlock: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  sideHead: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, display: "flex", justifyContent: "space-between" },
  miniCount: { fontSize: 10, padding: "0 6px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace" },
  sideContact: { display: "flex", gap: 9, padding: "7px 0", borderBottom: "1px solid #f1f5f9", alignItems: "center" },
  championPill: { fontSize: 9, padding: "0 4px", borderRadius: 3, background: "#fffbeb", color: "#a65f00", fontWeight: 700, border: "1px solid #fde68a" },
  iconMini: { width: 26, height: 26, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 12 },
  addPill: { padding: "4px 10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer", marginTop: 8 },
  match: { padding: 10, border: "1px solid #c7d2fe", background: "#eef2ff", borderRadius: 8 },
};

window.RadarAccountDetail = RadarAccountDetail;
