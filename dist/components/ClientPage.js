// ════════════════════════════════════════════════════════════════════
// ClientPage — Fiche client 360° (route : /fiche-client?id=…)
// ════════════════════════════════════════════════════════════════════
//
// Le plus gros composant de l'app (~1600 lignes). Affiche toutes les infos
// relatives à un client/prospect :
//
//  - HEADER     : nom, secteur, ville, web, owner, contrat, KPIs (ARR, pipe)
//  - SECTIONS   :
//      • Informations compte (commercial, effectif, secteur, source…)
//      • Contacts clés (principal + co-contacts)
//      • Contrats actifs
//      • Opportunités liées (chargées via api.opportunities.list)
//      • Actions à mener (api.actions.list status="todo")
//      • Actions historiques (api.actions.list status="done")
//      • Parc IT (modale AssetInventoryModal)
//      • Stats appels (modale CallStatsModal)
//  - MODALS    : nouvelle action, nouveau contact, édition fiche
//
// Sources :
//   - Client : api.clients.getById(urlId) → loadedClient
//   - Tout le reste : reloadAllForClient() qui parallélise les 3 listes
//     (actions + contacts + opportunités)
//
// Note legacy : ce composant gère encore un fallback "AXA Wealth France"
// (démo) quand `urlId` est absent (`empty` = false), pour ne pas casser
// la maquette d'origine.
// ════════════════════════════════════════════════════════════════════

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
      setOppEdits(JSON.parse(localStorage.getItem("hubAstorya.oppEdits.v1") || "{}"));
    } catch (e) {}
  }, []);

  // Recharge actions/contacts/opps depuis l'API quand l'URL change
  var reloadAllForClient = React.useCallback(async () => {
    var cid = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
    if (!window.api) return;
    try {
      var [acts, conts, opps] = await Promise.all([window.api.actions.list({
        client_id: cid
      }), window.api.contacts.list({
        client_id: cid
      }), window.api.opportunities.list({
        client_id: cid
      })]);
      // Liste des "anciens" noms démo à remplacer par l'utilisateur courant
      var legacyDemoNames = new Set(["Romain Daviaud", "Nadia Lefèvre", "Tom Verdier", "Émilie Garnier", "Sophie Aubry", "Antoine Mercier", "Julien Pasquier", "Marie Lopez", "Pierre Dubois", "Romain Faure", "Léo Tanaka", "Diane Roussel", "Farid Belkacem", "Valérie Chen", "Léa Marchand", "Olivier Vasseur", "Catherine Marchand", "Hugo Bertrand"]);
      var currentUserName = (() => {
        try {
          var u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser();
          return u && u.name || "Vous";
        } catch (e) {
          return "Vous";
        }
      })();
      var normalizeAssignee = n => n && legacyDemoNames.has(n) ? currentUserName : n || currentUserName;
      var todo = (acts || []).filter(a => a.status !== "done").map(a => ({
        ...a,
        due: a.due || a.due_text || "Date à définir",
        assigned: normalizeAssignee(a.assigned || a.assigned_to),
        tag: a.tag || null,
        tagColor: a.tagColor || a.tag_color || "#475569",
        icon: a.icon || "•"
      }));
      var done = (acts || []).filter(a => a.status === "done").map(a => ({
        ...a,
        icon: a.icon || (a.type === "call" ? "☎" : a.type === "email" ? "✉" : a.type === "rdv" ? "📅" : a.type === "note" ? "✎" : "✓"),
        color: "#10b981",
        who: normalizeAssignee(a.assigned_to || a.assigned),
        at: a.completed_at ? new Date(a.completed_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) + " · " + new Date(a.completed_at).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        }) : ""
      }));
      setExtraActions(todo);
      setCompletedActions(done);
      setCustomContacts(conts || []);
      setStoredOpps((opps || []).map(o => ({
        ref: o.id || o.ref,
        name: o.name,
        amount: o.amount_eur != null ? Math.round(o.amount_eur).toLocaleString("fr-FR").replace(/,/g, " ") + " €" : o.amount || "—",
        stage: o.stage || "qualif",
        proba: o.proba || 20,
        owner: o.owner || "Vous",
        ownerColor: "#0ea5e9",
        close: o.close_date ? new Date(o.close_date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }) : o.close || "—",
        days: 0,
        isNew: o.stage === "qualif"
      })));
    } catch (e) {
      console.warn("[ClientPage] reload:", e);
    }
  }, []);
  React.useEffect(() => {
    reloadAllForClient();
    // Realtime : tout changement BDD (autre onglet, autre user) relance le
    // reload. Couvre actions/contacts/opps/contrats.
    if (window.HubData && window.HubData.subscribeChanges) {
      return window.HubData.subscribeChanges(reloadAllForClient);
    }
  }, [reloadAllForClient]);
  var [completedActions, setCompletedActions] = React.useState([]);

  // Complète une action utilisateur : la sort de extraActions et la pose dans completedActions
  var completeAction = async a => {
    try {
      await window.api.actions.complete(a.id);
      reloadAllForClient();
    } catch (e) {
      console.warn("completeAction:", e);
    }
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
    name: "Romain Daviaud",
    role: "Direction · Achat",
    color: "#4f46e5"
  }, {
    name: "Augustin Morin",
    role: "Direction · Commercial",
    color: "#10b981"
  }];
  var [actionMenuKey, setActionMenuKey] = React.useState(null);
  var [reschedule, setReschedule] = React.useState(null);
  var [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (!moreMenuOpen) return;
    var close = () => setMoreMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [moreMenuOpen]);
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
  var submitNewAction = async () => {
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
    if (!urlId) {
      alert("Aucun client sélectionné — impossible de créer l'action.");
      return;
    }
    try {
      await window.api.actions.create({
        client_id: urlId,
        type: newAction.type,
        title: newAction.title.trim(),
        due: dueText,
        priority: newAction.priority,
        icon: iconMap[newAction.type] || "•",
        meta: newAction.meta || "",
        assigned: newAction.assigned || "Vous",
        tag: newAction.tag || (newAction.type === "email" ? "Email" : newAction.type === "call" ? "Appel" : newAction.type === "visio" ? "Visio" : newAction.type === "rdv" ? "RDV" : newAction.type === "task" ? "Tâche" : "Note"),
        tagColor: "#475569"
      });
      setAddActionOpen(false);
      reloadAllForClient();
    } catch (e) {
      alert("Erreur : " + (e.message || e));
    }
  };
  var addAction = () => openAddAction();
  var removeAction = async id => {
    try {
      await window.api.actions.remove(id);
      reloadAllForClient();
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
    if (!window.api) return;
    window.api.clients.list().then(list => {
      setRecents((list || []).slice(0, 8).map(p => ({
        id: p.id,
        name: p.raison_sociale || p.name,
        status: p.status || "prospect",
        color: p.status === "client" ? "#0f766e" : "#1e40af"
      })));
    }).catch(() => {});
  }, []);

  // Modal opp détail : stage editable + autres champs
  var openOppDetail = i => setOppDetailIdx(i);
  var closeOppDetail = () => setOppDetailIdx(null);

  // ───── Tickets du client — depuis hub-data.fetchTickets filtré sur ce client
  var [clientTickets, setClientTickets] = React.useState([]);
  React.useEffect(() => {
    if (!urlId || !window.HubData || !window.HubData.enabled || !window.HubData.enabled()) {
      setClientTickets([]);
      return;
    }
    window.HubData.fetchTickets({
      client_id: urlId,
      limit: 50
    }).then(({
      data
    }) => {
      setClientTickets((data || []).filter(t => t.client_id === urlId));
    }).catch(() => {});
  }, [urlId]);

  // ───── Contrats du client — depuis api.contracts.list (Supabase)
  var [contractsList, setContractsList] = React.useState([]);
  React.useEffect(() => {
    if (!window.api || !urlId) {
      setContractsList([]);
      return;
    }
    window.api.contracts.list({
      client_id: urlId
    }).then(list => {
      setContractsList((list || []).map(c => ({
        id: c.id,
        client_id: c.client_id,
        name: c.name,
        product: c.data && c.data.products ? "Multi-produits" : "—",
        type: c.data && c.data.type || "Contrat",
        amount: c.monthly_eur ? Math.round(c.monthly_eur * 12 / 1000) + " k€ / an" : c.total_ht_y1 ? Math.round(c.total_ht_y1 / 1000) + " k€ / an" : "—",
        start: c.start_date || c.data && c.data.start || "",
        end: c.end_date || c.data && c.data.end || "",
        status: c.status || "active"
      })));
    }).catch(() => {});
  }, [urlId]);

  // ───── Contacts clés du client : démo AXA + custom localStorage par client
  var defaultContacts = [];
  var [customContacts, setCustomContacts] = React.useState([]);
  var [editingContact, setEditingContact] = React.useState(null);
  // User auth Supabase pour la sidebar (au lieu du fallback "Utilisateur —")
  var [supaUser, setSupaUser] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.auth) return;
    window.api.auth.getUser().then(u => {
      if (u) setSupaUser(u);
    }).catch(() => {});
  }, []);
  var reloadCustomContacts = async () => {
    if (!urlId || !window.api || !window.api.contacts) return;
    try {
      var conts = await window.api.contacts.list({
        client_id: urlId
      });
      setCustomContacts(conts || []);
    } catch (e) {}
  };
  var saveContactEdit = async form => {
    if (!form) return;
    // Cas 1 : contact existe en table contacts → update direct
    if (form.id) {
      await window.api.contacts.update(form.id, {
        prenom: form.prenom,
        nom: form.nom,
        fonction: form.fonction,
        email: form.email,
        phone: form.phone,
        linkedin: form.linkedin
      });
      if (window.HubToast) window.HubToast.success("✓ Contact mis à jour");
      await reloadCustomContacts();
      setEditingContact(null);
      return;
    }
    // Cas 2 : legacy contact_principal stocké dans clients.data → patch client
    if (form._legacyPrincipal) {
      await window.api.clients.update(urlId, {
        contact_principal: {
          prenom: form.prenom,
          nom: form.nom,
          fonction: form.fonction,
          email: form.email,
          phone: form.phone,
          linkedin: form.linkedin
        }
      });
      if (window.HubToast) window.HubToast.success("✓ Contact principal mis à jour");
      setEditingContact(null);
      window.location.reload();
      return;
    }
    // Cas 3 : legacy contact_additionnel dans clients.data → on le crée en table contacts
    var newContact = await window.api.contacts.create({
      client_id: urlId,
      prenom: form.prenom,
      nom: form.nom,
      fonction: form.fonction,
      email: form.email,
      phone: form.phone,
      linkedin: form.linkedin,
      is_principal: false
    });
    if (newContact && window.HubToast) window.HubToast.success("✓ Contact mis à jour");
    await reloadCustomContacts();
    setEditingContact(null);
  };
  // Déclaration de loadedClient ICI (avant useMemo allContacts) pour éviter
  // que le useMemo ne lise une closure undefined lors du 1er rendu.
  var [loadedClient, setLoadedClient] = React.useState(null);

  // Composition unifiée : customContacts vient de api.contacts.list({client_id})
  // qui contient à la fois le contact principal (is_principal=true) et les co-contacts.
  var allContacts = React.useMemo(() => {
    var colors = ["#0ea5e9", "#f59e0b", "#dc2626", "#10b981", "#8b5cf6"];
    var coIdx = 0;
    var fromTable = (customContacts || []).filter(cc => (cc.prenom || cc.nom || cc.email || cc.phone || "").toString().trim()).map(cc => {
      var fullName = ((cc.prenom || "") + " " + (cc.nom || "")).trim() || cc.email || cc.phone || "Contact";
      if (cc.is_principal) {
        return {
          id: cc.id,
          name: fullName,
          role: cc.fonction || "—",
          email: cc.email || "",
          phone: cc.phone || "",
          linkedin: cc.linkedin || "",
          color: "#a855f7",
          decisionRoles: Array.isArray(cc.roles) ? cc.roles : [],
          hierarchie: cc.hierarchie || "",
          last: "Contact principal",
          _custom: true
        };
      }
      var color = colors[coIdx++ % colors.length];
      return {
        id: cc.id,
        name: fullName,
        role: cc.fonction || "—",
        email: cc.email || "",
        phone: cc.phone || "",
        linkedin: cc.linkedin || "",
        color,
        last: "Co-contact",
        _custom: true
      };
    });

    // Fallback legacy : si aucun contact principal en table mais loadedClient.contact_principal renseigné
    var lc = loadedClient || {};
    var hasPrincipal = fromTable.some(x => x.color === "#a855f7");
    if (!hasPrincipal && lc.contact_principal) {
      var cp = lc.contact_principal;
      var fullName = ((cp.prenom || "") + " " + (cp.nom || "")).trim();
      if (fullName || cp.email || cp.phone) {
        fromTable.unshift({
          name: fullName || cp.email || cp.phone || "Contact principal",
          role: cp.fonction || "—",
          email: cp.email || "",
          phone: cp.phone || "",
          linkedin: cp.linkedin || "",
          color: "#a855f7",
          decisionRoles: Array.isArray(lc.roles) ? lc.roles : [],
          hierarchie: lc.fonction || "",
          last: "Contact principal (legacy)"
        });
      }
    }

    // Fallback legacy : contacts_additionnels saisis directement dans clients.data
    if (Array.isArray(lc.contacts_additionnels)) {
      lc.contacts_additionnels.forEach(x => {
        if (!(x.prenom || x.nom || x.email || x.phone)) return;
        var fullName = ((x.prenom || "") + " " + (x.nom || "")).trim() || x.email || x.phone || "Contact";
        if (fromTable.find(t => t.email === x.email && x.email)) return; // dédupe
        fromTable.push({
          name: fullName,
          role: x.fonction || "—",
          email: x.email || "",
          phone: x.phone || "",
          linkedin: x.linkedin || "",
          color: colors[coIdx++ % colors.length],
          last: "Co-contact (legacy)"
        });
      });
    }
    return fromTable;
  }, [customContacts, loadedClient]);
  var [addContactOpen, setAddContactOpen] = React.useState(false);
  var [newContactForm, setNewContactForm] = React.useState({
    prenom: "",
    nom: "",
    fonction: "",
    email: "",
    phone: "",
    linkedin: ""
  });
  var addContact = () => {
    setNewContactForm({
      prenom: "",
      nom: "",
      fonction: "",
      email: "",
      phone: "",
      linkedin: ""
    });
    setAddContactOpen(true);
  };
  var submitNewContact = async () => {
    var f = newContactForm;
    if (!(f.prenom || f.nom || f.email || f.phone)) {
      alert("Remplissez au moins un champ");
      return;
    }
    if (!urlId) {
      alert("Aucun client sélectionné.");
      return;
    }
    try {
      await window.api.contacts.create({
        client_id: urlId,
        prenom: f.prenom,
        nom: f.nom,
        fonction: f.fonction,
        email: f.email,
        phone: f.phone,
        linkedin: f.linkedin,
        is_principal: false
      });
      setAddContactOpen(false);
      reloadAllForClient();
    } catch (e) {
      alert("Erreur : " + (e.message || e));
    }
  };
  var removeContact = async id => {
    try {
      await window.api.contacts.remove(id);
      reloadAllForClient();
    } catch (e) {}
  };
  var [pastShowAll, setPastShowAll] = React.useState(false);
  var [pipeView, setPipeView] = React.useState("kanban"); // "kanban" | "list"

  var addContract = () => {
    var cid = urlId || display.id || "";
    window.location.href = "/nouveau-contrat" + (cid ? "?client=" + encodeURIComponent(cid) : "");
  };

  // ───── Récupère le client à afficher selon l'ID dans l'URL
  // - localStorage prospects créés via /nouveau-prospect (clé hubAstorya.prospects.v1)
  // - sinon Supabase clients
  // - sinon fallback démo AXA Wealth France
  var urlId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
  React.useEffect(() => {
    if (!urlId) {
      setLoadedClient(null);
      return;
    }
    if (window.api && window.api.clients) {
      window.api.clients.getById(urlId).then(data => {
        if (data) setLoadedClient(data);
      }).catch(e => console.warn("[ClientPage] getById:", e));
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
    id: c.id || urlId || "—",
    name: c.raison_sociale || c.name || (empty ? "Chargement…" : "Sélectionnez un client"),
    sector: c.secteur || c.industry || "—",
    size: c.effectif ? `Effectif ${c.effectif}` : "—",
    city: c.ville || c.city || "—",
    web: c.site_web || c.website || "",
    since: c.created_at ? `Prospect depuis ${new Date(c.created_at).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : "",
    desc: c.notes || c.besoin || "",
    logo: (c.raison_sociale || c.name || "?").slice(0, 2).toUpperCase(),
    arr: "—",
    pipe: "0",
    health: "—",
    contactPrincipal: c.contact_principal || null,
    owner: c.owner || "—",
    ownerColor: c.owner_color || "#64748b",
    coowner: c.coowner || "—",
    coownerColor: c.coowner_color || "#64748b",
    source: c.source || "—",
    concurrent: c.concurrent || "—",
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
    }) : "—",
    renewal: c.renewal || "—",
    activeContracts: c.active_contracts || "—",
    address: c.adresse || "—",
    cp: c.code_postal || "",
    addressCity: c.ville || c.city || "",
    siren: c.siren || "",
    naf: c.naf || "",
    sousSecteur: c.sous_secteur || "",
    tier: c.tier || "",
    ca: c.ca_meur || "",
    linkedin: c.linkedin_entreprise || "",
    tva: c.tva || "",
    fonction: c.fonction || "",
    action: c.action || "",
    besoin: c.besoin || ""
  };
  var openEdit = () => {
    var cp = c.contact_principal || {};
    setEditDraft({
      // Entreprise
      raison_sociale: c.raison_sociale || c.name || "",
      siren: display.siren || "",
      naf: display.naf || "",
      tva: display.tva || "",
      sector: display.sector === "—" ? "" : display.sector,
      sousSecteur: display.sousSecteur || "",
      effectif: c.effectif || "",
      tier: display.tier || "",
      address: display.address === "—" ? "" : display.address,
      cp: display.cp || "",
      addressCity: display.addressCity || "",
      web: display.web || "",
      linkedin: display.linkedin || "",
      // Équipe Astorya
      owner: display.owner === "—" ? "" : display.owner,
      coowner: display.coowner === "—" ? "" : display.coowner,
      // Contact principal
      cp_prenom: cp.prenom || "",
      cp_nom: cp.nom || "",
      cp_fonction: cp.fonction || "",
      cp_email: cp.email || "",
      cp_phone: cp.phone || "",
      cp_linkedin: cp.linkedin || "",
      fonction: display.fonction || "",
      roles: Array.isArray(c.roles) ? c.roles : [],
      // Qualification
      source: display.source === "—" ? "" : display.source,
      concurrent: display.concurrent === "—" ? "" : display.concurrent,
      concurrentAmount: display.concurrentAmount || "",
      projectDate: display.projectDate || "",
      besoin: display.besoin || c.besoin || "",
      action: display.action || "",
      desc: c.notes || ""
    });
    setEditOpen(true);
  };
  var saveEdit = async () => {
    if (!urlId) {
      alert("Édition uniquement disponible pour les prospects créés");
      return;
    }
    var ownerObj = ownerListE.find(o => o.name === editDraft.owner);
    var coownerObj = ownerListE.find(o => o.name === editDraft.coowner);
    var patch = {
      raison_sociale: editDraft.raison_sociale || null,
      name: editDraft.raison_sociale || null,
      owner: editDraft.owner || null,
      owner_role: ownerObj ? ownerObj.role : null,
      owner_color: ownerObj ? ownerObj.color : null,
      coowner: editDraft.coowner || null,
      coowner_color: coownerObj ? coownerObj.color : null,
      secteur: editDraft.sector || null,
      sous_secteur: editDraft.sousSecteur || null,
      effectif: editDraft.effectif || null,
      source: editDraft.source || null,
      concurrent: editDraft.concurrent || null,
      concurrent_amount: editDraft.concurrentAmount || null,
      project_date: editDraft.projectDate || null,
      tier: editDraft.tier || null,
      adresse: editDraft.address || null,
      code_postal: editDraft.cp || null,
      ville: editDraft.addressCity || null,
      site_web: editDraft.web || null,
      linkedin_entreprise: editDraft.linkedin || null,
      siren: editDraft.siren || null,
      naf: editDraft.naf || null,
      tva: editDraft.tva || null,
      besoin: editDraft.besoin || null,
      action: editDraft.action || null,
      fonction: editDraft.fonction || null,
      roles: Array.isArray(editDraft.roles) ? editDraft.roles : [],
      contact_principal: {
        prenom: editDraft.cp_prenom || "",
        nom: editDraft.cp_nom || "",
        fonction: editDraft.cp_fonction || "",
        email: editDraft.cp_email || "",
        phone: editDraft.cp_phone || "",
        linkedin: editDraft.cp_linkedin || ""
      },
      notes: editDraft.desc || null
    };
    try {
      var updated = await window.api.clients.update(urlId, patch);
      if (updated) setLoadedClient(updated);
      // Si contact_principal a été modifié, on met aussi à jour la table contacts
      if (patch.contact_principal && (patch.contact_principal.prenom || patch.contact_principal.nom || patch.contact_principal.email)) {
        // Cherche s'il existe déjà un contact_principal pour ce client
        var existing = (await window.api.contacts.list({
          client_id: urlId
        })) || [];
        var principal = existing.find(x => x.is_principal);
        if (principal) {
          await window.api.contacts.update(principal.id, {
            prenom: patch.contact_principal.prenom,
            nom: patch.contact_principal.nom,
            fonction: patch.contact_principal.fonction,
            email: patch.contact_principal.email,
            phone: patch.contact_principal.phone,
            linkedin: patch.contact_principal.linkedin,
            roles: patch.roles,
            hierarchie: patch.fonction
          });
        } else {
          await window.api.contacts.create({
            client_id: urlId,
            ...patch.contact_principal,
            roles: patch.roles,
            hierarchie: patch.fonction,
            is_principal: true
          });
        }
        reloadAllForClient();
      }
    } catch (e) {
      console.warn("saveEdit:", e);
    }
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

  // ── Pipe SPANCO du client (cohérent avec page principale + AdvanceOpportunity)
  var pipeStages = [{
    k: "qualif",
    label: "Prospect",
    color: "#94a3b8"
  }, {
    k: "discovery",
    label: "Approche",
    color: "#3b82f6"
  }, {
    k: "propo",
    label: "Négociation",
    color: "#a855f7"
  }, {
    k: "nego",
    label: "Conclusion",
    color: "#ea580c"
  }, {
    k: "won",
    label: "Ordre",
    color: "#10b981"
  }];

  // ── Opportunités chargées par reloadAllForClient (via api.opportunities.list filtré par client_id)
  var [storedOpps, setStoredOpps] = React.useState([]);
  var opportunities = storedOpps;

  // ── Actions menées (passé, dernières)
  // Actions historiques : SEULEMENT celles terminées par l'utilisateur (extraites de Supabase via reloadAllForClient)
  var past = [];
  var pastExtras = [];
  var completedForThis = completedActions;
  var pastAll = past;
  var pastShown = completedForThis;
  var pastTotal = completedForThis.length;

  // Actions à mener : SEULEMENT celles créées par l'utilisateur (extraites de Supabase, statut "todo")
  var future = [];
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
  }, window.HubModuleLogo ? React.createElement(window.HubModuleLogo, {
    size: 36
  }) : /*#__PURE__*/React.createElement("div", {
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
    href: "/nouveau-prospect",
    style: {
      ...cliStyles.newBtn,
      textDecoration: "none",
      cursor: "pointer",
      background: "#fff",
      color: "#0f172a",
      border: "1px solid #e2e8f0"
    }
  }, "+ Nouveau prospect ", /*#__PURE__*/React.createElement("span", {
    style: {
      ...cliStyles.kbd,
      background: "#f1f5f9",
      color: "#475569"
    }
  }, "P")), /*#__PURE__*/React.createElement("a", {
    href: "/nouvelle-opportunite?client=" + encodeURIComponent(display.id),
    style: {
      ...cliStyles.newBtn,
      textDecoration: "none",
      cursor: "pointer",
      marginTop: -8
    }
  }, "+ Nouvelle opportunit\xE9 ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.kbd
  }, "N")), /*#__PURE__*/React.createElement("div", {
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
  }, "Pipeline")), /*#__PURE__*/React.createElement("div", {
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
  }, "Comptes")), /*#__PURE__*/React.createElement("a", {
    href: "/crm#contacts",
    style: {
      ...cliStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Contacts")), /*#__PURE__*/React.createElement("a", {
    href: "/crm#actions",
    style: {
      ...cliStyles.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cliStyles.bullet
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Activit\xE9s"))), /*#__PURE__*/React.createElement("div", {
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
  }), (() => {
    // Priorité : Supabase auth (fetché en useEffect) puis HubAccess legacy
    var cu = supaUser ? {
      name: supaUser.user_metadata?.name || supaUser.email,
      role: "Astorya"
    } : window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser() || null;
    var nm = cu && cu.name || "Non connecté";
    var rl = cu && cu.role || "Cliquer pour s'identifier";
    return /*#__PURE__*/React.createElement("a", {
      href: "/administration-utilisateurs",
      title: "Profil & pr\xE9f\xE9rences",
      style: {
        ...cliStyles.userRow,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: nm,
      size: 26,
      color: "#4f46e5"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, nm), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, rl)));
  })()), /*#__PURE__*/React.createElement("main", {
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
    onClick: () => {
      var idx = recents.findIndex(r => r.id === urlId);
      if (idx > 0) window.location.href = "/fiche-client?id=" + encodeURIComponent(recents[idx - 1].id);
    },
    disabled: (() => {
      var i = recents.findIndex(r => r.id === urlId);
      return i <= 0;
    })(),
    style: {
      ...cliStyles.iconBtn,
      cursor: "pointer"
    },
    title: "Client pr\xE9c\xE9dent"
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var idx = recents.findIndex(r => r.id === urlId);
      if (idx >= 0 && idx < recents.length - 1) window.location.href = "/fiche-client?id=" + encodeURIComponent(recents[idx + 1].id);
    },
    disabled: (() => {
      var i = recents.findIndex(r => r.id === urlId);
      return i < 0 || i >= recents.length - 1;
    })(),
    style: {
      ...cliStyles.iconBtn,
      cursor: "pointer"
    },
    title: "Client suivant"
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var key = "hubAstorya.followed.v1";
      var list = [];
      try {
        list = JSON.parse(localStorage.getItem(key) || "[]");
      } catch (e) {}
      var cid = urlId || display.id;
      if (list.includes(cid)) {
        list = list.filter(x => x !== cid);
        localStorage.setItem(key, JSON.stringify(list));
        alert("Vous ne suivez plus " + display.name);
      } else {
        list.push(cid);
        localStorage.setItem(key, JSON.stringify(list));
        alert("✓ Vous suivez " + display.name);
      }
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2605 Suivre"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setMoreMenuOpen(v => !v);
    },
    style: {
      ...cliStyles.iconBtn,
      cursor: "pointer"
    },
    title: "Plus d'actions"
  }, "\u22EF"), moreMenuOpen && /*#__PURE__*/React.createElement("div", {
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
      minWidth: 220,
      padding: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!urlId) return;
      await window.api.clients.update(urlId, {
        status: "client",
        client_since: new Date().toISOString()
      });
      window.location.reload();
    },
    style: cliStyles.menuItem
  }, "\u2713 Convertir en client"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!urlId) return;
      await window.api.clients.update(urlId, {
        status: "archived"
      });
      window.location.href = "/crm";
    },
    style: cliStyles.menuItem
  }, "\uD83D\uDCE6 Archiver"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "#eef1f5",
      margin: "4px 0"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!urlId) return;
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Supprimer " + display.name + " ?",
        message: "Soft-delete : la donnée reste en BDD, juste marquée supprimée. Elle peut être restaurée par un admin.",
        okLabel: "Supprimer",
        okStyle: "danger"
      }) : confirm("Supprimer définitivement " + display.name + " ?");
      if (!ok) return;
      try {
        await window.api.clients.remove(urlId);
        if (window.HubToast) window.HubToast.success("✓ Client supprimé");
        window.location.href = "/crm";
      } catch (err) {
        alert("Suppression échouée : " + (err && err.message || err));
      }
    },
    style: {
      ...cliStyles.menuItem,
      color: "#dc2626"
    }
  }, "\uD83D\uDDD1 Supprimer d\xE9finitivement"))))), /*#__PURE__*/React.createElement("div", {
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
  }, display.sector), display.tier && (() => {
    var tierLabels = {
      A: "Grand compte",
      B: "Compte secondaire",
      C: "Tactique"
    };
    var tierColors = {
      A: {
        bg: "#fef3c7",
        color: "#a16207"
      },
      B: {
        bg: "#eef2ff",
        color: "#3730a3"
      },
      C: {
        bg: "#f1f5f9",
        color: "#475569"
      }
    };
    var t = String(display.tier).toUpperCase();
    var lbl = tierLabels[t] || display.tier;
    var col = tierColors[t] || {
      bg: "#eef1f5",
      color: "#475569"
    };
    return /*#__PURE__*/React.createElement("span", {
      style: {
        ...cliStyles.metaChip,
        background: col.bg,
        color: col.color,
        fontWeight: 600
      }
    }, "Tier ", t, " \u2014 ", lbl);
  })(), /*#__PURE__*/React.createElement("span", {
    style: cliStyles.metaChip
  }, display.size), display.siren && window.ProcedureBadge && /*#__PURE__*/React.createElement(ProcedureBadge, {
    siren: display.siren,
    stored: c.procedure_collective || c.data && c.data.procedure_collective || null,
    autoCheck: true,
    onChange: async r => {
      // Persiste le résultat dans clients.data
      if (!urlId || !window.api || !window.api.clients) return;
      try {
        await window.api.clients.update(urlId, {
          procedure_collective: r
        });
        // Notification si on vient de détecter un nouveau passage en procédure
        var before = c.procedure_collective || c.data && c.data.procedure_collective;
        if (window.HubToast && r.status === "warn" && (!before || before.status === "ok")) {
          window.HubToast.warn("⚠ " + display.name + " est passé en procédure collective depuis le dernier check (" + (r.announcement?.type || "") + ")", {
            duration: 10000
          });
        } else if (window.HubToast && r.status === "danger" && (!before || before.status !== "danger")) {
          window.HubToast.error("🔴 " + display.name + " — " + (r.announcement?.type || "Liquidation"), {
            duration: 12000
          });
        }
      } catch (e) {
        console.warn("[ClientPage] persist BODACC:", e);
      }
    }
  }), /*#__PURE__*/React.createElement("span", {
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
  }, display.name), display.desc && /*#__PURE__*/React.createElement("p", {
    style: cliStyles.subtitle
  }, display.desc)), (() => {
    var arrNum = contractsList.reduce((s, ct) => s + (parseFloat(String(ct.amount || "").replace(/[^\d.]/g, "")) || 0), 0);
    var arrLabel = arrNum > 0 ? Math.round(arrNum / 1000) + " k€" : isCustom ? "—" : display.arr;
    var opps = storedOpps.filter(o => o.stage !== "won" && o.stage !== "lost");
    var pipeNum = opps.reduce((s, o) => {
      var amt = parseFloat(String(o.amount || "").replace(/[^\d.]/g, "")) || 0;
      return s + amt;
    }, 0);
    var pipeLabel = pipeNum > 0 ? Math.round(pipeNum / 1000) + " k€" : isCustom ? "0" : display.pipe;
    var oppCount = opps.length;
    // Health = % critères basiques renseignés
    var criteres = [!!c.contact_principal && (c.contact_principal.email || c.contact_principal.nom), !!c.siren, !!c.secteur, !!c.adresse, !!c.owner, contractsList.length > 0 || opps.length > 0];
    var filled = criteres.filter(Boolean).length;
    var healthVal = Math.round(filled / criteres.length * 100);
    var healthLabel = isCustom ? healthVal : display.health;
    return /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStats
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStat
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStatK
    }, "ARR actuel"), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStatV
    }, arrLabel), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        marginTop: 2
      }
    }, contractsList.length, " contrat", contractsList.length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStat
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStatK
    }, "Pipe ouvert"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...cliStyles.heroStatV,
        color: "#4f46e5"
      }
    }, pipeLabel), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        marginTop: 2
      }
    }, oppCount, " opportunit\xE9", oppCount > 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStat,
      title: "Score bas\xE9 sur la compl\xE9tude des informations (contact, SIREN, secteur, adresse, commercial, contrat/opp)."
    }, /*#__PURE__*/React.createElement("div", {
      style: cliStyles.heroStatK
    }, "Health score"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...cliStyles.heroStatV,
        color: healthVal >= 70 ? "#10b981" : healthVal >= 40 ? "#f59e0b" : "#dc2626"
      }
    }, healthLabel, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: 500
      }
    }, healthLabel !== "—" ? " / 100" : "")), /*#__PURE__*/React.createElement("div", {
      style: cliStyles.miniBar
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: healthLabel === "—" ? "0%" : healthLabel + "%",
        height: "100%",
        background: "linear-gradient(90deg, #4f46e5, #10b981)",
        borderRadius: 999
      }
    }))));
  })()), /*#__PURE__*/React.createElement("div", {
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
      setNewAction({
        type: "email",
        title: "Email — " + display.name,
        date: "",
        time: "",
        priority: "moyenne",
        assigned: "Vous",
        tag: "Email",
        meta: ""
      });
      setAddActionOpen(true);
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2709 Email"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setNewAction({
        type: "rdv",
        title: "RDV — " + display.name,
        date: "",
        time: "",
        priority: "moyenne",
        assigned: "Vous",
        tag: "RDV",
        meta: ""
      });
      setAddActionOpen(true);
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\uD83D\uDCC5 RDV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setNewAction({
        type: "call",
        title: "Appel — " + display.name,
        date: "",
        time: "",
        priority: "moyenne",
        assigned: "Vous",
        tag: "Appel",
        meta: ""
      });
      setAddActionOpen(true);
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\uD83D\uDCDE Appel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setNewAction({
        type: "task",
        title: "",
        date: "",
        time: "",
        priority: "moyenne",
        assigned: "Vous",
        tag: "Tâche",
        meta: ""
      });
      setAddActionOpen(true);
    },
    style: {
      ...cliStyles.ghostBtn,
      cursor: "pointer"
    }
  }, "\u2713 T\xE2che"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setNewAction({
        type: "note",
        title: "",
        date: "",
        time: "",
        priority: "basse",
        assigned: "Vous",
        tag: "Note",
        meta: ""
      });
      setAddActionOpen(true);
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
  }, "\uD83D\uDCBB Parc IT"))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.blockHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "Pipe contrats ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, opportunities.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "Vue d'ensemble des opportunit\xE9s et contrats actifs pour ce client"))), pipeView === "kanban" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 10,
      marginBottom: 14
    }
  }, pipeStages.map(s => {
    var opps = opportunities.filter(o => (o.stage || "qualif") === s.k);
    var sum = opps.reduce((acc, o) => acc + (parseInt(String(o.amount || "0").replace(/[^\d]/g, "")) || 0), 0);
    return /*#__PURE__*/React.createElement("div", {
      key: s.k,
      style: {
        background: "#fafbfc",
        border: "1px solid #eef1f5",
        borderRadius: 10,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 200
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: s.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, s.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "0 6px",
        borderRadius: 999,
        background: "#fff",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600
      }
    }, opps.length)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500
      }
    }, opps.length ? (sum / 1000).toFixed(0) + " k€" : "0 €")), opps.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "16px 8px",
        fontSize: 11,
        color: "#cbd5e1",
        textAlign: "center",
        fontStyle: "italic",
        border: "1px dashed #e2e8f0",
        borderRadius: 6
      }
    }, "Aucune opportunit\xE9"), opps.map((o, j) => {
      var openOpp = () => {
        var cid = urlId || display.id || "";
        window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(o.ref) + (cid ? "&client=" + encodeURIComponent(cid) : "");
      };
      var stageColor = s.color;
      var proba = o.proba || {
        qualif: 20,
        discovery: 35,
        propo: 55,
        nego: 75,
        won: 100
      }[o.stage] || 20;
      var isWon = o.stage === "won";
      var logoPalette = ["#f59e0b", "#0ea5e9", "#a855f7", "#dc2626", "#10b981", "#6366f1"];
      var logoBg = logoPalette[j % logoPalette.length];
      var logo = (o.client_name || display.name || "??").slice(0, 2).toUpperCase();
      var tagLabel = Array.isArray(o.modules) && o.modules[0] || (o.produit && o.produit.includes("Cyber") ? "Cyber" : o.produit && o.produit.includes("Hub") ? "Hub" : "Suite");
      var tagBg = tagLabel === "Cyber" ? "#fdecec" : tagLabel === "Hub" ? "#eef2ff" : "#f5efff";
      var tagColor = tagLabel === "Cyber" ? "#dc2626" : tagLabel === "Hub" ? "#4338ca" : "#7e22ce";
      return /*#__PURE__*/React.createElement("div", {
        key: o.ref || j,
        onClick: openOpp,
        style: {
          background: isWon ? "#f0fdf4" : "#fff",
          border: "1px solid " + (isWon ? "#bbf7d0" : "#eef1f5"),
          borderRadius: 10,
          padding: 11,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 9
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 28,
          height: 28,
          borderRadius: 6,
          background: logoBg,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10.5,
          fontWeight: 700,
          flexShrink: 0
        }
      }, logo), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          fontWeight: 600,
          color: "#0f172a",
          lineHeight: 1.3,
          wordBreak: "break-word"
        }
      }, o.name || "—"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#64748b",
          marginTop: 1
        }
      }, o.client_name || display.name || "—"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 4,
          marginTop: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-block",
          padding: "1px 6px",
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          background: tagBg,
          color: tagColor
        }
      }, tagLabel), isWon && /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-block",
          padding: "1px 6px",
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          background: "#e8f8f1",
          color: "#0e7a55"
        }
      }, "\u2713 Sign\xE9")))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 18,
          fontWeight: 600,
          color: "#0f172a",
          letterSpacing: -0.4
        }
      }, o.amount), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: 600
        }
      }, "Probabilit\xE9"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#0f172a",
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, proba, "%")), /*#__PURE__*/React.createElement("div", {
        style: {
          width: "100%",
          height: 3,
          background: "#eef1f5",
          borderRadius: 999,
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: proba + "%",
          height: "100%",
          background: stageColor,
          borderRadius: 999
        }
      }))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9"
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: o.owner,
        size: 20,
        color: o.ownerColor || stageColor
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#64748b",
          display: "inline-flex",
          alignItems: "center",
          gap: 3
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#94a3b8"
        }
      }, "\u25F7"), "0j")));
    }), /*#__PURE__*/React.createElement("a", {
      href: "/nouvelle-opportunite?client=" + encodeURIComponent(display.id || urlId || "") + "&stage=" + s.k,
      style: {
        display: "block",
        padding: "8px 10px",
        marginTop: 4,
        background: "#fff",
        border: "1px dashed " + s.color + "55",
        color: s.color,
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        textAlign: "center",
        textDecoration: "none",
        cursor: "pointer"
      },
      title: "Créer une opportunité directement en " + s.label
    }, "+ Ajouter une opportunit\xE9"));
  })), /*#__PURE__*/React.createElement("div", {
    style: pipeView === "list" ? {
      display: "flex",
      flexDirection: "column",
      gap: 6
    } : {
      display: "none"
    }
  }, opportunities.map((o, i) => {
    var edited = oppEdits[o.ref] || {};
    var currentStage = edited.stage || o.stage;
    var openOpp = () => {
      var cid = urlId || display.id || "";
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
  }, extraActions.filter(x => !x.client_id || x.client_id === (urlId || "ACC-0184")).length + (isCustom ? 0 : future.length))), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "T\xE2ches, relances et \xE9v\xE9nements planifi\xE9s")), /*#__PURE__*/React.createElement("button", {
    onClick: addAction,
    style: {
      ...cliStyles.primaryBtnSm,
      cursor: "pointer"
    }
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsList
  }, [...extraActions, ...(isCustom ? [] : future)].length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 14px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc"
    }
  }, "Aucune action planifi\xE9e. Cliquez sur ", /*#__PURE__*/React.createElement("b", null, "+ Ajouter"), " pour en cr\xE9er une."), [...extraActions, ...(isCustom ? [] : future)].map((a, i) => {
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
    }, (() => {
      // Détection du type d'action :
      //  - email → ouvre mailto:
      //  - call/appel → ouvre 3CX Web Client avec le numéro
      var tagL = (a.tag || "").toLowerCase();
      var titleL = (a.title || "").toLowerCase();
      var isEmail = tagL === "email" || titleL.includes("email") || a.icon === "✉" || a.icon === "📧";
      var isCall = tagL === "appel" || tagL === "call" || tagL === "phone" || titleL.includes("appel") || titleL.includes("relance") || a.icon === "📞" || a.icon === "☎";
      var isMeeting = tagL === "rdv" || tagL === "visio" || tagL === "meeting" || titleL.includes("rdv") || titleL.includes("rendez-vous") || a.icon === "📅" || a.icon === "🗓" || a.icon === "💻";
      var baseStyle = {
        ...cliStyles.actionIcon,
        background: a.priority === "ai" ? "#0f172a" : "#fff",
        color: a.priority === "ai" ? "#fff" : "#475569",
        borderColor: a.priority === "ai" ? "#0f172a" : "#eef1f5"
      };
      var hoverStyle = {
        ...baseStyle,
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 120ms, box-shadow 120ms"
      };
      var hoverOn = e => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.12)";
      };
      var hoverOff = e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      };
      if (isEmail) {
        var recipient = allContacts && allContacts[0] && allContacts[0].email || display.email || "";
        var contactNom = allContacts && allContacts[0] && allContacts[0].name || "";
        var lastName = contactNom.split(" ").slice(-1)[0] || "";
        var subject = "Prise de contact - Plaquette Astorya";
        var body = ["Bonjour Madame, Monsieur" + (lastName ? " " + lastName : "") + ",", "", "Suite à notre entretien vous pouvez trouver ci-joint la plaquette de notre entreprise en pièce jointe."].join("\n");
        var href = "mailto:" + encodeURIComponent(recipient) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        return /*#__PURE__*/React.createElement("a", {
          href: href,
          title: recipient ? "Ouvrir un mail pour " + recipient : "Aucun destinataire renseigné",
          onClick: e => {
            if (!recipient) {
              e.preventDefault();
              if (window.HubToast) window.HubToast.warn("Aucun email — ajoute un contact d'abord");
              return;
            }
            // Télécharge la plaquette automatiquement → l'utilisateur n'a
            // qu'à glisser-déposer le PDF dans son mail (mailto: ne supporte
            // pas les pièces jointes, contrainte navigateur).
            var link = document.createElement("a");
            link.href = "/assets/Plaquette-Astorya.pdf";
            link.download = "Plaquette-Astorya.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (window.HubToast) window.HubToast.success("📎 Plaquette téléchargée — glisse-la dans le mail comme pièce jointe");
          },
          style: hoverStyle,
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff
        }, a.icon);
      }
      if (isCall) {
        // Numéro : contact principal d'abord, sinon téléphone du client
        var targetPhone = allContacts && allContacts[0] && allContacts[0].phone || display.phone || "";
        var targetName = allContacts && allContacts[0] && allContacts[0].name || display.name;
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => {
            if (!targetPhone) {
              if (window.HubToast) window.HubToast.warn("Aucun téléphone renseigné — ajoute un contact");
              return;
            }
            var tel = targetPhone.replace(/[^\d+]/g, "");
            var supa = window.HubSupabase && window.HubSupabase.client;
            var launch = server => {
              var url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
              window.open(url, "3cx-webclient");
              if (window.HubToast) window.HubToast.info("📞 Appel de " + targetName + " via 3CX");
            };
            if (supa) {
              supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle().then(({
                data
              }) => launch(data && data.value)).catch(() => launch(null));
            } else {
              launch(null);
            }
          },
          title: "Appeler " + targetName + " via 3CX" + (targetPhone ? " (" + targetPhone + ")" : ""),
          style: {
            ...hoverStyle,
            border: 0
          },
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff
        }, a.icon);
      }
      if (isMeeting) {
        // Ouvre Outlook Calendar pour créer un événement avec :
        //  - l'invité (contact principal)
        //  - le commercial du compte (display.owner) en copie pour
        //    que le RDV se cale aussi sur son calendrier
        var attendeeEmail = allContacts && allContacts[0] && allContacts[0].email || "";
        var attendeeName = allContacts && allContacts[0] && allContacts[0].name || display.name;
        var now = new Date();
        var tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        tomorrow.setHours(9, 0, 0, 0);
        var start = tomorrow;
        var end = new Date(start.getTime() + 60 * 60 * 1000); // +1h
        var toIso = d => d.toISOString().replace(/\.\d{3}Z$/, "Z");
        var _subject = (a.title || "Rendez-vous") + " — " + (display.name || "");
        var _body = [a.meta || "", "", "Préparé via Hub Astorya"].filter(Boolean).join("\n");
        var params = new URLSearchParams({
          subject: _subject,
          body: _body,
          startdt: toIso(start),
          enddt: toIso(end),
          location: "Visio (à confirmer)",
          path: "/calendar/action/compose",
          rru: "addevent"
        });
        // Open the link async-after-lookup so we get the owner's email
        return /*#__PURE__*/React.createElement("button", {
          onClick: async () => {
            // Lookup l'email du commercial du compte via la table profiles
            var ownerEmail = "";
            try {
              if (display.owner && display.owner !== "—" && window.HubSupabase && window.HubSupabase.client) {
                var {
                  data: prof
                } = await window.HubSupabase.client.from("profiles").select("email").eq("name", display.owner).maybeSingle();
                if (prof && prof.email) ownerEmail = prof.email;
              }
            } catch (e) {}
            // Compose la liste des destinataires : contact + commercial
            var attendees = [];
            if (attendeeEmail) attendees.push(attendeeEmail);
            if (ownerEmail && ownerEmail !== attendeeEmail) attendees.push(ownerEmail);
            if (attendees.length > 0) params.set("to", attendees.join(";"));
            var url = "https://outlook.office.com/calendar/0/deeplink/compose?" + params.toString();
            window.open(url, "_blank", "noopener");
            if (window.HubToast) {
              var msg = "📅 RDV avec " + attendeeName + (ownerEmail ? " + " + display.owner + " en copie" : "") + " — Outlook ouvert";
              window.HubToast.info(msg);
            }
          },
          title: "Créer un RDV Outlook avec " + attendeeName + (attendeeEmail ? " (" + attendeeEmail + ")" : ""),
          style: {
            ...hoverStyle,
            border: 0
          },
          onMouseEnter: hoverOn,
          onMouseLeave: hoverOff
        }, a.icon);
      }
      return /*#__PURE__*/React.createElement("div", {
        style: baseStyle
      }, a.icon);
    })(), /*#__PURE__*/React.createElement("div", {
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
      onClick: async () => {
        var newTitle = window.HubModal ? await window.HubModal.prompt({
          title: "Renommer l'action",
          label: "Nouveau titre",
          default: a.title,
          okLabel: "Renommer"
        }) : prompt("Nouveau titre :", a.title);
        if (newTitle && newTitle.trim() && a.id) {
          setExtraActions(arr => arr.map(x => x.id === a.id ? {
            ...x,
            title: newTitle.trim()
          } : x));
          if (window.HubToast) window.HubToast.success("✓ Action renommée");
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
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cliStyles.subBlock,
      order: 1
    }
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
  }, allContacts.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      padding: "24px 16px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc",
      lineHeight: 1.6
    }
  }, "Aucun contact renseign\xE9 pour ce client.", /*#__PURE__*/React.createElement("br", null), "Cliquez sur ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#4f46e5"
    }
  }, "\xC9diter"), " dans le panneau Informations compte pour ajouter le contact principal, ou sur ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#4f46e5"
    }
  }, "+ Ajouter"), " ci-dessus pour un contact secondaire."), allContacts.map(p => /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var parts = (p.name || "").split(" ");
      var prenom = parts.shift() || "";
      var nom = parts.join(" ");
      setEditingContact({
        id: p.id || null,
        _legacyPrincipal: !p.id && p.last && p.last.indexOf("principal") >= 0,
        prenom: p.prenom || prenom,
        nom: p.nom || nom,
        fonction: p.role || "",
        email: p.email || "",
        phone: p.phone || "",
        linkedin: p.linkedin || "",
        color: p.color
      });
    },
    style: {
      background: "transparent",
      border: 0,
      padding: 0,
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
      cursor: "pointer",
      textAlign: "left"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#3730a3",
    onMouseLeave: e => e.currentTarget.style.color = "#0f172a",
    title: "Modifier ce contact"
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
  }, r))), p.email && /*#__PURE__*/React.createElement("a", {
    href: "mailto:" + p.email,
    style: {
      fontSize: 11,
      color: "#475569",
      marginTop: 6,
      fontFamily: "'JetBrains Mono', monospace",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    },
    onMouseEnter: e => e.currentTarget.style.color = "#3730a3",
    onMouseLeave: e => e.currentTarget.style.color = "#475569",
    title: "Envoyer un email à " + p.name
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10
    }
  }, "\u2709"), p.email), p.phone && /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      var tel = (p.phone || "").replace(/[^\d+]/g, "");
      if (!tel) return;
      // Récupère l'URL du serveur 3CX configurée dans app_settings,
      // fallback sur l'URL connue du Hub Astorya
      var supa = window.HubSupabase && window.HubSupabase.client;
      var launch = server => {
        var url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
        window.open(url, "3cx-webclient");
        if (window.HubToast) window.HubToast.info("📞 Appel de " + p.name + " via 3CX");
      };
      if (supa) {
        supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle().then(({
          data
        }) => launch(data && data.value)).catch(() => launch(null));
      } else {
        launch(null);
      }
    },
    style: {
      fontSize: 11,
      color: "#475569",
      fontFamily: "'JetBrains Mono', monospace",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: 4,
      cursor: "pointer"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#10b981",
    onMouseLeave: e => e.currentTarget.style.color = "#475569",
    title: "Appeler " + p.name + " via 3CX (" + p.phone + ")"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10
    }
  }, "\uD83D\uDCDE"), p.phone), /*#__PURE__*/React.createElement("div", {
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
  }, "\u2709"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var tel = (p.phone || "").replace(/[^\d+]/g, "");
      if (!tel) {
        if (window.HubToast) window.HubToast.warn("Aucun téléphone renseigné");
        return;
      }
      var supa = window.HubSupabase && window.HubSupabase.client;
      var launch = server => {
        var url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
        window.open(url, "3cx-webclient");
        if (window.HubToast) window.HubToast.info("📞 Appel de " + p.name + " via 3CX");
      };
      if (supa) {
        supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle().then(({
          data
        }) => launch(data && data.value)).catch(() => launch(null));
      } else {
        launch(null);
      }
    },
    title: "Appeler " + p.name + " via 3CX",
    style: {
      ...cliStyles.iconMini,
      cursor: "pointer",
      border: 0
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
    style: {
      ...cliStyles.subBlock,
      order: 2
    }
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
    label: "Commercial",
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
  }), display.size && display.size !== "—" && /*#__PURE__*/React.createElement(DetailRow, {
    label: "Effectif",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, display.size)
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
      onClick: async () => {
        var choice;
        if (window.HubModal) {
          choice = await window.HubModal.choice({
            title: ct.name,
            message: ct.type + " · " + ct.amount + " · " + (ct.status || "actif"),
            options: [{
              value: "1",
              label: "Voir détails",
              sub: "Afficher le récapitulatif complet"
            }, {
              value: "2",
              label: "Renouveler",
              sub: "Créer un nouveau contrat lié à ce client"
            }, {
              value: "3",
              label: "Supprimer",
              sub: "Soft-delete : la donnée reste en BDD"
            }]
          });
        } else {
          choice = prompt("Contrat " + ct.name + "\n\n1. Voir détails\n2. Renouveler\n3. Supprimer\n\nTapez 1, 2 ou 3 :", "1");
        }
        if (!choice) return;
        if (choice === "1") {
          if (window.HubToast) window.HubToast.info(ct.name + "\nType : " + ct.type + "\nMontant : " + ct.amount + "\nDébut : " + ct.start + "\nFin : " + ct.end + "\nStatut : " + ct.status, {
            duration: 8000
          });else alert(ct.name + "\n\nType : " + ct.type + "\nMontant : " + ct.amount);
        } else if (choice === "2") {
          window.location.href = "/nouveau-contrat?client=" + encodeURIComponent(urlId || "");
        } else if (choice === "3") {
          var ok = window.HubModal ? await window.HubModal.confirm({
            title: "Supprimer ce contrat ?",
            message: "Le contrat sera marqué supprimé (soft-delete). Il peut être restauré par un admin.",
            okLabel: "Supprimer",
            okStyle: "danger"
          }) : confirm("Supprimer ce contrat ?");
          if (!ok) return;
          try {
            await window.api.contracts.remove(ct.id);
            setContractsList(arr => arr.filter(x => x.id !== ct.id));
            if (window.HubToast) window.HubToast.success("✓ Contrat supprimé");
          } catch (e) {
            if (window.HubToast) window.HubToast.error("Suppression échouée : " + (e.message || e));
          }
        }
      },
      style: {
        background: "transparent",
        border: 0,
        color: "#94a3b8",
        fontSize: 16,
        cursor: "pointer",
        padding: "4px 8px"
      },
      title: "Actions sur ce contrat"
    }, "\u22EF")));
  }))))), /*#__PURE__*/React.createElement("section", {
    style: cliStyles.block
  }, /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: cliStyles.h2
  }, "\uD83C\uDFAB Tickets ", /*#__PURE__*/React.createElement("span", {
    style: cliStyles.blockCount
  }, clientTickets.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "Support technique et demandes en cours")), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing?client=" + encodeURIComponent(urlId || ""),
    style: {
      ...cliStyles.primaryBtnSm,
      textDecoration: "none",
      cursor: "pointer"
    }
  }, "+ Nouveau ticket")), clientTickets.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 14px",
      textAlign: "center",
      fontSize: 12.5,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 8,
      background: "#fafbfc"
    }
  }, "Aucun ticket pour ce client.") : /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "#fafbfc"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #eef1f5"
    }
  }, "Ref"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #eef1f5"
    }
  }, "Titre"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #eef1f5"
    }
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #eef1f5"
    }
  }, "Priorit\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      borderBottom: "1px solid #eef1f5"
    }
  }, "Ouvert"))), /*#__PURE__*/React.createElement("tbody", null, clientTickets.map(t => {
    var sCol = {
      open: "#3b82f6",
      in_progress: "#f59e0b",
      waiting: "#94a3b8",
      resolved: "#10b981",
      closed: "#64748b"
    }[t.status] || "#64748b";
    var pCol = {
      critique: "#dc2626",
      haute: "#ea580c",
      normale: "#64748b",
      basse: "#94a3b8"
    }[t.priority] || "#64748b";
    return /*#__PURE__*/React.createElement("tr", {
      key: t.id,
      onClick: () => window.location.href = "/ticketing?id=" + encodeURIComponent(t.id),
      style: {
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11.5,
        color: "#475569"
      }
    }, t.id), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px",
        fontWeight: 500,
        color: "#0f172a"
      }
    }, t.title), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        padding: "2px 7px",
        borderRadius: 4,
        background: sCol + "20",
        color: sCol,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4
      }
    }, t.status)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        padding: "2px 7px",
        borderRadius: 4,
        background: pCol + "20",
        color: pCol,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4
      }
    }, t.priority)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "10px",
        fontSize: 11.5,
        color: "#64748b"
      }
    }, t.opened_at ? new Date(t.opened_at).toLocaleDateString("fr-FR") : "—"));
  }))))), /*#__PURE__*/React.createElement(TechModule, {
    clientId: urlId,
    value: loadedClient && loadedClient.tech || {},
    onChange: async tech => {
      try {
        var updated = await window.api.clients.update(urlId, {
          tech
        });
        if (updated) setLoadedClient(updated);
      } catch (e) {
        console.warn("[ClientPage] save tech:", e);
      }
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }))), editingContact && /*#__PURE__*/React.createElement(ContactEditModal, {
    contact: editingContact,
    onClose: () => setEditingContact(null),
    onSave: saveContactEdit
  }), /*#__PURE__*/React.createElement(CallStatsModal, {
    open: statsOpen,
    client: {
      name: display.name
    },
    onClose: () => setStatsOpen(false)
  }), /*#__PURE__*/React.createElement(AssetInventoryModal, {
    open: assetsOpen,
    client: {
      name: display.name
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
    style: editSection
  }, "01 \xB7 Entreprise"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Raison sociale"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.raison_sociale || "",
    onChange: e => setEditDraft({
      ...editDraft,
      raison_sociale: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "SIREN"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.siren || "",
    onChange: e => setEditDraft({
      ...editDraft,
      siren: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Secteur d'activit\xE9"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.sector || "",
    onChange: e => setEditDraft({
      ...editDraft,
      sector: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 S\xE9lectionner \u2014"), ["Agriculture, sylviculture et pêche", "Industries extractives", "Industrie manufacturière", "Production et distribution d'électricité", "Eau, déchets et dépollution", "Construction & BTP", "Commerce", "Transports et entreposage", "Hébergement et restauration", "Information et communication", "Banque, finance & assurance", "Activités immobilières", "Activités spécialisées, scientifiques et techniques", "Services administratifs et de soutien", "Administration publique", "Enseignement", "Santé et action sociale", "Arts, spectacles et activités récréatives", "Autres activités de services", "Activités des ménages", "Activités extra-territoriales"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
  }, "Effectif"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.effectif || "",
    onChange: e => setEditDraft({
      ...editDraft,
      effectif: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), /*#__PURE__*/React.createElement("option", null, "1-50"), /*#__PURE__*/React.createElement("option", null, "51-250"), /*#__PURE__*/React.createElement("option", null, "251-1k"), /*#__PURE__*/React.createElement("option", null, "1k-5k"), /*#__PURE__*/React.createElement("option", null, "5k+"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Tier prospect"), /*#__PURE__*/React.createElement("select", {
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
  }, "Tier A \u2014 Grand compte"), /*#__PURE__*/React.createElement("option", {
    value: "B"
  }, "Tier B \u2014 Compte secondaire"), /*#__PURE__*/React.createElement("option", {
    value: "C"
  }, "Tier C \u2014 Tactique")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
  }, "LinkedIn entreprise"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.linkedin || "",
    onChange: e => setEditDraft({
      ...editDraft,
      linkedin: e.target.value
    }),
    placeholder: "linkedin.com/company/\u2026",
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: editSection
  }, "02 \xB7 Contact principal"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Pr\xE9nom"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.cp_prenom || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_prenom: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Nom"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.cp_nom || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_nom: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Fonction (intitul\xE9)"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.cp_fonction || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_fonction: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir une fonction \u2014"), (window.HubConstants && window.HubConstants.FONCTIONS || []).map(f => /*#__PURE__*/React.createElement("option", {
    key: f,
    value: f
  }, f)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: editDraft.cp_email || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_email: e.target.value
    }),
    style: editInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "T\xE9l\xE9phone"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.cp_phone || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_phone: e.target.value
    }),
    style: editInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "LinkedIn profil"), /*#__PURE__*/React.createElement("input", {
    value: editDraft.cp_linkedin || "",
    onChange: e => setEditDraft({
      ...editDraft,
      cp_linkedin: e.target.value
    }),
    placeholder: "linkedin.com/in/\u2026",
    style: editInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Niveau hi\xE9rarchique"), /*#__PURE__*/React.createElement("select", {
    value: editDraft.fonction || "",
    onChange: e => setEditDraft({
      ...editDraft,
      fonction: e.target.value
    }),
    style: editInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), /*#__PURE__*/React.createElement("option", {
    value: "Op\xE9r."
  }, "Op\xE9rationnel"), /*#__PURE__*/React.createElement("option", {
    value: "Mgr"
  }, "Manager"), /*#__PURE__*/React.createElement("option", {
    value: "Dir."
  }, "Directeur"), /*#__PURE__*/React.createElement("option", {
    value: "C-level"
  }, "C-level"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "R\xF4les d\xE9cision"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      paddingTop: 4
    }
  }, ["Décideur", "Prescripteur", "Utilisateur", "Acheteur"].map(r => {
    var on = (editDraft.roles || []).includes(r);
    return /*#__PURE__*/React.createElement("button", {
      key: r,
      type: "button",
      onClick: () => setEditDraft({
        ...editDraft,
        roles: on ? editDraft.roles.filter(x => x !== r) : [...(editDraft.roles || []), r]
      }),
      style: {
        padding: "4px 10px",
        border: on ? "1px solid #4f46e5" : "1px solid #e2e8f0",
        background: on ? "#eef2ff" : "#fff",
        borderRadius: 999,
        fontSize: 11.5,
        color: on ? "#3730a3" : "#475569",
        cursor: "pointer",
        fontWeight: on ? 600 : 500
      }
    }, r);
  })))), /*#__PURE__*/React.createElement("div", {
    style: editSection
  }, "03 \xB7 Commercial Astorya"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: editLabel
  }, "Commercial attribu\xE9"), /*#__PURE__*/React.createElement("select", {
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
  }, o.name, " \xB7 ", o.role))))), /*#__PURE__*/React.createElement("div", {
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
  }, "Enregistrer")))), addContactOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setAddContactOpen(false),
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
      maxWidth: 480,
      boxShadow: "0 20px 50px rgba(15,23,42,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid #eef1f5",
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "+ Ajouter un contact"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddContactOpen(false),
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
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Pr\xE9nom"), /*#__PURE__*/React.createElement("input", {
    value: newContactForm.prenom,
    onChange: e => setNewContactForm({
      ...newContactForm,
      prenom: e.target.value
    }),
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Nom"), /*#__PURE__*/React.createElement("input", {
    value: newContactForm.nom,
    onChange: e => setNewContactForm({
      ...newContactForm,
      nom: e.target.value
    }),
    style: modalInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Fonction"), /*#__PURE__*/React.createElement("select", {
    value: newContactForm.fonction,
    onChange: e => setNewContactForm({
      ...newContactForm,
      fonction: e.target.value
    }),
    style: modalInput
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Choisir une fonction \u2014"), (window.HubConstants && window.HubConstants.FONCTIONS || []).map(f => /*#__PURE__*/React.createElement("option", {
    key: f,
    value: f
  }, f)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: newContactForm.email,
    onChange: e => setNewContactForm({
      ...newContactForm,
      email: e.target.value
    }),
    style: modalInput
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "T\xE9l\xE9phone"), /*#__PURE__*/React.createElement("input", {
    value: newContactForm.phone,
    onChange: e => setNewContactForm({
      ...newContactForm,
      phone: e.target.value
    }),
    style: modalInput
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: modalLabel
  }, "LinkedIn"), /*#__PURE__*/React.createElement("input", {
    value: newContactForm.linkedin,
    onChange: e => setNewContactForm({
      ...newContactForm,
      linkedin: e.target.value
    }),
    placeholder: "linkedin.com/in/\u2026",
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
    onClick: () => setAddContactOpen(false),
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
    onClick: submitNewContact,
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
  }, "Ajouter")))), addActionOpen && /*#__PURE__*/React.createElement("div", {
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
var editSection = {
  fontSize: 12,
  fontWeight: 700,
  color: "#4f46e5",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  padding: "8px 0 4px",
  borderBottom: "1px solid #eef1f5",
  marginTop: 4
};
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

// ════════════════════════════════════════════════════════════════════
// TechModule — État technique du client (cf. Monday "Base client")
// Sections : Infrastructure, Sauvegarde, Cybersécurité, Mail, Logiciels,
//            Téléphonie, Web, Lien internet
// Stockage : clients.data.tech = { [fieldId]: status }
// ════════════════════════════════════════════════════════════════════
var TECH_SECTIONS = [{
  icon: "🖥",
  title: "Infrastructure & serveur",
  color: "#4f46e5",
  fields: [{
    id: "serveur_physique",
    label: "Serveur Physique"
  }, {
    id: "serveur_cloud",
    label: "Serveur CLOUD"
  }, {
    id: "owncloud",
    label: "Owncloud"
  }, {
    id: "nas",
    label: "NAS"
  }, {
    id: "maintenance",
    label: "Maintenance / Infogérance"
  }, {
    id: "imprimante",
    label: "Imprimante (équipement)"
  }, {
    id: "wifi",
    label: "Wifi"
  }, {
    id: "firewall",
    label: "Firewall"
  }, {
    id: "onduleur",
    label: "Onduleur"
  }]
}, {
  icon: "💾",
  title: "Sauvegarde",
  color: "#0ea5e9",
  fields: [{
    id: "sauvegarde_serveur_local",
    label: "Sauvegarde serveur local"
  }, {
    id: "sauvegarde_serveur_cloud",
    label: "Sauvegarde serveur CLOUD"
  }, {
    id: "sauvegarde_externe_local",
    label: "Sauvegarde externe du serveur local"
  }, {
    id: "sauvegarde_c2",
    label: "Sauvegarde C2"
  }, {
    id: "nas_offsite",
    label: "NAS Offsite"
  }, {
    id: "sauvegarde_3_2_1",
    label: "Sauvegarde 3.2.1"
  }]
}, {
  icon: "🛡",
  title: "Cybersécurité",
  color: "#dc2626",
  fields: [{
    id: "antivirus_edr",
    label: "Antivirus EDR poste"
  }, {
    id: "antispam",
    label: "Antispam"
  }, {
    id: "passbolt",
    label: "Passbolt / coffre numérique"
  }, {
    id: "bitlockage",
    label: "Bitlockage"
  }, {
    id: "phishing",
    label: "Campagne de phishing"
  }, {
    id: "formation_rsync",
    label: "Formation RSYNC"
  }]
}, {
  icon: "📧",
  title: "Mail",
  color: "#a855f7",
  fields: [{
    id: "mail_pop_imap",
    label: "Mail POP / IMAP"
  }, {
    id: "exchange",
    label: "Exchange Plan1 / Plan2"
  }, {
    id: "o365",
    label: "Microsoft 365"
  }, {
    id: "google_workspace",
    label: "Google Workspace"
  }]
}, {
  icon: "🧮",
  title: "Logiciels métier",
  color: "#10b981",
  fields: [{
    id: "sage",
    label: "Sage"
  }, {
    id: "ebp",
    label: "EBP"
  }, {
    id: "factorial",
    label: "Factorial"
  }]
}, {
  icon: "📞",
  title: "Téléphonie",
  color: "#f59e0b",
  fields: [{
    id: "telephonie_ovh",
    label: "Téléphonie (OVH)"
  }, {
    id: "mobile_telephonie",
    label: "Mobile téléphonie"
  }, {
    id: "teams_phone",
    label: "Teams & Phone"
  }]
}, {
  icon: "🌐",
  title: "Web",
  color: "#0891b2",
  fields: [{
    id: "nom_de_domaine",
    label: "Nom de domaine"
  }, {
    id: "hebergement_web",
    label: "Hébergement Web"
  }]
}, {
  icon: "🔌",
  title: "Lien internet",
  color: "#8b5cf6",
  fields: [{
    id: "lien_internet",
    label: "Lien internet principal"
  }, {
    id: "type_lien_internet",
    label: "Type de lien (ADSL / VDSL / FTTH …)"
  }, {
    id: "partenaire_lien_internet",
    label: "Partenaire (OVH, Free Pro …)"
  }, {
    id: "lien_internet_secours",
    label: "Lien internet (secours)"
  }]
}];
var TECH_STATUSES = [{
  value: "",
  label: "—",
  bg: "#fafbfc",
  color: "#94a3b8"
}, {
  value: "actif",
  label: "● Actif",
  bg: "#dcfce7",
  color: "#065f46"
}, {
  value: "inactif",
  label: "○ Inactif",
  bg: "#fee2e2",
  color: "#991b1b"
}, {
  value: "a_installer",
  label: "▲ À installer",
  bg: "#fef3c7",
  color: "#92400e"
}, {
  value: "non_concerne",
  label: "✕ Non concerné",
  bg: "#f1f5f9",
  color: "#64748b"
}, {
  value: "a_verifier",
  label: "? À vérifier",
  bg: "#dbeafe",
  color: "#1e40af"
}];
var TechModule = ({
  clientId,
  value,
  onChange
}) => {
  var [tech, setTech] = React.useState(value || {});
  React.useEffect(() => {
    setTech(value || {});
  }, [value]);
  var [openSections, setOpenSections] = React.useState(() => new Set(TECH_SECTIONS.slice(0, 3).map(s => s.title)));
  var [saving, setSaving] = React.useState(false);
  var setField = (id, v) => {
    var next = {
      ...tech,
      [id]: v
    };
    setTech(next);
    // Debounce sauvegarde 400ms
    if (setField._timer) clearTimeout(setField._timer);
    setField._timer = setTimeout(async () => {
      setSaving(true);
      try {
        await onChange(next);
      } finally {
        setSaving(false);
      }
    }, 400);
  };
  var toggleSection = title => {
    setOpenSections(prev => {
      var next = new Set(prev);
      if (next.has(title)) next.delete(title);else next.add(title);
      return next;
    });
  };

  // Compteur global
  var totalFields = TECH_SECTIONS.reduce((a, s) => a + s.fields.length, 0);
  var filledFields = TECH_SECTIONS.reduce((a, s) => a + s.fields.filter(f => tech[f.id] && tech[f.id] !== "").length, 0);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 18,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: -0.3
    }
  }, "\uD83D\uDEE0 Module technique"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "3px 0 0"
    }
  }, "\xC9tat du parc IT du client \xB7 ", filledFields, "/", totalFields, " champs renseign\xE9s")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, saving && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#10b981"
    }
  }, "\u25CF Sauvegarde\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      padding: "2px 8px",
      background: "#eef2ff",
      color: "#3730a3",
      borderRadius: 999,
      fontWeight: 700
    }
  }, Math.round(filledFields / totalFields * 100), "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, TECH_SECTIONS.map(sec => {
    var isOpen = openSections.has(sec.title);
    var secFilled = sec.fields.filter(f => tech[f.id] && tech[f.id] !== "").length;
    return /*#__PURE__*/React.createElement("div", {
      key: sec.title,
      style: {
        border: "1px solid #eef1f5",
        borderRadius: 10,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleSection(sec.title),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: isOpen ? sec.color + "0d" : "#fafbfc",
        border: 0,
        cursor: "pointer",
        textAlign: "left"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16
      }
    }, sec.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 13,
        fontWeight: 700,
        color: "#0f172a"
      }
    }, sec.title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, secFilled, "/", sec.fields.length), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#94a3b8"
      }
    }, isOpen ? "▾" : "▸")), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 14px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
      }
    }, sec.fields.map(f => {
      var v = tech[f.id] || "";
      var meta = TECH_STATUSES.find(s => s.value === v) || TECH_STATUSES[0];
      return /*#__PURE__*/React.createElement("label", {
        key: f.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "#fafbfc",
          border: "1px solid #eef1f5",
          borderRadius: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          fontSize: 12,
          color: "#0f172a",
          fontWeight: 500,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, f.label), /*#__PURE__*/React.createElement("select", {
        value: v,
        onChange: e => setField(f.id, e.target.value),
        style: {
          padding: "3px 6px",
          border: "1px solid " + (v ? meta.color + "40" : "#e2e8f0"),
          borderRadius: 5,
          fontSize: 11,
          fontWeight: 700,
          background: meta.bg,
          color: meta.color,
          cursor: "pointer",
          outline: "none"
        }
      }, TECH_STATUSES.map(s => /*#__PURE__*/React.createElement("option", {
        key: s.value,
        value: s.value
      }, s.label))));
    })));
  })));
};

// ════════════════════════════════════════════════════════════════════
// ContactEditModal — formulaire d'édition d'un contact existant
// Permet de modifier prénom, nom, fonction, email, phone, linkedin
// Sauvegarde via api.contacts.update (ou api.clients.update si legacy
// contact_principal stocké dans clients.data).
// ════════════════════════════════════════════════════════════════════
var ContactEditModal = ({
  contact,
  onClose,
  onSave
}) => {
  var [form, setForm] = React.useState(contact);
  var [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    var onKey = e => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  var submit = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };
  var portalTarget = typeof document !== "undefined" ? document.body : null;
  var tree = /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: CE.backdrop
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: CE.modal
  }, /*#__PURE__*/React.createElement("div", {
    style: CE.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CE.icon,
      background: (form.color || "#3730a3") + "20",
      color: form.color || "#3730a3"
    }
  }, ((form.prenom || "").slice(0, 1) + (form.nom || "").slice(0, 1)).toUpperCase() || "?"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: CE.eyebrow
  }, "Fiche client \xB7 Contact"), /*#__PURE__*/React.createElement("div", {
    style: CE.title
  }, "Modifier le contact"))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: CE.close
  }, "\xD7")), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: CE.body
  }, /*#__PURE__*/React.createElement("div", {
    style: CE.row
  }, /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "Pr\xE9nom"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: form.prenom || "",
    onChange: e => setForm({
      ...form,
      prenom: e.target.value
    }),
    style: CE.input,
    autoFocus: true
  })), /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "Nom"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: form.nom || "",
    onChange: e => setForm({
      ...form,
      nom: e.target.value
    }),
    style: CE.input
  }))), /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "Fonction"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: form.fonction || "",
    onChange: e => setForm({
      ...form,
      fonction: e.target.value
    }),
    placeholder: "Ex : CFO / Directeur financier",
    style: CE.input
  })), /*#__PURE__*/React.createElement("div", {
    style: CE.row
  }, /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: form.email || "",
    onChange: e => setForm({
      ...form,
      email: e.target.value
    }),
    placeholder: "prenom.nom@entreprise.fr",
    style: CE.input
  })), /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "T\xE9l\xE9phone"), /*#__PURE__*/React.createElement("input", {
    type: "tel",
    value: form.phone || "",
    onChange: e => setForm({
      ...form,
      phone: e.target.value
    }),
    placeholder: "+33 6 12 34 56 78",
    style: {
      ...CE.input,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }))), /*#__PURE__*/React.createElement("label", {
    style: CE.field
  }, /*#__PURE__*/React.createElement("span", {
    style: CE.label
  }, "LinkedIn"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: form.linkedin || "",
    onChange: e => setForm({
      ...form,
      linkedin: e.target.value
    }),
    placeholder: "linkedin.com/in/prenom-nom",
    style: {
      ...CE.input,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: CE.foot
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: CE.btnGhost
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: saving,
    style: {
      ...CE.btnPrimary,
      opacity: saving ? 0.6 : 1,
      cursor: saving ? "wait" : "pointer"
    }
  }, saving ? "Enregistrement…" : "💾 Enregistrer")))));
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};
var CE = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 3000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,.3)",
    display: "flex",
    flexDirection: "column"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px 16px",
    borderBottom: "1px solid #f1f5f9"
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 2
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "transparent",
    border: 0,
    fontSize: 22,
    color: "#94a3b8",
    cursor: "pointer"
  },
  body: {
    padding: "16px 24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5
  },
  label: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box"
  },
  foot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9"
  },
  btnGhost: {
    padding: "9px 14px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "9px 18px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700
  }
};
window.ClientPage = ClientPage;