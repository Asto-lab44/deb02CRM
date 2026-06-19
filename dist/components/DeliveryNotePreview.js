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

var DeliveryNotePreview = ({
  bl,
  project,
  client,
  onClose
}) => {
  if (!bl) return null;
  var fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) : "—";
  var fmtTime = d => d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "—";
  var items = bl.items || [];
  var itemsReceived = items.filter(it => it.verified);
  var itemsMissing = items.filter(it => !it.verified);
  return /*#__PURE__*/React.createElement("div", {
    style: S.backdrop,
    onClick: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.shell
  }, /*#__PURE__*/React.createElement("div", {
    style: S.topbar,
    className: "dn-no-print"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\uD83D\uDCC4 Bon de livraison \u2014 ", bl.number), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    style: S.btnLight
  }, "\u2193 T\xE9l\xE9charger PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: S.btnGhost
  }, "Fermer"))), /*#__PURE__*/React.createElement("div", {
    style: S.page,
    className: "dn-page"
  }, /*#__PURE__*/React.createElement("div", {
    style: S.header
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, "ASTORYA"), /*#__PURE__*/React.createElement("div", {
    style: S.tagline
  }, "ERP & Cybers\xE9curit\xE9 \u2014 Souverainet\xE9 fran\xE7aise"), /*#__PURE__*/React.createElement("div", {
    style: S.companyInfo
  }, "Astorya SAS \xB7 12 rue de la Tech, 75008 Paris", /*#__PURE__*/React.createElement("br", null), "SIREN 123 456 789 \xB7 TVA FR12345678901")), /*#__PURE__*/React.createElement("div", {
    style: S.metaBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.metaLabel
  }, "Bon de livraison"), /*#__PURE__*/React.createElement("div", {
    style: S.metaValue
  }, bl.number), /*#__PURE__*/React.createElement("div", {
    style: S.metaLabel
  }, "Date de livraison"), /*#__PURE__*/React.createElement("div", {
    style: S.metaValue
  }, fmtDate(bl.delivery_date)), bl.status === "signed" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "4px 10px",
      background: "#dcfce7",
      color: "#065f46",
      borderRadius: 6,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: 0.5,
      textAlign: "center"
    }
  }, "\u2713 SIGN\xC9"))), /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, project?.name || "Bon de livraison"), bl.data?.project_sage_ref && /*#__PURE__*/React.createElement("div", {
    style: S.subtitle
  }, "Commande Sage : ", bl.data.project_sage_ref), /*#__PURE__*/React.createElement("div", {
    style: S.parties
  }, /*#__PURE__*/React.createElement("div", {
    style: S.partyBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.partyLabel
  }, "Livr\xE9 par"), /*#__PURE__*/React.createElement("div", {
    style: S.partyName
  }, "Astorya SAS"), /*#__PURE__*/React.createElement("div", {
    style: S.partyDetail
  }, "12 rue de la Tech, 75008 Paris", /*#__PURE__*/React.createElement("br", null), "Contact : ", bl.delivery_contact || "—")), /*#__PURE__*/React.createElement("div", {
    style: S.partyBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.partyLabel
  }, "Livr\xE9 \xE0"), /*#__PURE__*/React.createElement("div", {
    style: S.partyName
  }, client && (client.name || client.raison_sociale) || "Client"), /*#__PURE__*/React.createElement("div", {
    style: S.partyDetail
  }, bl.delivery_address || client && (client.adresse || client.code_postal + " " + (client.ville || "")) || "—"))), itemsReceived.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\u2713 \xC9l\xE9ments livr\xE9s et re\xE7us conformes (", itemsReceived.length, ")"), /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right",
      width: 80
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "N\xB0 s\xE9rie"))), /*#__PURE__*/React.createElement("tbody", null, itemsReceived.map(it => /*#__PURE__*/React.createElement("tr", {
    key: it.id
  }, /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, it.designation), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, Number(it.quantity).toFixed(0), " ", it.unit), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      fontSize: 11,
      color: "#475569"
    }
  }, it.serial_numbers && it.serial_numbers.length ? it.serial_numbers.join(", ") : "—")))))), itemsMissing.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...S.h2,
      color: "#9b1c1c"
    }
  }, "\u2717 \xC9l\xE9ments non re\xE7us / non conformes (", itemsMissing.length, ")"), /*#__PURE__*/React.createElement("table", {
    style: {
      ...S.table,
      borderLeft: "3px solid #dc2626"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right",
      width: 80
    }
  }, "Qt\xE9 pr\xE9vue"))), /*#__PURE__*/React.createElement("tbody", null, itemsMissing.map(it => /*#__PURE__*/React.createElement("tr", {
    key: it.id,
    style: {
      background: "#fef2f2"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, it.designation), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, Number(it.quantity).toFixed(0), " ", it.unit))))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "#991b1b",
      fontStyle: "italic",
      margin: "8px 0 0"
    }
  }, "Ces \xE9l\xE9ments feront l'objet d'un BL compl\xE9mentaire. Astorya s'engage \xE0 compl\xE9ter la livraison sous 5 jours ouvr\xE9s.")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.section,
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Signature client"), /*#__PURE__*/React.createElement("div", {
    style: S.signBox
  }, bl.status === "signed" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.signName
  }, bl.signed_by_name), bl.signed_by_role && /*#__PURE__*/React.createElement("div", {
    style: S.signRole
  }, bl.signed_by_role)), /*#__PURE__*/React.createElement("div", {
    style: S.signDate
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      textTransform: "uppercase",
      fontWeight: 700,
      letterSpacing: 0.4
    }
  }, "Sign\xE9 le"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, fmtTime(bl.signed_at)))), bl.signature_url && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 12,
      background: "#fff",
      borderRadius: 6,
      border: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: bl.signature_url,
    alt: "Signature",
    style: {
      maxHeight: 110,
      maxWidth: 360
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      marginTop: 10,
      textAlign: "center",
      fontStyle: "italic"
    }
  }, "Le client atteste avoir re\xE7u les \xE9l\xE9ments coch\xE9s ci-dessus en bon \xE9tat et conformes \xE0 la commande.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 20,
      color: "#94a3b8",
      fontSize: 13
    }
  }, "\u2610 Non encore sign\xE9 \xB7 le client signera \xE0 la livraison."))), /*#__PURE__*/React.createElement("div", {
    style: S.footer
  }, "Astorya SAS \xB7 12 rue de la Tech, 75008 Paris \xB7 SIREN 123 456 789 \xB7 contact@astorya.fr", /*#__PURE__*/React.createElement("br", null), "Document g\xE9n\xE9r\xE9 le ", fmtTime(new Date())))), /*#__PURE__*/React.createElement("style", null, `
        @media print {
          .dn-no-print { display: none !important; }
          body * { visibility: hidden; }
          .dn-page, .dn-page * { visibility: visible; }
          .dn-page { position: absolute; left: 0; top: 0; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 18px !important; }
          @page { margin: 10mm; }
        }
      `));
};
var S = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(6px)",
    zIndex: 100000,
    overflow: "auto",
    padding: "20px 0",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  shell: {
    maxWidth: 820,
    margin: "0 auto"
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: "12px 18px",
    background: "#0f172a",
    borderRadius: 10,
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  btnLight: {
    padding: "8px 14px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 600
  },
  btnGhost: {
    padding: "8px 14px",
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 600
  },
  page: {
    background: "#fff",
    padding: "40px 48px",
    borderRadius: 10,
    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
    color: "#0f172a",
    fontSize: 12
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 22,
    borderBottom: "2px solid #0f172a",
    marginBottom: 24
  },
  logo: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 2.5,
    color: "#0f172a"
  },
  tagline: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 3,
    letterSpacing: 0.5
  },
  companyInfo: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 10,
    lineHeight: 1.5
  },
  metaBox: {
    textAlign: "right",
    fontSize: 10.5,
    minWidth: 160
  },
  metaLabel: {
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 9,
    fontWeight: 700,
    marginTop: 6
  },
  metaValue: {
    color: "#0f172a",
    fontVariantNumeric: "tabular-nums",
    marginBottom: 4,
    fontWeight: 700,
    fontSize: 12
  },
  h1: {
    fontSize: 22,
    fontWeight: 800,
    margin: "0 0 4px",
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 11.5,
    color: "#64748b",
    marginBottom: 24,
    fontStyle: "italic"
  },
  parties: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24
  },
  partyBox: {
    padding: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fafbfc"
  },
  partyLabel: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 700,
    marginBottom: 4
  },
  partyName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 5
  },
  partyDetail: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 1.6
  },
  section: {
    marginBottom: 22
  },
  h2: {
    fontSize: 13,
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#0f172a",
    letterSpacing: -0.2
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "7px 10px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0"
  },
  td: {
    padding: "9px 10px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 12,
    color: "#0f172a"
  },
  signBox: {
    border: "2px dashed #cbd5e1",
    borderRadius: 10,
    padding: 16,
    background: "#fafbfc"
  },
  signName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  signRole: {
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 2
  },
  signDate: {
    textAlign: "right"
  },
  footer: {
    marginTop: 30,
    paddingTop: 14,
    borderTop: "1px solid #e2e8f0",
    fontSize: 9.5,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.5
  }
};
window.DeliveryNotePreview = DeliveryNotePreview;