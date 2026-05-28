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
      setOppEdits(JSON.parse(localStorage.getItem("hubAstorya.oppEdits.v1") || "{}"));
    } catch (e) {}
  }, []);
  var toggleAction = key => {
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
  var addAction = () => {
    var title = prompt("Nouvelle action à mener :");
    if (!title) return;
    var due = prompt("Échéance (texte libre, ex. 'Demain · 10h00') :", "Demain");
    var next = [{
      id: "EX-" + Date.now(),
      title,
      due: due || "—",
      priority: "moyenne",
      icon: "•",
      meta: "Ajoutée manuellement",
      assigned: "Vous",
      assignedColor: "#3730a3",
      tag: "Manuel",
      tagColor: "#475569"
    }, ...extraActions];
    setExtraActions(next);
    try {
      localStorage.setItem("hubAstorya.actionsExtra.v1", JSON.stringify(next));
    } catch (e) {}
  };
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
  var defaultContacts = [{
    name: "Émilie Roux",
    role: "VP Innovation",
    email: "e.roux@axa-im.fr",
    phone: "+33 1 40 76 00",
    color: "#a855f7",
    champion: true,
    last: "il y a 2 h"
  }, {
    name: "Antoine Mercier",
    role: "CISO",
    email: "a.mercier@axa-im.fr",
    phone: "+33 1 40 76 01",
    color: "#dc2626",
    last: "il y a 8 h"
  }, {
    name: "Julien Pasquier",
    role: "CFO",
    email: "j.pasquier@axa-im.fr",
    phone: "+33 1 40 76 02",
    color: "#0ea5e9",
    last: "il y a 4 j"
  }, {
    name: "Marie Lopez",
    role: "Head of Ops",
    email: "m.lopez@axa-im.fr",
    phone: "+33 1 40 76 03",
    color: "#f59e0b",
    last: "il y a 1 sem."
  }, {
    name: "Sébastien Roy",
    role: "Procurement",
    email: "s.roy@axa-im.fr",
    phone: "+33 1 40 76 04",
    color: "#10b981",
    coldZone: true,
    last: "il y a 3 sem."
  }];
  var [customContacts, setCustomContacts] = React.useState([]);
  React.useEffect(() => {
    try {
      setCustomContacts(JSON.parse(localStorage.getItem("hubAstorya.contacts.v1") || "[]"));
    } catch (e) {}
  }, []);

  // Compose la liste : si client custom, démarre depuis contact_principal + extras locaux. Sinon démo AXA + customs.
  var allContacts = (() => {
    var localForThis = customContacts.filter(c => c.client_id === (urlId || "ACC-0184")).map(c => ({
      ...c,
      _custom: true
    }));
    if (isCustom) {
      var principal = display.contactPrincipal ? [{
        name: ((display.contactPrincipal.prenom || "") + " " + (display.contactPrincipal.nom || "")).trim(),
        role: display.contactPrincipal.fonction || "—",
        email: display.contactPrincipal.email || "",
        phone: display.contactPrincipal.phone || "",
        color: "#a855f7",
        champion: true,
        last: "Contact principal"
      }] : [];
      return [...principal, ...localForThis];
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
    var name = prompt("Intitulé du contrat :");
    if (!name) return;
    var amount = prompt("Montant (ex. 48 k€ / an) :", "0 €");
    var type = prompt("Type (Licence SaaS / Maintenance / Avenant / Autre) :", "Licence SaaS");
    var newCt = {
      id: "CTR-" + Date.now().toString().slice(-7),
      client_id: urlId || display.id,
      name,
      product: "",
      type: type || "—",
      amount: amount || "0 €",
      start: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      status: "active"
    };
    var next = [newCt, ...contractsList];
    setContractsList(next);
    try {
      var all = JSON.parse(localStorage.getItem("hubAstorya.contracts.v1") || "[]");
      localStorage.setItem("hubAstorya.contracts.v1", JSON.stringify([newCt, ...all]));
    } catch (e) {}
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
  var isCustom = !!loadedClient;
  var display = {
    id: c.id || "ACC-0184",
    name: c.raison_sociale || c.name || "AXA Wealth France",
    sector: c.secteur || c.industry || "Asset Management",
    size: c.effectif ? `Effectif ${c.effectif}` : "12 000 employés",
    city: c.ville || c.city || "Paris · La Défense",
    web: c.site_web || c.website || "axa-im.fr",
    since: c.created_at ? `Prospect depuis ${new Date(c.created_at).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : c.client_since ? `Client depuis ${new Date(c.client_since).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric"
    })}` : "Client depuis mars 2024",
    desc: c.notes || (isCustom ? `Compte ${c.tier ? `tier ${c.tier}` : ""} — créé via le formulaire prospect.` : "Filiale française gestion de patrimoine du groupe AXA. Direction : Émilie Roux (VP Innovation)."),
    logo: (c.raison_sociale || c.name || "AX").slice(0, 2).toUpperCase(),
    arr: isCustom ? "—" : "184 k€",
    pipe: isCustom ? "0" : "355 k€",
    health: isCustom ? "—" : "78",
    contactPrincipal: c.contact_principal || null
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
  var opportunities = [{
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
  var pastAll = past.concat(pastExtras);
  var pastShown = pastShowAll ? pastAll : past;

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
    var stageLabels = {
      qualif: "Qualification",
      discovery: "Discovery",
      propo: "Proposition",
      nego: "Négociation",
      won: "Signé / Gagné"
    };
    var openOpp = () => {
      var choice = prompt(`${o.ref} — ${o.name}\n\nMontant : ${o.amount}\nOwner : ${o.owner}\nClôture : ${o.close}\n\n──────────────────\nChanger l'étape ?\n  1. Qualification\n  2. Discovery\n  3. Proposition\n  4. Négociation\n  5. Signé / Gagné ✓\n  0. Annuler\n\nTapez le numéro :`, "0");
      var map = {
        "1": "qualif",
        "2": "discovery",
        "3": "propo",
        "4": "nego",
        "5": "won"
      };
      var newStage = map[choice];
      if (!newStage) return;
      updateOppField(o.ref, "stage", newStage);
      if (newStage === "won" && isCustom) {
        var promoted = promoteToClient(display.id, o.name);
        if (promoted) alert(`✓ ${o.name} signée !\n\n${display.name} passe de prospect à client.\nRechargez la page pour voir la mise à jour.`);else alert(`✓ Opportunité « ${o.name} » signée — statut mis à jour.`);
      } else {
        alert(`✓ Étape mise à jour : ${stageLabels[newStage]}`);
      }
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
  }, future.length)), /*#__PURE__*/React.createElement("p", {
    style: cliStyles.h2sub
  }, "T\xE2ches, relances et \xE9v\xE9nements planifi\xE9s")), /*#__PURE__*/React.createElement("button", {
    onClick: addAction,
    style: {
      ...cliStyles.primaryBtnSm,
      cursor: "pointer"
    }
  }, "+ Ajouter")), /*#__PURE__*/React.createElement("div", {
    style: cliStyles.actionsList
  }, [...extraActions, ...future].map((a, i) => {
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
      onChange: () => toggleAction(key)
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
    }))))))), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        var choice = prompt(`Action « ${a.title} »\n\n1. Marquer comme ${done ? "à faire" : "terminée"}\n2. Supprimer (action manuelle uniquement)\n3. Annuler\n\nTapez 1, 2 ou 3 :`, "1");
        if (choice === "1") toggleAction(key);else if (choice === "2" && a.id) removeAction(a.id);
      },
      style: {
        ...cliStyles.actionMenu,
        cursor: "pointer"
      }
    }, "\u22EF"));
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
  }), pastShown.map((a, i) => /*#__PURE__*/React.createElement("div", {
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
  }, p.role), /*#__PURE__*/React.createElement("div", {
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
    style: cliStyles.filterPill
  }, "\xC9diter")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(DetailRow, {
    label: "Owner",
    value: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Nadia Lef\xE8vre",
      size: 22,
      color: "#a855f7"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, "Nadia Lef\xE8vre"))
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Co-owner",
    value: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Karim Ben Salah",
      size: 22,
      color: "#6366f1"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, "Karim Ben Salah"))
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Secteur",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, "Asset Management")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Source",
    value: /*#__PURE__*/React.createElement("span", {
      style: cliStyles.fieldChip
    }, "Salon Finovate Paris")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Concurrent",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#475569"
      }
    }, "Salesforce \xB7 Pega")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Client depuis",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#0f172a",
        fontWeight: 600
      }
    }, "14 mars 2024")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Renouvellement",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#0e7a55",
        fontWeight: 600
      }
    }, "01 mars 2026 \u2713")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Contrats actifs",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, "1 (Suite 2024-2026)")
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Adresse",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 1.4
      }
    }, "Tour Majunga", /*#__PURE__*/React.createElement("br", null), "6 place de la Pyramide", /*#__PURE__*/React.createElement("br", null), "92800 Puteaux")
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
  }));
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