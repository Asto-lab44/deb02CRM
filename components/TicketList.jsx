// Écran 1 — Liste des tickets (vue utilisateur final, helpdesk IT interne)

const TicketList = () => {
  // ───── Hotline CTI : popup déclenchée par un appel entrant (simulé en démo,
  // brancher sur le webhook 3CX en prod). Cycle séquentiel des 4 scénarios.
  const [activeCall, setActiveCall] = React.useState(null);
  const [callIdx, setCallIdx] = React.useState(0);
  const [lastCreated, setLastCreated] = React.useState(null);
  const callers = (typeof window !== "undefined" && window.HOTLINE_DEMO_CALLERS) || [];
  const simulateCall = () => {
    if (!callers.length) return;
    setActiveCall(callers[callIdx % callers.length]);
    setCallIdx((i) => i + 1);
  };
  const handleCreateTicket = (ticket) => {
    setLastCreated(ticket);
    setTimeout(() => setLastCreated(null), 6000);
  };

  // ───── Création d'un nouveau ticket : ouvre la modale complète
  const [newTicketOpen, setNewTicketOpen] = React.useState(false);
  const openNewTicket = () => setNewTicketOpen(true);

  // ───── Sélection d'un ticket : ouvre la fiche détail
  const [selectedTicketId, setSelectedTicketId] = React.useState(null);
  const handleTicketCreated = (ticket) => {
    setLastCreated({
      ticketId: ticket.id,
      client: ticket.client_id || "—",
      subject: ticket.title || ticket.subject || "",
      localOnly: ticket._localOnly,
      reason: ticket._reason,
    });
    setTimeout(() => setLastCreated(null), 8000);
  };

  // ───── Données live depuis Supabase si configuré, sinon fallback inline
  const dataEnabled = typeof window !== "undefined" && window.HubData && window.HubData.enabled();
  const [liveTickets, setLiveTickets] = React.useState(null);
  React.useEffect(() => {
    if (!dataEnabled) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await window.HubData.fetchTickets({ limit: 50 });
      if (cancelled || error) return;
      // Transforme le shape Supabase → shape attendu par le rendu existant
      setLiveTickets((data || []).map(mapSupaTicket));
    };
    load();
    const off = window.HubData.subscribeChanges(load);
    return () => { cancelled = true; off && off(); };
  }, [dataEnabled]);

  const tickets = liveTickets || [
    { id: "REQ-1198", client: { name: "AXA Wealth France",    maintenance: "active",   contract: "Premium 24/7 · jusqu'au 28 fév. 2027" }, title: "Arrivée Lucas Bernard — création comptes & matériel", status: "open", prio: "haute", cat: "Gestion comptes RH · Onboarding", lifecycle: "onboarding", billable: true, billableNote: "Prestation hors contrat de maintenance — facturée 380 € HT", assignee: { name: "Équipe IT", team: "Pool" }, opened: "il y a 1 h", updated: "il y a 18 min", sla: { left: "2 j 06 h", risk: "ok" }, msgs: 2, unread: 1, hasAttach: false, isNew: true },
    { id: "REQ-1197", client: { name: "Crédit Agricole Sud",  maintenance: "none",     contract: "Aucun contrat actif — intervention facturable" }, title: "Départ Élise Chevalier — désactivation comptes & restitution", status: "in_progress", prio: "normale", cat: "Gestion comptes RH · Offboarding", lifecycle: "offboarding", billable: true, billableNote: "Prestation facturée 240 € HT (extinction AD + Microsoft 365 + restitution)", assignee: { name: "Sophie Aubry", team: "Sécurité" }, opened: "il y a 4 h", updated: "il y a 1 h", sla: { left: "4 h 12", risk: "warn" }, msgs: 3, unread: 0, hasAttach: true },
    { id: "INC-2841", client: { name: "MAIF Innovation",      maintenance: "active",   contract: "Premium 24/7 · jusqu'au 31 déc. 2026" }, title: "Imprimante 3e étage en erreur PCL", status: "in_progress", prio: "haute", cat: "Matériel · Imprimante", assignee: { name: "Karim Ben Salah", team: "Support N1" }, opened: "il y a 2 h", updated: "il y a 12 min", sla: { left: "3 h 48", risk: "ok" }, msgs: 4, unread: 2, hasAttach: true },
    { id: "INC-2840", client: { name: "AXA Wealth France",    maintenance: "active",   contract: "Premium 24/7 · jusqu'au 28 fév. 2027" }, title: "Impossible d'accéder à SharePoint Direction", title2: "Erreur 403 depuis ce matin sur tous les navigateurs", status: "open", prio: "critique", cat: "Accès & Droits", assignee: null, opened: "il y a 28 min", updated: "il y a 9 min", sla: { left: "47 min", risk: "warn" }, msgs: 1, unread: 0, hasAttach: false, isNew: true, escalated: { to: "Léa Marchand", group: "Supervision", at: "il y a 14 min", reason: "Aucune réponse sous 15 min sur ticket critique — escalade automatique" } },
    { id: "REQ-1192", client: { name: "Crédit Agricole Sud",  maintenance: "none",     contract: "Aucun contrat actif — intervention facturable" }, title: "Demande d'installation d'AutoCAD 2025", status: "waiting", prio: "normale", cat: "Logiciel · Installation", assignee: { name: "Léa Marchand", team: "Support N2" }, opened: "il y a 1 j", updated: "il y a 4 h", sla: { left: "1 j 02 h", risk: "ok" }, msgs: 6, unread: 0, hasAttach: true, waiting: "Validation manager" },
    { id: "INC-2837", client: { name: "AXA Wealth France",    maintenance: "active",   contract: "Premium 24/7 · jusqu'au 28 fév. 2027" }, title: "VPN se déconnecte toutes les 10 min", status: "in_progress", prio: "haute", cat: "Réseau · VPN", assignee: { name: "Tom Verdier", team: "Support N2" }, opened: "il y a 1 j", updated: "il y a 35 min", sla: { left: "00 h 22", risk: "danger" }, msgs: 11, unread: 1, hasAttach: true, escalated: { to: "Léa Marchand", group: "Supervision", at: "il y a 35 min", reason: "SLA résolution < 30 min — escalade manuelle par Tom Verdier" } },
    { id: "INC-2833", client: { name: "Allianz France",       maintenance: "expiring", contract: "Standard 9-18h · expire le 12 juil. 2026 (46 j)" }, title: "Outlook : pièces jointes >25 Mo bloquées", status: "in_progress", prio: "normale", cat: "Messagerie", assignee: { name: "Karim Ben Salah", team: "Support N1" }, opened: "il y a 2 j", updated: "hier", sla: { left: "5 h 10", risk: "ok" }, msgs: 3, unread: 0, hasAttach: false },
    { id: "REQ-1188", client: { name: "AXA Wealth France",    maintenance: "active",   contract: "Premium 24/7 · jusqu'au 28 fév. 2027" }, title: "Nouveau poste — onboarding Camille Dufour", status: "open", prio: "normale", cat: "Gestion comptes RH · Onboarding", lifecycle: "onboarding", billable: true, billableNote: "Prestation hors contrat — facturée 380 € HT", assignee: { name: "Équipe IT", team: "Pool" }, opened: "il y a 2 j", updated: "il y a 1 j", sla: { left: "2 j 04 h", risk: "ok" }, msgs: 2, unread: 0, hasAttach: false },
    { id: "INC-2829", client: { name: "BNP Paribas AM",       maintenance: "none",     contract: "Aucun contrat actif — intervention facturable" }, title: "Écran secondaire non détecté sur dock Dell", status: "resolved", prio: "basse", cat: "Matériel · Périphérique", assignee: { name: "Léa Marchand", team: "Support N2" }, opened: "il y a 3 j", updated: "il y a 6 h", sla: { left: "—", risk: "done" }, msgs: 8, unread: 0, hasAttach: true },
    { id: "INC-2826", client: { name: "La Banque Postale",    maintenance: "active",   contract: "Standard 9-18h · jusqu'au 30 sept. 2027" }, title: "Téléphonie Teams — micro saturé en réunion", status: "resolved", prio: "normale", cat: "Téléphonie", assignee: { name: "Tom Verdier", team: "Support N2" }, opened: "il y a 4 j", updated: "il y a 2 j", sla: { left: "—", risk: "done" }, msgs: 5, unread: 0, hasAttach: false },
    { id: "REQ-1180", client: { name: "AXA Wealth France",    maintenance: "active",   contract: "Premium 24/7 · jusqu'au 28 fév. 2027" }, title: "Accès lecture base RH pour audit interne", status: "closed", prio: "normale", cat: "Accès & Droits", assignee: { name: "Sophie Aubry", team: "Sécurité" }, opened: "il y a 6 j", updated: "il y a 3 j", sla: { left: "—", risk: "done" }, msgs: 14, unread: 0, hasAttach: true },
  ];

  // Indicateur visuel du contrat de maintenance parc IT — green/amber/red.
  const maintMeta = {
    active:   { color: "#10b981", soft: "#dcfce7", label: "Contrat actif",      icon: "●" },
    expiring: { color: "#f59e0b", soft: "#fef3c7", label: "Contrat expire",     icon: "●" },
    none:     { color: "#dc2626", soft: "#fee2e2", label: "Pas de contrat",     icon: "●" },
  };

  // Cycle de vie collaborateur — création/désactivation de comptes, facturable.
  const lifecycleMeta = {
    onboarding:  { icon: "👤+", label: "Arrivée",  color: "#0e7a55", soft: "#dcfce7", border: "#86efac" },
    offboarding: { icon: "👤−", label: "Départ",   color: "#7c2d12", soft: "#ffedd5", border: "#fdba74" },
  };
  const billableCount = tickets.filter((t) => t.billable).length;
  const onboardingCount = tickets.filter((t) => t.lifecycle === "onboarding").length;
  const offboardingCount = tickets.filter((t) => t.lifecycle === "offboarding").length;
  const escalatedCount = tickets.filter((t) => t.escalated).length;

  const statusMeta = {
    open:        { label: "Ouvert",     dot: "#3b82f6", soft: "#eff4ff", text: "#1d4ed8" },
    in_progress: { label: "En cours",   dot: "#a855f7", soft: "#f5efff", text: "#7e22ce" },
    waiting:     { label: "En attente", dot: "#f59e0b", soft: "#fff6e6", text: "#a65f00" },
    resolved:    { label: "Résolu",     dot: "#10b981", soft: "#e8f8f1", text: "#0e7a55" },
    closed:      { label: "Fermé",      dot: "#94a3b8", soft: "#f1f3f6", text: "#475569" },
  };
  const prioMeta = {
    critique: { label: "Critique", color: "#dc2626", soft: "#fdecec" },
    haute:    { label: "Haute",    color: "#ea580c", soft: "#fef0e6" },
    normale:  { label: "Normale",  color: "#475569", soft: "#eef1f5" },
    basse:    { label: "Basse",    color: "#64748b", soft: "#f1f3f6" },
  };
  const slaColor = { ok: "#10b981", warn: "#f59e0b", danger: "#dc2626", done: "#94a3b8" };

  // counts
  const counts = {
    all: tickets.length,
    mine: 4,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  const Avatar = ({ name, size = 22, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", É: "#a855f7", C: "#ef4444" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  return (
    <div style={tlStyles.frame}>
      {/* ───── SIDEBAR ───── */}
      <aside style={tlStyles.sidebar}>
        <div style={tlStyles.brandRow}>
          <div style={tlStyles.logo}>
            <div style={tlStyles.logoMark}>H</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Support IT interne</div>
          </div>
        </div>

        <button onClick={openNewTicket} style={tlStyles.newBtn}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          <span>Nouveau ticket</span>
          <span style={tlStyles.kbd}>N</span>
        </button>

        <div style={tlStyles.navSection}>
          <div style={tlStyles.navLabel}>Navigation</div>
          <a href="/" style={{ ...tlStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 14, color: "#94a3b8", fontSize: 11 }}>⌂</span>
            <span style={{ flex: 1 }}>Accueil</span>
          </a>
          <div style={{ ...tlStyles.navItem, ...tlStyles.navItemActive }}>
            <span style={{ width: 14, color: "#4f46e5", fontSize: 11 }}>▦</span>
            <span style={{ flex: 1 }}>Tous mes tickets</span>
            <span style={tlStyles.navCount}>{counts.all}</span>
          </div>
          <a href="/fiche-client" style={{ ...tlStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 14, color: "#94a3b8", fontSize: 11 }}>◉</span>
            <span style={{ flex: 1 }}>Fiche client</span>
          </a>
          <a href="/administration-utilisateurs" style={{ ...tlStyles.navItem, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 14, color: "#94a3b8", fontSize: 11 }}>⚙</span>
            <span style={{ flex: 1 }}>Administration</span>
          </a>
        </div>

        <div style={tlStyles.navSection}>
          <div style={tlStyles.navLabel}>Statuts</div>
          {[
            { k: "open",        label: "Ouverts",    c: counts.open },
            { k: "in_progress", label: "En cours",   c: counts.in_progress },
            { k: "waiting",     label: "En attente", c: counts.waiting },
            { k: "resolved",    label: "Résolus",    c: counts.resolved },
          ].map((n) => (
            <div key={n.k} style={tlStyles.navItem}>
              <span style={{ width: 14, display: "flex", alignItems: "center" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: statusMeta[n.k].dot }} />
              </span>
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={tlStyles.navCount}>{n.c}</span>
            </div>
          ))}
          <div style={tlStyles.navItem} title="Tickets escaladés au groupe Administrateur · Supervision">
            <span style={{ width: 14, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 800 }}>↑</span>
            </span>
            <span style={{ flex: 1 }}>Escaladés (supervision)</span>
            <span style={{ ...tlStyles.navCount, background: "#ede9fe", color: "#5b21b6", fontWeight: 700 }}>{escalatedCount}</span>
          </div>
        </div>

        <div style={tlStyles.navSection}>
          <div style={tlStyles.navLabel}>Cycle collaborateur</div>
          <div style={tlStyles.navItem}>
            <span style={{ width: 14, color: "#0e7a55", fontSize: 11, fontWeight: 700 }}>👤+</span>
            <span style={{ flex: 1 }}>Arrivées · onboarding</span>
            <span style={{ ...tlStyles.navCount, background: "#dcfce7", color: "#065f46" }}>{onboardingCount}</span>
          </div>
          <div style={tlStyles.navItem}>
            <span style={{ width: 14, color: "#7c2d12", fontSize: 11, fontWeight: 700 }}>👤−</span>
            <span style={{ flex: 1 }}>Départs · offboarding</span>
            <span style={{ ...tlStyles.navCount, background: "#ffedd5", color: "#7c2d12" }}>{offboardingCount}</span>
          </div>
          <div style={tlStyles.navItem}>
            <span style={{ width: 14, color: "#a16207", fontSize: 11 }}>€</span>
            <span style={{ flex: 1 }}>Prestations facturables</span>
            <span style={{ ...tlStyles.navCount, background: "#fef3c7", color: "#78350f" }}>{billableCount}</span>
          </div>
        </div>

        <div style={tlStyles.navSection}>
          <div style={tlStyles.navLabel}>Catégories</div>
          {[
            { label: "Matériel", c: 12 },
            { label: "Logiciel", c: 8 },
            { label: "Réseau & VPN", c: 5 },
            { label: "Accès & Droits", c: 7 },
            { label: "Messagerie", c: 3 },
          ].map((n) => (
            <div key={n.label} style={tlStyles.navItem}>
              <span style={{ width: 14, color: "#cbd5e1", fontSize: 12 }}>—</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={tlStyles.navCount}>{n.c}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={tlStyles.kbHint}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>Base de connaissances</div>
          <div style={{ fontSize: 11.5, color: "#0f172a", lineHeight: 1.4 }}>
            12 articles correspondent à vos tickets ouverts.
          </div>
          <a style={tlStyles.kbLink}>Consulter →</a>
        </div>

        <div style={tlStyles.userRow}>
          <Avatar name="Camille Dufour" size={26} color="#6366f1" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>Camille Dufour</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Direction Marketing</div>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>⋯</span>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={tlStyles.main}>
        {/* Topbar */}
        <header style={tlStyles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Support IT</div>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Mes tickets</div>
            <span style={tlStyles.totalChip}>{tickets.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={tlStyles.search}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>⌕</span>
              <input placeholder="Rechercher par sujet, ID, technicien…" style={tlStyles.searchInput} readOnly />
              <span style={tlStyles.kbdLight}>⌘K</span>
            </div>
            <button
              onClick={simulateCall}
              title="Déclenche la popup hotline (en prod : webhook 3CX)"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#0e7a55", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              <span style={{ fontSize: 12 }}>📞</span>
              Simuler appel entrant
              <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>{(callIdx % (callers.length || 1)) + 1}/{callers.length || 0}</span>
            </button>
            <button style={tlStyles.iconBtn} title="Notifications">
              <span style={{ fontSize: 13 }}>◔</span>
              <span style={tlStyles.notifDot} />
            </button>
            <button style={tlStyles.iconBtn} title="Aide">?</button>
          </div>
        </header>

        {lastCreated && (
          <div style={{
            margin: "10px 20px 0", padding: "10px 14px", borderRadius: 8, fontSize: 12.5,
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            background: lastCreated.localOnly ? "#fffbeb" : "#dcfce7",
            border: lastCreated.localOnly ? "1px solid #fde68a" : "1px solid #86efac",
            color: lastCreated.localOnly ? "#78350f" : "#065f46",
          }}>
            <span style={{ fontWeight: 700 }}>
              ✓ {lastCreated.attached ? "Retranscription ajoutée au ticket " + lastCreated.ticketId : "Ticket " + lastCreated.ticketId + " créé"}
            </span>
            <span style={{ opacity: 0.85 }}>
              {lastCreated.attached ? "(appel de " + lastCreated.client + ")" : "pour " + lastCreated.client + " — " + lastCreated.subject}
            </span>
            {lastCreated.localOnly && (
              <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, opacity: 0.9 }}>
                {lastCreated.reason === "rls" && "⚠ Local seulement — exécuter supabase/rls-anon.sql ou se connecter pour persister."}
                {lastCreated.reason === "no-schema" && "⚠ Tables Supabase manquantes — exécuter supabase/schema.sql."}
                {lastCreated.reason === "demo" && "⚠ Mode démo — Supabase non configuré."}
              </span>
            )}
          </div>
        )}

        {/* Title row */}
        <div style={tlStyles.titleRow}>
          <div>
            <h1 style={tlStyles.h1}>Mes tickets</h1>
            <p style={tlStyles.h1sub}>Suivez l'avancement de vos demandes auprès du support IT.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={tlStyles.ghostBtn}>Exporter</button>
            <button onClick={openNewTicket} style={tlStyles.primaryBtn}>+ Nouveau ticket</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={tlStyles.kpiStrip}>
          {[
            { label: "Ouverts", value: 2, delta: "+1 cette semaine", color: "#3b82f6" },
            { label: "En cours", value: 3, delta: "MTTR moyen 6 h 12", color: "#a855f7" },
            { label: "En attente de moi", value: 1, delta: "Validation manager", color: "#f59e0b" },
            { label: "SLA à risque", value: 1, delta: "INC-2837 — 22 min", color: "#dc2626" },
            { label: "Résolus 30 j", value: 18, delta: "CSAT 4,6 / 5", color: "#10b981" },
          ].map((k) => (
            <div key={k.label} style={tlStyles.kpi}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: k.color }} />
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: 0.2, textTransform: "uppercase" }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#0f172a", letterSpacing: -0.5 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={tlStyles.filterBar}>
          <div style={tlStyles.tabs}>
            {[
              { k: "all", label: "Tous", c: counts.all, active: true },
              { k: "open", label: "Ouverts", c: counts.open },
              { k: "in_progress", label: "En cours", c: counts.in_progress },
              { k: "waiting", label: "En attente", c: counts.waiting },
              { k: "resolved", label: "Résolus", c: counts.resolved },
              { k: "closed", label: "Fermés", c: 1 },
            ].map((t) => (
              <button key={t.k} style={{ ...tlStyles.tab, ...(t.active ? tlStyles.tabActive : {}) }}>
                {t.label}
                <span style={{ ...tlStyles.tabCount, ...(t.active ? tlStyles.tabCountActive : {}) }}>{t.c}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={tlStyles.filterPill}>+ Priorité</button>
            <button style={tlStyles.filterPill}>+ Catégorie</button>
            <button style={tlStyles.filterPill}>+ Assigné</button>
            <span style={tlStyles.divider} />
            <button style={tlStyles.filterPill}>↕ Dernière activité</button>
            <button style={tlStyles.filterPill} title="Vue">▦</button>
          </div>
        </div>

        {/* Table header */}
        <div style={tlStyles.tableHead}>
          <div style={{ ...tlStyles.col, width: 18 }}><input type="checkbox" readOnly /></div>
          <div style={{ ...tlStyles.col, width: 92 }}>Ref.</div>
          <div style={{ ...tlStyles.col, flex: 1 }}>Sujet</div>
          <div style={{ ...tlStyles.col, width: 110 }}>Statut</div>
          <div style={{ ...tlStyles.col, width: 92 }}>Priorité</div>
          <div style={{ ...tlStyles.col, width: 170 }}>Assigné à</div>
          <div style={{ ...tlStyles.col, width: 130 }}>SLA</div>
          <div style={{ ...tlStyles.col, width: 110, textAlign: "right" }}>Mise à jour</div>
        </div>

        {/* Rows */}
        <div style={tlStyles.rows}>
          {tickets.map((t, i) => {
            const sm = statusMeta[t.status];
            const pm = prioMeta[t.prio];
            const isHighlight = i === 3; // VPN row — SLA risk
            return (
              <div key={t.id}
                   onClick={(e) => {
                     // Ne pas ouvrir si on a cliqué sur une checkbox
                     if (e.target.tagName === "INPUT") return;
                     setSelectedTicketId(t.id);
                   }}
                   style={{ ...tlStyles.row, ...(isHighlight ? tlStyles.rowDanger : {}), cursor: "pointer" }}>
                <div style={{ ...tlStyles.col, width: 18 }}><input type="checkbox" readOnly /></div>
                <div style={{ ...tlStyles.col, width: 92 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {t.client && (() => {
                      const m = maintMeta[t.client.maintenance];
                      return (
                        <span title={`${t.client.name} — ${m.label} (${t.client.contract})`}
                              style={{ width: 8, height: 8, borderRadius: 999, background: m.color, boxShadow: `0 0 0 2px ${m.soft}`, flexShrink: 0, cursor: "help" }} />
                      );
                    })()}
                    <span style={tlStyles.refMono}>{t.id}</span>
                  </div>
                </div>
                <div style={{ ...tlStyles.col, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {t.isNew && <span style={tlStyles.newDot} title="Non lu" />}
                    {t.escalated && (
                      <span title={`Escaladé à ${t.escalated.to} (${t.escalated.group}) — ${t.escalated.at}\n${t.escalated.reason}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 800, color: "#fff", background: "#7c3aed", letterSpacing: 0.4, flexShrink: 0 }}>
                        ↑ ESCALADÉ
                      </span>
                    )}
                    {t.lifecycle && (() => {
                      const lm = lifecycleMeta[t.lifecycle];
                      return (
                        <span title={`Cycle collaborateur : ${lm.label} (création/désactivation de comptes)`}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 800, color: lm.color, background: lm.soft, border: `1px solid ${lm.border}`, letterSpacing: 0.3, flexShrink: 0 }}>
                          {lm.icon} {lm.label.toUpperCase()}
                        </span>
                      );
                    })()}
                    <span style={{
                      fontSize: 13,
                      fontWeight: t.unread ? 600 : 500,
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>{t.title}</span>
                    {t.hasAttach && <span style={tlStyles.metaIcon} title="Pièce jointe">📎</span>}
                    {t.unread > 0 && <span style={tlStyles.unread}>{t.unread}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {t.client && (
                      <span style={{ fontWeight: 600, color: "#475569" }}>{t.client.name}</span>
                    )}
                    {t.client && <span style={{ color: "#cbd5e1" }}>·</span>}
                    <span>{t.cat} · {t.msgs} message{t.msgs > 1 ? "s" : ""}</span>
                    {t.waiting && <span style={{ color: "#a65f00" }}>· ⏸ {t.waiting}</span>}
                  </div>
                </div>
                <div style={{ ...tlStyles.col, width: 110 }}>
                  <span style={{ ...tlStyles.statusPill, background: sm.soft, color: sm.text }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: sm.dot }} />
                    {sm.label}
                  </span>
                </div>
                <div style={{ ...tlStyles.col, width: 92 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                    <span style={{ ...tlStyles.prioPill, background: pm.soft, color: pm.color }}>
                      {t.prio === "critique" && "▲ "}
                      {t.prio === "haute" && "▲ "}
                      {pm.label}
                    </span>
                    {t.billable && (
                      <span title={t.billableNote || "Prestation facturable"}
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 4, fontSize: 9.5, fontWeight: 700, color: "#78350f", background: "#fef3c7", border: "1px solid #fde68a", letterSpacing: 0.3, cursor: "help" }}>
                        € FACTURABLE
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ ...tlStyles.col, width: 170 }}>
                  {t.assignee ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      <Avatar name={t.assignee.name} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.assignee.name}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{t.assignee.team}</div>
                      </div>
                    </div>
                  ) : (
                    <span style={tlStyles.unassigned}>○ Non assigné</span>
                  )}
                </div>
                <div style={{ ...tlStyles.col, width: 130 }}>
                  <SLA bar={t.sla} color={slaColor[t.sla.risk]} />
                </div>
                <div style={{ ...tlStyles.col, width: 110, textAlign: "right" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{t.updated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={tlStyles.foot}>
          <div style={{ fontSize: 12, color: "#64748b" }}>{tickets.length} tickets affichés sur 34 — chargement automatique au défilement</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={tlStyles.filterPill}>‹</button>
            <button style={{ ...tlStyles.filterPill, ...tlStyles.tabActive }}>1</button>
            <button style={tlStyles.filterPill}>2</button>
            <button style={tlStyles.filterPill}>3</button>
            <button style={tlStyles.filterPill}>4</button>
            <button style={tlStyles.filterPill}>›</button>
          </div>
        </div>
      </main>

      <HotlinePopup
        call={activeCall}
        onClose={() => setActiveCall(null)}
        onCreateTicket={handleCreateTicket}
      />

      <NewTicketModal
        open={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
        onCreated={(t) => {
          handleTicketCreated(t);
          // Ouvre la fiche détail du nouveau ticket immédiatement (si DB)
          if (!t._localOnly) setSelectedTicketId(t.id);
        }}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => {
          setSelectedTicketId(null);
          // Force refresh des tickets après fermeture
          if (window.HubData && window.HubData.invalidate) window.HubData.invalidate("tickets");
        }}
      />
    </div>
  );
};

const SLA = ({ bar, color }) => {
  if (bar.risk === "done") return <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>;
  const pct = bar.risk === "danger" ? 92 : bar.risk === "warn" ? 78 : 38;
  return (
    <div>
      <div style={{ fontSize: 12, color: color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.2 }}>{bar.left}</div>
      <div style={{ width: 96, height: 4, background: "#eef1f5", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
};

const tlStyles = {
  frame: { width: 1440, height: 900, display: "flex", background: "#fafbfc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#0f172a", overflow: "hidden" },

  // sidebar
  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "14px 12px", gap: 14 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 1px 2px rgba(67,56,202,0.3)" },
  logoMark: { color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 },
  newBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: -0.1 },
  kbd: { marginLeft: "auto", fontSize: 10.5, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.12)", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace" },

  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  navCount: { fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },

  kbHint: { padding: "10px 11px", border: "1px solid #eef1f5", borderRadius: 8, background: "linear-gradient(180deg, #fafbfc, #f5f7fa)" },
  kbLink: { fontSize: 11.5, color: "#4f46e5", fontWeight: 500, marginTop: 6, display: "inline-block", cursor: "pointer" },

  userRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", borderTop: "1px solid #eef1f5", marginTop: 4 },

  // main
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { height: 48, padding: "0 20px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  totalChip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace" },
  search: { display: "flex", alignItems: "center", gap: 8, width: 320, height: 30, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafbfc" },
  searchInput: { border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 12.5, color: "#0f172a", fontFamily: "inherit" },
  kbdLight: { fontSize: 10.5, padding: "1px 5px", borderRadius: 4, background: "#fff", border: "1px solid #e2e8f0", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" },
  iconBtn: { width: 30, height: 30, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", position: "relative", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 6, right: 7, width: 6, height: 6, background: "#ef4444", borderRadius: 999, border: "1.5px solid #fff" },

  titleRow: { padding: "20px 24px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  h1: { fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: "#0f172a" },
  h1sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 13px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  kpiStrip: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, padding: "4px 24px 16px" },
  kpi: { padding: "12px 14px", background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },

  filterBar: { padding: "10px 24px", borderTop: "1px solid #eef1f5", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  tabs: { display: "flex", gap: 2 },
  tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#0f172a", color: "#fff" },
  tabCount: { fontSize: 11, padding: "0 5px", borderRadius: 4, background: "#eef1f5", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" },
  tabCountActive: { background: "rgba(255,255,255,0.15)", color: "#cbd5e1" },

  filterPill: { padding: "5px 9px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  divider: { width: 1, height: 18, background: "#eef1f5", alignSelf: "center", margin: "0 4px" },

  tableHead: { display: "flex", alignItems: "center", padding: "8px 24px", borderBottom: "1px solid #eef1f5", background: "#fafbfc", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 },
  col: { padding: "0 8px" },

  rows: { flex: 1, overflow: "hidden" },
  row: { display: "flex", alignItems: "center", padding: "11px 24px", borderBottom: "1px solid #f1f5f9", background: "#fff", cursor: "pointer" },
  rowDanger: { background: "#fff8f7", borderLeft: "2px solid #dc2626", paddingLeft: 22 },

  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#475569", letterSpacing: -0.2 },
  newDot: { width: 7, height: 7, borderRadius: 999, background: "#4f46e5", flexShrink: 0 },
  metaIcon: { fontSize: 10.5, color: "#94a3b8" },
  unread: { fontSize: 10.5, padding: "1px 6px", borderRadius: 999, background: "#4f46e5", color: "#fff", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" },

  statusPill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 500 },
  prioPill: { display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, fontSize: 11.5, fontWeight: 600 },
  unassigned: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },

  foot: { padding: "10px 24px", borderTop: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
};

// Convertit un ticket lu depuis Supabase au format attendu par le rendu
// (lignes inline) pour ne pas avoir à refactorer tout le JSX d'un coup.
function mapSupaTicket(t) {
  const contract = (t.client && t.client.contracts && t.client.contracts[0]) || null;
  const fmtRel = (iso) => {
    if (!iso) return "—";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.round(diff/60)} min`;
    if (diff < 86400) return `il y a ${Math.round(diff/3600)} h`;
    if (diff < 86400*2) return "hier";
    return `il y a ${Math.round(diff/86400)} j`;
  };
  const slaLeft = (iso) => {
    if (!iso) return { left: "—", risk: "done" };
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    if (diff < 0) return { left: "Dépassé", risk: "danger" };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const risk = diff < 3600 ? "danger" : diff < 6 * 3600 ? "warn" : "ok";
    return { left: h >= 24 ? `${Math.floor(h/24)} j ${h%24} h` : `${String(h).padStart(2,'0')} h ${String(m).padStart(2,'0')}`, risk };
  };
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    prio: t.priority,
    cat: t.category,
    lifecycle: t.lifecycle,
    billable: t.billable,
    billableNote: t.billable_note,
    opened: fmtRel(t.opened_at),
    updated: fmtRel(t.updated_at),
    sla: slaLeft(t.sla_due_at),
    msgs: 0,
    unread: 0,
    hasAttach: false,
    client: t.client ? {
      name: t.client.name,
      maintenance: contract ? contract.status : "none",
      contract: contract ? `${contract.name} · jusqu'au ${new Date(contract.end_date).toLocaleDateString('fr-FR')}` : "Aucun contrat actif",
    } : null,
    assignee: t.assignee ? { name: t.assignee.name, team: t.assignee.team || t.assignee_team } : null,
    escalated: t.escalated_at ? {
      to: (t.escalated_to_user && t.escalated_to_user.name) || "Supervision",
      group: t.escalated_group || "Supervision",
      at: fmtRel(t.escalated_at),
      reason: t.escalated_reason || "",
    } : undefined,
  };
}

window.TicketList = TicketList;
