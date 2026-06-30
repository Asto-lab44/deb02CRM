// TresorerieEncaissements — Vue trésorerie : encaissements, acomptes,
// avoirs émis et restes à recouvrer, agrégés depuis les documents
// commerciaux (factures, factures d'acompte, avoirs).

const TresorerieEncaissements = () => {
  const [docs, setDocs] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [month, setMonth] = React.useState(() => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [facs, acs, avs, cls] = await Promise.all([
          window.api.commercialDocs.list({ type: "facture" }),
          window.api.commercialDocs.list({ type: "facture_acompte" }),
          window.api.commercialDocs.list({ type: "avoir" }),
          window.api.clients.list().catch(() => []),
        ]);
        setDocs([...(facs || []), ...(acs || []), ...(avs || [])]);
        setClients(cls || []);
      } catch (e) { console.warn(e); }
      setLoading(false);
    })();
  }, []);

  const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, " ") + " €";
  const clientName = (id) => { const c = clients.find((x) => x.id === id); return c ? (c.raison_sociale || c.name) : (id || "—"); };
  const monthLabel = (() => {
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  })();
  const navMonth = (delta) => {
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };

  // Aplatit tous les encaissements (data.payments) de toutes les pièces
  const allPayments = React.useMemo(() => {
    const out = [];
    docs.forEach((d) => {
      const pays = (d.data && Array.isArray(d.data.payments)) ? d.data.payments : [];
      pays.forEach((p) => out.push({
        date: (p.date || "").slice(0, 10),
        amount: Number(p.amount) || 0,
        mode: p.mode || "—",
        ref: p.ref || "",
        doc_id: d.ref || d.id,
        doc_type: d.type,
        client_id: d.client_id,
      }));
    });
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [docs]);

  const MODES = { virement: "Virement", cheque: "Chèque", cb: "Carte bancaire", especes: "Espèces", prelevement: "Prélèvement" };

  // Filtrés sur le mois sélectionné
  const monthPayments = allPayments.filter((p) => p.date.slice(0, 7) === month);
  const encaisseMois = monthPayments.reduce((s, p) => s + p.amount, 0);
  const acomptesMois = monthPayments.filter((p) => p.doc_type === "facture_acompte").reduce((s, p) => s + p.amount, 0);

  // Avoirs émis sur le mois (par date du doc)
  const avoirsMois = docs.filter((d) => d.type === "avoir" && (d.doc_date || "").slice(0, 7) === month);
  const avoirsMoisTtc = avoirsMois.reduce((s, a) => s + Math.abs(Number(a.total_ttc) || 0), 0);

  // Restes à recouvrer : factures non totalement réglées (tous mois)
  const facturesARecouvrer = React.useMemo(() => {
    const avoirsByFacture = {};
    docs.filter((d) => d.type === "avoir" && d.parent_doc_id).forEach((a) => {
      avoirsByFacture[a.parent_doc_id] = (avoirsByFacture[a.parent_doc_id] || 0) + Math.abs(Number(a.total_ttc) || 0);
    });
    return docs.filter((d) => d.type === "facture").map((f) => {
      const ttc = Number(f.total_ttc) || 0;
      const paid = ((f.data && f.data.payments) || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const avoirs = avoirsByFacture[f.id] || 0;
      const reste = Math.round((ttc - paid - avoirs) * 100) / 100;
      return { f, ttc, paid, avoirs, reste };
    }).filter((x) => x.reste > 0.01).sort((a, b) => b.reste - a.reste);
  }, [docs]);
  const totalARecouvrer = facturesARecouvrer.reduce((s, x) => s + x.reste, 0);

  const docColor = (t) => t === "facture_acompte" ? "#0ea5e9" : t === "avoir" ? "#dc2626" : "#10b981";

  return (
    <div style={S.frame}>
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Trésorerie — Encaissements</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => navMonth(-1)} style={S.navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "capitalize", minWidth: 130, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => navMonth(1)} style={S.navBtn}>›</button>
        </div>
      </header>

      <div style={S.titleRow}>
        <h1 style={S.h1}>💰 Trésorerie — Encaissements & avoirs</h1>
        <p style={S.h1sub}>Règlements reçus, acomptes encaissés, avoirs émis et restes à recouvrer.</p>
      </div>

      {/* KPI strip */}
      <div style={S.kpiRow}>
        <div style={S.kpi}><div style={S.kpiK}>Encaissé ce mois</div><div style={{ ...S.kpiV, color: "#10b981" }}>{fmt(encaisseMois)}</div><div style={S.kpiSub}>{monthPayments.length} règlement{monthPayments.length > 1 ? "s" : ""}</div></div>
        <div style={S.kpi}><div style={S.kpiK}>Dont acomptes</div><div style={{ ...S.kpiV, color: "#0ea5e9" }}>{fmt(acomptesMois)}</div><div style={S.kpiSub}>factures d'acompte</div></div>
        <div style={S.kpi}><div style={S.kpiK}>Avoirs émis ce mois</div><div style={{ ...S.kpiV, color: "#dc2626" }}>− {fmt(avoirsMoisTtc)}</div><div style={S.kpiSub}>{avoirsMois.length} avoir{avoirsMois.length > 1 ? "s" : ""}</div></div>
        <div style={S.kpi}><div style={S.kpiK}>Reste à recouvrer (total)</div><div style={{ ...S.kpiV, color: "#ea580c" }}>{fmt(totalARecouvrer)}</div><div style={S.kpiSub}>{facturesARecouvrer.length} facture{facturesARecouvrer.length > 1 ? "s" : ""}</div></div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
      ) : (
        <div style={S.body}>
          {/* Encaissements du mois */}
          <section style={S.card}>
            <h2 style={S.h2}>Encaissements de {monthLabel}</h2>
            {monthPayments.length === 0 ? (
              <div style={S.empty}>Aucun encaissement ce mois.</div>
            ) : (
              <div>
                <div style={{ ...S.row, ...S.rowHead }}>
                  <span style={{ width: 90 }}>Date</span>
                  <span style={{ width: 130 }}>Pièce</span>
                  <span style={{ flex: 1 }}>Client</span>
                  <span style={{ width: 120 }}>Mode</span>
                  <span style={{ width: 110, textAlign: "right" }}>Montant</span>
                </div>
                {monthPayments.map((p, i) => (
                  <div key={i} style={S.row}>
                    <span style={{ width: 90, fontVariantNumeric: "tabular-nums" }}>{p.date.split("-").reverse().join("/")}</span>
                    <span style={{ width: 130 }}>
                      <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 4, background: docColor(p.doc_type) + "1a", color: docColor(p.doc_type), fontWeight: 700 }}>{p.doc_id}</span>
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName(p.client_id)}</span>
                    <span style={{ width: 120, color: "#64748b" }}>{MODES[p.mode] || p.mode}{p.ref ? " · " + p.ref : ""}</span>
                    <span style={{ width: 110, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#047857" }}>{fmt(p.amount)}</span>
                  </div>
                ))}
                <div style={{ ...S.row, borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                  <span style={{ flex: 1 }}>Total encaissé</span>
                  <span style={{ width: 110, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#10b981" }}>{fmt(encaisseMois)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Avoirs émis du mois */}
          {avoirsMois.length > 0 && (
            <section style={S.card}>
              <h2 style={S.h2}>Avoirs émis en {monthLabel}</h2>
              {avoirsMois.map((a, i) => (
                <div key={i} style={S.row}>
                  <span style={{ width: 130 }}>
                    <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontWeight: 700 }}>{a.ref || a.id}</span>
                  </span>
                  <span style={{ flex: 1 }}>{clientName(a.client_id)}{a.data && a.data.source_facture_ref ? " · réf. " + a.data.source_facture_ref : ""}</span>
                  <span style={{ width: 110, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#dc2626" }}>− {fmt(Math.abs(a.total_ttc))}</span>
                </div>
              ))}
            </section>
          )}

          {/* Restes à recouvrer */}
          <section style={S.card}>
            <h2 style={S.h2}>Restes à recouvrer</h2>
            {facturesARecouvrer.length === 0 ? (
              <div style={S.empty}>Aucune facture en attente de règlement. 🎉</div>
            ) : (
              <div>
                <div style={{ ...S.row, ...S.rowHead }}>
                  <span style={{ width: 130 }}>Facture</span>
                  <span style={{ flex: 1 }}>Client</span>
                  <span style={{ width: 100, textAlign: "right" }}>TTC</span>
                  <span style={{ width: 90, textAlign: "right" }}>Réglé</span>
                  <span style={{ width: 90, textAlign: "right" }}>Avoirs</span>
                  <span style={{ width: 100, textAlign: "right" }}>Reste dû</span>
                </div>
                {facturesARecouvrer.map((x, i) => (
                  <a key={i} href={"/gestion-commerciale?open=" + encodeURIComponent(x.f.id)} style={{ ...S.row, textDecoration: "none", color: "inherit" }}>
                    <span style={{ width: 130 }}>
                      <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 4, background: "#dcfce7", color: "#047857", fontWeight: 700 }}>{x.f.ref || x.f.id}</span>
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName(x.f.client_id)}</span>
                    <span style={{ width: 100, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(x.ttc)}</span>
                    <span style={{ width: 90, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#047857" }}>{x.paid ? fmt(x.paid) : "—"}</span>
                    <span style={{ width: 90, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#dc2626" }}>{x.avoirs ? "− " + fmt(x.avoirs) : "—"}</span>
                    <span style={{ width: 100, textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#ea580c" }}>{fmt(x.reste)}</span>
                  </a>
                ))}
                <div style={{ ...S.row, borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                  <span style={{ flex: 1 }}>Total à recouvrer</span>
                  <span style={{ width: 100, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#ea580c" }}>{fmt(totalARecouvrer)}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const S = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  navBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 700, color: "#475569", cursor: "pointer", padding: 0 },
  titleRow: { padding: "20px 28px 6px", background: "#fff" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  h1sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "16px 28px", background: "#fff", borderBottom: "1px solid #eef1f5" },
  kpi: { background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" },
  kpiK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 },
  kpiV: { fontSize: 20, fontWeight: 700, letterSpacing: -0.4, marginTop: 4, fontVariantNumeric: "tabular-nums" },
  kpiSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  body: { padding: "20px 28px 60px", display: "flex", flexDirection: "column", gap: 16 },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 16 },
  h2: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 12px", textTransform: "capitalize" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 },
  rowHead: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" },
  empty: { padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12.5, fontStyle: "italic" },
};

window.TresorerieEncaissements = TresorerieEncaissements;
