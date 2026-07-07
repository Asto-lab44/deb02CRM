// ════════════════════════════════════════════════════════════════════
// Routines — plan de charge récurrent (compta) : tâches groupées par
// fréquence (quotidien / hebdo / quinzaine / mensuel), cochées PAR PÉRIODE
// (une routine hebdo se recoche chaque semaine). Chaque tâche pointe vers la
// tuile du Hub qui la réalise. S'appuie sur window.api.routines.
// ════════════════════════════════════════════════════════════════════
var Routines = () => {
  var A = window.api && window.api.routines;
  var ROUTES = window.HubNav && window.HubNav.ROUTES || {};
  var MODULE_LABEL = {
    accounting: "Comptabilité",
    contracts: "Contrats",
    treasury: "Trésorerie",
    commercial: "Gestion commerciale",
    projects: "Projets",
    tech: "Ticketing",
    reports: "Rapports",
    hr: "RH & Paie",
    intel: "Intelligence"
  };
  var FREQ = [{
    k: "quotidien",
    label: "Quotidien",
    color: "#dc2626"
  }, {
    k: "hebdo",
    label: "Hebdomadaire",
    color: "#ea580c"
  }, {
    k: "quinzaine",
    label: "Quinzaine",
    color: "#7c3aed"
  }, {
    k: "mensuel",
    label: "Mensuel (clôture)",
    color: "#0e7a55"
  }];
  var [tasks, setTasks] = React.useState([]);
  var [done, setDone] = React.useState(new Set());
  var [loading, setLoading] = React.useState(true);
  var [serviceF, setServiceF] = React.useState("all");
  var [edit, setEdit] = React.useState(null);
  var who = window.HubAccess && window.HubAccess.getCurrentUser && (window.HubAccess.getCurrentUser() || {}).name || "";

  // ── Clés de période (date du jour) ────────────────────────────────
  var now = new Date();
  var pad = n => String(n).padStart(2, "0");
  var isoWeek = d => {
    var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    var ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    var w = Math.ceil(((dt - ys) / 86400000 + 1) / 7);
    return dt.getUTCFullYear() + "-W" + pad(w);
  };
  var periodKey = freq => {
    if (freq === "quotidien") return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    if (freq === "hebdo") return isoWeek(now);
    if (freq === "quinzaine") return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + (now.getDate() <= 15 ? "Q1" : "Q2");
    return now.getFullYear() + "-" + pad(now.getMonth() + 1); // mensuel
  };
  var periodLabel = freq => {
    if (freq === "quotidien") return "aujourd'hui " + pad(now.getDate()) + "/" + pad(now.getMonth() + 1);
    if (freq === "hebdo") return "semaine " + isoWeek(now).split("-W")[1];
    if (freq === "quinzaine") return (now.getDate() <= 15 ? "1re" : "2e") + " quinzaine";
    return now.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });
  };
  var allPeriodKeys = FREQ.map(f => periodKey(f.k));
  var reload = React.useCallback(async () => {
    if (!A) return;
    setLoading(true);
    try {
      var [t, ds] = await Promise.all([A.tasks(), A.doneSet(allPeriodKeys)]);
      setTasks(t || []);
      setDone(ds || new Set());
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
  }, [reload]);
  var services = ["all", ...Array.from(new Set(tasks.map(t => t.service).filter(Boolean)))];
  var visible = tasks.filter(t => serviceF === "all" || t.service === serviceF);
  var isDone = t => done.has(t.id + "|" + periodKey(t.frequency));
  var toggle = async t => {
    var pk = periodKey(t.frequency);
    var key = t.id + "|" + pk;
    var next = !done.has(key);
    setDone(s => {
      var n = new Set(s);
      if (next) n.add(key);else n.delete(key);
      return n;
    }); // optimiste
    try {
      await A.setDone(t.id, pk, next, who);
    } catch (e) {
      reload();
    }
  };
  var saveEdit = async t => {
    if (!t.action) {
      (window.HubToast ? window.HubToast.error : alert)("Libellé requis");
      return;
    }
    try {
      await A.saveTask(t);
      setEdit(null);
      await reload();
    } catch (e) {
      (window.HubToast ? window.HubToast.error : alert)("Erreur : " + (e.message || e));
    }
  };
  var removeT = async t => {
    if (!confirm("Retirer « " + t.action + " » ?")) return;
    try {
      await A.removeTask(t.id);
      await reload();
    } catch (e) {}
  };
  var grpStats = freq => {
    var list = visible.filter(t => t.frequency === freq);
    var d = list.filter(isDone).length;
    return {
      total: list.length,
      done: d,
      pct: list.length ? Math.round(d / list.length * 100) : 0
    };
  };
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
  }, "Routines & cl\xF4tures")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEdit({
      service: "",
      action: "",
      frequency: "mensuel",
      module_key: ""
    }),
    style: ST.btnGhost
  }, "+ Nouvelle t\xE2che")), /*#__PURE__*/React.createElement("div", {
    style: ST.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: ST.h1
  }, "\u2705 Routines & cl\xF4tures"), /*#__PURE__*/React.createElement("p", {
    style: ST.sub
  }, "Plan de charge r\xE9current de la comptabilit\xE9 \u2014 coch\xE9 par p\xE9riode."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 28px 8px",
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, services.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setServiceF(s),
    style: {
      ...ST.chip,
      ...(serviceF === s ? {
        background: "#4f46e5",
        color: "#fff"
      } : {})
    }
  }, s === "all" ? "Tous les services" : s))), loading ? /*#__PURE__*/React.createElement("div", {
    style: ST.empty
  }, "Chargement\u2026") : /*#__PURE__*/React.createElement("div", {
    style: ST.body
  }, FREQ.map(f => {
    var list = visible.filter(t => t.frequency === f.k);
    if (!list.length) return null;
    var st = grpStats(f.k);
    return /*#__PURE__*/React.createElement("section", {
      key: f.k,
      style: ST.card
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontSize: 14,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 999,
        background: f.color
      }
    }), " ", f.label, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 500,
        color: "#94a3b8"
      }
    }, "\xB7 ", periodLabel(f.k))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 120,
        height: 6,
        background: "#eef1f5",
        borderRadius: 999,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: st.pct + "%",
        height: "100%",
        background: st.pct === 100 ? "#10b981" : f.color
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: st.pct === 100 ? "#10b981" : "#475569"
      }
    }, st.done, "/", st.total))), list.map(t => {
      var dn = isDone(t);
      var href = ROUTES[t.module_key];
      return /*#__PURE__*/React.createElement("div", {
        key: t.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 4px",
          borderBottom: "1px solid #f1f5f9",
          opacity: dn ? 0.6 : 1
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: dn,
        onChange: () => toggle(t),
        style: {
          width: 16,
          height: 16,
          cursor: "pointer"
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          fontSize: 12.5,
          textDecoration: dn ? "line-through" : "none"
        }
      }, t.action), t.service && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          background: "#f1f5f9",
          color: "#475569",
          padding: "1px 7px",
          borderRadius: 999
        }
      }, t.service), href && /*#__PURE__*/React.createElement("a", {
        href: href,
        style: {
          fontSize: 11,
          color: "#3730a3",
          textDecoration: "none",
          whiteSpace: "nowrap"
        }
      }, "\u2192 ", MODULE_LABEL[t.module_key] || t.module_key), /*#__PURE__*/React.createElement("button", {
        onClick: () => setEdit(t),
        style: ST.mini
      }, "\u270E"), /*#__PURE__*/React.createElement("button", {
        onClick: () => removeT(t),
        style: {
          ...ST.mini,
          color: "#dc2626"
        }
      }, "\xD7"));
    }));
  })), edit && /*#__PURE__*/React.createElement("div", {
    style: ST.overlay,
    onClick: () => setEdit(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: ST.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 14px",
      fontSize: 16
    }
  }, edit.id ? "Éditer la tâche" : "Nouvelle tâche"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Libell\xE9 *"), /*#__PURE__*/React.createElement("input", {
    value: edit.action || "",
    onChange: e => setEdit({
      ...edit,
      action: e.target.value
    }),
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Service"), /*#__PURE__*/React.createElement("input", {
    value: edit.service || "",
    onChange: e => setEdit({
      ...edit,
      service: e.target.value.toUpperCase()
    }),
    placeholder: "TRESORERIE, FACTURATION\u2026",
    style: ST.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Fr\xE9quence"), /*#__PURE__*/React.createElement("select", {
    value: edit.frequency || "mensuel",
    onChange: e => setEdit({
      ...edit,
      frequency: e.target.value
    }),
    style: ST.input
  }, FREQ.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.k,
    value: f.k
  }, f.label))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: ST.lbl
  }, "Tuile li\xE9e"), /*#__PURE__*/React.createElement("select", {
    value: edit.module_key || "",
    onChange: e => setEdit({
      ...edit,
      module_key: e.target.value
    }),
    style: ST.input
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Aucune \u2014"), Object.keys(MODULE_LABEL).map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, MODULE_LABEL[k]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEdit(null),
    style: ST.btnGhost
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => saveEdit(edit),
    style: ST.btnPrimary
  }, "Enregistrer")))));
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
    justifyContent: "space-between"
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
  btnGhost: {
    padding: "8px 14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "8px 14px",
    border: 0,
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  chip: {
    padding: "5px 12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  body: {
    padding: "12px 28px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 16
  },
  mini: {
    padding: "3px 7px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12.5,
    fontStyle: "italic"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    width: "100%",
    maxWidth: 520
  },
  lbl: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box"
  }
};
window.Routines = Routines;