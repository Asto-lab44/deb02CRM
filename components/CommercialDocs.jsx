// ════════════════════════════════════════════════════════════════════
// CommercialDocs — Gestion Commerciale (Devis / Commande / BL / Facture)
// ════════════════════════════════════════════════════════════════════
//
// Inspirée Sage 50c Gestion Commerciale :
// - 4 types de documents : devis → commande → BL → facture
// - Chaque type a son propre tab + son kanban par statut
// - Bouton "Nouveau" crée un brouillon ; édition inline des lignes
// - Bouton "Transformer en …" enchaîne sur le document suivant
// - Rattachement optionnel à un projet (CRM Projets & Livrables)
//
// Sources Supabase : commercial_docs + commercial_doc_lines + commercial_articles
// ════════════════════════════════════════════════════════════════════

const CommercialDocs = () => {
  const TYPES = [
    { k: "devis",    label: "Devis",          color: "#3b82f6", icon: "📄" },
    { k: "commande", label: "Commandes",      color: "#a855f7", icon: "📋" },
    { k: "bl",       label: "Bons livraison", color: "#ea580c", icon: "🚚" },
    { k: "facture",  label: "Factures",       color: "#10b981", icon: "💶" },
  ];

  const STATUS_META = {
    brouillon:  { label: "Brouillon",  color: "#94a3b8", bg: "#f1f5f9" },
    envoye:     { label: "Envoyé",     color: "#3b82f6", bg: "#dbeafe" },
    accepte:    { label: "Accepté",    color: "#10b981", bg: "#dcfce7" },
    refuse:     { label: "Refusé",     color: "#dc2626", bg: "#fee2e2" },
    transforme: { label: "Transformé", color: "#7e22ce", bg: "#f3e8ff" },
    livre:      { label: "Livré",      color: "#f59e0b", bg: "#fef3c7" },
    facture:    { label: "Facturé",    color: "#0ea5e9", bg: "#e0f2fe" },
    paye:       { label: "Payé",       color: "#065f46", bg: "#d1fae5" },
    annule:     { label: "Annulé",     color: "#475569", bg: "#e2e8f0" },
  };

  const [activeType, setActiveType] = React.useState("devis");
  const [docs, setDocs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [clients, setClients] = React.useState([]);
  const [projects, setProjects] = React.useState([]);
  const [editing, setEditing] = React.useState(null); // null ou doc en cours d'édition

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.commercialDocs.list({ type: activeType });
      setDocs(list || []);
    } catch (e) { setDocs([]); }
    setLoading(false);
  }, [activeType]);

  React.useEffect(() => { reload(); }, [reload]);
  React.useEffect(() => {
    (async () => {
      try { setClients(await window.api.clients.list() || []); } catch (e) {}
      try { setProjects(await window.api.projects.list() || []); } catch (e) {}
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) =>
      [d.id, d.client_name, d.title, d.owner].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [docs, search]);

  const totals = React.useMemo(() => {
    const t = { count: filtered.length, ht: 0, ttc: 0, pending: 0 };
    filtered.forEach((d) => {
      t.ht += Number(d.total_ht) || 0;
      t.ttc += Number(d.total_ttc) || 0;
      if (d.status === "brouillon" || d.status === "envoye") t.pending++;
    });
    return t;
  }, [filtered]);

  const newDoc = async () => {
    try {
      const doc = await window.api.commercialDocs.create({
        type: activeType,
        title: TYPES.find((t) => t.k === activeType).label + " — Nouveau",
        status: "brouillon",
        lines: [],
      });
      if (window.HubToast) window.HubToast.success("✓ " + doc.id + " créé");
      setEditing(doc);
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const openDoc = async (id) => {
    const full = await window.api.commercialDocs.getById(id);
    setEditing(full);
  };

  const closeEditor = () => { setEditing(null); reload(); };

  const fmtEUR = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ") + " €";
  };

  return (
    <div style={cdStyles.frame}>
      {/* SIDEBAR */}
      <aside style={cdStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          <div style={cdStyles.logo}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Gestion commerciale</div>
          </div>
        </a>

        <button onClick={newDoc} style={cdStyles.newBtn}>
          <span style={{ fontSize: 14 }}>+</span>
          <span>Nouveau {TYPES.find((t) => t.k === activeType).label.toLowerCase().replace(/s$/, "")}</span>
        </button>

        <div style={cdStyles.navLabel}>Documents</div>
        {TYPES.map((t) => (
          <div key={t.k} onClick={() => setActiveType(t.k)}
               style={{ ...cdStyles.navItem, ...(activeType === t.k ? cdStyles.navItemActive : {}) }}>
            <span style={{ width: 16, color: activeType === t.k ? t.color : "#94a3b8" }}>{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            <span style={cdStyles.navCount}>{activeType === t.k ? docs.length : ""}</span>
          </div>
        ))}

        <div style={cdStyles.navLabel}>Administration</div>
        <a href="/gestion-commerciale-admin" style={{ ...cdStyles.navItem, textDecoration: "none", color: "inherit" }}>
          <span style={{ width: 16, color: "#94a3b8" }}>⚙</span>
          <span>Catalogue & paramètres</span>
        </a>
      </aside>

      {/* MAIN */}
      <main style={cdStyles.main}>
        <header style={cdStyles.topbar}>
          <div>
            <h1 style={cdStyles.h1}>{TYPES.find((t) => t.k === activeType).label}</h1>
            <p style={cdStyles.sub}>{totals.count} document(s) · {fmtEUR(totals.ttc)} TTC · {totals.pending} en attente</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (réf, client, titre…)"
              style={cdStyles.searchInput}
            />
            <button onClick={newDoc} style={cdStyles.primaryBtn}>+ Nouveau</button>
          </div>
        </header>

        {/* KPIs */}
        <div style={cdStyles.kpiRow}>
          <KPI label="Total HT" value={fmtEUR(totals.ht)} color="#3730a3" />
          <KPI label="Total TTC" value={fmtEUR(totals.ttc)} color="#10b981" />
          <KPI label="En attente" value={totals.pending} color="#f59e0b" />
          <KPI label="Documents" value={totals.count} color="#0ea5e9" />
        </div>

        {/* LISTE */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={cdStyles.empty}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Aucun {TYPES.find((t) => t.k === activeType).label.toLowerCase()} pour le moment</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Cliquez sur « + Nouveau » pour créer le premier.</div>
            <button onClick={newDoc} style={{ ...cdStyles.primaryBtn, marginTop: 14 }}>+ Créer le premier</button>
          </div>
        ) : (
          <div style={cdStyles.docList}>
            <div style={cdStyles.tableHead}>
              <span style={{ flex: "0 0 130px" }}>Référence</span>
              <span style={{ flex: 1 }}>Client / Titre</span>
              <span style={{ flex: "0 0 100px" }}>Date</span>
              <span style={{ flex: "0 0 120px", textAlign: "right" }}>Montant HT</span>
              <span style={{ flex: "0 0 120px", textAlign: "right" }}>Montant TTC</span>
              <span style={{ flex: "0 0 110px" }}>Statut</span>
              <span style={{ flex: "0 0 60px" }}></span>
            </div>
            {filtered.map((d) => {
              const sm = STATUS_META[d.status] || STATUS_META.brouillon;
              return (
                <div key={d.id} onClick={() => openDoc(d.id)} style={cdStyles.tableRow}>
                  <span style={{ flex: "0 0 130px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#3730a3", fontWeight: 600 }}>{d.id}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.client_name || "— Client non renseigné —"}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title || "(sans titre)"}</div>
                  </span>
                  <span style={{ flex: "0 0 100px", fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{d.doc_date}</span>
                  <span style={{ flex: "0 0 120px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(d.total_ht)}</span>
                  <span style={{ flex: "0 0 120px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(d.total_ttc)}</span>
                  <span style={{ flex: "0 0 110px" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 600 }}>{sm.label}</span>
                  </span>
                  <span style={{ flex: "0 0 60px", textAlign: "right", color: "#cbd5e1", fontSize: 16 }}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* EDITOR MODAL */}
      {editing && (
        <CommercialDocEditor
          doc={editing}
          clients={clients}
          projects={projects}
          onClose={closeEditor}
          onSaved={reload}
        />
      )}
    </div>
  );
};

const KPI = ({ label, value, color }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: color || "#0f172a", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// EDITOR : édition d'un doc + ses lignes
// ─────────────────────────────────────────────────────────────────
const CommercialDocEditor = ({ doc, clients, projects, onClose, onSaved }) => {
  const [d, setD] = React.useState(doc);
  const [articles, setArticles] = React.useState([]);
  const [tvaRates, setTvaRates] = React.useState([]);
  const [paymentTerms, setPaymentTerms] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try { setArticles(await window.api.commercialArticles.list({ active: true }) || []); } catch (e) {}
      try { setTvaRates(await window.api.commercialRefs.tvaRates() || []); } catch (e) {}
      try { setPaymentTerms(await window.api.commercialRefs.paymentTerms() || []); } catch (e) {}
    })();
  }, []);

  const setField = (k, v) => setD((cur) => ({ ...cur, [k]: v }));

  const pickClient = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) { setField("client_id", null); return; }
    setD((cur) => ({
      ...cur,
      client_id: c.id,
      client_name: c.raison_sociale || c.name,
      client_address: c.adresse || c.address || "",
      client_cp: c.cp || c.code_postal || "",
      client_city: c.ville || c.city || "",
      client_siren: c.siren || "",
      client_tva: c.tva || c.tva_intracom || "",
    }));
  };

  const addLine = (article) => {
    const line = article ? {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      article_id: article.id, ref: article.ref, designation: article.name,
      description: article.description || "",
      quantity: 1, unit: article.unit || "u",
      unit_price_ht: Number(article.price_ht) || 0,
      discount_pct: 0,
      tva_rate: Number(article.tva_rate) || 20,
      _new: true,
    } : {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      designation: "",
      quantity: 1, unit: "u", unit_price_ht: 0, discount_pct: 0, tva_rate: 20,
      _new: true,
    };
    line.total_ht = line.quantity * line.unit_price_ht * (1 - line.discount_pct / 100);
    line.total_tva = line.total_ht * line.tva_rate / 100;
    line.total_ttc = line.total_ht + line.total_tva;
    setD((cur) => ({ ...cur, lines: [...(cur.lines || []), line] }));
  };

  const updateLineField = (idx, k, v) => {
    setD((cur) => {
      const lines = [...(cur.lines || [])];
      const l = { ...lines[idx], [k]: v };
      const qty = Number(l.quantity) || 0;
      const pu = Number(l.unit_price_ht) || 0;
      const disc = Number(l.discount_pct) || 0;
      const tvaR = Number(l.tva_rate) != null ? Number(l.tva_rate) : 20;
      l.total_ht = Math.round(qty * pu * (1 - disc / 100) * 100) / 100;
      l.total_tva = Math.round(l.total_ht * tvaR / 100 * 100) / 100;
      l.total_ttc = Math.round((l.total_ht + l.total_tva) * 100) / 100;
      lines[idx] = l;
      return { ...cur, lines };
    });
  };

  const removeLine = async (idx) => {
    const line = d.lines[idx];
    if (line && line.id && !String(line.id).startsWith("tmp_")) {
      try { await window.api.commercialDocs.removeLine(line.id); } catch (e) {}
    }
    setD((cur) => ({ ...cur, lines: cur.lines.filter((_, i) => i !== idx) }));
  };

  // Totaux calculés à la volée
  const totals = React.useMemo(() => {
    let ht = 0, tva = 0;
    (d.lines || []).forEach((l) => {
      if (l.is_text_only) return;
      ht += Number(l.total_ht) || 0;
      tva += Number(l.total_tva) || 0;
    });
    return { ht: Math.round(ht * 100) / 100, tva: Math.round(tva * 100) / 100, ttc: Math.round((ht + tva) * 100) / 100 };
  }, [d.lines]);

  const save = async () => {
    setSaving(true);
    try {
      // 1. Update du doc principal (hors lignes)
      const patch = {
        status: d.status, title: d.title, notes: d.notes, internal_notes: d.internal_notes,
        client_id: d.client_id, client_name: d.client_name, client_address: d.client_address,
        client_cp: d.client_cp, client_city: d.client_city, client_siren: d.client_siren, client_tva: d.client_tva,
        contact_name: d.contact_name, contact_email: d.contact_email,
        project_id: d.project_id || null, opportunity_id: d.opportunity_id || null,
        doc_date: d.doc_date, valid_until: d.valid_until, payment_due: d.payment_due,
        payment_terms_id: d.payment_terms_id, owner: d.owner,
        total_ht: totals.ht, total_tva: totals.tva, total_ttc: totals.ttc,
      };
      await window.api.commercialDocs.update(d.id, patch);
      // 2. Lignes : insère les nouvelles, met à jour les existantes
      for (const line of (d.lines || [])) {
        if (line._new || String(line.id || "").startsWith("tmp_")) {
          await window.api.commercialDocs.addLine(d.id, { ...line, id: undefined, position: (d.lines.indexOf(line)) });
        } else {
          await window.api.commercialDocs.updateLine(line.id, {
            designation: line.designation, description: line.description,
            quantity: line.quantity, unit: line.unit, unit_price_ht: line.unit_price_ht,
            discount_pct: line.discount_pct, tva_rate: line.tva_rate,
            position: d.lines.indexOf(line),
          });
        }
      }
      if (window.HubToast) window.HubToast.success("✓ Document enregistré");
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };

  const transformTo = async () => {
    const flow = { devis: "commande", commande: "bl", bl: "facture" };
    const next = flow[d.type];
    if (!next) return;
    if (!confirm("Transformer ce " + d.type + " en " + next + " ?")) return;
    try {
      const child = await window.api.commercialDocs.transform(d.id, next);
      if (window.HubToast) window.HubToast.success("✓ " + child.id + " créé");
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ") + " €";

  return (
    <div style={cdStyles.modalOverlay} onClick={onClose}>
      <div style={cdStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <header style={cdStyles.modalHead}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{d.type}</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{d.id}</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {d.type !== "facture" && d.status !== "transforme" && (
              <button onClick={transformTo} style={cdStyles.ghostBtn}>
                → Transformer en {{ devis: "commande", commande: "BL", bl: "facture" }[d.type]}
              </button>
            )}
            <button onClick={save} disabled={saving} style={cdStyles.primaryBtn}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
            <button onClick={onClose} style={cdStyles.closeBtn}>×</button>
          </div>
        </header>

        <div style={cdStyles.modalBody}>
          {/* Bloc client + meta */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={cdStyles.lbl}>Client</label>
              <select value={d.client_id || ""} onChange={(e) => pickClient(e.target.value)} style={cdStyles.input}>
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.raison_sociale || c.name}</option>)}
              </select>
              {d.client_address && (
                <div style={{ marginTop: 6, padding: 8, background: "#f8fafc", borderRadius: 6, fontSize: 11, color: "#475569" }}>
                  {d.client_address}<br/>{d.client_cp} {d.client_city}{d.client_siren ? " · SIREN " + d.client_siren : ""}
                </div>
              )}
            </div>
            <div>
              <label style={cdStyles.lbl}>Titre du document</label>
              <input value={d.title || ""} onChange={(e) => setField("title", e.target.value)} placeholder="Ex : Devis migration AD AXA" style={cdStyles.input} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <label style={cdStyles.lbl}>Date document</label>
                  <input type="date" value={d.doc_date || ""} onChange={(e) => setField("doc_date", e.target.value)} style={cdStyles.input} />
                </div>
                <div>
                  <label style={cdStyles.lbl}>{d.type === "devis" ? "Valide jusqu'au" : d.type === "facture" ? "Échéance paiement" : "Date prévue"}</label>
                  <input type="date" value={(d.type === "devis" ? d.valid_until : d.payment_due) || ""}
                         onChange={(e) => setField(d.type === "devis" ? "valid_until" : "payment_due", e.target.value)} style={cdStyles.input} />
                </div>
              </div>
            </div>
          </div>

          {/* Lien projet + statut + conditions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={cdStyles.lbl}>Rattacher à un projet (optionnel)</label>
              <select value={d.project_id || ""} onChange={(e) => setField("project_id", e.target.value || null)} style={cdStyles.input}>
                <option value="">— Aucun —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} {p.client_name ? "· " + p.client_name : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={cdStyles.lbl}>Statut</label>
              <select value={d.status} onChange={(e) => setField("status", e.target.value)} style={cdStyles.input}>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                {d.type === "devis" && <option value="accepte">Accepté</option>}
                {d.type === "devis" && <option value="refuse">Refusé</option>}
                {d.type === "bl" && <option value="livre">Livré</option>}
                {d.type === "facture" && <option value="paye">Payé</option>}
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div>
              <label style={cdStyles.lbl}>Conditions de paiement</label>
              <select value={d.payment_terms_id || ""} onChange={(e) => setField("payment_terms_id", e.target.value || null)} style={cdStyles.input}>
                <option value="">— Choisir —</option>
                {paymentTerms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* LIGNES */}
          <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Lignes</h3>
          <div style={cdStyles.linesTable}>
            <div style={cdStyles.lineHead}>
              <span style={{ flex: 2 }}>Désignation</span>
              <span style={{ flex: "0 0 70px", textAlign: "right" }}>Qté</span>
              <span style={{ flex: "0 0 60px", textAlign: "center" }}>U.</span>
              <span style={{ flex: "0 0 110px", textAlign: "right" }}>P.U. HT</span>
              <span style={{ flex: "0 0 70px", textAlign: "right" }}>Rem. %</span>
              <span style={{ flex: "0 0 70px", textAlign: "center" }}>TVA</span>
              <span style={{ flex: "0 0 110px", textAlign: "right" }}>Total HT</span>
              <span style={{ flex: "0 0 30px" }}></span>
            </div>
            {(d.lines || []).map((l, i) => (
              <div key={l.id || i} style={cdStyles.lineRow}>
                <input value={l.designation || ""} onChange={(e) => updateLineField(i, "designation", e.target.value)} placeholder="Désignation" style={{ ...cdStyles.lineInput, flex: 2 }} />
                <input type="number" value={l.quantity} onChange={(e) => updateLineField(i, "quantity", e.target.value)} style={{ ...cdStyles.lineInput, flex: "0 0 70px", textAlign: "right" }} />
                <input value={l.unit || "u"} onChange={(e) => updateLineField(i, "unit", e.target.value)} style={{ ...cdStyles.lineInput, flex: "0 0 60px", textAlign: "center" }} />
                <input type="number" step="0.01" value={l.unit_price_ht} onChange={(e) => updateLineField(i, "unit_price_ht", e.target.value)} style={{ ...cdStyles.lineInput, flex: "0 0 110px", textAlign: "right" }} />
                <input type="number" value={l.discount_pct || 0} onChange={(e) => updateLineField(i, "discount_pct", e.target.value)} style={{ ...cdStyles.lineInput, flex: "0 0 70px", textAlign: "right" }} />
                <select value={l.tva_rate} onChange={(e) => updateLineField(i, "tva_rate", e.target.value)} style={{ ...cdStyles.lineInput, flex: "0 0 70px", textAlign: "center" }}>
                  {tvaRates.map((t) => <option key={t.rate} value={t.rate}>{t.rate}%</option>)}
                </select>
                <span style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>{fmtEUR(l.total_ht)}</span>
                <button onClick={() => removeLine(i)} style={{ flex: "0 0 30px", background: "transparent", border: 0, color: "#dc2626", fontSize: 16, cursor: "pointer" }}>×</button>
              </div>
            ))}
            <div style={{ padding: "10px 8px", display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => addLine(null)} style={cdStyles.ghostBtn}>+ Ligne libre</button>
              <select onChange={(e) => { if (e.target.value) { addLine(articles.find((a) => a.id === e.target.value)); e.target.value = ""; } }} style={{ ...cdStyles.input, flex: 1 }}>
                <option value="">+ Ajouter article du catalogue…</option>
                {articles.map((a) => <option key={a.id} value={a.id}>{a.ref} — {a.name} ({fmtEUR(a.price_ht)})</option>)}
              </select>
            </div>
          </div>

          {/* TOTAUX */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 10, padding: 14, minWidth: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4 }}>
                <span>Total HT</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{fmtEUR(totals.ht)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4 }}>
                <span>TVA</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{fmtEUR(totals.tva)}</span>
              </div>
              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
                <span>Total TTC</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(totals.ttc)}</span>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={cdStyles.lbl}>Notes (imprimées sur le doc)</label>
              <textarea value={d.notes || ""} onChange={(e) => setField("notes", e.target.value)} rows={3} style={{ ...cdStyles.input, resize: "vertical" }} placeholder="Mentions visibles par le client…" />
            </div>
            <div>
              <label style={cdStyles.lbl}>Notes internes (non imprimées)</label>
              <textarea value={d.internal_notes || ""} onChange={(e) => setField("internal_notes", e.target.value)} rows={3} style={{ ...cdStyles.input, resize: "vertical" }} placeholder="Notes internes pour l'équipe…" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const cdStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 220, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #3730a3, #6366f1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", margin: "14px 0 8px" },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },

  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  searchInput: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 280, fontFamily: "inherit" },
  primaryBtn: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" },

  kpiRow: { display: "flex", gap: 10, marginBottom: 16 },
  empty: { padding: 60, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center" },

  docList: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" },
  tableHead: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: "#f8fafc", borderBottom: "1px solid #eef1f5", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 14px", gap: 10, borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" },
  modalCard: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 1100, boxShadow: "0 20px 60px rgba(15,23,42,0.4)", overflow: "hidden" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  modalBody: { padding: 22, maxHeight: "calc(100vh - 140px)", overflowY: "auto" },

  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },

  linesTable: { border: "1px solid #eef1f5", borderRadius: 8, overflow: "hidden" },
  lineHead: { display: "flex", alignItems: "center", padding: "8px 8px", gap: 6, background: "#f8fafc", borderBottom: "1px solid #eef1f5", fontSize: 11, fontWeight: 600, color: "#64748b" },
  lineRow: { display: "flex", alignItems: "center", padding: "6px 8px", gap: 6, borderBottom: "1px solid #f1f5f9" },
  lineInput: { padding: "6px 8px", border: "1px solid transparent", borderRadius: 5, fontSize: 12, fontFamily: "inherit", background: "transparent", color: "#0f172a", boxSizing: "border-box" },
};
