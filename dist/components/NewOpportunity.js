// Formulaire nouvelle opportunité — modal / écran de création

var NewOpportunity = () => {
  // ───── Recherche client (Supabase clients + prospects locaux)
  var [clientSearch, setClientSearch] = React.useState("");
  var [selectedClient, setSelectedClient] = React.useState(null);
  var [allClients, setAllClients] = React.useState([]);
  React.useEffect(() => {
    var local = (() => {
      try {
        return JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      } catch (e) {
        return [];
      }
    })();
    var fromLocal = local.map(p => ({
      id: p.id,
      name: p.raison_sociale || p.name,
      sector: p.secteur,
      city: p.ville,
      siren: p.siren,
      since: "Nouveau prospect",
      source: "local"
    }));
    var finishLoad = clients => {
      setAllClients(clients);
      // Pré-sélection via ?client=… (depuis fiche client → bouton + Nouvelle opportunité)
      var urlClientId = new URLSearchParams(window.location.search).get("client");
      if (urlClientId) {
        var hit = clients.find(c => c.id === urlClientId);
        if (hit) setSelectedClient(hit);
      }
    };
    if (window.HubData && window.HubData.enabled()) {
      window.HubData.fetchClients().then(({
        data
      }) => {
        var fromSupa = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          sector: c.industry,
          city: c.city,
          since: c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric"
          })}` : "Client",
          source: "supabase"
        }));
        var seen = new Set();
        finishLoad([...fromLocal, ...fromSupa].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true)));
      });
    } else {
      finishLoad(fromLocal);
    }
  }, []);
  var q = clientSearch.trim().toLowerCase();
  var matches = q ? allClients.filter(c => [c.name, c.sector, c.city, c.siren].some(v => String(v || "").toLowerCase().includes(q))).slice(0, 8) : allClients.slice(0, 5);
  var [oppName, setOppName] = React.useState("");
  var [oppAmount, setOppAmount] = React.useState("");
  var [oppDate, setOppDate] = React.useState("");
  var [oppNotes, setOppNotes] = React.useState("");
  var [oppType, setOppType] = React.useState("new"); // new | extension | renewal | upsell
  var [oppProduit, setOppProduit] = React.useState("Astorya Suite");
  var [oppModules, setOppModules] = React.useState([]); // ["Cyber", "Hub", ...]
  var [oppSource, setOppSource] = React.useState("Référence client existant");
  var [oppDuration, setOppDuration] = React.useState("3 ans");
  var [oppStage, setOppStage] = React.useState("qualif");
  var [flash, setFlash] = React.useState(null);

  // Résolution du dossier prospect complet (pour récupérer contact_principal + contacts_additionnels)
  var fullProspect = React.useMemo(() => {
    if (!selectedClient) return null;
    try {
      var local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      return local.find(p => p.id === selectedClient.id) || null;
    } catch (e) {
      return null;
    }
  }, [selectedClient]);

  // Probabilité auto selon étape
  var stageProba = {
    qualif: 20,
    discovery: 35,
    propo: 55,
    nego: 75,
    won: 100
  };
  var proba = stageProba[oppStage] || 20;

  // Toggle module
  var toggleModule = m => setOppModules(arr => arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m]);
  var showFlash = (m, tone = "ok") => {
    setFlash({
      m,
      tone
    });
    setTimeout(() => setFlash(null), 2800);
  };
  var createOpp = () => {
    if (!selectedClient) {
      showFlash("Sélectionnez d'abord un client", "err");
      return;
    }
    if (!oppName.trim()) {
      showFlash("Nom de l'opportunité obligatoire", "err");
      return;
    }
    var ref = "OPP-" + Math.floor(Math.random() * 9000 + 1000);
    var opp = {
      id: ref,
      ref,
      client_id: selectedClient.id,
      client_name: selectedClient.name,
      name: oppName,
      amount: oppAmount,
      target_date: oppDate,
      close: oppDate ? new Date(oppDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }) : "",
      notes: oppNotes,
      type: oppType,
      produit: oppProduit,
      modules: oppModules,
      source: oppSource,
      duration: oppDuration,
      stage: oppStage,
      proba,
      owner: "Vous",
      created_at: new Date().toISOString()
    };
    try {
      var existing = JSON.parse(localStorage.getItem("hubAstorya.opportunities.v1") || "[]");
      existing.unshift(opp);
      localStorage.setItem("hubAstorya.opportunities.v1", JSON.stringify(existing));
    } catch (e) {}
    showFlash("✓ Opportunité créée — redirection…");
    setTimeout(() => {
      window.location.href = selectedClient && selectedClient.id ? "/fiche-client?id=" + encodeURIComponent(selectedClient.id) : "/crm";
    }, 900);
  };
  var Avatar = ({
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
      E: "#0ea5e9"
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

  // Faded background context (showing pipeline behind modal)
  return /*#__PURE__*/React.createElement("div", {
    style: noStyles.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.behind
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindSidebar
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindMain
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindBar
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindKpis
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: noStyles.behindKpi
  }))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindKanban
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: noStyles.behindCol
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindColHead
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindCard
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindCard
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.behindCard
  })))))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.overlay
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.modal
  }, /*#__PURE__*/React.createElement("header", {
    style: noStyles.modalHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.modalIcon
  }, "+"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 4,
      background: "#0f172a",
      color: "#fff",
      fontWeight: 700,
      letterSpacing: 0.4
    }
  }, "BROUILLON"), /*#__PURE__*/React.createElement("span", {
    style: noStyles.refMono
  }, "OPP-2868"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#10b981",
      fontWeight: 500
    }
  }, "\u25CF Auto-save \xB7 il y a 8 sec")), /*#__PURE__*/React.createElement("h1", {
    style: noStyles.h1
  }, "Nouvelle opportunit\xE9"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: noStyles.iconBtn,
    title: "Plein \xE9cran"
  }, "\u2922"), /*#__PURE__*/React.createElement("button", {
    style: noStyles.iconBtn,
    title: "Fermer"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.stepper
  }, [{
    n: 1,
    label: "Compte & contact",
    done: true
  }, {
    n: 2,
    label: "Opportunité",
    active: true
  }, {
    n: 3,
    label: "Produits & pricing"
  }, {
    n: 4,
    label: "Récap & création"
  }].map((s, i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s.n
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.stepItem
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...noStyles.stepDot,
      background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
      border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
      color: s.done || s.active ? "#fff" : "#94a3b8"
    }
  }, s.done ? "✓" : s.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: s.active ? 700 : 500,
      color: s.done ? "#10b981" : s.active ? "#0f172a" : "#94a3b8"
    }
  }, s.label)), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...noStyles.stepLine,
      background: s.done ? "#10b981" : "#eef1f5"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.bodyGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.formCol
  }, /*#__PURE__*/React.createElement("section", {
    style: noStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "01",
    title: "Compte & demandeur",
    subtitle: "Li\xE9 \xE0 un compte existant",
    required: true,
    done: true
  }), /*#__PURE__*/React.createElement(FormRow, {
    label: "Compte",
    required: true,
    subtitle: "Cherchez parmi vos clients et prospects existants"
  }, selectedClient ? /*#__PURE__*/React.createElement("div", {
    style: noStyles.linkedCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "#1e40af",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700
    }
  }, (selectedClient.name || "").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, selectedClient.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, selectedClient.sector || "Secteur ?", selectedClient.city && ` · 📍 ${selectedClient.city}`, " \xB7 ", selectedClient.since)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelectedClient(null);
      setClientSearch("");
    },
    style: noStyles.changeBtn
  }, "Changer")) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      fontSize: 14
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: clientSearch,
    onChange: e => setClientSearch(e.target.value),
    autoFocus: true,
    placeholder: "Rechercher un client par nom, ville, secteur, SIREN\u2026",
    style: {
      ...noStyles.input,
      paddingLeft: 36
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      maxHeight: 280,
      overflowY: "auto",
      boxShadow: "0 4px 12px rgba(0,0,0,.04)"
    }
  }, matches.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px",
      fontSize: 12.5,
      color: "#94a3b8",
      textAlign: "center"
    }
  }, clientSearch.trim() ? "Aucun client trouvé. " : "Tapez pour rechercher dans la base. ", /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      color: "#3730a3",
      fontWeight: 600,
      textDecoration: "none"
    }
  }, "+ Cr\xE9er un nouveau prospect \u2192")), matches.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    onClick: () => {
      setSelectedClient(c);
      setClientSearch("");
    },
    style: {
      padding: "10px 12px",
      borderBottom: "1px solid #f1f5f9",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: c.source === "local" ? "#fef3c7" : "#dcfce7",
      color: c.source === "local" ? "#78350f" : "#065f46",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 700,
      flexShrink: 0
    }
  }, (c.name || "?").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, c.sector || "—", c.city && ` · ${c.city}`, c.siren && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, c.siren))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 999,
      fontWeight: 700,
      background: c.source === "local" ? "#fef3c7" : "#eef2ff",
      color: c.source === "local" ? "#78350f" : "#3730a3",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      flexShrink: 0
    }
  }, c.source === "local" ? "Nouveau" : "Client")))))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Contact principal",
    required: true
  }, (() => {
    var cp = fullProspect && fullProspect.contact_principal;
    var fullName = cp ? ((cp.prenom || "") + " " + (cp.nom || "")).trim() : "";
    if (!fullName && !(cp && cp.email)) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          ...noStyles.linkedCardMini,
          color: "#94a3b8",
          fontStyle: "italic"
        }
      }, "Aucun contact principal renseign\xE9 pour ce client");
    }
    var champion = Array.isArray(fullProspect.roles) && fullProspect.roles.includes("Champion");
    return /*#__PURE__*/React.createElement("div", {
      style: noStyles.linkedCardMini
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: fullName || cp.email,
      size: 24,
      color: "#a855f7"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, fullName || cp.email, champion && /*#__PURE__*/React.createElement("span", {
      style: noStyles.championPill
    }, "\u2605 Champion")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, cp.fonction || "—", cp.email ? ` · ${cp.email}` : "")));
  })()), /*#__PURE__*/React.createElement(FormRow, {
    label: "Co-contacts",
    subtitle: "D\xE9cideurs suppl\xE9mentaires identifi\xE9s \xE0 la cr\xE9ation du prospect"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, (() => {
    var add = fullProspect && fullProspect.contacts_additionnels || [];
    if (!add.length) return /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#94a3b8",
        fontStyle: "italic"
      }
    }, "Aucun co-contact");
    var colors = ["#dc2626", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"];
    return add.map((x, i) => {
      var n = ((x.prenom || "") + " " + (x.nom || "")).trim() || x.email || "Contact";
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: noStyles.contactChip
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: n,
        size: 18,
        color: colors[i % colors.length]
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11.5,
          fontWeight: 500
        }
      }, n));
    });
  })()))), /*#__PURE__*/React.createElement("section", {
    style: noStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "02",
    title: "D\xE9tails opportunit\xE9",
    subtitle: "D\xE9crivez la nature et le contexte",
    required: true,
    active: true
  }), /*#__PURE__*/React.createElement(FormRow, {
    label: "Nom de l'opportunit\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: noStyles.input,
    value: oppName,
    onChange: e => setOppName(e.target.value),
    placeholder: "Ex : D\xE9ploiement Astorya Suite \u2014 500 si\xE8ges"
  }), oppName.trim() && /*#__PURE__*/React.createElement("div", {
    style: {
      ...noStyles.inputHelp,
      color: "#10b981"
    }
  }, "\u2713 Nom unique v\xE9rifi\xE9")), /*#__PURE__*/React.createElement("div", {
    style: noStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Produit principal",
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    value: oppProduit,
    onChange: e => setOppProduit(e.target.value),
    style: {
      ...noStyles.input,
      padding: "8px 12px"
    }
  }, /*#__PURE__*/React.createElement("option", null, "Astorya Suite"), /*#__PURE__*/React.createElement("option", null, "Astorya Cyber"), /*#__PURE__*/React.createElement("option", null, "Astorya Hub"), /*#__PURE__*/React.createElement("option", null, "Astorya Analytics"), /*#__PURE__*/React.createElement("option", null, "Astorya Mobile"), /*#__PURE__*/React.createElement("option", null, "Prestation sur mesure"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Modules compl\xE9mentaires"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Cyber", "Hub", "Analytics", "Mobile"].map(m => {
    var on = oppModules.includes(m);
    return /*#__PURE__*/React.createElement("button", {
      key: m,
      onClick: () => toggleModule(m),
      style: {
        ...noStyles.toggleChip,
        ...(on ? noStyles.toggleChipOn : {}),
        cursor: "pointer"
      }
    }, on ? "✓ " : "+ ", m);
  })))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Type d'opportunit\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.radioGroup
  }, [{
    k: "new",
    label: "Nouveau client"
  }, {
    k: "extension",
    label: "Extension"
  }, {
    k: "renewal",
    label: "Renouvellement"
  }, {
    k: "upsell",
    label: "Up-sell"
  }].map(t => /*#__PURE__*/React.createElement("label", {
    key: t.k,
    onClick: () => setOppType(t.k),
    style: {
      ...noStyles.radio,
      ...(oppType === t.k ? noStyles.radioOn : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "type",
    checked: oppType === t.k,
    onChange: () => setOppType(t.k)
  }), " ", /*#__PURE__*/React.createElement("span", null, t.label))))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Source",
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    value: oppSource,
    onChange: e => setOppSource(e.target.value),
    style: {
      ...noStyles.input,
      padding: "8px 12px"
    }
  }, /*#__PURE__*/React.createElement("option", null, "R\xE9f\xE9rence client existant"), /*#__PURE__*/React.createElement("option", null, "Cold outbound"), /*#__PURE__*/React.createElement("option", null, "Inbound site web"), /*#__PURE__*/React.createElement("option", null, "Salon professionnel"), /*#__PURE__*/React.createElement("option", null, "Partenaire revendeur"), /*#__PURE__*/React.createElement("option", null, "Renouvellement automatique"), /*#__PURE__*/React.createElement("option", null, "R\xE9seau personnel"), /*#__PURE__*/React.createElement("option", null, "Autre")))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Description & contexte",
    subtitle: "Quel est le besoin ? Quel d\xE9clencheur ?"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: noStyles.textarea,
    rows: "3",
    value: oppNotes,
    onChange: e => setOppNotes(e.target.value),
    placeholder: "Contexte du besoin, d\xE9clencheur, points cl\xE9s\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Markdown support\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, oppNotes.length, " / 2 000")))), /*#__PURE__*/React.createElement("section", {
    style: noStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "03",
    title: "Montant & timing",
    subtitle: "Indicateurs financiers et calendaires",
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Montant estim\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.inputWithSuffix
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...noStyles.input,
      border: "none",
      padding: "0 4px",
      fontSize: 18,
      fontWeight: 600
    },
    value: oppAmount,
    onChange: e => setOppAmount(e.target.value),
    placeholder: "0"
  }), /*#__PURE__*/React.createElement("span", {
    style: noStyles.suffix
  }, "\u20AC / an")), /*#__PURE__*/React.createElement("div", {
    style: noStyles.inputHelp
  }, "R\xE9current annuel HT")), /*#__PURE__*/React.createElement(FormRow, {
    label: "Dur\xE9e contrat"
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.segCtrl
  }, ["1 an", "3 ans", "5 ans", "Custom"].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => setOppDuration(d),
    style: {
      ...noStyles.segBtn,
      ...(oppDuration === d ? noStyles.segBtnActive : {}),
      cursor: "pointer"
    }
  }, d))), (() => {
    var amtN = parseFloat(String(oppAmount).replace(/[^\d.]/g, "")) || 0;
    var years = oppDuration === "1 an" ? 1 : oppDuration === "3 ans" ? 3 : oppDuration === "5 ans" ? 5 : 0;
    if (!amtN || !years) return null;
    var tcv = amtN * years;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...noStyles.inputHelp,
        color: "#0f172a",
        fontWeight: 600,
        marginTop: 6
      }
    }, "TCV : ", tcv.toLocaleString("fr-FR").replace(/,/g, " "), " \u20AC sur ", oppDuration);
  })())), /*#__PURE__*/React.createElement(FormRow, {
    label: "\xC9tape pipeline",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.pipelineSelector
  }, [{
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
    label: "Gagné",
    color: "#10b981",
    proba: 100
  }].map(s => {
    var active = oppStage === s.k;
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      onClick: () => setOppStage(s.k),
      style: {
        ...noStyles.pipeStep,
        ...(active ? noStyles.pipeStepActive : {}),
        borderColor: active ? s.color : "transparent",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: s.color,
        marginRight: 6
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        color: active ? "#0f172a" : "#64748b"
      }
    }, s.label), active && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: s.color,
        fontWeight: 700,
        marginLeft: 6,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, s.proba, "%"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Probabilit\xE9 de gain"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: "relative",
      height: 6,
      background: "#eef1f5",
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      height: "100%",
      width: proba + "%",
      background: stageProba[oppStage] >= 75 ? "#10b981" : "#a855f7",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
      width: 44,
      textAlign: "right",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, proba, "%")), /*#__PURE__*/React.createElement("div", {
    style: noStyles.inputHelp
  }, "Auto-rempli depuis l'\xE9tape")), /*#__PURE__*/React.createElement(FormRow, {
    label: "Date de cl\xF4ture cible",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.dateInput
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    style: {
      ...noStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace"
    },
    value: oppDate,
    onChange: e => setOppDate(e.target.value)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: noStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "04",
    title: "\xC9quipe & concurrence",
    subtitle: "Commercial attribu\xE9 et environnement comp\xE9titif"
  }), /*#__PURE__*/React.createElement("div", {
    style: noStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Commercial",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.linkedCardMini
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Nadia Lef\xE8vre",
    size: 24,
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Nadia Lef\xE8vre"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "AE Senior \xB7 EMEA")), /*#__PURE__*/React.createElement("button", {
    style: noStyles.changeBtn
  }, "Changer"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Co-owner"
  }, /*#__PURE__*/React.createElement("button", {
    style: noStyles.addBtn
  }, "+ Ajouter un co-owner"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Concurrents identifi\xE9s",
    subtitle: "Solutions actuelles ou pressenties chez le prospect"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...noStyles.compChip,
      background: "#e0f4fc",
      borderColor: "#00A1E0",
      color: "#00A1E0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      padding: "1px 4px",
      background: "#00A1E0",
      color: "#fff",
      borderRadius: 3
    }
  }, "SF"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "Salesforce"), /*#__PURE__*/React.createElement("span", {
    style: noStyles.removeChip
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...noStyles.compChip,
      background: "#fdecec",
      borderColor: "#dc2626",
      color: "#dc2626"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      padding: "1px 4px",
      background: "#dc2626",
      color: "#fff",
      borderRadius: 3
    }
  }, "GW"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "Guidewire"), /*#__PURE__*/React.createElement("span", {
    style: noStyles.removeChip
  }, "\xD7")), /*#__PURE__*/React.createElement("button", {
    style: noStyles.addChip
  }, "+ Ajouter"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "\xC9tiquettes"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: noStyles.tag
  }, "# Extension"), /*#__PURE__*/React.createElement("span", {
    style: noStyles.tag
  }, "# BENELUX"), /*#__PURE__*/React.createElement("span", {
    style: noStyles.tag
  }, "# Q3 2026"), /*#__PURE__*/React.createElement("button", {
    style: noStyles.addChip
  }, "+")))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.actionsRow
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.location.href = "/crm";
    },
    style: noStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: createOpp,
    style: noStyles.ghostBtn
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    onClick: createOpp,
    style: noStyles.primaryBtn
  }, "Cr\xE9er l'opportunit\xE9 \u2192"))), flash && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 18px",
      borderRadius: 8,
      background: flash.tone === "err" ? "#dc2626" : "#10b981",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
      zIndex: 10000
    }
  }, flash.m)), /*#__PURE__*/React.createElement("aside", {
    style: noStyles.previewCol
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.previewSticky
  }, /*#__PURE__*/React.createElement("div", {
    style: noStyles.previewHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase"
    }
  }, "Aper\xE7u temps r\xE9el"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#10b981",
      color: "#fff",
      fontWeight: 700,
      letterSpacing: 0.4
    }
  }, "\u25CF LIVE")), /*#__PURE__*/React.createElement("div", {
    style: noStyles.previewCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: "#1e40af",
      color: "#fff",
      fontSize: 10.5,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, (selectedClient && selectedClient.name || "??").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      lineHeight: 1.3
    }
  }, selectedClient && selectedClient.name || "Sélectionnez un client…"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 4,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      padding: "1px 5px",
      borderRadius: 3,
      background: "#f5efff",
      color: "#7e22ce",
      fontWeight: 700
    }
  }, oppProduit.replace(/^Astorya\s+/, "")), oppModules.map(m => /*#__PURE__*/React.createElement("span", {
    key: m,
    style: {
      fontSize: 9.5,
      padding: "1px 5px",
      borderRadius: 3,
      background: "#fdecec",
      color: "#dc2626",
      fontWeight: 700
    }
  }, m))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginTop: 8,
      color: "#0f172a",
      letterSpacing: -0.3
    }
  }, oppAmount ? String(oppAmount).replace(/[^\d.\s]/g, "").trim() + " € / an" : "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#475569",
      marginTop: 2,
      lineHeight: 1.3
    }
  }, oppName || "Nom de l'opportunité…"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontWeight: 600
    }
  }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#0f172a",
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, proba, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: 3,
      background: "#eef1f5",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: proba + "%",
      height: "100%",
      background: proba >= 75 ? "#10b981" : proba >= 55 ? "#a855f7" : proba >= 35 ? "#3b82f6" : "#94a3b8",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 8,
      borderTop: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Vous",
    size: 18,
    color: "#3730a3"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, oppDate ? new Date(oppDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "Date à définir"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 10,
      textAlign: "center"
    }
  }, "\u2191 Aper\xE7u en colonne ", /*#__PURE__*/React.createElement("strong", null, {
    qualif: "Qualification",
    discovery: "Discovery",
    propo: "Proposition",
    nego: "Négociation",
    won: "Gagné"
  }[oppStage]))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.aiPanel
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: "#0f172a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Suggestions Hub Assistant")), /*#__PURE__*/React.createElement("div", {
    style: noStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: noStyles.aiItemIcon
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Montant estim\xE9 : 92 k\u20AC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "Bas\xE9 sur 3 deals similaires (extension Suite \xB7 200-300 si\xE8ges) \u2014 moyenne 87 k\u20AC et m\xE9diane 91 k\u20AC."), /*#__PURE__*/React.createElement("button", {
    style: noStyles.aiAccept
  }, "Accepter le montant"))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: noStyles.aiItemIcon
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Cycle attendu : 115 jours"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "Date de cl\xF4ture probable : ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#0f172a"
    }
  }, "18 sept. 2026"), ". Vous avez saisi le 15."))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: noStyles.aiItemIcon
  }, "\u26A0"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Concurrent Pega d\xE9tect\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "3 deals AXA pr\xE9c\xE9dents ont mentionn\xE9 Pega. Le voulez-vous dans la liste ?"), /*#__PURE__*/React.createElement("button", {
    style: noStyles.aiAccept
  }, "Ajouter Pega"))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.aiItem
  }, /*#__PURE__*/React.createElement("span", {
    style: noStyles.aiItemIcon
  }, "\uD83D\uDC65"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Champion \xE0 activer"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "\xC9milie Roux est marqu\xE9e Champion sur le compte. Sugg\xE9r\xE9e comme contact principal."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#10b981",
      marginTop: 4,
      fontWeight: 600
    }
  }, "\u2713 D\xE9j\xE0 s\xE9lectionn\xE9e")))), /*#__PURE__*/React.createElement("div", {
    style: noStyles.checklist
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10
    }
  }, "Compl\xE9tion du brouillon"), /*#__PURE__*/React.createElement(ChecklistRow, {
    done: true,
    label: "Compte renseign\xE9"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    done: true,
    label: "Contact principal"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    done: true,
    label: "Nom & description"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    done: true,
    label: "Montant & dur\xE9e"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    done: true,
    label: "Date de cl\xF4ture"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    active: true,
    label: "Commercial & \xE9quipe"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    label: "Produits & pricing d\xE9taill\xE9"
  }), /*#__PURE__*/React.createElement(ChecklistRow, {
    label: "Validation finale"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Compl\xE9t\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "6 / 8")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: "#eef1f5",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "75%",
      height: "100%",
      background: "#4f46e5",
      borderRadius: 999
    }
  })))))))));
};

// ───── helpers
var SectionHead = ({
  num,
  title,
  subtitle,
  required,
  done,
  active
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid #eef1f5"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: done ? "#e8f8f1" : active ? "#eef2ff" : "#fafbfc",
    color: done ? "#0e7a55" : active ? "#4f46e5" : "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0
  }
}, done ? "✓" : num), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 6
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  }
}, title), required && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#fdecec",
    color: "#dc2626",
    fontWeight: 700
  }
}, "REQUIS")), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 2
  }
}, subtitle)));
var FormRow = ({
  label,
  subtitle,
  required,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 14
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 6
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a"
  }
}, label), required && /*#__PURE__*/React.createElement("span", {
  style: {
    color: "#dc2626",
    fontWeight: 700
  }
}, "*"), subtitle && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 4
  }
}, subtitle)), children);
var ChecklistRow = ({
  done,
  active,
  label
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 0"
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 16,
    height: 16,
    borderRadius: 4,
    background: done ? "#10b981" : active ? "#fff" : "#fff",
    border: done ? "none" : active ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    flexShrink: 0
  }
}, done ? "✓" : active ? /*#__PURE__*/React.createElement("span", {
  style: {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: "#4f46e5"
  }
}) : ""), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 12,
    color: done ? "#94a3b8" : active ? "#0f172a" : "#64748b",
    fontWeight: active ? 600 : 500,
    textDecoration: done ? "line-through" : "none"
  }
}, label));
var noStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    position: "relative",
    background: "#0f172a",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  // Faded behind
  behind: {
    position: "absolute",
    inset: 0,
    display: "flex",
    background: "#fafbfc",
    opacity: 0.55,
    filter: "blur(0.5px)"
  },
  behindSidebar: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #eef1f5"
  },
  behindMain: {
    flex: 1,
    padding: 24
  },
  behindBar: {
    height: 48,
    background: "#fff",
    borderRadius: 6,
    marginBottom: 18
  },
  behindKpis: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    marginBottom: 18
  },
  behindKpi: {
    height: 80,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #eef1f5"
  },
  behindKanban: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12
  },
  behindCol: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 10,
    background: "#f1f3f6",
    borderRadius: 10
  },
  behindColHead: {
    height: 24,
    background: "#fff",
    borderRadius: 4
  },
  behindCard: {
    height: 110,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #eef1f5"
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)"
  },
  // Modal
  modal: {
    position: "absolute",
    top: 40,
    left: "50%",
    transform: "translateX(-50%)",
    width: 1180,
    maxHeight: 1620,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 24px 64px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid #eef1f5"
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700
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
  h1: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.6,
    margin: "3px 0 0",
    color: "#0f172a"
  },
  iconBtn: {
    width: 32,
    height: 32,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  // Stepper
  stepper: {
    display: "flex",
    alignItems: "center",
    padding: "14px 24px",
    borderBottom: "1px solid #eef1f5",
    background: "#fafbfc",
    gap: 8
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    maxWidth: 120
  },
  // Body
  body: {
    flex: 1,
    overflowY: "auto"
  },
  bodyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    minHeight: "100%"
  },
  formCol: {
    padding: "20px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  section: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box"
  },
  inputHelp: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4
  },
  inputWithSuffix: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 12px",
    background: "#fff"
  },
  suffix: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500,
    paddingLeft: 8,
    borderLeft: "1px solid #eef1f5",
    marginLeft: 4
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
    resize: "none",
    lineHeight: 1.5,
    boxSizing: "border-box"
  },
  select: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    background: "#fff",
    cursor: "pointer"
  },
  dateInput: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff"
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14
  },
  radioGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap"
  },
  radio: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer",
    background: "#fff"
  },
  radioOn: {
    background: "#eef2ff",
    borderColor: "#4f46e5",
    color: "#3730a3",
    fontWeight: 600
  },
  toggleChip: {
    padding: "5px 10px",
    border: "1px dashed #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    fontSize: 11.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  toggleChipOn: {
    border: "1px solid #4f46e5",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
    borderStyle: "solid"
  },
  segCtrl: {
    display: "inline-flex",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 2,
    background: "#fff"
  },
  segBtn: {
    padding: "6px 14px",
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
    color: "#fff",
    fontWeight: 600
  },
  pipelineSelector: {
    display: "flex",
    gap: 4,
    padding: 4,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  pipeStep: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 6px",
    borderRadius: 6,
    cursor: "pointer",
    border: "1.5px solid transparent"
  },
  pipeStepActive: {
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  linkedCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  linkedCardMini: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  changeBtn: {
    padding: "3px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  championPill: {
    fontSize: 9,
    padding: "0 5px",
    borderRadius: 3,
    background: "#fffbeb",
    color: "#a65f00",
    fontWeight: 700,
    border: "1px solid #fde68a",
    marginLeft: 4
  },
  contactChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999
  },
  compChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 10px",
    border: "1px solid",
    borderRadius: 6,
    fontSize: 11.5
  },
  removeChip: {
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 13,
    lineHeight: 1
  },
  addChip: {
    padding: "3px 10px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 999,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  addBtn: {
    width: "100%",
    padding: "10px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 8,
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  tag: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    color: "#475569",
    fontWeight: 500
  },
  // Actions row
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0 0",
    borderTop: "1px solid #eef1f5"
  },
  ghostBtn: {
    padding: "8px 14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  primaryBtn: {
    padding: "8px 18px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  // Preview column
  previewCol: {
    padding: "20px 24px 24px",
    background: "#fafbfc",
    borderLeft: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  previewSticky: {
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  previewHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  previewCard: {
    padding: 12,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(15,23,42,0.06)"
  },
  aiPanel: {
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
  aiItemIcon: {
    fontSize: 16,
    flexShrink: 0,
    width: 22,
    textAlign: "center"
  },
  aiAccept: {
    padding: "3px 9px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    marginTop: 6
  },
  checklist: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  }
};
window.NewOpportunity = NewOpportunity;