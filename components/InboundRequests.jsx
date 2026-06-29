// InboundRequests — File des demandes de devis entrantes (devis.astorya@gmail.com)
//
// Liste les emails reçus → tâches « Devis à faire ». Permet de :
//  - voir le contenu de l'email + l'extraction IA
//  - rattacher manuellement un client si non identifié
//  - créer le devis pré-rempli (ouvre /gestion-commerciale)
//  - marquer comme traité / ignorer
//  - saisir manuellement une demande (copier-coller d'un email)

const InboundRequests = () => {
  const [requests, setRequests] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(null);
  const [showManual, setShowManual] = React.useState(false);
  const [manual, setManual] = React.useState({ from_name: "", from_email: "", subject: "", body_text: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [reqs, cls] = await Promise.all([
        window.api.inboundRequests.list(),
        window.api.clients.list().catch(() => []),
      ]);
      setRequests(reqs || []);
      setClients(cls || []);
    } catch (e) { console.warn(e); }
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  const statusMeta = {
    a_traiter:         { label: "À traiter",          color: "#ea580c", bg: "#fed7aa" },
    client_identifie:  { label: "Client identifié",   color: "#3730a3", bg: "#e0e7ff" },
    devis_cree:        { label: "Devis créé",         color: "#10b981", bg: "#d1fae5" },
    ignore:            { label: "Ignoré",             color: "#64748b", bg: "#e2e8f0" },
  };
  const urgencyMeta = {
    haute:   { label: "Urgent",  color: "#dc2626", bg: "#fee2e2" },
    moyenne: { label: "Normal",  color: "#a16207", bg: "#fef3c7" },
    basse:   { label: "Faible",  color: "#64748b", bg: "#e2e8f0" },
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    all: requests.length,
    a_traiter: requests.filter((r) => r.status === "a_traiter").length,
    client_identifie: requests.filter((r) => r.status === "client_identifie").length,
    devis_cree: requests.filter((r) => r.status === "devis_cree").length,
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };
  const clientName = (id) => {
    const c = clients.find((x) => x.id === id);
    return c ? (c.raison_sociale || c.name) : null;
  };

  const attachClient = async (req, client_id) => {
    if (!client_id) return;
    await window.api.inboundRequests.attachClient(req.id, client_id);
    window.HubToast && window.HubToast.success("✓ Client rattaché");
    load();
  };
  const createDevis = (req) => {
    const cid = req.client_id || "";
    if (!cid) { window.HubToast && window.HubToast.warn("Rattache d'abord un client"); return; }
    // Pré-remplit la note du devis avec le besoin extrait
    const note = encodeURIComponent("Demande reçue par email — " + (req.ai_summary || req.subject || ""));
    window.location.href = "/gestion-commerciale?client=" + encodeURIComponent(cid) + "&inbound=" + encodeURIComponent(req.id) + "&note=" + note;
  };
  const markCreated = async (req) => {
    await window.api.inboundRequests.markDevisCreated(req.id, null);
    window.HubToast && window.HubToast.success("✓ Marqué comme devis créé");
    load();
  };
  const ignore = async (req) => {
    await window.api.inboundRequests.update(req.id, { status: "ignore" });
    load();
  };
  const saveManual = async () => {
    if (!manual.from_email.trim() && !manual.body_text.trim()) {
      window.HubToast && window.HubToast.warn("Renseigne au moins l'email expéditeur ou le corps");
      return;
    }
    // Match auto : société dans le corps (prioritaire) → email → domaine
    const match = await window.api.inboundRequests.matchClientByEmail(manual.from_email, manual.body_text);
    // Note enrichie avec les champs techniques parsés
    const fields = (match && match.fields) || {};
    const fieldLines = Object.keys(fields)
      .filter((k) => !/soci[ée]t[ée]|client|entreprise|raison sociale/.test(k))
      .map((k) => "• " + k.charAt(0).toUpperCase() + k.slice(1) + " : " + fields[k]);
    const summary = manual.subject + (fieldLines.length ? "\n\nInfos techniques :\n" + fieldLines.join("\n") : "");
    await window.api.inboundRequests.create({
      ...manual,
      client_id: match ? match.client_id : null,
      match_method: match ? match.method : "none",
      ai_summary: summary,
    });
    const matchMsg = match && match.client_id
      ? " · client identifié automatiquement"
      : (match && match.societe ? " · société « " + match.societe + " » à confirmer" : "");
    window.HubToast && window.HubToast.success("✓ Demande enregistrée + tâche créée" + matchMsg);
    setShowManual(false);
    setManual({ from_name: "", from_email: "", subject: "", body_text: "" });
    load();
  };

  return (
    <div style={S.frame}>
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/crm" style={{ color: "#64748b", textDecoration: "none" }}>CRM</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Demandes de devis entrantes</span>
        </div>
        <button onClick={() => setShowManual(true)} style={S.primaryBtn}>+ Saisir une demande</button>
      </header>

      <div style={S.titleRow}>
        <div>
          <h1 style={S.h1}>📥 Demandes de devis entrantes</h1>
          <p style={S.h1sub}>Emails reçus sur <strong>devis.astorya@gmail.com</strong> — chaque demande génère une tâche « Devis à faire ».</p>
        </div>
      </div>

      <div style={S.filters}>
        {[
          { k: "all", label: "Toutes", c: counts.all },
          { k: "a_traiter", label: "À traiter", c: counts.a_traiter },
          { k: "client_identifie", label: "Client identifié", c: counts.client_identifie },
          { k: "devis_cree", label: "Devis créé", c: counts.devis_cree },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)}
                  style={{ ...S.filterBtn, ...(filter === t.k ? S.filterBtnActive : {}) }}>
            {t.label} <span style={S.count}>{t.c}</span>
          </button>
        ))}
      </div>

      <div style={S.body}>
        {loading && <div style={S.empty}>Chargement…</div>}
        {!loading && filtered.length === 0 && (
          <div style={S.empty}>
            Aucune demande {filter !== "all" ? "dans ce statut" : "pour le moment"}.<br/><br/>
            Les emails reçus sur <strong>devis.astorya@gmail.com</strong> apparaîtront ici automatiquement.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((req) => {
            const sm = statusMeta[req.status] || statusMeta.a_traiter;
            const um = urgencyMeta[req.ai_urgency] || urgencyMeta.moyenne;
            const cName = clientName(req.client_id);
            const open = selected === req.id;
            return (
              <div key={req.id} style={S.card}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={S.mailIcon}>✉</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{req.subject || "(sans sujet)"}</span>
                      <span style={{ ...S.chip, background: sm.bg, color: sm.color }}>{sm.label}</span>
                      <span style={{ ...S.chip, background: um.bg, color: um.color }}>{um.label}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      De : <strong>{req.from_name || req.from_email}</strong> &lt;{req.from_email}&gt; · {fmtDate(req.received_at)}
                    </div>
                    {req.ai_summary && (
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 6, padding: "6px 10px", background: "#f8fafc", borderRadius: 6, borderLeft: "3px solid #a855f7" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 0.4 }}>Résumé IA</span><br/>
                        {req.ai_summary}
                        {req.ai_amount_hint && <span style={{ fontWeight: 700 }}> · {req.ai_amount_hint}</span>}
                      </div>
                    )}
                    {Array.isArray(req.ai_products) && req.ai_products.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {req.ai_products.map((p, i) => (
                          <span key={i} style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 4, background: "#eef2ff", color: "#3730a3", fontWeight: 600 }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setSelected(open ? null : req.id)} style={S.miniBtn}>{open ? "Masquer" : "Voir l'email"}</button>
                  </div>
                </div>

                {/* Rattachement client si non identifié */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {req.client_id ? (
                    <span style={{ fontSize: 12, color: "#0f172a" }}>
                      🏢 Client : <strong>{cName || req.client_id}</strong>
                      <span style={{ fontSize: 10.5, color: "#94a3b8", marginLeft: 6 }}>({req.match_method === "email_exact" ? "match email" : req.match_method === "domain" ? "match domaine" : "manuel"})</span>
                    </span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠ Client à identifier :</span>
                      <select onChange={(e) => e.target.value && attachClient(req, e.target.value)} defaultValue=""
                              style={{ ...S.input, width: 240, padding: "5px 8px", fontSize: 12 }}>
                        <option value="">— Rattacher à un client —</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.raison_sociale || c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ flex: 1 }} />
                  {req.status !== "devis_cree" && req.status !== "ignore" && (
                    <>
                      <button onClick={() => createDevis(req)} disabled={!req.client_id}
                              style={{ ...S.actionBtn, background: req.client_id ? "#4f46e5" : "#cbd5e1", cursor: req.client_id ? "pointer" : "not-allowed" }}>
                        📄 Créer le devis
                      </button>
                      <button onClick={() => markCreated(req)} style={S.ghostBtn}>✓ Devis fait</button>
                      <button onClick={() => ignore(req)} style={{ ...S.ghostBtn, color: "#dc2626" }}>Ignorer</button>
                    </>
                  )}
                </div>

                {open && (
                  <div style={{ marginTop: 10, padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: 320, overflow: "auto" }}>
                      {req.body_text || req.body_excerpt || "(corps vide)"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal saisie manuelle */}
      {showManual && (
        <div onClick={() => setShowManual(false)} style={S.overlay}>
          <div onClick={(e) => e.stopPropagation()} style={S.modal}>
            <header style={S.modalHead}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>+ Saisir une demande manuellement</h2>
              <button onClick={() => setShowManual(false)} style={S.closeBtn}>×</button>
            </header>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 0 }}>
              Copie-colle un email reçu. Le client sera matché automatiquement par email/domaine, et une tâche « Devis à faire » sera créée.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={S.lbl}>Nom expéditeur</label>
                <input value={manual.from_name} onChange={(e) => setManual({ ...manual, from_name: e.target.value })} style={S.input} /></div>
              <div><label style={S.lbl}>Email expéditeur *</label>
                <input value={manual.from_email} onChange={(e) => setManual({ ...manual, from_email: e.target.value })} placeholder="contact@client.fr" style={S.input} /></div>
            </div>
            <label style={S.lbl}>Sujet</label>
            <input value={manual.subject} onChange={(e) => setManual({ ...manual, subject: e.target.value })} style={{ ...S.input, marginBottom: 12 }} />
            <label style={S.lbl}>Corps de l'email</label>
            <textarea value={manual.body_text} onChange={(e) => setManual({ ...manual, body_text: e.target.value })} rows={8}
                      style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }} />
            <footer style={S.modalFoot}>
              <button onClick={() => setShowManual(false)} style={S.ghostBtn}>Annuler</button>
              <button onClick={saveManual} style={S.primaryBtn}>+ Créer la demande + tâche</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  titleRow: { padding: "20px 28px", borderBottom: "1px solid #eef1f5", background: "#fff" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  h1sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  filters: { display: "flex", gap: 6, padding: "12px 28px", background: "#fafbfc", borderBottom: "1px solid #eef1f5", flexWrap: "wrap" },
  filterBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" },
  filterBtnActive: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  count: { fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(0,0,0,0.06)", marginLeft: 4 },
  body: { padding: "20px 28px 60px" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic" },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: 14 },
  mailIcon: { width: 36, height: 36, borderRadius: 8, background: "#fef3c7", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  chip: { padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },
  miniBtn: { padding: "5px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" },
  actionBtn: { padding: "7px 14px", border: "none", color: "#fff", borderRadius: 7, fontSize: 12.5, fontWeight: 700 },
  ghostBtn: { padding: "7px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600 },
  primaryBtn: { padding: "8px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box", outline: "none" },
  lbl: { fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4, display: "block" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 640, maxHeight: "92vh", overflow: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalFoot: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #eef1f5" },
  closeBtn: { width: 32, height: 32, border: "none", background: "#f1f5f9", borderRadius: 8, fontSize: 18, cursor: "pointer", fontWeight: 700 },
};

window.InboundRequests = InboundRequests;
