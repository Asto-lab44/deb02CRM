// ════════════════════════════════════════════════════════════════════
// ProcedureBadge — Badge BODACC procédure collective
// ════════════════════════════════════════════════════════════════════
//
// Affiche un badge coloré indiquant le statut BODACC d'une entreprise :
//   🟢 RAS               — aucune procédure publiée
//   🟠 Procédure en cours — sauvegarde / redressement / conciliation
//   🔴 Liquidation       — liquidation judiciaire ou cessation
//   ⚪ Loading           — check en cours
//   ⚠ Erreur             — erreur réseau ou SIREN invalide
//
// Props :
//   siren           : SIREN à vérifier (string, 9 digits)
//   stored          : objet result précédent (depuis client.data.procedure_collective) optionnel
//   autoCheck       : si true et stored est null OU stale > 7j, lance le check au mount
//   onChange        : callback({result}) quand le badge a un nouveau résultat (à utiliser pour persister)
//   compact         : true → version mini, false → pleine taille avec détails
// ════════════════════════════════════════════════════════════════════

var ProcedureBadge = ({
  siren,
  stored,
  autoCheck = true,
  onChange,
  compact = false
}) => {
  var [result, setResult] = React.useState(stored || null);
  var [loading, setLoading] = React.useState(false);
  var [showDetails, setShowDetails] = React.useState(false);
  var doCheck = React.useCallback(async () => {
    if (!siren) return;
    setLoading(true);
    // Préférence : Pappers (plus riche) → fallback automatique sur BODACC
    var r;
    if (window.HubPappers && window.HubPappers.checkSiren) {
      r = await window.HubPappers.checkSiren(siren);
    } else if (window.HubBodacc && window.HubBodacc.checkSiren) {
      r = await window.HubBodacc.checkSiren(siren);
    } else {
      r = {
        status: "error",
        error: "Aucun module de check disponible",
        checked_at: new Date().toISOString()
      };
    }
    setResult(r);
    setLoading(false);
    if (onChange) onChange(r);
  }, [siren, onChange]);

  // Auto-check au mount si pas de stored OU si stale
  React.useEffect(() => {
    if (!autoCheck || !siren) return;
    var stale = window.HubPappers && window.HubPappers.isStale ? window.HubPappers.isStale(result, 7) : window.HubBodacc && window.HubBodacc.isStale ? window.HubBodacc.isStale(result, 7) : true;
    if (!result || stale) doCheck();
  }, [siren]); // déclenche quand siren change

  if (!siren) return null;
  var cleanSiren = String(siren).replace(/\D/g, "");
  if (cleanSiren.length !== 9) return null;
  var palette = {
    ok: {
      bg: "#dcfce7",
      fg: "#065f46",
      border: "#86efac",
      icon: "🟢",
      label: "RAS BODACC"
    },
    warn: {
      bg: "#fef3c7",
      fg: "#78350f",
      border: "#fde68a",
      icon: "🟠",
      label: "Procédure en cours"
    },
    danger: {
      bg: "#fee2e2",
      fg: "#991b1b",
      border: "#fca5a5",
      icon: "🔴",
      label: "Liquidation / cessation"
    },
    error: {
      bg: "#f1f5f9",
      fg: "#475569",
      border: "#cbd5e1",
      icon: "⚠",
      label: "Erreur BODACC"
    },
    unknown: {
      bg: "#f1f5f9",
      fg: "#475569",
      border: "#cbd5e1",
      icon: "?",
      label: "SIREN invalide"
    }
  };
  if (loading || !result && !loading) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "3px 8px" : "5px 10px",
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11.5,
        fontWeight: 600,
        background: "#f1f5f9",
        color: "#64748b",
        border: "1px solid #cbd5e1"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        width: 10,
        height: 10,
        border: "2px solid #cbd5e1",
        borderTopColor: "#475569",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }
    }), "V\xE9rification BODACC\u2026", /*#__PURE__*/React.createElement("style", null, `@keyframes spin { to { transform: rotate(360deg); } }`));
  }
  var p = palette[result.status] || palette.error;
  var ann = result.announcement;
  var checkedAt = result.checked_at ? new Date(result.checked_at) : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    onClick: () => setShowDetails(true),
    title: "Cliquer pour voir le d\xE9tail",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: compact ? "3px 9px" : "5px 11px",
      borderRadius: 999,
      fontSize: compact ? 10.5 : 11.5,
      fontWeight: 700,
      background: p.bg,
      color: p.fg,
      border: "1px solid " + p.border,
      cursor: "pointer",
      letterSpacing: 0.2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: compact ? 9 : 11
    }
  }, p.icon), p.label, !compact && checkedAt && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 4,
      fontSize: 10,
      opacity: 0.65,
      fontWeight: 500
    }
  }, "\xB7 v\xE9rifi\xE9 ", checkedAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short"
  }))), showDetails && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowDetails(false),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "#fff",
      borderRadius: 12,
      padding: 24,
      maxWidth: 520,
      width: "100%",
      boxShadow: "0 24px 60px rgba(0,0,0,0.3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24
    }
  }, p.icon), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Statut BODACC \u2014 ", p.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10
    }
  }, "SIREN ", cleanSiren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")), result.status === "ok" && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "#065f46",
      margin: "0 0 18px",
      lineHeight: 1.5
    }
  }, "\u2713 Aucune proc\xE9dure collective publi\xE9e. Le client n'est pas en sauvegarde, redressement ni liquidation au regard des donn\xE9es ", result.source === "pappers" ? "Pappers" : "BODACC", "."), result.company && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: 14,
      marginBottom: 18,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8
    }
  }, "Fiche entreprise \xB7 source Pappers"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 6
    }
  }, result.company.denomination || "—"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("tbody", null, result.company.forme_juridique && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0",
      width: "40%"
    }
  }, "Forme juridique"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0",
      fontWeight: 600
    }
  }, result.company.forme_juridique)), result.company.etat_administratif && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "\xC9tat administratif"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0",
      fontWeight: 700,
      color: result.company.etat_administratif === "Active" ? "#065f46" : "#9b1c1c"
    }
  }, result.company.etat_administratif)), result.company.date_creation && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "Cr\xE9ation"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0"
    }
  }, new Date(result.company.date_creation).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }))), result.company.capital && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "Capital"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0",
      fontVariantNumeric: "tabular-nums"
    }
  }, Number(result.company.capital).toLocaleString("fr-FR"), " \u20AC")), result.company.effectif && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "Effectif"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0"
    }
  }, result.company.effectif)), result.company.libelle_code_naf && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "Activit\xE9 (NAF)"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0",
      fontSize: 11.5
    }
  }, result.company.libelle_code_naf)), result.company.siege && (result.company.siege.adresse || result.company.siege.ville) && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "3px 0"
    }
  }, "Si\xE8ge"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "3px 0",
      fontSize: 11.5
    }
  }, result.company.siege.adresse, result.company.siege.cp ? ", " + result.company.siege.cp : "", " ", result.company.siege.ville)))), result.company.dirigeants && result.company.dirigeants.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid #e2e8f0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "Dirigeants"), result.company.dirigeants.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 12,
      padding: "3px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: "#0f172a"
    }
  }, d.nom), d.fonction && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      marginLeft: 6
    }
  }, "\xB7 ", d.fonction))))), ann && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid " + p.border,
      borderRadius: 10,
      padding: 16,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: p.fg,
      marginBottom: 10
    }
  }, ann.type), /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("tbody", null, ann.date && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "4px 0",
      width: "40%"
    }
  }, "Date de publication"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 0",
      fontWeight: 600
    }
  }, new Date(ann.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }))), ann.tribunal && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "4px 0"
    }
  }, "Tribunal"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 0",
      fontWeight: 600
    }
  }, ann.tribunal)), ann.ville && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "4px 0"
    }
  }, "Ville"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 0",
      fontWeight: 600
    }
  }, ann.ville)), ann.nature && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      color: "#64748b",
      padding: "4px 0"
    }
  }, "Nature"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 0"
    }
  }, ann.nature)))), result.total_count > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid " + p.border
    }
  }, "+ ", result.total_count - 1, " autre", result.total_count > 2 ? "s" : "", " annonce", result.total_count > 2 ? "s" : "", " dans l'historique")), result.error && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#9b1c1c",
      background: "#fef2f2",
      padding: 12,
      borderRadius: 8,
      border: "1px solid #fecaca",
      marginBottom: 18
    }
  }, "Erreur : ", result.error), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      fontSize: 11,
      color: "#94a3b8"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Dernier check : ", checkedAt ? checkedAt.toLocaleString("fr-FR") : "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doCheck(),
    style: {
      padding: "7px 14px",
      background: "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\uD83D\uDD04 Re-v\xE9rifier maintenant"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDetails(false),
    style: {
      padding: "7px 14px",
      background: "transparent",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Fermer"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 12,
      fontStyle: "italic"
    }
  }, "Source : ", result.source === "pappers" ? /*#__PURE__*/React.createElement("a", {
    href: "https://www.pappers.fr/entreprise/" + cleanSiren,
    target: "_blank",
    rel: "noopener",
    style: {
      color: "#3730a3"
    }
  }, "Pappers \u2197") : /*#__PURE__*/React.createElement("a", {
    href: "https://bodacc-datadila.opendatasoft.com/explore/dataset/annonces-commerciales/?refine.familleavis_lib=Proc%C3%A9dure+collective&q=" + cleanSiren,
    target: "_blank",
    rel: "noopener",
    style: {
      color: "#3730a3"
    }
  }, "BODACC officiel \u2197")))));
};
window.ProcedureBadge = ProcedureBadge;