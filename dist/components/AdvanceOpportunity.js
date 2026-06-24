// ════════════════════════════════════════════════════════════════════
// AdvanceOpportunity — Faire avancer une opportunité (méthode SPANCO)
// ════════════════════════════════════════════════════════════════════
// Refonte épurée alignée sur la charte Hub :
//  - Header sobre (blanc, comme la fiche client)
//  - Stepper SPANCO compact (5 étapes : Prospect → Approche → Négociation
//    → Conclusion → Ordre)
//  - 3 cards : Infos opp éditables / Critères / Commentaire de passage
//  - Panneau Santé conservé à droite
//  - Accent indigo #3730a3 (cohérent avec le reste du Hub)
//
// Mapping interne stage BDD → label SPANCO :
//   qualif      → Prospect    (20%)
//   discovery   → Approche    (35%)
//   propo       → Négociation (55%)
//   nego        → Conclusion  (75%)
//   won         → Ordre       (100%)
// ════════════════════════════════════════════════════════════════════

var aoFmtEUR = n => {
  var v = Number(n);
  if (!isFinite(v)) return "0 €";
  return Math.round(v).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};
var AdvanceOpportunity = () => {
  var params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  var oppRef = params.get("opp") || null;
  var clientId = params.get("client") || "";
  var [oppData, setOppData] = React.useState(null);
  React.useEffect(() => {
    if (!oppRef || !window.api) return;
    window.api.opportunities.getById(oppRef).then(data => {
      if (data) setOppData({
        ...data,
        ref: data.id || data.ref,
        amount: data.amount_eur != null ? data.amount_eur : data.amount,
        client_name: data.client_name || data.data && data.data.client_name || ""
      });
    }).catch(e => console.warn("[AdvanceOpp] getById:", e));
  }, [oppRef]);

  // SPANCO : 5 étapes mappées sur les stages BDD historiques
  var stages = [{
    k: "qualif",
    spanco: "Prospect",
    letter: "P",
    proba: 20,
    color: "#94a3b8"
  }, {
    k: "discovery",
    spanco: "Approche",
    letter: "A",
    proba: 35,
    color: "#3b82f6"
  }, {
    k: "propo",
    spanco: "Négociation",
    letter: "N",
    proba: 55,
    color: "#a855f7"
  }, {
    k: "nego",
    spanco: "Conclusion",
    letter: "C",
    proba: 75,
    color: "#ea580c"
  }, {
    k: "won",
    spanco: "Ordre",
    letter: "O",
    proba: 100,
    color: "#10b981"
  }];

  // Hooks AVANT le return conditionnel (règle des hooks)
  var opp = oppData || {
    ref: oppRef,
    name: "Chargement…",
    client_name: "",
    stage: "qualif",
    amount: 0,
    proba: 20,
    owner: "Vous",
    close: ""
  };
  var curIdx = Math.max(0, stages.findIndex(s => s.k === opp.stage));
  var [targetIdx, setTargetIdx] = React.useState(Math.min(stages.length - 1, curIdx + 1));
  React.useEffect(() => {
    setTargetIdx(Math.min(stages.length - 1, curIdx + 1));
  }, [curIdx]);
  var current = stages[curIdx];
  var target = stages[targetIdx];

  // Champs éditables — pré-remplis depuis la BDD
  var [editName, setEditName] = React.useState("");
  var [editAmount, setEditAmount] = React.useState("");
  var [editBesoin, setEditBesoin] = React.useState("");
  var [editConcurrent, setEditConcurrent] = React.useState("");
  var [editConcurrentAmount, setEditConcurrentAmount] = React.useState("");
  var [editContractEnd, setEditContractEnd] = React.useState("");
  var [editDecisionDate, setEditDecisionDate] = React.useState("");
  var [editNotes, setEditNotes] = React.useState("");
  var [comment, setComment] = React.useState("");
  React.useEffect(() => {
    if (!oppData) return;
    setEditName(oppData.name || "");
    setEditAmount(oppData.amount != null ? String(oppData.amount) : "");
    setEditBesoin(oppData.besoin || oppData.data && oppData.data.besoin || "");
    setEditConcurrent(oppData.concurrent || oppData.data && oppData.data.concurrent || "");
    setEditConcurrentAmount(oppData.concurrent_amount || oppData.data && oppData.data.concurrent_amount || "");
    setEditContractEnd(oppData.contract_end || oppData.data && oppData.data.contract_end || "");
    setEditDecisionDate(oppData.close_date || "");
    setEditNotes(oppData.notes || oppData.data && oppData.data.notes || "");
  }, [oppData]);

  // Critères de sortie (auto-générés par stage cible)
  var defaultCriteria = {
    discovery: [{
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
      done: false
    }],
    propo: [{
      label: "Rendez vous client en présentiel ou en visioconférence réalisé",
      done: true
    }, {
      label: "Cartographie des décideurs (≥ 3)",
      done: true
    }, {
      label: "Valeurs ajoutées de la solution proposée validées",
      done: true
    }, {
      label: "Création de l'offre concurrentielle financière SASP (génération d'un tableau situation actuelle - situation proposée)",
      done: false
    }],
    nego: [{
      label: "Proposition commerciale envoyée",
      done: true
    }, {
      label: "Décideurs identifiés (≥ 3 personas)",
      done: true
    }, {
      label: "Budget confirmé par CFO",
      done: false
    }, {
      label: "Sponsor exécutif client confirmé : la réussite du projet et l'alignement du projet sur la vision et la stratégie de l'entreprise",
      done: false
    }],
    won: [{
      label: "Conditions juridiques arrêtées",
      done: false
    }, {
      label: "Bon de commande / Contrat d'engagement / Dossier de financement signé",
      done: false
    }, {
      label: "Signataire confirmé",
      done: false
    }]
  };
  var [criteria, setCriteria] = React.useState(defaultCriteria[target.k] || []);
  React.useEffect(() => {
    setCriteria(defaultCriteria[target.k] || []);
  }, [target.k]);
  var toggleCriterion = i => setCriteria(cs => cs.map((c, idx) => idx === i ? {
    ...c,
    done: !c.done
  } : c));
  var passed = criteria.filter(c => c.done).length;
  var totalC = criteria.length;
  var pct = totalC > 0 ? Math.round(passed / totalC * 100) : 100;

  // Early return après les hooks
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
    }, "Choisissez une opportunit\xE9 dans le pipeline pour la faire avancer."), /*#__PURE__*/React.createElement("a", {
      href: "/crm",
      style: {
        padding: "8px 14px",
        background: "#3730a3",
        color: "#fff",
        textDecoration: "none",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600
      }
    }, "\u2190 Voir le pipeline"));
  }

  // Métriques santé
  var amountNum = Number(editAmount) || 0;
  var ponderedBefore = amountNum * (current.proba / 100);
  var ponderedAfter = amountNum * (target.proba / 100);
  var gain = ponderedAfter - ponderedBefore;
  var healthScore = Math.min(100, Math.round(pct * 0.5 + target.proba * 0.5));
  var healthTone = healthScore >= 70 ? {
    label: "Saine",
    color: "#065f46",
    bg: "#dcfce7"
  } : healthScore >= 40 ? {
    label: "À surveiller",
    color: "#92400e",
    bg: "#fef3c7"
  } : {
    label: "À risque",
    color: "#991b1b",
    bg: "#fee2e2"
  };

  // Confirmer le passage
  var confirmAdvance = async asLost => {
    var newStage = asLost ? "lost" : target.k;
    var amountFinal = parseFloat(String(editAmount || "0").replace(/[^\d.]/g, "")) || 0;
    if (!asLost && passed < totalC) {
      var proceed = window.HubModal ? await window.HubModal.confirm({
        title: "Avancer en " + target.spanco + " ?",
        message: "Il reste " + (totalC - passed) + " critère" + (totalC - passed > 1 ? "s" : "") + " non validé" + (totalC - passed > 1 ? "s" : "") + ".",
        okLabel: "Avancer malgré tout"
      }) : confirm("Il reste " + (totalC - passed) + " critère(s) non validé(s). Continuer ?");
      if (!proceed) return;
    }
    try {
      await window.api.opportunities.update(opp.ref, {
        stage: newStage,
        proba: asLost ? 0 : target.proba,
        amount_eur: amountFinal,
        close_date: editDecisionDate || null,
        notes: comment || editNotes || null,
        name: editName || opp.name,
        besoin: editBesoin || null,
        concurrent: editConcurrent || null,
        concurrent_amount: editConcurrentAmount || null,
        contract_end: editContractEnd || null
      });
    } catch (e) {
      console.warn("confirmAdvance:", e);
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      return;
    }

    // ⚡ Création automatique d'actions liées au passage d'étape.
    // Approche (discovery) → Négociation (propo) : créer une action
    // « Envoi de l'offre commerciale » assignée au commercial courant
    // (échéance 5 jours par défaut, priorité haute).
    if (!asLost && (opp.stage || "qualif") === "discovery" && newStage === "propo" && window.api.actions && window.api.actions.create) {
      try {
        var _clientId = oppData && (oppData.client_id || oppData.data && oppData.data.client_id);
        await window.api.actions.create({
          client_id: _clientId || null,
          opportunity_id: opp.ref,
          type: "task",
          title: "Envoi de l'offre commerciale — " + (editName || opp.name || ""),
          meta: "Opportunité « " + (editName || opp.name || opp.ref) + " » passée en Négociation : envoyer le devis chiffré sous 5 jours.",
          due_text: "Sous 5 jours",
          priority: "haute",
          icon: "✉",
          tag: "Offre commerciale",
          tagColor: "#a855f7"
        });
        if (window.HubToast) window.HubToast.info("✉ Action « Envoi de l'offre commerciale » créée");
      } catch (e) {
        console.warn("[AdvanceOpp] création action offre:", e);
      }
    }

    // ⚡ CASCADE EXPLICITE COTÉ CLIENT pour passage en Ordre (won)
    // Filet de sécurité au cas où le hook backend silencieusement échoue.
    // Visible étape par étape via toast pour debug.
    var cascadeReport = "";
    if (!asLost && newStage === "won") {
      try {
        var docs = await window.api.commercialDocs.list({
          opportunity_id: opp.ref
        });
        var devisToCascade = (docs || []).filter(d => d.type === "devis" && d.status !== "transforme" && d.status !== "annule" && d.status !== "refuse");
        var nbCmd = 0,
          nbBL = 0;
        for (var devis of devisToCascade) {
          try {
            await window.api.commercialDocs.update(devis.id, {
              status: "accepte"
            });
            var cmd = await window.api.commercialDocs.transform(devis.id, "commande");
            if (cmd) {
              nbCmd++;
              try {
                await window.api.commercialDocs.update(cmd.id, {
                  status: "accepte"
                });
                var bl = await window.api.commercialDocs.transform(cmd.id, "bl");
                if (bl) nbBL++;
              } catch (eBL) {
                console.warn("[client cascade BL]", devis.id, eBL);
              }
            }
          } catch (eC) {
            console.warn("[client cascade CMD]", devis.id, eC);
          }
        }
        if (nbCmd > 0 || nbBL > 0) {
          cascadeReport = " · " + nbCmd + " commande(s) + " + nbBL + " BL générés";
        } else if (devisToCascade.length > 0) {
          cascadeReport = " · cascade partielle (voir console)";
        }
      } catch (e) {
        console.warn("[client cascade]", e);
      }
    }
    if (window.HubToast) window.HubToast.success(asLost ? "✓ Opportunité marquée comme perdue" : "✓ Avancée en " + target.spanco + cascadeReport);
    setTimeout(() => {
      window.location.href = clientId ? "/fiche-client?id=" + encodeURIComponent(clientId) : "/crm";
    }, 1200);
  };
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
    title: "Retour Hub Astorya",
    style: {
      color: "#64748b",
      textDecoration: "none"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#4f46e5",
    onMouseLeave: e => e.currentTarget.style.color = "#64748b"
  }, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    title: "Ouvrir le pipeline commercial",
    style: {
      color: "#64748b",
      textDecoration: "none"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#4f46e5",
    onMouseLeave: e => e.currentTarget.style.color = "#64748b"
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), clientId ? /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client?id=" + encodeURIComponent(clientId),
    title: "Ouvrir la fiche client",
    style: {
      fontVariantNumeric: "tabular-nums",
      fontSize: 11.5,
      color: "#3730a3",
      textDecoration: "none",
      fontWeight: 600
    },
    onMouseEnter: e => e.currentTarget.style.textDecoration = "underline",
    onMouseLeave: e => e.currentTarget.style.textDecoration = "none"
  }, opp.ref) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums",
      fontSize: 11.5,
      color: "#475569"
    }
  }, opp.ref), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Faire avancer")), /*#__PURE__*/React.createElement("a", {
    href: clientId ? "/fiche-client?id=" + clientId : "/crm",
    style: S.closeBtn
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: S.titleRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: S.h1
  }, opp.name), /*#__PURE__*/React.createElement("p", {
    style: S.subtitle
  }, /*#__PURE__*/React.createElement("a", {
    href: clientId ? "/fiche-client?id=" + clientId : "#",
    style: {
      color: "#3730a3",
      textDecoration: "none",
      fontWeight: 500
    }
  }, opp.client_name || "Client"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1",
      margin: "0 6px"
    }
  }, "\xB7"), "\xC9tape actuelle : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: current.color
    }
  }, current.spanco))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: clientId ? "/fiche-client?id=" + clientId : "/crm",
    style: S.btnGhost
  }, curIdx >= stages.length - 1 ? "← Retour" : "Annuler"), clientId && /*#__PURE__*/React.createElement("a", {
    href: "/gestion-commerciale?client=" + encodeURIComponent(clientId) + (opp.ref ? "&opp=" + encodeURIComponent(opp.ref) : ""),
    title: "Voir les devis et documents commerciaux li\xE9s \xE0 ce client",
    style: {
      ...S.btnGhost,
      borderColor: "#3b82f6",
      color: "#1d4ed8",
      background: "#eff6ff",
      textDecoration: "none"
    }
  }, "\uD83D\uDCCB Devis en cours"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        var amtN = parseFloat(String(editAmount || "0").replace(/[^\d.]/g, "")) || 0;
        // Crée un devis pré-rempli avec les données de l'opp
        var devis = await window.api.commercialDocs.create({
          type: "devis",
          status: "brouillon",
          client_id: opp.client_id || null,
          client_name: opp.client_name || null,
          opportunity_id: opp.ref || null,
          title: editName || opp.name || "Devis " + (opp.client_name || ""),
          notes: editBesoin || null,
          internal_notes: editNotes || null,
          owner: opp.owner || null,
          lines: amtN > 0 ? [{
            // L'article n'est PAS le nom de l'opportunité. On laisse
            // la désignation vide pour forcer l'utilisateur à saisir
            // un vrai article (ou ajouter une ligne depuis le catalogue).
            designation: "",
            description: editBesoin ? "Issu de l'opportunité « " + (editName || opp.name) + " » — " + editBesoin : null,
            quantity: 1,
            unit: "forfait",
            unit_price_ht: amtN,
            total_ht: amtN,
            tva_rate: 20,
            total_tva: amtN * 0.2,
            total_ttc: amtN * 1.2,
            discount_pct: 0
          }] : []
        });
        if (window.HubToast) window.HubToast.success("✓ Devis " + devis.id + " créé — ouverture de la gestion commerciale");
        // On stocke l'URL actuelle pour pouvoir y revenir après save du devis
        var returnTo = window.location.pathname + window.location.search;
        setTimeout(() => {
          window.location.href = "/gestion-commerciale?open=" + encodeURIComponent(devis.id) + "&returnTo=" + encodeURIComponent(returnTo);
        }, 600);
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur création devis : " + (e.message || e));
      }
    },
    style: {
      ...S.btnGhost,
      borderColor: "#f59e0b",
      color: "#b45309",
      background: "#fef0e6"
    }
  }, "\uD83D\uDCC4 Cr\xE9er un devis"), curIdx < stages.length - 1 && targetIdx > curIdx && /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmAdvance(false),
    style: target.k === "won" ? {
      ...S.btnPrimary,
      background: "#10b981",
      boxShadow: "0 2px 8px rgba(16,185,129,0.4)"
    } : S.btnPrimary,
    title: target.k === "won" ? "Passage en Ordre : cascade automatique de tous les devis → Commande → BL + génération commande d'achat" : ""
  }, target.k === "won" ? "⚡ Avancer en Ordre + cascade →" : "✓ Avancer en " + target.spanco + " →"))), /*#__PURE__*/React.createElement("div", {
    style: S.spancoStepper
  }, stages.map((s, i) => {
    var isCurrent = i === curIdx;
    var isPast = i < curIdx;
    var isTarget = i === targetIdx && !isCurrent;
    // Toutes les étapes futures ET l'étape courante sont cliquables
    // (étape courante = retour, étape future = avancement).
    var clickable = i >= curIdx;
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      onClick: e => {
        e.stopPropagation();
        if (clickable) setTargetIdx(i);
      },
      style: {
        ...S.spancoStep,
        cursor: clickable ? "pointer" : "default",
        userSelect: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.spancoDot,
        background: isPast || isCurrent ? s.color : isTarget ? s.color + "22" : "#fff",
        borderColor: isPast || isCurrent || isTarget ? s.color : "#e2e8f0",
        color: isPast || isCurrent ? "#fff" : isTarget ? s.color : "#94a3b8",
        boxShadow: isCurrent ? "0 0 0 5px " + s.color + "33" : isTarget ? "0 0 0 4px " + s.color + "20" : "none"
      }
    }, isPast || isCurrent ? "✓" : s.letter), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        fontSize: 11.5,
        fontWeight: isCurrent || isTarget ? 700 : 500,
        color: isPast || isCurrent ? s.color : isTarget ? "#0f172a" : "#94a3b8"
      }
    }, s.spanco, isCurrent ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 9.5,
        color: s.color,
        marginTop: 1,
        letterSpacing: 0.4,
        textTransform: "uppercase"
      }
    }, "\u25CF \xC9tape actuelle") : null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        marginTop: 2,
        fontVariantNumeric: "tabular-nums"
      }
    }, s.proba, "%"), i < stages.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.spancoLine,
        background: i <= curIdx - 1 || i === curIdx ? s.color : "#e2e8f0"
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: S.body
  }, /*#__PURE__*/React.createElement("div", {
    style: S.main
  }, /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("header", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCCB Informations de l'opportunit\xE9"), /*#__PURE__*/React.createElement("span", {
    style: S.badgeEdit
  }, "Modifiable")), /*#__PURE__*/React.createElement("div", {
    style: S.formGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Nom de l'opportunit\xE9"), /*#__PURE__*/React.createElement("input", {
    value: editName,
    onChange: e => setEditName(e.target.value),
    style: S.input
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Montant estim\xE9 (\u20AC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: editAmount,
    onChange: e => setEditAmount(e.target.value),
    style: {
      ...S.input,
      fontVariantNumeric: "tabular-nums"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Date de d\xE9cision potentielle"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: editDecisionDate,
    onChange: e => setEditDecisionDate(e.target.value),
    style: {
      ...S.input,
      fontVariantNumeric: "tabular-nums"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "\uD83D\uDCA1 Besoin exprim\xE9"), /*#__PURE__*/React.createElement("textarea", {
    value: editBesoin,
    onChange: e => setEditBesoin(e.target.value),
    rows: "2",
    style: {
      ...S.input,
      resize: "vertical",
      fontFamily: "inherit"
    },
    placeholder: "Modernisation, contraintes, contexte concurrentiel\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "\u2694 Concurrent actuel"), /*#__PURE__*/React.createElement("input", {
    value: editConcurrent,
    onChange: e => setEditConcurrent(e.target.value),
    style: S.input,
    placeholder: "Salesforce, Pega\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "Montant concurrent (k\u20AC/an)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: editConcurrentAmount,
    onChange: e => setEditConcurrentAmount(e.target.value),
    style: {
      ...S.input,
      fontVariantNumeric: "tabular-nums"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "\uD83D\uDCC5 \xC9ch\xE9ance du contrat actuel (chez le concurrent)"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: editContractEnd,
    onChange: e => setEditContractEnd(e.target.value),
    style: {
      ...S.input,
      fontVariantNumeric: "tabular-nums"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: S.label
  }, "\uD83D\uDCDD Notes internes"), /*#__PURE__*/React.createElement("textarea", {
    value: editNotes,
    onChange: e => setEditNotes(e.target.value),
    rows: "2",
    style: {
      ...S.input,
      resize: "vertical",
      fontFamily: "inherit"
    },
    placeholder: "Contexte additionnel, contacts mutuels, anecdotes\u2026"
  })))), curIdx < stages.length - 1 && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("header", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\u2713 Crit\xE8res pour passer en ", target.spanco), /*#__PURE__*/React.createElement("p", {
    style: S.h2sub
  }, "Validez les conditions de sortie de l'\xE9tape ", current.spanco)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      padding: "3px 10px",
      borderRadius: 999,
      background: pct === 100 ? "#dcfce7" : "#eef2ff",
      color: pct === 100 ? "#065f46" : "#3730a3",
      fontWeight: 700
    }
  }, passed, "/", totalC, pct === 100 ? " ✓" : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, criteria.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      fontSize: 12.5,
      color: "#94a3b8",
      textAlign: "center",
      background: "#fafbfc",
      border: "1px dashed #e2e8f0",
      borderRadius: 8
    }
  }, "Pas de crit\xE8re pour cette transition."), criteria.map((c, i) => /*#__PURE__*/React.createElement("label", {
    key: i,
    onClick: () => toggleCriterion(i),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      border: "1px solid " + (c.done ? "#86efac" : "#e2e8f0"),
      background: c.done ? "#f0fdf4" : "#fff",
      borderRadius: 8,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 5,
      background: c.done ? "#10b981" : "#fff",
      border: c.done ? 0 : "1.5px solid #cbd5e1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 12,
      flexShrink: 0
    }
  }, c.done && "✓"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13,
      color: "#0f172a",
      fontWeight: c.done ? 500 : 600
    }
  }, c.label))))), curIdx < stages.length - 1 && /*#__PURE__*/React.createElement("section", {
    style: S.card
  }, /*#__PURE__*/React.createElement("header", {
    style: S.cardHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: S.h2
  }, "\uD83D\uDCAC Commentaire de changement d'\xE9tape"), /*#__PURE__*/React.createElement("p", {
    style: S.h2sub
  }, "Visible dans l'historique de l'opportunit\xE9"))), /*#__PURE__*/React.createElement("textarea", {
    value: comment,
    onChange: e => setComment(e.target.value),
    rows: "3",
    style: {
      ...S.input,
      resize: "vertical",
      fontFamily: "inherit"
    },
    placeholder: "Contexte du passage d'\xE9tape, points cl\xE9s, prochaines actions\u2026"
  }))), /*#__PURE__*/React.createElement("aside", {
    style: S.aside
  }, curIdx >= stages.length - 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.healthCard,
      background: "linear-gradient(135deg, #065f46, #10b981)"
    }
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
      color: "rgba(255,255,255,0.85)",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Opportunit\xE9 finalis\xE9e"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "2px 8px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.2)",
      color: "#fff",
      fontWeight: 700,
      letterSpacing: 0.3
    }
  }, "\u25CF SIGN\xC9")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "#fff",
      marginBottom: 6
    }
  }, current.spanco), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 1.5,
      marginBottom: 14
    }
  }, "L'opportunit\xE9 a atteint l'\xE9tape finale du pipeline. Le contrat est sign\xE9 et entr\xE9 en production commerciale."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.12)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)"
    }
  }, "Montant sign\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#fff",
      fontVariantNumeric: "tabular-nums"
    }
  }, aoFmtEUR(amountNum)))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: S.healthCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18
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
      fontSize: 10.5,
      padding: "2px 8px",
      borderRadius: 999,
      background: healthTone.bg,
      color: healthTone.color,
      fontWeight: 700,
      letterSpacing: 0.3
    }
  }, "\u25CF ", healthTone.label.toUpperCase())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 42,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -1.2,
      lineHeight: 1
    }
  }, healthScore), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,0.55)"
    }
  }, "/ 100")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: "rgba(255,255,255,0.1)",
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: healthScore + "%",
      height: "100%",
      background: "linear-gradient(90deg, #a78bfa, #10b981)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement(Metric, {
    label: "Crit\xE8res valid\xE9s",
    value: pct,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Probabilit\xE9 \xE9tape",
    value: target.proba,
    color: "#a78bfa"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Avancement SPANCO",
    value: Math.round((targetIdx + 1) / stages.length * 100),
    color: "#0ea5e9"
  })), /*#__PURE__*/React.createElement("div", {
    style: S.forecastCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    }
  }, "Impact si passage"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginBottom: 3
    }
  }, "Avant"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#475569",
      textDecoration: "line-through"
    }
  }, aoFmtEUR(ponderedBefore)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, aoFmtEUR(amountNum), " \xD7 ", current.proba, "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginBottom: 3
    }
  }, "Apr\xE8s"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: target.color
    }
  }, aoFmtEUR(ponderedAfter)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, aoFmtEUR(amountNum), " \xD7 ", target.proba, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "7px 10px",
      borderRadius: 7,
      background: gain >= 0 ? "#dcfce7" : "#fee2e2",
      color: gain >= 0 ? "#065f46" : "#991b1b",
      fontSize: 12,
      fontWeight: 700,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, gain >= 0 ? "↗ Gain pondéré" : "↘ Perte pondérée"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, gain >= 0 ? "+ " : "– ", aoFmtEUR(Math.abs(gain)))))), /*#__PURE__*/React.createElement(LinkedDocsCard, {
    oppRef: opp.ref
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.bottomBar
  }, curIdx >= stages.length - 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13,
      color: "#0f172a"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#065f46"
    }
  }, "\u2713 Opportunit\xE9 en ", current.spanco), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      marginLeft: 8
    }
  }, "\u2014 \xE9tape finale du pipeline atteinte.")), /*#__PURE__*/React.createElement("a", {
    href: clientId ? "/fiche-client?id=" + encodeURIComponent(clientId) : "/crm",
    style: {
      ...S.btnPrimaryBig,
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, "\u2190 Retour \xE0 la fiche client")) : targetIdx <= curIdx ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Marquer l'opportunité comme perdue ?",
        message: "L'opp passera à 0% de probabilité et restera dans l'historique.",
        okLabel: "Marquer perdu",
        okStyle: "danger"
      }) : confirm("Marquer comme perdu ?");
      if (ok) confirmAdvance(true);
    },
    style: S.btnLose
  }, "\u2715 Marquer comme perdu"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#64748b"
    }
  }, "S\xE9lectionnez une \xE9tape suivante dans le stepper ci-dessus pour faire avancer l'opportunit\xE9.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Marquer l'opportunité comme perdue ?",
        message: "L'opp passera à 0% de probabilité et restera dans l'historique.",
        okLabel: "Marquer perdu",
        okStyle: "danger"
      }) : confirm("Marquer comme perdu ?");
      if (ok) confirmAdvance(true);
    },
    style: S.btnLose
  }, "\u2715 Marquer comme perdu"), /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmAdvance(false),
    style: S.btnPrimaryBig
  }, "\u2713 Confirmer le passage en ", target.spanco, " \u2192"))));
};

// ─────────────────────────────────────────────────────────────────
// LinkedDocsCard — Carte latérale "Documents commerciaux liés"
// Affiche tous les devis/commandes/BL/factures liés à cette opportunité
// avec lien rapide d'ouverture dans /gestion-commerciale?open=
// ─────────────────────────────────────────────────────────────────
var LinkedDocsCard = ({
  oppRef
}) => {
  var [docs, setDocs] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!oppRef || !window.api || !window.api.commercialDocs) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        var list = await window.api.commercialDocs.list({
          opportunity_id: oppRef
        });
        setDocs(list || []);
      } catch (e) {
        setDocs([]);
      }
      setLoading(false);
    })();
  }, [oppRef]);
  var TYPE_META = {
    devis: {
      icon: "📄",
      label: "Devis",
      color: "#3b82f6"
    },
    commande: {
      icon: "📋",
      label: "Commande",
      color: "#a855f7"
    },
    bl: {
      icon: "🚚",
      label: "BL",
      color: "#ea580c"
    },
    facture: {
      icon: "💶",
      label: "Facture",
      color: "#10b981"
    }
  };
  var STATUS_LABEL = {
    brouillon: "Brouillon",
    envoye: "Envoyé",
    accepte: "Accepté",
    refuse: "Refusé",
    transforme: "Transformé",
    livre: "Livré",
    paye: "Payé",
    annule: "Annulé"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 16,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "\uD83D\uDCC1 Documents li\xE9s"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 7px",
      borderRadius: 999,
      background: "#eef2ff",
      color: "#3730a3",
      fontWeight: 600
    }
  }, docs.length)), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      textAlign: "center",
      padding: 8
    }
  }, "Chargement\u2026") : docs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      textAlign: "center",
      padding: 12,
      fontStyle: "italic"
    }
  }, "Aucun document commercial pour cette opportunit\xE9.", /*#__PURE__*/React.createElement("br", null), "Clique sur ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#b45309"
    }
  }, "\uD83D\uDCC4 Cr\xE9er un devis"), " en haut pour en g\xE9n\xE9rer un.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, docs.map(d => {
    var m = TYPE_META[d.type] || {
      icon: "📎",
      label: d.type,
      color: "#64748b"
    };
    var amt = d.total_ttc ? (Number(d.total_ttc) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " €" : "—";
    return /*#__PURE__*/React.createElement("a", {
      key: d.id,
      href: "/gestion-commerciale?open=" + encodeURIComponent(d.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 10px",
        borderRadius: 7,
        background: m.color + "10",
        border: "1px solid " + m.color + "40",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer"
      },
      title: "Ouvrir " + d.id + " dans la Gestion Commerciale"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, m.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#0f172a",
        fontVariantNumeric: "tabular-nums"
      }
    }, d.id), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, m.label, " \xB7 ", STATUS_LABEL[d.status] || d.status, " \xB7 ", amt)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: m.color,
        fontWeight: 700
      }
    }, "\u2192"));
  })));
};
var Metric = ({
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
    fontSize: 11.5,
    color: "rgba(255,255,255,0.7)",
    flex: 1
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 90,
    height: 4,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    overflow: "hidden"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: value + "%",
    height: "100%",
    background: color,
    borderRadius: 999
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#fff",
    width: 30,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums"
  }
}, value));
var S = {
  frame: {
    minHeight: "100vh",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    paddingBottom: 88
  },
  topbar: {
    padding: "12px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#94a3b8",
    fontSize: 18,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  titleRow: {
    padding: "20px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.6,
    margin: 0
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  btnGhost: {
    padding: "8px 16px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "9px 18px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(55,48,163,0.3)"
  },
  spancoStepper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 28px",
    background: "#fff",
    borderBottom: "1px solid #eef1f5",
    gap: 8
  },
  spancoStep: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    textAlign: "center"
  },
  spancoDot: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 180ms",
    zIndex: 1
  },
  spancoLine: {
    position: "absolute",
    top: 18,
    left: "calc(50% + 22px)",
    right: "calc(-50% + 22px)",
    height: 2,
    background: "#e2e8f0",
    zIndex: 0,
    pointerEvents: "none"
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 14,
    padding: "20px 28px"
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minWidth: 0
  },
  aside: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    position: "sticky",
    top: 20,
    alignSelf: "start"
  },
  card: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 18
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.2
  },
  h2sub: {
    fontSize: 11.5,
    color: "#64748b",
    margin: "3px 0 0"
  },
  badgeEdit: {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#fef3c7",
    color: "#a16207",
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box"
  },
  healthCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)",
    borderRadius: 12,
    padding: 18,
    color: "#fff"
  },
  forecastCard: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12,
    padding: 16
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "14px 28px",
    background: "#fff",
    borderTop: "1px solid #eef1f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
    zIndex: 100
  },
  btnLose: {
    padding: "10px 18px",
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnPrimaryBig: {
    padding: "12px 24px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(55,48,163,0.35)"
  }
};
window.AdvanceOpportunity = AdvanceOpportunity;