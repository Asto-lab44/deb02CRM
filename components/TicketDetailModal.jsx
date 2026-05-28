// Modale plein écran pour la fiche détail d'un ticket. Charge les données
// depuis Supabase si dispo, sinon affiche un message clair. Permet l'édition
// inline du statut, de la priorité, de la catégorie et de l'assignation.

const TicketDetailModal = ({ ticketId, onClose }) => {
  const [ticket, setTicket] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [profiles, setProfiles] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [flash, setFlash] = React.useState(null);

  const dataOn = typeof window !== "undefined" && window.HubData && window.HubData.enabled();

  // Charger ticket + profils à l'ouverture
  React.useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    let cancelled = false;
    (async () => {
      if (dataOn) {
        const [{ data: t }, { data: p }] = await Promise.all([
          window.HubData.fetchTicketById(ticketId),
          window.HubData.fetchProfiles(),
        ]);
        if (!cancelled) {
          setTicket(t);
          setProfiles(p || []);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setTicket(null);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [ticketId, dataOn]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ticketId) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const showFlash = (msg, tone = "ok") => {
    setFlash({ msg, tone });
    setTimeout(() => setFlash(null), 2500);
  };

  const patch = async (changes) => {
    if (!dataOn || !ticket) return;
    setSaving(true);
    const { data, error } = await window.HubData.updateTicket(ticket.id, changes);
    setSaving(false);
    if (error) { showFlash("Erreur : " + error.message, "err"); return; }
    setTicket({ ...ticket, ...changes });
    showFlash("✓ Enregistré");
  };

  const escalate = async () => {
    const reason = prompt("Motif de l'escalade :", "Demande arbitrage Supervision");
    if (!reason || !ticket) return;
    setSaving(true);
    const { error } = await window.HubData.escalateTicket(ticket.id, {
      toUserId: null, groupId: "supervision", reason,
    });
    setSaving(false);
    if (error) { showFlash("Erreur : " + error.message, "err"); return; }
    setTicket({ ...ticket, escalated_at: new Date().toISOString(), escalated_group: "supervision", escalated_reason: reason });
    showFlash("✓ Ticket escaladé à Supervision");
  };

  const STATUS = [
    { v: "open",        label: "Ouvert",    color: "#3b82f6", soft: "#eff4ff" },
    { v: "in_progress", label: "En cours",  color: "#a855f7", soft: "#f5efff" },
    { v: "waiting",     label: "En attente",color: "#f59e0b", soft: "#fff6e6" },
    { v: "resolved",    label: "Résolu",    color: "#10b981", soft: "#e8f8f1" },
    { v: "closed",      label: "Fermé",     color: "#94a3b8", soft: "#f1f3f6" },
  ];
  const PRIO = [
    { v: "critique", label: "Critique", color: "#dc2626", soft: "#fdecec" },
    { v: "haute",    label: "Haute",    color: "#ea580c", soft: "#fef0e6" },
    { v: "normale",  label: "Normale",  color: "#475569", soft: "#eef1f5" },
    { v: "basse",    label: "Basse",    color: "#64748b", soft: "#f1f3f6" },
  ];
  const CATEGORIES = [
    "Support technique", "Réseau · VPN", "Accès & Droits", "Messagerie",
    "Matériel · Imprimante", "Matériel · Périphérique", "Logiciel · Installation",
    "Téléphonie", "Gestion comptes RH · Onboarding", "Gestion comptes RH · Offboarding", "Autre",
  ];

  const sMeta = ticket ? (STATUS.find((s) => s.v === ticket.status) || STATUS[0]) : STATUS[0];
  const pMeta = ticket ? (PRIO.find((p) => p.v === ticket.priority) || PRIO[2]) : PRIO[2];

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const tree = (
    <div style={D.backdrop} onClick={onClose}>
      <div style={D.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEAD */}
        <div style={D.head}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onClose} style={D.backBtn} title="Retour à la liste">← Retour</button>
            <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>Ticketing</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", fontWeight: 700 }}>{ticketId}</span>
            {ticket && ticket.client && (
              <>
                <span style={{ color: "#cbd5e1" }}>·</span>
                <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>{ticket.client.name}</span>
              </>
            )}
            {ticket && ticket.client && ticket.client.contracts && ticket.client.contracts[0] && (
              <span title={ticket.client.contracts[0].name}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999,
                      background: ticket.client.contracts[0].status === "active" ? "#dcfce7" : ticket.client.contracts[0].status === "expiring" ? "#fef3c7" : "#fee2e2",
                      color:      ticket.client.contracts[0].status === "active" ? "#065f46" : ticket.client.contracts[0].status === "expiring" ? "#78350f" : "#991b1b",
                      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                Contrat {ticket.client.contracts[0].status}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {flash && <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
              background: flash.tone === "err" ? "#fee2e2" : "#dcfce7",
              color:      flash.tone === "err" ? "#991b1b" : "#065f46" }}>{flash.msg}</span>}
            <button onClick={escalate} disabled={!dataOn || saving} style={D.btnEscalate} title="Remonter à la Supervision">↑ Escalader</button>
            <button onClick={() => patch({ status: "resolved", closed_at: new Date().toISOString() })} disabled={!dataOn || saving} style={D.btnResolve}>✓ Marquer résolu</button>
            <button onClick={onClose} style={D.close}>×</button>
          </div>
        </div>

        {/* BODY */}
        {loading ? (
          <div style={D.empty}>Chargement…</div>
        ) : !ticket && dataOn ? (
          <div style={D.empty}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Ticket {ticketId} introuvable</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Vérifiez que la table tickets a bien été créée (supabase/schema.sql + seeds.sql).</div>
          </div>
        ) : !dataOn ? (
          <div style={D.empty}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Détail indisponible en mode démo</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Configurez Supabase pour activer la fiche détail dynamique.</div>
          </div>
        ) : (
          <div style={D.body}>
            {/* COLONNE GAUCHE — titre, description, métadonnées éditables */}
            <div style={D.colMain}>
              {ticket.escalated_at && (
                <div style={D.escBanner}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={D.escIcon}>↑</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Ticket escaladé au groupe {ticket.escalated_group || "Supervision"}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                        {fmtDate(ticket.escalated_at)} — {ticket.escalated_reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h1 style={D.h1}>{ticket.title}</h1>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Ouvert le {fmtDate(ticket.opened_at)} · Dernière maj {fmtDate(ticket.updated_at)}
                {ticket.closed_at && <> · Clôturé le {fmtDate(ticket.closed_at)}</>}
              </div>

              {ticket.description && (
                <div style={D.descBox}>
                  <div style={D.sectionLabel}>Description</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap" }}>{ticket.description}</div>
                </div>
              )}

              {/* Placeholder pour la conversation future */}
              <div style={D.threadPlaceholder}>
                <div style={D.sectionLabel}>Conversation</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Aucun message pour ce ticket. (Le fil de conversation arrivera dans une prochaine version.)
                </div>
              </div>
            </div>

            {/* COLONNE DROITE — panneau propriétés éditables */}
            <aside style={D.colSide}>
              <div style={D.sectionLabel}>Propriétés</div>

              <PropRow label="Statut">
                <select value={ticket.status || "open"} onChange={(e) => patch({ status: e.target.value })} disabled={saving}
                        style={{ ...D.select, borderColor: sMeta.color + "55", background: sMeta.soft, color: sMeta.color, fontWeight: 700 }}>
                  {STATUS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </PropRow>

              <PropRow label="Priorité">
                <select value={ticket.priority || "normale"} onChange={(e) => patch({ priority: e.target.value })} disabled={saving}
                        style={{ ...D.select, borderColor: pMeta.color + "55", background: pMeta.soft, color: pMeta.color, fontWeight: 700 }}>
                  {PRIO.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </PropRow>

              <PropRow label="Catégorie">
                <select value={ticket.category || ""} onChange={(e) => patch({ category: e.target.value })} disabled={saving} style={D.select}>
                  <option value="">— Aucune —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </PropRow>

              <PropRow label="Assigné à">
                <select value={ticket.assignee ? ticket.assignee.id : ""} onChange={(e) => patch({ assignee_id: e.target.value || null })} disabled={saving} style={D.select}>
                  <option value="">— Non assigné —</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}{p.team ? ` · ${p.team}` : ""}</option>)}
                </select>
              </PropRow>

              <PropRow label="Équipe">
                <input value={ticket.assignee_team || ""} onChange={(e) => setTicket({ ...ticket, assignee_team: e.target.value })}
                       onBlur={(e) => patch({ assignee_team: e.target.value || null })}
                       placeholder="Support N1, N2, Sécurité..." style={D.select} disabled={saving} />
              </PropRow>

              <PropRow label="SLA cible">
                <input type="datetime-local"
                       value={ticket.sla_due_at ? new Date(ticket.sla_due_at).toISOString().slice(0, 16) : ""}
                       onChange={(e) => patch({ sla_due_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                       style={D.select} disabled={saving} />
              </PropRow>

              <PropRow label="Type">
                <select value={ticket.lifecycle || ""} onChange={(e) => patch({ lifecycle: e.target.value || null })} disabled={saving} style={D.select}>
                  <option value="">Incident / Demande standard</option>
                  <option value="onboarding">👤+ Arrivée collaborateur</option>
                  <option value="offboarding">👤− Départ collaborateur</option>
                </select>
              </PropRow>

              <PropRow label="Facturable">
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, color: "#475569" }}>
                  <input type="checkbox" checked={ticket.billable || false} onChange={(e) => patch({ billable: e.target.checked })} disabled={saving} />
                  Prestation facturable
                </label>
              </PropRow>

              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #eef2f7" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Réf.</div>
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#0f172a" }}>{ticket.id}</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );

  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

const PropRow = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    {children}
  </div>
);

window.TicketDetailModal = TicketDetailModal;

const D = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", zIndex: 2500, display: "flex", alignItems: "stretch", justifyContent: "center", padding: 16 },
  modal: { width: "100%", maxWidth: 1280, background: "#fff", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,.45)", display: "flex", flexDirection: "column", overflow: "hidden" },

  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #f1f5f9", background: "#fafbfd", gap: 12, flexWrap: "wrap" },
  backBtn: { padding: "6px 12px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  btnEscalate: { padding: "7px 13px", background: "#f5f3ff", color: "#5b21b6", border: "1px solid #c4b5fd", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  btnResolve: { padding: "7px 13px", background: "#10b981", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },

  empty: { padding: 60, textAlign: "center" },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, flex: 1, overflowY: "auto" },
  colMain: { padding: "22px 26px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
  colSide: { padding: "22px 22px", borderLeft: "1px solid #f1f5f9", background: "#fafbfd", overflowY: "auto" },

  h1: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 },
  descBox: { padding: 14, background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 10 },
  threadPlaceholder: { padding: 14, background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 10 },
  sectionLabel: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  select: { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", cursor: "pointer", fontFamily: "inherit" },

  escBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)", borderRadius: 10 },
  escIcon: { width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.18)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 },
};
