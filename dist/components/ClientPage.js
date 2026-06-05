// Fiche client 360 — pipe multi-contrats + actions menées / à mener

var ClientPage = () => {
  var [statsOpen, setStatsOpen] = React.useState(false);
  var [assetsOpen, setAssetsOpen] = React.useState(false);

  // Actions à mener : completion + ajout / suppression (localStorage)
  var [doneActions, setDoneActions] = React.useState({});
  var [extraActions, setExtraActions] = React.useState([]);
  // Opportunités : édition inline
  var [oppDetailIdx, setOppDetailIdx] = React.useState(null);
  var [oppEdits, setOppEdits] = React.useState({}); // { ref: { stage, amount, proba, owner, close, notes } }

  React.useEffect(() => {
    try {
      setDoneActions(JSON.parse(localStorage.getItem("hubAstorya.actionsDone.v1") || "{}"));
    } catch (e) {}
    try {
      setExtraActions(JSON.parse(localStorage.getItem("hubAstorya.actionsExtra.v1") || "[]"));
    } catch (e) {}
    try {
      setCompletedActions(JSON.parse(localStorage.getItem("hubAstorya.actionsCompleted.v1") || "[]"));
    } catch (e) {}
    try {
      setOppEdits(JSON.parse(localStorage.getItem("hubAstorya.oppEdits.v1") || "{}"));
    } catch (e) {}
  }, []);
  var [completedActions, setCompletedActions] = React.useState([]);

  // Complète une action utilisateur : la sort de extraActions et la pose dans completedActions
  var completeAction = a => {
    var completedEntry = {
      id: a.id,
      client_id: a.client_id || null,
      type: a.type || (a.icon === "📞" ? "call" : a.icon === "✉" ? "email" : a.icon === "👥" ? "meeting" : a.icon === "📅" ? "rdv" : "task"),
      icon: a.icon || "✓",
      color: "#10b981",
      title: a.title,
      who: a.assigned ? `Réalisé par ${a.assigned}` : "Terminée",
      at: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + " · " + new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      meta: a.meta || null,
      completed_at: new Date().toISOString()
    };
    setExtraActions(arr => {
      var next = arr.filter(x => x.id !== a.id);
      try {
        localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setCompletedActions(arr => {
      var next = [completedEntry, ...arr];
      try {
        localStorage.setItem("hubAstorya.actionsCompleted.v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };
  var toggleAction = (key, action) => {
    // Pour une action utilisateur (a.id présent) : passer au statut terminé = déplacer
    if (action && action.id) {
      completeAction(action);
      return;
    }
    setDoneActions(prev => {
      var next = {
        ...prev,
        [key]: !prev[key]
      };
      try {
        localStorage.setItem("hubAstorya.actionsDone.v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };
  // Modal "Nouvelle action à mener"
  var [addActionOpen, setAddActionOpen] = React.useState(false);
  var [editOpen, setEditOpen] = React.useState(false);
  var [editDraft, setEditDraft] = React.useState({});
  var ownerListE = [{
    name: "Nadia Lefèvre",
    role: "AE Senior · EMEA",
    color: "#a855f7"
  }, {
    name: "Karim Ben Salah",
    role: "AE Senior · Cyber",
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
  var [actionMenuKey, setActionMenuKey] = React.useState(null);
  var [reschedule, setReschedule] = React.useState(null); // { id, date, time, title }
  React.useEffect(() => {
    if (!actionMenuKey) return;
    var close = () => setActionMenuKey(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionMenuKey]);
  var [newAction, setNewAction] = React.useState({
    type: "email",
    title: "",
    date: "",
    time: "",
    priority: "moyenne",
    assigned: "",
    tag: "",
    meta: ""
  });
  var openAddAction = () => {
    setNewAction({
      type: "email",
      title: "",
      date: "",
      time: "",
      priority: "moyenne",
      assigned: "",
      tag: "",
      meta: ""
    });
    setAddActionOpen(true);
  };
  var submitNewAction = () => {
    if (!newAction.title.trim()) {
      alert("Le titre est obligatoire");
      return;
    }
    var iconMap = {
      email: "✉",
      call: "📞",
      visio: "💻",
      rdv: "📅",
      task: "✓",
      note: "✎"
    };
    var dueText = newAction.date ? new Date(newAction.date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    }) + (newAction.time ? " · " + newAction.time : "") : "Date à définir";
    var next = [{
      id: "EX-" + Date.now(),
      client_id: urlId || "ACC-0184",
      type: newAction.type,
      title: newAction.title.trim(),
      due: dueText,
      priority: newAction.priority,
      icon: iconMap[newAction.type] || "•",
      meta: newAction.meta || "",
      assigned: newAction.assigned || "Vous",
      assignedColor: "#3730a3",
      tag: newAction.tag || (newAction.type === "email" ? "Email" : newAction.type === "call" ? "Appel" : newAction.type === "visio" ? "Visio" : newAction.type === "rdv" ? "RDV" : newAction.type === "task" ? "Tâche" : "Note"),
      tagColor: "#475569"
    }, ...extraActions];
    setExtraActions(next);
    try {
      localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next));
    } catch (e) {}
    setAddActionOpen(false);
  };
  var addAction = () => openAddAction();
  var removeAction = id => {
    var next = extraActions.filter(a => a.id !== id);
    setExtraActions(next);
    try {
      localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next));
    } catch (e) {}
  };
  var updateOppField = (ref, field, value) => {
    setOppEdits(prev => {
      var next = {
        ...prev,
        [ref]: {
          ...(prev[ref] || {}),
          [field]: value
        }
      };
      try {
        localStorage.setItem("hubAstorya.oppEdits.v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // ───── Promotion prospect → client quand un projet passe à "won"
  var promoteToClient = (clientId, oppName) => {
    try {
      var local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      var idx = local.findIndex(p => p.id === clientId);
      if (idx >= 0) {
        local[idx] = {
          ...local[idx],
          status: "client",
          client_since: new Date().toISOString(),
          won_via: oppName || "projet signé"
        };
        localStorage.setItem("hubAstorya.prospects.v1", JSON.stringify(local));
        return true;
      }
    } catch (e) {}
    return false;
  };

  // ───── Clients récents : top 6 (prospects + clients) depuis localStorage + Supabase
  var [recents, setRecents] = React.useState([]);
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
      status: p.status || "prospect",
      color: "#1e40af"
    }));
    if (window.HubData && window.HubData.enabled()) {
      window.HubData.fetchClients().then(({
        data
      }) => {
        var fromSupa = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          status: "client",
          color: "#0f766e"
        }));
        var seen = new Set();
        setRecents([...fromLocal, ...fromSupa].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true)).slice(0, 8));
      });
    } else {
      // Fallback démo si rien
      var fallback = fromLocal.length > 0 ? fromLocal : [{
        id: "ACC-0184",
        name: "AXA Wealth France",
        status: "client",
        color: "#1e40af"
      }, {
        id: "ACC-0211",
        name: "MAIF Innovation",
        status: "client",
        color: "#10b981"
      }, {
        id: "ACC-0156",
        name: "Crédit Agricole Sud",
        status: "client",
        color: "#dc2626"
      }];
      setRecents(fallback.slice(0, 8));
    }
  }, []);

  // Modal opp détail : stage editable + autres champs
  var openOppDetail = i => setOppDetailIdx(i);
  var closeOppDetail = () => setOppDetailIdx(null);

  // ───── Contrats du client : localStorage + démo selon contexte
  var [contractsList, setContractsList] = React.useState([]);
  React.useEffect(() => {
    var key = "hubAstorya.contracts.v1";
    var all = [];
    try {
      all = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {}
    var stored = all.filter(c => c.client_id === (urlId || "ACC-0184"));
    if (stored.length > 0) {
      setContractsList(stored);
      return;
    }
    // Démo AXA si pas d'ID custom
    if (!urlId) {
      setContractsList([{
        id: "CTR-0184-01",
        client_id: "ACC-0184",
        name: "Astorya Suite — 750 sièges",
        product: "Astorya Suite v3 · Licence annuelle",
        type: "Licence SaaS",
        amount: "184 k€ / an",
        start: "01 mars 2024",
        end: "28 fév. 2027",
        status: "active"
      }, {
        id: "CTR-0184-02",
        client_id: "ACC-0184",
        name: "Support Premium 24/7",
        product: "Maintenance et SLA hotline",
        type: "Maintenance",
        amount: "48 k€ / an",
        start: "01 mars 2024",
        end: "28 fév. 2027",
        status: "active"
      }, {
        id: "CTR-0184-03",
        client_id: "ACC-0184",
        name: "Module Cyber — extension",
        product: "Cyber Add-on (POC 50 utilisateurs)",
        type: "Licence module",
        amount: "12 k€ / an",
        start: "15 sept. 2025",
        end: "14 sept. 2026",
        status: "expiring"
      }, {
        id: "CTR-0184-04",
        client_id: "ACC-0184",
        name: "Renouvellement Suite 2024",
        product: "Avenant renouvellement triennal",
        type: "Avenant",
        amount: "184 k€",
        start: "01 mars 2023",
        end: "28 fév. 2024",
        status: "expired"
      }]);
    } else {
      setContractsList([]);
    }
  }, [urlId]);

  // ───── Contacts clés du client : démo AXA + custom localStorage par client
  var defaultContacts = [];
  var [customContacts, setCustomContacts] = React.useState([]);
  React.useEffect(() => {
    try {
      setCustomContacts(JSON.parse(localStorage.getItem("hubAstorya.contacts.v1") || "[]"));
    } catch (e) {}
  }, []);

  // Compose la liste : si client custom, démarre depuis contact_principal + extras locaux. Sinon démo AXA + customs.
  // Vide par défaut pour un nouveau prospect tant que rien n'est renseigné (pas de carte vide).
  var allContacts = (() => {
    var localForThis = customContacts.filter(cc => cc.client_id === (urlId || "ACC-0184")).map(cc => ({
      ...cc,
      _custom: true
    }));
    if (isCustom) {
      var cp = c.contact_principal || display.contactPrincipal;
      var fullName = cp ? ((cp.prenom || "") + " " + (cp.nom || "")).trim() : "";
      var principal = fullName || cp && cp.email || cp && cp.phone ? [{
        name: fullName || cp && cp.email || "Contact principal",
        role: cp && cp.fonction || "—",
        email: cp && cp.email || "",
        phone: cp && cp.phone || "",
        linkedin: cp && cp.linkedin || "",
        color: "#a855f7",
        champion: Array.isArray(c.roles) && c.roles.includes("Champion"),
        decisionRoles: Array.isArray(c.roles) ? c.roles : [],
        hierarchie: c.fonction || "",
        last: "Contact principal · ajouté à la création"
      }] : [];
      var additionnels = (c.contacts_additionnels || []).filter(x => (x.prenom || x.nom || x.email || x.phone || "").toString().trim()) // ignore les contacts entièrement vides
      .map((x, i) => ({
        name: ((x.prenom || "") + " " + (x.nom || "")).trim() || x.email || x.phone || "Contact",
        role: x.fonction || "—",
        email: x.email || "",
        phone: x.phone || "",
        linkedin: x.linkedin || "",
        color: ["#0ea5e9", "#f59e0b", "#dc2626", "#10b981", "#8b5cf6"][i % 5],
        last: "Co-contact · ajouté à la création"
      }));
      return [...principal, ...additionnels, ...localForThis];
    }
    return [...defaultContacts, ...localForThis];
  })();
  var addContact = () => {
    var fullName = prompt("Nom complet du contact :");
    if (!fullName) return;
    var role = prompt("Fonction :", "—");
    var email = prompt("Email :", "");
    var phone = prompt("Téléphone :", "");
    var newContact = {
      id: "CT-" + Date.now().toString().slice(-7),
      client_id: urlId || "ACC-0184",
      name: fullName,
      role: role || "—",
      email: email || "",
      phone: phone || "",
      color: ["#a855f7", "#dc2626", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"][Math.floor(Math.random() * 6)],
      last: "à l'instant"
    };
    var next = [newContact, ...customContacts];
    setCustomContacts(next);
    try {
      localStorage.setItem("hubAstorya.contacts.v1", JSON.stringify(next));
    } catch (e) {}
  };
  var removeContact = id => {
    var next = customContacts.filter(c => c.id !== id);
    setCustomContacts(next);
    try {
      localStorage.setItem("hubAstorya.contacts.v1", JSON.stringify(next));
    } catch (e) {}
  };
  var [pastShowAll, setPastShowAll] = React.useState(false);
  var addContract = () => {
    var cid = urlId || display.id || "";
    window.location.href = "/nouveau-contrat" + (cid ? "?client=" + encodeURIComponent(cid) : "");
  };

  // ───── Récupère le client à afficher selon l'ID dans l'URL
  // - localStorage prospects créés via /nouveau-prospect (clé hubAstorya.prospects.v1)
  // - sinon Supabase clients
  // - sinon fallback démo AXA Wealth France
  var urlId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
  var [loadedClient, setLoadedClient] = React.useState(null);
  React.useEffect(() => {
    if (!urlId) {
      setLoadedClient(null);
      return;
    }
    // 1. cherche dans localStorage
    try {
      var local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      var hit = local.find(p => p.id === urlId);
      if (hit) {
        setLoadedClient(hit);
        return;
      }
    } catch (e) {}
    // 2. cherche dans Supabase
    if (window.HubData && window.HubData.enabled() && window.HubData.fetchClientById) {
      window.HubData.fetchClientById(urlId).then(({
        data
      }) => {
        if (data) setLoadedClient({
          ...data,
          _source: "supabase"
        });
      });
    }
  }, [urlId]);

  // Mapping unifié vers les champs d'affichage
  var c = loadedClient || {};
  // isCustom = true dès qu'on a un ?id= dans l'URL (même avant que le fetch
  // ait peuplé loadedClient) → empêche le flash des défauts AXA sur la fiche
  // d'un prospect Astorya pendant le chargement.
  var isCustom = !!urlId || !!loadedClient;
  // Si on a un ?id= mais pas encore de loadedClient, on évite TOUT fallback AXA
  // (sinon flash visuel du nom/secteur AXA pendant le fetch).
  var empty = isCustom && !loadedClient;
  var display = {
    id: c.id || (empty ? urlId || "—" : "ACC-0184"),
    name: c.raison_sociale || c.name || (empty ? "Chargement…" : "AXA Wealth France"),
    sector: c.secteur || c.industry || (empty ? "—" : "Asset Management"),
    size: c.effectif ? `Effectif ${c.effectif}` : empty ? "—" : "12 000 employés",
    city: c.ville || c.city || (empty ? "—" : "Paris · La Défense"),
    web: c.site_web || c.website || (empty ? "" : "axa-im.fr"),
    since: c.created_at ? `Prospect depuis ${new Date(c.created_at).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : empty ? "" : "Client depuis mars 2024",
    desc: c.notes || c.besoin || (isCustom ? c.tier ? `Compte tier ${c.tier} — créé via le formulaire prospect.` : empty ? "" : "Compte créé via le formulaire prospect." : "Filiale française gestion de patrimoine du groupe AXA. Direction : Émilie Roux (VP Innovation)."),
    logo: (c.raison_sociale || c.name || (empty ? "?" : "AX")).slice(0, 2).toUpperCase(),
    arr: isCustom ? "—" : "184 k€",
    pipe: isCustom ? "0" : "355 k€",
    health: isCustom ? "—" : "78",
    contactPrincipal: c.contact_principal || null,
    owner: c.owner || (isCustom ? "—" : "Nadia Lefèvre"),
    ownerColor: c.owner_color || (isCustom ? "#64748b" : "#a855f7"),
    coowner: c.coowner || (isCustom ? "—" : "Karim Ben Salah"),
    coownerColor: c.coowner_color || (isCustom ? "#64748b" : "#6366f1"),
    source: c.source || (isCustom ? "—" : "Salon Finovate Paris"),
    concurrent: c.concurrent || (isCustom ? "—" : "Salesforce · Pega"),
    concurrentEnd: c.concurrent_end || "",
    concurrentAmount: c.concurrent_amount || "",
    contactDate: c.contact_date || "",
    projectDate: c.project_date || "",
    clientSince: c.client_since ? new Date(c.client_since).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }) : c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }) : isCustom ? "—" : "14 mars 2024",
    renewal: c.renewal || (isCustom ? "—" : "01 mars 2026 ✓"),
    activeContracts: c.active_contracts || (isCustom ? "—" : "1 (Suite 2024-2026)"),
    address: c.adresse || (isCustom ? "—" : "Tour Majunga"),
    cp: c.code_postal || (isCustom ? "" : "92800"),
    addressCity: c.ville || c.city || (isCustom ? "" : "Puteaux"),
    siren: c.siren || (isCustom ? "" : "487 921 304"),
    naf: c.naf || (isCustom ? "" : "6420Z"),
    sousSecteur: c.sous_secteur || "",
    tier: c.tier || (isCustom ? "" : ""),
    ca: c.ca_meur || "",
    linkedin: c.linkedin_entreprise || "",
    tva: c.tva || "",
    fonction: c.fonction || "",
    action: c.action || "",
    besoin: c.besoin || ""
  };
  var openEdit = () => {
    setEditDraft({
      owner: display.owner === "—" ? "" : display.owner,
      coowner: display.coowner === "—" ? "" : display.coowner,
      sector: display.sector === "—" ? "" : display.sector,
      sousSecteur: display.sousSecteur || "",
      source: display.source === "—" ? "" : display.source,
      concurrent: display.concurrent === "—" ? "" : display.concurrent,
      concurrentEnd: display.concurrentEnd || "",
      concurrentAmount: display.concurrentAmount || "",
      contactDate: display.contactDate || "",
      projectDate: display.projectDate || "",
      tier: display.tier || "",
      ca: display.ca || "",
      address: display.address === "—" ? "" : display.address,
      cp: display.cp || "",
      addressCity: display.addressCity || "",
      web: display.web || "",
      linkedin: display.linkedin || "",
      siren: display.siren || "",
      naf: display.naf || "",
      tva: display.tva || "",
      desc: c.notes || c.besoin || ""
    });
    setEditOpen(true);
  };
  var saveEdit = () => {
    if (!urlId) {
      alert("Édition uniquement disponible pour les prospects créés");
      return;
    }
    var ownerObj = ownerListE.find(o => o.name === editDraft.owner);
    var coownerObj = ownerListE.find(o => o.name === editDraft.coowner);
    var patch = {
      owner: editDraft.owner || null,
      owner_role: ownerObj ? ownerObj.role : null,
      owner_color: ownerObj ? ownerObj.color : null,
      coowner: editDraft.coowner || null,
      coowner_color: coownerObj ? coownerObj.color : null,
      secteur: editDraft.sector || null,
      sous_secteur: editDraft.sousSecteur || null,
      source: editDraft.source || null,
      concurrent: editDraft.concurrent || null,
      concurrent_end: editDraft.concurrentEnd || null,
      concurrent_amount: editDraft.concurrentAmount || null,
      contact_date: editDraft.contactDate || null,
      project_date: editDraft.projectDate || null,
      tier: editDraft.tier || null,
      ca_meur: editDraft.ca || null,
      adresse: editDraft.address || null,
      code_postal: editDraft.cp || null,
      ville: editDraft.addressCity || null,
      site_web: editDraft.web || null,
      linkedin_entreprise: editDraft.linkedin || null,
      siren: editDraft.siren || null,
      naf: editDraft.naf || null,
      tva: editDraft.tva || null,
      notes: editDraft.desc || null
    };
    try {
      var all = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      var idx = all.findIndex(p => p.id === urlId);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          ...patch
        };
        localStorage.setItem("hubAstorya.prospects.v1", JSON.stringify(all));
        setLoadedClient({
          ...(loadedClient || {}),
          ...patch
        });
      } else {
        alert("Prospect introuvable en local — modification non sauvée");
      }
    } catch (e) {}
    setEditOpen(false);
  };
  var Avatar = ({
    name,
    size = 24,
    color
  }) => {
    if (!name) return null;
    var initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    var palette = {
      K: "#6366f1",
      L: "#0ea5e9",
      T: "#f59e0b",
      S: "#10b981",
      C: "#ef4444",
      M: "#a855f7",
      N: "#ec4899",
      E: "#14b8a6",
      A: "#dc2626",
      J: "#0ea5e9",
      P: "#8b5cf6"
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

  // ── Pipe : opportunités du client AXA Wealth France
  var pipeStages = [{
    k: "qualif",
    label: "Qualification",
    color: "#94a3b8"
  }, {
    k: "discovery",
    label: "Discovery",
    color: "#3b82f6"
  }, {
    k: "propo",
    label: "Proposition",
    color: "#a855f7"
  }, {
    k: "nego",
    label: "Négociation",
    color: "#ea580c"
  }, {
    k: "won",
    label: "Signé",
    color: "#10b981"
  }];
  var defaultOpps = [{
    name: "Astorya Suite — 750 sièges",
    amount: "215 000 €",
    stage: "propo",
    proba: 55,
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    close: "15 juin 2026",
    days: 8,
    hot: true,
    ref: "OPP-2814"
  }, {
    name: "Module Cyber — POC 50 utilisateurs",
    amount: "48 000 €",
    stage: "discovery",
    proba: 40,
    owner: "Karim Ben Salah",
    ownerColor: "#6366f1",
    close: "30 juin 2026",
    days: 4,
    ref: "OPP-2841"
  }, {
    name: "Extension Hub — filiale Belgique",
    amount: "92 000 €",
    stage: "qualif",
    proba: 20,
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    close: "15 sept. 2026",
    days: 2,
    isNew: true,
    ref: "OPP-2867"
  }, {
    name: "Renouvellement Suite 2024-2026",
    amount: "184 000 €",
    stage: "won",
    proba: 100,
    owner: "Nadia Lefèvre",
    ownerColor: "#a855f7",
    close: "01 mars 2026",
    days: 0,
    won: true,
    ref: "OPP-2698"
  }];

  // ── Opportunités créées via /nouvelle-opportunite, filtrées sur ce client
  var [storedOpps, setStoredOpps] = React.useState([]);
  React.useEffect(() => {
    try {
      var all = JSON.parse(localStorage.getItem("hubAstorya.opportunities.v1") || "[]");
      var cid = urlId || "ACC-0184";
      var mine = all.filter(o => o.client_id === cid).map(o => ({
        ref: o.ref || o.id,
        name: o.name,
        amount: o.amount ? String(o.amount).match(/€/) ? o.amount : o.amount + " €" : "—",
        stage: o.stage || "qualif",
        proba: o.proba || 20,
        owner: o.owner || "Vous",
        ownerColor: "#0ea5e9",
        close: o.close || o.target_date || "—",
        days: 0,
        isNew: true
      }));
      setStoredOpps(mine);
    } catch (e) {}
  }, [urlId]);

  // Pour AXA (pas un prospect custom) → mélange défauts + stockées ; sinon uniquement les stockées
  var opportunities = isCustom ? storedOpps : [...storedOpps, ...defaultOpps];

  // ── Actions menées (passé, dernières)
  var past = [{
    type: "email",
    icon: "✉",
    color: "#a855f7",
    title: "Email envoyé — Proposition Suite v2",
    who: "Nadia Lefèvre → Émilie Roux",
    at: "il y a 4 h",
    meta: "Pièce jointe : Proposition-AXA-v2.pdf"
  }, {
    type: "call",
    icon: "☎",
    color: "#10b981",
    title: "Appel sortant — 22 min",
    who: "Karim Ben Salah → Antoine Mercier (CISO)",
    at: "hier · 09:18",
    meta: "Validation périmètre sécurité — ouvert à POC 50 utilisateurs"
  }, {
    type: "meeting",
    icon: "👥",
    color: "#0ea5e9",
    title: "RDV — Démo Astorya Suite",
    who: "5 participants AXA · 60 min",
    at: "jeu. 21 mai",
    meta: "Très bon retour UX sur les modules Dashboard et Reporting"
  }, {
    type: "stage",
    icon: "↗",
    color: "#a855f7",
    title: "Étape avancée : Discovery → Proposition",
    who: "OPP-2814 · par Nadia Lefèvre",
    at: "lun. 25 mai",
    meta: null
  }, {
    type: "note",
    icon: "✎",
    color: "#a65f00",
    title: "Note privée — Sentiment décideurs",
    who: "Nadia Lefèvre",
    at: "lun. 25 mai",
    meta: "CFO veut ROI à 18 mois. Préparer slide dédié pour comité."
  }, {
    type: "email",
    icon: "✉",
    color: "#a855f7",
    title: "Email reçu — Questions techniques",
    who: "Émilie Roux (VP Innovation)",
    at: "il y a 2 j",
    meta: "3 points à clarifier : DORA, localisation UE, tarif > 500 users"
  }, {
    type: "meeting",
    icon: "👥",
    color: "#0ea5e9",
    title: "RDV — Cadrage besoins métier",
    who: "3 participants · 45 min",
    at: "ven. 16 mai",
    meta: "Priorités confirmées : reporting client, conformité, mobilité"
  }, {
    type: "doc",
    icon: "📄",
    color: "#64748b",
    title: "Document partagé — RFP Astorya",
    who: "Téléchargé 7 fois par AXA",
    at: "08 mai",
    meta: "RFP-Astorya-2026.pdf · 2,4 Mo"
  }];

  // Historique étendu (39 anciennes actions ajoutées au "Tout voir")
  var pastExtras = [{
    type: "doc",
    icon: "📄",
    color: "#64748b",
    title: "RFP — Présélection 2026",
    who: "Échangée avec Émilie Roux",
    at: "02 mai",
    meta: "Astorya retenue dans la shortlist finale (5 éditeurs)"
  }, {
    type: "call",
    icon: "☎",
    color: "#10b981",
    title: "Appel — Cadrage gouvernance DORA",
    who: "Karim Ben Salah → Émilie Roux",
    at: "28 avr.",
    meta: "Confirmation localisation des données UE obligatoire"
  }, {
    type: "email",
    icon: "✉",
    color: "#a855f7",
    title: "Email — Documentation sécurité",
    who: "Antoine Mercier → Nadia Lefèvre",
    at: "25 avr.",
    meta: "Demande ISO 27001 + SOC2 type II"
  }, {
    type: "meeting",
    icon: "👥",
    color: "#0ea5e9",
    title: "RDV — Présentation roadmap 2026",
    who: "12 participants AXA",
    at: "18 avr.",
    meta: "Webinar produit · NPS 9/10"
  }, {
    type: "stage",
    icon: "↗",
    color: "#a855f7",
    title: "OPP-2698 : signé",
    who: "Renouvellement Suite 24-26",
    at: "01 mars",
    meta: "184 k€ · 3 ans"
  }];
  for (var i = 0; i < 34; i++) pastExtras.push({
    type: "stage",
    icon: "•",
    color: "#94a3b8",
    title: `Synchronisation CRM #${i + 1}`,
    who: "Système",
    at: "Q1 2026",
    meta: "Mise à jour automatique"
  });
  // Pour un prospect custom : actions menées vides par défaut (pas d'historique AXA)
  // Actions terminées par l'utilisateur, filtrées sur ce client
  var completedForThis = completedActions.filter(x => x.client_id === (urlId || "ACC-0184"));
  var pastAll = past.concat(pastExtras);
  // Custom prospect : on n'affiche QUE les actions terminées par l'utilisateur. AXA : démo + customs en tête.
  var pastShown = isCustom ? completedForThis : [...completedForThis, ...(pastShowAll ? pastAll : past)];
  var pastTotal = isCustom ? completedForThis.length : pastAll.length + completedForThis.length;

  // ── Actions à mener (futur, à faire)
  var future = [{
    priority: "haute",
    overdue: true,
    icon: "📧",
    title: "Répondre aux 3 questions techniques d'Émilie",
    due: "Aujourd'hui · 18:00",
    assigned: "Nadia Lefèvre",
    assignedColor: "#a855f7",
    meta: "Brouillon IA pré-rempli (citations p.12-14 de la proposition)",
    tag: "OPP-2814",
    tagColor: "#a855f7"
  }, {
    priority: "haute",
    icon: "📅",
    title: "Comité achats AXA — présentation finale Suite",
    due: "Jeu. 28 mai · 14h00 · 30 min",
    assigned: "Nadia Lefèvre",
    assignedColor: "#a855f7",
    meta: "Visio Teams · 4 participants AXA (Roux, Mercier, Pasquier, Lopez)",
    tag: "OPP-2814",
    tagColor: "#a855f7",
    attendees: ["Émilie Roux", "Antoine Mercier", "Julien Pasquier", "Marie Lopez"]
  }, {
    priority: "moyenne",
    icon: "📞",
    title: "Appel de cadrage POC Cyber avec Antoine Mercier",
    due: "Ven. 29 mai · 10h00",
    assigned: "Karim Ben Salah",
    assignedColor: "#6366f1",
    meta: "Préparer planning d'installation et plan de test",
    tag: "OPP-2841",
    tagColor: "#dc2626"
  }, {
    priority: "moyenne",
    icon: "✉",
    title: "Envoyer proposition v3 Suite mise à jour",
    due: "Dim. 31 mai",
    assigned: "Nadia Lefèvre",
    assignedColor: "#a855f7",
    meta: "Intégrer commentaires CFO sur le ROI 18 mois",
    tag: "OPP-2814",
    tagColor: "#a855f7"
  }, {
    priority: "basse",
    icon: "👥",
    title: "RDV de découverte filiale Belgique",
    due: "Sem. du 02 juin",
    assigned: "Nadia Lefèvre",
    assignedColor: "#a855f7",
    meta: "Identifier interlocuteurs locaux à Bruxelles",
    tag: "OPP-2867",
    tagColor: "#94a3b8"
  }, {
    priority: "basse",
    icon: "🔄",
    title: "Préparer renouvellement Suite 2026-2028",
    due: "Sept. 2026",
    assigned: "Nadia Lefèvre",
    assignedColor: "#a855f7",
    meta: "Renouvellement automatique en mars — anticiper négociation",
    tag: "Recurring",
    tagColor: "#10b981"
  }, {
    priority: "ai",
    icon: "★",
    title: "Suggestion IA — Inviter Émilie Roux à user-group Astorya",
    due: "Ce mois",
    meta: "Émilie a téléchargé 3 white papers ce trimestre. Signal champion fort.",
    tag: "Insight",
    tagColor: "#0f172a"
  }];
  var prioMeta = {
    haute: {
      label: "Haute",
      color: "#dc2626",
      bg: "#fdecec"
    },
    moyenne: {
      label: "Moyenne",
      color: "#ea580c",
      bg: "#fef0e6"
    },
    basse: {
      label: "Basse",
      color: "#475569",
      bg: "#eef1f5"
    },
    ai: {
      label: "IA",
      color: "#fff",
      bg: "#0f172a"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: cliStyles.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: cliStyles.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...cliStyles.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "CRM commercial"))), /*#__PURE__*/React.createElement("a", {
    href: "/nouvelle-opportunite?client=" + encodeURIComponent(display.id),
    style: {
      ...cliStyles.newBtn,
      textDecoration: "none",
      cursor: "pointer"
    }
  }, "+ Nouvelle opportunit\xE9 ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      ...cliStyles.newBtn,
      textDecoration: "none",
      cursor: "pointer",
      background: "#fff",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
      marginTop: -8
    }
  }, "+ Nouveau prospect ", /*#__PURE__*/React.createElement("span", {
    style: {
      ...cliStyles.kbd,
      background: "#f1f5f9",
      color: "#475569"
    }
  }, "P")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.navLabel
  }, "Espace"), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...cliStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.navCount
  }, "32")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cliStyles.navItem,
      ...cliStyles.navItemActive
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u25F0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Comptes"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.navCount
  }, "412")), /*#__PURE__*/React.createElement("a", {
    onClick: () => alert("Carnet contacts — 1 184 fiches\n\n(Sera connecté à la table profiles + clients Supabase.)"),
    style: {
      ...cliStyles.navItem,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Contacts"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.navCount
  }, "1 184")), /*#__PURE__*/React.createElement("a", {
    onClick: () => alert("Timeline activités client — Appels, emails, RDV, notes\n\n(Sera connectée à la table activities.)"),
    style: {
      ...cliStyles.navItem,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Activit\xE9s"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.navCount
  }, "27"))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.navLabel
  }, "Clients r\xE9cents \xB7 ", recents.length), recents.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      padding: "6px 8px"
    }
  }, "Aucun compte. ", /*#__PURE__*/React.createElement("a", {
    href: "/nouveau-prospect",
    style: {
      color: "#3730a3",
      fontWeight: 600
    }
  }, "+ Cr\xE9er")), recents.map(c => {
    var initials = (c.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    var active = c.id === display.id;
    return /*#__PURE__*/React.createElement("a", {
      key: c.id,
      href: "/fiche-client?id=" + encodeURIComponent(c.id),
      style: {
        ...cliStyles.navItem,
        ...(active ? cliStyles.navItemActive : {}),
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...cliStyles.miniLogo,
        background: c.color
      }
    }, initials), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontWeight: active ? 600 : 400,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, c.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        padding: "1px 5px",
        borderRadius: 3,
        fontWeight: 700,
        background: c.status === "client" ? "#dcfce7" : "#fef3c7",
        color: c.status === "client" ? "#065f46" : "#78350f",
        textTransform: "uppercase"
      }
    }, c.status === "client" ? "✓" : "P"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "/administration-utilisateurs",
    title: "Profil & pr\xE9f\xE9rences",
    style: {
      ...cliStyles.userRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Nadia Lef\xE8vre",
    size: 26,
    color: "#a855f7"
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
  }, "Nadia Lef\xE8vre"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "AE \xB7 EMEA")))), /*#__PURE__*/React.createElement("main", {
    style: cliStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: cliStyles.topbar
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
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Comptes"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0f172a",
      fontWeight: 600
    }
  }, display.name), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.refMono
  }, display.id), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.healthChip
  }, "\u25CF Compte sain")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: cliStyles.iconBtn
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    style: cliStyles.iconBtn
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("✓ Vous suivez " + display.name + " — notifications activées pour ce compte."),
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2605 Suivre"), /*#__PURE__*/React.createElement("button", {
    style: cliStyles.iconBtn
  }, "\u22EF"))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.scroll
  }, /*#__PURE__*/React.createElement("section", {
    style: cliStyles.hero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.coLogoBig
  }, display.logo), /*#__PURE__*/React.createElement("div", {
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
    style: cliStyles.industryChip
  }, display.sector), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.metaChip
  }, "Grand compte"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.metaChip
  }, display.size), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "\uD83D\uDCCD ", display.city), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.dot
  }), /*#__PURE__*/React.createElement("a", {
    href: display.web && display.web.startsWith("http") ? display.web : "https://" + display.web,
    target: "_blank",
    style: {
      fontSize: 12,
      color: "#4f46e5",
      cursor: "pointer",
      textDecoration: "none"
    }
  }, display.web, " \u2197"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, display.since)), /*#__PURE__*/React.createElement("h1", {
    style: cliStyles.h1
  }, display.name), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.subtitle
  }, "Filiale fran\xE7aise gestion de patrimoine du groupe AXA. Direction : \xC9milie Roux (VP Innovation)."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.tag
  }, "# Grand-compte"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.tag
  }, "# Top-10 Q2"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.tag
  }, "# Migration Salesforce"), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.tag
  }, "# DORA"))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.heroStats
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => alert("ARR AXA Wealth France\n\n• 184 k€ actuel\n• +12 % YoY\n• Renouvellement Suite signé 01 mars 2026 — 184 k€\n\n(Détail facturation à connecter à la vue revenue.)"),
    style: {
      ...cliStyles.heroStat,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.heroStatK
  }, "ARR actuel"), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.heroStatV
  }, display.arr), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#0e7a55",
      marginTop: 2
    }
  }, "\u2191 +12 % YoY")), /*#__PURE__*/React.createElement("div", {
    onClick: () => alert("Pipe ouvert AXA Wealth France\n\n• OPP-2814 Astorya Suite 750 sièges — 215 k€ (Proposition)\n• OPP-2841 Module Cyber POC — 48 k€ (Discovery)\n• OPP-2867 Extension Belgique — 92 k€ (Qualification)\n\nTotal pondéré : ~ 152 k€"),
    style: {
      ...cliStyles.heroStat,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.heroStatK
  }, "Pipe ouvert"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cliStyles.heroStatV,
      color: "#4f46e5"
    }
  }, display.pipe), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#64748b",
      marginTop: 2
    }
  }, "3 opportunit\xE9s")), /*#__PURE__*/React.createElement("div", {
    onClick: () => alert("Health score AXA Wealth France : 78/100\n\n+  Renouvellement signé +12 % (+20 pts)\n+  Champion identifié : Émilie Roux (+10 pts)\n+  3 opportunités actives (+15 pts)\n−  Délai paiement moyen 47 j (−5 pts)\n−  Pas de POC technique en cours (−10 pts)\n\nObjectif T2 2026 : 85/100"),
    style: {
      ...cliStyles.heroStat,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.heroStatK
  }, "Health score"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cliStyles.heroStatV,
      color: "#10b981"
    }
  }, display.health, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#64748b",
      fontWeight: 500
    }
  }, display.health !== "—" ? " / 100" : "")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.miniBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: display.health === "—" ? "0%" : display.health + "%",
      height: "100%",
      background: "linear-gradient(90deg, #4f46e5, #10b981)",
      borderRadius: 999
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionBar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/nouvelle-opportunite?client=" + encodeURIComponent(display.id),
    style: {
      ...cliStyles.primaryBtn,
      textDecoration: "none",
      display: "inline-block",
      cursor: "pointer"
    }
  }, "+ Nouvelle opportunit\xE9"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var to = prompt("Destinataire (email) :", "e.roux@axa-im.fr");
      if (!to) return;
      var subj = prompt("Sujet :", "AXA Wealth France — suite proposition Astorya Suite");
      if (subj) {
        window.location.href = `mailto:${to}?subject=${encodeURIComponent(subj)}`;
      }
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2709 Email"), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Planifier un RDV avec AXA Wealth France\n\n(Sera connecté à Google Calendar / Outlook via /api/calendar-event)"),
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\uD83D\uDCC5 RDV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var num = prompt("Numéro à appeler :", "+33 1 42 86 74 21");
      if (num) window.location.href = `tel:${num}`;
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\uD83D\uDCDE Appel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var txt = prompt("Nouvelle tâche pour AXA Wealth France :");
      if (txt) alert("✓ Tâche créée : " + txt + "\n\n(Sera persistée dans la table tasks.)");
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2713 T\xE2che"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var txt = prompt("Nouvelle note privée :");
      if (txt) alert("✓ Note enregistrée : " + txt + "\n\n(Sera persistée dans la timeline activities.)");
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u270E Note"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStatsOpen(true),
    style: {
      ...cliStyles.ghostBtn,
      background: "#eef2ff",
      borderColor: "#c7d2fe",
      color: "#3730a3",
      fontWeight: 600
    },
    title: "Statistiques d'appels hotline sur 12 mois"
  }, "\uD83D\uDCCA Stats appels"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAssetsOpen(true),
    style: {
      ...cliStyles.ghostBtn,
      background: "#ecfdf5",
      borderColor: "#a7f3d0",
      color: "#065f46",
      fontWeight: 600
    },
    title: "Extraction du parc informatique du client (CMDB)"
  }, "\uD83D\uDCBB Parc IT"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var rows = [["Champ", "Valeur"]];
      rows.push(["Nom", "AXA Wealth France"]);
      rows.push(["Référence", "ACC-0184"]);
      rows.push(["Industrie", "Asset Management"]);
      rows.push(["Effectif", "12 000 employés"]);
      rows.push(["Ville", "Paris · La Défense"]);
      rows.push(["Site web", "axa-im.fr"]);
      rows.push(["Client depuis", "mars 2024"]);
      rows.push(["ARR actuel", "184 k€"]);
      rows.push(["Pipe ouvert", "355 k€"]);
      rows.push(["Health score", "78 / 100"]);
      rows.push([]);
      rows.push(["Opportunités"]);
      rows.push(["Ref", "Nom", "Étape", "Montant", "Owner", "Clôture"]);
      opportunities.forEach(o => rows.push([o.ref, o.name, o.stage, o.amount, o.owner, o.close]));
      var csv = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8;"
      }));
      a.download = `compte-AXA-Wealth-France-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "Exporter compte \u2193"))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.blockHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "Pipe contrats ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, opportunities.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "Vue d'ensemble des opportunit\xE9s et contrats actifs pour ce client")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...cliStyles.filterPill,
      textDecoration: "none",
      display: "inline-block",
      cursor: "pointer"
    }
  }, "Vue Kanban \u25A6"), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Vue Liste — affichage tabulaire des opportunités.\n\n(Bascule entre Kanban / Liste sera activée quand les deals seront persistés en DB.)"),
    style: {
      ...cliStyles.filterPill,
      cursor: "pointer"
    }
  }, "Vue Liste \u2630"))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.stagesStrip
  }, pipeStages.map((s, i) => {
    var opps = opportunities.filter(o => o.stage === s.k);
    var sum = opps.reduce((acc, o) => acc + parseInt(o.amount.replace(/\s/g, "").replace(" €", "").replace(/[^\d]/g, "")), 0);
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      style: cliStyles.stageCol
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.stageColHead
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: s.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, s.label), /*#__PURE__*/React.createElement("span", {
      style: cliStyles.stageCount
    }, opps.length)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "0 4px"
      }
    }, opps.length ? `${(sum / 1000).toFixed(0)} k€` : "—"), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.stageColBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: opps.length ? "100%" : "0%",
        height: "100%",
        background: s.color,
        opacity: 0.6,
        borderRadius: 999
      }
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.oppGrid
  }, opportunities.map((o, i) => {
    var edited = oppEdits[o.ref] || {};
    var currentStage = edited.stage || o.stage;
    var openOpp = () => {
      var cid = urlId || display.id || "";
      var amountNum = parseInt((edited.amount || o.amount || "").replace(/\D/g, ""), 10) || 0;
      var oppForStore = {
        ref: o.ref,
        name: o.name,
        client_name: display.name,
        stage: edited.stage || o.stage,
        amount: amountNum,
        proba: edited.proba || o.proba,
        owner: edited.owner || o.owner,
        close: edited.close || o.close,
        hot: o.hot
      };
      try {
        var all = JSON.parse(localStorage.getItem("hubAstorya.opportunities.v1") || "[]");
        var idx = all.findIndex(x => x.ref === o.ref);
        if (idx >= 0) all[idx] = {
          ...all[idx],
          ...oppForStore
        };else all.unshift(oppForStore);
        localStorage.setItem("hubAstorya.opportunities.v1", JSON.stringify(all));
      } catch (e) {}
      window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(o.ref) + (cid ? "&client=" + encodeURIComponent(cid) : "");
    };
    var stage = pipeStages.find(s => s.k === o.stage);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: openOpp,
      style: {
        ...cliStyles.oppCard,
        ...(o.won ? cliStyles.oppCardWon : {}),
        ...(o.hot ? cliStyles.oppCardHot : {}),
        cursor: "pointer"
      }
    }, o.isNew && /*#__PURE__*/React.createElement("span", {
      style: cliStyles.newRibbon
    }, "NOUVEAU"), /*#__PURE__*/React.createElement("div", {
      style: {
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
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: cliStyles.oppRef
    }, o.ref), /*#__PURE__*/React.createElement("span", {
      style: {
        ...cliStyles.stagePill,
        background: stage.color + "20",
        color: stage.color
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: 999,
        background: stage.color
      }
    }), stage.label), o.hot && /*#__PURE__*/React.createElement("span", {
      style: cliStyles.hotPill
    }, "\uD83D\uDD25 Hot"), o.won && /*#__PURE__*/React.createElement("span", {
      style: cliStyles.wonPill
    }, "\u2713 Sign\xE9")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: "#0f172a",
        lineHeight: 1.3,
        marginBottom: 8
      }
    }, o.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.oppAmount
    }, o.amount), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        marginTop: 2
      }
    }, "Cl\xF4ture ", o.close))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: 600
      }
    }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
        color: stage.color
      }
    }, o.proba, "%")), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.probaBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${o.proba}%`,
        height: "100%",
        background: stage.color,
        borderRadius: 999
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.oppFoot
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: o.owner,
      size: 20,
      color: o.ownerColor
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#475569"
      }
    }, o.owner)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#94a3b8"
      }
    }, o.won ? "Renouvellement actif" : `MAJ il y a ${o.days} j`)));
  }))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsGrid
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsCol
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4f46e5"
    }
  }, "\u2192"), " Actions \xE0 mener ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, extraActions.length + (isCustom ? 0 : future.length))), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "T\xE2ches, relances et \xE9v\xE9nements planifi\xE9s")), /*#__PURE__*/React.createElement("button", {
    onClick: addAction,
    style: {
      ...cliStyles.primaryBtnSm,
      cursor: "pointer"
    }
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsList
  }, [...extraActions.filter(x => !x.client_id || x.client_id === (urlId || "ACC-0184")), ...(isCustom ? [] : future)].length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 14px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc"
    }
  }, "Aucune action planifi\xE9e. Cliquez sur ", /*#__PURE__*/React.createElement("b", null, "+ Ajouter"), " pour en cr\xE9er une."), [...extraActions.filter(x => !x.client_id || x.client_id === (urlId || "ACC-0184")), ...(isCustom ? [] : future)].map((a, i) => {
    var p = prioMeta[a.priority] || prioMeta.basse;
    var key = a.id || "d-" + i;
    var done = !!doneActions[key];
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        ...cliStyles.actionItem,
        ...(a.overdue && !done ? cliStyles.actionItemOverdue : {}),
        ...(a.priority === "ai" ? cliStyles.actionItemAI : {}),
        opacity: done ? 0.5 : 1,
        textDecoration: done ? "line-through" : "none"
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      style: {
        ...cliStyles.checkbox,
        cursor: "pointer"
      },
      checked: done,
      onChange: () => toggleAction(key, a)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...cliStyles.actionIcon,
        background: a.priority === "ai" ? "#0f172a" : "#fff",
        color: a.priority === "ai" ? "#fff" : "#475569",
        borderColor: a.priority === "ai" ? "#0f172a" : "#eef1f5"
      }
    }, a.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 3,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...cliStyles.prioPill,
        background: p.bg,
        color: p.color
      }
    }, p.label), a.tag && /*#__PURE__*/React.createElement("span", {
      style: {
        ...cliStyles.linkRef,
        color: a.tagColor,
        borderColor: a.tagColor + "40"
      }
    }, a.tag), a.overdue && /*#__PURE__*/React.createElement("span", {
      style: cliStyles.overdueChip
    }, "\u23F0 En retard")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a",
        lineHeight: 1.35
      }
    }, a.title), a.meta && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        marginTop: 3,
        lineHeight: 1.4
      }
    }, a.meta), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: a.overdue ? "#dc2626" : a.priority === "ai" ? "#94a3b8" : "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, "\u23F1 ", a.due), a.assigned && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: cliStyles.dot
    }), /*#__PURE__*/React.createElement(Avatar, {
      name: a.assigned,
      size: 18,
      color: a.assignedColor
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b"
      }
    }, a.assigned)), a.attendees && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: cliStyles.dot
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex"
      }
    }, a.attendees.slice(0, 4).map((n, j) => /*#__PURE__*/React.createElement("span", {
      key: n,
      style: {
        marginLeft: j === 0 ? 0 : -6,
        border: "1.5px solid #fff",
        borderRadius: 999,
        display: "inline-block"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: n,
      size: 18
    }))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        setActionMenuKey(actionMenuKey === key ? null : key);
      },
      style: {
        ...cliStyles.actionMenu,
        cursor: "pointer"
      }
    }, "\u22EF"), actionMenuKey === key && /*#__PURE__*/React.createElement("div", {
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
        minWidth: 200,
        padding: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        toggleAction(key, a);
        setActionMenuKey(null);
      },
      style: cliStyles.menuItem
    }, done ? "↺ Marquer à faire" : "✓ Marquer terminée"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        var newTitle = prompt("Nouveau titre :", a.title);
        if (newTitle && a.id) {
          setExtraActions(arr => arr.map(x => x.id === a.id ? {
            ...x,
            title: newTitle
          } : x));
        }
        setActionMenuKey(null);
      },
      style: cliStyles.menuItem,
      disabled: !a.id
    }, "\u270E Renommer"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (!a.id) return;
        setReschedule({
          id: a.id,
          title: a.title,
          date: "",
          time: ""
        });
        setActionMenuKey(null);
      },
      style: cliStyles.menuItem,
      disabled: !a.id
    }, "\uD83D\uDCC5 Replanifier"), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: "#eef1f5",
        margin: "4px 0"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (a.id && confirm("Supprimer cette action ?")) removeAction(a.id);
        setActionMenuKey(null);
      },
      style: {
        ...cliStyles.menuItem,
        color: a.id ? "#dc2626" : "#cbd5e1"
      },
      disabled: !a.id
    }, "\uD83D\uDDD1 Supprimer", !a.id && " (action démo)"))));
  }))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsCol
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "\u2713"), " Actions men\xE9es ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, pastShown.length, pastShown.length < pastAll.length ? ` / ${pastAll.length}` : "")), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "Historique complet \xB7 ", pastShown.length, " action", pastShown.length > 1 ? "s" : "", " affich\xE9e", pastShown.length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPastShowAll(v => !v),
    style: {
      ...cliStyles.filterPill,
      cursor: "pointer"
    }
  }, pastShowAll ? "Replier" : "Tout voir")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.pastList
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.pastSpine
  }), pastShown.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 14px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc",
      marginLeft: 18
    }
  }, "Aucune action enregistr\xE9e pour ce client."), pastShown.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => alert(`${a.title}\n\n${a.who || ""}\n${a.at || ""}\n\n${a.meta || ""}`),
    style: {
      ...cliStyles.pastItem,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cliStyles.pastIcon,
      color: a.color,
      borderColor: a.color + "30"
    }
  }, a.icon), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.pastContent
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      flex: 1
    }
  }, a.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: "nowrap"
    }
  }, a.at)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b"
    }
  }, a.who), a.meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#475569",
      marginTop: 4,
      padding: "5px 8px",
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 5,
      lineHeight: 1.45
    }
  }, a.meta)))), !pastShowAll && pastAll.length > pastShown.length && /*#__PURE__*/React.createElement("button", {
    onClick: () => setPastShowAll(true),
    style: {
      ...cliStyles.loadMore,
      cursor: "pointer"
    }
  }, "\u2193 Charger plus (", pastAll.length - pastShown.length, " action", pastAll.length - pastShown.length > 1 ? "s" : "", " de plus)"))))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.subBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "Contacts cl\xE9s ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, allContacts.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "D\xE9cideurs et interlocuteurs identifi\xE9s")), /*#__PURE__*/React.createElement("button", {
    onClick: addContact,
    style: {
      ...cliStyles.filterPill,
      cursor: "pointer"
    }
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.contactsGrid
  }, allContacts.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: cliStyles.contactCard
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: 36,
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
      gap: 5,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, p.name), p.champion && /*#__PURE__*/React.createElement("span", {
    style: cliStyles.championPill
  }, "\u2605 Champion"), p.coldZone && /*#__PURE__*/React.createElement("span", {
    style: cliStyles.coldPill
  }, "\u2744 Froid")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 1
    }
  }, p.role, p.hierarchie && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 10,
      padding: "1px 5px",
      borderRadius: 3,
      background: "#eef2ff",
      color: "#3730a3",
      fontWeight: 700
    }
  }, p.hierarchie)), Array.isArray(p.decisionRoles) && p.decisionRoles.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 4
    }
  }, p.decisionRoles.map(r => /*#__PURE__*/React.createElement("span", {
    key: r,
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 3,
      fontWeight: 700,
      letterSpacing: 0.3,
      background: r === "Champion" ? "#fffbeb" : r === "Bloqueur" ? "#fdecec" : r === "Décideur" ? "#eef2ff" : "#f1f5f9",
      color: r === "Champion" ? "#a65f00" : r === "Bloqueur" ? "#dc2626" : r === "Décideur" ? "#4338ca" : "#475569",
      border: r === "Champion" ? "1px solid #fde68a" : "none"
    }
  }, r))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569",
      marginTop: 6,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, p.email), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, p.phone), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 6
    }
  }, "Dernier contact \xB7 ", p.last)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "mailto:" + p.email,
    title: "Email à " + p.name,
    style: {
      ...cliStyles.iconMini,
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, "\u2709"), /*#__PURE__*/React.createElement("a", {
    href: "tel:" + (p.phone || "").replace(/[^\d+]/g, ""),
    title: "Appeler " + p.name,
    style: {
      ...cliStyles.iconMini,
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, "\u260E"), p._custom && /*#__PURE__*/React.createElement("button", {
    onClick: () => removeContact(p.id),
    title: "Retirer",
    style: {
      ...cliStyles.iconMini,
      cursor: "pointer",
      color: "#dc2626"
    }
  }, "\xD7"))))))), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.subBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "Informations compte")), /*#__PURE__*/React.createElement("button", {
    onClick: openEdit,
    style: {
      ...cliStyles.filterPill,
      cursor: "pointer"
    }
  }, "\xC9diter")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(DetailRow, {
    label: "Owner",
    value: display.owner === "—" ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#94a3b8"
      }
    }, "\u2014") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: display.owner,
      size: 22,
      color: display.ownerColor
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, display.owner))
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Co-owner",
    value: display.coowner === "—" ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#94a3b8"
      }
    }, "\u2014") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: display.coowner,
      size: 22,
      color: display.coownerColor
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, display.coowner))
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Secteur",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, display.sector)
  }), display.sousSecteur && /*#__PURE__*/React.createElement(DetailRow, {
    label: "Sous-secteur",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, display.sousSecteur)
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Source",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, display.source)
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Concurrent",
    value: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#475569"
      }
    }, display.concurrent), (display.concurrentEnd || display.concurrentAmount) && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 2
      }
    }, display.concurrentEnd && `Fin : ${new Date(display.concurrentEnd).toLocaleDateString("fr-FR")}`, display.concurrentEnd && display.concurrentAmount && " · ", display.concurrentAmount && `${display.concurrentAmount} k€/an`))
  }), display.contactDate && /*#__PURE__*/React.createElement(DetailRow, {
    label: "1er contact",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, new Date(display.contactDate).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }))
  }), display.projectDate && /*#__PURE__*/React.createElement(DetailRow, {
    label: "\xC9ch\xE9ance projet",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, new Date(display.projectDate).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }))
  }), display.besoin && /*#__PURE__*/React.createElement(DetailRow, {
    label: "Besoin identifi\xE9",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 1.4
      }
    }, display.besoin)
  }), display.action && /*#__PURE__*/React.createElement(DetailRow, {
    label: "1\xE8re action",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, {
      email: "📧 Email d'intro",
      call: "📞 Cold call",
      in: "in LinkedIn",
      wait: "⏸ Attendre"
    }[display.action] || display.action)
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: isCustom ? "Prospect depuis" : "Client depuis",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#0f172a",
        fontWeight: 600
      }
    }, display.clientSince)
  }), !isCustom && /*#__PURE__*/React.createElement(DetailRow, {
    label: "Renouvellement",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#0e7a55",
        fontWeight: 600
      }
    }, display.renewal)
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Contrats actifs",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, contractsList.length > 0 ? `${contractsList.length} (${contractsList.map(x => x.name).slice(0, 2).join(", ")}${contractsList.length > 2 ? "…" : ""})` : isCustom ? "Aucun" : display.activeContracts)
  }), display.siren && /*#__PURE__*/React.createElement(DetailRow, {
    label: "SIREN",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, display.siren)
  }), display.naf && /*#__PURE__*/React.createElement(DetailRow, {
    label: "NAF",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, display.naf)
  }), display.tva && /*#__PURE__*/React.createElement(DetailRow, {
    label: "TVA intra.",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, display.tva)
  }), display.ca && /*#__PURE__*/React.createElement(DetailRow, {
    label: "CA annuel",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, display.ca, " M\u20AC")
  }), display.tier && /*#__PURE__*/React.createElement(DetailRow, {
    label: "Tier",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, "Tier ", display.tier)
  }), display.linkedin && /*#__PURE__*/React.createElement(DetailRow, {
    label: "LinkedIn",
    value: /*#__PURE__*/React.createElement("a", {
      href: display.linkedin.startsWith("http") ? display.linkedin : "https://" + display.linkedin,
      target: "_blank",
      rel: "noopener",
      style: {
        fontSize: 12,
        color: "#3730a3"
      }
    }, display.linkedin.replace(/^https?:\/\//, ""), " \u2197")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Adresse",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 1.4
      }
    }, display.address, display.cp || display.addressCity ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), display.cp, " ", display.addressCity) : null)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.blockHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "\uD83D\uDCDC Contrats ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, contractsList.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "Engagements actifs et historiques du compte")), /*#__PURE__*/React.createElement("button", {
    onClick: addContract,
    style: {
      ...cliStyles.primaryBtnSm,
      cursor: "pointer"
    }
  }, "+ Ajouter un contrat")), contractsList.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "32px 24px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 13,
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px dashed #e2e8f0"
    }
  }, "Aucun contrat enregistr\xE9 pour ce ", isCustom ? "prospect" : "client", ".", " ", /*#__PURE__*/React.createElement("a", {
    onClick: addContract,
    style: {
      color: "#3730a3",
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "+ Ajouter le premier contrat \u2192")) : /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "R\xE9f\xE9rence"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "Intitul\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "Type"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "Montant"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "P\xE9riode"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #e2e8f0"
    }
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "9px 12px",
      borderBottom: "1px solid #e2e8f0"
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, contractsList.map((ct, i) => {
    var statusMeta = {
      active: {
        label: "● Actif",
        bg: "#dcfce7",
        color: "#065f46"
      },
      expiring: {
        label: "● Expire bientôt",
        bg: "#fef3c7",
        color: "#78350f"
      },
      expired: {
        label: "● Expiré",
        bg: "#fee2e2",
        color: "#991b1b"
      },
      draft: {
        label: "○ Brouillon",
        bg: "#f1f5f9",
        color: "#475569"
      }
    }[ct.status] || {
      label: ct.status,
      bg: "#f1f5f9",
      color: "#475569"
    };
    return /*#__PURE__*/React.createElement("tr", {
      key: ct.id,
      style: {
        borderTop: i === 0 ? 0 : "1px solid #f1f5f9"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11.5,
        color: "#475569",
        fontWeight: 600
      }
    }, ct.id)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, ct.name), ct.product && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#94a3b8"
      }
    }, ct.product)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px",
        fontSize: 12,
        color: "#475569"
      }
    }, ct.type), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px",
        textAlign: "right",
        fontSize: 13,
        fontWeight: 700,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, ct.amount), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px",
        fontSize: 11.5,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, ct.start, /*#__PURE__*/React.createElement("br", null), "\u2192 ", ct.end), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        background: statusMeta.bg,
        color: statusMeta.color,
        fontWeight: 700
      }
    }, statusMeta.label)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px 12px",
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => alert(`Contrat ${ct.id} — ${ct.name}\n\nIntitulé : ${ct.name}\nType : ${ct.type}\nMontant : ${ct.amount}\nDébut : ${ct.start}\nFin : ${ct.end}\nStatut : ${ct.status}\n\nProduit : ${ct.product || "—"}`),
      style: {
        background: "transparent",
        border: 0,
        color: "#94a3b8",
        fontSize: 16,
        cursor: "pointer",
        padding: "4px 8px"
      }
    }, "\u22EF")));
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }))), /*#__PURE__*/React.createElement(CallStatsModal, {
    open: statsOpen,
    client: {
      name: display.name
    },
    onClose: () => setStatsOpen(false)
  }), /*#__PURE__*/React.createElement(AssetInventoryModal, {
    open: assetsOpen,
    client: {
      name: "AXA Wealth France"
    },
    onClose: () => setAssetsOpen(false)
  }), reschedule && /*#__PURE__*/React.createElement("div", {
    onClick: () => setReschedule(null),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.45)",
      zIndex: 9999,
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
      width: "100%",
      maxWidth: 420,
      boxShadow: "0 20px 50px rgba(15,23,42,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\uD83D\uDCC5 Replanifier l'action"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, reschedule.title)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setReschedule(null),
    style: {
      border: "none",
      background: "transparent",
      fontSize: 20,
      color: "#94a3b8",
      cursor: "pointer"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    autoFocus: true,
    value: reschedule.date,
    onChange: e => setReschedule({
      ...reschedule,
      date: e.target.value
    }),
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Heure"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: reschedule.time,
    onChange: e => setReschedule({
      ...reschedule,
      time: e.target.value
    }),
    style: modalInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setReschedule(null),
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!reschedule.date) {
        alert("Sélectionnez une date");
        return;
      }
      var newDue = new Date(reschedule.date).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      }) + (reschedule.time ? " · " + reschedule.time : "");
      setExtraActions(arr => arr.map(x => x.id === reschedule.id ? {
        ...x,
        due: newDue
      } : x));
      setReschedule(null);
    },
    style: {
      padding: "8px 14px",
      background: "#0f172a",
      color: "#fff",
      border: "none",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Confirmer")))), editOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setEditOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.45)",
      zIndex: 9999,
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
      width: "100%",
      maxWidth: 640,
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: "0 20px 50px rgba(15,23,42,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "\xC9diter les informations compte"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2
    }
  }, display.name)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditOpen(false),
    style: {
      border: "none",
      background: "transparent",
      fontSize: 20,
      color: "#94a3b8",
      cursor: "pointer"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Owner"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.owner || "",
    onChange: e => setEditDraft({
      ...editDraft,
      owner: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Aucun \u2014"), ownerListE.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.name,
    value: o.name
  }, o.name, " \xB7 ", o.role)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Co-owner"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.coowner || "",
    onChange: e => setEditDraft({
      ...editDraft,
      coowner: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Aucun \u2014"), ownerListE.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.name,
    value: o.name
  }, o.name, " \xB7 ", o.role))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Secteur d'activit\xE9"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.sector || "",
    onChange: e => setEditDraft({
      ...editDraft,
      sector: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Sous-secteur"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.sousSecteur || "",
    onChange: e => setEditDraft({
      ...editDraft,
      sousSecteur: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Source"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.source || "",
    onChange: e => setEditDraft({
      ...editDraft,
      source: e.target.value
    }),
    placeholder: "Ex. LinkedIn, salon\u2026",
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Concurrent"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.concurrent || "",
    onChange: e => setEditDraft({
      ...editDraft,
      concurrent: e.target.value
    }),
    placeholder: "Ex. Salesforce",
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Fin contrat concurrent"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: editDraft.concurrentEnd || "",
    onChange: e => setEditDraft({
      ...editDraft,
      concurrentEnd: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Montant concurrent (k\u20AC/an)"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.concurrentAmount || "",
    onChange: e => setEditDraft({
      ...editDraft,
      concurrentAmount: e.target.value
    }),
    placeholder: "0",
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Date 1er contact"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: editDraft.contactDate || "",
    onChange: e => setEditDraft({
      ...editDraft,
      contactDate: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "\xC9ch\xE9ance projet"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: editDraft.projectDate || "",
    onChange: e => setEditDraft({
      ...editDraft,
      projectDate: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Tier"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.tier || "",
    onChange: e => setEditDraft({
      ...editDraft,
      tier: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), /*#__PURE__*/React.createElement("option", {
    value: "A"
  }, "Tier A"), /*#__PURE__*/React.createElement("option", {
    value: "B"
  }, "Tier B"), /*#__PURE__*/React.createElement("option", {
    value: "C"
  }, "Tier C"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "CA (M\u20AC)"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.ca || "",
    onChange: e => setEditDraft({
      ...editDraft,
      ca: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "SIREN"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.siren || "",
    onChange: e => setEditDraft({
      ...editDraft,
      siren: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "NAF"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.naf || "",
    onChange: e => setEditDraft({
      ...editDraft,
      naf: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "TVA intra."), /*#__PURE__*/React.createElement("input", {
    value: editDraft.tva || "",
    onChange: e => setEditDraft({
      ...editDraft,
      tva: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Adresse"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.address || "",
    onChange: e => setEditDraft({
      ...editDraft,
      address: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Code postal"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.cp || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Ville"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.addressCity || "",
    onChange: e => setEditDraft({
      ...editDraft,
      addressCity: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Site web"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.web || "",
    onChange: e => setEditDraft({
      ...editDraft,
      web: e.target.value
    }),
    placeholder: "www.\u2026",
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "LinkedIn"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.linkedin || "",
    onChange: e => setEditDraft({
      ...editDraft,
      linkedin: e.target.value
    }),
    placeholder: "linkedin.com/company/\u2026",
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Description / Notes"), /*#__PURE__*/React.createElement("textarea", {
    value: editDraft.desc || "",
    onChange: e => setEditDraft({
      ...editDraft,
      desc: e.target.value
    }),
    rows: 3,
    style: {
      ...editInput,
      resize: "vertical",
      fontFamily: "inherit"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditOpen(false),
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: saveEdit,
    style: {
      padding: "8px 14px",
      background: "#0f172a",
      color: "#fff",
      border: "none",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Enregistrer")))), addActionOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setAddActionOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.45)",
      zIndex: 9999,
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
      width: "100%",
      maxWidth: 560,
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: "0 20px 50px rgba(15,23,42,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Nouvelle action \xE0 mener"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2
    }
  }, "Planifier une t\xE2che, un appel, un rendez-vous\u2026")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddActionOpen(false),
    style: {
      border: "none",
      background: "transparent",
      fontSize: 20,
      color: "#94a3b8",
      cursor: "pointer"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    value: newAction.type,
    onChange: e => setNewAction({
      ...newAction,
      type: e.target.value
    }),
    style: modalInput
  }, /*#__PURE__*/React.createElement("option", {
    value: "email"
  }, "\u2709 Email"), /*#__PURE__*/React.createElement("option", {
    value: "call"
  }, "\uD83D\uDCDE Appel"), /*#__PURE__*/React.createElement("option", {
    value: "visio"
  }, "\uD83D\uDCF9 Visio"), /*#__PURE__*/React.createElement("option", {
    value: "rdv"
  }, "\uD83E\uDD1D Rendez-vous"), /*#__PURE__*/React.createElement("option", {
    value: "task"
  }, "\u2705 T\xE2che"), /*#__PURE__*/React.createElement("option", {
    value: "note"
  }, "\uD83D\uDCDD Note"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Titre *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newAction.title,
    onChange: e => setNewAction({
      ...newAction,
      title: e.target.value
    }),
    placeholder: "Ex. Relance proposition commerciale",
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: newAction.date,
    onChange: e => setNewAction({
      ...newAction,
      date: e.target.value
    }),
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Heure"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: newAction.time,
    onChange: e => setNewAction({
      ...newAction,
      time: e.target.value
    }),
    style: modalInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Priorit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: newAction.priority,
    onChange: e => setNewAction({
      ...newAction,
      priority: e.target.value
    }),
    style: modalInput
  }, /*#__PURE__*/React.createElement("option", {
    value: "haute"
  }, "\uD83D\uDD34 Haute"), /*#__PURE__*/React.createElement("option", {
    value: "moyenne"
  }, "\uD83D\uDFE0 Moyenne"), /*#__PURE__*/React.createElement("option", {
    value: "basse"
  }, "\uD83D\uDFE2 Basse"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Assign\xE9 \xE0"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newAction.assigned,
    onChange: e => setNewAction({
      ...newAction,
      assigned: e.target.value
    }),
    placeholder: "Vous",
    style: modalInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Tag / R\xE9f\xE9rence"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newAction.tag,
    onChange: e => setNewAction({
      ...newAction,
      tag: e.target.value
    }),
    placeholder: "Ex. OPP-2026-001",
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Description / Notes"), /*#__PURE__*/React.createElement("textarea", {
    value: newAction.meta,
    onChange: e => setNewAction({
      ...newAction,
      meta: e.target.value
    }),
    rows: 3,
    placeholder: "Contexte, points \xE0 aborder\u2026",
    style: {
      ...modalInput,
      resize: "vertical",
      fontFamily: "inherit"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddActionOpen(false),
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: submitNewAction,
    style: {
      padding: "8px 14px",
      background: "#0f172a",
      color: "#fff",
      border: "none",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Cr\xE9er l'action")))));
};
var modalLabel = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#475569",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: 0.3
};
var modalInput = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  fontSize: 13,
  color: "#0f172a",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none"
};
var editLabel = modalLabel;
var editInput = modalInput;
var DetailRow = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "flex-start",
    padding: "8px 4px",
    gap: 10,
    minHeight: 32,
    borderBottom: "1px solid #f1f5f9"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11.5,
    color: "#64748b",
    width: 110,
    flexShrink: 0,
    paddingTop: 2
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, value));
var cliStyles = {
  frame: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#fafbfc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a"
  },
  sidebar: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "14px 12px",
    gap: 14,
    position: "sticky",
    top: 0,
    height: 1500
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px"
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoMark: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 13
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    marginLeft: "auto",
    fontSize: 10,
    padding: "1px 5px",
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
  miniLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 700
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
    minWidth: 0
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
  healthChip: {
    fontSize: 11,
    padding: "1px 8px",
    borderRadius: 999,
    background: "#e8f8f1",
    color: "#0e7a55",
    fontWeight: 600,
    marginLeft: 6
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
  ghostBtn: {
    padding: "6px 12px",
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
  primaryBtnSm: {
    padding: "4px 10px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 6,
    fontSize: 11.5,
    cursor: "pointer",
    fontWeight: 600
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: "0 24px"
  },
  hero: {
    padding: "20px 0 16px",
    borderBottom: "1px solid #eef1f5"
  },
  coLogoBig: {
    width: 60,
    height: 60,
    borderRadius: 12,
    background: "linear-gradient(135deg, #1e40af, #1e3a8a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(30,64,175,0.25)"
  },
  industryChip: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#eef2ff",
    color: "#4338ca",
    fontWeight: 600
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
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: -0.8,
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
  tag: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    color: "#475569",
    fontWeight: 500
  },
  heroStats: {
    display: "flex",
    gap: 18,
    flexShrink: 0,
    paddingLeft: 18,
    borderLeft: "1px solid #eef1f5"
  },
  heroStat: {
    minWidth: 95
  },
  heroStatK: {
    fontSize: 10.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 600
  },
  heroStatV: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.5,
    marginTop: 2
  },
  miniBar: {
    width: "100%",
    height: 3,
    background: "#eef1f5",
    borderRadius: 999,
    marginTop: 6
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
    padding: "20px 0",
    borderBottom: "1px solid #eef1f5"
  },
  subBlock: {
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: 16,
    background: "#fff"
  },
  blockHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12
  },
  h2: {
    fontSize: 16,
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
  blockCount: {
    fontSize: 11,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    marginLeft: 2
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
  // Pipe
  stagesStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginBottom: 14,
    padding: 12,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10
  },
  stageCol: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  stageColHead: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  stageCount: {
    fontSize: 10.5,
    padding: "0 6px",
    borderRadius: 999,
    background: "#eef1f5",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    marginLeft: "auto"
  },
  stageColBar: {
    height: 3,
    background: "#eef1f5",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 2
  },
  oppGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10
  },
  oppCard: {
    position: "relative",
    padding: 14,
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  oppCardHot: {
    borderColor: "#fed7aa",
    boxShadow: "0 0 0 1px #fed7aa"
  },
  oppCardWon: {
    background: "linear-gradient(180deg, #fff, #f0fdf6)",
    borderColor: "#bbf7d0"
  },
  newRibbon: {
    position: "absolute",
    top: -7,
    right: 12,
    padding: "1px 7px",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 9.5,
    fontWeight: 700,
    borderRadius: 999,
    letterSpacing: 0.4
  },
  oppRef: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "#94a3b8",
    fontWeight: 500
  },
  stagePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "1px 7px",
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 600
  },
  hotPill: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 4,
    background: "#fff1d6",
    color: "#a65f00",
    fontWeight: 700
  },
  wonPill: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 4,
    background: "#e8f8f1",
    color: "#0e7a55",
    fontWeight: 700
  },
  oppAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.4,
    fontFamily: "'Inter', sans-serif"
  },
  probaBar: {
    width: "100%",
    height: 4,
    background: "#eef1f5",
    borderRadius: 999,
    overflow: "hidden"
  },
  oppFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 8,
    borderTop: "1px solid #f1f5f9"
  },
  // Actions split
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16
  },
  actionsCol: {
    background: "#fff",
    border: "1px solid #eef1f5",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  actionsHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10
  },
  // À mener
  actionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  actionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 8,
    background: "#fafbfc",
    position: "relative"
  },
  actionItemOverdue: {
    background: "#fff8f7",
    borderColor: "#fecaca"
  },
  actionItemAI: {
    background: "linear-gradient(180deg, #fafbfc, #f5f3ff)",
    borderColor: "#e9d5ff",
    borderStyle: "dashed"
  },
  checkbox: {
    marginTop: 4,
    accentColor: "#4f46e5"
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    border: "1.5px solid #eef1f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0
  },
  prioPill: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  linkRef: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    border: "1px solid",
    fontWeight: 600
  },
  overdueChip: {
    fontSize: 9.5,
    padding: "1px 6px",
    borderRadius: 3,
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.3
  },
  actionMenu: {
    width: 24,
    height: 24,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    borderRadius: 4
  },
  menuItem: {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: 12.5,
    fontWeight: 500,
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 5
  },
  // Menées
  pastList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative"
  },
  pastSpine: {
    position: "absolute",
    left: 12,
    top: 14,
    bottom: 28,
    width: 1.5,
    background: "#eef1f5"
  },
  pastItem: {
    display: "flex",
    gap: 12,
    padding: "8px 0",
    position: "relative",
    zIndex: 1
  },
  pastIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "#fff",
    border: "1.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    flexShrink: 0,
    boxShadow: "0 0 0 3px #fff"
  },
  pastContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1
  },
  loadMore: {
    padding: "8px",
    border: "1px dashed #cbd5e1",
    background: "transparent",
    borderRadius: 6,
    fontSize: 11.5,
    color: "#64748b",
    cursor: "pointer",
    marginTop: 10,
    fontWeight: 500
  },
  // Contacts
  contactsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 4
  },
  contactCard: {
    padding: 12,
    border: "1px solid #eef1f5",
    borderRadius: 8,
    background: "#fafbfc"
  },
  championPill: {
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#fffbeb",
    color: "#a65f00",
    fontWeight: 700,
    border: "1px solid #fde68a"
  },
  coldPill: {
    fontSize: 9.5,
    padding: "1px 5px",
    borderRadius: 3,
    background: "#eff6ff",
    color: "#1e40af",
    fontWeight: 600
  },
  iconMini: {
    width: 24,
    height: 24,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 6,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 11
  },
  fieldChip: {
    fontSize: 12,
    padding: "1px 8px",
    borderRadius: 4,
    background: "#eef1f5",
    color: "#475569",
    fontWeight: 500
  }
};
window.ClientPage = ClientPage;