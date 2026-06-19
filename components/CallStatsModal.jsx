// Modal "Statistiques d'appels" — vue annuelle d'un client, mois par mois,
// répartie en 3 catégories de tickets (Incident / Demande / Problème).
// Affichage : barres empilées + table récap + KPIs en haut.

const CallStatsModal = ({ open, client, onClose }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  // 3 catégories de tickets (ajustable côté API/back-office)
  const CATEGORIES = [
    { key: "incident", label: "Incident",  color: "#dc2626", soft: "#fdecec", desc: "Service dégradé / panne" },
    { key: "demande",  label: "Demande",   color: "#4f46e5", soft: "#eef2ff", desc: "Demande de service" },
    { key: "probleme", label: "Problème",  color: "#f59e0b", soft: "#fef0e6", desc: "Cause racine récurrente" },
  ];

  // Démo : 12 mois (juin 2025 → mai 2026) d'appels pour AXA Wealth France.
  // Saisonnalité plausible : pic mars-mai (clôtures), creux juillet-août.
  const months = [
    { m: "Juin 25",  incident: 4,  demande: 6,  probleme: 1 },
    { m: "Juil. 25", incident: 2,  demande: 3,  probleme: 0 },
    { m: "Août 25",  incident: 1,  demande: 2,  probleme: 0 },
    { m: "Sept. 25", incident: 5,  demande: 8,  probleme: 1 },
    { m: "Oct. 25",  incident: 7,  demande: 9,  probleme: 2 },
    { m: "Nov. 25",  incident: 6,  demande: 11, probleme: 2 },
    { m: "Déc. 25",  incident: 3,  demande: 7,  probleme: 1 },
    { m: "Janv. 26", incident: 9,  demande: 12, probleme: 3 },
    { m: "Févr. 26", incident: 8,  demande: 10, probleme: 2 },
    { m: "Mars 26",  incident: 11, demande: 14, probleme: 4 },
    { m: "Avr. 26",  incident: 9,  demande: 13, probleme: 2 },
    { m: "Mai 26",   incident: 7,  demande: 11, probleme: 3 },
  ];

  const totals = months.reduce(
    (acc, m) => ({ incident: acc.incident + m.incident, demande: acc.demande + m.demande, probleme: acc.probleme + m.probleme }),
    { incident: 0, demande: 0, probleme: 0 }
  );
  const grandTotal = totals.incident + totals.demande + totals.probleme;
  const peak = Math.max(...months.map((m) => m.incident + m.demande + m.probleme));
  const avgPerMonth = Math.round(grandTotal / months.length);
  // Comparaison vs N-1 (fictif) : Mars 26 = pic à 29 vs 22 il y a un an = +32 %
  const yoyDelta = 18;

  const tree = (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEAD */}
        <div style={S.head}>
          <div>
            <div style={S.eyebrow}>Hotline · 12 derniers mois</div>
            <div style={S.title}>Statistiques d'appels — {client ? client.name : "client"}</div>
            <div style={S.sub}>{grandTotal} appels traités · {totals.incident} incidents · {totals.demande} demandes · {totals.probleme} problèmes</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={S.periodSelect}>
              <span style={{ color: "#94a3b8", fontSize: 11, marginRight: 8 }}>Période</span>
              <select defaultValue="12m" style={S.selectBare}>
                <option value="12m">12 derniers mois</option>
                <option value="6m">6 derniers mois</option>
                <option value="ytd">Année en cours</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <button style={S.btnGhost} title="Exporter en CSV/PDF">↓ Exporter</button>
            <button onClick={onClose} style={S.close} aria-label="Fermer">×</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={S.kpiRow}>
          <div style={S.kpi}>
            <div style={S.kpiK}>Total appels</div>
            <div style={S.kpiV}>{grandTotal}</div>
            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>↑ +{yoyDelta} % vs N-1</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>Moyenne / mois</div>
            <div style={S.kpiV}>{avgPerMonth}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>pic à {peak} en mars 26</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>Durée moyenne</div>
            <div style={S.kpiV}>4'12<span style={{ fontSize: 13, color: "#64748b" }}>"</span></div>
            <div style={{ fontSize: 11, color: "#64748b" }}>résolu N1 dans 68 %</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiK}>Pic d'activité</div>
            <div style={S.kpiV}>10–12h</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>+ 18h–19h (vendredi)</div>
          </div>
        </div>

        {/* Legend */}
        <div style={S.legendRow}>
          {CATEGORIES.map((c) => (
            <div key={c.key} style={S.legendItem}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{c.label}</span>
              <span style={{ fontSize: 11.5, color: "#64748b" }}>· {totals[c.key]} ({Math.round((totals[c.key] / grandTotal) * 100)} %)</span>
            </div>
          ))}
        </div>

        {/* Stacked bar chart */}
        <div style={S.chartCard}>
          <div style={S.chartGrid}>
            {months.map((m) => {
              const total = m.incident + m.demande + m.probleme;
              return (
                <div key={m.m} style={S.barCol}>
                  <div style={S.barTotal}>{total}</div>
                  <div style={S.barTrack}>
                    <div style={{ height: `${(m.probleme / peak) * 100}%`, background: CATEGORIES[2].color, borderRadius: "0 0 0 0" }} title={`${m.probleme} problèmes`} />
                    <div style={{ height: `${(m.demande / peak) * 100}%`, background: CATEGORIES[1].color }} title={`${m.demande} demandes`} />
                    <div style={{ height: `${(m.incident / peak) * 100}%`, background: CATEGORIES[0].color, borderRadius: "3px 3px 0 0" }} title={`${m.incident} incidents`} />
                  </div>
                  <div style={S.barLabel}>{m.m}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail table */}
        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mois</th>
                {CATEGORIES.map((c) => (
                  <th key={c.key} style={{ ...S.th, textAlign: "right" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color }} />
                      {c.label}
                    </span>
                  </th>
                ))}
                <th style={{ ...S.th, textAlign: "right" }}>Total</th>
                <th style={{ ...S.th, textAlign: "right" }}>Variation</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const total = m.incident + m.demande + m.probleme;
                const prev = i > 0 ? months[i - 1] : null;
                const prevTotal = prev ? prev.incident + prev.demande + prev.probleme : null;
                const delta = prevTotal !== null ? total - prevTotal : null;
                return (
                  <tr key={m.m} style={S.tr}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{m.m}</td>
                    <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[0].color, fontWeight: 600 }}>{m.incident}</td>
                    <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[1].color, fontWeight: 600 }}>{m.demande}</td>
                    <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[2].color, fontWeight: 600 }}>{m.probleme}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{total}</td>
                    <td style={{ ...S.td, textAlign: "right", fontSize: 12, color: delta === null ? "#cbd5e1" : delta > 0 ? "#dc2626" : delta < 0 ? "#0e7a55" : "#64748b" }}>
                      {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ ...S.tr, background: "#f8fafc", fontWeight: 700 }}>
                <td style={S.td}>Total 12 mois</td>
                <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[0].color }}>{totals.incident}</td>
                <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[1].color }}>{totals.demande}</td>
                <td style={{ ...S.td, textAlign: "right", color: CATEGORIES[2].color }}>{totals.probleme}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{grandTotal}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#10b981" }}>+{yoyDelta} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={S.foot}>
          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Source : PBX 3CX · données rafraîchies toutes les heures</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost} onClick={onClose}>Fermer</button>
            <button style={S.btnPrimary}>Ouvrir la file d'appels →</button>
          </div>
        </div>
      </div>
    </div>
  );
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

window.CallStatsModal = CallStatsModal;

const S = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 980, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" },

  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "22px 24px 18px", borderBottom: "1px solid #f1f5f9" },
  eyebrow: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 19, fontWeight: 700, color: "#0f172a", marginTop: 4 },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  periodSelect: { display: "inline-flex", alignItems: "center", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff" },
  selectBare: { border: 0, background: "transparent", fontSize: 12.5, fontWeight: 600, color: "#0f172a", outline: "none", cursor: "pointer" },
  btnGhost: { padding: "7px 12px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "16px 24px 0" },
  kpi: { background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #eef2f7" },
  kpiK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  kpiV: { fontSize: 22, fontWeight: 700, color: "#0f172a", marginTop: 4, letterSpacing: -0.4 },

  legendRow: { display: "flex", gap: 18, padding: "16px 24px 0", flexWrap: "wrap" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 8 },

  chartCard: { margin: "12px 24px 0", padding: "20px 16px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 },
  chartGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, height: 220, alignItems: "flex-end" },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 },
  barTotal: { fontSize: 11, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" },
  barTrack: { width: "100%", maxWidth: 40, display: "flex", flexDirection: "column-reverse", height: "100%", alignItems: "stretch", gap: 1 },
  barLabel: { fontSize: 10, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" },

  tableCard: { margin: "16px 24px 16px", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
  th: { textAlign: "left", padding: "8px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "7px 12px", color: "#0f172a", fontVariantNumeric: "tabular-nums" },

  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px 18px", borderTop: "1px solid #f1f5f9" },
};
