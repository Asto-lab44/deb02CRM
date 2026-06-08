// Popup CTI Hotline — déclenché par un appel entrant (3CX via webhook en prod,
// bouton "Simuler appel" en démo). Match du numéro entrant à la base clients,
// affiche les tickets ouverts ou bascule sur le formulaire nouveau ticket.

const HotlinePopup = ({ call, onClose, onCreateTicket }) => {
  // ───── État interne : "ringing" → l'agent décroche → on affiche la fiche.
  const [phase, setPhase] = React.useState("ringing"); // ringing | answered | transcript | newTicket
  const [elapsed, setElapsed] = React.useState(0);
  const [form, setForm] = React.useState({ subject: "", category: "Support technique", prio: "normale", desc: "" });
  const [transcriptText, setTranscriptText] = React.useState("");
  const [targetTicketId, setTargetTicketId] = React.useState(null);
  const [transcribing, setTranscribing] = React.useState(false);

  React.useEffect(() => {
    setPhase("ringing");
    setElapsed(0);
    setTranscriptText("");
    setTargetTicketId(call && call.openTickets && call.openTickets[0] ? call.openTickets[0].id : null);
    setForm({ subject: "", category: "Support technique", prio: "normale", desc: "" });
  }, [call && call.id]);

  React.useEffect(() => {
    if (phase !== "answered") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  React.useEffect(() => {
    if (!call) return;
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, onClose]);

  if (!call) return null;
  // Le DesignCanvas applique un transform sur l'ancêtre, ce qui casse les
  // position:fixed. On rend la popup directement sur document.body.
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const answer = () => {
    if (call.openTickets && call.openTickets.length > 0) {
      setPhase("answered");
    } else {
      // Pas de ticket → on saute direct au formulaire en pré-remplissant la
      // description avec la retranscription si elle existe.
      setForm((f) => ({ ...f, desc: call.transcript || "" }));
      setPhase("newTicket");
    }
  };
  const fmtElapsed = () => `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const fmtDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Simule le temps de traitement speech-to-text 3CX (~1.2 s)
  const endAndTranscribe = () => {
    setTranscribing(true);
    setTimeout(() => {
      setTranscribing(false);
      setTranscriptText(call.transcript || "(aucune retranscription disponible)");
      setPhase("transcript");
    }, 1200);
  };

  const attachTranscript = () => {
    if (!targetTicketId || !transcriptText.trim()) return;
    if (window.HubAccess && window.HubAccess.addTranscript) {
      window.HubAccess.addTranscript(targetTicketId, {
        from: call.name,
        phone: call.phone,
        durationSec: call.durationSec || elapsed,
        text: transcriptText.trim(),
        at: new Date().toISOString(),
      });
    }
    onCreateTicket && onCreateTicket({
      ticketId: targetTicketId, attached: true,
      client: call.name, subject: "Retranscription d'appel ajoutée",
    });
    onClose && onClose();
  };

  const submitNewTicket = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.subject.trim()) return;
    const ticketId = "INC-" + Math.floor(2900 + Math.random() * 99);
    // Le ticket fraîchement créé reçoit aussi la retranscription
    if (window.HubAccess && window.HubAccess.addTranscript && form.desc.trim()) {
      window.HubAccess.addTranscript(ticketId, {
        from: call.name || "Inconnu",
        phone: call.phone,
        durationSec: call.durationSec || 0,
        text: form.desc.trim(),
        at: new Date().toISOString(),
      });
    }
    onCreateTicket && onCreateTicket({ ...form, client: call.name, company: call.company, phone: call.phone, ticketId });
    onClose && onClose();
  };

  const initials = (call.name || "?").split(" ").slice(0, 2).map((s) => s[0]).join("");
  const isUnknown = !!call.unknown;

  const tree = (
    <div style={H.backdrop} onClick={onClose}>
      <div style={{ ...H.modal, ...(phase === "ringing" ? H.modalRinging : {}) }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER — animation sonnerie ou indicateur "en ligne" */}
        <div style={H.head}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={phase === "ringing" ? H.ringIcon : H.liveIcon}>
              {phase === "ringing" ? "📞" : "🟢"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
                <span>
                  {phase === "ringing" ? "Appel entrant · 3CX"
                    : phase === "newTicket" ? "Nouveau ticket"
                    : phase === "transcript" ? "Retranscription · 3CX AI"
                    : "En ligne · " + fmtElapsed()}
                </span>
                {phase === "answered" && (
                  <span style={H.recPill}>
                    <span style={H.recDot} /> REC
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 1 }}>
                {call.phone} <span style={{ color: "#64748b", fontWeight: 500 }}>· Ligne {call.line || "Hotline"}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={H.close} aria-label="Fermer">×</button>
        </div>

        {/* CLIENT CARD */}
        <div style={H.clientCard}>
          <div style={{ ...H.clientAvatar, background: isUnknown ? "#94a3b8" : "#3730a3" }}>
            {isUnknown ? "?" : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                {isUnknown ? "Numéro inconnu" : call.name}
              </div>
              {!isUnknown && call.tier && (
                <span style={{ ...H.tierBadge, ...(call.tier === "premium" ? H.tierPremium : H.tierStandard) }}>
                  {call.tier === "premium" ? "★ Premium" : "Standard"}
                </span>
              )}
            </div>
            {!isUnknown && (
              <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                {call.company} <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span> {call.email}
              </div>
            )}
            {!isUnknown && call.lastContact && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Dernier contact : {call.lastContact} · Contrat {call.contract}
              </div>
            )}
            {isUnknown && (
              <div style={{ fontSize: 13, color: "#dc2626", marginTop: 4 }}>
                Aucun client trouvé pour ce numéro. Créer une fiche après l'appel ?
              </div>
            )}
          </div>
          {!isUnknown && (
            <a href={`/fiche-client`} style={H.linkBtn}>Fiche client →</a>
          )}
        </div>

        {/* PHASE RINGING — boutons décrocher/refuser */}
        {phase === "ringing" && (
          <div style={H.ringingFoot}>
            <button onClick={onClose} style={{ ...H.btn, ...H.btnDecline }}>✕ Refuser</button>
            <button onClick={answer} style={{ ...H.btn, ...H.btnAnswer }}>📞 Décrocher</button>
          </div>
        )}

        {/* PHASE ANSWERED — tickets ouverts */}
        {phase === "answered" && (
          <div style={H.body}>
            <div style={H.sectionHead}>
              <div>
                <div style={H.sectionTitle}>{call.openTickets.length} ticket{call.openTickets.length > 1 ? "s" : ""} ouvert{call.openTickets.length > 1 ? "s" : ""}</div>
                <div style={H.sectionSub}>Dossiers en cours pour ce client</div>
              </div>
              <button onClick={() => setPhase("newTicket")} style={{ ...H.btn, ...H.btnGhost, padding: "6px 12px", fontSize: 12 }}>
                + Nouveau ticket
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {call.openTickets.map((t) => (
                <a key={t.id} href={`/ticketing#${t.id}`} style={H.ticketRow}>
                  <div style={{ ...H.prioPill, background: prioTone[t.prio]?.bg, color: prioTone[t.prio]?.fg }}>
                    {prioTone[t.prio]?.label || t.prio}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", fontWeight: 600 }}>{t.id}</span>
                      {t.sla && <span style={{ fontSize: 10.5, fontWeight: 700, color: t.sla === "danger" ? "#dc2626" : t.sla === "warn" ? "#a65f00" : "#10b981" }}>SLA {t.slaLeft}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Ouvert {t.opened} · {t.assignee || "Non assigné"}</div>
                  </div>
                  <span style={{ color: "#cbd5e1" }}>›</span>
                </a>
              ))}
            </div>
            <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 11.5, color: "#7f1d1d", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={H.recDot} />
              <span><strong>Enregistrement 3CX en cours</strong> · transcription speech-to-text automatique à la fin de l'appel</span>
            </div>
            <div style={H.ringingFoot}>
              <button onClick={() => setPhase("newTicket")} style={{ ...H.btn, ...H.btnGhost }}>+ Créer un ticket</button>
              <button onClick={endAndTranscribe} disabled={transcribing} style={{ ...H.btn, ...H.btnAnswer, background: transcribing ? "#94a3b8" : "#dc2626" }}>
                {transcribing ? "⏳ Transcription…" : "⏻ Terminer & retranscrire"}
              </button>
            </div>
          </div>
        )}

        {/* PHASE TRANSCRIPT — retranscription speech-to-text à rattacher au ticket */}
        {phase === "transcript" && (
          <div style={H.body}>
            <div style={H.sectionHead}>
              <div>
                <div style={H.sectionTitle}>Retranscription automatique</div>
                <div style={H.sectionSub}>Durée appel · {fmtDuration(call.durationSec || 0)} · enregistrement archivé sur le PBX 3CX</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "#0f172a", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                ▶ Écouter
              </div>
            </div>

            <div style={H.audioBar}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>00:00</span>
              <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 999, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #10b981 0%, #10b981 100%)", borderRadius: 999, opacity: 0.4 }} />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{fmtDuration(call.durationSec || 0)}</span>
            </div>

            <label style={H.field}>
              <span style={H.fieldLabel}>Texte de la transcription <span style={{ color: "#94a3b8", fontWeight: 500 }}>(modifiable avant rattachement)</span></span>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={8}
                style={{ ...H.input, fontFamily: "inherit", lineHeight: 1.5, fontSize: 12.5, resize: "vertical" }}
              />
            </label>

            <label style={H.field}>
              <span style={H.fieldLabel}>Ajouter à la description du ticket</span>
              <select
                value={targetTicketId || ""}
                onChange={(e) => setTargetTicketId(e.target.value)}
                style={H.input}
              >
                {call.openTickets.map((t) => (
                  <option key={t.id} value={t.id}>{t.id} — {t.title}</option>
                ))}
              </select>
            </label>

            <div style={H.ringingFoot}>
              <button onClick={onClose} style={{ ...H.btn, ...H.btnGhost }}>Ne pas rattacher</button>
              <button onClick={attachTranscript} disabled={!targetTicketId || !transcriptText.trim()} style={{ ...H.btn, ...H.btnAnswer, background: "#10b981" }}>
                ✓ Ajouter au ticket {targetTicketId || ""}
              </button>
            </div>
          </div>
        )}

        {/* PHASE NEW TICKET — formulaire pré-rempli */}
        {phase === "newTicket" && (
          <form onSubmit={submitNewTicket} style={H.body}>
            <div style={H.sectionHead}>
              <div>
                <div style={H.sectionTitle}>
                  {call.openTickets && call.openTickets.length === 0 ? "Aucun ticket ouvert — créer un incident" : "Nouveau ticket"}
                </div>
                <div style={H.sectionSub}>Pré-rempli depuis l'appel en cours</div>
              </div>
            </div>

            <div style={H.formRow}>
              <label style={H.field}>
                <span style={H.fieldLabel}>Client</span>
                <input value={isUnknown ? "" : call.name} placeholder={isUnknown ? "Renseigner le nom du client" : ""} style={{ ...H.input, background: isUnknown ? "#fff" : "#f8fafc", color: isUnknown ? "#0f172a" : "#475569" }} readOnly={!isUnknown} />
              </label>
              <label style={H.field}>
                <span style={H.fieldLabel}>Téléphone</span>
                <input value={call.phone} readOnly style={{ ...H.input, background: "#f8fafc", color: "#475569" }} />
              </label>
            </div>

            <label style={H.field}>
              <span style={H.fieldLabel}>Sujet <span style={{ color: "#dc2626" }}>*</span></span>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex. Lenteur connexion VPN depuis ce matin" required style={H.input} autoFocus />
            </label>

            <div style={H.formRow}>
              <label style={H.field}>
                <span style={H.fieldLabel}>Catégorie</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={H.input}>
                  <option>Support technique</option>
                  <option>Réseau · VPN</option>
                  <option>Accès & Droits</option>
                  <option>Messagerie</option>
                  <option>Matériel</option>
                  <option>Logiciel · Installation</option>
                  <option>Autre</option>
                </select>
              </label>
              <label style={H.field}>
                <span style={H.fieldLabel}>Priorité</span>
                <select value={form.prio} onChange={(e) => setForm({ ...form, prio: e.target.value })} style={H.input}>
                  <option value="critique">Critique</option>
                  <option value="haute">Haute</option>
                  <option value="normale">Normale</option>
                  <option value="basse">Basse</option>
                </select>
              </label>
            </div>

            <label style={H.field}>
              <span style={H.fieldLabel}>Description</span>
              <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={3} placeholder="Notes prises pendant l'appel…" style={{ ...H.input, fontFamily: "inherit", resize: "vertical" }} />
            </label>

            <div style={H.ringingFoot}>
              <button type="button" onClick={onClose} style={{ ...H.btn, ...H.btnGhost }}>Annuler</button>
              <button type="submit" style={{ ...H.btn, ...H.btnAnswer, background: "#10b981" }}>✓ Créer le ticket</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

// ───── Données de démo : 4 callers (différents scénarios)
// transcript = ce que produirait l'AI speech-to-text 3CX en bout de chaîne.
// duration = durée typique de la conversation (utilisée pour l'horodatage).
const HOTLINE_DEMO_CALLERS = [
  {
    id: "c1", phone: "+33 1 42 86 74 21", line: "Hotline support",
    name: "Sophie Dubois", company: "MAIF Innovation", email: "s.dubois@maif.fr",
    tier: "premium", contract: "Premium 24/7", lastContact: "il y a 3 j (Romain D.)",
    openTickets: [
      { id: "INC-2841", title: "Impossible d'accéder à SharePoint Direction", prio: "critique", sla: "warn", slaLeft: "47 min", opened: "il y a 28 min", assignee: "Non assigné" },
      { id: "INC-2829", title: "VPN se déconnecte toutes les 10 min", prio: "haute", sla: "danger", slaLeft: "22 min", opened: "il y a 1 j", assignee: "Tom Verdier" },
    ],
    durationSec: 247,
    transcript: "Bonjour, c'est Sophie Dubois de MAIF Innovation. Je rappelle au sujet du ticket SharePoint, c'est devenu vraiment urgent — toute l'équipe Direction est bloquée pour la présentation de demain matin. L'erreur 403 apparaît sur Chrome et sur Edge, on a vidé le cache, rien n'y fait. L'agent a vérifié les permissions Azure AD et a vu que le groupe Direction a été retiré du site par erreur lors du nettoyage SSO ce week-end. Re-application des droits en cours, propagation sous 15 minutes. Sophie reste en attente d'un mail de confirmation. Sur le ticket VPN INC-2829, Tom a confirmé que le déploiement Intune du driver est planifié ce soir 19h.",
  },
  {
    id: "c2", phone: "+33 4 78 92 33 12", line: "Hotline support",
    name: "Marc Lefebvre", company: "Crédit Agricole Sud", email: "m.lefebvre@ca-sud.fr",
    tier: "standard", contract: "Standard 9-18h", lastContact: "il y a 2 sem.",
    openTickets: [],
    durationSec: 182,
    transcript: "Bonjour, Marc Lefebvre, Crédit Agricole Sud. J'appelle parce que depuis le redémarrage de mon poste ce matin, mon Outlook ne se synchronise plus avec l'Exchange. Profil reconstruit, ça ne change rien. L'agent a fait un Outlook /safe puis vérifié les credentials manager — le mot de passe SSO a expiré pendant la fenêtre de maintenance du week-end. Nouveau MDP envoyé sur le mobile, déblocage immédiat. À tester côté Marc dans la prochaine heure, rappel prévu si pas résolu.",
  },
  {
    id: "c3", phone: "+33 2 51 47 88 02", line: "Hotline support",
    name: "Camille Dufour", company: "Astorya · Direction Marketing", email: "camille.dufour@astorya.fr",
    tier: "premium", contract: "Premium 24/7", lastContact: "hier (Tom Verdier)",
    openTickets: [
      { id: "INC-2837", title: "VPN se déconnecte toutes les 10 min", prio: "haute", sla: "ok", slaLeft: "5 h 10", opened: "il y a 2 j", assignee: "Tom Verdier" },
    ],
    durationSec: 203,
    transcript: "Bonjour, Camille Dufour à l'appareil — je vous appelle pour le ticket INC-2837. Depuis le déploiement Intune d'hier soir le Wi-Fi tient enfin la connexion sur mon poste, j'ai fait 3 réunions Teams de suite ce matin sans aucune coupure. Tom a confirmé que le driver Intel AX211 v23.50.1 est bien installé. On peut passer le ticket en résolu de son côté. Camille demande si on peut pousser le même correctif sur les 4 autres postes de la Direction Marketing qui ont le même dock Dell — Tom a créé une tâche de déploiement groupé pour la semaine prochaine.",
  },
  {
    id: "c4", phone: "+33 6 12 47 88 91", line: "Hotline support",
    unknown: true,
    openTickets: [],
    durationSec: 64,
    transcript: "Appel d'un numéro inconnu. Personne se présente comme \"Julien, partenaire d'un de vos clients\" sans préciser lequel. Demande des informations sur les contrats de support actifs. Agent rappelle qu'aucune information ne peut être transmise sans identification client préalable. Communication écourtée.",
  },
];

window.HotlinePopup = HotlinePopup;
window.HOTLINE_DEMO_CALLERS = HOTLINE_DEMO_CALLERS;

const prioTone = {
  critique: { bg: "#fdecec", fg: "#dc2626", label: "Critique" },
  haute:    { bg: "#fef0e6", fg: "#ea580c", label: "Haute" },
  normale:  { bg: "#eef1f5", fg: "#475569", label: "Normale" },
  basse:    { bg: "#f1f3f6", fg: "#64748b", label: "Basse" },
};

const H = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalRinging: { boxShadow: "0 25px 60px rgba(16, 185, 129, .45), 0 0 0 4px rgba(16, 185, 129, .15)", animation: "ring-pulse 1.4s ease-in-out infinite" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #f1f5f9", background: "#fafbfd" },
  ringIcon: { width: 40, height: 40, borderRadius: 999, background: "#dcfce7", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: "0 0 0 0 rgba(16, 185, 129, .55)", animation: "ring-icon 1s ease-out infinite" },
  liveIcon: { width: 40, height: 40, borderRadius: 999, background: "#0f172a", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },

  clientCard: { display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: "1px solid #f1f5f9", background: "#fff" },
  clientAvatar: { width: 56, height: 56, borderRadius: 14, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 },
  tierBadge: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4 },
  tierPremium: { background: "#fef3c7", color: "#a16207" },
  tierStandard: { background: "#e2e8f0", color: "#475569" },
  linkBtn: { fontSize: 12, fontWeight: 600, color: "#3730a3", textDecoration: "none", padding: "6px 10px", border: "1px solid #c7d2fe", borderRadius: 7, whiteSpace: "nowrap" },

  body: { padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  ticketRow: { display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", textDecoration: "none", color: "inherit" },
  prioPill: { padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, flexShrink: 0 },

  ringingFoot: { display: "flex", gap: 10, padding: "0 0 4px", marginTop: 4 },
  btn: { flex: 1, padding: "12px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 },
  btnAnswer: { background: "#10b981", color: "#fff" },
  btnDecline: { background: "#f1f5f9", color: "#475569" },
  btnGhost: { background: "#fff", color: "#334155", border: "1px solid #e2e8f0" },

  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 11.5, fontWeight: 600, color: "#475569" },
  input: { padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff" },

  recPill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, background: "#fee2e2", color: "#dc2626", fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" },
  recDot: { width: 7, height: 7, borderRadius: 999, background: "#dc2626", animation: "rec-blink 1.2s ease-in-out infinite", flexShrink: 0 },
  audioBar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 },
};

// CSS animations injectées une seule fois
if (typeof document !== "undefined" && !document.getElementById("hotline-popup-css")) {
  const style = document.createElement("style");
  style.id = "hotline-popup-css";
  style.textContent = `
    @keyframes ring-icon { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.55); } 70% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
    @keyframes ring-pulse { 0%,100% { box-shadow: 0 25px 60px rgba(16,185,129,.35), 0 0 0 4px rgba(16,185,129,.15); } 50% { box-shadow: 0 25px 60px rgba(16,185,129,.5), 0 0 0 6px rgba(16,185,129,.25); } }
    @keyframes rec-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `;
  document.head.appendChild(style);
}
