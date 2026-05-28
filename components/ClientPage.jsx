// Fiche client 360 — pipe multi-contrats + actions menées / à mener

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
    try { setExtraActions(JSON.parse(localStorage.getItem("hubAstorya.actionsExtra.v1") || "[]")); } catch (e) {}
    try { setOppEdits(JSON.parse(localStorage.getItem("hubAstorya.oppEdits.v1") || "{}")); } catch (e) {}
  }, []);
  const toggleAction = (key) => {
    setDoneActions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("hubAstorya.actionsDone.v1", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  // Modal "Nouvelle action à mener"
  const [addActionOpen, setAddActionOpen] = React.useState(false);
  const [newAction, setNewAction] = React.useState({ type: "email", title: "", date: "", time: "", priority: "moyenne", assigned: "", tag: "", meta: "" });
  const openAddAction = () => { setNewAction({ type: "email", title: "", date: "", time: "", priority: "moyenne", assigned: "", tag: "", meta: "" }); setAddActionOpen(true); };
  const submitNewAction = () => {
    if (!newAction.title.trim()) { alert("Le titre est obligatoire"); return; }
    const iconMap = { email: "✉", call: "📞", visio: "💻", rdv: "📅", task: "✓", note: "✎" };
    const dueText = newAction.date
      ? new Date(newAction.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) + (newAction.time ? " · " + newAction.time : "")
      : "Date à définir";
    const next = [{
      id: "EX-" + Date.now(),
      title: newAction.title.trim(),
      due: dueText,
      priority: newAction.priority,
      icon: iconMap[newAction.type] || "•",
      meta: newAction.meta || "",
      assigned: newAction.assigned || "Vous",
      assignedColor: "#3730a3",
      tag: newAction.tag || (newAction.type === "email" ? "Email" : newAction.type === "call" ? "Appel" : newAction.type === "visio" ? "Visio" : newAction.type === "rdv" ? "RDV" : newAction.type === "task" ? "Tâche" : "Note"),
      tagColor: "#475569",
    }, ...extraActions];
    setExtraActions(next);
    try { localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next)); } catch (e) {}
    setAddActionOpen(false);
  };
  const addAction = () => openAddAction();
  const removeAction = (id) => {
    const next = extraActions.filter((a) => a.id !== id);
    setExtraActions(next);
    try { localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next)); } catch (e) {}
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
    const local = (() => { try { return JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]"); } catch (e) { return []; } })();
    const fromLocal = local.map((p) => ({ id: p.id, name: p.raison_sociale || p.name, status: p.status || "prospect", color: "#1e40af" }));
    if (window.HubData && window.HubData.enabled()) {
      window.HubData.fetchClients().then(({ data }) => {
        const fromSupa = (data || []).map((c) => ({ id: c.id, name: c.name, status: "client", color: "#0f766e" }));
        const seen = new Set();
        setRecents([...fromLocal, ...fromSupa].filter((c) => seen.has(c.id) ? false : (seen.add(c.id), true)).slice(0, 8));
      });
    } else {
      // Fallback démo si rien
      const fallback = fromLocal.length > 0 ? fromLocal : [
        { id: "ACC-0184", name: "AXA Wealth France",  status: "client", color: "#1e40af" },
        { id: "ACC-0211", name: "MAIF Innovation",    status: "client", color: "#10b981" },
        { id: "ACC-0156", name: "Crédit Agricole Sud", status: "client", color: "#dc2626" },
      ];
      setRecents(fallback.slice(0, 8));
    }
  }, []);

  // Modal opp détail : stage editable + autres champs
  const openOppDetail = (i) => setOppDetailIdx(i);
  const closeOppDetail = () => setOppDetailIdx(null);

  // ───── Contrats du client : localStorage + démo selon contexte
  const [contractsList, setContractsList] = React.useState([]);
  React.useEffect(() => {
    const key = "hubAstorya.contracts.v1";
    let all = []; try { all = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
    const stored = all.filter((c) => c.client_id === (urlId || "ACC-0184"));
    if (stored.length > 0) { setContractsList(stored); return; }
    // Démo AXA si pas d'ID custom
    if (!urlId) {
      setContractsList([
        { id: "CTR-0184-01", client_id: "ACC-0184", name: "Astorya Suite — 750 sièges", product: "Astorya Suite v3 · Licence annuelle", type: "Licence SaaS",       amount: "184 k€ / an",  start: "01 mars 2024", end: "28 fév. 2027",  status: "active" },
        { id: "CTR-0184-02", client_id: "ACC-0184", name: "Support Premium 24/7",       product: "Maintenance et SLA hotline",            type: "Maintenance",       amount: "48 k€ / an",   start: "01 mars 2024", end: "28 fév. 2027",  status: "active" },
        { id: "CTR-0184-03", client_id: "ACC-0184", name: "Module Cyber — extension",   product: "Cyber Add-on (POC 50 utilisateurs)",     type: "Licence module",   amount: "12 k€ / an",   start: "15 sept. 2025", end: "14 sept. 2026", status: "expiring" },
        { id: "CTR-0184-04", client_id: "ACC-0184", name: "Renouvellement Suite 2024",  product: "Avenant renouvellement triennal",        type: "Avenant",           amount: "184 k€",       start: "01 mars 2023", end: "28 fév. 2024",  status: "expired" },
      ]);
    } else {
      setContractsList([]);
    }
  }, [urlId]);

  // ───── Contacts clés du client : démo AXA + custom localStorage par client
  const defaultContacts = [
    { name: "Émilie Roux",      role: "VP Innovation", email: "e.roux@axa-im.fr",      phone: "+33 1 40 76 00",  color: "#a855f7", champion: true,  last: "il y a 2 h" },
    { name: "Antoine Mercier",  role: "CISO",          email: "a.mercier@axa-im.fr",   phone: "+33 1 40 76 01",  color: "#dc2626",                  last: "il y a 8 h" },
    { name: "Julien Pasquier",  role: "CFO",           email: "j.pasquier@axa-im.fr",  phone: "+33 1 40 76 02",  color: "#0ea5e9",                  last: "il y a 4 j" },
    { name: "Marie Lopez",      role: "Head of Ops",   email: "m.lopez@axa-im.fr",     phone: "+33 1 40 76 03",  color: "#f59e0b",                  last: "il y a 1 sem." },
    { name: "Sébastien Roy",    role: "Procurement",   email: "s.roy@axa-im.fr",       phone: "+33 1 40 76 04",  color: "#10b981", coldZone: true,  last: "il y a 3 sem." },
  ];
  const [customContacts, setCustomContacts] = React.useState([]);
  React.useEffect(() => {
    try { setCustomContacts(JSON.parse(localStorage.getItem("hubAstorya.contacts.v1") || "[]")); } catch (e) {}
  }, []);

  // Compose la liste : si client custom, démarre depuis contact_principal + extras locaux. Sinon démo AXA + customs.
  // Vide par défaut pour un nouveau prospect tant que rien n'est renseigné (pas de carte vide).
  const allContacts = (() => {
    const localForThis = customContacts.filter((c) => c.client_id === (urlId || "ACC-0184")).map((c) => ({ ...c, _custom: true }));
    if (isCustom) {
      const cp = display.contactPrincipal;
      const fullName = cp ? ((cp.prenom || "") + " " + (cp.nom || "")).trim() : "";
      // Ne créer la carte du contact principal que s'il a au moins un nom OU un email
      const principal = (fullName || (cp && cp.email)) ? [{
        name: fullName || (cp && cp.email) || "Contact principal",
        role: (cp && cp.fonction) || "—",
        email: (cp && cp.email) || "",
        phone: (cp && cp.phone) || "",
        color: "#a855f7", champion: true, last: "Contact principal",
      }] : [];
      return [...principal, ...localForThis];
    }
    return [...defaultContacts, ...localForThis];
  })();

  const addContact = () => {
    const fullName = prompt("Nom complet du contact :");
    if (!fullName) return;
    const role = prompt("Fonction :", "—");
    const email = prompt("Email :", "");
    const phone = prompt("Téléphone :", "");
    const newContact = {
      id: "CT-" + Date.now().toString().slice(-7),
      client_id: urlId || "ACC-0184",
      name: fullName, role: role || "—",
      email: email || "", phone: phone || "",
      color: ["#a855f7", "#dc2626", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"][Math.floor(Math.random() * 6)],
      last: "à l'instant",
    };
    const next = [newContact, ...customContacts];
    setCustomContacts(next);
    try { localStorage.setItem("hubAstorya.contacts.v1", JSON.stringify(next)); } catch (e) {}
  };
  const removeContact = (id) => {
    const next = customContacts.filter((c) => c.id !== id);
    setCustomContacts(next);
    try { localStorage.setItem("hubAstorya.contacts.v1", JSON.stringify(next)); } catch (e) {}
  };

  const [pastShowAll, setPastShowAll] = React.useState(false);

  const addContract = () => {
    const cid = urlId || display.id || "";
    window.location.href = "/nouveau-contrat" + (cid ? "?client=" + encodeURIComponent(cid) : "");
  };

  // ───── Récupère le client à afficher selon l'ID dans l'URL
  // - localStorage prospects créés via /nouveau-prospect (clé hubAstorya.prospects.v1)
  // - sinon Supabase clients
  // - sinon fallback démo AXA Wealth France
  const urlId = (typeof window !== "undefined") ? new URLSearchParams(window.location.search).get("id") : null;
  const [loadedClient, setLoadedClient] = React.useState(null);

  React.useEffect(() => {
    if (!urlId) { setLoadedClient(null); return; }
    // 1. cherche dans localStorage
    try {
      const local = JSON.parse(localStorage.getItem("hubAstorya.prospects.v1") || "[]");
      const hit = local.find((p) => p.id === urlId);
      if (hit) { setLoadedClient(hit); return; }
    } catch (e) {}
    // 2. cherche dans Supabase
    if (window.HubData && window.HubData.enabled() && window.HubData.fetchClientById) {
      window.HubData.fetchClientById(urlId).then(({ data }) => { if (data) setLoadedClient({ ...data, _source: "supabase" }); });
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
    id:        c.id || (empty ? (urlId || "—") : "ACC-0184"),
    name:      c.raison_sociale || c.name || (empty ? "Chargement…" : "AXA Wealth France"),
    sector:    c.secteur || c.industry || (empty ? "—" : "Asset Management"),
    size:      c.effectif ? `Effectif ${c.effectif}` : (empty ? "—" : "12 000 employés"),
    city:      c.ville || c.city || (empty ? "—" : "Paris · La Défense"),
    web:       c.site_web || c.website || (empty ? "" : "axa-im.fr"),
    since:     c.created_at ? `Prospect depuis ${new Date(c.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : (c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : (empty ? "" : "Client depuis mars 2024")),
    desc:      c.notes || (isCustom ? (c.tier ? `Compte tier ${c.tier} — créé via le formulaire prospect.` : (empty ? "" : "Compte créé via le formulaire prospect.")) : "Filiale française gestion de patrimoine du groupe AXA. Direction : Émilie Roux (VP Innovation)."),
    logo:      (c.raison_sociale || c.name || (empty ? "?" : "AX")).slice(0, 2).toUpperCase(),
    arr:       isCustom ? "—" : "184 k€",
    pipe:      isCustom ? "0" : "355 k€",
    health:    isCustom ? "—" : "78",
    contactPrincipal: c.contact_principal || null,
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

  const opportunities = [
    { name: "Astorya Suite — 750 sièges", amount: "215 000 €", stage: "propo", proba: 55, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "15 juin 2026", days: 8, hot: true, ref: "OPP-2814" },
    { name: "Module Cyber — POC 50 utilisateurs", amount: "48 000 €", stage: "discovery", proba: 40, owner: "Karim Ben Salah", ownerColor: "#6366f1", close: "30 juin 2026", days: 4, ref: "OPP-2841" },
    { name: "Extension Hub — filiale Belgique", amount: "92 000 €", stage: "qualif", proba: 20, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "15 sept. 2026", days: 2, isNew: true, ref: "OPP-2867" },
    { name: "Renouvellement Suite 2024-2026", amount: "184 000 €", stage: "won", proba: 100, owner: "Nadia Lefèvre", ownerColor: "#a855f7", close: "01 mars 2026", days: 0, won: true, ref: "OPP-2698" },
  ];

  // ── Actions menées (passé, dernières)
  const past = [
    { type: "email", icon: "✉", color: "#a855f7", title: "Email envoyé — Proposition Suite v2", who: "Nadia Lefèvre → Émilie Roux", at: "il y a 4 h", meta: "Pièce jointe : Proposition-AXA-v2.pdf" },
    { type: "call", icon: "☎", color: "#10b981", title: "Appel sortant — 22 min", who: "Karim Ben Salah → Antoine Mercier (CISO)", at: "hier · 09:18", meta: "Validation périmètre sécurité — ouvert à POC 50 utilisateurs" },
    { type: "meeting", icon: "👥", color: "#0ea5e9", title: "RDV — Démo Astorya Suite", who: "5 participants AXA · 60 min", at: "jeu. 21 mai", meta: "Très bon retour UX sur les modules Dashboard et Reporting" },
    { type: "stage", icon: "↗", color: "#a855f7", title: "Étape avancée : Discovery → Proposition", who: "OPP-2814 · par Nadia Lefèvre", at: "lun. 25 mai", meta: null },
    { type: "note", icon: "✎", color: "#a65f00", title: "Note privée — Sentiment décideurs", who: "Nadia Lefèvre", at: "lun. 25 mai", meta: "CFO veut ROI à 18 mois. Préparer slide dédié pour comité." },
    { type: "email", icon: "✉", color: "#a855f7", title: "Email reçu — Questions techniques", who: "Émilie Roux (VP Innovation)", at: "il y a 2 j", meta: "3 points à clarifier : DORA, localisation UE, tarif > 500 users" },
    { type: "meeting", icon: "👥", color: "#0ea5e9", title: "RDV — Cadrage besoins métier", who: "3 participants · 45 min", at: "ven. 16 mai", meta: "Priorités confirmées : reporting client, conformité, mobilité" },
    { type: "doc", icon: "📄", color: "#64748b", title: "Document partagé — RFP Astorya", who: "Téléchargé 7 fois par AXA", at: "08 mai", meta: "RFP-Astorya-2026.pdf · 2,4 Mo" },
  ];

  // Historique étendu (39 anciennes actions ajoutées au "Tout voir")
  const pastExtras = [
    { type: "doc",     icon: "📄", color: "#64748b", title: "RFP — Présélection 2026",          who: "Échangée avec Émilie Roux",       at: "02 mai",   meta: "Astorya retenue dans la shortlist finale (5 éditeurs)" },
    { type: "call",    icon: "☎",  color: "#10b981", title: "Appel — Cadrage gouvernance DORA", who: "Karim Ben Salah → Émilie Roux",   at: "28 avr.",  meta: "Confirmation localisation des données UE obligatoire" },
    { type: "email",   icon: "✉",  color: "#a855f7", title: "Email — Documentation sécurité",   who: "Antoine Mercier → Nadia Lefèvre", at: "25 avr.",  meta: "Demande ISO 27001 + SOC2 type II" },
    { type: "meeting", icon: "👥", color: "#0ea5e9", title: "RDV — Présentation roadmap 2026",  who: "12 participants AXA",             at: "18 avr.",  meta: "Webinar produit · NPS 9/10" },
    { type: "stage",   icon: "↗",  color: "#a855f7", title: "OPP-2698 : signé",                 who: "Renouvellement Suite 24-26",      at: "01 mars",  meta: "184 k€ · 3 ans" },
  ];
  for (let i = 0; i < 34; i++) pastExtras.push({ type: "stage", icon: "•", color: "#94a3b8", title: `Synchronisation CRM #${i + 1}`, who: "Système", at: "Q1 2026", meta: "Mise à jour automatique" });
  // Pour un prospect custom : actions menées vides par défaut (pas d'historique AXA)
  const pastAll = past.concat(pastExtras);
  const pastShown = isCustom ? [] : (pastShowAll ? pastAll : past);
  const pastTotal = isCustom ? 0 : pastAll.length;

  // ── Actions à mener (futur, à faire)
  const future = [
    {
      priority: "haute", overdue: true, icon: "📧",
      title: "Répondre aux 3 questions techniques d'Émilie", due: "Aujourd'hui · 18:00",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Brouillon IA pré-rempli (citations p.12-14 de la proposition)",
      tag: "OPP-2814", tagColor: "#a855f7",
    },
    {
      priority: "haute", icon: "📅",
      title: "Comité achats AXA — présentation finale Suite", due: "Jeu. 28 mai · 14h00 · 30 min",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Visio Teams · 4 participants AXA (Roux, Mercier, Pasquier, Lopez)",
      tag: "OPP-2814", tagColor: "#a855f7",
      attendees: ["Émilie Roux", "Antoine Mercier", "Julien Pasquier", "Marie Lopez"],
    },
    {
      priority: "moyenne", icon: "📞",
      title: "Appel de cadrage POC Cyber avec Antoine Mercier", due: "Ven. 29 mai · 10h00",
      assigned: "Karim Ben Salah", assignedColor: "#6366f1",
      meta: "Préparer planning d'installation et plan de test",
      tag: "OPP-2841", tagColor: "#dc2626",
    },
    {
      priority: "moyenne", icon: "✉",
      title: "Envoyer proposition v3 Suite mise à jour", due: "Dim. 31 mai",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Intégrer commentaires CFO sur le ROI 18 mois",
      tag: "OPP-2814", tagColor: "#a855f7",
    },
    {
      priority: "basse", icon: "👥",
      title: "RDV de découverte filiale Belgique", due: "Sem. du 02 juin",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Identifier interlocuteurs locaux à Bruxelles",
      tag: "OPP-2867", tagColor: "#94a3b8",
    },
    {
      priority: "basse", icon: "🔄",
      title: "Préparer renouvellement Suite 2026-2028", due: "Sept. 2026",
      assigned: "Nadia Lefèvre", assignedColor: "#a855f7",
      meta: "Renouvellement automatique en mars — anticiper négociation",
      tag: "Recurring", tagColor: "#10b981",
    },
    {
      priority: "ai", icon: "★",
      title: "Suggestion IA — Inviter Émilie Roux à user-group Astorya",
      due: "Ce mois",
      meta: "Émilie a téléchargé 3 white papers ce trimestre. Signal champion fort.",
      tag: "Insight", tagColor: "#0f172a",
    },
  ];

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
        <a href={"/nouvelle-opportunite?client=" + encodeURIComponent(display.id)} style={{ ...cliStyles.newBtn, textDecoration: "none", cursor: "pointer" }}>+ Nouvelle opportunité <span style={cliStyles.kbd}>N</span></a>
        <a href="/nouveau-prospect" style={{ ...cliStyles.newBtn, textDecoration: "none", cursor: "pointer", background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", marginTop: -8 }}>+ Nouveau prospect <span style={{ ...cliStyles.kbd, background: "#f1f5f9", color: "#475569" }}>P</span></a>

        <div style={cliStyles.navSection}>
          <div style={cliStyles.navLabel}>Espace</div>
          <a href="/crm" style={{ ...cliStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={cliStyles.bullet}>▦</span><span style={{ flex: 1 }}>Pipeline</span><span style={cliStyles.navCount}>32</span>
          </a>
          <div style={{ ...cliStyles.navItem, ...cliStyles.navItemActive }}><span style={cliStyles.bullet}>◰</span><span style={{ flex: 1 }}>Comptes</span><span style={cliStyles.navCount}>412</span></div>
          <a onClick={() => alert("Carnet contacts — 1 184 fiches\n\n(Sera connecté à la table profiles + clients Supabase.)")}
             style={{ ...cliStyles.navItem, cursor: "pointer" }}>
            <span style={cliStyles.bullet}>◉</span><span style={{ flex: 1 }}>Contacts</span><span style={cliStyles.navCount}>1 184</span>
          </a>
          <a onClick={() => alert("Timeline activités client — Appels, emails, RDV, notes\n\n(Sera connectée à la table activities.)")}
             style={{ ...cliStyles.navItem, cursor: "pointer" }}>
            <span style={cliStyles.bullet}>✦</span><span style={{ flex: 1 }}>Activités</span><span style={cliStyles.navCount}>27</span>
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

        <a href="/administration-utilisateurs"
           title="Profil & préférences"
           style={{ ...cliStyles.userRow, textDecoration: "none", color: "inherit", cursor: "pointer" }}>
          <Avatar name="Nadia Lefèvre" size={26} color="#a855f7" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Nadia Lefèvre</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>AE · EMEA</div>
          </div>
        </a>
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
            <button style={cliStyles.iconBtn}>‹</button>
            <button style={cliStyles.iconBtn}>›</button>
            <button onClick={() => alert("✓ Vous suivez " + display.name + " — notifications activées pour ce compte.")} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>★ Suivre</button>
            <button style={cliStyles.iconBtn}>⋯</button>
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
                  <span style={cliStyles.metaChip}>Grand compte</span>
                  <span style={cliStyles.metaChip}>{display.size}</span>
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>📍 {display.city}</span>
                  <span style={cliStyles.dot} />
                  <a href={display.web && display.web.startsWith("http") ? display.web : "https://" + display.web} target="_blank" style={{ fontSize: 12, color: "#4f46e5", cursor: "pointer", textDecoration: "none" }}>{display.web} ↗</a>
                  <span style={cliStyles.dot} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{display.since}</span>
                </div>
                <h1 style={cliStyles.h1}>{display.name}</h1>
                <p style={cliStyles.subtitle}>
                  Filiale française gestion de patrimoine du groupe AXA. Direction : Émilie Roux (VP Innovation).
                </p>

                {/* tags */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={cliStyles.tag}># Grand-compte</span>
                  <span style={cliStyles.tag}># Top-10 Q2</span>
                  <span style={cliStyles.tag}># Migration Salesforce</span>
                  <span style={cliStyles.tag}># DORA</span>
                </div>
              </div>

              {/* Quick stats */}
              <div style={cliStyles.heroStats}>
                <div onClick={() => alert("ARR AXA Wealth France\n\n• 184 k€ actuel\n• +12 % YoY\n• Renouvellement Suite signé 01 mars 2026 — 184 k€\n\n(Détail facturation à connecter à la vue revenue.)")}
                     style={{ ...cliStyles.heroStat, cursor: "pointer" }}>
                  <div style={cliStyles.heroStatK}>ARR actuel</div>
                  <div style={cliStyles.heroStatV}>{display.arr}</div>
                  <div style={{ fontSize: 10.5, color: "#0e7a55", marginTop: 2 }}>↑ +12 % YoY</div>
                </div>
                <div onClick={() => alert("Pipe ouvert AXA Wealth France\n\n• OPP-2814 Astorya Suite 750 sièges — 215 k€ (Proposition)\n• OPP-2841 Module Cyber POC — 48 k€ (Discovery)\n• OPP-2867 Extension Belgique — 92 k€ (Qualification)\n\nTotal pondéré : ~ 152 k€")}
                     style={{ ...cliStyles.heroStat, cursor: "pointer" }}>
                  <div style={cliStyles.heroStatK}>Pipe ouvert</div>
                  <div style={{ ...cliStyles.heroStatV, color: "#4f46e5" }}>{display.pipe}</div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>3 opportunités</div>
                </div>
                <div onClick={() => alert("Health score AXA Wealth France : 78/100\n\n+  Renouvellement signé +12 % (+20 pts)\n+  Champion identifié : Émilie Roux (+10 pts)\n+  3 opportunités actives (+15 pts)\n−  Délai paiement moyen 47 j (−5 pts)\n−  Pas de POC technique en cours (−10 pts)\n\nObjectif T2 2026 : 85/100")}
                     style={{ ...cliStyles.heroStat, cursor: "pointer" }}>
                  <div style={cliStyles.heroStatK}>Health score</div>
                  <div style={{ ...cliStyles.heroStatV, color: "#10b981" }}>{display.health}<span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{display.health !== "—" ? " / 100" : ""}</span></div>
                  <div style={cliStyles.miniBar}><div style={{ width: (display.health === "—" ? "0%" : display.health + "%"), height: "100%", background: "linear-gradient(90deg, #4f46e5, #10b981)", borderRadius: 999 }} /></div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div style={cliStyles.actionBar}>
              <a href={"/nouvelle-opportunite?client=" + encodeURIComponent(display.id)} style={{ ...cliStyles.primaryBtn, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>+ Nouvelle opportunité</a>
              <button onClick={() => { const to = prompt("Destinataire (email) :", "e.roux@axa-im.fr"); if (!to) return; const subj = prompt("Sujet :", "AXA Wealth France — suite proposition Astorya Suite"); if (subj) { window.location.href = `mailto:${to}?subject=${encodeURIComponent(subj)}`; } }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✉ Email</button>
              <button onClick={() => alert("Planifier un RDV avec AXA Wealth France\n\n(Sera connecté à Google Calendar / Outlook via /api/calendar-event)")} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>📅 RDV</button>
              <button onClick={() => { const num = prompt("Numéro à appeler :", "+33 1 42 86 74 21"); if (num) window.location.href = `tel:${num}`; }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>📞 Appel</button>
              <button onClick={() => { const txt = prompt("Nouvelle tâche pour AXA Wealth France :"); if (txt) alert("✓ Tâche créée : " + txt + "\n\n(Sera persistée dans la table tasks.)"); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✓ Tâche</button>
              <button onClick={() => { const txt = prompt("Nouvelle note privée :"); if (txt) alert("✓ Note enregistrée : " + txt + "\n\n(Sera persistée dans la timeline activities.)"); }} style={{ ...cliStyles.ghostBtn, cursor: "pointer" }}>✎ Note</button>
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
                <h2 style={cliStyles.h2}>Pipe contrats <span style={cliStyles.blockCount}>{isCustom ? 0 : opportunities.length}</span></h2>
                <p style={cliStyles.h2sub}>Vue d'ensemble des opportunités et contrats actifs pour ce client</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="/crm" style={{ ...cliStyles.filterPill, textDecoration: "none", display: "inline-block", cursor: "pointer" }}>Vue Kanban ▦</a>
                <button onClick={() => alert("Vue Liste — affichage tabulaire des opportunités.\n\n(Bascule entre Kanban / Liste sera activée quand les deals seront persistés en DB.)")} style={{ ...cliStyles.filterPill, cursor: "pointer" }}>Vue Liste ☰</button>
              </div>
            </div>

            {/* Stage progression strip */}
            <div style={cliStyles.stagesStrip}>
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
            </div>

            {/* Opp cards */}
            <div style={cliStyles.oppGrid}>
              {(isCustom ? [] : opportunities).map((o, i) => {
                const edited = oppEdits[o.ref] || {};
                const currentStage = edited.stage || o.stage;
                const openOpp = () => {
                  const cid = urlId || display.id || "";
                  const amountNum = parseInt((edited.amount || o.amount || "").replace(/\D/g, ""), 10) || 0;
                  const oppForStore = {
                    ref: o.ref,
                    name: o.name,
                    client_name: display.name,
                    stage: edited.stage || o.stage,
                    amount: amountNum,
                    proba: edited.proba || o.proba,
                    owner: edited.owner || o.owner,
                    close: edited.close || o.close,
                    hot: o.hot,
                  };
                  try {
                    const all = JSON.parse(localStorage.getItem("hubAstorya.opportunities.v1") || "[]");
                    const idx = all.findIndex((x) => x.ref === o.ref);
                    if (idx >= 0) all[idx] = { ...all[idx], ...oppForStore };
                    else all.unshift(oppForStore);
                    localStorage.setItem("hubAstorya.opportunities.v1", JSON.stringify(all));
                  } catch (e) {}
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
                      <span style={{ color: "#4f46e5" }}>→</span> Actions à mener <span style={cliStyles.blockCount}>{extraActions.length + (isCustom ? 0 : future.length)}</span>
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
                        <input type="checkbox" style={{ ...cliStyles.checkbox, cursor: "pointer" }} checked={done} onChange={() => toggleAction(key)} />
                        <div style={{
                          ...cliStyles.actionIcon,
                          background: a.priority === "ai" ? "#0f172a" : "#fff",
                          color: a.priority === "ai" ? "#fff" : "#475569",
                          borderColor: a.priority === "ai" ? "#0f172a" : "#eef1f5",
                        }}>{a.icon}</div>
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
                        <button onClick={() => {
                          const choice = prompt(`Action « ${a.title} »\n\n1. Marquer comme ${done ? "à faire" : "terminée"}\n2. Supprimer (action manuelle uniquement)\n3. Annuler\n\nTapez 1, 2 ou 3 :`, "1");
                          if (choice === "1") toggleAction(key);
                          else if (choice === "2" && a.id) removeAction(a.id);
                        }} style={{ ...cliStyles.actionMenu, cursor: "pointer" }}>⋯</button>
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
                  {allContacts.map((p) => (
                    <div key={p.name} style={cliStyles.contactCard}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Avatar name={p.name} size={36} color={p.color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                            {p.champion && <span style={cliStyles.championPill}>★ Champion</span>}
                            {p.coldZone && <span style={cliStyles.coldPill}>❄ Froid</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>{p.role}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{p.email}</div>
                          <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{p.phone}</div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 6 }}>Dernier contact · {p.last}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <a href={"mailto:" + p.email} title={"Email à " + p.name} style={{ ...cliStyles.iconMini, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✉</a>
                          <a href={"tel:" + (p.phone || "").replace(/[^\d+]/g, "")} title={"Appeler " + p.name} style={{ ...cliStyles.iconMini, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>☎</a>
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
                  <button style={cliStyles.filterPill}>Éditer</button>
                </div>
                <div style={{ padding: 4 }}>
                  <DetailRow label="Owner" value={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name="Nadia Lefèvre" size={22} color="#a855f7" />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>Nadia Lefèvre</span>
                    </div>
                  } />
                  <DetailRow label="Co-owner" value={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name="Karim Ben Salah" size={22} color="#6366f1" />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>Karim Ben Salah</span>
                    </div>
                  } />
                  <DetailRow label="Secteur" value={<span style={cliStyles.fieldChip}>Asset Management</span>} />
                  <DetailRow label="Source" value={<span style={cliStyles.fieldChip}>Salon Finovate Paris</span>} />
                  <DetailRow label="Concurrent" value={<span style={{ fontSize: 12.5, color: "#475569" }}>Salesforce · Pega</span>} />
                  <DetailRow label="Client depuis" value={<span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", fontWeight: 600 }}>14 mars 2024</span>} />
                  <DetailRow label="Renouvellement" value={<span style={{ fontSize: 12.5, color: "#0e7a55", fontWeight: 600 }}>01 mars 2026 ✓</span>} />
                  <DetailRow label="Contrats actifs" value={<span style={{ fontSize: 12.5, fontWeight: 600 }}>1 (Suite 2024-2026)</span>} />
                  <DetailRow label="Adresse" value={<span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>Tour Majunga<br/>6 place de la Pyramide<br/>92800 Puteaux</span>} />
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
                            <button onClick={() => alert(`Contrat ${ct.id} — ${ct.name}\n\nIntitulé : ${ct.name}\nType : ${ct.type}\nMontant : ${ct.amount}\nDébut : ${ct.start}\nFin : ${ct.end}\nStatut : ${ct.status}\n\nProduit : ${ct.product || "—"}`)} style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 16, cursor: "pointer", padding: "4px 8px" }}>⋯</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div style={{ height: 24 }} />
        </div>
      </main>

      <CallStatsModal
        open={statsOpen}
        client={{ name: display.name }}
        onClose={() => setStatsOpen(false)}
      />
      <AssetInventoryModal
        open={assetsOpen}
        client={{ name: "AXA Wealth France" }}
        onClose={() => setAssetsOpen(false)}
      />

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

window.ClientPage = ClientPage;
