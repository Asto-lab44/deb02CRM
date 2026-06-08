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

var ContractPreview = ({
  contract,
  clientObj,
  templateName,
  onClose,
  onConfirm
}) => {
  if (!contract) return null;
  var fmt = n => {
    if (n == null || isNaN(n)) return "0,00 €";
    return Number(n).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " €";
  };
  var fmtDate = d => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return d;
    }
  };
  var sums = contract.sums || {};
  var products = contract.products || [];
  var annexes = contract.annexes || [];
  var clauses = contract.clauses || [];
  var tva = sums.totalY1HT ? sums.totalY1HT * 0.20 : 0;
  var totalTtc = (sums.totalY1HT || 0) + tva;
  var handlePrint = () => {
    window.print();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.backdrop,
    onClick: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.shell
  }, /*#__PURE__*/React.createElement("div", {
    style: S.topbar,
    className: "cp-no-print"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\uD83D\uDD0D Pr\xE9visualisation contrat \u2014 relisez avant envoi"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handlePrint,
    style: S.btnLight
  }, "\u2193 T\xE9l\xE9charger PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: S.btnGhost
  }, "\u2190 Modifier"), /*#__PURE__*/React.createElement("button", {
    onClick: onConfirm,
    style: S.btnConfirm
  }, "\u2713 Confirmer & envoyer pour signature"))), /*#__PURE__*/React.createElement("div", {
    style: S.page,
    className: "cp-page"
  }, /*#__PURE__*/React.createElement("div", {
    style: S.header
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, "ASTORYA"), /*#__PURE__*/React.createElement("div", {
    style: S.tagline
  }, "ERP & Cybers\xE9curit\xE9 \u2014 Souverainet\xE9 fran\xE7aise")), /*#__PURE__*/React.createElement("div", {
    style: S.contractMeta
  }, /*#__PURE__*/React.createElement("div", {
    style: S.metaLabel
  }, "R\xE9f\xE9rence contrat"), /*#__PURE__*/React.createElement("div", {
    style: S.metaValue
  }, contract.id || "CTR-DRAFT"), /*#__PURE__*/React.createElement("div", {
    style: S.metaLabel
  }, "Date d'\xE9mission"), /*#__PURE__*/React.createElement("div", {
    style: S.metaValue
  }, fmtDate(new Date())))), /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, contract.name || "Contrat de prestation"), /*#__PURE__*/React.createElement("div", {
    style: S.subtitle
  }, templateName || "CGV Astorya Suite v4.2 — FR", " \xB7 DORA-compliant"), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Entre les soussign\xE9s"), /*#__PURE__*/React.createElement("div", {
    style: S.parties
  }, /*#__PURE__*/React.createElement("div", {
    style: S.party
  }, /*#__PURE__*/React.createElement("div", {
    style: S.partyLabel
  }, "Le Prestataire"), /*#__PURE__*/React.createElement("div", {
    style: S.partyName
  }, "Astorya SAS"), /*#__PURE__*/React.createElement("div", {
    style: S.partyDetail
  }, "Si\xE8ge social : 12 rue de la Tech, 75008 Paris", /*#__PURE__*/React.createElement("br", null), "SIREN : 123 456 789 \xB7 RCS Paris", /*#__PURE__*/React.createElement("br", null), "TVA : FR 12 345678901", /*#__PURE__*/React.createElement("br", null), "Repr\xE9sent\xE9e par M. Daviaud, Directeur")), /*#__PURE__*/React.createElement("div", {
    style: S.party
  }, /*#__PURE__*/React.createElement("div", {
    style: S.partyLabel
  }, "Le Client"), /*#__PURE__*/React.createElement("div", {
    style: S.partyName
  }, clientObj && (clientObj.name || clientObj.raison_sociale) || contract.client_name || "Client"), /*#__PURE__*/React.createElement("div", {
    style: S.partyDetail
  }, clientObj && clientObj.adresse && /*#__PURE__*/React.createElement(React.Fragment, null, "Si\xE8ge : ", clientObj.adresse, /*#__PURE__*/React.createElement("br", null)), clientObj && (clientObj.code_postal || clientObj.cp) && (clientObj.code_postal || clientObj.cp) + " " + (clientObj.ville || clientObj.city || "") + " ", /*#__PURE__*/React.createElement("br", null), clientObj && clientObj.siren && /*#__PURE__*/React.createElement(React.Fragment, null, "SIREN : ", clientObj.siren, /*#__PURE__*/React.createElement("br", null)), clientObj && clientObj.tva && /*#__PURE__*/React.createElement(React.Fragment, null, "TVA : ", clientObj.tva, /*#__PURE__*/React.createElement("br", null)))))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Article 1 \u2014 Objet du contrat"), /*#__PURE__*/React.createElement("p", {
    style: S.text
  }, "Le pr\xE9sent contrat a pour objet la fourniture par le Prestataire au Client des prestations d\xE9crites ci-dessous. Le contrat est r\xE9gi par les conditions g\xE9n\xE9rales de vente du Prestataire (", templateName || "CGV Astorya Suite v4.2 — FR", "), annex\xE9es au pr\xE9sent document.")), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Article 2 \u2014 P\xE9rim\xE8tre des prestations"), /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "D\xE9signation"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Qt\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "PU HT"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "P\xE9riodicit\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Total HT"))), /*#__PURE__*/React.createElement("tbody", null, products.map(p => {
    var lineHT = (Number(p.unit) || 0) * (Number(p.qty) || 0) * (1 - (Number(p.discount) || 0) / 100);
    return /*#__PURE__*/React.createElement("tr", {
      key: p.id
    }, /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, p.name), p.desc && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2
      }
    }, p.desc)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right"
      }
    }, p.qty), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmt(p.unit)), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontSize: 11.5
      }
    }, p.periodicity === "oneshot" ? "Forfait" : "Annuel"), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700
      }
    }, fmt(lineHT)));
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.totalsBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.totalRow
  }, /*#__PURE__*/React.createElement("span", null, "Sous-total HT"), /*#__PURE__*/React.createElement("span", {
    style: S.totalVal
  }, fmt(sums.totalY1HT))), sums.discountTotal > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalRow,
      color: "#dc2626"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Remise commerciale"), /*#__PURE__*/React.createElement("span", {
    style: S.totalVal
  }, "-", fmt(sums.discountTotal))), /*#__PURE__*/React.createElement("div", {
    style: S.totalRow
  }, /*#__PURE__*/React.createElement("span", null, "TVA 20 %"), /*#__PURE__*/React.createElement("span", {
    style: S.totalVal
  }, fmt(tva))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalRow,
      ...S.totalRowStrong
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total TTC ann\xE9e 1"), /*#__PURE__*/React.createElement("span", {
    style: S.totalVal
  }, fmt(totalTtc))), sums.tcv > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalRow,
      marginTop: 8,
      paddingTop: 8,
      borderTop: "1px solid #e2e8f0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "Total Contract Value (TCV)"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.totalVal,
      color: "#4f46e5"
    }
  }, fmt(sums.tcv))))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Article 3 \u2014 Dur\xE9e et reconduction"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Date de d\xE9but"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, fmtDate(contract.start))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Date de fin"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, fmtDate(contract.end))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Dur\xE9e"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, contract.duration || "—", " mois")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Reconduction tacite"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, contract.tacite ? "Oui — préavis 90 jours" : "Non")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Indexation"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, contract.indexation || "—", " (cap ", contract.indexCap || 3, " %)")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: S.tdMeta
  }, "Modalit\xE9s de paiement"), /*#__PURE__*/React.createElement("td", {
    style: S.tdMetaVal
  }, contract.payment_delay || "30 j", " \xB7 facturation ", contract.billing_period === "monthly" ? "mensuelle" : contract.billing_period === "quarterly" ? "trimestrielle" : "annuelle"))))), clauses.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Article 4 \u2014 Clauses n\xE9goci\xE9es"), /*#__PURE__*/React.createElement("ul", {
    style: S.list
  }, clauses.map(c => /*#__PURE__*/React.createElement("li", {
    key: c.id,
    style: S.listItem
  }, c.tag && /*#__PURE__*/React.createElement("span", {
    style: S.tag
  }, c.tag), c.text)))), annexes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Article 5 \u2014 Annexes"), /*#__PURE__*/React.createElement("ul", {
    style: S.list
  }, annexes.map(a => /*#__PURE__*/React.createElement("li", {
    key: a.id,
    style: S.listItem
  }, "\uD83D\uDCCE ", a.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.section,
      marginTop: 50
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Signatures"), /*#__PURE__*/React.createElement("div", {
    style: S.signatures
  }, /*#__PURE__*/React.createElement("div", {
    style: S.signBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.signLabel
  }, "Pour le Prestataire"), /*#__PURE__*/React.createElement("div", {
    style: S.signName
  }, "Astorya SAS"), /*#__PURE__*/React.createElement("div", {
    style: S.signSub
  }, "M. Daviaud, Directeur"), /*#__PURE__*/React.createElement("div", {
    style: S.signZone
  }, "Signature \xE9lectronique qualifi\xE9e (eIDAS)")), /*#__PURE__*/React.createElement("div", {
    style: S.signBox
  }, /*#__PURE__*/React.createElement("div", {
    style: S.signLabel
  }, "Pour le Client"), /*#__PURE__*/React.createElement("div", {
    style: S.signName
  }, clientObj && (clientObj.name || clientObj.raison_sociale) || "—"), /*#__PURE__*/React.createElement("div", {
    style: S.signSub
  }, contract.signatory && contract.signatory.name || "Signataire à renseigner", " ", contract.signatory && contract.signatory.role ? "· " + contract.signatory.role : ""), /*#__PURE__*/React.createElement("div", {
    style: S.signZone
  }, "Signature \xE9lectronique qualifi\xE9e (eIDAS)"))), /*#__PURE__*/React.createElement("div", {
    style: S.footer
  }, "Contrat \xE9mis le ", fmtDate(new Date()), " \u2014 Astorya SAS \xB7 12 rue de la Tech, 75008 Paris \xB7 SIREN 123 456 789")))), /*#__PURE__*/React.createElement("style", null, `
        @media print {
          .cp-no-print { display: none !important; }
          body * { visibility: hidden; }
          .cp-page, .cp-page * { visibility: visible; }
          .cp-page { position: absolute; left: 0; top: 0; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 24px !important; }
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
    maxWidth: 900,
    margin: "0 auto"
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: "14px 20px",
    background: "#0f172a",
    borderRadius: 10,
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
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
  btnConfirm: {
    padding: "8px 16px",
    background: "#10b981",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 700
  },
  page: {
    background: "#fff",
    padding: "48px 56px",
    borderRadius: 12,
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    color: "#0f172a",
    fontSize: 12
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 24,
    borderBottom: "2px solid #0f172a",
    marginBottom: 28
  },
  logo: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 3,
    color: "#0f172a"
  },
  tagline: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    letterSpacing: 0.5
  },
  contractMeta: {
    textAlign: "right",
    fontSize: 10.5
  },
  metaLabel: {
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 9,
    fontWeight: 700
  },
  metaValue: {
    color: "#0f172a",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 6,
    fontWeight: 700,
    fontSize: 12
  },
  h1: {
    fontSize: 22,
    fontWeight: 800,
    margin: "0 0 6px",
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 28,
    fontStyle: "italic"
  },
  section: {
    marginBottom: 26
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 10px",
    color: "#0f172a",
    letterSpacing: -0.2
  },
  text: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#334155",
    margin: 0
  },
  parties: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    marginTop: 8
  },
  party: {
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
    marginBottom: 6
  },
  partyDetail: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 1.6
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 6
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
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
  tdMeta: {
    padding: "5px 0",
    fontSize: 11.5,
    color: "#64748b",
    width: "40%"
  },
  tdMetaVal: {
    padding: "5px 0",
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a"
  },
  totalsBox: {
    marginTop: 14,
    marginLeft: "auto",
    maxWidth: 360,
    padding: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 12,
    color: "#475569"
  },
  totalRowStrong: {
    borderTop: "2px solid #0f172a",
    marginTop: 6,
    paddingTop: 8,
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 13
  },
  totalVal: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700
  },
  list: {
    margin: "6px 0 0",
    paddingLeft: 0,
    listStyle: "none"
  },
  listItem: {
    fontSize: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  tag: {
    fontSize: 10,
    padding: "2px 8px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.3,
    flexShrink: 0
  },
  signatures: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginTop: 16
  },
  signBox: {
    padding: 18,
    border: "2px dashed #cbd5e1",
    borderRadius: 10,
    minHeight: 130
  },
  signLabel: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 700,
    marginBottom: 6
  },
  signName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#0f172a"
  },
  signSub: {
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 2
  },
  signZone: {
    fontSize: 10.5,
    color: "#94a3b8",
    marginTop: 20,
    fontStyle: "italic",
    textAlign: "center",
    paddingTop: 16,
    borderTop: "1px dashed #e2e8f0"
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTop: "1px solid #e2e8f0",
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center"
  }
};
window.ContractPreview = ContractPreview;