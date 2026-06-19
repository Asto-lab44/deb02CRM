// ════════════════════════════════════════════════════════════════════
// DeliveryNotePreview — Aperçu PDF imprimable d'un BL signé
// ════════════════════════════════════════════════════════════════════
//
// Modale plein écran qui affiche le BL formaté A4 (header Astorya,
// parties, items reçus/manquants, signature embarquée si signé).
// Bouton "↓ Télécharger PDF" utilise window.print() + CSS @media print
// pour générer le PDF.
//
// Props :
//   bl        : objet BL complet (+ items)
//   project   : objet projet (pour le nom + client_id)
//   client    : objet client (raison sociale, adresse)
//   onClose   : callback fermeture
// ════════════════════════════════════════════════════════════════════

const DeliveryNotePreview = ({ bl, project, client, onClose }) => {
  if (!bl) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const items = bl.items || [];
  const itemsReceived = items.filter((it) => it.verified);
  const itemsMissing = items.filter((it) => !it.verified);

  return (
    <div style={S.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div style={S.shell}>
        {/* Topbar — masquée à l'impression */}
        <div style={S.topbar} className="dn-no-print">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            📄 Bon de livraison — {bl.number}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()} style={S.btnLight}>↓ Télécharger PDF</button>
            <button onClick={onClose} style={S.btnGhost}>Fermer</button>
          </div>
        </div>

        {/* Page A4 */}
        <div style={S.page} className="dn-page">
          {/* Header */}
          <div style={S.header}>
            <div>
              <div style={S.logo}>ASTORYA</div>
              <div style={S.tagline}>ERP & Cybersécurité — Souveraineté française</div>
              <div style={S.companyInfo}>
                Astorya SAS · 12 rue de la Tech, 75008 Paris<br/>
                SIREN 123 456 789 · TVA FR12345678901
              </div>
            </div>
            <div style={S.metaBox}>
              <div style={S.metaLabel}>Bon de livraison</div>
              <div style={S.metaValue}>{bl.number}</div>
              <div style={S.metaLabel}>Date de livraison</div>
              <div style={S.metaValue}>{fmtDate(bl.delivery_date)}</div>
              {bl.status === "signed" && (
                <div style={{ marginTop: 10, padding: "4px 10px", background: "#dcfce7", color: "#065f46", borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textAlign: "center" }}>
                  ✓ SIGNÉ
                </div>
              )}
            </div>
          </div>

          <h1 style={S.h1}>{project?.name || "Bon de livraison"}</h1>
          {bl.data?.project_sage_ref && <div style={S.subtitle}>Commande Sage : {bl.data.project_sage_ref}</div>}

          {/* Parties */}
          <div style={S.parties}>
            <div style={S.partyBox}>
              <div style={S.partyLabel}>Livré par</div>
              <div style={S.partyName}>Astorya SAS</div>
              <div style={S.partyDetail}>
                12 rue de la Tech, 75008 Paris<br/>
                Contact : {bl.delivery_contact || "—"}
              </div>
            </div>
            <div style={S.partyBox}>
              <div style={S.partyLabel}>Livré à</div>
              <div style={S.partyName}>{(client && (client.name || client.raison_sociale)) || "Client"}</div>
              <div style={S.partyDetail}>
                {bl.delivery_address || (client && (client.adresse || (client.code_postal + " " + (client.ville || ""))) || "—")}
              </div>
            </div>
          </div>

          {/* Items reçus */}
          {itemsReceived.length > 0 && (
            <div style={S.section}>
              <h2 style={S.h2}>✓ Éléments livrés et reçus conformes ({itemsReceived.length})</h2>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Désignation</th>
                    <th style={{ ...S.th, textAlign: "right", width: 80 }}>Qté</th>
                    <th style={S.th}>N° série</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsReceived.map((it) => (
                    <tr key={it.id}>
                      <td style={S.td}>{it.designation}</td>
                      <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.quantity).toFixed(0)} {it.unit}</td>
                      <td style={{ ...S.td, fontSize: 11, color: "#475569" }}>{it.serial_numbers && it.serial_numbers.length ? it.serial_numbers.join(", ") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Items manquants */}
          {itemsMissing.length > 0 && (
            <div style={S.section}>
              <h2 style={{ ...S.h2, color: "#9b1c1c" }}>✗ Éléments non reçus / non conformes ({itemsMissing.length})</h2>
              <table style={{ ...S.table, borderLeft: "3px solid #dc2626" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Désignation</th>
                    <th style={{ ...S.th, textAlign: "right", width: 80 }}>Qté prévue</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsMissing.map((it) => (
                    <tr key={it.id} style={{ background: "#fef2f2" }}>
                      <td style={S.td}>{it.designation}</td>
                      <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.quantity).toFixed(0)} {it.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: "#991b1b", fontStyle: "italic", margin: "8px 0 0" }}>
                Ces éléments feront l'objet d'un BL complémentaire. Astorya s'engage à compléter la livraison sous 5 jours ouvrés.
              </p>
            </div>
          )}

          {/* Bloc signature */}
          <div style={{ ...S.section, marginTop: 30 }}>
            <h2 style={S.h2}>Signature client</h2>
            <div style={S.signBox}>
              {bl.status === "signed" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={S.signName}>{bl.signed_by_name}</div>
                      {bl.signed_by_role && <div style={S.signRole}>{bl.signed_by_role}</div>}
                    </div>
                    <div style={S.signDate}>
                      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>Signé le</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmtTime(bl.signed_at)}</div>
                    </div>
                  </div>
                  {bl.signature_url && (
                    <div style={{ textAlign: "center", padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #eef1f5" }}>
                      <img src={bl.signature_url} alt="Signature" style={{ maxHeight: 110, maxWidth: 360 }} />
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>
                    Le client atteste avoir reçu les éléments cochés ci-dessus en bon état et conformes à la commande.
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>
                  ☐ Non encore signé · le client signera à la livraison.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={S.footer}>
            Astorya SAS · 12 rue de la Tech, 75008 Paris · SIREN 123 456 789 · contact@astorya.fr<br/>
            Document généré le {fmtTime(new Date())}
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          .dn-no-print { display: none !important; }
          body * { visibility: hidden; }
          .dn-page, .dn-page * { visibility: visible; }
          .dn-page { position: absolute; left: 0; top: 0; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 18px !important; }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
};

const S = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)", zIndex: 100000, overflow: "auto", padding: "20px 0", fontFamily: "'Inter', system-ui, sans-serif" },
  shell: { maxWidth: 820, margin: "0 auto" },
  topbar: { position: "sticky", top: 0, zIndex: 10, padding: "12px 18px", background: "#0f172a", borderRadius: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" },
  btnLight: { padding: "8px 14px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600 },
  btnGhost: { padding: "8px 14px", background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600 },

  page: { background: "#fff", padding: "40px 48px", borderRadius: 10, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", color: "#0f172a", fontSize: 12 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 22, borderBottom: "2px solid #0f172a", marginBottom: 24 },
  logo: { fontSize: 24, fontWeight: 900, letterSpacing: 2.5, color: "#0f172a" },
  tagline: { fontSize: 10, color: "#64748b", marginTop: 3, letterSpacing: 0.5 },
  companyInfo: { fontSize: 10, color: "#64748b", marginTop: 10, lineHeight: 1.5 },
  metaBox: { textAlign: "right", fontSize: 10.5, minWidth: 160 },
  metaLabel: { color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 9, fontWeight: 700, marginTop: 6 },
  metaValue: { color: "#0f172a", fontVariantNumeric: "tabular-nums", marginBottom: 4, fontWeight: 700, fontSize: 12 },

  h1: { fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, color: "#64748b", marginBottom: 24, fontStyle: "italic" },

  parties: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  partyBox: { padding: 14, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  partyLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 4 },
  partyName: { fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 5 },
  partyDetail: { fontSize: 11, color: "#475569", lineHeight: 1.6 },

  section: { marginBottom: 22 },
  h2: { fontSize: 13, fontWeight: 700, margin: "0 0 8px", color: "#0f172a", letterSpacing: -0.2 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "7px 10px", fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "9px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#0f172a" },

  signBox: { border: "2px dashed #cbd5e1", borderRadius: 10, padding: 16, background: "#fafbfc" },
  signName: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  signRole: { fontSize: 11.5, color: "#64748b", marginTop: 2 },
  signDate: { textAlign: "right" },

  footer: { marginTop: 30, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: 9.5, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 },
};

window.DeliveryNotePreview = DeliveryNotePreview;
