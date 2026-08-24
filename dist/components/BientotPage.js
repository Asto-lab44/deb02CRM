// ════════════════════════════════════════════════════════════════════
// BientotPage — Page placeholder "Module bientôt disponible"
// ════════════════════════════════════════════════════════════════════
//
// Utilisée pour les modules pas encore implémentés (marketing, projects,
// inventory, accounting, billing, treasury, hr, time, reports).
//
// Props :
//   moduleName    : nom affiché (ex : "Marketing & Campagnes")
//   moduleIcon    : SVG ou caractère (ex : "📧")
//   moduleColor   : couleur d'accent (ex : "#ec4899")
//   description   : courte description du module
//   roadmap       : array de strings — features à venir
// ════════════════════════════════════════════════════════════════════

var BientotPage = ({
  moduleName,
  moduleIcon,
  moduleColor = "#4f46e5",
  description,
  roadmap = []
}) => {
  var styles = {
    frame: {
      display: "flex",
      minHeight: "100vh",
      background: "#f3f5f8",
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    sidebar: {
      width: 248,
      background: "#fff",
      borderRight: "1px solid #eef1f5",
      display: "flex",
      flexDirection: "column",
      padding: "16px 12px",
      gap: 14
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
    main: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40
    },
    card: {
      maxWidth: 720,
      width: "100%",
      textAlign: "center"
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 24,
      background: moduleColor + "15",
      color: moduleColor,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 44,
      margin: "0 auto 22px",
      boxShadow: "0 12px 32px " + moduleColor + "20"
    },
    badge: {
      display: "inline-block",
      padding: "5px 12px",
      background: "#fef3c7",
      color: "#92400e",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 18,
      border: "1px solid #fde68a"
    },
    title: {
      fontSize: 28,
      fontWeight: 700,
      color: "#0f172a",
      margin: "0 0 10px",
      letterSpacing: -0.5
    },
    sub: {
      fontSize: 14,
      color: "#64748b",
      margin: "0 0 28px",
      lineHeight: 1.6
    },
    roadmapBox: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 14,
      padding: "24px 28px",
      textAlign: "left",
      marginBottom: 24
    },
    roadmapLabel: {
      fontSize: 11,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 14
    },
    roadmapItem: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 0",
      borderBottom: "1px solid #f1f5f9",
      fontSize: 13.5,
      color: "#0f172a"
    },
    check: {
      width: 18,
      height: 18,
      borderRadius: 999,
      background: "#f1f5f9",
      color: "#94a3b8",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: 10
    },
    btnRow: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
      flexWrap: "wrap"
    },
    btn: {
      padding: "11px 22px",
      borderRadius: 9,
      fontSize: 13.5,
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer",
      border: 0,
      transition: "transform .1s"
    },
    btnPrimary: {
      background: "#0f172a",
      color: "#fff"
    },
    btnGhost: {
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: styles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: styles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.brand
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.logo
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
  }, "ERP unifi\xE9")))), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      display: "block",
      padding: "8px 10px",
      fontSize: 12.5,
      color: "#475569",
      textDecoration: "none",
      borderRadius: 6
    }
  }, "\u2190 Retour \xE0 l'accueil")), /*#__PURE__*/React.createElement("main", {
    style: styles.main
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.card
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.iconWrap
  }, moduleIcon), /*#__PURE__*/React.createElement("div", {
    style: styles.badge
  }, "\u23F3 Bient\xF4t disponible"), /*#__PURE__*/React.createElement("h1", {
    style: styles.title
  }, moduleName), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, description), roadmap.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: styles.roadmapBox
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.roadmapLabel
  }, "Roadmap \u2014 Fonctionnalit\xE9s pr\xE9vues"), roadmap.map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...styles.roadmapItem,
      borderBottom: i === roadmap.length - 1 ? "none" : "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.check
  }, "\u25CB"), /*#__PURE__*/React.createElement("span", null, item)))), /*#__PURE__*/React.createElement("div", {
    style: styles.btnRow
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...styles.btn,
      ...styles.btnPrimary
    }
  }, "\u2190 Retour \xE0 l'accueil"), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...styles.btn,
      ...styles.btnGhost
    }
  }, "Aller au CRM")))));
};
window.BientotPage = BientotPage;