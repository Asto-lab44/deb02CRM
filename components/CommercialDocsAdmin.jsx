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
  const [tab, setTab] = React.useState("company");
  return (
    <div style={cdaStyles.frame}>
      <aside style={cdaStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          <div style={cdaStyles.logo}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h2"/></svg>
          </div>
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
          { k: "company",  label: "Société émettrice", icon: "🏢" },
          { k: "articles", label: "Catalogue articles", icon: "📦" },
          { k: "tva",      label: "Taux TVA",           icon: "%" },
          { k: "payment",  label: "Cond. paiement",     icon: "💳" },
          { k: "counters", label: "Numérotation",       icon: "#" },
          { k: "sends",    label: "Audit envois",       icon: "✉" },
        ].map((t) => (
          <div key={t.k} onClick={() => setTab(t.k)} style={{ ...cdaStyles.navItem, ...(tab === t.k ? cdaStyles.navItemActive : {}) }}>
            <span style={{ width: 16, color: tab === t.k ? "#3730a3" : "#94a3b8" }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </aside>
      <main style={cdaStyles.main}>
        {tab === "company"  && <CompanyTab />}
        {tab === "articles" && <ArticlesTab />}
        {tab === "tva"      && <TvaTab />}
        {tab === "payment"  && <PaymentTab />}
        {tab === "counters" && <CountersTab />}
        {tab === "sends"    && <SendsTab />}
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// COMPANY TAB — Coordonnées société émettrice (BDD : commercial_company_settings)
// ─────────────────────────────────────────────────────────────────
const CompanyTab = () => {
  const [c, setC] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { (async () => setC(await window.api.commercialCompany.get()))(); }, []);
  if (!c) return <div style={{ padding: 40, color: "#94a3b8" }}>Chargement…</div>;
  const setField = (k, v) => setC((cur) => ({ ...cur, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      await window.api.commercialCompany.update(c);
      if (window.HubToast) window.HubToast.success("✓ Société enregistrée");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };
  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div>
          <h1 style={cdaStyles.h1}>Société émettrice</h1>
          <p style={cdaStyles.sub}>Coordonnées imprimées sur tous les Devis / Commandes / BL / Factures</p>
        </div>
        <button onClick={save} disabled={saving} style={cdaStyles.primaryBtn}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </header>
      <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 22 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>🏢 Identité légale</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 18 }}>
          <div><label style={cdaStyles.lbl}>Raison sociale</label><input value={c.raison_sociale || ""} onChange={(e) => setField("raison_sociale", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Forme juridique</label>
            <select value={c.forme_juridique || ""} onChange={(e) => setField("forme_juridique", e.target.value)} style={cdaStyles.input}>
              <option value="">—</option><option>SARL</option><option>SAS</option><option>SA</option><option>SASU</option><option>EURL</option><option>EI</option><option>Auto-entrepreneur</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div><label style={cdaStyles.lbl}>Adresse</label><input value={c.adresse || ""} onChange={(e) => setField("adresse", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Code postal</label><input value={c.cp || ""} onChange={(e) => setField("cp", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Ville</label><input value={c.ville || ""} onChange={(e) => setField("ville", e.target.value)} style={cdaStyles.input} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div><label style={cdaStyles.lbl}>Tel</label><input value={c.tel || ""} onChange={(e) => setField("tel", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Email contact</label><input value={c.email || ""} onChange={(e) => setField("email", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Site web</label><input value={c.site_web || ""} onChange={(e) => setField("site_web", e.target.value)} style={cdaStyles.input} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
          <div><label style={cdaStyles.lbl}>SIRET</label><input value={c.siret || ""} onChange={(e) => setField("siret", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>NAF</label><input value={c.naf || ""} onChange={(e) => setField("naf", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>TVA intracom.</label><input value={c.tva_intra || ""} onChange={(e) => setField("tva_intra", e.target.value)} style={cdaStyles.input} /></div>
          <div><label style={cdaStyles.lbl}>Capital (€)</label><input type="number" step="0.01" value={c.capital_eur || ""} onChange={(e) => setField("capital_eur", e.target.value ? Number(e.target.value) : null)} style={cdaStyles.input} /></div>
        </div>

        <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>💳 Coordonnées bancaires</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
          <div><label style={cdaStyles.lbl}>IBAN</label><input value={c.iban || ""} onChange={(e) => setField("iban", e.target.value)} style={{ ...cdaStyles.input, fontFamily: "'JetBrains Mono', monospace" }} /></div>
          <div><label style={cdaStyles.lbl}>BIC</label><input value={c.bic || ""} onChange={(e) => setField("bic", e.target.value)} style={{ ...cdaStyles.input, fontFamily: "'JetBrains Mono', monospace" }} /></div>
          <div><label style={cdaStyles.lbl}>Banque</label><input value={c.banque_nom || ""} onChange={(e) => setField("banque_nom", e.target.value)} style={cdaStyles.input} /></div>
        </div>

        <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>👥 Contacts en pied de page PDF</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { prefix: "commercial", label: "Service Commercial" },
            { prefix: "admin",      label: "Administratif" },
            { prefix: "compta",     label: "Comptabilité" },
          ].map((c2) => (
            <div key={c2.prefix} style={{ border: "1px solid #eef1f5", borderRadius: 7, padding: 12, background: "#fafbfc" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3730a3", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>{c2.label}</div>
              <label style={cdaStyles.lbl}>Nom</label>
              <input value={c["contact_" + c2.prefix + "_nom"] || ""} onChange={(e) => setField("contact_" + c2.prefix + "_nom", e.target.value)} style={{ ...cdaStyles.input, marginBottom: 6 }} />
              <label style={cdaStyles.lbl}>Tel</label>
              <input value={c["contact_" + c2.prefix + "_tel"] || ""} onChange={(e) => setField("contact_" + c2.prefix + "_tel", e.target.value)} style={{ ...cdaStyles.input, marginBottom: 6 }} />
              <label style={cdaStyles.lbl}>Email</label>
              <input value={c["contact_" + c2.prefix + "_email"] || ""} onChange={(e) => setField("contact_" + c2.prefix + "_email", e.target.value)} style={cdaStyles.input} />
            </div>
          ))}
        </div>

        <h3 style={{ margin: "18px 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📝 Mentions & conditions</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={cdaStyles.lbl}>Conditions de paiement par défaut (encart signature)</label>
          <input value={c.conditions_paiement_default || ""} onChange={(e) => setField("conditions_paiement_default", e.target.value)} style={cdaStyles.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={cdaStyles.lbl}>Mention "Réserve de propriété" (pied de page tous docs)</label>
          <textarea value={c.mention_reserve_propriete || ""} onChange={(e) => setField("mention_reserve_propriete", e.target.value)} rows={3} style={{ ...cdaStyles.input, resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={cdaStyles.lbl}>Délai de validité Devis (jours)</label>
          <input type="number" value={c.delai_validite_devis_jours || 30} onChange={(e) => setField("delai_validite_devis_jours", Number(e.target.value))} style={{ ...cdaStyles.input, maxWidth: 120 }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// SENDS TAB — Audit log de tous les envois (BDD : commercial_doc_sends)
// ─────────────────────────────────────────────────────────────────
const SendsTab = () => {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { (async () => {
    try { setList(await window.api.commercialSends.list({}) || []); } catch (e) {}
    setLoading(false);
  })(); }, []);
  return (
    <div>
      <header style={cdaStyles.topbar}>
        <div><h1 style={cdaStyles.h1}>Audit log des envois</h1><p style={cdaStyles.sub}>Trace permanente de tous les documents envoyés / téléchargés / imprimés</p></div>
      </header>
      {loading ? <div style={{ padding: 40, color: "#94a3b8" }}>Chargement…</div> :
       list.length === 0 ? <div style={cdaStyles.empty}>Aucun envoi enregistré.</div> :
        <div style={cdaStyles.list}>
          <div style={cdaStyles.tableHead}>
            <span style={{ flex: "0 0 140px" }}>Date</span>
            <span style={{ flex: "0 0 110px" }}>Doc</span>
            <span style={{ flex: "0 0 70px" }}>Canal</span>
            <span style={{ flex: 1 }}>Destinataire</span>
            <span style={{ flex: "0 0 130px" }}>Envoyé par</span>
            <span style={{ flex: "0 0 90px" }}>Statut</span>
          </div>
          {list.map((s) => (
            <div key={s.id} style={cdaStyles.tableRow}>
              <span style={{ flex: "0 0 140px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#475569" }}>{new Date(s.sent_at).toLocaleString("fr-FR")}</span>
              <span style={{ flex: "0 0 110px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#3730a3", fontWeight: 600 }}>{s.doc_id}</span>
              <span style={{ flex: "0 0 70px", fontSize: 12, color: "#64748b" }}>{s.channel}</span>
              <span style={{ flex: 1, fontSize: 12.5 }}>
                <div style={{ color: "#0f172a", fontWeight: 500 }}>{s.recipient_email || "—"}</div>
                <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject || ""}</div>
              </span>
              <span style={{ flex: "0 0 130px", fontSize: 12, color: "#64748b" }}>{s.sent_by_name || "—"}</span>
              <span style={{ flex: "0 0 90px" }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: s.status === "sent" ? "#dcfce7" : s.status === "failed" ? "#fee2e2" : "#f1f5f9", color: s.status === "sent" ? "#065f46" : s.status === "failed" ? "#991b1b" : "#475569", fontWeight: 600 }}>{s.status}</span>
              </span>
            </div>
          ))}
        </div>
      }
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
    // Validation minimale
    if (!a.ref || !a.ref.trim()) {
      if (window.HubToast) window.HubToast.error("Référence obligatoire");
      return;
    }
    if (!a.name || !a.name.trim()) {
      if (window.HubToast) window.HubToast.error("Désignation obligatoire");
      return;
    }
    if (a.price_ht == null || a.price_ht === "") {
      if (window.HubToast) window.HubToast.error("Prix HT obligatoire (peut être 0)");
      return;
    }
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
  // Couleur exacte de la tuile Accueil "Devis & Factures"
  logo: { width: 36, height: 36, borderRadius: 9, background: "#fef0e6", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" },
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
