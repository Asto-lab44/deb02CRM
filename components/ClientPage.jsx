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

const ClientPage = () => {
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [assetsOpen, setAssetsOpen] = React.useState(false);

  // Actions à mener : completion + ajout / suppression (localStorage)
  const [doneActions, setDoneActions]   = React.useState({});
  const [extraActions, setExtraActions] = React.useState([]);
  // Opportunités : édition inline
  const [oppDetailIdx, setOppDetailIdx] = React.useState(null);
  const [oppEdits, setOppEdits]         = React.useState({}); // { ref: { stage, amount, proba, owner, close, notes } }

  React.useEffect(() => {
    try { setDoneActions(JSON.parse(localStorage.getItem("hubAstorya.actionsDone.v1") || "{}")); } catch (e) {}
    try { setOppEdits(JSON.parse(localStorage.getItem("hubAstorya.oppEdits.v1") || "{}")); } catch (e) {}
  }, []);

  // Recharge actions/contacts/opps depuis l'API quand l'URL change
  const reloadAllForClient = React.useCallback(async () => {
    const cid = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null);
    if (!window.api) return;
    try {
      const [acts, conts, opps] = await Promise.all([
        window.api.actions.list({ client_id: cid }),
        window.api.contacts.list({ client_id: cid }),
        window.api.opportunities.list({ client_id: cid }),
      ]);
      // Liste des "anciens" noms démo à remplacer par l'utilisateur courant
      const legacyDemoNames = new Set(["Romain Daviaud","Nadia Lefèvre","Tom Verdier","Émilie Garnier","Sophie Aubry","Antoine Mercier","Julien Pasquier","Marie Lopez","Pierre Dubois","Romain Faure","Léo Tanaka","Diane Roussel","Farid Belkacem","Valérie Chen","Léa Marchand","Olivier Vasseur","Catherine Marchand","Hugo Bertrand"]);
      const currentUserName = (() => { try { const u = window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser(); return (u && u.name) || "Vous"; } catch (e) { return "Vous"; } })();
      const normalizeAssignee = (n) => (n && legacyDemoNames.has(n)) ? currentUserName : (n || currentUserName);
      const todo = (acts || []).filter((a) => a.status !== "done").map((a) => ({
        ...a,
        due: a.due || a.due_text || "Date à définir",
        assigned: normalizeAssignee(a.assigned || a.assigned_to),
        tag: a.tag || null,
        tagColor: a.tagColor || a.tag_color || "#475569",
        icon: a.icon || "•",
      }));
      const done = (acts || []).filter((a) => a.status === "done").map((a) => ({
        ...a,
        icon: a.icon || (a.type === "call" ? "☎" : a.type === "email" ? "✉" : a.type === "rdv" ? "📅" : a.type === "note" ? "✎" : "✓"),
        color: "#10b981",
        who: normalizeAssignee(a.assigned_to || a.assigned),
        at: a.completed_at
          ? new Date(a.completed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) + " · " + new Date(a.completed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "",
      }));
      setExtraActions(todo);
      setCompletedActions(done);
      setCustomContacts(conts || []);
      setStoredOpps((opps || []).map((o) => ({
        ref: o.id || o.ref,
        name: o.name,
        amount: o.amount_eur != null
          ? Math.round(o.amount_eur).toLocaleString("fr-FR").replace(/,/g, " ") + " €"
          : (o.amount || "—"),
        stage: o.stage || "qualif",
        proba: o.proba || 20,
        owner: o.owner || "Vous",
        ownerColor: "#0ea5e9",
        close: o.close_date
          ? new Date(o.close_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
          : (o.close || "—"),
        days: 0,
        isNew: o.stage === "qualif",
      })));
    } catch (e) { console.warn("[ClientPage] reload:", e); }
  }, []);
  React.useEffect(() => {
    reloadAllForClient();
    // Realtime : tout changement BDD (autre onglet, autre user) relance le
    // reload. Couvre actions/contacts/opps/contrats.
    if (window.HubData && window.HubData.subscribeChanges) {
      return window.HubData.subscribeChanges(reloadAllForClient);
    }
  }, [reloadAllForClient]);

  const [completedActions, setCompletedActions] = React.useState([]);

  // Complète une action utilisateur : la sort de extraActions et la pose dans completedActions
  const completeAction = async (a) => {
    try {
      await window.api.actions.complete(a.id);
      reloadAllForClient();
    } catch (e) { console.warn("completeAction:", e); }
  };

  const toggleAction = (key, action) => {
    // Pour une action utilisateur (a.id présent) : passer au statut terminé = déplacer
    if (action && action.id) {
      completeAction(action);
      return;
    }
    setDoneActions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("hubAstorya.actionsDone.v1", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  // Modal "Nouvelle action à mener"
  const [addActionOpen, setAddActionOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState({});
  const ownerListE = [
    { name: "Romain Daviaud",  role: "Direction · Achat",      color: "#4f46e5" },
    { name: "Augustin Morin",  role: "Direction · Commercial", color: "#10b981" },
  ];
  const [actionMenuKey, setActionMenuKey] = React.useState(null);
  const [reschedule, setReschedule] = React.useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (!moreMenuOpen) return;
    const close = () => setMoreMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [moreMenuOpen]);
  React.useEffect(() => {
    if (!actionMenuKey) return;
    const close = () => setActionMenuKey(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionMenuKey]);
  const [newAction, setNewAction] = React.useState({ type: "email", title: "", date: "", time: "", priority: "moyenne", assigned: "", tag: "", meta: "" });
  const openAddAction = () => { setNewAction({ type: "email", title: "", date: "", time: "", priority: "moyenne", assigned: "", tag: "", meta: "" }); setAddActionOpen(true); };
  const submitNewAction = async () => {
    if (!newAction.title.trim()) { alert("Le titre est obligatoire"); return; }
    const iconMap = { email: "✉", call: "📞", visio: "💻", rdv: "📅", task: "✓", note: "✎" };
    const dueText = newAction.date
      ? new Date(newAction.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) + (newAction.time ? " · " + newAction.time : "")
      : "Date à définir";
    if (!urlId) { alert("Aucun client sélectionné — impossible de créer l'action."); return; }
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
        tagColor: "#475569",
      });
      setAddActionOpen(false);
      reloadAllForClient();
    } catch (e) { alert("Erreur : " + (e.message || e)); }
  };
  const addAction = () => openAddAction();
  const removeAction = async (id) => {
    try { await window.api.actions.remove(id); reloadAllForClient(); } catch (e) {}
  };
  const updateOppField = (ref, field, value) => {
    setOppEdits((prev) => {
      const next = { ...prev, [ref]: { ...(prev[ref] || {}), [field]: value } };
      try { localStorage.setItem("hubAstorya.oppEdits.v1", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  // ───── Promotion prospect → client quand un projet passe à "won"
  const promoteToClient = (clientId, oppName) => {
    try {
      const local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      const idx = local.findIndex((p) => p.id === clientId);
      if (idx >= 0) {
        local[idx] = { ...local[idx], status: "client", client_since: new Date().toISOString(), won_via: oppName || "projet signé" };
        localStorage.setItem("hubAstorya.prospects.v1", JSON.stringify(local));
        return true;
      }
    } catch (e) {}
    return false;
  };

  // ───── Clients récents : top 6 (prospects + clients) depuis localStorage + Supabase
  const [recents, setRecents] = React.useState([]);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.clients.list().then((list) => {
      setRecents((list || []).slice(0, 8).map((p) => ({
        id: p.id,
        name: p.raison_sociale || p.name,
        status: p.status || "prospect",
        color: p.status === "client" ? "#0f766e" : "#1e40af",
      })));
    }).catch(() => {});
  }, []);

  // Modal opp détail : stage editable + autres champs
  const openOppDetail = (i) => setOppDetailIdx(i);
  const closeOppDetail = () => setOppDetailIdx(null);

  // ───── Tickets du client — depuis hub-data.fetchTickets filtré sur ce client
  const [clientTickets, setClientTickets] = React.useState([]);
  React.useEffect(() => {
    if (!urlId || !window.HubData || !window.HubData.enabled || !window.HubData.enabled()) { setClientTickets([]); return; }
    window.HubData.fetchTickets({ client_id: urlId, limit: 50 }).then(({ data }) => {
      setClientTickets((data || []).filter((t) => t.client_id === urlId));
    }).catch(() => {});
  }, [urlId]);

  // ───── Contrats du client — depuis api.contracts.list (Supabase)
  const [contractsList, setContractsList] = React.useState([]);
  React.useEffect(() => {
    if (!window.api || !urlId) { setContractsList([]); return; }
    window.api.contracts.list({ client_id: urlId }).then((list) => {
      setContractsList((list || []).map((c) => ({
        id: c.id,
        client_id: c.client_id,
        name: c.name,
        product: (c.data && c.data.products) ? "Multi-produits" : "—",
        type: (c.data && c.data.type) || "Contrat",
        amount: c.monthly_eur ? Math.round(c.monthly_eur * 12 / 1000) + " k€ / an"
              : c.total_ht_y1 ? Math.round(c.total_ht_y1 / 1000) + " k€ / an"
              : "—",
        start: c.start_date || (c.data && c.data.start) || "",
        end: c.end_date || (c.data && c.data.end) || "",
        status: c.status || "active",
      })));
    }).catch(() => {});
  }, [urlId]);

  // ───── Contacts clés du client : démo AXA + custom localStorage par client
  const defaultContacts = [];
  const [customContacts, setCustomContacts] = React.useState([]);
  const [editingContact, setEditingContact] = React.useState(null);
  // User auth Supabase pour la sidebar (au lieu du fallback "Utilisateur —")
  const [supaUser, setSupaUser] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.auth) return;
    window.api.auth.getUser().then((u) => { if (u) setSupaUser(u); }).catch(() => {});
  }, []);

  const reloadCustomContacts = async () => {
    if (!urlId || !window.api || !window.api.contacts) return;
    try {
      const conts = await window.api.contacts.list({ client_id: urlId });
      setCustomContacts(conts || []);
    } catch (e) {}
  };

  const saveContactEdit = async (form) => {
    if (!form) return;
    // Cas 1 : contact existe en table contacts → update direct
    if (form.id) {
      await window.api.contacts.update(form.id, {
        prenom: form.prenom, nom: form.nom, fonction: form.fonction,
        email: form.email, phone: form.phone, linkedin: form.linkedin,
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
          prenom: form.prenom, nom: form.nom, fonction: form.fonction,
          email: form.email, phone: form.phone, linkedin: form.linkedin,
        },
      });
      if (window.HubToast) window.HubToast.success("✓ Contact principal mis à jour");
      setEditingContact(null);
      window.location.reload();
      return;
    }
    // Cas 3 : legacy contact_additionnel dans clients.data → on le crée en table contacts
    const newContact = await window.api.contacts.create({
      client_id: urlId,
      prenom: form.prenom, nom: form.nom, fonction: form.fonction,
      email: form.email, phone: form.phone, linkedin: form.linkedin,
      is_principal: false,
    });
    if (newContact && window.HubToast) window.HubToast.success("✓ Contact mis à jour");
    await reloadCustomContacts();
    setEditingContact(null);
  };
  // Déclaration de loadedClient ICI (avant useMemo allContacts) pour éviter
  // que le useMemo ne lise une closure undefined lors du 1er rendu.
  const [loadedClient, setLoadedClient] = React.useState(null);

  // Composition unifiée : customContacts vient de api.contacts.list({client_id})
  // qui contient à la fois le contact principal (is_principal=true) et les co-contacts.
  const allContacts = React.useMemo(() => {
    const colors = ["#0ea5e9", "#f59e0b", "#dc2626", "#10b981", "#8b5cf6"];
    let coIdx = 0;
    const fromTable = (customContacts || [])
      .filter((cc) => (cc.prenom || cc.nom || cc.email || cc.phone || "").toString().trim())
      .map((cc) => {
        const fullName = ((cc.prenom || "") + " " + (cc.nom || "")).trim() || cc.email || cc.phone || "Contact";
        if (cc.is_principal) {
          return {
            id: cc.id, name: fullName, role: cc.fonction || "—",
            email: cc.email || "", phone: cc.phone || "", linkedin: cc.linkedin || "",
            color: "#a855f7",
            decisionRoles: Array.isArray(cc.roles) ? cc.roles : [],
            hierarchie: cc.hierarchie || "",
            last: "Contact principal", _custom: true,
          };
        }
        const color = colors[coIdx++ % colors.length];
        return {
          id: cc.id, name: fullName, role: cc.fonction || "—",
          email: cc.email || "", phone: cc.phone || "", linkedin: cc.linkedin || "",
          color, last: "Co-contact", _custom: true,
        };
      });

    // Fallback legacy : si aucun contact principal en table mais loadedClient.contact_principal renseigné
    const lc = loadedClient || {};
    const hasPrincipal = fromTable.some((x) => x.color === "#a855f7");
    if (!hasPrincipal && lc.contact_principal) {
      const cp = lc.contact_principal;
      const fullName = ((cp.prenom || "") + " " + (cp.nom || "")).trim();
      if (fullName || cp.email || cp.phone) {
        fromTable.unshift({
          name: fullName || cp.email || cp.phone || "Contact principal",
          role: cp.fonction || "—",
          email: cp.email || "", phone: cp.phone || "", linkedin: cp.linkedin || "",
          color: "#a855f7",
          decisionRoles: Array.isArray(lc.roles) ? lc.roles : [],
          hierarchie: lc.fonction || "",
          last: "Contact principal (legacy)",
        });
      }
    }

    // Fallback legacy : contacts_additionnels saisis directement dans clients.data
    if (Array.isArray(lc.contacts_additionnels)) {
      lc.contacts_additionnels.forEach((x) => {
        if (!(x.prenom || x.nom || x.email || x.phone)) return;
        const fullName = ((x.prenom || "") + " " + (x.nom || "")).trim() || x.email || x.phone || "Contact";
        if (fromTable.find((t) => t.email === x.email && x.email)) return; // dédupe
        fromTable.push({
          name: fullName, role: x.fonction || "—",
          email: x.email || "", phone: x.phone || "", linkedin: x.linkedin || "",
          color: colors[coIdx++ % colors.length], last: "Co-contact (legacy)",
        });
      });
    }

    return fromTable;
  }, [customContacts, loadedClient]);

  const [addContactOpen, setAddContactOpen] = React.useState(false);
  const [newContactForm, setNewContactForm] = React.useState({ prenom: "", nom: "", fonction: "", email: "", phone: "", linkedin: "" });

  const addContact = () => {
    setNewContactForm({ prenom: "", nom: "", fonction: "", email: "", phone: "", linkedin: "" });
    setAddContactOpen(true);
  };
  const submitNewContact = async () => {
    const f = newContactForm;
    if (!(f.prenom || f.nom || f.email || f.phone)) { alert("Remplissez au moins un champ"); return; }
    if (!urlId) { alert("Aucun client sélectionné."); return; }
    try {
      await window.api.contacts.create({
        client_id: urlId,
        prenom: f.prenom, nom: f.nom, fonction: f.fonction,
        email: f.email, phone: f.phone, linkedin: f.linkedin,
        is_principal: false,
      });
      setAddContactOpen(false);
      reloadAllForClient();
    } catch (e) { alert("Erreur : " + (e.message || e)); }
  };
  const removeContact = async (id) => {
    try { await window.api.contacts.remove(id); reloadAllForClient(); } catch (e) {}
  };

  const [pastShowAll, setPastShowAll] = React.useState(false);
  const [pipeView, setPipeView] = React.useState("kanban"); // "kanban" | "list"

  const addContract = () => {
    const cid = urlId || display.id || "";
    window.location.href = "/nouveau-contrat" + (cid ? "?client=" + encodeURIComponent(cid) : "");
  };

  // ───── Récupère le client à afficher selon l'ID dans l'URL
  // - localStorage prospects créés via /nouveau-prospect (clé hubAstorya.prospects.v1)
  // - sinon Supabase clients
  // - sinon fallback démo AXA Wealth France
  const urlId = (typeof window !== "undefined") ? new URLSearchParams(window.location.search).get("id") : null;

  React.useEffect(() => {
    if (!urlId) { setLoadedClient(null); return; }
    if (window.api && window.api.clients) {
      window.api.clients.getById(urlId).then((data) => {
        if (data) setLoadedClient(data);
      }).catch((e) => console.warn("[ClientPage] getById:", e));
    }
  }, [urlId]);

  // Mapping unifié vers les champs d'affichage
  const c = loadedClient || {};
  // isCustom = true dès qu'on a un ?id= dans l'URL (même avant que le fetch
  // ait peuplé loadedClient) → empêche le flash des défauts AXA sur la fiche
  // d'un prospect Astorya pendant le chargement.
  const isCustom = !!urlId || !!loadedClient;
  // Si on a un ?id= mais pas encore de loadedClient, on évite TOUT fallback AXA
  // (sinon flash visuel du nom/secteur AXA pendant le fetch).
  const empty = isCustom && !loadedClient;
  const display = {
    id:        c.id || (urlId || "—"),
    name:      c.raison_sociale || c.name || (empty ? "Chargement…" : "Sélectionnez un client"),
    sector:    c.secteur || c.industry || "—",
    size:      c.effectif ? `Effectif ${c.effectif}` : "—",
    city:      c.ville || c.city || "—",
    web:       c.site_web || c.website || "",
    since:     c.created_at ? `Prospect depuis ${new Date(c.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : (c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : ""),
    desc:      c.notes || c.besoin || "",
    logo:      (c.raison_sociale || c.name || "?").slice(0, 2).toUpperCase(),
    arr:       "—",
    pipe:      "0",
    health:    "—",
    contactPrincipal: c.contact_principal || null,
    owner:     c.owner || "—",
    ownerColor: c.owner_color || "#64748b",
    coowner:   c.coowner || "—",
    coownerColor: c.coowner_color || "#64748b",
    source:    c.source || "—",
    concurrent: c.concurrent || "—",
    concurrentEnd: c.concurrent_end || "",
    concurrentAmount: c.concurrent_amount || "",
    contactDate: c.contact_date || "",
    projectDate: c.project_date || "",
    clientSince: c.client_since
      ? new Date(c.client_since).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
      : c.created_at
      ? new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
      : "—",
    renewal:   c.renewal || "—",
    activeContracts: c.active_contracts || "—",
    address:   c.adresse || "—",
    cp:        c.code_postal || "",
    addressCity: c.ville || c.city || "",
    siren:     c.siren || "",
    naf:       c.naf || "",
    sousSecteur: c.sous_secteur || "",
    tier:      c.tier || "",
    ca:        c.ca_meur || "",
    linkedin:  c.linkedin_entreprise || "",
    tva:       c.tva || "",
    fonction:  c.fonction || "",
    action:    c.action || "",
    besoin:    c.besoin || "",
  };

  const openEdit = () => {
    const cp = c.contact_principal || {};
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
      desc: c.notes || "",
    });
    setEditOpen(true);
  };


  const saveEdit = async () => {
    if (!urlId) { alert("Édition uniquement disponible pour les prospects créés"); return; }
    const ownerObj = ownerListE.find((o) => o.name === editDraft.owner);
    const coownerObj = ownerListE.find((o) => o.name === editDraft.coowner);
    const patch = {
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
        linkedin: editDraft.cp_linkedin || "",
      },
      notes: editDraft.desc || null,
    };
    try {
      const updated = await window.api.clients.update(urlId, patch);
      if (updated) setLoadedClient(updated);
      // Si contact_principal a été modifié, on met aussi à jour la table contacts
      if (patch.contact_principal && (patch.contact_principal.prenom || patch.contact_principal.nom || patch.contact_principal.email)) {
        // Cherche s'il existe déjà un contact_principal pour ce client
        const existing = (await window.api.contacts.list({ client_id: urlId })) || [];
        const principal = existing.find((x) => x.is_principal);
        if (principal) {
          await window.api.contacts.update(principal.id, {
            prenom: patch.contact_principal.prenom,
            nom: patch.contact_principal.nom,
            fonction: patch.contact_principal.fonction,
            email: patch.contact_principal.email,
            phone: patch.contact_principal.phone,
            linkedin: patch.contact_principal.linkedin,
            roles: patch.roles,
            hierarchie: patch.fonction,
          });
        } else {
          await window.api.contacts.create({
            client_id: urlId,
            ...patch.contact_principal,
            roles: patch.roles,
            hierarchie: patch.fonction,
            is_principal: true,
          });
        }
        reloadAllForClient();
      }
    } catch (e) { console.warn("saveEdit:", e); }
    setEditOpen(false);
  };

  const Avatar = ({ name, size = 24, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", M: "#a855f7", N: "#ec4899", E: "#14b8a6", A: "#dc2626", J: "#0ea5e9", P: "#8b5cf6" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  // ── Pipe : opportunités du client AXA Wealth France
  const pipeStages = [
    { k: "qualif", label: "Qualification", color: "#94a3b8" },
    { k: "discovery", label: "Discovery", color: "#3b82f6" },
    { k: "propo", label: "Proposition", color: "#a855f7" },
    { k: "nego", label: "Négociation", color: "#ea580c" },
    { k: "won", label: "Signé", color: "#10b981" },
  ];

  // ── Opportunités chargées par reloadAllForClient (via api.opportunities.list filtré par client_id)
  const [storedOpps, setStoredOpps] = React.useState([]);
  const opportunities = storedOpps;

  // ── Actions menées (passé, dernières)
  // Actions historiques : SEULEMENT celles terminées par l'utilisateur (extraites de Supabase via reloadAllForClient)
  const past = [];
  const pastExtras = [];
  const completedForThis = completedActions;
  const pastAll = past;
  const pastShown = completedForThis;
  const pastTotal = completedForThis.length;

  // Actions à mener : SEULEMENT celles créées par l'utilisateur (extraites de Supabase, statut "todo")
  const future = [];

  const prioMeta = {
    haute: { label: "Haute", color: "#dc2626", bg: "#fdecec" },
    moyenne: { label: "Moyenne", color: "#ea580c", bg: "#fef0e6" },
    basse: { label: "Basse", color: "#475569", bg: "#eef1f5" },
    ai: { label: "IA", color: "#fff", bg: "#0f172a" },
  };

  return (
    <div style={cliStyles.frame}>
      {/* ───── SIDEBAR ───── */}
      <aside style={cliStyles.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...cliStyles.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          <div style={cliStyles.logo}><div style={cliStyles.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>CRM commercial</div>
          </div>
        </a>
        <a href="/nouveau-prospect" style={{ ...cliStyles.newBtn, textDecoration: "none", cursor: "pointer", background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0" }}>+ Nouveau prospect <span style={{ ...cliStyles.kbd, background: "#f1f5f9", color: "#475569" }}>P</span></a>
        <a href={"/nouvelle-opportunite?client=" + encodeURIComponent(display.id)} style={{ ...cliStyles.newBtn, textDecoration: "none", cursor: "pointer", marginTop: -8 }}>+ Nouvelle opportunité <span style={cliStyles.kbd}>N</span></a>

        <div style={cliStyles.navSection}>
          <div style={cliStyles.navLabel}>Espace</div>
          <a href="/crm" style={{ ...cliStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={cliStyles.bullet}>▦</span><span style={{ flex: 1 }}>Pipeline</span>
          </a>
          <div style={{ ...cliStyles.navItem, ...cliStyles.navItemActive }}><span style={cliStyles.bullet}>◰</span><span style={{ flex: 1 }}>Comptes</span></div>
          <a href="/crm#contacts"
             style={{ ...cliStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={cliStyles.bullet}>◉</span><span style={{ flex: 1 }}>Contacts</span>
          </a>
          <a href="/crm#actions"
             style={{ ...cliStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={cliStyles.bullet}>✦</span><span style={{ flex: 1 }}>Activités</span>
          </a>
        </div>

        <div style={cliStyles.navSection}>
          <div style={cliStyles.navLabel}>Clients récents · {recents.length}</div>
          {recents.length === 0 && (
            <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 8px" }}>Aucun compte. <a href="/nouveau-prospect" style={{ color: "#3730a3", fontWeight: 600 }}>+ Créer</a></div>
          )}
          {recents.map((c) => {
            const initials = (c.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const active = c.id === display.id;
            return (
              <a key={c.id} href={"/fiche-client?id=" + encodeURIComponent(c.id)}
                 style={{ ...cliStyles.navItem, ...(active ? cliStyles.navItemActive : {}), textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                <span style={{ ...cliStyles.miniLogo, background: c.color }}>{initials}</span>
                <span style={{ flex: 1, fontWeight: active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700, background: c.status === "client" ? "#dcfce7" : "#fef3c7", color: c.status === "client" ? "#065f46" : "#78350f", textTransform: "uppercase" }}>{c.status === "client" ? "✓" : "P"}</span>
              </a>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {(() => {
          // Priorité : Supabase auth (fetché en useEffect) puis HubAccess legacy
          const cu = supaUser
            ? { name: supaUser.user_metadata?.name || supaUser.email, role: "Astorya" }
            : ((window.HubAccess && window.HubAccess.getCurrentUser && window.HubAccess.getCurrentUser()) || null);
          const nm = (cu && cu.name) || "Non connecté";
          const rl = (cu && cu.role) || "Cliquer pour s'identifier";
          return (
        <a href="/administration-utilisateurs"
           title="Profil & préférences"
           style={{ ...cliStyles.userRow, textDecoration: "none", color: "inherit", cursor: "pointer" }}>
          <Avatar name={nm} size={26} color="#4f46e5" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nm}</div>
            <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rl}</div>
          </div>
        </a>
          );
        })()}
      </aside>

      {/* ───── MAIN ───── */}
      <main style={cliStyles.main}>
        {/* Topbar */}
        <header style={cliStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
            <span>CRM</span><span style={{ color: "#cbd5e1" }}>/</span>
            <span>Comptes</span><span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{display.name}</span>
            <span style={cliStyles.refMono}>{display.id}</span>
            <span style={cliStyles.healthChip}>● Compte sain</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const idx = recents.findIndex((r) => r.id === urlId);
                if (idx > 0) window.location.href = "/fiche-client?id=" + encodeURIComponent(recents[idx - 1].id);
              }}
              disabled={(() => { const i = recents.findIndex((r) => r.id === urlId); return i <= 0; })()}
              style={{ ...cliStyles.iconBtn, cursor: "pointer" }}
              title="Client précédent"
            >‹</button>
            <button
              onClick={() => {
                const idx = recents.findIndex((r) => r.id === urlId);
                if (idx >= 0 && idx < recents.length - 1) window.location.href = "/fiche-client?id=" + encodeURIComponent(recents[idx + 1].id);
              }}
              disabled={(() => { const i = recents.findIndex((r) => r.id === urlId); return i < 0 || i >= recents.length - 1; })()}
              style={{ ...cliStyles.iconBtn, cursor: "pointer" }}
              title="Client suivant"
            >›</button>
            <button onClick={() => {
              const key = "hubAstorya.followed.v1";
              let list = []; try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
              const cid = urlId || display.id;
              if (list.includes(cid)) {
                list = list.filter((x) => x !== cid);
                localStorage.setItem(key, JSON.stringify(list));
                alert("Vous ne suivez plus " + display.name);
              } else {
                list.push(cid);
                localStorage.setItem(key, JSON.stringify(list));
                alert("✓ Vous suivez " + display.name);
              }
            }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>★ Suivre</button>
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setMoreMenuOpen((v) => !v); }}
                style={{ ...cliStyles.iconBtn, cursor: "pointer" }}
                title="Plus d'actions"
              >⋯</button>
              {moreMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 1000, minWidth: 220, padding: 4 }}
                >
                  <button
                    onClick={async () => { if (!urlId) return; await window.api.clients.update(urlId, { status: "client", client_since: new Date().toISOString() }); window.location.reload(); }}
                    style={cliStyles.menuItem}
                  >✓ Convertir en client</button>
                  <button
                    onClick={async () => { if (!urlId) return; await window.api.clients.update(urlId, { status: "archived" }); window.location.href = "/crm"; }}
                    style={cliStyles.menuItem}
                  >📦 Archiver</button>
                  <div style={{ height: 1, background: "#eef1f5", margin: "4px 0" }} />
                  <button
                    onClick={async () => {
                      if (!urlId) return;
                      const ok = window.HubModal
                        ? await window.HubModal.confirm({
                            title: "Supprimer " + display.name + " ?",
                            message: "Soft-delete : la donnée reste en BDD, juste marquée supprimée. Elle peut être restaurée par un admin.",
                            okLabel: "Supprimer",
                            okStyle: "danger",
                          })
                        : confirm("Supprimer définitivement " + display.name + " ?");
                      if (!ok) return;
                      try {
                        await window.api.clients.remove(urlId);
                        if (window.HubToast) window.HubToast.success("✓ Client supprimé");
                        window.location.href = "/crm";
                      } catch (err) {
                        alert("Suppression échouée : " + (err && err.message || err));
                      }
                    }}
                    style={{ ...cliStyles.menuItem, color: "#dc2626" }}
                  >🗑 Supprimer définitivement</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={cliStyles.scroll}>
          {/* HERO */}
          <section style={cliStyles.hero}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div style={cliStyles.coLogoBig}>{display.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={cliStyles.industryChip}>{display.sector}</span>
                  {display.tier && (() => {
                    const tierLabels = { A: "Grand compte", B: "Compte secondaire", C: "Tactique" };
                    const tierColors = { A: { bg: "#fef3c7", color: "#a16207" }, B: { bg: "#eef2ff", color: "#3730a3" }, C: { bg: "#f1f5f9", color: "#475569" } };
                    const t = String(display.tier).toUpperCase();
                    const lbl = tierLabels[t] || display.tier;
                    const col = tierColors[t] || { bg: "#eef1f5", color: "#475569" };
                    return <span style={{ ...cliStyles.metaChip, background: col.bg, color: col.color, fontWeight: 600 }}>Tier {t} — {lbl}</span>;
                  })()}
                  <span style={cliStyles.metaChip}>{display.size}</span>
                  {/* Badge BODACC — affiché dès qu'on a un SIREN, auto-check 7j */}
                  {display.siren && window.ProcedureBadge && (
                    <ProcedureBadge
                      siren={display.siren}
                      stored={c.procedure_collective || (c.data && c.data.procedure_collective) || null}
                      autoCheck={true}
                      onChange={async (r) => {
                        // Persiste le résultat dans clients.data
                        if (!urlId || !window.api || !window.api.clients) return;
                        try {
                          await window.api.clients.update(urlId, { procedure_collective: r });
                          // Notification si on vient de détecter un nouveau passage en procédure
                          const before = c.procedure_collective || (c.data && c.data.procedure_collective);
                          if (window.HubToast && r.status === "warn" && (!before || before.status === "ok")) {
                            window.HubToast.warn("⚠ " + display.name + " est passé en procédure collective depuis le dernier check (" + (r.announcement?.type || "") + ")", { duration: 10000 });
                          } else if (window.HubToast && r.status === "danger" && (!before || before.status !== "danger")) {
                            window.HubToast.error("🔴 " + display.name + " — " + (r.announcement?.type || "Liquidation"), { duration: 12000 });
                          }
                        } catch (e) { console.warn("[ClientPage] persist BODACC:", e); }
                      }}
                    />
                  )}
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>📍 {display.city}</span>
                  <span style={cliStyles.dot} />
                  <a href={display.web && display.web.startsWith("http") ? display.web : "https://" + display.web} target="_blank" style={{ fontSize: 12, color: "#4f46e5", cursor: "pointer", textDecoration: "none" }}>{display.web} ↗</a>
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{display.since}</span>
                </div>
                <h1 style={cliStyles.h1}>{display.name}</h1>
                {display.desc && (
                  <p style={cliStyles.subtitle}>{display.desc}</p>
                )}

              </div>

              {/* Quick stats — calculées depuis les données réelles */}
              {(() => {
                const arrNum = contractsList.reduce((s, ct) => s + (parseFloat(String(ct.amount || "").replace(/[^\d.]/g, "")) || 0), 0);
                const arrLabel = arrNum > 0 ? Math.round(arrNum / 1000) + " k€" : (isCustom ? "—" : display.arr);
                const opps = storedOpps.filter((o) => o.stage !== "won" && o.stage !== "lost");
                const pipeNum = opps.reduce((s, o) => {
                  const amt = parseFloat(String(o.amount || "").replace(/[^\d.]/g, "")) || 0;
                  return s + amt;
                }, 0);
                const pipeLabel = pipeNum > 0 ? Math.round(pipeNum / 1000) + " k€" : (isCustom ? "0" : display.pipe);
                const oppCount = opps.length;
                // Health = % critères basiques renseignés
                const criteres = [
                  !!c.contact_principal && (c.contact_principal.email || c.contact_principal.nom),
                  !!c.siren, !!c.secteur, !!c.adresse, !!c.owner,
                  contractsList.length > 0 || opps.length > 0,
                ];
                const filled = criteres.filter(Boolean).length;
                const healthVal = Math.round((filled / criteres.length) * 100);
                const healthLabel = isCustom ? healthVal : display.health;
                return (
                  <div style={cliStyles.heroStats}>
                    <div style={cliStyles.heroStat}>
                      <div style={cliStyles.heroStatK}>ARR actuel</div>
                      <div style={cliStyles.heroStatV}>{arrLabel}</div>
                      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{contractsList.length} contrat{contractsList.length > 1 ? "s" : ""}</div>
                    </div>
                    <div style={cliStyles.heroStat}>
                      <div style={cliStyles.heroStatK}>Pipe ouvert</div>
                      <div style={{ ...cliStyles.heroStatV, color: "#4f46e5" }}>{pipeLabel}</div>
                      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{oppCount} opportunité{oppCount > 1 ? "s" : ""}</div>
                    </div>
                    <div style={cliStyles.heroStat} title="Score basé sur la complétude des informations (contact, SIREN, secteur, adresse, commercial, contrat/opp).">
                      <div style={cliStyles.heroStatK}>Health score</div>
                      <div style={{ ...cliStyles.heroStatV, color: healthVal >= 70 ? "#10b981" : healthVal >= 40 ? "#f59e0b" : "#dc2626" }}>{healthLabel}<span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{healthLabel !== "—" ? " / 100" : ""}</span></div>
                      <div style={cliStyles.miniBar}><div style={{ width: (healthLabel === "—" ? "0%" : healthLabel + "%"), height: "100%", background: "linear-gradient(90deg, #4f46e5, #10b981)", borderRadius: 999 }} /></div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action bar */}
            <div style={cliStyles.actionBar}>
              <a href={"/nouvelle-opportunite?client=" + encodeURIComponent(display.id)} style={{ ...cliStyles.primaryBtn, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>+ Nouvelle opportunité</a>
              <button onClick={() => { setNewAction({ type: "email", title: "Email — " + display.name, date: "", time: "", priority: "moyenne", assigned: "Vous", tag: "Email", meta: "" }); setAddActionOpen(true); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✉ Email</button>
              <button onClick={() => { setNewAction({ type: "rdv", title: "RDV — " + display.name, date: "", time: "", priority: "moyenne", assigned: "Vous", tag: "RDV", meta: "" }); setAddActionOpen(true); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>📅 RDV</button>
              <button onClick={() => { setNewAction({ type: "call", title: "Appel — " + display.name, date: "", time: "", priority: "moyenne", assigned: "Vous", tag: "Appel", meta: "" }); setAddActionOpen(true); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>📞 Appel</button>
              <button onClick={() => { setNewAction({ type: "task", title: "", date: "", time: "", priority: "moyenne", assigned: "Vous", tag: "Tâche", meta: "" }); setAddActionOpen(true); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✓ Tâche</button>
              <button onClick={() => { setNewAction({ type: "note", title: "", date: "", time: "", priority: "basse", assigned: "Vous", tag: "Note", meta: "" }); setAddActionOpen(true); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✎ Note</button>
              <button
                onClick={() => setStatsOpen(true)}
                style={{ ...cliStyles.ghostBtn, background: "#eef2ff", borderColor: "#c7d2fe", color: "#3730a3", fontWeight: 600 }}
                title="Statistiques d'appels hotline sur 12 mois"
              >
                📊 Stats appels
              </button>
              <button
                onClick={() => setAssetsOpen(true)}
                style={{ ...cliStyles.ghostBtn, background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46", fontWeight: 600 }}
                title="Extraction du parc informatique du client (CMDB)"
              >
                💻 Parc IT
              </button>
              <span style={{ flex: 1 }} />
              <button onClick={() => {
                const rows = [["Champ", "Valeur"]];
                rows.push(["Nom", display.name]);
                rows.push(["Référence", display.id]);
                rows.push(["Secteur", display.sector]);
                rows.push(["Effectif", display.size]);
                rows.push(["Ville", display.city]);
                rows.push(["Site web", display.web]);
                rows.push(["Commercial", display.owner]);
                rows.push(["SIREN", display.siren]);
                rows.push(["NAF", display.naf]);
                rows.push(["TVA", display.tva]);
                rows.push(["Adresse", display.address]);
                rows.push(["Code postal", display.cp]);
                rows.push(["Ville", display.addressCity]);
                rows.push(["Source", display.source]);
                rows.push(["Concurrent", display.concurrent]);
                rows.push(["Tier", display.tier]);
                rows.push([]);
                rows.push(["Opportunités"]);
                rows.push(["Ref", "Nom", "Étape", "Montant", "Commercial", "Clôture"]);
                opportunities.forEach((o) => rows.push([o.ref, o.name, o.stage, o.amount, o.owner, o.close]));
                const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
                a.download = `compte-AXA-Wealth-France-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>Exporter compte ↓</button>
            </div>
          </section>

          {/* PIPE — Contrats / opportunités */}
          <section style={cliStyles.block}>
            <div style={cliStyles.blockHead}>
              <div>
                <h2 style={cliStyles.h2}>Pipe contrats <span style={cliStyles.blockCount}>{opportunities.length}</span></h2>
                <p style={cliStyles.h2sub}>Vue d'ensemble des opportunités et contrats actifs pour ce client</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPipeView("kanban")} style={{ ...cliStyles.filterPill, cursor: "pointer", ...(pipeView === "kanban" ? { background: "#0f172a", color: "#fff" } : {}) }}>Vue Kanban ▦</button>
                <button onClick={() => setPipeView("list")} style={{ ...cliStyles.filterPill, cursor: "pointer", ...(pipeView === "list" ? { background: "#0f172a", color: "#fff" } : {}) }}>Vue Liste ☰</button>
              </div>
            </div>

            {/* Stage progression strip */}
            {pipeView === "kanban" && <div style={cliStyles.stagesStrip}>
              {pipeStages.map((s, i) => {
                const opps = opportunities.filter(o => o.stage === s.k);
                const sum = opps.reduce((acc, o) => acc + parseInt(o.amount.replace(/\s/g, "").replace(" €", "").replace(/[^\d]/g, "")), 0);
                return (
                  <div key={s.k} style={cliStyles.stageCol}>
                    <div style={cliStyles.stageColHead}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>{s.label}</span>
                      <span style={cliStyles.stageCount}>{opps.length}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", padding: "0 4px" }}>
                      {opps.length ? `${(sum/1000).toFixed(0)} k€` : "—"}
                    </div>
                    <div style={cliStyles.stageColBar}>
                      <div style={{ width: opps.length ? "100%" : "0%", height: "100%", background: s.color, opacity: 0.6, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>}

            {/* Opp cards / liste */}
            <div style={pipeView === "list" ? { display: "flex", flexDirection: "column", gap: 6 } : cliStyles.oppGrid}>
              {opportunities.map((o, i) => {
                const edited = oppEdits[o.ref] || {};
                const currentStage = edited.stage || o.stage;
                const openOpp = () => {
                  const cid = urlId || display.id || "";
                  window.location.href = "/avancer-opportunite?opp=" + encodeURIComponent(o.ref) + (cid ? "&client=" + encodeURIComponent(cid) : "");
                };
                const stage = pipeStages.find(s => s.k === o.stage);
                return (
                  <div key={i} onClick={openOpp} style={{ ...cliStyles.oppCard, ...(o.won ? cliStyles.oppCardWon : {}), ...(o.hot ? cliStyles.oppCardHot : {}), cursor: "pointer" }}>
                    {o.isNew && <span style={cliStyles.newRibbon}>NOUVEAU</span>}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={cliStyles.oppRef}>{o.ref}</span>
                          <span style={{ ...cliStyles.stagePill, background: stage.color + "20", color: stage.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: 999, background: stage.color }} />
                            {stage.label}
                          </span>
                          {o.hot && <span style={cliStyles.hotPill}>🔥 Hot</span>}
                          {o.won && <span style={cliStyles.wonPill}>✓ Signé</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, marginBottom: 8 }}>{o.name}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={cliStyles.oppAmount}>{o.amount}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Clôture {o.close}</div>
                      </div>
                    </div>

                    {/* Probability */}
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Probabilité</span>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: stage.color }}>{o.proba}%</span>
                      </div>
                      <div style={cliStyles.probaBar}>
                        <div style={{ width: `${o.proba}%`, height: "100%", background: stage.color, borderRadius: 999 }} />
                      </div>
                    </div>

                    <div style={cliStyles.oppFoot}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={o.owner} size={20} color={o.ownerColor} />
                        <span style={{ fontSize: 11.5, color: "#475569" }}>{o.owner}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {o.won ? "Renouvellement actif" : `MAJ il y a ${o.days} j`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ACTIONS — split en 2 colonnes */}
          <section style={cliStyles.block}>
            <div style={cliStyles.actionsGrid}>

              {/* Actions à mener */}
              <div style={cliStyles.actionsCol}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>
                      <span style={{ color: "#4f46e5" }}>→</span> Actions à mener <span style={cliStyles.blockCount}>{extraActions.filter((x) => !x.client_id || x.client_id === (urlId || "ACC-0184")).length + (isCustom ? 0 : future.length)}</span>
                    </h2>
                    <p style={cliStyles.h2sub}>Tâches, relances et événements planifiés</p>
                  </div>
                  <button onClick={addAction} style={{ ...cliStyles.primaryBtnSm, cursor: "pointer" }}>+ Ajouter</button>
                </div>

                <div style={cliStyles.actionsList}>
                  {([...extraActions, ...(isCustom ? [] : future)].length === 0) && (
                    <div style={{ padding: "24px 14px", textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc" }}>
                      Aucune action planifiée. Cliquez sur <b>+ Ajouter</b> pour en créer une.
                    </div>
                  )}
                  {[...extraActions, ...(isCustom ? [] : future)].map((a, i) => {
                    const p = prioMeta[a.priority] || prioMeta.basse;
                    const key = a.id || ("d-" + i);
                    const done = !!doneActions[key];
                    return (
                      <div key={key} style={{
                        ...cliStyles.actionItem,
                        ...(a.overdue && !done ? cliStyles.actionItemOverdue : {}),
                        ...(a.priority === "ai" ? cliStyles.actionItemAI : {}),
                        opacity: done ? 0.5 : 1,
                        textDecoration: done ? "line-through" : "none",
                      }}>
                        {(() => {
                          // Détection du type d'action :
                          //  - email → ouvre mailto:
                          //  - call/appel → ouvre 3CX Web Client avec le numéro
                          const tagL = (a.tag || "").toLowerCase();
                          const titleL = (a.title || "").toLowerCase();
                          const isEmail = tagL === "email" || titleL.includes("email") ||
                                          a.icon === "✉" || a.icon === "📧";
                          const isCall = tagL === "appel" || tagL === "call" || tagL === "phone" ||
                                         titleL.includes("appel") || titleL.includes("relance") ||
                                         a.icon === "📞" || a.icon === "☎";
                          const isMeeting = tagL === "rdv" || tagL === "visio" || tagL === "meeting" ||
                                            titleL.includes("rdv") || titleL.includes("rendez-vous") ||
                                            a.icon === "📅" || a.icon === "🗓" || a.icon === "💻";
                          const baseStyle = {
                            ...cliStyles.actionIcon,
                            background: a.priority === "ai" ? "#0f172a" : "#fff",
                            color: a.priority === "ai" ? "#fff" : "#475569",
                            borderColor: a.priority === "ai" ? "#0f172a" : "#eef1f5",
                          };
                          const hoverStyle = {
                            ...baseStyle,
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "transform 120ms, box-shadow 120ms",
                          };
                          const hoverOn = (e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.12)"; };
                          const hoverOff = (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; };
                          if (isEmail) {
                            const recipient = (allContacts && allContacts[0] && allContacts[0].email) || display.email || "";
                            const contactNom = (allContacts && allContacts[0] && allContacts[0].name) || "";
                            const lastName = contactNom.split(" ").slice(-1)[0] || "";
                            const subject = "Prise de contact - Plaquette Astorya";
                            const body = [
                              "Bonjour Madame, Monsieur" + (lastName ? " " + lastName : "") + ",",
                              "",
                              "Suite à notre entretien vous pouvez trouver ci-joint la plaquette de notre entreprise en pièce jointe.",
                            ].join("\n");
                            const href = "mailto:" + encodeURIComponent(recipient) +
                              "?subject=" + encodeURIComponent(subject) +
                              "&body=" + encodeURIComponent(body);
                            return (
                              <a href={href}
                                 title={recipient ? ("Ouvrir un mail pour " + recipient) : "Aucun destinataire renseigné"}
                                 onClick={(e) => {
                                   if (!recipient) {
                                     e.preventDefault();
                                     if (window.HubToast) window.HubToast.warn("Aucun email — ajoute un contact d'abord");
                                     return;
                                   }
                                   // Télécharge la plaquette automatiquement → l'utilisateur n'a
                                   // qu'à glisser-déposer le PDF dans son mail (mailto: ne supporte
                                   // pas les pièces jointes, contrainte navigateur).
                                   const link = document.createElement("a");
                                   link.href = "/assets/Plaquette-Astorya.pdf";
                                   link.download = "Plaquette-Astorya.pdf";
                                   document.body.appendChild(link);
                                   link.click();
                                   document.body.removeChild(link);
                                   if (window.HubToast) window.HubToast.success("📎 Plaquette téléchargée — glisse-la dans le mail comme pièce jointe");
                                 }}
                                 style={hoverStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                              >{a.icon}</a>
                            );
                          }
                          if (isCall) {
                            // Numéro : contact principal d'abord, sinon téléphone du client
                            const targetPhone = (allContacts && allContacts[0] && allContacts[0].phone) ||
                                                display.phone || "";
                            const targetName = (allContacts && allContacts[0] && allContacts[0].name) || display.name;
                            return (
                              <button onClick={() => {
                                if (!targetPhone) { if (window.HubToast) window.HubToast.warn("Aucun téléphone renseigné — ajoute un contact"); return; }
                                const tel = targetPhone.replace(/[^\d+]/g, "");
                                const supa = window.HubSupabase && window.HubSupabase.client;
                                const launch = (server) => {
                                  const url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
                                  window.open(url, "3cx-webclient");
                                  if (window.HubToast) window.HubToast.info("📞 Appel de " + targetName + " via 3CX");
                                };
                                if (supa) {
                                  supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle()
                                    .then(({ data }) => launch(data && data.value)).catch(() => launch(null));
                                } else { launch(null); }
                              }}
                                      title={"Appeler " + targetName + " via 3CX" + (targetPhone ? " (" + targetPhone + ")" : "")}
                                      style={{ ...hoverStyle, border: 0 }}
                                      onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                              >{a.icon}</button>
                            );
                          }
                          if (isMeeting) {
                            // Ouvre Outlook Calendar pour créer un événement avec :
                            //  - l'invité (contact principal)
                            //  - le commercial du compte (display.owner) en copie pour
                            //    que le RDV se cale aussi sur son calendrier
                            const attendeeEmail = (allContacts && allContacts[0] && allContacts[0].email) || "";
                            const attendeeName = (allContacts && allContacts[0] && allContacts[0].name) || display.name;
                            const now = new Date();
                            const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
                            tomorrow.setHours(9, 0, 0, 0);
                            const start = tomorrow;
                            const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h
                            const toIso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
                            const subject = (a.title || "Rendez-vous") + " — " + (display.name || "");
                            const body = [
                              a.meta || "",
                              "",
                              "Préparé via Hub Astorya",
                            ].filter(Boolean).join("\n");
                            const params = new URLSearchParams({
                              subject,
                              body,
                              startdt: toIso(start),
                              enddt: toIso(end),
                              location: "Visio (à confirmer)",
                              path: "/calendar/action/compose",
                              rru: "addevent",
                            });
                            // Open the link async-after-lookup so we get the owner's email
                            return (
                              <button onClick={async () => {
                                // Lookup l'email du commercial du compte via la table profiles
                                let ownerEmail = "";
                                try {
                                  if (display.owner && display.owner !== "—" && window.HubSupabase && window.HubSupabase.client) {
                                    const { data: prof } = await window.HubSupabase.client
                                      .from("profiles").select("email").eq("name", display.owner).maybeSingle();
                                    if (prof && prof.email) ownerEmail = prof.email;
                                  }
                                } catch (e) {}
                                // Compose la liste des destinataires : contact + commercial
                                const attendees = [];
                                if (attendeeEmail) attendees.push(attendeeEmail);
                                if (ownerEmail && ownerEmail !== attendeeEmail) attendees.push(ownerEmail);
                                if (attendees.length > 0) params.set("to", attendees.join(";"));
                                const url = "https://outlook.office.com/calendar/0/deeplink/compose?" + params.toString();
                                window.open(url, "_blank", "noopener");
                                if (window.HubToast) {
                                  const msg = "📅 RDV avec " + attendeeName +
                                    (ownerEmail ? " + " + display.owner + " en copie" : "") +
                                    " — Outlook ouvert";
                                  window.HubToast.info(msg);
                                }
                              }}
                                      title={"Créer un RDV Outlook avec " + attendeeName + (attendeeEmail ? " (" + attendeeEmail + ")" : "")}
                                      style={{ ...hoverStyle, border: 0 }}
                                      onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                              >{a.icon}</button>
                            );
                          }
                          return <div style={baseStyle}>{a.icon}</div>;
                        })()}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ ...cliStyles.prioPill, background: p.bg, color: p.color }}>{p.label}</span>
                            {a.tag && <span style={{ ...cliStyles.linkRef, color: a.tagColor, borderColor: a.tagColor + "40" }}>{a.tag}</span>}
                            {a.overdue && <span style={cliStyles.overdueChip}>⏰ En retard</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.35 }}>{a.title}</div>
                          {a.meta && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{a.meta}</div>}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: a.overdue ? "#dc2626" : a.priority === "ai" ? "#94a3b8" : "#0f172a",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>⏱ {a.due}</span>
                            {a.assigned && (
                              <>
                                <span style={cliStyles.dot} />
                                <Avatar name={a.assigned} size={18} color={a.assignedColor} />
                                <span style={{ fontSize: 11, color: "#64748b" }}>{a.assigned}</span>
                              </>
                            )}
                            {a.attendees && (
                              <>
                                <span style={cliStyles.dot} />
                                <div style={{ display: "flex" }}>
                                  {a.attendees.slice(0, 4).map((n, j) => (
                                    <span key={n} style={{ marginLeft: j === 0 ? 0 : -6, border: "1.5px solid #fff", borderRadius: 999, display: "inline-block" }}>
                                      <Avatar name={n} size={18} />
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenuKey(actionMenuKey === key ? null : key); }}
                            style={{ ...cliStyles.actionMenu, cursor: "pointer" }}
                          >⋯</button>
                          {actionMenuKey === key && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: "absolute", top: "100%", right: 0, marginTop: 4,
                                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                                boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 1000,
                                minWidth: 200, padding: 4,
                              }}
                            >
                              <button
                                onClick={() => { toggleAction(key, a); setActionMenuKey(null); }}
                                style={cliStyles.menuItem}
                              >
                                {done ? "↺ Marquer à faire" : "✓ Marquer terminée"}
                              </button>
                              <button
                                onClick={async () => {
                                  const newTitle = window.HubModal
                                    ? await window.HubModal.prompt({ title: "Renommer l'action", label: "Nouveau titre", default: a.title, okLabel: "Renommer" })
                                    : prompt("Nouveau titre :", a.title);
                                  if (newTitle && newTitle.trim() && a.id) {
                                    setExtraActions((arr) => arr.map((x) => x.id === a.id ? { ...x, title: newTitle.trim() } : x));
                                    if (window.HubToast) window.HubToast.success("✓ Action renommée");
                                  }
                                  setActionMenuKey(null);
                                }}
                                style={cliStyles.menuItem}
                                disabled={!a.id}
                              >✎ Renommer</button>
                              <button
                                onClick={() => {
                                  if (!a.id) return;
                                  setReschedule({ id: a.id, title: a.title, date: "", time: "" });
                                  setActionMenuKey(null);
                                }}
                                style={cliStyles.menuItem}
                                disabled={!a.id}
                              >📅 Replanifier</button>
                              <div style={{ height: 1, background: "#eef1f5", margin: "4px 0" }} />
                              <button
                                onClick={() => {
                                  if (a.id && confirm("Supprimer cette action ?")) removeAction(a.id);
                                  setActionMenuKey(null);
                                }}
                                style={{ ...cliStyles.menuItem, color: a.id ? "#dc2626" : "#cbd5e1" }}
                                disabled={!a.id}
                              >🗑 Supprimer{!a.id && " (action démo)"}</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions menées */}
              <div style={cliStyles.actionsCol}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>
                      <span style={{ color: "#94a3b8" }}>✓</span> Actions menées <span style={cliStyles.blockCount}>{pastShown.length}{pastShown.length < pastAll.length ? ` / ${pastAll.length}` : ""}</span>
                    </h2>
                    <p style={cliStyles.h2sub}>Historique complet · {pastShown.length} action{pastShown.length > 1 ? "s" : ""} affichée{pastShown.length > 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => setPastShowAll((v) => !v)} style={{ ...cliStyles.filterPill, cursor: "pointer" }}>
                    {pastShowAll ? "Replier" : "Tout voir"}
                  </button>
                </div>

                <div style={cliStyles.pastList}>
                  <div style={cliStyles.pastSpine} />
                  {pastShown.length === 0 && (
                    <div style={{ padding: "24px 14px", textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc", marginLeft: 18 }}>
                      Aucune action enregistrée pour ce client.
                    </div>
                  )}
                  {pastShown.map((a, i) => (
                    <div key={i} onClick={() => alert(`${a.title}\n\n${a.who || ""}\n${a.at || ""}\n\n${a.meta || ""}`)} style={{ ...cliStyles.pastItem, cursor: "pointer" }}>
                      <div style={{ ...cliStyles.pastIcon, color: a.color, borderColor: a.color + "30" }}>{a.icon}</div>
                      <div style={cliStyles.pastContent}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", flex: 1 }}>{a.title}</span>
                          <span style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{a.at}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{a.who}</div>
                        {a.meta && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4, padding: "5px 8px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 5, lineHeight: 1.45 }}>{a.meta}</div>}
                      </div>
                    </div>
                  ))}

                  {!pastShowAll && pastAll.length > pastShown.length && (
                    <button onClick={() => setPastShowAll(true)} style={{ ...cliStyles.loadMore, cursor: "pointer" }}>↓ Charger plus ({pastAll.length - pastShown.length} action{pastAll.length - pastShown.length > 1 ? "s" : ""} de plus)</button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CONTACTS + DETAILS row */}
          <section style={cliStyles.block}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

              {/* Contacts */}
              <div style={cliStyles.subBlock}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>Contacts clés <span style={cliStyles.blockCount}>{allContacts.length}</span></h2>
                    <p style={cliStyles.h2sub}>Décideurs et interlocuteurs identifiés</p>
                  </div>
                  <button onClick={addContact} style={{ ...cliStyles.filterPill, cursor: "pointer" }}>+ Ajouter</button>
                </div>
                <div style={cliStyles.contactsGrid}>
                  {allContacts.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", padding: "24px 16px", textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc", lineHeight: 1.6 }}>
                      Aucun contact renseigné pour ce client.<br/>
                      Cliquez sur <strong style={{ color: "#4f46e5" }}>Éditer</strong> dans le panneau Informations compte pour ajouter le contact principal, ou sur <strong style={{ color: "#4f46e5" }}>+ Ajouter</strong> ci-dessus pour un contact secondaire.
                    </div>
                  )}
                  {allContacts.map((p) => (
                    <div key={p.name} style={cliStyles.contactCard}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Avatar name={p.name} size={36} color={p.color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <button onClick={() => {
                              const parts = (p.name || "").split(" ");
                              const prenom = parts.shift() || "";
                              const nom = parts.join(" ");
                              setEditingContact({
                                id: p.id || null,
                                _legacyPrincipal: !p.id && p.last && p.last.indexOf("principal") >= 0,
                                prenom: p.prenom || prenom,
                                nom: p.nom || nom,
                                fonction: p.role || "",
                                email: p.email || "",
                                phone: p.phone || "",
                                linkedin: p.linkedin || "",
                                color: p.color,
                              });
                            }}
                                    style={{ background: "transparent", border: 0, padding: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = "#3730a3"}
                                    onMouseLeave={(e) => e.currentTarget.style.color = "#0f172a"}
                                    title="Modifier ce contact"
                            >{p.name}</button>
                            {p.champion && <span style={cliStyles.championPill}>★ Champion</span>}
                            {p.coldZone && <span style={cliStyles.coldPill}>❄ Froid</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>
                            {p.role}
                            {p.hierarchie && <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "#eef2ff", color: "#3730a3", fontWeight: 700 }}>{p.hierarchie}</span>}
                          </div>
                          {Array.isArray(p.decisionRoles) && p.decisionRoles.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                              {p.decisionRoles.map((r) => (
                                <span
                                  key={r}
                                  style={{
                                    fontSize: 10, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.3,
                                    background: r === "Champion" ? "#fffbeb" : r === "Bloqueur" ? "#fdecec" : r === "Décideur" ? "#eef2ff" : "#f1f5f9",
                                    color: r === "Champion" ? "#a65f00" : r === "Bloqueur" ? "#dc2626" : r === "Décideur" ? "#4338ca" : "#475569",
                                    border: r === "Champion" ? "1px solid #fde68a" : "none",
                                  }}
                                >{r}</span>
                              ))}
                            </div>
                          )}
                          {p.email && (
                            <a href={"mailto:" + p.email}
                               style={{ fontSize: 11, color: "#475569", marginTop: 6, fontFamily: "'JetBrains Mono', monospace", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                               onMouseEnter={(e) => e.currentTarget.style.color = "#3730a3"}
                               onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
                               title={"Envoyer un email à " + p.name}>
                              <span style={{ fontSize: 10 }}>✉</span>{p.email}
                            </a>
                          )}
                          {p.phone && (
                            <a href="#"
                               onClick={(e) => {
                                 e.preventDefault();
                                 const tel = (p.phone || "").replace(/[^\d+]/g, "");
                                 if (!tel) return;
                                 // Récupère l'URL du serveur 3CX configurée dans app_settings,
                                 // fallback sur l'URL connue du Hub Astorya
                                 const supa = window.HubSupabase && window.HubSupabase.client;
                                 const launch = (server) => {
                                   const url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
                                   window.open(url, "3cx-webclient");
                                   if (window.HubToast) window.HubToast.info("📞 Appel de " + p.name + " via 3CX");
                                 };
                                 if (supa) {
                                   supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle()
                                     .then(({ data }) => launch(data && data.value))
                                     .catch(() => launch(null));
                                 } else { launch(null); }
                               }}
                               style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                               onMouseEnter={(e) => e.currentTarget.style.color = "#10b981"}
                               onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
                               title={"Appeler " + p.name + " via 3CX (" + p.phone + ")"}>
                              <span style={{ fontSize: 10 }}>📞</span>{p.phone}
                            </a>
                          )}
                          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 6 }}>Dernier contact · {p.last}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <a href={"mailto:" + p.email} title={"Email à " + p.name} style={{ ...cliStyles.iconMini, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✉</a>
                          <button onClick={() => {
                            const tel = (p.phone || "").replace(/[^\d+]/g, "");
                            if (!tel) { if (window.HubToast) window.HubToast.warn("Aucun téléphone renseigné"); return; }
                            const supa = window.HubSupabase && window.HubSupabase.client;
                            const launch = (server) => {
                              const url = (server || "https://telcomastorya.my3cx.fr:5001").replace(/\/$/, "") + "/webclient/#/dialer/" + encodeURIComponent(tel);
                              window.open(url, "3cx-webclient");
                              if (window.HubToast) window.HubToast.info("📞 Appel de " + p.name + " via 3CX");
                            };
                            if (supa) {
                              supa.from("app_settings").select("value").eq("key", "3cx_server_url").maybeSingle()
                                .then(({ data }) => launch(data && data.value)).catch(() => launch(null));
                            } else { launch(null); }
                          }} title={"Appeler " + p.name + " via 3CX"} style={{ ...cliStyles.iconMini, cursor: "pointer", border: 0 }}>☎</button>
                          {p._custom && <button onClick={() => removeContact(p.id)} title="Retirer" style={{ ...cliStyles.iconMini, cursor: "pointer", color: "#dc2626" }}>×</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails */}
              <div style={cliStyles.subBlock}>
                <div style={cliStyles.actionsHead}>
                  <div>
                    <h2 style={cliStyles.h2}>Informations compte</h2>
                  </div>
                  <button onClick={openEdit} style={{ ...cliStyles.filterPill, cursor: "pointer" }}>Éditer</button>
                </div>
                <div style={{ padding: 4 }}>
                  <DetailRow label="Commercial" value={
                    display.owner === "—" ? <span style={{ fontSize: 12.5, color: "#94a3b8" }}>—</span> : (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar name={display.owner} size={22} color={display.ownerColor} />
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{display.owner}</span>
                      </div>
                    )
                  } />
                  {display.size && display.size !== "—" && <DetailRow label="Effectif" value={<span style={cliStyles.fieldChip}>{display.size}</span>} />}
                  <DetailRow label="Secteur" value={<span style={cliStyles.fieldChip}>{display.sector}</span>} />
                  {display.sousSecteur && <DetailRow label="Sous-secteur" value={<span style={cliStyles.fieldChip}>{display.sousSecteur}</span>} />}
                  <DetailRow label="Source" value={<span style={cliStyles.fieldChip}>{display.source}</span>} />
                  <DetailRow label="Concurrent" value={
                    <div>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>{display.concurrent}</span>
                      {(display.concurrentEnd || display.concurrentAmount) && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {display.concurrentEnd && `Fin : ${new Date(display.concurrentEnd).toLocaleDateString("fr-FR")}`}
                          {display.concurrentEnd && display.concurrentAmount && " · "}
                          {display.concurrentAmount && `${display.concurrentAmount} k€/an`}
                        </div>
                      )}
                    </div>
                  } />
                  {display.contactDate && <DetailRow label="1er contact" value={<span style={{ fontSize: 12.5, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{new Date(display.contactDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>} />}
                  {display.projectDate && <DetailRow label="Échéance projet" value={<span style={{ fontSize: 12.5, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{new Date(display.projectDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>} />}
                  {display.besoin && <DetailRow label="Besoin identifié" value={<span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>{display.besoin}</span>} />}
                  {display.action && <DetailRow label="1ère action" value={<span style={cliStyles.fieldChip}>{({ email: "📧 Email d'intro", call: "📞 Cold call", in: "in LinkedIn", wait: "⏸ Attendre" })[display.action] || display.action}</span>} />}
                  <DetailRow label={isCustom ? "Prospect depuis" : "Client depuis"} value={<span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", fontWeight: 600 }}>{display.clientSince}</span>} />
                  {!isCustom && <DetailRow label="Renouvellement" value={<span style={{ fontSize: 12.5, color: "#0e7a55", fontWeight: 600 }}>{display.renewal}</span>} />}
                  <DetailRow label="Contrats actifs" value={<span style={{ fontSize: 12.5, fontWeight: 600 }}>{contractsList.length > 0 ? `${contractsList.length} (${contractsList.map((x) => x.name).slice(0, 2).join(", ")}${contractsList.length > 2 ? "…" : ""})` : (isCustom ? "Aucun" : display.activeContracts)}</span>} />
                  {display.siren && <DetailRow label="SIREN" value={<span style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{display.siren}</span>} />}
                  {display.naf && <DetailRow label="NAF" value={<span style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{display.naf}</span>} />}
                  {display.tva && <DetailRow label="TVA intra." value={<span style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{display.tva}</span>} />}
                  {display.ca && <DetailRow label="CA annuel" value={<span style={{ fontSize: 12.5, fontWeight: 600 }}>{display.ca} M€</span>} />}
                  {display.tier && <DetailRow label="Tier" value={<span style={cliStyles.fieldChip}>Tier {display.tier}</span>} />}
                  {display.linkedin && <DetailRow label="LinkedIn" value={<a href={display.linkedin.startsWith("http") ? display.linkedin : "https://" + display.linkedin} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#3730a3" }}>{display.linkedin.replace(/^https?:\/\//, "")} ↗</a>} />}
                  <DetailRow label="Adresse" value={<span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>{display.address}{display.cp || display.addressCity ? <><br/>{display.cp} {display.addressCity}</> : null}</span>} />
                </div>
              </div>
            </div>
          </section>

          {/* ─── CONTRATS ──────────────────────────────────────────── */}
          <section style={cliStyles.block}>
            <div style={cliStyles.blockHead}>
              <div>
                <h2 style={cliStyles.h2}>📜 Contrats <span style={cliStyles.blockCount}>{contractsList.length}</span></h2>
                <p style={cliStyles.h2sub}>Engagements actifs et historiques du compte</p>
              </div>
              <button onClick={addContract} style={{ ...cliStyles.primaryBtnSm, cursor: "pointer" }}>+ Ajouter un contrat</button>
            </div>

            {contractsList.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0" }}>
                Aucun contrat enregistré pour ce {isCustom ? "prospect" : "client"}.{" "}
                <a onClick={addContract} style={{ color: "#3730a3", fontWeight: 600, cursor: "pointer" }}>+ Ajouter le premier contrat →</a>
              </div>
            ) : (
              <div style={{ overflow: "hidden", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafbfc" }}>
                      <th style={{ textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Référence</th>
                      <th style={{ textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Intitulé</th>
                      <th style={{ textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Type</th>
                      <th style={{ textAlign: "right", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Montant</th>
                      <th style={{ textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Période</th>
                      <th style={{ textAlign: "left", padding: "9px 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>Statut</th>
                      <th style={{ padding: "9px 12px", borderBottom: "1px solid #e2e8f0" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractsList.map((ct, i) => {
                      const statusMeta = { active: { label: "● Actif", bg: "#dcfce7", color: "#065f46" }, expiring: { label: "● Expire bientôt", bg: "#fef3c7", color: "#78350f" }, expired: { label: "● Expiré", bg: "#fee2e2", color: "#991b1b" }, draft: { label: "○ Brouillon", bg: "#f1f5f9", color: "#475569" } }[ct.status] || { label: ct.status, bg: "#f1f5f9", color: "#475569" };
                      return (
                        <tr key={ct.id} style={{ borderTop: i === 0 ? 0 : "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#475569", fontWeight: 600 }}>{ct.id}</span></td>
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{ct.name}</div>{ct.product && <div style={{ fontSize: 11, color: "#94a3b8" }}>{ct.product}</div>}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>{ct.type}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{ct.amount}</td>
                          <td style={{ padding: "10px 12px", fontSize: 11.5, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{ct.start}<br/>→ {ct.end}</td>
                          <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: statusMeta.bg, color: statusMeta.color, fontWeight: 700 }}>{statusMeta.label}</span></td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <button
                              onClick={async () => {
                                let choice;
                                if (window.HubModal) {
                                  choice = await window.HubModal.choice({
                                    title: ct.name,
                                    message: ct.type + " · " + ct.amount + " · " + (ct.status || "actif"),
                                    options: [
                                      { value: "1", label: "Voir détails",     sub: "Afficher le récapitulatif complet" },
                                      { value: "2", label: "Renouveler",       sub: "Créer un nouveau contrat lié à ce client" },
                                      { value: "3", label: "Supprimer",        sub: "Soft-delete : la donnée reste en BDD" },
                                    ],
                                  });
                                } else {
                                  choice = prompt("Contrat " + ct.name + "\n\n1. Voir détails\n2. Renouveler\n3. Supprimer\n\nTapez 1, 2 ou 3 :", "1");
                                }
                                if (!choice) return;
                                if (choice === "1") {
                                  if (window.HubToast) window.HubToast.info(ct.name + "\nType : " + ct.type + "\nMontant : " + ct.amount + "\nDébut : " + ct.start + "\nFin : " + ct.end + "\nStatut : " + ct.status, { duration: 8000 });
                                  else alert(ct.name + "\n\nType : " + ct.type + "\nMontant : " + ct.amount);
                                } else if (choice === "2") {
                                  window.location.href = "/nouveau-contrat?client=" + encodeURIComponent(urlId || "");
                                } else if (choice === "3") {
                                  const ok = window.HubModal
                                    ? await window.HubModal.confirm({ title: "Supprimer ce contrat ?", message: "Le contrat sera marqué supprimé (soft-delete). Il peut être restauré par un admin.", okLabel: "Supprimer", okStyle: "danger" })
                                    : confirm("Supprimer ce contrat ?");
                                  if (!ok) return;
                                  try {
                                    await window.api.contracts.remove(ct.id);
                                    setContractsList((arr) => arr.filter((x) => x.id !== ct.id));
                                    if (window.HubToast) window.HubToast.success("✓ Contrat supprimé");
                                  } catch (e) {
                                    if (window.HubToast) window.HubToast.error("Suppression échouée : " + (e.message || e));
                                  }
                                }
                              }}
                              style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
                              title="Actions sur ce contrat"
                            >⋯</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* TICKETS DU CLIENT */}
          <section style={cliStyles.block}>
            <div style={cliStyles.actionsHead}>
              <div>
                <h2 style={cliStyles.h2}>🎫 Tickets <span style={cliStyles.blockCount}>{clientTickets.length}</span></h2>
                <p style={cliStyles.h2sub}>Support technique et demandes en cours</p>
              </div>
              <a href={"/ticketing?client=" + encodeURIComponent(urlId || "")} style={{ ...cliStyles.primaryBtnSm, textDecoration: "none", cursor: "pointer" }}>+ Nouveau ticket</a>
            </div>
            {clientTickets.length === 0 ? (
              <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12.5, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 8, background: "#fafbfc" }}>
                Aucun ticket pour ce client.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "#fafbfc" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5" }}>Ref</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5" }}>Titre</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5" }}>Statut</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5" }}>Priorité</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eef1f5" }}>Ouvert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTickets.map((t) => {
                      const sCol = { open: "#3b82f6", in_progress: "#f59e0b", waiting: "#94a3b8", resolved: "#10b981", closed: "#64748b" }[t.status] || "#64748b";
                      const pCol = { critique: "#dc2626", haute: "#ea580c", normale: "#64748b", basse: "#94a3b8" }[t.priority] || "#64748b";
                      return (
                        <tr key={t.id} onClick={() => window.location.href = "/ticketing?id=" + encodeURIComponent(t.id)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                          <td style={{ padding: "10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#475569" }}>{t.id}</td>
                          <td style={{ padding: "10px", fontWeight: 500, color: "#0f172a" }}>{t.title}</td>
                          <td style={{ padding: "10px" }}><span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 4, background: sCol + "20", color: sCol, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{t.status}</span></td>
                          <td style={{ padding: "10px" }}><span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 4, background: pCol + "20", color: pCol, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{t.priority}</span></td>
                          <td style={{ padding: "10px", fontSize: 11.5, color: "#64748b" }}>{t.opened_at ? new Date(t.opened_at).toLocaleDateString("fr-FR") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ─── MODULE TECHNIQUE ──────────────────────────────────────
              Sections cf. tableau Monday "ERP Astorya > Base client".
              Données stockées dans clients.data.tech (jsonb). */}
          <TechModule
            clientId={urlId}
            value={(loadedClient && loadedClient.tech) || {}}
            onChange={async (tech) => {
              try {
                const updated = await window.api.clients.update(urlId, { tech });
                if (updated) setLoadedClient(updated);
              } catch (e) { console.warn("[ClientPage] save tech:", e); }
            }}
          />

          <div style={{ height: 24 }} />
        </div>
      </main>

      {editingContact && <ContactEditModal contact={editingContact} onClose={() => setEditingContact(null)} onSave={saveContactEdit} />}

      <CallStatsModal
        open={statsOpen}
        client={{ name: display.name }}
        onClose={() => setStatsOpen(false)}
      />
      <AssetInventoryModal
        open={assetsOpen}
        client={{ name: display.name }}
        onClose={() => setAssetsOpen(false)}
      />

      {reschedule && (
        <div
          onClick={() => setReschedule(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 420, boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}
          >
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📅 Replanifier l'action</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reschedule.title}</div>
              </div>
              <button onClick={() => setReschedule(null)} style={{ border: "none", background: "transparent", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 22, display: "grid", gap: 14 }}>
              <div>
                <label style={modalLabel}>Date</label>
                <input
                  type="date"
                  autoFocus
                  value={reschedule.date}
                  onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })}
                  style={modalInput}
                />
              </div>
              <div>
                <label style={modalLabel}>Heure</label>
                <input
                  type="time"
                  value={reschedule.time}
                  onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })}
                  style={modalInput}
                />
              </div>
            </div>

            <div style={{ padding: "14px 22px", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setReschedule(null)} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button
                onClick={() => {
                  if (!reschedule.date) { alert("Sélectionnez une date"); return; }
                  const newDue = new Date(reschedule.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })
                    + (reschedule.time ? " · " + reschedule.time : "");
                  setExtraActions((arr) => arr.map((x) => x.id === reschedule.id ? { ...x, due: newDue } : x));
                  setReschedule(null);
                }}
                style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          onClick={() => setEditOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}
          >
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Éditer les informations compte</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{display.name}</div>
              </div>
              <button onClick={() => setEditOpen(false)} style={{ border: "none", background: "transparent", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 22, display: "grid", gap: 14 }}>
              {/* ENTREPRISE */}
              <div style={editSection}>01 · Entreprise</div>
              <div>
                <label style={editLabel}>Raison sociale</label>
                <input value={editDraft.raison_sociale || ""} onChange={(e) => setEditDraft({ ...editDraft, raison_sociale: e.target.value })} style={editInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>SIREN</label>
                  <input value={editDraft.siren || ""} onChange={(e) => setEditDraft({ ...editDraft, siren: e.target.value })} style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>NAF</label>
                  <input value={editDraft.naf || ""} onChange={(e) => setEditDraft({ ...editDraft, naf: e.target.value })} style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>TVA intra.</label>
                  <input value={editDraft.tva || ""} onChange={(e) => setEditDraft({ ...editDraft, tva: e.target.value })} style={editInput} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Secteur d'activité</label>
                  <select value={editDraft.sector || ""} onChange={(e) => setEditDraft({ ...editDraft, sector: e.target.value })} style={editInput}>
                    <option value="">— Sélectionner —</option>
                    {["Agriculture, sylviculture et pêche","Industries extractives","Industrie manufacturière","Production et distribution d'électricité","Eau, déchets et dépollution","Construction & BTP","Commerce","Transports et entreposage","Hébergement et restauration","Information et communication","Banque, finance & assurance","Activités immobilières","Activités spécialisées, scientifiques et techniques","Services administratifs et de soutien","Administration publique","Enseignement","Santé et action sociale","Arts, spectacles et activités récréatives","Autres activités de services","Activités des ménages","Activités extra-territoriales"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Sous-secteur</label>
                  <input value={editDraft.sousSecteur || ""} onChange={(e) => setEditDraft({ ...editDraft, sousSecteur: e.target.value })} style={editInput} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Effectif</label>
                  <select value={editDraft.effectif || ""} onChange={(e) => setEditDraft({ ...editDraft, effectif: e.target.value })} style={editInput}>
                    <option value="">—</option>
                    <option>1-50</option><option>51-250</option><option>251-1k</option><option>1k-5k</option><option>5k+</option>
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Tier prospect</label>
                  <select value={editDraft.tier || ""} onChange={(e) => setEditDraft({ ...editDraft, tier: e.target.value })} style={editInput}>
                    <option value="">—</option>
                    <option value="A">Tier A — Grand compte</option>
                    <option value="B">Tier B — Compte secondaire</option>
                    <option value="C">Tier C — Tactique</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={editLabel}>Adresse</label>
                <input value={editDraft.address || ""} onChange={(e) => setEditDraft({ ...editDraft, address: e.target.value })} style={editInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Code postal</label>
                  <input value={editDraft.cp || ""} onChange={(e) => setEditDraft({ ...editDraft, cp: e.target.value })} style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>Ville</label>
                  <input value={editDraft.addressCity || ""} onChange={(e) => setEditDraft({ ...editDraft, addressCity: e.target.value })} style={editInput} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Site web</label>
                  <input value={editDraft.web || ""} onChange={(e) => setEditDraft({ ...editDraft, web: e.target.value })} placeholder="www.…" style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>LinkedIn entreprise</label>
                  <input value={editDraft.linkedin || ""} onChange={(e) => setEditDraft({ ...editDraft, linkedin: e.target.value })} placeholder="linkedin.com/company/…" style={editInput} />
                </div>
              </div>

              {/* CONTACT PRINCIPAL */}
              <div style={editSection}>02 · Contact principal</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Prénom</label>
                  <input value={editDraft.cp_prenom || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_prenom: e.target.value })} style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>Nom</label>
                  <input value={editDraft.cp_nom || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_nom: e.target.value })} style={editInput} />
                </div>
              </div>
              <div>
                <label style={editLabel}>Fonction (intitulé)</label>
                <select value={editDraft.cp_fonction || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_fonction: e.target.value })} style={editInput}>
                  <option value="">— Choisir une fonction —</option>
                  {(window.HubConstants && window.HubConstants.FONCTIONS || []).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Email</label>
                  <input type="email" value={editDraft.cp_email || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_email: e.target.value })} style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>Téléphone</label>
                  <input value={editDraft.cp_phone || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_phone: e.target.value })} style={editInput} />
                </div>
              </div>
              <div>
                <label style={editLabel}>LinkedIn profil</label>
                <input value={editDraft.cp_linkedin || ""} onChange={(e) => setEditDraft({ ...editDraft, cp_linkedin: e.target.value })} placeholder="linkedin.com/in/…" style={editInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Niveau hiérarchique</label>
                  <select value={editDraft.fonction || ""} onChange={(e) => setEditDraft({ ...editDraft, fonction: e.target.value })} style={editInput}>
                    <option value="">—</option>
                    <option value="Opér.">Opérationnel</option>
                    <option value="Mgr">Manager</option>
                    <option value="Dir.">Directeur</option>
                    <option value="C-level">C-level</option>
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Rôles décision</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                    {["Décideur", "Prescripteur", "Utilisateur", "Acheteur"].map((r) => {
                      const on = (editDraft.roles || []).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditDraft({ ...editDraft, roles: on ? editDraft.roles.filter((x) => x !== r) : [...(editDraft.roles || []), r] })}
                          style={{ padding: "4px 10px", border: on ? "1px solid #4f46e5" : "1px solid #e2e8f0", background: on ? "#eef2ff" : "#fff", borderRadius: 999, fontSize: 11.5, color: on ? "#3730a3" : "#475569", cursor: "pointer", fontWeight: on ? 600 : 500 }}
                        >{r}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* COMMERCIAL */}
              <div style={editSection}>03 · Commercial Astorya</div>
              <div>
                <label style={editLabel}>Commercial attribué</label>
                <select value={editDraft.owner || ""} onChange={(e) => setEditDraft({ ...editDraft, owner: e.target.value })} style={editInput}>
                  <option value="">— Aucun —</option>
                  {ownerListE.map((o) => <option key={o.name} value={o.name}>{o.name} · {o.role}</option>)}
                </select>
              </div>

              {/* QUALIFICATION */}
              <div style={editSection}>04 · Qualification</div>
              <div>
                <label style={editLabel}>Besoin exprimé</label>
                <textarea value={editDraft.besoin || ""} onChange={(e) => setEditDraft({ ...editDraft, besoin: e.target.value })} rows={2} placeholder="Modernisation, contraintes, contexte concurrentiel…" style={{ ...editInput, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={editLabel}>Concurrent actuel</label>
                <input value={editDraft.concurrent || ""} onChange={(e) => setEditDraft({ ...editDraft, concurrent: e.target.value })} placeholder="Ex. Salesforce, Pega…" style={editInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Montant concurrent (k€/an)</label>
                  <input value={editDraft.concurrentAmount || ""} onChange={(e) => setEditDraft({ ...editDraft, concurrentAmount: e.target.value })} placeholder="0" style={editInput} />
                </div>
                <div>
                  <label style={editLabel}>Échéance projet</label>
                  <input type="date" value={editDraft.projectDate || ""} onChange={(e) => setEditDraft({ ...editDraft, projectDate: e.target.value })} style={editInput} />
                </div>
              </div>

              {/* ORIGINE & ACTION */}
              <div style={editSection}>05 · Origine & prochaines étapes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={editLabel}>Source du prospect</label>
                  <select value={editDraft.source || ""} onChange={(e) => setEditDraft({ ...editDraft, source: e.target.value })} style={editInput}>
                    <option value="">— Choisir —</option>
                    <option>Radar fin de contrat concurrent</option>
                    <option>LinkedIn / Sales Navigator</option>
                    <option>Salon professionnel</option>
                    <option>Recommandation client</option>
                    <option>Inbound site web</option>
                    <option>Demande de devis</option>
                    <option>Cold call sortant</option>
                    <option>Cold email sortant</option>
                    <option>Webinar / événement Astorya</option>
                    <option>Référencement (Google, Bing)</option>
                    <option>Réseau partenaires</option>
                    <option>Article de presse</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Première action</label>
                  <select value={editDraft.action || ""} onChange={(e) => setEditDraft({ ...editDraft, action: e.target.value })} style={editInput}>
                    <option value="">—</option>
                    <option value="email">📧 Email d'introduction</option>
                    <option value="call">📞 Cold call</option>
                    <option value="in">in LinkedIn</option>
                    <option value="wait">📅 Inviter à un événement</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={editLabel}>Notes internes</label>
                <textarea value={editDraft.desc || ""} onChange={(e) => setEditDraft({ ...editDraft, desc: e.target.value })} rows={3} placeholder="Contexte additionnel, contacts mutuels, anecdotes…" style={{ ...editInput, resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>

            <div style={{ padding: "14px 22px", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setEditOpen(false)} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={saveEdit} style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {addContactOpen && (
        <div
          onClick={() => setAddContactOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}
          >
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>+ Ajouter un contact</div>
              <button onClick={() => setAddContactOpen(false)} style={{ border: "none", background: "transparent", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 22, display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={modalLabel}>Prénom</label>
                  <input value={newContactForm.prenom} onChange={(e) => setNewContactForm({ ...newContactForm, prenom: e.target.value })} style={modalInput} />
                </div>
                <div>
                  <label style={modalLabel}>Nom</label>
                  <input value={newContactForm.nom} onChange={(e) => setNewContactForm({ ...newContactForm, nom: e.target.value })} style={modalInput} />
                </div>
              </div>
              <div>
                <label style={modalLabel}>Fonction</label>
                <select value={newContactForm.fonction} onChange={(e) => setNewContactForm({ ...newContactForm, fonction: e.target.value })} style={modalInput}>
                  <option value="">— Choisir une fonction —</option>
                  {(window.HubConstants && window.HubConstants.FONCTIONS || []).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={modalLabel}>Email</label>
                  <input type="email" value={newContactForm.email} onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })} style={modalInput} />
                </div>
                <div>
                  <label style={modalLabel}>Téléphone</label>
                  <input value={newContactForm.phone} onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })} style={modalInput} />
                </div>
              </div>
              <div>
                <label style={modalLabel}>LinkedIn</label>
                <input value={newContactForm.linkedin} onChange={(e) => setNewContactForm({ ...newContactForm, linkedin: e.target.value })} placeholder="linkedin.com/in/…" style={modalInput} />
              </div>
            </div>
            <div style={{ padding: "14px 22px", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setAddContactOpen(false)} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={submitNewContact} style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {addActionOpen && (
        <div
          onClick={() => setAddActionOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}
          >
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Nouvelle action à mener</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Planifier une tâche, un appel, un rendez-vous…</div>
              </div>
              <button onClick={() => setAddActionOpen(false)} style={{ border: "none", background: "transparent", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 22, display: "grid", gap: 14 }}>
              <div>
                <label style={modalLabel}>Type</label>
                <select
                  value={newAction.type}
                  onChange={(e) => setNewAction({ ...newAction, type: e.target.value })}
                  style={modalInput}
                >
                  <option value="email">✉ Email</option>
                  <option value="call">📞 Appel</option>
                  <option value="visio">📹 Visio</option>
                  <option value="rdv">🤝 Rendez-vous</option>
                  <option value="task">✅ Tâche</option>
                  <option value="note">📝 Note</option>
                </select>
              </div>

              <div>
                <label style={modalLabel}>Titre *</label>
                <input
                  type="text"
                  value={newAction.title}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  placeholder="Ex. Relance proposition commerciale"
                  style={modalInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={modalLabel}>Date</label>
                  <input
                    type="date"
                    value={newAction.date}
                    onChange={(e) => setNewAction({ ...newAction, date: e.target.value })}
                    style={modalInput}
                  />
                </div>
                <div>
                  <label style={modalLabel}>Heure</label>
                  <input
                    type="time"
                    value={newAction.time}
                    onChange={(e) => setNewAction({ ...newAction, time: e.target.value })}
                    style={modalInput}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={modalLabel}>Priorité</label>
                  <select
                    value={newAction.priority}
                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                    style={modalInput}
                  >
                    <option value="haute">🔴 Haute</option>
                    <option value="moyenne">🟠 Moyenne</option>
                    <option value="basse">🟢 Basse</option>
                  </select>
                </div>
                <div>
                  <label style={modalLabel}>Assigné à</label>
                  <input
                    type="text"
                    value={newAction.assigned}
                    onChange={(e) => setNewAction({ ...newAction, assigned: e.target.value })}
                    placeholder="Vous"
                    style={modalInput}
                  />
                </div>
              </div>

              <div>
                <label style={modalLabel}>Tag / Référence</label>
                <input
                  type="text"
                  value={newAction.tag}
                  onChange={(e) => setNewAction({ ...newAction, tag: e.target.value })}
                  placeholder="Ex. OPP-2026-001"
                  style={modalInput}
                />
              </div>

              <div>
                <label style={modalLabel}>Description / Notes</label>
                <textarea
                  value={newAction.meta}
                  onChange={(e) => setNewAction({ ...newAction, meta: e.target.value })}
                  rows={3}
                  placeholder="Contexte, points à aborder…"
                  style={{ ...modalInput, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
            </div>

            <div style={{ padding: "14px 22px", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setAddActionOpen(false)} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={submitNewAction} style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Créer l'action</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalLabel = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 };
const modalInput = { width: "100%", padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", outline: "none" };
const editLabel = modalLabel;
const editInput = modalInput;
const editSection = { fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 0 4px", borderBottom: "1px solid #eef1f5", marginTop: 4 };

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", padding: "8px 4px", gap: 10, minHeight: 32, borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ fontSize: 11.5, color: "#64748b", width: 110, flexShrink: 0, paddingTop: 2 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0 }}>{value}</div>
  </div>
);

const cliStyles = {
  frame: { width: "100%", minHeight: "100vh", display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a",  },

  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14, position: "sticky", top: 0, height: 1500 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 13 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { marginLeft: "auto", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  bullet: { width: 14, color: "#94a3b8", fontSize: 11 },
  miniLogo: { width: 22, height: 22, borderRadius: 5, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 },
  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 24px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 6 },
  healthChip: { fontSize: 11, padding: "1px 8px", borderRadius: 999, background: "#e8f8f1", color: "#0e7a55", fontWeight: 600, marginLeft: 6 },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 13 },
  ghostBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 14px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },
  primaryBtnSm: { padding: "4px 10px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 6, fontSize: 11.5, cursor: "pointer", fontWeight: 600 },

  scroll: { flex: 1, overflowY: "auto", padding: "0 24px" },

  hero: { padding: "20px 0 16px", borderBottom: "1px solid #eef1f5" },
  coLogoBig: { width: 60, height: 60, borderRadius: 12, background: "linear-gradient(135deg, #1e40af, #1e3a8a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0, boxShadow: "0 4px 12px rgba(30,64,175,0.25)" },
  industryChip: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#eef2ff", color: "#4338ca", fontWeight: 600 },
  metaChip: { fontSize: 11.5, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#eef1f5", fontWeight: 500 },
  dot: { width: 3, height: 3, background: "#cbd5e1", borderRadius: 999 },
  h1: { fontSize: 26, fontWeight: 700, letterSpacing: -0.8, margin: "2px 0 0", color: "#0f172a", lineHeight: 1.15 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 },
  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fafbfc", border: "1px solid #eef1f5", color: "#475569", fontWeight: 500 },

  heroStats: { display: "flex", gap: 18, flexShrink: 0, paddingLeft: 18, borderLeft: "1px solid #eef1f5" },
  heroStat: { minWidth: 95 },
  heroStatK: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  heroStatV: { fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5, marginTop: 2 },
  miniBar: { width: "100%", height: 3, background: "#eef1f5", borderRadius: 999, marginTop: 6 },

  actionBar: { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #eef1f5", flexWrap: "wrap" },

  block: { padding: "20px 0", borderBottom: "1px solid #eef1f5" },
  subBlock: { border: "1px solid #eef1f5", borderRadius: 10, padding: 16, background: "#fff" },
  blockHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12 },
  h2: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 6 },
  h2sub: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
  blockCount: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: 2 },
  filterPill: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },

  // Pipe
  stagesStrip: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14, padding: 12, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },
  stageCol: { display: "flex", flexDirection: "column", gap: 4 },
  stageColHead: { display: "flex", alignItems: "center", gap: 6 },
  stageCount: { fontSize: 10.5, padding: "0 6px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: "auto" },
  stageColBar: { height: 3, background: "#eef1f5", borderRadius: 999, overflow: "hidden", marginTop: 2 },

  oppGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  oppCard: { position: "relative", padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 },
  oppCardHot: { borderColor: "#fed7aa", boxShadow: "0 0 0 1px #fed7aa" },
  oppCardWon: { background: "linear-gradient(180deg, #fff, #f0fdf6)", borderColor: "#bbf7d0" },
  newRibbon: { position: "absolute", top: -7, right: 12, padding: "1px 7px", background: "#4f46e5", color: "#fff", fontSize: 9.5, fontWeight: 700, borderRadius: 999, letterSpacing: 0.4 },
  oppRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#94a3b8", fontWeight: 500 },
  stagePill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 7px", borderRadius: 999, fontSize: 10.5, fontWeight: 600 },
  hotPill: { fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#fff1d6", color: "#a65f00", fontWeight: 700 },
  wonPill: { fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#e8f8f1", color: "#0e7a55", fontWeight: 700 },
  oppAmount: { fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: -0.4, fontFamily: "'Inter', sans-serif" },
  probaBar: { width: "100%", height: 4, background: "#eef1f5", borderRadius: 999, overflow: "hidden" },
  oppFoot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: "1px solid #f1f5f9" },

  // Actions split
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  actionsCol: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  actionsHead: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },

  // À mener
  actionsList: { display: "flex", flexDirection: "column", gap: 8 },
  actionItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: "1px solid #eef1f5", borderRadius: 8, background: "#fafbfc", position: "relative" },
  actionItemOverdue: { background: "#fff8f7", borderColor: "#fecaca" },
  actionItemAI: { background: "linear-gradient(180deg, #fafbfc, #f5f3ff)", borderColor: "#e9d5ff", borderStyle: "dashed" },
  checkbox: { marginTop: 4, accentColor: "#4f46e5" },
  actionIcon: { width: 30, height: 30, borderRadius: 7, border: "1.5px solid #eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  prioPill: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 },
  linkRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, padding: "1px 5px", borderRadius: 3, border: "1px solid", fontWeight: 600 },
  overdueChip: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: "#dc2626", color: "#fff", fontWeight: 700, letterSpacing: 0.3 },
  actionMenu: { width: 24, height: 24, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, borderRadius: 4 },
  menuItem: { display: "block", width: "100%", padding: "8px 12px", border: "none", background: "transparent", color: "#0f172a", fontSize: 12.5, fontWeight: 500, textAlign: "left", cursor: "pointer", borderRadius: 5 },

  // Menées
  pastList: { display: "flex", flexDirection: "column", gap: 0, position: "relative" },
  pastSpine: { position: "absolute", left: 12, top: 14, bottom: 28, width: 1.5, background: "#eef1f5" },
  pastItem: { display: "flex", gap: 12, padding: "8px 0", position: "relative", zIndex: 1 },
  pastIcon: { width: 26, height: 26, borderRadius: 999, background: "#fff", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, boxShadow: "0 0 0 3px #fff" },
  pastContent: { flex: 1, minWidth: 0, paddingTop: 1 },
  loadMore: { padding: "8px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", marginTop: 10, fontWeight: 500 },

  // Contacts
  contactsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 },
  contactCard: { padding: 12, border: "1px solid #eef1f5", borderRadius: 8, background: "#fafbfc" },
  championPill: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#fffbeb", color: "#a65f00", fontWeight: 700, border: "1px solid #fde68a" },
  coldPill: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#eff6ff", color: "#1e40af", fontWeight: 600 },
  iconMini: { width: 24, height: 24, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 11 },

  fieldChip: { fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "#eef1f5", color: "#475569", fontWeight: 500 },
};

// ════════════════════════════════════════════════════════════════════
// TechModule — État technique du client (cf. Monday "Base client")
// Sections : Infrastructure, Sauvegarde, Cybersécurité, Mail, Logiciels,
//            Téléphonie, Web, Lien internet
// Stockage : clients.data.tech = { [fieldId]: status }
// ════════════════════════════════════════════════════════════════════
const TECH_SECTIONS = [
  { icon: "🖥", title: "Infrastructure & serveur", color: "#4f46e5", fields: [
    { id: "serveur_physique",  label: "Serveur Physique" },
    { id: "serveur_cloud",     label: "Serveur CLOUD" },
    { id: "owncloud",          label: "Owncloud" },
    { id: "nas",               label: "NAS" },
    { id: "maintenance",       label: "Maintenance / Infogérance" },
    { id: "imprimante",        label: "Imprimante (équipement)" },
    { id: "wifi",              label: "Wifi" },
    { id: "firewall",          label: "Firewall" },
    { id: "onduleur",          label: "Onduleur" },
  ]},
  { icon: "💾", title: "Sauvegarde", color: "#0ea5e9", fields: [
    { id: "sauvegarde_serveur_local",  label: "Sauvegarde serveur local" },
    { id: "sauvegarde_serveur_cloud",  label: "Sauvegarde serveur CLOUD" },
    { id: "sauvegarde_externe_local",  label: "Sauvegarde externe du serveur local" },
    { id: "sauvegarde_c2",             label: "Sauvegarde C2" },
    { id: "nas_offsite",               label: "NAS Offsite" },
    { id: "sauvegarde_3_2_1",          label: "Sauvegarde 3.2.1" },
  ]},
  { icon: "🛡", title: "Cybersécurité", color: "#dc2626", fields: [
    { id: "antivirus_edr",       label: "Antivirus EDR poste" },
    { id: "antispam",            label: "Antispam" },
    { id: "passbolt",            label: "Passbolt / coffre numérique" },
    { id: "bitlockage",          label: "Bitlockage" },
    { id: "phishing",            label: "Campagne de phishing" },
    { id: "formation_rsync",     label: "Formation RSYNC" },
  ]},
  { icon: "📧", title: "Mail", color: "#a855f7", fields: [
    { id: "mail_pop_imap",     label: "Mail POP / IMAP" },
    { id: "exchange",          label: "Exchange Plan1 / Plan2" },
    { id: "o365",              label: "Microsoft 365" },
    { id: "google_workspace",  label: "Google Workspace" },
  ]},
  { icon: "🧮", title: "Logiciels métier", color: "#10b981", fields: [
    { id: "sage",       label: "Sage" },
    { id: "ebp",        label: "EBP" },
    { id: "factorial",  label: "Factorial" },
  ]},
  { icon: "📞", title: "Téléphonie", color: "#f59e0b", fields: [
    { id: "telephonie_ovh",     label: "Téléphonie (OVH)" },
    { id: "mobile_telephonie",  label: "Mobile téléphonie" },
    { id: "teams_phone",        label: "Teams & Phone" },
  ]},
  { icon: "🌐", title: "Web", color: "#0891b2", fields: [
    { id: "nom_de_domaine",   label: "Nom de domaine" },
    { id: "hebergement_web",  label: "Hébergement Web" },
  ]},
  { icon: "🔌", title: "Lien internet", color: "#8b5cf6", fields: [
    { id: "lien_internet",            label: "Lien internet principal" },
    { id: "type_lien_internet",       label: "Type de lien (ADSL / VDSL / FTTH …)" },
    { id: "partenaire_lien_internet", label: "Partenaire (OVH, Free Pro …)" },
    { id: "lien_internet_secours",    label: "Lien internet (secours)" },
  ]},
];

const TECH_STATUSES = [
  { value: "",            label: "—",            bg: "#fafbfc", color: "#94a3b8" },
  { value: "actif",       label: "● Actif",      bg: "#dcfce7", color: "#065f46" },
  { value: "inactif",     label: "○ Inactif",    bg: "#fee2e2", color: "#991b1b" },
  { value: "a_installer", label: "▲ À installer",bg: "#fef3c7", color: "#92400e" },
  { value: "non_concerne",label: "✕ Non concerné",bg: "#f1f5f9", color: "#64748b" },
  { value: "a_verifier",  label: "? À vérifier", bg: "#dbeafe", color: "#1e40af" },
];

const TechModule = ({ clientId, value, onChange }) => {
  const [tech, setTech] = React.useState(value || {});
  React.useEffect(() => { setTech(value || {}); }, [value]);
  const [openSections, setOpenSections] = React.useState(() => new Set(TECH_SECTIONS.slice(0, 3).map((s) => s.title)));
  const [saving, setSaving] = React.useState(false);

  const setField = (id, v) => {
    const next = { ...tech, [id]: v };
    setTech(next);
    // Debounce sauvegarde 400ms
    if (setField._timer) clearTimeout(setField._timer);
    setField._timer = setTimeout(async () => {
      setSaving(true);
      try { await onChange(next); } finally { setSaving(false); }
    }, 400);
  };

  const toggleSection = (title) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  // Compteur global
  const totalFields = TECH_SECTIONS.reduce((a, s) => a + s.fields.length, 0);
  const filledFields = TECH_SECTIONS.reduce((a, s) => a + s.fields.filter((f) => tech[f.id] && tech[f.id] !== "").length, 0);

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 18, marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 }}>
            🛠 Module technique
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            État du parc IT du client · {filledFields}/{totalFields} champs renseignés
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saving && <span style={{ fontSize: 11, color: "#10b981" }}>● Sauvegarde…</span>}
          <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#eef2ff", color: "#3730a3", borderRadius: 999, fontWeight: 700 }}>
            {Math.round((filledFields / totalFields) * 100)}%
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TECH_SECTIONS.map((sec) => {
          const isOpen = openSections.has(sec.title);
          const secFilled = sec.fields.filter((f) => tech[f.id] && tech[f.id] !== "").length;
          return (
            <div key={sec.title} style={{ border: "1px solid #eef1f5", borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => toggleSection(sec.title)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: isOpen ? sec.color + "0d" : "#fafbfc",
                  border: 0, cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 16 }}>{sec.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{sec.title}</span>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{secFilled}/{sec.fields.length}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {sec.fields.map((f) => {
                    const v = tech[f.id] || "";
                    const meta = TECH_STATUSES.find((s) => s.value === v) || TECH_STATUSES[0];
                    return (
                      <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 }}>
                        <span style={{ flex: 1, fontSize: 12, color: "#0f172a", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                        <select
                          value={v}
                          onChange={(e) => setField(f.id, e.target.value)}
                          style={{
                            padding: "3px 6px", border: "1px solid " + (v ? meta.color + "40" : "#e2e8f0"),
                            borderRadius: 5, fontSize: 11, fontWeight: 700,
                            background: meta.bg, color: meta.color, cursor: "pointer", outline: "none",
                          }}
                        >
                          {TECH_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════
// ContactEditModal — formulaire d'édition d'un contact existant
// Permet de modifier prénom, nom, fonction, email, phone, linkedin
// Sauvegarde via api.contacts.update (ou api.clients.update si legacy
// contact_principal stocké dans clients.data).
// ════════════════════════════════════════════════════════════════════
const ContactEditModal = ({ contact, onClose, onSave }) => {
  const [form, setForm] = React.useState(contact);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const tree = (
    <div onClick={onClose} style={CE.backdrop}>
      <div onClick={(e) => e.stopPropagation()} style={CE.modal}>
        <div style={CE.head}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...CE.icon, background: (form.color || "#3730a3") + "20", color: form.color || "#3730a3" }}>
              {((form.prenom || "").slice(0, 1) + (form.nom || "").slice(0, 1)).toUpperCase() || "?"}
            </div>
            <div>
              <div style={CE.eyebrow}>Fiche client · Contact</div>
              <div style={CE.title}>Modifier le contact</div>
            </div>
          </div>
          <button onClick={onClose} style={CE.close}>×</button>
        </div>
        <form onSubmit={submit} style={CE.body}>
          <div style={CE.row}>
            <label style={CE.field}>
              <span style={CE.label}>Prénom</span>
              <input type="text" value={form.prenom || ""} onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={CE.input} autoFocus />
            </label>
            <label style={CE.field}>
              <span style={CE.label}>Nom</span>
              <input type="text" value={form.nom || ""} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={CE.input} />
            </label>
          </div>
          <label style={CE.field}>
            <span style={CE.label}>Fonction</span>
            <input type="text" value={form.fonction || ""} onChange={(e) => setForm({ ...form, fonction: e.target.value })} placeholder="Ex : CFO / Directeur financier" style={CE.input} />
          </label>
          <div style={CE.row}>
            <label style={CE.field}>
              <span style={CE.label}>Email</span>
              <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom.nom@entreprise.fr" style={CE.input} />
            </label>
            <label style={CE.field}>
              <span style={CE.label}>Téléphone</span>
              <input type="tel" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 12 34 56 78" style={{ ...CE.input, fontFamily: "'JetBrains Mono', monospace" }} />
            </label>
          </div>
          <label style={CE.field}>
            <span style={CE.label}>LinkedIn</span>
            <input type="text" value={form.linkedin || ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/prenom-nom" style={{ ...CE.input, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
          </label>
          <div style={CE.foot}>
            <button type="button" onClick={onClose} style={CE.btnGhost}>Annuler</button>
            <button type="submit" disabled={saving} style={{ ...CE.btnPrimary, opacity: saving ? 0.6 : 1, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Enregistrement…" : "💾 Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  return portalTarget ? ReactDOM.createPortal(tree, portalTarget) : tree;
};

const CE = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  icon: { width: 40, height: 40, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
  eyebrow: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 17, fontWeight: 700, color: "#0f172a", marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },
  body: { padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 },
  input: { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", boxSizing: "border-box" },
  foot: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" },
  btnGhost: { padding: "9px 14px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnPrimary: { padding: "9px 18px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700 },
};

window.ClientPage = ClientPage;
