// Module Administration — Gestion utilisateurs, groupes et accès aux tuiles
// Les groupes et l'identité active sont persistés via window.HubAccess (localStorage).

var UserManagement = () => {
  // Lecture une seule fois au mount + un poll de 200ms pour récupérer la
  // session Supabase. Pas de subscribe → pas de risque de boucle.
  var HA = typeof window !== "undefined" && window.HubAccess ? window.HubAccess : null;
  var [persistedGroups, setPersistedGroups] = React.useState(() => HA && HA.loadGroups && HA.loadGroups() || []);
  var [activeGroupId, setActiveGroupId] = React.useState(() => HA && HA.getActiveGroupId && HA.getActiveGroupId() || "admin");
  var [currentUser, setCurrentUser] = React.useState(() => HA && HA.getCurrentUser ? HA.getCurrentUser() : null);
  React.useEffect(() => {
    if (!HA) return;
    var t = setTimeout(() => {
      var pg = HA.loadGroups && HA.loadGroups();
      var ag = HA.getActiveGroupId && HA.getActiveGroupId();
      var cu = HA.getCurrentUser && HA.getCurrentUser();
      if (pg) setPersistedGroups(pg);
      if (ag) setActiveGroupId(ag);
      if (cu) setCurrentUser(cu);
    }, 200);
    return () => clearTimeout(t);
  }, []);
  var [selectedGroupId, setSelectedGroupId] = React.useState(() => persistedGroups[0]?.id || "admin");
  var [activeTab, setActiveTab] = React.useState("groups");
  var [userSearch, setUserSearch] = React.useState("");
  var [userFilterStatus, setUserFilterStatus] = React.useState(""); // "" | "online" | "away" | "offline"
  var [userPage, setUserPage] = React.useState(1);
  var USER_PAGE_SIZE = 10;
  var [loginOpen, setLoginOpen] = React.useState(false);
  var [savedFlash, setSavedFlash] = React.useState(null);
  var flashTimer = React.useRef(null);
  var flash = text => {
    setSavedFlash(text);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(null), 1800);
  };
  var updateGroupAccess = (groupId, mutator) => {
    var next = persistedGroups.map(g => {
      if (g.id !== groupId) return g;
      var access = mutator(g.access);
      return {
        ...g,
        access
      };
    });
    window.HubAccess.saveGroups(next);
  };
  var toggleTile = (groupId, key) => {
    updateGroupAccess(groupId, access => {
      var set = new Set(access);
      if (set.has(key)) set.delete(key);else set.add(key);
      return Array.from(set);
    });
    flash("Accès mis à jour");
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
      J: "#8b5cf6",
      P: "#0891b2",
      R: "#f97316",
      D: "#84cc16",
      F: "#4f46e5",
      H: "#475569",
      O: "#0e7a55",
      V: "#b45309"
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

  // ───── modules ERP (mêmes clés que l'Accueil ERP)
  var modules = [{
    key: "crm",
    cat: "Commercial",
    title: "CRM",
    color: "#4f46e5",
    bg: "#eef2ff"
  }, {
    key: "intel",
    cat: "Commercial",
    title: "Intelligence concurrentielle",
    color: "#dc2626",
    bg: "#fdecec"
  }, {
    key: "marketing",
    cat: "Commercial",
    title: "Marketing & Campagnes",
    color: "#ec4899",
    bg: "#fdf2f8"
  }, {
    key: "tech",
    cat: "Production",
    title: "Support technique",
    color: "#0ea5e9",
    bg: "#e0f4fc"
  }, {
    key: "projects",
    cat: "Production",
    title: "Projets & Livrables",
    color: "#a855f7",
    bg: "#f5efff"
  }, {
    key: "inventory",
    cat: "Production",
    title: "Stock & Catalogue",
    color: "#0891b2",
    bg: "#cffafe"
  }, {
    key: "accounting",
    cat: "Finance",
    title: "Comptabilité",
    color: "#10b981",
    bg: "#e8f8f1"
  }, {
    key: "billing",
    cat: "Finance",
    title: "Facturation & Devis",
    color: "#f59e0b",
    bg: "#fef0e6"
  }, {
    key: "treasury",
    cat: "Finance",
    title: "Trésorerie",
    color: "#0e7a55",
    bg: "#d1fae5"
  }, {
    key: "hr",
    cat: "RH",
    title: "RH & Paie",
    color: "#8b5cf6",
    bg: "#f3e8ff"
  }, {
    key: "time",
    cat: "RH",
    title: "Temps & Activités",
    color: "#14b8a6",
    bg: "#ccfbf1"
  }, {
    key: "reports",
    cat: "Pilotage",
    title: "Rapports & BI",
    color: "#3730a3",
    bg: "#e0e7ff"
  }, {
    key: "settings",
    cat: "Pilotage",
    title: "Administration",
    color: "#64748b",
    bg: "#f1f3f6"
  }];
  var ALL = modules.map(m => m.key);
  var groups = persistedGroups;

  // ───── Utilisateurs : chargés depuis la table profiles Supabase
  // Fallback : tableau de 2 admins en dur si Supabase n'est pas configuré
  // ou si la table profiles est vide (premier RUN).
  var [users, setUsers] = React.useState([{
    name: "Romain Daviaud",
    email: "achat@astorya.fr",
    role: "Direction",
    groups: ["admin", "direction", "commercial", "finance"],
    status: "online",
    last: "à l'instant"
  }, {
    name: "Augustin Morin",
    email: "a.morin@astorya.fr",
    role: "Direction",
    groups: ["admin", "direction", "commercial"],
    status: "online",
    last: "à l'instant"
  }]);
  React.useEffect(() => {
    if (!window.HubData || !window.HubData.fetchProfiles) return;
    var reload = async () => {
      try {
        var {
          data
        } = await window.HubData.fetchProfiles();
        if (!data || !data.length) return; // garde le fallback hardcodé
        // Pour chaque profile, on lit ses groupes via profile_groups (jointure côté Supabase)
        var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
        var pg = [];
        if (supa) {
          var {
            data: pgData
          } = await supa.from("profile_groups").select("profile_id, group_id");
          pg = pgData || [];
        }
        var next = data.map(p => ({
          id: p.id,
          name: p.name || p.email,
          email: p.email,
          role: p.role || "—",
          extension: p.extension_3cx || "",
          groups: pg.filter(x => x.profile_id === p.id).map(x => x.group_id),
          status: p.status === "active" ? "online" : p.status === "inactive" ? "offline" : "away",
          last: "—"
        }));
        setUsers(next);
      } catch (e) {
        console.warn("[UserManagement] fetchProfiles:", e);
      }
    };
    reload();
    if (window.HubData.subscribeChanges) return window.HubData.subscribeChanges(reload);
  }, []);
  var selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
  var activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  var statusColor = {
    online: "#10b981",
    away: "#f59e0b",
    offline: "#cbd5e1"
  };
  var groupChip = g => /*#__PURE__*/React.createElement("span", {
    key: g.id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: g.color + "15",
      color: g.color,
      border: `1px solid ${g.color}30`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: g.color
    }
  }), g.name);
  var Toggle = ({
    on
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 18,
      borderRadius: 999,
      background: on ? "#4f46e5" : "#e2e8f0",
      position: "relative",
      flexShrink: 0,
      transition: "background 120ms"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 2,
      left: on ? 14 : 2,
      width: 14,
      height: 14,
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.15)"
    }
  }));
  var accessSet = new Set(selectedGroup.access);
  var grantedCount = accessSet.size;
  return /*#__PURE__*/React.createElement("div", {
    style: S.frame
  }, /*#__PURE__*/React.createElement("aside", {
    style: S.sidebar
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    title: "Retour \xE0 l'accueil",
    style: {
      ...S.brandRow,
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logoMark
  }, "H")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Administration"))), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var email = window.HubModal ? await window.HubModal.prompt({
        title: "Inviter un utilisateur",
        label: "Email professionnel",
        placeholder: "prenom.nom@astorya.fr",
        okLabel: "Envoyer l'invitation"
      }) : prompt("Email du nouvel utilisateur Astorya :");
      if (!email || !email.trim()) return;
      var V = window.HubValidators;
      var err = V && V.email(email.trim());
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
        var {
          error
        } = await window.HubSupabase.client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin + "/bienvenue"
          }
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
    },
    style: {
      ...S.newBtn,
      cursor: "pointer"
    }
  }, "+ Inviter un utilisateur"), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Navigation"), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u2302"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Accueil")), /*#__PURE__*/React.createElement("a", {
    href: "/ticketing",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u270E"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Ticketing")), /*#__PURE__*/React.createElement("a", {
    href: "/fiche-client",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25C9"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Fiche client")), /*#__PURE__*/React.createElement("a", {
    href: "/crm",
    style: {
      ...S.navItem,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "CRM"))), /*#__PURE__*/React.createElement("div", {
    style: S.navSection
  }, /*#__PURE__*/React.createElement("div", {
    style: S.navLabel
  }, "Administration"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("groups"),
    style: {
      ...S.navItem,
      ...(activeTab === "groups" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25D0"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Groupes & acc\xE8s"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.navCount,
      ...(activeTab === "groups" ? {
        background: "#3730a3",
        color: "#fff"
      } : {})
    }
  }, groups.length)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("users"),
    style: {
      ...S.navItem,
      ...(activeTab === "users" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25EF"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Utilisateurs"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.navCount,
      ...(activeTab === "users" ? {
        background: "#3730a3",
        color: "#fff"
      } : {})
    }
  }, users.length)), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("invitations"),
    style: {
      ...S.navItem,
      ...(activeTab === "invitations" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25C7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Invitations")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("templates"),
    style: {
      ...S.navItem,
      ...(activeTab === "templates" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Mod\xE8les de contrat")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("integrations"),
    style: {
      ...S.navItem,
      ...(activeTab === "integrations" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\uD83D\uDD0C"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Int\xE9grations API")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTab("audit"),
    style: {
      ...S.navItem,
      ...(activeTab === "audit" ? S.navItemActive : {}),
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.bullet
  }, "\u25E8"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Audit & journal"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: 10,
      borderRadius: 8,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      fontSize: 11.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: 4
    }
  }, "17 utilisateurs actifs"), "14 en ligne \xB7 3 invitations en attente"), currentUser ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 8,
      background: "#fff",
      border: "1px solid #e2e8f0"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: currentUser.name,
    size: 26
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
  }, currentUser.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, currentUser.role)), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
      if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
      window.HubAccess.logout();
      window.location.href = "/login";
    },
    title: "Se d\xE9connecter",
    style: {
      background: "transparent",
      border: 0,
      color: "#94a3b8",
      fontSize: 14,
      cursor: "pointer",
      padding: 4
    }
  }, "\u23FB")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setLoginOpen(true),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "10px 12px",
      borderRadius: 8,
      background: "#0f172a",
      border: 0,
      color: "#fff",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\u2192 Se connecter")), /*#__PURE__*/React.createElement(LoginModal, {
    open: loginOpen,
    onClose: () => setLoginOpen(false)
  }), /*#__PURE__*/React.createElement("main", {
    style: S.main
  }, /*#__PURE__*/React.createElement("header", {
    style: S.header
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.breadcrumb
  }, "Administration ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .4,
      margin: "0 6px"
    }
  }, "/"), " Groupes & acc\xE8s"), /*#__PURE__*/React.createElement("div", {
    style: S.title
  }, "Gestion des groupes"), /*#__PURE__*/React.createElement("div", {
    style: S.subtitle
  }, "D\xE9finissez les modules ERP accessibles \xE0 chaque groupe. ", users.length, " utilisateurs r\xE9partis dans ", groups.length, " groupes.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 999,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Vue Accueil ERP comme"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: activeGroup.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "#0f172a"
    }
  }, activeGroup.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("a", {
    href: "./",
    style: {
      color: "#3730a3",
      fontWeight: 600,
      textDecoration: "none"
    }
  }, "Ouvrir \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (!confirm("⚠ DANGER : Supprimer DÉFINITIVEMENT toutes les données métier ?\n\n• Tous les clients/prospects\n• Toutes les opportunités\n• Tous les contacts\n• Toutes les actions\n• Tous les contrats\n• localStorage entier\n\n(Les comptes Romain + Augustin restent dans Auth)")) return;
      if (!confirm("Vraiment sûr ? Cette action est irréversible.")) return;
      var report = [];
      // Supabase
      if (window.HubSupabase && window.HubSupabase.enabled && window.HubSupabase.client) {
        var s = window.HubSupabase.client;
        for (var t of ["actions", "contacts", "contracts", "opportunities", "clients"]) {
          try {
            var {
              error
            } = await s.from(t).delete().not("id", "is", null);
            report.push((error ? "✗ " : "✓ ") + t + (error ? " — " + error.message : ""));
          } catch (e) {
            report.push("✗ " + t + " — " + e.message);
          }
        }
      } else {
        report.push("ℹ Supabase non configuré, skip");
      }
      // localStorage
      try {
        var keys = Object.keys(localStorage).filter(k => k.startsWith("hubAstorya."));
        keys.forEach(k => localStorage.removeItem(k));
        report.push("✓ localStorage : " + keys.length + " clés supprimées");
      } catch (e) {
        report.push("✗ localStorage — " + e.message);
      }
      alert("Reset terminé :\n\n" + report.join("\n"));
      flash("✓ Base vidée");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    style: {
      ...S.btnGhost,
      borderColor: "#fecaca",
      color: "#dc2626",
      cursor: "pointer"
    },
    title: "Supprimer toutes les donn\xE9es m\xE9tier (clients, opps, contacts, actions, contrats)"
  }, "\uD83D\uDDD1 Reset donn\xE9es"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var ok = window.HubModal ? await window.HubModal.confirm({
        title: "Réinitialiser les groupes ?",
        message: "Tous les groupes et leurs accès aux modules ERP reviendront aux valeurs par défaut.",
        okLabel: "Réinitialiser",
        okStyle: "danger"
      }) : confirm("Réinitialiser tous les groupes et accès aux valeurs par défaut ?");
      if (ok) {
        window.HubAccess.resetAll();
        flash("Réinitialisé");
      }
    },
    style: S.btnGhost
  }, "\u27F2 R\xE9init. groupes"), /*#__PURE__*/React.createElement("a", {
    href: "https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/providers",
    target: "_blank",
    rel: "noopener",
    style: {
      ...S.btnGhost,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center"
    },
    title: "Configurer SAML / OAuth / SSO dans Supabase"
  }, "\uD83D\uDD17 Configurer SSO \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var label = window.HubModal ? await window.HubModal.prompt({
        title: "Créer un groupe d'accès",
        label: "Nom du groupe",
        placeholder: "ex: Commercial DACH",
        okLabel: "Créer"
      }) : prompt("Nom du nouveau groupe :");
      if (!label || !label.trim()) return;
      var id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group-" + Date.now();
      if (persistedGroups.find(g => g.id === id)) {
        alert("Un groupe avec cet identifiant existe déjà");
        return;
      }
      var colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4899"];
      var newGroup = {
        id,
        label: label.trim(),
        color: colors[persistedGroups.length % colors.length],
        accessibleModules: [],
        description: "Nouveau groupe créé manuellement"
      };
      window.HubAccess.saveGroups([...persistedGroups, newGroup]);
      setSelectedGroupId(id);
      flash("Groupe « " + label + " » créé");
    },
    style: {
      ...S.btnPrimary,
      cursor: "pointer"
    }
  }, "+ Nouveau groupe")))), /*#__PURE__*/React.createElement("div", {
    style: S.tabsRow
  }, [{
    k: "groups",
    label: "Groupes",
    badge: groups.length
  }, {
    k: "users",
    label: "Utilisateurs",
    badge: users.length
  }, {
    k: "invitations",
    label: "Invitations",
    badge: 0
  }, {
    k: "audit",
    label: "Journal d'audit"
  }].map(t => /*#__PURE__*/React.createElement("div", {
    key: t.k,
    onClick: () => setActiveTab(t.k),
    style: {
      ...S.tab,
      ...(activeTab === t.k ? S.tabActive : {}),
      cursor: "pointer"
    }
  }, t.label, t.badge != null && /*#__PURE__*/React.createElement("span", {
    style: S.tabBadge
  }, t.badge)))), activeTab === "groups" && /*#__PURE__*/React.createElement("section", {
    style: S.splitRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.groupsCol
  }, /*#__PURE__*/React.createElement("div", {
    style: S.colHeader
  }, /*#__PURE__*/React.createElement("span", null, "Groupes"), /*#__PURE__*/React.createElement("input", {
    style: S.search,
    placeholder: "Rechercher\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, groups.map(g => {
    var active = g.id === selectedGroup.id;
    var isViewer = g.id === activeGroup.id;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      onClick: () => setSelectedGroupId(g.id),
      style: {
        ...S.groupItem,
        ...(active ? S.groupItemActive : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        background: g.color + "18",
        color: g.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0
      }
    }, g.name[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        color: "#0f172a"
      }
    }, g.name), isViewer && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "#10b981",
        background: "#dcfce7",
        padding: "1px 6px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: 0.3
      }
    }, "Vue actuelle")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#64748b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, g.members.length, " membre", g.members.length > 1 ? "s" : "", " \xB7 ", g.access.length, "/", ALL.length, " modules")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        marginLeft: 4
      }
    }, g.members.slice(0, 3).map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: m,
      style: {
        marginLeft: i === 0 ? 0 : -6,
        border: "1.5px solid #fff",
        borderRadius: 999
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: m,
      size: 20
    }))), g.members.length > 3 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: -6,
        width: 20,
        height: 20,
        borderRadius: 999,
        background: "#f1f5f9",
        border: "1.5px solid #fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9.5,
        fontWeight: 700,
        color: "#475569"
      }
    }, "+", g.members.length - 3)));
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.detailCol
  }, /*#__PURE__*/React.createElement("div", {
    style: S.detailHead
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: selectedGroup.color + "18",
      color: selectedGroup.color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 800
    }
  }, selectedGroup.name[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, selectedGroup.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: selectedGroup.color,
      background: selectedGroup.color + "18",
      padding: "2px 8px",
      borderRadius: 999,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "actif")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      marginTop: 2,
      maxWidth: 560
    }
  }, selectedGroup.description))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, savedFlash && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#10b981"
    }
  }, "\u2713 ", savedFlash), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      var name = window.HubModal ? await window.HubModal.prompt({
        title: "Renommer le groupe",
        label: "Nouveau nom",
        default: selectedGroup.name || selectedGroup.label,
        okLabel: "Renommer"
      }) : prompt("Nouveau nom du groupe :", selectedGroup.name || selectedGroup.label);
      if (!name || !name.trim()) return;
      var next = persistedGroups.map(g => g.id === selectedGroup.id ? {
        ...g,
        label: name.trim(),
        name: name.trim()
      } : g);
      window.HubAccess.saveGroups(next);
      if (window.HubToast) window.HubToast.success("✓ Groupe renommé en « " + name.trim() + " »");
    },
    style: {
      ...S.btnGhost,
      cursor: "pointer"
    }
  }, "Renommer"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.HubAccess.setActiveGroupId(selectedGroup.id),
    style: selectedGroup.id === activeGroup.id ? {
      ...S.btnGhost,
      color: "#10b981",
      borderColor: "#bbf7d0",
      background: "#f0fdf4"
    } : S.btnPrimary
  }, selectedGroup.id === activeGroup.id ? "✓ Connecté à l'Accueil ERP" : "↗ Voir l'Accueil comme ce groupe"))), /*#__PURE__*/React.createElement("div", {
    style: S.kpiRow
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Membres"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, selectedGroup.members.length)), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Modules autoris\xE9s"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, grantedCount, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#94a3b8",
      fontWeight: 500
    }
  }, "/ ", ALL.length))), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Derni\xE8re modification"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV,
    title: "Catherine Marchand \xB7 il y a 2 j"
  }, "il y a 2 j")), /*#__PURE__*/React.createElement("div", {
    style: S.kpi
  }, /*#__PURE__*/React.createElement("div", {
    style: S.kpiK
  }, "Connexions 7 j"), /*#__PURE__*/React.createElement("div", {
    style: S.kpiV
  }, "148"))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionHead
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionTitle
  }, "Membres du groupe"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var candidates = users.filter(u => !u.groups.includes(selectedGroup.id));
      if (!candidates.length) {
        alert("Tous les utilisateurs font déjà partie de ce groupe");
        return;
      }
      var list = candidates.map((u, i) => `${i + 1}. ${u.name} (${u.email})`).join("\n");
      var choice = prompt(`Ajouter au groupe ${selectedGroup.name || selectedGroup.label} :\n\n${list}\n\nTapez le numéro :`);
      var idx = parseInt(choice, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= candidates.length) return;
      var target = candidates[idx];
      flash(`✓ ${target.name} ajouté au groupe (UI-only — Supabase à connecter)`);
    },
    style: {
      ...S.linkBtn,
      cursor: "pointer"
    }
  }, "+ Ajouter un membre")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, selectedGroup.members.map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: S.memberChip
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500,
      color: "#1e293b"
    }
  }, m), /*#__PURE__*/React.createElement("span", {
    onClick: () => {
      if (!confirm(`Retirer « ${m} » du groupe ${selectedGroup.name || selectedGroup.label} ?`)) return;
      var next = persistedGroups.map(g => g.id === selectedGroup.id ? {
        ...g,
        members: (g.members || []).filter(x => x !== m)
      } : g);
      window.HubAccess.saveGroups(next);
      flash("✓ Membre retiré du groupe");
    },
    style: {
      fontSize: 13,
      color: "#94a3b8",
      cursor: "pointer",
      padding: "0 4px"
    },
    title: "Retirer du groupe"
  }, "\xD7"))))), /*#__PURE__*/React.createElement("div", {
    style: S.section
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionHead
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.sectionTitle
  }, "Acc\xE8s aux modules ERP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 2
    }
  }, "Cochez les tuiles visibles depuis l'Accueil ERP pour ce groupe.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: S.linkBtn,
    onClick: () => {
      updateGroupAccess(selectedGroup.id, () => ALL.slice());
      flash("Tous les modules autorisés");
    }
  }, "Tout cocher"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("button", {
    style: S.linkBtn,
    onClick: () => {
      updateGroupAccess(selectedGroup.id, () => []);
      flash("Tous les modules retirés");
    }
  }, "Tout d\xE9cocher"))), [...new Set(modules.map(m => m.cat))].map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.catLabel
  }, cat), /*#__PURE__*/React.createElement("div", {
    style: S.tilesGrid
  }, modules.filter(m => m.cat === cat).map(m => {
    var on = accessSet.has(m.key);
    return /*#__PURE__*/React.createElement("div", {
      key: m.key,
      onClick: () => toggleTile(selectedGroup.id, m.key),
      style: {
        ...S.tile,
        ...(on ? S.tileOn : S.tileOff)
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: m.bg,
        color: m.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 700,
        flexShrink: 0,
        opacity: on ? 1 : 0.45
      }
    }, m.title[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: on ? "#0f172a" : "#94a3b8"
      }
    }, m.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 1
      }
    }, on ? "Visible sur l'Accueil" : "Masqué pour ce groupe")), /*#__PURE__*/React.createElement(Toggle, {
      on: on
    }));
  }))))))), activeTab === "invitations" && /*#__PURE__*/React.createElement("section", {
    style: {
      ...S.splitRow,
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12
    }
  }, "\uD83D\uDCE8"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
      margin: "0 0 6px"
    }
  }, "Aucune invitation en attente"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      margin: "0 0 16px"
    }
  }, "Les utilisateurs invit\xE9s via le dashboard Supabase apparaissent ici tant qu'ils n'ont pas confirm\xE9 leur email."), /*#__PURE__*/React.createElement("a", {
    href: "https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users",
    target: "_blank",
    rel: "noopener",
    style: {
      display: "inline-block",
      padding: "8px 14px",
      background: "#0f172a",
      color: "#fff",
      borderRadius: 7,
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 600
    }
  }, "+ Inviter dans Supabase \u2192"))), activeTab === "templates" && /*#__PURE__*/React.createElement(ContractTemplatesPanel, null), activeTab === "integrations" && /*#__PURE__*/React.createElement(IntegrationsPanel, null), activeTab === "audit" && /*#__PURE__*/React.createElement("section", {
    style: {
      ...S.splitRow,
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 12
    }
  }, "\uD83D\uDCDC"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
      margin: "0 0 6px"
    }
  }, "Journal d'audit"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "#64748b",
      margin: "0 0 8px"
    }
  }, "Le journal d'audit (connexions, modifications de groupes, suppressions) n\xE9cessite une table d\xE9di\xE9e dans Supabase."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: "#94a3b8",
      margin: 0,
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "\xC0 venir : audit_logs (auth.users, action, target, timestamp)"))), (activeTab === "groups" || activeTab === "users") && /*#__PURE__*/React.createElement("section", {
    style: S.usersCard
  }, /*#__PURE__*/React.createElement("div", {
    style: S.colHeader
  }, /*#__PURE__*/React.createElement("span", null, "Tous les utilisateurs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: S.search,
    placeholder: "Filtrer par nom, email, r\xF4le\u2026",
    value: userSearch,
    onChange: e => {
      setUserSearch(e.target.value);
      setUserPage(1);
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: userFilterStatus,
    onChange: e => {
      setUserFilterStatus(e.target.value);
      setUserPage(1);
    },
    style: {
      ...S.btnGhost,
      cursor: "pointer",
      paddingRight: 28
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Tous statuts"), /*#__PURE__*/React.createElement("option", {
    value: "online"
  }, "\u25CF En ligne"), /*#__PURE__*/React.createElement("option", {
    value: "away"
  }, "\u25CF Absent"), /*#__PURE__*/React.createElement("option", {
    value: "offline"
  }, "\u25CB Hors ligne")))), /*#__PURE__*/React.createElement("table", {
    style: S.table
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Utilisateur"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "R\xF4le"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Groupes"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Ext. 3CX"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Statut"), /*#__PURE__*/React.createElement("th", {
    style: S.th
  }, "Derni\xE8re connexion"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...S.th,
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, (() => {
    var q = userSearch.trim().toLowerCase();
    var filtered = users.filter(u => {
      if (userFilterStatus && u.status !== userFilterStatus) return false;
      if (q && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) return false;
      return true;
    });
    var totalP = Math.max(1, Math.ceil(filtered.length / USER_PAGE_SIZE));
    var pageSafe = Math.min(userPage, totalP);
    var slice = filtered.slice((pageSafe - 1) * USER_PAGE_SIZE, pageSafe * USER_PAGE_SIZE);
    if (filtered.length === 0) {
      return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
        colSpan: 7,
        style: {
          padding: 24,
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 13
        }
      }, "Aucun utilisateur ne correspond."));
    }
    return slice.map(u => /*#__PURE__*/React.createElement("tr", {
      key: u.email,
      style: S.tr
    }, /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      size: 28
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        right: -1,
        bottom: -1,
        width: 8,
        height: 8,
        borderRadius: 999,
        background: statusColor[u.status],
        border: "1.5px solid #fff"
      }
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#0f172a"
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#94a3b8"
      }
    }, u.email)))), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "#475569"
      }
    }, u.role)), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 4
      }
    }, u.groups.map(gid => {
      var g = groups.find(x => x.id === gid);
      return g ? groupChip(g) : null;
    }))), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      defaultValue: u.extension || "",
      placeholder: "ex : 201",
      maxLength: 6,
      onBlur: async e => {
        var v = e.target.value.trim();
        if (v === (u.extension || "")) return;
        if (!u.id) {
          if (window.HubToast) window.HubToast.warn("Profil non synchronisé Supabase");
          return;
        }
        var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
        if (!supa) return;
        var {
          error
        } = await supa.from("profiles").update({
          extension_3cx: v || null
        }).eq("id", u.id);
        if (error) {
          if (window.HubToast) window.HubToast.error("Erreur : " + error.message);
        } else {
          if (window.HubToast) window.HubToast.success(v ? `Extension ${v} liée à ${u.name}` : "Extension retirée");
          u.extension = v;
        }
      },
      style: {
        width: 80,
        padding: "4px 8px",
        border: "1px solid #e2e8f0",
        borderRadius: 6,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        outline: "none",
        textAlign: "center"
      }
    })), /*#__PURE__*/React.createElement("td", {
      style: S.td
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#475569",
        textTransform: "capitalize"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: statusColor[u.status]
      }
    }), u.status === "online" ? "En ligne" : u.status === "away" ? "Absent" : "Hors ligne")), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        color: "#64748b",
        fontSize: 12
      }
    }, u.last), /*#__PURE__*/React.createElement("td", {
      style: {
        ...S.td,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: `https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/auth/users`,
      target: "_blank",
      rel: "noopener",
      style: {
        ...S.iconBtn,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
      },
      title: "G\xE9rer ce compte dans Supabase Auth"
    }, "\u22EF"))));
  })())), (() => {
    var q = userSearch.trim().toLowerCase();
    var filtered = users.filter(u => {
      if (userFilterStatus && u.status !== userFilterStatus) return false;
      if (q && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) return false;
      return true;
    });
    var totalP = Math.max(1, Math.ceil(filtered.length / USER_PAGE_SIZE));
    var pageSafe = Math.min(userPage, totalP);
    var start = (pageSafe - 1) * USER_PAGE_SIZE + 1;
    var end = Math.min(pageSafe * USER_PAGE_SIZE, filtered.length);
    return /*#__PURE__*/React.createElement("div", {
      style: S.tableFoot
    }, /*#__PURE__*/React.createElement("div", null, filtered.length === 0 ? "Aucun résultat" : `Affichage ${start}–${end} sur ${filtered.length} utilisateur${filtered.length > 1 ? "s" : ""}`, q || userFilterStatus ? ` (filtré sur ${users.length})` : ""), totalP > 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setUserPage(p => Math.max(1, p - 1)),
      disabled: pageSafe === 1,
      style: {
        ...S.pageBtn,
        opacity: pageSafe === 1 ? 0.5 : 1,
        cursor: pageSafe === 1 ? "not-allowed" : "pointer"
      }
    }, "\u2039"), Array.from({
      length: totalP
    }, (_, i) => i + 1).map(n => /*#__PURE__*/React.createElement("button", {
      key: n,
      onClick: () => setUserPage(n),
      style: {
        ...S.pageBtn,
        ...(pageSafe === n ? S.pageBtnActive : {}),
        cursor: "pointer"
      }
    }, n)), /*#__PURE__*/React.createElement("button", {
      onClick: () => setUserPage(p => Math.min(totalP, p + 1)),
      disabled: pageSafe === totalP,
      style: {
        ...S.pageBtn,
        opacity: pageSafe === totalP ? 0.5 : 1,
        cursor: pageSafe === totalP ? "not-allowed" : "pointer"
      }
    }, "\u203A")));
  })())));
};

// ───────── STYLES
var S = {
  frame: {
    display: "flex",
    height: "100%",
    minHeight: 1900,
    background: "#f3f5f8",
    color: "#0f172a",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13
  },
  sidebar: {
    width: 248,
    background: "#fff",
    borderRight: "1px solid #eef1f5",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: 14,
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
    minHeight: 1900
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 4px 8px"
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700
  },
  logoMark: {
    fontSize: 14,
    letterSpacing: -0.5
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  kbd: {
    background: "rgba(255,255,255,.15)",
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10.5,
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
    padding: "6px 8px",
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
  bullet: {
    width: 14,
    display: "inline-flex",
    justifyContent: "center",
    fontSize: 12,
    color: "#94a3b8"
  },
  navCount: {
    fontSize: 10.5,
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#64748b",
    padding: "1px 7px",
    borderRadius: 999
  },
  main: {
    flex: 1,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16
  },
  breadcrumb: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 4
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    maxWidth: 720
  },
  btnPrimary: {
    padding: "8px 14px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnGhost: {
    padding: "8px 12px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer"
  },
  tabsRow: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0"
  },
  tab: {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  tabActive: {
    color: "#3730a3",
    fontWeight: 700,
    borderBottomColor: "#3730a3"
  },
  tabBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    background: "#eef2ff",
    color: "#3730a3",
    padding: "1px 7px",
    borderRadius: 999
  },
  splitRow: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 18,
    alignItems: "flex-start"
  },
  groupsCol: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden"
  },
  colHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 700
  },
  search: {
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    color: "#475569",
    background: "#f8fafc",
    outline: "none",
    width: 180
  },
  groupItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid #f1f5f9",
    cursor: "pointer"
  },
  groupItemActive: {
    background: "#f8faff",
    borderLeft: "3px solid #3730a3",
    paddingLeft: 11
  },
  detailCol: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18
  },
  detailHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #f1f5f9"
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10
  },
  kpi: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "10px 12px",
    border: "1px solid #eef2f7"
  },
  kpiK: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600
  },
  kpiV: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 4
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  linkBtn: {
    background: "transparent",
    border: 0,
    color: "#3730a3",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0
  },
  memberChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px 4px 4px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0"
  },
  catLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8
  },
  tilesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10
  },
  tile: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "background 120ms"
  },
  tileOn: {
    background: "#fff",
    borderColor: "#c7d2fe"
  },
  tileOff: {
    background: "#f8fafc",
    borderColor: "#eef2f7"
  },
  usersCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13
  },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9"
  },
  td: {
    padding: "10px 16px",
    verticalAlign: "middle"
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "transparent",
    border: "1px solid transparent",
    color: "#94a3b8",
    fontSize: 16,
    cursor: "pointer"
  },
  tableFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid #f1f5f9",
    fontSize: 12,
    color: "#64748b"
  },
  pageBtn: {
    padding: "4px 10px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer"
  },
  pageBtnActive: {
    background: "#3730a3",
    borderColor: "#3730a3",
    color: "#fff",
    fontWeight: 700
  }
};

// ════════════════════════════════════════════════════════════════════
// IntegrationsPanel — sous-composant tab "Intégrations API"
// ════════════════════════════════════════════════════════════════════
var IntegrationsPanel = () => {
  var TOKEN_KEY = "hubAstorya.pappers.token";
  var TEAMS_KEY = "hubAstorya.teams.webhookUrl";
  var [pappersToken, setPappersToken] = React.useState("");
  var [savedToken, setSavedToken] = React.useState("");
  var [testing, setTesting] = React.useState(false);
  var [testResult, setTestResult] = React.useState(null);
  var [teamsUrl, setTeamsUrl] = React.useState("");
  var [savedTeamsUrl, setSavedTeamsUrl] = React.useState("");
  var [teamsTesting, setTeamsTesting] = React.useState(false);
  var [tcxSecret, setTcxSecret] = React.useState("");
  var [tcxSimPhone, setTcxSimPhone] = React.useState("");
  var [tcxServerUrl, setTcxServerUrl] = React.useState("https://telcomastorya.my3cx.fr:5001");
  var [tcxClientId, setTcxClientId] = React.useState("");
  var [tcxClientSecret, setTcxClientSecret] = React.useState("");
  var [savedTcxCC, setSavedTcxCC] = React.useState({
    url: "",
    id: "",
    secret: ""
  });
  var [tcxCCTesting, setTcxCCTesting] = React.useState(false);
  var WEBHOOK_URL = "https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/phone-webhook";
  var CC_URL = "https://cqdgecllzyqimfuovrpp.supabase.co/functions/v1/3cx-call-control";
  React.useEffect(() => {
    var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    supa.from("app_settings").select("key, value").in("key", ["3cx_webhook_secret", "3cx_server_url", "3cx_client_id", "3cx_client_secret"]).then(({
      data
    }) => {
      var cfg = Object.fromEntries((data || []).map(s => [s.key, s.value]));
      if (cfg["3cx_webhook_secret"]) setTcxSecret(cfg["3cx_webhook_secret"]);
      if (cfg["3cx_server_url"]) setTcxServerUrl(cfg["3cx_server_url"]);
      if (cfg["3cx_client_id"]) setTcxClientId(cfg["3cx_client_id"]);
      if (cfg["3cx_client_secret"]) setTcxClientSecret(cfg["3cx_client_secret"]);
      setSavedTcxCC({
        url: cfg["3cx_server_url"] || "",
        id: cfg["3cx_client_id"] || "",
        secret: cfg["3cx_client_secret"] || ""
      });
    }).catch(() => {});
  }, []);
  var regenTcxSecret = async () => {
    var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Régénérer le secret 3CX ?",
      message: "L'ancien secret sera invalidé immédiatement. Tu devras le remettre à jour côté console 3CX.",
      okLabel: "Régénérer",
      okStyle: "danger"
    }) : confirm("Régénérer le secret 3CX ? L'ancien sera invalidé.");
    if (!ok) return;
    var newSecret = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
    var {
      error
    } = await supa.from("app_settings").upsert({
      key: "3cx_webhook_secret",
      value: newSecret
    });
    if (error) {
      if (window.HubToast) window.HubToast.error("Erreur : " + error.message);
      return;
    }
    setTcxSecret(newSecret);
    if (window.HubToast) window.HubToast.success("✓ Nouveau secret généré — mets-le à jour côté 3CX");
  };
  var saveTcxCC = async () => {
    var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
    if (!supa) return;
    var rows = [{
      key: "3cx_server_url",
      value: tcxServerUrl.trim()
    }, {
      key: "3cx_client_id",
      value: tcxClientId.trim()
    }, {
      key: "3cx_client_secret",
      value: tcxClientSecret.trim()
    }];
    var {
      error
    } = await supa.from("app_settings").upsert(rows);
    if (error) {
      if (window.HubToast) window.HubToast.error("Erreur : " + error.message);
      return;
    }
    setSavedTcxCC({
      url: tcxServerUrl.trim(),
      id: tcxClientId.trim(),
      secret: tcxClientSecret.trim()
    });
    if (window.HubToast) window.HubToast.success("✓ Config Call Control sauvegardée");
  };
  var testTcxCC = async () => {
    setTcxCCTesting(true);
    try {
      var {
        data: session
      } = await window.HubSupabase.client.auth.getSession();
      var jwt = session?.session?.access_token;
      if (!jwt) throw new Error("Pas de session — reconnecte-toi");
      var me = await window.api.auth.getUser();
      var {
        data: profile
      } = await window.HubSupabase.client.from("profiles").select("extension_3cx").eq("id", me.id).single();
      if (!profile?.extension_3cx) throw new Error("Aucune extension renseignée pour ton user");
      var resp = await fetch(CC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": "Bearer " + jwt
        },
        body: JSON.stringify({
          action: "status",
          extension: profile.extension_3cx
        })
      });
      var json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "HTTP " + resp.status);
      if (window.HubToast) window.HubToast.success("✓ Connexion 3CX OK — extension " + profile.extension_3cx + (json.active_call ? " (appel actif détecté)" : " (au repos)"));
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + e.message);
    } finally {
      setTcxCCTesting(false);
    }
  };
  var copyToClip = (txt, label) => {
    navigator.clipboard.writeText(txt).then(() => {
      if (window.HubToast) window.HubToast.success("✓ " + (label || "Copié"));
    });
  };
  var simulateCall = () => {
    if (!window.HubHotline || !window.HubHotline.simulate) {
      if (window.HubToast) window.HubToast.error("Module hotline non chargé");
      return;
    }
    window.HubHotline.simulate(tcxSimPhone.trim() || "+33 6 12 34 56 78", "Appel test (local)");
  };
  React.useEffect(() => {
    try {
      var t = localStorage.getItem(TOKEN_KEY) || "";
      setPappersToken(t);
      setSavedToken(t);
      var w = localStorage.getItem(TEAMS_KEY) || "";
      setTeamsUrl(w);
      setSavedTeamsUrl(w);
    } catch (e) {}
  }, []);
  var saveTeams = () => {
    try {
      var cleaned = teamsUrl.trim();
      if (cleaned && !/^https?:\/\//i.test(cleaned)) {
        if (window.HubToast) window.HubToast.error("URL invalide — doit commencer par https://");
        return;
      }
      if (cleaned) localStorage.setItem(TEAMS_KEY, cleaned);else localStorage.removeItem(TEAMS_KEY);
      setSavedTeamsUrl(cleaned);
      if (window.HubToast) window.HubToast.success(cleaned ? "✓ Webhook Teams enregistré" : "✓ Webhook Teams retiré");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + e.message);
    }
  };
  var testTeams = async () => {
    if (!teamsUrl.trim()) {
      if (window.HubToast) window.HubToast.warn("Colle d'abord une URL de webhook");
      return;
    }
    saveTeams();
    setTeamsTesting(true);
    try {
      if (!window.HubTeams) throw new Error("Module Teams non chargé");
      await window.HubTeams.test();
      if (window.HubToast) window.HubToast.success("✓ Message de test envoyé — vérifie ton canal Teams");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec : " + e.message);
    } finally {
      setTeamsTesting(false);
    }
  };
  var removeTeams = () => {
    setTeamsUrl("");
    try {
      localStorage.removeItem(TEAMS_KEY);
    } catch (e) {}
    setSavedTeamsUrl("");
    if (window.HubToast) window.HubToast.info("Webhook Teams retiré — plus de notifications canal");
  };
  var save = () => {
    try {
      var cleaned = pappersToken.trim();
      if (cleaned) localStorage.setItem(TOKEN_KEY, cleaned);else localStorage.removeItem(TOKEN_KEY);
      setSavedToken(cleaned);
      if (window.HubToast) window.HubToast.success(cleaned ? "✓ Token Pappers enregistré" : "✓ Token Pappers retiré");
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + e.message);
    }
  };
  var test = async () => {
    if (!pappersToken.trim()) {
      if (window.HubToast) window.HubToast.warn("Colle d'abord un token avant de tester");
      return;
    }
    // Sauvegarde + teste sur un SIREN connu (Astorya / un test)
    save();
    setTesting(true);
    setTestResult(null);
    try {
      // SIREN INPI (test public) : 13002526500013 (3 plus 9 = juste 9 pour SIREN)
      // On utilise un SIREN simple connu : 552120222 (L'OREAL) — toujours actif
      var r = await window.HubPappers.checkSiren("552120222");
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
    } finally {
      setTesting(false);
    }
  };
  var remove = () => {
    setPappersToken("");
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    setSavedToken("");
    if (window.HubToast) window.HubToast.info("Token Pappers retiré — l'app retombe sur BODACC (gratuit, sans clé)");
  };
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "\uD83D\uDD0C Int\xE9grations API tierces"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Configure les sources de donn\xE9es externes utilis\xE9es par Hub Astorya pour enrichir les fiches client.")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "linear-gradient(135deg, #4f46e5, #a855f7)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 800
    }
  }, "P"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Pappers"), savedToken ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#dcfce7",
      color: "#065f46",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CF ACTIF") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#fef3c7",
      color: "#92400e",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CB INACTIF (fallback BODACC)")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Base entreprises FR : proc\xE9dures collectives, \xE9tat administratif, capital, effectif, dirigeants, NAF, si\xE8ge."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 8,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "\uD83D\uDCCB \xC9tapes pour obtenir un token"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 12.5,
      color: "#475569",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "Ouvre ", /*#__PURE__*/React.createElement("a", {
    href: "https://www.pappers.fr/api",
    target: "_blank",
    rel: "noopener",
    style: {
      color: "#3730a3",
      fontWeight: 600
    }
  }, "pappers.fr/api \u2197"), " et inscris-toi (gratuit)"), /*#__PURE__*/React.createElement("li", null, "Connecte-toi, va dans ton tableau de bord \u2192 onglet ", /*#__PURE__*/React.createElement("strong", null, "Mon API")), /*#__PURE__*/React.createElement("li", null, "Copie ton ", /*#__PURE__*/React.createElement("strong", null, "API Token"), " (au format UUID, ex : ", /*#__PURE__*/React.createElement("code", {
    style: {
      background: "#f1f5f9",
      padding: "1px 4px",
      borderRadius: 3
    }
  }, "1a2b3c4d-5e6f-7890-abcd-..."), ")"), /*#__PURE__*/React.createElement("li", null, "Colle-le dans le champ ci-dessous + clique \xAB Enregistrer \xBB"))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "Token API Pappers"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: pappersToken,
    onChange: e => setPappersToken(e.target.value),
    placeholder: "Colle ton token ici (ex : 1a2b3c4d-5e6f-7890-abcd-ef1234567890)",
    spellCheck: false,
    autoComplete: "off",
    style: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: pappersToken === savedToken,
    style: {
      padding: "8px 16px",
      background: pappersToken === savedToken ? "#cbd5e1" : "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: pappersToken === savedToken ? "default" : "pointer"
    }
  }, "\uD83D\uDCBE Enregistrer"), /*#__PURE__*/React.createElement("button", {
    onClick: test,
    disabled: testing || !pappersToken.trim(),
    style: {
      padding: "8px 16px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: testing || !pappersToken.trim() ? "wait" : "pointer"
    }
  }, testing ? "⏳ Test en cours…" : "🧪 Tester le token"), savedToken && /*#__PURE__*/React.createElement("button", {
    onClick: remove,
    style: {
      padding: "8px 16px",
      background: "transparent",
      color: "#dc2626",
      border: "1px solid #fecaca",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      marginLeft: "auto"
    }
  }, "\uD83D\uDDD1 Retirer le token")), testResult && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 12,
      background: testResult.status === "error" ? "#fef2f2" : "#ecfdf5",
      border: "1px solid " + (testResult.status === "error" ? "#fca5a5" : "#86efac"),
      borderRadius: 8,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: testResult.status === "error" ? "#9b1c1c" : "#065f46",
      marginBottom: 4
    }
  }, testResult.status === "error" ? "❌ Échec" : "✅ Test réussi", " \xB7 source : ", testResult.source), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b"
    }
  }, testResult.company && testResult.company.denomination ? "Entreprise testée : " + testResult.company.denomination : testResult.error || "")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "\uD83D\uDCA1 Plan gratuit : 1000 requ\xEAtes/mois \u2014 largement suffisant avec le cache 7 jours int\xE9gr\xE9.", /*#__PURE__*/React.createElement("br", null), "\u26A0 Le token est stock\xE9 en localStorage et envoy\xE9 depuis le navigateur. Pour un cloisonnement renforc\xE9, voir doc de migration vers une fonction Edge Supabase.")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "linear-gradient(135deg, #4f46e5, #6264a7)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 800
    }
  }, "T"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Microsoft Teams"), savedTeamsUrl ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#dcfce7",
      color: "#065f46",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CF ACTIF") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#f1f5f9",
      color: "#64748b",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CB INACTIF")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Re\xE7ois en temps r\xE9el dans un canal Teams les notifications du Hub (avancement projet, livrables, etc.)."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 8,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "\uD83D\uDCCB Comment cr\xE9er le webhook"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 12.5,
      color: "#475569",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "Dans Teams, va dans le canal cible \u2192 ", /*#__PURE__*/React.createElement("strong", null, "\u2026 (Plus)"), " \u2192 ", /*#__PURE__*/React.createElement("strong", null, "Connecteurs")), /*#__PURE__*/React.createElement("li", null, "Cherche ", /*#__PURE__*/React.createElement("strong", null, "\xAB Incoming Webhook \xBB"), " \u2192 ", /*#__PURE__*/React.createElement("strong", null, "Configurer")), /*#__PURE__*/React.createElement("li", null, "Donne un nom (ex : ", /*#__PURE__*/React.createElement("em", null, "Hub Astorya"), ") + une ic\xF4ne, puis ", /*#__PURE__*/React.createElement("strong", null, "Cr\xE9er")), /*#__PURE__*/React.createElement("li", null, "Copie l'URL g\xE9n\xE9r\xE9e (format : ", /*#__PURE__*/React.createElement("code", {
    style: {
      background: "#f1f5f9",
      padding: "1px 4px",
      borderRadius: 3,
      fontSize: 10
    }
  }, "https://outlook.office.com/webhook/\u2026"), ")"), /*#__PURE__*/React.createElement("li", null, "Colle-la ci-dessous + clique \xAB Enregistrer \xBB"))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "URL du webhook entrant"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: teamsUrl,
    onChange: e => setTeamsUrl(e.target.value),
    placeholder: "https://outlook.office.com/webhook/...",
    spellCheck: false,
    autoComplete: "off",
    style: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: saveTeams,
    disabled: teamsUrl === savedTeamsUrl,
    style: {
      padding: "8px 16px",
      background: teamsUrl === savedTeamsUrl ? "#cbd5e1" : "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: teamsUrl === savedTeamsUrl ? "default" : "pointer"
    }
  }, "\uD83D\uDCBE Enregistrer"), /*#__PURE__*/React.createElement("button", {
    onClick: testTeams,
    disabled: teamsTesting || !teamsUrl.trim(),
    style: {
      padding: "8px 16px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: teamsTesting || !teamsUrl.trim() ? "wait" : "pointer"
    }
  }, teamsTesting ? "⏳ Envoi…" : "🧪 Envoyer un message test"), savedTeamsUrl && /*#__PURE__*/React.createElement("button", {
    onClick: removeTeams,
    style: {
      padding: "8px 16px",
      background: "transparent",
      color: "#dc2626",
      border: "1px solid #fecaca",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      marginLeft: "auto"
    }
  }, "\uD83D\uDDD1 Retirer le webhook")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "\uD83D\uDCA1 Format MessageCard standard Teams (themeColor, title, sections, action OpenUri).", /*#__PURE__*/React.createElement("br", null), "\u26A0 L'URL est stock\xE9e en localStorage du navigateur. Chaque utilisateur configure son propre canal de r\xE9ception.")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "linear-gradient(135deg, #10b981, #047857)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 800
    }
  }, "\u260E"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "T\xE9l\xE9phonie 3CX"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#dcfce7",
      color: "#065f46",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CF ENTERPRISE")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Popup CTI temps r\xE9el sur appel entrant. Webhook 3CX \u2192 Supabase \u2192 notification au bon agent (extension match\xE9e), filtr\xE9 d\xE9partement ", /*#__PURE__*/React.createElement("strong", null, "ASTO"), "."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 8,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "\uD83D\uDCCB Config c\xF4t\xE9 3CX (Console admin)"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 12.5,
      color: "#475569",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "Ouvre ", /*#__PURE__*/React.createElement("a", {
    href: "https://telcomastorya.my3cx.fr:5001/#/app/integrations/crm",
    target: "_blank",
    rel: "noopener",
    style: {
      color: "#3730a3",
      fontWeight: 600
    }
  }, "telcomastorya.my3cx.fr:5001 \u2192 Integrations \u2192 CRM \u2197")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "+ Add"), " \u2192 ", /*#__PURE__*/React.createElement("em", null, "Server side CRM integration"), " \u2192 ", /*#__PURE__*/React.createElement("em", null, "Generic Web Server")), /*#__PURE__*/React.createElement("li", null, "Colle l'URL du webhook et le secret ci-dessous (header ", /*#__PURE__*/React.createElement("code", null, "X-3CX-Secret"), ")"), /*#__PURE__*/React.createElement("li", null, "Method ", /*#__PURE__*/React.createElement("strong", null, "POST"), ", Content-type ", /*#__PURE__*/React.createElement("strong", null, "application/json")), /*#__PURE__*/React.createElement("li", null, "Department ", /*#__PURE__*/React.createElement("strong", null, "ASTO"), " uniquement (autres d\xE9partements ignor\xE9s c\xF4t\xE9 Edge)"), /*#__PURE__*/React.createElement("li", null, "Renseigne l'extension 3CX de chaque utilisateur dans l'onglet ", /*#__PURE__*/React.createElement("em", null, "Utilisateurs"), " du Hub"))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "URL du webhook (\xE0 coller dans 3CX)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    readOnly: true,
    value: WEBHOOK_URL,
    style: {
      flex: 1,
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 11.5,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a",
      background: "#fafbfc",
      outline: "none"
    },
    onFocus: e => e.target.select()
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => copyToClip(WEBHOOK_URL, "URL copiée"),
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDCCB Copier")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "Secret partag\xE9 (header X-3CX-Secret)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    readOnly: true,
    value: tcxSecret || "— Non configuré (lance d'abord supabase/3cx-integration.sql) —",
    style: {
      flex: 1,
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 11.5,
      fontFamily: "'JetBrains Mono', monospace",
      color: tcxSecret ? "#0f172a" : "#94a3b8",
      background: "#fafbfc",
      outline: "none"
    },
    onFocus: e => e.target.select()
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => copyToClip(tcxSecret, "Secret copié"),
    disabled: !tcxSecret,
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: tcxSecret ? "pointer" : "not-allowed",
      opacity: tcxSecret ? 1 : 0.5,
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDCCB Copier"), /*#__PURE__*/React.createElement("button", {
    onClick: regenTcxSecret,
    style: {
      padding: "8px 14px",
      background: "#fff",
      color: "#dc2626",
      border: "1px solid #fecaca",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, "\u21BB R\xE9g\xE9n\xE9rer")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 12,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "#1e40af",
      marginBottom: 6
    }
  }, "\uD83E\uDDEA Tester en local (sans 3CX)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: tcxSimPhone,
    onChange: e => setTcxSimPhone(e.target.value),
    placeholder: "Num\xE9ro \xE0 simuler (ex : +33 6 12 34 56 78)",
    style: {
      flex: 1,
      padding: "8px 12px",
      border: "1px solid #bfdbfe",
      borderRadius: 7,
      fontSize: 12.5,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#0f172a",
      background: "#fff",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: simulateCall,
    style: {
      padding: "8px 14px",
      background: "#1d4ed8",
      color: "#fff",
      border: 0,
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDCDE Simuler appel"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "\u26A0 Seul le d\xE9partement ", /*#__PURE__*/React.createElement("strong", null, "ASTO"), " est rout\xE9 vers le Hub. Les autres d\xE9partements 3CX re\xE7oivent un 200 + ignored."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 18,
      borderTop: "1px dashed #cbd5e1"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83C\uDF9B"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "Pilotage t\xE9l\xE9phonie (Call Control API)"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      margin: "2px 0 0"
    }
  }, "Permet de r\xE9pondre / raccrocher un appel ", /*#__PURE__*/React.createElement("strong", null, "directement depuis le popup CTI du Hub"), " (sans utiliser le 3CX Web Client). Optionnel \u2014 sans \xE7a, le popup reste informatif."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fafbfc",
      border: "1px solid #eef1f5",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6
    }
  }, "\uD83D\uDCCB Comment obtenir les identifiants"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 12,
      color: "#475569",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "Console 3CX \u2192 ", /*#__PURE__*/React.createElement("strong", null, "Int\xE9grations"), " \u2192 ", /*#__PURE__*/React.createElement("strong", null, "API"), " \u2192 ", /*#__PURE__*/React.createElement("strong", null, "+ Ajouter")), /*#__PURE__*/React.createElement("li", null, "Nom (ex : ", /*#__PURE__*/React.createElement("em", null, "Hub Astorya"), ") \u2192 coche ", /*#__PURE__*/React.createElement("strong", null, "Activer l'acc\xE8s \xE0 l'API 3CX Call Control")), /*#__PURE__*/React.createElement("li", null, "D\xE9partement : ", /*#__PURE__*/React.createElement("strong", null, "ASTO"), " \xB7 R\xF4le : ", /*#__PURE__*/React.createElement("strong", null, "Utilisateur")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "S\xE9lectionner les extensions"), " \u2192 ajoute Romain (704), Augustin, etc."), /*#__PURE__*/React.createElement("li", null, "Sauvegarder \u2014 3CX affiche un ", /*#__PURE__*/React.createElement("strong", null, "Client ID"), " et un ", /*#__PURE__*/React.createElement("strong", null, "Client Secret")), /*#__PURE__*/React.createElement("li", null, "Colle les valeurs ci-dessous et sauvegarde"))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4
    }
  }, "URL serveur 3CX"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: tcxServerUrl,
    onChange: e => setTcxServerUrl(e.target.value),
    placeholder: "https://telcomastorya.my3cx.fr:5001",
    style: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: 10,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4
    }
  }, "Client ID"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: tcxClientId,
    onChange: e => setTcxClientId(e.target.value),
    placeholder: "ID g\xE9n\xE9r\xE9 par 3CX",
    style: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: 10,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4
    }
  }, "Client Secret"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: tcxClientSecret,
    onChange: e => setTcxClientSecret(e.target.value),
    placeholder: "Secret g\xE9n\xE9r\xE9 par 3CX",
    style: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: 12,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: saveTcxCC,
    disabled: tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret,
    style: {
      padding: "8px 16px",
      background: tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret ? "#cbd5e1" : "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: tcxServerUrl === savedTcxCC.url && tcxClientId === savedTcxCC.id && tcxClientSecret === savedTcxCC.secret ? "default" : "pointer"
    }
  }, "\uD83D\uDCBE Sauvegarder"), /*#__PURE__*/React.createElement("button", {
    onClick: testTcxCC,
    disabled: tcxCCTesting || !savedTcxCC.id,
    style: {
      padding: "8px 16px",
      background: "#fff",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: tcxCCTesting || !savedTcxCC.id ? "wait" : "pointer"
    }
  }, tcxCCTesting ? "⏳ Test…" : "🧪 Tester la connexion 3CX"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8",
      alignSelf: "center"
    }
  }, savedTcxCC.id ? "● Configuré" : "○ Non configuré (popup reste informatif)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "#0f172a",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      fontWeight: 800
    }
  }, "B"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "BODACC"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "#dcfce7",
      color: "#065f46",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u25CF ALWAYS ON")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Source officielle FR (Bulletin Officiel des Annonces). Pas de cl\xE9 requise. Utilis\xE9e en fallback si Pappers indisponible.")))));
};

// ════════════════════════════════════════════════════════════════════
// ContractTemplatesPanel — sous-composant tab "Modèles de contrat"
// ════════════════════════════════════════════════════════════════════
var ContractTemplatesPanel = () => {
  var [templates, setTemplates] = React.useState([]);
  var [uploading, setUploading] = React.useState(false);
  var [progress, setProgress] = React.useState("");
  var fileRef = React.useRef(null);
  var reload = async () => {
    if (!window.api || !window.api.contractTemplates) return;
    try {
      var list = await window.api.contractTemplates.list();
      setTemplates(list || []);
    } catch (e) {
      console.warn("[Templates] list:", e);
    }
  };
  React.useEffect(() => {
    reload();
  }, []);

  // Extraction du texte d'un PDF avec PDF.js (loaded via CDN dans la HTML)
  var extractPdfText = async file => {
    if (!window.pdfjsLib) {
      console.warn("PDF.js not loaded — text extraction skipped");
      return null;
    }
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await window.pdfjsLib.getDocument({
      data: arrayBuffer
    }).promise;
    var text = "";
    for (var i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();
      var pageText = content.items.map(it => it.str).join(" ");
      text += pageText + "\n\n";
    }
    return text.trim();
  };
  var handleUpload = async file => {
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
      var cgvText = await extractPdfText(file);
      setProgress("2/3 Demande du nom du modèle…");
      var name = window.HubModal ? await window.HubModal.prompt({
        title: "Nom du modèle",
        label: "Comment vais-je l'identifier dans NewContract ?",
        default: file.name.replace(/\.pdf$/i, ""),
        okLabel: "Continuer"
      }) : prompt("Nom du modèle :", file.name.replace(/\.pdf$/i, ""));
      if (!name) {
        setUploading(false);
        setProgress("");
        return;
      }
      var version = window.HubModal ? await window.HubModal.prompt({
        title: "Version",
        label: "Numéro de version (ex : v4.2)",
        default: "v1.0",
        okLabel: "Continuer"
      }) : "v1.0";
      setProgress("3/3 Upload sur Supabase Storage + sauvegarde BDD…");
      var saved = await window.api.contractTemplates.upload({
        name,
        version: version || "v1.0",
        file,
        cgvText
      });
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
  var handleDelete = async t => {
    var ok = window.HubModal ? await window.HubModal.confirm({
      title: "Supprimer ce modèle ?",
      message: "Le PDF sera retiré du stockage. Soft-delete : la ligne reste en BDD pour audit.",
      okLabel: "Supprimer",
      okStyle: "danger"
    }) : confirm("Supprimer ce modèle ?");
    if (!ok) return;
    try {
      await window.api.contractTemplates.remove(t.id);
      if (window.HubToast) window.HubToast.success("✓ Modèle supprimé");
      await reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  var handleSetDefault = async t => {
    try {
      await window.api.contractTemplates.setDefault(t.id);
      if (window.HubToast) window.HubToast.success("✓ « " + t.name + " » est maintenant le modèle par défaut");
      await reload();
    } catch (e) {
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    }
  };
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "#fff",
      border: "1px solid #eef1f5",
      borderRadius: 12,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0
    }
  }, "\uD83D\uDCC4 Mod\xE8les de contrat (CGV)"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "#64748b",
      margin: "4px 0 0"
    }
  }, "Upload des PDF de CGV. Le texte est extrait automatiquement pour s'afficher dans la preview du contrat envoy\xE9 pour signature.")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "2px dashed " + (uploading ? "#4f46e5" : "#cbd5e1"),
      borderRadius: 12,
      padding: 28,
      textAlign: "center",
      background: uploading ? "#eef2ff" : "#fafbfc",
      transition: "all .15s",
      marginBottom: 24
    },
    onDragOver: e => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: e => {
      e.preventDefault();
      e.stopPropagation();
      if (uploading) return;
      var f = e.dataTransfer.files[0];
      if (f) handleUpload(f);
    }
  }, uploading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\u23F3"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#3730a3"
    }
  }, progress || "Upload en cours…")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\uD83D\uDCE4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: 6
    }
  }, "Glisser-d\xE9poser un PDF ici"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b",
      marginBottom: 14
    }
  }, "ou cliquer pour parcourir \xB7 max 10 Mo"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    style: {
      padding: "10px 20px",
      background: "#0f172a",
      color: "#fff",
      border: 0,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "S\xE9lectionner un PDF"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "application/pdf",
    style: {
      display: "none"
    },
    onChange: e => {
      var f = e.target.files[0];
      if (f) handleUpload(f);
    }
  }))), templates.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 14px",
      textAlign: "center",
      fontSize: 13,
      color: "#94a3b8",
      border: "1px dashed #e2e8f0",
      borderRadius: 10,
      background: "#fafbfc"
    }
  }, "Aucun mod\xE8le upload\xE9 pour l'instant. Upload ton premier PDF de CGV ci-dessus.") : /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "#fafbfc",
      borderBottom: "1px solid #eef1f5"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Mod\xE8le"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Version"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      textAlign: "right",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Taille"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Upload\xE9"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      textAlign: "right",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, templates.map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.id,
    style: {
      borderBottom: "1px solid #f1f5f9"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, t.name, t.is_default && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 10,
      background: "#dcfce7",
      color: "#065f46",
      padding: "2px 7px",
      borderRadius: 999,
      fontWeight: 700
    }
  }, "\u2605 D\xC9FAUT")), t.description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#64748b",
      marginTop: 2
    }
  }, t.description), t.cgv_text && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#94a3b8",
      marginTop: 2
    }
  }, Math.round(t.cgv_text.length / 100) / 10, "k caract\xE8res extraits")))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "12px",
      fontSize: 12,
      color: "#475569",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, t.version), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "12px",
      textAlign: "right",
      fontSize: 12,
      color: "#475569",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, t.pdf_size_kb ? t.pdf_size_kb + " Ko" : "—"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "12px",
      fontSize: 12,
      color: "#64748b"
    }
  }, t.created_at ? new Date(t.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "—"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "12px",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      gap: 6
    }
  }, t.pdf_url && /*#__PURE__*/React.createElement("a", {
    href: t.pdf_url,
    target: "_blank",
    rel: "noopener",
    style: {
      padding: "5px 10px",
      fontSize: 11.5,
      color: "#3730a3",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      textDecoration: "none",
      background: "#fff"
    }
  }, "\uD83D\uDC41 Voir"), !t.is_default && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSetDefault(t),
    style: {
      padding: "5px 10px",
      fontSize: 11.5,
      color: "#0f172a",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      background: "#fff",
      cursor: "pointer",
      fontWeight: 600
    }
  }, "\u2605 D\xE9finir par d\xE9faut"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(t),
    style: {
      padding: "5px 10px",
      fontSize: 11.5,
      color: "#dc2626",
      border: "1px solid #fecaca",
      borderRadius: 6,
      background: "#fff",
      cursor: "pointer"
    }
  }, "\uD83D\uDDD1"))))))));
};
window.UserManagement = UserManagement;