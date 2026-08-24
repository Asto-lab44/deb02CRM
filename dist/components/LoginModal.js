// Modal de connexion factice (démo uniquement) — mot de passe en clair.
// Permet de choisir une identité parmi les utilisateurs prédéfinis afin de
// positionner automatiquement le groupe actif et donc le filtrage des tuiles.

var LoginModal = ({
  open,
  onClose
}) => {
  var [email, setEmail] = React.useState("");
  var [password, setPassword] = React.useState("");
  var [error, setError] = React.useState(null);
  var [magicSent, setMagicSent] = React.useState(false);
  var [sending, setSending] = React.useState(false);
  var users = window.HubAccess.listUsers();
  var mode = window.HubAccess.authMode && window.HubAccess.authMode() || "demo";
  var isReal = mode === "supabase";
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
      setMagicSent(false);
      setSending(false);
    }
  }, [open]);
  if (!open) return null;
  var submit = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    if (isReal) {
      setSending(true);
      var _res = await window.HubAccess.sendMagicLink(email);
      setSending(false);
      if (!_res.ok) {
        setError(_res.error);
        return;
      }
      setMagicSent(true);
      return;
    }
    var res = window.HubAccess.login(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose && onClose();
  };
  var quickLogin = u => {
    if (isReal) return; // pas de quick-login en mode auth réelle
    var res = window.HubAccess.login(u.email, "demo");
    if (res.ok) {
      onClose && onClose();
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: M.backdrop,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: M.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: M.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: M.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748b"
    }
  }, "Connexion \xE0 l'espace de travail"))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: M.close,
    "aria-label": "Fermer"
  }, "\xD7")), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: M.form
  }, magicSent ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 14px",
      background: "#dcfce7",
      border: "1px solid #86efac",
      borderRadius: 8,
      color: "#065f46",
      fontSize: 13,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      marginBottom: 6
    }
  }, "\u2713 Lien envoy\xE9 !"), "Un email de connexion a \xE9t\xE9 envoy\xE9 \xE0 ", /*#__PURE__*/React.createElement("strong", null, email), ". Cliquez sur le lien pour entrer dans le Hub. Vous pouvez fermer cette fen\xEAtre.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: M.label
  }, /*#__PURE__*/React.createElement("span", null, "Email professionnel"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "prenom.nom@astorya.fr",
    style: M.input,
    autoFocus: true,
    required: true
  })), !isReal && /*#__PURE__*/React.createElement("label", {
    style: M.label
  }, /*#__PURE__*/React.createElement("span", null, "Mot de passe"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    style: M.input,
    required: true
  })), error && /*#__PURE__*/React.createElement("div", {
    style: M.error
  }, error), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: sending,
    style: {
      ...M.submit,
      opacity: sending ? 0.6 : 1,
      cursor: sending ? "wait" : "pointer"
    }
  }, isReal ? sending ? "Envoi du lien…" : "Recevoir un lien de connexion →" : "Se connecter →"), isReal ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...M.demoNote,
      background: "#eef2ff",
      borderColor: "#c7d2fe",
      color: "#3730a3"
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Auth Supabase \xB7 "), "Aucun mot de passe : vous recevez un lien s\xE9curis\xE9 valable 1 h. V\xE9rifiez aussi votre dossier spam.") : /*#__PURE__*/React.createElement("div", {
    style: M.demoNote
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#a16207"
    }
  }, "D\xE9mo \xB7 "), "Le mot de passe pour tous les comptes est ", /*#__PURE__*/React.createElement("code", {
    style: M.kbd
  }, "demo"), ". Cliquez sur un compte ci-dessous pour vous connecter directement. Pour activer la vraie auth, configurez vos cl\xE9s Supabase dans ", /*#__PURE__*/React.createElement("code", {
    style: M.kbd
  }, "components/supabase-config.js"), "."))), !isReal && !magicSent && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: M.quickHead
  }, "Connexion rapide (", users.length, " comptes de d\xE9mo)"), /*#__PURE__*/React.createElement("div", {
    style: M.quickList
  }, users.map(u => /*#__PURE__*/React.createElement("button", {
    key: u.email,
    onClick: () => quickLogin(u),
    style: M.quickItem
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...M.avatar,
      background: avatarColor(u.name)
    }
  }, u.name.split(" ").slice(0, 2).map(s => s[0]).join("")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, u.role)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      flexWrap: "wrap",
      justifyContent: "flex-end"
    }
  }, u.groups.slice(0, 2).map(gid => /*#__PURE__*/React.createElement("span", {
    key: gid,
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      color: "#3730a3",
      background: "#eef2ff",
      padding: "1px 6px",
      borderRadius: 999
    }
  }, gid)))))))));
};
var avatarColor = name => {
  var palette = {
    N: "#a855f7",
    H: "#6366f1",
    C: "#ef4444",
    O: "#10b981",
    K: "#f59e0b",
    S: "#0ea5e9",
    T: "#ec4899",
    E: "#14b8a6",
    A: "#dc2626",
    J: "#8b5cf6",
    M: "#0891b2",
    P: "#f97316",
    R: "#84cc16",
    L: "#4f46e5",
    D: "#a16207",
    F: "#475569",
    V: "#b45309"
  };
  return palette[name[0]] || "#64748b";
};
var M = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
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
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "#0f172a",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700
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
  form: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569"
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13.5,
    color: "#0f172a",
    outline: "none",
    background: "#fff"
  },
  error: {
    padding: "8px 12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#dc2626",
    fontSize: 12.5,
    fontWeight: 500
  },
  submit: {
    padding: "10px 16px",
    background: "#3730a3",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4
  },
  demoNote: {
    padding: "10px 12px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
    fontSize: 12,
    color: "#78350f",
    lineHeight: 1.5
  },
  kbd: {
    background: "#fef3c7",
    padding: "1px 6px",
    borderRadius: 4,
    fontVariantNumeric: "tabular-nums",
    fontSize: 11.5,
    fontWeight: 600
  },
  quickHead: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "12px 24px 8px",
    borderTop: "1px solid #f1f5f9"
  },
  quickList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 12px 16px"
  },
  quickItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid transparent",
    cursor: "pointer",
    textAlign: "left"
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10.5,
    fontWeight: 700,
    flexShrink: 0
  }
};
window.LoginModal = LoginModal;