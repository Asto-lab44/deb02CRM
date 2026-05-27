// Écran 2 — Détail ticket + conversation (vue utilisateur final)

const TICKET_ID = "INC-2837";

const TicketDetail = () => {
  // Retranscriptions d'appel 3CX rattachées à ce ticket (alimentées par la
  // popup hotline). Affichées dans le fil de conversation, sous le dernier
  // message bot.
  const subscribe = React.useCallback((fn) => (window.HubAccess && window.HubAccess.subscribe) ? window.HubAccess.subscribe(fn) : () => {}, []);
  const callNotes = React.useSyncExternalStore(
    subscribe,
    () => (window.HubAccess && window.HubAccess.getTranscriptsForTicket) ? window.HubAccess.getTranscriptsForTicket(TICKET_ID) : []
  );

  const fmtDur = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const fmtWhen = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  };

  const Avatar = ({ name, size = 28, color, role }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", B: "#a855f7" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2,
        }}>{initials}</div>
        {role === "bot" && (
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: 999, background: "#0f172a", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>★</span>
        )}
      </div>
    );
  };

  const events = [
    { type: "system", at: "il y a 2 j · 09:14", text: "Ticket créé par Camille Dufour depuis le portail self-service.", icon: "+" },
    {
      type: "msg", from: "Camille Dufour", role: "user", at: "il y a 2 j · 09:14", color: "#6366f1",
      body: "Bonjour, depuis ce matin mon VPN se déconnecte toutes les 10 minutes environ. Cela m'oblige à me reconnecter en plein milieu de mes appels Teams. J'ai redémarré le poste, sans amélioration.",
      meta: "Envoyé depuis le portail · DESKTOP-CD24 · Windows 11 23H2",
      attachments: [{ name: "vpn-log-extract.txt", size: "12 Ko" }],
    },
    { type: "system", at: "il y a 2 j · 09:18", text: "Auto-classification : Réseau · VPN · priorité Haute (impact individuel, urgence haute).", icon: "◇" },
    { type: "system", at: "il y a 2 j · 09:18", text: "Assigné automatiquement à Tom Verdier (Support N2 — Réseau).", icon: "◉", actor: "Tom Verdier" },
    {
      type: "msg", from: "Tom Verdier", role: "agent", at: "il y a 2 j · 10:02", color: "#f59e0b",
      body: "Bonjour Camille, merci pour le log. Je vois plusieurs renégociations IKEv2 toutes les 8–10 min. Pouvez-vous tester en filaire (port Ethernet du dock) sur la même journée et me dire si le problème persiste ? En parallèle je regarde côté concentrateur Astorya-VPN-02.",
      reactions: [{ emoji: "👍", count: 1 }],
    },
    {
      type: "msg", from: "Camille Dufour", role: "user", at: "il y a 1 j · 11:47", color: "#6366f1",
      body: "Testé en filaire toute la matinée — aucune coupure. Donc effectivement c'est bien le Wi-Fi qui pose problème.",
    },
    { type: "status", at: "il y a 1 j · 14:20", text: "Statut passé de Ouvert à En cours.", actor: "Tom Verdier", from: "Ouvert", to: "En cours" },
    {
      type: "msg", from: "Tom Verdier", role: "agent", at: "il y a 1 j · 14:22", color: "#f59e0b",
      body: "J'ai identifié un correctif : mise à jour du driver Intel AX211 vers la 23.50.1. Je pousse l'update via Intune ce soir 19h00, redémarrage automatique. Pourriez-vous laisser le poste allumé et branché ce soir ?",
      attachments: [{ name: "intune-deployment-AX211.png", size: "184 Ko" }],
    },
    { type: "system", at: "hier · 19:03", text: "Déploiement Intune appliqué — driver Wi-Fi v23.50.1 installé.", icon: "✓", actor: "Système" },
    {
      type: "msg", from: "Hub Assistant", role: "bot", at: "il y a 35 min", color: "#0f172a",
      body: "Bonjour Camille, j'ai détecté que le correctif a été appliqué hier soir. Le ticket est-il résolu de votre côté ? Vous pouvez répondre par oui / non, ou marquer comme résolu directement.",
      isBot: true,
    },
  ];

  return (
    <div style={tdStyles.frame}>
      {/* ───── SIDEBAR (compact) ───── */}
      <aside style={tdStyles.sidebar}>
        <div style={tdStyles.brandRow}>
          <div style={tdStyles.logo}><div style={tdStyles.logoMark}>H</div></div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
        </div>
        <button style={tdStyles.newBtn}>+ Nouveau ticket <span style={tdStyles.kbd}>N</span></button>
        <div style={tdStyles.navSection}>
          <div style={tdStyles.navLabel}>Mes vues</div>
          <div style={tdStyles.navItem}><span style={tdStyles.bullet}>▦</span><span style={{ flex: 1 }}>Tous mes tickets</span><span style={tdStyles.navCount}>9</span></div>
          <div style={tdStyles.navItem}><span style={tdStyles.bullet}>◉</span><span style={{ flex: 1 }}>Assignés à moi</span><span style={tdStyles.navCount}>4</span></div>
        </div>
        <div style={tdStyles.navSection}>
          <div style={tdStyles.navLabel}>Statuts</div>
          <div style={tdStyles.navItem}><span style={{ width: 7, height: 7, borderRadius: 999, background: "#3b82f6" }} /><span style={{ flex: 1, marginLeft: 6 }}>Ouverts</span><span style={tdStyles.navCount}>2</span></div>
          <div style={{ ...tdStyles.navItem, ...tdStyles.navItemActive }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "#a855f7" }} /><span style={{ flex: 1, marginLeft: 6 }}>En cours</span><span style={tdStyles.navCount}>3</span></div>
          <div style={tdStyles.navItem}><span style={{ width: 7, height: 7, borderRadius: 999, background: "#f59e0b" }} /><span style={{ flex: 1, marginLeft: 6 }}>En attente</span><span style={tdStyles.navCount}>1</span></div>
          <div style={tdStyles.navItem}><span style={{ width: 7, height: 7, borderRadius: 999, background: "#10b981" }} /><span style={{ flex: 1, marginLeft: 6 }}>Résolus</span><span style={tdStyles.navCount}>2</span></div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={tdStyles.userRow}>
          <Avatar name="Camille Dufour" size={26} color="#6366f1" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Camille Dufour</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Direction Marketing</div>
          </div>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={tdStyles.main}>
        {/* Topbar / breadcrumbs */}
        <header style={tdStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
            <span>Support IT</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span>Mes tickets</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>INC-2837</span>
            <button style={tdStyles.copyBtn} title="Copier la référence">⧉</button>

            {/* Indicateur contrat de maintenance parc IT du client */}
            <span title="AXA Wealth France — Contrat actif Premium 24/7 (jusqu'au 28 fév. 2027)"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 999, background: "#dcfce7", border: "1px solid #86efac", marginLeft: 8, cursor: "help" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#10b981", boxShadow: "0 0 0 2px #f0fdf4" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: 0.4 }}>Contrat parc actif</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={tdStyles.iconBtn}>‹</button>
            <button style={tdStyles.iconBtn}>›</button>
            <button style={tdStyles.ghostBtn}>Suivre</button>
            <button style={tdStyles.iconBtn}>⋯</button>
          </div>
        </header>

        {/* Body : conversation + side panel */}
        <div style={tdStyles.body}>
          {/* conversation column */}
          <section style={tdStyles.convCol}>
            {/* Title block */}
            <div style={tdStyles.titleBlock}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ ...tdStyles.statusPill, background: "#f5efff", color: "#7e22ce" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "#a855f7" }} /> En cours
                </span>
                <span style={{ ...tdStyles.prioPill, background: "#fef0e6", color: "#ea580c" }}>▲ Haute</span>
                <span style={tdStyles.metaChip}>Réseau · VPN</span>
                <span style={tdStyles.dot} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Ouvert il y a 1 j 22 h</span>
              </div>
              <h1 style={tdStyles.h1}>VPN se déconnecte toutes les 10 minutes</h1>
              <p style={tdStyles.subtitle}>
                Ticket <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#475569" }}>INC-2837</span> · Demandeur Camille Dufour · 11 messages
              </p>

              {/* SLA strip */}
              <div style={tdStyles.slaStrip}>
                <div style={tdStyles.slaBlock}>
                  <div style={tdStyles.slaLabel}>Première réponse</div>
                  <div style={tdStyles.slaValueOk}>✓ Respectée — 48 min</div>
                </div>
                <div style={tdStyles.slaSep} />
                <div style={tdStyles.slaBlock}>
                  <div style={tdStyles.slaLabel}>Résolution cible</div>
                  <div style={tdStyles.slaValueDanger}>⏱ 22 min restantes</div>
                  <div style={tdStyles.slaBar}><div style={{ width: "92%", height: "100%", background: "#dc2626", borderRadius: 999 }} /></div>
                </div>
                <div style={tdStyles.slaSep} />
                <div style={tdStyles.slaBlock}>
                  <div style={tdStyles.slaLabel}>Articles suggérés</div>
                  <div style={tdStyles.kbLink}>📘 VPN — diagnostic Wi-Fi</div>
                </div>
              </div>
            </div>

            {/* Conversation thread */}
            <div style={tdStyles.thread}>
              {events.map((e, i) => {
                if (e.type === "system" || e.type === "status") {
                  return (
                    <div key={i} style={tdStyles.sysRow}>
                      <div style={tdStyles.sysLine} />
                      <div style={tdStyles.sysPill}>
                        <span style={{ color: "#94a3b8", marginRight: 6 }}>{e.icon || "↻"}</span>
                        {e.type === "status" ? (
                          <>
                            <strong style={{ color: "#0f172a", fontWeight: 600 }}>{e.actor}</strong> a changé le statut
                            <span style={{ ...tdStyles.miniPill, background: "#eef4ff", color: "#1d4ed8", marginLeft: 6 }}>{e.from}</span>
                            <span style={{ color: "#cbd5e1", margin: "0 4px" }}>→</span>
                            <span style={{ ...tdStyles.miniPill, background: "#f5efff", color: "#7e22ce" }}>{e.to}</span>
                          </>
                        ) : (
                          <span>{e.text}</span>
                        )}
                        <span style={tdStyles.sysTime}>{e.at}</span>
                      </div>
                      <div style={tdStyles.sysLine} />
                    </div>
                  );
                }
                const isUser = e.role === "user";
                const isBot = e.role === "bot";
                return (
                  <div key={i} style={{ ...tdStyles.msgRow, ...(isUser ? tdStyles.msgRowMine : {}) }}>
                    {!isUser && <Avatar name={e.from} size={32} color={e.color} role={isBot ? "bot" : null} />}
                    <div style={{ ...tdStyles.bubbleWrap, alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{e.from}</span>
                        {e.role === "agent" && <span style={tdStyles.roleTag}>Technicien · N2</span>}
                        {isBot && <span style={{ ...tdStyles.roleTag, background: "#0f172a", color: "#fff", borderColor: "#0f172a" }}>Assistant IA</span>}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{e.at}</span>
                      </div>
                      <div style={{
                        ...tdStyles.bubble,
                        ...(isUser ? tdStyles.bubbleUser : {}),
                        ...(isBot ? tdStyles.bubbleBot : {}),
                      }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: isUser ? "#fff" : "#0f172a" }}>{e.body}</div>
                        {e.attachments && (
                          <div style={tdStyles.attachRow}>
                            {e.attachments.map((a) => (
                              <div key={a.name} style={tdStyles.attach}>
                                <span style={{ color: "#94a3b8" }}>📎</span>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{a.name}</div>
                                  <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{a.size}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {isBot && (
                          <div style={tdStyles.botActions}>
                            <button style={tdStyles.botBtnPrimary}>✓ Oui, c'est résolu</button>
                            <button style={tdStyles.botBtn}>Non, problème persistant</button>
                          </div>
                        )}
                        {e.meta && <div style={tdStyles.bubbleMeta}>{e.meta}</div>}
                      </div>
                      {e.reactions && (
                        <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                          {e.reactions.map((r) => (
                            <span key={r.emoji} style={tdStyles.reaction}>{r.emoji} {r.count}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isUser && <Avatar name={e.from} size={32} color={e.color} />}
                  </div>
                );
              })}

              {/* Retranscriptions d'appel 3CX */}
              {callNotes.map((n, i) => (
                <div key={"call-" + i} style={callStyles.row}>
                  <div style={callStyles.iconCol}>
                    <div style={callStyles.phoneIcon}>📞</div>
                  </div>
                  <div style={callStyles.card}>
                    <div style={callStyles.cardHead}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={callStyles.badge3cx}>3CX · Speech-to-text</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Appel entrant de {n.from}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{fmtWhen(n.at)}</span>
                    </div>

                    <div style={callStyles.meta}>
                      <span>{n.phone}</span>
                      <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>
                      <span>Durée {fmtDur(n.durationSec || 0)}</span>
                      <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>
                      <span>Enregistrement archivé sur PBX 3CX</span>
                    </div>

                    <div style={callStyles.audioBar}>
                      <button style={callStyles.playBtn}>▶</button>
                      <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 999 }}>
                        <div style={{ width: "0%", height: "100%", background: "#10b981", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>00:00 / {fmtDur(n.durationSec || 0)}</span>
                      <button style={callStyles.dlBtn} title="Télécharger l'enregistrement">⬇</button>
                    </div>

                    <div style={callStyles.transcriptLabel}>Retranscription</div>
                    <div style={callStyles.transcriptBox}>{n.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div style={tdStyles.composer}>
              <div style={tdStyles.composerTabs}>
                <button style={{ ...tdStyles.composerTab, ...tdStyles.composerTabActive }}>Réponse</button>
                <button style={tdStyles.composerTab}>Note interne</button>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Markdown supporté · ⌘↵ pour envoyer</span>
              </div>
              <textarea
                style={tdStyles.composerArea}
                placeholder="Écrire une réponse à Tom Verdier…"
                defaultValue="Oui, depuis hier soir le VPN tient toute la journée — plus aucune coupure. Merci beaucoup Tom !"
              />
              <div style={tdStyles.composerFoot}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={tdStyles.composerIcon}>📎</button>
                  <button style={tdStyles.composerIcon}>🖼</button>
                  <button style={tdStyles.composerIcon}>@</button>
                  <button style={tdStyles.composerIcon}>𝐁</button>
                  <button style={tdStyles.composerIcon}>{"</>"}</button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button style={tdStyles.ghostBtn}>Marquer comme résolu</button>
                  <button style={tdStyles.primaryBtn}>Envoyer ↵</button>
                </div>
              </div>
            </div>
          </section>

          {/* Side panel */}
          <aside style={tdStyles.side}>
            <SidePanel Avatar={Avatar} />
          </aside>
        </div>
      </main>
    </div>
  );
};

const SidePanel = ({ Avatar }) => (
  <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

    {/* Properties */}
    <section>
      <div style={tdStyles.sideHead}>Propriétés</div>
      <Field label="Statut" value={
        <span style={{ ...tdStyles.statusPill, background: "#f5efff", color: "#7e22ce" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#a855f7" }} /> En cours
        </span>
      } />
      <Field label="Priorité" value={<span style={{ ...tdStyles.prioPill, background: "#fef0e6", color: "#ea580c" }}>▲ Haute</span>} />
      <Field label="Urgence" value={<span style={tdStyles.fieldChip}>Haute</span>} />
      <Field label="Impact" value={<span style={tdStyles.fieldChip}>Individuel</span>} />
      <Field label="Catégorie" value={<span style={tdStyles.fieldChip}>Réseau · VPN</span>} />
      <Field label="Source" value={<span style={{ fontSize: 12.5, color: "#475569" }}>Portail self-service</span>} />
    </section>

    {/* People */}
    <section>
      <div style={tdStyles.sideHead}>Personnes</div>
      <Field label="Demandeur" value={
        <div style={tdStyles.person}>
          <Avatar name="Camille Dufour" size={22} color="#6366f1" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Camille Dufour</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Marketing · Paris</div>
          </div>
        </div>
      } />
      <Field label="Assigné" value={
        <div style={tdStyles.person}>
          <Avatar name="Tom Verdier" size={22} color="#f59e0b" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Tom Verdier</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Support N2 · Réseau</div>
          </div>
        </div>
      } />
      <Field label="Observateurs" value={
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Avatar name="Sophie Aubry" size={22} color="#10b981" />
          <Avatar name="Léa Marchand" size={22} color="#0ea5e9" />
          <button style={tdStyles.addPill}>+ Ajouter</button>
        </div>
      } />
    </section>

    {/* Equipment */}
    <section>
      <div style={tdStyles.sideHead}>Équipement concerné</div>
      <div style={tdStyles.cmdb}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={tdStyles.cmdbIcon}>💻</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>DESKTOP-CD24</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>Dell Latitude 7440 · S/N 7HX29Z3</div>
          </div>
        </div>
        <div style={tdStyles.cmdbGrid}>
          <div><div style={tdStyles.cmdbK}>OS</div><div style={tdStyles.cmdbV}>Windows 11 23H2</div></div>
          <div><div style={tdStyles.cmdbK}>Wi-Fi</div><div style={tdStyles.cmdbV}>Intel AX211 · 23.50.1</div></div>
          <div><div style={tdStyles.cmdbK}>VPN</div><div style={tdStyles.cmdbV}>Astorya-VPN-02</div></div>
          <div><div style={tdStyles.cmdbK}>Site</div><div style={tdStyles.cmdbV}>Paris HQ — 4ᵉ ét.</div></div>
        </div>
      </div>
    </section>

    {/* Linked */}
    <section>
      <div style={tdStyles.sideHead}>Liens</div>
      <div style={tdStyles.linkRow}>
        <span style={tdStyles.linkRef}>INC-2812</span>
        <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>VPN — déconnexions Wi-Fi (résolu)</span>
        <span style={{ ...tdStyles.statusDot, background: "#10b981" }} />
      </div>
      <div style={tdStyles.linkRow}>
        <span style={tdStyles.linkRef}>KB-0148</span>
        <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>Driver Intel AX211 — procédure</span>
        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>📘</span>
      </div>
    </section>

    {/* Activity summary */}
    <section>
      <div style={tdStyles.sideHead}>Métriques</div>
      <div style={tdStyles.metricGrid}>
        <div><div style={tdStyles.metricK}>Temps écoulé</div><div style={tdStyles.metricV}>1 j 22 h</div></div>
        <div><div style={tdStyles.metricK}>Réponses</div><div style={tdStyles.metricV}>11</div></div>
        <div><div style={tdStyles.metricK}>Réouvertures</div><div style={tdStyles.metricV}>0</div></div>
        <div><div style={tdStyles.metricK}>Pièces jointes</div><div style={tdStyles.metricV}>3</div></div>
      </div>
    </section>
  </div>
);

const Field = ({ label, value }) => (
  <div style={tdStyles.field}>
    <div style={tdStyles.fieldLabel}>{label}</div>
    <div style={tdStyles.fieldValue}>{value}</div>
  </div>
);

const tdStyles = {
  frame: { width: 1440, height: 900, display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a", overflow: "hidden" },

  // sidebar (compact)
  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14 },
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
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  // main
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 20px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  copyBtn: { width: 22, height: 22, border: "1px solid #e2e8f0", background: "#fafbfc", borderRadius: 5, fontSize: 11, color: "#94a3b8", cursor: "pointer" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },
  ghostBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 14px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  body: { flex: 1, display: "flex", overflow: "hidden" },
  convCol: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid #eef1f5", overflow: "hidden" },

  // Title block
  titleBlock: { padding: "20px 28px 18px", borderBottom: "1px solid #eef1f5", background: "#fff" },
  statusPill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 500 },
  prioPill: { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 600 },
  metaChip: { fontSize: 11.5, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#eef1f5", fontWeight: 500 },
  dot: { width: 3, height: 3, background: "#cbd5e1", borderRadius: 999 },
  h1: { fontSize: 24, fontWeight: 600, letterSpacing: -0.7, margin: 0, color: "#0f172a", lineHeight: 1.25 },
  subtitle: { fontSize: 12.5, color: "#64748b", margin: "6px 0 0" },

  slaStrip: { display: "flex", alignItems: "stretch", gap: 18, marginTop: 14, padding: "12px 16px", background: "linear-gradient(180deg, #fafbfc, #f5f7fa)", border: "1px solid #eef1f5", borderRadius: 10 },
  slaBlock: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  slaLabel: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  slaValueOk: { fontSize: 13, fontWeight: 600, color: "#0e7a55" },
  slaValueDanger: { fontSize: 13, fontWeight: 600, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" },
  slaBar: { width: "100%", height: 3, background: "#fde2e2", borderRadius: 999, marginTop: 2 },
  slaSep: { width: 1, background: "#eef1f5" },
  kbLink: { fontSize: 12.5, color: "#4f46e5", fontWeight: 500, cursor: "pointer" },

  // Thread
  thread: { flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16, background: "#fafbfc" },

  // System rows
  sysRow: { display: "flex", alignItems: "center", gap: 10, margin: "2px 0" },
  sysLine: { flex: 1, height: 1, background: "#eef1f5" },
  sysPill: { fontSize: 11.5, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 999, whiteSpace: "nowrap" },
  sysTime: { color: "#94a3b8", marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 },
  miniPill: { padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 600 },

  // Messages
  msgRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  msgRowMine: { flexDirection: "row" },
  bubbleWrap: { display: "flex", flexDirection: "column", maxWidth: "78%", flex: 1 },
  bubble: { padding: "10px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, borderTopLeftRadius: 4 },
  bubbleUser: { background: "#4f46e5", border: "1px solid #4338ca", borderRadius: 12, borderTopRightRadius: 4, color: "#fff" },
  bubbleBot: { background: "#0f172a", borderColor: "#0f172a", color: "#fff" },
  bubbleMeta: { fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" },
  roleTag: { fontSize: 10, padding: "1px 6px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  attachRow: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" },
  attach: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 },
  reaction: { fontSize: 11, padding: "2px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999, color: "#475569" },

  botActions: { display: "flex", gap: 8, marginTop: 12 },
  botBtnPrimary: { padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  botBtn: { padding: "6px 12px", background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 12, cursor: "pointer" },

  // Composer
  composer: { background: "#fff", borderTop: "1px solid #eef1f5", padding: "10px 18px 14px" },
  composerTabs: { display: "flex", alignItems: "center", gap: 4, marginBottom: 8 },
  composerTab: { padding: "4px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  composerTabActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  composerArea: { width: "100%", minHeight: 80, padding: 12, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", color: "#0f172a", resize: "none", outline: "none", lineHeight: 1.5, boxSizing: "border-box" },
  composerFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  composerIcon: { width: 28, height: 28, border: "1px solid transparent", background: "transparent", borderRadius: 6, color: "#64748b", cursor: "pointer", fontSize: 13 },

  // Side panel
  side: { width: 320, background: "#fff", overflowY: "auto", flexShrink: 0 },
  sideHead: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 },
  field: { display: "flex", alignItems: "center", padding: "6px 0", gap: 10, minHeight: 30 },
  fieldLabel: { fontSize: 12, color: "#64748b", width: 96, flexShrink: 0 },
  fieldValue: { flex: 1, minWidth: 0 },
  fieldChip: { fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "#eef1f5", color: "#475569", fontWeight: 500 },
  person: { display: "flex", alignItems: "center", gap: 8 },
  addPill: { padding: "3px 9px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer" },

  cmdb: { padding: 12, border: "1px solid #eef1f5", borderRadius: 10, background: "#fafbfc", display: "flex", flexDirection: "column", gap: 12 },
  cmdbIcon: { width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  cmdbGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" },
  cmdbK: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  cmdbV: { fontSize: 12, color: "#0f172a", fontWeight: 500, marginTop: 1 },

  linkRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid transparent", borderRadius: 6, cursor: "pointer" },
  linkRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4f46e5", fontWeight: 600 },
  statusDot: { width: 7, height: 7, borderRadius: 999, flexShrink: 0 },

  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  metricK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  metricV: { fontSize: 16, fontWeight: 600, color: "#0f172a", marginTop: 2, letterSpacing: -0.3 },
};

const callStyles = {
  row: { display: "flex", gap: 12, alignItems: "flex-start", margin: "14px 0" },
  iconCol: { width: 32, display: "flex", justifyContent: "center", flexShrink: 0 },
  phoneIcon: { width: 32, height: 32, borderRadius: 999, background: "#dcfce7", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "2px solid #fff", boxShadow: "0 0 0 1px #bbf7d0" },
  card: { flex: 1, background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  badge3cx: { fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "#10b981", color: "#fff" },
  meta: { fontSize: 11.5, color: "#64748b" },
  audioBar: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 },
  playBtn: { width: 28, height: 28, borderRadius: 999, background: "#10b981", color: "#fff", border: 0, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", paddingLeft: 2 },
  dlBtn: { width: 26, height: 26, borderRadius: 6, background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" },
  transcriptLabel: { fontSize: 10.5, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  transcriptBox: { fontSize: 12.5, lineHeight: 1.6, color: "#334155", padding: "10px 12px", background: "#f0fdf4", border: "1px dashed #bbf7d0", borderRadius: 8, fontStyle: "italic" },
};

window.TicketDetail = TicketDetail;
