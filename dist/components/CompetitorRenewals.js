// Module « Fin de contrats concurrents » — radar opportunités

var CompetitorRenewals = () => {
  var [renewalSearch, setRenewalSearch] = React.useState("");
  var Avatar = ({
    name,
    size = 22,
    color
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      K: "#6366f1",
      L: "#0ea5e9",
      T: "#f59e0b",
      S: "#10b981",
      M: "#a855f7",
      N: "#ec4899",
      J: "#8b5cf6",
      P: "#0891b2"
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
        letterSpacing: 0.2,
        flexShrink: 0
      }
    }, initials);
  };

  // Concurrents — palette de marque (fictive, identifiable)
  var competitors = {
    salesforce: {
      name: "Salesforce",
      abbr: "SF",
      color: "#00A1E0",
      bg: "#e0f4fc"
    },
    pega: {
      name: "Pega",
      abbr: "PG",
      color: "#0e7a55",
      bg: "#e8f8f1"
    },
    appian: {
      name: "Appian",
      abbr: "AP",
      color: "#1e40af",
      bg: "#dde6f7"
    },
    guidewire: {
      name: "Guidewire",
      abbr: "GW",
      color: "#dc2626",
      bg: "#fdecec"
    },
    sapiens: {
      name: "Sapiens",
      abbr: "SA",
      color: "#ea580c",
      bg: "#fef0e6"
    },
    duck_creek: {
      name: "Duck Creek",
      abbr: "DC",
      color: "#7c3aed",
      bg: "#f3e8ff"
    },
    msft: {
      name: "Microsoft D365",
      abbr: "MS",
      color: "#0f172a",
      bg: "#e2e8f0"
    },
    insurity: {
      name: "Insurity",
      abbr: "IN",
      color: "#0891b2",
      bg: "#cffafe"
    }
  };

  // Dates clés : prospects avec contrats concurrents arrivant à terme
  var renewals = [{
    id: "REN-2026-001",
    company: "Mutuelle des Hauts-de-Seine",
    logo: "MH",
    logoBg: "#dc2626",
    industry: "Santé · Mutuelle",
    size: "850 emp.",
    competitor: "salesforce",
    product: "Sales Cloud Enterprise",
    value: 142,
    endDate: "12 juin 2026",
    endIn: 17,
    contractStart: "12 juin 2023",
    autoRenew: true,
    noticeDays: 90,
    noticeDeadline: "13 mars 2026",
    noticeStatus: "passed",
    score: 92,
    tier: "A",
    signals: [{
      type: "hot",
      label: "RFP lancé semaine dernière"
    }, {
      type: "hot",
      label: "Téléchargé 4 white papers Astorya"
    }, {
      type: "hot",
      label: "VP Tech contacté Nadia sur LinkedIn"
    }],
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    contacts: 3,
    lastTouch: "il y a 2 j",
    action: "Pitch programmé jeudi 28 mai · 14h",
    productMatch: "Astorya Suite"
  }, {
    id: "REN-2026-002",
    company: "Banque Méridionale",
    logo: "BM",
    logoBg: "#0f172a",
    industry: "Banque privée",
    size: "1 200 emp.",
    competitor: "pega",
    product: "Pega Platform Cloud",
    value: 218,
    endDate: "30 juin 2026",
    endIn: 35,
    contractStart: "01 juil. 2022",
    autoRenew: false,
    noticeDays: 60,
    noticeDeadline: "01 mai 2026",
    noticeStatus: "passed",
    score: 87,
    tier: "A",
    signals: [{
      type: "hot",
      label: "Insatisfaction publique du CIO en interview"
    }, {
      type: "neutral",
      label: "Budget IT 2026 voté en hausse de 22 %"
    }],
    owner: "Romain Daviaud",
    ownerColor: "#6366f1",
    contacts: 2,
    lastTouch: "il y a 5 j",
    action: "Préparer use-case bancaire dédié",
    productMatch: "Astorya Suite + Cyber"
  }, {
    id: "REN-2026-003",
    company: "Crédit Provence",
    logo: "CP",
    logoBg: "#10b981",
    industry: "Banque mutualiste",
    size: "640 emp.",
    competitor: "msft",
    product: "Dynamics 365 Sales",
    value: 64,
    endDate: "15 juil. 2026",
    endIn: 50,
    contractStart: "15 juil. 2024",
    autoRenew: true,
    noticeDays: 60,
    noticeDeadline: "16 mai 2026",
    noticeStatus: "soon",
    score: 71,
    tier: "B",
    signals: [{
      type: "neutral",
      label: "Migration data en cours côté SI"
    }],
    owner: "Sophie Aubry",
    ownerColor: "#10b981",
    contacts: 1,
    lastTouch: "il y a 3 sem.",
    action: "Relance avant deadline notice 16/05",
    productMatch: "Astorya Hub"
  }, {
    id: "REN-2026-004",
    company: "Helios Mutuelle",
    logo: "HM",
    logoBg: "#f59e0b",
    industry: "Mutuelle santé",
    size: "320 emp.",
    competitor: "sapiens",
    product: "Sapiens IDIT Suite",
    value: 86,
    endDate: "30 sept. 2026",
    endIn: 127,
    contractStart: "01 oct. 2021",
    autoRenew: false,
    noticeDays: 90,
    noticeDeadline: "02 juil. 2026",
    noticeStatus: "open",
    score: 78,
    tier: "B",
    signals: [{
      type: "hot",
      label: "Renouvellement annoncé difficile (presse)"
    }],
    owner: "Tom Verdier",
    ownerColor: "#f59e0b",
    contacts: 2,
    lastTouch: "hier",
    action: "Démo prévue 04 juin",
    productMatch: "Astorya Cyber",
    isNew: true
  }, {
    id: "REN-2026-005",
    company: "Allianz France PME",
    logo: "AL",
    logoBg: "#1e3a8a",
    industry: "Assurance entreprise",
    size: "4 500 emp.",
    competitor: "guidewire",
    product: "Guidewire InsurancePlatform",
    value: 412,
    endDate: "31 déc. 2026",
    endIn: 219,
    contractStart: "01 janv. 2022",
    autoRenew: false,
    noticeDays: 180,
    noticeDeadline: "04 juil. 2026",
    noticeStatus: "open",
    score: 88,
    tier: "A",
    signals: [{
      type: "hot",
      label: "Appel d'offres prévu T3 2026 (confirmé)"
    }, {
      type: "hot",
      label: "DSI ex-client Astorya chez Aviva"
    }],
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    contacts: 5,
    lastTouch: "il y a 4 j",
    action: "Audit pré-RFP en cours",
    productMatch: "Astorya Suite Enterprise"
  }, {
    id: "REN-2026-006",
    company: "Cabinet Renard & Fils",
    logo: "RF",
    logoBg: "#a855f7",
    industry: "Courtage",
    size: "85 emp.",
    competitor: "salesforce",
    product: "Sales Cloud Pro",
    value: 18,
    endDate: "15 nov. 2026",
    endIn: 173,
    contractStart: "15 nov. 2024",
    autoRenew: true,
    noticeDays: 30,
    noticeDeadline: "16 oct. 2026",
    noticeStatus: "open",
    score: 54,
    tier: "C",
    signals: [{
      type: "neutral",
      label: "Croissance équipe commerciale +40 %"
    }],
    owner: "Pierre Dubois",
    ownerColor: "#0891b2",
    contacts: 1,
    lastTouch: "il y a 1 sem.",
    action: "Nurturing — webinar invité",
    productMatch: "Astorya Hub"
  }, {
    id: "REN-2026-007",
    company: "Atlantique Patrimoine",
    logo: "AP",
    logoBg: "#0ea5e9",
    industry: "Gestion de patrimoine",
    size: "210 emp.",
    competitor: "appian",
    product: "Appian Platform",
    value: 58,
    endDate: "31 août 2026",
    endIn: 97,
    contractStart: "01 sept. 2024",
    autoRenew: false,
    noticeDays: 60,
    noticeDeadline: "02 juil. 2026",
    noticeStatus: "open",
    score: 66,
    tier: "B",
    signals: [{
      type: "neutral",
      label: "Nouvelle gouvernance IT depuis 02/2026"
    }],
    owner: "Sophie Aubry",
    ownerColor: "#10b981",
    contacts: 2,
    lastTouch: "il y a 12 j",
    action: "Mapping décideurs à compléter",
    productMatch: "Astorya Hub"
  }, {
    id: "REN-2026-008",
    company: "Compagnie Helvétique d'Assurance",
    logo: "CH",
    logoBg: "#dc2626",
    industry: "Assurance vie",
    size: "1 800 emp.",
    competitor: "duck_creek",
    product: "Duck Creek OnDemand",
    value: 304,
    endDate: "30 juin 2026",
    endIn: 35,
    contractStart: "01 juil. 2023",
    autoRenew: false,
    noticeDays: 120,
    noticeDeadline: "03 mars 2026",
    noticeStatus: "passed",
    score: 81,
    tier: "A",
    signals: [{
      type: "hot",
      label: "Notice émise — phase concurrentielle ouverte"
    }, {
      type: "hot",
      label: "Demande de démo via formulaire 18 mai"
    }],
    owner: "Émilie Garnier",
    ownerColor: "#0ea5e9",
    contacts: 4,
    lastTouch: "il y a 1 j",
    action: "Présentation comité IT 12 juin",
    productMatch: "Astorya Suite"
  }];
  var scoreColor = s => s >= 85 ? "#10b981" : s >= 70 ? "#a855f7" : s >= 55 ? "#f59e0b" : "#94a3b8";
  var tierColor = t => t === "A" ? {
    bg: "#fef3c7",
    color: "#a16207",
    border: "#fde68a"
  } : t === "B" ? {
    bg: "#dbeafe",
    color: "#1e40af",
    border: "#bfdbfe"
  } : {
    bg: "#f1f5f9",
    color: "#475569",
    border: "#e2e8f0"
  };
  var totalValue = renewals.reduce((s, r) => s + r.value, 0);
  var next90 = renewals.filter(r => r.endIn <= 90);
  var next90Value = next90.reduce((s, r) => s + r.value, 0);
  var hotCount = renewals.filter(r => r.score >= 80).length;

  // Buckets pour la timeline
  var months = ["Juin 26", "Juil. 26", "Août 26", "Sept. 26", "Oct.-Nov. 26", "Déc. 26+"];
  var inMonth = (r, m) => {
    if (m === 0) return r.endDate.includes("juin");
    if (m === 1) return r.endDate.includes("juil");
    if (m === 2) return r.endDate.includes("août");
    if (m === 3) return r.endDate.includes("sept");
    if (m === 4) return r.endDate.includes("oct") || r.endDate.includes("nov");
    return r.endDate.includes("déc") || r.endDate.includes("janv");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: crStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: crStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...crStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "CRM commercial"))), /*#__PURE__*/React.createElement("button", {
    style: crStyles.newBtn
  }, "+ Nouvelle opportunit\xE9 ", /*#__PURE__*/React.createElement("span", {
    style: crStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.navLabel
  }, "Espace"), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, "32")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25F0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Comptes"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, "412")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Contacts"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, "1 184")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Activit\xE9s"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, "27"))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.navLabel
  }, "Intelligence"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...crStyles.navItem,
      ...crStyles.navItemActive
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25F7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Fins de contrats concurrents"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, renewals.length)), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25CA"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Watchlist comptes")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u25C7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Signaux march\xE9"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.navCount
  }, "14")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navItem
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.bullet
  }, "\u21BB"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Battle cards"))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.navLabel
  }, "Concurrents suivis"), Object.entries(competitors).slice(0, 6).map(([k, c]) => {
    var count = renewals.filter(r => r.competitor === k).length;
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: crStyles.navItem
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...crStyles.compMark,
        background: c.bg,
        color: c.color,
        borderColor: c.color
      }
    }, c.abbr), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12
      }
    }, c.name), count > 0 && /*#__PURE__*/React.createElement("span", {
      style: crStyles.navCount
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: crStyles.userRow
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Claire Renaud",
    size: 26,
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Claire Renaud"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "VP Sales \xB7 EMEA")))), /*#__PURE__*/React.createElement("main", {
    style: crStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: crStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Intelligence"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Fins de contrats concurrents")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.search
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8",
      fontSize: 12
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    value: renewalSearch,
    onChange: e => setRenewalSearch(e.target.value),
    placeholder: "Rechercher un compte, concurrent\u2026",
    style: crStyles.searchInput
  })))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.liveBadge
  }, "\u25CF Mis \xE0 jour \xE0 l'instant")), /*#__PURE__*/React.createElement("h1", {
    style: crStyles.h1
  }, "Radar fin de contrats concurrents"), /*#__PURE__*/React.createElement("p", {
    style: crStyles.h1sub
  }, renewals.length, " comptes prioritaires en zone d'opportunit\xE9 \xB7 ", totalValue.toLocaleString("fr-FR"), " k\u20AC de valeur en comp\xE9tition d'ici 12 mois")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      ...crStyles.primaryBtn,
      textDecoration: "none",
      cursor: "pointer",
      display: "inline-block"
    }
  }, "+ Ajouter un compte"))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpiStrip
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...crStyles.kpi,
      ...crStyles.kpiHero
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.3
    }
  }, "\xC9ch\xE9ances 90 jours"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...crStyles.trendChip,
      background: "rgba(248,113,113,0.2)",
      color: "#fca5a5"
    }
  }, "\u26A1 Action imm\xE9diate")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -0.8
    }
  }, next90.length), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)"
    }
  }, "comptes \xB7 ", next90Value.toLocaleString("fr-FR"), " k\u20AC")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "Sur les ", next90.length, " prochaines \xE9ch\xE9ances, ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#fff"
    }
  }, next90.filter(r => r.noticeStatus === "passed").length, " sont d\xE9j\xE0 en phase concurrentielle"), " (notice de non-reconduction \xE9mise ou \xE9chue).")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.kpiLabel
  }, "Hot leads (score \u2265 80)"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...crStyles.kpiValue,
      color: "#10b981"
    }
  }, hotCount), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpiSub
  }, "Signaux d'achat confirm\xE9s")), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.kpiLabel
  }, "Top concurrent cibl\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...crStyles.compMarkBig,
      background: competitors.salesforce.bg,
      color: competitors.salesforce.color,
      border: `1.5px solid ${competitors.salesforce.color}`
    }
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
  }, "2 deals \xB7 160 k\u20AC")))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpi
  }, /*#__PURE__*/React.createElement("span", {
    style: crStyles.kpiLabel
  }, "Win rate vs. concurrents"), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpiValue
  }, "42 %"), /*#__PURE__*/React.createElement("div", {
    style: crStyles.kpiSub
  }, "Astorya en displacement 2026"))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.filterBar
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.tabs
  }, [{
    k: "all",
    label: "Toutes",
    c: renewals.length,
    active: true
  }, {
    k: "30",
    label: "≤ 30 j",
    c: renewals.filter(r => r.endIn <= 30).length
  }, {
    k: "90",
    label: "≤ 90 j",
    c: next90.length
  }, {
    k: "180",
    label: "≤ 180 j",
    c: renewals.filter(r => r.endIn <= 180).length
  }, {
    k: "more",
    label: "Plus tard",
    c: renewals.filter(r => r.endIn > 180).length
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    style: {
      ...crStyles.tab,
      ...(t.active ? crStyles.tabActive : {})
    }
  }, t.label, /*#__PURE__*/React.createElement("span", {
    style: {
      ...crStyles.tabCount,
      ...(t.active ? crStyles.tabCountActive : {})
    }
  }, t.c)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "+ Concurrent"), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "+ Tier"), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "+ Owner"), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "+ Statut notice"), /*#__PURE__*/React.createElement("span", {
    style: crStyles.divider
  }), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "\u2195 Score d\xE9croissant"), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "\uD83D\uDCC5 Timeline"), /*#__PURE__*/React.createElement("button", {
    style: crStyles.filterPill
  }, "\u2630 Liste"))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.timelineWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: crStyles.timelineHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Chronologie des \xE9ch\xE9ances"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b"
    }
  }, "De juin 2026 \xE0 d\xE9but 2027 \xB7 taille des marqueurs = valeur contrat")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Legend, {
    dot: "#dc2626",
    label: "Notice pass\xE9e"
  }), /*#__PURE__*/React.createElement(Legend, {
    dot: "#f59e0b",
    label: "Notice imminente"
  }), /*#__PURE__*/React.createElement(Legend, {
    dot: "#10b981",
    label: "Notice ouverte"
  }))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.tlMonths
  }, months.map((m, i) => {
    var items = renewals.filter(r => inMonth(r, i));
    var sum = items.reduce((s, r) => s + r.value, 0);
    var isUrgent = i <= 1;
    return /*#__PURE__*/React.createElement("div", {
      key: m,
      style: {
        ...crStyles.tlMonth,
        ...(isUrgent ? crStyles.tlMonthUrgent : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: isUrgent ? "#dc2626" : "#0f172a",
        letterSpacing: 0.2
      }
    }, m), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, items.length, " \xB7 ", sum, " k\u20AC")), /*#__PURE__*/React.createElement("div", {
      style: crStyles.tlBubbles
    }, items.map(r => {
      var size = Math.max(28, Math.min(54, 28 + r.value / 12));
      var noticeMeta = r.noticeStatus === "passed" ? "#dc2626" : r.noticeStatus === "soon" ? "#f59e0b" : "#10b981";
      return /*#__PURE__*/React.createElement("div", {
        key: r.id,
        style: {
          ...crStyles.tlBubble,
          width: size,
          height: size,
          background: r.logoBg,
          fontSize: size > 42 ? 11 : 9.5,
          boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${noticeMeta}`
        },
        title: `${r.company} · ${r.value} k€`
      }, r.logo);
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    style: crStyles.tableHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    readOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4
    }
  }, "Compte"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.1
    }
  }, "Contrat concurrent"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130
    }
  }, "\xC9ch\xE9ance"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 100
    }
  }, "Notice"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110
    }
  }, "Score"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150
    }
  }, "Owner"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: crStyles.rows
  }, renewals.map(r => {
    var c = competitors[r.competitor];
    var tc = tierColor(r.tier);
    var isUrgent = r.endIn <= 60;
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        ...crStyles.row,
        ...(isUrgent ? crStyles.rowUrgent : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 22,
        paddingTop: 4
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      readOnly: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1.4,
        minWidth: 0,
        paddingRight: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...crStyles.coLogo,
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
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, r.company), /*#__PURE__*/React.createElement("span", {
      style: {
        ...crStyles.tierBadge,
        background: tc.bg,
        color: tc.color,
        border: `1px solid ${tc.border}`
      }
    }, "Tier ", r.tier), r.isNew && /*#__PURE__*/React.createElement("span", {
      style: crStyles.newPill
    }, "NOUVEAU")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 2
      }
    }, r.industry, " \xB7 ", r.size), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
        marginTop: 7
      }
    }, r.signals.slice(0, 2).map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 5,
        fontSize: 11,
        color: s.type === "hot" ? "#a65f00" : "#475569"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: s.type === "hot" ? "#dc2626" : "#94a3b8",
        flexShrink: 0,
        fontWeight: 700
      }
    }, s.type === "hot" ? "▲" : "·"), /*#__PURE__*/React.createElement("span", null, s.label))), r.signals.length > 2 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8"
      }
    }, "+", r.signals.length - 2, " signal(aux)"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1.1,
        minWidth: 0,
        paddingRight: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...crStyles.compMark,
        background: c.bg,
        color: c.color,
        borderColor: c.color
      }
    }, c.abbr), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, r.product))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        fontWeight: 600
      }
    }, "Valeur"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace",
        marginLeft: 2
      }
    }, r.value, " k\u20AC/an")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        fontWeight: 600
      }
    }, "Match"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#4f46e5",
        fontWeight: 600,
        marginLeft: 2
      }
    }, "\u2192 ", r.productMatch))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 130,
        paddingRight: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: isUrgent ? "#dc2626" : "#0f172a",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: -0.2
      }
    }, r.endDate), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: isUrgent ? "#dc2626" : "#64748b",
        marginTop: 2
      }
    }, "Dans ", /*#__PURE__*/React.createElement("strong", null, r.endIn, " jours")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...crStyles.miniBar,
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${Math.max(5, Math.min(100, 100 - r.endIn / 220 * 100))}%`,
        height: "100%",
        background: r.endIn <= 30 ? "#dc2626" : r.endIn <= 90 ? "#f59e0b" : r.endIn <= 180 ? "#a855f7" : "#10b981",
        borderRadius: 999
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 100,
        paddingRight: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...crStyles.noticePill,
        background: r.noticeStatus === "passed" ? "#fdecec" : r.noticeStatus === "soon" ? "#fff6e6" : "#e8f8f1",
        color: r.noticeStatus === "passed" ? "#dc2626" : r.noticeStatus === "soon" ? "#a65f00" : "#0e7a55"
      }
    }, r.noticeStatus === "passed" ? "✓ Échue" : r.noticeStatus === "soon" ? "⏰ Imminente" : "○ Ouverte"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        marginTop: 4,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, r.noticeDeadline), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        marginTop: 1
      }
    }, r.autoRenew ? "Tacite reconduct." : "Pas de tacite")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 110,
        paddingRight: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20,
        fontWeight: 700,
        color: scoreColor(r.score),
        letterSpacing: -0.5,
        fontFamily: "'Inter', sans-serif"
      }
    }, r.score), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#94a3b8"
      }
    }, "/ 100")), /*#__PURE__*/React.createElement("div", {
      style: crStyles.scoreBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${r.score}%`,
        height: "100%",
        background: scoreColor(r.score),
        borderRadius: 999
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        marginTop: 4
      }
    }, r.signals.filter(s => s.type === "hot").length, " signal(aux) chaud(s)")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 150
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
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
        fontSize: 10,
        color: "#94a3b8"
      }
    }, "Contact ", r.lastTouch))), /*#__PURE__*/React.createElement("div", {
      style: crStyles.nextAction
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#4f46e5"
      }
    }, "\u2192"), " ", r.action)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 28
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: crStyles.rowMenu
    }, "\u22EF")));
  })), /*#__PURE__*/React.createElement("div", {
    style: crStyles.foot
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "8 comptes affich\xE9s sur 24 surveill\xE9s \xB7 Prochaine collecte automatique demain 06:00"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      // Export CSV des comptes surveillés actuellement affichés
      var rows = [["Compte", "Concurrent", "Fin contrat estimée", "ARR €", "Score", "Tier"]];
      try {
        var cards = document.querySelectorAll("[data-renewal-row]");
        if (!cards.length) {
          alert("Aucune ligne à exporter (rechargez la page).");
          return;
        }
        cards.forEach(c => {
          rows.push([c.dataset.name || "", c.dataset.competitor || "", c.dataset.endDate || "", c.dataset.arr || "", c.dataset.score || "", c.dataset.tier || ""]);
        });
      } catch (e) {}
      if (rows.length === 1) {
        // Fallback : message instructif
        alert("⚠ Export CSV vide. Cette page de démo n'expose pas encore les données via data-attributes — la version BDD permettra l'export automatique.");
        return;
      }
      var csv = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      var blob = new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8;"
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "concurrents-renouvellements-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    style: {
      ...crStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Exporter CSV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      try {
        localStorage.setItem("hubAstorya.competitorAlerts.enabled", "1");
        alert("✓ Alertes activées. Tu recevras un email quand un contrat concurrent approche de sa date de fin (à brancher avec SendGrid/Mailgun côté backend).");
      } catch (e) {
        alert("Erreur : " + e.message);
      }
    },
    style: {
      ...crStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "S'abonner aux alertes"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16
    }
  })));
};
var Legend = ({
  dot,
  label
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#475569"
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: dot
  }
}), /*#__PURE__*/React.createElement("span", null, label));
var crStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 248,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "14px 12px",
    gap: 14,
    flexShrink: 0
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px"
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoMark: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: -0.5
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    marginLeft: "auto",
    fontSize: 10.5,
    padding: "2px 5px",
    borderRadius: 4,
    background: "rgba(255,255,255,0.12)",
    color: "#cbd5e1",
    fontFamily: "'JetBrains Mono', monospace"
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: 1
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    padding: "0 6px 6px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 8px",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#475569",
    cursor: "pointer"
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600
  },
  navCount: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  },
  bullet: {
    width: 14,
    color: "#94a3b8",
    fontSize: 11
  },
  compMark: {
    width: 22,
    height: 18,
    borderRadius: 4,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  compMarkBig: {
    width: 30,
    height: 24,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 6px",
    borderTop: "1px solid #eef1f5",
    marginTop: 4
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "auto"
  },
  topbar: {
    height: 48,
    padding: "0 24px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: 320,
    height: 30,
    padding: "0 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fafbfc"
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    flex: 1,
    fontSize: 12.5
  },
  kbdLight: {
    fontSize: 10.5,
    padding: "1px 5px",
    borderRadius: 4,
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace"
  },
  iconBtn: {
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    color: "#475569",
    cursor: "pointer",
    fontSize: 13
  },
  titleRow: {
    padding: "16px 24px 12px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16
  },
  liveBadge: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.6,
    margin: "4px 0 0",
    color: "#0f172a"
  },
  h1sub: {
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
    padding: "7px 13px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
    gap: 10,
    padding: "4px 24px 14px"
  },
  kpi: {
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  kpiHero: {
    background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%)",
    border: "none",
    color: "#fff",
    boxShadow: "0 4px 16px rgba(220,38,38,0.25)"
  },
  kpiLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  kpiValue: {
    fontSize: 22,
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
  trendChip: {
    fontSize: 10,
    padding: "1px 7px",
    borderRadius: 999,
    fontWeight: 700
  },
  filterBar: {
    padding: "10px 24px",
    borderTop: "1px solid #eef1f5",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  tabs: {
    display: "flex",
    gap: 2
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  tabActive: {
    background: "#0f172a",
    color: "#fff"
  },
  tabCount: {
    fontSize: 11,
    padding: "0 5px",
    borderRadius: 4,
    background: "#eef1f5",
    color: "#64748b",
    fontFamily: "'JetBrains Mono', monospace"
  },
  tabCountActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#cbd5e1"
  },
  filterPill: {
    padding: "5px 9px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  },
  divider: {
    width: 1,
    height: 18,
    background: "#eef1f5",
    alignSelf: "center",
    margin: "0 4px"
  },
  // Timeline
  timelineWrap: {
    padding: "18px 24px 14px",
    background: "#fafbfc"
  },
  timelineHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12
  },
  tlMonths: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 8,
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  tlMonth: {
    padding: 10,
    borderRight: "1px dashed #eef1f5",
    minHeight: 90
  },
  tlMonthUrgent: {
    background: "linear-gradient(180deg, #fff5f5, transparent)",
    borderRadius: 6
  },
  tlBubbles: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center"
  },
  tlBubble: {
    borderRadius: 999,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    letterSpacing: 0.3
  },
  // Table
  tableHead: {
    display: "flex",
    alignItems: "center",
    padding: "8px 24px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    gap: 4
  },
  rows: {
    background: "#fff"
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    padding: "14px 24px",
    borderBottom: "1px solid #f1f5f9",
    gap: 4
  },
  rowUrgent: {
    background: "linear-gradient(90deg, #fff8f7, transparent 30%)",
    borderLeft: "2px solid #dc2626",
    paddingLeft: 22
  },
  coLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    flexShrink: 0
  },
  tierBadge: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.4
  },
  newPill: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4
  },
  noticePill: {
    display: "inline-block",
    fontSize: 10.5,
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.2
  },
  miniBar: {
    width: "100%",
    height: 4,
    background: "#eef1f5",
    borderRadius: 999,
    overflow: "hidden"
  },
  scoreBar: {
    width: "100%",
    height: 4,
    background: "#eef1f5",
    borderRadius: 999,
    marginTop: 4,
    overflow: "hidden"
  },
  nextAction: {
    fontSize: 11,
    color: "#475569",
    marginTop: 8,
    padding: "4px 6px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 5,
    lineHeight: 1.4
  },
  rowMenu: {
    width: 24,
    height: 24,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    borderRadius: 4
  },
  foot: {
    padding: "12px 24px",
    borderTop: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }
};
window.CompetitorRenewals = CompetitorRenewals;