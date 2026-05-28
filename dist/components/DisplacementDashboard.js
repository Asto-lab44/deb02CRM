// Dashboard displacements — wins/losses face aux concurrents

const DisplacementDashboard = () => {
  const Avatar = ({
    name,
    size = 22,
    color
  }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = {
      N: "#a855f7",
      K: "#6366f1",
      S: "#10b981",
      T: "#f59e0b",
      E: "#0ea5e9",
      C: "#ec4899"
    };
    const bg = color || palette[initials[0]] || "#64748b";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0
      }
    }, initials);
  };
  const competitors = [{
    k: "salesforce",
    name: "Salesforce",
    abbr: "SF",
    color: "#00A1E0",
    wins: 11,
    losses: 12,
    openDeals: 7,
    openValue: 412,
    market: 34
  }, {
    k: "pega",
    name: "Pega",
    abbr: "PG",
    color: "#0e7a55",
    wins: 8,
    losses: 4,
    openDeals: 5,
    openValue: 286,
    market: 18
  }, {
    k: "msft",
    name: "Microsoft D365",
    abbr: "MS",
    color: "#0f172a",
    wins: 6,
    losses: 7,
    openDeals: 4,
    openValue: 142,
    market: 16
  }, {
    k: "guidewire",
    name: "Guidewire",
    abbr: "GW",
    color: "#dc2626",
    wins: 4,
    losses: 2,
    openDeals: 3,
    openValue: 524,
    market: 14
  }, {
    k: "appian",
    name: "Appian",
    abbr: "AP",
    color: "#1e40af",
    wins: 5,
    losses: 3,
    openDeals: 2,
    openValue: 78,
    market: 9
  }, {
    k: "duck_creek",
    name: "Duck Creek",
    abbr: "DC",
    color: "#7c3aed",
    wins: 3,
    losses: 2,
    openDeals: 2,
    openValue: 318,
    market: 5
  }, {
    k: "sapiens",
    name: "Sapiens",
    abbr: "SA",
    color: "#ea580c",
    wins: 2,
    losses: 1,
    openDeals: 1,
    openValue: 86,
    market: 4
  }];
  const totalWins = competitors.reduce((s, c) => s + c.wins, 0);
  const totalLosses = competitors.reduce((s, c) => s + c.losses, 0);
  const totalWinRate = Math.round(totalWins / (totalWins + totalLosses) * 100);

  // Monthly displacement count
  const monthly = [{
    m: "Juin 25",
    wins: 2,
    losses: 3
  }, {
    m: "Juil. 25",
    wins: 3,
    losses: 4
  }, {
    m: "Août 25",
    wins: 1,
    losses: 2
  }, {
    m: "Sept. 25",
    wins: 4,
    losses: 3
  }, {
    m: "Oct. 25",
    wins: 3,
    losses: 3
  }, {
    m: "Nov. 25",
    wins: 5,
    losses: 4
  }, {
    m: "Déc. 25",
    wins: 4,
    losses: 2
  }, {
    m: "Janv. 26",
    wins: 6,
    losses: 4
  }, {
    m: "Févr. 26",
    wins: 4,
    losses: 3
  }, {
    m: "Mars 26",
    wins: 5,
    losses: 2
  }, {
    m: "Avril 26",
    wins: 7,
    losses: 3
  }, {
    m: "Mai 26",
    wins: 6,
    losses: 3
  }];
  const monthMax = Math.max(...monthly.map(m => Math.max(m.wins, m.losses)));

  // Recent displacements
  const recent = [{
    type: "win",
    co: "Crédit Mutuel Océan",
    logo: "CM",
    logoBg: "#0f766e",
    from: "salesforce",
    value: 142,
    date: "il y a 8 j",
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    reason: "Conformité DORA + TCO",
    cycle: 84
  }, {
    type: "win",
    co: "BNP Asset Management",
    logo: "BP",
    logoBg: "#0f766e",
    from: "pega",
    value: 168,
    date: "il y a 12 j",
    owner: "Karim Ben Salah",
    ownerColor: "#6366f1",
    reason: "Time-to-value 3 mois",
    cycle: 102
  }, {
    type: "loss",
    co: "Macif Métropole",
    logo: "MM",
    logoBg: "#dc2626",
    from: "msft",
    value: 96,
    date: "il y a 14 j",
    owner: "Tom Verdier",
    ownerColor: "#f59e0b",
    reason: "Préférence statu-quo Microsoft",
    cycle: 124
  }, {
    type: "win",
    co: "Aviva Investors FR",
    logo: "AV",
    logoBg: "#fbbf24",
    from: "salesforce",
    value: 88,
    date: "il y a 18 j",
    owner: "Karim Ben Salah",
    ownerColor: "#6366f1",
    reason: "Pricing add-ons SF rédhibitoire",
    cycle: 76
  }, {
    type: "win",
    co: "Generali Patrimoine",
    logo: "GP",
    logoBg: "#dc2626",
    from: "guidewire",
    value: 92,
    date: "il y a 22 j",
    owner: "Karim Ben Salah",
    ownerColor: "#6366f1",
    reason: "Spécialisation métier",
    cycle: 91
  }, {
    type: "loss",
    co: "Crédit Foncier",
    logo: "CF",
    logoBg: "#1e3a8a",
    from: "salesforce",
    value: 64,
    date: "il y a 27 j",
    owner: "Julien Pasquier",
    ownerColor: "#8b5cf6",
    reason: "Influence cabinet conseil pro-SF",
    cycle: 138
  }, {
    type: "win",
    co: "Crédit Agricole Sud",
    logo: "CA",
    logoBg: "#10b981",
    from: "salesforce",
    value: 46,
    date: "il y a 1 mois",
    owner: "Tom Verdier",
    ownerColor: "#f59e0b",
    reason: "Souveraineté & UE",
    cycle: 68
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: dispStyles.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.head
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: "#64748b",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Intelligence"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Dashboard displacements")), /*#__PURE__*/React.createElement("h1", {
    style: dispStyles.h1
  }, "Displacements vs. concurrents"), /*#__PURE__*/React.createElement("p", {
    style: dispStyles.h1sub
  }, totalWins, " wins \xB7 ", totalLosses, " losses \xB7 win rate moyen ", totalWinRate, "% sur 12 mois glissants")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.segCtrl
  }, /*#__PURE__*/React.createElement("button", {
    style: dispStyles.segBtn
  }, "3 mois"), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.segBtn
  }, "6 mois"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...dispStyles.segBtn,
      ...dispStyles.segBtnActive
    }
  }, "12 mois"), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.segBtn
  }, "YTD")), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.ghostBtn
  }, "Exporter rapport"))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpiStrip
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...dispStyles.kpi,
      ...dispStyles.kpiHero
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.3
    }
  }, "Win rate global"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...dispStyles.trendChip,
      background: "rgba(16,185,129,0.2)",
      color: "#86efac"
    }
  }, "\u2191 +6 pts vs an dernier")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -0.9
    }
  }, totalWinRate, "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)"
    }
  }, totalWins, " sur ", totalWins + totalLosses)), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.heroBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: totalWins,
      background: "#10b981"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: totalLosses,
      background: "rgba(239,68,68,0.7)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8,
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#86efac"
    }
  }, "\u25CF ", totalWins, " wins"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fca5a5"
    }
  }, "\u25CF ", totalLosses, " losses"))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.kpiLabel
  }, "Valeur r\xE9cup\xE9r\xE9e"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...dispStyles.kpiValue,
      color: "#10b981"
    }
  }, "1,42 M\u20AC"), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpiSub
  }, "ARR sign\xE9 en displacement")), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.kpiLabel
  }, "Valeur perdue"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...dispStyles.kpiValue,
      color: "#dc2626"
    }
  }, "0,68 M\u20AC"), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpiSub
  }, "ARR rest\xE9 chez le concurrent")), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.kpiLabel
  }, "Cycle moyen win"), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpiValue
  }, "87 j"), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpiSub
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#10b981"
    }
  }, "\u2193"), " \u201312 j vs Q1")), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.kpiLabel
  }, "Top concurrent battu"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.compMarkBig
  }, "SF"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, "Salesforce"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "11 wins / 12 losses"))))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.grid
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panelHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: dispStyles.h3
  }, "\xC9volution mensuelle des displacements"), /*#__PURE__*/React.createElement("p", {
    style: dispStyles.h3sub
  }, "Wins (vert) vs. losses (rouge) sur les 12 derniers mois")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      fontSize: 11.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "#10b981",
      borderRadius: 2
    }
  }), "Wins"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "#fca5a5",
      borderRadius: 2
    }
  }), "Losses"))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.chart
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.chartGrid
  }, [0, 2, 4, 6, 8].reverse().map(v => /*#__PURE__*/React.createElement("div", {
    key: v,
    style: dispStyles.gridLine
  }, /*#__PURE__*/React.createElement("span", {
    style: dispStyles.gridLabel
  }, v), /*#__PURE__*/React.createElement("span", {
    style: dispStyles.gridDash
  })))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.chartBars
  }, monthly.map(m => {
    const wH = m.wins / 8 * 100;
    const lH = m.losses / 8 * 100;
    return /*#__PURE__*/React.createElement("div", {
      key: m.m,
      style: dispStyles.barGroup
    }, /*#__PURE__*/React.createElement("div", {
      style: dispStyles.barCol
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: `${wH}%`,
        background: "linear-gradient(180deg, #10b981, #059669)",
        width: 11,
        borderRadius: "3px 3px 0 0"
      },
      title: `${m.wins} wins`
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: `${lH}%`,
        background: "linear-gradient(180deg, #f87171, #dc2626)",
        width: 11,
        borderRadius: "3px 3px 0 0"
      },
      title: `${m.losses} losses`
    })), /*#__PURE__*/React.createElement("span", {
      style: dispStyles.barLabel
    }, m.m));
  }))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.insightBox
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#4f46e5"
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#475569",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, "Insight :"), " Le ratio s'inverse depuis f\xE9vrier 2026 \u2014 co\xEFncide avec la sortie de la battle card Salesforce v3 et le lancement de l'argumentaire DORA. Win rate Q2 estim\xE9 \xE0 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#10b981"
    }
  }, "67 %"), "."))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panelHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: dispStyles.h3
  }, "Performance par concurrent"), /*#__PURE__*/React.createElement("p", {
    style: dispStyles.h3sub
  }, "Tri\xE9s par win rate et valeur r\xE9cup\xE9r\xE9e")), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.smBtn
  }, "D\xE9tail")), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.compTable
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.compHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.8
    }
  }, "Concurrent"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130,
      textAlign: "center"
    }
  }, "Score W/L"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 90,
      textAlign: "right"
    }
  }, "Win rate"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      textAlign: "right"
    }
  }, "Pipe ouvert"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      textAlign: "right"
    }
  }, "Part march\xE9")), competitors.map(c => {
    const wr = Math.round(c.wins / (c.wins + c.losses) * 100);
    const wrColor = wr >= 60 ? "#10b981" : wr >= 50 ? "#a855f7" : wr >= 40 ? "#f59e0b" : "#dc2626";
    return /*#__PURE__*/React.createElement("div", {
      key: c.k,
      style: dispStyles.compRow
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1.8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...dispStyles.compMark,
        background: c.color
      }
    }, c.abbr), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, c.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 130,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "#10b981",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, c.wins), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#cbd5e1"
      }
    }, "/"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "#dc2626",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, c.losses)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 100,
        height: 4,
        marginTop: 4,
        borderRadius: 999,
        overflow: "hidden",
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: c.wins,
        background: "#10b981"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: c.losses,
        background: "#fca5a5"
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 90,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: wrColor,
        fontFamily: "'Inter', sans-serif"
      }
    }, wr, "%")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 110,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, c.openValue, " k\u20AC"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, c.openDeals, " deals")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 80,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#475569",
        fontWeight: 600
      }
    }, c.market, "%"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56,
        height: 3,
        marginTop: 4,
        marginLeft: "auto",
        background: "#eef1f5",
        borderRadius: 999,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${c.market * 2}%`,
        height: "100%",
        background: c.color,
        borderRadius: 999
      }
    }))));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panel
  }, /*#__PURE__*/React.createElement("h3", {
    style: dispStyles.h3
  }, "Top raisons de wins"), /*#__PURE__*/React.createElement("p", {
    style: dispStyles.h3sub
  }, "Pourquoi les clients basculent vers Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, [{
    label: "Conformité DORA / souveraineté UE",
    value: 38,
    color: "#10b981"
  }, {
    label: "TCO inférieur sur 3 ans",
    value: 28,
    color: "#0e7a55"
  }, {
    label: "Spécialisation métier",
    value: 18,
    color: "#0ea5e9"
  }, {
    label: "Time-to-value < 4 mois",
    value: 12,
    color: "#a855f7"
  }, {
    label: "Autre",
    value: 4,
    color: "#cbd5e1"
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.label,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#475569",
      flex: 1
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, r.value, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "#f1f3f6",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${r.value * 2.5}%`,
      height: "100%",
      background: r.color,
      borderRadius: 999
    }
  }))))), /*#__PURE__*/React.createElement("h3", {
    style: {
      ...dispStyles.h3,
      marginTop: 22
    }
  }, "Top raisons de losses"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, [{
    label: "Préférence statu-quo concurrent",
    value: 42,
    color: "#dc2626"
  }, {
    label: "Pas de référence assez grosse",
    value: 24,
    color: "#ef4444"
  }, {
    label: "Influence cabinet conseil",
    value: 18,
    color: "#f87171"
  }, {
    label: "Prix année 1 supérieur",
    value: 11,
    color: "#fca5a5"
  }, {
    label: "Autre",
    value: 5,
    color: "#fecaca"
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.label,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#475569",
      flex: 1
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, r.value, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "#f1f3f6",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${r.value * 2.5}%`,
      height: "100%",
      background: r.color,
      borderRadius: 999
    }
  })))))))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: dispStyles.panelHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: dispStyles.h3
  }, "Displacements r\xE9cents ", /*#__PURE__*/React.createElement("span", {
    style: dispStyles.count
  }, "7")), /*#__PURE__*/React.createElement("p", {
    style: dispStyles.h3sub
  }, "Derniers wins et losses de l'\xE9quipe \u2014 30 derniers jours")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...dispStyles.filterPill,
      background: "#10b981",
      color: "#fff",
      borderColor: "#10b981"
    }
  }, "\u2713 Wins (5)"), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.filterPill
  }, "\u2717 Losses (2)"), /*#__PURE__*/React.createElement("button", {
    style: dispStyles.filterPill
  }, "Tous"))), /*#__PURE__*/React.createElement("div", {
    style: dispStyles.recentList
  }, recent.map((r, i) => {
    const comp = competitors.find(c => c.k === r.from);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        ...dispStyles.recentRow,
        ...(r.type === "win" ? dispStyles.recentRowWin : dispStyles.recentRowLoss)
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...dispStyles.resultBadge,
        background: r.type === "win" ? "#10b981" : "#dc2626"
      }
    }, r.type === "win" ? "✓ WIN" : "✗ LOSS"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...dispStyles.recentLogo,
        background: r.logoBg
      }
    }, r.logo), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, r.co), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#cbd5e1",
        fontSize: 13
      }
    }, "\u2022"), /*#__PURE__*/React.createElement("span", {
      style: {
        ...dispStyles.compMarkSm,
        background: comp.color
      }
    }, comp.abbr), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#64748b"
      }
    }, comp.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b"
      }
    }, r.reason)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 90,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: r.type === "win" ? "#10b981" : "#dc2626",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, r.value, " k\u20AC"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, "ARR/an")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 80,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, r.cycle, " j"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, "cycle")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: 150
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: r.owner,
      size: 22,
      color: r.ownerColor
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "#0f172a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, r.owner), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, r.date))));
  }))));
};
const dispStyles = {
  frame: {
    width: 1440,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "4px 4px 0"
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.7,
    margin: 0,
    color: "#0f172a"
  },
  h1sub: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  segCtrl: {
    display: "flex",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 2,
    background: "#fff"
  },
  segBtn: {
    padding: "5px 12px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  segBtnActive: {
    background: "#0f172a",
    color: "#fff"
  },
  ghostBtn: {
    padding: "7px 13px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr",
    gap: 10
  },
  kpi: {
    padding: "14px 16px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  kpiHero: {
    background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
    border: "none",
    color: "#fff",
    boxShadow: "0 4px 16px rgba(16,185,129,0.25)"
  },
  kpiLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.5,
    marginTop: 4
  },
  kpiSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2
  },
  heroBar: {
    height: 6,
    display: "flex",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10
  },
  trendChip: {
    fontSize: 10,
    padding: "1px 7px",
    borderRadius: 999,
    fontWeight: 700
  },
  compMarkBig: {
    width: 30,
    height: 24,
    borderRadius: 6,
    background: "linear-gradient(135deg, #0066b0, #00A1E0)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 14
  },
  panel: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  panelHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14
  },
  h3: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  h3sub: {
    fontSize: 11.5,
    color: "#64748b",
    margin: "3px 0 0"
  },
  count: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    marginLeft: 4
  },
  smBtn: {
    padding: "4px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  filterPill: {
    padding: "4px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  // Chart
  chart: {
    position: "relative",
    height: 220,
    padding: "10px 0 26px 36px"
  },
  chartGrid: {
    position: "absolute",
    inset: "10px 0 26px 36px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    pointerEvents: "none"
  },
  gridLine: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    position: "relative",
    height: 0
  },
  gridLabel: {
    fontSize: 10,
    color: "#cbd5e1",
    width: 16,
    textAlign: "right",
    marginLeft: -22,
    fontFamily: "'JetBrains Mono', monospace"
  },
  gridDash: {
    flex: 1,
    height: 1,
    borderTop: "1px dashed #eef1f5"
  },
  chartBars: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "100%",
    gap: 4,
    position: "relative"
  },
  barGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end"
  },
  barCol: {
    display: "flex",
    gap: 3,
    alignItems: "flex-end",
    flex: 1,
    height: "100%"
  },
  barLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 6,
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "nowrap"
  },
  insightBox: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 8,
    marginTop: 12
  },
  // Comp table
  compTable: {
    display: "flex",
    flexDirection: "column"
  },
  compHead: {
    display: "flex",
    alignItems: "center",
    padding: "8px 4px",
    borderBottom: "1px solid #eef1f5",
    fontSize: 10.5,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  compRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 4px",
    borderBottom: "1px solid #f1f5f9"
  },
  compMark: {
    width: 24,
    height: 20,
    borderRadius: 4,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  compMarkSm: {
    width: 22,
    height: 18,
    borderRadius: 4,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  // Recent
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  recentRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "#fff"
  },
  recentRowWin: {
    background: "linear-gradient(90deg, #f0fdf6, #ffffff 30%)",
    borderColor: "#bbf7d0"
  },
  recentRowLoss: {
    background: "linear-gradient(90deg, #fff5f5, #ffffff 30%)",
    borderColor: "#fecaca"
  },
  resultBadge: {
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 4,
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.5,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0
  },
  recentLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    flexShrink: 0
  }
};
window.DisplacementDashboard = DisplacementDashboard;