// Fiche nouveau prospect — formulaire de qualification

var NewProspect = () => {
  // ───── État UI interactif (segments, chips, action) — fiche neuve, tout vide
  var [effectif, setEffectif] = React.useState(null);
  var [tier, setTier] = React.useState(null);
  var [fonction, setFonction] = React.useState(null);
  var [roles, setRoles] = React.useState([]);
  var [action, setAction] = React.useState("email");
  var [ca, setCa] = React.useState("");
  var [contactPrenom, setContactPrenom] = React.useState("");
  var [contactNom, setContactNom] = React.useState("");
  var [contactRole, setContactRole] = React.useState("");
  var [contactEmail, setContactEmail] = React.useState("");
  var [contactPhone, setContactPhone] = React.useState("");
  var [contactLi, setContactLi] = React.useState("");
  var [besoin, setBesoin] = React.useState("");
  var [notes, setNotes] = React.useState("");
  var [tags, setTags] = React.useState([]);
  var [tagMenuOpen, setTagMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (!tagMenuOpen) return;
    var close = () => setTagMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [tagMenuOpen]);
  // Détection live de doublons : nom approchant ou SIREN identique
  var [allClients, setAllClients] = React.useState([]);
  React.useEffect(() => {
    if (!window.api || !window.api.clients) return;
    window.api.clients.list().then(list => setAllClients(list || [])).catch(() => {});
  }, []);
  var [source, setSource] = React.useState("");
  var [contactDate, setContactDate] = React.useState("");
  var [projectDate, setProjectDate] = React.useState("");
  var [concurrent, setConcurrent] = React.useState("");
  var [concurrentAmount, setConcurrentAmount] = React.useState("");
  // Owner par défaut : l'utilisateur connecté (récupéré via HubAccess)
  var ownerList = [{
    name: "Romain Daviaud",
    role: "Super Admin",
    color: "#4f46e5"
  }, {
    name: "Augustin Morin",
    role: "Super Admin",
    color: "#a855f7"
  }];
  var initialOwner = (() => {
    try {
      var u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
      if (u && u.name) return {
        name: u.name,
        role: u.role || "—",
        color: "#4f46e5"
      };
    } catch (e) {}
    return ownerList[0];
  })();
  var [owner, setOwner] = React.useState(initialOwner);
  var [ownerMenu, setOwnerMenu] = React.useState(false);
  React.useEffect(() => {
    if (!ownerMenu) return;
    var close = () => setOwnerMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ownerMenu]);
  var [extraContactList, setExtraContactList] = React.useState([]); // [{prenom, nom, fonction, email, phone}]
  var [contactAutoFilled, setContactAutoFilled] = React.useState(false);
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
  // Résultat du check BODACC procédure collective (persisté en clients.data)
  var [procedureCheck, setProcedureCheck] = React.useState(null);
  // Computed : doublons potentiels
  var duplicates = React.useMemo(() => {
    if (!allClients || allClients.length === 0) return [];
    var q = (companyName || "").trim().toLowerCase();
    var siren = (companySiren || "").replace(/\s/g, "");
    return allClients.filter(c => {
      if (siren && c.siren && c.siren.replace(/\s/g, "") === siren) return true;
      if (q.length >= 3) {
        var n = (c.raison_sociale || c.name || "").toLowerCase();
        if (n.includes(q) || q.includes(n)) return true;
        // Levenshtein-light : nom commence pareil
        if (n.slice(0, Math.min(5, q.length)) === q.slice(0, Math.min(5, n.length))) return true;
      }
      return false;
    }).slice(0, 5);
  }, [allClients, companyName, companySiren]);
  var [companyNaf, setCompanyNaf] = React.useState("");
  var [companyTva, setCompanyTva] = React.useState("");
  var [companyAddress, setCompanyAddress] = React.useState("");
  var [companyCity, setCompanyCity] = React.useState("");
  var [companyCP, setCompanyCP] = React.useState("");
  var [companySector, setCompanySector] = React.useState("");
  var [companySubSect, setCompanySubSect] = React.useState("");
  // Établissements secondaires : chaque entrée = { nom, adresse, cp, ville }
  var [secondaryEstabs, setSecondaryEstabs] = React.useState([]);
  var addSecondaryEstab = () => setSecondaryEstabs(l => [...l, {
    nom: "",
    adresse: "",
    cp: "",
    ville: ""
  }]);
  var removeSecondaryEstab = i => setSecondaryEstabs(l => l.filter((_, idx) => idx !== i));
  var updateSecondaryEstab = (i, field, value) => setSecondaryEstabs(l => l.map((e, idx) => idx === i ? {
    ...e,
    [field]: value
  } : e));
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

  // Réinitialise tous les champs auto-complétés (utilisé par la croix rouge
  // quand l'utilisateur s'est trompé de prospect sélectionné).
  var clearSelection = () => {
    setCompanyName("");
    setCompanySiren("");
    setCompanyNaf("");
    setCompanyTva("");
    setCompanyAddress("");
    setCompanyCity("");
    setCompanyCP("");
    setCompanySector("");
    setCompanySubSect("");
    setCompanyWeb("");
    setCompanyLi("");
    setProcedureCheck(null);
    setSiretResults([]);
    setSiretOpen(false);
    setSecondaryEstabs([]);
    setContactAutoFilled(false);
  };
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

    // Auto-remplissage du contact principal à partir des dirigeants déclarés
    // (open data INSEE/INPI exposé par recherche-entreprises). Seuls
    // prenom/nom/fonction sont disponibles publiquement — email/téléphone
    // restent à compléter manuellement (données personnelles non publiques).
    var dirigeants = Array.isArray(e.dirigeants) ? e.dirigeants.filter(d => d && (d.prenoms || d.prenom || d.nom)) : [];
    var personPhysique = dirigeants.filter(d => (d.type_dirigeant || "personne physique").toLowerCase() === "personne physique");
    var useable = personPhysique.length > 0 ? personPhysique : dirigeants;
    var nbAutoContacts = 0;
    if (useable.length > 0) {
      // Toujours pré-remplir le premier (écrase la saisie utilisateur uniquement
      // si le contact est encore vierge — sinon on ajoute aux co-contacts)
      var d0 = useable[0];
      var prenom0 = (d0.prenoms || d0.prenom || "").split(/\s+/)[0] || "";
      var nom0 = (d0.nom || "").toUpperCase();
      var role0 = mapDirigeantQualite(d0.qualite);
      if (!contactPrenom && !contactNom && !contactEmail && !contactPhone) {
        if (prenom0) setContactPrenom(capitalize(prenom0));
        if (nom0) setContactNom(nom0);
        if (role0) setContactRole(role0);
        // Devine un LinkedIn plausible — éditable
        var liSlug = slugify(prenom0 + "-" + nom0);
        if (liSlug && !contactLi) setContactLi("linkedin.com/in/" + liSlug);
        setContactAutoFilled(true);
        nbAutoContacts = 1;
      }
      // Co-dirigeants → liste de co-contacts (sans doublon)
      var extras = useable.slice(personPhysique.length > 0 || dirigeants[0] === d0 ? 1 : 0, 4).filter(d => d !== d0).map(d => ({
        prenom: capitalize((d.prenoms || d.prenom || "").split(/\s+/)[0] || ""),
        nom: (d.nom || "").toUpperCase(),
        fonction: mapDirigeantQualite(d.qualite) || d.qualite || "",
        email: "",
        phone: ""
      })).filter(c => c.prenom || c.nom);
      if (extras.length > 0 && extraContactList.length === 0) {
        setExtraContactList(extras);
        nbAutoContacts += extras.length;
      }
    }
    setSiretOpen(false);
    setSiretResults([]);
    var msg = nbAutoContacts > 0 ? `✓ Entreprise + ${nbAutoContacts} dirigeant${nbAutoContacts > 1 ? "s" : ""} importé${nbAutoContacts > 1 ? "s" : ""} depuis SIRENE` : "✓ Entreprise importée depuis SIRENE";
    showFlash(msg);
  };

  // Mappe le libellé qualité du dirigeant (INPI/RNE) sur les options du select
  // "Fonction" — on vise les libellés exacts utilisés dans le dropdown.
  var mapDirigeantQualite = q => {
    var t = String(q || "").toLowerCase().trim();
    if (!t) return "";
    if (/président\s*directeur\s*général|pdg/.test(t)) return "CEO / Directeur général";
    if (/président/.test(t)) return "CEO / Directeur général";
    if (/directeur\s*général/.test(t)) return "CEO / Directeur général";
    if (/gérant|gerant|gerante|gérante/.test(t)) return "Gérant / Dirigeant";
    if (/co.?gérant/.test(t)) return "Gérant / Dirigeant";
    if (/directeur\s*g[eé]n[eé]ral\s*délégu/.test(t)) return "COO / Directeur des opérations";
    if (/directeur\s*administratif|daf|directeur\s*financier/.test(t)) return "DAF / Directeur financier";
    if (/secrétaire\s*général/.test(t)) return "Secrétaire général";
    if (/associé/.test(t)) return "Gérant / Dirigeant";
    if (/membre/.test(t)) return "Gérant / Dirigeant";
    return ""; // laisse à l'utilisateur le soin de choisir
  };
  var capitalize = s => {
    var x = String(s || "").toLowerCase();
    return x.charAt(0).toUpperCase() + x.slice(1);
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
    etablissements_secondaires: secondaryEstabs.filter(e => e.adresse || e.ville || e.nom),
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
    concurrent_amount: concurrentAmount,
    besoin,
    notes,
    tags,
    // Statut BODACC procédure collective (auto-checké au moment de la création)
    procedure_collective: procedureCheck,
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

    // 1. Sauve le client (Supabase si dispo, sinon localStorage)
    var saved;
    try {
      saved = await window.api.clients.create(payload);
    } catch (err) {
      console.warn("[NewProspect] api.clients.create failed:", err);
      showFlash("Erreur de sauvegarde — réessayez", "err");
      return;
    }

    // 2. Sauve le contact principal comme une entrée dédiée (si rempli)
    if (contactPrenom || contactNom || contactEmail || contactPhone) {
      try {
        await window.api.contacts.create({
          client_id: payload.id,
          prenom: contactPrenom,
          nom: contactNom,
          fonction: contactRole,
          email: contactEmail,
          phone: contactPhone,
          linkedin: contactLi,
          is_principal: true,
          roles,
          hierarchie: fonction
        });
      } catch (err) {
        console.warn("[NewProspect] contacts.create principal:", err);
      }
    }

    // 3. Sauve les co-contacts
    for (var x of extraContactList) {
      if (!(x.prenom || x.nom || x.email || x.phone)) continue;
      try {
        await window.api.contacts.create({
          client_id: payload.id,
          prenom: x.prenom,
          nom: x.nom,
          fonction: x.fonction,
          email: x.email,
          phone: x.phone,
          linkedin: x.linkedin,
          is_principal: false
        });
      } catch (err) {
        console.warn("[NewProspect] contacts.create extra:", err);
      }
    }

    // 4. Première action à mener
    if (action) {
      var actionMeta = {
        email: {
          title: "Email d'introduction personnalisé",
          icon: "✉",
          tag: "Email",
          tagColor: "#a855f7",
          meta: "Brouillon IA pré-rempli — premier contact"
        },
        call: {
          title: "Cold call programmé",
          icon: "📞",
          tag: "Appel",
          tagColor: "#10b981",
          meta: "Script généré · créneau à confirmer"
        },
        in: {
          title: "Demande de connexion LinkedIn",
          icon: "in",
          tag: "LinkedIn",
          tagColor: "#0a66c2",
          meta: "Via Sales Navigator"
        },
        wait: {
          title: "Inviter à un événement / webinar",
          icon: "📅",
          tag: "Event",
          tagColor: "#f59e0b",
          meta: "Sélectionner l'événement adapté"
        }
      }[action];
      if (actionMeta) {
        try {
          await window.api.actions.create({
            client_id: payload.id,
            type: action,
            title: actionMeta.title,
            due: "Sous 5 jours",
            priority: "haute",
            icon: actionMeta.icon,
            meta: actionMeta.meta,
            assigned: owner.name || "Vous",
            tag: actionMeta.tag,
            tagColor: actionMeta.tagColor
          });
        } catch (err) {
          console.warn("[NewProspect] actions.create:", err);
        }
      }
    }
    try {
      localStorage.removeItem("hubAstorya.prospectDraft.v1");
    } catch (e) {}
    showFlash("✓ Prospect créé — ouverture de sa fiche…");
    setTimeout(() => {
      window.location.href = "/fiche-client?id=" + encodeURIComponent(payload.id);
    }, 900);
  };

  // ───── Calcul réel du pourcentage de complétion de la fiche
  var completionPct = React.useMemo(() => {
    var fields = [
    // Société (10)
    companyName, companySiren, companyNaf, companyTva, companySector, effectif, tier, companyWeb, companyAddress, companyCP,
    // Contact principal (6)
    contactPrenom, contactNom, fonction, contactRole, contactEmail, contactPhone];
    var filled = fields.filter(v => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      return true;
    }).length;
    return Math.round(filled / fields.length * 100);
  }, [companyName, companySiren, companyNaf, companyTva, companySector, effectif, tier, companyWeb, companyAddress, companyCP, contactPrenom, contactNom, fonction, contactRole, contactEmail, contactPhone]);
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
      fontVariantNumeric: "tabular-nums"
    }
  }, completionPct, " %")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      height: 5,
      background: "#eef1f5",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: completionPct + "%",
      height: "100%",
      background: "linear-gradient(90deg, #4f46e5, #a855f7)",
      borderRadius: 999
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: npStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.formCol
  }, /*#__PURE__*/React.createElement("div", {
    style: npStyles.pairGrid
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
    style: {
      ...npStyles.input,
      paddingRight: companyName ? 240 : 200
    },
    value: companyName,
    onChange: e => {
      setCompanyName(e.target.value);
      setSiretOpen(true);
    },
    onFocus: () => setSiretOpen(true),
    onBlur: () => setTimeout(() => setSiretOpen(false), 150),
    placeholder: "Tapez le nom de l'entreprise ou un SIREN\u2026"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...npStyles.searchTag,
      right: companyName || companySiren ? 44 : 8
    }
  }, siretLoading ? "⏳ Recherche…" : "🔍 Auto-complété via base SIRENE"), (companyName || companySiren) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: clearSelection,
    title: "Effacer la s\xE9lection \u2014 recommencer la saisie",
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      width: 26,
      height: 26,
      borderRadius: 999,
      border: "1.5px solid #fecaca",
      background: "#fee2e2",
      color: "#dc2626",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      padding: 0
    }
  }, "\u2715"), siretOpen && siretResults.length > 0 && /*#__PURE__*/React.createElement("div", {
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
        fontVariantNumeric: "tabular-nums"
      }
    }, formatSiren(e.siren)), siege.libelle_commune && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", siege.libelle_commune), e.activite_principale && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 NAF ", e.activite_principale))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#3730a3",
        fontWeight: 700
      }
    }, "\u21B5"));
  })))), (() => {
    var V = window.HubValidators;
    var sirenErr = V && V.siren(companySiren);
    return /*#__PURE__*/React.createElement("div", {
      style: npStyles.formGrid3
    }, /*#__PURE__*/React.createElement(FormRow, {
      label: "SIREN",
      required: true
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...npStyles.input,
        fontVariantNumeric: "tabular-nums",
        ...(sirenErr ? V.errorStyle(sirenErr) : {})
      },
      value: companySiren,
      placeholder: "9 chiffres",
      onChange: e => {
        setCompanySiren(e.target.value);
        var t = computeTva(e.target.value);
        if (t) setCompanyTva(t);
      }
    }), sirenErr && /*#__PURE__*/React.createElement("div", {
      style: V.errorMsgStyle(sirenErr)
    }, sirenErr.message), window.ProcedureBadge && !sirenErr && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(ProcedureBadge, {
      siren: companySiren,
      autoCheck: true,
      onChange: r => setProcedureCheck(r),
      compact: false
    }))), /*#__PURE__*/React.createElement(FormRow, {
      label: "Code NAF"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...npStyles.input,
        fontVariantNumeric: "tabular-nums"
      },
      value: companyNaf,
      onChange: e => setCompanyNaf(e.target.value)
    })), /*#__PURE__*/React.createElement(FormRow, {
      label: "TVA intracom."
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...npStyles.input,
        fontVariantNumeric: "tabular-nums",
        ...(V && V.tva(companyTva) ? V.errorStyle(V.tva(companyTva)) : {})
      },
      value: companyTva,
      placeholder: "FR12345678901",
      onChange: e => setCompanyTva(e.target.value)
    }), V && V.tva(companyTva) && /*#__PURE__*/React.createElement("div", {
      style: V.errorMsgStyle(V.tva(companyTva))
    }, V.tva(companyTva).message)));
  })(), /*#__PURE__*/React.createElement("div", {
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
      fontVariantNumeric: "tabular-nums",
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
      fontVariantNumeric: "tabular-nums",
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
  })))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Établissements secondaires" + (secondaryEstabs.length ? " (" + secondaryEstabs.length + ")" : ""),
    subtitle: "Agences, sites annexes, d\xE9p\xF4ts\u2026"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, secondaryEstabs.map((es, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1.2fr 2fr 100px 1fr 30px",
      gap: 6,
      alignItems: "center",
      padding: 6,
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 7
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontSize: 12
    },
    value: es.nom,
    onChange: e => updateSecondaryEstab(i, "nom", e.target.value),
    placeholder: "Nom site (ex: Agence Bordeaux)"
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontSize: 12
    },
    value: es.adresse,
    onChange: e => updateSecondaryEstab(i, "adresse", e.target.value),
    placeholder: "Adresse"
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontSize: 12
    },
    value: es.cp,
    onChange: e => updateSecondaryEstab(i, "cp", e.target.value),
    placeholder: "CP"
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...npStyles.input,
      fontSize: 12
    },
    value: es.ville,
    onChange: e => updateSecondaryEstab(i, "ville", e.target.value),
    placeholder: "Ville"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => removeSecondaryEstab(i),
    title: "Retirer",
    style: {
      width: 26,
      height: 26,
      padding: 0,
      border: "1px solid #fecaca",
      background: "#fee2e2",
      color: "#dc2626",
      borderRadius: 5,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 700
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: addSecondaryEstab,
    style: {
      alignSelf: "flex-start",
      padding: "6px 12px",
      border: "1px dashed #c7d2fe",
      background: "#eef2ff",
      color: "#3730a3",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "+ Ajouter un \xE9tablissement secondaire")))), /*#__PURE__*/React.createElement("section", {
    style: npStyles.section
  }, /*#__PURE__*/React.createElement(SectionHead, {
    num: "02",
    title: "Contact principal",
    subtitle: "D\xE9cideur identifi\xE9 ou point d'entr\xE9e commercial",
    status: "active"
  }), contactAutoFilled && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      marginBottom: 12,
      background: "#eef2ff",
      border: "1px solid #c7d2fe",
      borderRadius: 8,
      fontSize: 11.5,
      color: "#3730a3"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Auto-compl\xE9t\xE9 depuis les dirigeants d\xE9clar\xE9s"), " \xB7 pr\xE9nom, nom, fonction et LinkedIn estim\xE9s \xE0 partir de l'open data INSEE/INPI. Email et t\xE9l\xE9phone restent \xE0 renseigner manuellement."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setContactPrenom("");
      setContactNom("");
      setContactRole("");
      setContactLi("");
      setExtraContactList([]);
      setContactAutoFilled(false);
    },
    style: {
      padding: "3px 9px",
      border: "1px solid #c7d2fe",
      background: "#fff",
      color: "#3730a3",
      borderRadius: 5,
      fontSize: 11,
      cursor: "pointer",
      fontWeight: 600
    }
  }, "Effacer")), /*#__PURE__*/React.createElement("div", {
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
  }, "\u2014 Choisir une fonction \u2014"), /*#__PURE__*/React.createElement("optgroup", {
    label: "Direction g\xE9n\xE9rale"
  }, /*#__PURE__*/React.createElement("option", null, "CEO / Directeur g\xE9n\xE9ral"), /*#__PURE__*/React.createElement("option", null, "G\xE9rant / Dirigeant"), /*#__PURE__*/React.createElement("option", null, "COO / Directeur des op\xE9rations"), /*#__PURE__*/React.createElement("option", null, "Directeur de la transformation digitale"), /*#__PURE__*/React.createElement("option", null, "Directeur de site / d'agence"), /*#__PURE__*/React.createElement("option", null, "Secr\xE9taire g\xE9n\xE9ral")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Finance & Comptabilit\xE9"
  }, /*#__PURE__*/React.createElement("option", null, "CFO / Directeur financier"), /*#__PURE__*/React.createElement("option", null, "Directeur administratif et financier (DAF)"), /*#__PURE__*/React.createElement("option", null, "Chef comptable"), /*#__PURE__*/React.createElement("option", null, "Comptable"), /*#__PURE__*/React.createElement("option", null, "Contr\xF4leur de gestion"), /*#__PURE__*/React.createElement("option", null, "Responsable tr\xE9sorerie"), /*#__PURE__*/React.createElement("option", null, "Cr\xE9dit manager"), /*#__PURE__*/React.createElement("option", null, "Auditeur interne")), /*#__PURE__*/React.createElement("optgroup", {
    label: "IT & Tech"
  }, /*#__PURE__*/React.createElement("option", null, "CTO / Directeur technique"), /*#__PURE__*/React.createElement("option", null, "CIO / DSI"), /*#__PURE__*/React.createElement("option", null, "CISO / RSSI"), /*#__PURE__*/React.createElement("option", null, "Responsable IT / Manager SI"), /*#__PURE__*/React.createElement("option", null, "Responsable infrastructure"), /*#__PURE__*/React.createElement("option", null, "Architecte SI"), /*#__PURE__*/React.createElement("option", null, "Chef de projet IT"), /*#__PURE__*/React.createElement("option", null, "DevOps / SRE"), /*#__PURE__*/React.createElement("option", null, "Lead d\xE9veloppeur"), /*#__PURE__*/React.createElement("option", null, "Administrateur syst\xE8me / r\xE9seaux"), /*#__PURE__*/React.createElement("option", null, "Technicien support / Helpdesk"), /*#__PURE__*/React.createElement("option", null, "Data Officer (CDO) / Data Engineer")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Marketing & Communication"
  }, /*#__PURE__*/React.createElement("option", null, "CMO / Directeur marketing"), /*#__PURE__*/React.createElement("option", null, "Responsable marketing"), /*#__PURE__*/React.createElement("option", null, "Charg\xE9 de marketing"), /*#__PURE__*/React.createElement("option", null, "Brand manager"), /*#__PURE__*/React.createElement("option", null, "Product marketing manager"), /*#__PURE__*/React.createElement("option", null, "Responsable digital / SEO"), /*#__PURE__*/React.createElement("option", null, "Community / Social media manager"), /*#__PURE__*/React.createElement("option", null, "Charg\xE9 de communication"), /*#__PURE__*/React.createElement("option", null, "Directeur de la communication")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Commercial & Ventes"
  }, /*#__PURE__*/React.createElement("option", null, "Directeur commercial / Sales Director"), /*#__PURE__*/React.createElement("option", null, "VP Sales"), /*#__PURE__*/React.createElement("option", null, "Account Executive"), /*#__PURE__*/React.createElement("option", null, "Business Developer"), /*#__PURE__*/React.createElement("option", null, "Commercial terrain"), /*#__PURE__*/React.createElement("option", null, "Inside Sales / SDR"), /*#__PURE__*/React.createElement("option", null, "Key Account Manager"), /*#__PURE__*/React.createElement("option", null, "Responsable agence commerciale"), /*#__PURE__*/React.createElement("option", null, "Charg\xE9 d'affaires"), /*#__PURE__*/React.createElement("option", null, "Customer Success Manager")), /*#__PURE__*/React.createElement("optgroup", {
    label: "RH & Paie"
  }, /*#__PURE__*/React.createElement("option", null, "CHRO / DRH"), /*#__PURE__*/React.createElement("option", null, "Responsable RH"), /*#__PURE__*/React.createElement("option", null, "Charg\xE9 de recrutement"), /*#__PURE__*/React.createElement("option", null, "Responsable paie"), /*#__PURE__*/React.createElement("option", null, "Gestionnaire de paie"), /*#__PURE__*/React.createElement("option", null, "Responsable formation"), /*#__PURE__*/React.createElement("option", null, "Responsable QVT / RSE")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Op\xE9rations & Production"
  }, /*#__PURE__*/React.createElement("option", null, "Directeur des op\xE9rations"), /*#__PURE__*/React.createElement("option", null, "Directeur d'usine / Site manager"), /*#__PURE__*/React.createElement("option", null, "Responsable production"), /*#__PURE__*/React.createElement("option", null, "Responsable qualit\xE9 / QHSE"), /*#__PURE__*/React.createElement("option", null, "Responsable logistique / Supply chain"), /*#__PURE__*/React.createElement("option", null, "Responsable maintenance"), /*#__PURE__*/React.createElement("option", null, "Chef d'atelier")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Achats & Juridique"
  }, /*#__PURE__*/React.createElement("option", null, "Directeur des achats"), /*#__PURE__*/React.createElement("option", null, "Responsable achats"), /*#__PURE__*/React.createElement("option", null, "Acheteur"), /*#__PURE__*/React.createElement("option", null, "Approvisionneur"), /*#__PURE__*/React.createElement("option", null, "Directeur juridique"), /*#__PURE__*/React.createElement("option", null, "Juriste / DPO")), /*#__PURE__*/React.createElement("optgroup", {
    label: "Autre"
  }, /*#__PURE__*/React.createElement("option", null, "Assistant(e) de direction"), /*#__PURE__*/React.createElement("option", null, "Office manager"), /*#__PURE__*/React.createElement("option", null, "Consultant / Expert"), /*#__PURE__*/React.createElement("option", null, "Chef de projet"), /*#__PURE__*/React.createElement("option", null, "Autre \u2014 pr\xE9ciser dans notes")))), /*#__PURE__*/React.createElement(FormRow, {
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
  }, v))))), (() => {
    var V = window.HubValidators;
    var emailErr = V && V.email(contactEmail);
    var phoneErr = V && V.phone(contactPhone);
    return /*#__PURE__*/React.createElement("div", {
      style: npStyles.formGrid2
    }, /*#__PURE__*/React.createElement(FormRow, {
      label: "Email pro",
      required: true
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...npStyles.inputWithIcon,
        ...(emailErr ? V.errorStyle(emailErr) : {})
      }
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
        fontVariantNumeric: "tabular-nums",
        fontSize: 12.5
      },
      value: contactEmail,
      onChange: e => setContactEmail(e.target.value)
    }), !emailErr && contactEmail && /*#__PURE__*/React.createElement("span", {
      style: {
        ...npStyles.linkTag,
        color: "#10b981"
      }
    }, "\u2713 Format ok")), emailErr && /*#__PURE__*/React.createElement("div", {
      style: V.errorMsgStyle(emailErr)
    }, emailErr.message)), /*#__PURE__*/React.createElement(FormRow, {
      label: "T\xE9l\xE9phone"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...npStyles.inputWithIcon,
        ...(phoneErr ? V.errorStyle(phoneErr) : {})
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94a3b8"
      }
    }, "\u260E"), /*#__PURE__*/React.createElement("input", {
      type: "tel",
      placeholder: "06 12 34 56 78",
      style: {
        ...npStyles.input,
        border: "none",
        padding: 0,
        fontVariantNumeric: "tabular-nums",
        fontSize: 12.5
      },
      value: contactPhone,
      onChange: e => setContactPhone(e.target.value)
    }), !phoneErr && contactPhone && /*#__PURE__*/React.createElement("span", {
      style: {
        ...npStyles.linkTag,
        color: "#10b981"
      }
    }, "\u2713 Format ok")), phoneErr && /*#__PURE__*/React.createElement("div", {
      style: V.errorMsgStyle(phoneErr)
    }, phoneErr.message)));
  })(), /*#__PURE__*/React.createElement(FormRow, {
    label: "R\xF4le dans le projet",
    subtitle: "Quelle place dans la d\xE9cision d'achat ?"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ["Décideur", "Prescripteur", "Utilisateur", "Acheteur"].map(r => {
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
      fontVariantNumeric: "tabular-nums",
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
  }))))))), /*#__PURE__*/React.createElement("div", {
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
  }, "En cours"))), (companyName.trim() || companySiren) && duplicates.length > 0 && /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("strong", null, duplicates.length, " entreprise", duplicates.length > 1 ? "s" : "", " similaire", duplicates.length > 1 ? "s" : ""), " trouv\xE9e", duplicates.length > 1 ? "s" : "", " dans la base :"), duplicates.slice(0, 3).map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
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
  }, (d.raison_sociale || d.name || "??").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, d.raison_sociale || d.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8"
    }
  }, d.status === "client" ? "Client" : "Prospect", " \xB7 ", d.ville || d.city || "—")), /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client?id=" + encodeURIComponent(d.id),
    style: {
      ...npStyles.smBtn,
      fontSize: 10.5,
      textDecoration: "none",
      display: "inline-block",
      cursor: "pointer"
    }
  }, "Voir")))))));
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
      fontVariantNumeric: "tabular-nums",
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
    minWidth: 1280,
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
    fontVariantNumeric: "tabular-nums",
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
    gridTemplateColumns: "1fr 320px",
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
  pairGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    alignItems: "start"
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