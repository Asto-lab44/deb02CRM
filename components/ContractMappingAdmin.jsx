// ════════════════════════════════════════════════════════════════════
// ContractMappingAdmin — Back office : produits → modèle de contrat
// ════════════════════════════════════════════════════════════════════
//
// Permet au superadmin de définir des règles « si un produit contient X
// dans son SKU ou son nom, alors le contrat de type Y s'applique ». Ces
// règles sont utilisées par HubHostingContractPdf.detectKind() pour
// auto-sélectionner le bon template PDF dans NewContract.
//
// Stockage : localStorage clé "hubAstorya.contract_kind_rules.v1".
// Format   : [{ id, pattern: "TEL", kind: "phone", label: "Téléphonie" }, …]
// ════════════════════════════════════════════════════════════════════

const ContractMappingAdmin = () => {
  // KINDS disponibles depuis HubHostingContractPdf
  const KINDS = (window.HubHostingContractPdf && window.HubHostingContractPdf.KINDS) || {};
  const kindEntries = Object.keys(KINDS).map((k) => ({ k, label: KINDS[k].label, defaults: KINDS[k].patterns || [] }));

  const LS_KEY = "hubAstorya.contract_kind_rules.v1";
  const [rules, setRules] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; }
  });
  const [draft, setDraft] = React.useState({ pattern: "", kind: kindEntries[0] ? kindEntries[0].k : "hosting" });
  const [testInput, setTestInput] = React.useState("");
  const [testResult, setTestResult] = React.useState(null);

  const persist = (next) => {
    setRules(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const addRule = () => {
    const pattern = String(draft.pattern || "").trim();
    if (!pattern) return;
    const id = "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const next = [...rules, { id, pattern, kind: draft.kind }];
    persist(next);
    setDraft({ pattern: "", kind: draft.kind });
  };
  const removeRule = (id) => persist(rules.filter((r) => r.id !== id));
  const updateRule = (id, patch) => persist(rules.map((r) => r.id === id ? { ...r, ...patch } : r));

  const runTest = () => {
    if (!window.HubHostingContractPdf) {
      setTestResult({ error: "Le générateur PDF n'est pas chargé." });
      return;
    }
    const fakeProducts = String(testInput).split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
      .map((s) => ({ sku: s, name: s, qty: 1, unit: 1 }));
    if (!fakeProducts.length) { setTestResult({ error: "Saisis au moins un SKU ou nom." }); return; }
    const detected = window.HubHostingContractPdf.detectKind(fakeProducts);
    const label = (KINDS[detected] && KINDS[detected].label) || detected;
    setTestResult({ kind: detected, label, products: fakeProducts });
  };

  const seedDefaults = () => {
    if (!confirm("Ajouter les règles par défaut pour chaque template ? Les règles existantes sont conservées.")) return;
    const next = [...rules];
    kindEntries.forEach((k) => {
      k.defaults.forEach((pat) => {
        if (!next.some((r) => r.kind === k.k && (r.pattern || "").toUpperCase() === pat.toUpperCase())) {
          next.push({ id: "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), pattern: pat, kind: k.k });
        }
      });
    });
    persist(next);
  };

  const resetAll = () => {
    if (!confirm("Effacer TOUTES les règles personnalisées ? Les patterns par défaut intégrés au code resteront actifs.")) return;
    persist([]);
  };

  return (
    <div style={S.page}>
      <header style={S.head}>
        <div>
          <h1 style={S.h1}>Mapping Produits → Modèles de contrat</h1>
          <p style={S.sub}>Définis les règles qui déterminent automatiquement quel modèle de contrat utiliser selon les produits sélectionnés dans un nouveau contrat.</p>
        </div>
        <a href="/" style={S.ghostBtn}>← Retour Hub</a>
      </header>

      <section style={S.card}>
        <h2 style={S.h2}>Templates disponibles</h2>
        <div style={S.kindGrid}>
          {kindEntries.map((k) => (
            <div key={k.k} style={S.kindCard}>
              <div style={S.kindBadge}>{k.k}</div>
              <div style={S.kindLabel}>{k.label}</div>
              <div style={S.kindDefaults}>
                <span style={S.lblDef}>Patterns par défaut :</span>
                {(k.defaults || []).map((p) => <code key={p} style={S.tag}>{p}</code>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={S.card}>
        <div style={S.cardHead}>
          <h2 style={S.h2}>Règles personnalisées ({rules.length})</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={seedDefaults} style={S.ghostBtn}>+ Importer patterns par défaut</button>
            <button onClick={resetAll} style={{ ...S.ghostBtn, color: "#dc2626", borderColor: "#fecaca" }}>Tout effacer</button>
          </div>
        </div>

        <div style={S.addRow}>
          <input value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })}
                 placeholder="Pattern (SKU ou nom, ex. « TEL », « MAINT-HOTLINE »)…"
                 onKeyDown={(e) => { if (e.key === "Enter") addRule(); }}
                 style={S.input} />
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} style={S.input}>
            {kindEntries.map((k) => <option key={k.k} value={k.k}>{k.label}</option>)}
          </select>
          <button onClick={addRule} disabled={!draft.pattern.trim()} style={S.primaryBtn}>+ Ajouter</button>
        </div>

        {rules.length === 0 ? (
          <div style={S.empty}>
            Aucune règle personnalisée. Les patterns par défaut intégrés au code (HOST, TEL, MAINT, etc.) restent actifs.
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Pattern</th>
                <th style={S.th}>Template appliqué</th>
                <th style={{ ...S.th, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td style={S.td}>
                    <input value={r.pattern} onChange={(e) => updateRule(r.id, { pattern: e.target.value })}
                           style={{ ...S.input, width: "100%" }} />
                  </td>
                  <td style={S.td}>
                    <select value={r.kind} onChange={(e) => updateRule(r.id, { kind: e.target.value })}
                            style={{ ...S.input, width: "100%" }}>
                      {kindEntries.map((k) => <option key={k.k} value={k.k}>{k.label}</option>)}
                    </select>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => removeRule(r.id)}
                            style={{ ...S.ghostBtn, color: "#dc2626", borderColor: "#fecaca", padding: "5px 10px" }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={S.card}>
        <h2 style={S.h2}>🧪 Tester la détection</h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px 0" }}>
          Saisis une liste de SKU/désignations séparés par des virgules ou des retours à la ligne, puis clique <strong>Tester</strong>. Le système renvoie le template qui serait choisi automatiquement.
        </p>
        <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)}
                  placeholder="ex. AST-SERV-HEBE, OFFICE365-LIC, MAINT-HOTLINE-50"
                  style={{ ...S.input, width: "100%", minHeight: 80, fontVariantNumeric: "tabular-nums", fontSize: 12 }} />
        <button onClick={runTest} style={{ ...S.primaryBtn, marginTop: 10 }}>Tester la détection</button>
        {testResult && (
          <div style={{ marginTop: 12, padding: 14, background: testResult.error ? "#fee2e2" : "#dcfce7",
                        borderRadius: 8, fontSize: 13, color: testResult.error ? "#991b1b" : "#065f46" }}>
            {testResult.error ? testResult.error : (
              <>
                <strong>{testResult.label}</strong> serait sélectionné automatiquement
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                  Pour {testResult.products.length} produit(s) : {testResult.products.map((p) => p.sku).join(", ")}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section style={S.card}>
        <h2 style={S.h2}>📘 Comment ça marche</h2>
        <ol style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
          <li>Quand l'utilisateur crée un nouveau contrat dans <code>/nouveau-contrat</code>, il sélectionne ses produits.</li>
          <li>Au moment de générer le PDF, le système scanne chaque produit (SKU + nom) à la recherche de patterns.</li>
          <li>Chaque match avec une règle personnalisée <strong>compte pour 10 points</strong>, chaque match avec un pattern par défaut <strong>compte pour 1 point</strong>.</li>
          <li>Le template ayant le score le plus élevé est utilisé pour générer le PDF.</li>
          <li>L'utilisateur peut forcer manuellement un template depuis le formulaire <em>Nouveau contrat</em>.</li>
        </ol>
      </section>
    </div>
  );
};

const S = {
  page: { maxWidth: 1180, margin: "0 auto", padding: "30px 24px", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  head: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 },
  h1: { fontSize: 22, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: -0.3 },
  sub: { fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.5, maxWidth: 700 },
  card: { background: "#fff", borderRadius: 14, padding: 22, border: "1px solid #eef1f5", marginBottom: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" },
  cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 },
  h2: { fontSize: 14, fontWeight: 700, margin: "0 0 12px 0", color: "#0f172a" },
  kindGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  kindCard: { padding: 12, border: "1px solid #eef1f5", borderRadius: 10, background: "#fafbfc" },
  kindBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, background: "#1e293b", color: "#fff", fontSize: 9.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: 0.5 },
  kindLabel: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 6 },
  kindDefaults: { marginTop: 8 },
  lblDef: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.3, marginRight: 4 },
  tag: { display: "inline-block", padding: "1px 5px", margin: "2px 3px 2px 0", borderRadius: 3, background: "#e0e7ff", color: "#3730a3", fontSize: 10, fontVariantNumeric: "tabular-nums" },
  addRow: { display: "flex", gap: 8, marginBottom: 14 },
  input: { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none", background: "#fff", flex: 1 },
  primaryBtn: { padding: "8px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", textDecoration: "none" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 6 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #eef1f5", fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.3 },
  td: { padding: "6px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 },
  empty: { padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 12.5, background: "#fafbfc", border: "1px dashed #cbd5e1", borderRadius: 10 },
};

window.ContractMappingAdmin = ContractMappingAdmin;
