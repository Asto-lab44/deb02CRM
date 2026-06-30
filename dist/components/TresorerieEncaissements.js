// TresorerieEncaissements — Vue trésorerie : encaissements, acomptes,
// avoirs émis et restes à recouvrer, agrégés depuis les documents
// commerciaux (factures, factures d'acompte, avoirs).

var TresorerieEncaissements = () => {
  var [docs, setDocs] = React.useState([]);
  var [clients, setClients] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [month, setMonth] = React.useState(() => {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  });
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        var [facs, acs, avs, cls] = await Promise.all([window.api.commercialDocs.list({
          type: "facture"
        }), window.api.commercialDocs.list({
          type: "facture_acompte"
        }), window.api.commercialDocs.list({
          type: "avoir"
        }), window.api.clients.list().catch(() => [])]);
        setDocs([...(facs || []), ...(acs || []), ...(avs || [])]);
        setClients(cls || []);
      } catch (e) {
        console.warn(e);
      }
      setLoading(false);
    })();
  }, []);
  var fmt = n => (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/[  ]/g, " ") + " €";
  var clientName = id => {
    var c = clients.find(x => x.id === id);
    return c ? c.raison_sociale || c.name : id || "—";
  };
  var monthLabel = (() => {
    var [y, m] = month.split("-").map(n => parseInt(n, 10));
    return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });
  })();
  var navMonth = delta => {
    var [y, m] = month.split("-").map(n => parseInt(n, 10));
    var d = new Date(y, m - 1 + delta, 1);
    setMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };

  // Aplatit tous les encaissements (data.payments) de toutes les pièces
  var allPayments = React.useMemo(() => {
    var out = [];
    docs.forEach(d => {
      var pays = d.data && Array.isArray(d.data.payments) ? d.data.payments : [];
      pays.forEach(p => out.push({
        date: (p.date || "").slice(0, 10),
        amount: Number(p.amount) || 0,
        mode: p.mode || "—",
        ref: p.ref || "",
        doc_id: d.ref || d.id,
        doc_type: d.type,
        client_id: d.client_id
      }));
    });
    return out.sort((a, b) => a.date < b.date ? 1 : -1);
  }, [docs]);
  var MODES = {
    virement: "Virement",
    cheque: "Chèque",
    cb: "Carte bancaire",
    especes: "Espèces",
    prelevement: "Prélèvement"
  };

  // Filtrés sur le mois sélectionné
  var monthPayments = allPayments.filter(p => p.date.slice(0, 7) === month);
  var encaisseMois = monthPayments.reduce((s, p) => s + p.amount, 0);
  var acomptesMois = monthPayments.filter(p => p.doc_type === "facture_acompte").reduce((s, p) => s + p.amount, 0);

  // Avoirs émis sur le mois (par date du doc)
  var avoirsMois = docs.filter(d => d.type === "avoir" && (d.doc_date || "").slice(0, 7) === month);
  var avoirsMoisTtc = avoirsMois.reduce((s, a) => s + Math.abs(Number(a.total_ttc) || 0), 0);

  // Restes à recouvrer : factures non totalement réglées (tous mois)
  var facturesARecouvrer = React.useMemo(() => {
    var avoirsByFacture = {};
    docs.filter(d => d.type === "avoir" && d.parent_doc_id).forEach(a => {
      avoirsByFacture[a.parent_doc_id] = (avoirsByFacture[a.parent_doc_id] || 0) + Math.abs(Number(a.total_ttc) || 0);
    });
    return docs.filter(d => d.type === "facture").map(f => {
      var ttc = Number(f.total_ttc) || 0;
      var paid = (f.data && f.data.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      var avoirs = avoirsByFacture[f.id] || 0;
      var reste = Math.round((ttc - paid - avoirs) * 100) / 100;
      return {
        f,
        ttc,
        paid,
        avoirs,
        reste
      };
    }).filter(x => x.reste > 0.01).sort((a, b) => b.reste - a.reste);
  }, [docs]);
  var totalARecouvrer = facturesARecouvrer.reduce((s, x) => s + x.reste, 0);
  var docColor = t => t === "facture_acompte" ? "#0ea5e9" : t === "avoir" ? "#dc2626" : "#10b981";
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, "Accueil"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Tr\xE9sorerie \u2014 Encaissements")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navMonth(-1),
    style: S.navBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      textTransform: "capitalize",
      minWidth: 130,
      textAlign: "center"
    }
  }, monthLabel), /*#__PURE__*/React.createElement("button", {
    onClick: () => navMonth(1),
    style: S.navBtn
  }, "\u203A"))), /*#__PURE__*/React.createElement("div", {
    style: S.titleRow
  }, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "\uD83D\uDCB0 Tr\xE9sorerie \u2014 Encaissements & avoirs"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, "R\xE8glements re\xE7us, acomptes encaiss\xE9s, avoirs \xE9mis et restes \xE0 recouvrer.")), /*#__PURE__*/React.createElement("div", {
    style: S.kpiRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Encaiss\xE9 ce mois"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.kpiV,
      color: "#10b981"
    }
  }, fmt(encaisseMois)), /*#__PURE__*/React.createElement("div", {
    style: S.kpiSub
  }, monthPayments.length, " r\xE8glement", monthPayments.length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Dont acomptes"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.kpiV,
      color: "#0ea5e9"
    }
  }, fmt(acomptesMois)), /*#__PURE__*/React.createElement("div", {
    style: S.kpiSub
  }, "factures d'acompte")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Avoirs \xE9mis ce mois"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.kpiV,
      color: "#dc2626"
    }
  }, "\u2212 ", fmt(avoirsMoisTtc)), /*#__PURE__*/React.createElement("div", {
    style: S.kpiSub
  }, avoirsMois.length, " avoir", avoirsMois.length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Reste \xE0 recouvrer (total)"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.kpiV,
      color: "#ea580c"
    }
  }, fmt(totalARecouvrer)), /*#__PURE__*/React.createElement("div", {
    style: S.kpiSub
  }, facturesARecouvrer.length, " facture", facturesARecouvrer.length > 1 ? "s" : ""))), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Encaissements de ", monthLabel), monthPayments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucun encaissement ce mois.") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      ...S.rowHead
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90
    }
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 130
    }
  }, "Pi\xE8ce"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Client"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120
    }
  }, "Mode"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right"
    }
  }, "Montant")), monthPayments.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      fontVariantNumeric: "tabular-nums"
    }
  }, p.date.split("-").reverse().join("/")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 4,
      background: docColor(p.doc_type) + "1a",
      color: docColor(p.doc_type),
      fontWeight: 700
    }
  }, p.doc_id)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, clientName(p.client_id)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 120,
      color: "#64748b"
    }
  }, MODES[p.mode] || p.mode, p.ref ? " · " + p.ref : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      color: "#047857"
    }
  }, fmt(p.amount)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      borderTop: "2px solid #e2e8f0",
      fontWeight: 800
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Total encaiss\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      color: "#10b981"
    }
  }, fmt(encaisseMois))))), avoirsMois.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Avoirs \xE9mis en ", monthLabel), avoirsMois.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: S.row
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 4,
      background: "#fee2e2",
      color: "#dc2626",
      fontWeight: 700
    }
  }, a.ref || a.id)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, clientName(a.client_id), a.data && a.data.source_facture_ref ? " · réf. " + a.data.source_facture_ref : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      textAlign: "right",
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      color: "#dc2626"
    }
  }, "\u2212 ", fmt(Math.abs(a.total_ttc)))))), /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "Restes \xE0 recouvrer"), facturesARecouvrer.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: S.empty
  }, "Aucune facture en attente de r\xE8glement. \uD83C\uDF89") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      ...S.rowHead
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 130
    }
  }, "Facture"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Client"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right"
    }
  }, "TTC"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      textAlign: "right"
    }
  }, "R\xE9gl\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      textAlign: "right"
    }
  }, "Avoirs"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right"
    }
  }, "Reste d\xFB")), facturesARecouvrer.map((x, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "/gestion-commerciale?open=" + encodeURIComponent(x.f.id),
    style: {
      ...S.row,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 4,
      background: "#dcfce7",
      color: "#047857",
      fontWeight: 700
    }
  }, x.f.ref || x.f.id)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, clientName(x.f.client_id)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, fmt(x.ttc)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      color: "#047857"
    }
  }, x.paid ? fmt(x.paid) : "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      color: "#dc2626"
    }
  }, x.avoirs ? "− " + fmt(x.avoirs) : "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right",
      fontWeight: 800,
      fontVariantNumeric: "tabular-nums",
      color: "#ea580c"
    }
  }, fmt(x.reste)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.row,
      borderTop: "2px solid #e2e8f0",
      fontWeight: 800
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Total \xE0 recouvrer"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 100,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      color: "#ea580c"
    }
  }, fmt(totalARecouvrer)))))));
};
var S = {
  frame: {
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  topbar: {
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  navBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 7,
    fontSize: 15,
    fontWeight: 700,
    color: "#475569",
    cursor: "pointer",
    padding: 0
  },
  titleRow: {
    padding: "20px 28px 6px",
    background: "#fff"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    letterSpacing: -0.5
  },
  h1sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0"
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    padding: "16px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5"
  },
  kpi: {
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: "12px 14px"
  },
  kpiK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 700
  },
  kpiV: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.4,
    marginTop: 4,
    fontVariantNumeric: "tabular-nums"
  },
  kpiSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2
  },
  body: {
    padding: "20px 28px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 16
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 12px",
    textTransform: "capitalize"
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 6px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 12.5
  },
  rowHead: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid #e2e8f0"
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    fontStyle: "italic"
  }
};
window.TresorerieEncaissements = TresorerieEncaissements;