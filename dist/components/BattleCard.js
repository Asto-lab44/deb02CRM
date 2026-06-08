// Battle card concurrent — Salesforce

var BattleCard = () => {
  var Avatar = ({
    name,
    size = 22,
    color
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      K: "#6366f1",
      N: "#a855f7",
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
  return /*#__PURE__*/React.createElement("div", {
    style: bcStyles.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.hero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.logo
  }, "SF"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.badge
  }, "Concurrent #1"), /*#__PURE__*/React.createElement("span", {
    style: bcStyles.badgeSecondary
  }, "Threat level: \xE9lev\xE9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Mise \xE0 jour il y a 4 j par Claire Renaud")), /*#__PURE__*/React.createElement("h1", {
    style: bcStyles.h1
  }, "Salesforce"), /*#__PURE__*/React.createElement("p", {
    style: bcStyles.subtitle
  }, "Sales Cloud, Service Cloud, Financial Services Cloud \u2014 leader US implant\xE9 en France depuis 2008"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.tag
  }, "# SaaS"), /*#__PURE__*/React.createElement("span", {
    style: bcStyles.tag
  }, "# Plateforme"), /*#__PURE__*/React.createElement("span", {
    style: bcStyles.tag
  }, "# US-based"), /*#__PURE__*/React.createElement("span", {
    style: bcStyles.tag
  }, "# CRM legacy"))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.statRow
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.statK
  }, "Rencontres 12 mois"), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.statV
  }, "34")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.statK
  }, "Win rate Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.statV,
      color: "#10b981"
    }
  }, "48%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#10b981",
      marginTop: 2
    }
  }, "\u2191 +6 pts vs Q1")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.stat
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.statK
  }, "Deals en cours"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.statV,
      color: "#4f46e5"
    }
  }, "7"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "412 k\u20AC pipe"))))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.grid2
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.panel,
      borderColor: "#fecaca"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panelHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.panelIcon,
      background: "#fdecec",
      color: "#dc2626"
    }
  }, "\u26A0"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3
  }, "L\xE0 o\xF9 ils gagnent"), /*#__PURE__*/React.createElement("p", {
    style: bcStyles.h3sub
  }, "Forces reconnues du concurrent \u2014 \xE0 ne pas attaquer frontalement"))), /*#__PURE__*/React.createElement("ul", {
    style: bcStyles.bulletList
  }, /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Notori\xE9t\xE9 & rassurance grands comptes."), " Choix par d\xE9faut c\xF4t\xE9 DSI, peu de risque carri\xE8re."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "\xC9cosyst\xE8me AppExchange."), " +7 000 apps tierces int\xE9gr\xE9es."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Recrutement."), " March\xE9 abondant en consultants Salesforce certifi\xE9s."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Industrie cloud financi\xE8re."), " Financial Services Cloud bien \xE9tabli sur banque retail."))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.panel,
      borderColor: "#bbf7d0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panelHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.panelIcon,
      background: "#e8f8f1",
      color: "#0e7a55"
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3
  }, "L\xE0 o\xF9 nous gagnons"), /*#__PURE__*/React.createElement("p", {
    style: bcStyles.h3sub
  }, "Nos vrais diff\xE9renciants face \xE0 Salesforce"))), /*#__PURE__*/React.createElement("ul", {
    style: bcStyles.bulletList
  }, /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Souverainet\xE9 & h\xE9bergement UE."), " Datacenter France, conformit\xE9 DORA native (vs FedRAMP US)."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Time-to-value 3 mois"), " vs 9-12 mois Salesforce (impl\xE9mentation native vs custom)."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "TCO 40 % inf\xE9rieur"), " sur 3 ans \u2014 pas de licences add-on cach\xE9es (CPQ, Marketing Cloud, etc.)."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Sp\xE9cialisation assurance & gestion d'actifs"), " \u2014 mod\xE8le m\xE9tier pr\xEAt \xE0 l'emploi."), /*#__PURE__*/React.createElement("li", {
    style: bcStyles.bullet
  }, /*#__PURE__*/React.createElement("strong", null, "Support FR niveau 1 inclus"), " vs offshore payant chez SF.")))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panelHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.panelIcon,
      background: "#eef2ff",
      color: "#4f46e5"
    }
  }, "\u2694"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3
  }, "Objections fr\xE9quentes & reformulations"), /*#__PURE__*/React.createElement("p", {
    style: bcStyles.h3sub
  }, "R\xE9ponses valid\xE9es \xE9quipe \xE0 utiliser en RDV")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var obj = prompt("Nouvelle objection client :");
      if (!obj || !obj.trim()) return;
      var ans = prompt("Réponse validée à donner :");
      if (!ans || !ans.trim()) return;
      // Stocke en localStorage pour l'instant (objections par battlecard)
      try {
        var key = "hubAstorya.battlecard.objections.v1";
        var arr = JSON.parse(localStorage.getItem(key) || "[]");
        arr.push({
          obj: obj.trim(),
          ans: ans.trim(),
          at: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(arr));
        alert("✓ Objection ajoutée (sauvée localement)");
        window.location.reload();
      } catch (e) {
        alert("Erreur : " + e.message);
      }
    },
    style: {
      ...bcStyles.smBtn,
      cursor: "pointer"
    }
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.objList
  }, [{
    q: "« On a déjà Salesforce, pourquoi changer ? »",
    a: "Nous remplaçons rarement Salesforce — nous remplaçons les modules verticaux mal-adaptés (Financial Services Cloud). Côté CRM transactionnel, intégration native via API. La plupart de nos clients gardent SF en commercial et basculent sur Astorya pour la gestion métier.",
    tone: "neutral"
  }, {
    q: "« Le marché entier est sur Salesforce »",
    a: "Sur l'asset management européen, 38 % seulement sont sur SF — le reste est sur des suites métier ou du custom. Notre cible n'est pas la moyenne du marché mais les acteurs qui veulent un outil dédié et conforme DORA.",
    tone: "positive"
  }, {
    q: "« Et l'écosystème AppExchange ? »",
    a: "AppExchange est un atout pour les besoins génériques mais devient un piège métier (apps non maintenues, dépendances). Astorya intègre nativement les 12 systèmes-clés assurance (PER, contrats, sinistres, KYC). À comparer avec une simulation : 4 apps SF à 18-32 k€/an chacune.",
    tone: "positive"
  }, {
    q: "« Salesforce est moins cher en première année »",
    a: "Comparer le TCO sur 3 ans avec Marketing Cloud, CPQ, Pardot, Data Cloud : la facture explose. Notre offre est tout-inclus.",
    tone: "neutral"
  }].map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: bcStyles.obj
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.objQ
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#dc2626",
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0
    }
  }, "SF \u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#0f172a",
      fontWeight: 600,
      fontStyle: "italic"
    }
  }, o.q)), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.objA
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4f46e5",
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0
    }
  }, "HUB \u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "#475569",
      lineHeight: 1.55
    }
  }, o.a)))))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.grid3
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panel
  }, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3sm
  }, "Pricing compar\xE9 (250 utilisateurs \xB7 3 ans)"), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceTable
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceRow
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.priceK
  }, "Licences ann\xE9e 1"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#dc2626"
    }
  }, "SF : 268 k\u20AC"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#10b981"
    }
  }, "HUB : 168 k\u20AC")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceRow
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.priceK
  }, "Add-ons (CPQ, marketing)"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#dc2626"
    }
  }, "+ 142 k\u20AC"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#10b981"
    }
  }, "0 \u20AC")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceRow
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.priceK
  }, "Impl\xE9mentation"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#dc2626"
    }
  }, "180 k\u20AC"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#10b981"
    }
  }, "62 k\u20AC")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceRow
  }, /*#__PURE__*/React.createElement("span", {
    style: bcStyles.priceK
  }, "Support premium"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#dc2626"
    }
  }, "22 k\u20AC/an"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#10b981"
    }
  }, "inclus")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.priceRow,
      ...bcStyles.priceRowTotal
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceK,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "TCO 3 ans"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#dc2626",
      fontWeight: 700
    }
  }, "1,15 M\u20AC"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.priceVal,
      color: "#0e7a55",
      fontWeight: 700
    }
  }, "688 k\u20AC"))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.priceBadge
  }, "\xC9conomie HUB : ", /*#__PURE__*/React.createElement("strong", null, "\u2013 40 %"))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panel
  }, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3sm
  }, "Win / Loss 12 derniers mois"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#10b981",
      letterSpacing: -0.6
    }
  }, "11"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "uppercase"
    }
  }, "Wins")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#dc2626",
      letterSpacing: -0.6
    }
  }, "12"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "uppercase"
    }
  }, "Losses")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "48%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "win rate"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      display: "flex",
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 11,
      background: "#10b981"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 12,
      background: "#fecaca"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6
    }
  }, "Raisons des wins"), /*#__PURE__*/React.createElement(BarRow, {
    label: "Conformit\xE9 DORA / UE",
    value: 64,
    max: 100,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(BarRow, {
    label: "TCO inf\xE9rieur",
    value: 52,
    max: 100,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(BarRow, {
    label: "Time-to-value",
    value: 38,
    max: 100,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement(BarRow, {
    label: "Sp\xE9. m\xE9tier",
    value: 31,
    max: 100,
    color: "#10b981"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 14,
      marginBottom: 6
    }
  }, "Raisons des losses"), /*#__PURE__*/React.createElement(BarRow, {
    label: "Pr\xE9f\xE9rence statu-quo",
    value: 48,
    max: 100,
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement(BarRow, {
    label: "Pas de r\xE9f\xE9rence assez gros",
    value: 28,
    max: 100,
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement(BarRow, {
    label: "Influence cabinet conseil",
    value: 22,
    max: 100,
    color: "#dc2626"
  })), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panel
  }, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3sm
  }, "Plays de displacement"), [{
    title: "Cheval de Troie module",
    desc: "Proposer Astorya Cyber en complément de SF — créer du proof, puis étendre.",
    time: "6-12 mois",
    color: "#4f46e5"
  }, {
    title: "Pivot DORA 2026",
    desc: "Capitaliser sur l'échéance réglementaire — SF n'a pas de roadmap claire UE.",
    time: "0-3 mois",
    color: "#dc2626",
    urgent: true
  }, {
    title: "Pricing audit guidé",
    desc: "Audit gratuit de la facture SF actuelle, déplafonner les coûts cachés.",
    time: "2-4 sem.",
    color: "#10b981"
  }, {
    title: "Référence ex-SF témoin",
    desc: "Crédit Mutuel Océan, BNP AM, Crédit Agricole Sud ont migré. Activer leur référence.",
    time: "Continu",
    color: "#0ea5e9"
  }].map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.title,
    style: {
      ...bcStyles.play,
      ...(p.urgent ? bcStyles.playUrgent : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      alignSelf: "stretch",
      background: p.color,
      borderRadius: 999,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
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
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, p.title), p.urgent && /*#__PURE__*/React.createElement("span", {
    style: bcStyles.urgentBadge
  }, "\u26A1 Priorit\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 3,
      lineHeight: 1.4
    }
  }, p.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: p.color,
      marginTop: 4,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "\u23F1 ", p.time)))))), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: bcStyles.panelHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bcStyles.panelIcon,
      background: "#fffbeb",
      color: "#a65f00"
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: bcStyles.h3
  }, "Clients qui ont migr\xE9 de Salesforce vers Astorya"), /*#__PURE__*/React.createElement("p", {
    style: bcStyles.h3sub
  }, "\xC0 activer en r\xE9f\xE9rence dans les RDV concurrentiels")), /*#__PURE__*/React.createElement("button", {
    style: bcStyles.smBtn
  }, "Voir tous")), /*#__PURE__*/React.createElement("div", {
    style: bcStyles.refGrid
  }, [{
    co: "Crédit Mutuel Océan",
    logo: "CM",
    bg: "#0f766e",
    size: "640 emp.",
    year: "Mars 2026",
    saved: "– 38 %",
    contact: "Émilie Roux"
  }, {
    co: "BNP Asset Management",
    logo: "BP",
    bg: "#0f766e",
    size: "1 200 emp.",
    year: "Janv. 2026",
    saved: "– 42 %",
    contact: "Jean-Marc Petit"
  }, {
    co: "Crédit Agricole Sud",
    logo: "CA",
    bg: "#10b981",
    size: "850 emp.",
    year: "Nov. 2025",
    saved: "– 35 %",
    contact: "Sophie Leblanc"
  }, {
    co: "Generali Patrimoine",
    logo: "GP",
    bg: "#dc2626",
    size: "420 emp.",
    year: "Sept. 2025",
    saved: "– 31 %",
    contact: "Marc Olivier"
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.co,
    style: bcStyles.refCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...bcStyles.refLogo,
      background: r.bg
    }
  }, r.logo), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, r.co), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, r.size, " \xB7 migr\xE9 ", r.year))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTop: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontWeight: 600
    }
  }, "TCO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#10b981"
    }
  }, r.saved)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontWeight: 600
    }
  }, "Contact"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, r.contact))))))));
};
var BarRow = ({
  label,
  value,
  max,
  color
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11.5,
    color: "#475569",
    flex: 1,
    minWidth: 0
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    height: 4,
    background: "#f1f3f6",
    borderRadius: 999,
    overflow: "hidden"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: `${value}%`,
    height: "100%",
    background: color,
    opacity: 0.7,
    borderRadius: 999
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    color: "#0f172a",
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    width: 28,
    textAlign: "right"
  }
}, value, "%"));
var bcStyles = {
  frame: {
    width: 1440,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  hero: {
    padding: 24,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 14
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 14,
    background: "linear-gradient(135deg, #0066b0, #00A1E0 65%, #2dd4bf)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0.5,
    flexShrink: 0,
    boxShadow: "0 6px 20px rgba(0,161,224,0.3)"
  },
  badge: {
    fontSize: 10.5,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4
  },
  badgeSecondary: {
    fontSize: 10.5,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#fef0e6",
    color: "#a65f00",
    fontWeight: 700,
    letterSpacing: 0.4
  },
  h1: {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: -0.9,
    margin: "2px 0 0",
    color: "#0f172a",
    lineHeight: 1.1
  },
  subtitle: {
    fontSize: 13.5,
    color: "#64748b",
    margin: "6px 0 0",
    lineHeight: 1.5
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
  statRow: {
    display: "flex",
    gap: 18,
    paddingLeft: 18,
    borderLeft: "1px solid #eef1f5",
    flexShrink: 0
  },
  stat: {
    minWidth: 100
  },
  statK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 600
  },
  statV: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.5,
    marginTop: 2
  },
  panel: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  panelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700
  },
  h3: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3
  },
  h3sm: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 14px",
    letterSpacing: -0.2
  },
  h3sub: {
    fontSize: 11.5,
    color: "#64748b",
    margin: "3px 0 0"
  },
  smBtn: {
    padding: "4px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500,
    marginLeft: "auto"
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  bullet: {
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 1.55,
    paddingLeft: 18,
    position: "relative"
  },
  objList: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  obj: {
    padding: 12,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  objQ: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 8
  },
  objA: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    paddingTop: 8,
    borderTop: "1px solid #eef1f5"
  },
  // Pricing
  priceTable: {
    border: "1px solid #eef1f5",
    borderRadius: 8,
    overflow: "hidden"
  },
  priceRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr",
    padding: "8px 12px",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    gap: 8
  },
  priceRowTotal: {
    background: "#fafbfc",
    borderTop: "2px solid #eef1f5",
    borderBottom: "none"
  },
  priceK: {
    fontSize: 11.5,
    color: "#475569"
  },
  priceVal: {
    fontSize: 12.5,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    textAlign: "right"
  },
  priceBadge: {
    display: "inline-block",
    marginTop: 12,
    padding: "4px 10px",
    background: "#e8f8f1",
    color: "#0e7a55",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600
  },
  // Plays
  play: {
    display: "flex",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  playUrgent: {
    background: "linear-gradient(90deg, #fff5f5, transparent 40%)",
    padding: 10,
    borderRadius: 6,
    borderBottom: "none"
  },
  urgentBadge: {
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.3
  },
  // References
  refGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10
  },
  refCard: {
    padding: 12,
    background: "linear-gradient(180deg, #fffdf5, #fff)",
    border: "1px solid #fde68a",
    borderRadius: 10
  },
  refLogo: {
    width: 32,
    height: 32,
    borderRadius: 7,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0
  }
};

// Add bullet marker via pseudo not possible inline; use marker color via span instead
var inject = `
.bc-bullet::before { content: "●"; color: #4f46e5; position: absolute; left: 0; top: 0; font-size: 10px; }
`;
if (typeof document !== "undefined" && !document.getElementById("bc-styles")) {
  var s = document.createElement("style");
  s.id = "bc-styles";
  s.textContent = inject;
  document.head.appendChild(s);
}
window.BattleCard = BattleCard;