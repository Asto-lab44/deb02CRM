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

  // ───── utilisateurs réels Astorya
  const users = [
    { name: "Romain Daviaud",  email: "achat@astorya.fr",         role: "Direction",  groups: ["admin", "direction", "commercial", "finance"], status: "online", last: "à l'instant" },
    { name: "Augustin Morin",  email: "a.morin@astorya.fr",       role: "Direction",  groups: ["admin", "direction", "commercial"],            status: "online", last: "à l'instant" },
  ];

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
          <div style={S.logo}><div style={S.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Administration</div>
          </div>
        </a>
        <button
          onClick={async () => {
            const email = prompt("Email du nouvel utilisateur Astorya :");
            if (!email || !email.trim()) return;
            if (!window.HubSupabase || !window.HubSupabase.enabled) {
              alert("Supabase non configuré — invitation impossible. Crée le compte directement dans le dashboard Supabase (Authentication → Users → Add user).");
              return;
            }
            alert("ℹ Pour des raisons de sécurité, l'invitation se fait depuis le dashboard Supabase :\n\nhttps://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users\n\nClique « Add user » → " + email);
            window.open("https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users", "_blank");
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
            <button onClick={async () => { if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return; if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut(); window.HubAccess.logout(); window.location.href = "/login"; }} title="Se déconnecter" style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 14, cursor: "pointer", padding: 4 }}>⏻</button>
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
                  if (!confirm("⚠ DANGER : Supprimer DÉFINITIVEMENT toutes les données métier ?\n\n• Tous les clients/prospects\n• Toutes les opportunités\n• Tous les contacts\n• Toutes les actions\n• Tous les contrats\n• localStorage entier\n\n(Les comptes Romain + Augustin restent dans Auth)")) return;
                  if (!confirm("Vraiment sûr ? Cette action est irréversible.")) return;
                  let report = [];
                  // Supabase
                  if (window.HubSupabase && window.HubSupabase.enabled && window.HubSupabase.client) {
                    const s = window.HubSupabase.client;
                    for (const t of ["actions", "contacts", "contracts", "opportunities", "clients"]) {
                      try {
                        const { error } = await s.from(t).delete().not("id", "is", null);
                        report.push((error ? "✗ " : "✓ ") + t + (error ? " — " + error.message : ""));
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
                title="Supprimer toutes les données métier (clients, opps, contacts, actions, contrats)"
              >🗑 Reset données</button>
              <button onClick={() => { if (confirm("Réinitialiser tous les groupes et accès aux valeurs par défaut ?")) { window.HubAccess.resetAll(); flash("Réinitialisé"); } }} style={S.btnGhost}>⟲ Réinit. groupes</button>
              <a
                href="https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/providers"
                target="_blank"
                rel="noopener"
                style={{ ...S.btnGhost, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                title="Configurer SAML / OAuth / SSO dans Supabase"
              >🔗 Configurer SSO →</a>
              <button
                onClick={() => {
                  const label = prompt("Nom du nouveau groupe :");
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
                  window.HubAccess.saveGroups([...persistedGroups, newGroup]);
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
                  onClick={() => {
                    const name = prompt("Nouveau nom du groupe :", selectedGroup.name || selectedGroup.label);
                    if (!name || !name.trim()) return;
                    const next = persistedGroups.map((g) => g.id === selectedGroup.id ? { ...g, label: name.trim(), name: name.trim() } : g);
                    window.HubAccess.saveGroups(next);
                    flash("Groupe renommé");
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

        {activeTab === "audit" && (
          <section style={{ ...S.splitRow, gridTemplateColumns: "1fr" }}>
            <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Journal d'audit</h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 8px" }}>Le journal d'audit (connexions, modifications de groupes, suppressions) nécessite une table dédiée dans Supabase.</p>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>À venir : audit_logs (auth.users, action, target, timestamp)</p>
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
            </div>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Utilisateur</th>
                <th style={S.th}>Rôle</th>
                <th style={S.th}>Groupes</th>
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
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun utilisateur ne correspond.</td></tr>
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
    </div>
  );
};

// ───────── STYLES
const S = {
  frame: { display: "flex", height: "100%", minHeight: 1900, background: "#f3f5f8", color: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 },
  sidebar: { width: 248, background: "#fff", borderRight: "1px solid #eef1f5", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 14, flexShrink: 0, position: "sticky", top: 0, height: "100vh", minHeight: 1900 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "0 4px 8px" },
  logo: { width: 30, height: 30, borderRadius: 8, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 },
  logoMark: { fontSize: 14, letterSpacing: -0.5 },
  newBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  kbd: { background: "rgba(255,255,255,.15)", padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" },
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

window.UserManagement = UserManagement;
