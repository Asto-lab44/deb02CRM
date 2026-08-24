// Page de bienvenue — landing après un lien email Supabase
// Gère 3 flux :
//   - type=invite   : invité par admin, doit choisir un mot de passe
//   - type=recovery : reset mot de passe, doit en choisir un nouveau
//   - type=signup   : confirmation email, juste un message + bouton continuer
// Le SDK Supabase a detectSessionInUrl:true → la session est posée
// automatiquement à partir du hash. On lit type=… pour adapter l'UI.

var Bienvenue = () => {
  var supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;
  var [phase, setPhase] = React.useState("loading"); // loading | invite | recovery | confirmed | error | done
  var [email, setEmail] = React.useState("");
  var [pwd, setPwd] = React.useState("");
  var [pwd2, setPwd2] = React.useState("");
  var [showPwd, setShowPwd] = React.useState(false);
  var [loading, setLoading] = React.useState(false);
  var [errMsg, setErrMsg] = React.useState("");
  React.useEffect(() => {
    if (!supa) {
      setPhase("error");
      setErrMsg("Supabase non configuré");
      return;
    }

    // Lecture du type depuis le hash (ex: #access_token=...&type=invite&...)
    var hash = typeof window !== "undefined" && window.location.hash ? window.location.hash.replace(/^#/, "") : "";
    var params = new URLSearchParams(hash);
    var hashType = params.get("type");
    var hashError = params.get("error") || params.get("error_description");
    if (hashError) {
      setPhase("error");
      setErrMsg(decodeURIComponent(hashError));
      return;
    }

    // detectSessionInUrl du SDK a déjà posé la session — on attend qu'elle soit là
    var tries = 0;
    var tick = async () => {
      var {
        data
      } = await supa.auth.getSession();
      if (data && data.session) {
        setEmail(data.session.user?.email || "");
        if (hashType === "recovery") setPhase("recovery");else if (hashType === "invite") setPhase("invite");else if (hashType === "signup") setPhase("confirmed");else setPhase("invite"); // par défaut on propose de définir un mot de passe
        return;
      }
      tries++;
      if (tries > 20) {
        setPhase("error");
        setErrMsg("Lien expiré ou déjà utilisé. Demande à un admin de te renvoyer une invitation.");
        return;
      }
      setTimeout(tick, 150);
    };
    tick();
  }, []);
  var setPassword = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setErrMsg("");
    if (pwd.length < 8) {
      setErrMsg("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    if (pwd !== pwd2) {
      setErrMsg("Les deux mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      var {
        error
      } = await supa.auth.updateUser({
        password: pwd
      });
      if (error) {
        setErrMsg(error.message);
        setLoading(false);
        return;
      }
      setPhase("done");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      setErrMsg(err.message || "Erreur inattendue");
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
  }, "ERP commercial \xB7 v1"))), phase === "loading" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, "V\xE9rification du lien\u2026"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, "Un instant, on valide ton invitation.")), phase === "error" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, "Lien invalide"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, errMsg || "Ce lien ne peut pas être utilisé."), /*#__PURE__*/React.createElement("a", {
    href: "/login",
    style: styles.linkBtnBig
  }, "\u2190 Aller \xE0 la page de connexion")), (phase === "invite" || phase === "recovery") && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, phase === "invite" ? "Bienvenue sur Hub Astorya" : "Nouveau mot de passe"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, phase === "invite" ? /*#__PURE__*/React.createElement(React.Fragment, null, "Compte ", /*#__PURE__*/React.createElement("strong", null, email), " confirm\xE9. Choisis un mot de passe pour finaliser ton acc\xE8s.") : /*#__PURE__*/React.createElement(React.Fragment, null, "Choisis un nouveau mot de passe pour ", /*#__PURE__*/React.createElement("strong", null, email), ".")), /*#__PURE__*/React.createElement("form", {
    onSubmit: setPassword,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, "Mot de passe"), /*#__PURE__*/React.createElement("div", {
    style: styles.passwordWrap
  }, /*#__PURE__*/React.createElement("input", {
    type: showPwd ? "text" : "password",
    autoComplete: "new-password",
    autoFocus: true,
    value: pwd,
    onChange: e => setPwd(e.target.value),
    placeholder: "Au moins 8 caract\xE8res",
    style: {
      ...styles.input,
      paddingRight: 60
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowPwd(v => !v),
    style: styles.eyeBtn
  }, showPwd ? "Masquer" : "Voir"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, "Confirmer"), /*#__PURE__*/React.createElement("input", {
    type: showPwd ? "text" : "password",
    autoComplete: "new-password",
    value: pwd2,
    onChange: e => setPwd2(e.target.value),
    placeholder: "Re-tape le mot de passe",
    style: styles.input
  })), errMsg && /*#__PURE__*/React.createElement("div", {
    style: styles.err
  }, errMsg), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    style: {
      ...styles.submitBtn,
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "wait" : "pointer"
    }
  }, loading ? "…" : "Valider et entrer →"))), phase === "confirmed" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, "Email confirm\xE9 \u2713"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, "Compte ", /*#__PURE__*/React.createElement("strong", null, email), " activ\xE9. Tu peux entrer dans l'application."), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: styles.linkBtnBig
  }, "Entrer dans Hub Astorya \u2192")), phase === "done" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: styles.h1
  }, "Tout est pr\xEAt \u2713"), /*#__PURE__*/React.createElement("p", {
    style: styles.sub
  }, "Mot de passe enregistr\xE9. Redirection vers Hub Astorya\u2026"))));
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
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 14,
    padding: "28px 28px 22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "linear-gradient(135deg, #4f46e5, #a855f7)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700
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
    color: "#0f172a",
    margin: "0 0 6px",
    letterSpacing: -0.3
  },
  sub: {
    fontSize: 13,
    color: "#475569",
    margin: "0 0 18px",
    lineHeight: 1.5
  },
  label: {
    display: "block",
    fontSize: 11.5,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 5
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box"
  },
  passwordWrap: {
    position: "relative"
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: 0,
    background: "transparent",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: 6
  },
  submitBtn: {
    padding: "11px 14px",
    background: "#0f172a",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4
  },
  err: {
    fontSize: 12.5,
    color: "#b91c1c",
    background: "#fee2e2",
    padding: "8px 10px",
    borderRadius: 7,
    border: "1px solid #fecaca"
  },
  linkBtnBig: {
    display: "inline-block",
    padding: "10px 16px",
    marginTop: 8,
    background: "#0f172a",
    color: "#fff",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none"
  }
};
window.Bienvenue = Bienvenue;