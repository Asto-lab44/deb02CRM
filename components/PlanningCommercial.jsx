// PlanningCommercial — Vue planning des opportunités groupées par mois
// selon leurs deux types d'échéances : Date de décision potentielle
// (close_date) et Échéance contrat concurrent (contract_end).
//
// Source de données : api.opportunities.list() — même flux que CRMPipeline.

const PlanningCommercial = () => {
  const [opps, setOpps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState("all"); // all | decision | concurrent

  React.useEffect(() => {
    if (!window.api || !window.api.opportunities) return;
    window.api.opportunities.list().then((list) => {
      setOpps((list || []).filter((o) => o.stage !== "lost"));
      setLoading(false);
    }).catch((e) => { console.warn("[Planning]", e); setLoading(false); });
  }, []);

  const stageMeta = {
    qualif:    { label: "Prospect",    color: "#94a3b8" },
    discovery: { label: "Approche",    color: "#3b82f6" },
    propo:     { label: "Négociation", color: "#a855f7" },
    nego:      { label: "Conclusion",  color: "#ea580c" },
    won:       { label: "Ordre",       color: "#10b981" },
  };

  // Aplatit chaque opp en 1 ou 2 entrées (une par date renseignée)
  const entries = React.useMemo(() => {
    const out = [];
    opps.forEach((o) => {
      const dec = o.close_date || (o.data && (o.data.close_date || o.data.decision_date)) || null;
      const con = o.contract_end || (o.data && o.data.contract_end) || null;
      if (dec && (filterType === "all" || filterType === "decision")) {
        out.push({ opp: o, date: dec, kind: "decision" });
      }
      if (con && (filterType === "all" || filterType === "concurrent")) {
        out.push({ opp: o, date: con, kind: "concurrent" });
      }
    });
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return out;
  }, [opps, filterType]);

  // Groupe par mois (clé = YYYY-MM)
  const byMonth = React.useMemo(() => {
    const m = {};
    entries.forEach((e) => {
      const key = e.date.slice(0, 7);
      if (!m[key]) m[key] = [];
      m[key].push(e);
    });
    return m;
  }, [entries]);

  const monthKeys = Object.keys(byMonth).sort();
  const totalAmount = entries.reduce((acc, e) => acc + (Number(e.opp.amount_eur) || 0), 0);
  const uniqueOpps = new Set(entries.map((e) => e.opp.id || e.opp.ref)).size;

  const fmtMonth = (key) => {
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };
  const fmtDay = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });
  };
  const fmtAmount = (n) => n != null ? Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : "—";
  const daysFromToday = (iso) => {
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  };
  const urgencyChip = (iso) => {
    const days = daysFromToday(iso);
    if (days < 0) return { label: "En retard de " + Math.abs(days) + " j", color: "#dc2626", bg: "#fee2e2" };
    if (days === 0) return { label: "Aujourd'hui", color: "#dc2626", bg: "#fee2e2" };
    if (days <= 7) return { label: "J-" + days, color: "#ea580c", bg: "#fed7aa" };
    if (days <= 30) return { label: "J-" + days, color: "#a16207", bg: "#fef3c7" };
    return null;
  };

  return (
    <div style={S.frame}>
      {/* Topbar */}
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", flexWrap: "wrap" }}>
          <a href="/crm" style={{ color: "#64748b", textDecoration: "none" }}>CRM</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Planning commercial</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/crm" style={S.btnGhost}>← Pipeline</a>
        </div>
      </header>

      {/* Title row */}
      <div style={S.titleRow}>
        <div>
          <h1 style={S.h1}>Planning commercial</h1>
          <p style={S.h1sub}>
            {uniqueOpps} opportunité{uniqueOpps > 1 ? "s" : ""} · {entries.length} échéance{entries.length > 1 ? "s" : ""} · {fmtAmount(totalAmount)} cumulés
          </p>
        </div>

        {/* Filtre type d'échéance */}
        <div style={{ display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" }}>
          {[
            { k: "all",        label: "Toutes les échéances" },
            { k: "decision",   label: "Décision potentielle uniquement" },
            { k: "concurrent", label: "Contrat concurrent uniquement" },
          ].map((f) => (
            <button key={f.k} onClick={() => setFilterType(f.k)}
                    style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                             fontSize: 12, fontWeight: 600,
                             background: filterType === f.k ? "#0f172a" : "transparent",
                             color: filterType === f.k ? "#fff" : "#64748b" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={S.legend}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#475569" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#a855f7" }} />
          Date de décision potentielle
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#475569" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#0ea5e9" }} />
          Échéance contrat concurrent
        </span>
      </div>

      {/* Body */}
      <div style={S.body}>
        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Chargement…</div>
        )}
        {!loading && monthKeys.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Aucune opportunité avec une date renseignée. Renseigne « Date de décision potentielle » ou « Échéance du contrat actuel » sur la page Avancer l'opportunité pour qu'elles apparaissent ici.
          </div>
        )}
        {!loading && monthKeys.map((key) => {
          const month = byMonth[key];
          const monthTotal = month.reduce((acc, e) => acc + (Number(e.opp.amount_eur) || 0), 0);
          return (
            <section key={key} style={S.monthBlock}>
              <header style={S.monthHead}>
                <h2 style={S.monthTitle}>
                  {fmtMonth(key)}
                  <span style={S.monthCount}>{month.length}</span>
                </h2>
                <span style={S.monthTotal}>{fmtAmount(monthTotal)} cumulés</span>
              </header>
              <div style={S.entries}>
                {month.map((e, i) => {
                  const opp = e.opp;
                  const stage = stageMeta[opp.stage || "qualif"] || stageMeta.qualif;
                  const kindMeta = e.kind === "decision"
                    ? { color: "#a855f7", bg: "#f5efff", label: "Décision potentielle" }
                    : { color: "#0ea5e9", bg: "#e0f2fe", label: "Fin contrat concurrent" };
                  const urgency = urgencyChip(e.date);
                  return (
                    <a key={i}
                       href={"/avancer-opportunite?opp=" + encodeURIComponent(opp.id || opp.ref)}
                       style={S.entry}>
                      <div style={{ ...S.dateBlock, color: kindMeta.color, background: kindMeta.bg }}>
                        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {new Date(e.date).getDate()}
                        </div>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                          {fmtDay(e.date).split(" ")[0]}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{opp.name || "Opportunité"}</span>
                          <span style={{ fontSize: 11.5, color: "#64748b" }}>· {opp.client_name || (opp.data && opp.data.client_name) || "—"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999,
                                         background: stage.color + "1a", color: stage.color, fontSize: 10.5, fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: stage.color }} />
                            {stage.label}
                          </span>
                          <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 4,
                                         background: kindMeta.bg, color: kindMeta.color, fontWeight: 700 }}>
                            {kindMeta.label}
                          </span>
                          {urgency && (
                            <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 4,
                                           background: urgency.bg, color: urgency.color, fontWeight: 700 }}>
                              {urgency.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                          {fmtAmount(opp.amount_eur)}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                          {(opp.proba || 0)} % pondéré
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const S = {
  frame: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fafbfc",
           fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  btnGhost: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8,
              fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500, textDecoration: "none" },
  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eef1f5", background: "#fff", flexWrap: "wrap", gap: 16 },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0 },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  legend: { display: "flex", gap: 18, padding: "12px 28px", borderBottom: "1px solid #eef1f5",
            background: "#fafbfc" },
  body: { padding: "20px 28px 60px" },
  monthBlock: { marginBottom: 24, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" },
  monthHead: { display: "flex", justifyContent: "space-between", alignItems: "center",
               padding: "14px 18px", borderBottom: "1px solid #eef1f5",
               background: "linear-gradient(180deg, #fafbfc, #fff)" },
  monthTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a", textTransform: "capitalize",
                margin: 0, display: "inline-flex", alignItems: "center", gap: 10 },
  monthCount: { fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: "#eef2ff",
                color: "#4338ca", fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  monthTotal: { fontSize: 12, color: "#64748b", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  entries: { display: "flex", flexDirection: "column" },
  entry: { display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
           borderBottom: "1px solid #f1f5f9", textDecoration: "none", color: "inherit",
           cursor: "pointer", transition: "background 120ms" },
  dateBlock: { width: 52, height: 52, borderRadius: 8, display: "flex", flexDirection: "column",
               alignItems: "center", justifyContent: "center", flexShrink: 0 },
};

window.PlanningCommercial = PlanningCommercial;
