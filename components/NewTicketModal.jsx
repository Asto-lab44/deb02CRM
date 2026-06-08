// Modal "Nouveau ticket" — formulaire complet réutilisant le visuel de la
// popup hotline (phase newTicket). Ouvert via le bouton "+ Nouveau ticket"
// du sidebar et du header. Persiste en base si Supabase est configuré.

const NewTicketModal = ({ open, onClose, onCreated, prefill }) => {
  const [form, setForm] = React.useState({
    client_id: "", caller_name: "", caller_phone: "",
    subject: "", category: "Support technique", priority: "normale", description: "",
    lifecycle: "", billable: false,
  });
  const [clients, setClients] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const dataOn = typeof window !== "undefined" && window.HubData && window.HubData.enabled();

  // Reset + charge la liste clients à chaque ouverture
  React.useEffect(() => {
    if (!open) { setError(null); return; }
    setForm({
      client_id: (prefill && prefill.client_id) || "",
      caller_name: (prefill && prefill.caller_name) || "",
      caller_phone: (prefill && prefill.caller_phone) || "",
      subject: "", category: "Support technique", priority: "normale",
      description: (prefill && prefill.description) || "",
      lifecycle: "", billable: false,
    });
    if (dataOn) {
      window.HubData.fetchClients().then(({ data }) => {
        if (data) setClients(data);
      });
    } else {
      // Fallback : liste statique pour la démo
      setClients([
        { id: "ACC-0184", name: "AXA Wealth France" },
        { id: "ACC-0211", name: "MAIF Innovation" },
        { id: "ACC-0156", name: "Crédit Agricole Sud" },
        { id: "ACC-0298", name: "Allianz France" },
        { id: "ACC-0103", name: "BNP Paribas AM" },
        { id: "ACC-0177", name: "La Banque Postale" },
      ]);
    }
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dataOn]);

  if (!open) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    if (!form.subject.trim()) { setError("Le sujet est obligatoire."); return; }

    setSubmitting(true);

    const prefix = form.lifecycle ? "REQ" : "INC";
    const ticketId = `${prefix}-${Math.floor(2900 + Math.random() * 99)}`;
    const slaHours = form.priority === "critique" ? 2 : form.priority === "haute" ? 4 : form.priority === "normale" ? 24 : 72;

    const payload = {
      id: ticketId,
      client_id: form.client_id || null,
      title: form.subject.trim(),
      description: form.description.trim() || null,
      category: form.category,
      status: "open",
      priority: form.priority,
      lifecycle: form.lifecycle || null,
      billable: form.billable,
      sla_due_at: new Date(Date.now() + slaHours * 3600 * 1000).toISOString(),
      opened_at: new Date().toISOString(),
    };

    if (dataOn) {
      const { data, error: dbErr } = await window.HubData.createTicket(payload);
      setSubmitting(false);
      if (dbErr) {
        // Diagnostic + fallback gracieux selon le type d'erreur
        const raw = (dbErr.message || "").toLowerCase();
        if (/row-level security|policy|permission|42501/.test(raw)) {
          // RLS : on accepte quand même en local + on prévient
          onCreated && onCreated({ ...payload, _localOnly: true, _reason: "rls" });
          onClose && onClose();
          return;
        }
        if (/relation .* does not exist|42p01/.test(raw)) {
          onCreated && onCreated({ ...payload, _localOnly: true, _reason: "no-schema" });
          onClose && onClose();
          return;
        }
        let msg = dbErr.message || "Erreur inconnue";
        if (/violates foreign key/i.test(msg)) msg = "Référence client introuvable. Sélectionnez un client valide.";
        else if (/duplicate key/i.test(msg)) msg = "Conflit d'ID. Réessayez (un nouvel ID est tiré).";
        setError(msg);
        return;
      }
      onCreated && onCreated(data || payload);
      onClose && onClose();
    } else {
      // Mode démo — pas de Supabase configuré
      setSubmitting(false);
      onCreated && onCreated({ ...payload, _localOnly: true, _reason: "demo" });
      onClose && onClose();
    }
  };

  const tree = (
    <div style={N.backdrop} onClick={onClose}>
      <div style={N.modal} onClick={(e) => e.stopPropagation()}>
        <div style={N.head}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={N.icon}>📝</div>
            <div>
              <div style={N.eyebrow}>Helpdesk · Support IT</div>
              <div style={N.title}>Créer un nouveau ticket</div>
            </div>
          </div>
          <button onClick={onClose} style={N.close} aria-label="Fermer">×</button>
        </div>

        <form onSubmit={submit} style={N.body}>
          {/* Client + cycle de vie */}
          <div style={N.row}>
            <label style={N.field}>
              <span style={N.fieldLabel}>Client <span style={{ color: "#dc2626" }}>*</span></span>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} style={N.input} required>
                <option value="">— Choisir un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {(() => {
                if (!form.client_id) return null;
                const c = clients.find((x) => x.id === form.client_id);
                if (!c) return null;
                const activeContract = c.contracts && c.contracts.find && c.contracts.find((ct) => ct.status === "active");
                if (activeContract) {
                  return <div style={{ fontSize: 11, color: "#065f46", marginTop: 4, fontWeight: 600 }}>● Contrat de maintenance actif — intervention couverte</div>;
                }
                return <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4, fontWeight: 600 }}>● Pas de contrat actif — prestation facturable</div>;
              })()}
            </label>
            <label style={N.field}>
              <span style={N.fieldLabel}>Type</span>
              <select value={form.lifecycle} onChange={(e) => {
                const v = e.target.value;
                setForm({ ...form, lifecycle: v, billable: v ? true : form.billable });
              }} style={N.input}>
                <option value="">Incident / Demande standard</option>
                <option value="onboarding">👤+ Arrivée collaborateur</option>
                <option value="offboarding">👤− Départ collaborateur</option>
              </select>
            </label>
          </div>

          {/* Demandeur */}
          <div style={N.row}>
            <label style={N.field}>
              <span style={N.fieldLabel}>Nom du demandeur</span>
              <input type="text" value={form.caller_name} onChange={(e) => setForm({ ...form, caller_name: e.target.value })} placeholder="Ex. Camille Dufour" style={N.input} />
            </label>
            <label style={N.field}>
              <span style={N.fieldLabel}>Téléphone</span>
              <input type="tel" value={form.caller_phone} onChange={(e) => setForm({ ...form, caller_phone: e.target.value })} placeholder="+33 1 ..." style={N.input} />
            </label>
          </div>

          {/* Sujet */}
          <label style={N.field}>
            <span style={N.fieldLabel}>Sujet <span style={{ color: "#dc2626" }}>*</span></span>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                   placeholder="Ex. Lenteur connexion VPN depuis ce matin" style={N.input} required autoFocus />
          </label>

          {/* Catégorie + Priorité */}
          <div style={N.row}>
            <label style={N.field}>
              <span style={N.fieldLabel}>Catégorie</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={N.input}>
                <option>Support technique</option>
                <option>Réseau · VPN</option>
                <option>Accès & Droits</option>
                <option>Messagerie</option>
                <option>Matériel · Imprimante</option>
                <option>Matériel · Périphérique</option>
                <option>Logiciel · Installation</option>
                <option>Téléphonie</option>
                <option>Gestion comptes RH · Onboarding</option>
                <option>Gestion comptes RH · Offboarding</option>
                <option>Autre</option>
              </select>
            </label>
            <label style={N.field}>
              <span style={N.fieldLabel}>Priorité</span>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={N.input}>
                <option value="critique">Critique (SLA 2 h)</option>
                <option value="haute">Haute (SLA 4 h)</option>
                <option value="normale">Normale (SLA 24 h)</option>
                <option value="basse">Basse (SLA 72 h)</option>
              </select>
            </label>
          </div>

          {/* Description */}
          <label style={N.field}>
            <span style={N.fieldLabel}>Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4} placeholder="Détails de la demande, contexte, captures…"
                      style={{ ...N.input, fontFamily: "inherit", resize: "vertical" }} />
          </label>

          {/* Option facturable */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569", cursor: "pointer" }}>
            <input type="checkbox" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} />
            <span>Prestation facturable (hors contrat de maintenance)</span>
          </label>

          {error && <div style={N.error}>{error}</div>}

          <div style={N.foot}>
            <button type="button" onClick={onClose} style={N.btnGhost}>Annuler</button>
            <button type="submit" disabled={submitting} style={{ ...N.btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? "Création…" : "✓ Créer le ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

window.NewTicketModal = NewTicketModal;

const N = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  icon: { width: 40, height: 40, borderRadius: 10, background: "#eef2ff", color: "#3730a3", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  eyebrow: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 17, fontWeight: 700, color: "#0f172a", marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },

  body: { padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 11.5, fontWeight: 600, color: "#475569" },
  input: { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff" },

  error: { padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 12.5, lineHeight: 1.5 },

  foot: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" },
  btnGhost: { padding: "9px 14px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnPrimary: { padding: "9px 18px", background: "#10b981", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
