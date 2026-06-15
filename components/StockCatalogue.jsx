// ════════════════════════════════════════════════════════════════════
// StockCatalogue — Matrice des achats hebdomadaires
// ════════════════════════════════════════════════════════════════════
//
// Inspiré du tableau Monday "1.0 - Achat hebdomadaire".
//
// 2 vues :
//  1. MATRICE : fournisseurs en colonnes, semaines en lignes,
//     montants HT et nb d'items en cellule (cliquable)
//  2. LISTE   : table détaillée par article avec édition inline du
//     fournisseur, prix d'achat, statuts achat/réception
//
// Source : v_purchase_matrix (extrait des devis acceptés / commandes)
// ════════════════════════════════════════════════════════════════════

const StockCatalogue = () => {
  const [view, setView] = React.useState("list");
  const [rows, setRows] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState({
    article_status: "all",
    supplier: "all",
  });
  const [editing, setEditing] = React.useState(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [r, sup] = await Promise.all([
        window.api.purchaseMatrix.list({ since_days: 90 }),
        window.api.suppliers.list({ active: true }),
      ]);
      setRows(r || []);
      setSuppliers(sup || []);
    } catch (e) { setRows([]); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  // ── Filtres
  const filtered = React.useMemo(() => rows.filter((r) => {
    if (filter.article_status !== "all") {
      const s = deriveArticleStatus(r.purchase_status, r.reception_status);
      if (s !== filter.article_status) return false;
    }
    if (filter.supplier !== "all" && (r.supplier || "") !== filter.supplier) return false;
    return true;
  }), [rows, filter]);

  // ── KPIs
  const kpis = React.useMemo(() => {
    const k = { total_items: filtered.length, total_purchase: 0, total_sell: 0, margin_eur: 0, no_supplier: 0, panier: 0, recu: 0 };
    filtered.forEach((r) => {
      k.total_purchase += r.total_purchase_ht;
      k.total_sell += r.total_sell_ht;
      k.margin_eur += r.margin_eur;
      if (!r.supplier) k.no_supplier++;
      if (r.purchase_status === "panier") k.panier++;
      if (r.reception_status === "ok" || r.reception_status === "en_stock") k.recu++;
    });
    k.margin_pct = k.total_purchase > 0 ? (k.margin_eur / k.total_purchase * 100) : 0;
    return k;
  }, [filtered]);

  // ── Matrice : { "YYYY-WW": { supplierName: { items, total_purchase, total_sell } } }
  const matrix = React.useMemo(() => {
    const m = {};
    const weeksSet = new Set();
    const suppliersSet = new Set();
    filtered.forEach((r) => {
      const week = r.year_number + "-W" + String(r.week_number).padStart(2, "0");
      const sup = r.supplier || "— Non assigné —";
      weeksSet.add(week);
      suppliersSet.add(sup);
      if (!m[week]) m[week] = {};
      if (!m[week][sup]) m[week][sup] = { items: 0, total_purchase: 0, total_sell: 0, margin: 0, rows: [] };
      const cell = m[week][sup];
      cell.items += 1;
      cell.total_purchase += r.total_purchase_ht;
      cell.total_sell += r.total_sell_ht;
      cell.margin += r.margin_eur;
      cell.rows.push(r);
    });
    return {
      data: m,
      weeks: Array.from(weeksSet).sort((a, b) => b.localeCompare(a)),
      suppliers: Array.from(suppliersSet).sort((a, b) => {
        if (a.startsWith("—")) return 1;
        if (b.startsWith("—")) return -1;
        return a.localeCompare(b);
      }),
    };
  }, [filtered]);

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
  const fmtEURP = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div style={scStyles.frame}>
      {/* SIDEBAR */}
      <aside style={scStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={scStyles.logo}>H</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Stock & Catalogue</div>
          </div>
        </a>

        <div style={scStyles.navLabel}>Vue</div>
        {[
          { k: "matrix", label: "📊 Matrice fournisseurs" },
          { k: "list",   label: "📋 Liste détaillée" },
        ].map((v) => (
          <div key={v.k} onClick={() => setView(v.k)}
               style={{ ...scStyles.navItem, ...(view === v.k ? scStyles.navItemActive : {}) }}>
            <span>{v.label}</span>
          </div>
        ))}

        <div style={scStyles.navLabel}>Statut article</div>
        {[
          { k: "all",       label: "Tous" },
          { k: "panier",    label: "🛒 Panier" },
          { k: "demande",   label: "📤 Demande envoyée" },
          { k: "transmis",  label: "📨 Panier transmis" },
          { k: "commande",  label: "✅ Commandé" },
          { k: "partielle", label: "◐ Réception partielle" },
          { k: "recu",      label: "✓ Reçu" },
          { k: "en_stock",  label: "📦 En stock" },
          { k: "bloque",    label: "⛔ Bloqué" },
          { k: "differe",   label: "⏸ Différé" },
        ].map((s) => {
          const count = s.k === "all" ? rows.length : rows.filter((r) => deriveArticleStatus(r.purchase_status, r.reception_status) === s.k).length;
          return (
            <div key={s.k} onClick={() => setFilter((f) => ({ ...f, article_status: s.k }))}
                 style={{ ...scStyles.navItem, ...(filter.article_status === s.k ? scStyles.navItemActive : {}) }}>
              <span style={{ flex: 1 }}>{s.label}</span>
              <span style={scStyles.navCount}>{count}</span>
            </div>
          );
        })}
      </aside>

      <main style={scStyles.main}>
        <header style={scStyles.topbar}>
          <div>
            <h1 style={scStyles.h1}>Stock & Catalogue</h1>
            <p style={scStyles.sub}>Achats hebdomadaires — lignes des devis acceptés / commandes en cours</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                if (!confirm("Purger les données locales de test ?\n\nVa effacer :\n• Compteurs de numérotation locaux\n• Cache des docs commerciaux\n• Cache des projets\n• Cache des envois\n\n⚠ Ne touche PAS à la BDD Supabase — il faut exécuter sql/PURGE_test_data.sql en plus.")) return;
                try {
                  ["hubAstorya.commercial_docs.v1", "hubAstorya.cdoc_counters.v1", "hubAstorya.commercial_doc_sends.v1", "hubAstorya.projects.v1", "hubAstorya.commercial_articles.v1"].forEach((k) => localStorage.removeItem(k));
                  if (window.HubToast) window.HubToast.success("✓ Cache local purgé — recharge la page");
                  setTimeout(() => location.reload(), 600);
                } catch (e) {}
              }}
              style={{ ...scStyles.ghostBtn, color: "#dc2626", borderColor: "#fecaca" }}
              title="Purge le cache localStorage du navigateur (ne touche pas la BDD)"
            >🗑 Purger cache local</button>
            <button onClick={reload} style={scStyles.primaryBtn}>↻ Rafraîchir</button>
          </div>
        </header>

        {/* KPIs */}
        <div style={scStyles.kpiRow}>
          <KPI label="🛒 Articles à acheter" value={kpis.total_items} color="#0ea5e9" />
          <KPI label="Total achat HT" value={fmtEUR(kpis.total_purchase)} color="#dc2626" />
          <KPI label="Total vente HT" value={fmtEUR(kpis.total_sell)} color="#10b981" />
          <KPI label="Marge prévue" value={fmtEUR(kpis.margin_eur)} sub={(kpis.margin_pct || 0).toFixed(1) + " %"} color="#a855f7" />
          <KPI label="⚠ Sans fournisseur" value={kpis.no_supplier} color="#f59e0b" />
        </div>

        {loading && rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={scStyles.empty}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Aucun article à acheter</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              Cette page agrège les <strong>lignes des devis acceptés et des commandes</strong>.<br/>
              Crée un devis dans Gestion Commerciale, fais-le passer en « Accepté »,<br/>
              et ses lignes apparaîtront ici pour être achetées chez tes fournisseurs.
            </div>
          </div>
        ) : view === "matrix" ? (
          <MatrixView matrix={matrix} fmtEUR={fmtEUR} onCellClick={(rows) => setEditing({ type: "cell", rows })} />
        ) : (
          <ListView rows={filtered} suppliers={suppliers} fmtEUR={fmtEUR} fmtEURP={fmtEURP} onEdit={(r) => setEditing({ type: "line", row: r })} onReload={reload} />
        )}
      </main>

      {editing && editing.type === "line" && (
        <EditLineModal row={editing.row} suppliers={suppliers} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
      {editing && editing.type === "cell" && (
        <CellDetailModal rows={editing.rows} fmtEUR={fmtEURP} onClose={() => setEditing(null)} onOpenLine={(r) => setEditing({ type: "line", row: r })} />
      )}
    </div>
  );
};

const KPI = ({ label, value, color, sub }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || "#0f172a", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MATRICE — fournisseurs × semaines
// ─────────────────────────────────────────────────────────────────
const MatrixView = ({ matrix, fmtEUR, onCellClick }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ ...scStyles.matrixHead, position: "sticky", left: 0, zIndex: 2, background: "#f8fafc", minWidth: 110 }}>Semaine</th>
            {matrix.suppliers.map((sup) => (
              <th key={sup} style={scStyles.matrixHead}>{sup}</th>
            ))}
            <th style={{ ...scStyles.matrixHead, background: "#0f172a", color: "#fff" }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {matrix.weeks.map((week) => {
            const rowData = matrix.data[week] || {};
            let weekTotal = 0;
            matrix.suppliers.forEach((sup) => { if (rowData[sup]) weekTotal += rowData[sup].total_purchase; });
            return (
              <tr key={week}>
                <td style={{ ...scStyles.matrixCell, position: "sticky", left: 0, background: "#fff", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{week}</td>
                {matrix.suppliers.map((sup) => {
                  const cell = rowData[sup];
                  if (!cell) return <td key={sup} style={scStyles.matrixCellEmpty}>—</td>;
                  return (
                    <td key={sup} onClick={() => onCellClick(cell.rows)} style={{ ...scStyles.matrixCell, cursor: "pointer", background: cell.margin > 0 ? "#ecfdf5" : "#fef2f2", borderLeft: "2px solid " + (cell.margin > 0 ? "#10b981" : "#dc2626") }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(cell.total_purchase)}</div>
                      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{cell.items} ligne(s) · vente {fmtEUR(cell.total_sell)}</div>
                    </td>
                  );
                })}
                <td style={{ ...scStyles.matrixCell, fontWeight: 700, background: "#f8fafc", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(weekTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// LISTE — table détaillée éditable
// ─────────────────────────────────────────────────────────────────
// ─── Statut unifié de l'article (fusion Achat × Réception) ───
// Cycle de vie : panier → demande → transmis → commande →
//                (partielle | recu | en_stock) | bloque | differe | na
const ARTICLE_STATUS = {
  panier:    { label: "🛒 Panier",              color: "#0c4a6e", bg: "#e0f2fe", order: 1 },
  demande:   { label: "📤 Demande envoyée",      color: "#9f1239", bg: "#ffe4e6", order: 2 },
  transmis:  { label: "📨 Panier transmis",      color: "#075985", bg: "#dbeafe", order: 3 },
  commande:  { label: "✅ Commandé",              color: "#854d0e", bg: "#fef3c7", order: 4 },
  partielle: { label: "◐ Réception partielle",   color: "#6b21a8", bg: "#f3e8ff", order: 5 },
  recu:      { label: "✓ Reçu",                  color: "#0d9488", bg: "#ccfbf1", order: 6 },
  en_stock:  { label: "📦 En stock",             color: "#075985", bg: "#dbeafe", order: 7 },
  bloque:    { label: "⛔ Bloqué",               color: "#991b1b", bg: "#fee2e2", order: 99 },
  differe:   { label: "⏸ Différé",              color: "#9f1239", bg: "#ffe4e6", order: 99 },
  na:        { label: "N/A",                     color: "#475569", bg: "#f1f5f9", order: 99 },
};

// Dérive le statut unifié depuis les 2 colonnes existantes (rétrocompat).
const deriveArticleStatus = (purchase, reception) => {
  if (reception === "bloque") return "bloque";
  if (reception === "differe") return "differe";
  if (reception === "na") return "na";
  if (reception === "en_stock") return "en_stock";
  if (reception === "ok") return "recu";
  if (reception === "partielle") return "partielle";
  return purchase || "panier";
};

// Convertit un statut unifié en patch {purchase_status, reception_status}.
const applyArticleStatus = (status) => {
  switch (status) {
    case "panier":    return { purchase_status: "panier",    reception_status: "en_cours" };
    case "demande":   return { purchase_status: "demande",   reception_status: "en_cours" };
    case "transmis":  return { purchase_status: "transmis",  reception_status: "en_cours" };
    case "commande":  return { purchase_status: "commande",  reception_status: "en_cours" };
    case "partielle": return { purchase_status: "commande",  reception_status: "partielle" };
    case "recu":      return { purchase_status: "commande",  reception_status: "ok" };
    case "en_stock":  return { purchase_status: "commande",  reception_status: "en_stock" };
    case "bloque":    return { purchase_status: "commande",  reception_status: "bloque" };
    case "differe":   return { purchase_status: "commande",  reception_status: "differe" };
    case "na":        return { purchase_status: "commande",  reception_status: "na" };
    default:          return { purchase_status: "panier",    reception_status: "en_cours" };
  }
};

// ─────────────────────────────────────────────────────────────────
// EditableRow — chaque ligne avec édition inline directe
// ─────────────────────────────────────────────────────────────────
const EditableRow = ({ r, suppliers, fmtEURP, onUpdated }) => {
  const [local, setLocal] = React.useState(r);
  const [saving, setSaving] = React.useState(null);
  // Champs en cours de saisie : on n'écrase pas local depuis r tant que l'utilisateur tape.
  const dirtyRef = React.useRef(new Set());
  React.useEffect(() => {
    // Sync local depuis r SAUF pour les champs en cours de saisie
    setLocal((cur) => {
      const next = { ...r };
      dirtyRef.current.forEach((k) => { next[k] = cur[k]; });
      return next;
    });
  }, [r.line_id, r.purchase_price_ht, r.supplier, r.purchase_status, r.reception_status]);

  const doSave = async (patch) => {
    setSaving(Object.keys(patch)[0]);
    try {
      await window.api.purchaseMatrix.updateLine(r.line_id, patch);
      Object.keys(patch).forEach((k) => dirtyRef.current.delete(k));
      if (onUpdated) onUpdated();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Sauvegarde : " + (e.message || e));
    }
    setSaving(null);
  };

  // Saisie locale uniquement (pas de sauvegarde auto). Marque le champ comme « dirty ».
  const typeField = (k, v) => {
    dirtyRef.current.add(k);
    setLocal((cur) => ({ ...cur, [k]: v }));
  };
  // Save immédiat (pour les select : status, supplier, reception, etc.)
  const updateField = (k, v) => {
    setLocal((cur) => ({ ...cur, [k]: v }));
    doSave({ [k]: v });
  };
  // Save au blur uniquement si la valeur a changé
  const blurSave = (k) => {
    if (!dirtyRef.current.has(k)) return;
    doSave({ [k]: local[k] });
  };

  const articleStatusKey = deriveArticleStatus(local.purchase_status, local.reception_status);
  const as = ARTICLE_STATUS[articleStatusKey] || ARTICLE_STATUS.panier;
  const purchaseN = Number(local.purchase_price_ht) || 0;
  const sellN = Number(r.sell_price_ht) || 0;
  const marginPct = purchaseN > 0 ? (sellN - purchaseN) / purchaseN * 100 : null;

  const cellInput = { padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box", width: "100%" };

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={scStyles.td}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{r.designation || r.ref || "—"}</div>
        {r.ref && <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{r.ref}</div>}
      </td>
      <td style={scStyles.td}>
        <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{r.client_name || "—"}</div>
        <div style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: "#3730a3" }}>{r.doc_ref}</div>
      </td>
      <td style={{ ...scStyles.td, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{r.quantity}</td>
      <td style={{ ...scStyles.td, padding: "6px 8px" }}>
        <input type="number" step="0.01" value={local.purchase_price_ht == null ? "" : local.purchase_price_ht} placeholder="—"
               onChange={(e) => typeField("purchase_price_ht", e.target.value === "" ? null : Number(e.target.value))}
               onBlur={() => blurSave("purchase_price_ht")}
               onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
               title="Tape le prix puis appuie sur Entrée ou clique ailleurs pour sauvegarder"
               style={{ ...cellInput, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, borderColor: !local.purchase_price_ht ? "#fca5a5" : (dirtyRef.current.has("purchase_price_ht") ? "#f59e0b" : "#e2e8f0"), background: !local.purchase_price_ht ? "#fef2f2" : (dirtyRef.current.has("purchase_price_ht") ? "#fffbeb" : "#fff") }} />
        {saving === "purchase_price_ht" && <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "right", marginTop: 2 }}>💾</div>}
        {dirtyRef.current.has("purchase_price_ht") && saving !== "purchase_price_ht" && <div style={{ fontSize: 9, color: "#b45309", textAlign: "right", marginTop: 2 }}>✎ non sauvegardé</div>}
      </td>
      <td style={{ ...scStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#10b981" }}>
        {fmtEURP(r.sell_price_ht)}
      </td>
      <td style={{ ...scStyles.td, textAlign: "right" }}>
        {marginPct != null ? (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: marginPct >= 20 ? "#10b981" : marginPct >= 10 ? "#f59e0b" : "#dc2626" }}>
            {marginPct.toFixed(1)} %
          </div>
        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
      </td>
      <td style={{ ...scStyles.td, padding: "6px 8px", minWidth: 160 }}>
        <select value={local.supplier || ""}
                onChange={(e) => updateField("supplier", e.target.value || null)}
                style={{ ...cellInput, borderColor: !local.supplier ? "#fca5a5" : "#e2e8f0", color: !local.supplier ? "#dc2626" : "#0f172a", fontWeight: 600 }}>
          <option value="">⚠ À assigner</option>
          {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </td>
      <td style={{ ...scStyles.td, padding: "6px 8px", minWidth: 180 }}>
        <select value={articleStatusKey}
                onChange={(e) => {
                  const patch = applyArticleStatus(e.target.value);
                  setLocal((cur) => ({ ...cur, ...patch }));
                  doSave(patch);
                }}
                style={{ ...cellInput, background: as.bg, color: as.color, fontWeight: 600, borderColor: as.bg }}>
          <option value="panier">🛒 Panier</option>
          <option value="demande">📤 Demande envoyée</option>
          <option value="transmis">📨 Panier transmis</option>
          <option value="commande">✅ Commandé</option>
          <option value="partielle">◐ Réception partielle</option>
          <option value="recu">✓ Reçu</option>
          <option value="en_stock">📦 En stock</option>
          <option value="bloque">⛔ Bloqué</option>
          <option value="differe">⏸ Différé</option>
          <option value="na">N/A</option>
        </select>
      </td>
    </tr>
  );
};

// Cellule date d'achat sur la ligne parent du groupe : édite la date
// d'achat de TOUTES les lignes du devis simultanément.
const GroupDateCell = ({ g, defaultDate, onReload }) => {
  // Date actuelle : si toutes les lignes ont la même purchase_date explicite, on l'affiche ;
  // sinon on prend la première date explicite trouvée ; sinon le défaut (jeudi suivant).
  const explicit = g.lines.map((l) => l.purchase_date ? String(l.purchase_date).slice(0, 10) : null).filter(Boolean);
  const uniq = Array.from(new Set(explicit));
  const isMixed = uniq.length > 1;
  const value = uniq[0] || defaultDate || "";
  const isCustom = !!uniq[0];
  const [local, setLocal] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setLocal(value); }, [value]);

  const onChange = async (newDate) => {
    setLocal(newDate);
    setSaving(true);
    try {
      await Promise.all(g.lines.map((l) =>
        window.api.purchaseMatrix.updateLine(l.line_id, { purchase_date: newDate || null })
      ));
      if (window.HubToast) window.HubToast.success("✓ Date achat appliquée à " + g.lines.length + " article(s)");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };

  const cellInput = { padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", background: "#fff", boxSizing: "border-box", width: "100%" };
  return (
    <div>
      <input type="date"
             value={local || ""}
             onChange={(e) => onChange(e.target.value || null)}
             title={isMixed ? "⚠ Les articles ont des dates différentes — modifier applique à tous" : (isCustom ? "Date personnalisée" : "Défaut = jeudi suivant la validation du devis (" + (defaultDate || "—") + ")")}
             style={{ ...cellInput,
                      borderColor: isMixed ? "#f59e0b" : (isCustom ? "#a855f7" : "#e2e8f0"),
                      background: isMixed ? "#fffbeb" : (isCustom ? "#faf5ff" : "#fff"),
                      color: isMixed ? "#92400e" : (isCustom ? "#7e22ce" : "#0f172a"),
                      fontWeight: (isCustom || isMixed) ? 600 : 400 }} />
      {!isCustom && !isMixed && (
        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, textAlign: "center" }}>📌 jeudi par défaut</div>
      )}
      {isMixed && (
        <div style={{ fontSize: 9, color: "#b45309", marginTop: 2, textAlign: "center" }}>⚠ dates mixtes</div>
      )}
      {saving && <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center" }}>💾</div>}
    </div>
  );
};

const ListView = ({ rows, suppliers, fmtEUR, fmtEURP, onEdit, onReload }) => {
  const [expanded, setExpanded] = React.useState({});
  const toggle = (k) => setExpanded((cur) => ({ ...cur, [k]: !cur[k] }));

  // Regroupe les lignes par devis/commande
  const groups = React.useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      const k = r.doc_ref;
      if (!map.has(k)) {
        map.set(k, {
          doc_ref: r.doc_ref,
          doc_number: r.doc_number,
          doc_type: r.doc_type,
          doc_status: r.doc_status,
          doc_title: r.doc_title,
          doc_date: r.doc_date,
          client_name: r.client_name,
          opportunity_id: r.opportunity_id,
          lines: [],
        });
      }
      map.get(k).lines.push(r);
    });
    // Tri stable : doc_date desc, puis doc_ref pour départager (jamais
    // basé sur le total acheté ou la quantité, pour que l'ordre des groupes
    // ne change pas quand l'utilisateur modifie un PU).
    const out = Array.from(map.values()).sort((a, b) => {
      const d = String(b.doc_date || "").localeCompare(String(a.doc_date || ""));
      if (d !== 0) return d;
      return String(a.doc_ref).localeCompare(String(b.doc_ref));
    });
    // Tri stable des articles à l'intérieur de chaque groupe (line_id)
    out.forEach((g) => {
      g.lines.sort((a, b) => String(a.line_id).localeCompare(String(b.line_id)));
    });
    return out;
  }, [rows]);

  if (!rows || !rows.length) {
    return (
      <div style={{ padding: 50, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center", color: "#94a3b8" }}>
        Aucun article à afficher avec les filtres actuels.
      </div>
    );
  }

  const TYPE_META = {
    devis:    { icon: "📄", label: "Devis",    color: "#1d4ed8", bg: "#dbeafe" },
    commande: { icon: "📋", label: "Commande", color: "#7c3aed", bg: "#f3e8ff" },
    facture:  { icon: "🧾", label: "Facture",  color: "#0e7490", bg: "#cffafe" },
    bl:       { icon: "📦", label: "BL",        color: "#9a3412", bg: "#ffedd5" },
  };

  // Suivi global statut article du devis (fusion achat × réception)
  const articleStatusSummary = (lines) => {
    const total = lines.length;
    const statuses = lines.map((l) => deriveArticleStatus(l.purchase_status, l.reception_status));
    const blocked = statuses.filter((s) => s === "bloque").length;
    if (blocked > 0) {
      const meta = ARTICLE_STATUS.bloque;
      return { label: "⛔ " + blocked + "/" + total + " bloqué(s)", color: meta.color, bg: meta.bg };
    }
    const minOrder = Math.min.apply(null, statuses.map((s) => (ARTICLE_STATUS[s] && ARTICLE_STATUS[s].order) || 1));
    const minStatus = Object.keys(ARTICLE_STATUS).find((k) => ARTICLE_STATUS[k].order === minOrder) || "panier";
    const meta = ARTICLE_STATUS[minStatus];
    const sameCount = statuses.filter((s) => s === minStatus).length;
    if (sameCount === total) {
      return { label: meta.label + (total > 1 ? " (×" + total + ")" : ""), color: meta.color, bg: meta.bg };
    }
    return { label: meta.label + " " + sameCount + "/" + total, color: meta.color, bg: meta.bg };
  };
  // Calcule le jeudi suivant la date de validation du devis (date du doc).
  // Si le doc est validé un jeudi, on garde le même jour.
  const nextThursday = (isoDate) => {
    if (!isoDate) return null;
    const d = new Date(String(isoDate).slice(0, 10));
    if (isNaN(d)) return null;
    const day = d.getDay(); // 0=Dim, 4=Jeu
    const add = (4 - day + 7) % 7;
    d.setDate(d.getDate() + add);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1280 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ ...scStyles.thHead, width: 32 }}></th>
            <th style={scStyles.thHead}>Document</th>
            <th style={scStyles.thHead}>Client</th>
            <th style={{ ...scStyles.thHead, textAlign: "center" }}>Articles</th>
            <th style={{ ...scStyles.thHead, textAlign: "center", minWidth: 140 }}>📅 Date achat</th>
            <th style={{ ...scStyles.thHead, textAlign: "right" }}>Total Achat HT</th>
            <th style={{ ...scStyles.thHead, textAlign: "right" }}>Total Vente HT</th>
            <th style={{ ...scStyles.thHead, textAlign: "right" }}>Marge</th>
            <th style={scStyles.thHead}>Statut article</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = !!expanded[g.doc_ref];
            const tm = TYPE_META[g.doc_type] || { icon: "📄", label: g.doc_type, color: "#475569", bg: "#f1f5f9" };
            const totalAchat = g.lines.reduce((s, l) => s + (Number(l.purchase_price_ht) || 0) * (Number(l.quantity) || 0), 0);
            const totalVente = g.lines.reduce((s, l) => s + (Number(l.sell_price_ht) || 0) * (Number(l.quantity) || 0), 0);
            const marge = totalVente - totalAchat;
            const margePct = totalAchat > 0 ? (marge / totalAchat) * 100 : null;
            const as = articleStatusSummary(g.lines);
            return (
              <React.Fragment key={g.doc_ref}>
                <tr onClick={() => toggle(g.doc_ref)}
                    style={{ borderBottom: "1px solid #e2e8f0", background: isOpen ? "#f8fafc" : "#fff", cursor: "pointer" }}>
                  <td style={{ ...scStyles.td, textAlign: "center", fontSize: 14, color: "#475569" }}>
                    {isOpen ? "▼" : "▶"}
                  </td>
                  <td style={scStyles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: tm.bg, color: tm.color }}>
                        {tm.icon} {tm.label}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a" }}>
                        {g.doc_number || g.doc_ref.slice(0, 8)}
                      </span>
                    </div>
                    {g.doc_title && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{g.doc_title}</div>}
                    {g.doc_date && <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>📅 {String(g.doc_date).slice(0, 10)}</div>}
                  </td>
                  <td style={scStyles.td}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{g.client_name || "—"}</div>
                  </td>
                  <td style={{ ...scStyles.td, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#0f172a" }}>
                    {g.lines.length}
                  </td>
                  <td style={{ ...scStyles.td, padding: "6px 8px", minWidth: 140 }} onClick={(e) => e.stopPropagation()}>
                    <GroupDateCell g={g} defaultDate={nextThursday(g.doc_date)} onReload={onReload} />
                  </td>
                  <td style={{ ...scStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#dc2626" }}>
                    {fmtEURP ? fmtEURP(totalAchat) : totalAchat.toFixed(2)}
                  </td>
                  <td style={{ ...scStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#10b981" }}>
                    {fmtEURP ? fmtEURP(totalVente) : totalVente.toFixed(2)}
                  </td>
                  <td style={{ ...scStyles.td, textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: marge >= 0 ? "#10b981" : "#dc2626" }}>
                      {fmtEURP ? fmtEURP(marge) : marge.toFixed(2)}
                    </div>
                    {margePct != null && (
                      <div style={{ fontSize: 10.5, color: margePct >= 20 ? "#10b981" : margePct >= 10 ? "#f59e0b" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                        {margePct.toFixed(1)} %
                      </div>
                    )}
                  </td>
                  <td style={scStyles.td}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: as.bg, color: as.color, whiteSpace: "nowrap" }}>
                      {as.label}
                    </span>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={9} style={{ padding: 0, background: "#fafbfc", borderBottom: "1px solid #e2e8f0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#eef2f7" }}>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5 }}>Article</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5 }}>Client / Doc</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5, textAlign: "center" }}>Qté</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5, textAlign: "right" }}>PU Acheté</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5, textAlign: "right" }}>PU Vendu</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5, textAlign: "right" }}>Marge</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5 }}>Fournisseur</th>
                            <th style={{ ...scStyles.thHead, fontSize: 10.5 }}>Statut article</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.lines.map((r) => (
                            <EditableRow key={r.line_id} r={r} suppliers={suppliers} fmtEURP={fmtEURP} onUpdated={onReload} />
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MODAL — Édition d'une ligne d'achat
// ─────────────────────────────────────────────────────────────────
const EditLineModal = ({ row, suppliers, onClose, onSaved }) => {
  const [d, setD] = React.useState({ ...row });
  const [saving, setSaving] = React.useState(false);
  const setF = (k, v) => setD((cur) => ({ ...cur, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await window.api.purchaseMatrix.updateLine(row.line_id, {
        supplier: d.supplier || null,
        supplier_ref: d.supplier_ref || null,
        purchase_price_ht: d.purchase_price_ht ? Number(d.purchase_price_ht) : null,
        purchase_status: d.purchase_status,
        reception_status: d.reception_status,
        received_at: d.reception_status === "ok" || d.reception_status === "en_stock"
          ? (d.received_at || new Date().toISOString())
          : d.received_at,
        serial_number: d.serial_number || null,
        purchase_date: d.purchase_date || null,
      });
      if (window.HubToast) window.HubToast.success("✓ Ligne mise à jour");
      onSaved();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSaving(false);
  };

  return (
    <div style={scStyles.modalOverlay} onClick={onClose}>
      <div style={scStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <header style={scStyles.modalHead}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 700 }}>Article à acheter</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{row.designation || row.ref}</h2>
          </div>
          <button onClick={onClose} style={scStyles.closeBtn}>×</button>
        </header>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #eef1f5" }}>
            <div><span style={scStyles.miniLbl}>Client</span><div>{row.client_name || "—"}</div></div>
            <div><span style={scStyles.miniLbl}>Doc</span><div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3730a3" }}>{row.doc_ref}</div></div>
            <div><span style={scStyles.miniLbl}>Quantité</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{row.quantity} {row.unit || "u"}</div></div>
            <div><span style={scStyles.miniLbl}>Prix de vente HT</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981" }}>{(Number(row.sell_price_ht) || 0).toFixed(2)} €</div></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={scStyles.lbl}>Fournisseur *</label>
              <select value={d.supplier || ""} onChange={(e) => setF("supplier", e.target.value)} style={scStyles.input}>
                <option value="">— À assigner —</option>
                {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}{s.category ? " · " + s.category : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={scStyles.lbl}>Référence fournisseur</label>
              <input value={d.supplier_ref || ""} onChange={(e) => setF("supplier_ref", e.target.value)} placeholder="Code article chez le fournisseur" style={scStyles.input} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={scStyles.lbl}>Prix d'achat HT *</label>
              <input type="number" step="0.01" value={d.purchase_price_ht || ""} onChange={(e) => setF("purchase_price_ht", e.target.value)} placeholder="0.00" style={scStyles.input} />
              {d.purchase_price_ht && row.sell_price_ht ? (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Marge : <strong style={{ color: ((row.sell_price_ht - d.purchase_price_ht) / d.purchase_price_ht) * 100 >= 20 ? "#10b981" : "#dc2626" }}>
                    {(((row.sell_price_ht - d.purchase_price_ht) / d.purchase_price_ht) * 100).toFixed(1)} %
                  </strong>
                </div>
              ) : null}
            </div>
            <div style={{ gridColumn: "1 / span 2" }}>
              <label style={scStyles.lbl}>Statut article</label>
              <select value={deriveArticleStatus(d.purchase_status, d.reception_status)}
                      onChange={(e) => {
                        const patch = applyArticleStatus(e.target.value);
                        setD((cur) => ({ ...cur, ...patch }));
                      }}
                      style={scStyles.input}>
                <option value="panier">🛒 Panier</option>
                <option value="demande">📤 Demande envoyée</option>
                <option value="transmis">📨 Panier transmis</option>
                <option value="commande">✅ Commandé</option>
                <option value="partielle">◐ Réception partielle</option>
                <option value="recu">✓ Reçu</option>
                <option value="en_stock">📦 En stock</option>
                <option value="bloque">⛔ Bloqué</option>
                <option value="differe">⏸ Différé</option>
                <option value="na">N/A</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={scStyles.lbl}>Date achat prévue</label>
              <input type="date" value={d.purchase_date ? String(d.purchase_date).slice(0, 10) : ""} onChange={(e) => setF("purchase_date", e.target.value)} style={scStyles.input} />
            </div>
            <div>
              <label style={scStyles.lbl}>N° de série (après réception)</label>
              <input value={d.serial_number || ""} onChange={(e) => setF("serial_number", e.target.value)} placeholder="SN" style={scStyles.input} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={scStyles.ghostBtn}>Annuler</button>
            <button onClick={save} disabled={saving} style={scStyles.primaryBtn}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MODAL — Détail d'une cellule de la matrice
// ─────────────────────────────────────────────────────────────────
const CellDetailModal = ({ rows, fmtEUR, onClose, onOpenLine }) => (
  <div style={scStyles.modalOverlay} onClick={onClose}>
    <div style={{ ...scStyles.modalCard, maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
      <header style={scStyles.modalHead}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📦 {rows.length} article(s) à acheter</h2>
        <button onClick={onClose} style={scStyles.closeBtn}>×</button>
      </header>
      <div style={{ padding: 18, maxHeight: "70vh", overflowY: "auto" }}>
        {rows.map((r) => (
          <div key={r.line_id} onClick={() => onOpenLine(r)} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.designation}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{r.client_name} · {r.doc_ref} · Qté {r.quantity}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#dc2626" }}>{fmtEUR(r.total_purchase_ht)}</div>
              <div style={{ fontSize: 10.5, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>vente {fmtEUR(r.total_sell_ht)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const scStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 240, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #0e7490, #0891b2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 14, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#cffafe", color: "#155e75", fontWeight: 600 },
  navCount: { fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },

  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  primaryBtn: { padding: "8px 14px", background: "#0891b2", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" },

  kpiRow: { display: "flex", gap: 10, marginBottom: 16 },
  empty: { padding: 60, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center" },

  matrixHead: { padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.4, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" },
  matrixCell: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", fontSize: 12 },
  matrixCellEmpty: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", fontSize: 12, color: "#cbd5e1", textAlign: "center" },

  thHead: { padding: "10px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eef1f5", textAlign: "left" },
  td: { padding: "10px 12px", fontSize: 12.5 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 760, boxShadow: "0 20px 60px rgba(15,23,42,0.4)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 },
  miniLbl: { display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },
};
