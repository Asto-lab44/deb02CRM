// ════════════════════════════════════════════════════════════════════
// Fournisseurs — annuaire fournisseurs Astorya (importé du tableau compta).
// Chaque fournisseur porte une NOTE D'IMPORTANCE pour l'entreprise, dérivée
// de la répartition par coûts annuels (data.cost_bracket) mais réglable à la
// main : stratégique (5★) / important (4★) / standard (3★) / secondaire (2★).
// Table éditable + fiche détaillée : n° de compte, type & délai de paiement,
// boîte mail de réception de la facture, TVA intracom, contacts, notes.
// S'appuie sur window.api.suppliers (Supabase → fallback localStorage).
// ════════════════════════════════════════════════════════════════════
const Fournisseurs = () => {
  const A = window.api && window.api.suppliers;

  // Niveaux d'importance (note) — ordre décroissant.
  const TIERS = [
    { k: "strategique", label: "Stratégique", note: 5, color: "#b91c1c", bg: "#fef2f2", hint: "Achats > 50 000 € / an — dépendance forte" },
    { k: "important",   label: "Important",   note: 4, color: "#c2410c", bg: "#fff7ed", hint: "Achats 10 000 – 50 000 € / an" },
    { k: "standard",    label: "Standard",    note: 3, color: "#a16207", bg: "#fefce8", hint: "Achats 5 000 – 10 000 € / an" },
    { k: "secondaire",  label: "Secondaire",  note: 2, color: "#0369a1", bg: "#f0f9ff", hint: "Achats < 5 000 € / an — ponctuel" },
  ];
  const tierOf = (k) => TIERS.find((t) => t.k === k) || TIERS[3];
  const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [tierF, setTierF] = React.useState("all");
  const [sort, setSort] = React.useState("importance"); // importance | name
  const [edit, setEdit] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!A) { setLoading(false); return; }
    setLoading(true);
    try { setRows(await A.list({ active: true }) || []); }
    catch (e) { console.warn(e); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  const impOf = (r) => (r.data && r.data.importance) || "secondaire";
  const noteOf = (r) => (r.data && r.data.importance_note) || tierOf(impOf(r)).note;

  const filtered = rows
    .filter((r) => tierF === "all" || impOf(r) === tierF)
    .filter((r) => {
      if (!q.trim()) return true;
      const s = (q).toLowerCase();
      const d = r.data || {};
      return [r.name, r.category, d.account_number, d.payment_type, r.payment_terms, d.invoice_mailbox]
        .some((v) => String(v || "").toLowerCase().includes(s));
    })
    .sort((a, b) => sort === "name"
      ? String(a.name).localeCompare(String(b.name))
      : (noteOf(b) - noteOf(a)) || String(a.name).localeCompare(String(b.name)));

  const counts = TIERS.map((t) => ({ ...t, n: rows.filter((r) => impOf(r) === t.k).length }));

  const openNew = () => setEdit({ name: "", category: "", payment_terms: "", data: { importance: "secondaire", importance_note: 2 } });
  const openEdit = (r) => setEdit(JSON.parse(JSON.stringify(r)));

  const setD = (patch) => setEdit((e) => ({ ...e, data: { ...(e.data || {}), ...patch } }));
  const setImportance = (k) => setD({ importance: k, importance_note: tierOf(k).note });

  const save = async () => {
    const e = edit;
    if (!e.name || !e.name.trim()) { (window.HubToast ? window.HubToast.error : alert)("Nom du fournisseur requis"); return; }
    try {
      const payload = { name: e.name.trim(), category: e.category || null, payment_terms: e.payment_terms || null, notes: e.notes || null, data: e.data || {} };
      if (e.id) await A.update(e.id, payload);
      else await A.create(payload);
      setEdit(null); await reload();
      if (window.HubToast) window.HubToast.success("Fournisseur enregistré");
    } catch (err) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (err.message || err)); }
  };
  const remove = async (r) => {
    if (!confirm("Retirer « " + r.name + " » de l'annuaire ?")) return;
    try { await A.remove(r.id); await reload(); } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
  };

  const [importing, setImporting] = React.useState(false);
  const importDefaults = async () => {
    if (!A.importDefaults) return;
    if (!confirm("Importer / compléter l'annuaire depuis le tableau compta (109 fournisseurs) ?\n\nLes fournisseurs existants sont enrichis sans écraser vos saisies ; les manquants sont créés.")) return;
    setImporting(true);
    try {
      const r = await A.importDefaults();
      await reload();
      (window.HubToast ? window.HubToast.success : alert)("Import terminé : " + r.created + " créé(s), " + r.updated + " mis à jour.");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
    setImporting(false);
  };

  return (
    <div style={ST.frame}>
      <header style={ST.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span><span style={{ color: "#0f172a", fontWeight: 600 }}>Fournisseurs</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={importDefaults} disabled={importing} style={{ ...ST.btnGhost, opacity: importing ? 0.6 : 1 }} title="Importer / compléter depuis le tableau compta (109 fournisseurs)">{importing ? "Import…" : "⟳ Importer le tableau compta"}</button>
          <button onClick={openNew} style={ST.btnPrimary}>+ Nouveau fournisseur</button>
        </div>
      </header>

      <div style={ST.titleRow}>
        <div><h1 style={ST.h1}>🏷️ Fournisseurs</h1><p style={ST.sub}>Annuaire fournisseurs classés par importance pour l'entreprise. Cliquez une ligne pour l'éditer.</p></div>
      </div>

      {/* Cartes de répartition par importance (cliquables = filtre) */}
      <div style={{ padding: "10px 28px 4px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <button onClick={() => setTierF("all")} style={{ ...ST.statCard, ...(tierF === "all" ? ST.statOn : {}) }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{rows.length}</div>
          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>Tous</div>
        </button>
        {counts.map((t) => (
          <button key={t.k} onClick={() => setTierF(tierF === t.k ? "all" : t.k)} style={{ ...ST.statCard, background: t.bg, ...(tierF === t.k ? { boxShadow: "0 0 0 2px " + t.color + " inset" } : {}) }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{t.n}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: t.color }}>{t.label} <span style={{ letterSpacing: -1 }}>{"★".repeat(t.note)}</span></div>
          </button>
        ))}
      </div>

      {/* Barre de recherche + tri */}
      <div style={{ padding: "6px 28px 4px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un fournisseur, compte, mode de paiement…" style={{ ...ST.input, flex: 1, minWidth: 240 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...ST.input, width: 190 }}>
          <option value="importance">Trier par importance</option>
          <option value="name">Trier par nom (A→Z)</option>
        </select>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} affiché{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {loading ? <div style={ST.empty}>Chargement…</div> : (
        <div style={{ padding: "10px 28px 60px" }}>
          <div style={{ overflowX: "auto", border: "1px solid #eef1f5", borderRadius: 12, background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
                  <th style={ST.th}>Fournisseur</th>
                  <th style={ST.th}>Importance</th>
                  <th style={ST.th}>Compte</th>
                  <th style={ST.th}>Paiement</th>
                  <th style={ST.th}>Délai</th>
                  <th style={ST.th}>Récup. facture</th>
                  <th style={ST.th}>TVA intracom</th>
                  <th style={{ ...ST.th, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const t = tierOf(impOf(r)); const d = r.data || {};
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => openEdit(r)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                      <td style={{ ...ST.td, fontWeight: 600 }}>{r.name}{r.category ? <span style={{ marginLeft: 6, fontSize: 10, background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 999 }}>{r.category}</span> : null}</td>
                      <td style={ST.td}>
                        <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: t.color, background: t.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                          <span style={{ letterSpacing: -1 }}>{stars(noteOf(r))}</span> {t.label}
                        </span>
                      </td>
                      <td style={{ ...ST.td, fontFamily: "monospace", color: "#475569" }}>{d.account_number || "—"}</td>
                      <td style={ST.td}>{d.payment_type || "—"}</td>
                      <td style={ST.td}>{r.payment_terms || "—"}</td>
                      <td style={{ ...ST.td, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#64748b" }} title={d.invoice_mailbox || ""}>{d.invoice_mailbox || "—"}</td>
                      <td style={{ ...ST.td, textAlign: "center" }}>{d.tva_intracom ? "✔ " + d.tva_intracom : "—"}</td>
                      <td style={{ ...ST.td, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} style={ST.mini}>✎</button>
                        <button onClick={(e) => { e.stopPropagation(); remove(r); }} style={{ ...ST.mini, color: "#dc2626", marginLeft: 4 }}>×</button>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={8} style={ST.empty}>Aucun fournisseur ne correspond.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {edit && (
        <div style={ST.overlay} onClick={() => setEdit(null)}>
          <div style={ST.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>{edit.id ? "Éditer le fournisseur" : "Nouveau fournisseur"}</h2>
            <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "#94a3b8" }}>La note d'importance sert à prioriser le suivi et les relances fournisseurs.</p>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div><label style={ST.lbl}>Nom *</label><input value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} style={ST.input} /></div>
                <div><label style={ST.lbl}>Catégorie</label><input value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} placeholder="Distributeur, SaaS…" style={ST.input} /></div>
              </div>

              {/* Sélecteur d'importance (note) */}
              <div>
                <label style={ST.lbl}>Importance pour l'entreprise (note)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
                  {TIERS.map((t) => {
                    const on = ((edit.data || {}).importance || "secondaire") === t.k;
                    return (
                      <button key={t.k} onClick={() => setImportance(t.k)} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, cursor: "pointer", border: on ? "2px solid " + t.color : "1px solid #e2e8f0", background: on ? t.bg : "#fff" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.color }}>{t.label} <span style={{ letterSpacing: -1 }}>{"★".repeat(t.note)}</span></div>
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{t.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={ST.lbl}>N° de compte</label><input value={(edit.data || {}).account_number || ""} onChange={(e) => setD({ account_number: e.target.value })} placeholder="401XXX" style={ST.input} /></div>
                <div><label style={ST.lbl}>TVA intracom (n°)</label><input value={(edit.data || {}).tva_intracom || ""} onChange={(e) => setD({ tva_intracom: e.target.value })} style={ST.input} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={ST.lbl}>Type de paiement</label><input value={(edit.data || {}).payment_type || ""} onChange={(e) => setD({ payment_type: e.target.value })} placeholder="prélèvement, virement, carte…" style={ST.input} /></div>
                <div><label style={ST.lbl}>Délai de paiement</label><input value={edit.payment_terms || ""} onChange={(e) => setEdit({ ...edit, payment_terms: e.target.value })} placeholder="30 jours FdM…" style={ST.input} /></div>
              </div>
              <div><label style={ST.lbl}>Où récupérer / router la facture</label><textarea value={(edit.data || {}).invoice_mailbox || ""} onChange={(e) => setD({ invoice_mailbox: e.target.value })} rows={2} style={{ ...ST.input, resize: "vertical" }} /></div>
              <div><label style={ST.lbl}>Contacts</label><input value={(edit.data || {}).contacts || ""} onChange={(e) => setD({ contacts: e.target.value })} style={ST.input} /></div>
              <div><label style={ST.lbl}>Notes internes</label><textarea value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={2} style={{ ...ST.input, resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <div>{edit.id && <button onClick={() => { remove(edit); setEdit(null); }} style={{ ...ST.btnGhost, color: "#dc2626" }}>Supprimer</button>}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEdit(null)} style={ST.btnGhost}>Annuler</button>
                <button onClick={save} style={ST.btnPrimary}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ST = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  titleRow: { padding: "20px 28px 6px", background: "#fff" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  btnGhost: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", border: 0, background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  statCard: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: "12px 14px", textAlign: "left", cursor: "pointer" },
  statOn: { boxShadow: "0 0 0 2px #4f46e5 inset" },
  th: { padding: "10px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" },
  td: { padding: "9px 12px", verticalAlign: "middle" },
  mini: { padding: "3px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12.5, fontStyle: "italic" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 12, padding: 22, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto" },
  lbl: { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" },
};

window.Fournisseurs = Fournisseurs;
