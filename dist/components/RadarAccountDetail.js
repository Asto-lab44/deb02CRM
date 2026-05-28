// Détail compte radar — drill-down Mutuelle des Hauts-de-Seine

var RadarAccountDetail = () => {
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
      M: "#dc2626",
      J: "#0ea5e9",
      E: "#14b8a6",
      T: "#f59e0b"
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
    style: radStyles.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Intelligence"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Fins de contrats concurrents"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Mutuelle des Hauts-de-Seine"), /*#__PURE__*/React.createElement("span", {
    style: radStyles.refMono
  }, "REN-2026-001")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: radStyles.ghostBtn
  }, "\u2605 Suivre"), /*#__PURE__*/React.createElement("button", {
    style: radStyles.primaryBtn
  }, "\u2192 Convertir en opportunit\xE9"))), /*#__PURE__*/React.createElement("div", {
    style: radStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.main
  }, /*#__PURE__*/React.createElement("section", {
    style: radStyles.hero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.coLogo
  }, "MH"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...radStyles.tierBadge,
      background: "#fef3c7",
      color: "#a16207",
      border: "1px solid #fde68a"
    }
  }, "Tier A"), /*#__PURE__*/React.createElement("span", {
    style: radStyles.metaChip
  }, "Sant\xE9 \xB7 Mutuelle"), /*#__PURE__*/React.createElement("span", {
    style: radStyles.metaChip
  }, "850 emp."), /*#__PURE__*/React.createElement("span", {
    style: radStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "\uD83D\uDCCD Nanterre"), /*#__PURE__*/React.createElement("span", {
    style: radStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "CA 2024 : 184 M\u20AC")), /*#__PURE__*/React.createElement("h1", {
    style: radStyles.h1
  }, "Mutuelle des Hauts-de-Seine"), /*#__PURE__*/React.createElement("p", {
    style: radStyles.subtitle
  }, "Mutuelle sant\xE9 r\xE9gionale cr\xE9\xE9e en 1958 \xB7 124 000 adh\xE9rents \xB7 DSI dirig\xE9e par \xC9lise Vasseur depuis 2024")), /*#__PURE__*/React.createElement("div", {
    style: radStyles.scoreCircle
  }, /*#__PURE__*/React.createElement("svg", {
    width: "84",
    height: "84",
    viewBox: "0 0 84 84"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "42",
    cy: "42",
    r: "36",
    fill: "none",
    stroke: "#eef1f5",
    strokeWidth: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "42",
    cy: "42",
    r: "36",
    fill: "none",
    stroke: "#10b981",
    strokeWidth: "8",
    strokeDasharray: `${92 / 100 * 226} 226`,
    strokeLinecap: "round",
    transform: "rotate(-90 42 42)"
  })), /*#__PURE__*/React.createElement("div", {
    style: radStyles.scoreInner
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: -0.6
    }
  }, "92"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      letterSpacing: 0.4
    }
  }, "SCORE")))), /*#__PURE__*/React.createElement("div", {
    style: radStyles.contractBanner
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.compLogo
  }, "SF"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Contrat en cours"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      marginTop: 2
    }
  }, "Salesforce Sales Cloud Enterprise"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 1
    }
  }, "3 ans \xB7 sign\xE9 12 juin 2023 \xB7 142 k\u20AC/an"))), /*#__PURE__*/React.createElement("div", {
    style: radStyles.banDivider
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "\xC9ch\xE9ance"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#dc2626",
      marginTop: 2,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "12 juin 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#dc2626",
      fontWeight: 600,
      marginTop: 1
    }
  }, "\u23F1 Dans 17 jours")), /*#__PURE__*/React.createElement("div", {
    style: radStyles.banDivider
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Statut notice"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...radStyles.noticePill,
      background: "#fdecec",
      color: "#dc2626",
      marginTop: 4
    }
  }, "\u2713 \xC9chue 13 mars"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#dc2626",
      fontWeight: 600,
      marginTop: 4
    }
  }, "\uD83D\uDFE2 Phase concurrentielle ouverte"))), /*#__PURE__*/React.createElement("div", {
    style: radStyles.actionBar
  }, /*#__PURE__*/React.createElement("button", {
    style: radStyles.primaryBtn
  }, "+ Cr\xE9er opportunit\xE9"), /*#__PURE__*/React.createElement("button", {
    style: radStyles.ghostBtn
  }, "\u2709 Email \xE0 \xC9lise Vasseur"), /*#__PURE__*/React.createElement("button", {
    style: radStyles.ghostBtn
  }, "\uD83D\uDCC5 Planifier RDV"), /*#__PURE__*/React.createElement("button", {
    style: radStyles.ghostBtn
  }, "\uD83D\uDCDE Logger appel"), /*#__PURE__*/React.createElement("button", {
    style: radStyles.ghostBtn
  }, "\uD83D\uDCCE Joindre signal"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: radStyles.dangerGhost
  }, "Marquer non-pertinent"))), /*#__PURE__*/React.createElement("section", {
    style: radStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.blockHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: radStyles.h2
  }, "Signaux d'achat d\xE9tect\xE9s ", /*#__PURE__*/React.createElement("span", {
    style: radStyles.count
  }, "7")), /*#__PURE__*/React.createElement("p", {
    style: radStyles.h2sub
  }, "Chronologie des indicateurs collect\xE9s sur ce compte")), /*#__PURE__*/React.createElement("button", {
    style: radStyles.filterPill
  }, "+ Ajouter manuellement")), /*#__PURE__*/React.createElement("div", {
    style: radStyles.signalsTL
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.signalsSpine
  }), [{
    type: "hot",
    date: "il y a 6 j · 20 mai",
    source: "Site appels d'offres",
    title: "RFP CRM/CDP publié",
    desc: "Cahier des charges : modernisation outil commercial, conformité DORA, hébergement UE obligatoire, time-to-value < 4 mois. Date de remise : 18 juillet.",
    auto: true
  }, {
    type: "hot",
    date: "il y a 8 j · 18 mai",
    source: "Activité Hub Astorya",
    title: "VP Tech Élise Vasseur ouvre 4 white papers",
    desc: "Téléchargement de : « DORA pour mutuelles », « Migrer de Salesforce », « ROI CRM 18 mois », « Hub Astorya vs SF FinServ ». Visite x3 site Astorya.",
    auto: true
  }, {
    type: "hot",
    date: "il y a 10 j · 16 mai",
    source: "LinkedIn Sales Nav.",
    title: "Élise Vasseur (VP Tech) ajoute Nadia Lefèvre",
    desc: "Connexion acceptée immédiatement. Bio mise à jour : « Modernisation SI mutualiste – chantier 2026 ».",
    auto: true
  }, {
    type: "neutral",
    date: "il y a 14 j · 12 mai",
    source: "Presse spécialisée",
    title: "L'Argus de l'Assurance — interview DG",
    desc: "« Notre CRM actuel ne répond plus aux exigences DORA. Une refonte est sur la table pour Q3 2026. »",
    auto: true
  }, {
    type: "neutral",
    date: "il y a 21 j · 05 mai",
    source: "Crawl publique",
    title: "Recrutement Chef de projet CRM (CDI)",
    desc: "Annonce sur LinkedIn + APEC. Profil cherché : expérience implémentation CRM nouvelle génération, conformité DORA.",
    auto: true
  }, {
    type: "hot",
    date: "il y a 28 j · 28 avril",
    source: "Renseignement commercial",
    title: "Insatisfaction interne Salesforce",
    desc: "Source informelle (consultant ex-MutuHDS) : « Plus personne en interne ne défend Salesforce. Le module FSC ne couvre pas les spécificités mutualistes. » Tom Verdier · note de RDV salon.",
    auto: false
  }, {
    type: "neutral",
    date: "il y a 42 j · 14 avril",
    source: "Bilan financier",
    title: "Budget IT 2026 voté +18 %",
    desc: "Conseil d'administration AGA — augmentation budget SI 2026 actée. Ligne « modernisation outils commerciaux » : 280 k€.",
    auto: true
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: radStyles.signal
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...radStyles.signalDot,
      background: s.type === "hot" ? "#dc2626" : "#cbd5e1",
      color: "#fff"
    }
  }, s.type === "hot" ? "▲" : "·"), /*#__PURE__*/React.createElement("div", {
    style: radStyles.signalBody
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 3,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...radStyles.signalPill,
      background: s.type === "hot" ? "#fdecec" : "#f1f3f6",
      color: s.type === "hot" ? "#dc2626" : "#475569"
    }
  }, s.type === "hot" ? "🔥 Signal chaud" : "Signal neutre"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, s.source), s.auto && /*#__PURE__*/React.createElement("span", {
    style: radStyles.autoTag
  }, "Auto"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, s.date)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, s.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, s.desc)))))), /*#__PURE__*/React.createElement("section", {
    style: radStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.blockHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: radStyles.h2
  }, "Plan d'action concurrentiel ", /*#__PURE__*/React.createElement("span", {
    style: radStyles.count
  }, "5 \xE9tapes")), /*#__PURE__*/React.createElement("p", {
    style: radStyles.h2sub
  }, "Roadmap personnalis\xE9e pour gagner ce compte avant le 12 juin"))), /*#__PURE__*/React.createElement("div", {
    style: radStyles.steps
  }, [{
    done: true,
    who: "Nadia Lefèvre",
    when: "21 mai",
    title: "Connexion LinkedIn Élise Vasseur",
    desc: "Acceptée. Envoyer message ressources DORA."
  }, {
    done: true,
    who: "Nadia Lefèvre",
    when: "24 mai",
    title: "Brief équipe + génération battle card",
    desc: "Battle card SF mise à jour, équipe pré-vente alertée."
  }, {
    active: true,
    who: "Nadia Lefèvre",
    when: "28 mai",
    title: "Premier RDV — Pitch DORA + différenciants",
    desc: "14h00 visio · 30 min. Préparer : démo Cyber, calcul TCO comparatif, témoignage Crédit Mutuel Océan."
  }, {
    who: "Karim Ben Salah",
    when: "06 juin",
    title: "Réponse RFP",
    desc: "Date butoir : 18 juillet (avant échéance contrat SF — possible négociation reconduction)."
  }, {
    who: "Claire Renaud",
    when: "12 juin",
    title: "Date pivot — fin contrat SF",
    desc: "Disponibilité immédiate Astorya garantie en SLA."
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...radStyles.step,
      ...(s.active ? radStyles.stepActive : {}),
      ...(s.done ? radStyles.stepDone : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...radStyles.stepNum,
      background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
      color: s.done || s.active ? "#fff" : "#94a3b8",
      border: s.done || s.active ? "none" : "1.5px solid #cbd5e1"
    }
  }, s.done ? "✓" : i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, s.title), s.active && /*#__PURE__*/React.createElement("span", {
    style: radStyles.nowTag
  }, "\u25B6 En cours")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginBottom: 4
    }
  }, s.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: s.who,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, s.who), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      color: "#94a3b8"
    }
  }, s.when)))))))), /*#__PURE__*/React.createElement("aside", {
    style: radStyles.side
  }, /*#__PURE__*/React.createElement("section", {
    style: radStyles.sideBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.sideHead
  }, "Owner & \xE9quipe"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Nadia Lef\xE8vre",
    size: 36,
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Nadia Lef\xE8vre"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "AE Senior \xB7 EMEA")), /*#__PURE__*/React.createElement("button", {
    style: radStyles.iconMini
  }, "\u2709")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 0",
      borderTop: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Karim Ben Salah",
    size: 28,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, "Karim Ben Salah"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Avant-vente Cyber"))), /*#__PURE__*/React.createElement("button", {
    style: radStyles.addPill
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("section", {
    style: radStyles.sideBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.sideHead
  }, "Contacts cibles ", /*#__PURE__*/React.createElement("span", {
    style: radStyles.miniCount
  }, "3")), [{
    name: "Élise Vasseur",
    role: "VP Technologie & SI",
    color: "#0ea5e9",
    champion: true,
    last: "Connectée LinkedIn il y a 8 j"
  }, {
    name: "Marc Olivier",
    role: "Directeur Commercial",
    color: "#f59e0b",
    last: "Aucun contact"
  }, {
    name: "Julie Bréant",
    role: "CFO",
    color: "#10b981",
    last: "Aucun contact"
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: radStyles.sideContact
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: 28,
    color: p.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, p.name), p.champion && /*#__PURE__*/React.createElement("span", {
    style: radStyles.championPill
  }, "\u2605")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, p.role), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 2
    }
  }, p.last))))), /*#__PURE__*/React.createElement("section", {
    style: radStyles.sideBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.sideHead
  }, "D\xE9composition du score"), [{
    k: "Timing échéance",
    v: 30,
    max: 30
  }, {
    k: "Signaux d'achat",
    v: 24,
    max: 25
  }, {
    k: "Fit secteur",
    v: 20,
    max: 20
  }, {
    k: "Concurrent ciblé",
    v: 13,
    max: 15
  }, {
    k: "Engagement existant",
    v: 5,
    max: 10
  }].map(b => /*#__PURE__*/React.createElement("div", {
    key: b.k,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 11.5,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#475569"
    }
  }, b.k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a"
    }
  }, b.v, "/", b.max)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: "#eef1f5",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${b.v / b.max * 100}%`,
      height: "100%",
      background: "#10b981",
      borderRadius: 999
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      paddingTop: 12,
      borderTop: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "#10b981",
      letterSpacing: -0.5
    }
  }, "92/100"))), /*#__PURE__*/React.createElement("section", {
    style: radStyles.sideBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: radStyles.sideHead
  }, "Match produit Astorya"), /*#__PURE__*/React.createElement("div", {
    style: radStyles.match
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Astorya Suite"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "Best fit pour mutuelle sant\xE9 \xB7 couvre 100 % du RFP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "Estimation"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#10b981",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "~110 k\u20AC/an"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...radStyles.match,
      opacity: 0.7,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "+ Astorya Cyber"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Optionnel \u2014 module conformit\xE9 DORA"))))));
};
var radStyles = {
  frame: {
    width: 1440,
    display: "flex",
    flexDirection: "column",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a"
  },
  head: {
    padding: "16px 28px",
    borderBottom: "1px solid #eef1f5",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  refMono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#94a3b8",
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    marginLeft: 6
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
    padding: "7px 14px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  dangerGhost: {
    padding: "6px 12px",
    border: "1px solid #fecaca",
    background: "#fff",
    borderRadius: 8,
    fontSize: 12,
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 500
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 14,
    padding: 14
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minWidth: 0
  },
  side: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  hero: {
    padding: 20,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  coLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(220,38,38,0.25)"
  },
  tierBadge: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.4
  },
  metaChip: {
    fontSize: 11.5,
    color: "#475569",
    padding: "2px 8px",
    borderRadius: 4,
    background: "#eef1f5",
    fontWeight: 500
  },
  dot: {
    width: 3,
    height: 3,
    background: "#cbd5e1",
    borderRadius: 999
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.7,
    margin: "2px 0 0",
    color: "#0f172a",
    lineHeight: 1.15
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "6px 0 0",
    lineHeight: 1.5
  },
  scoreCircle: {
    position: "relative",
    flexShrink: 0
  },
  scoreInner: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  contractBanner: {
    marginTop: 18,
    padding: 16,
    background: "linear-gradient(135deg, #fff5f5, #ffffff)",
    border: "1px solid #fecaca",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 18
  },
  compLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "linear-gradient(135deg, #00A1E0, #0066b0)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700
  },
  banDivider: {
    width: 1,
    height: 50,
    background: "#fecaca"
  },
  noticePill: {
    display: "inline-block",
    fontSize: 10.5,
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.2
  },
  actionBar: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #eef1f5",
    flexWrap: "wrap"
  },
  block: {
    padding: 18,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  blockHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16
  },
  h2: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: -0.3,
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  h2sub: {
    fontSize: 12,
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
    fontWeight: 600
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
  signalsTL: {
    position: "relative",
    paddingLeft: 8
  },
  signalsSpine: {
    position: "absolute",
    left: 19,
    top: 8,
    bottom: 8,
    width: 1.5,
    background: "#eef1f5"
  },
  signal: {
    display: "flex",
    gap: 14,
    paddingBottom: 14,
    position: "relative"
  },
  signalDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: "0 0 0 4px #fff",
    zIndex: 1
  },
  signalBody: {
    flex: 1,
    minWidth: 0,
    padding: "10px 14px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  signalPill: {
    fontSize: 10.5,
    padding: "1px 7px",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.3
  },
  autoTag: {
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.3
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  step: {
    display: "flex",
    gap: 14,
    padding: 14,
    border: "1px solid #eef1f5",
    borderRadius: 10,
    background: "#fff"
  },
  stepActive: {
    borderColor: "#c7d2fe",
    background: "linear-gradient(180deg, #fafbff, #fff)",
    boxShadow: "0 0 0 3px rgba(79,70,229,0.06)"
  },
  stepDone: {
    opacity: 0.75
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0
  },
  nowTag: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4
  },
  sideBlock: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  sideHead: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between"
  },
  miniCount: {
    fontSize: 10,
    padding: "0 6px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace"
  },
  sideContact: {
    display: "flex",
    gap: 9,
    padding: "7px 0",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center"
  },
  championPill: {
    fontSize: 9,
    padding: "0 4px",
    borderRadius: 3,
    background: "#fffbeb",
    color: "#a65f00",
    fontWeight: 700,
    border: "1px solid #fde68a"
  },
  iconMini: {
    width: 26,
    height: 26,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    color: "#475569",
    cursor: "pointer",
    fontSize: 12
  },
  addPill: {
    padding: "4px 10px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 999,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    marginTop: 8
  },
  match: {
    padding: 10,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    borderRadius: 8
  }
};
window.RadarAccountDetail = RadarAccountDetail;