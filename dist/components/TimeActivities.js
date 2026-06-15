// ════════════════════════════════════════════════════════════════════
// TimeActivities — Page Temps & Activités (tracking utilisateurs)
// ════════════════════════════════════════════════════════════════════
//
// Vue admin pour suivre l'activité des collaborateurs :
// - KPIs en haut : connectés maintenant, verrouillés, sessions/jour, erreurs
// - Bloc "En ligne maintenant" : utilisateurs avec session active (< 5 min)
// - Bloc "Projets bloqués" : projets sans activité depuis 7 jours
// - Timeline d'événements filtrable (login/logout/lock/unlock/error/idle)
// - Détails session : durée, % verrouillage, page la plus consultée
//
// Sources : user_sessions + user_events + project_events
// ════════════════════════════════════════════════════════════════════

var TimeActivities = () => {
  var [stats, setStats] = React.useState({
    online_now: 0,
    locked_now: 0,
    sessions_today: 0,
    events_today: 0,
    errors_today: 0
  });
  var [sessions, setSessions] = React.useState([]);
  var [events, setEvents] = React.useState([]);
  var [stalled, setStalled] = React.useState([]);
  var [filter, setFilter] = React.useState({
    types: [],
    severity: null,
    since_hours: 24
  });
  var [loading, setLoading] = React.useState(true);
  var reload = React.useCallback(async () => {
    if (!window.api || !window.api.userActivity) return;
    setLoading(true);
    try {
      var [s, sess, evs, st] = await Promise.all([window.api.userActivity.dashboardStats(), window.api.userActivity.sessions({
        since_hours: filter.since_hours
      }), window.api.userActivity.events({
        types: filter.types.length ? filter.types : undefined,
        severity: filter.severity || undefined,
        since_hours: filter.since_hours,
        limit: 300
      }), window.api.userActivity.stalledProjects({
        days: 7
      })]);
      setStats(s);
      setSessions(sess);
      setEvents(evs);
      setStalled(st);
    } catch (e) {
      console.warn("[TimeActivities] reload:", e);
    }
    setLoading(false);
  }, [filter.since_hours, filter.severity, filter.types.join(",")]);
  React.useEffect(() => {
    reload();
  }, [reload]);
  // Refresh auto toutes les 30s
  React.useEffect(() => {
    var t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);
  var fmtDuration = ms => {
    if (ms < 60000) return Math.round(ms / 1000) + "s";
    if (ms < 3600000) return Math.round(ms / 60000) + " min";
    var h = Math.floor(ms / 3600000);
    var m = Math.round(ms % 3600000 / 60000);
    return h + "h" + (m ? " " + m + "min" : "");
  };
  var fmtTime = iso => {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  var fmtDateTime = iso => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Sessions actives (< 5 min depuis last_activity) groupées par user
  var onlineUsers = React.useMemo(() => {
    var fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return sessions.filter(s => !s.ended_at && new Date(s.last_activity).getTime() > fiveMinAgo);
  }, [sessions]);
  return /*#__PURE__*/React.createElement("div", {
    style: taStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: taStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 0 18px",
      textDecoration: "none",
      color: "inherit",
      borderBottom: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: taStyles.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Temps & Activit\xE9s"))), /*#__PURE__*/React.createElement("div", {
    style: taStyles.navLabel
  }, "Fen\xEAtre temporelle"), [{
    k: 1,
    label: "Dernière heure"
  }, {
    k: 24,
    label: "24 dernières heures"
  }, {
    k: 168,
    label: "7 derniers jours"
  }, {
    k: 720,
    label: "30 derniers jours"
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.k,
    onClick: () => setFilter(f => ({
      ...f,
      since_hours: p.k
    })),
    style: {
      ...taStyles.navItem,
      ...(filter.since_hours === p.k ? taStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      color: filter.since_hours === p.k ? "#3730a3" : "#94a3b8"
    }
  }, "\u25F7"), /*#__PURE__*/React.createElement("span", null, p.label))), /*#__PURE__*/React.createElement("div", {
    style: taStyles.navLabel
  }, "Filtrer \xE9v\xE9nements"), [{
    k: "login",
    label: "Connexions",
    icon: "🔓"
  }, {
    k: "logout",
    label: "Déconnexions",
    icon: "🔒"
  }, {
    k: "lock",
    label: "Verrouillages",
    icon: "⏸"
  }, {
    k: "unlock",
    label: "Déverrouillages",
    icon: "▶"
  }, {
    k: "error",
    label: "Erreurs",
    icon: "⚠"
  }, {
    k: "idle_timeout",
    label: "Inactivités",
    icon: "💤"
  }].map(t => {
    var active = filter.types.includes(t.k);
    return /*#__PURE__*/React.createElement("div", {
      key: t.k,
      onClick: () => setFilter(f => ({
        ...f,
        types: active ? f.types.filter(x => x !== t.k) : [...f.types, t.k]
      })),
      style: {
        ...taStyles.navItem,
        ...(active ? taStyles.navItemActive : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14
      }
    }, t.icon), /*#__PURE__*/React.createElement("span", null, t.label));
  }), filter.types.length > 0 && /*#__PURE__*/React.createElement("div", {
    onClick: () => setFilter(f => ({
      ...f,
      types: []
    })),
    style: {
      ...taStyles.navItem,
      color: "#dc2626",
      fontSize: 11,
      marginTop: 4
    }
  }, "\u2715 Effacer les filtres")), /*#__PURE__*/React.createElement("main", {
    style: taStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: taStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: taStyles.h1
  }, "Temps & Activit\xE9s"), /*#__PURE__*/React.createElement("p", {
    style: taStyles.sub
  }, filter.since_hours === 1 ? "Dernière heure" : filter.since_hours === 24 ? "Aujourd'hui" : filter.since_hours === 168 ? "7 derniers jours" : "30 derniers jours", " \xB7 Refresh auto 30s")), /*#__PURE__*/React.createElement("button", {
    onClick: reload,
    style: taStyles.primaryBtn
  }, "\u21BB Rafra\xEEchir")), /*#__PURE__*/React.createElement("div", {
    style: taStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDFE2 En ligne maintenant",
    value: stats.online_now,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\uD83D\uDD12 Verrouill\xE9s",
    value: stats.locked_now,
    color: "#f59e0b"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Sessions aujourd'hui",
    value: stats.sessions_today,
    color: "#0ea5e9"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\xC9v\xE9nements",
    value: stats.events_today,
    color: "#3730a3"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "\u26A0 Erreurs aujourd'hui",
    value: stats.errors_today,
    color: "#dc2626"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: taStyles.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: taStyles.h2
  }, "\uD83D\uDFE2 En ligne maintenant ", /*#__PURE__*/React.createElement("span", {
    style: taStyles.count
  }, onlineUsers.length)), /*#__PURE__*/React.createElement("p", {
    style: taStyles.h2sub
  }, "Utilisateurs actifs dans les 5 derni\xE8res minutes"), onlineUsers.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: taStyles.empty
  }, "Personne en ligne pour le moment.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, onlineUsers.map(u => {
    var sessionMs = Date.now() - new Date(u.started_at).getTime();
    var lockedPct = sessionMs > 0 ? Math.round(u.total_locked_s * 1000 / sessionMs * 100) : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: u.id,
      style: {
        padding: 10,
        background: u.is_locked ? "#fff7ed" : "#ecfdf5",
        border: "1px solid " + (u.is_locked ? "#fed7aa" : "#a7f3d0"),
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: u.is_locked ? "#f59e0b" : "#10b981",
        boxShadow: "0 0 0 3px " + (u.is_locked ? "#fef3c7" : "#dcfce7")
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, u.user_name || u.user_email || "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, "Session : ", fmtDuration(sessionMs), " \xB7 ", u.is_locked ? "🔒 Verrouillé" : "🟢 Actif", " \xB7 ", u.platform || "?", " ", u.browser || "")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        fontSize: 11,
        color: "#64748b"
      }
    }, /*#__PURE__*/React.createElement("div", null, "Derni\xE8re activit\xE9"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: "#0f172a"
      }
    }, fmtTime(u.last_activity))));
  }))), /*#__PURE__*/React.createElement("section", {
    style: taStyles.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: taStyles.h2
  }, "\u23F3 Projets bloqu\xE9s ", /*#__PURE__*/React.createElement("span", {
    style: taStyles.count
  }, stalled.length)), /*#__PURE__*/React.createElement("p", {
    style: taStyles.h2sub
  }, "Aucune activit\xE9 depuis 7+ jours (\xE0 relancer)"), stalled.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: taStyles.empty
  }, "Aucun projet en stagnation.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, stalled.slice(0, 10).map(p => /*#__PURE__*/React.createElement("a", {
    key: p.id,
    href: "/projet?id=" + encodeURIComponent(p.id),
    style: {
      padding: 10,
      background: p.days_stalled >= 30 ? "#fef2f2" : p.days_stalled >= 14 ? "#fef3c7" : "#f8fafc",
      border: "1px solid " + (p.days_stalled >= 30 ? "#fca5a5" : p.days_stalled >= 14 ? "#fde68a" : "#e2e8f0"),
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 10,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, p.client_name || "—", " \xB7 ", p.pm_name || "Sans chef projet")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: p.days_stalled >= 30 ? "#991b1b" : p.days_stalled >= 14 ? "#92400e" : "#475569",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, p.days_stalled, " j"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "sans activit\xE9")))), stalled.length > 10 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      textAlign: "center",
      padding: 6
    }
  }, "+ ", stalled.length - 10, " autres projets bloqu\xE9s\u2026")))), /*#__PURE__*/React.createElement("section", {
    style: taStyles.card
  }, /*#__PURE__*/React.createElement("h2", {
    style: taStyles.h2
  }, "\uD83D\uDCDC Journal d'\xE9v\xE9nements ", /*#__PURE__*/React.createElement("span", {
    style: taStyles.count
  }, events.length)), /*#__PURE__*/React.createElement("p", {
    style: taStyles.h2sub
  }, "Chronologie compl\xE8te des connexions, verrouillages, erreurs"), loading ? /*#__PURE__*/React.createElement("div", {
    style: taStyles.empty
  }, "Chargement\u2026") : events.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: taStyles.empty
  }, "Aucun \xE9v\xE9nement sur cette p\xE9riode.") : /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 600,
      overflowY: "auto"
    }
  }, events.map(e => /*#__PURE__*/React.createElement(EventRow, {
    key: e.id,
    event: e,
    fmtDateTime: fmtDateTime
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...taStyles.card,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: taStyles.h2
  }, "\uD83D\uDD50 Sessions ", /*#__PURE__*/React.createElement("span", {
    style: taStyles.count
  }, sessions.length)), /*#__PURE__*/React.createElement("p", {
    style: taStyles.h2sub
  }, "Historique des sessions de travail"), sessions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: taStyles.empty
  }, "Aucune session sur cette p\xE9riode.") : /*#__PURE__*/React.createElement("div", {
    style: taStyles.tableWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: taStyles.tableHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 150px"
    }
  }, "Utilisateur"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 140px"
    }
  }, "D\xE9but"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px"
    }
  }, "Dur\xE9e"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 90px"
    }
  }, "Verrouill\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 110px"
    }
  }, "Plateforme"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Statut"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 80px",
      textAlign: "right"
    }
  }, "Erreurs")), sessions.map(s => {
    var sessionMs = (s.ended_at ? new Date(s.ended_at).getTime() : Date.now()) - new Date(s.started_at).getTime();
    var lockedMs = (s.total_locked_s || 0) * 1000;
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: taStyles.tableRow
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 150px",
        fontSize: 12.5,
        fontWeight: 600
      }
    }, s.user_name || s.user_email || "—"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 140px",
        fontSize: 11.5,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmtDateTime(s.started_at)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 100px",
        fontSize: 12,
        fontWeight: 600
      }
    }, fmtDuration(sessionMs)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 90px",
        fontSize: 11
      }
    }, lockedMs > 0 ? fmtDuration(lockedMs) : "—"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 110px",
        fontSize: 11,
        color: "#64748b"
      }
    }, s.platform || "?", " \xB7 ", s.browser || "?"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 11.5
      }
    }, !s.ended_at ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: s.is_locked ? "#fef3c7" : "#dcfce7",
        color: s.is_locked ? "#92400e" : "#065f46",
        fontWeight: 600
      }
    }, "\u25CF ", s.is_locked ? "Verrouillé" : "Actif") : /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: "#f1f5f9",
        color: "#475569",
        fontWeight: 600
      }
    }, "\u25CF Termin\xE9e (", s.end_reason || "?", ")")), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 80px",
        textAlign: "right",
        fontSize: 12,
        fontWeight: 700,
        color: (s.errors_count || 0) > 0 ? "#dc2626" : "#cbd5e1"
      }
    }, s.errors_count || 0));
  })))));
};
var KPI = ({
  label,
  value,
  color
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: "12px 14px"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 22,
    fontWeight: 700,
    color: color || "#0f172a",
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace"
  }
}, value));
var EventRow = ({
  event,
  fmtDateTime
}) => {
  var TYPE_META = {
    login: {
      icon: "🔓",
      color: "#10b981",
      label: "Connexion"
    },
    logout: {
      icon: "🔒",
      color: "#475569",
      label: "Déconnexion"
    },
    lock: {
      icon: "⏸",
      color: "#f59e0b",
      label: "Écran verrouillé"
    },
    unlock: {
      icon: "▶",
      color: "#0ea5e9",
      label: "Écran déverrouillé"
    },
    idle_timeout: {
      icon: "💤",
      color: "#a855f7",
      label: "Inactivité 15 min"
    },
    error: {
      icon: "⚠",
      color: "#dc2626",
      label: "Erreur JS"
    },
    page_view: {
      icon: "◧",
      color: "#94a3b8",
      label: "Page consultée"
    }
  };
  var meta = TYPE_META[event.type] || {
    icon: "•",
    color: "#94a3b8",
    label: event.type
  };
  var [open, setOpen] = React.useState(false);
  var hasDetails = event.severity === "error" && (event.error_stack || event.error_url);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 0",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "flex-start",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 999,
      background: meta.color + "15",
      color: meta.color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: 13
    }
  }, meta.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, meta.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#475569"
    }
  }, event.user_name || event.user_email || "—"), event.path && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#3730a3"
    }
  }, event.path)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, fmtDateTime(event.occurred_at))), event.message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, event.message), hasDetails && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(v => !v),
    style: {
      fontSize: 10,
      color: "#3730a3",
      border: 0,
      background: "transparent",
      padding: 0,
      marginTop: 4,
      cursor: "pointer"
    }
  }, open ? "▾ Masquer les détails" : "▸ Voir le stack trace"), open && hasDetails && /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: "6px 0 0",
      padding: 10,
      background: "#0f172a",
      color: "#fca5a5",
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
      borderRadius: 6,
      overflow: "auto",
      maxHeight: 200
    }
  }, event.error_url && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fbbf24"
    }
  }, event.error_url, ":", event.error_line || "?", "\n"), event.error_stack || "(pas de stack)")));
};
var taStyles = {
  frame: {
    display: "flex",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 230,
    padding: "20px 16px",
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0
  },
  // Couleur module Temps & Activités (#14b8a6 teal)
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(135deg, #0d9488, #14b8a6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
    padding: "0 6px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 7,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  main: {
    flex: 1,
    padding: "20px 28px",
    overflow: "auto"
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700
  },
  sub: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#64748b"
  },
  primaryBtn: {
    padding: "8px 14px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  kpiRow: {
    display: "flex",
    gap: 10,
    marginBottom: 16
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 18
  },
  h2: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  h2sub: {
    margin: "3px 0 10px",
    fontSize: 11.5,
    color: "#64748b"
  },
  count: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  empty: {
    padding: "24px 14px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12
  },
  tableWrap: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 8,
    overflow: "hidden"
  },
  tableHead: {
    display: "flex",
    alignItems: "center",
    padding: "9px 12px",
    gap: 10,
    background: "#f8fafc",
    borderBottom: "1px solid #eef1f5",
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "9px 12px",
    gap: 10,
    borderBottom: "1px solid #f1f5f9"
  }
};