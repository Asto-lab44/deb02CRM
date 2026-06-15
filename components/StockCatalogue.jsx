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
    purchase_status: "all",
    reception_status: "all",
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
    if (filter.purchase_status !== "all" && r.purchase_status !== filter.purchase_status) return false;
    if (filter.reception_status !== "all" && r.reception_status !== filter.reception_status) return false;
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

        <div style={scStyles.navLabel}>Statut achat</div>
        {[
          { k: "all",         label: "Tous" },
          { k: "panier",      label: "🛒 Panier",         color: "#a1e3f6" },
          { k: "demande",     label: "📤 Demande envoyée", color: "#ff7575" },
          { k: "transmis",    label: "📨 Panier transmis", color: "#66ccff" },
          { k: "commande",    label: "✅ Commandé",        color: "#bca58a" },
        ].map((s) => {
          const count = s.k === "all" ? rows.length : rows.filter((r) => r.purchase_status === s.k).length;
          return (
            <div key={s.k} onClick={() => setFilter((f) => ({ ...f, purchase_status: s.k }))}
                 style={{ ...scStyles.navItem, ...(filter.purchase_status === s.k ? scStyles.navItemActive : {}) }}>
              <span style={{ flex: 1 }}>{s.label}</span>
              <span style={scStyles.navCount}>{count}</span>
            </div>
          );
        })}

        <div style={scStyles.navLabel}>Réception</div>
        {[
          { k: "all",       label: "Toutes" },
          { k: "en_cours",  label: "⏳ En cours" },
          { k: "ok",        label: "✓ Réception OK" },
          { k: "en_stock",  label: "📦 En stock" },
          { k: "partielle", label: "◐ Partielle" },
          { k: "bloque",    label: "⛔ Bloqué" },
        ].map((s) => {
          const count = s.k === "all" ? rows.length : rows.filter((r) => r.reception_status === s.k).length;
          return (
            <div key={s.k} onClick={() => setFilter((f) => ({ ...f, reception_status: s.k }))}
                 style={{ ...scStyles.navItem, ...(filter.reception_status === s.k ? scStyles.navItemActive : {}) }}>
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

        {loading ? (
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
const PURCHASE_STATUS = {
  panier:   { label: "🛒 Panier",          color: "#0c4a6e", bg: "#e0f2fe" },
  demande:  { label: "📤 Demande envoyée",  color: "#9f1239", bg: "#ffe4e6" },
  transmis: { label: "📨 Panier transmis",  color: "#075985", bg: "#dbeafe" },
  commande: { label: "✅ Commandé",         color: "#854d0e", bg: "#fef3c7" },
};
const RECEPTION_STATUS = {
  en_cours:  { label: "⏳ En cours",  color: "#92400e", bg: "#fef3c7" },
  ok:        { label: "✓ OK",         color: "#065f46", bg: "#d1fae5" },
  bloque:    { label: "⛔ Bloqué",    color: "#991b1b", bg: "#fee2e2" },
  en_stock:  { label: "📦 En stock",  color: "#075985", bg: "#dbeafe" },
  partielle: { label: "◐ Partielle", color: "#6b21a8", bg: "#f3e8ff" },
  na:        { label: "N/A",          color: "#475569", bg: "#f1f5f9" },
  differe:   { label: "⏸ Différé",   color: "#9f1239", bg: "#ffe4e6" },
};

const ListView = ({ rows, suppliers, fmtEUR, fmtEURP, onEdit }) => {
  // Groupe les lignes par document (devis / commande) pour ne pas répéter
  // l'info client × N lignes
  const groups = React.useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      const key = r.doc_ref;
      if (!m[key]) m[key] = { doc_ref: key, doc_type: r.doc_type, doc_status: r.doc_status, doc_title: r.doc_title, client_name: r.client_name, doc_date: r.doc_date, items: [], totalPurchase: 0, totalSell: 0 };
      m[key].items.push(r);
      m[key].totalPurchase += (Number(r.purchase_price_ht) || 0) * r.quantity;
      m[key].totalSell += r.sell_price_ht * r.quantity;
    });
    return Object.values(m).sort((a, b) => (b.doc_date || "").localeCompare(a.doc_date || ""));
  }, [rows]);

  const TYPE_META = {
    devis:    { icon: "📄", label: "Devis",    color: "#3b82f6", bg: "#dbeafe" },
    commande: { icon: "📋", label: "Commande", color: "#a855f7", bg: "#f3e8ff" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {groups.map((g) => {
        const meta = TYPE_META[g.doc_type] || TYPE_META.devis;
        const groupMarginEur = g.totalSell - g.totalPurchase;
        const groupMarginPct = g.totalPurchase > 0 ? (groupMarginEur / g.totalPurchase * 100) : null;
        return (
          <div key={g.doc_ref} style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" }}>
            {/* Header du groupe : client + doc + KPI */}
            <div style={{ padding: "14px 18px", background: "#fafbfc", borderBottom: "1px solid #eef1f5", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>{meta.icon} {meta.label}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.client_name || "Client non renseigné"}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3730a3", fontWeight: 600 }}>{g.doc_ref}</span>
                  {g.doc_title && <span> · {g.doc_title}</span>}
                  <span style={{ color: "#94a3b8" }}> · {g.items.length} article(s)</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, color: "#94a3b8", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 700 }}>Total</div>
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981" }}>+{fmtEUR(g.totalSell)} HT</div>
                {g.totalPurchase > 0 && (
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: groupMarginPct >= 20 ? "#10b981" : groupMarginPct >= 10 ? "#f59e0b" : "#dc2626" }}>
                    Marge {fmtEUR(groupMarginEur)} ({groupMarginPct.toFixed(1)} %)
                  </div>
                )}
              </div>
            </div>

            {/* Lignes articles : carte par ligne avec édition rapide visible */}
            <div>
              {g.items.map((r) => {
                const ps = PURCHASE_STATUS[r.purchase_status] || PURCHASE_STATUS.panier;
                const rs = RECEPTION_STATUS[r.reception_status] || RECEPTION_STATUS.en_cours;
                const hasMargin = r.margin_pct != null;
                return (
                  <div key={r.line_id} onClick={() => onEdit(r)} style={{ display: "grid", gridTemplateColumns: "1fr 130px 110px 110px 200px", gap: 14, alignItems: "center", padding: "12px 18px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" }}
                       onMouseEnter={(e) => e.currentTarget.style.background = "#fafbfc"}
                       onMouseLeave={(e) => e.currentTarget.style.background = ""}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.designation || r.ref || "—"}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        Qté <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0f172a" }}>{r.quantity} {r.unit || ""}</strong>
                        {r.ref && <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>· {r.ref}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 700 }}>PU Acheté</div>
                      <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: r.purchase_price_ht ? "#0f172a" : "#dc2626" }}>
                        {r.purchase_price_ht ? fmtEURP(r.purchase_price_ht) : "⚠ —"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 700 }}>PU Vendu</div>
                      <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981" }}>{fmtEURP(r.sell_price_ht)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 700 }}>Marge</div>
                      <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: !hasMargin ? "#cbd5e1" : r.margin_pct >= 20 ? "#10b981" : r.margin_pct >= 10 ? "#f59e0b" : "#dc2626" }}>
                        {hasMargin ? r.margin_pct.toFixed(1) + " %" : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      {r.supplier ? (
                        <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontWeight: 700 }}>{r.supplier}</span>
                      ) : (
                        <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>⚠ À assigner</span>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: ps.bg, color: ps.color, fontWeight: 600 }}>{ps.label}</span>
                        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: rs.bg, color: rs.color, fontWeight: 600 }}>{rs.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
            <div>
              <label style={scStyles.lbl}>Statut achat</label>
              <select value={d.purchase_status || "panier"} onChange={(e) => setF("purchase_status", e.target.value)} style={scStyles.input}>
                <option value="panier">🛒 Panier</option>
                <option value="demande">📤 Demande envoyée</option>
                <option value="transmis">📨 Panier transmis</option>
                <option value="commande">✅ Commandé</option>
              </select>
            </div>
            <div>
              <label style={scStyles.lbl}>Statut réception</label>
              <select value={d.reception_status || "en_cours"} onChange={(e) => setF("reception_status", e.target.value)} style={scStyles.input}>
                <option value="en_cours">⏳ En cours</option>
                <option value="ok">✓ Réception OK</option>
                <option value="en_stock">📦 En stock</option>
                <option value="partielle">◐ Partielle</option>
                <option value="bloque">⛔ Bloqué</option>
                <option value="differe">⏸ Achat différé</option>
                <option value="na">Non applicable</option>
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
