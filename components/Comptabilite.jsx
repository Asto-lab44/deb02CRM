// ════════════════════════════════════════════════════════════════════
// Comptabilite — Module comptable (partie double) : Balance, Écritures,
// Grand livre, Plan comptable, génération auto depuis les ventes, export FEC.
//
// S'appuie sur window.api.accounting (voir components/api.js, §Comptabilité).
// Les écritures sont générées depuis les factures / avoirs / règlements, ou
// saisies à la main. Le FEC (Fichier des Écritures Comptables, format DGFiP)
// est exporté en .txt (18 colonnes, tabulations).
// ════════════════════════════════════════════════════════════════════
const Comptabilite = () => {
  const fmtEUR = (window.HubConstants && window.HubConstants.fmtEUR) || ((n) => (Number(n) || 0).toFixed(2) + " €");
  const A = window.api && window.api.accounting;

  const thisYear = new Date().getFullYear();
  const [tab, setTab] = React.useState("balance");
  const [from, setFrom] = React.useState(thisYear + "-01-01");
  const [to, setTo] = React.useState(thisYear + "-12-31");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [entries, setEntries] = React.useState([]);
  const [balance, setBalance] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);
  const [journals, setJournals] = React.useState([]);
  const [ledgerAcc, setLedgerAcc] = React.useState("411000");
  const [ledger, setLedger] = React.useState([]);

  const reload = React.useCallback(async () => {
    if (!A) return;
    setLoading(true);
    try {
      const [e, b, acc, j] = await Promise.all([
        A.entries({ from, to }), A.balance({ from, to }), A.accounts(), A.journals(),
      ]);
      setEntries(e || []); setBalance(b || []); setAccounts(acc || []); setJournals(j || []);
    } catch (err) { console.warn(err); }
    setLoading(false);
  }, [from, to]);

  React.useEffect(() => { reload(); }, [reload]);
  React.useEffect(() => {
    if (!A || tab !== "grandlivre") return;
    A.ledger(ledgerAcc, { from, to }).then((l) => setLedger(l || [])).catch(() => setLedger([]));
  }, [tab, ledgerAcc, from, to]);

  const totDebit = balance.reduce((s, a) => s + a.debit, 0);
  const totCredit = balance.reduce((s, a) => s + a.credit, 0);
  const equilibre = Math.abs(totDebit - totCredit) < 0.01;

  const genSales = async () => {
    setBusy("gen");
    try {
      const r = await A.generateFromSales({ from, to });
      await reload();
      (window.HubToast ? window.HubToast.success : alert)((r.created || 0) + " écriture(s) générée(s).");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
    setBusy("");
  };

  const validate = async () => {
    if (!(window.HubModal ? await window.HubModal.confirm({ title: "Valider la période ?", message: "Les écritures du " + from + " au " + to + " seront figées (date de validation = aujourd'hui). Action conservée dans le FEC." }) : confirm("Valider (figer) les écritures de la période ?"))) return;
    setBusy("val");
    try {
      const r = await A.validate({ from, to });
      await reload();
      (window.HubToast ? window.HubToast.success : alert)((r.validated || 0) + " écriture(s) validée(s).");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
    setBusy("");
  };

  const exportFEC = async () => {
    setBusy("fec");
    try {
      const { filename, content } = await A.exportFEC({ from, to });
      const blob = new Blob(["﻿" + content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur FEC : " + (e.message || e)); }
    setBusy("");
  };

  const jLabel = (code) => { const j = journals.find((x) => x.code === code); return j ? j.label : code; };

  return (
    <div style={S.frame}>
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Comptabilité</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
          <span style={{ color: "#64748b" }}>Du</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={S.date} />
          <span style={{ color: "#64748b" }}>au</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={S.date} />
        </div>
      </header>

      <div style={S.titleRow}>
        <div>
          <h1 style={S.h1}>📒 Comptabilité</h1>
          <p style={S.h1sub}>Écritures en partie double · Grand livre · Balance · Export FEC (DGFiP).</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={genSales} disabled={busy === "gen"} style={S.btnGhost}>{busy === "gen" ? "Génération…" : "↻ Générer depuis les ventes"}</button>
          <button onClick={validate} disabled={busy === "val"} style={S.btnGhost}>{busy === "val" ? "Validation…" : "🔒 Valider la période"}</button>
          <button onClick={exportFEC} disabled={busy === "fec"} style={S.btnPrimary}>{busy === "fec" ? "Export…" : "⇩ Export FEC"}</button>
        </div>
      </div>

      <div style={S.tabs}>
        {[["balance", "Balance"], ["ecritures", "Écritures"], ["grandlivre", "Grand livre"], ["plan", "Plan comptable"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab === k ? S.tabOn : {}) }}>{lbl}</button>
        ))}
      </div>

      {loading ? <div style={S.empty}>Chargement…</div> : (
        <div style={S.body}>

          {tab === "balance" && (
            <section style={S.card}>
              <div style={{ ...S.rowH }}>
                <span style={{ width: 90 }}>Compte</span><span style={{ flex: 1 }}>Libellé</span>
                <span style={{ width: 120, textAlign: "right" }}>Débit</span>
                <span style={{ width: 120, textAlign: "right" }}>Crédit</span>
                <span style={{ width: 120, textAlign: "right" }}>Solde</span>
              </div>
              {balance.length === 0 ? <div style={S.empty}>Aucune écriture sur la période. Cliquez « Générer depuis les ventes ».</div> :
                balance.map((a) => (
                  <div key={a.account_id} style={S.row}>
                    <span style={{ width: 90, fontVariantNumeric: "tabular-nums", color: "#3730a3" }}>{a.account_id}</span>
                    <span style={{ flex: 1 }}>{a.account_label}</span>
                    <span style={S.num}>{a.debit ? fmtEUR(a.debit) : "—"}</span>
                    <span style={S.num}>{a.credit ? fmtEUR(a.credit) : "—"}</span>
                    <span style={{ ...S.num, fontWeight: 700, color: a.solde >= 0 ? "#0f172a" : "#dc2626" }}>{fmtEUR(a.solde)}</span>
                  </div>
                ))}
              {balance.length > 0 && (
                <div style={{ ...S.row, borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                  <span style={{ width: 90 }}></span><span style={{ flex: 1 }}>Totaux {equilibre ? "✓ équilibrés" : "⚠ déséquilibrés"}</span>
                  <span style={S.num}>{fmtEUR(totDebit)}</span><span style={S.num}>{fmtEUR(totCredit)}</span><span style={S.num}></span>
                </div>
              )}
            </section>
          )}

          {tab === "ecritures" && (
            <section style={S.card}>
              {entries.length === 0 ? <div style={S.empty}>Aucune écriture sur la période.</div> :
                entries.map((e) => (
                  <div key={e.id} style={{ borderBottom: "1px solid #eef1f5", padding: "8px 0" }}>
                    <div style={{ display: "flex", gap: 10, fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      <span style={{ background: "#eef2ff", color: "#3730a3", padding: "1px 6px", borderRadius: 4 }}>{e.journal_code}</span>
                      <span>N° {e.num}</span>
                      <span style={{ color: "#64748b", fontWeight: 500 }}>{(e.entry_date || "").split("-").reverse().join("/")}</span>
                      <span style={{ flex: 1, color: "#475569", fontWeight: 500 }}>{e.label}{e.piece_ref ? " · " + e.piece_ref : ""}</span>
                    </div>
                    {((e.data && e.data.lines) || []).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, padding: "2px 0 2px 12px" }}>
                        <span style={{ width: 80, color: "#3730a3", fontVariantNumeric: "tabular-nums" }}>{l.account_id}</span>
                        <span style={{ flex: 1, color: "#64748b" }}>{l.account_label}{l.aux_num ? " · " + l.aux_num : ""}</span>
                        <span style={{ width: 110, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{l.debit ? fmtEUR(l.debit) : ""}</span>
                        <span style={{ width: 110, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{l.credit ? fmtEUR(l.credit) : ""}</span>
                      </div>
                    ))}
                  </div>
                ))}
            </section>
          )}

          {tab === "grandlivre" && (
            <section style={S.card}>
              <div style={{ marginBottom: 10 }}>
                <select value={ledgerAcc} onChange={(e) => setLedgerAcc(e.target.value)} style={S.select}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.id} — {a.label}</option>)}
                </select>
              </div>
              <div style={S.rowH}>
                <span style={{ width: 80 }}>Date</span><span style={{ width: 50 }}>Jal</span>
                <span style={{ flex: 1 }}>Libellé</span>
                <span style={{ width: 100, textAlign: "right" }}>Débit</span>
                <span style={{ width: 100, textAlign: "right" }}>Crédit</span>
                <span style={{ width: 110, textAlign: "right" }}>Solde</span>
              </div>
              {ledger.length === 0 ? <div style={S.empty}>Aucun mouvement.</div> :
                ledger.map((l, i) => (
                  <div key={i} style={S.row}>
                    <span style={{ width: 80, fontVariantNumeric: "tabular-nums" }}>{(l.date || "").split("-").reverse().join("/")}</span>
                    <span style={{ width: 50, color: "#3730a3" }}>{l.journal}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}{l.piece_ref ? " · " + l.piece_ref : ""}</span>
                    <span style={S.num}>{l.debit ? fmtEUR(l.debit) : ""}</span>
                    <span style={S.num}>{l.credit ? fmtEUR(l.credit) : ""}</span>
                    <span style={{ ...S.num, fontWeight: 700 }}>{fmtEUR(l.solde)}</span>
                  </div>
                ))}
            </section>
          )}

          {tab === "plan" && (
            <section style={S.card}>
              <div style={S.rowH}><span style={{ width: 110 }}>Compte</span><span style={{ flex: 1 }}>Libellé</span><span style={{ width: 120 }}>Type</span></div>
              {accounts.map((a) => (
                <div key={a.id} style={S.row}>
                  <span style={{ width: 110, fontVariantNumeric: "tabular-nums", color: "#3730a3", fontWeight: 600 }}>{a.id}</span>
                  <span style={{ flex: 1 }}>{a.label}</span>
                  <span style={{ width: 120, color: "#64748b" }}>{a.kind || "—"}</span>
                </div>
              ))}
              <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 10 }}>Plan comptable simplifié (PCG). Les comptes manquants peuvent être ajoutés en base (table <code>accounting_accounts</code>).</p>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

const S = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  date: { border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 8px", fontSize: 12.5 },
  titleRow: { padding: "20px 28px 12px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  h1sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  btnGhost: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", border: 0, background: "#3730a3", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  tabs: { display: "flex", gap: 4, padding: "0 28px", background: "#fff", borderBottom: "1px solid #eef1f5" },
  tab: { padding: "10px 16px", border: 0, background: "transparent", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", borderBottom: "2px solid transparent" },
  tabOn: { color: "#3730a3", borderBottom: "2px solid #3730a3" },
  body: { padding: "20px 28px 60px" },
  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 16 },
  rowH: { display: "flex", gap: 10, padding: "6px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 },
  num: { width: 120, textAlign: "right", fontVariantNumeric: "tabular-nums" },
  select: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, minWidth: 320 },
  empty: { padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 12.5, fontStyle: "italic" },
};

window.Comptabilite = Comptabilite;
