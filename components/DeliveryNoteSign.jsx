// ════════════════════════════════════════════════════════════════════
// DeliveryNoteSign — Modal de signature électronique d'un BL
// ════════════════════════════════════════════════════════════════════
//
// Affiche le BL en grand avec :
// - Header Astorya + ref BL + client
// - Liste des items avec checkbox "Reçu conforme"
// - Pad de signature canvas (souris/tactile)
// - Champs : nom signataire + rôle/fonction
// - Bouton "Signer" → upload signature PNG + maj BL en BDD
//
// Props :
//   blId         : id du BL à signer
//   onClose      : callback fermeture (annulation)
//   onSigned     : callback après signature OK
// ════════════════════════════════════════════════════════════════════

const DeliveryNoteSign = ({ blId, onClose, onSigned }) => {
  const [bl, setBl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [signing, setSigning] = React.useState(false);
  const [signerName, setSignerName] = React.useState("");
  const [signerRole, setSignerRole] = React.useState("");
  const [items, setItems] = React.useState([]);
  const canvasRef = React.useRef(null);
  const [hasSignature, setHasSignature] = React.useState(false);

  React.useEffect(() => {
    if (!blId || !window.api) return;
    window.api.deliveryNotes.getById(blId).then((data) => {
      setBl(data);
      // Tous les items cochés par défaut (le client peut décocher)
      setItems((data?.items || []).map((it) => ({ ...it, verified: true })));
      setLoading(false);
    });
  }, [blId]);

  // ───── Signature pad
  React.useEffect(() => {
    if (loading || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let lastX = 0, lastY = 0;

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0] ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    const start = (e) => { e.preventDefault(); drawing = true; const { x, y } = getCoords(e); lastX = x; lastY = y; };
    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getCoords(e);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x; lastY = y;
      setHasSignature(true);
    };
    const stop = () => { drawing = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("mouseleave", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };
  }, [loading]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const sign = async () => {
    if (!hasSignature) { if (window.HubToast) window.HubToast.warn("Veuillez signer dans la zone prévue."); return; }
    if (!signerName.trim()) { if (window.HubToast) window.HubToast.warn("Veuillez renseigner votre nom."); return; }
    setSigning(true);
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      await window.api.deliveryNotes.sign(blId, {
        name: signerName.trim(),
        role: signerRole.trim() || null,
        signatureDataURL: dataURL,
        items: items.map((it) => ({ id: it.id, project_item_id: it.project_item_id, verified: it.verified, quantity: it.quantity })),
      });
      if (window.HubToast) window.HubToast.success("✓ BL signé · merci !");
      if (onSigned) onSigned();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur signature : " + (e.message || e));
      setSigning(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div style={S.overlay} onClick={onClose}>
        <div style={S.card} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Chargement du BL…</div>
        </div>
      </div>
    );
  }

  if (!bl) {
    return (
      <div style={S.overlay} onClick={onClose}>
        <div style={S.card} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>BL introuvable</div>
        </div>
      </div>
    );
  }

  if (bl.status === "signed") {
    return (
      <div style={S.overlay} onClick={onClose}>
        <div style={S.card} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#065f46", margin: "0 0 8px" }}>BL déjà signé</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>Signé le {fmtDate(bl.signed_at)} par <strong>{bl.signed_by_name}</strong>{bl.signed_by_role ? " (" + bl.signed_by_role + ")" : ""}</p>
            {bl.signature_url && (
              <div style={{ margin: "12px auto", padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, display: "inline-block" }}>
                <img src={bl.signature_url} alt="Signature" style={{ maxHeight: 80 }} />
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              <button onClick={onClose} style={S.btnPrimary}>Fermer</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>BON DE LIVRAISON</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>{bl.number}</h2>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Date livraison : {fmtDate(bl.delivery_date)}</div>
          </div>
          <button onClick={onClose} style={S.close}>×</button>
        </div>

        <div style={S.body}>
          {/* Header info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <Info label="Adresse de livraison" val={bl.delivery_address || "—"} />
            <Info label="Contact sur place"    val={bl.delivery_contact || "—"} />
          </div>

          {/* Items */}
          <div style={S.section}>
            <h3 style={S.h3}>📦 Livraison ({items.length})</h3>
            <p style={S.help}>Cochez les lignes effectivement reçues conformes. Vous pouvez décocher en cas de manquant ou non-conformité.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 38 }}>✓</th>
                  <th style={S.th}>Désignation</th>
                  <th style={{ ...S.th, textAlign: "right", width: 70 }}>Qté</th>
                  <th style={S.th}>SN livrés</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id} style={{ background: it.verified ? "#fff" : "#fef2f2" }}>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <input type="checkbox" checked={it.verified}
                             onChange={(e) => setItems((arr) => arr.map((x, j) => j === i ? { ...x, verified: e.target.checked } : x))}
                             style={{ width: 18, height: 18, cursor: "pointer" }} />
                    </td>
                    <td style={S.td}><div style={{ fontWeight: 600 }}>{it.designation}</div></td>
                    <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.quantity).toFixed(0)} {it.unit}</td>
                    <td style={{ ...S.td, fontSize: 11, color: "#64748b" }}>{it.serial_numbers && it.serial_numbers.length ? it.serial_numbers.join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div style={S.section}>
            <h3 style={S.h3}>✍ Signature électronique</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={S.label}>Nom et prénom *</label>
                <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="ex : Marie Dupont"
                       style={S.input} />
              </div>
              <div>
                <label style={S.label}>Fonction</label>
                <input value={signerRole} onChange={(e) => setSignerRole(e.target.value)} placeholder="ex : Responsable IT"
                       style={S.input} />
              </div>
            </div>
            <div style={{ background: "#fafbfc", border: "2px dashed #cbd5e1", borderRadius: 8, padding: 8, position: "relative" }}>
              <canvas ref={canvasRef} width={560} height={150}
                      style={{ width: "100%", height: 150, background: "#fff", borderRadius: 4, cursor: "crosshair", touchAction: "none", display: "block" }} />
              <div style={{ position: "absolute", top: 12, left: 12, fontSize: 10.5, color: "#94a3b8", fontStyle: "italic", pointerEvents: "none" }}>
                {!hasSignature && "Signez dans la zone ci-dessus avec votre souris ou votre doigt"}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <button onClick={clearSignature} style={S.btnGhost}>↺ Effacer</button>
              <div style={{ fontSize: 10.5, color: "#64748b", fontStyle: "italic" }}>
                En signant, vous attestez avoir reçu les éléments cochés ci-dessus en bon état.
              </div>
            </div>
          </div>
        </div>

        <div style={S.foot}>
          <button onClick={onClose} style={S.btnGhost}>Annuler</button>
          <button onClick={sign} disabled={signing || !hasSignature || !signerName.trim()} style={{ ...S.btnPrimary, opacity: signing || !hasSignature || !signerName.trim() ? 0.5 : 1, cursor: signing || !hasSignature || !signerName.trim() ? "not-allowed" : "pointer" }}>
            {signing ? "Signature en cours…" : "✓ Signer le BL"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, val }) => (
  <div style={{ padding: 10, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 3 }}>{val}</div>
  </div>
);

const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif", overflow: "auto" },
  card: { background: "#fff", borderRadius: 14, maxWidth: 720, width: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", maxHeight: "92vh", display: "flex", flexDirection: "column" },
  head: { padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  body: { padding: "18px 22px", overflowY: "auto", flex: 1 },
  foot: { padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, justifyContent: "flex-end", background: "#fafbfc" },
  close: { background: "transparent", border: 0, color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 },
  section: { marginBottom: 20 },
  h3: { fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" },
  help: { fontSize: 11.5, color: "#64748b", margin: 0 },
  th: { padding: "8px 10px", fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, background: "#fafbfc", borderBottom: "1px solid #eef1f5", textAlign: "left" },
  td: { padding: "10px", fontSize: 12.5, borderBottom: "1px solid #f1f5f9", color: "#0f172a" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btnPrimary: { padding: "10px 18px", background: "#10b981", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnGhost: { padding: "10px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
};

window.DeliveryNoteSign = DeliveryNoteSign;
