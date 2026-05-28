// Fiche nouveau prospect — formulaire de qualification

var NewProspect = () => {
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
      E: "#0ea5e9",
      M: "#dc2626",
      L: "#8b5cf6"
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
    style: npStyles.frame
  }, /*#__PURE__*/React.createElement("header", {
    style: npStyles.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("span", null, "CRM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Comptes & contacts"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, "Nouveau prospect"), /*#__PURE__*/React.createElement("span", {
    style: npStyles.refMono
  }, "PRO-DRAFT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#10b981",
      fontWeight: 500
    }
  }, "\u25CF Auto-save \xB7 il y a 4 sec")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: npStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.ghostBtn
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.primaryBtn
  }, "Cr\xE9er le prospect"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.titleRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.heroIcon
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 8v6M23 11h-6"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: npStyles.h1
  }, "Nouveau prospect"), /*#__PURE__*/React.createElement("p", {
    style: npStyles.subtitle
  }, "Qualifiez une nouvelle entreprise et son interlocuteur cl\xE9 \xB7 l'IA enrichira automatiquement les donn\xE9es publiques"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.completion
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 500
    }
  }, "Fiche compl\xE9t\xE9e"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "64 %")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      height: 5,
      background: "#eef1f5",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "64%",
      height: "100%",
      background: "linear-gradient(90deg, #4f46e5, #a855f7)",
      borderRadius: 999
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.formCol
  }, /*#__PURE__*/React.createElement("section", {
    style: npStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "01",
    title: "Soci\xE9t\xE9",
    subtitle: "Identit\xE9 et caract\xE9ristiques de l'entreprise prospect",
    status: "done"
  }), /*#__PURE__*/React.createElement(FormRow, {
    label: "Raison sociale",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.searchInputWrap
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Banque M\xE9ridionale"
  }), /*#__PURE__*/React.createElement("span", {
    style: npStyles.searchTag
  }, "\uD83D\uDD0D Auto-compl\xE9t\xE9 via base SIRENE"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid3
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "SIREN",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    defaultValue: "312 482 671"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Code NAF"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    defaultValue: "64.19Z"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "TVA intracom."
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    defaultValue: "FR47312482671"
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Secteur d'activit\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.select
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "#4f46e5"
    }
  }), /*#__PURE__*/React.createElement("span", null, "Banque priv\xE9e")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\u25BE"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Sous-secteur"
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Gestion de patrimoine HNWI"
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid3
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Effectif",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.segCtrl
  }, /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "1-50"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "51-250"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "251-1k"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.segBtn,
      ...npStyles.segBtnActive
    }
  }, "1k-5k"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "5k+")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Source SIRENE : 1 200 collaborateurs")), /*#__PURE__*/React.createElement(FormRow, {
    label: "CA annuel"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithSuffix
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: "0 4px",
      fontWeight: 600
    },
    defaultValue: "142"
  }), /*#__PURE__*/React.createElement("span", {
    style: npStyles.suffix
  }, "M\u20AC")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Bilan 2024")), /*#__PURE__*/React.createElement(FormRow, {
    label: "Tier prospect"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.tierRow
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.tierBtn,
      background: "#fef3c7",
      color: "#a16207",
      border: "1.5px solid #fde68a",
      fontWeight: 700
    }
  }, "\u2605 A"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.tierBtn,
      background: "#fff",
      color: "#64748b"
    }
  }, "B"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.tierBtn,
      background: "#fff",
      color: "#64748b"
    }
  }, "C")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Grand compte strat\xE9gique"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Site web"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithIcon
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\uD83C\uDF10"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    defaultValue: "banque-meridionale.fr"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.linkTag,
      color: "#10b981"
    }
  }, "\u2713 Actif"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "LinkedIn entreprise"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithIcon
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0a66c2"
    }
  }, "in"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    defaultValue: "linkedin.com/company/banque-meridionale"
  })))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Adresse si\xE8ge"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "42 cours Pierre Puget",
    placeholder: "Adresse"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "100px 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "13006",
    placeholder: "CP"
  }), /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Marseille",
    placeholder: "Ville"
  }))))), /*#__PURE__*/React.createElement("section", {
    style: npStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "02",
    title: "Contact principal",
    subtitle: "D\xE9cideur identifi\xE9 ou point d'entr\xE9e commercial",
    status: "active"
  }), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Pr\xE9nom",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Laurent"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Nom",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Mercier"
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Fonction",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    defaultValue: "Directeur des Syst\xE8mes d'Information"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Niveau hi\xE9rarchique"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.segCtrl
  }, /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "Op\xE9r."), /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "Mgr"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.segBtn
  }, "Dir."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.segBtn,
      ...npStyles.segBtnActive
    }
  }, "C-level")))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Email pro",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithIcon
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\u2709"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    defaultValue: "l.mercier@banque-meridionale.fr"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.linkTag,
      color: "#10b981"
    }
  }, "\u2713 V\xE9rifi\xE9"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "T\xE9l\xE9phone"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithIcon
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\u260E"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    defaultValue: "+33 4 91 14 \u2022\u2022"
  })))), /*#__PURE__*/React.createElement(FormRow, {
    label: "R\xF4le dans le projet",
    subtitle: "Quelle place dans la d\xE9cision d'achat ?"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.roleChip,
      ...npStyles.roleChipOn
    }
  }, "\u2605 D\xE9cideur"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.roleChip
  }, "Champion"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.roleChip
  }, "Prescripteur"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.roleChip
  }, "Utilisateur"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.roleChip
  }, "Acheteur"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.roleChip
  }, "Bloqueur"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "LinkedIn profil"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputWithIcon
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0a66c2"
    }
  }, "in"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    defaultValue: "linkedin.com/in/laurent-mercier-dsi"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.linkTag,
      color: "#4f46e5"
    }
  }, "\u2605 2nd niveau")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Connect\xE9 \xE0 Nadia Lef\xE8vre via 3 contacts mutuels"))), /*#__PURE__*/React.createElement("section", {
    style: npStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "03",
    title: "Qualification commerciale",
    subtitle: "M\xE9thode BANT \u2014 Budget \xB7 Authority \xB7 Need \xB7 Timeline",
    status: "todo"
  }), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: npStyles.bantLetter
  }, "B"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#e8f8f1",
      color: "#0e7a55",
      fontWeight: 700
    }
  }, "Confirm\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Budget"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "200-300 k\u20AC allou\xE9s Q3 2026 (interview presse CIO)"), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantRating
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      ...npStyles.bantDot,
      background: n <= 4 ? "#10b981" : "#eef1f5"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: npStyles.bantLetter
  }, "A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#e8f8f1",
      color: "#0e7a55",
      fontWeight: 700
    }
  }, "Confirm\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Authority"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "Laurent Mercier (DSI) \u2014 d\xE9cideur direct sur ce p\xE9rim\xE8tre"), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantRating
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      ...npStyles.bantDot,
      background: n <= 5 ? "#10b981" : "#eef1f5"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: npStyles.bantLetter
  }, "N"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#fff6e6",
      color: "#a65f00",
      fontWeight: 700
    }
  }, "\xC0 explorer")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Need"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "Insatisfaction Pega exprim\xE9e publiquement \xB7 modernisation SI \xE9voqu\xE9e"), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantRating
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      ...npStyles.bantDot,
      background: n <= 3 ? "#f59e0b" : "#eef1f5"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: npStyles.bantLetter
  }, "T"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "1px 6px",
      borderRadius: 3,
      background: "#fdecec",
      color: "#dc2626",
      fontWeight: 700
    }
  }, "Urgent")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Timeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "Contrat Pega arrive \xE0 \xE9ch\xE9ance 30 juin 2026 (dans 35 j)"), /*#__PURE__*/React.createElement("div", {
    style: npStyles.bantRating
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      ...npStyles.bantDot,
      background: n <= 5 ? "#dc2626" : "#eef1f5"
    }
  }))))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Besoin exprim\xE9 / probl\xE8me \xE0 r\xE9soudre"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: npStyles.textarea,
    rows: "3",
    defaultValue: "Modernisation de l'outil de gestion patrimoniale. Pega jug\xE9 trop lourd et non-conforme DORA. Recherche d'une solution avec h\xE9bergement UE, time-to-value < 6 mois, et expertise vertical banque priv\xE9e."
  })), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Concurrent actuel"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...npStyles.compChip,
      background: "#e8f8f1",
      borderColor: "#0e7a55",
      color: "#0e7a55",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      padding: "1px 4px",
      background: "#0e7a55",
      color: "#fff",
      borderRadius: 3
    }
  }, "PG"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "Pega Platform Cloud")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Fin de contrat : 30 juin 2026 \xB7 218 k\u20AC/an")), /*#__PURE__*/React.createElement(FormRow, {
    label: "\xC9ch\xE9ance estim\xE9e du projet"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.dateInput
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace"
    },
    defaultValue: "Septembre 2026"
  }))))), /*#__PURE__*/React.createElement("section", {
    style: npStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "04",
    title: "Origine & prochaines \xE9tapes",
    subtitle: "Comment ce prospect est-il arriv\xE9 et que faire ensuite ?",
    status: "todo"
  }), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Source du prospect",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.select
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\u25F7"), /*#__PURE__*/React.createElement("span", null, "Radar fin de contrat concurrent")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\u25BE")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "D\xE9tect\xE9 automatiquement le 18 mai")), /*#__PURE__*/React.createElement(FormRow, {
    label: "Date de prise de contact"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.dateInput
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace"
    },
    defaultValue: "20 mai 2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Premier email envoy\xE9 \xB7 r\xE9ponse positive 23 mai"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Owner attribu\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.linkedCardMini
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Karim Ben Salah",
    size: 26,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Karim Ben Salah"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "AE Senior \xB7 Cyber \u2014 r\xE9gion SE")), /*#__PURE__*/React.createElement("button", {
    style: npStyles.changeBtn
  }, "Changer"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Premi\xE8re action \xE0 mener",
    subtitle: "L'IA proposera un brouillon bas\xE9 sur le contexte"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.actionRadios
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...npStyles.actionRadio,
      ...npStyles.actionRadioOn
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "next",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCE7 Email d'introduction personnalis\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Brouillon IA pr\xEAt : \xAB DORA + fin contrat Pega \xBB"))), /*#__PURE__*/React.createElement("label", {
    style: npStyles.actionRadio
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "next"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCDE Cold call programm\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Script g\xE9n\xE9r\xE9 \xB7 slot calendrier sugg\xE9r\xE9"))), /*#__PURE__*/React.createElement("label", {
    style: npStyles.actionRadio
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "next"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "in Demande de connexion LinkedIn"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Via Sales Navigator"))), /*#__PURE__*/React.createElement("label", {
    style: npStyles.actionRadio
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "next"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCC5 Inviter \xE0 un \xE9v\xE9nement"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Webinar DORA \xB7 12 juin"))))), /*#__PURE__*/React.createElement(FormRow, {
    label: "\xC9tiquettes"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: npStyles.tag
  }, "# Radar-2026"), /*#__PURE__*/React.createElement("span", {
    style: npStyles.tag
  }, "# Banque-priv\xE9e"), /*#__PURE__*/React.createElement("span", {
    style: npStyles.tag
  }, "# Displacement-Pega"), /*#__PURE__*/React.createElement("span", {
    style: npStyles.tag
  }, "# DORA"), /*#__PURE__*/React.createElement("span", {
    style: npStyles.tag
  }, "# Sud-EMEA"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.addChip
  }, "+"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Notes internes",
    subtitle: "Contexte additionnel, contacts mutuels, anecdotes\u2026"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: npStyles.textarea,
    rows: "3",
    defaultValue: "Nadia conna\xEEt Laurent via Salon Finovate 2024. Il est en charge du chantier modernisation lanc\xE9 par le nouveau CIO arriv\xE9 en janvier. Le nouveau DG (Jean-Luc Pichon) est ex-AXA \u2014 r\xE9f\xE9rence Astorya via cercle commun."
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.actionsRow
  }, /*#__PURE__*/React.createElement("button", {
    style: npStyles.ghostBtn
  }, "Annuler"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: npStyles.ghostBtn
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.ghostBtn
  }, "+ Ajouter un autre contact"), /*#__PURE__*/React.createElement("button", {
    style: npStyles.primaryBtn
  }, "\u2713 Cr\xE9er le prospect")))), /*#__PURE__*/React.createElement("aside", {
    style: npStyles.previewCol
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.previewBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.previewHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase"
    }
  }, "Aper\xE7u fiche"), /*#__PURE__*/React.createElement("span", {
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
    style: npStyles.previewCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.previewLogo
  }, "BM"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Banque M\xE9ridionale"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.tierBadge,
      background: "#fef3c7",
      color: "#a16207",
      border: "1px solid #fde68a"
    }
  }, "\u2605 A")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 2
    }
  }, "Banque priv\xE9e \xB7 1 200 emp."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 1
    }
  }, "\uD83D\uDCCD Marseille \xB7 CA 142 M\u20AC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "Contact principal"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Laurent Mercier",
    size: 28,
    color: "#dc2626"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Laurent Mercier ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      padding: "0 4px",
      background: "#fdecec",
      color: "#dc2626",
      borderRadius: 3,
      fontWeight: 700,
      marginLeft: 4
    }
  }, "\u2605 D\xC9CIDEUR")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "DSI \xB7 C-level")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4
    }
  }, "Score qualification"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#10b981",
      letterSpacing: -0.6
    }
  }, "87"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "/ 100"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 999,
      background: "#e8f8f1",
      color: "#0e7a55",
      fontWeight: 700,
      marginLeft: "auto"
    }
  }, "HOT")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: 4,
      background: "#eef1f5",
      borderRadius: 999,
      marginTop: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "87%",
      height: "100%",
      background: "linear-gradient(90deg, #4f46e5, #10b981)",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Karim Ben Salah",
    size: 20,
    color: "#6366f1"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569"
    }
  }, "Owner : ", /*#__PURE__*/React.createElement("strong", null, "Karim Ben Salah"))))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.previewBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 999,
      background: "#0f172a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Enrichissement IA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b"
    }
  }, "Sources externes crois\xE9es automatiquement"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.aiSource
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.aiSourceIcon,
      background: "#0a66c2",
      color: "#fff"
    }
  }, "in"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "LinkedIn Sales Navigator"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 1
    }
  }, "1 200 employ\xE9s \xB7 8 nouvelles embauches IT 30j")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.statusOk
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.aiSource
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.aiSourceIcon,
      background: "#f59e0b",
      color: "#fff"
    }
  }, "S"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Base SIRENE / Pappers"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 1
    }
  }, "SIREN, NAF, dirigeants, bilans 2022-2024")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.statusOk
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.aiSource
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.aiSourceIcon,
      background: "#dc2626",
      color: "#fff"
    }
  }, "\uD83D\uDCF0"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Veille presse sp\xE9cialis\xE9e"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 1
    }
  }, "3 articles : \xAB insatisfaction CRM \xBB, \xAB budget IT en hausse \xBB")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.statusOk
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.aiSource
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.aiSourceIcon,
      background: "#a855f7",
      color: "#fff"
    }
  }, "\u25F7"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Radar concurrentiel"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 1
    }
  }, "Pega \u2014 fin contrat 30/06 \xB7 notice \xE9chue 01/05")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.statusOk
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.aiSourcePending
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.aiSourceIcon,
      background: "#eef1f5",
      color: "#94a3b8"
    }
  }, "\u21BB"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#94a3b8"
    }
  }, "Crawl site web entreprise"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 1
    }
  }, "Stack tech, partenaires, dirigeants\u2026")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#a855f7",
      fontWeight: 600
    }
  }, "En cours"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...npStyles.previewBlock,
      background: "#fffbeb",
      borderColor: "#fde68a"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\u26A0"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#a65f00"
    }
  }, "Doublons potentiels")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569",
      lineHeight: 1.5,
      marginBottom: 8
    }
  }, "Aucun doublon exact d\xE9tect\xE9. ", /*#__PURE__*/React.createElement("strong", null, "1 entreprise similaire"), " dans votre base :"), /*#__PURE__*/React.createElement("div", {
    style: npStyles.dupRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 6,
      background: "#475569",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9,
      fontWeight: 700
    }
  }, "BM"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Banque M\xE9ridional", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#dc2626"
    }
  }, "e"), " SA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, "Lost 2024 \xB7 Tom Verdier")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...npStyles.smBtn,
      fontSize: 10.5
    }
  }, "Voir"))))));
};

// ───── helpers
var SectionHead = ({
  num,
  title,
  subtitle,
  status
}) => {
  var statusMeta = {
    done: {
      bg: "#e8f8f1",
      color: "#0e7a55",
      icon: "✓"
    },
    active: {
      bg: "#eef2ff",
      color: "#4f46e5",
      icon: num
    },
    todo: {
      bg: "#fafbfc",
      color: "#94a3b8",
      icon: num
    }
  };
  var s = statusMeta[status];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: s.bg,
      color: s.color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0
    }
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: -0.2
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, subtitle)));
};
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
var npStyles = {
  frame: {
    width: 1440,
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column"
  },
  topbar: {
    padding: "14px 28px",
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
    marginLeft: 4
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
    padding: "7px 16px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12.5,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(79,70,229,0.3)"
  },
  titleRow: {
    padding: "20px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eef1f5",
    background: "#fff"
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.7,
    margin: 0,
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0"
  },
  completion: {
    padding: "10px 14px",
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 8
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 0,
    padding: 20,
    gridAutoRows: "min-content"
  },
  formCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    paddingRight: 14
  },
  section: {
    padding: 20,
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
  inputWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff"
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
  linkTag: {
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 3,
    background: "#fafbfc",
    border: "1px solid currentColor",
    whiteSpace: "nowrap"
  },
  searchInputWrap: {
    position: "relative"
  },
  searchTag: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 4,
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 600
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12
  },
  formGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12
  },
  segCtrl: {
    display: "inline-flex",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 2,
    background: "#fff"
  },
  segBtn: {
    padding: "5px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  segBtnActive: {
    background: "#0f172a",
    color: "#fff",
    fontWeight: 600
  },
  tierRow: {
    display: "flex",
    gap: 6
  },
  tierBtn: {
    width: 40,
    padding: "6px 0",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "center"
  },
  tierBadge: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.4
  },
  roleChip: {
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500
  },
  roleChipOn: {
    background: "#fef3c7",
    borderColor: "#fbbf24",
    color: "#a16207",
    fontWeight: 700
  },
  compChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    border: "1px solid",
    borderRadius: 6,
    fontSize: 11.5
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
  // BANT
  bantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 14
  },
  bantCard: {
    padding: 12,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  bantLetter: {
    width: 26,
    height: 26,
    borderRadius: 7,
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700
  },
  bantRating: {
    display: "flex",
    gap: 3,
    marginTop: 8
  },
  bantDot: {
    width: 14,
    height: 5,
    borderRadius: 2,
    display: "inline-block"
  },
  // Action radios
  actionRadios: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8
  },
  actionRadio: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer"
  },
  actionRadioOn: {
    background: "linear-gradient(180deg, #fafbff, #fff)",
    borderColor: "#4f46e5",
    boxShadow: "0 0 0 3px rgba(79,70,229,0.08)"
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
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    marginTop: 4
  },
  // Preview column
  previewCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    position: "sticky",
    top: 20,
    alignSelf: "start"
  },
  previewBlock: {
    padding: 16,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 12
  },
  previewHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  previewCard: {
    padding: 14,
    background: "linear-gradient(180deg, #fafbfc, #fff)",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  previewLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: "linear-gradient(135deg, #475569, #1e293b)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.4,
    flexShrink: 0
  },
  aiSource: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  aiSourcePending: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    opacity: 0.7
  },
  aiSourceIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0
  },
  statusOk: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: 700
  },
  dupRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: 8,
    background: "#fff",
    border: "1px solid #fde68a",
    borderRadius: 6
  },
  smBtn: {
    padding: "3px 9px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 5,
    fontSize: 11,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500
  }
};
window.NewProspect = NewProspect;