// Module Administration — Gestion utilisateurs, groupes et accès aux tuiles
// Les groupes et l'identité active sont persistés via window.HubAccess (localStorage).

const UserManagement = () => {
  // Lecture une seule fois au mount + un poll de 200ms pour récupérer la
  // session Supabase. Pas de subscribe → pas de risque de boucle.
  const HA = (typeof window !== "undefined" && window.HubAccess) ? window.HubAccess : null;
  const [persistedGroups, setPersistedGroups] = React.useState(() => (HA && HA.loadGroups && HA.loadGroups()) || []);
  const [activeGroupId, setActiveGroupId] = React.useState(() => (HA && HA.getActiveGroupId && HA.getActiveGroupId()) || "admin");
  const [currentUser, setCurrentUser] = React.useState(() => HA && HA.getCurrentUser ? HA.getCurrentUser() : null);
  React.useEffect(() => {
    if (!HA) return;
    const t = setTimeout(() => {
      const pg = HA.loadGroups && HA.loadGroups();
      const ag = HA.getActiveGroupId && HA.getActiveGroupId();
      const cu = HA.getCurrentUser && HA.getCurrentUser();
      if (pg) setPersistedGroups(pg);
      if (ag) setActiveGroupId(ag);
      if (cu) setCurrentUser(cu);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const [selectedGroupId, setSelectedGroupId] = React.useState(() => persistedGroups[0]?.id || "admin");
  const [activeTab, setActiveTab] = React.useState("groups");
  const [userSearch, setUserSearch] = React.useState("");
  const [userFilterStatus, setUserFilterStatus] = React.useState(""); // "" | "online" | "away" | "offline"
  const [userPage, setUserPage] = React.useState(1);
  const USER_PAGE_SIZE = 10;
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(null);
  const flashTimer = React.useRef(null);

  const flash = (text) => {
    setSavedFlash(text);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(null), 1800);
  };

  const updateGroupAccess = (groupId, mutator) => {
    const next = persistedGroups.map((g) => {
      if (g.id !== groupId) return g;
      const access = mutator(g.access);
      return { ...g, access };
    });
    // Met à jour le state React (sinon les toggles paraissent figés)
    // ET persiste via HubAccess (localStorage + Supabase)
    setPersistedGroups(next);
    window.HubAccess.saveGroups(next);
  };

  const toggleTile = (groupId, key) => {
    updateGroupAccess(groupId, (access) => {
      const set = new Set(access);
      if (set.has(key)) set.delete(key); else set.add(key);
      return Array.from(set);
    });
    flash("Accès mis à jour");
  };

  const Avatar = ({ name, size = 24, color }) => {
    if (!name) return null;
    const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
    const palette = { K: "#6366f1", L: "#0ea5e9", T: "#f59e0b", S: "#10b981", C: "#ef4444", M: "#a855f7", N: "#ec4899", E: "#14b8a6", A: "#dc2626", J: "#8b5cf6", P: "#0891b2", R: "#f97316", D: "#84cc16", F: "#4f46e5", H: "#475569", O: "#0e7a55", V: "#b45309" };
    const bg = color || palette[initials[0]] || "#64748b";
    return (
      <div style={{
        width: size, height: size, borderRadius: 999, background: bg, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, letterSpacing: 0.2, flexShrink: 0,
      }}>{initials}</div>
    );
  };

  // ───── modules ERP (mêmes clés que l'Accueil ERP)
  const modules = [
    { key: "crm",        cat: "Commercial",  title: "CRM",                           color: "#4f46e5", bg: "#eef2ff" },
    { key: "intel",      cat: "Commercial",  title: "Intelligence concurrentielle",  color: "#dc2626", bg: "#fdecec" },
    { key: "marketing",  cat: "Commercial",  title: "Marketing & Campagnes",         color: "#ec4899", bg: "#fdf2f8" },
    { key: "tech",       cat: "Production",  title: "Support technique",             color: "#0ea5e9", bg: "#e0f4fc" },
    { key: "projects",   cat: "Production",  title: "Projets & Livrables",           color: "#a855f7", bg: "#f5efff" },
    { key: "inventory",  cat: "Production",  title: "Stock & Catalogue",             color: "#0891b2", bg: "#cffafe" },
    { key: "contracts",  cat: "Finance",     title: "Contrats & abonnements",        color: "#4f46e5", bg: "#eef2ff" },
    { key: "accounting", cat: "Finance",     title: "Comptabilité",                  color: "#10b981", bg: "#e8f8f1" },
    { key: "billing",    cat: "Finance",     title: "Facturation & Devis",           color: "#f59e0b", bg: "#fef0e6" },
    { key: "treasury",   cat: "Finance",     title: "Trésorerie",                    color: "#0e7a55", bg: "#d1fae5" },
    { key: "hr",         cat: "RH",          title: "RH & Paie",                     color: "#8b5cf6", bg: "#f3e8ff" },
    { key: "time",       cat: "RH",          title: "Temps & Activités",             color: "#14b8a6", bg: "#ccfbf1" },
    { key: "reports",    cat: "Pilotage",    title: "Rapports & BI",                 color: "#3730a3", bg: "#e0e7ff" },
    { key: "settings",   cat: "Pilotage",    title: "Administration",                color: "#64748b", bg: "#f1f3f6" },
  ];
  const ALL = modules.map(m => m.key);
  const groups = persistedGroups;

  // ───── Utilisateurs : chargés depuis la table profiles Supabase
  // Fallback : tableau de 2 admins en dur si Supabase n'est pas configuré
  // ou si la table profiles est vide (premier RUN).
  const [users, setUsers] = React.useState([
    { name: "Romain Daviaud",  email: "achat@astorya.fr",   role: "Direction",  groups: ["admin", "direction", "commercial", "finance"], status: "online", last: "à l'instant" },
    { name: "Augustin Morin",  email: "a.morin@astorya.fr", role: "Direction",  groups: ["admin", "direction", "commercial"],            status: "online", last: "à l'instant" },
  ]);
  React.useEffect(() => {
    if (!window.HubData || !window.HubData.fetchProfiles) return;
    const reload = async () => {
      try {
        const { data } = await window.HubData.fetchProfiles();
        if (!data || !data.length) return; // garde le fallback hardcodé
        // Pour chaque profile, on lit ses groupes via profile_groups (jointure côté Supabase)
        const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
        let pg = [];
        if (supa) {
          const { data: pgData } = await supa.from("profile_groups").select("profile_id, group_id");
          pg = pgData || [];
        }
        const next = data.map((p) => ({
          id: p.id,
          name: p.name || p.email,
          email: p.email,
          role: p.role || "—",
          extension: p.extension_3cx || "",
          groups: pg.filter((x) => x.profile_id === p.id).map((x) => x.group_id),
          status: p.status === "active" ? "online" : (p.status === "inactive" ? "offline" : "away"),
          last: "—",
        }));
        setUsers(next);
      } catch (e) { console.warn("[UserManagement] fetchProfiles:", e); }
    };
    reload();
    if (window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const statusColor = { online: "#10b981", away: "#f59e0b", offline: "#cbd5e1" };
  const groupChip = (g) => (
    <span key={g.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: g.color + "15", color: g.color, border: `1px solid ${g.color}30` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: g.color }} />{g.name}
    </span>
  );

  const Toggle = ({ on }) => (
    <div style={{ width: 30, height: 18, borderRadius: 999, background: on ? "#4f46e5" : "#e2e8f0", position: "relative", flexShrink: 0, transition: "background 120ms" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 14 : 2, width: 14, height: 14, borderRadius: 999, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }} />
    </div>
  );

  const accessSet = new Set(selectedGroup.access);
  const grantedCount = accessSet.size;

  return (
    <div style={S.frame}>
      {/* ───── SIDEBAR ───── */}
      <aside style={S.sidebar}>
        <a href="/" title="Retour à l'accueil" style={{...S.brandRow, textDecoration: "none", color: "inherit", cursor: "pointer"}}>
          {window.HubModuleLogo ? React.createElement(window.HubModuleLogo, { size: 36 }) : <div style={S.logo}><div style={S.logoMark}>H</div></div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Administration</div>
          </div>
        </a>
        <button
          onClick={async () => {
            const email = window.HubModal
              ? await window.HubModal.prompt({ title: "Inviter un utilisateur", label: "Email professionnel", placeholder: "prenom.nom@astorya.fr", okLabel: "Envoyer l'invitation" })
              : prompt("Email du nouvel utilisateur Astorya :");
            if (!email || !email.trim()) return;
            const V = window.HubValidators;
            const err = V && V.email(email.trim());
            if (err) {
              alert("Email invalide : " + err.message);
              return;
            }
            if (!window.HubSupabase || !window.HubSupabase.enabled) {
              alert("Supabase non configuré — invitation impossible.");
              return;
            }
            // Envoie un magic link Supabase (signInWithOtp) — l'utilisateur
            // sera créé automatiquement à la première connexion via le
            // trigger handle_new_user (lui assigne le groupe admin).
            try {
              const { error } = await window.HubSupabase.client.auth.signInWithOtp({
                email: email.trim(),
                options: { emailRedirectTo: window.location.origin + "/bienvenue" },
              });
              if (error) {
                alert("Erreur d'envoi du lien d'invitation : " + error.message + "\n\nTu peux aussi créer le compte manuellement depuis le dashboard Supabase.");
                window.open("https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users", "_blank");
              } else {
                alert("✓ Lien d'invitation envoyé à " + email.trim() + ".\n\nL'utilisateur recevra un email avec un lien magique pour activer son compte et définir son mot de passe.");
              }
            } catch (e) {
              alert("Erreur réseau : " + (e.message || e));
            }
          }}
          style={{ ...S.newBtn, cursor: "pointer" }}
        >+ Inviter un utilisateur</button>

        <div style={S.navSection}>
          <div style={S.navLabel}>Navigation</div>
          <a href="/" style={{ ...S.navItem, textDecoration: "none", color: "inherit" }}><span style={S.bullet}>⌂</span><span style={{ flex: 1 }}>Accueil</span></a>
          <a href="/ticketing" style={{ ...S.navItem, textDecoration: "none", color: "inherit" }}><span style={S.bullet}>✎</span><span style={{ flex: 1 }}>Ticketing</span></a>
          <a href="/fiche-client" style={{ ...S.navItem, textDecoration: "none", color: "inherit" }}><span style={S.bullet}>◉</span><span style={{ flex: 1 }}>Fiche client</span></a>
          <a href="/crm" style={{ ...S.navItem, textDecoration: "none", color: "inherit" }}><span style={S.bullet}>▦</span><span style={{ flex: 1 }}>CRM</span></a>
        </div>

        <div style={S.navSection}>
          <div style={S.navLabel}>Administration</div>
          <div onClick={() => setActiveTab("groups")} style={{ ...S.navItem, ...(activeTab === "groups" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>◐</span><span style={{ flex: 1 }}>Groupes & accès</span><span style={{ ...S.navCount, ...(activeTab === "groups" ? { background: "#3730a3", color: "#fff" } : {}) }}>{groups.length}</span>
          </div>
          <div onClick={() => setActiveTab("users")} style={{ ...S.navItem, ...(activeTab === "users" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>◯</span><span style={{ flex: 1 }}>Utilisateurs</span><span style={{ ...S.navCount, ...(activeTab === "users" ? { background: "#3730a3", color: "#fff" } : {}) }}>{users.length}</span>
          </div>
          <div onClick={() => setActiveTab("invitations")} style={{ ...S.navItem, ...(activeTab === "invitations" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>◇</span><span style={{ flex: 1 }}>Invitations</span>
          </div>
          <div onClick={() => setActiveTab("templates")} style={{ ...S.navItem, ...(activeTab === "templates" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>📄</span><span style={{ flex: 1 }}>Modèles de contrat</span>
          </div>
          <div onClick={() => setActiveTab("integrations")} style={{ ...S.navItem, ...(activeTab === "integrations" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>🔌</span><span style={{ flex: 1 }}>Intégrations API</span>
          </div>
          <div onClick={() => setActiveTab("audit")} style={{ ...S.navItem, ...(activeTab === "audit" ? S.navItemActive : {}), cursor: "pointer" }}>
            <span style={S.bullet}>◨</span><span style={{ flex: 1 }}>Audit & journal</span>
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 11.5, color: "#475569" }}>
          <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>17 utilisateurs actifs</div>
          14 en ligne · 3 invitations en attente
        </div>

        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
            <Avatar name={currentUser.name} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.role}</div>
            </div>
            <button onClick={async () => {
              const ok = window.HubModal
                ? await window.HubModal.confirm({ title: "Se déconnecter ?", message: "Tu reviendras sur la page de connexion.", okLabel: "Déconnexion", okStyle: "danger" })
                : confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
              if (!ok) return;
              if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
              window.HubAccess.logout();
              window.location.href = "/login";
            }} title="Se déconnecter" style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 14, cursor: "pointer", padding: 4 }}>⏻</button>
          </div>
        ) : (
          <button onClick={() => setLoginOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 12px", borderRadius: 8, background: "#0f172a", border: 0, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            → Se connecter
          </button>
        )}
      </aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ───── MAIN ───── */}
      <main style={S.main}>
        {/* HEADER */}
        <header style={S.header}>
          <div>
            <div style={S.breadcrumb}>Administration <span style={{ opacity: .4, margin: "0 6px" }}>/</span> Groupes & accès</div>
            <div style={S.title}>Gestion des groupes</div>
            <div style={S.subtitle}>Définissez les modules ERP accessibles à chaque groupe. {users.length} utilisateurs répartis dans {groups.length} groupes.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, fontSize: 11.5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 }}>Vue Accueil ERP comme</span>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: activeGroup.color }} />
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{activeGroup.name}</span>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <a href="./" style={{ color: "#3730a3", fontWeight: 600, textDecoration: "none" }}>Ouvrir →</a>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={async () => {
                  if (!confirm("⚠ DANGER : Supprimer DÉFINITIVEMENT toutes les données métier ?\n\n• Tous les clients/prospects\n• Toutes les opportunités\n• Tous les contacts\n• Toutes les actions\n• Tous les contrats\n• Tous les devis / commandes / BL / factures + audit envois\n• Tous les projets + livrables + timeline\n• Lignes d'achat (Stock & Catalogue)\n• Compteurs de numérotation\n• localStorage entier\n\n(Les comptes Romain + Augustin restent dans Auth)")) return;
                  if (!confirm("Vraiment sûr ? Cette action est irréversible.")) return;
                  let report = [];
                  // Supabase — ordre IMPORTANT : enfants FK avant parents
                  if (window.HubSupabase && window.HubSupabase.enabled && window.HubSupabase.client) {
                    const s = window.HubSupabase.client;
                    const tables = [
                      // Commercial : lignes/audit avant docs
                      "commercial_doc_lines", "commercial_doc_sends", "commercial_doc_counters", "commercial_docs",
                      // Projets : items/events/team avant projets
                      "project_items", "project_events", "project_team", "projects",
                      // CRM core
                      "actions", "contacts", "contracts", "opportunities", "clients",
                    ];
                    for (const t of tables) {
                      try {
                        const { error } = await s.from(t).delete().not("id", "is", null);
                        if (error) {
                          // Table inexistante = on skip silencieusement (cas tables core jamais créées)
                          if (/relation .* does not exist|42P01/i.test(error.message)) {
                            report.push("⊘ " + t + " (table absente, skip)");
                          } else {
                            report.push("✗ " + t + " — " + error.message);
                          }
                        } else {
                          report.push("✓ " + t);
                        }
                      } catch (e) { report.push("✗ " + t + " — " + e.message); }
                    }
                  } else {
                    report.push("ℹ Supabase non configuré, skip");
                  }
                  // localStorage
                  try {
                    const keys = Object.keys(localStorage).filter((k) => k.startsWith("hubAstorya."));
                    keys.forEach((k) => localStorage.removeItem(k));
                    report.push("✓ localStorage : " + keys.length + " clés supprimées");
                  } catch (e) { report.push("✗ localStorage — " + e.message); }
                  alert("Reset terminé :\n\n" + report.join("\n"));
                  flash("✓ Base vidée");
                  setTimeout(() => { window.location.reload(); }, 500);
                }}
                style={{ ...S.btnGhost, borderColor: "#fecaca", color: "#dc2626", cursor: "pointer" }}
                title="Supprimer toutes les données métier — CRM, Gestion Commerciale, Projets, Stock & Catalogue"
              >🗑 Reset données</button>
              <button
                onClick={async () => {
                  if (!confirm("Supprimer TOUTES les opportunités ?\n\nCette action vide le dropdown « Rattacher à une opportunité » dans les devis.\n\nNe touche ni aux clients ni aux contacts.\nIrréversible.")) return;
                  try {
                    const res = await window.api.opportunities.purgeAll();
                    flash("✓ " + res.removed + " opportunité(s) supprimée(s)");
                    if (window.HubToast) window.HubToast.success("✓ " + res.removed + " opportunité(s) supprimée(s)");
                  } catch (e) {
                    if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
                  }
                }}
                style={{ ...S.btnGhost, borderColor: "#fed7aa", color: "#c2410c", cursor: "pointer" }}
                title="Vide le tableau opportunités (utile pour nettoyer les entrées test du dropdown Rattacher dans les devis)"
              >🧹 Purger opportunités</button>
              <button onClick={async () => {
                const ok = window.HubModal
                  ? await window.HubModal.confirm({ title: "Réinitialiser les groupes ?", message: "Tous les groupes et leurs accès aux modules ERP reviendront aux valeurs par défaut.", okLabel: "Réinitialiser", okStyle: "danger" })
                  : confirm("Réinitialiser tous les groupes et accès aux valeurs par défaut ?");
                if (ok) { window.HubAccess.resetAll(); flash("Réinitialisé"); }
              }} style={S.btnGhost}>⟲ Réinit. groupes</button>
              <a
                href="https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/providers"
                target="_blank"
                rel="noopener"
                style={{ ...S.btnGhost, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                title="Configurer SAML / OAuth / SSO dans Supabase"
              >🔗 Configurer SSO →</a>
              <button
                onClick={async () => {
                  const label = window.HubModal
                    ? await window.HubModal.prompt({ title: "Créer un groupe d'accès", label: "Nom du groupe", placeholder: "ex: Commercial DACH", okLabel: "Créer" })
                    : prompt("Nom du nouveau groupe :");
                  if (!label || !label.trim()) return;
                  const id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || ("group-" + Date.now());
                  if (persistedGroups.find((g) => g.id === id)) { alert("Un groupe avec cet identifiant existe déjà"); return; }
                  const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4899"];
                  const newGroup = {
                    id, label: label.trim(),
                    color: colors[persistedGroups.length % colors.length],
                    accessibleModules: [],
                    description: "Nouveau groupe créé manuellement",
                  };
                  const nextGroups = [...persistedGroups, newGroup];
                  setPersistedGroups(nextGroups);
                  window.HubAccess.saveGroups(nextGroups);
                  setSelectedGroupId(id);
                  flash("Groupe « " + label + " » créé");
                }}
                style={{ ...S.btnPrimary, cursor: "pointer" }}
              >+ Nouveau groupe</button>
            </div>
          </div>
        </header>

        {/* TABS */}
        <div style={S.tabsRow}>
          {[
            { k: "groups",      label: "Groupes",        badge: groups.length },
            { k: "users",       label: "Utilisateurs",   badge: users.length },
            { k: "invitations", label: "Invitations",    badge: 0 },
            { k: "audit",       label: "Journal d'audit" },
          ].map((t) => (
            <div
              key={t.k}
              onClick={() => setActiveTab(t.k)}
              style={{ ...S.tab, ...(activeTab === t.k ? S.tabActive : {}), cursor: "pointer" }}
            >
              {t.label}
              {t.badge != null && <span style={S.tabBadge}>{t.badge}</span>}
            </div>
          ))}
        </div>

        {/* GROUPES + DÉTAIL */}
        {activeTab === "groups" && <section style={S.splitRow}>
          {/* Liste des groupes */}
          <div style={S.groupsCol}>
            <div style={S.colHeader}>
              <span>Groupes</span>
              <input style={S.search} placeholder="Rechercher…" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {groups.map((g) => {
                const active = g.id === selectedGroup.id;
                const isViewer = g.id === activeGroup.id;
                return (
                  <div key={g.id} onClick={() => setSelectedGroupId(g.id)} style={{ ...S.groupItem, ...(active ? S.groupItemActive : {}) }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: g.color + "18", color: g.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{g.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: "#0f172a" }}>{g.name}</div>
                        {isViewer && <span style={{ fontSize: 9.5, fontWeight: 700, color: "#10b981", background: "#dcfce7", padding: "1px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.3 }}>Vue actuelle</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.members.length} membre{g.members.length > 1 ? "s" : ""} · {g.access.length}/{ALL.length} modules
                      </div>
                    </div>
                    <div style={{ display: "flex", marginLeft: 4 }}>
                      {g.members.slice(0, 3).map((m, i) => (
                        <div key={m} style={{ marginLeft: i === 0 ? 0 : -6, border: "1.5px solid #fff", borderRadius: 999 }}>
                          <Avatar name={m} size={20} />
                        </div>
                      ))}
                      {g.members.length > 3 && (
                        <div style={{ marginLeft: -6, width: 20, height: 20, borderRadius: 999, background: "#f1f5f9", border: "1.5px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, color: "#475569" }}>+{g.members.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Détail du groupe */}
          <div style={S.detailCol}>
            <div style={S.detailHead}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: selectedGroup.color + "18", color: selectedGroup.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>{selectedGroup.name[0]}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedGroup.name}</div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: selectedGroup.color, background: selectedGroup.color + "18", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4 }}>actif</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2, maxWidth: 560 }}>{selectedGroup.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {savedFlash && <span style={{ fontSize: 11.5, fontWeight: 600, color: "#10b981" }}>✓ {savedFlash}</span>}
                <button
                  onClick={async () => {
                    const name = window.HubModal
                      ? await window.HubModal.prompt({ title: "Renommer le groupe", label: "Nouveau nom", default: selectedGroup.name || selectedGroup.label, okLabel: "Renommer" })
                      : prompt("Nouveau nom du groupe :", selectedGroup.name || selectedGroup.label);
                    if (!name || !name.trim()) return;
                    const next = persistedGroups.map((g) => g.id === selectedGroup.id ? { ...g, label: name.trim(), name: name.trim() } : g);
                    setPersistedGroups(next);
                    window.HubAccess.saveGroups(next);
                    if (window.HubToast) window.HubToast.success("✓ Groupe renommé en « " + name.trim() + " »");
                  }}
                  style={{ ...S.btnGhost, cursor: "pointer" }}
                >Renommer</button>
                <button
                  onClick={() => window.HubAccess.setActiveGroupId(selectedGroup.id)}
                  style={selectedGroup.id === activeGroup.id ? { ...S.btnGhost, color: "#10b981", borderColor: "#bbf7d0", background: "#f0fdf4" } : S.btnPrimary}
                >
                  {selectedGroup.id === activeGroup.id ? "✓ Connecté à l'Accueil ERP" : "↗ Voir l'Accueil comme ce groupe"}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div style={S.kpiRow}>
              <div style={S.kpi}><div style={S.kpiK}>Membres</div><div style={S.kpiV}>{selectedGroup.members.length}</div></div>
              <div style={S.kpi}><div style={S.kpiK}>Modules autorisés</div><div style={S.kpiV}>{grantedCount} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>/ {ALL.length}</span></div></div>
              <div style={S.kpi}><div style={S.kpiK}>Dernière modification</div><div style={S.kpiV} title="Catherine Marchand · il y a 2 j">il y a 2 j</div></div>
              <div style={S.kpi}><div style={S.kpiK}>Connexions 7 j</div><div style={S.kpiV}>148</div></div>
            </div>

            {/* Membres */}
            <div style={S.section}>
              <div style={S.sectionHead}>
                <div style={S.sectionTitle}>Membres du groupe</div>
                <button
                  onClick={() => {
                    const candidates = users.filter((u) => !u.groups.includes(selectedGroup.id));
                    if (!candidates.length) { alert("Tous les utilisateurs font déjà partie de ce groupe"); return; }
                    const list = candidates.map((u, i) => `${i + 1}. ${u.name} (${u.email})`).join("\n");
                    const choice = prompt(`Ajouter au groupe ${selectedGroup.name || selectedGroup.label} :\n\n${list}\n\nTapez le numéro :`);
                    const idx = parseInt(choice, 10) - 1;
                    if (isNaN(idx) || idx < 0 || idx >= candidates.length) return;
                    const target = candidates[idx];
                    flash(`✓ ${target.name} ajouté au groupe (UI-only — Supabase à connecter)`);
                  }}
                  style={{ ...S.linkBtn, cursor: "pointer" }}
                >+ Ajouter un membre</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedGroup.members.map((m) => (
                  <div key={m} style={S.memberChip}>
                    <Avatar name={m} size={22} />
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b" }}>{m}</span>
                    <span
                      onClick={() => {
                        if (!confirm(`Retirer « ${m} » du groupe ${selectedGroup.name || selectedGroup.label} ?`)) return;
                        const next = persistedGroups.map((g) => g.id === selectedGroup.id ? { ...g, members: (g.members || []).filter((x) => x !== m) } : g);
                        setPersistedGroups(next);
                        window.HubAccess.saveGroups(next);
                        flash("✓ Membre retiré du groupe");
                      }}
                      style={{ fontSize: 13, color: "#94a3b8", cursor: "pointer", padding: "0 4px" }}
                      title="Retirer du groupe"
                    >×</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accès aux modules — la sélection se fait ici, par tuile */}
            <div style={S.section}>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionTitle}>Accès aux modules ERP</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Cochez les tuiles visibles depuis l'Accueil ERP pour ce groupe.</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={S.linkBtn}
                    onClick={() => { updateGroupAccess(selectedGroup.id, () => ALL.slice()); flash("Tous les modules autorisés"); }}
                  >Tout cocher</button>
                  <span style={{ color: "#cbd5e1" }}>·</span>
                  <button
                    style={S.linkBtn}
                    onClick={() => { updateGroupAccess(selectedGroup.id, () => []); flash("Tous les modules retirés"); }}
                  >Tout décocher</button>
                </div>
              </div>

              {/* Grille tuiles par catégorie */}
              {[...new Set(modules.map(m => m.cat))].map((cat) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={S.catLabel}>{cat}</div>
                  <div style={S.tilesGrid}>
                    {modules.filter(m => m.cat === cat).map((m) => {
                      const on = accessSet.has(m.key);
                      return (
                        <div
                          key={m.key}
                          onClick={() => toggleTile(selectedGroup.id, m.key)}
                          style={{ ...S.tile, ...(on ? S.tileOn : S.tileOff) }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: m.bg, color: m.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, opacity: on ? 1 : 0.45 }}>{m.title[0]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: on ? "#0f172a" : "#94a3b8" }}>{m.title}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                              {on ? "Visible sur l'Accueil" : "Masqué pour ce groupe"}
                            </div>
                          </div>
                          <Toggle on={on} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {activeTab === "invitations" && (
          <section style={{ ...S.splitRow, gridTemplateColumns: "1fr" }}>
            <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📨</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Aucune invitation en attente</h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 16px" }}>Les utilisateurs invités via le dashboard Supabase apparaissent ici tant qu'ils n'ont pas confirmé leur email.</p>
              <a href="https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users" target="_blank" rel="noopener" style={{ display: "inline-block", padding: "8px 14px", background: "#0f172a", color: "#fff", borderRadius: 7, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>+ Inviter dans Supabase →</a>
            </div>
          </section>
        )}

        {activeTab === "templates" && <ContractTemplatesPanel />}
        {activeTab === "integrations" && <IntegrationsPanel />}

        {activeTab === "audit" && (
          <section style={{ ...S.splitRow, gridTemplateColumns: "1fr" }}>
            <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Journal d'audit</h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 8px" }}>Le journal d'audit (connexions, modifications de groupes, suppressions) nécessite une table dédiée dans Supabase.</p>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, fontVariantNumeric: "tabular-nums" }}>À venir : audit_logs (auth.users, action, target, timestamp)</p>
            </div>
          </section>
        )}

        {/* TABLE UTILISATEURS — masquée si onglet Invitations ou Audit actif */}
        {(activeTab === "groups" || activeTab === "users") && <section style={S.usersCard}>
          <div style={S.colHeader}>
            <span>Tous les utilisateurs</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={S.search}
                placeholder="Filtrer par nom, email, rôle…"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              />
              <select
                value={userFilterStatus}
                onChange={(e) => { setUserFilterStatus(e.target.value); setUserPage(1); }}
                style={{ ...S.btnGhost, cursor: "pointer", paddingRight: 28 }}
              >
                <option value="">Tous statuts</option>
                <option value="online">● En ligne</option>
                <option value="away">● Absent</option>
                <option value="offline">○ Hors ligne</option>
              </select>
              <button onClick={() => setInviteOpen(true)} style={S.btnPrimary}>+ Inviter un utilisateur</button>
            </div>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Utilisateur</th>
                <th style={S.th}>Rôle</th>
                <th style={S.th}>Groupes</th>
                <th style={S.th}>Ext. 3CX</th>
                <th style={S.th}>Statut</th>
                <th style={S.th}>Dernière connexion</th>
                <th style={{ ...S.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = userSearch.trim().toLowerCase();
                const filtered = users.filter((u) => {
                  if (userFilterStatus && u.status !== userFilterStatus) return false;
                  if (q && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) return false;
                  return true;
                });
                const totalP = Math.max(1, Math.ceil(filtered.length / USER_PAGE_SIZE));
                const pageSafe = Math.min(userPage, totalP);
                const slice = filtered.slice((pageSafe - 1) * USER_PAGE_SIZE, pageSafe * USER_PAGE_SIZE);
                if (filtered.length === 0) {
                  return (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun utilisateur ne correspond.</td></tr>
                  );
                }
                return slice.map((u) => (
                <tr key={u.email} style={S.tr}>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative" }}>
                        <Avatar name={u.name} size={28} />
                        <span style={{ position: "absolute", right: -1, bottom: -1, width: 8, height: 8, borderRadius: 999, background: statusColor[u.status], border: "1.5px solid #fff" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ fontSize: 12.5, color: "#475569" }}>{u.role}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {u.groups.map(gid => {
                        const g = groups.find(x => x.id === gid);
                        return g ? groupChip(g) : null;
                      })}
                    </div>
                  </td>
                  <td style={S.td}>
                    <input
                      type="text"
                      defaultValue={u.extension || ""}
                      placeholder="ex : 201"
                      maxLength={6}
                      onBlur={async (e) => {
                        const v = e.target.value.trim();
                        if (v === (u.extension || "")) return;
                        if (!u.id) { if (window.HubToast) window.HubToast.warn("Profil non synchronisé Supabase"); return; }
                        const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
                        if (!supa) return;
                        const { error } = await supa.from("profiles").update({ extension_3cx: v || null }).eq("id", u.id);
                        if (error) { if (window.HubToast) window.HubToast.error("Erreur : " + error.message); }
                        else { if (window.HubToast) window.HubToast.success(v ? `Extension ${v} liée à ${u.name}` : "Extension retirée"); u.extension = v; }
                      }}
                      style={{ width: 80, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontVariantNumeric: "tabular-nums", outline: "none", textAlign: "center" }}
                    />
                  </td>
                  <td style={S.td}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", textTransform: "capitalize" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColor[u.status] }} />
                      {u.status === "online" ? "En ligne" : u.status === "away" ? "Absent" : "Hors ligne"}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: "#64748b", fontSize: 12 }}>{u.last}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    <a
                      href={`https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users`}
                      target="_blank"
                      rel="noopener"
                      style={{ ...S.iconBtn, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      title="Gérer ce compte dans Supabase Auth"
                    >⋯</a>
                  </td>
                </tr>
                ));
              })()}
            </tbody>
          </table>
          {(() => {
            const q = userSearch.trim().toLowerCase();
            const filtered = users.filter((u) => {
              if (userFilterStatus && u.status !== userFilterStatus) return false;
              if (q && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) return false;
              return true;
            });
            const totalP = Math.max(1, Math.ceil(filtered.length / USER_PAGE_SIZE));
            const pageSafe = Math.min(userPage, totalP);
            const start = (pageSafe - 1) * USER_PAGE_SIZE + 1;
            const end = Math.min(pageSafe * USER_PAGE_SIZE, filtered.length);
            return (
              <div style={S.tableFoot}>
                <div>{filtered.length === 0 ? "Aucun résultat" : `Affichage ${start}–${end} sur ${filtered.length} utilisateur${filtered.length > 1 ? "s" : ""}`}{q || userFilterStatus ? ` (filtré sur ${users.length})` : ""}</div>
                {totalP > 1 && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} style={{ ...S.pageBtn, opacity: pageSafe === 1 ? 0.5 : 1, cursor: pageSafe === 1 ? "not-allowed" : "pointer" }}>‹</button>
                    {Array.from({ length: totalP }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setUserPage(n)} style={{ ...S.pageBtn, ...(pageSafe === n ? S.pageBtnActive : {}), cursor: "pointer" }}>{n}</button>
                    ))}
                    <button onClick={() => setUserPage((p) => Math.min(totalP, p + 1))} disabled={pageSafe === totalP} style={{ ...S.pageBtn, opacity: pageSafe === totalP ? 0.5 : 1, cursor: pageSafe === totalP ? "not-allowed" : "pointer" }}>›</button>
                  </div>
                )}
              </div>
            );
          })()}
        </section>}
      </main>

      {inviteOpen && <InviteUserModal
        groups={groups}
        onClose={() => setInviteOpen(false)}
        onInvited={(u) => {
          setInviteOpen(false);
          if (window.HubToast) window.HubToast.success("✓ Invitation envoyée à " + u.email);
          // Refresh users list
          if (window.HubData && window.HubData.fetchProfiles) {
            window.HubData.fetchProfiles().then(({ data }) => {
              // forcer un re-render via le useEffect existant
              setUsers((arr) => [...arr]);
            }).catch(() => {});
          }
        }}
      />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// InviteUserModal — formulaire d'invitation d'un nouvel utilisateur
// ════════════════════════════════════════════════════════════════════
const InviteUserModal = ({ groups, onClose, onInvited }) => {
  const [email, setEmail]         = React.useState("");
  const [name, setName]           = React.useState("");
  const [role, setRole]           = React.useState("");
  const [extension, setExtension] = React.useState("");
  const [picked, setPicked]       = React.useState(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError]         = React.useState(null);

  const toggleGroup = (gid) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  };

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) { setError("Email invalide"); return; }
    if (!name.trim()) { setError("Nom obligatoire"); return; }
    setSubmitting(true);
    try {
      const { data: sess } = await window.HubSupabase.client.auth.getSession();
      const jwt = sess?.session?.access_token;
      if (!jwt) throw new Error("Non authentifié");
      const resp = await fetch("https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/invite-user", {
        method: "POST",
        headers: { "content-type": "application/json", "Authorization": "Bearer " + jwt },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role: role.trim() || null,
          extension: extension.trim() || null,
          groups: Array.from(picked),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || ("HTTP " + resp.status));
      onInvited && onInvited({ email, user_id: json.user_id });
    } catch (err) {
      setError(err.message);
    } finally { setSubmitting(false); }
  };

  return ReactDOM.createPortal(
    <div onClick={onClose} style={IM.backdrop}>
      <div onClick={(e) => e.stopPropagation()} style={IM.modal}>
        <div style={IM.head}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={IM.icon}>👤+</div>
            <div>
              <div style={IM.eyebrow}>Administration · Utilisateurs</div>
              <div style={IM.title}>Inviter un utilisateur</div>
            </div>
          </div>
          <button onClick={onClose} style={IM.close}>×</button>
        </div>
        <form onSubmit={submit} style={IM.body}>
          <div style={IM.row}>
            <label style={IM.field}>
              <span style={IM.label}>Email <span style={{ color: "#dc2626" }}>*</span></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@astorya.fr" style={IM.input} required autoFocus />
            </label>
            <label style={IM.field}>
              <span style={IM.label}>Nom complet <span style={{ color: "#dc2626" }}>*</span></span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" style={IM.input} required />
            </label>
          </div>
          <div style={IM.row}>
            <label style={IM.field}>
              <span style={IM.label}>Rôle / Fonction</span>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex : Direction, Commercial…" style={IM.input} />
            </label>
            <label style={IM.field}>
              <span style={IM.label}>Extension 3CX</span>
              <input type="text" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="Ex : 705" style={{ ...IM.input, fontVariantNumeric: "tabular-nums" }} maxLength={6} />
            </label>
          </div>
          <div>
            <div style={IM.label}>Groupes d'accès</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
              {groups.map((g) => {
                const on = picked.has(g.id);
                return (
                  <label key={g.id} onClick={() => toggleGroup(g.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid " + (on ? g.color + "55" : "#e2e8f0"), background: on ? g.color + "0d" : "#fff", borderRadius: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={on} onChange={() => {}} style={{ accentColor: g.color }} />
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: g.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{g.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={IM.helpBox}>
            💡 Un email d'invitation Supabase sera envoyé à <strong>{email || "l'adresse renseignée"}</strong>. Le destinataire cliquera sur le lien magique reçu pour définir son mot de passe à la première connexion.
          </div>
          {error && <div style={IM.error}>⚠ {error}</div>}
          <div style={IM.foot}>
            <button type="button" onClick={onClose} style={IM.btnGhost}>Annuler</button>
            <button type="submit" disabled={submitting} style={{ ...IM.btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? "Envoi…" : "✉ Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const IM = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  icon: { width: 40, height: 40, borderRadius: 10, background: "#eef2ff", color: "#3730a3", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 },
  eyebrow: { fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 17, fontWeight: 700, color: "#0f172a", marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, fontSize: 22, color: "#94a3b8", cursor: "pointer" },
  body: { padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 },
  input: { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", boxSizing: "border-box" },
  helpBox: { padding: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 12, color: "#1e40af", lineHeight: 1.5 },
  error: { padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 12.5 },
  foot: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" },
  btnGhost: { padding: "9px 14px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnPrimary: { padding: "9px 18px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700 },
};

// ───────── STYLES
const S = {
  frame: { display: "flex", height: "100%", minHeight: 1900, background: "#f3f5f8", color: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 },
  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 14, flexShrink: 0, position: "sticky", top: 0, height: "100vh", minHeight: 1900 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "0 4px 8px" },
  logo: { width: 30, height: 30, borderRadius: 8, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 },
  logoMark: { fontSize: 14, letterSpacing: -0.5 },
  newBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { background: "rgba(255,255,255,.15)", padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontVariantNumeric: "tabular-nums" },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 6px 6px" },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, fontSize: 12.5, color: "#475569", cursor: "pointer" },
  navItemActive: { background: "#eef2ff", color: "#3730a3", fontWeight: 600 },
  bullet: { width: 14, display: "inline-flex", justifyContent: "center", fontSize: 12, color: "#94a3b8" },
  navCount: { fontSize: 10.5, fontWeight: 600, background: "#f1f5f9", color: "#64748b", padding: "1px 7px", borderRadius: 999 },

  main: { flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 18, minWidth: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  breadcrumb: { fontSize: 11.5, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4 },
  title: { fontSize: 22, fontWeight: 700, marginTop: 4 },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 4, maxWidth: 720 },
  btnPrimary: { padding: "8px 14px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  btnGhost: { padding: "8px 12px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },

  tabsRow: { display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0" },
  tab: { padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#64748b", cursor: "pointer", borderBottom: "2px solid transparent", display: "flex", alignItems: "center", gap: 6 },
  tabActive: { color: "#3730a3", fontWeight: 700, borderBottomColor: "#3730a3" },
  tabBadge: { fontSize: 10.5, fontWeight: 700, background: "#eef2ff", color: "#3730a3", padding: "1px 7px", borderRadius: 999 },

  splitRow: { display: "grid", gridTemplateColumns: "340px 1fr", gap: 18, alignItems: "flex-start" },
  groupsCol: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" },
  colHeader: { padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 700 },
  search: { padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#475569", background: "#f8fafc", outline: "none", width: 180 },
  groupItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: "1px solid #f1f5f9", cursor: "pointer" },
  groupItemActive: { background: "#f8faff", borderLeft: "3px solid #3730a3", paddingLeft: 11 },

  detailCol: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 18 },
  detailHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  kpi: { background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #eef2f7" },
  kpiK: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 },
  kpiV: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 4 },

  section: { display: "flex", flexDirection: "column", gap: 12 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  linkBtn: { background: "transparent", border: 0, color: "#3730a3", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 },

  memberChip: { display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0" },

  catLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  tilesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  tile: { display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", cursor: "pointer", transition: "background 120ms" },
  tileOn: { background: "#fff", borderColor: "#c7d2fe" },
  tileOff: { background: "#f8fafc", borderColor: "#eef2f7" },

  usersCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 16px", verticalAlign: "middle" },
  iconBtn: { width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid transparent", color: "#94a3b8", fontSize: 16, cursor: "pointer" },

  tableFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#64748b" },
  pageBtn: { padding: "4px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#475569", cursor: "pointer" },
  pageBtnActive: { background: "#3730a3", borderColor: "#3730a3", color: "#fff", fontWeight: 700 },
};

// ════════════════════════════════════════════════════════════════════
// IntegrationsPanel — sous-composant tab "Intégrations API"
// ════════════════════════════════════════════════════════════════════
const IntegrationsPanel = () => {
  const TOKEN_KEY = "hubAstorya.pappers.token";
  const TEAMS_KEY = "hubAstorya.teams.webhookUrl";
  const [pappersToken, setPappersToken] = React.useState("");
  const [savedToken, setSavedToken] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [teamsUrl, setTeamsUrl] = React.useState("");
  const [savedTeamsUrl, setSavedTeamsUrl] = React.useState("");
  const [teamsTesting, setTeamsTesting] = React.useState(false);
  const [tcxSecret, setTcxSecret] = React.useState("");
  const [tcxSimPhone, setTcxSimPhone] = React.useState("");
  const [tcxServerUrl, setTcxServerUrl] = React.useState("https://telcomastorya.my3cx.fr:5001");
  const [tcxClientId, setTcxClientId] = React.useState("");
  const [tcxClientSecret, setTcxClientSecret] = React.useState("");
  const [savedTcxCC, setSavedTcxCC] = React.useState({ url: "", id: "", secret: "" });
  const [tcxCCTesting, setTcxCCTesting] = React.useState(false);
  const WEBHOOK_URL = "https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/phone-webhook";
  const CC_URL = "https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/call-control";

  React.useEffect(() => {
    const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    supa.from("app_settings").select("key, value")
      .in("key", ["3cx_webhook_secret", "3cx_server_url", "3cx_client_id", "3cx_client_secret"])
      .then(({ data }) => {
        const cfg = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
        if (cfg["3cx_webhook_secret"]) setTcxSecret(cfg["3cx_webhook_secret"]);
        if (cfg["3cx_server_url"])     setTcxServerUrl(cfg["3cx_server_url"]);
        if (cfg["3cx_client_id"])      setTcxClientId(cfg["3cx_client_id"]);
        if (cfg["3cx_client_secret"])  setTcxClientSecret(cfg["3cx_client_secret"]);
        setSavedTcxCC({
          url:    cfg["3cx_server_url"]     || "",
          id:     cfg["3cx_client_id"]      || "",
          secret: cfg["3cx_client_secret"]  || "",
        });
      })
      .catch(() => {});
  }, []);

  const regenTcxSecret = async () => {
    const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    const ok = window.HubModal
      ? await window.HubModal.confirm({ title: "Régénérer le secret 3CX ?", message: "L'ancien secret sera invalidé immédiatement. Tu devras le remettre à jour côté console 3CX.", okLabel: "Régénérer", okStyle: "danger" })
      : confirm("Régénérer le secret 3CX ? L'ancien sera invalidé.");
    if (!ok) return;
    const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supa.from("app_settings").upsert({ key: "3cx_webhook_secret", value: newSecret });
    if (error) { if (window.HubToast) window.HubToast.error("Erreur : " + error.message); return; }
    setTcxSecret(newSecret);
    if (window.HubToast) window.HubToast.success("✓ Nouveau secret généré — mets-le à jour côté 3CX");
  };

  const saveTcxCC = async () => {
    const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    const rows = [
      { key: "3cx_server_url",    value: tcxServerUrl.trim() },
      { key: "3cx_client_id",     value: tcxClientId.trim() },
      { key: "3cx_client_secret", value: tcxClientSecret.trim() },
    ];
    const { error } = await supa.from("app_settings").upsert(rows);
    if (error) { if (window.HubToast) window.HubToast.error("Erreur : " + error.message); return; }
    setSavedTcxCC({ url: tcxServerUrl.trim(), id: tcxClientId.trim(), secret: tcxClientSecret.trim() });
    if (window.HubToast) window.HubToast.success("✓ Config Call Control sauvegardée");
  };

  const testTcxCC = async () => {
    setTcxCCTesting(true);
    try {
      const { data: session } = await window.HubSupabase.client.auth.getSession();
      const jwt = session?.session?.access_token;
      if (!jwt) throw new Error("Pas de session — reconnecte-toi");
      const me = await window.api.auth.getUser();
      const { data: profile } = await window.HubSupabase.client
        .from("profiles").select("extension_3cx").eq("id", me.id).single();
      if (!profile?.extension_3cx) throw new Error("Aucune extension renseignée pour ton user");
      const resp = await fetch(CC_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "Authorization": "Bearer " + jwt },
        body: JSON.stringify({ action: "status", extension: profile.extension_3cx }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || ("HTTP " + resp.status));
      if (window.HubToast) window.HubToast.success("✓ Connexion 3CX OK — extension " + profile.extension_3cx + (json.active_call ? " (appel actif détecté)" : " (au repos)"));
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + e.message);
    } finally { setTcxCCTesting(false); }
  };

  const copyToClip = (txt, label) => {
    navigator.clipboard.writeText(txt).then(() => {
      if (window.HubToast) window.HubToast.success("✓ " + (label || "Copié"));
    });
  };

  const simulateCall = () => {
    if (!window.HubHotline || !window.HubHotline.simulate) {
      if (window.HubToast) window.HubToast.error("Module hotline non chargé");
      return;
    }
    window.HubHotline.simulate(tcxSimPhone.trim() || "+33 6 12 34 56 78", "Appel test (local)");
  };

  React.useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY) || "";
      setPappersToken(t);
      setSavedToken(t);
      const w = localStorage.getItem(TEAMS_KEY) || "";
      setTeamsUrl(w);
      setSavedTeamsUrl(w);
    } catch (e) {}
  }, []);

  const saveTeams = () => {
    try {
      const cleaned = teamsUrl.trim();
      if (cleaned && !/^https?:\/\//i.test(cleaned)) {
        if (window.HubToast) window.HubToast.error("URL invalide — doit commencer par https://");
        return;
      }
      if (cleaned) localStorage.setItem(TEAMS_KEY, cleaned);
      else localStorage.removeItem(TEAMS_KEY);
      setSavedTeamsUrl(cleaned);
      if (window.HubToast) window.HubToast.success(cleaned ? "✓ Webhook Teams enregistré" : "✓ Webhook Teams retiré");
    } catch (e) { if (window.HubToast) window.HubToast.error("Erreur : " + e.message); }
  };

  const testTeams = async () => {
    if (!teamsUrl.trim()) { if (window.HubToast) window.HubToast.warn("Colle d'abord une URL de webhook"); return; }
    saveTeams();
    setTeamsTesting(true);
    try {
      if (!window.HubTeams) throw new Error("Module Teams non chargé");
      await window.HubTeams.test();
      if (window.HubToast) window.HubToast.success("✓ Message de test envoyé — vérifie ton canal Teams");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + e.message);
    } finally { setTeamsTesting(false); }
  };

  const removeTeams = () => {
    setTeamsUrl("");
    try { localStorage.removeItem(TEAMS_KEY); } catch (e) {}
    setSavedTeamsUrl("");
    if (window.HubToast) window.HubToast.info("Webhook Teams retiré — plus de notifications canal");
  };

  const save = () => {
    try {
      const cleaned = pappersToken.trim();
      if (cleaned) localStorage.setItem(TOKEN_KEY, cleaned);
      else localStorage.removeItem(TOKEN_KEY);
      setSavedToken(cleaned);
      if (window.HubToast) window.HubToast.success(cleaned ? "✓ Token Pappers enregistré" : "✓ Token Pappers retiré");
    } catch (e) { if (window.HubToast) window.HubToast.error("Erreur : " + e.message); }
  };

  const test = async () => {
    if (!pappersToken.trim()) { if (window.HubToast) window.HubToast.warn("Colle d'abord un token avant de tester"); return; }
    // Sauvegarde + teste sur un SIREN connu (Astorya / un test)
    save();
    setTesting(true);
    setTestResult(null);
    try {
      // SIREN INPI (test public) : 13002526500013 (3 plus 9 = juste 9 pour SIREN)
      // On utilise un SIREN simple connu : 552120222 (L'OREAL) — toujours actif
      const r = await window.HubPappers.checkSiren("552120222");
      setTestResult(r);
      if (r.status === "error") {
        if (window.HubToast) window.HubToast.error("Échec test : " + (r.error || "erreur"));
      } else if (r.source === "pappers" && r.company && r.company.denomination) {
        if (window.HubToast) window.HubToast.success("✓ Pappers OK — " + r.company.denomination + " trouvé");
      } else if (r.source === "bodacc") {
        if (window.HubToast) window.HubToast.warn("Token invalide — fallback BODACC actif");
      }
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur réseau : " + e.message);
    } finally { setTesting(false); }
  };

  const remove = () => {
    setPappersToken("");
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    setSavedToken("");
    if (window.HubToast) window.HubToast.info("Token Pappers retiré — l'app retombe sur BODACC (gratuit, sans clé)");
  };

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 24 }}>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>🔌 Intégrations API tierces</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Configure les sources de données externes utilisées par Hub Astorya pour enrichir les fiches client.
        </p>
      </header>

      {/* ─── Pappers ─── */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>P</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Pappers</h3>
              {savedToken ? (
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#dcfce7", color: "#065f46", borderRadius: 999, fontWeight: 700 }}>● ACTIF</span>
              ) : (
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: 999, fontWeight: 700 }}>○ INACTIF (fallback BODACC)</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Base entreprises FR : procédures collectives, état administratif, capital, effectif, dirigeants, NAF, siège.
            </p>
          </div>
        </div>

        <div style={{ background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>📋 Étapes pour obtenir un token</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
            <li>Ouvre <a href="https://www.pappers.fr/api" target="_blank" rel="noopener" style={{ color: "#3730a3", fontWeight: 600 }}>pappers.fr/api ↗</a> et inscris-toi (gratuit)</li>
            <li>Connecte-toi, va dans ton tableau de bord → onglet <strong>Mon API</strong></li>
            <li>Copie ton <strong>API Token</strong> (au format UUID, ex : <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>1a2b3c4d-5e6f-7890-abcd-...</code>)</li>
            <li>Colle-le dans le champ ci-dessous + clique « Enregistrer »</li>
          </ol>
        </div>

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Token API Pappers</label>
        <input
          type="text"
          value={pappersToken}
          onChange={(e) => setPappersToken(e.target.value)}
          placeholder="Colle ton token ici (ex : 1a2b3c4d-5e6f-7890-abcd-ef1234567890)"
          spellCheck={false}
          autoComplete="off"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontVariantNumeric: "tabular-nums", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={save} disabled={pappersToken === savedToken} style={{ padding: "8px 16px", background: pappersToken === savedToken ? "#cbd5e1" : "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: pappersToken === savedToken ? "default" : "pointer" }}>
            💾 Enregistrer
          </button>
          <button onClick={test} disabled={testing || !pappersToken.trim()} style={{ padding: "8px 16px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: testing || !pappersToken.trim() ? "wait" : "pointer" }}>
            {testing ? "⏳ Test en cours…" : "🧪 Tester le token"}
          </button>
          {savedToken && (
            <button onClick={remove} style={{ padding: "8px 16px", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
              🗑 Retirer le token
            </button>
          )}
        </div>

        {testResult && (
          <div style={{ marginTop: 14, padding: 12, background: testResult.status === "error" ? "#fef2f2" : "#ecfdf5", border: "1px solid " + (testResult.status === "error" ? "#fca5a5" : "#86efac"), borderRadius: 8, fontSize: 12.5 }}>
            <div style={{ fontWeight: 700, color: testResult.status === "error" ? "#9b1c1c" : "#065f46", marginBottom: 4 }}>
              {testResult.status === "error" ? "❌ Échec" : "✅ Test réussi"} · source : {testResult.source}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748b" }}>
              {testResult.company && testResult.company.denomination ? "Entreprise testée : " + testResult.company.denomination : (testResult.error || "")}
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 11, color: "#94a3b8" }}>
          💡 Plan gratuit : 1000 requêtes/mois — largement suffisant avec le cache 7 jours intégré.<br/>
          ⚠ Le token est stocké en localStorage et envoyé depuis le navigateur. Pour un cloisonnement renforcé, voir doc de migration vers une fonction Edge Supabase.
        </div>
      </div>

      {/* ─── Microsoft Teams ─── */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #6264a7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>T</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Microsoft Teams</h3>
              {savedTeamsUrl ? (
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#dcfce7", color: "#065f46", borderRadius: 999, fontWeight: 700 }}>● ACTIF</span>
              ) : (
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#f1f5f9", color: "#64748b", borderRadius: 999, fontWeight: 700 }}>○ INACTIF</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Reçois en temps réel dans un canal Teams les notifications du Hub (avancement projet, livrables, etc.).
            </p>
          </div>
        </div>

        <div style={{ background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>📋 Comment créer le webhook</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
            <li>Dans Teams, va dans le canal cible → <strong>… (Plus)</strong> → <strong>Connecteurs</strong></li>
            <li>Cherche <strong>« Incoming Webhook »</strong> → <strong>Configurer</strong></li>
            <li>Donne un nom (ex : <em>Hub Astorya</em>) + une icône, puis <strong>Créer</strong></li>
            <li>Copie l'URL générée (format : <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>https://outlook.office.com/webhook/…</code>)</li>
            <li>Colle-la ci-dessous + clique « Enregistrer »</li>
          </ol>
        </div>

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>URL du webhook entrant</label>
        <input
          type="text"
          value={teamsUrl}
          onChange={(e) => setTeamsUrl(e.target.value)}
          placeholder="https://outlook.office.com/webhook/..."
          spellCheck={false}
          autoComplete="off"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontVariantNumeric: "tabular-nums", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={saveTeams} disabled={teamsUrl === savedTeamsUrl} style={{ padding: "8px 16px", background: teamsUrl === savedTeamsUrl ? "#cbd5e1" : "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: teamsUrl === savedTeamsUrl ? "default" : "pointer" }}>
            💾 Enregistrer
          </button>
          <button onClick={testTeams} disabled={teamsTesting || !teamsUrl.trim()} style={{ padding: "8px 16px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: teamsTesting || !teamsUrl.trim() ? "wait" : "pointer" }}>
            {teamsTesting ? "⏳ Envoi…" : "🧪 Envoyer un message test"}
          </button>
          {savedTeamsUrl && (
            <button onClick={removeTeams} style={{ padding: "8px 16px", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
              🗑 Retirer le webhook
            </button>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "#94a3b8" }}>
          💡 Format MessageCard standard Teams (themeColor, title, sections, action OpenUri).<br/>
          ⚠ L'URL est stockée en localStorage du navigateur. Chaque utilisateur configure son propre canal de réception.
        </div>
      </div>

      {/* ─── 3CX (téléphonie) ─── */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #047857)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>☎</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Téléphonie 3CX</h3>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "#dcfce7", color: "#065f46", borderRadius: 999, fontWeight: 700 }}>● ENTERPRISE</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Popup CTI temps réel sur appel entrant. Webhook 3CX → Supabase → notification au bon agent (extension matchée), filtré département <strong>ASTO</strong>.
            </p>
          </div>
        </div>

        <div style={{ background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>📋 Config côté 3CX (Console admin)</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
            <li>Ouvre <a href="https://telcomastorya.my3cx.fr:5001/#/app/integrations/crm" target="_blank" rel="noopener" style={{ color: "#3730a3", fontWeight: 600 }}>telcomastorya.my3cx.fr:5001 → Integrations → CRM ↗</a></li>
            <li><strong>+ Add</strong> → <em>Server side CRM integration</em> → <em>Generic Web Server</em></li>
            <li>Colle l'URL du webhook et le secret ci-dessous (header <code>X-3CX-Secret</code>)</li>
            <li>Method <strong>POST</strong>, Content-type <strong>application/json</strong></li>
            <li>Department <strong>ASTO</strong> uniquement (autres départements ignorés côté Edge)</li>
            <li>Renseigne l'extension 3CX de chaque utilisateur dans l'onglet <em>Utilisateurs</em> du Hub</li>
          </ol>
        </div>

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>URL du webhook (à coller dans 3CX)</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input
            type="text" readOnly value={WEBHOOK_URL}
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11.5, fontVariantNumeric: "tabular-nums", color: "#0f172a", background: "#fafbfc", outline: "none" }}
            onFocus={(e) => e.target.select()}
          />
          <button onClick={() => copyToClip(WEBHOOK_URL, "URL copiée")} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>📋 Copier</button>
        </div>

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Secret partagé (header X-3CX-Secret)</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input
            type="text" readOnly value={tcxSecret || "— Non configuré (lance d'abord supabase/3cx-integration.sql) —"}
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11.5, fontVariantNumeric: "tabular-nums", color: tcxSecret ? "#0f172a" : "#94a3b8", background: "#fafbfc", outline: "none" }}
            onFocus={(e) => e.target.select()}
          />
          <button onClick={() => copyToClip(tcxSecret, "Secret copié")} disabled={!tcxSecret} style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: tcxSecret ? "pointer" : "not-allowed", opacity: tcxSecret ? 1 : 0.5, whiteSpace: "nowrap" }}>📋 Copier</button>
          <button onClick={regenTcxSecret} style={{ padding: "8px 14px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>↻ Régénérer</button>
        </div>

        <div style={{ marginTop: 14, padding: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>🧪 Tester en local (sans 3CX)</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text" value={tcxSimPhone}
              onChange={(e) => setTcxSimPhone(e.target.value)}
              placeholder="Numéro à simuler (ex : +33 6 12 34 56 78)"
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: "#0f172a", background: "#fff", outline: "none" }}
            />
            <button onClick={simulateCall} style={{ padding: "8px 14px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>📞 Simuler appel</button>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "#94a3b8" }}>
          ⚠ Seul le département <strong>ASTO</strong> est routé vers le Hub. Les autres départements 3CX reçoivent un 200 + ignored.
        </div>

        {/* ─── Sous-section : Pilotage téléphonie (Call Control API) ─── */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px dashed #cbd5e1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🎛</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>Pilotage téléphonie (Call Control API)</h4>
              <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>
                Permet de répondre / raccrocher un appel <strong>directement depuis le popup CTI du Hub</strong> (sans utiliser le 3CX Web Client). Optionnel — sans ça, le popup reste informatif.
              </p>
            </div>
          </div>

          <div style={{ background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>📋 Comment obtenir les identifiants</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
              <li>Console 3CX → <strong>Intégrations</strong> → <strong>API</strong> → <strong>+ Ajouter</strong></li>
              <li>Nom (ex : <em>Hub Astorya</em>) → coche <strong>Activer l'accès à l'API 3CX Call Control</strong></li>
              <li>Département : <strong>ASTO</strong> · Rôle : <strong>Utilisateur</strong></li>
              <li><strong>Sélectionner les extensions</strong> → ajoute Romain (704), Augustin, etc.</li>
              <li>Sauvegarder — 3CX affiche un <strong>Client ID</strong> et un <strong>Client Secret</strong></li>
              <li>Colle les valeurs ci-dessous et sauvegarde</li>
            </ol>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>URL serveur 3CX</label>
          <input type="text" value={tcxServerUrl} onChange={(e) => setTcxServerUrl(e.target.value)} placeholder="https://telcomastorya.my3cx.fr:5001"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontVariantNumeric: "tabular-nums", marginBottom: 10, boxSizing: "border-box" }} />

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Client ID</label>
          <input type="text" value={tcxClientId} onChange={(e) => setTcxClientId(e.target.value)} placeholder="ID généré par 3CX"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontVariantNumeric: "tabular-nums", marginBottom: 10, boxSizing: "border-box" }} />

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Client Secret</label>
          <input type="password" value={tcxClientSecret} onChange={(e) => setTcxClientSecret(e.target.value)} placeholder="Secret généré par 3CX"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontVariantNumeric: "tabular-nums", marginBottom: 12, boxSizing: "border-box" }} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={saveTcxCC}
              disabled={tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret}
              style={{ padding: "8px 16px", background: (tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret) ? "#cbd5e1" : "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: (tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret) ? "default" : "pointer" }}>
              💾 Sauvegarder
            </button>
            <button onClick={testTcxCC} disabled={tcxCCTesting || !savedTcxCC.id}
              style={{ padding: "8px 16px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: (tcxCCTesting || !savedTcxCC.id) ? "wait" : "pointer" }}>
              {tcxCCTesting ? "⏳ Test…" : "🧪 Tester la connexion 3CX"}
            </button>
            <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
              {savedTcxCC.id ? "● Configuré" : "○ Non configuré (popup reste informatif)"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── BODACC (toujours actif, gratuit) ─── */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#0f172a", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>B</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>BODACC</h3>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "#dcfce7", color: "#065f46", borderRadius: 999, fontWeight: 700 }}>● ALWAYS ON</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Source officielle FR (Bulletin Officiel des Annonces). Pas de clé requise. Utilisée en fallback si Pappers indisponible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════
// ContractTemplatesPanel — sous-composant tab "Modèles de contrat"
// ════════════════════════════════════════════════════════════════════
const ContractTemplatesPanel = () => {
  const [templates, setTemplates] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const fileRef = React.useRef(null);

  const reload = async () => {
    if (!window.api || !window.api.contractTemplates) return;
    try {
      const list = await window.api.contractTemplates.list();
      setTemplates(list || []);
    } catch (e) { console.warn("[Templates] list:", e); }
  };
  React.useEffect(() => { reload(); }, []);

  // Extraction du texte d'un PDF avec PDF.js (loaded via CDN dans la HTML)
  const extractPdfText = async (file) => {
    if (!window.pdfjsLib) {
      console.warn("PDF.js not loaded — text extraction skipped");
      return null;
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => it.str).join(" ");
      text += pageText + "\n\n";
    }
    return text.trim();
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      if (window.HubToast) window.HubToast.error("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      if (window.HubToast) window.HubToast.error("Le PDF ne doit pas dépasser 10 Mo (le tien fait " + Math.round(file.size / 1024 / 1024 * 10) / 10 + " Mo).");
      return;
    }
    setUploading(true);
    try {
      setProgress("1/3 Extraction du texte du PDF…");
      const cgvText = await extractPdfText(file);
      setProgress("2/3 Demande du nom du modèle…");
      const name = window.HubModal
        ? await window.HubModal.prompt({ title: "Nom du modèle", label: "Comment vais-je l'identifier dans NewContract ?", default: file.name.replace(/\.pdf$/i, ""), okLabel: "Continuer" })
        : prompt("Nom du modèle :", file.name.replace(/\.pdf$/i, ""));
      if (!name) { setUploading(false); setProgress(""); return; }
      const version = window.HubModal
        ? await window.HubModal.prompt({ title: "Version", label: "Numéro de version (ex : v4.2)", default: "v1.0", okLabel: "Continuer" })
        : "v1.0";
      setProgress("3/3 Upload sur Supabase Storage + sauvegarde BDD…");
      const saved = await window.api.contractTemplates.upload({ name, version: version || "v1.0", file, cgvText });
      if (window.HubToast) window.HubToast.success("✓ Modèle « " + saved.name + " » uploadé (" + (saved.pdf_size_kb || "?") + " Ko)");
      await reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur upload : " + (e.message || e));
    } finally {
      setUploading(false);
      setProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (t) => {
    const ok = window.HubModal
      ? await window.HubModal.confirm({ title: "Supprimer ce modèle ?", message: "Le PDF sera retiré du stockage. Soft-delete : la ligne reste en BDD pour audit.", okLabel: "Supprimer", okStyle: "danger" })
      : confirm("Supprimer ce modèle ?");
    if (!ok) return;
    try {
      await window.api.contractTemplates.remove(t.id);
      if (window.HubToast) window.HubToast.success("✓ Modèle supprimé");
      await reload();
    } catch (e) { if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e)); }
  };

  const handleSetDefault = async (t) => {
    try {
      await window.api.contractTemplates.setDefault(t.id);
      if (window.HubToast) window.HubToast.success("✓ « " + t.name + " » est maintenant le modèle par défaut");
      await reload();
    } catch (e) { if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e)); }
  };

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 24 }}>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>📄 Modèles de contrat (CGV)</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Upload des PDF de CGV. Le texte est extrait automatiquement pour s'afficher dans la preview du contrat envoyé pour signature.
        </p>
      </header>

      {/* Zone de drop / upload */}
      <div style={{ border: "2px dashed " + (uploading ? "#4f46e5" : "#cbd5e1"), borderRadius: 12, padding: 28, textAlign: "center", background: uploading ? "#eef2ff" : "#fafbfc", transition: "all .15s", marginBottom: 24 }}
           onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
           onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (uploading) return; const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}>
        {uploading ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3730a3" }}>{progress || "Upload en cours…"}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📤</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Glisser-déposer un PDF ici</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>ou cliquer pour parcourir · max 10 Mo</div>
            <button onClick={() => fileRef.current && fileRef.current.click()}
                    style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sélectionner un PDF
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
                   onChange={(e) => { const f = e.target.files[0]; if (f) handleUpload(f); }} />
          </>
        )}
      </div>

      {/* Liste des templates */}
      {templates.length === 0 ? (
        <div style={{ padding: "24px 14px", textAlign: "center", fontSize: 13, color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: 10, background: "#fafbfc" }}>
          Aucun modèle uploadé pour l'instant. Upload ton premier PDF de CGV ci-dessus.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafbfc", borderBottom: "1px solid #eef1f5" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Modèle</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Version</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Taille</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Uploadé</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{t.name}{t.is_default && <span style={{ marginLeft: 8, fontSize: 10, background: "#dcfce7", color: "#065f46", padding: "2px 7px", borderRadius: 999, fontWeight: 700 }}>★ DÉFAUT</span>}</div>
                      {t.description && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{t.description}</div>}
                      {t.cgv_text && <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{Math.round(t.cgv_text.length / 100) / 10}k caractères extraits</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px", fontSize: 12, color: "#475569", fontVariantNumeric: "tabular-nums" }}>{t.version}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: 12, color: "#475569", fontVariantNumeric: "tabular-nums" }}>{t.pdf_size_kb ? t.pdf_size_kb + " Ko" : "—"}</td>
                <td style={{ padding: "12px", fontSize: 12, color: "#64748b" }}>{t.created_at ? new Date(t.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    {t.pdf_url && <a href={t.pdf_url} target="_blank" rel="noopener" style={{ padding: "5px 10px", fontSize: 11.5, color: "#3730a3", border: "1px solid #e2e8f0", borderRadius: 6, textDecoration: "none", background: "#fff" }}>👁 Voir</a>}
                    {!t.is_default && <button onClick={() => handleSetDefault(t)} style={{ padding: "5px 10px", fontSize: 11.5, color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600 }}>★ Définir par défaut</button>}
                    <button onClick={() => handleDelete(t)} style={{ padding: "5px 10px", fontSize: 11.5, color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, background: "#fff", cursor: "pointer" }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

window.UserManagement = UserManagement;
