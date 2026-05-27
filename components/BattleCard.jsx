// Battle card concurrent — Salesforce

const BattleCard = () => {
  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", N: "#a855f7", S: "#10b981", T: "#f59e0b", E: "#0ea5e9" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  return (
    <div style={bcStyles.frame}>
      {/* Top: identity hero */}
      <div style={bcStyles.hero}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div style={bcStyles.logo}>SF</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={bcStyles.badge}>Concurrent #1</span>
              <span style={bcStyles.badgeSecondary}>Threat level: élevé</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>Mise à jour il y a 4 j par Claire Renaud</span>
            </div>
            <h1 style={bcStyles.h1}>Salesforce</h1>
            <p style={bcStyles.subtitle}>Sales Cloud, Service Cloud, Financial Services Cloud — leader US implanté en France depuis 2008</p>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span style={bcStyles.tag}># SaaS</span>
              <span style={bcStyles.tag}># Plateforme</span>
              <span style={bcStyles.tag}># US-based</span>
              <span style={bcStyles.tag}># CRM legacy</span>
            </div>
          </div>

          <div style={bcStyles.statRow}>
            <div style={bcStyles.stat}>
              <div style={bcStyles.statK}>Rencontres 12 mois</div>
              <div style={bcStyles.statV}>34</div>
            </div>
            <div style={bcStyles.stat}>
              <div style={bcStyles.statK}>Win rate Astorya</div>
              <div style={{ ...bcStyles.statV, color: "#10b981" }}>48%</div>
              <div style={{ fontSize: 10.5, color: "#10b981", marginTop: 2 }}>↑ +6 pts vs Q1</div>
            </div>
            <div style={bcStyles.stat}>
              <div style={bcStyles.statK}>Deals en cours</div>
              <div style={{ ...bcStyles.statV, color: "#4f46e5" }}>7</div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>412 k€ pipe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: forces / faiblesses */}
      <div style={bcStyles.grid2}>
        <div style={{ ...bcStyles.panel, borderColor: "#fecaca" }}>
          <div style={bcStyles.panelHead}>
            <span style={{ ...bcStyles.panelIcon, background: "#fdecec", color: "#dc2626" }}>⚠</span>
            <div>
              <h3 style={bcStyles.h3}>Là où ils gagnent</h3>
              <p style={bcStyles.h3sub}>Forces reconnues du concurrent — à ne pas attaquer frontalement</p>
            </div>
          </div>
          <ul style={bcStyles.bulletList}>
            <li style={bcStyles.bullet}><strong>Notoriété & rassurance grands comptes.</strong> Choix par défaut côté DSI, peu de risque carrière.</li>
            <li style={bcStyles.bullet}><strong>Écosystème AppExchange.</strong> +7 000 apps tierces intégrées.</li>
            <li style={bcStyles.bullet}><strong>Recrutement.</strong> Marché abondant en consultants Salesforce certifiés.</li>
            <li style={bcStyles.bullet}><strong>Industrie cloud financière.</strong> Financial Services Cloud bien établi sur banque retail.</li>
          </ul>
        </div>

        <div style={{ ...bcStyles.panel, borderColor: "#bbf7d0" }}>
          <div style={bcStyles.panelHead}>
            <span style={{ ...bcStyles.panelIcon, background: "#e8f8f1", color: "#0e7a55" }}>✓</span>
            <div>
              <h3 style={bcStyles.h3}>Là où nous gagnons</h3>
              <p style={bcStyles.h3sub}>Nos vrais différenciants face à Salesforce</p>
            </div>
          </div>
          <ul style={bcStyles.bulletList}>
            <li style={bcStyles.bullet}><strong>Souveraineté & hébergement UE.</strong> Datacenter France, conformité DORA native (vs FedRAMP US).</li>
            <li style={bcStyles.bullet}><strong>Time-to-value 3 mois</strong> vs 9-12 mois Salesforce (implémentation native vs custom).</li>
            <li style={bcStyles.bullet}><strong>TCO 40 % inférieur</strong> sur 3 ans — pas de licences add-on cachées (CPQ, Marketing Cloud, etc.).</li>
            <li style={bcStyles.bullet}><strong>Spécialisation assurance & gestion d'actifs</strong> — modèle métier prêt à l'emploi.</li>
            <li style={bcStyles.bullet}><strong>Support FR niveau 1 inclus</strong> vs offshore payant chez SF.</li>
          </ul>
        </div>
      </div>

      {/* Objections + reframe */}
      <div style={bcStyles.panel}>
        <div style={bcStyles.panelHead}>
          <span style={{ ...bcStyles.panelIcon, background: "#eef2ff", color: "#4f46e5" }}>⚔</span>
          <div>
            <h3 style={bcStyles.h3}>Objections fréquentes & reformulations</h3>
            <p style={bcStyles.h3sub}>Réponses validées équipe à utiliser en RDV</p>
          </div>
          <button style={bcStyles.smBtn}>+ Ajouter</button>
        </div>
        <div style={bcStyles.objList}>
          {[
            { q: "« On a déjà Salesforce, pourquoi changer ? »", a: "Nous remplaçons rarement Salesforce — nous remplaçons les modules verticaux mal-adaptés (Financial Services Cloud). Côté CRM transactionnel, intégration native via API. La plupart de nos clients gardent SF en commercial et basculent sur Astorya pour la gestion métier.", tone: "neutral" },
            { q: "« Le marché entier est sur Salesforce »", a: "Sur l'asset management européen, 38 % seulement sont sur SF — le reste est sur des suites métier ou du custom. Notre cible n'est pas la moyenne du marché mais les acteurs qui veulent un outil dédié et conforme DORA.", tone: "positive" },
            { q: "« Et l'écosystème AppExchange ? »", a: "AppExchange est un atout pour les besoins génériques mais devient un piège métier (apps non maintenues, dépendances). Astorya intègre nativement les 12 systèmes-clés assurance (PER, contrats, sinistres, KYC). À comparer avec une simulation : 4 apps SF à 18-32 k€/an chacune.", tone: "positive" },
            { q: "« Salesforce est moins cher en première année »", a: "Comparer le TCO sur 3 ans avec Marketing Cloud, CPQ, Pardot, Data Cloud : la facture explose. Notre offre est tout-inclus.", tone: "neutral" },
          ].map((o, i) => (
            <div key={i} style={bcStyles.obj}>
              <div style={bcStyles.objQ}>
                <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>SF →</span>
                <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, fontStyle: "italic" }}>{o.q}</span>
              </div>
              <div style={bcStyles.objA}>
                <span style={{ color: "#4f46e5", fontWeight: 700, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>HUB ←</span>
                <span style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>{o.a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: pricing + win/loss + plays */}
      <div style={bcStyles.grid3}>
        {/* Pricing comparison */}
        <div style={bcStyles.panel}>
          <h3 style={bcStyles.h3sm}>Pricing comparé (250 utilisateurs · 3 ans)</h3>
          <div style={bcStyles.priceTable}>
            <div style={bcStyles.priceRow}>
              <span style={bcStyles.priceK}>Licences année 1</span>
              <span style={{ ...bcStyles.priceVal, color: "#dc2626" }}>SF : 268 k€</span>
              <span style={{ ...bcStyles.priceVal, color: "#10b981" }}>HUB : 168 k€</span>
            </div>
            <div style={bcStyles.priceRow}>
              <span style={bcStyles.priceK}>Add-ons (CPQ, marketing)</span>
              <span style={{ ...bcStyles.priceVal, color: "#dc2626" }}>+ 142 k€</span>
              <span style={{ ...bcStyles.priceVal, color: "#10b981" }}>0 €</span>
            </div>
            <div style={bcStyles.priceRow}>
              <span style={bcStyles.priceK}>Implémentation</span>
              <span style={{ ...bcStyles.priceVal, color: "#dc2626" }}>180 k€</span>
              <span style={{ ...bcStyles.priceVal, color: "#10b981" }}>62 k€</span>
            </div>
            <div style={bcStyles.priceRow}>
              <span style={bcStyles.priceK}>Support premium</span>
              <span style={{ ...bcStyles.priceVal, color: "#dc2626" }}>22 k€/an</span>
              <span style={{ ...bcStyles.priceVal, color: "#10b981" }}>inclus</span>
            </div>
            <div style={{ ...bcStyles.priceRow, ...bcStyles.priceRowTotal }}>
              <span style={{ ...bcStyles.priceK, fontWeight: 700, color: "#0f172a" }}>TCO 3 ans</span>
              <span style={{ ...bcStyles.priceVal, color: "#dc2626", fontWeight: 700 }}>1,15 M€</span>
              <span style={{ ...bcStyles.priceVal, color: "#0e7a55", fontWeight: 700 }}>688 k€</span>
            </div>
          </div>
          <div style={bcStyles.priceBadge}>Économie HUB : <strong>– 40 %</strong></div>
        </div>

        {/* Win/Loss */}
        <div style={bcStyles.panel}>
          <h3 style={bcStyles.h3sm}>Win / Loss 12 derniers mois</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", letterSpacing: -0.6 }}>11</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Wins</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626", letterSpacing: -0.6 }}>12</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Losses</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>48%</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>win rate</div>
            </div>
          </div>
          <div style={{ height: 6, display: "flex", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ flex: 11, background: "#10b981" }} />
            <div style={{ flex: 12, background: "#fecaca" }} />
          </div>

          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Raisons des wins</div>
          <BarRow label="Conformité DORA / UE" value={64} max={100} color="#10b981" />
          <BarRow label="TCO inférieur" value={52} max={100} color="#10b981" />
          <BarRow label="Time-to-value" value={38} max={100} color="#10b981" />
          <BarRow label="Spé. métier" value={31} max={100} color="#10b981" />

          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, marginBottom: 6 }}>Raisons des losses</div>
          <BarRow label="Préférence statu-quo" value={48} max={100} color="#dc2626" />
          <BarRow label="Pas de référence assez gros" value={28} max={100} color="#dc2626" />
          <BarRow label="Influence cabinet conseil" value={22} max={100} color="#dc2626" />
        </div>

        {/* Plays */}
        <div style={bcStyles.panel}>
          <h3 style={bcStyles.h3sm}>Plays de displacement</h3>
          {[
            { title: "Cheval de Troie module", desc: "Proposer Astorya Cyber en complément de SF — créer du proof, puis étendre.", time: "6-12 mois", color: "#4f46e5" },
            { title: "Pivot DORA 2026", desc: "Capitaliser sur l'échéance réglementaire — SF n'a pas de roadmap claire UE.", time: "0-3 mois", color: "#dc2626", urgent: true },
            { title: "Pricing audit guidé", desc: "Audit gratuit de la facture SF actuelle, déplafonner les coûts cachés.", time: "2-4 sem.", color: "#10b981" },
            { title: "Référence ex-SF témoin", desc: "Crédit Mutuel Océan, BNP AM, Crédit Agricole Sud ont migré. Activer leur référence.", time: "Continu", color: "#0ea5e9" },
          ].map((p, i) => (
            <div key={p.title} style={{ ...bcStyles.play, ...(p.urgent ? bcStyles.playUrgent : {}) }}>
              <div style={{ width: 6, alignSelf: "stretch", background: p.color, borderRadius: 999, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{p.title}</span>
                  {p.urgent && <span style={bcStyles.urgentBadge}>⚡ Priorité</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ fontSize: 10.5, color: p.color, marginTop: 4, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>⏱ {p.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* References strip */}
      <div style={bcStyles.panel}>
        <div style={bcStyles.panelHead}>
          <span style={{ ...bcStyles.panelIcon, background: "#fffbeb", color: "#a65f00" }}>★</span>
          <div>
            <h3 style={bcStyles.h3}>Clients qui ont migré de Salesforce vers Astorya</h3>
            <p style={bcStyles.h3sub}>À activer en référence dans les RDV concurrentiels</p>
          </div>
          <button style={bcStyles.smBtn}>Voir tous</button>
        </div>
        <div style={bcStyles.refGrid}>
          {[
            { co: "Crédit Mutuel Océan", logo: "CM", bg: "#0f766e", size: "640 emp.", year: "Mars 2026", saved: "– 38 %", contact: "Émilie Roux" },
            { co: "BNP Asset Management", logo: "BP", bg: "#0f766e", size: "1 200 emp.", year: "Janv. 2026", saved: "– 42 %", contact: "Jean-Marc Petit" },
            { co: "Crédit Agricole Sud", logo: "CA", bg: "#10b981", size: "850 emp.", year: "Nov. 2025", saved: "– 35 %", contact: "Sophie Leblanc" },
            { co: "Generali Patrimoine", logo: "GP", bg: "#dc2626", size: "420 emp.", year: "Sept. 2025", saved: "– 31 %", contact: "Marc Olivier" },
          ].map((r) => (
            <div key={r.co} style={bcStyles.refCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                <div style={{ ...bcStyles.refLogo, background: r.bg }}>{r.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{r.co}</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{r.size} · migré {r.year}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>TCO</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{r.saved}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Contact</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>{r.contact}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BarRow = ({ label, value, max, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
    <span style={{ fontSize: 11.5, color: "#475569", flex: 1, minWidth: 0 }}>{label}</span>
    <div style={{ flex: 1, height: 4, background: "#f1f3f6", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, opacity: 0.7, borderRadius: 999 }} />
    </div>
    <span style={{ fontSize: 11, color: "#0f172a", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", width: 28, textAlign: "right" }}>{value}%</span>
  </div>
);

const bcStyles = {
  frame: { width: 1440, padding: 28, display: "flex", flexDirection: "column", gap: 14, background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },

  hero: { padding: 24, background: "#fff", border: "1px solid #eef1f5", borderRadius: 14 },
  logo: { width: 80, height: 80, borderRadius: 14, background: "linear-gradient(135deg, #0066b0, #00A1E0 65%, #2dd4bf)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0, boxShadow: "0 6px 20px rgba(0,161,224,0.3)" },
  badge: { fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "#dc2626", color: "#fff", fontWeight: 700, letterSpacing: 0.4 },
  badgeSecondary: { fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "#fef0e6", color: "#a65f00", fontWeight: 700, letterSpacing: 0.4 },
  h1: { fontSize: 30, fontWeight: 700, letterSpacing: -0.9, margin: "2px 0 0", color: "#0f172a", lineHeight: 1.1 },
  subtitle: { fontSize: 13.5, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 },
  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },

  statRow: { display: "flex", gap: 18, paddingLeft: 18, borderLeft: "1px solid #eef1f5", flexShrink: 0 },
  stat: { minWidth: 100 },
  statK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  statV: { fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 2 },

  panel: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  panelHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  panelIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
  h3: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 },
  h3sm: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 14px", letterSpacing: -0.2 },
  h3sub: { fontSize: 11.5, color: "#64748b", margin: "3px 0 0" },
  smBtn: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500, marginLeft: "auto" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },

  bulletList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  bullet: { fontSize: 12.5, color: "#475569", lineHeight: 1.55, paddingLeft: 18, position: "relative" },

  objList: { display: "flex", flexDirection: "column", gap: 10 },
  obj: { padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  objQ: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 },
  objA: { display: "flex", gap: 8, alignItems: "flex-start", paddingTop: 8, borderTop: "1px solid #eef1f5" },

  // Pricing
  priceTable: { border: "1px solid #eef1f5", borderRadius: 8, overflow: "hidden" },
  priceRow: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "8px 12px", borderBottom: "1px solid #f1f5f9", alignItems: "center", gap: 8 },
  priceRowTotal: { background: "#fafbfc", borderTop: "2px solid #eef1f5", borderBottom: "none" },
  priceK: { fontSize: 11.5, color: "#475569" },
  priceVal: { fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, textAlign: "right" },
  priceBadge: { display: "inline-block", marginTop: 12, padding: "4px 10px", background: "#e8f8f1", color: "#0e7a55", borderRadius: 6, fontSize: 12, fontWeight: 600 },

  // Plays
  play: { display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  playUrgent: { background: "linear-gradient(90deg, #fff5f5, transparent 40%)", padding: 10, borderRadius: 6, borderBottom: "none" },
  urgentBadge: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#dc2626", color: "#fff", fontWeight: 700, letterSpacing: 0.3 },

  // References
  refGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  refCard: { padding: 12, background: "linear-gradient(180deg, #fffdf5, #fff)", border: "1px solid #fde68a", borderRadius: 10 },
  refLogo: { width: 32, height: 32, borderRadius: 7, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
};

// Add bullet marker via pseudo not possible inline; use marker color via span instead
const inject = `
.bc-bullet::before { content: "●"; color: #4f46e5; position: absolute; left: 0; top: 0; font-size: 10px; }
`;
if (typeof document !== "undefined" && !document.getElementById("bc-styles")) {
  const s = document.createElement("style"); s.id = "bc-styles"; s.textContent = inject; document.head.appendChild(s);
}

window.BattleCard = BattleCard;
