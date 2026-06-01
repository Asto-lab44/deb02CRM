// Fiche nouveau prospect — formulaire de qualification

var NewProspect = () => {
  // ───── État UI interactif (segments, chips, action) — fiche neuve, tout vide
  var [effectif, setEffectif] = React.useState(null);
  var [tier, setTier] = React.useState(null);
  var [fonction, setFonction] = React.useState(null);
  var [roles, setRoles] = React.useState([]);
  var [action, setAction] = React.useState(null);
  var [ca, setCa] = React.useState("");
  var [contactPrenom, setContactPrenom] = React.useState("");
  var [contactNom, setContactNom] = React.useState("");
  var [contactRole, setContactRole] = React.useState("");
  var [contactEmail, setContactEmail] = React.useState("");
  var [contactPhone, setContactPhone] = React.useState("");
  var [contactLi, setContactLi] = React.useState("");
  var [besoin, setBesoin] = React.useState("");
  var [notes, setNotes] = React.useState("");
  var [source, setSource] = React.useState("");
  var [contactDate, setContactDate] = React.useState("");
  var [projectDate, setProjectDate] = React.useState("");
  var [concurrent, setConcurrent] = React.useState("");
  var [concurrentEnd, setConcurrentEnd] = React.useState("");
  var [concurrentAmount, setConcurrentAmount] = React.useState("");
  var [owner, setOwner] = React.useState({
    name: "Karim Ben Salah",
    role: "AE Senior · Cyber — région SE",
    color: "#6366f1"
  });
  var [ownerMenu, setOwnerMenu] = React.useState(false);
  var ownerList = [{
    name: "Nadia Lefèvre",
    role: "AE Senior · EMEA",
    color: "#a855f7"
  }, {
    name: "Karim Ben Salah",
    role: "AE Senior · Cyber — région SE",
    color: "#6366f1"
  }, {
    name: "Tom Verdier",
    role: "AE Hub",
    color: "#f59e0b"
  }, {
    name: "Émilie Garnier",
    role: "AE BENELUX",
    color: "#10b981"
  }];
  React.useEffect(() => {
    if (!ownerMenu) return;
    var close = () => setOwnerMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ownerMenu]);
  var [extraContactList, setExtraContactList] = React.useState([]); // [{prenom, nom, fonction, email, phone}]
  var addExtraContact = () => setExtraContactList(l => [...l, {
    prenom: "",
    nom: "",
    fonction: "",
    email: "",
    phone: ""
  }]);
  var removeExtraContact = i => setExtraContactList(l => l.filter((_, idx) => idx !== i));
  var updateExtraContact = (i, field, value) => setExtraContactList(l => l.map((c, idx) => idx === i ? {
    ...c,
    [field]: value
  } : c));
  var [extraContacts, setExtraContacts] = React.useState(0);
  var [flash, setFlash] = React.useState(null);

  // ───── Auto-complétion SIRENE (recherche-entreprises.api.gouv.fr)
  var [companyName, setCompanyName] = React.useState("");
  var [companySiren, setCompanySiren] = React.useState("");
  var [companyNaf, setCompanyNaf] = React.useState("");
  var [companyTva, setCompanyTva] = React.useState("");
  var [companyAddress, setCompanyAddress] = React.useState("");
  var [companyCity, setCompanyCity] = React.useState("");
  var [companyCP, setCompanyCP] = React.useState("");
  var [companySector, setCompanySector] = React.useState("");
  var [companySubSect, setCompanySubSect] = React.useState("");
  var [companyWeb, setCompanyWeb] = React.useState("");
  var [companyLi, setCompanyLi] = React.useState("");
  var [siretResults, setSiretResults] = React.useState([]);
  var [siretLoading, setSiretLoading] = React.useState(false);
  var [siretOpen, setSiretOpen] = React.useState(false);

  // Mapping section NAF (lettre) → libellé secteur
  var sectionLabels = {
    A: "Agriculture, sylviculture et pêche",
    B: "Industries extractives",
    C: "Industrie manufacturière",
    D: "Production et distribution d'électricité",
    E: "Eau, déchets et dépollution",
    F: "Construction & BTP",
    G: "Commerce",
    H: "Transports et entreposage",
    I: "Hébergement et restauration",
    J: "Information et communication",
    K: "Banque, finance & assurance",
    L: "Activités immobilières",
    M: "Activités spécialisées, scientifiques et techniques",
    N: "Services administratifs et de soutien",
    O: "Administration publique",
    P: "Enseignement",
    Q: "Santé et action sociale",
    R: "Arts, spectacles et activités récréatives",
    S: "Autres activités de services",
    T: "Activités des ménages",
    U: "Activités extra-territoriales"
  };

  // Sous-secteur dérivé de la division NAF (2 premiers chiffres)
  var subSectorByDivision = {
    "62": "Programmation et conseil informatique",
    "63": "Services d'information",
    "64": "Activités financières",
    "65": "Assurance",
    "66": "Activités auxiliaires de services financiers",
    "70": "Conseil de direction",
    "71": "Architecture, ingénierie",
    "72": "Recherche et développement",
    "73": "Publicité, études de marché",
    "74": "Autres activités spécialisées"
  };

  // Slug pour deviner site web / LinkedIn depuis le nom
  var slugify = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Mapping tranche_effectif_salarie INSEE → mes 5 buckets
  var mapEffectif = code => {
    if (!code) return null;
    if (["NN", "00", "01", "02", "03", "11", "12"].includes(code)) return "1-50";
    if (["21", "22"].includes(code)) return "51-250";
    if (["31", "32"].includes(code)) return "251-1k";
    if (["41", "42"].includes(code)) return "1k-5k";
    return "5k+";
  };

  // Calcule la clé TVA intracom FR à partir du SIREN
  var computeTva = siren => {
    var clean = String(siren).replace(/\D/g, "");
    if (clean.length !== 9) return "";
    var key = (12 + 3 * (parseInt(clean, 10) % 97)) % 97;
    return "FR" + String(key).padStart(2, "0") + clean;
  };
  var formatSiren = s => {
    var c = String(s).replace(/\D/g, "");
    return c.length === 9 ? `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 9)}` : c;
  };

  // Debounce 300ms sur la recherche
  var siretTimer = React.useRef(null);
  React.useEffect(() => {
    if (siretTimer.current) clearTimeout(siretTimer.current);
    var q = (companyName || "").trim();
    if (q.length < 3) {
      setSiretResults([]);
      return;
    }
    siretTimer.current = setTimeout(async () => {
      setSiretLoading(true);
      try {
        var r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=6`);
        var j = await r.json();
        setSiretResults(Array.isArray(j.results) ? j.results : []);
      } catch (e) {
        setSiretResults([]);
      }
      setSiretLoading(false);
    }, 300);
    return () => {
      if (siretTimer.current) clearTimeout(siretTimer.current);
    };
  }, [companyName]);
  var pickCompany = e => {
    var siege = e.siege || {};
    var siren = e.siren || "";
    var name = e.nom_complet || e.nom_raison_sociale || siege.denomination_usuelle || "";
    var naf = e.activite_principale || siege.activite_principale || "";
    var section = e.section_activite_principale || siege.section_activite_principale || (naf ? null : null);
    setCompanyName(name);
    setCompanySiren(formatSiren(siren));
    setCompanyNaf(naf);
    setCompanyTva(computeTva(siren));

    // Adresse — privilégie geo_adresse (concaténée), sinon reconstitue
    var addr = siege.geo_adresse || [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ") || siege.adresse || "";
    // On retire la ville + CP en fin de adresse pour ne garder que la rue
    var street = addr;
    if (siege.code_postal) street = street.replace(siege.code_postal, "").trim();
    if (siege.libelle_commune) street = street.replace(new RegExp(siege.libelle_commune, "i"), "").trim();
    street = street.replace(/[\s,]+$/, "");
    setCompanyAddress(street);
    setCompanyCity(siege.libelle_commune || "");
    setCompanyCP(siege.code_postal || "");

    // Secteur (section NAF) + sous-secteur (division NAF)
    if (section && sectionLabels[section]) setCompanySector(sectionLabels[section]);else if (naf) {
      var sec = naf.charAt(0);
      var divCode = naf.slice(0, 2);
      var div = subSectorByDivision[divCode];
      if (div) setCompanySector(div);
    }
    if (naf) {
      var _div = subSectorByDivision[naf.slice(0, 2)];
      setCompanySubSect(_div || naf);
    }

    // Site web et LinkedIn — devinés depuis le nom (à corriger manuellement si besoin)
    var slug = slugify(name);
    if (slug) {
      setCompanyWeb(slug + ".fr");
      setCompanyLi("linkedin.com/company/" + slug);
    }
    var mapped = mapEffectif(e.tranche_effectif_salarie || siege.tranche_effectif_salarie);
    if (mapped) setEffectif(mapped);
    setSiretOpen(false);
    setSiretResults([]);
    showFlash("✓ Entreprise importée depuis SIRENE");
  };
  var showFlash = (msg, tone = "ok") => {
    setFlash({
      msg,
      tone
    });
    setTimeout(() => setFlash(null), 2800);
  };
  var toggleRole = r => setRoles(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]);
  var cancel = () => {
    if (confirm("Abandonner ce prospect ? Toutes les saisies non enregistrées seront perdues.")) {
      window.location.href = "/crm";
    }
  };

  // Construit le payload complet à partir de tous les champs du formulaire
  var buildPayload = () => ({
    id: "ACC-" + Math.floor(Math.random() * 9000 + 1000),
    raison_sociale: companyName,
    siren: companySiren,
    naf: companyNaf,
    tva: companyTva,
    adresse: companyAddress,
    code_postal: companyCP,
    ville: companyCity,
    secteur: companySector,
    sous_secteur: companySubSect,
    site_web: companyWeb,
    linkedin_entreprise: companyLi,
    effectif,
    tier,
    fonction,
    roles,
    action,
    contact_principal: {
      prenom: contactPrenom,
      nom: contactNom,
      fonction: contactRole,
      email: contactEmail,
      phone: contactPhone,
      linkedin: contactLi
    },
    contacts_additionnels: extraContactList,
    source,
    project_date: projectDate,
    concurrent,
    concurrent_end: concurrentEnd,
    concurrent_amount: concurrentAmount,
    besoin,
    notes,
    owner: owner.name,
    owner_role: owner.role,
    owner_color: owner.color,
    created_at: new Date().toISOString(),
    status: "prospect"
  });
  var saveDraft = () => {
    try {
      localStorage.setItem("hubAstorya.prospectDraft.v1", JSON.stringify(buildPayload()));
    } catch (e) {}
    showFlash("✓ Brouillon enregistré localement");
  };
  var createProspect = async () => {
    if (!companyName.trim()) {
      showFlash("La raison sociale est obligatoire", "err");
      return;
    }
    var payload = buildPayload();

    // 1. Append au localStorage "hubAstorya.prospects.v1" (liste partagée avec la vue Comptes)
    try {
      var existing = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      existing.unshift(payload);
      localStorage.setItem("hubAstorya.prospects.v1", JSON.stringify(existing));
      localStorage.removeItem("hubAstorya.prospectDraft.v1");
    } catch (e) {}

    // 2. Insertion Supabase si configuré (best-effort)
    if (window.HubData && window.HubData.enabled()) {
      try {
        await window.HubSupabase.client.from("clients").insert({
          id: payload.id,
          name: companyName,
          industry: companySector || null,
          city: companyCity || null,
          website: companyWeb || null
        });
      } catch (e) {/* tolère l'échec, le local survit */}
    }
    showFlash("✓ Prospect créé — redirection vers Comptes & Contacts…");
    setTimeout(() => {
      window.location.href = "/crm#comptes";
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
  }, /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "#64748b",
      textDecoration: "none"
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
      gap: 8,
      alignItems: "center"
    }
  }, flash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 6,
      background: flash.tone === "err" ? "#fee2e2" : "#dcfce7",
      color: flash.tone === "err" ? "#991b1b" : "#065f46"
    }
  }, flash.msg), /*#__PURE__*/React.createElement("button", {
    onClick: cancel,
    style: {
      ...npStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: saveDraft,
    style: {
      ...npStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    onClick: createProspect,
    style: {
      ...npStyles.primaryBtn,
      cursor: "pointer"
    }
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
    style: {
      ...npStyles.searchInputWrap,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: companyName,
    onChange: e => {
      setCompanyName(e.target.value);
      setSiretOpen(true);
    },
    onFocus: () => setSiretOpen(true),
    onBlur: () => setTimeout(() => setSiretOpen(false), 150),
    placeholder: "Tapez le nom de l'entreprise ou un SIREN\u2026"
  }), /*#__PURE__*/React.createElement("span", {
    style: npStyles.searchTag
  }, siretLoading ? "⏳ Recherche…" : "🔍 Auto-complété via base SIRENE"), siretOpen && siretResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 8px 20px rgba(0,0,0,.08)",
      zIndex: 20,
      maxHeight: 320,
      overflowY: "auto"
    }
  }, siretResults.map(e => {
    var siege = e.siege || {};
    return /*#__PURE__*/React.createElement("div", {
      key: e.siren,
      onMouseDown: () => pickCompany(e),
      style: {
        padding: "10px 12px",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer",
        display: "flex",
        alignItems: "flex-start",
        gap: 10
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
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, e.nom_complet || e.nom_raison_sociale), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 2
      }
    }, "SIREN ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, formatSiren(e.siren)), siege.libelle_commune && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", siege.libelle_commune), e.activite_principale && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 NAF ", e.activite_principale))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#3730a3",
        fontWeight: 700
      }
    }, "\u21B5"));
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid3
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "SIREN",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    value: companySiren,
    onChange: e => {
      setCompanySiren(e.target.value);
      var t = computeTva(e.target.value);
      if (t) setCompanyTva(t);
    }
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Code NAF"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    value: companyNaf,
    onChange: e => setCompanyNaf(e.target.value)
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "TVA intracom."
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace"
    },
    value: companyTva,
    onChange: e => setCompanyTva(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Secteur d'activit\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    style: npStyles.input,
    value: companySector,
    onChange: e => setCompanySector(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 S\xE9lectionner un secteur \u2014"), Object.entries(sectionLabels).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, v)))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Sous-secteur"
  }, /*#__PURE__*/React.createElement("select", {
    style: npStyles.input,
    value: companySubSect,
    onChange: e => setCompanySubSect(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 S\xE9lectionner un sous-secteur \u2014"), Object.entries(subSectorByDivision).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Effectif",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.segCtrl
  }, ["1-50", "51-250", "251-1k", "1k-5k", "5k+"].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setEffectif(v),
    style: {
      ...npStyles.segBtn,
      ...(effectif === v ? npStyles.segBtnActive : {}),
      cursor: "pointer"
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Source SIRENE : 1 200 collaborateurs")), /*#__PURE__*/React.createElement(FormRow, {
    label: "Tier prospect"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.tierRow
  }, ["A", "B", "C"].map(v => {
    var on = tier === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => setTier(v),
      style: {
        ...npStyles.tierBtn,
        ...(on ? {
          background: "#fef3c7",
          color: "#a16207",
          border: "1.5px solid #fde68a",
          fontWeight: 700
        } : {
          background: "#fff",
          color: "#64748b"
        }),
        cursor: "pointer"
      }
    }, on && "★ ", v);
  })), /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, tier === "A" ? "Grand compte stratégique" : tier === "B" ? "Compte secondaire" : "Compte tactique"))), /*#__PURE__*/React.createElement("div", {
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
    value: companyWeb,
    onChange: e => setCompanyWeb(e.target.value),
    placeholder: "exemple.fr"
  }), companyWeb && /*#__PURE__*/React.createElement("a", {
    href: companyWeb.startsWith("http") ? companyWeb : "https://" + companyWeb.replace(/^\/+/, ""),
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      ...npStyles.linkTag,
      color: "#10b981",
      textDecoration: "none",
      cursor: "pointer"
    },
    title: "Ouvrir le site"
  }, "\u2197"))), /*#__PURE__*/React.createElement(FormRow, {
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
    value: companyLi,
    onChange: e => setCompanyLi(e.target.value),
    placeholder: "linkedin.com/company/\u2026"
  }), companyLi && /*#__PURE__*/React.createElement("a", {
    href: companyLi.startsWith("http") ? companyLi : "https://" + companyLi.replace(/^\/+/, ""),
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      ...npStyles.linkTag,
      color: "#0a66c2",
      textDecoration: "none",
      cursor: "pointer"
    },
    title: "Ouvrir la page LinkedIn"
  }, "\u2197")))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Adresse si\xE8ge"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: companyAddress,
    onChange: e => setCompanyAddress(e.target.value),
    placeholder: "Adresse"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "100px 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: companyCP,
    onChange: e => setCompanyCP(e.target.value),
    placeholder: "CP"
  }), /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: companyCity,
    onChange: e => setCompanyCity(e.target.value),
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
    value: contactPrenom,
    onChange: e => setContactPrenom(e.target.value)
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Nom",
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: contactNom,
    onChange: e => setContactNom(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Fonction",
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    style: npStyles.input,
    value: contactRole,
    onChange: e => setContactRole(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir une fonction \u2014"), /*#__PURE__*/React.createElement("option", null, "CEO / Directeur g\xE9n\xE9ral"), /*#__PURE__*/React.createElement("option", null, "COO / Directeur des op\xE9rations"), /*#__PURE__*/React.createElement("option", null, "CFO / Directeur financier"), /*#__PURE__*/React.createElement("option", null, "CTO / Directeur technique"), /*#__PURE__*/React.createElement("option", null, "CIO / DSI"), /*#__PURE__*/React.createElement("option", null, "CISO / RSSI"), /*#__PURE__*/React.createElement("option", null, "CMO / Directeur marketing"), /*#__PURE__*/React.createElement("option", null, "CHRO / DRH"), /*#__PURE__*/React.createElement("option", null, "Directeur des achats"), /*#__PURE__*/React.createElement("option", null, "Directeur de la transformation digitale"), /*#__PURE__*/React.createElement("option", null, "Responsable IT / Manager SI"), /*#__PURE__*/React.createElement("option", null, "Responsable infrastructure"), /*#__PURE__*/React.createElement("option", null, "Chef de projet"), /*#__PURE__*/React.createElement("option", null, "Architecte SI"), /*#__PURE__*/React.createElement("option", null, "Consultant / Expert"), /*#__PURE__*/React.createElement("option", null, "Acheteur"), /*#__PURE__*/React.createElement("option", null, "Juriste / DPO"), /*#__PURE__*/React.createElement("option", null, "Autre \u2014 pr\xE9ciser dans notes"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Niveau hi\xE9rarchique"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.segCtrl
  }, ["Opér.", "Mgr", "Dir.", "C-level"].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setFonction(v),
    style: {
      ...npStyles.segBtn,
      ...(fonction === v ? npStyles.segBtnActive : {}),
      cursor: "pointer"
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
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
    type: "email",
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5
    },
    value: contactEmail,
    onChange: e => setContactEmail(e.target.value)
  }), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.linkTag,
      color: "#10b981"
    }
  }, "\u2713 Format ok"))), /*#__PURE__*/React.createElement(FormRow, {
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
    value: contactPhone,
    onChange: e => setContactPhone(e.target.value)
  })))), /*#__PURE__*/React.createElement(FormRow, {
    label: "R\xF4le dans le projet",
    subtitle: "Quelle place dans la d\xE9cision d'achat ?"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Décideur", "Champion", "Prescripteur", "Utilisateur", "Acheteur", "Bloqueur"].map(r => {
    var on = roles.includes(r);
    return /*#__PURE__*/React.createElement("button", {
      key: r,
      onClick: () => toggleRole(r),
      style: {
        ...npStyles.roleChip,
        ...(on ? npStyles.roleChipOn : {}),
        cursor: "pointer"
      }
    }, on && "★ ", r);
  }))), /*#__PURE__*/React.createElement(FormRow, {
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
    value: contactLi,
    onChange: e => setContactLi(e.target.value),
    placeholder: "linkedin.com/in/\u2026"
  }), contactLi && /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.linkTag,
      color: "#4f46e5"
    }
  }, "\u2197"))), extraContactList.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginTop: 16,
      padding: 14,
      background: "#f8fafc",
      border: "1px dashed #cbd5e1",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Contact additionnel #", i + 2), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeExtraContact(i),
    style: {
      background: "transparent",
      border: 0,
      color: "#dc2626",
      fontSize: 12,
      cursor: "pointer",
      fontWeight: 600
    }
  }, "\u2715 Retirer")), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Pr\xE9nom"
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: c.prenom,
    onChange: e => updateExtraContact(i, "prenom", e.target.value)
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Nom"
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: c.nom,
    onChange: e => updateExtraContact(i, "nom", e.target.value)
  }))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Fonction"
  }, /*#__PURE__*/React.createElement("select", {
    style: npStyles.input,
    value: c.fonction,
    onChange: e => updateExtraContact(i, "fonction", e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir \u2014"), /*#__PURE__*/React.createElement("option", null, "CEO / Directeur g\xE9n\xE9ral"), /*#__PURE__*/React.createElement("option", null, "CFO / Directeur financier"), /*#__PURE__*/React.createElement("option", null, "CIO / DSI"), /*#__PURE__*/React.createElement("option", null, "CTO / Directeur technique"), /*#__PURE__*/React.createElement("option", null, "CMO / Directeur marketing"), /*#__PURE__*/React.createElement("option", null, "CHRO / DRH"), /*#__PURE__*/React.createElement("option", null, "Chef de projet"), /*#__PURE__*/React.createElement("option", null, "Acheteur"), /*#__PURE__*/React.createElement("option", null, "Consultant / Expert"), /*#__PURE__*/React.createElement("option", null, "Autre"))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Email"
  }, /*#__PURE__*/React.createElement("input", {
    type: "email",
    style: npStyles.input,
    value: c.email,
    onChange: e => updateExtraContact(i, "email", e.target.value)
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "T\xE9l\xE9phone"
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: c.phone,
    onChange: e => updateExtraContact(i, "phone", e.target.value)
  })))))), /*#__PURE__*/React.createElement("section", {
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
    value: besoin,
    onChange: e => setBesoin(e.target.value),
    placeholder: "Modernisation, contraintes, contexte concurrentiel\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: npStyles.formGrid2
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Concurrent actuel"
  }, /*#__PURE__*/React.createElement("input", {
    style: npStyles.input,
    value: concurrent,
    onChange: e => setConcurrent(e.target.value),
    placeholder: "Ex. Salesforce, Pega, HubSpot\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    style: {
      ...npStyles.input,
      fontFamily: "'JetBrains Mono', monospace",
      flex: 1
    },
    value: concurrentEnd,
    onChange: e => setConcurrentEnd(e.target.value),
    title: "Fin de contrat concurrent"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...npStyles.inputWithSuffix,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      border: "none",
      padding: "0 4px"
    },
    value: concurrentAmount,
    onChange: e => setConcurrentAmount(e.target.value),
    placeholder: "Montant"
  }), /*#__PURE__*/React.createElement("span", {
    style: npStyles.suffix
  }, "k\u20AC/an"))), (concurrentEnd || concurrentAmount) && /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, concurrentEnd && `Fin de contrat : ${new Date(concurrentEnd).toLocaleDateString("fr-FR")}`, concurrentEnd && concurrentAmount && " · ", concurrentAmount && `${concurrentAmount} k€/an`)), /*#__PURE__*/React.createElement(FormRow, {
    label: "\xC9ch\xE9ance estim\xE9e du projet"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.dateInput
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    style: {
      ...npStyles.input,
      border: "none",
      padding: 0,
      fontFamily: "'JetBrains Mono', monospace"
    },
    value: projectDate,
    onChange: e => setProjectDate(e.target.value)
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
  }, /*#__PURE__*/React.createElement("select", {
    style: npStyles.input,
    value: source,
    onChange: e => setSource(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir une source \u2014"), /*#__PURE__*/React.createElement("option", null, "Radar fin de contrat concurrent"), /*#__PURE__*/React.createElement("option", null, "LinkedIn / Sales Navigator"), /*#__PURE__*/React.createElement("option", null, "Salon professionnel"), /*#__PURE__*/React.createElement("option", null, "Recommandation client"), /*#__PURE__*/React.createElement("option", null, "Inbound site web"), /*#__PURE__*/React.createElement("option", null, "Demande de devis"), /*#__PURE__*/React.createElement("option", null, "Cold call sortant"), /*#__PURE__*/React.createElement("option", null, "Cold email sortant"), /*#__PURE__*/React.createElement("option", null, "Webinar / \xE9v\xE9nement Astorya"), /*#__PURE__*/React.createElement("option", null, "R\xE9f\xE9rencement (Google, Bing)"), /*#__PURE__*/React.createElement("option", null, "R\xE9seau partenaires"), /*#__PURE__*/React.createElement("option", null, "Article de presse"), /*#__PURE__*/React.createElement("option", null, "Autre")), source && /*#__PURE__*/React.createElement("div", {
    style: npStyles.inputHelp
  }, "Source enregistr\xE9e : ", source))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Owner attribu\xE9",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.linkedCardMini
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: owner.name,
    size: 26,
    color: owner.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, owner.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, owner.role)), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setOwnerMenu(v => !v);
    },
    style: {
      ...npStyles.changeBtn,
      cursor: "pointer"
    }
  }, "Changer \u25BE")), ownerMenu && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 4,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      zIndex: 1000,
      minWidth: 280,
      padding: 4
    }
  }, ownerList.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.name,
    onClick: () => {
      setOwner(o);
      setOwnerMenu(false);
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "8px 10px",
      border: "none",
      borderRadius: 6,
      background: owner.name === o.name ? "#eef2ff" : "transparent",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: o.name,
    size: 24,
    color: o.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, o.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, o.role)), owner.name === o.name && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4f46e5",
      fontSize: 14
    }
  }, "\u2713")))))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Premi\xE8re action \xE0 mener",
    subtitle: "L'IA proposera un brouillon bas\xE9 sur le contexte"
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.actionRadios
  }, [{
    k: "email",
    title: "📧 Email d'introduction personnalisé",
    hint: "Brouillon IA prêt : « DORA + fin contrat Pega »"
  }, {
    k: "call",
    title: "📞 Cold call programmé",
    hint: "Script généré · slot calendrier suggéré"
  }, {
    k: "in",
    title: "in Demande de connexion LinkedIn",
    hint: "Via Sales Navigator"
  }, {
    k: "event",
    title: "📅 Inviter à un événement",
    hint: "Webinar DORA · 12 juin"
  }].map(a => {
    var on = action === a.k;
    return /*#__PURE__*/React.createElement("label", {
      key: a.k,
      onClick: () => setAction(a.k),
      style: {
        ...npStyles.actionRadio,
        ...(on ? npStyles.actionRadioOn : {}),
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "next",
      checked: on,
      onChange: () => setAction(a.k)
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, a.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2
      }
    }, a.hint)));
  }))), /*#__PURE__*/React.createElement(FormRow, {
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
    onClick: () => {
      var t = prompt("Nouvelle étiquette :");
      if (t) showFlash("✓ Étiquette « " + t + " » ajoutée");
    },
    style: {
      ...npStyles.addChip,
      cursor: "pointer"
    }
  }, "+"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Notes internes",
    subtitle: "Contexte additionnel, contacts mutuels, anecdotes\u2026"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: npStyles.textarea,
    rows: "3",
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Contexte additionnel, contacts mutuels, anecdotes\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.actionsRow
  }, /*#__PURE__*/React.createElement("button", {
    onClick: cancel,
    style: {
      ...npStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, flash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 6,
      background: flash.tone === "err" ? "#fee2e2" : "#dcfce7",
      color: flash.tone === "err" ? "#991b1b" : "#065f46"
    }
  }, flash.msg), /*#__PURE__*/React.createElement("button", {
    onClick: saveDraft,
    style: {
      ...npStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Enregistrer brouillon"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      addExtraContact();
      showFlash("✓ Contact additionnel ajouté");
    },
    style: {
      ...npStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "+ Ajouter un autre contact", extraContactList.length > 0 && ` (${extraContactList.length})`), /*#__PURE__*/React.createElement("button", {
    onClick: createProspect,
    style: {
      ...npStyles.primaryBtn,
      cursor: "pointer"
    }
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
    name: owner.name,
    size: 20,
    color: owner.color
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#475569"
    }
  }, "Owner : ", /*#__PURE__*/React.createElement("strong", null, owner.name))))), /*#__PURE__*/React.createElement("div", {
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