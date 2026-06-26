// MailTemplates — Gestion des modèles d'emails réutilisables
//
// Permet de créer / éditer / supprimer des templates, de prévisualiser
// avec un contexte fictif, et de tester l'ouverture Outlook Web.

const MailTemplates = () => {
  const [templates, setTemplates] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const list = await window.api.emailTemplates.list();
      setTemplates(list || []);
    } catch (e) { console.warn(e); }
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  const categories = [
    { k: "introduction",  label: "Introduction", color: "#3b82f6", bg: "#dbeafe" },
    { k: "relance",       label: "Relance",      color: "#ea580c", bg: "#fed7aa" },
    { k: "devis",         label: "Devis",        color: "#a855f7", bg: "#e9d5ff" },
    { k: "remerciement",  label: "Remerciement", color: "#10b981", bg: "#d1fae5" },
    { k: "rdv",           label: "RDV",          color: "#0ea5e9", bg: "#bae6fd" },
    { k: "autre",         label: "Autre",        color: "#64748b", bg: "#e2e8f0" },
  ];
  const catMeta = (k) => categories.find((c) => c.k === k) || categories[5];

  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  const startNew = () => {
    setEditing({
      id: null,
      name: "",
      category: "introduction",
      subject: "",
      body: "",
    });
  };
  const startEdit = (t) => setEditing({ ...t });
  const cancelEdit = () => setEditing(null);
  const save = async () => {
    if (!editing.name.trim()) { window.HubToast && window.HubToast.warn("Renseigne un nom"); return; }
    try {
      if (editing.id) {
        await window.api.emailTemplates.update(editing.id, {
          name: editing.name, category: editing.category,
          subject: editing.subject, body: editing.body,
        });
        window.HubToast && window.HubToast.success("✓ Template mis à jour");
      } else {
        await window.api.emailTemplates.create({
          name: editing.name, category: editing.category,
          subject: editing.subject, body: editing.body,
        });
        window.HubToast && window.HubToast.success("✓ Template créé");
      }
      setEditing(null);
      load();
    } catch (e) {
      window.HubToast && window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  const removeTemplate = async (t) => {
    const ok = window.HubModal
      ? await window.HubModal.confirm({ title: "Supprimer ce template ?", message: "« " + t.name + " » sera supprimé.", okStyle: "danger", okLabel: "Supprimer" })
      : confirm("Supprimer « " + t.name + " » ?");
    if (!ok) return;
    await window.api.emailTemplates.remove(t.id);
    window.HubToast && window.HubToast.success("✓ Template supprimé");
    load();
  };
  const previewCompose = (t) => {
    const ctx = {
      client_name: "ATPS",
      raison_sociale: "ATPS Conseils",
      contact_prenom: "Jean",
      contact_nom: "Dupont",
      contact_fonction: "Directeur",
      opportunity_name: "Refonte infra",
      amount: "12 500 €",
      owner_name: "Romain Daviaud",
    };
    window.api.emailTemplates.composeOutlookWeb({ to: "", template: t, ctx });
    window.HubToast && window.HubToast.info("📧 Outlook Web ouvert avec contexte fictif");
  };

  const insertVar = (variable) => {
    const ta = document.getElementById("tpl-body-textarea");
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const newVal = editing.body.slice(0, start) + "{" + variable + "}" + editing.body.slice(end);
    setEditing({ ...editing, body: newVal });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 10);
  };

  return (
    <div style={S.frame}>
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/accueil-simple" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Templates email</span>
        </div>
        <button onClick={startNew} style={S.primaryBtn}>+ Nouveau template</button>
      </header>

      <div style={S.titleRow}>
        <div>
          <h1 style={S.h1}>📧 Templates d'emails</h1>
          <p style={S.h1sub}>Modèles réutilisables — pré-remplissent le compose Outlook Web avec contexte client/opportunité.</p>
        </div>
      </div>

      {/* Filtres catégorie */}
      <div style={S.filters}>
        <button onClick={() => setFilter("all")}
                style={{ ...S.filterBtn, ...(filter === "all" ? S.filterBtnActive : {}) }}>
          Toutes <span style={S.count}>{templates.length}</span>
        </button>
        {categories.map((c) => {
          const n = templates.filter((t) => t.category === c.k).length;
          return (
            <button key={c.k} onClick={() => setFilter(c.k)}
                    style={{ ...S.filterBtn,
                             ...(filter === c.k ? { ...S.filterBtnActive, background: c.color, borderColor: c.color } : {}) }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color, display: "inline-block", marginRight: 6 }} />
              {c.label} <span style={S.count}>{n}</span>
            </button>
          );
        })}
      </div>

      <div style={S.body}>
        {loading && <div style={S.empty}>Chargement…</div>}
        {!loading && filtered.length === 0 && (
          <div style={S.empty}>
            Aucun template — clique sur « + Nouveau template » pour créer ton premier modèle.
          </div>
        )}

        <div style={S.grid}>
          {filtered.map((t) => {
            const meta = catMeta(t.category);
            return (
              <div key={t.id} style={S.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ ...S.chip, background: meta.bg, color: meta.color }}>{meta.label}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => previewCompose(t)} title="Prévisualiser dans Outlook Web"
                            style={S.iconBtn}>📤</button>
                    <button onClick={() => startEdit(t)} title="Modifier"
                            style={S.iconBtn}>✎</button>
                    <button onClick={() => removeTemplate(t)} title="Supprimer"
                            style={{ ...S.iconBtn, color: "#dc2626" }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8, fontStyle: "italic" }}>
                  {t.subject || "(sans sujet)"}
                </div>
                <div style={{ fontSize: 11, color: "#475569", maxHeight: 80, overflow: "hidden",
                              whiteSpace: "pre-wrap", lineHeight: 1.4, textOverflow: "ellipsis" }}>
                  {(t.body || "").slice(0, 200)}{(t.body || "").length > 200 ? "…" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Éditeur — modal pleine page */}
      {editing && (
        <div onClick={cancelEdit} style={S.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={S.modal}>
            <header style={S.modalHead}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                {editing.id ? "✎ Modifier le template" : "+ Nouveau template"}
              </h2>
              <button onClick={cancelEdit} style={S.closeBtn}>×</button>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={S.lbl}>Nom du template *</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                       placeholder="Ex : Relance J+5 sans réponse"
                       style={S.input} />
              </div>
              <div>
                <label style={S.lbl}>Catégorie</label>
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                        style={S.input}>
                  {categories.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <label style={S.lbl}>Sujet</label>
            <input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                   placeholder="Ex : Suivi devis {opportunity_name}"
                   style={{ ...S.input, marginBottom: 14 }} />

            <label style={S.lbl}>Corps du message</label>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              Variables disponibles (clique pour insérer) :
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {["client_name", "contact_prenom", "contact_nom", "contact_fonction",
                "opportunity_name", "amount", "owner_name", "date_du_jour"].map((v) => (
                <button key={v} onClick={() => insertVar(v)} style={S.varBtn}>
                  {"{" + v + "}"}
                </button>
              ))}
            </div>
            <textarea id="tpl-body-textarea"
                      value={editing.body}
                      onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                      rows={12}
                      placeholder={"Bonjour {contact_prenom} {contact_nom},\n\nSuite à notre échange concernant {opportunity_name}, je vous adresse..."}
                      style={{ ...S.input, fontFamily: "'SF Mono', Consolas, monospace", fontSize: 12, lineHeight: 1.6, resize: "vertical" }} />

            <footer style={S.modalFoot}>
              <button onClick={cancelEdit} style={S.ghostBtn}>Annuler</button>
              <button onClick={() => previewCompose(editing)} style={{ ...S.ghostBtn, color: "#0e7a55", borderColor: "#a7f3d0", background: "#ecfdf5" }}>
                📤 Tester avec Outlook Web
              </button>
              <button onClick={save} style={S.primaryBtn}>
                {editing.id ? "💾 Mettre à jour" : "+ Créer"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  titleRow: { padding: "20px 28px", borderBottom: "1px solid #eef1f5", background: "#fff" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  h1sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  filters: { display: "flex", gap: 6, padding: "12px 28px", background: "#fafbfc", borderBottom: "1px solid #eef1f5", flexWrap: "wrap" },
  filterBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8,
               fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
               display: "inline-flex", alignItems: "center", gap: 4 },
  filterBtnActive: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  count: { fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(0,0,0,0.06)", marginLeft: 4 },
  body: { padding: "20px 28px 60px" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: 14,
          transition: "box-shadow 120ms", cursor: "default" },
  chip: { padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },
  iconBtn: { width: 26, height: 26, padding: 0, border: "1px solid #e2e8f0", background: "#fff",
             borderRadius: 6, cursor: "pointer", fontSize: 12 },
  primaryBtn: { padding: "8px 16px", border: "none", background: "#4f46e5", color: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  ghostBtn: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff",
              borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 600 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 720,
           maxHeight: "92vh", overflow: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalFoot: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18, paddingTop: 14, borderTop: "1px solid #eef1f5" },
  closeBtn: { width: 32, height: 32, border: "none", background: "#f1f5f9", borderRadius: 8,
              fontSize: 18, cursor: "pointer", fontWeight: 700 },
  lbl: { fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4, display: "block" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
           fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box", outline: "none" },
  varBtn: { padding: "3px 8px", border: "1px dashed #c7d2fe", background: "#eef2ff", color: "#3730a3",
            borderRadius: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "'SF Mono', Consolas, monospace", cursor: "pointer" },
};

window.MailTemplates = MailTemplates;
