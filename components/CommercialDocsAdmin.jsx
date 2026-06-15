// ════════════════════════════════════════════════════════════════════
// CommercialDocsAdmin — Administration de la Gestion Commerciale
// ════════════════════════════════════════════════════════════════════
//
// Onglets :
// - Catalogue articles (CRUD)
// - Taux TVA (lecture, modifiables si admin)
// - Conditions de paiement (lecture)
// - Compteurs de numérotation (reset annuel)
//
// Sources : commercial_articles + commercial_tva_rates + commercial_payment_terms
//           + commercial_doc_counters
// ════════════════════════════════════════════════════════════════════

const CommercialDocsAdmin = () => {
  const [tab, setTab] = React.useState("articles");
  return (
    <div style={cdaStyles.frame}>
      <aside style={cdaStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          <div style={cdaStyles.logo}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Admin commerciale</div>
          </div>
        </a>
        <a href="/gestion-commerciale" style={{ ...cdaStyles.navItem, textDecoration: "none", color: "inherit" }}>
          <span style={{ width: 16, color: "#94a3b8" }}>←</span>
          <span>Retour aux documents</span>
        </a>
        <div style={cdaStyles.navLabel}>Paramètres</div>
        {[
          { k: "articles", label: "Catalogue articles", icon: "📦" },
          { k: "tva",      label: "Taux TVA",           icon: "%" },
          { k: "payment",  label: "Cond. paiement",     icon: "💳" },
          { k: "counters", label: "Numérotation",       icon: "#" },
        ].map((t) => (
          <div key={t.k} onClick={() => setTab(t.k)} style={{ ...cdaStyles.navItem, ...(tab === t.k ? cdaStyles.navItemActive : {}) }}>
            <span style={{ width: 16, color: tab === t.k ? "#3730a3" : "#94a3b8" }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </aside>
      <main style={cdaStyles.main}>
        {tab === "articles" && <ArticlesTab />}
        {tab === "tva"      && <TvaTab />}
        {tab === "payment"  && <PaymentTab />}
        {tab === "counters" && <CountersTab />}
      </main>
    </div>
  );
};

const ArticlesTab = () => {
  const [list, setList] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const reload = async () => {
    setLoading(true);
    try { setList(await window.api.commercialArticles.list({ active: true }) || []); } catch (e) {}
    setLoading(false);
  };
  React.useEffect(() => { reload(); }, []);

  const newArticle = () => setEditing({
    ref: "", name: "", category: "Service", unit: "u", price_ht: 0, tva_rate: 20, is_service: true, is_recurring: false, description: "",
  });

  const save = async (a) => {
    try {
      if (a.id) await window.api.commercialArticles.update(a.id, a);
      else await window.api.commercialArticles.create(a);
      if (window.HubToast) window.HubToast.success("✓ Article enregistré");
      setEditing(null); reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Désactiver cet article ?")) return;
    try { await window.api.commercialArticles.remove(id); reload(); } catch (e) {}
  };

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/,/g, " ") + " €";

  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div>
          <h1 style={cdaStyles.h1}>Catalogue d'articles</h1>
          <p style={cdaStyles.sub}>{list.length} article(s) actif(s) — utilisés dans Devis/Commandes/Factures</p>
        </div>
        <button onClick={newArticle} style={cdaStyles.primaryBtn}>+ Nouvel article</button>
      </header>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
      ) : list.length === 0 ? (
        <div style={cdaStyles.empty}>
          Aucun article dans le catalogue.<br/>
          <button onClick={newArticle} style={{ ...cdaStyles.primaryBtn, marginTop: 12 }}>+ Créer le premier</button>
        </div>
      ) : (
        <div style={cdaStyles.list}>
          <div style={cdaStyles.tableHead}>
            <span style={{ flex: "0 0 140px" }}>Référence</span>
            <span style={{ flex: 1 }}>Désignation</span>
            <span style={{ flex: "0 0 110px" }}>Catégorie</span>
            <span style={{ flex: "0 0 60px", textAlign: "center" }}>Unité</span>
            <span style={{ flex: "0 0 110px", textAlign: "right" }}>P.U. HT</span>
            <span style={{ flex: "0 0 70px", textAlign: "center" }}>TVA</span>
            <span style={{ flex: "0 0 80px" }}></span>
          </div>
          {list.map((a) => (
            <div key={a.id} style={cdaStyles.tableRow}>
              <span style={{ flex: "0 0 140px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#3730a3", fontWeight: 600 }}>{a.ref}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.name}{a.is_recurring ? <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 6px", background: "#eef2ff", color: "#3730a3", borderRadius: 999 }}>🔁 Récurrent</span> : null}</span>
              <span style={{ flex: "0 0 110px", fontSize: 12, color: "#64748b" }}>{a.category || "—"}</span>
              <span style={{ flex: "0 0 60px", textAlign: "center", fontSize: 12, color: "#64748b" }}>{a.unit}</span>
              <span style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{fmtEUR(a.price_ht)}</span>
              <span style={{ flex: "0 0 70px", textAlign: "center", fontSize: 12 }}>{a.tva_rate}%</span>
              <span style={{ flex: "0 0 80px", textAlign: "right", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <button onClick={() => setEditing(a)} style={cdaStyles.iconBtn} title="Éditer">✎</button>
                <button onClick={() => remove(a.id)} style={{ ...cdaStyles.iconBtn, color: "#dc2626" }} title="Désactiver">×</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {editing && <ArticleEditor article={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
};

const ArticleEditor = ({ article, onSave, onClose }) => {
  const [a, setA] = React.useState({ ...article });
  const setField = (k, v) => setA((cur) => ({ ...cur, [k]: v }));
  return (
    <div style={cdaStyles.modalOverlay} onClick={onClose}>
      <div style={cdaStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <header style={cdaStyles.modalHead}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{article.id ? "Modifier l'article" : "Nouvel article"}</h2>
          <button onClick={onClose} style={cdaStyles.closeBtn}>×</button>
        </header>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={cdaStyles.lbl}>Référence (code Sage)</label>
              <input value={a.ref || ""} onChange={(e) => setField("ref", e.target.value)} placeholder="AST-SUITE-USR" style={cdaStyles.input} />
            </div>
            <div>
              <label style={cdaStyles.lbl}>Désignation</label>
              <input value={a.name || ""} onChange={(e) => setField("name", e.target.value)} placeholder="Astorya Suite — Licence utilisateur" style={cdaStyles.input} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={cdaStyles.lbl}>Description (optionnelle)</label>
            <textarea value={a.description || ""} onChange={(e) => setField("description", e.target.value)} rows={2} style={{ ...cdaStyles.input, resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={cdaStyles.lbl}>Catégorie</label>
              <select value={a.category || ""} onChange={(e) => setField("category", e.target.value)} style={cdaStyles.input}>
                <option value="">—</option>
                <option>Suite</option><option>Cyber</option><option>Hub</option>
                <option>Service</option><option>Matériel</option><option>Formation</option><option>Support</option>
              </select>
            </div>
            <div>
              <label style={cdaStyles.lbl}>Unité</label>
              <select value={a.unit || "u"} onChange={(e) => setField("unit", e.target.value)} style={cdaStyles.input}>
                <option value="u">Unité (u)</option><option value="h">Heure (h)</option>
                <option value="j">Journée (j)</option><option value="mois">Mois</option>
                <option value="an">Année (an)</option><option value="forfait">Forfait</option>
              </select>
            </div>
            <div>
              <label style={cdaStyles.lbl}>TVA</label>
              <select value={a.tva_rate} onChange={(e) => setField("tva_rate", Number(e.target.value))} style={cdaStyles.input}>
                <option value="20">20% — normal</option><option value="10">10% — intermédiaire</option>
                <option value="5.5">5,5% — réduit</option><option value="0">0% — exonéré</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={cdaStyles.lbl}>Prix unitaire HT (€)</label>
              <input type="number" step="0.01" value={a.price_ht} onChange={(e) => setField("price_ht", Number(e.target.value))} style={cdaStyles.input} />
            </div>
            <div>
              <label style={cdaStyles.lbl}>Coût d'achat HT (marge — optionnel)</label>
              <input type="number" step="0.01" value={a.cost_ht || ""} onChange={(e) => setField("cost_ht", e.target.value ? Number(e.target.value) : null)} style={cdaStyles.input} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <label style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={a.is_service || false} onChange={(e) => setField("is_service", e.target.checked)} /> Service (vs Bien)
            </label>
            <label style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={a.is_recurring || false} onChange={(e) => setField("is_recurring", e.target.checked)} /> Abonnement / récurrent
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={cdaStyles.ghostBtn}>Annuler</button>
            <button onClick={() => onSave(a)} style={cdaStyles.primaryBtn}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TvaTab = () => {
  const [list, setList] = React.useState([]);
  React.useEffect(() => { (async () => setList(await window.api.commercialRefs.tvaRates()))(); }, []);
  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div><h1 style={cdaStyles.h1}>Taux de TVA</h1><p style={cdaStyles.sub}>Référentiel utilisé dans les lignes des documents</p></div>
      </header>
      <div style={cdaStyles.list}>
        <div style={cdaStyles.tableHead}><span style={{ flex: "0 0 100px" }}>Taux</span><span style={{ flex: 1 }}>Libellé</span></div>
        {list.map((t) => (
          <div key={t.rate} style={cdaStyles.tableRow}>
            <span style={{ flex: "0 0 100px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "#3730a3" }}>{t.rate}%</span>
            <span style={{ flex: 1, fontSize: 13 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentTab = () => {
  const [list, setList] = React.useState([]);
  React.useEffect(() => { (async () => setList(await window.api.commercialRefs.paymentTerms()))(); }, []);
  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div><h1 style={cdaStyles.h1}>Conditions de paiement</h1><p style={cdaStyles.sub}>Délais proposés sur les factures</p></div>
      </header>
      <div style={cdaStyles.list}>
        <div style={cdaStyles.tableHead}><span style={{ flex: "0 0 120px" }}>Code</span><span style={{ flex: 1 }}>Libellé</span><span style={{ flex: "0 0 100px", textAlign: "right" }}>Jours</span></div>
        {list.map((p) => (
          <div key={p.id} style={cdaStyles.tableRow}>
            <span style={{ flex: "0 0 120px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#3730a3" }}>{p.id}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{p.label}</span>
            <span style={{ flex: "0 0 100px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{p.days || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CountersTab = () => {
  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div><h1 style={cdaStyles.h1}>Numérotation des documents</h1><p style={cdaStyles.sub}>Format : TYPE-AAAA-NNNN (séquence par type, reset annuel)</p></div>
      </header>
      <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 22 }}>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
          La numérotation est gérée par la table <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>commercial_doc_counters</code> :
          un compteur séparé par type (devis/commande/bl/facture) et par année.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { k: "devis",    label: "Devis",     prefix: "DEV", color: "#3b82f6" },
            { k: "commande", label: "Commandes", prefix: "BC",  color: "#a855f7" },
            { k: "bl",       label: "BL",        prefix: "BL",  color: "#ea580c" },
            { k: "facture",  label: "Factures",  prefix: "FAC", color: "#10b981" },
          ].map((t) => (
            <div key={t.k} style={{ border: "1px solid #eef1f5", borderRadius: 8, padding: 14, background: "#fafbfc" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{t.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{t.prefix}-{new Date().getFullYear()}-XXXX</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const cdaStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 220, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #3730a3, #6366f1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  primaryBtn: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" },
  iconBtn: { background: "transparent", border: "1px solid #e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: 5, cursor: "pointer", fontSize: 12 },
  list: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" },
  tableHead: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: "#f8fafc", borderBottom: "1px solid #eef1f5", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: "1px solid #f1f5f9" },
  empty: { padding: 40, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center", color: "#94a3b8", fontSize: 13 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 720, boxShadow: "0 20px 60px rgba(15,23,42,0.4)", overflow: "hidden" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },
};
