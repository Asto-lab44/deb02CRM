// ════════════════════════════════════════════════════════════════════
// ClientsHors44 — clients hors Loire-Atlantique (44).
// Le département vient du code postal (2 premiers chiffres), renseigné par
// l'enrichissement Pappers / annuaire. Un client sans code postal est
// « à enrichir » (département inconnu) → listé à part, pas compté hors-44.
// Lit window.api.clients : en mode test, l'espace isolé (bac à sable).
// ════════════════════════════════════════════════════════════════════
var ClientsHors44 = () => {
  var [rows, setRows] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [q, setQ] = React.useState("");
  var isTest = typeof window !== "undefined" && window.HubTestMode;
  var DEPT = {
    "44": "Loire-Atlantique",
    "49": "Maine-et-Loire",
    "85": "Vendée",
    "79": "Deux-Sèvres",
    "35": "Ille-et-Vilaine",
    "56": "Morbihan",
    "53": "Mayenne",
    "72": "Sarthe",
    "22": "Côtes-d'Armor",
    "29": "Finistère",
    "37": "Indre-et-Loire",
    "41": "Loir-et-Cher",
    "86": "Vienne",
    "17": "Charente-Maritime",
    "75": "Paris",
    "69": "Rhône",
    "33": "Gironde",
    "44b": ""
  };
  var deptName = d => DEPT[d] || "Département " + d;
  var cp = c => String(c.code_postal || "").replace(/\D/g, "");
  var deptOf = c => {
    var p = cp(c);
    return p.length >= 2 ? p.slice(0, 2) : null;
  };
  React.useEffect(() => {
    if (!window.api || !window.api.clients) {
      setLoading(false);
      return;
    }
    window.api.clients.list().then(list => {
      setRows(list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  var match = c => {
    if (!q.trim()) return true;
    var s = q.toLowerCase();
    return [c.raison_sociale, c.name, c.ville, c.siren, c.code_postal].some(v => String(v || "").toLowerCase().includes(s));
  };
  var withDept = rows.filter(deptOf);
  var hors44 = withDept.filter(c => deptOf(c) !== "44").filter(match);
  var unknown = rows.filter(c => !deptOf(c)).filter(match);
  var in44 = withDept.filter(c => deptOf(c) === "44").length;

  // Regroupe hors-44 par département (trié par nombre décroissant).
  var groups = {};
  hors44.forEach(c => {
    var d = deptOf(c);
    (groups[d] = groups[d] || []).push(c);
  });
  var groupKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length || a.localeCompare(b));
  var fmtCA = n => Number(n) > 0 ? Number(n).toLocaleString("fr-FR", {
    maximumFractionDigits: 0
  }) + " €" : null;
  var card = c => /*#__PURE__*/React.createElement("a", {
    key: c.id,
    href: "/fiche-client?id=" + encodeURIComponent(c.id),
    style: ST.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.cardName
  }, c.raison_sociale || c.name || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 3
    }
  }, "\uD83D\uDCCD ", c.ville || "Ville ?", cp(c) ? " · " + cp(c) : ""), c.siren && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      marginTop: 2
    }
  }, "SIREN ", c.siren)), fmtCA(c.ca_2324) && /*#__PURE__*/React.createElement("span", {
    style: ST.ca
  }, fmtCA(c.ca_2324))), c.abonnements && c.abonnements.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 8
    }
  }, c.abonnements.map(a => /*#__PURE__*/React.createElement("span", {
    key: a,
    style: ST.abo
  }, a))));
  return /*#__PURE__*/React.createElement("div", {
    style: ST.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: ST.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: isTest ? "/crm?test=1" : "/crm",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, isTest ? "CRM Prospection" : "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Prospects hors 44")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 300
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Rechercher (nom, ville, SIREN\u2026)",
    style: ST.search
  }))), /*#__PURE__*/React.createElement("div", {
    style: ST.titleRow
  }, /*#__PURE__*/React.createElement("h1", {
    style: ST.h1
  }, "\uD83D\uDCCD Prospects hors Loire-Atlantique (44)"), /*#__PURE__*/React.createElement("p", {
    style: ST.sub
  }, "D\xE9partement d\xE9duit du code postal (renseign\xE9 par l'enrichissement Pappers).")), /*#__PURE__*/React.createElement("div", {
    style: ST.stats
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.statN,
      color: "#4f46e5"
    }
  }, hors44.length), /*#__PURE__*/React.createElement("div", {
    style: ST.statL
  }, "Hors 44")), /*#__PURE__*/React.createElement("div", {
    style: ST.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.statN,
      color: "#0e7a55"
    }
  }, in44), /*#__PURE__*/React.createElement("div", {
    style: ST.statL
  }, "En 44 (exclus)")), /*#__PURE__*/React.createElement("div", {
    style: ST.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.statN,
      color: "#94a3b8"
    }
  }, groupKeys.length), /*#__PURE__*/React.createElement("div", {
    style: ST.statL
  }, "D\xE9partements")), unknown.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: ST.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...ST.statN,
      color: "#b45309"
    }
  }, unknown.length), /*#__PURE__*/React.createElement("div", {
    style: ST.statL
  }, "\xC0 enrichir (CP inconnu)"))), loading ? /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: ST.body
  }, groupKeys.length === 0 && unknown.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Aucun prospect hors 44 (ou aucun code postal renseign\xE9 \u2014 lancez l'enrichissement Pappers depuis le CRM Prospection)."), groupKeys.map(d => /*#__PURE__*/React.createElement("section", {
    key: d,
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.groupHead
  }, /*#__PURE__*/React.createElement("span", {
    style: ST.deptBadge
  }, d), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 14
    }
  }, deptName(d)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "\xB7 ", groups[d].length, " prospect", groups[d].length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
    style: ST.grid
  }, groups[d].sort((a, b) => (Number(b.ca_2324) || 0) - (Number(a.ca_2324) || 0)).map(card)))), unknown.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.groupHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...ST.deptBadge,
      background: "#fef3c7",
      color: "#92400e"
    }
  }, "?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 14
    }
  }, "D\xE9partement inconnu"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "\xB7 ", unknown.length, " \xE0 enrichir (pas de code postal)")), /*#__PURE__*/React.createElement("div", {
    style: ST.grid
  }, unknown.sort((a, b) => (Number(b.ca_2324) || 0) - (Number(a.ca_2324) || 0)).map(card)))));
};
var ST = {
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
    gap: 12,
    flexWrap: "wrap"
  },
  search: {
    width: "100%",
    padding: "8px 12px 8px 30px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box"
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
  sub: {
    fontSize: 12.5,
    color: "#64748b",
    margin: "4px 0 0"
  },
  stats: {
    padding: "12px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    display: "flex",
    gap: 24,
    flexWrap: "wrap"
  },
  stat: {
    textAlign: "left"
  },
  statN: {
    fontSize: 24,
    fontWeight: 800
  },
  statL: {
    fontSize: 11.5,
    color: "#64748b",
    fontWeight: 600
  },
  body: {
    padding: "16px 28px 60px"
  },
  groupHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  deptBadge: {
    fontSize: 12,
    fontWeight: 800,
    background: "#eef2ff",
    color: "#3730a3",
    padding: "3px 9px",
    borderRadius: 8,
    fontVariantNumeric: "tabular-nums"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 10
  },
  card: {
    display: "block",
    padding: 14,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit"
  },
  cardName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  ca: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    whiteSpace: "nowrap"
  },
  abo: {
    fontSize: 10,
    fontWeight: 600,
    background: "#ecfeff",
    color: "#0e7490",
    border: "1px solid #a5f3fc",
    padding: "1px 7px",
    borderRadius: 6
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    fontStyle: "italic"
  }
};
window.ClientsHors44 = ClientsHors44;