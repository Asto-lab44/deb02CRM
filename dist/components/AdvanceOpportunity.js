// Faire avancer une opportunité — passage d'étape avec critères de sortie

var AOAvatar = ({
  name,
  size = 22,
  color
}) => {
  if (!name) return null;
  var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
  var palette = {
    N: "#a855f7",
    K: "#6366f1",
    S: "#10b981",
    T: "#f59e0b",
    E: "#0ea5e9",
    L: "#dc2626",
    J: "#8b5cf6",
    C: "#dc2626",
    M: "#f59e0b"
  };
  var bg = color || palette[initials[0]] || "#64748b";
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
var AOUpdateField = ({
  label,
  oldVal,
  newVal,
  same,
  bar,
  color,
  helper
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 14,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap"
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 12.5,
    color: "#94a3b8",
    textDecoration: same ? "none" : "line-through"
  }
}, oldVal), !same && /*#__PURE__*/React.createElement("span", {
  style: {
    color: "#cbd5e1"
  }
}, "\u2192"), !same && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 14,
    fontWeight: 700,
    color: color || "#0f172a",
    fontFamily: "'JetBrains Mono', monospace"
  }
}, newVal), same && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 3,
    background: "#eef1f5",
    color: "#64748b",
    fontWeight: 600,
    marginLeft: 4
  }
}, "inchang\xE9")), bar != null && /*#__PURE__*/React.createElement("div", {
  style: {
    height: 4,
    background: "#eef1f5",
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: `${bar}%`,
    height: "100%",
    background: color,
    borderRadius: 999
  }
})), helper && /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 5
  }
}, helper));
var AOHealthMetric = ({
  label,
  value,
  color
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    flex: 1
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 100,
    height: 4,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    overflow: "hidden"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: `${value}%`,
    height: "100%",
    background: color,
    borderRadius: 999
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    width: 26,
    textAlign: "right",
    fontFamily: "'JetBrains Mono', monospace"
  }
}, value));
var aoFmtEUR = n => {
  if (!isFinite(n)) return "0 €";
  return Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};
var AdvanceOpportunity = () => {
  var params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  var oppRef = params.get("opp") || null;
  var clientId = params.get("client") || "";

  // ⚠ TOUS les hooks doivent être appelés AVANT tout return conditionnel
  // (règle React : nombre d'appels de hooks identique à chaque render)
  var [oppData, setOppData] = React.useState(null);
  React.useEffect(() => {
    if (!oppRef || !window.api) return;
    window.api.opportunities.getById(oppRef).then(data => {
      if (data) setOppData({
        ...data,
        ref: data.id || data.ref,
        amount: data.amount_eur != null ? data.amount_eur : data.amount,
        close: data.close_date ? new Date(data.close_date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }) : data.close || "",
        client_name: data.client_name || data.data && data.data.client_name || ""
      });
    }).catch(e => console.warn("[AdvanceOpp] getById:", e));
  }, [oppRef]);

  // Early return APRÈS les hooks
  if (!oppRef) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: "center",
        color: "#64748b"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: 8
      }
    }, "Aucune opportunit\xE9 s\xE9lectionn\xE9e"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        marginBottom: 16
      }
    }, "Choisissez une opportunit\xE9 dans le pipeline pour la faire avancer d'\xE9tape."), /*#__PURE__*/React.createElement("a", {
      href: "/crm",
      style: {
        padding: "8px 14px",
        background: "#0f172a",
        color: "#fff",
        textDecoration: "none",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600
      }
    }, "\u2190 Voir le pipeline"));
  }
  var stages = [{
    k: "qualif",
    label: "Qualification",
    color: "#94a3b8",
    proba: 20
  }, {
    k: "discovery",
    label: "Discovery",
    color: "#3b82f6",
    proba: 35
  }, {
    k: "propo",
    label: "Proposition",
    color: "#a855f7",
    proba: 55
  }, {
    k: "nego",
    label: "Négociation",
    color: "#ea580c",
    proba: 75
  }, {
    k: "won",
    label: "Signé",
    color: "#10b981",
    proba: 100
  }];
  var opp = oppData || {
    ref: oppRef,
    name: "Chargement…",
    client_name: "",
    stage: "qualif",
    amount: 0,
    proba: 20,
    owner: "Vous",
    close: "",
    last_update: ""
  };

  // ⚠ Pas d'early return ici — sinon les hooks suivants violeraient la
  // règle des hooks. On laisse le composant rendre avec les valeurs
  // placeholder de `opp` (name: "Chargement…") jusqu'à ce que la donnée
  // arrive depuis l'API.

  var curIdx = Math.max(0, stages.findIndex(s => s.k === opp.stage));
  var [targetIdx, setTargetIdx] = React.useState(Math.min(stages.length - 1, curIdx + 1));
  var current = stages[curIdx];
  var target = stages[targetIdx];

  // Default exit criteria per stage
  var defaultCriteria = {
    qualif: [{
      label: "Besoin client documenté",
      done: true
    }, {
      label: "Interlocuteur identifié",
      done: true
    }, {
      label: "Budget approximatif validé",
      done: true
    }, {
      label: "Calendrier projet estimé",
      done: false,
      todo: true
    }],
    discovery: [{
      label: "Discovery call réalisé",
      done: true
    }, {
      label: "Cartographie des décideurs (≥ 3)",
      done: true
    }, {
      label: "Use-cases clés validés",
      done: true
    }, {
      label: "Critères de décision identifiés",
      done: false,
      todo: true
    }],
    propo: [{
      label: "Proposition commerciale envoyée",
      done: true
    }, {
      label: "Décideurs identifiés (≥ 3 personas)",
      done: true
    }, {
      label: "Budget confirmé par CFO",
      done: true
    }, {
      label: "Critères de décision documentés",
      done: true
    }, {
      label: "Conditions commerciales négociées",
      done: false,
      todo: true,
      deadline: "Avant comité"
    }, {
      label: "Sponsor exécutif client confirmé",
      done: false,
      todo: true
    }, {
      label: "Échéance close cible alignée",
      done: false,
      warn: true,
      value: "T-18 j"
    }],
    nego: [{
      label: "Conditions juridiques arrêtées",
      done: false,
      todo: true
    }, {
      label: "Bon de commande / engagement",
      done: false,
      todo: true
    }, {
      label: "Signataire confirmé",
      done: false,
      todo: true
    }],
    won: [{
      label: "Contrat signé par les deux parties",
      done: false,
      todo: true
    }, {
      label: "Bon de livraison / kickoff planifié",
      done: false,
      todo: true
    }]
  };
  var [criteria, setCriteria] = React.useState(defaultCriteria[current.k] || []);
  React.useEffect(() => {
    setCriteria(defaultCriteria[current.k] || []);
  }, [current.k]);
  var toggleCriterion = i => setCriteria(cs => cs.map((c, idx) => idx === i ? {
    ...c,
    done: !c.done
  } : c));
  var addCriterion = async () => {
    var label = window.HubModal ? await window.HubModal.prompt({
      title: "Ajouter un critère de sortie",
      label: "Libellé du critère",
      placeholder: "ex : Budget validé par CFO"
    }) : prompt("Nouveau critère :");
    if (label && label.trim()) setCriteria(cs => [...cs, {
      label: label.trim(),
      done: false,
      todo: true
    }]);
  };
  var passed = criteria.filter(c => c.done).length;
  var totalC = criteria.length;
  var pct = totalC ? Math.round(passed / totalC * 100) : 0;
  var remaining = totalC - passed;

  // Update fields
  var [newAmount, setNewAmount] = React.useState(opp.amount);
  var [newClose, setNewClose] = React.useState(opp.close);
  var [comment, setComment] = React.useState("");

  // Tasks to plan for next stage
  var defaultTasks = {
    nego: [{
      check: true,
      p: "haute",
      title: "Présenter proposition finale",
      due: "À planifier",
      who: "Owner",
      icon: "📅"
    }, {
      check: true,
      p: "haute",
      title: "Envoyer proposition v3 avec ajustements",
      due: "À planifier",
      who: "Owner",
      icon: "📧"
    }, {
      check: false,
      p: "moyenne",
      title: "Préparer matrice négociation (3 scénarios remise)",
      due: "À planifier",
      who: "Romain Daviaud",
      icon: "📊"
    }, {
      check: false,
      p: "moyenne",
      title: "Demander signature DPA + clause DORA",
      due: "À planifier",
      who: "Tom Verdier",
      icon: "⚖"
    }],
    won: [{
      check: false,
      p: "haute",
      title: "Préparer contrat de signature",
      due: "À planifier",
      who: "Owner",
      icon: "📄"
    }, {
      check: false,
      p: "moyenne",
      title: "Kickoff projet — 1ère réunion équipe",
      due: "Sous 7 j",
      who: "Owner",
      icon: "🚀"
    }],
    discovery: [{
      check: false,
      p: "haute",
      title: "Discovery call avec décideur principal",
      due: "Sous 5 j",
      who: "Owner",
      icon: "📞"
    }],
    propo: [{
      check: false,
      p: "haute",
      title: "Envoyer proposition commerciale",
      due: "Sous 7 j",
      who: "Owner",
      icon: "📧"
    }],
    qualif: []
  };
  var [tasks, setTasks] = React.useState(defaultTasks[target.k] || []);
  React.useEffect(() => {
    setTasks(defaultTasks[target.k] || []);
  }, [target.k]);
  var toggleTask = i => setTasks(ts => ts.map((t, idx) => idx === i ? {
    ...t,
    check: !t.check
  } : t));
  var addTask = async () => {
    var title = window.HubModal ? await window.HubModal.prompt({
      title: "Ajouter une tâche",
      label: "Intitulé",
      placeholder: "ex : Préparer présentation DORA"
    }) : prompt("Titre de la tâche :");
    if (!title || !title.trim()) return;
    setTasks(ts => [...ts, {
      check: false,
      p: "moyenne",
      title: title.trim(),
      due: "À planifier",
      who: "Owner",
      icon: "✅"
    }]);
  };

  // Forecast impact
  var ponderedBefore = opp.amount * (current.proba / 100);
  var ponderedAfter = opp.amount * (target.proba / 100);
  var gain = ponderedAfter - ponderedBefore;

  // Confirm advance
  var confirmAdvance = async asLost => {
    var newStage = asLost ? "lost" : target.k;
    var amountNum = parseFloat(String(newAmount || "0").replace(/[^\d.]/g, "")) || 0;

    // Avertissement souple si on avance malgré des critères non cochés
    var incomplete = criteria.filter(c => c.todo && !c.done).length;
    if (!asLost && incomplete > 0) {
      var proceed = window.HubModal ? await window.HubModal.confirm({
        title: "Avancer en " + target.label + " ?",
        message: "Il reste " + incomplete + " critère" + (incomplete > 1 ? "s" : "") + " de sortie non validé" + (incomplete > 1 ? "s" : "") + ".",
        okLabel: "Avancer malgré tout"
      }) : confirm("Il reste " + incomplete + " critère(s) non validé(s). Continuer ?");
      if (!proceed) return;
    }
    try {
      await window.api.opportunities.update(opp.ref, {
        stage: newStage,
        proba: asLost ? 0 : target.proba,
        amount_eur: amountNum,
        close_date: newClose || null,
        notes: comment || null
      });
    } catch (e) {
      console.warn("confirmAdvance:", e);
      alert("Erreur lors de la mise à jour : " + (e.message || e));
      return;
    }
    alert(asLost ? "✓ Opportunité marquée comme perdue" : "✓ Opportunité passée en " + target.label);
    if (clientId) window.location.href = "/fiche-client?id=" + encodeURIComponent(clientId);else window.location.href = "/crm";
  };

  // ── Render
  return /*#__PURE__*/React.createElement("div", {
    style: aoStyles.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: aoStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      color: "#64748b",
      textDecoration: "none"
    }
  }, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: aoStyles.refMono
  }, opp.ref), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Faire avancer l'\xE9tape")), /*#__PURE__*/React.createElement("button", {
    onClick: () => history.back(),
    style: aoStyles.iconBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.heroIcon
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13 5l7 7-7 7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 12h15"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: aoStyles.h1
  }, "Faire avancer l'opportunit\xE9"), /*#__PURE__*/React.createElement("p", {
    style: aoStyles.subtitle
  }, "Passez l'opportunit\xE9 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, opp.ref), " de", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: current.color,
      fontWeight: 600
    }
  }, current.label), " \xE0", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: target.color,
      fontWeight: 600
    }
  }, target.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => history.back(),
    style: aoStyles.ghostBtn
  }, "Annuler"), curIdx > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setTargetIdx(curIdx - 1),
    style: aoStyles.ghostBtn
  }, "\u21A9 Reculer \xE0 ", stages[curIdx - 1].label), /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmAdvance(false),
    style: aoStyles.primaryBtn
  }, "\u2713 Avancer en ", target.label, " \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.oppCard
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.oppCardInner
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: aoStyles.oppRef
  }, opp.ref), /*#__PURE__*/React.createElement("span", {
    style: {
      ...aoStyles.stagePill,
      background: current.color + "20",
      color: current.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 999,
      background: current.color
    }
  }), " ", current.label), opp.hot && /*#__PURE__*/React.createElement("span", {
    style: aoStyles.hotPill
  }, "\uD83D\uDD25 Hot")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -0.3
    }
  }, opp.name), opp.client_name && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 3
    }
  }, opp.client_name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: 700
    }
  }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: current.color,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, current.proba, " %")), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.probaBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: current.proba + "%",
      height: "100%",
      background: current.color,
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(AOAvatar, {
    name: opp.owner,
    size: 22,
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#475569"
    }
  }, opp.owner)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "MAJ ", opp.last_update || "récemment"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      borderLeft: "1px solid #f1f5f9",
      paddingLeft: 22,
      marginLeft: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -0.5
    }
  }, aoFmtEUR(opp.amount)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      marginTop: 2
    }
  }, "Cl\xF4ture ", opp.close || "—")))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.pipeViz
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 14
    }
  }, "Progression dans le pipeline"), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.pipeRow
  }, stages.map((s, i, arr) => {
    var done = i < curIdx;
    var isCurrent = i === curIdx;
    var isNext = i === targetIdx && targetIdx !== curIdx;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s.k
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setTargetIdx(i),
      style: {
        ...aoStyles.pipeNode,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...aoStyles.pipeDot,
        background: done ? "#10b981" : isCurrent ? "#a855f7" : isNext ? "linear-gradient(135deg, #ea580c, #f59e0b)" : "#fff",
        border: done || isCurrent || isNext ? "none" : "2px solid #cbd5e1",
        color: "#fff",
        boxShadow: isCurrent ? "0 0 0 4px rgba(168,85,247,0.2)" : isNext ? "0 0 0 4px rgba(234,88,12,0.15)" : "none"
      }
    }, done ? "✓" : isCurrent ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#fff"
      }
    }) : isNext ? "→" : ""), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: isCurrent || isNext ? 700 : 600,
        color: done ? "#10b981" : isCurrent ? "#7e22ce" : isNext ? "#ea580c" : "#94a3b8",
        marginTop: 8
      }
    }, s.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: isCurrent || isNext ? s.color : "#cbd5e1",
        fontWeight: 700,
        marginTop: 2,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, s.proba, "%"), isCurrent && /*#__PURE__*/React.createElement("div", {
      style: aoStyles.currentTag
    }, "\xC9TAPE ACTUELLE"), isNext && /*#__PURE__*/React.createElement("div", {
      style: aoStyles.nextTag
    }, "\u2192 NOUVELLE \xC9TAPE")), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 3,
        background: done ? "#10b981" : i === curIdx && i < targetIdx ? "linear-gradient(90deg, #a855f7, #ea580c)" : "#eef1f5",
        borderRadius: 999,
        alignSelf: "flex-start",
        marginTop: 17
      }
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.leftCol
  }, /*#__PURE__*/React.createElement("section", {
    style: aoStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: aoStyles.h2
  }, "Crit\xE8res de sortie \u2014 ", current.label), /*#__PURE__*/React.createElement("p", {
    style: aoStyles.h2sub
  }, "Validez les conditions avant de passer en ", target.label)), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.completionPill
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.completionCircle
  }, /*#__PURE__*/React.createElement("svg", {
    width: "32",
    height: "32",
    viewBox: "0 0 32 32"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "16",
    r: "13",
    fill: "none",
    stroke: "#eef1f5",
    strokeWidth: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "16",
    r: "13",
    fill: "none",
    stroke: "#10b981",
    strokeWidth: "4",
    strokeDasharray: `${pct / 100 * 82} 82`,
    strokeLinecap: "round",
    transform: "rotate(-90 16 16)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, pct, "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, passed, " / ", totalC, " valid\xE9s"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, remaining, " crit\xE8re", remaining > 1 ? "s" : "", " restant", remaining > 1 ? "s" : "")))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.criteriaList
  }, criteria.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...aoStyles.criterion,
      ...(c.warn ? aoStyles.criterionWarn : c.todo && !c.done ? aoStyles.criterionTodo : c.done ? aoStyles.criterionDone : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => toggleCriterion(i),
    style: {
      ...aoStyles.checkBox,
      cursor: "pointer",
      background: c.done ? "#10b981" : "transparent",
      border: c.done ? "none" : c.warn ? "1.5px solid #f59e0b" : "1.5px solid #cbd5e1",
      color: "#fff"
    }
  }, c.done && "✓"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, c.label), c.deadline && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#dc2626",
      marginTop: 2,
      fontWeight: 600
    }
  }, "\u23F1 ", c.deadline), c.value && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#a65f00",
      marginTop: 2,
      fontWeight: 600
    }
  }, "\u26A0 ", c.value)), !c.done && /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleCriterion(i),
    style: aoStyles.smBtn
  }, "Valider"))), /*#__PURE__*/React.createElement("button", {
    onClick: addCriterion,
    style: {
      ...aoStyles.smBtnGhost,
      alignSelf: "flex-start",
      marginTop: 4
    }
  }, "+ Ajouter un crit\xE8re"))), /*#__PURE__*/React.createElement("section", {
    style: aoStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: aoStyles.h2
  }, "Mise \xE0 jour des champs"), /*#__PURE__*/React.createElement("p", {
    style: aoStyles.h2sub
  }, "Le passage en ", target.label, " pr\xE9-remplit ces valeurs \u2014 modifiez si n\xE9cessaire")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 4,
      background: "#eef2ff",
      color: "#4f46e5",
      fontWeight: 700,
      letterSpacing: 0.3
    }
  }, "AUTO-RENSEIGN\xC9")), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.updateGrid
  }, /*#__PURE__*/React.createElement(AOUpdateField, {
    label: "Montant",
    oldVal: aoFmtEUR(opp.amount),
    newVal: aoFmtEUR(newAmount),
    same: newAmount === opp.amount
  }), /*#__PURE__*/React.createElement(AOUpdateField, {
    label: "Probabilit\xE9",
    oldVal: current.proba + " %",
    newVal: target.proba + " %",
    bar: target.proba,
    color: target.color
  }), /*#__PURE__*/React.createElement(AOUpdateField, {
    label: "Date de cl\xF4ture",
    oldVal: opp.close || "—",
    newVal: newClose || "—",
    same: newClose === opp.close,
    helper: "Modifiable"
  }), /*#__PURE__*/React.createElement(AOUpdateField, {
    label: "Owner",
    oldVal: opp.owner,
    newVal: opp.amount > 200000 ? opp.owner + " + VP Sales" : opp.owner,
    same: opp.amount <= 200000,
    helper: opp.amount > 200000 ? "VP Sales rejoint sur deal > 200 k€" : null
  })), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.noteRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: 6,
      display: "block"
    }
  }, "Commentaire de changement d'\xE9tape", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 400
    }
  }, "\xB7 visible dans l'historique de l'opportunit\xE9")), /*#__PURE__*/React.createElement("textarea", {
    value: comment,
    onChange: e => setComment(e.target.value),
    style: aoStyles.textarea,
    rows: "3",
    placeholder: "Contexte du passage d'\xE9tape, points cl\xE9s, prochaines actions\u2026"
  }))), /*#__PURE__*/React.createElement("section", {
    style: aoStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: aoStyles.h2
  }, "Actions \xE0 planifier en ", target.label), /*#__PURE__*/React.createElement("p", {
    style: aoStyles.h2sub
  }, "Ces t\xE2ches seront cr\xE9\xE9es automatiquement \xE0 l'avancement")), /*#__PURE__*/React.createElement("button", {
    onClick: addTask,
    style: aoStyles.smBtn
  }, "+ Ajouter")), tasks.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      fontSize: 12,
      color: "#94a3b8",
      textAlign: "center",
      background: "#fafbfc",
      border: "1px dashed #e2e8f0",
      borderRadius: 8
    }
  }, "Aucune t\xE2che par d\xE9faut pour cette \xE9tape. Cliquez sur ", /*#__PURE__*/React.createElement("b", null, "+ Ajouter"), " pour en cr\xE9er.") : /*#__PURE__*/React.createElement("div", {
    style: aoStyles.taskList
  }, tasks.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: aoStyles.taskRow
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: t.check,
    onChange: () => toggleTask(i),
    style: {
      accentColor: "#4f46e5"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...aoStyles.prioPill,
      background: t.p === "haute" ? "#fdecec" : "#fef0e6",
      color: t.p === "haute" ? "#dc2626" : "#ea580c"
    }
  }, t.p === "haute" ? "Haute" : "Moy."), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      textAlign: "center",
      fontSize: 14
    }
  }, t.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 1,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "\u23F1 ", t.due)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(AOAvatar, {
    name: t.who,
    size: 20,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569"
    }
  }, t.who.split(" ")[0]))))))), /*#__PURE__*/React.createElement("aside", {
    style: aoStyles.rightCol
  }, /*#__PURE__*/React.createElement("div", {
    style: aoStyles.healthCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "rgba(255,255,255,0.7)",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Sant\xE9 de l'opportunit\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 999,
      background: "rgba(16,185,129,0.2)",
      color: "#86efac",
      fontWeight: 700
    }
  }, "\u25CF ", pct >= 70 ? "SAINE" : pct >= 40 ? "À SUIVRE" : "À RISQUE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 38,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -1
    }
  }, Math.round(pct * 0.6 + target.proba * 0.4)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,0.6)"
    }
  }, "/ 100")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: "rgba(255,255,255,0.15)",
      borderRadius: 999,
      marginTop: 10,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.round(pct * 0.6 + target.proba * 0.4) + "%",
      height: "100%",
      background: "linear-gradient(90deg, #a78bfa, #10b981)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 12,
      borderTop: "1px solid rgba(255,255,255,0.12)"
    }
  }, /*#__PURE__*/React.createElement(AOHealthMetric, {
    label: "Crit\xE8res valid\xE9s",
    value: pct,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(AOHealthMetric, {
    label: "Probabilit\xE9 \xE9tape",
    value: target.proba,
    color: "#a78bfa"
  }), /*#__PURE__*/React.createElement(AOHealthMetric, {
    label: "V\xE9locit\xE9 (cycle)",
    value: 78,
    color: "#10b981"
  }))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.aiCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 999,
      background: "#0f172a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Hub Assistant \u2014 insights"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, "Analyse d'opportunit\xE9s similaires"))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...aoStyles.aiBullet,
      background: "#10b981"
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#0f172a",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("strong", null, pct >= 70 ? "Bon moment pour avancer." : "Avancement prématuré possible."), " ", pct, "% des crit\xE8res sont valid\xE9s. Cycle moyen restant : ~22 j."))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...aoStyles.aiBullet,
      background: "#4f46e5"
    }
  }, "i"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#0f172a",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Remise habituelle :"), " 8-12 % en N\xE9gociation sur ce segment.")))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.impactCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 12
    }
  }, "Impact forecast"), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.impactRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, "Pond\xE9r\xE9 avant"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, aoFmtEUR(ponderedBefore)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, aoFmtEUR(opp.amount), " \xD7 ", current.proba, " %")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      color: "#cbd5e1"
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, "Pond\xE9r\xE9 apr\xE8s"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: gain >= 0 ? "#10b981" : "#dc2626",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, aoFmtEUR(ponderedAfter)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, aoFmtEUR(opp.amount), " \xD7 ", target.proba, " %"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...aoStyles.impactGain,
      background: gain >= 0 ? "#e8f8f1" : "#fdecec",
      color: gain >= 0 ? "#0e7a55" : "#dc2626"
    }
  }, /*#__PURE__*/React.createElement("span", null, gain >= 0 ? "↗ Gain pondéré" : "↘ Perte pondérée"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, gain >= 0 ? "+ " : "– ", aoFmtEUR(Math.abs(gain))))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.notifyCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 8
    }
  }, "Notifier \xE0 l'avancement"), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.notifyRow
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(AOAvatar, {
    name: "Augustin Morin",
    size: 20,
    color: "#0e7a55"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      flex: 1
    }
  }, "Augustin Morin \xB7 Astorya")), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.notifyRow
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(AOAvatar, {
    name: "Romain Daviaud",
    size: 20,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      flex: 1
    }
  }, "Romain Daviaud \xB7 Co-owner")), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.notifyRow
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 999,
      background: "#eef1f5",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10
    }
  }, "#"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      flex: 1
    }
  }, "Canal Slack #deals"))))), /*#__PURE__*/React.createElement("div", {
    style: aoStyles.stickyBottom
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, remaining, " crit\xE8re", remaining > 1 ? "s" : "", " restant", remaining > 1 ? "s" : ""), remaining > 0 && " · vous pouvez avancer malgré tout")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Marquer comme perdue ?",
        message: "L'opportunité passera au statut Lost et sortira du pipeline actif.",
        okLabel: "Confirmer la perte",
        okStyle: "danger"
      }) : confirm("Marquer cette opportunité comme perdue ?");
      if (ok) confirmAdvance(true);
    },
    style: aoStyles.dangerGhostBtn
  }, "Marquer comme perdu"), /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmAdvance(false),
    style: aoStyles.primaryBtnBig
  }, "\u2713 Confirmer le passage en ", target.label))));
};
var aoStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 80
  },
  topbar: {
    padding: "14px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10
  },
  refMono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#94a3b8",
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fafbfc",
    border: "1px solid #eef1f5"
  },
  iconBtn: {
    width: 32,
    height: 32,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  titleRow: {
    padding: "20px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    flexWrap: "wrap",
    gap: 16
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    background: "linear-gradient(135deg, #a855f7, #ea580c)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(168,85,247,0.3)"
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.7,
    margin: 0
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
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
  primaryBtn: {
    padding: "8px 16px",
    border: "none",
    background: "linear-gradient(135deg, #ea580c, #f59e0b)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(234,88,12,0.3)"
  },
  oppCard: {
    margin: "20px 28px 0",
    padding: 0,
    background: "#fff",
    border: "1.5px solid #fed7aa",
    borderRadius: 12,
    position: "relative",
    boxShadow: "0 0 0 1px #fed7aa, 0 4px 16px rgba(234,88,12,0.06)"
  },
  oppCardInner: {
    display: "flex",
    padding: 18,
    alignItems: "stretch",
    flexWrap: "wrap",
    gap: 12
  },
  oppRef: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: "#475569",
    fontWeight: 600
  },
  stagePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600
  },
  hotPill: {
    fontSize: 10.5,
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fff1d6",
    color: "#a65f00",
    fontWeight: 700
  },
  probaBar: {
    width: "100%",
    height: 6,
    background: "#f3e8ff",
    borderRadius: 999,
    overflow: "hidden"
  },
  pipeViz: {
    margin: "24px 28px 8px",
    padding: 22,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  pipeRow: {
    display: "flex",
    alignItems: "flex-start",
    overflowX: "auto"
  },
  pipeNode: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 100,
    position: "relative",
    padding: "0 4px"
  },
  pipeDot: {
    width: 36,
    height: 36,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700
  },
  currentTag: {
    position: "absolute",
    top: -22,
    fontSize: 8.5,
    padding: "2px 6px",
    borderRadius: 3,
    background: "#7e22ce",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4,
    whiteSpace: "nowrap"
  },
  nextTag: {
    position: "absolute",
    top: -22,
    fontSize: 8.5,
    padding: "2px 6px",
    borderRadius: 3,
    background: "#ea580c",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4,
    whiteSpace: "nowrap"
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 14,
    padding: "20px 28px"
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minWidth: 0
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    position: "sticky",
    top: 20,
    alignSelf: "start"
  },
  section: {
    padding: 22,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 10,
    flexWrap: "wrap"
  },
  h2: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  h2sub: {
    fontSize: 12,
    color: "#64748b",
    margin: "3px 0 0"
  },
  completionPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  completionCircle: {
    position: "relative",
    width: 32,
    height: 32
  },
  criteriaList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  criterion: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 8,
    background: "#fafbfc"
  },
  criterionDone: {
    background: "#f0fdf6",
    borderColor: "#bbf7d0"
  },
  criterionTodo: {
    background: "linear-gradient(180deg, #fafbff, #fff)",
    borderColor: "#c7d2fe",
    borderStyle: "dashed"
  },
  criterionWarn: {
    background: "#fffbeb",
    borderColor: "#fde68a"
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1
  },
  smBtn: {
    padding: "3px 10px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600
  },
  smBtnGhost: {
    padding: "3px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 500
  },
  updateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14
  },
  noteRow: {
    padding: 14,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  textarea: {
    width: "100%",
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12.5,
    fontFamily: "inherit",
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.5,
    boxSizing: "border-box",
    background: "#fff"
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  prioPill: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  healthCard: {
    padding: 18,
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)",
    borderRadius: 12,
    color: "#fff",
    boxShadow: "0 4px 16px rgba(67,56,202,0.2)"
  },
  aiCard: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  aiItem: {
    display: "flex",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  aiBullet: {
    width: 18,
    height: 18,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1
  },
  impactCard: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  impactRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  impactGain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 8,
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700
  },
  notifyCard: {
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  notifyRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0"
  },
  stickyBottom: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "14px 28px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    borderTop: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 -4px 16px rgba(15,23,42,0.06)",
    flexWrap: "wrap",
    gap: 10,
    zIndex: 100
  },
  dangerGhostBtn: {
    padding: "8px 14px",
    border: "1px solid #fecaca",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 500
  },
  primaryBtnBig: {
    padding: "10px 20px",
    border: "none",
    background: "linear-gradient(135deg, #ea580c, #f59e0b)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 13.5,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(234,88,12,0.4)",
    display: "flex",
    alignItems: "center"
  }
};
window.AdvanceOpportunity = AdvanceOpportunity;