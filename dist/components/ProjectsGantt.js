// ════════════════════════════════════════════════════════════════════
// ProjectsGantt — Vue Gantt des projets sur 3 mois
// ════════════════════════════════════════════════════════════════════
//
// Frise temporelle horizontale avec :
// - Header : jours/semaines/mois selon zoom
// - Lignes : 1 projet = 1 ligne, barre colorée selon stage
// - Barre s'étend de created_at à delivery_due (ou aujourd'hui si pas de date)
// - Aujourd'hui marqué d'une ligne verticale rouge
// - Clic sur une barre → ouvre /projet?id=…
// ════════════════════════════════════════════════════════════════════

var ProjectsGantt = () => {
  var STAGES = window.api && window.api.projects && window.api.projects.STAGES || [];
  var [projects, setProjects] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [monthsRange, setMonthsRange] = React.useState(3); // 3 mois affichés

  // Plage : mois courant - 1, mois courant, mois courant + 1
  var [startDate, setStartDate] = React.useState(() => {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  var endDate = React.useMemo(() => {
    var d = new Date(startDate);
    d.setMonth(d.getMonth() + monthsRange);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [startDate, monthsRange]);
  var totalDays = Math.ceil((endDate - startDate) / (1000 * 3600 * 24));
  var dayWidth = 22; // px par jour

  var reload = React.useCallback(async () => {
    if (!window.api || !window.api.projects) {
      setLoading(false);
      return;
    }
    setLoading(true);
    var list = await window.api.projects.list();
    setProjects(list || []);
    setLoading(false);
  }, []);
  React.useEffect(() => {
    reload();
    if (window.HubData && window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, [reload]);

  // Filtre : projets visibles dans la plage
  var visibleProjects = React.useMemo(() => {
    return projects.filter(p => {
      var created = new Date(p.created_at);
      var due = p.delivery_due ? new Date(p.delivery_due) : new Date();
      // Visible si l'intervalle [created, due] croise [startDate, endDate]
      return due >= startDate && created <= endDate;
    }).sort((a, b) => new Date(a.delivery_due || a.created_at) - new Date(b.delivery_due || b.created_at));
  }, [projects, startDate, endDate]);

  // Génère les colonnes jours
  var days = [];
  for (var i = 0; i < totalDays; i++) {
    var d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  // Groupe les jours par mois pour le header
  var months = [];
  days.forEach((d, i) => {
    var key = d.getFullYear() + "-" + d.getMonth();
    var last = months[months.length - 1];
    if (last && last.key === key) last.count++;else months.push({
      key,
      label: d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric"
      }),
      count: 1
    });
  });
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var todayOffset = Math.floor((today - startDate) / (1000 * 3600 * 24));

  // Position et largeur d'une barre pour un projet
  var barFor = p => {
    var created = new Date(p.created_at);
    var due = p.delivery_due ? new Date(p.delivery_due) : today;
    var start = Math.max(0, Math.floor((created - startDate) / (1000 * 3600 * 24)));
    var end = Math.min(totalDays, Math.floor((due - startDate) / (1000 * 3600 * 24)) + 1);
    return {
      left: start * dayWidth,
      width: Math.max(dayWidth, (end - start) * dayWidth)
    };
  };
  var prevMonth = () => {
    var d = new Date(startDate);
    d.setMonth(d.getMonth() - 1);
    setStartDate(d);
  };
  var nextMonth = () => {
    var d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    setStartDate(d);
  };
  var goToday = () => {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: S.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...S.brand,
      textDecoration: "none",
      color: "inherit"
    }
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Gantt projets"))), /*#__PURE__*/React.createElement("a", {
    href: "/projets",
    style: {
      ...S.viewBtn,
      ...S.viewBtnGhost,
      textDecoration: "none"
    }
  }, "\uD83D\uDCCB Kanban"), /*#__PURE__*/React.createElement("a", {
    href: "/projets-tableau",
    style: {
      ...S.viewBtn,
      ...S.viewBtnGhost,
      textDecoration: "none"
    }
  }, "\u229E Tableau"), /*#__PURE__*/React.createElement("a", {
    href: "/projets-calendrier",
    style: {
      ...S.viewBtn,
      ...S.viewBtnGhost,
      textDecoration: "none"
    }
  }, "\uD83D\uDCC5 Calendrier"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.viewBtn,
      ...S.viewBtnActive
    }
  }, "\uD83D\uDCCA Gantt"), /*#__PURE__*/React.createElement("div", {
    style: S.legend
  }, /*#__PURE__*/React.createElement("div", {
    style: S.legendLabel
  }, "Stages"), STAGES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    style: S.legendItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", null, s.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("main", {
    style: S.main
  }, /*#__PURE__*/React.createElement("header", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, "Vue Gantt \u2014 Projets"), /*#__PURE__*/React.createElement("p", {
    style: S.h1sub
  }, visibleProjects.length, " projet", visibleProjects.length > 1 ? "s" : "", " sur la p\xE9riode \xB7 zoom 1 jour = ", dayWidth, "px")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevMonth,
    style: S.navBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    onClick: goToday,
    style: S.btnPrimary
  }, "Aujourd'hui"), /*#__PURE__*/React.createElement("button", {
    onClick: nextMonth,
    style: S.navBtn
  }, "\u203A"), /*#__PURE__*/React.createElement("select", {
    value: monthsRange,
    onChange: e => setMonthsRange(parseInt(e.target.value, 10)),
    style: S.select
  }, /*#__PURE__*/React.createElement("option", {
    value: 2
  }, "2 mois"), /*#__PURE__*/React.createElement("option", {
    value: 3
  }, "3 mois"), /*#__PURE__*/React.createElement("option", {
    value: 6
  }, "6 mois"), /*#__PURE__*/React.createElement("option", {
    value: 12
  }, "12 mois")))), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "#64748b"
    }
  }, "Chargement\u2026") : visibleProjects.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "#94a3b8"
    }
  }, "Aucun projet sur cette p\xE9riode.") : /*#__PURE__*/React.createElement("div", {
    style: S.ganttWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: S.leftCol
  }, /*#__PURE__*/React.createElement("div", {
    style: S.leftHeader
  }, "Projet"), visibleProjects.map(p => /*#__PURE__*/React.createElement("a", {
    key: p.id,
    href: "/projet?id=" + encodeURIComponent(p.id),
    style: S.leftRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace",
      marginTop: 2
    }
  }, p.sage_ref || p.id.slice(0, 12))))), /*#__PURE__*/React.createElement("div", {
    style: S.ganttScroll
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: totalDays * dayWidth
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.monthsHeader
  }, months.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.key,
    style: {
      width: m.count * dayWidth,
      padding: "8px 6px",
      textAlign: "center",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#0f172a",
      borderRight: "1px solid #e2e8f0",
      background: "#fafbfc",
      textTransform: "capitalize"
    }
  }, m.label))), /*#__PURE__*/React.createElement("div", {
    style: S.daysHeader
  }, days.map((d, i) => {
    var isWeekend = d.getDay() === 0 || d.getDay() === 6;
    var isToday = i === todayOffset;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: dayWidth,
        padding: "6px 0",
        textAlign: "center",
        fontSize: 10,
        fontWeight: isToday ? 800 : 500,
        color: isToday ? "#3730a3" : isWeekend ? "#cbd5e1" : "#64748b",
        borderRight: "1px solid #f1f5f9",
        background: isWeekend ? "#fafbfc" : "#fff"
      }
    }, d.getDate());
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, todayOffset >= 0 && todayOffset < totalDays && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: todayOffset * dayWidth + dayWidth / 2,
      top: 0,
      bottom: 0,
      width: 2,
      background: "#dc2626",
      zIndex: 5,
      pointerEvents: "none"
    }
  }), visibleProjects.map(p => {
    var bar = barFor(p);
    var stage = STAGES.find(s => s.k === p.stage) || STAGES[0];
    var overdue = p.delivery_due && new Date(p.delivery_due) < today && p.stage !== "clos";
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        ...S.ganttRow,
        position: "relative"
      }
    }, days.map((d, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: dayWidth,
        borderRight: "1px solid #f8fafc",
        flexShrink: 0,
        background: d.getDay() === 0 || d.getDay() === 6 ? "#fafbfc" : "transparent"
      }
    })), /*#__PURE__*/React.createElement("a", {
      href: "/projet?id=" + encodeURIComponent(p.id),
      title: p.name + "\n" + stage.label + "\n" + (p.delivery_due ? "Livraison : " + new Date(p.delivery_due).toLocaleDateString("fr-FR") : ""),
      style: {
        position: "absolute",
        left: bar.left,
        width: bar.width,
        top: 6,
        height: 22,
        background: stage.color,
        border: overdue ? "2px solid #dc2626" : "1px solid " + stage.color,
        borderRadius: 5,
        color: "#fff",
        fontSize: 10.5,
        fontWeight: 700,
        padding: "0 6px",
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        cursor: "pointer",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        zIndex: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }
    }, overdue && /*#__PURE__*/React.createElement("span", {
      style: {
        marginRight: 4
      }
    }, "\u23F0"), p.name));
  })))))));
};
var S = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f5f8",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  sidebar: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: 8,
    flexShrink: 0
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 8px 12px",
    borderBottom: "1px solid #f1f5f9"
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #4f46e5, #a855f7)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  },
  viewBtn: {
    display: "block",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer"
  },
  viewBtnGhost: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0"
  },
  viewBtnActive: {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a"
  },
  legend: {
    padding: "12px 0",
    marginTop: 12
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "0 8px 6px"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 8px",
    fontSize: 11.5,
    color: "#475569"
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  topbar: {
    padding: "20px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    gap: 12,
    flexWrap: "wrap"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  h1sub: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  navBtn: {
    width: 34,
    height: 34,
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "7px 14px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  select: {
    padding: "7px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12.5,
    color: "#0f172a",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  ganttWrap: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    background: "#fff"
  },
  leftCol: {
    width: 260,
    flexShrink: 0,
    borderRight: "2px solid #e2e8f0",
    background: "#fafbfc",
    overflowY: "auto"
  },
  leftHeader: {
    padding: "12px 14px",
    background: "#0f172a",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    height: 60,
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #1e293b"
  },
  leftRow: {
    display: "block",
    padding: "8px 14px",
    borderBottom: "1px solid #eef1f5",
    height: 34,
    textDecoration: "none",
    color: "inherit"
  },
  ganttScroll: {
    flex: 1,
    overflowX: "auto",
    overflowY: "auto"
  },
  monthsHeader: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0"
  },
  daysHeader: {
    display: "flex",
    borderBottom: "2px solid #0f172a"
  },
  ganttRow: {
    display: "flex",
    borderBottom: "1px solid #eef1f5",
    height: 34
  }
};
window.ProjectsGantt = ProjectsGantt;