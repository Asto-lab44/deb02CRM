// ════════════════════════════════════════════════════════════════════
// RichDescriptionEditor — mini WYSIWYG (gras / italique / souligné + couleurs)
// Couleurs masquées derrière un popover "A▾" pour alléger la barre.
// ════════════════════════════════════════════════════════════════════
const RichDescriptionEditor = ({ value, onChange, placeholder }) => {
  const ref = React.useRef(null);
  const lastValueRef = React.useRef(value || "");
  const [colorOpen, setColorOpen] = React.useState(false);
  const [currentColor, setCurrentColor] = React.useState("#0f172a");
  const popRef = React.useRef(null);

  React.useEffect(() => {
    if (document.getElementById("rich-desc-styles")) return;
    const s = document.createElement("style");
    s.id = "rich-desc-styles";
    s.textContent = [
      '.rich-desc[contenteditable]:empty:before{content:attr(data-placeholder);color:#cbd5e1;font-style:italic;pointer-events:none;}',
      '.rich-desc[contenteditable]:focus{outline:none;}',
      '.rich-desc-btn{transition:background 120ms,border-color 120ms,color 120ms;}',
      '.rich-desc-btn:hover{background:#f1f5f9;border-color:#cbd5e1;}',
    ].join("");
    document.head.appendChild(s);
  }, []);

  React.useEffect(() => {
    if (!ref.current) return;
    const v = value || "";
    if (ref.current.innerHTML !== v && document.activeElement !== ref.current) {
      ref.current.innerHTML = v;
      lastValueRef.current = v;
    }
  }, [value]);

  React.useEffect(() => {
    if (!colorOpen) return;
    const close = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setColorOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [colorOpen]);

  const exec = (cmd, arg) => {
    if (!ref.current) return;
    ref.current.focus();
    try { document.execCommand("styleWithCSS", false, true); } catch (e) {}
    document.execCommand(cmd, false, arg);
    const html = ref.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const applyColor = (color) => {
    setCurrentColor(color);
    exec("foreColor", color);
    setColorOpen(false);
  };

  const btnBase = {
    minWidth: 30, height: 28, padding: "0 9px", border: "1px solid transparent",
    background: "transparent", borderRadius: 6, cursor: "pointer",
    fontSize: 13, color: "#334155",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 6px",
                    border: "1px solid #e2e8f0", borderBottom: 0,
                    borderRadius: "8px 8px 0 0", background: "#f8fafc" }}>
        <button type="button" title="Gras (Ctrl+B)" className="rich-desc-btn"
                onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")}
                style={{ ...btnBase, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>B</button>
        <button type="button" title="Italique (Ctrl+I)" className="rich-desc-btn"
                onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")}
                style={{ ...btnBase, fontStyle: "italic", fontFamily: "'Inter', system-ui, sans-serif" }}>I</button>
        <button type="button" title="Souligné (Ctrl+U)" className="rich-desc-btn"
                onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")}
                style={{ ...btnBase, textDecoration: "underline", fontWeight: 600 }}>U</button>
        <span style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 6px" }} />
        <div style={{ position: "relative" }} ref={popRef}>
          <button type="button" title="Couleur du texte" className="rich-desc-btn"
                  onMouseDown={(e) => e.preventDefault()} onClick={() => setColorOpen((v) => !v)}
                  style={{ ...btnBase, display: "inline-flex", alignItems: "center", gap: 4, padding: "0 6px" }}>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>A</span>
              <span style={{ display: "block", width: 14, height: 3, background: currentColor, borderRadius: 1, marginTop: 1 }} />
            </span>
            <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
          </button>
          {colorOpen && (
            <div onMouseDown={(e) => e.preventDefault()}
                 style={{ position: "absolute", top: "calc(100% + 4px)", left: 0,
                          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                          boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: 6,
                          display: "flex", gap: 4, zIndex: 50 }}>
              {[
                { c: "#0f172a", label: "Noir" },
                { c: "#16a34a", label: "Vert" },
                { c: "#ea580c", label: "Orange" },
                { c: "#dc2626", label: "Rouge" },
              ].map((opt) => (
                <button key={opt.c} type="button" title={opt.label}
                        onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor(opt.c)}
                        style={{ width: 22, height: 22, border: opt.c === currentColor ? "2px solid #3730a3" : "1px solid #e2e8f0",
                                 background: opt.c, borderRadius: 11, cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#94a3b8" }}>Repris à l'identique sur le PDF</span>
      </div>
      <div
        ref={ref}
        className="rich-desc"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || ""}
        onInput={(e) => { lastValueRef.current = e.currentTarget.innerHTML; onChange(e.currentTarget.innerHTML); }}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        style={{ minHeight: 56, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "0 0 8px 8px",
                 fontSize: 13, color: "#0f172a", lineHeight: 1.55, background: "#fff", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
};

// Code client = "CLI" + 3 premières lettres du nom (alphanumériques, MAJ).
// Ex : "ASTORYA SGI" → "CLIAST" · "INIT 2" → "CLIINI" · "CHEVAL SHOP" → "CLICHE".
const computeClientCode = (clientName) => {
  if (!clientName) return "";
  const cleaned = String(clientName)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]/g, "");
  return "CLI" + cleaned.slice(0, 3).padEnd(3, "X");
};

// ════════════════════════════════════════════════════════════════════
// CommercialDocs — Gestion Commerciale (Devis / Commande / BL / Facture)
// ════════════════════════════════════════════════════════════════════
//
// Inspirée Sage 50c Gestion Commerciale :
// - 4 types de documents : devis → commande → BL → facture
// - Chaque type a son propre tab + son kanban par statut
// - Bouton "Nouveau" crée un brouillon ; édition inline des lignes
// - Bouton "Transformer en …" enchaîne sur le document suivant
// - Rattachement optionnel à un projet (CRM Projets & Livrables)
//
// Sources Supabase : commercial_docs + commercial_doc_lines + commercial_articles
// ════════════════════════════════════════════════════════════════════

const CommercialDocs = () => {
  const TYPES = [
    // Seul "devis" est créable directement. Les autres types se créent uniquement
    // par transformation de la chaîne (devis → commande → BL → facture), c'est
    // pourquoi leur newLabel pointe vers "Nouveau devis" : le bouton du haut
    // bascule sur l'onglet Devis et ouvre un nouveau devis.
    // (La commande fournisseur n'est plus une étape du workflow Sage ;
    // elle est gérée séparément dans la tuile Stock & Catalogue.)
    { k: "devis",    label: "Devis",            newLabel: "Nouveau devis", color: "#3b82f6", icon: "📄" },
    { k: "commande", label: "Commandes client", newLabel: "Nouveau devis", color: "#a855f7", icon: "📋" },
    { k: "bl",       label: "Bons livraison",   newLabel: "Nouveau devis", color: "#ea580c", icon: "🚚" },
    { k: "facture",  label: "Factures",         newLabel: "Nouveau devis", color: "#10b981", icon: "💶" },
  ];

  const STATUS_META = {
    brouillon:  { label: "Brouillon",  color: "#94a3b8", bg: "#f1f5f9" },
    envoye:     { label: "Envoyé",     color: "#3b82f6", bg: "#dbeafe" },
    accepte:    { label: "Accepté",    color: "#10b981", bg: "#dcfce7" },
    refuse:     { label: "Refusé",     color: "#dc2626", bg: "#fee2e2" },
    transforme: { label: "Transformé", color: "#7e22ce", bg: "#f3e8ff" },
    livre:      { label: "Livré",      color: "#f59e0b", bg: "#fef3c7" },
    facture:    { label: "Facturé",    color: "#0ea5e9", bg: "#e0f2fe" },
    paye:       { label: "Payé",       color: "#065f46", bg: "#d1fae5" },
    annule:     { label: "Annulé",     color: "#475569", bg: "#e2e8f0" },
  };

  const [activeType, setActiveType] = React.useState("devis");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [clientFilter, setClientFilter] = React.useState("");
  // Plage glissante par défaut : J-365 → aujourd'hui.
  const DEFAULT_DATE_RANGE = (() => {
    const iso = (d) => d.toISOString().slice(0, 10);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    return { from: iso(oneYearAgo), to: iso(today) };
  })();
  const [dateFrom, setDateFrom] = React.useState(DEFAULT_DATE_RANGE.from);
  const [dateTo, setDateTo] = React.useState(DEFAULT_DATE_RANGE.to);
  const [docs, setDocs] = React.useState([]);
  const [allDocs, setAllDocs] = React.useState([]); // tous types confondus, pour calculer les chaînes
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [clients, setClients] = React.useState([]);
  const [opps, setOpps] = React.useState([]);
  const [previewDocId, setPreviewDocId] = React.useState(null);
  const previewTimerRef = React.useRef(null);
  const [editing, setEditing] = React.useState(null); // null ou doc en cours d'édition

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [typed, all] = await Promise.all([
        window.api.commercialDocs.list({ type: activeType }),
        window.api.commercialDocs.list({}), // pour les chaînes Devis→Commande→BL→Facture
      ]);
      setDocs(typed || []);
      setAllDocs(all || []);
    } catch (e) { setDocs([]); setAllDocs([]); }
    setLoading(false);
  }, [activeType]);

  // Map parent_doc_id → enfant unique (chaque doc n'a qu'un enfant max)
  const childrenMap = React.useMemo(() => {
    const map = {};
    (allDocs || []).forEach((d) => { if (d.parent_doc_id) map[d.parent_doc_id] = d; });
    return map;
  }, [allDocs]);

  // Pour un doc devis, retourne la chaîne complète : { devis, commande, bl, facture }
  const buildChain = React.useCallback((rootDoc) => {
    const chain = { devis: null, commande: null, bl: null, facture: null };
    let current = rootDoc;
    while (current) {
      chain[current.type] = current;
      current = childrenMap[current.id] || null;
    }
    return chain;
  }, [childrenMap]);

  // Pour un doc enfant (ex commande), remonte la chaîne et retourne les 4 docs
  const buildChainFromAny = React.useCallback((doc) => {
    if (!doc) return { devis: null, commande: null, bl: null, facture: null };
    let root = doc;
    const seen = new Set();
    while (root.parent_doc_id && !seen.has(root.id)) {
      seen.add(root.id);
      const parent = (allDocs || []).find((d) => d.id === root.parent_doc_id);
      if (!parent) break;
      root = parent;
    }
    return buildChain(root);
  }, [allDocs, buildChain]);

  React.useEffect(() => { reload(); }, [reload]);
  React.useEffect(() => {
    (async () => {
      try { setClients(await window.api.clients.list() || []); } catch (e) {}
      try {
        const all = await window.api.opportunities.list() || [];
        // Pipeline ouvert ET récent : on garde tout sauf won/lost,
        // ET on limite aux opp créées (ou updatées) dans les 30 derniers jours.
        // Évite de polluer le picker avec des vieilles opps dormantes.
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
        setOpps(all.filter((o) => {
          if (o.stage === "won" || o.stage === "lost") return false;
          const ts = new Date(o.updated_at || o.created_at || 0).getTime();
          return ts >= thirtyDaysAgo;
        }));
      } catch (e) {}
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const cf = clientFilter.trim().toLowerCase();
    return docs.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (q && ![d.id, d.client_name, d.title, d.owner].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      if (cf) {
        const code = computeClientCode(d.client_name || "").toLowerCase();
        if (!String(d.client_name || "").toLowerCase().includes(cf) && !code.includes(cf)) return false;
      }
      if (dateFrom && (!d.doc_date || d.doc_date < dateFrom)) return false;
      if (dateTo   && (!d.doc_date || d.doc_date > dateTo))   return false;
      return true;
    });
  }, [docs, search, statusFilter, clientFilter, dateFrom, dateTo]);

  // Liste unique des clients présents dans les docs (pour autocomplete)
  const clientOptions = React.useMemo(() => {
    const set = new Set();
    docs.forEach((d) => { if (d.client_name) set.add(d.client_name); });
    return Array.from(set).sort();
  }, [docs]);

  // Map client_id / client_name → status (client | prospect) pour la liste.
  const clientStatusMap = React.useMemo(() => {
    const byId = {};
    const byName = {};
    (clients || []).forEach((c) => {
      const s = c.status === "client" ? "client" : "prospect";
      if (c.id)   byId[c.id] = s;
      if (c.name) byName[String(c.name).toLowerCase()] = s;
    });
    return { byId, byName };
  }, [clients]);

  const docKind = React.useCallback((d) => {
    // 1) client_id connu → status réel (client | prospect)
    if (d.client_id && clientStatusMap.byId[d.client_id]) return clientStatusMap.byId[d.client_id];
    // 2) match par raison sociale dans la table clients
    const nameKey = String(d.client_name || "").toLowerCase();
    if (nameKey && clientStatusMap.byName[nameKey]) return clientStatusMap.byName[nameKey];
    // 3) raison sociale renseignée mais inconnue de la table clients
    //    → prospect par défaut (créé à la volée depuis le devis, hors CRM)
    if (d.client_name && String(d.client_name).trim()) return "prospect";
    // 4) aucune info client → tiret
    return null;
  }, [clientStatusMap]);

  React.useEffect(() => { setStatusFilter("all"); }, [activeType]);

  // Compteurs par statut (pour les pills de filtre)
  const statusCounts = React.useMemo(() => {
    const c = { all: docs.length };
    docs.forEach((d) => { c[d.status] = (c[d.status] || 0) + 1; });
    return c;
  }, [docs]);

  const totals = React.useMemo(() => {
    const t = { count: filtered.length, ht: 0, ttc: 0, pending: 0 };
    filtered.forEach((d) => {
      t.ht += Number(d.total_ht) || 0;
      t.ttc += Number(d.total_ttc) || 0;
      if (d.status === "brouillon" || d.status === "envoye") t.pending++;
    });
    return t;
  }, [filtered]);

  // Création directe interdite pour tous les types autres que devis :
  // la commande client, la commande d'achat, le BL et la facture ne peuvent
  // exister que comme transformation d'un devis (ou d'un parent dans la chaîne).
  // → bascule automatiquement sur l'onglet Devis et ouvre un nouveau devis.
  const newDoc = async () => {
    if (activeType !== "devis") {
      const ok = confirm("On ne peut pas créer directement un(e) " + TYPES.find((t) => t.k === activeType).label.toLowerCase() + ".\n\nLa chaîne Sage impose de partir d'un devis :\n  Devis → Commande client → BL → Facture\n\nOuvrir un nouveau devis ?");
      if (!ok) return;
      setActiveType("devis");
      // Création différée le temps que l'onglet "Devis" soit actif
      setTimeout(async () => {
        try {
          const doc = await window.api.commercialDocs.create({
            type: "devis",
            title: "Devis — Nouveau",
            status: "brouillon",
            lines: [],
          });
          if (window.HubToast) window.HubToast.success("✓ " + doc.id + " créé");
          setEditing(doc);
          reload();
        } catch (e) {
          if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
        }
      }, 30);
      return;
    }
    try {
      const doc = await window.api.commercialDocs.create({
        type: "devis",
        title: "Devis — Nouveau",
        status: "brouillon",
        lines: [],
      });
      if (window.HubToast) window.HubToast.success("✓ " + doc.id + " créé");
      setEditing(doc);
      reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const openDoc = async (id) => {
    const full = await window.api.commercialDocs.getById(id);
    if (!full) return;
    // Bascule sur l'onglet correspondant pour cohérence avec la liste derrière
    if (full.type && full.type !== activeType) setActiveType(full.type);
    setEditing(full);
  };

  // URL params au chargement :
  //  - ?open=DEV-XXXX → ouvre le doc en éditeur
  //  - ?client=ACC-XXXX & ?opp=OPP-XXXX (sans ?open=) → crée un devis
  //    pré-rempli avec ce client et cette opportunité
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    const clientParam = params.get("client");
    const oppParam = params.get("opp");

    if (openId && !editing) {
      const prefix = openId.split("-")[0];
      const typeByPrefix = { DEV: "devis", BC: "commande", BL: "bl", FAC: "facture", CA: "commande_achat" };
      const matched = typeByPrefix[prefix];
      if (matched && matched !== activeType) setActiveType(matched);
      (async () => {
        try {
          const full = await window.api.commercialDocs.getById(openId);
          if (full) setEditing(full);
        } catch (e) {}
      })();
      return;
    }

    // Pas de ?open= mais ?client= ou ?opp= valides (non "undefined") → crée
    // un nouveau devis pré-rempli automatiquement.
    const validParam = (v) => v && v !== "undefined" && v !== "null";
    if ((validParam(clientParam) || validParam(oppParam)) && !editing) {
      (async () => {
        try {
          let opp = null;
          let client = null;
          if (validParam(oppParam) && window.api.opportunities && window.api.opportunities.getById) {
            try { opp = await window.api.opportunities.getById(oppParam); } catch (e) {}
          }
          const clientId = (validParam(clientParam) && clientParam) || (opp && opp.client_id) || null;
          if (clientId && window.api.clients && window.api.clients.getById) {
            try { client = await window.api.clients.getById(clientId); } catch (e) {}
          }
          const newDoc = await window.api.commercialDocs.create({
            type: "devis",
            status: "brouillon",
            client_id: clientId,
            client_name: (client && (client.name || client.raison_sociale)) || (opp && opp.client_name) || null,
            client_address: (client && client.address) || null,
            client_cp: (client && client.cp) || null,
            client_city: (client && client.city) || null,
            client_siren: (client && client.siren) || null,
            opportunity_id: (opp && (opp.id || opp.ref)) || (validParam(oppParam) ? oppParam : null),
            title: (opp && opp.name) ? ("Devis — " + opp.name) : "Devis — Nouveau",
            owner: (opp && opp.owner) || null,
            lines: [],
          });
          if (newDoc) {
            if (window.HubToast) window.HubToast.success("✓ " + newDoc.id + " créé — client" + (opp ? " et opportunité" : "") + " pré-remplis");
            setActiveType("devis");
            setEditing(newDoc);
            // Nettoie l'URL pour éviter une re-création au refresh
            try {
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, "", cleanUrl);
            } catch (e) {}
          }
        } catch (e) {
          if (window.HubToast) window.HubToast.error("Création devis : " + (e.message || e));
        }
      })();
    }
  }, []);

  const closeEditor = () => { setEditing(null); reload(); };

  // Format euro fr-FR : la virgule est le séparateur décimal légal, ne PAS la remplacer.
  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div style={cdStyles.frame}>
      {/* SIDEBAR */}
      <aside style={cdStyles.sidebar}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 18px", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eef1f5" }}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={cdStyles.logo}>H</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Gestion commerciale</div>
          </div>
        </a>

        <button onClick={newDoc} style={cdStyles.newBtn}>
          <span style={{ fontSize: 14 }}>+</span>
          <span>{TYPES.find((t) => t.k === activeType).newLabel}</span>
        </button>

        <div style={cdStyles.navLabel}>Documents</div>
        {TYPES.map((t) => (
          <div key={t.k} onClick={() => setActiveType(t.k)}
               style={{ ...cdStyles.navItem, ...(activeType === t.k ? cdStyles.navItemActive : {}) }}>
            <span style={{ width: 16, color: activeType === t.k ? t.color : "#94a3b8" }}>{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            <span style={cdStyles.navCount}>{activeType === t.k ? docs.length : ""}</span>
          </div>
        ))}

        <div style={cdStyles.navLabel}>Administration</div>
        <a href="/gestion-commerciale-admin" style={{ ...cdStyles.navItem, textDecoration: "none", color: "inherit" }}>
          <span style={{ width: 16, color: "#94a3b8" }}>⚙</span>
          <span>Catalogue & paramètres</span>
        </a>
      </aside>

      {/* MAIN */}
      <main style={cdStyles.main}>
        <header style={cdStyles.topbar}>
          <div>
            <h1 style={cdStyles.h1}>{TYPES.find((t) => t.k === activeType).label}</h1>
            <p style={cdStyles.sub}>{totals.count} document(s) · {fmtEUR(totals.ttc)} TTC · {totals.pending} en attente</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (réf, client, titre…)"
              style={cdStyles.searchInput}
            />
            <button onClick={newDoc} style={cdStyles.primaryBtn}>+ Nouveau</button>
          </div>
        </header>

        {/* KPIs */}
        <div style={cdStyles.kpiRow}>
          <KPI label="Total HT" value={fmtEUR(totals.ht)} color="#3730a3" />
          <KPI label="Total TTC" value={fmtEUR(totals.ttc)} color="#10b981" />
          <KPI label="En attente" value={totals.pending} color="#f59e0b" />
          <KPI label="Documents" value={totals.count} color="#0ea5e9" />
        </div>

        {/* FILTRES — pills statut + recherche client + dates, sur une seule ligne */}
        {docs.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { k: "all",        label: "Tous" },
                { k: "brouillon",  label: "Brouillons",  c: "#94a3b8" },
                { k: "envoye",     label: "Envoyés",     c: "#3b82f6" },
                activeType === "devis"   && { k: "accepte",    label: "Acceptés",    c: "#10b981" },
                activeType === "devis"   && { k: "refuse",     label: "Refusés",     c: "#dc2626" },
                { k: "transforme", label: "Transformés", c: "#7e22ce" },
                activeType === "bl"      && { k: "livre",      label: "Livrés",      c: "#f59e0b" },
                activeType === "facture" && { k: "paye",       label: "Payés",       c: "#065f46" },
                { k: "annule",     label: "Annulés",     c: "#475569" },
              ].filter(Boolean).map((s) => {
                const count = s.k === "all" ? statusCounts.all : (statusCounts[s.k] || 0);
                const active = statusFilter === s.k;
                if (s.k !== "all" && count === 0) return null;
                return (
                  <button key={s.k} onClick={() => setStatusFilter(s.k)}
                          style={{
                            padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            border: "1px solid " + (active ? (s.c || "#0f172a") : "#e2e8f0"),
                            background: active ? (s.c || "#0f172a") : "#fff",
                            color: active ? "#fff" : "#475569",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                          }}>
                    {s.label}
                    <span style={{ fontSize: 10, fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <span style={{ width: 1, height: 22, background: "#e2e8f0", margin: "0 2px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", minWidth: 220 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Client</span>
              <input
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                list="cdoc-clients-list"
                placeholder="raison sociale ou CLIxxx"
                style={{ border: 0, outline: "none", flex: 1, fontSize: 13, padding: "3px 4px", background: "transparent", minWidth: 0 }}
              />
              {clientFilter && (
                <button onClick={() => setClientFilter("")} title="Effacer" style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>×</button>
              )}
              <datalist id="cdoc-clients-list">
                {clientOptions.map((c) => <option key={c} value={c}>{computeClientCode(c)} — {c}</option>)}
              </datalist>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }} title="Plage glissante : 12 derniers mois par défaut">Date</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                     style={{ border: 0, outline: "none", fontSize: 12.5, padding: "3px 4px", background: "transparent", color: "#0f172a", fontVariantNumeric: "tabular-nums" }} />
              <span style={{ color: "#94a3b8", fontSize: 12 }}>→</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                     style={{ border: 0, outline: "none", fontSize: 12.5, padding: "3px 4px", background: "transparent", color: "#0f172a", fontVariantNumeric: "tabular-nums" }} />
              {(dateFrom !== DEFAULT_DATE_RANGE.from || dateTo !== DEFAULT_DATE_RANGE.to) && (
                <button onClick={() => { setDateFrom(DEFAULT_DATE_RANGE.from); setDateTo(DEFAULT_DATE_RANGE.to); }}
                        title="Revenir aux 12 derniers mois"
                        style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>↺</button>
              )}
            </div>
            {(clientFilter || dateFrom !== DEFAULT_DATE_RANGE.from || dateTo !== DEFAULT_DATE_RANGE.to) && (
              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* LISTE */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={cdStyles.empty}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Aucun {TYPES.find((t) => t.k === activeType).label.toLowerCase()} pour le moment</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Cliquez sur « + Nouveau » pour créer le premier.</div>
            <button onClick={newDoc} style={{ ...cdStyles.primaryBtn, marginTop: 14 }}>+ Créer le premier</button>
          </div>
        ) : (() => {
          // Le doc sélectionné pour le panneau de prévisualisation à droite.
          // Hover sur une ligne (avec petit délai) → met à jour previewDocId.
          const previewedDoc = (filtered || []).find((d) => d.id === previewDocId) || null;
          return (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ ...cdStyles.docList, flex: previewedDoc ? "1 1 0%" : 1, minWidth: 0 }}>
            <div style={cdStyles.tableHead}>
              <span style={{ flex: "0 0 130px" }}>Référence de la pièce</span>
              <span style={{ flex: "0 0 90px" }}>Code raison sociale</span>
              {!previewedDoc && <span style={{ flex: "0 0 170px" }}>Workflow</span>}
              <span style={{ flex: "0 0 110px", textAlign: "right" }}>Date de la pièce</span>
              <span style={{ flex: 1 }}>Nom de la raison sociale / Titre du devis</span>
              {!previewedDoc && <span style={{ flex: "0 0 90px" }}>Statut de la raison sociale</span>}
              <span style={{ flex: "0 0 120px", textAlign: "right" }}>Montant HT</span>
              {!previewedDoc && <span style={{ flex: "0 0 120px", textAlign: "right" }}>Montant TTC</span>}
              <span style={{ flex: "0 0 100px" }}>Statut de la pièce</span>
              <span style={{ flex: "0 0 60px" }}></span>
            </div>
            {filtered.map((d) => (
              <div key={d.id}
                   onMouseEnter={() => {
                     if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
                     previewTimerRef.current = setTimeout(() => setPreviewDocId(d.id), 180);
                   }}
                   onMouseLeave={() => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); }}>
                <DocRow doc={d} chain={buildChainFromAny(d)} statusMeta={STATUS_META} fmtEUR={fmtEUR} onOpen={openDoc} onReload={reload} kind={docKind(d)} compact={!!previewedDoc} />
              </div>
            ))}
          </div>
          {previewedDoc && (
            <DocPreviewPane doc={previewedDoc} chain={buildChainFromAny(previewedDoc)} fmtEUR={fmtEUR} onOpen={() => openDoc(previewedDoc.id)} onClose={() => setPreviewDocId(null)} kind={docKind(previewedDoc)} />
          )}
          </div>
          );
        })()}
      </main>

      {/* EDITOR MODAL */}
      {editing && (
        <CommercialDocEditor
          key={editing.id}
          doc={editing}
          clients={clients}
          opps={opps}
          chain={buildChainFromAny(editing)}
          onClose={closeEditor}
          onSaved={reload}
          onOpenDoc={openDoc}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// WorkflowBar — Visualisation du cycle Devis→Commande→BL→Facture
//                avec étape courante + portes de validation
// ─────────────────────────────────────────────────────────────────
const WorkflowBar = ({ doc, canTransform, chain, onOpenDoc }) => {
  const STEPS = [
    { k: "devis",    label: "Devis",           icon: "📄" },
    { k: "commande", label: "Commande client", icon: "📋" },
    { k: "bl",       label: "BL",              icon: "🚚" },
    { k: "facture",  label: "Facture",         icon: "💶" },
  ];
  const curIdx = STEPS.findIndex((s) => s.k === doc.type);
  const isLocked = doc.status === "transforme";
  // Étape "future" qui existe déjà en BDD (créée par cascade) → violet plein
  const hasDescendant = (k) => !!(chain && chain[k]);
  return (
    <div style={{ background: "linear-gradient(135deg, #f0f9ff, #eef2ff)", border: "1px solid #c7d2fe", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#3730a3", letterSpacing: 0.4, textTransform: "uppercase" }}>Workflow Sage</div>
        <div style={{ fontSize: 11, color: "#475569" }}>
          {isLocked ? "✓ Doc transformé — lignes & champs restent éditables" : canTransform.ok ? "✅ Transformation autorisée" : "⚠ Bloqué : " + canTransform.reason}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {STEPS.map((s, i) => {
          const isCurrent = i === curIdx;
          const isPast = i < curIdx;
          const isFuture = i > curIdx;
          const isCreated = isFuture && hasDescendant(s.k); // doc enfant déjà créé
          const child = chain && chain[s.k];
          // Si le doc courant a un doc aval créé dans la chaîne (facture pour
          // un BL, BL pour une commande, etc.) → on considère qu'il est
          // "validé / clos" : pastille verte au lieu d'indigo.
          const downstream = (chain && curIdx >= 0 && i < STEPS.length) ?
            STEPS.slice(curIdx + 1).some((stp) => chain[stp.k]) : false;
          const isCurrentClosed = isCurrent && downstream;
          return (
            <React.Fragment key={s.k}>
              <div
                onClick={() => {
                  // Pastille violette "CRÉÉ" cliquable → ouvre le doc enfant
                  // (commande client, BL ou facture déjà existant dans la chaîne).
                  if (isPast && chain && chain[s.k] && chain[s.k].id !== doc.id && onOpenDoc) {
                    onOpenDoc(chain[s.k].id);
                    return;
                  }
                  if (isCreated && child && child.id !== doc.id && onOpenDoc) {
                    onOpenDoc(child.id);
                  }
                }}
                title={isCreated && child ? "Ouvrir " + child.id
                       : isPast && chain && chain[s.k] ? "Ouvrir " + chain[s.k].id
                       : ""}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 7,
                  background: isCurrentClosed ? "#16a34a" : isCurrent ? "#3730a3" : isPast ? "#dcfce7" : isCreated ? "#7c3aed" : "#fff",
                  color: isCurrentClosed ? "#fff" : isCurrent ? "#fff" : isPast ? "#065f46" : isCreated ? "#fff" : "#94a3b8",
                  border: "1px solid " + (isCurrentClosed ? "#16a34a" : isCurrent ? "#3730a3" : isPast ? "#86efac" : isCreated ? "#7c3aed" : "#e2e8f0"),
                  boxShadow: isCurrentClosed ? "0 2px 6px rgba(22,163,74,0.35)" : isCreated ? "0 2px 6px rgba(124,58,237,0.35)" : "none",
                  cursor: (isCreated || (isPast && chain && chain[s.k] && chain[s.k].id !== doc.id)) ? "pointer" : "default",
                  fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{ flex: 1 }}>{s.label}</span>
                {isCurrent && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.25)", fontWeight: 700 }}>{isCurrentClosed ? "VALIDÉ" : (doc.status || "").toUpperCase()}</span>}
                {isPast && <span style={{ fontSize: 12 }}>✓</span>}
                {isCreated && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.25)", fontWeight: 700 }}>CRÉÉ</span>}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ fontSize: 14, color: isPast || isCreated ? "#10b981" : isCurrent && canTransform.ok ? "#10b981" : "#cbd5e1" }}>
                  {isPast || isCreated ? "→" : isCurrent && canTransform.ok ? "→" : "✕"}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
        💡 <strong>Règles de validation</strong> : un devis doit être <strong>Accepté</strong> pour être transformé en commande · une commande doit être <strong>Acceptée</strong> pour générer un BL · un BL doit être <strong>Livré</strong> pour produire une facture. Même après transformation, les <strong>lignes et champs restent éditables</strong> (ajout, modification, suppression d'articles autorisés).
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DocRow — Ligne de la liste avec menu d'actions rapides
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// DocPreviewPane — panneau de prévisualisation du doc survolé
// Affiché à droite de la liste quand previewDocId est défini.
// Charge les lignes via api.commercialDocs.getById (cache simple par id).
// ─────────────────────────────────────────────────────────────────
const DocPreviewPane = ({ doc, chain, fmtEUR, onOpen, onClose, kind }) => {
  const [fullDoc, setFullDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancel = false;
    setLoading(true);
    setFullDoc(null);
    (async () => {
      try {
        const f = await window.api.commercialDocs.getById(doc.id);
        if (!cancel) { setFullDoc(f); setLoading(false); }
      } catch (e) { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [doc.id]);

  const lines = (fullDoc && fullDoc.lines) || [];
  const fmtDate = (s) => {
    if (!s) return "—";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  };
  const TYPE_LABEL = { devis: "Devis", commande: "Commande client", bl: "Bon de livraison", facture: "Facture", commande_achat: "Commande fournisseur" };

  return (
    <div style={{ flex: "0 0 420px", maxWidth: 420, background: "#fff", border: "1px solid #eef1f5",
                  borderRadius: 12, padding: 0, position: "sticky", top: 16,
                  maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(15,23,42,0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderBottom: "1px solid #eef1f5",
                    background: "linear-gradient(180deg, #fafbfc 0%, #fff 100%)" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{TYPE_LABEL[doc.type] || doc.type}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#3730a3", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{doc.id}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onOpen} title="Ouvrir le doc en édition"
                  style={{ padding: "6px 10px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Ouvrir</button>
          <button onClick={onClose} title="Fermer l'aperçu"
                  style={{ width: 26, height: 26, background: "#f1f5f9", border: 0, borderRadius: 6, color: "#475569", fontSize: 14, cursor: "pointer" }}>×</button>
        </div>
      </div>

      {/* Bloc client */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Client</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.client_name || "— Non renseigné —"}</div>
            {kind && (
              <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", borderRadius: 999,
                             background: kind === "client" ? "#dcfce7" : "#fef3c7",
                             color: kind === "client" ? "#065f46" : "#78350f",
                             fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {kind === "client" ? "Client" : "Prospect"}
              </span>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</div>
            <div style={{ fontSize: 12.5, color: "#475569", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{fmtDate(doc.doc_date)}</div>
          </div>
        </div>
        {doc.title && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{doc.title}</div>}
      </div>

      {/* Workflow */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Workflow Sage</div>
        <WorkflowChain chain={chain} currentType={doc.type} />
      </div>

      {/* Lignes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
          Lignes {lines.length > 0 && <span style={{ fontSize: 10, color: "#cbd5e1", marginLeft: 4 }}>({lines.length})</span>}
        </div>
        {loading ? (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>Chargement…</div>
        ) : lines.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>Aucune ligne</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((l, i) => (
              <div key={l.id || i} style={{ padding: "6px 8px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {l.designation || "(sans désignation)"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtEUR(l.total_ht)}</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                  {l.ref && <span style={{ color: "#3730a3", fontWeight: 600 }}>{l.ref}</span>}
                  {l.ref && " · "}
                  {(Number(l.quantity) || 0)} {l.unit || "u"} × {fmtEUR(l.unit_price_ht)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totaux */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #eef1f5", background: "#fafbfc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
          <span>Total HT</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtEUR(doc.total_ht)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginTop: 3 }}>
          <span>TVA</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtEUR(doc.total_tva)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 6, paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
          <span>Total TTC</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtEUR(doc.total_ttc)}</span>
        </div>
      </div>
    </div>
  );
};

const DocRow = ({ doc, chain, statusMeta, fmtEUR, onOpen, onReload, kind, compact }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 });
  const menuRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const sm = statusMeta[doc.status] || statusMeta.brouillon;

  // Click outside : on attend la frame suivante pour ne pas catcher
  // le click qui vient d'ouvrir le menu (sinon il se referme aussitôt).
  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    const id = window.requestAnimationFrame(() => {
      document.addEventListener("mousedown", close);
    });
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("mousedown", close);
    };
  }, [menuOpen]);

  const stop = (e) => e.stopPropagation();

  const duplicate = async () => {
    try {
      const full = await window.api.commercialDocs.getById(doc.id);
      if (!full) throw new Error("Doc introuvable");
      const lines = (full.lines || []).map((l) => ({
        article_id: l.article_id, ref: l.ref, designation: l.designation, description: l.description,
        quantity: l.quantity, unit: l.unit, unit_price_ht: l.unit_price_ht,
        discount_pct: l.discount_pct, tva_rate: l.tva_rate,
        total_ht: l.total_ht, total_tva: l.total_tva, total_ttc: l.total_ttc,
        is_text_only: l.is_text_only,
      }));
      const copy = await window.api.commercialDocs.create({
        type: doc.type, status: "brouillon",
        client_id: full.client_id, client_name: full.client_name,
        client_address: full.client_address, client_cp: full.client_cp, client_city: full.client_city,
        client_siren: full.client_siren, client_tva: full.client_tva,
        contact_name: full.contact_name, contact_email: full.contact_email,
        project_id: full.project_id, opportunity_id: full.opportunity_id,
        title: "Copie de " + (full.title || full.id),
        notes: full.notes, payment_terms_id: full.payment_terms_id, owner: full.owner,
        lines,
      });
      if (window.HubToast) window.HubToast.success("✓ " + copy.id + " créé (copie)");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const quickStatus = async (status, label) => {
    try {
      const patch = { status };
      if (status === "paye") patch.paid_at = new Date().toISOString();
      if (status === "livre") patch.delivered_at = new Date().toISOString();
      await window.api.commercialDocs.update(doc.id, patch);
      if (window.HubToast) window.HubToast.success("✓ Statut → " + label);
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const downloadPdf = async () => {
    if (!window.HubCommercialPdf) {
      if (window.HubToast) window.HubToast.error("Module PDF non chargé — rechargez la page (F5)");
      else alert("Module PDF non chargé — rechargez la page");
      return;
    }
    try {
      await window.HubCommercialPdf.download(doc.id);
      // Log téléchargement (best-effort, ne bloque pas si la table n'existe pas)
      try {
        await window.api.commercialSends.log({
          doc_id: doc.id, doc_type: doc.type,
          channel: "download", status: "sent", provider: "browser",
        });
      } catch (e) {}
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur PDF : " + (e.message || e));
    }
  };

  const remove = async () => {
    if (!confirm("Supprimer " + doc.id + " ? (soft-delete)")) return;
    try {
      await window.api.commercialDocs.remove(doc.id);
      if (window.HubToast) window.HubToast.success("✓ " + doc.id + " supprimé");
      onReload && onReload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  // Typo unifiée Inter + tabular-nums pour les valeurs numériques (chiffres alignés
  // sans recourir à une police monospace cassante). Date formatée en jj/mm/aaaa.
  const fmtDate = (s) => {
    if (!s) return "";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  };
  const numStyle = { fontVariantNumeric: "tabular-nums" };

  return (
    <div onClick={() => onOpen(doc.id)} style={cdStyles.tableRow}>
      <span style={{ flex: "0 0 130px", fontSize: 12.5, color: "#3730a3", fontWeight: 600, ...numStyle }}>{doc.id}</span>
      <span style={{ flex: "0 0 90px" }}>
        {doc.client_name ? (
          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 5, background: "#eef2ff", color: "#3730a3", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>{computeClientCode(doc.client_name)}</span>
        ) : <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>}
      </span>
      {!compact && (
        <span style={{ flex: "0 0 170px" }}>
          <WorkflowChain chain={chain} currentType={doc.type} />
        </span>
      )}
      <span style={{ flex: "0 0 110px", textAlign: "right", fontSize: 12.5, color: "#475569", letterSpacing: 0, ...numStyle }}>{fmtDate(doc.doc_date)}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.client_name || "— Client non renseigné —"}</div>
        <div style={{ fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title || "(sans titre)"}</div>
      </span>
      {!compact && (
      <span style={{ flex: "0 0 90px" }}>
        {kind === "client" ? (
          <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, background: "#dcfce7", color: "#065f46", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Client</span>
        ) : kind === "prospect" ? (
          <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, background: "#fef3c7", color: "#78350f", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Prospect</span>
        ) : (
          <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>
        )}
      </span>
      )}
      <span style={{ flex: "0 0 120px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0f172a", ...numStyle }}>{fmtEUR(doc.total_ht)}</span>
      {!compact && <span style={{ flex: "0 0 120px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0f172a", ...numStyle }}>{fmtEUR(doc.total_ttc)}</span>}
      <span style={{ flex: "0 0 100px" }}>
        {(() => {
          // Statut de la pièce = étape d'après dans le workflow Sage.
          // Si doc déjà transformé ou final → on garde le statut courant.
          const NEXT_LBL = { devis:    { k: "À commander", c: "#a855f7", bg: "#f5efff" },
                             commande: { k: "À livrer",    c: "#ea580c", bg: "#fff7ed" },
                             bl:       { k: "À facturer",  c: "#10b981", bg: "#dcfce7" },
                             facture:  null };
          const stop = (doc.status === "annule" || doc.status === "refuse");
          if (stop) return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 600 }}>{sm.label}</span>;
          const next = NEXT_LBL[doc.type];
          if (!next) return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 600 }}>{sm.label}</span>;
          return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: next.bg, color: next.c, fontSize: 11, fontWeight: 700 }}>{next.k}</span>;
        })()}
      </span>
      <span style={{ flex: "0 0 60px", textAlign: "right" }}>
        <button ref={btnRef} onClick={(e) => {
          stop(e);
          // Calcule la position du menu en viewport (position fixed) pour
          // qu'il échappe à l'overflow:hidden du parent docList
          if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
          }
          setMenuOpen((v) => !v);
        }}
                style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "4px 10px", borderRadius: 4 }}
                title="Actions">⋯</button>
        {menuOpen && (
          <div ref={menuRef} onClick={stop} onMouseDown={stop} style={{ position: "fixed", top: menuPos.top, right: menuPos.right, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.18)", zIndex: 9999, minWidth: 220, padding: 4 }}>
            <MenuItem icon="👁" label="Aperçu PDF" onClick={async () => {
              setMenuOpen(false);
              if (!window.HubCommercialPdf) {
                if (window.HubToast) window.HubToast.error("Module PDF non chargé — rechargez la page");
                return;
              }
              try { await window.HubCommercialPdf.preview(doc.id); }
              catch (e) { if (window.HubToast) window.HubToast.error("Erreur PDF : " + (e.message || e)); }
            }} />
            <MenuItem icon="⇩" label="Télécharger PDF" onClick={() => { setMenuOpen(false); downloadPdf(); }} />
            <MenuDivider />
            <MenuItem icon="📋" label="Dupliquer" onClick={() => { setMenuOpen(false); duplicate(); }} />
            {doc.type === "devis" && doc.status !== "accepte" && (
              <MenuItem icon="✓" label="Marquer accepté" onClick={() => { setMenuOpen(false); quickStatus("accepte", "Accepté"); }} />
            )}
            {doc.type === "devis" && doc.status !== "refuse" && (
              <MenuItem icon="✕" label="Marquer refusé" onClick={() => { setMenuOpen(false); quickStatus("refuse", "Refusé"); }} />
            )}
            {doc.type === "facture" && doc.status !== "paye" && (
              <MenuItem icon="💶" label="Marquer payée" onClick={() => { setMenuOpen(false); quickStatus("paye", "Payée"); }} />
            )}
            {doc.type === "bl" && doc.status !== "livre" && (
              <MenuItem icon="🚚" label="Marquer livré" onClick={() => { setMenuOpen(false); quickStatus("livre", "Livré"); }} />
            )}
            <MenuDivider />
            <MenuItem icon="🗑" label="Supprimer" danger onClick={() => { setMenuOpen(false); remove(); }} />
          </div>
        )}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// WorkflowChain — Affiche l'état Devis→Commande→BL→Facture en mini-pills
// ─────────────────────────────────────────────────────────────────
const WorkflowChain = ({ chain, currentType }) => {
  const STEPS = [
    { k: "devis",    label: "D", title: "Devis",           color: "#3b82f6" },
    { k: "commande", label: "C", title: "Commande client", color: "#a855f7" },
    { k: "bl",       label: "B", title: "BL",              color: "#ea580c" },
    { k: "facture",  label: "F", title: "Facture",         color: "#10b981" },
  ];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {STEPS.map((s, i) => {
        const doc = chain && chain[s.k];
        const isCurrent = s.k === currentType;
        const exists = !!doc;
        const isPaid = exists && doc.status === "paye";
        const isLivre = exists && doc.status === "livre";
        const isAccepted = exists && doc.status === "accepte";
        const isTransforme = exists && doc.status === "transforme";
        const isCancelled = exists && (doc.status === "annule" || doc.status === "refuse");
        // Couleur : vert si validé/terminé, couleur stage si en cours, gris si pas créé
        const bg = !exists ? "#f1f5f9"
          : isCancelled ? "#fee2e2"
          : (isPaid || isLivre || isAccepted || isTransforme) ? s.color
          : s.color + "30";
        const color = !exists ? "#cbd5e1"
          : isCancelled ? "#991b1b"
          : (isPaid || isLivre || isAccepted || isTransforme) ? "#fff"
          : s.color;
        const border = isCurrent ? "2px solid #0f172a" : "1px solid " + (exists ? s.color : "#e2e8f0");
        const tooltip = exists
          ? s.title + " " + doc.id + " · " + doc.status
          : s.title + " — non créé";
        return (
          <React.Fragment key={s.k}>
            <span
              title={tooltip}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: 6,
                background: bg, color, border,
                fontSize: 10, fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >{s.label}</span>
            {i < STEPS.length - 1 && (
              <span style={{ fontSize: 10, color: chain && chain[STEPS[i + 1].k] ? "#10b981" : "#cbd5e1" }}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick}
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "7px 10px", border: 0, background: "transparent",
            fontSize: 12.5, color: danger ? "#dc2626" : "#0f172a", textAlign: "left",
            cursor: "pointer", borderRadius: 5,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = danger ? "#fee2e2" : "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    <span style={{ width: 16 }}>{icon}</span>{label}
  </button>
);
const MenuDivider = () => <div style={{ height: 1, background: "#eef1f5", margin: "2px 6px" }} />;

const KPI = ({ label, value, color }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: color || "#0f172a", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// EDITOR : édition d'un doc + ses lignes
// ─────────────────────────────────────────────────────────────────
const CommercialDocEditor = ({ doc, clients, opps, chain, onClose, onSaved, onOpenDoc }) => {
  const [d, setD] = React.useState(doc);
  const [articles, setArticles] = React.useState([]);
  const [tvaRates, setTvaRates] = React.useState([]);
  const [paymentTerms, setPaymentTerms] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = React.useState(false);

  const reloadSuppliers = React.useCallback(async () => {
    try { setSuppliers(await window.api.suppliers.list({ active: true }) || []); } catch (e) {}
  }, []);


  React.useEffect(() => {
    (async () => {
      try { setArticles(await window.api.commercialArticles.list({ active: true }) || []); } catch (e) {}
      try { setTvaRates(await window.api.commercialRefs.tvaRates() || []); } catch (e) {}
      try { setPaymentTerms(await window.api.commercialRefs.paymentTerms() || []); } catch (e) {}
      reloadSuppliers();
    })();
  }, [reloadSuppliers]);

  // Si on ouvre un doc existant avec un client mais sans contact rempli,
  // on récupère le contact principal pour pré-remplir contact_name + email
  React.useEffect(() => {
    if (!d.client_id) return;
    if (d.contact_name && d.contact_email) return;
    (async () => {
      try {
        const contacts = await window.api.contacts.list({ client_id: d.client_id });
        const principal = (contacts || []).find((ct) => ct.is_principal) || (contacts || [])[0];
        if (principal) {
          const fullName = [principal.prenom, principal.nom].filter(Boolean).join(" ").trim();
          setD((cur) => ({
            ...cur,
            contact_name: cur.contact_name || fullName || null,
            contact_email: cur.contact_email || principal.email || null,
          }));
        }
      } catch (e) {}
    })();
  }, [d.client_id]);

  const setField = (k, v) => setD((cur) => ({ ...cur, [k]: v }));

  const pickClient = async (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) { setField("client_id", null); return; }
    setD((cur) => ({
      ...cur,
      client_id: c.id,
      client_name: c.raison_sociale || c.name,
      client_address: c.adresse || c.address || "",
      client_cp: c.cp || c.code_postal || "",
      client_city: c.ville || c.city || "",
      client_siren: c.siren || "",
      client_tva: c.tva || c.tva_intracom || "",
    }));
    // Récupère le contact principal du client → pré-remplit contact_name + contact_email
    try {
      const contacts = await window.api.contacts.list({ client_id: c.id });
      const principal = (contacts || []).find((ct) => ct.is_principal) || (contacts || [])[0];
      if (principal) {
        const fullName = [principal.prenom, principal.nom].filter(Boolean).join(" ").trim();
        setD((cur) => ({
          ...cur,
          contact_name: fullName || cur.contact_name,
          contact_email: principal.email || cur.contact_email,
        }));
      }
    } catch (e) {
      // Fallback : si la fiche client a un contact_principal dans son data jsonb
      if (c.contact_principal) {
        const cp = c.contact_principal;
        const fullName = [cp.prenom, cp.nom].filter(Boolean).join(" ").trim();
        setD((cur) => ({
          ...cur,
          contact_name: fullName || cur.contact_name,
          contact_email: cp.email || cur.contact_email,
        }));
      }
    }
  };

  const addLine = (article) => {
    const line = article ? {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      article_id: article.id, ref: article.ref, designation: article.name,
      description: article.description || "",
      quantity: 1, unit: article.unit || "u",
      unit_price_ht: Number(article.price_ht) || 0,
      discount_pct: 0,
      tva_rate: Number(article.tva_rate) || 20,
      _new: true,
    } : {
      id: "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      designation: "",
      quantity: 1, unit: "u", unit_price_ht: 0, discount_pct: 0, tva_rate: 20,
      _new: true,
    };
    line.total_ht = line.quantity * line.unit_price_ht * (1 - line.discount_pct / 100);
    line.total_tva = line.total_ht * line.tva_rate / 100;
    line.total_ttc = line.total_ht + line.total_tva;
    setD((cur) => ({ ...cur, lines: [...(cur.lines || []), line] }));
  };

  const updateLineField = (idx, k, v) => {
    setD((cur) => {
      const lines = [...(cur.lines || [])];
      const l = { ...lines[idx], [k]: v };
      const qty = Number(l.quantity) || 0;
      const pu = Number(l.unit_price_ht) || 0;
      const disc = Number(l.discount_pct) || 0;
      const tvaR = Number(l.tva_rate) != null ? Number(l.tva_rate) : 20;
      l.total_ht = Math.round(qty * pu * (1 - disc / 100) * 100) / 100;
      l.total_tva = Math.round(l.total_ht * tvaR / 100 * 100) / 100;
      l.total_ttc = Math.round((l.total_ht + l.total_tva) * 100) / 100;
      lines[idx] = l;
      return { ...cur, lines };
    });
  };

  const removeLine = async (idx) => {
    const line = d.lines[idx];
    if (line && line.id && !String(line.id).startsWith("tmp_")) {
      try { await window.api.commercialDocs.removeLine(line.id); } catch (e) {}
    }
    setD((cur) => ({ ...cur, lines: cur.lines.filter((_, i) => i !== idx) }));
  };

  // Déplace une ligne d'un cran (delta = -1 monter / +1 descendre).
  // Met aussi à jour line.position pour cohérence avec la BDD ; la sauvegarde
  // effective survient au prochain Save (ou au Cascade).
  const moveLine = (idx, delta) => {
    setD((cur) => {
      const lines = [...(cur.lines || [])];
      const j = idx + delta;
      if (j < 0 || j >= lines.length) return cur;
      [lines[idx], lines[j]] = [lines[j], lines[idx]];
      lines.forEach((l, i) => { l.position = i + 1; });
      return { ...cur, lines };
    });
  };

  // Duplique la ligne juste en dessous. Le nouvel id est temporaire
  // (tmp_…), il sera créé en BDD au prochain Save.
  const duplicateLine = (idx) => {
    setD((cur) => {
      const lines = [...(cur.lines || [])];
      const src = lines[idx];
      if (!src) return cur;
      const clone = { ...src, id: "tmp_" + Math.random().toString(36).slice(2, 10) };
      lines.splice(idx + 1, 0, clone);
      lines.forEach((l, i) => { l.position = i + 1; });
      return { ...cur, lines };
    });
  };

  // Totaux calculés à la volée
  const totals = React.useMemo(() => {
    let ht = 0, tva = 0;
    (d.lines || []).forEach((l) => {
      if (l.is_text_only) return;
      ht += Number(l.total_ht) || 0;
      tva += Number(l.total_tva) || 0;
    });
    return { ht: Math.round(ht * 100) / 100, tva: Math.round(tva * 100) / 100, ttc: Math.round((ht + tva) * 100) / 100 };
  }, [d.lines]);

  // Synchronise la commande fournisseur (commande_achat) et le BL liés à
  // cette commande client. Appelée après chaque sauvegarde de la commande
  // pour garder les 3 docs alignés (lignes + totaux + titre + client).
  // Les lignes downstream ne sont touchées QUE si le BL/CA est toujours en
  // brouillon (sinon on respecte les modifications manuelles aval).
  // Recopie les lignes et totaux d'un doc source vers une liste de docs cibles
  // (commande client ↔ BL). Utilisé pour la synchro bidirectionnelle :
  //   - depuis la commande → BL (via syncCommandeDownstream)
  //   - depuis le BL → commande (via syncBLUpstream)
  // Les docs aval figés (livre / paye / transforme / annule / refuse) sont
  // sautés pour respecter les corrections manuelles.
  const syncLinesTo = async (targets, lines, patch, options = {}) => {
    for (const tgt of (targets || [])) {
      if (!tgt) continue;
      // Demande explicite : la dernière modification l'emporte sur l'autre
      // pièce, même si l'aval est déjà figé (Livré / Payé / Transformé).
      // L'utilisateur veut commande ↔ BL toujours strictement identiques.
      const tgtPatch = {
        total_ht: patch.total_ht,
        total_tva: patch.total_tva,
        total_ttc: patch.total_ttc,
      };
      if (options.copyClient) {
        tgtPatch.client_name    = patch.client_name;
        tgtPatch.client_address = patch.client_address;
        tgtPatch.client_cp      = patch.client_cp;
        tgtPatch.client_city    = patch.client_city;
        tgtPatch.client_siren   = patch.client_siren;
        tgtPatch.contact_name   = patch.contact_name;
        tgtPatch.contact_email  = patch.contact_email;
      }
      try { await window.api.commercialDocs.update(tgt.id, tgtPatch); } catch (e) { console.warn(e); }
      try {
        const fresh = await window.api.commercialDocs.getById(tgt.id);
        const existingLines = (fresh && fresh.lines) || [];
        for (const el of existingLines) {
          try { await window.api.commercialDocs.removeLine(el.id); } catch (e) {}
        }
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          const normalized = {
            article_id: l.article_id || null,
            ref: l.ref || null,
            designation: l.designation || "",
            description: l.description || null,
            quantity: Number(l.quantity) || 0,
            unit: l.unit || "u",
            unit_price_ht: Number(l.unit_price_ht) || 0,
            discount_pct: Number(l.discount_pct) || 0,
            tva_rate: Number(l.tva_rate) || 0,
            total_ht: Number(l.total_ht) || 0,
            total_tva: Number(l.total_tva) || 0,
            total_ttc: Number(l.total_ttc) || 0,
            is_text_only: !!l.is_text_only,
            position: i,
            manufacturer_ref: l.manufacturer_ref || null,
            purchase_price_indicative: l.purchase_price_indicative == null ? null : Number(l.purchase_price_indicative),
            supplier: l.supplier || null,
          };
          try { await window.api.commercialDocs.addLine(tgt.id, normalized); } catch (e) { console.warn(e); }
        }
      } catch (e) { console.warn("[syncLinesTo]", e); }
    }
  };

  // Sync commande client → BL (sens descendant — comportement historique).
  const syncCommandeDownstream = async (commande, lines, patch) => {
    if (!chain) return;
    await syncLinesTo([chain.bl].filter(Boolean), lines, patch, { copyClient: true });
  };

  // Sync BL → commande client (sens montant — nouveau).
  // Recopie les lignes/totaux du BL vers sa commande parente pour que les
  // modifications faites sur le BL (qté, prix…) se reflètent côté commande.
  const syncBLUpstream = async (bl, lines, patch) => {
    if (!chain || !chain.commande) return;
    if (chain.commande.id === bl.id) return;
    await syncLinesTo([chain.commande], lines, patch, { copyClient: false });
  };

  const save = async (options = {}) => {
    setSaving(true);
    try {
      // Normalisation : pas de string vide pour les FKs (sinon erreur Supabase)
      const cleanFK = (v) => (v && String(v).trim() ? v : null);
      const cleanDate = (v) => (v && String(v).trim() ? v : null);
      const numOrNull = (v) => { const n = Number(v); return isFinite(n) ? n : null; };

      // 1. Update du doc principal (hors lignes)
      const patch = {
        status: d.status,
        title: d.title || null,
        notes: d.notes || null,
        internal_notes: d.internal_notes || null,
        client_id: cleanFK(d.client_id),
        client_name: d.client_name || null,
        client_address: d.client_address || null,
        client_cp: d.client_cp || null,
        client_city: d.client_city || null,
        client_siren: d.client_siren || null,
        client_tva: d.client_tva || null,
        contact_name: d.contact_name || null,
        contact_email: d.contact_email || null,
        project_id: cleanFK(d.project_id),
        opportunity_id: cleanFK(d.opportunity_id),
        doc_date: cleanDate(d.doc_date) || new Date().toISOString().slice(0, 10),
        valid_until: cleanDate(d.valid_until),
        payment_due: cleanDate(d.payment_due),
        payment_terms_id: cleanFK(d.payment_terms_id),
        owner: d.owner || null,
        total_ht: numOrNull(totals.ht) || 0,
        total_tva: numOrNull(totals.tva) || 0,
        total_ttc: numOrNull(totals.ttc) || 0,
      };
      await window.api.commercialDocs.update(d.id, patch);

      // 2. Lignes : insère les nouvelles avec conversion Number + ré-hydrate les ids
      const updatedLines = [];
      for (let i = 0; i < (d.lines || []).length; i++) {
        const line = d.lines[i];
        // Totaux ligne recalculés ici aussi par sécurité (updateLine recalcule
        // côté serveur via merge, mais on les inclut dans le patch pour qu'ils
        // soient persistés même si la TVA ou la remise viennent de changer).
        const lQty  = Number(line.quantity) || 0;
        const lPu   = Number(line.unit_price_ht) || 0;
        const lDisc = Number(line.discount_pct) || 0;
        const lTva  = Number(line.tva_rate) || 0;
        const lTotalHt  = Math.round(lQty * lPu * (1 - lDisc / 100) * 100) / 100;
        const lTotalTva = Math.round(lTotalHt * lTva / 100 * 100) / 100;
        const lTotalTtc = Math.round((lTotalHt + lTotalTva) * 100) / 100;
        const normalizedLine = {
          article_id: cleanFK(line.article_id),
          ref: line.ref || null,
          designation: line.designation || "",
          description: line.description || null,
          quantity: lQty,
          unit: line.unit || "u",
          unit_price_ht: lPu,
          discount_pct: lDisc,
          tva_rate: lTva,
          total_ht: lTotalHt,
          total_tva: lTotalTva,
          total_ttc: lTotalTtc,
          is_text_only: !!line.is_text_only,
          position: i,
          // Champs internes (jamais sur PDF client)
          manufacturer_ref: line.manufacturer_ref || null,
          purchase_price_indicative: line.purchase_price_indicative == null ? null : Number(line.purchase_price_indicative),
          supplier: line.supplier || null,
        };
        if (line._new || String(line.id || "").startsWith("tmp_")) {
          const created = await window.api.commercialDocs.addLine(d.id, normalizedLine);
          if (created) updatedLines.push(created);
        } else {
          const updated = await window.api.commercialDocs.updateLine(line.id, normalizedLine);
          if (updated) updatedLines.push(updated); else updatedLines.push(line);
        }
      }
      // Met à jour le state local avec les vrais IDs (au cas où l'utilisateur ne ferme pas)
      setD((cur) => ({ ...cur, lines: updatedLines }));

      // 3. Si on vient de modifier une commande client : on synchronise la
      //    commande fournisseur (commande_achat) et le BL avec les mêmes
      //    lignes et totaux. La cohérence chaîne est tenue automatiquement.
      // Synchronisation bidirectionnelle commande client ↔ BL
      // (la dernière modification l'emporte, voir syncLinesTo).
      if (d.type === "commande") {
        try { await syncCommandeDownstream(d, updatedLines, patch); }
        catch (e) { console.warn("[commande → bl sync]", e); }
      } else if (d.type === "bl") {
        try { await syncBLUpstream(d, updatedLines, patch); }
        catch (e) { console.warn("[bl → commande sync]", e); }
      }

      if (window.HubToast) window.HubToast.success("✓ Document enregistré");
      onSaved && onSaved();
      // Après enregistrement on ferme l'éditeur et on reste sur la page
      // Gestion commerciale (l'utilisateur ne veut pas être renvoyé sur
      // /crm ou la fiche opportunité, même s'il est arrivé par un returnTo).
      if (!options.keepOpen) {
        onClose && onClose();
      }
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      throw e;
    }
    setSaving(false);
  };

  // ─── Portes de validation Sage : un doc ne peut passer à l'étape suivante
  //     que si son statut est conforme. Évite que brouillon→commande→BL→facture
  //     puisse se faire en chaîne sans aucune validation intermédiaire.
  const TRANSITION_REQ = {
    devis:    { next: "commande", requires: "accepte", reqLabel: "Accepté" },
    commande: { next: "bl",       requires: "accepte", reqLabel: "Accepté" },
    bl:       { next: "facture",  requires: "livre",   reqLabel: "Livré" },
  };

  const canTransform = (() => {
    const rule = TRANSITION_REQ[d.type];
    if (!rule) return { ok: false, hard: true, reason: "Aucune étape suivante (document final)" };
    if (d.status === "transforme") return { ok: false, hard: true, reason: "Ce document a déjà été transformé" };
    if (d.status === "refuse" || d.status === "annule") return { ok: false, hard: true, reason: "Document " + (d.status === "refuse" ? "refusé" : "annulé") + " — transformation impossible" };
    if (d.status !== rule.requires) {
      // Bloqué doux : statut peut être mis à jour automatiquement pour passer
      return { ok: false, hard: false, reason: "Statut requis : « " + rule.reqLabel + " ». Actuellement : « " + d.status + " »", needStatus: rule.requires, needStatusLbl: rule.reqLabel, nextType: rule.next };
    }
    return { ok: true, nextType: rule.next };
  })();

  const transformTo = async () => {
    // Si bloqué dur (déjà transformé/refusé/annulé) → on s'arrête
    if (!canTransform.ok && canTransform.hard) {
      if (window.HubToast) window.HubToast.error("Transformation refusée — " + canTransform.reason);
      else alert("Transformation refusée : " + canTransform.reason);
      return;
    }
    const next = canTransform.nextType;
    const labels = { commande: "bon de commande", bl: "bon de livraison", facture: "facture" };
    // Garde-fou : si le doc cible existe déjà dans la chaîne, on prévient
    // l'utilisateur au lieu de re-cascader (sinon doublons + données écrasées).
    const NEXT_LABEL_FR = { commande: "commande client", bl: "bon de livraison", facture: "facture" };
    if (chain && next && chain[next]) {
      const existingNext = chain[next];
      const existingBl   = chain.bl;
      const message = d.type === "devis" && existingNext && existingBl && existingNext.id !== existingBl.id
        ? "La commande client " + existingNext.id + " et le BL " + existingBl.id + " ont déjà été créés à partir de ce devis.\n\nIls sont accessibles depuis le bandeau « Devis figé » en haut de la fenêtre, ou via la chaîne du workflow Sage.\n\nAucune nouvelle pièce ne sera créée."
        : "Le " + NEXT_LABEL_FR[next] + " " + existingNext.id + " a déjà été créé à partir de ce document.\n\nIl est accessible depuis la pastille violette « CRÉÉ » du workflow Sage ou via le bandeau en haut.\n\nAucune nouvelle pièce ne sera créée.";
      if (window.HubModal) {
        await window.HubModal.confirm({
          title: "Transformation déjà effectuée",
          message,
          okLabel: "Ouvrir " + existingNext.id,
          okStyle: "primary",
          cancelLabel: "Fermer",
        }).then((ok) => { if (ok && onOpenDoc) onOpenDoc(existingNext.id); });
      } else {
        if (confirm(message + "\n\nOuvrir " + existingNext.id + " ?")) {
          if (onOpenDoc) onOpenDoc(existingNext.id);
        }
      }
      return;
    }
    // Cascade pour un devis : devis → commande client → BL en un seul clic.
    // Tous les docs intermédiaires sont marqués Accepté.
    if (d.type === "devis") {
      const needAcceptFirst = !canTransform.ok && !canTransform.hard;
      const steps = [
        needAcceptFirst ? { ico: "📄", txt: "Devis marqué Accepté" } : null,
        { ico: "📋", txt: "Commande client créée et marquée Acceptée" },
        { ico: "🚚", txt: "Bon de livraison créé" },
      ].filter(Boolean);
      const ok = window.HubModal
        ? await window.HubModal.confirm({
            title: "Cascader la chaîne Sage ?",
            message: (needAcceptFirst ? "Le devis est en « " + d.status + " ». Il sera d'abord passé en Accepté.\n\n" : "") +
                     "Les documents aval seront générés en chaîne :\n\n" +
                     steps.map((s) => "  " + s.ico + "  " + s.txt).join("\n"),
            okLabel: "Lancer la cascade",
            okStyle: "primary",
            cancelLabel: "Annuler",
          })
        : confirm(steps.map((s) => "• " + s.txt).join("\n"));
      if (!ok) return;
      try {
        if (needAcceptFirst) setField("status", canTransform.needStatus);
        await save({ keepOpen: true });
        if (d.status !== "accepte") await window.api.commercialDocs.update(d.id, { status: "accepte" });
        // 1. Devis → Commande client (Acceptée)
        const commande = await window.api.commercialDocs.transform(d.id, "commande");
        if (!commande) throw new Error("Échec création commande");
        await window.api.commercialDocs.update(commande.id, { status: "accepte" });
        // 2. Commande client → BL
        const bl = await window.api.commercialDocs.transform(commande.id, "bl");
        const created = [commande.id, bl && bl.id].filter(Boolean);
        if (window.HubToast) window.HubToast.success("✓ Cascade OK : " + created.join(" + "));
        onSaved && onSaved();
        onClose && onClose();
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur cascade : " + (e.message || e));
      }
      return;
    }
    const TYPE_LABEL = { devis: "devis", commande: "commande client", bl: "BL", facture: "facture" };
    const NEXT_LABEL = { commande: "commande client", bl: "bon de livraison", facture: "facture" };
    const STATUS_PRETTY = { brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", livre: "Livré", refuse: "Refusé", paye: "Payé" };
    // Cas "blocage doux" : on propose d'updater le statut puis de transformer.
    if (!canTransform.ok && !canTransform.hard) {
      const reqLbl = canTransform.needStatusLbl;
      const curLbl = STATUS_PRETTY[d.status] || d.status;
      const ok = window.HubModal
        ? await window.HubModal.confirm({
            title: "Transformer ce " + TYPE_LABEL[d.type] + " ?",
            message:
              "Statut actuel : « " + curLbl + " »\n" +
              "Statut requis pour la transformation : « " + reqLbl + " »\n\n" +
              "Cliquer « Lancer » :\n" +
              "  1. Bascule le statut sur « " + reqLbl + " »\n" +
              "  2. Crée le " + NEXT_LABEL[next] + "\n\n" +
              "Cliquer « Annuler » : aucun changement.",
            okLabel: "Lancer la transformation",
            okStyle: "primary",
            cancelLabel: "Annuler",
          })
        : confirm("Statut requis « " + reqLbl + " ». Continuer ?");
      if (!ok) return;
      try {
        setField("status", canTransform.needStatus);
        await save({ keepOpen: true });
        const child = await window.api.commercialDocs.transform(d.id, next);
        if (window.HubToast) window.HubToast.success("✓ Statut → " + reqLbl + " · " + child.id + " créé");
        onSaved && onSaved();
        onClose && onClose();
      } catch (e) {
        if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      }
      return;
    }
    // Cas nominal : statut OK
    const ok = window.HubModal
      ? await window.HubModal.confirm({
          title: "Transformer ce " + TYPE_LABEL[d.type] + " ?",
          message:
            "Statut actuel : « " + (STATUS_PRETTY[d.status] || d.status) + " »\n\n" +
            "Effets de la transformation :\n" +
            "  • Un nouveau " + NEXT_LABEL[next] + " sera créé en brouillon\n" +
            "  • Les lignes seront héritées du " + TYPE_LABEL[d.type] + "\n" +
            "  • Les modifications en cours seront sauvegardées avant",
          okLabel: "Lancer la transformation",
          okStyle: "primary",
          cancelLabel: "Annuler",
        })
      : confirm("Transformer en " + NEXT_LABEL[next] + " ?");
    if (!ok) return;
    try {
      await save({ keepOpen: true });
      const child = await window.api.commercialDocs.transform(d.id, next);
      if (window.HubToast) window.HubToast.success("✓ " + child.id + " créé · " + d.id + " figé en Transformé");
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div style={cdStyles.modalOverlay} onClick={onClose}>
      <div style={cdStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <header style={cdStyles.modalHead}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{d.type}</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.id}</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => { try { await save({ keepOpen: true }); if (window.HubCommercialPdf) await window.HubCommercialPdf.preview(d.id); } catch (e) {} }} style={cdStyles.ghostBtn} title="Génère le PDF et l'ouvre">👁 Aperçu PDF</button>
            <button onClick={async () => { try { await save({ keepOpen: true }); if (window.HubCommercialPdf) await window.HubCommercialPdf.download(d.id); try { await window.api.commercialSends.log({ doc_id: d.id, doc_type: d.type, channel: "download", status: "sent", provider: "browser" }); } catch (e) {} } catch (e) {} }} style={cdStyles.ghostBtn}>⇩ Télécharger PDF</button>
            <button onClick={async () => { try { await save({ keepOpen: true }); setSendOpen(true); } catch (e) {} }} style={cdStyles.ghostBtn}>✉ Envoyer</button>
            {(() => {
              // Masque le bouton "Transformer en X" dans 3 cas :
              //  - doc final (facture)
              //  - doc déjà transformé
              //  - le doc cible (commande / BL / facture) existe déjà dans la chaîne
              const NEXT_TYPE = { devis: "commande", commande: "bl", bl: "facture" };
              const nextType = NEXT_TYPE[d.type];
              const targetExists = nextType && chain && chain[nextType] && chain[nextType].id !== d.id;
              if (d.type === "facture" || d.status === "transforme" || targetExists) return null;
              return true;
            })() && (() => {
              // 2 états visuels : Cliquable (vert sur vert) · Hard-block (gris, désactivé)
              // Le soft-block (statut pas conforme) reste vert et cliquable :
              // le clic propose alors de basculer le statut automatiquement.
              const isHard = !canTransform.ok && canTransform.hard; // figé/annulé/refusé
              return (
                <button
                  onClick={transformTo}
                  disabled={isHard}
                  title={canTransform.ok ? "Transformer ce document à l'étape suivante"
                    : isHard ? "Bloqué : " + canTransform.reason
                    : "Cliquer pour basculer le statut sur « " + canTransform.needStatusLbl + " » et transformer"}
                  style={{
                    ...cdStyles.ghostBtn,
                    opacity: isHard ? 0.45 : 1,
                    cursor: isHard ? "not-allowed" : "pointer",
                    borderColor: isHard ? "#e2e8f0" : "#10b981",
                    color: isHard ? "#94a3b8" : "#065f46",
                    background: isHard ? "#fff" : "#ecfdf5",
                    fontWeight: 600,
                  }}
                >
                  {isHard ? "🔒 " : "✓ "}Transformer en {{ devis: "commande", commande: "BL", bl: "facture" }[d.type]}
                </button>
              );
            })()}
            {/* Bouton CASCADE supprimé : la transformation depuis un devis cascade
                automatiquement en Commande + BL via le bouton vert ci-dessus. */}
            {!(d.type === "devis" && (d.status === "accepte" || d.status === "transforme")) && (
              <button onClick={save} disabled={saving} style={cdStyles.primaryBtn}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
            )}
            <button onClick={onClose} style={cdStyles.closeBtn}>×</button>
          </div>
        </header>

        <div style={cdStyles.modalBody}>
          {/* WORKFLOW SAGE — fil de fer + validation gates */}
          <WorkflowBar doc={d} canTransform={canTransform} chain={chain} onOpenDoc={onOpenDoc} />

          {/* Lecture seule du devis dès qu'il a été accepté ou transformé.
              Les modifications doivent passer par la commande client ou le BL. */}
          {(() => {
            const isDevisFrozen = d.type === "devis" && (d.status === "accepte" || d.status === "transforme");
            if (!isDevisFrozen) return null;
            const cmd = chain && chain.commande;
            const bl = chain && chain.bl;
            return (
              <div style={{ background: "linear-gradient(135deg, #fef3c7, #fed7aa)", border: "1px solid #fbbf24", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <span style={{ fontSize: 12.5, color: "#78350f", flex: 1, display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <strong>Devis figé</strong> — statut « {d.status === "accepte" ? "Accepté" : "Transformé"} ». Toute modification doit se faire sur :
                  {cmd && (
                    <button type="button" onClick={() => onOpenDoc && onOpenDoc(cmd.id)}
                            title={"Ouvrir " + cmd.id}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "3px 9px", border: "1px solid #a855f7",
                              background: "#a855f7", color: "#fff",
                              borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                              cursor: "pointer", boxShadow: "0 1px 3px rgba(168,85,247,0.35)",
                            }}>📋 Commande {cmd.id} →</button>
                  )}
                  {bl && (
                    <button type="button" onClick={() => onOpenDoc && onOpenDoc(bl.id)}
                            title={"Ouvrir " + bl.id}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "3px 9px", border: "1px solid #ea580c",
                              background: "#ea580c", color: "#fff",
                              borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                              cursor: "pointer", boxShadow: "0 1px 3px rgba(234,88,12,0.35)",
                            }}>🚚 BL {bl.id} →</button>
                  )}
                </span>
              </div>
            );
          })()}

          <fieldset disabled={d.type === "devis" && (d.status === "accepte" || d.status === "transforme")}
                    style={{ border: 0, padding: 0, margin: 0, minWidth: 0,
                             opacity: (d.type === "devis" && (d.status === "accepte" || d.status === "transforme")) ? 0.65 : 1,
                             pointerEvents: (d.type === "devis" && (d.status === "accepte" || d.status === "transforme")) ? "none" : "auto",
                             transition: "opacity 150ms" }}>
          {/* Bandeau informatif sur commande / BL / facture : le bloc en-tête
              (client, titre, dates, opp, statut, paiement) est figé car il
              provient des pièces amont. Les lignes sont éditables sur commande
              et BL uniquement ; sur facture elles sont aussi figées (voir
              fieldset englobant les lignes plus bas). */}
          {(d.type === "commande" || d.type === "bl" || d.type === "facture") && (
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "8px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#3730a3" }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span><strong>En-tête figé</strong> — les infos client, titre, dates, opportunité, statut et conditions de paiement sont héritées des pièces amont.{d.type === "facture" ? " La facture est elle aussi figée dans sa totalité." : " Seules les lignes (articles, qté, prix) sont modifiables ici."}</span>
            </div>
          )}

          {/* Bloc client + meta — figé pour commande, BL et facture */}
          <fieldset disabled={d.type === "commande" || d.type === "bl" || d.type === "facture"}
                    style={{ border: 0, padding: 0, margin: 0, minWidth: 0,
                             opacity: (d.type === "commande" || d.type === "bl" || d.type === "facture") ? 0.7 : 1,
                             pointerEvents: (d.type === "commande" || d.type === "bl" || d.type === "facture") ? "none" : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={cdStyles.lbl}>Client</label>
              <select value={d.client_id || ""} onChange={(e) => pickClient(e.target.value)} style={cdStyles.input}>
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.raison_sociale || c.name}</option>)}
              </select>
              <a
                href={"/nouveau-prospect?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search)}
                target="_blank"
                rel="noopener"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  marginTop: 6, padding: "6px 10px",
                  background: "#eef2ff", color: "#3730a3",
                  border: "1px solid #c7d2fe", borderRadius: 6,
                  fontSize: 11.5, fontWeight: 600, textDecoration: "none",
                  cursor: "pointer",
                }}
                title="Ouvrir la fiche de création de prospect dans un nouvel onglet"
              >+ Nouveau prospect</a>
              {d.client_address && (
                <div style={{ marginTop: 6, padding: 8, background: "#f8fafc", borderRadius: 6, fontSize: 11, color: "#475569" }}>
                  {d.client_address}<br/>{d.client_cp} {d.client_city}{d.client_siren ? " · SIREN " + d.client_siren : ""}
                </div>
              )}
            </div>
            <div>
              <label style={cdStyles.lbl}>Titre du document</label>
              <input value={d.title || ""} onChange={(e) => setField("title", e.target.value)} placeholder="Ex : Devis migration AD AXA" style={cdStyles.input} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <label style={cdStyles.lbl}>Date document</label>
                  <input type="date" value={d.doc_date || ""} onChange={(e) => setField("doc_date", e.target.value)} style={cdStyles.input} />
                </div>
                <div>
                  <label style={cdStyles.lbl}>{d.type === "devis" ? "Valide jusqu'au" : d.type === "facture" ? "Échéance paiement" : "Date prévue"}</label>
                  <input type="date" value={(d.type === "devis" ? d.valid_until : d.payment_due) || ""}
                         onChange={(e) => setField(d.type === "devis" ? "valid_until" : "payment_due", e.target.value)} style={cdStyles.input} />
                </div>
              </div>
            </div>
          </div>

          {/* Lien projet + statut + conditions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={cdStyles.lbl}>Rattacher à une opportunité (≤ 30 jours)</label>
              <select value={d.opportunity_id || ""} onChange={(e) => {
                const oppId = e.target.value || null;
                setField("opportunity_id", oppId);
                // Si on sélectionne une opp ET qu'aucun client n'est encore choisi,
                // on récupère le client de l'opp
                if (oppId && !d.client_id) {
                  const opp = opps.find((o) => o.id === oppId);
                  if (opp && opp.client_id) {
                    const c = clients.find((c) => c.id === opp.client_id);
                    if (c) pickClient(c.id);
                  }
                }
              }} style={cdStyles.input}>
                <option value="">— Aucune —</option>
                {opps.map((o) => {
                  const stages = { qualif: "Prospect", discovery: "Approche", propo: "Négociation", nego: "Conclusion" };
                  const stageLbl = stages[o.stage] || o.stage;
                  return <option key={o.id} value={o.id}>{o.name || o.id} · {o.client_name || "—"} ({stageLbl})</option>;
                })}
              </select>
              {opps.length === 0 ? (
                <div style={{ marginTop: 4, fontSize: 10.5, color: "#94a3b8" }}>Aucune opportunité ouverte des 30 derniers jours</div>
              ) : (
                <div style={{ marginTop: 4, fontSize: 10.5, color: "#94a3b8" }}>{opps.length} opp(s) récente(s) du pipeline ouvert</div>
              )}
            </div>
            <div>
              <label style={cdStyles.lbl}>Statut</label>
              {(() => {
                // Workflow Sage : statuts autorisés et transitions valides selon le type
                const STATUS_FLOW = {
                  devis:    ["brouillon", "envoye", "accepte", "refuse", "transforme", "annule"],
                  commande: ["brouillon", "envoye", "accepte", "refuse", "transforme", "annule"],
                  bl:       ["brouillon", "envoye", "livre", "transforme", "annule"],
                  facture:  ["brouillon", "envoye", "paye", "annule"],
                };
                const STATUS_LABEL = { brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé", transforme: "Transformé (figé)", livre: "Livré", paye: "Payé", annule: "Annulé" };
                const NEXT_TYPE = { devis: "commande", commande: "bl", bl: "facture" };
                const NEXT_NAME = { commande: "commande", bl: "BL", facture: "facture" };
                const allowed = STATUS_FLOW[d.type] || [];
                // Règle spéciale "Commande client" : reste modifiable tant qu'aucune
                // facture n'a été émise dans la chaîne (au-delà du simple BL).
                // Sinon : verrou dès que le doc enfant direct existe.
                const factureExists = chain && chain.facture && chain.facture.id !== d.id;
                const directChildExists = chain && NEXT_TYPE[d.type] && chain[NEXT_TYPE[d.type]] && chain[NEXT_TYPE[d.type]].id !== d.id;
                const childExists = d.type === "commande" ? factureExists : directChildExists;
                const childDoc = d.type === "commande"
                  ? (factureExists ? chain.facture : null)
                  : (directChildExists ? chain[NEXT_TYPE[d.type]] : null);
                const isTransformed = d.status === "transforme";
                // Verrou supplémentaire pour commande client / BL :
                // dès qu'au moins un article de la commande est passé au statut
                // "commande" (ou plus avancé : partielle / recu / en_stock) côté
                // fournisseur, on fige le doc → cohérence avec la commande
                // fournisseur déjà émise dans Stock & Catalogue.
                const ORDERED_PURCHASE_STATES = new Set(["commande", "partielle", "recu", "en_stock"]);
                const hasOrderedLine = (d.type === "commande" || d.type === "bl") &&
                  (d.lines || []).some((l) => l && ORDERED_PURCHASE_STATES.has(String(l.purchase_status || "").trim()));
                const orderedLine = hasOrderedLine
                  ? (d.lines || []).find((l) => l && ORDERED_PURCHASE_STATES.has(String(l.purchase_status || "").trim()))
                  : null;
                // Verrouillage dur si un doc enfant pertinent existe OU
                // si une ligne est passée en commande fournisseur.
                const isLocked = childExists || isTransformed || hasOrderedLine;
                return (
                  <div>
                    <select value={d.status}
                            disabled={isLocked}
                            onChange={(e) => {
                              const next = e.target.value;
                              if (isLocked && next !== d.status) {
                                if (!confirm("⚠ Ce document a déjà été transformé en " + NEXT_NAME[NEXT_TYPE[d.type]] + (childDoc ? " (" + childDoc.id + ")" : "") + ".\n\nLe statut est verrouillé pour préserver la cohérence avec le document enfant.\n\nUtilise le bouton « 🔓 Débloquer » si tu veux vraiment forcer un changement de statut.")) return;
                              }
                              setField("status", next);
                            }}
                            style={{
                              ...cdStyles.input,
                              background: isLocked ? "#fef3c7" : "#fff",
                              borderColor: isLocked ? "#f59e0b" : "#cbd5e1",
                              cursor: isLocked ? "not-allowed" : "pointer",
                              color: isLocked ? "#78350f" : "#0f172a",
                              fontWeight: isLocked ? 600 : 400,
                            }}>
                      {allowed.map((st) => <option key={st} value={st}>{STATUS_LABEL[st] || st}</option>)}
                    </select>
                    {isLocked && (
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10.5, color: "#b45309", fontWeight: 600 }}>
                          🔒 Verrouillé — {childExists ? NEXT_NAME[NEXT_TYPE[d.type]] + " " + childDoc.id + " déjà créé(e)" :
                                            hasOrderedLine ? "article(s) commandé(s) chez le fournisseur" + (orderedLine && orderedLine.designation ? " — " + orderedLine.designation : "") :
                                            "doc transformé"}
                        </span>
                        <button onClick={() => {
                          const msg = childExists
                            ? "Débloquer le statut du " + d.type + " ?\n\nLe document enfant " + childDoc.id + " (" + NEXT_NAME[NEXT_TYPE[d.type]] + ") reste actif. À toi de gérer la cohérence (annulation manuelle si besoin)."
                            : "Débloquer le statut « Transformé » et le repasser à « Accepté » ?";
                          if (!confirm(msg)) return;
                          if (isTransformed && !childExists) setField("status", "accepte");
                        }}
                        style={{ padding: "3px 8px", fontSize: 10.5, fontWeight: 600,
                                 background: "transparent", color: "#b45309", border: "1px solid #fcd34d",
                                 borderRadius: 5, cursor: "pointer" }}>
                          🔓 Débloquer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label style={cdStyles.lbl}>Conditions de paiement</label>
              <select value={d.payment_terms_id || ""} onChange={(e) => setField("payment_terms_id", e.target.value || null)} style={cdStyles.input}>
                <option value="">— Choisir —</option>
                {paymentTerms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          </fieldset>

          {/* LIGNES — carte par ligne, désignation pleine largeur en haut */}
          <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Lignes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(d.lines || []).length === 0 && (
              <div style={{ padding: 18, border: "1px dashed #cbd5e1", borderRadius: 8, textAlign: "center", color: "#94a3b8", fontSize: 12.5, background: "#fafbfc" }}>
                Aucune ligne pour le moment. Ajoute une ligne libre ou choisis dans le catalogue ci-dessous.
              </div>
            )}
            {(d.lines || []).map((l, i) => (
              <div key={l.id || i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                {/* Ligne 1 : numéro · n° article · désignation pleine largeur · total · suppr */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 6, background: "#eef2ff", color: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <input
                    value={l.ref || ""}
                    onChange={(e) => updateLineField(i, "ref", e.target.value)}
                    placeholder="N° Article"
                    title="Numéro / référence article — apparaît dans la colonne « Article » du PDF"
                    style={{ width: 140, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                             fontSize: 12, fontVariantNumeric: "tabular-nums", fontWeight: 600,
                             color: "#3730a3", textTransform: "uppercase", flexShrink: 0,
                             background: l.ref ? "#eef2ff" : "#fff" }}
                  />
                  <input
                    value={l.designation || ""}
                    onChange={(e) => updateLineField(i, "designation", e.target.value)}
                    placeholder="Désignation de la ligne (ex : Astorya Suite — Licence utilisateur)"
                    readOnly={!!l.article_id}
                    title={l.article_id ? "Désignation héritée du catalogue (réf : " + (l.ref || "—") + "). Pour la modifier, change l'article dans Catalogue & paramètres." : ""}
                    style={{ flex: 1, padding: "8px 10px",
                             border: "1px solid " + (l.article_id ? "#e2e8f0" : "#e2e8f0"),
                             borderRadius: 6, fontSize: 13, fontFamily: "inherit", fontWeight: 500,
                             color: l.article_id ? "#475569" : "#0f172a",
                             background: l.article_id ? "#fafbfc" : "#fff",
                             cursor: l.article_id ? "not-allowed" : "text" }}
                  />
                  <div style={{ minWidth: 130, textAlign: "right", padding: "8px 12px", background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 6 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 }}>Total HT</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{fmtEUR(l.total_ht)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                    <button onClick={() => moveLine(i, -1)} disabled={i === 0} title="Monter cette ligne"
                            style={{ width: 32, height: 15, background: "#fff", border: "1px solid #e2e8f0", color: i === 0 ? "#cbd5e1" : "#475569", fontSize: 10, cursor: i === 0 ? "not-allowed" : "pointer", borderRadius: "6px 6px 0 0", padding: 0, lineHeight: 1, fontWeight: 700 }}>▲</button>
                    <button onClick={() => moveLine(i, +1)} disabled={i === (d.lines || []).length - 1} title="Descendre cette ligne"
                            style={{ width: 32, height: 15, background: "#fff", border: "1px solid #e2e8f0", borderTop: 0, color: i === (d.lines || []).length - 1 ? "#cbd5e1" : "#475569", fontSize: 10, cursor: i === (d.lines || []).length - 1 ? "not-allowed" : "pointer", borderRadius: "0 0 6px 6px", padding: 0, lineHeight: 1, fontWeight: 700 }}>▼</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => removeLine(i)} title="Supprimer la ligne"
                            style={{ width: 32, height: 32, background: "#fff", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, cursor: "pointer", borderRadius: 6 }}>🗑</button>
                    <button onClick={() => duplicateLine(i)} title="Dupliquer la ligne en dessous"
                            style={{ width: 32, height: 32, background: "#fff", border: "1px solid #c7d2fe", color: "#3730a3", fontSize: 14, cursor: "pointer", borderRadius: 6 }}>⎘</button>
                  </div>
                </div>
                {/* Description (gauche) + Qté/Unité/Prix unitaire HT (droite).
                    TVA masquée (toujours 20 % par défaut, modifiable via le
                    paramétrage Société). */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, alignItems: "stretch" }}>
                  <div>
                    <label style={cdStyles.miniLbl}>📝 Description (champ libre)</label>
                    <RichDescriptionEditor
                      value={l.description || ""}
                      onChange={(html) => updateLineField(i, "description", html)}
                      placeholder="Ex. caractéristiques techniques, conditions, références produit…"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
                    <div>
                      <label style={cdStyles.miniLbl}>Qté</label>
                      <input type="number" step="0.001" value={l.quantity} onChange={(e) => updateLineField(i, "quantity", e.target.value)}
                             style={cdStyles.miniInput} />
                    </div>
                    <div>
                      <label style={cdStyles.miniLbl}>Unité</label>
                      <select value={l.unit || "u"} onChange={(e) => updateLineField(i, "unit", e.target.value)} style={cdStyles.miniInput}>
                        <option value="u">u (unité)</option>
                        <option value="h">h (heure)</option>
                        <option value="j">j (journée)</option>
                        <option value="mois">mois</option>
                        <option value="an">an</option>
                        <option value="forfait">forfait</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={cdStyles.miniLbl}>Prix unitaire HT</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" step="0.01" value={l.unit_price_ht} onChange={(e) => updateLineField(i, "unit_price_ht", e.target.value)}
                               style={{ ...cdStyles.miniInput, paddingRight: 26 }} />
                        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", pointerEvents: "none" }}>€</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Ligne 3 : INFOS INTERNES (non visibles sur le PDF client) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 180px", gap: 10, marginTop: 8,
                              padding: "8px 10px", background: "#fafbfc", borderRadius: 6, border: "1px dashed #e2e8f0" }}>
                  <div>
                    <label style={{ ...cdStyles.miniLbl, color: "#94a3b8" }}>
                      🔒 Référence constructeur <span style={{ fontSize: 9, fontWeight: 500, fontStyle: "italic" }}>(interne — non imprimée)</span>
                    </label>
                    <input type="text" value={l.manufacturer_ref || ""}
                           onChange={(e) => updateLineField(i, "manufacturer_ref", e.target.value)}
                           placeholder="ex. HP-EB840-G11-A26S0EA"
                           style={{ ...cdStyles.miniInput, fontVariantNumeric: "tabular-nums", fontSize: 11.5 }} />
                  </div>
                  <div>
                    <label style={{ ...cdStyles.miniLbl, color: "#94a3b8" }}>
                      🔒 Fournisseur <span style={{ fontSize: 9, fontWeight: 500, fontStyle: "italic" }}>(interne)</span>
                    </label>
                    {window.HubSupplierCombo ? (
                      React.createElement(window.HubSupplierCombo, {
                        value: l.supplier || "",
                        suppliers: suppliers,
                        cellInput: { ...cdStyles.miniInput, fontSize: 12, fontWeight: 600 },
                        onChange: (v) => updateLineField(i, "supplier", v || null),
                        onSuppliersChanged: reloadSuppliers,
                        placeholder: "— Choisir —",
                      })
                    ) : (
                      <input type="text" value={l.supplier || ""}
                             onChange={(e) => updateLineField(i, "supplier", e.target.value || null)}
                             placeholder="ex. INMAC, LDLC PRO…"
                             style={cdStyles.miniInput} />
                    )}
                  </div>
                  <div>
                    <label style={{ ...cdStyles.miniLbl, color: "#94a3b8" }}>
                      🔒 Prix d'achat indicatif <span style={{ fontSize: 9, fontWeight: 500, fontStyle: "italic" }}>(interne)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input type="number" step="0.01"
                             value={l.purchase_price_indicative == null ? "" : l.purchase_price_indicative}
                             onChange={(e) => updateLineField(i, "purchase_price_indicative", e.target.value === "" ? null : Number(e.target.value))}
                             placeholder="ex. 850.00"
                             style={{ ...cdStyles.miniInput, paddingRight: 26, fontVariantNumeric: "tabular-nums" }} />
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", pointerEvents: "none" }}>€</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 8px", display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => addLine(null)} style={cdStyles.ghostBtn}>+ Ligne libre</button>
              <button onClick={() => setSmartSearchOpen(true)}
                      style={{ ...cdStyles.ghostBtn, color: "#3730a3", borderColor: "#c7d2fe", fontWeight: 600 }}
                      title="Recherche intelligente : catalogue + suggestion IA si rien trouvé">
                🔍 Rechercher un article…
              </button>
              <select onChange={(e) => { if (e.target.value) { addLine(articles.find((a) => a.id === e.target.value)); e.target.value = ""; } }} style={{ ...cdStyles.input, flex: 1 }}>
                <option value="">+ Ajouter article du catalogue…</option>
                {articles.map((a) => <option key={a.id} value={a.id}>{a.ref} — {a.name} ({fmtEUR(a.price_ht)})</option>)}
              </select>
            </div>
            {smartSearchOpen && (
              <SmartArticleSearchModal
                articles={articles}
                onAdd={(art) => { addLine(art); setSmartSearchOpen(false); }}
                onCreated={async () => { setSmartSearchOpen(false); try { setArticles(await window.api.commercialArticles.list({ active: true })); } catch (e) {} }}
                onClose={() => setSmartSearchOpen(false)}
              />
            )}
          </div>

          {/* TOTAUX */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 10, padding: 14, minWidth: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4 }}>
                <span>Total HT</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtEUR(totals.ht)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4 }}>
                <span>TVA</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtEUR(totals.tva)}</span>
              </div>
              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
                <span>Total TTC</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtEUR(totals.ttc)}</span>
              </div>
            </div>
          </div>

          {/* NOTE INTERNE — non imprimée sur le PDF client, propagée dans la
              cascade Devis → Commande → BL → Facture pour les techniciens.
              Stockée dans data.internal_notes (jsonb). */}
          <div style={{ marginTop: 18, padding: 14, background: "#fefce8",
                        border: "1.5px dashed #facc15", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#854d0e" }}>
                  Note interne — visible techniciens uniquement
                </div>
                <div style={{ fontSize: 10.5, color: "#a16207", marginTop: 1 }}>
                  Suit l'opportunité jusqu'à la livraison (devis → commande → BL → facture).
                  Jamais imprimée sur le PDF transmis au client.
                </div>
              </div>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4,
                             background: "#fff", color: "#a16207", fontWeight: 700,
                             border: "1px solid #fde68a" }}>NON IMPRIMÉE</span>
            </div>
            <textarea
              value={(d.data && d.data.internal_notes) || ""}
              onChange={(e) => setD({ ...d, data: { ...(d.data || {}), internal_notes: e.target.value } })}
              placeholder="Préciser le contexte technique : configurations spécifiques, accès admin, contraintes infra, points d'attention pour la pose, références internes, contacts techniques du client, etc."
              rows={5}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #fde68a",
                       borderRadius: 8, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif",
                       color: "#0f172a", background: "#fffef5", lineHeight: 1.5,
                       boxSizing: "border-box", resize: "vertical", outline: "none" }}
              spellCheck={false}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: "#a16207" }}>
              <span>{((d.data && d.data.internal_notes) || "").length} caractères</span>
              {d.parent_doc_id && (
                <span style={{ fontStyle: "italic" }}>Note héritée du document parent — modifiable</span>
              )}
            </div>
          </div>

          </fieldset>

          {/* HISTORIQUE ENVOIS (visible si déjà envoyé) — toujours consultable */}
          <DocSendHistory docId={d.id} />

        </div>
      </div>
      {sendOpen && <DocSendModal doc={d} onSave={save} onClose={() => setSendOpen(false)} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Historique des envois d'un doc (depuis commercial_doc_sends)
// ─────────────────────────────────────────────────────────────────
const DocSendHistory = ({ docId }) => {
  const [list, setList] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try { setList(await window.api.commercialSends.list({ doc_id: docId }) || []); } catch (e) {}
    })();
  }, [docId]);
  if (list.length === 0) return null;
  return (
    <div style={{ marginTop: 18, padding: 14, background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>✉ Historique des envois ({list.length})</div>
      {list.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: s.status === "sent" ? "#10b981" : s.status === "failed" ? "#dc2626" : "#94a3b8" }} />
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 11, color: "#64748b" }}>{new Date(s.sent_at).toLocaleString("fr-FR")}</span>
          <span style={{ flex: 1, color: "#0f172a" }}>{s.channel === "email" ? "✉ " + (s.recipient_email || "—") : s.channel === "download" ? "⇩ Téléchargement" : s.channel}</span>
          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: s.status === "sent" ? "#dcfce7" : "#f1f5f9", color: s.status === "sent" ? "#065f46" : "#475569", fontWeight: 600 }}>{s.status}</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>par {s.sent_by_name || "—"}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Modal "Envoyer le doc par email" — log dans commercial_doc_sends
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// SmartArticleSearchModal — recherche avancée d'article
// 1) Filtre live dans le catalogue local (commercial_articles)
// 2) Si aucun résultat → propose une recherche IA sur le web via
//    window.HubAi (s'il est branché) ou fallback message
// 3) L'utilisateur valide → ajoute la ligne, ou crée l'article en BDD
// ─────────────────────────────────────────────────────────────────
const SmartArticleSearchModal = ({ articles, onAdd, onCreated, onClose }) => {
  const [q, setQ] = React.useState("");
  const [aiSuggestion, setAiSuggestion] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Recherche locale avec scoring simple (tokens AND, désignation + ref)
  const matches = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const tokens = term.split(/\s+/).filter(Boolean);
    const scored = (articles || []).map((a) => {
      const haystack = [
        a.ref || "", a.name || "", a.designation || "",
        a.category || "", a.description || "",
      ].join(" ").toLowerCase();
      let score = 0;
      let allMatched = true;
      for (const tok of tokens) {
        if (haystack.includes(tok)) { score += 1; if (haystack.startsWith(tok)) score += 0.5; }
        else allMatched = false;
      }
      return { a, score, allMatched };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => (y.allMatched - x.allMatched) || (y.score - x.score));
    return scored.slice(0, 15);
  }, [q, articles]);

  const runAiSearch = async () => {
    if (!q.trim()) return;
    setAiLoading(true); setAiError(null); setAiSuggestion(null);
    try {
      let result = null;
      if (window.HubAi && window.HubAi.suggestArticle) {
        result = await window.HubAi.suggestArticle(q.trim());
      } else if (window.api && window.api.ai && window.api.ai.searchArticle) {
        result = await window.api.ai.searchArticle(q.trim());
      } else {
        throw new Error("Module IA non branché — créez l'article manuellement avec les champs ci-dessous.");
      }
      if (result && typeof result === "object") {
        setAiSuggestion(result);
        setDraft({
          ref: result.ref || ("ART-" + Date.now().toString(36).slice(-5).toUpperCase()),
          designation: result.designation || result.name || q,
          category: result.category || "LOGICIEL",
          description: result.description || "",
          unit_price_ht: result.price_ht || result.unit_price_ht || 0,
          tva_rate: result.tva_rate || 20,
          unit: result.unit || "u",
          supplier: result.supplier || "",
          source_url: result.source_url || result.url || "",
        });
      }
    } catch (e) {
      setAiError(e.message || "Erreur IA");
      // Fallback : pré-remplit un draft manuel basé sur la requête
      setDraft({
        ref: "ART-" + Date.now().toString(36).slice(-5).toUpperCase(),
        designation: q,
        category: "LOGICIEL",
        description: "",
        unit_price_ht: 0,
        tva_rate: 20,
        unit: "u",
        supplier: "",
      });
    } finally { setAiLoading(false); }
  };

  const createArticle = async () => {
    if (!draft || !draft.designation) return;
    try {
      const created = await window.api.commercialArticles.create({
        ref: draft.ref,
        name: draft.designation,
        designation: draft.designation,
        category: draft.category,
        description: draft.description || null,
        unit_price_ht: Number(draft.unit_price_ht) || 0,
        price_ht: Number(draft.unit_price_ht) || 0,
        tva_rate: Number(draft.tva_rate) || 20,
        unit: draft.unit || "u",
        supplier: draft.supplier || null,
        active: true,
      });
      if (window.HubToast) window.HubToast.success("✓ Article " + (created.ref || draft.ref) + " créé");
      // Ajoute aussi la ligne directement
      onAdd({
        id: created.id, ref: created.ref, name: created.name, designation: created.designation || created.name,
        unit_price_ht: created.unit_price_ht || created.price_ht || 0, price_ht: created.price_ht || 0,
        tva_rate: created.tva_rate || 20, unit: created.unit || "u",
      });
      onCreated && onCreated();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Création échouée : " + (e.message || e));
    }
  };

  const fmtEUR = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10001, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 760, boxShadow: "0 20px 60px rgba(15,23,42,0.4)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 100px)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #eef1f5", background: "linear-gradient(180deg, #fafbfc 0%, #fff 100%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Recherche avancée</div>
            <h2 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Trouver ou créer un article</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: "#f1f5f9", border: 0, borderRadius: 8, color: "#475569", fontSize: 16, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#94a3b8" }}>🔍</span>
            <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setAiSuggestion(null); setAiError(null); setDraft(null); }}
                   onKeyDown={(e) => { if (e.key === "Enter" && matches.length === 0) runAiSearch(); }}
                   placeholder="Ex. licence office 365, écran 24 pouces, switch ubiquiti…"
                   style={{ width: "100%", padding: "12px 14px 12px 44px", border: "2px solid #c7d2fe", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Résultats catalogue */}
          {matches.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                ✓ {matches.length} article{matches.length > 1 ? "s" : ""} trouvé{matches.length > 1 ? "s" : ""} dans le catalogue
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {matches.map((m) => (
                  <button key={m.a.id} onClick={() => onAdd(m.a)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 100ms" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.a.designation || m.a.name || "(sans désignation)"}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        <span style={{ fontWeight: 600, color: "#3730a3" }}>{m.a.ref}</span>
                        {m.a.category && <span> · {m.a.category}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtEUR(m.a.unit_price_ht || m.a.price_ht)}</span>
                    <span style={{ fontSize: 13, color: "#3730a3", marginLeft: 4 }}>+</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q.trim() && matches.length === 0 && !aiSuggestion && !aiLoading && (
            <div style={{ padding: 22, background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#78350f", marginBottom: 12 }}>
                Aucun article ne correspond à <strong>« {q} »</strong> dans le catalogue.
              </div>
              <button onClick={runAiSearch} style={{ padding: "10px 18px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                🤖 Rechercher sur le web (IA) et créer l'article
              </button>
            </div>
          )}

          {aiLoading && (
            <div style={{ padding: 22, textAlign: "center", color: "#475569" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 13 }}>L'IA recherche « {q} » sur le web…</div>
            </div>
          )}

          {(aiSuggestion || (draft && aiError)) && draft && (
            <div style={{ padding: 16, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3730a3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                {aiError ? "⚠ Création manuelle" : "🤖 Proposition de l'IA"}
              </div>
              {aiError && <div style={{ fontSize: 11.5, color: "#9a3412", marginBottom: 10, fontStyle: "italic" }}>{aiError}</div>}
              {aiSuggestion && aiSuggestion.source_url && (
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                  Source : <a href={aiSuggestion.source_url} target="_blank" rel="noopener" style={{ color: "#3730a3" }}>{aiSuggestion.source_url}</a>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Désignation</label>
                  <input value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
                         style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Référence</label>
                  <input value={draft.ref} onChange={(e) => setDraft({ ...draft, ref: e.target.value })}
                         style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 13, fontFamily: "inherit", marginTop: 4, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Catégorie</label>
                  <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                         style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Prix HT (€)</label>
                  <input type="number" step="0.01" value={draft.unit_price_ht} onChange={(e) => setDraft({ ...draft, unit_price_ht: e.target.value })}
                         style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Fournisseur</label>
                  <input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
                         style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Description</label>
                  <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 12.5, marginTop: 4, boxSizing: "border-box", resize: "vertical" }} />
                </div>
              </div>
              <button onClick={createArticle}
                      style={{ marginTop: 14, padding: "10px 20px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✓ Créer l'article et l'ajouter à la ligne
              </button>
            </div>
          )}

          {!q.trim() && (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12.5 }}>
              💡 Tape un mot-clé pour rechercher dans le catalogue.<br/>
              Si rien n'est trouvé, l'IA proposera de créer l'article.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DocSendModal = ({ doc, onSave, onClose }) => {
  const [recipientEmail, setRecipientEmail] = React.useState(doc.contact_email || "");
  const [recipientName, setRecipientName] = React.useState(doc.contact_name || doc.client_name || "");
  const [cc, setCc] = React.useState("");
  const TYPE_LABEL = { devis: "Devis", commande: "Bon de commande", bl: "Bon de livraison", facture: "Facture" };
  const typeLbl = TYPE_LABEL[doc.type] || doc.type;
  const [subject, setSubject] = React.useState(typeLbl + " " + doc.id + (doc.title ? " — " + doc.title : ""));
  const [body, setBody] = React.useState(
    "Bonjour" + (recipientName ? " " + recipientName.split(" ")[0] : "") + ",\n\n" +
    "Veuillez trouver ci-joint le " + typeLbl.toLowerCase() + " " + doc.id + ".\n\n" +
    "N'hésitez pas à revenir vers moi pour toute question.\n\n" +
    "Cordialement,\n" + (doc.owner || "Romain Daviaud") + "\nAstorya"
  );
  const [sending, setSending] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiInstructions, setAiInstructions] = React.useState("");

  const send = async () => {
    if (!recipientEmail) { alert("Email destinataire requis"); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(recipientEmail)) { alert("Format email invalide : " + recipientEmail); return; }
    if (cc) {
      const ccList = cc.split(",").map((s) => s.trim()).filter(Boolean);
      const bad = ccList.find((e) => !emailRx.test(e));
      if (bad) { alert("Email CC invalide : " + bad); return; }
    }
    if (!doc.client_name) { if (!confirm("Le document n'a pas de client. Envoyer quand même ?")) return; }
    if ((doc.lines || []).length === 0) { if (!confirm("Le document n'a aucune ligne. Envoyer quand même ?")) return; }
    setSending(true);
    try {
      // Le doc a déjà été sauvé via save({keepOpen:true}) avant l'ouverture de cette modal
      let pdfBase64 = null;
      try {
        if (window.HubCommercialPdf) pdfBase64 = await window.HubCommercialPdf.toBase64(doc.id);
      } catch (e) { console.warn("PDF gen failed:", e); }

      // Téléchargement local du PDF (pour drag-drop manuel dans le mail)
      if (pdfBase64) {
        try {
          const a = document.createElement("a");
          a.href = "data:application/pdf;base64," + pdfBase64;
          a.download = doc.id + ".pdf";
          a.click();
        } catch (e) {}
      }

      // Ouvre Outlook (Web ou Desktop) avec subject/body pré-remplis
      // Office 365 deeplink — fonctionne aussi via le protocol handler outlook:
      // sur Windows si Outlook Desktop est installé.
      const bodyWithNote = body + "\n\n[Le PDF a été téléchargé localement — glissez-le en pièce jointe.]";
      const outlookUrl = "https://outlook.office.com/mail/deeplink/compose"
        + "?to=" + encodeURIComponent(recipientEmail)
        + (cc ? "&cc=" + encodeURIComponent(cc) : "")
        + "&subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(bodyWithNote);
      // Ouverture dans un nouvel onglet pour ne pas perdre le contexte Hub
      window.open(outlookUrl, "_blank", "noopener");

      // Log permanent en BDD
      await window.api.commercialSends.log({
        doc_id: doc.id, doc_type: doc.type,
        channel: "email",
        recipient_email: recipientEmail, recipient_name: recipientName,
        cc: cc || null, subject, body,
        attachment_url: pdfBase64 ? doc.id + ".pdf" : null,
        status: "sent",
        provider: "outlook_web",
      });

      // Met à jour le statut du doc → "envoye"
      if (doc.status === "brouillon") {
        try { await window.api.commercialDocs.update(doc.id, { status: "envoye" }); } catch (e) {}
      }

      if (window.HubToast) window.HubToast.success("✓ Envoi enregistré — PDF téléchargé pour pièce jointe");
      onClose && onClose();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
    setSending(false);
  };

  return (
    <div style={cdStyles.modalOverlay} onClick={onClose}>
      <div style={{ ...cdStyles.modalCard, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <header style={cdStyles.modalHead}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>✉ Envoyer {doc.id} par email</h2>
          <button onClick={onClose} style={cdStyles.closeBtn}>×</button>
        </header>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={cdStyles.lbl}>Destinataire (Nom)</label>
              <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={cdStyles.input} />
            </div>
            <div>
              <label style={cdStyles.lbl}>Destinataire (Email) *</label>
              <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} style={cdStyles.input} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={cdStyles.lbl}>Cc (copies)</label>
            <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="email1@ex.com, email2@ex.com" style={cdStyles.input} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={cdStyles.lbl}>Objet</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={cdStyles.input} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ ...cdStyles.lbl, marginBottom: 0 }}>Corps du message</label>
              <button
                onClick={async () => {
                  if (!window.HubAI) { alert("Assistant IA non chargé"); return; }
                  setAiLoading(true);
                  try {
                    // Récupère tous les docs liés à la même opp pour donner du contexte
                    let relatedDocs = [doc];
                    if (doc.opportunity_id) {
                      try {
                        const all = await window.api.commercialDocs.list({ opportunity_id: doc.opportunity_id });
                        relatedDocs = (all || []).filter((d) => d.status !== "annule" && d.status !== "refuse");
                        if (relatedDocs.length === 0) relatedDocs = [doc];
                      } catch (e) {}
                    }
                    const newBody = await window.HubAI.generateSalesMail({
                      client_name: doc.client_name,
                      contact_name: recipientName,
                      contact_title: doc.contact_title,
                      docs: relatedDocs.map((d) => ({ id: d.id, type: d.type, title: d.title, total_ttc: d.total_ttc, status: d.status })),
                      custom_notes: aiInstructions,
                    });
                    if (newBody && newBody.trim()) setBody(newBody.trim());
                    if (window.HubToast) window.HubToast.success("✓ Mail rédigé par Claude IA");
                  } catch (e) {
                    if (window.HubToast) window.HubToast.error("Erreur IA : " + (e.message || e));
                    else alert("Erreur IA : " + (e.message || e));
                  }
                  setAiLoading(false);
                }}
                disabled={aiLoading}
                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: "#0f172a", color: "#fff", border: 0, borderRadius: 5, cursor: aiLoading ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                title="Génère un mail commercial structuré avec Claude IA en analysant tous les devis liés à la même opportunité"
              >🤖 {aiLoading ? "Rédaction…" : "Rédiger avec IA"}</button>
            </div>
            <input
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="Instructions IA (optionnel) : ex. mettre l'accent sur la sécurité, ton plus direct, mentionner l'urgence…"
              style={{ ...cdStyles.input, fontSize: 11.5, marginBottom: 6, padding: "6px 10px", background: "#fafbfc" }}
            />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} style={{ ...cdStyles.input, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ padding: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, fontSize: 11.5, color: "#92400e", marginBottom: 14 }}>
            ℹ Outlook s'ouvrira dans un nouvel onglet avec destinataire, objet et corps pré-remplis. Le PDF est téléchargé localement — glissez-le en pièce jointe dans la fenêtre Outlook. Chaque envoi est tracé en BDD pour audit permanent.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={cdStyles.ghostBtn}>Annuler</button>
            <button onClick={send} disabled={sending} style={cdStyles.primaryBtn}>{sending ? "Envoi…" : "✉ Ouvrir dans Outlook + Tracer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cdStyles = {
  frame: { display: "flex", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  sidebar: { width: 220, padding: "20px 16px", background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  // Couleur exacte de la tuile Accueil "Devis & Factures" : bg orange clair + icône orange foncé
  logo: { width: 36, height: 36, borderRadius: 9, background: "#fef0e6", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" },
  newBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", margin: "14px 0 8px" },
  navLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 4, padding: "0 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" },

  main: { flex: 1, padding: "20px 28px", overflow: "auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" },
  sub: { margin: "3px 0 0", fontSize: 12, color: "#64748b" },
  searchInput: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 280, fontFamily: "inherit" },
  primaryBtn: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "7px 12px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" },

  kpiRow: { display: "flex", gap: 10, marginBottom: 16 },
  empty: { padding: 60, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, textAlign: "center" },

  docList: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" },
  tableHead: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: "#f8fafc", borderBottom: "1px solid #eef1f5", fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "none", letterSpacing: 0.1 },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 14px", gap: 10, borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" },
  modalCard: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 1500, boxShadow: "0 20px 60px rgba(15,23,42,0.4)", overflow: "hidden" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #eef1f5", background: "#fafbfc" },
  modalBody: { padding: 22, maxHeight: "calc(100vh - 140px)", overflowY: "auto" },

  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },

  miniLbl: { display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  miniInput: { width: "100%", padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", background: "#fff", boxSizing: "border-box" },
};
