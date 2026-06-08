// ════════════════════════════════════════════════════════════════════
// ProcedureBadge — Badge BODACC procédure collective
// ════════════════════════════════════════════════════════════════════
//
// Affiche un badge coloré indiquant le statut BODACC d'une entreprise :
//   🟢 RAS               — aucune procédure publiée
//   🟠 Procédure en cours — sauvegarde / redressement / conciliation
//   🔴 Liquidation       — liquidation judiciaire ou cessation
//   ⚪ Loading           — check en cours
//   ⚠ Erreur             — erreur réseau ou SIREN invalide
//
// Props :
//   siren           : SIREN à vérifier (string, 9 digits)
//   stored          : objet result précédent (depuis client.data.procedure_collective) optionnel
//   autoCheck       : si true et stored est null OU stale > 7j, lance le check au mount
//   onChange        : callback({result}) quand le badge a un nouveau résultat (à utiliser pour persister)
//   compact         : true → version mini, false → pleine taille avec détails
// ════════════════════════════════════════════════════════════════════

const ProcedureBadge = ({ siren, stored, autoCheck = true, onChange, compact = false }) => {
  const [result, setResult] = React.useState(stored || null);
  const [loading, setLoading] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const doCheck = React.useCallback(async () => {
    if (!siren || !window.HubBodacc) return;
    setLoading(true);
    const r = await window.HubBodacc.checkSiren(siren);
    setResult(r);
    setLoading(false);
    if (onChange) onChange(r);
  }, [siren, onChange]);

  // Auto-check au mount si pas de stored OU si stale
  React.useEffect(() => {
    if (!autoCheck || !siren) return;
    if (!result || window.HubBodacc.isStale(result, 7)) {
      doCheck();
    }
  }, [siren]); // déclenche quand siren change

  if (!siren) return null;

  const cleanSiren = String(siren).replace(/\D/g, "");
  if (cleanSiren.length !== 9) return null;

  const palette = {
    ok:      { bg: "#dcfce7", fg: "#065f46", border: "#86efac", icon: "🟢", label: "RAS BODACC" },
    warn:    { bg: "#fef3c7", fg: "#78350f", border: "#fde68a", icon: "🟠", label: "Procédure en cours" },
    danger:  { bg: "#fee2e2", fg: "#991b1b", border: "#fca5a5", icon: "🔴", label: "Liquidation / cessation" },
    error:   { bg: "#f1f5f9", fg: "#475569", border: "#cbd5e1", icon: "⚠",  label: "Erreur BODACC" },
    unknown: { bg: "#f1f5f9", fg: "#475569", border: "#cbd5e1", icon: "?",  label: "SIREN invalide" },
  };

  if (loading || (!result && !loading)) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: compact ? "3px 8px" : "5px 10px", borderRadius: 999, fontSize: compact ? 10.5 : 11.5, fontWeight: 600, background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}>
        <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #cbd5e1", borderTopColor: "#475569", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Vérification BODACC…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </span>
    );
  }

  const p = palette[result.status] || palette.error;
  const ann = result.announcement;
  const checkedAt = result.checked_at ? new Date(result.checked_at) : null;

  return (
    <>
      <span
        onClick={() => setShowDetails(true)}
        title="Cliquer pour voir le détail"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: compact ? "3px 9px" : "5px 11px",
          borderRadius: 999,
          fontSize: compact ? 10.5 : 11.5,
          fontWeight: 700,
          background: p.bg, color: p.fg, border: "1px solid " + p.border,
          cursor: "pointer",
          letterSpacing: 0.2,
        }}
      >
        <span style={{ fontSize: compact ? 9 : 11 }}>{p.icon}</span>
        {p.label}
        {!compact && checkedAt && (
          <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.65, fontWeight: 500 }}>
            · vérifié {checkedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
        )}
      </span>

      {/* Modale détails au clic */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 520, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Statut BODACC — {p.label}</h2>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>SIREN {cleanSiren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}</div>

            {result.status === "ok" && (
              <p style={{ fontSize: 13, color: "#065f46", margin: "0 0 18px", lineHeight: 1.5 }}>
                ✓ Aucune procédure collective publiée au BODACC. Le client n'est pas en sauvegarde, redressement ni liquidation au regard des annonces officielles.
              </p>
            )}

            {ann && (
              <div style={{ background: "#fafbfc", border: "1px solid " + p.border, borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.fg, marginBottom: 10 }}>{ann.type}</div>
                <table style={{ width: "100%", fontSize: 12.5 }}>
                  <tbody>
                    {ann.date && (
                      <tr><td style={{ color: "#64748b", padding: "4px 0", width: "40%" }}>Date de publication</td><td style={{ padding: "4px 0", fontWeight: 600 }}>{new Date(ann.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</td></tr>
                    )}
                    {ann.tribunal && (
                      <tr><td style={{ color: "#64748b", padding: "4px 0" }}>Tribunal</td><td style={{ padding: "4px 0", fontWeight: 600 }}>{ann.tribunal}</td></tr>
                    )}
                    {ann.ville && (
                      <tr><td style={{ color: "#64748b", padding: "4px 0" }}>Ville</td><td style={{ padding: "4px 0", fontWeight: 600 }}>{ann.ville}</td></tr>
                    )}
                    {ann.nature && (
                      <tr><td style={{ color: "#64748b", padding: "4px 0" }}>Nature</td><td style={{ padding: "4px 0" }}>{ann.nature}</td></tr>
                    )}
                  </tbody>
                </table>
                {result.total_count > 1 && (
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 10, paddingTop: 10, borderTop: "1px solid " + p.border }}>
                    + {result.total_count - 1} autre{result.total_count > 2 ? "s" : ""} annonce{result.total_count > 2 ? "s" : ""} dans l'historique
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <div style={{ fontSize: 12.5, color: "#9b1c1c", background: "#fef2f2", padding: 12, borderRadius: 8, border: "1px solid #fecaca", marginBottom: 18 }}>
                Erreur : {result.error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 11, color: "#94a3b8" }}>
              <span>Dernier check : {checkedAt ? checkedAt.toLocaleString("fr-FR") : "—"}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => doCheck()} style={{ padding: "7px 14px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔄 Re-vérifier maintenant</button>
                <button onClick={() => setShowDetails(false)} style={{ padding: "7px 14px", background: "transparent", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Fermer</button>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 12, fontStyle: "italic" }}>
              Source : <a href={"https://bodacc-datadila.opendatasoft.com/explore/dataset/annonces-commerciales/?refine.familleavis_lib=Proc%C3%A9dure+collective&q=" + cleanSiren} target="_blank" rel="noopener" style={{ color: "#3730a3" }}>BODACC officiel ↗</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.ProcedureBadge = ProcedureBadge;
