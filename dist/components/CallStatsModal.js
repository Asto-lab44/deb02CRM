// Modal "Statistiques d'appels" — vue annuelle d'un client, mois par mois,
// répartie en 3 catégories de tickets (Incident / Demande / Problème).
// Affichage : barres empilées + table récap + KPIs en haut.

var CallStatsModal = ({
  open,
  client,
  onClose
}) => {
  React.useEffect(() => {
    if (!open) return;
    var onKey = e => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  var portalTarget = typeof document !== "undefined" ? document.body : null;

  // 3 catégories de tickets (ajustable côté API/back-office)
  var CATEGORIES = [{
    key: "incident",
    label: "Incident",
    color: "#dc2626",
    soft: "#fdecec",
    desc: "Service dégradé / panne"
  }, {
    key: "demande",
    label: "Demande",
    color: "#4f46e5",
    soft: "#eef2ff",
    desc: "Demande de service"
  }, {
    key: "probleme",
    label: "Problème",
    color: "#f59e0b",
    soft: "#fef0e6",
    desc: "Cause racine récurrente"
  }];

  // Démo : 12 mois (juin 2025 → mai 2026) d'appels pour AXA Wealth France.
  // Saisonnalité plausible : pic mars-mai (clôtures), creux juillet-août.
  var months = [{
    m: "Juin 25",
    incident: 4,
    demande: 6,
    probleme: 1
  }, {
    m: "Juil. 25",
    incident: 2,
    demande: 3,
    probleme: 0
  }, {
    m: "Août 25",
    incident: 1,
    demande: 2,
    probleme: 0
  }, {
    m: "Sept. 25",
    incident: 5,
    demande: 8,
    probleme: 1
  }, {
    m: "Oct. 25",
    incident: 7,
    demande: 9,
    probleme: 2
  }, {
    m: "Nov. 25",
    incident: 6,
    demande: 11,
    probleme: 2
  }, {
    m: "Déc. 25",
    incident: 3,
    demande: 7,
    probleme: 1
  }, {
    m: "Janv. 26",
    incident: 9,
    demande: 12,
    probleme: 3
  }, {
    m: "Févr. 26",
    incident: 8,
    demande: 10,
    probleme: 2
  }, {
    m: "Mars 26",
    incident: 11,
    demande: 14,
    probleme: 4
  }, {
    m: "Avr. 26",
    incident: 9,
    demande: 13,
    probleme: 2
  }, {
    m: "Mai 26",
    incident: 7,
    demande: 11,
    probleme: 3
  }];
  var totals = months.reduce((acc, m) => ({
    incident: acc.incident + m.incident,
    demande: acc.demande + m.demande,
    probleme: acc.probleme + m.probleme
  }), {
    incident: 0,
    demande: 0,
    probleme: 0
  });
  var grandTotal = totals.incident + totals.demande + totals.probleme;
  var peak = Math.max(...months.map(m => m.incident + m.demande + m.probleme));
  var avgPerMonth = Math.round(grandTotal / months.length);
  // Comparaison vs N-1 (fictif) : Mars 26 = pic à 29 vs 22 il y a un an = +32 %
  var yoyDelta = 18;
  var tree = /*#__PURE__*/React.createElement("div", {
    style: S.backdrop,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: S.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: S.head
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.eyebrow
  }, "Hotline \xB7 12 derniers mois"), /*#__PURE__*/React.createElement("div", {
    style: S.title
  }, "Statistiques d'appels \u2014 ", client ? client.name : "client"), /*#__PURE__*/React.createElement("div", {
    style: S.sub
  }, grandTotal, " appels trait\xE9s \xB7 ", totals.incident, " incidents \xB7 ", totals.demande, " demandes \xB7 ", totals.probleme, " probl\xE8mes")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.periodSelect
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontSize: 11,
      marginRight: 8
    }
  }, "P\xE9riode"), /*#__PURE__*/React.createElement("select", {
    defaultValue: "12m",
    style: S.selectBare
  }, /*#__PURE__*/React.createElement("option", {
    value: "12m"
  }, "12 derniers mois"), /*#__PURE__*/React.createElement("option", {
    value: "6m"
  }, "6 derniers mois"), /*#__PURE__*/React.createElement("option", {
    value: "ytd"
  }, "Ann\xE9e en cours"), /*#__PURE__*/React.createElement("option", {
    value: "2024"
  }, "2024"))), /*#__PURE__*/React.createElement("button", {
    style: S.btnGhost,
    title: "Exporter en CSV/PDF"
  }, "\u2193 Exporter"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: S.close,
    "aria-label": "Fermer"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    style: S.kpiRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Total appels"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, grandTotal), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#10b981",
      fontWeight: 600
    }
  }, "\u2191 +", yoyDelta, " % vs N-1")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Moyenne / mois"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, avgPerMonth), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "pic \xE0 ", peak, " en mars 26")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Dur\xE9e moyenne"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, "4'12", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "r\xE9solu N1 dans 68 %")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Pic d'activit\xE9"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, "10\u201312h"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "+ 18h\u201319h (vendredi)"))), /*#__PURE__*/React.createElement("div", {
    style: S.legendRow
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.key,
    style: S.legendItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: c.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, c.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#64748b"
    }
  }, "\xB7 ", totals[c.key], " (", Math.round(totals[c.key] / grandTotal * 100), " %)")))), /*#__PURE__*/React.createElement("div", {
    style: S.chartCard
  }, /*#__PURE__*/React.createElement("div", {
    style: S.chartGrid
  }, months.map(m => {
    var total = m.incident + m.demande + m.probleme;
    return /*#__PURE__*/React.createElement("div", {
      key: m.m,
      style: S.barCol
    }, /*#__PURE__*/React.createElement("div", {
      style: S.barTotal
    }, total), /*#__PURE__*/React.createElement("div", {
      style: S.barTrack
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: `${m.probleme / peak * 100}%`,
        background: CATEGORIES[2].color,
        borderRadius: "0 0 0 0"
      },
      title: `${m.probleme} problèmes`
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: `${m.demande / peak * 100}%`,
        background: CATEGORIES[1].color
      },
      title: `${m.demande} demandes`
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: `${m.incident / peak * 100}%`,
        background: CATEGORIES[0].color,
        borderRadius: "3px 3px 0 0"
      },
      title: `${m.incident} incidents`
    })), /*#__PURE__*/React.createElement("div", {
      style: S.barLabel
    }, m.m));
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.tableCard
  }, /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Mois"), CATEGORIES.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 2,
      background: c.color
    }
  }), c.label))), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Total"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Variation"))), /*#__PURE__*/React.createElement("tbody", null, months.map((m, i) => {
    var total = m.incident + m.demande + m.probleme;
    var prev = i > 0 ? months[i - 1] : null;
    var prevTotal = prev ? prev.incident + prev.demande + prev.probleme : null;
    var delta = prevTotal !== null ? total - prevTotal : null;
    return /*#__PURE__*/React.createElement("tr", {
      key: m.m,
      style: S.tr
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        fontWeight: 600
      }
    }, m.m), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        color: CATEGORIES[0].color,
        fontWeight: 600
      }
    }, m.incident), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        color: CATEGORIES[1].color,
        fontWeight: 600
      }
    }, m.demande), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        color: CATEGORIES[2].color,
        fontWeight: 600
      }
    }, m.probleme), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontWeight: 700
      }
    }, total), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right",
        fontSize: 12,
        color: delta === null ? "#cbd5e1" : delta > 0 ? "#dc2626" : delta < 0 ? "#0e7a55" : "#64748b"
      }
    }, delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`));
  }), /*#__PURE__*/React.createElement("tr", {
    style: {
      ...S.tr,
      background: "#f8fafc",
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: S.td
  }, "Total 12 mois"), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      color: CATEGORIES[0].color
    }
  }, totals.incident), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      color: CATEGORIES[1].color
    }
  }, totals.demande), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      color: CATEGORIES[2].color
    }
  }, totals.probleme), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right"
    }
  }, grandTotal), /*#__PURE__*/React.createElement("td", {
    style: {
      ...S.td,
      textAlign: "right",
      color: "#10b981"
    }
  }, "+", yoyDelta, " %"))))), /*#__PURE__*/React.createElement("div", {
    style: S.foot
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8"
    }
  }, "Source : PBX 3CX \xB7 donn\xE9es rafra\xEEchies toutes les heures"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: S.btnGhost,
    onClick: onClose
  }, "Fermer"), /*#__PURE__*/React.createElement("button", {
    style: S.btnPrimary
  }, "Ouvrir la file d'appels \u2192")))));
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};
window.CallStatsModal = CallStatsModal;
var S = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    width: "100%",
    maxWidth: 980,
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,.3)",
    display: "flex",
    flexDirection: "column"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "22px 24px 18px",
    borderBottom: "1px solid #f1f5f9"
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 4
  },
  sub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4
  },
  periodSelect: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    background: "#fff"
  },
  selectBare: {
    border: 0,
    background: "transparent",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#0f172a",
    outline: "none",
    cursor: "pointer"
  },
  btnGhost: {
    padding: "7px 12px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "8px 14px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "transparent",
    border: 0,
    fontSize: 22,
    color: "#94a3b8",
    cursor: "pointer"
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    padding: "16px 24px 0"
  },
  kpi: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "12px 14px",
    border: "1px solid #eef2f7"
  },
  kpiK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 600
  },
  kpiV: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 4,
    letterSpacing: -0.4
  },
  legendRow: {
    display: "flex",
    gap: 18,
    padding: "16px 24px 0",
    flexWrap: "wrap"
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8
  },
  chartCard: {
    margin: "12px 24px 0",
    padding: "20px 16px 12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 6,
    height: 220,
    alignItems: "flex-end"
  },
  barCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: 4
  },
  barTotal: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    fontFamily: "'JetBrains Mono', monospace"
  },
  barTrack: {
    width: "100%",
    maxWidth: 40,
    display: "flex",
    flexDirection: "column-reverse",
    height: "100%",
    alignItems: "stretch",
    gap: 1
  },
  barLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 500,
    whiteSpace: "nowrap"
  },
  tableCard: {
    margin: "16px 24px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12.5
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9"
  },
  td: {
    padding: "7px 12px",
    color: "#0f172a",
    fontVariantNumeric: "tabular-nums"
  },
  foot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px 18px",
    borderTop: "1px solid #f1f5f9"
  }
};