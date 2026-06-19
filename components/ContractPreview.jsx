// ════════════════════════════════════════════════════════════════════
// ContractPreview — Modale de prévisualisation d'un contrat avant signature
// ════════════════════════════════════════════════════════════════════
//
// Affichage d'un contrat formaté à la manière d'un PDF (mise en page A4,
// header avec logo, parties, articles, totaux, signataires) que l'user
// peut relire avant d'envoyer pour signature.
//
// Boutons d'action :
//   - Télécharger PDF (utilise window.print() avec @media print)
//   - Modifier (ferme la preview)
//   - Confirmer envoi (callback onConfirm)
//
// Props :
//   contract     : objet contrat complet (id, client_id, products, sums, etc.)
//   clientObj    : objet client (name/raison_sociale, adresse, siren, etc.)
//   templateName : nom du modèle CGV utilisé (texte ex: "CGV Astorya Suite v4.2")
//   onClose      : callback fermeture (Modifier)
//   onConfirm    : callback envoi signature
// ════════════════════════════════════════════════════════════════════

const ContractPreview = ({ contract, clientObj, templateName, cgvText, templatePdfUrl, onClose, onConfirm }) => {
  if (!contract) return null;

  const fmt = (n) => {
    if (n == null || isNaN(n)) return "0,00 €";
    return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };
  const fmtDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
    catch (e) { return d; }
  };

  const sums = contract.sums || {};
  const products = contract.products || [];
  const annexes = contract.annexes || [];
  const clauses = contract.clauses || [];

  const tva = sums.totalY1HT ? sums.totalY1HT * 0.20 : 0;
  const totalTtc = (sums.totalY1HT || 0) + tva;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={S.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div style={S.shell}>
        {/* Topbar — masqué à l'impression */}
        <div style={S.topbar} className="cp-no-print">
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            🔍 Prévisualisation contrat — relisez avant envoi
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={S.btnLight}>↓ Télécharger PDF</button>
            <button onClick={onClose} style={S.btnGhost}>← Modifier</button>
            <button onClick={onConfirm} style={S.btnConfirm}>✓ Confirmer & envoyer pour signature</button>
          </div>
        </div>

        {/* Page A4 — le "PDF" */}
        <div style={S.page} className="cp-page">
          {/* Header */}
          <div style={S.header}>
            <div>
              <div style={S.logo}>ASTORYA</div>
              <div style={S.tagline}>ERP & Cybersécurité — Souveraineté française</div>
            </div>
            <div style={S.contractMeta}>
              <div style={S.metaLabel}>Référence contrat</div>
              <div style={S.metaValue}>{contract.id || "CTR-DRAFT"}</div>
              <div style={S.metaLabel}>Date d'émission</div>
              <div style={S.metaValue}>{fmtDate(new Date())}</div>
            </div>
          </div>

          <h1 style={S.h1}>{contract.name || "Contrat de prestation"}</h1>
          <div style={S.subtitle}>{templateName || "CGV Astorya Suite v4.2 — FR"} · DORA-compliant</div>

          {/* Parties */}
          <div style={S.section}>
            <h2 style={S.h2}>Entre les soussignés</h2>
            <div style={S.parties}>
              <div style={S.party}>
                <div style={S.partyLabel}>Le Prestataire</div>
                <div style={S.partyName}>Astorya SAS</div>
                <div style={S.partyDetail}>
                  Siège social : 12 rue de la Tech, 75008 Paris<br/>
                  SIREN : 123 456 789 · RCS Paris<br/>
                  TVA : FR 12 345678901<br/>
                  Représentée par M. Daviaud, Directeur
                </div>
              </div>
              <div style={S.party}>
                <div style={S.partyLabel}>Le Client</div>
                <div style={S.partyName}>{(clientObj && (clientObj.name || clientObj.raison_sociale)) || contract.client_name || "Client"}</div>
                <div style={S.partyDetail}>
                  {clientObj && clientObj.adresse && <>Siège : {clientObj.adresse}<br/></>}
                  {clientObj && (clientObj.code_postal || clientObj.cp) && (clientObj.code_postal || clientObj.cp) + " " + ((clientObj.ville || clientObj.city) || "") + " "}<br/>
                  {clientObj && clientObj.siren && <>SIREN : {clientObj.siren}<br/></>}
                  {clientObj && clientObj.tva && <>TVA : {clientObj.tva}<br/></>}
                </div>
              </div>
            </div>
          </div>

          {/* Article 1 — Objet */}
          <div style={S.section}>
            <h2 style={S.h2}>Article 1 — Objet du contrat</h2>
            <p style={S.text}>
              Le présent contrat a pour objet la fourniture par le Prestataire au Client des prestations
              décrites ci-dessous. Le contrat est régi par les conditions générales de vente du Prestataire
              ({templateName || "CGV Astorya Suite v4.2 — FR"}), annexées au présent document.
            </p>
          </div>

          {/* Article 2 — Périmètre */}
          <div style={S.section}>
            <h2 style={S.h2}>Article 2 — Périmètre des prestations</h2>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Désignation</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Qté</th>
                  <th style={{ ...S.th, textAlign: "right" }}>PU HT</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Périodicité</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Total HT</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const lineHT = (Number(p.unit) || 0) * (Number(p.qty) || 0) * (1 - (Number(p.discount) || 0) / 100);
                  return (
                    <tr key={p.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.desc && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.desc}</div>}
                      </td>
                      <td style={{ ...S.td, textAlign: "right" }}>{p.qty}</td>
                      <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(p.unit)}</td>
                      <td style={{ ...S.td, textAlign: "right", fontSize: 11.5 }}>{p.periodicity === "oneshot" ? "Forfait" : "Annuel"}</td>
                      <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{fmt(lineHT)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totaux */}
            <div style={S.totalsBox}>
              <div style={S.totalRow}>
                <span>Sous-total HT</span>
                <span style={S.totalVal}>{fmt(sums.totalY1HT)}</span>
              </div>
              <div style={S.totalRow}>
                <span>TVA 20 %</span>
                <span style={S.totalVal}>{fmt(tva)}</span>
              </div>
              <div style={{ ...S.totalRow, ...S.totalRowStrong }}>
                <span>Total TTC année 1</span>
                <span style={S.totalVal}>{fmt(totalTtc)}</span>
              </div>
              {sums.tcv > 0 && (
                <div style={{ ...S.totalRow, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 700 }}>Total Contract Value (TCV)</span>
                  <span style={{ ...S.totalVal, color: "#4f46e5" }}>{fmt(sums.tcv)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Article 3 — Durée */}
          <div style={S.section}>
            <h2 style={S.h2}>Article 3 — Durée et reconduction</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                <tr>
                  <td style={S.tdMeta}>Date de début</td>
                  <td style={S.tdMetaVal}>{fmtDate(contract.start)}</td>
                </tr>
                <tr>
                  <td style={S.tdMeta}>Date de fin</td>
                  <td style={S.tdMetaVal}>{fmtDate(contract.end)}</td>
                </tr>
                <tr>
                  <td style={S.tdMeta}>Durée</td>
                  <td style={S.tdMetaVal}>{contract.duration || "—"} mois</td>
                </tr>
                <tr>
                  <td style={S.tdMeta}>Reconduction tacite</td>
                  <td style={S.tdMetaVal}>{contract.tacite ? "Oui — préavis 90 jours" : "Non"}</td>
                </tr>
                <tr>
                  <td style={S.tdMeta}>Indexation</td>
                  <td style={S.tdMetaVal}>{contract.indexation || "—"} (cap {contract.indexCap || 3} %)</td>
                </tr>
                <tr>
                  <td style={S.tdMeta}>Modalités de paiement</td>
                  <td style={S.tdMetaVal}>{contract.payment_delay || "30 j"} · facturation {contract.billing_period === "monthly" ? "mensuelle" : contract.billing_period === "quarterly" ? "trimestrielle" : "annuelle"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Article 4 — Clauses spécifiques */}
          {clauses.length > 0 && (
            <div style={S.section}>
              <h2 style={S.h2}>Article 4 — Clauses négociées</h2>
              <ul style={S.list}>
                {clauses.map((c) => (
                  <li key={c.id} style={S.listItem}>
                    {c.tag && <span style={S.tag}>{c.tag}</span>}
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article 5 — Annexes */}
          {annexes.length > 0 && (
            <div style={S.section}>
              <h2 style={S.h2}>Article 5 — Annexes</h2>
              <ul style={S.list}>
                {annexes.map((a) => <li key={a.id} style={S.listItem}>📎 {a.label}</li>)}
              </ul>
            </div>
          )}

          {/* Signatures */}
          <div style={{ ...S.section, marginTop: 50 }}>
            <h2 style={S.h2}>Signatures</h2>
            <div style={S.signatures}>
              <div style={S.signBox}>
                <div style={S.signLabel}>Pour le Prestataire</div>
                <div style={S.signName}>Astorya SAS</div>
                <div style={S.signSub}>M. Daviaud, Directeur</div>
                <div style={S.signZone}>Signature électronique qualifiée (eIDAS)</div>
              </div>
              <div style={S.signBox}>
                <div style={S.signLabel}>Pour le Client</div>
                <div style={S.signName}>{(clientObj && (clientObj.name || clientObj.raison_sociale)) || "—"}</div>
                <div style={S.signSub}>{(contract.signatory && contract.signatory.name) || "Signataire à renseigner"} {contract.signatory && contract.signatory.role ? "· " + contract.signatory.role : ""}</div>
                <div style={S.signZone}>Signature électronique qualifiée (eIDAS)</div>
              </div>
            </div>
            <div style={S.footer}>
              Contrat émis le {fmtDate(new Date())} — Astorya SAS · 12 rue de la Tech, 75008 Paris · SIREN 123 456 789
            </div>
          </div>

          {/* CGV — Conditions Générales de Vente extraites du PDF modèle */}
          {cgvText && (
            <div style={{ ...S.section, marginTop: 60, paddingTop: 30, borderTop: "3px double #0f172a" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, textAlign: "center" }}>
                ANNEXE — Conditions Générales de Vente
              </div>
              <h2 style={{ ...S.h2, textAlign: "center", fontSize: 16 }}>{templateName}</h2>
              {templatePdfUrl && (
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <a href={templatePdfUrl} target="_blank" rel="noopener" style={{ fontSize: 11, color: "#3730a3", fontWeight: 600, textDecoration: "underline" }}>
                    📄 Télécharger les CGV en PDF original
                  </a>
                </div>
              )}
              <div style={{
                fontSize: 9.5,
                lineHeight: 1.55,
                color: "#475569",
                whiteSpace: "pre-wrap",
                columnCount: 2,
                columnGap: 22,
                columnRule: "1px solid #e2e8f0",
                textAlign: "justify",
                hyphens: "auto",
              }}>
                {cgvText}
              </div>
            </div>
          )}
          {!cgvText && (
            <div style={{ marginTop: 30, padding: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11.5, color: "#78350f", textAlign: "center" }}>
              ⚠ Aucun texte CGV extrait disponible pour ce modèle. Réuploade le PDF depuis l'admin pour avoir l'annexe complète.
            </div>
          )}
        </div>
      </div>

      {/* Styles d'impression — masque la topbar, ajuste page */}
      <style>{`
        @media print {
          .cp-no-print { display: none !important; }
          body * { visibility: hidden; }
          .cp-page, .cp-page * { visibility: visible; }
          .cp-page { position: absolute; left: 0; top: 0; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
};

const S = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)", zIndex: 100000, overflow: "auto", padding: "20px 0", fontFamily: "'Inter', system-ui, sans-serif" },
  shell: { maxWidth: 900, margin: "0 auto" },
  topbar: { position: "sticky", top: 0, zIndex: 10, padding: "14px 20px", background: "#0f172a", borderRadius: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 },
  btnLight: { padding: "8px 14px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  btnGhost: { padding: "8px 14px", background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  btnConfirm: { padding: "8px 16px", background: "#10b981", color: "#fff", border: 0, borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700 },

  page: { background: "#fff", padding: "48px 56px", borderRadius: 12, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", color: "#0f172a", fontSize: 12 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, borderBottom: "2px solid #0f172a", marginBottom: 28 },
  logo: { fontSize: 26, fontWeight: 900, letterSpacing: 3, color: "#0f172a" },
  tagline: { fontSize: 10, color: "#64748b", marginTop: 4, letterSpacing: 0.5 },
  contractMeta: { textAlign: "right", fontSize: 10.5 },
  metaLabel: { color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 9, fontWeight: 700 },
  metaValue: { color: "#0f172a", fontVariantNumeric: "tabular-nums", marginBottom: 6, fontWeight: 700, fontSize: 12 },

  h1: { fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: "#475569", marginBottom: 28, fontStyle: "italic" },

  section: { marginBottom: 26 },
  h2: { fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: "#0f172a", letterSpacing: -0.2 },
  text: { fontSize: 12, lineHeight: 1.6, color: "#334155", margin: 0 },

  parties: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 },
  party: { padding: 14, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  partyLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 4 },
  partyName: { fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6 },
  partyDetail: { fontSize: 11, color: "#475569", lineHeight: 1.6 },

  table: { width: "100%", borderCollapse: "collapse", marginTop: 6 },
  th: { textAlign: "left", padding: "8px 10px", fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "9px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#0f172a" },
  tdMeta: { padding: "5px 0", fontSize: 11.5, color: "#64748b", width: "40%" },
  tdMetaVal: { padding: "5px 0", fontSize: 12, fontWeight: 600, color: "#0f172a" },

  totalsBox: { marginTop: 14, marginLeft: "auto", maxWidth: 360, padding: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: "#475569" },
  totalRowStrong: { borderTop: "2px solid #0f172a", marginTop: 6, paddingTop: 8, color: "#0f172a", fontWeight: 700, fontSize: 13 },
  totalVal: { fontVariantNumeric: "tabular-nums", fontWeight: 700 },

  list: { margin: "6px 0 0", paddingLeft: 0, listStyle: "none" },
  listItem: { fontSize: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", color: "#334155", display: "flex", alignItems: "center", gap: 10 },
  tag: { fontSize: 10, padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: 4, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 },

  signatures: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 },
  signBox: { padding: 18, border: "2px dashed #cbd5e1", borderRadius: 10, minHeight: 130 },
  signLabel: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 6 },
  signName: { fontSize: 13.5, fontWeight: 700, color: "#0f172a" },
  signSub: { fontSize: 11.5, color: "#64748b", marginTop: 2 },
  signZone: { fontSize: 10.5, color: "#94a3b8", marginTop: 20, fontStyle: "italic", textAlign: "center", paddingTop: 16, borderTop: "1px dashed #e2e8f0" },

  footer: { marginTop: 40, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 10, color: "#94a3b8", textAlign: "center" },
};

window.ContractPreview = ContractPreview;
