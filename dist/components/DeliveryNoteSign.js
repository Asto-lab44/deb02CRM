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

var DeliveryNoteSign = ({
  blId,
  onClose,
  onSigned
}) => {
  var [bl, setBl] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [signing, setSigning] = React.useState(false);
  var [signerName, setSignerName] = React.useState("");
  var [signerRole, setSignerRole] = React.useState("");
  var [items, setItems] = React.useState([]);
  var canvasRef = React.useRef(null);
  var [hasSignature, setHasSignature] = React.useState(false);
  React.useEffect(() => {
    if (!blId || !window.api) return;
    window.api.deliveryNotes.getById(blId).then(data => {
      setBl(data);
      // Tous les items cochés par défaut (le client peut décocher)
      setItems((data?.items || []).map(it => ({
        ...it,
        verified: true
      })));
      setLoading(false);
    });
  }, [blId]);

  // ───── Signature pad
  React.useEffect(() => {
    if (loading || !canvasRef.current) return;
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");
    var drawing = false;
    var lastX = 0,
      lastY = 0;
    var getCoords = e => {
      var rect = canvas.getBoundingClientRect();
      var t = e.touches && e.touches[0] ? e.touches[0] : e;
      return {
        x: t.clientX - rect.left,
        y: t.clientY - rect.top
      };
    };
    var start = e => {
      e.preventDefault();
      drawing = true;
      var {
        x,
        y
      } = getCoords(e);
      lastX = x;
      lastY = y;
    };
    var draw = e => {
      if (!drawing) return;
      e.preventDefault();
      var {
        x,
        y
      } = getCoords(e);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
      setHasSignature(true);
    };
    var stop = () => {
      drawing = false;
    };
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", start, {
      passive: false
    });
    canvas.addEventListener("touchmove", draw, {
      passive: false
    });
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
  var clearSignature = () => {
    var canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };
  var sign = async () => {
    if (!hasSignature) {
      if (window.HubToast) window.HubToast.warn("Veuillez signer dans la zone prévue.");
      return;
    }
    if (!signerName.trim()) {
      if (window.HubToast) window.HubToast.warn("Veuillez renseigner votre nom.");
      return;
    }
    setSigning(true);
    try {
      var dataURL = canvasRef.current.toDataURL("image/png");
      await window.api.deliveryNotes.sign(blId, {
        name: signerName.trim(),
        role: signerRole.trim() || null,
        signatureDataURL: dataURL,
        items: items.map(it => ({
          id: it.id,
          project_item_id: it.project_item_id,
          verified: it.verified,
          quantity: it.quantity
        }))
      });
      if (window.HubToast) window.HubToast.success("✓ BL signé · merci !");
      if (onSigned) onSigned();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur signature : " + (e.message || e));
      setSigning(false);
    }
  };
  var fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) : "—";
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: S.overlay,
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      style: S.card,
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "#64748b"
      }
    }, "Chargement du BL\u2026")));
  }
  if (!bl) {
    return /*#__PURE__*/React.createElement("div", {
      style: S.overlay,
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      style: S.card,
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "#64748b"
      }
    }, "BL introuvable")));
  }
  if (bl.status === "signed") {
    return /*#__PURE__*/React.createElement("div", {
      style: S.overlay,
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      style: S.card,
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 36,
        marginBottom: 10
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        color: "#065f46",
        margin: "0 0 8px"
      }
    }, "BL d\xE9j\xE0 sign\xE9"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: "#64748b",
        margin: "0 0 12px"
      }
    }, "Sign\xE9 le ", fmtDate(bl.signed_at), " par ", /*#__PURE__*/React.createElement("strong", null, bl.signed_by_name), bl.signed_by_role ? " (" + bl.signed_by_role + ")" : ""), bl.signature_url && /*#__PURE__*/React.createElement("div", {
      style: {
        margin: "12px auto",
        padding: 12,
        background: "#fafbfc",
        border: "1px solid #eef1f5",
        borderRadius: 8,
        display: "inline-block"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: bl.signature_url,
      alt: "Signature",
      style: {
        maxHeight: 80
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      style: S.btnPrimary
    }, "Fermer")))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: S.overlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: S.head
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      textTransform: "uppercase",
      fontWeight: 700,
      letterSpacing: 0.5
    }
  }, "BON DE LIVRAISON"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a",
      margin: "2px 0 0"
    }
  }, bl.number), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "Date livraison : ", fmtDate(bl.delivery_date))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: S.close
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Info, {
    label: "Adresse de livraison",
    val: bl.delivery_address || "—"
  }), /*#__PURE__*/React.createElement(Info, {
    label: "Contact sur place",
    val: bl.delivery_contact || "—"
  })), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h3", {
    style: S.h3
  }, "\uD83D\uDCE6 Livraison (", items.length, ")"), /*#__PURE__*/React.createElement("p", {
    style: S.help
  }, "Cochez les lignes effectivement re\xE7ues conformes. Vous pouvez d\xE9cocher en cas de manquant ou non-conformit\xE9."), /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      width: 38
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right",
      width: 70
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "SN livr\xE9s"))), /*#__PURE__*/React.createElement("tbody", null, items.map((it, i) => /*#__PURE__*/React.createElement("tr", {
    key: it.id,
    style: {
      background: it.verified ? "#fff" : "#fef2f2"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: it.verified,
    onChange: e => setItems(arr => arr.map((x, j) => j === i ? {
      ...x,
      verified: e.target.checked
    } : x)),
    style: {
      width: 18,
      height: 18,
      cursor: "pointer"
    }
  })), /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, it.designation)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, Number(it.quantity).toFixed(0), " ", it.unit), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      fontSize: 11,
      color: "#64748b"
    }
  }, it.serial_numbers && it.serial_numbers.length ? it.serial_numbers.join(", ") : "—")))))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h3", {
    style: S.h3
  }, "\u270D Signature \xE9lectronique"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Nom et pr\xE9nom *"), /*#__PURE__*/React.createElement("input", {
    value: signerName,
    onChange: e => setSignerName(e.target.value),
    placeholder: "ex : Marie Dupont",
    style: S.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Fonction"), /*#__PURE__*/React.createElement("input", {
    value: signerRole,
    onChange: e => setSignerRole(e.target.value),
    placeholder: "ex : Responsable IT",
    style: S.input
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "2px dashed #cbd5e1",
      borderRadius: 8,
      padding: 8,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    width: 560,
    height: 150,
    style: {
      width: "100%",
      height: 150,
      background: "#fff",
      borderRadius: 4,
      cursor: "crosshair",
      touchAction: "none",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      fontSize: 10.5,
      color: "#94a3b8",
      fontStyle: "italic",
      pointerEvents: "none"
    }
  }, !hasSignature && "Signez dans la zone ci-dessus avec votre souris ou votre doigt")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: clearSignature,
    style: S.btnGhost
  }, "\u21BA Effacer"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      fontStyle: "italic"
    }
  }, "En signant, vous attestez avoir re\xE7u les \xE9l\xE9ments coch\xE9s ci-dessus en bon \xE9tat.")))), /*#__PURE__*/React.createElement("div", {
    style: S.foot
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: S.btnGhost
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: sign,
    disabled: signing || !hasSignature || !signerName.trim(),
    style: {
      ...S.btnPrimary,
      opacity: signing || !hasSignature || !signerName.trim() ? 0.5 : 1,
      cursor: signing || !hasSignature || !signerName.trim() ? "not-allowed" : "pointer"
    }
  }, signing ? "Signature en cours…" : "✓ Signer le BL"))));
};
var Info = ({
  label,
  val
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 10,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    marginTop: 3
  }
}, val));
var S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    backdropFilter: "blur(6px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: "auto"
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    maxWidth: 720,
    width: "100%",
    boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column"
  },
  head: {
    padding: "18px 22px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  body: {
    padding: "18px 22px",
    overflowY: "auto",
    flex: 1
  },
  foot: {
    padding: "14px 22px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    background: "#fafbfc"
  },
  close: {
    background: "transparent",
    border: 0,
    color: "#94a3b8",
    fontSize: 22,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1
  },
  section: {
    marginBottom: 20
  },
  h3: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px"
  },
  help: {
    fontSize: 11.5,
    color: "#64748b",
    margin: 0
  },
  th: {
    padding: "8px 10px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    background: "#fafbfc",
    borderBottom: "1px solid #eef1f5",
    textAlign: "left"
  },
  td: {
    padding: "10px",
    fontSize: 12.5,
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a"
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit"
  },
  btnPrimary: {
    padding: "10px 18px",
    background: "#10b981",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  btnGhost: {
    padding: "10px 14px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  }
};
window.DeliveryNoteSign = DeliveryNoteSign;