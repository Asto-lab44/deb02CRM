// ════════════════════════════════════════════════════════════════════
// Contrats — Abonnements récurrents & facturation périodique.
//
// Chaque contrat signé est saisi ici (client, type, périodicité, montant,
// options, mode de règlement). Il « vit » avec ses options (ajout/retrait).
// À chaque période : « Générer les factures » crée UNE facture d'abonnement
// par client (via window.api.subscriptions → pipeline facture/PDF/compta),
// et « Export prélèvement SEPA » produit le fichier CSV pour la banque (BNP).
// ════════════════════════════════════════════════════════════════════
const Contrats = () => {
  const fmtEUR = (window.HubConstants && window.HubConstants.fmtEUR) || ((n) => (Number(n) || 0).toFixed(2) + " €");
  const S = window.api && window.api.subscriptions;

  const now = new Date();
  const [month, setMonth] = React.useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
  const [rows, setRows] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState({});
  const [edit, setEdit] = React.useState(null); // contrat en édition (ou {} = nouveau)
  const [periodF, setPeriodF] = React.useState("all"); // all | mensuel | annuel
  const [preview, setPreview] = React.useState(null); // contrat en aperçu facture
  const fileRef = React.useRef(null);

  const periodTo = (() => { const [y, m] = month.split("-").map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); })();

  const reload = React.useCallback(async () => {
    if (!S) return; setLoading(true);
    try {
      const [list, cls] = await Promise.all([S.list(), window.api.clients.list().catch(() => [])]);
      setRows(list || []); setClients(cls || []);
    } catch (e) { console.warn(e); }
    setLoading(false);
  }, []);
  React.useEffect(() => { reload(); }, [reload]);

  const clientName = (c) => c.client_name || (clients.find((x) => x.id === c.client_id) || {}).raison_sociale || (clients.find((x) => x.id === c.client_id) || {}).name || "—";
  const filtered = rows.filter((c) => {
    const t = (clientName(c) + " " + c.type_contrat).toLowerCase();
    if (q && !t.includes(q.toLowerCase())) return false;
    if (periodF === "annuel" && c.periodicity !== "annuel") return false;
    if (periodF === "mensuel" && c.periodicity === "annuel") return false;
    return true;
  });
  const monthLabel = (() => { const [y, m] = month.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); })();
  const navMonth = (d) => { const [y, m] = month.split("-").map(Number); const nd = new Date(y, m - 1 + d, 1); setMonth(nd.getFullYear() + "-" + String(nd.getMonth() + 1).padStart(2, "0")); };
  const isDue = (c) => (c.status || "active") === "active" && (!c.next_billing || c.next_billing <= periodTo);
  const monthlyOf = (c) => c.options && c.options.filter((o) => o.active !== false).length ? c.options.filter((o) => o.active !== false).reduce((s, o) => s + (Number(o.montant_ht) || 0), 0) : Number(c.monthly_eur) || 0;

  const download = (filename, content, mime) => {
    const blob = new Blob([content], { type: (mime || "text/plain") + ";charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const genInvoices = async () => {
    if (!(window.HubModal ? await window.HubModal.confirm({ title: "Générer les factures d'abonnement ?", message: "Une facture (brouillon) sera créée par client pour les contrats dus au " + periodTo + "." }) : confirm("Générer les factures d'abonnement ?"))) return;
    setBusy("gen");
    try {
      const r = await S.generateInvoices({ to: periodTo, ids: selIds.length ? selIds : null });
      await reload(); setSel({});
      (window.HubToast ? window.HubToast.success : alert)((r.created || 0) + " facture(s) d'abonnement générée(s) (brouillon).");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
    setBusy("");
  };
  const exportSepa = async () => {
    setBusy("sepa");
    try { const { filename, content } = await S.sepaExport({ to: periodTo, ids: selIds.length ? selIds : null }); download(filename, content, "text/csv"); }
    catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur SEPA : " + (e.message || e)); }
    setBusy("");
  };
  const exportSepaXml = async () => {
    setBusy("xml");
    try {
      const { filename, content, count } = await S.sepaXml({ to: periodTo, ids: selIds.length ? selIds : null });
      if (!count) { (window.HubToast ? window.HubToast.warn : alert)("Aucun prélèvement éligible (IBAN/RUM manquants ou montant nul)."); setBusy(""); return; }
      download(filename, content, "application/xml");
      (window.HubToast ? window.HubToast.success : alert)(count + " prélèvement(s) dans le fichier SEPA XML.");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur SEPA XML : " + (e.message || e)); }
    setBusy("");
  };
  const csvTemplate = () => {
    const head = "client;type_contrat;montant_ht;periodicity;payment_mode;iban;bic;rum;next_billing";
    const ex = "ACME SARL;Maintenance PC;70,35;mensuel;prelevement;FR7630004...;BNPAFRPP;RUM-ACME-001;2026-07-01";
    download("modele_import_contrats.csv", "﻿" + head + "\r\n" + ex, "text/csv");
  };
  const importCsv = async (file) => {
    if (!file) return; setBusy("import");
    try {
      const text = await file.text();
      const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("Fichier vide");
      const sepChar = lines[0].indexOf(";") >= 0 ? ";" : ",";
      const heads = lines[0].split(sepChar).map((h) => h.trim().toLowerCase());
      const idx = (name) => heads.findIndex((h) => h === name || h.indexOf(name) >= 0);
      const iCli = idx("client"), iType = idx("type"), iMt = idx("montant"), iPer = idx("period"), iMode = idx("mode") >= 0 ? idx("mode") : idx("payment"), iIban = idx("iban"), iBic = idx("bic"), iRum = idx("rum"), iEch = idx("next") >= 0 ? idx("next") : idx("ech");
      const rows2 = lines.slice(1).map((l) => { const c = l.split(sepChar); return {
        client_name: iCli >= 0 ? c[iCli] : "", type_contrat: iType >= 0 ? c[iType] : "", montant_ht: iMt >= 0 ? c[iMt] : "0",
        periodicity: iPer >= 0 ? (c[iPer] || "").trim() : "mensuel", payment_mode: iMode >= 0 ? (c[iMode] || "").trim() : "prelevement",
        iban: iIban >= 0 ? c[iIban] : "", bic: iBic >= 0 ? c[iBic] : "", rum: iRum >= 0 ? c[iRum] : "", next_billing: iEch >= 0 ? (c[iEch] || "").trim() : "",
      }; });
      const r = await S.importRows(rows2, clients);
      await reload();
      (window.HubToast ? window.HubToast.success : alert)((r.created || 0) + " contrat(s) importé(s).");
    } catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur import : " + (e.message || e)); }
    setBusy("");
  };
  const saveEdit = async (c) => {
    setBusy("save");
    try { await S.save(c); setEdit(null); await reload(); (window.HubToast ? window.HubToast.success : alert)("Contrat enregistré."); }
    catch (e) { (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e)); }
    setBusy("");
  };
  const removeC = async (c) => {
    if (!(window.HubModal ? await window.HubModal.confirm({ title: "Supprimer le contrat ?", message: clientName(c) + " — " + c.type_contrat, okStyle: "danger" }) : confirm("Supprimer ?"))) return;
    try { await S.remove(c.id); await reload(); } catch (e) {}
  };

  const dueCount = filtered.filter(isDue).length;
  const totalDue = filtered.filter(isDue).reduce((s, c) => s + monthlyOf(c), 0);

  return (
    <div style={ST.frame}>
      <header style={ST.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>Accueil</a>
          <span style={{ color: "#cbd5e1" }}>/</span><span style={{ color: "#0f172a", fontWeight: 600 }}>Contrats & abonnements</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => navMonth(-1)} style={ST.navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize", minWidth: 130, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => navMonth(1)} style={ST.navBtn}>›</button>
        </div>
      </header>

      <div style={ST.titleRow}>
        <div><h1 style={ST.h1}>📄 Contrats & abonnements</h1><p style={ST.sub}>Facturation récurrente par client + prélèvement SEPA.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; importCsv(f); }} />
          <button onClick={csvTemplate} style={ST.btnGhost} title="Télécharger un modèle CSV">📄 Modèle</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy === "import"} style={ST.btnGhost}>{busy === "import" ? "Import…" : "⤵ Importer CSV"}</button>
          <button onClick={() => setEdit({ periodicity: "mensuel", payment_mode: "prelevement", tva_rate: 20, status: "active", options: [], next_billing: month + "-01" })} style={ST.btnGhost}>+ Nouveau contrat</button>
          <button onClick={exportSepa} disabled={busy === "sepa"} style={ST.btnGhost}>{busy === "sepa" ? "…" : "🏦 SEPA (CSV)"}</button>
          <button onClick={exportSepaXml} disabled={busy === "xml"} style={ST.btnGhost}>{busy === "xml" ? "…" : "🏦 SEPA XML (pain.008)"}</button>
          <button onClick={genInvoices} disabled={busy === "gen"} style={ST.btnPrimary}>{busy === "gen" ? "Génération…" : "⚡ Générer les factures" + (selIds.length ? " (" + selIds.length + ")" : "")}</button>
        </div>
      </div>

      <div style={ST.kpis}>
        <div style={ST.kpi}><div style={ST.kpiK}>Contrats actifs</div><div style={ST.kpiV}>{filtered.filter((c) => c.status === "active").length}</div></div>
        <div style={ST.kpi}><div style={ST.kpiK}>À facturer ({monthLabel})</div><div style={{ ...ST.kpiV, color: "#4f46e5" }}>{dueCount}</div></div>
        <div style={ST.kpi}><div style={ST.kpiK}>Montant HT à facturer</div><div style={{ ...ST.kpiV, color: "#0e7a55" }}>{fmtEUR(totalDue)}</div></div>
      </div>

      <div style={{ padding: "0 28px 8px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (client, type de contrat…)" style={ST.search} />
        <div style={{ display: "inline-flex", gap: 4 }}>
          {[["all", "Tous"], ["mensuel", "Mensuels/périodiques"], ["annuel", "Annuels"]].map(([k, l]) => (
            <button key={k} onClick={() => setPeriodF(k)} style={{ ...ST.mini, ...(periodF === k ? { background: "#eef2ff", color: "#4f46e5", borderColor: "#c7d2fe" } : {}) }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={ST.empty}>Chargement…</div> : (
        <div style={ST.body}>
          <div style={{ ...ST.row, ...ST.rowH }}>
            <span style={{ width: 26 }}></span>
            <span style={{ flex: 1 }}>Client</span>
            <span style={{ width: 110 }}>Dernière fact.</span>
            <span style={{ width: 110 }}>Prochaine éch.</span>
            <span style={{ flex: 1 }}>Type de contrat</span>
            <span style={{ width: 90 }}>Règlement</span>
            <span style={{ width: 110, textAlign: "right" }}>Montant HT</span>
            <span style={{ width: 150, textAlign: "right" }}>Actions</span>
          </div>
          {filtered.length === 0 ? <div style={ST.empty}>Aucun contrat. Cliquez « + Nouveau contrat ».</div> :
            filtered.map((c) => (
              <div key={c.id} style={{ ...ST.row, opacity: c.status === "active" ? 1 : 0.55 }}>
                <span style={{ width: 26 }}>{isDue(c) && <input type="checkbox" checked={!!sel[c.id]} onChange={(e) => setSel((s) => ({ ...s, [c.id]: e.target.checked }))} />}</span>
                <span style={{ flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName(c)}</span>
                <span style={{ width: 110, fontSize: 11.5, color: "#64748b" }}>{c.last_billed ? c.last_billed.split("-").reverse().join("/") : "Jamais"}</span>
                <span style={{ width: 110, fontSize: 11.5, color: isDue(c) ? "#c2410c" : "#64748b", fontWeight: isDue(c) ? 700 : 400 }}>{c.next_billing ? c.next_billing.split("-").reverse().join("/") : "—"}</span>
                <span style={{ flex: 1 }}><span style={ST.chip}>{c.type_contrat || c.name}</span></span>
                <span style={{ width: 90, fontSize: 11 }}>{c.payment_mode === "prelevement" ? "Prélèvement" : "Virement"}</span>
                <span style={{ width: 110, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtEUR(monthlyOf(c))}</span>
                <span style={{ width: 150, textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setPreview(c)} style={ST.mini}>Aperçu</button>
                  <button onClick={() => setEdit(c)} style={ST.mini}>Éditer</button>
                  <button onClick={() => removeC(c)} style={{ ...ST.mini, color: "#dc2626" }}>×</button>
                </span>
              </div>
            ))}
        </div>
      )}

      {edit && <ContratModal contrat={edit} clients={clients} onClose={() => setEdit(null)} onSave={saveEdit} busy={busy === "save"} fmtEUR={fmtEUR} />}
      {preview && (() => {
        const c = preview; const rate = c.tva_rate != null ? c.tva_rate : 20;
        const opts = (c.options || []).filter((o) => o.active !== false);
        const lines = opts.length ? opts.map((o) => ({ label: (c.type_contrat || c.name) + " — " + (o.label || "Option"), ht: Number(o.montant_ht) || 0 })) : [{ label: c.type_contrat || c.name || "Abonnement", ht: Number(c.monthly_eur) || 0 }];
        const ht = lines.reduce((s, l) => s + l.ht, 0); const ttc = Math.round(ht * (1 + rate / 100) * 100) / 100;
        return (
          <div onClick={() => setPreview(null)} style={ST.overlay}>
            <div onClick={(e) => e.stopPropagation()} style={{ ...ST.modal, maxWidth: 520 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>Aperçu facture — {clientName(c)}</h2>
                <button onClick={() => setPreview(null)} style={ST.x}>×</button>
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 8 }}>Période {monthLabel} · échéance {c.next_billing ? c.next_billing.split("-").reverse().join("/") : "—"}</div>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                  <span>{l.label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtEUR(l.ht)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, fontSize: 13 }}><span>Total HT</span><strong>{fmtEUR(ht)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}><span>TVA {rate}%</span><span>{fmtEUR(Math.round(ht * rate / 100 * 100) / 100)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: "2px solid #e2e8f0", fontSize: 15, fontWeight: 800 }}><span>Total TTC</span><span>{fmtEUR(ttc)}</span></div>
              <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 12 }}>Aperçu indicatif. « Générer les factures » crée la facture réelle (brouillon) dans la gestion commerciale.</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Modal création / édition d'un contrat (avec options +/-) ──────────
const ContratModal = ({ contrat, clients, onClose, onSave, busy, fmtEUR }) => {
  const [c, setC] = React.useState(() => ({ options: [], ...contrat }));
  const set = (k, v) => setC((s) => ({ ...s, [k]: v }));
  const setOpt = (i, k, v) => setC((s) => ({ ...s, options: s.options.map((o, j) => j === i ? { ...o, [k]: v } : o) }));
  const addOpt = () => setC((s) => ({ ...s, options: [...(s.options || []), { label: "", montant_ht: 0, tva_rate: c.tva_rate || 20, active: true }] }));
  const rmOpt = (i) => setC((s) => ({ ...s, options: s.options.filter((_, j) => j !== i) }));
  const total = (c.options || []).filter((o) => o.active !== false).reduce((s, o) => s + (Number(o.montant_ht) || 0), 0) || Number(c.monthly_eur) || 0;
  const inp = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" };
  const lbl = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 4px" };

  return (
    <div onClick={onClose} style={ST.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={ST.modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>{c.id ? "Éditer le contrat" : "Nouveau contrat"}</h2>
          <button onClick={onClose} style={ST.x}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / 3" }}><div style={lbl}>Client</div>
            <select value={c.client_id || ""} onChange={(e) => { const cl = clients.find((x) => x.id === e.target.value); set("client_id", e.target.value); set("client_name", cl ? (cl.raison_sociale || cl.name) : ""); }} style={inp}>
              <option value="">— Sélectionner —</option>
              {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.raison_sociale || cl.name}</option>)}
            </select>
          </div>
          <div><div style={lbl}>Type de contrat</div><input value={c.type_contrat || ""} onChange={(e) => set("type_contrat", e.target.value)} placeholder="Maintenance, Hébergement…" style={inp} /></div>
          <div><div style={lbl}>Périodicité</div>
            <select value={c.periodicity || "mensuel"} onChange={(e) => set("periodicity", e.target.value)} style={inp}>
              {["mensuel", "bimestriel", "trimestriel", "semestriel", "annuel"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select></div>
          <div><div style={lbl}>Prochaine échéance</div><input type="date" value={c.next_billing || ""} onChange={(e) => set("next_billing", e.target.value)} style={inp} /></div>
          <div><div style={lbl}>Statut</div>
            <select value={c.status || "active"} onChange={(e) => set("status", e.target.value)} style={inp}><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="terminated">Résilié</option></select></div>
          <div><div style={lbl}>Mode de règlement</div>
            <select value={c.payment_mode || "prelevement"} onChange={(e) => set("payment_mode", e.target.value)} style={inp}><option value="prelevement">Prélèvement SEPA</option><option value="virement">Virement</option></select></div>
          <div><div style={lbl}>TVA %</div><input type="number" value={c.tva_rate != null ? c.tva_rate : 20} onChange={(e) => set("tva_rate", Number(e.target.value))} style={inp} /></div>
          {(c.payment_mode || "prelevement") === "prelevement" && <>
            <div><div style={lbl}>IBAN</div><input value={c.iban || ""} onChange={(e) => set("iban", e.target.value)} style={inp} /></div>
            <div><div style={lbl}>BIC</div><input value={c.bic || ""} onChange={(e) => set("bic", e.target.value)} style={inp} /></div>
            <div><div style={lbl}>RUM (réf. mandat)</div><input value={c.rum || ""} onChange={(e) => set("rum", e.target.value)} style={inp} /></div>
          </>}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={lbl}>Options / lignes de l'abonnement</div>
            <button onClick={addOpt} style={ST.mini}>+ Ajouter une option</button>
          </div>
          {(c.options || []).length === 0 ? <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0" }}>Aucune option — le montant mensuel ci-dessous sera facturé. Ajoutez des options pour détailler (facturées en +/−).</p> :
            (c.options || []).map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input type="checkbox" checked={o.active !== false} onChange={(e) => setOpt(i, "active", e.target.checked)} title="Active ce mois" />
                <input value={o.label || ""} onChange={(e) => setOpt(i, "label", e.target.value)} placeholder="Libellé de l'option" style={{ ...inp, flex: 1 }} />
                <input type="number" value={o.montant_ht || 0} onChange={(e) => setOpt(i, "montant_ht", Number(e.target.value))} placeholder="HT" style={{ ...inp, width: 110 }} />
                <button onClick={() => rmOpt(i)} style={{ ...ST.mini, color: "#dc2626" }}>×</button>
              </div>
            ))}
          {(!c.options || c.options.length === 0) && <div style={{ marginTop: 6 }}><div style={lbl}>Montant mensuel HT</div><input type="number" value={c.monthly_eur || 0} onChange={(e) => set("monthly_eur", Number(e.target.value))} style={{ ...inp, width: 180 }} /></div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #eef1f5" }}>
          <div style={{ fontSize: 13 }}>Total HT / échéance : <strong>{fmtEUR(total)}</strong></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={ST.btnGhost}>Annuler</button>
            <button onClick={() => onSave(c)} disabled={busy || !c.client_id} style={ST.btnPrimary}>{busy ? "…" : "Enregistrer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ST = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 700, color: "#475569", cursor: "pointer" },
  titleRow: { padding: "20px 28px 6px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0" },
  btnGhost: { padding: "8px 14px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  btnPrimary: { padding: "8px 14px", border: 0, background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  kpis: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: "16px 28px", background: "#fff", borderBottom: "1px solid #eef1f5" },
  kpi: { background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" },
  kpiK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 },
  kpiV: { fontSize: 20, fontWeight: 700, marginTop: 4, fontVariantNumeric: "tabular-nums" },
  search: { width: "100%", maxWidth: 420, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 12, boxSizing: "border-box" },
  body: { padding: "8px 28px 60px" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 },
  rowH: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" },
  chip: { fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: "#eef2ff", color: "#4f46e5", fontWeight: 700 },
  mini: { padding: "4px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12.5, fontStyle: "italic" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 1000, overflowY: "auto" },
  modal: { background: "#fff", borderRadius: 14, padding: 22, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  x: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 18, cursor: "pointer", color: "#64748b" },
};

window.Contrats = Contrats;
