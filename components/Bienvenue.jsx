// Page de bienvenue — landing après un lien email Supabase
// Gère 3 flux :
//   - type=invite   : invité par admin, doit choisir un mot de passe
//   - type=recovery : reset mot de passe, doit en choisir un nouveau
//   - type=signup   : confirmation email, juste un message + bouton continuer
// Le SDK Supabase a detectSessionInUrl:true → la session est posée
// automatiquement à partir du hash. On lit type=… pour adapter l'UI.

const Bienvenue = () => {
  const supa = window.HubSupabase && window.HubSupabase.enabled ? window.HubSupabase.client : null;

  const [phase, setPhase] = React.useState("loading"); // loading | invite | recovery | confirmed | error | done
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState("");

  React.useEffect(() => {
    if (!supa) { setPhase("error"); setErrMsg("Supabase non configuré"); return; }

    // Lecture du type depuis le hash (ex: #access_token=...&type=invite&...)
    const hash = (typeof window !== "undefined" && window.location.hash) ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const hashType = params.get("type");
    const hashError = params.get("error") || params.get("error_description");

    if (hashError) { setPhase("error"); setErrMsg(decodeURIComponent(hashError)); return; }

    // detectSessionInUrl du SDK a déjà posé la session — on attend qu'elle soit là
    let tries = 0;
    const tick = async () => {
      const { data } = await supa.auth.getSession();
      if (data && data.session) {
        setEmail(data.session.user?.email || "");
        if (hashType === "recovery") setPhase("recovery");
        else if (hashType === "invite") setPhase("invite");
        else if (hashType === "signup") setPhase("confirmed");
        else setPhase("invite"); // par défaut on propose de définir un mot de passe
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

  const setPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrMsg("");
    if (pwd.length < 8) { setErrMsg("Le mot de passe doit faire au moins 8 caractères"); return; }
    if (pwd !== pwd2) { setErrMsg("Les deux mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try {
      const { error } = await supa.auth.updateUser({ password: pwd });
      if (error) { setErrMsg(error.message); setLoading(false); return; }
      setPhase("done");
      setTimeout(() => { window.location.href = "/"; }, 1200);
    } catch (err) {
      setErrMsg(err.message || "Erreur inattendue");
      setLoading(false);
    }
  };

  return (
    <div style={styles.frame}>
      <div style={styles.bgGradient} />
      <div style={styles.bgPattern} />

      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>H</div>
          <div>
            <div style={styles.brandTitle}>Hub Astorya</div>
            <div style={styles.brandSub}>ERP commercial · v1</div>
          </div>
        </div>

        {phase === "loading" && (
          <>
            <h1 style={styles.h1}>Vérification du lien…</h1>
            <p style={styles.sub}>Un instant, on valide ton invitation.</p>
          </>
        )}

        {phase === "error" && (
          <>
            <h1 style={styles.h1}>Lien invalide</h1>
            <p style={styles.sub}>{errMsg || "Ce lien ne peut pas être utilisé."}</p>
            <a href="/login" style={styles.linkBtnBig}>← Aller à la page de connexion</a>
          </>
        )}

        {(phase === "invite" || phase === "recovery") && (
          <>
            <h1 style={styles.h1}>{phase === "invite" ? "Bienvenue sur Hub Astorya" : "Nouveau mot de passe"}</h1>
            <p style={styles.sub}>
              {phase === "invite"
                ? <>Compte <strong>{email}</strong> confirmé. Choisis un mot de passe pour finaliser ton accès.</>
                : <>Choisis un nouveau mot de passe pour <strong>{email}</strong>.</>}
            </p>

            <form onSubmit={setPassword} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
              <div>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.passwordWrap}>
                  <input type={showPwd ? "text" : "password"} autoComplete="new-password" autoFocus
                         value={pwd} onChange={(e) => setPwd(e.target.value)}
                         placeholder="Au moins 8 caractères" style={{ ...styles.input, paddingRight: 60 }} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>{showPwd ? "Masquer" : "Voir"}</button>
                </div>
              </div>
              <div>
                <label style={styles.label}>Confirmer</label>
                <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                       value={pwd2} onChange={(e) => setPwd2(e.target.value)}
                       placeholder="Re-tape le mot de passe" style={styles.input} />
              </div>
              {errMsg && <div style={styles.err}>{errMsg}</div>}
              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "wait" : "pointer" }}>
                {loading ? "…" : "Valider et entrer →"}
              </button>
            </form>
          </>
        )}

        {phase === "confirmed" && (
          <>
            <h1 style={styles.h1}>Email confirmé ✓</h1>
            <p style={styles.sub}>Compte <strong>{email}</strong> activé. Tu peux entrer dans l'application.</p>
            <a href="/" style={styles.linkBtnBig}>Entrer dans Hub Astorya →</a>
          </>
        )}

        {phase === "done" && (
          <>
            <h1 style={styles.h1}>Tout est prêt ✓</h1>
            <p style={styles.sub}>Mot de passe enregistré. Redirection vers Hub Astorya…</p>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  frame: {
    position: "relative", width: "100%", minHeight: "100vh",
    background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif", padding: 20, overflow: "hidden",
  },
  bgGradient: {
    position: "absolute", inset: 0,
    background: "radial-gradient(1200px 600px at 20% 30%, rgba(79,70,229,0.35), transparent 70%), radial-gradient(900px 500px at 80% 70%, rgba(168,85,247,0.25), transparent 70%)",
    pointerEvents: "none",
  },
  bgPattern: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px", pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
    background: "#fff", borderRadius: 14, padding: "28px 28px 22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  logo: {
    width: 36, height: 36, borderRadius: 8,
    background: "linear-gradient(135deg, #4f46e5, #a855f7)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700,
  },
  brandTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  brandSub: { fontSize: 11, color: "#64748b" },
  h1: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", letterSpacing: -0.3 },
  sub: { fontSize: 13, color: "#475569", margin: "0 0 18px", lineHeight: 1.5 },
  label: { display: "block", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 5 },
  input: {
    width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 13.5, fontFamily: "inherit", outline: "none", color: "#0f172a", background: "#fff", boxSizing: "border-box",
  },
  passwordWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
    border: 0, background: "transparent", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 6,
  },
  submitBtn: {
    padding: "11px 14px", background: "#0f172a", color: "#fff", border: 0, borderRadius: 8,
    fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 4,
  },
  err: { fontSize: 12.5, color: "#b91c1c", background: "#fee2e2", padding: "8px 10px", borderRadius: 7, border: "1px solid #fecaca" },
  linkBtnBig: {
    display: "inline-block", padding: "10px 16px", marginTop: 8,
    background: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
  },
};

window.Bienvenue = Bienvenue;
