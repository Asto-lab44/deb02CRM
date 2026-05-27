// Module Administration — Gestion utilisateurs, groupes et accès aux tuiles

const UserManagement = () => {
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
  const moduleByKey = Object.fromEntries(modules.map(m => [m.key, m]));
  const ALL = modules.map(m => m.key);

  // ───── groupes (avec leurs accès tuiles + membres)
  const groups = [
    {
      id: "admin", name: "Administrateurs", color: "#dc2626",
      description: "Accès complet à l'ERP, gestion des utilisateurs et de la sécurité.",
      access: ALL,
      members: ["Nadia Lefèvre", "Hugo Bertrand"],
    },
    {
      id: "direction", name: "Direction", color: "#4f46e5",
      description: "Comité exécutif — vue 360 sur tous les modules, lecture étendue.",
      access: ALL,
      members: ["Catherine Marchand", "Olivier Vasseur", "Sophie Aubry"],
    },
    {
      id: "commercial", name: "Commercial", color: "#0ea5e9",
      description: "Équipes vente et avant-vente — pipeline, comptes, opportunités.",
      access: ["crm", "intel", "marketing", "billing", "reports"],
      members: ["Karim Ben Salah", "Tom Verdier", "Émilie Garnier", "Antoine Mercier", "Julien Pasquier", "Marie Lopez", "Pierre Dubois", "Romain Faure"],
    },
    {
      id: "support", name: "Support technique", color: "#0891b2",
      description: "Hotline N1/N2 — tickets, SLA, base de connaissances.",
      access: ["tech", "projects", "crm", "reports"],
      members: ["Léo Tanaka", "Diane Roussel", "Farid Belkacem", "Romain Faure"],
    },
    {
      id: "finance", name: "Finance & Compta", color: "#10b981",
      description: "Comptabilité, facturation, trésorerie et reporting financier.",
      access: ["accounting", "billing", "treasury", "reports", "hr"],
      members: ["Valérie Chen", "Pierre Dubois", "Hugo Bertrand"],
    },
    {
      id: "marketing", name: "Marketing", color: "#ec4899",
      description: "Campagnes, contenu, génération de leads et analytics.",
      access: ["marketing", "crm", "reports", "intel"],
      members: ["Émilie Garnier", "Marie Lopez"],
    },
    {
      id: "rh", name: "Ressources humaines", color: "#8b5cf6",
      description: "Paie, contrats, recrutement et gestion des temps.",
      access: ["hr", "time", "reports"],
      members: ["Sophie Aubry", "Valérie Chen"],
    },
    {
      id: "ops", name: "Opérations & Produit", color: "#a855f7",
      description: "Roadmap produit, livrables clients, gestion du stock.",
      access: ["projects", "inventory", "tech", "reports"],
      members: ["Olivier Vasseur", "Léo Tanaka", "Diane Roussel"],
    },
  ];

  // ───── utilisateurs (avec leurs groupes)
  const users = [
    { name: "Nadia Lefèvre",      email: "n.lefevre@astorya.fr",      role: "Directrice technique",   groups: ["admin", "direction"],     status: "online",  last: "il y a 3 min" },
    { name: "Hugo Bertrand",      email: "h.bertrand@astorya.fr",     role: "IT Manager",             groups: ["admin", "finance"],       status: "online",  last: "il y a 8 min" },
    { name: "Catherine Marchand", email: "c.marchand@astorya.fr",     role: "CEO",                    groups: ["direction"],              status: "away",    last: "il y a 1 h" },
    { name: "Olivier Vasseur",    email: "o.vasseur@astorya.fr",      role: "COO",                    groups: ["direction", "ops"],       status: "online",  last: "à l'instant" },
    { name: "Karim Ben Salah",    email: "k.bensalah@astorya.fr",     role: "AE Senior Cyber",        groups: ["commercial"],             status: "online",  last: "il y a 12 min" },
    { name: "Sophie Aubry",       email: "s.aubry@astorya.fr",        role: "AE & DRH",               groups: ["direction", "rh"],        status: "away",    last: "il y a 2 h" },
    { name: "Tom Verdier",        email: "t.verdier@astorya.fr",      role: "AE Hub",                 groups: ["commercial"],             status: "online",  last: "il y a 5 min" },
    { name: "Émilie Garnier",     email: "e.garnier@astorya.fr",      role: "AE BENELUX",             groups: ["commercial", "marketing"], status: "offline", last: "hier 18:42" },
    { name: "Antoine Mercier",    email: "a.mercier@astorya.fr",      role: "AE DACH",                groups: ["commercial"],             status: "online",  last: "il y a 22 min" },
    { name: "Julien Pasquier",    email: "j.pasquier@astorya.fr",     role: "AE Suite",               groups: ["commercial"],             status: "online",  last: "il y a 4 min" },
    { name: "Marie Lopez",        email: "m.lopez@astorya.fr",        role: "AE UK & Marketing Ops",  groups: ["commercial", "marketing"], status: "online", last: "il y a 18 min" },
    { name: "Pierre Dubois",      email: "p.dubois@astorya.fr",       role: "Comptable senior",       groups: ["finance"],                status: "away",    last: "il y a 45 min" },
    { name: "Romain Faure",       email: "r.faure@astorya.fr",        role: "AE Junior · Support",    groups: ["commercial", "support"],  status: "online",  last: "il y a 2 min" },
    { name: "Léo Tanaka",         email: "l.tanaka@astorya.fr",       role: "Tech Lead Support",      groups: ["support", "ops"],         status: "online",  last: "il y a 1 min" },
    { name: "Diane Roussel",      email: "d.roussel@astorya.fr",      role: "Ingénieure support N2",  groups: ["support", "ops"],         status: "online",  last: "il y a 7 min" },
    { name: "Farid Belkacem",     email: "f.belkacem@astorya.fr",     role: "Technicien N1",          groups: ["support"],                status: "offline", last: "hier 17:10" },
    { name: "Valérie Chen",       email: "v.chen@astorya.fr",         role: "DAF",                    groups: ["finance", "rh"],          status: "online",  last: "il y a 32 min" },
  ];

  const selectedGroup = groups[2]; // "Commercial" mis en avant pour la maquette

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
        <div style={S.brandRow}>
          <div style={S.logo}><div style={S.logoMark}>H</div></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hub Astorya</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Administration</div>
          </div>
        </div>
        <button style={S.newBtn}>+ Inviter un utilisateur <span style={S.kbd}>I</span></button>

        <div style={S.navSection}>
          <div style={S.navLabel}>Navigation</div>
          <div style={S.navItem}><span style={S.bullet}>⌂</span><span style={{ flex: 1 }}>Accueil</span></div>
          <div style={S.navItem}><span style={S.bullet}>★</span><span style={{ flex: 1 }}>Favoris</span><span style={S.navCount}>6</span></div>
          <div style={S.navItem}><span style={S.bullet}>◷</span><span style={{ flex: 1 }}>Récents</span></div>
        </div>

        <div style={S.navSection}>
          <div style={S.navLabel}>Administration</div>
          <div style={{ ...S.navItem, ...S.navItemActive }}><span style={S.bullet}>◐</span><span style={{ flex: 1 }}>Groupes & accès</span><span style={{ ...S.navCount, background: "#3730a3", color: "#fff" }}>{groups.length}</span></div>
          <div style={S.navItem}><span style={S.bullet}>◯</span><span style={{ flex: 1 }}>Utilisateurs</span><span style={S.navCount}>{users.length}</span></div>
          <div style={S.navItem}><span style={S.bullet}>◇</span><span style={{ flex: 1 }}>Invitations</span><span style={S.navCount}>3</span></div>
          <div style={S.navItem}><span style={S.bullet}>◑</span><span style={{ flex: 1 }}>Rôles & permissions</span></div>
          <div style={S.navItem}><span style={S.bullet}>◧</span><span style={{ flex: 1 }}>Sécurité & SSO</span></div>
          <div style={S.navItem}><span style={S.bullet}>◨</span><span style={{ flex: 1 }}>Audit & journal</span></div>
        </div>

        <div style={{ marginTop: "auto", padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 11.5, color: "#475569" }}>
          <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>17 utilisateurs actifs</div>
          14 en ligne · 3 invitations en attente
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={S.main}>
        {/* HEADER */}
        <header style={S.header}>
          <div>
            <div style={S.breadcrumb}>Administration <span style={{ opacity: .4, margin: "0 6px" }}>/</span> Groupes & accès</div>
            <div style={S.title}>Gestion des groupes</div>
            <div style={S.subtitle}>Définissez les modules ERP accessibles à chaque groupe. {users.length} utilisateurs répartis dans {groups.length} groupes.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost}>↗ Exporter</button>
            <button style={S.btnGhost}>⟳ Synchroniser SSO</button>
            <button style={S.btnPrimary}>+ Nouveau groupe</button>
          </div>
        </header>

        {/* TABS */}
        <div style={S.tabsRow}>
          <div style={{ ...S.tab, ...S.tabActive }}>Groupes <span style={S.tabBadge}>{groups.length}</span></div>
          <div style={S.tab}>Utilisateurs <span style={S.tabBadge}>{users.length}</span></div>
          <div style={S.tab}>Invitations <span style={S.tabBadge}>3</span></div>
          <div style={S.tab}>Journal d'audit</div>
        </div>

        {/* GROUPES + DÉTAIL */}
        <section style={S.splitRow}>
          {/* Liste des groupes */}
          <div style={S.groupsCol}>
            <div style={S.colHeader}>
              <span>Groupes</span>
              <input style={S.search} placeholder="Rechercher…" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {groups.map((g) => {
                const active = g.id === selectedGroup.id;
                return (
                  <div key={g.id} style={{ ...S.groupItem, ...(active ? S.groupItemActive : {}) }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: g.color + "18", color: g.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{g.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: "#0f172a" }}>{g.name}</div>
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
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btnGhost}>Renommer</button>
                <button style={S.btnGhost}>Dupliquer</button>
                <button style={S.btnPrimary}>Enregistrer</button>
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
                <button style={S.linkBtn}>+ Ajouter un membre</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedGroup.members.map((m) => (
                  <div key={m} style={S.memberChip}>
                    <Avatar name={m} size={22} />
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b" }}>{m}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", cursor: "pointer" }}>×</span>
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
                  <button style={S.linkBtn}>Tout cocher</button>
                  <span style={{ color: "#cbd5e1" }}>·</span>
                  <button style={S.linkBtn}>Tout décocher</button>
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
                        <div key={m.key} style={{ ...S.tile, ...(on ? S.tileOn : S.tileOff) }}>
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
        </section>

        {/* TABLE UTILISATEURS */}
        <section style={S.usersCard}>
          <div style={S.colHeader}>
            <span>Tous les utilisateurs</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.search} placeholder="Filtrer par nom, email, groupe…" />
              <button style={S.btnGhost}>Filtres</button>
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
              {users.map((u) => (
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
                    <button style={S.iconBtn}>⋯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={S.tableFoot}>
            <div>Affichage 1–{users.length} sur {users.length} utilisateurs</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button style={S.pageBtn}>‹</button>
              <button style={{ ...S.pageBtn, ...S.pageBtnActive }}>1</button>
              <button style={S.pageBtn}>›</button>
            </div>
          </div>
        </section>
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
