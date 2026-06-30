// Fiche nouveau prospect — formulaire de qualification

const NewProspect = () => {
  // ───── État UI interactif (segments, chips, action) — fiche neuve, tout vide
  const [effectif,   setEffectif]   = React.useState(null);
  const [tier,       setTier]       = React.useState(null);
  const [fonction,   setFonction]   = React.useState(null);
  const [roles,      setRoles]      = React.useState([]);
  const [action,     setAction]     = React.useState("email");
  const [ca,         setCa]         = React.useState("");
  const [contactPrenom, setContactPrenom] = React.useState("");
  const [contactNom,    setContactNom]    = React.useState("");
  const [contactRole,   setContactRole]   = React.useState("");
  const [contactEmail,  setContactEmail]  = React.useState("");
  const [contactPhone,  setContactPhone]  = React.useState("");
  const [contactLi,     setContactLi]     = React.useState("");
  const [besoin,        setBesoin]        = React.useState("");
  const [notes,         setNotes]         = React.useState("");
  const [tags,          setTags]          = React.useState([]);
  const [tagMenuOpen,   setTagMenuOpen]   = React.useState(false);
  React.useEffect(() => {
    if (!tagMenuOpen) return;
    const close = () => setTagMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [tagMenuOpen]);
  // Détection live de doublons : nom approchant ou SIREN identique
  const [allClients, setAllClients] = React.useState([]);
  React.useEffect(() => {
    if (!window.api || !window.api.clients) return;
    window.api.clients.list().then((list) => setAllClients(list || [])).catch(() => {});
  }, []);
  const [source,        setSource]        = React.useState("");
  const [contactDate,   setContactDate]   = React.useState("");
  const [projectDate,   setProjectDate]   = React.useState("");
  const [concurrent,    setConcurrent]    = React.useState("");
  const [concurrentAmount, setConcurrentAmount] = React.useState("");
  // Owner par défaut : l'utilisateur connecté (récupéré via HubAccess)
  const ownerList = [
    { name: "Romain Daviaud", role: "Super Admin", color: "#4f46e5" },
    { name: "Augustin Morin", role: "Super Admin", color: "#a855f7" },
  ];
  const initialOwner = (() => {
    try {
      const u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
      if (u && u.name) return { name: u.name, role: u.role || "—", color: "#4f46e5" };
    } catch (e) {}
    return ownerList[0];
  })();
  const [owner,         setOwner]         = React.useState(initialOwner);
  const [ownerMenu,     setOwnerMenu]     = React.useState(false);
  React.useEffect(() => {
    if (!ownerMenu) return;
    const close = () => setOwnerMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ownerMenu]);
  const [extraContactList, setExtraContactList] = React.useState([]); // [{prenom, nom, fonction, email, phone}]
  const [contactAutoFilled, setContactAutoFilled] = React.useState(false);
  const addExtraContact = () => setExtraContactList((l) => [...l, { prenom: "", nom: "", fonction: "", email: "", phone: "" }]);
  const removeExtraContact = (i) => setExtraContactList((l) => l.filter((_, idx) => idx !== i));
  const updateExtraContact = (i, field, value) => setExtraContactList((l) => l.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  const [extraContacts, setExtraContacts] = React.useState(0);
  const [flash,         setFlash]         = React.useState(null);

  // ───── Auto-complétion SIRENE (recherche-entreprises.api.gouv.fr)
  const [companyName,    setCompanyName]    = React.useState("");
  const [companySiren,   setCompanySiren]   = React.useState("");
  // Résultat du check BODACC procédure collective (persisté en clients.data)
  const [procedureCheck, setProcedureCheck] = React.useState(null);
  // Computed : doublons potentiels
  const duplicates = React.useMemo(() => {
    if (!allClients || allClients.length === 0) return [];
    const q = (companyName || "").trim().toLowerCase();
    const siren = (companySiren || "").replace(/\s/g, "");
    return allClients.filter((c) => {
      if (siren && c.siren && c.siren.replace(/\s/g, "") === siren) return true;
      if (q.length >= 3) {
        const n = (c.raison_sociale || c.name || "").toLowerCase();
        if (n.includes(q) || q.includes(n)) return true;
        // Levenshtein-light : nom commence pareil
        if (n.slice(0, Math.min(5, q.length)) === q.slice(0, Math.min(5, n.length))) return true;
      }
      return false;
    }).slice(0, 5);
  }, [allClients, companyName, companySiren]);
  const [companyNaf,     setCompanyNaf]     = React.useState("");
  const [companySiret,   setCompanySiret]   = React.useState("");
  const [companyTva,     setCompanyTva]     = React.useState("");
  const [companyAddress, setCompanyAddress] = React.useState("");
  const [companyCity,    setCompanyCity]    = React.useState("");
  const [companyCP,      setCompanyCP]      = React.useState("");
  const [companySector,  setCompanySector]  = React.useState("");
  const [companySubSect, setCompanySubSect] = React.useState("");
  // Établissements secondaires : chaque entrée = { nom, adresse, cp, ville }
  const [secondaryEstabs, setSecondaryEstabs] = React.useState([]);
  const addSecondaryEstab = () => setSecondaryEstabs((l) => [...l, { nom: "", adresse: "", cp: "", ville: "" }]);
  const removeSecondaryEstab = (i) => setSecondaryEstabs((l) => l.filter((_, idx) => idx !== i));
  const updateSecondaryEstab = (i, field, value) => setSecondaryEstabs((l) => l.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  const [companyWeb,     setCompanyWeb]     = React.useState("");
  const [companyLi,      setCompanyLi]      = React.useState("");
  const [siretResults,   setSiretResults]   = React.useState([]);
  const [siretLoading,   setSiretLoading]   = React.useState(false);
  const [siretOpen,      setSiretOpen]      = React.useState(false);

  // Mapping section NAF (lettre) → libellé secteur
  const sectionLabels = {
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
    U: "Activités extra-territoriales",
  };

  // Sous-secteur dérivé de la division NAF (2 premiers chiffres)
  const subSectorByDivision = {
    "62": "Programmation et conseil informatique",
    "63": "Services d'information",
    "64": "Activités financières",
    "65": "Assurance",
    "66": "Activités auxiliaires de services financiers",
    "70": "Conseil de direction",
    "71": "Architecture, ingénierie",
    "72": "Recherche et développement",
    "73": "Publicité, études de marché",
    "74": "Autres activités spécialisées",
  };

  // Slug pour deviner site web / LinkedIn depuis le nom
  const slugify = (s) => String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Mapping tranche_effectif_salarie INSEE → mes 5 buckets
  const mapEffectif = (code) => {
    if (!code) return null;
    if (["NN", "00", "01", "02", "03", "11", "12"].includes(code)) return "1-50";
    if (["21", "22"].includes(code)) return "51-250";
    if (["31", "32"].includes(code)) return "251-1k";
    if (["41", "42"].includes(code)) return "1k-5k";
    return "5k+";
  };

  // Calcule la clé TVA intracom FR à partir du SIREN
  const computeTva = (siren) => {
    const clean = String(siren).replace(/\D/g, "");
    if (clean.length !== 9) return "";
    const key = (12 + (3 * (parseInt(clean, 10) % 97))) % 97;
    return "FR" + String(key).padStart(2, "0") + clean;
  };
  const formatSiren = (s) => {
    const c = String(s).replace(/\D/g, "");
    return c.length === 9 ? `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6,9)}` : c;
  };
  // SIRET = SIREN (9) + NIC (5) = 14 chiffres, format « XXX XXX XXX XXXXX »
  const formatSiret = (s) => {
    const c = String(s || "").replace(/\D/g, "");
    return c.length === 14 ? `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6,9)} ${c.slice(9,14)}` : c;
  };

  // Debounce 300ms sur la recherche
  const siretTimer = React.useRef(null);
  React.useEffect(() => {
    if (siretTimer.current) clearTimeout(siretTimer.current);
    const q = (companyName || "").trim();
    if (q.length < 3) { setSiretResults([]); return; }
    siretTimer.current = setTimeout(async () => {
      setSiretLoading(true);
      try {
        const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=6`);
        const j = await r.json();
        setSiretResults(Array.isArray(j.results) ? j.results : []);
      } catch (e) { setSiretResults([]); }
      setSiretLoading(false);
    }, 300);
    return () => { if (siretTimer.current) clearTimeout(siretTimer.current); };
  }, [companyName]);

  // Réinitialise tous les champs auto-complétés (utilisé par la croix rouge
  // quand l'utilisateur s'est trompé de prospect sélectionné).
  const clearSelection = () => {
    setCompanyName("");
    setCompanySiren("");
    setCompanyNaf("");
    setCompanySiret("");
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

  const pickCompany = (e) => {
    const siege = e.siege || {};
    const siren = e.siren || "";
    const name = e.nom_complet || e.nom_raison_sociale || siege.denomination_usuelle || "";
    const naf = e.activite_principale || siege.activite_principale || "";
    const section = e.section_activite_principale || siege.section_activite_principale || (naf ? null : null);

    setCompanyName(name);
    setCompanySiren(formatSiren(siren));
    setCompanyNaf(naf);
    // SIRET du siège (14 chiffres = SIREN + NIC). Récupéré depuis l'API SIRENE.
    setCompanySiret(formatSiret(siege.siret || e.siege_siret || ""));
    setCompanyTva(computeTva(siren));

    // Adresse — privilégie geo_adresse (concaténée), sinon reconstitue
    const addr = siege.geo_adresse
      || [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ")
      || siege.adresse || "";
    // On retire la ville + CP en fin de adresse pour ne garder que la rue
    let street = addr;
    if (siege.code_postal) street = street.replace(siege.code_postal, "").trim();
    if (siege.libelle_commune) street = street.replace(new RegExp(siege.libelle_commune, "i"), "").trim();
    street = street.replace(/[\s,]+$/, "");
    setCompanyAddress(street);
    setCompanyCity(siege.libelle_commune || "");
    setCompanyCP(siege.code_postal || "");

    // Secteur (section NAF) + sous-secteur (division NAF)
    if (section && sectionLabels[section]) setCompanySector(sectionLabels[section]);
    else if (naf) {
      const sec = naf.charAt(0);
      const divCode = naf.slice(0, 2);
      const div = subSectorByDivision[divCode];
      if (div) setCompanySector(div);
    }
    if (naf) {
      const div = subSectorByDivision[naf.slice(0, 2)];
      setCompanySubSect(div || naf);
    }

    // Site web et LinkedIn — devinés depuis le nom (à corriger manuellement si besoin)
    const slug = slugify(name);
    if (slug) {
      setCompanyWeb(slug + ".fr");
      setCompanyLi("linkedin.com/company/" + slug);
    }

    const mapped = mapEffectif(e.tranche_effectif_salarie || siege.tranche_effectif_salarie);
    if (mapped) setEffectif(mapped);

    // Auto-remplissage du contact principal à partir des dirigeants déclarés
    // (open data INSEE/INPI exposé par recherche-entreprises). Seuls
    // prenom/nom/fonction sont disponibles publiquement — email/téléphone
    // restent à compléter manuellement (données personnelles non publiques).
    const dirigeants = Array.isArray(e.dirigeants) ? e.dirigeants.filter((d) => d && (d.prenoms || d.prenom || d.nom)) : [];
    const personPhysique = dirigeants.filter((d) => (d.type_dirigeant || "personne physique").toLowerCase() === "personne physique");
    const useable = personPhysique.length > 0 ? personPhysique : dirigeants;
    let nbAutoContacts = 0;
    if (useable.length > 0) {
      // Toujours pré-remplir le premier (écrase la saisie utilisateur uniquement
      // si le contact est encore vierge — sinon on ajoute aux co-contacts)
      const d0 = useable[0];
      const prenom0 = (d0.prenoms || d0.prenom || "").split(/\s+/)[0] || "";
      const nom0    = (d0.nom || "").toUpperCase();
      const role0   = mapDirigeantQualite(d0.qualite);
      if (!contactPrenom && !contactNom && !contactEmail && !contactPhone) {
        if (prenom0) setContactPrenom(capitalize(prenom0));
        if (nom0)    setContactNom(nom0);
        if (role0)   setContactRole(role0);
        // Devine un LinkedIn plausible — éditable
        const liSlug = slugify(prenom0 + "-" + nom0);
        if (liSlug && !contactLi) setContactLi("linkedin.com/in/" + liSlug);
        setContactAutoFilled(true);
        nbAutoContacts = 1;
      }
      // Co-dirigeants → liste de co-contacts (sans doublon)
      const extras = useable.slice(personPhysique.length > 0 || dirigeants[0] === d0 ? 1 : 0, 4)
        .filter((d) => d !== d0)
        .map((d) => ({
          prenom: capitalize((d.prenoms || d.prenom || "").split(/\s+/)[0] || ""),
          nom: (d.nom || "").toUpperCase(),
          fonction: mapDirigeantQualite(d.qualite) || (d.qualite || ""),
          email: "", phone: "",
        }))
        .filter((c) => c.prenom || c.nom);
      if (extras.length > 0 && extraContactList.length === 0) {
        setExtraContactList(extras);
        nbAutoContacts += extras.length;
      }
    }

    setSiretOpen(false);
    setSiretResults([]);
    const msg = nbAutoContacts > 0
      ? `✓ Entreprise + ${nbAutoContacts} dirigeant${nbAutoContacts > 1 ? "s" : ""} importé${nbAutoContacts > 1 ? "s" : ""} depuis SIRENE`
      : "✓ Entreprise importée depuis SIRENE";
    showFlash(msg);
  };

  // Mappe le libellé qualité du dirigeant (INPI/RNE) sur les options du select
  // "Fonction" — on vise les libellés exacts utilisés dans le dropdown.
  const mapDirigeantQualite = (q) => {
    const t = String(q || "").toLowerCase().trim();
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

  const capitalize = (s) => {
    const x = String(s || "").toLowerCase();
    return x.charAt(0).toUpperCase() + x.slice(1);
  };

  const showFlash = (msg, tone = "ok") => {
    setFlash({ msg, tone });
    setTimeout(() => setFlash(null), 2800);
  };

  const toggleRole = (r) => setRoles((rs) => rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]);

  const cancel = () => {
    if (confirm("Abandonner ce prospect ? Toutes les saisies non enregistrées seront perdues.")) {
      window.location.href = "/crm";
    }
  };

  // Construit le payload complet à partir de tous les champs du formulaire
  const buildPayload = () => ({
    id: "ACC-" + Math.floor(Math.random() * 9000 + 1000),
    raison_sociale: companyName,
    siren: companySiren,
    siret: companySiret,
    naf: companyNaf,
    tva: companyTva,
    adresse: companyAddress,
    code_postal: companyCP,
    ville: companyCity,
    etablissements_secondaires: secondaryEstabs.filter((e) => e.adresse || e.ville || e.nom),
    secteur: companySector,
    sous_secteur: companySubSect,
    site_web: companyWeb,
    linkedin_entreprise: companyLi,
    effectif, tier, fonction, roles, action,
    contact_principal: {
      prenom: contactPrenom, nom: contactNom, fonction: contactRole,
      email: contactEmail, phone: contactPhone, linkedin: contactLi,
    },
    contacts_additionnels: extraContactList,
    source, project_date: projectDate,
    concurrent,
    concurrent_amount: concurrentAmount,
    besoin, notes, tags,
    // Statut BODACC procédure collective (auto-checké au moment de la création)
    procedure_collective: procedureCheck,
    owner: owner.name,
    owner_role: owner.role,
    owner_color: owner.color,
    created_at: new Date().toISOString(),
    status: "prospect",
  });

  const saveDraft = () => {
    try { localStorage.setItem("hubAstorya.prospectDraft.v1", JSON.stringify(buildPayload())); } catch (e) {}
    showFlash("✓ Brouillon enregistré localement");
  };

  const createProspect = async () => {
    if (!companyName.trim()) { showFlash("La raison sociale est obligatoire", "err"); return; }
    const payload = buildPayload();

    // 1. Sauve le client (Supabase si dispo, sinon localStorage)
    let saved;
    try {
      saved = await window.api.clients.create(payload);
    } catch (err) {
      console.warn("[NewProspect] api.clients.create failed:", err);
      showFlash("Erreur de sauvegarde — réessayez", "err");
      return;
    }

    // 2. Sauve le contact principal comme une entrée dédiée (si rempli)
    if ((contactPrenom || contactNom || contactEmail || contactPhone)) {
      try {
        await window.api.contacts.create({
          client_id: payload.id,
          prenom: contactPrenom, nom: contactNom, fonction: contactRole,
          email: contactEmail, phone: contactPhone, linkedin: contactLi,
          is_principal: true,
          roles, hierarchie: fonction,
        });
      } catch (err) { console.warn("[NewProspect] contacts.create principal:", err); }
    }

    // 3. Sauve les co-contacts
    for (const x of extraContactList) {
      if (!(x.prenom || x.nom || x.email || x.phone)) continue;
      try {
        await window.api.contacts.create({
          client_id: payload.id,
          prenom: x.prenom, nom: x.nom, fonction: x.fonction,
          email: x.email, phone: x.phone, linkedin: x.linkedin,
          is_principal: false,
        });
      } catch (err) { console.warn("[NewProspect] contacts.create extra:", err); }
    }

    // 4. Première action à mener
    if (action) {
      const actionMeta = {
        email: { title: "Email d'introduction personnalisé", icon: "✉", tag: "Email",   tagColor: "#a855f7", meta: "Brouillon IA pré-rempli — premier contact" },
        call:  { title: "Cold call programmé",                icon: "📞", tag: "Appel",   tagColor: "#10b981", meta: "Script généré · créneau à confirmer" },
        in:    { title: "Demande de connexion LinkedIn",      icon: "in", tag: "LinkedIn",tagColor: "#0a66c2", meta: "Via Sales Navigator" },
        wait:  { title: "Inviter à un événement / webinar",   icon: "📅", tag: "Event",   tagColor: "#f59e0b", meta: "Sélectionner l'événement adapté" },
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
            tagColor: actionMeta.tagColor,
          });
        } catch (err) { console.warn("[NewProspect] actions.create:", err); }
      }
    }

    try { localStorage.removeItem("hubAstorya.prospectDraft.v1"); } catch (e) {}
    showFlash("✓ Prospect créé — ouverture de sa fiche…");
    setTimeout(() => { window.location.href = "/fiche-client?id=" + encodeURIComponent(payload.id); }, 900);
  };

  // ───── Calcul réel du pourcentage de complétion de la fiche
  const completionPct = React.useMemo(() => {
    const fields = [
      // Société (10)
      companyName, companySiren, companySiret, companyNaf, companyTva,
      companySector, effectif, tier, companyWeb,
      companyAddress, companyCP,
      // Contact principal (6)
      contactPrenom, contactNom, fonction, contactRole,
      contactEmail, contactPhone,
    ];
    const filled = fields.filter((v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      return true;
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [companyName, companySiren, companySiret, companyNaf, companyTva, companySector, effectif, tier, companyWeb, companyAddress, companyCP, contactPrenom, contactNom, fonction, contactRole, contactEmail, contactPhone]);

  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { N: "#a855f7", K: "#6366f1", S: "#10b981", T: "#f59e0b", E: "#0ea5e9", M: "#dc2626", L: "#8b5cf6" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
    );
  };

  return (
    <div style={npStyles.frame}>
      {/* Topbar */}
      <header style={npStyles.topbar}>
        <a href="/crm" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", textDecoration: "none" }}>
          <span>CRM</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span>Comptes & contacts</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Nouveau prospect</span>
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>● Auto-save · il y a 4 sec</span>
        </a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {flash && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: flash.tone === "err" ? "#fee2e2" : "#dcfce7", color: flash.tone === "err" ? "#991b1b" : "#065f46" }}>{flash.msg}</span>
          )}
          <button onClick={cancel} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Annuler</button>
          <button onClick={createProspect} style={{ ...npStyles.primaryBtn, cursor: "pointer" }}>Créer le prospect</button>
        </div>
      </header>

      {/* Title row */}
      <div style={npStyles.titleRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={npStyles.heroIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
          </div>
          <div>
            <h1 style={npStyles.h1}>Nouveau prospect</h1>
            <p style={npStyles.subtitle}>Qualifiez une nouvelle entreprise et son interlocuteur clé · l'IA enrichira automatiquement les données publiques</p>
          </div>
        </div>
        <div style={npStyles.completion}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Fiche complétée</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{completionPct} %</span>
          </div>
          <div style={{ width: 180, height: 5, background: "#eef1f5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: completionPct + "%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #a855f7)", borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div style={npStyles.body}>

        {/* LEFT — form */}
        <div style={npStyles.formCol}>

          {/* Row 1 : Société + Contact principal côte à côte */}
          <div style={npStyles.pairGrid}>

          {/* SECTION 1 — Société */}
          <section style={npStyles.section}>
            <SectionHead num="01" title="Société" subtitle="Identité et caractéristiques de l'entreprise prospect" status="done" />

            <FormRow label="Raison sociale" required>
              <div style={{ ...npStyles.searchInputWrap, position: "relative" }}>
                <input
                  style={{ ...npStyles.input, paddingRight: companyName ? 240 : 200 }}
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setSiretOpen(true); }}
                  onFocus={() => setSiretOpen(true)}
                  onBlur={() => setTimeout(() => setSiretOpen(false), 150)}
                  placeholder="Tapez le nom de l'entreprise ou un SIREN…"
                />
                <span style={{ ...npStyles.searchTag, right: (companyName || companySiren) ? 44 : 8 }}>{siretLoading ? "⏳ Recherche…" : "🔍 Auto-complété via base SIRENE"}</span>
                {(companyName || companySiren) && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    title="Effacer la sélection — recommencer la saisie"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 26, height: 26,
                      borderRadius: 999,
                      border: "1.5px solid #fecaca",
                      background: "#fee2e2",
                      color: "#dc2626",
                      fontSize: 14, fontWeight: 700,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >✕</button>
                )}
                {siretOpen && siretResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,.08)", zIndex: 20, maxHeight: 320, overflowY: "auto" }}>
                    {siretResults.map((e) => {
                      const siege = e.siege || {};
                      return (
                        <div key={e.siren} onMouseDown={() => pickCompany(e)}
                             style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom_complet || e.nom_raison_sociale}</div>
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                              SIREN <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatSiren(e.siren)}</span>
                              {siege.libelle_commune && <> · {siege.libelle_commune}</>}
                              {e.activite_principale && <> · NAF {e.activite_principale}</>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10.5, color: "#3730a3", fontWeight: 700 }}>↵</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </FormRow>

            {(() => {
              const V = window.HubValidators;
              const sirenErr = V && V.siren(companySiren);
              return (
            <div style={npStyles.formGrid3}>
              <FormRow label="SIREN" required>
                <input style={{ ...npStyles.input, fontVariantNumeric: "tabular-nums", ...(sirenErr ? V.errorStyle(sirenErr) : {}) }}
                       value={companySiren}
                       placeholder="9 chiffres"
                       onChange={(e) => { setCompanySiren(e.target.value); const t = computeTva(e.target.value); if (t) setCompanyTva(t); }} />
                {sirenErr && <div style={V.errorMsgStyle(sirenErr)}>{sirenErr.message}</div>}
                {/* Badge BODACC procédure collective — auto-check dès qu'on a un SIREN à 9 chiffres */}
                {window.ProcedureBadge && !sirenErr && (
                  <div style={{ marginTop: 8 }}>
                    <ProcedureBadge
                      siren={companySiren}
                      autoCheck={true}
                      onChange={(r) => setProcedureCheck(r)}
                      compact={false}
                    />
                  </div>
                )}
              </FormRow>
              <FormRow label="SIRET (siège)" required>
                {(() => {
                  const digits = (companySiret || "").replace(/\D/g, "");
                  const siretErr = digits.length > 0 && digits.length !== 14;
                  return <>
                    <input style={{ ...npStyles.input, fontVariantNumeric: "tabular-nums", ...(siretErr ? { borderColor: "#dc2626" } : {}) }}
                           value={companySiret}
                           placeholder="14 chiffres"
                           onChange={(e) => {
                             setCompanySiret(formatSiret(e.target.value));
                             // Si le SIREN est vide, on le déduit des 9 premiers chiffres du SIRET
                             const d = e.target.value.replace(/\D/g, "");
                             if (d.length >= 9 && !(companySiren || "").replace(/\D/g, "")) {
                               setCompanySiren(formatSiren(d.slice(0, 9)));
                               const t = computeTva(d.slice(0, 9)); if (t) setCompanyTva(t);
                             }
                           }} />
                    {siretErr && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>Le SIRET doit comporter 14 chiffres.</div>}
                  </>;
                })()}
              </FormRow>
              <FormRow label="Code NAF">
                <input style={{ ...npStyles.input, fontVariantNumeric: "tabular-nums" }} value={companyNaf} onChange={(e) => setCompanyNaf(e.target.value)} />
              </FormRow>
              <FormRow label="TVA intracom.">
                <input style={{ ...npStyles.input, fontVariantNumeric: "tabular-nums", ...(V && V.tva(companyTva) ? V.errorStyle(V.tva(companyTva)) : {}) }} value={companyTva} placeholder="FR12345678901" onChange={(e) => setCompanyTva(e.target.value)} />
                {V && V.tva(companyTva) && <div style={V.errorMsgStyle(V.tva(companyTva))}>{V.tva(companyTva).message}</div>}
              </FormRow>
            </div>
              );
            })()}

            <div style={npStyles.formGrid2}>
              <FormRow label="Secteur d'activité" required>
                <select
                  style={npStyles.input}
                  value={companySector}
                  onChange={(e) => setCompanySector(e.target.value)}
                >
                  <option value="">— Sélectionner un secteur —</option>
                  {Object.entries(sectionLabels).map(([k, v]) => (
                    <option key={k} value={v}>{v}</option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Sous-secteur">
                <select
                  style={npStyles.input}
                  value={companySubSect}
                  onChange={(e) => setCompanySubSect(e.target.value)}
                >
                  <option value="">— Sélectionner un sous-secteur —</option>
                  {Object.entries(subSectorByDivision).map(([k, v]) => (
                    <option key={k} value={v}>{v}</option>
                  ))}
                </select>
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Effectif" required>
                <div style={npStyles.segCtrl}>
                  {["1-50", "51-250", "251-1k", "1k-5k", "5k+"].map((v) => (
                    <button key={v} onClick={() => setEffectif(v)}
                            style={{ ...npStyles.segBtn, ...(effectif === v ? npStyles.segBtnActive : {}), cursor: "pointer" }}>{v}</button>
                  ))}
                </div>
                <div style={npStyles.inputHelp}>Source SIRENE : 1 200 collaborateurs</div>
              </FormRow>
              <FormRow label="Tier prospect">
                <div style={npStyles.tierRow}>
                  {["A", "B", "C"].map((v) => {
                    const on = tier === v;
                    return (
                      <button key={v} onClick={() => setTier(v)}
                              style={{ ...npStyles.tierBtn, ...(on ? { background: "#fef3c7", color: "#a16207", border: "1.5px solid #fde68a", fontWeight: 700 } : { background: "#fff", color: "#64748b" }), cursor: "pointer" }}>
                        {on && "★ "}{v}
                      </button>
                    );
                  })}
                </div>
                <div style={npStyles.inputHelp}>{tier === "A" ? "Grand compte stratégique" : tier === "B" ? "Compte secondaire" : "Compte tactique"}</div>
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Site web">
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#94a3b8" }}>🌐</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }} value={companyWeb} onChange={(e) => setCompanyWeb(e.target.value)} placeholder="exemple.fr" />
                  {companyWeb && (
                    <a
                      href={companyWeb.startsWith("http") ? companyWeb : "https://" + companyWeb.replace(/^\/+/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...npStyles.linkTag, color: "#10b981", textDecoration: "none", cursor: "pointer" }}
                      title="Ouvrir le site"
                    >↗</a>
                  )}
                </div>
              </FormRow>
              <FormRow label="LinkedIn entreprise">
                <div style={npStyles.inputWithIcon}>
                  <span style={{ color: "#0a66c2" }}>in</span>
                  <input style={{ ...npStyles.input, border: "none", padding: 0, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }} value={companyLi} onChange={(e) => setCompanyLi(e.target.value)} placeholder="linkedin.com/company/…" />
                  {companyLi && (
                    <a
                      href={companyLi.startsWith("http") ? companyLi : "https://" + companyLi.replace(/^\/+/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...npStyles.linkTag, color: "#0a66c2", textDecoration: "none", cursor: "pointer" }}
                      title="Ouvrir la page LinkedIn"
                    >↗</a>
                  )}
                </div>
              </FormRow>
            </div>

            <FormRow label="Adresse siège">
              <div style={npStyles.formGrid2}>
                <input style={npStyles.input} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Adresse" />
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                  <input style={npStyles.input} value={companyCP} onChange={(e) => setCompanyCP(e.target.value)} placeholder="CP" />
                  <input style={npStyles.input} value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Ville" />
                </div>
              </div>
            </FormRow>

            {/* Établissements secondaires : N adresses additionnelles */}
            <FormRow label={"Établissements secondaires" + (secondaryEstabs.length ? " (" + secondaryEstabs.length + ")" : "")} subtitle="Agences, sites annexes, dépôts…">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {secondaryEstabs.map((es, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 100px 1fr 30px", gap: 6, alignItems: "center", padding: 6, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 7 }}>
                    <input style={{ ...npStyles.input, fontSize: 12 }} value={es.nom} onChange={(e) => updateSecondaryEstab(i, "nom", e.target.value)} placeholder="Nom site (ex: Agence Bordeaux)" />
                    <input style={{ ...npStyles.input, fontSize: 12 }} value={es.adresse} onChange={(e) => updateSecondaryEstab(i, "adresse", e.target.value)} placeholder="Adresse" />
                    <input style={{ ...npStyles.input, fontSize: 12 }} value={es.cp} onChange={(e) => updateSecondaryEstab(i, "cp", e.target.value)} placeholder="CP" />
                    <input style={{ ...npStyles.input, fontSize: 12 }} value={es.ville} onChange={(e) => updateSecondaryEstab(i, "ville", e.target.value)} placeholder="Ville" />
                    <button type="button" onClick={() => removeSecondaryEstab(i)} title="Retirer" style={{ width: 26, height: 26, padding: 0, border: "1px solid #fecaca", background: "#fee2e2", color: "#dc2626", borderRadius: 5, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={addSecondaryEstab} style={{ alignSelf: "flex-start", padding: "6px 12px", border: "1px dashed #c7d2fe", background: "#eef2ff", color: "#3730a3", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  + Ajouter un établissement secondaire
                </button>
              </div>
            </FormRow>
          </section>

          {/* SECTION 2 — Contact principal */}
          <section style={npStyles.section}>
            <SectionHead num="02" title="Contact principal" subtitle="Décideur identifié ou point d'entrée commercial" status="active" />

            {contactAutoFilled && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 12,
                            background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8, fontSize: 11.5, color: "#3730a3" }}>
                <span style={{ fontSize: 13 }}>🔍</span>
                <span style={{ flex: 1 }}>
                  <strong>Auto-complété depuis les dirigeants déclarés</strong> · prénom, nom, fonction et LinkedIn estimés à partir de l'open data INSEE/INPI. Email et téléphone restent à renseigner manuellement.
                </span>
                <button onClick={() => {
                  setContactPrenom(""); setContactNom(""); setContactRole(""); setContactLi("");
                  setExtraContactList([]); setContactAutoFilled(false);
                }} style={{ padding: "3px 9px", border: "1px solid #c7d2fe", background: "#fff", color: "#3730a3",
                           borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                  Effacer
                </button>
              </div>
            )}

            <div style={npStyles.formGrid2}>
              <FormRow label="Prénom" required>
                <input style={npStyles.input} value={contactPrenom} onChange={(e) => setContactPrenom(e.target.value)} />
              </FormRow>
              <FormRow label="Nom" required>
                <input style={npStyles.input} value={contactNom} onChange={(e) => setContactNom(e.target.value)} />
              </FormRow>
            </div>

            <div style={npStyles.formGrid2}>
              <FormRow label="Fonction" required>
                <select style={npStyles.input} value={contactRole} onChange={(e) => setContactRole(e.target.value)}>
                  <option value="">— Choisir une fonction —</option>
                  <optgroup label="Direction générale">
                    <option>CEO / Directeur général</option>
                    <option>Gérant / Dirigeant</option>
                    <option>COO / Directeur des opérations</option>
                    <option>Directeur de la transformation digitale</option>
                    <option>Directeur de site / d'agence</option>
                    <option>Secrétaire général</option>
                  </optgroup>
                  <optgroup label="Finance & Comptabilité">
                    <option>CFO / Directeur financier</option>
                    <option>Directeur administratif et financier (DAF)</option>
                    <option>Chef comptable</option>
                    <option>Comptable</option>
                    <option>Contrôleur de gestion</option>
                    <option>Responsable trésorerie</option>
                    <option>Crédit manager</option>
                    <option>Auditeur interne</option>
                  </optgroup>
                  <optgroup label="IT & Tech">
                    <option>CTO / Directeur technique</option>
                    <option>CIO / DSI</option>
                    <option>CISO / RSSI</option>
                    <option>Responsable IT / Manager SI</option>
                    <option>Responsable infrastructure</option>
                    <option>Architecte SI</option>
                    <option>Chef de projet IT</option>
                    <option>DevOps / SRE</option>
                    <option>Lead développeur</option>
                    <option>Administrateur système / réseaux</option>
                    <option>Technicien support / Helpdesk</option>
                    <option>Data Officer (CDO) / Data Engineer</option>
                  </optgroup>
                  <optgroup label="Marketing & Communication">
                    <option>CMO / Directeur marketing</option>
                    <option>Responsable marketing</option>
                    <option>Chargé de marketing</option>
                    <option>Brand manager</option>
                    <option>Product marketing manager</option>
                    <option>Responsable digital / SEO</option>
                    <option>Community / Social media manager</option>
                    <option>Chargé de communication</option>
                    <option>Directeur de la communication</option>
                  </optgroup>
                  <optgroup label="Commercial & Ventes">
                    <option>Directeur commercial / Sales Director</option>
                    <option>VP Sales</option>
                    <option>Account Executive</option>
                    <option>Business Developer</option>
                    <option>Commercial terrain</option>
                    <option>Inside Sales / SDR</option>
                    <option>Key Account Manager</option>
                    <option>Responsable agence commerciale</option>
                    <option>Chargé d'affaires</option>
                    <option>Customer Success Manager</option>
                  </optgroup>
                  <optgroup label="RH & Paie">
                    <option>CHRO / DRH</option>
                    <option>Responsable RH</option>
                    <option>Chargé de recrutement</option>
                    <option>Responsable paie</option>
                    <option>Gestionnaire de paie</option>
                    <option>Responsable formation</option>
                    <option>Responsable QVT / RSE</option>
                  </optgroup>
                  <optgroup label="Opérations & Production">
                    <option>Directeur des opérations</option>
                    <option>Directeur d'usine / Site manager</option>
                    <option>Responsable production</option>
                    <option>Responsable qualité / QHSE</option>
                    <option>Responsable logistique / Supply chain</option>
                    <option>Responsable maintenance</option>
                    <option>Chef d'atelier</option>
                  </optgroup>
                  <optgroup label="Achats & Juridique">
                    <option>Directeur des achats</option>
                    <option>Responsable achats</option>
                    <option>Acheteur</option>
                    <option>Approvisionneur</option>
                    <option>Directeur juridique</option>
                    <option>Juriste / DPO</option>
                  </optgroup>
                  <optgroup label="Autre">
                    <option>Assistant(e) de direction</option>
                    <option>Office manager</option>
                    <option>Consultant / Expert</option>
                    <option>Chef de projet</option>
                    <option>Autre — préciser dans notes</option>
                  </optgroup>
                </select>
              </FormRow>
              <FormRow label="Niveau hiérarchique">
                <div style={npStyles.segCtrl}>
                  {["Opér.", "Mgr", "Dir.", "C-level"].map((v) => (
                    <button key={v} onClick={() => setFonction(v)}
                            style={{ ...npStyles.segBtn, ...(fonction === v ? npStyles.segBtnActive : {}), cursor: "pointer" }}>{v}</button>
                  ))}
                </div>
              </FormRow>
            </div>

            {(() => {
              const V = window.HubValidators;
              const emailErr = V && V.email(contactEmail);
              const phoneErr = V && V.phone(contactPhone);
              return (
            <div style={npStyles.formGrid2}>
              <FormRow label="Email pro" required>
                <div style={{ ...npStyles.inputWithIcon, ...(emailErr ? V.errorStyle(emailErr) : {}) }}>
                  <span style={{ color: "#94a3b8" }}>✉</span>
                  <input type="email" style={{ ...npStyles.input, border: "none", padding: 0, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  {!emailErr && contactEmail && <span style={{ ...npStyles.linkTag, color: "#10b981" }}>✓ Format ok</span>}
                </div>
                {emailErr && <div style={V.errorMsgStyle(emailErr)}>{emailErr.message}</div>}
              </FormRow>
              <FormRow label="Téléphone">
                <div style={{ ...npStyles.inputWithIcon, ...(phoneErr ? V.errorStyle(phoneErr) : {}) }}>
                  <span style={{ color: "#94a3b8" }}>☎</span>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    style={{ ...npStyles.input, border: "none", padding: 0, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  {!phoneErr && contactPhone && <span style={{ ...npStyles.linkTag, color: "#10b981" }}>✓ Format ok</span>}
                </div>
                {phoneErr && <div style={V.errorMsgStyle(phoneErr)}>{phoneErr.message}</div>}
              </FormRow>
            </div>
              );
            })()}

            <FormRow label="Rôle dans le projet" subtitle="Quelle place dans la décision d'achat ?">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Décideur", "Prescripteur", "Utilisateur", "Acheteur"].map((r) => {
                  const on = roles.includes(r);
                  return (
                    <button key={r} onClick={() => toggleRole(r)}
                            style={{ ...npStyles.roleChip, ...(on ? npStyles.roleChipOn : {}), cursor: "pointer" }}>
                      {on && "★ "}{r}
                    </button>
                  );
                })}
              </div>
            </FormRow>

            <FormRow label="LinkedIn profil">
              <div style={npStyles.inputWithIcon}>
                <span style={{ color: "#0a66c2" }}>in</span>
                <input style={{ ...npStyles.input, border: "none", padding: 0, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }} value={contactLi} onChange={(e) => setContactLi(e.target.value)} placeholder="linkedin.com/in/…" />
                {contactLi && <span style={{ ...npStyles.linkTag, color: "#4f46e5" }}>↗</span>}
              </div>
            </FormRow>

            {/* Contacts additionnels */}
            {extraContactList.map((c, i) => (
              <div key={i} style={{ marginTop: 16, padding: 14, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Contact additionnel #{i + 2}</div>
                  <button onClick={() => removeExtraContact(i)} style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✕ Retirer</button>
                </div>
                <div style={npStyles.formGrid2}>
                  <FormRow label="Prénom"><input style={npStyles.input} value={c.prenom} onChange={(e) => updateExtraContact(i, "prenom", e.target.value)} /></FormRow>
                  <FormRow label="Nom"><input style={npStyles.input} value={c.nom} onChange={(e) => updateExtraContact(i, "nom", e.target.value)} /></FormRow>
                </div>
                <FormRow label="Fonction">
                  <select style={npStyles.input} value={c.fonction} onChange={(e) => updateExtraContact(i, "fonction", e.target.value)}>
                    <option value="">— Choisir —</option>
                    <option>CEO / Directeur général</option>
                    <option>CFO / Directeur financier</option>
                    <option>CIO / DSI</option>
                    <option>CTO / Directeur technique</option>
                    <option>CMO / Directeur marketing</option>
                    <option>CHRO / DRH</option>
                    <option>Chef de projet</option>
                    <option>Acheteur</option>
                    <option>Consultant / Expert</option>
                    <option>Autre</option>
                  </select>
                </FormRow>
                <div style={npStyles.formGrid2}>
                  <FormRow label="Email"><input type="email" style={npStyles.input} value={c.email} onChange={(e) => updateExtraContact(i, "email", e.target.value)} /></FormRow>
                  <FormRow label="Téléphone"><input style={npStyles.input} value={c.phone} onChange={(e) => updateExtraContact(i, "phone", e.target.value)} /></FormRow>
                </div>
              </div>
            ))}
          </section>

          </div>{/* /Row 1 */}


          {/* Bottom actions */}
          <div style={npStyles.actionsRow}>
            <button onClick={cancel} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>Annuler</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {flash && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: flash.tone === "err" ? "#fee2e2" : "#dcfce7", color: flash.tone === "err" ? "#991b1b" : "#065f46" }}>{flash.msg}</span>
              )}
              <button onClick={() => { addExtraContact(); showFlash("✓ Contact additionnel ajouté"); }} style={{ ...npStyles.ghostBtn, cursor: "pointer" }}>+ Ajouter un autre contact{extraContactList.length > 0 && ` (${extraContactList.length})`}</button>
              <button onClick={createProspect} style={{ ...npStyles.primaryBtn, cursor: "pointer" }}>✓ Créer le prospect</button>
            </div>
          </div>
        </div>

        {/* RIGHT — preview & IA */}
        <aside style={npStyles.previewCol}>

          {/* AI Enrichment */}
          <div style={npStyles.previewBlock}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>★</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Enrichissement IA</div>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>Sources externes croisées automatiquement</div>
              </div>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#0a66c2", color: "#fff" }}>in</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>LinkedIn Sales Navigator</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>1 200 employés · 8 nouvelles embauches IT 30j</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#f59e0b", color: "#fff" }}>S</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Base SIRENE / Pappers</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>SIREN, NAF, dirigeants, bilans 2022-2024</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#dc2626", color: "#fff" }}>📰</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Veille presse spécialisée</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>3 articles : « insatisfaction CRM », « budget IT en hausse »</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSource}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#a855f7", color: "#fff" }}>◷</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Radar concurrentiel</div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>Pega — fin contrat 30/06 · notice échue 01/05</div>
              </div>
              <span style={{ ...npStyles.statusOk }}>✓</span>
            </div>

            <div style={npStyles.aiSourcePending}>
              <span style={{ ...npStyles.aiSourceIcon, background: "#eef1f5", color: "#94a3b8" }}>↻</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#94a3b8" }}>Crawl site web entreprise</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>Stack tech, partenaires, dirigeants…</div>
              </div>
              <span style={{ fontSize: 10, color: "#a855f7", fontWeight: 600 }}>En cours</span>
            </div>
          </div>

          {/* Doublons potentiels — détection live via api.clients.list */}
          {(companyName.trim() || companySiren) && duplicates.length > 0 && (
            <div style={{ ...npStyles.previewBlock, background: "#fffbeb", borderColor: "#fde68a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a65f00" }}>Doublons potentiels</span>
              </div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, marginBottom: 8 }}>
                <strong>{duplicates.length} entreprise{duplicates.length > 1 ? "s" : ""} similaire{duplicates.length > 1 ? "s" : ""}</strong> trouvée{duplicates.length > 1 ? "s" : ""} dans la base :
              </div>
              {duplicates.slice(0, 3).map((d) => (
                <div key={d.id} style={npStyles.dupRow}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "#475569", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{(d.raison_sociale || d.name || "??").slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.raison_sociale || d.name}</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{d.status === "client" ? "Client" : "Prospect"} · {d.ville || d.city || "—"}</div>
                  </div>
                  <a href={"/fiche-client?id=" + encodeURIComponent(d.id)} style={{ ...npStyles.smBtn, fontSize: 10.5, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>Voir</a>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// ───── helpers
const SectionHead = ({ num, title, subtitle, status }) => {
  const statusMeta = {
    done: { bg: "#e8f8f1", color: "#0e7a55", icon: "✓" },
    active: { bg: "#eef2ff", color: "#4f46e5", icon: num },
    todo: { bg: "#fafbfc", color: "#94a3b8", icon: num },
  };
  const s = statusMeta[status];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eef1f5" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{s.icon}</div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.2 }}>{title}</h2>
        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
};

const FormRow = ({ label, subtitle, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{label}</span>
      {required && <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>}
      {subtitle && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{subtitle}</span>}
    </div>
    {children}
  </div>
);

const npStyles = {
  frame: { minWidth: 1280, background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column" },

  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  refMono: { fontVariantNumeric: "tabular-nums", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 4 },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eef1f5", background: "#fff" },
  heroIcon: { width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0, color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  completion: { padding: "10px 14px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: 20, gridAutoRows: "min-content" },

  formCol: { display: "flex", flexDirection: "column", gap: 14, paddingRight: 14 },
  pairGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" },

  section: { padding: 18, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },

  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f172a", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box" },
  inputHelp: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inputWithSuffix: { display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", background: "#fff" },
  suffix: { fontSize: 12, color: "#94a3b8", fontWeight: 500, paddingLeft: 8, borderLeft: "1px solid #eef1f5", marginLeft: 4 },
  inputWithIcon: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" },
  select: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer" },
  dateInput: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" },
  linkTag: { fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "#fafbfc", border: "1px solid currentColor", whiteSpace: "nowrap" },
  searchInputWrap: { position: "relative" },
  searchTag: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#eef2ff", color: "#4f46e5", fontWeight: 600 },

  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  formGrid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },

  segCtrl: { display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff" },
  segBtn: { padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  segBtnActive: { background: "#0f172a", color: "#fff", fontWeight: 600 },

  tierRow: { display: "flex", gap: 6 },
  tierBtn: { width: 40, padding: "6px 0", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, cursor: "pointer", textAlign: "center" },
  tierBadge: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 },

  roleChip: { padding: "5px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  roleChipOn: { background: "#fef3c7", borderColor: "#fbbf24", color: "#a16207", fontWeight: 700 },

  compChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid", borderRadius: 6, fontSize: 11.5 },

  linkedCardMini: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  changeBtn: { padding: "3px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },

  // BANT
  bantGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 },
  bantCard: { padding: 12, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  bantLetter: { width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  bantRating: { display: "flex", gap: 3, marginTop: 8 },
  bantDot: { width: 14, height: 5, borderRadius: 2, display: "inline-block" },

  // Action radios
  actionRadios: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  actionRadio: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" },
  actionRadioOn: { background: "linear-gradient(180deg, #fafbff, #fff)", borderColor: "#4f46e5", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" },

  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },
  addChip: { padding: "3px 10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 500 },

  actionsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginTop: 4 },

  // Preview column
  previewCol: { display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "start" },
  previewBlock: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  previewHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  previewCard: { padding: 14, background: "linear-gradient(180deg, #fafbfc, #fff)", border: "1px solid #eef1f5", borderRadius: 10 },
  previewLogo: { width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #475569, #1e293b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, letterSpacing: 0.4, flexShrink: 0 },

  aiSource: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  aiSourcePending: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", opacity: 0.7 },
  aiSourceIcon: { width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  statusOk: { fontSize: 11, color: "#10b981", fontWeight: 700 },

  dupRow: { display: "flex", alignItems: "center", gap: 9, padding: 8, background: "#fff", border: "1px solid #fde68a", borderRadius: 6 },
  smBtn: { padding: "3px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 5, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },
};

window.NewProspect = NewProspect;
