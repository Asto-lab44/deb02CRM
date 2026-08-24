// Page de connexion — email + mot de passe via Supabase Auth
// Onglet inscription (sign-up) + lien magique en fallback

var LoginPage = () => {
  var [mode, setMode] = React.useState("signin"); // signin | signup | forgot
  var [email, setEmail] = React.useState("");
  var [password, setPassword] = React.useState("");
  var [showPwd, setShowPwd] = React.useState(false);
  var [loading, setLoading] = React.useState(false);
  var [errMsg, setErrMsg] = React.useState("");
  var [okMsg, setOkMsg] = React.useState("");
  var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;

  // Si déjà connecté → redirige
  React.useEffect(() => {
    if (!supa) return;
    supa.auth.getSession().then(({
      data
    }) => {
      if (data && data.session) window.location.href = "/";
    });
  }, []);
  var goHome = () => {
    window.location.href = "/";
  };
  var handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setErrMsg("");
    setOkMsg("");
    if (!email.trim()) {
      setErrMsg("Email obligatoire");
      return;
    }
    if (!supa) {
      // Fallback : pas de Supabase → on accepte l'accès direct
      if (mode === "signin" && email && password) {
        try {
          localStorage.setItem("hubAstorya.localUser", JSON.stringify({
            email
          }));
        } catch (err) {}
        goHome();
        return;
      }
      setErrMsg("Supabase non configuré — connexion impossible.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        var {
          data,
          error
        } = await supa.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) {
          setErrMsg(error.message || "Identifiants invalides");
          return;
        }
        setOkMsg("✓ Connexion réussie — redirection…");
        setTimeout(goHome, 600);
      } else if (mode === "signup") {
        if (password.length < 8) {
          setErrMsg("Le mot de passe doit faire au moins 8 caractères");
          return;
        }
        var {
          data: _data,
          error: _error
        } = await supa.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/"
          }
        });
        if (_error) {
          setErrMsg(_error.message);
          return;
        }
        if (_data && _data.session) {
          setOkMsg("✓ Compte créé — redirection…");
          setTimeout(goHome, 600);
        } else {
          setOkMsg("✓ Compte créé — vérifiez votre email pour confirmer.");
        }
      } else if (mode === "forgot") {
        var {
          error: _error2
        } = await supa.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/reset-password"
        });
        if (_error2) {
          setErrMsg(_error2.message);
          return;
        }
        setOkMsg("✓ Un email de réinitialisation a été envoyé à " + email);
      }
    } catch (err) {
      setErrMsg(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };
  var sendMagicLink = async () => {
    if (!email.trim()) {
      setErrMsg("Email obligatoire");
      return;
    }
    if (!supa) {
      setErrMsg("Supabase non configuré");
      return;
    }
    setErrMsg("");
    setOkMsg("");
    setLoading(true);
    try {
      var {
        error
      } = await supa.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin + "/"
        }
      });
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setOkMsg("✓ Lien magique envoyé à " + email + ". Ouvrez votre boîte mail.");
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: styles.frame
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.bgGradient
  }), /*#__PURE__*/React.createElement("div", {
    style: styles.bgPattern
  }), /*#__PURE__*/React.createElement("div", {
    style: styles.card
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.brand
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.logo
  }, "H"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: styles.brandTitle
  }, "Hub Astorya"), /*#__PURE__*/React.createElement("div", {
    style: styles.brandSub
  }, "ERP commercial \xB7 v1"))), /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, mode === "signin" && "Connexion", mode === "signup" && "Créer un compte", mode === "forgot" && "Mot de passe oublié"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, mode === "signin" && "Identifiez-vous pour accéder à votre espace.", mode === "signup" && "Renseignez votre email professionnel pour créer votre compte.", mode === "forgot" && "Saisissez votre email — un lien de réinitialisation vous sera envoyé."), mode !== "forgot" && /*#__PURE__*/React.createElement("div", {
    style: styles.tabs
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMode("signin");
      setErrMsg("");
      setOkMsg("");
    },
    style: {
      ...styles.tab,
      ...(mode === "signin" ? styles.tabActive : {})
    }
  }, "Se connecter"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMode("signup");
      setErrMsg("");
      setOkMsg("");
    },
    style: {
      ...styles.tab,
      ...(mode === "signup" ? styles.tabActive : {})
    }
  }, "Cr\xE9er un compte")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, "Email professionnel"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    autoComplete: "email",
    autoFocus: true,
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "prenom.nom@astorya.fr",
    style: styles.input
  })), mode !== "forgot" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, "Mot de passe"), mode === "signin" && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setMode("forgot");
      setErrMsg("");
      setOkMsg("");
    },
    style: styles.linkBtn
  }, "Oubli\xE9 ?")), /*#__PURE__*/React.createElement("div", {
    style: styles.passwordWrap
  }, /*#__PURE__*/React.createElement("input", {
    type: showPwd ? "text" : "password",
    autoComplete: mode === "signup" ? "new-password" : "current-password",
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: mode === "signup" ? "Au moins 8 caractères" : "••••••••",
    style: {
      ...styles.input,
      paddingRight: 60
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowPwd(v => !v),
    style: styles.eyeBtn
  }, showPwd ? "Masquer" : "Voir"))), errMsg && /*#__PURE__*/React.createElement("div", {
    style: styles.err
  }, errMsg), okMsg && /*#__PURE__*/React.createElement("div", {
    style: styles.ok
  }, okMsg), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    style: {
      ...styles.submitBtn,
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "wait" : "pointer"
    }
  }, loading ? "…" : mode === "signin" ? "Se connecter →" : mode === "signup" ? "Créer mon compte →" : "Envoyer le lien →"), mode === "signin" && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: sendMagicLink,
    disabled: loading,
    style: styles.altBtn
  }, "\u2709 Recevoir un lien magique"), mode === "forgot" && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setMode("signin");
      setErrMsg("");
      setOkMsg("");
    },
    style: styles.altBtn
  }, "\u2190 Retour \xE0 la connexion")), /*#__PURE__*/React.createElement("div", {
    style: styles.foot
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, "En vous connectant, vous acceptez les conditions d'utilisation."))));
};
var styles = {
  frame: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 20,
    overflow: "hidden"
  },
  bgGradient: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(1200px 600px at 20% 30%, rgba(79,70,229,0.35), transparent 70%), radial-gradient(900px 500px at 80% 70%, rgba(168,85,247,0.25), transparent 70%)",
    pointerEvents: "none"
  },
  bgPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none"
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "#fff",
    borderRadius: 18,
    padding: 36,
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 24px 64px rgba(15,23,42,0.35), 0 0 0 1px rgba(15,23,42,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxSizing: "border-box"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 4
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  brandSub: {
    fontSize: 11,
    color: "#64748b"
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
    margin: 0,
    color: "#0f172a"
  },
  sub: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
    lineHeight: 1.5
  },
  tabs: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 9,
    padding: 3,
    gap: 3
  },
  tab: {
    flex: 1,
    padding: "7px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer"
  },
  tabActive: {
    background: "#fff",
    color: "#0f172a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 5
  },
  input: {
    width: "100%",
    padding: "11px 13px",
    fontSize: 13.5,
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fafbfc",
    transition: "border-color .15s"
  },
  passwordWrap: {
    position: "relative"
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    padding: "4px 9px",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 600
  },
  linkBtn: {
    padding: 0,
    background: "transparent",
    border: "none",
    color: "#4f46e5",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 9,
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.1,
    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
    marginTop: 4
  },
  altBtn: {
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    background: "#fff",
    color: "#475569",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  err: {
    padding: "8px 12px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 7,
    fontSize: 12,
    lineHeight: 1.5
  },
  ok: {
    padding: "8px 12px",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 7,
    fontSize: 12,
    lineHeight: 1.5
  },
  foot: {
    textAlign: "center",
    marginTop: 4,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9"
  }
};
window.LoginPage = LoginPage;