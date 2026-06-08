// Faire avancer une opportunité — passage d'étape avec critères de sortie

const AOAvatar = ({ name, size = 22, color }) => {
  if (!name) return null;
  const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
  const palette = { N: "#a855f7", K: "#6366f1", S: "#10b981", T: "#f59e0b", E: "#0ea5e9", L: "#dc2626", J: "#8b5cf6", C: "#dc2626", M: "#f59e0b" };
  const bg = color || palette[initials[0]] || "#64748b";
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
  );
};

const AOUpdateField = ({ label, oldVal, newVal, same, bar, color, helper }) => (
  <div style={{ padding: 14, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 }}>
    <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, color: "#94a3b8", textDecoration: same ? "none" : "line-through" }}>{oldVal}</span>
      {!same && <span style={{ color: "#cbd5e1" }}>→</span>}
      {!same && <span style={{ fontSize: 14, fontWeight: 700, color: color || "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{newVal}</span>}
      {same && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#eef1f5", color: "#64748b", fontWeight: 600, marginLeft: 4 }}>inchangé</span>}
    </div>
    {bar != null && (
      <div style={{ height: 4, background: "#eef1f5", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
        <div style={{ width: `${bar}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    )}
    {helper && <div style={{ fontSize: 11, color: "#64748b", marginTop: 5 }}>{helper}</div>}
  </div>
);

const AOHealthMetric = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flex: 1 }}>{label}</span>
    <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", width: 26, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
  </div>
);

const aoFmtEUR = (n) => {
  if (!isFinite(n)) return "0 €";
  return Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};

const AdvanceOpportunity = () => {
  const params = (typeof window !== "undefined") ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const oppRef = params.get("opp") || "OPP-2814";
  const clientId = params.get("client") || "";

  const stages = [
    { k: "qualif",    label: "Qualification", color: "#94a3b8", proba: 20 },
    { k: "discovery", label: "Discovery",     color: "#3b82f6", proba: 35 },
    { k: "propo",     label: "Proposition",   color: "#a855f7", proba: 55 },
    { k: "nego",      label: "Négociation",   color: "#ea580c", proba: 75 },
    { k: "won",       label: "Signé",         color: "#10b981", proba: 100 },
  ];

  // Load opp from API
  const [oppData, setOppData] = React.useState(null);
  React.useEffect(() => {
    if (!window.api) return;
    window.api.opportunities.getById(oppRef).then((data) => {
      if (data) setOppData({
        ...data,
        ref: data.id || data.ref,
        amount: data.amount_eur != null ? data.amount_eur : data.amount,
        close: data.close_date
          ? new Date(data.close_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
          : (data.close || ""),
        client_name: data.client_name || (data.data && data.data.client_name) || "",
      });
    }).catch((e) => console.warn("[AdvanceOpp] getById:", e));
  }, [oppRef]);

  const opp = oppData || {
    ref: oppRef,
    name: "Chargement…",
    client_name: "",
    stage: "qualif",
    amount: 0,
    proba: 20,
    owner: "Vous",
    close: "",
    last_update: "",
  };

  if (!oppData) {
    return (
      <div style={{ padding: 40, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Opportunité introuvable</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>L'opportunité <strong>{oppRef}</strong> n'existe pas ou plus.</div>
        <a href="/crm" style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", textDecoration: "none", borderRadius: 7, fontSize: 13, fontWeight: 600 }}>← Retour au pipeline</a>
      </div>
    );
  }

  const curIdx = Math.max(0, stages.findIndex((s) => s.k === opp.stage));
  const [targetIdx, setTargetIdx] = React.useState(Math.min(stages.length - 1, curIdx + 1));
  const current = stages[curIdx];
  const target = stages[targetIdx];

  // Default exit criteria per stage
  const defaultCriteria = {
    qualif: [
      { label: "Besoin client documenté",            done: true },
      { label: "Interlocuteur identifié",            done: true },
      { label: "Budget approximatif validé",          done: true },
      { label: "Calendrier projet estimé",            done: false, todo: true },
    ],
    discovery: [
      { label: "Discovery call réalisé",              done: true },
      { label: "Cartographie des décideurs (≥ 3)",   done: true },
      { label: "Use-cases clés validés",              done: true },
      { label: "Critères de décision identifiés",     done: false, todo: true },
    ],
    propo: [
      { label: "Proposition commerciale envoyée",     done: true },
      { label: "Décideurs identifiés (≥ 3 personas)", done: true },
      { label: "Budget confirmé par CFO",             done: true },
      { label: "Critères de décision documentés",     done: true },
      { label: "Conditions commerciales négociées",   done: false, todo: true, deadline: "Avant comité" },
      { label: "Sponsor exécutif client confirmé",    done: false, todo: true },
      { label: "Échéance close cible alignée",        done: false, warn: true, value: "T-18 j" },
    ],
    nego: [
      { label: "Conditions juridiques arrêtées",      done: false, todo: true },
      { label: "Bon de commande / engagement",        done: false, todo: true },
      { label: "Signataire confirmé",                 done: false, todo: true },
    ],
    won: [
      { label: "Contrat signé par les deux parties",  done: false, todo: true },
      { label: "Bon de livraison / kickoff planifié", done: false, todo: true },
    ],
  };

  const [criteria, setCriteria] = React.useState(defaultCriteria[current.k] || []);
  React.useEffect(() => { setCriteria(defaultCriteria[current.k] || []); }, [current.k]);

  const toggleCriterion = (i) => setCriteria((cs) => cs.map((c, idx) => idx === i ? { ...c, done: !c.done } : c));
  const addCriterion = () => {
    const label = prompt("Nouveau critère :");
    if (label) setCriteria((cs) => [...cs, { label, done: false, todo: true }]);
  };

  const passed = criteria.filter((c) => c.done).length;
  const totalC = criteria.length;
  const pct = totalC ? Math.round((passed / totalC) * 100) : 0;
  const remaining = totalC - passed;

  // Update fields
  const [newAmount, setNewAmount] = React.useState(opp.amount);
  const [newClose, setNewClose] = React.useState(opp.close);
  const [comment, setComment] = React.useState("");

  // Tasks to plan for next stage
  const defaultTasks = {
    nego: [
      { check: true, p: "haute", title: "Présenter proposition finale", due: "À planifier", who: "Owner", icon: "📅" },
      { check: true, p: "haute", title: "Envoyer proposition v3 avec ajustements", due: "À planifier", who: "Owner", icon: "📧" },
      { check: false, p: "moyenne", title: "Préparer matrice négociation (3 scénarios remise)", due: "À planifier", who: "Karim Ben Salah", icon: "📊" },
      { check: false, p: "moyenne", title: "Demander signature DPA + clause DORA", due: "À planifier", who: "Tom Verdier", icon: "⚖" },
    ],
    won: [
      { check: false, p: "haute", title: "Préparer contrat de signature", due: "À planifier", who: "Owner", icon: "📄" },
      { check: false, p: "moyenne", title: "Kickoff projet — 1ère réunion équipe", due: "Sous 7 j", who: "Owner", icon: "🚀" },
    ],
    discovery: [
      { check: false, p: "haute", title: "Discovery call avec décideur principal", due: "Sous 5 j", who: "Owner", icon: "📞" },
    ],
    propo: [
      { check: false, p: "haute", title: "Envoyer proposition commerciale", due: "Sous 7 j", who: "Owner", icon: "📧" },
    ],
    qualif: [],
  };

  const [tasks, setTasks] = React.useState(defaultTasks[target.k] || []);
  React.useEffect(() => { setTasks(defaultTasks[target.k] || []); }, [target.k]);
  const toggleTask = (i) => setTasks((ts) => ts.map((t, idx) => idx === i ? { ...t, check: !t.check } : t));
  const addTask = () => {
    const title = prompt("Titre de la tâche :");
    if (!title) return;
    setTasks((ts) => [...ts, { check: false, p: "moyenne", title, due: "À planifier", who: "Owner", icon: "✅" }]);
  };

  // Forecast impact
  const ponderedBefore = opp.amount * (current.proba / 100);
  const ponderedAfter = opp.amount * (target.proba / 100);
  const gain = ponderedAfter - ponderedBefore;

  // Confirm advance
  const confirmAdvance = async (asLost) => {
    const newStage = asLost ? "lost" : target.k;
    const amountNum = parseFloat(String(newAmount || "0").replace(/[^\d.]/g, "")) || 0;
    try {
      await window.api.opportunities.update(opp.ref, {
        stage: newStage,
        proba: asLost ? 0 : target.proba,
        amount_eur: amountNum,
        close_date: newClose || null,
        notes: comment || null,
      });
    } catch (e) { console.warn("confirmAdvance:", e); }
    alert(asLost ? "Opportunité marquée comme perdue" : "Opportunité passée en " + target.label);
    if (clientId) window.location.href = "/fiche-client?id=" + encodeURIComponent(clientId);
    else window.location.href = "/crm";
  };

  // ── Render
  return (
    <div style={aoStyles.frame}>
      {/* Topbar */}
      <header style={aoStyles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", flexWrap: "wrap" }}>
          <a href="/crm" style={{ color: "#64748b", textDecoration: "none" }}>CRM</a><span style={{ color: "#cbd5e1" }}>/</span>
          <span>Pipeline</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span style={aoStyles.refMono}>{opp.ref}</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Faire avancer l'étape</span>
        </div>
        <button onClick={() => history.back()} style={aoStyles.iconBtn}>×</button>
      </header>

      {/* Title row */}
      <div style={aoStyles.titleRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={aoStyles.heroIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l7 7-7 7"/><path d="M5 12h15"/></svg>
          </div>
          <div>
            <h1 style={aoStyles.h1}>Faire avancer l'opportunité</h1>
            <p style={aoStyles.subtitle}>
              Passez l'opportunité <strong style={{ color: "#0f172a" }}>{opp.ref}</strong> de{" "}
              <span style={{ color: current.color, fontWeight: 600 }}>{current.label}</span> à{" "}
              <span style={{ color: target.color, fontWeight: 600 }}>{target.label}</span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => history.back()} style={aoStyles.ghostBtn}>Annuler</button>
          {curIdx > 0 && (
            <button
              onClick={() => setTargetIdx(curIdx - 1)}
              style={aoStyles.ghostBtn}
            >↩ Reculer à {stages[curIdx - 1].label}</button>
          )}
          <button onClick={() => confirmAdvance(false)} style={aoStyles.primaryBtn}>✓ Avancer en {target.label} →</button>
        </div>
      </div>

      {/* Opportunity card */}
      <div style={aoStyles.oppCard}>
        <div style={aoStyles.oppCardInner}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={aoStyles.oppRef}>{opp.ref}</span>
              <span style={{ ...aoStyles.stagePill, background: current.color + "20", color: current.color }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: current.color }} /> {current.label}
              </span>
              {opp.hot && <span style={aoStyles.hotPill}>🔥 Hot</span>}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: -0.3 }}>{opp.name}</div>
            {opp.client_name && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{opp.client_name}</div>}

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Probabilité</span>
                <span style={{ fontSize: 12, color: current.color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{current.proba} %</span>
              </div>
              <div style={aoStyles.probaBar}>
                <div style={{ width: current.proba + "%", height: "100%", background: current.color, borderRadius: 999 }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AOAvatar name={opp.owner} size={22} color="#a855f7" />
                <span style={{ fontSize: 12, color: "#475569" }}>{opp.owner}</span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>MAJ {opp.last_update || "récemment"}</span>
            </div>
          </div>

          <div style={{ textAlign: "right", borderLeft: "1px solid #f1f5f9", paddingLeft: 22, marginLeft: 22 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5 }}>{aoFmtEUR(opp.amount)}</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Clôture {opp.close || "—"}</div>
          </div>
        </div>
      </div>

      {/* Pipeline visual */}
      <div style={aoStyles.pipeViz}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Progression dans le pipeline</div>
        <div style={aoStyles.pipeRow}>
          {stages.map((s, i, arr) => {
            const done = i < curIdx;
            const isCurrent = i === curIdx;
            const isNext = i === targetIdx && targetIdx !== curIdx;
            return (
              <React.Fragment key={s.k}>
                <div
                  onClick={() => setTargetIdx(i)}
                  style={{ ...aoStyles.pipeNode, cursor: "pointer" }}
                >
                  <div style={{
                    ...aoStyles.pipeDot,
                    background: done ? "#10b981" : isCurrent ? "#a855f7" : isNext ? "linear-gradient(135deg, #ea580c, #f59e0b)" : "#fff",
                    border: done || isCurrent || isNext ? "none" : "2px solid #cbd5e1",
                    color: "#fff",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(168,85,247,0.2)" : isNext ? "0 0 0 4px rgba(234,88,12,0.15)" : "none",
                  }}>{done ? "✓" : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} /> : isNext ? "→" : ""}</div>
                  <div style={{ fontSize: 12, fontWeight: isCurrent || isNext ? 700 : 600, color: done ? "#10b981" : isCurrent ? "#7e22ce" : isNext ? "#ea580c" : "#94a3b8", marginTop: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: isCurrent || isNext ? s.color : "#cbd5e1", fontWeight: 700, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{s.proba}%</div>
                  {isCurrent && <div style={aoStyles.currentTag}>ÉTAPE ACTUELLE</div>}
                  {isNext && <div style={aoStyles.nextTag}>→ NOUVELLE ÉTAPE</div>}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 3, background: done ? "#10b981" : i === curIdx && i < targetIdx ? "linear-gradient(90deg, #a855f7, #ea580c)" : "#eef1f5", borderRadius: 999, alignSelf: "flex-start", marginTop: 17 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Body grid */}
      <div style={aoStyles.body}>

        {/* LEFT */}
        <div style={aoStyles.leftCol}>

          {/* Criteria */}
          <section style={aoStyles.section}>
            <div style={aoStyles.sectionHead}>
              <div>
                <h2 style={aoStyles.h2}>Critères de sortie — {current.label}</h2>
                <p style={aoStyles.h2sub}>Validez les conditions avant de passer en {target.label}</p>
              </div>
              <div style={aoStyles.completionPill}>
                <div style={aoStyles.completionCircle}>
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="#eef1f5" strokeWidth="4" />
                    <circle cx="16" cy="16" r="13" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${(pct/100)*82} 82`} strokeLinecap="round" transform="rotate(-90 16 16)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{passed} / {totalC} validés</div>
                  <div style={{ fontSize: 10.5, color: "#64748b" }}>{remaining} critère{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>

            <div style={aoStyles.criteriaList}>
              {criteria.map((c, i) => (
                <div key={i} style={{
                  ...aoStyles.criterion,
                  ...(c.warn ? aoStyles.criterionWarn : c.todo && !c.done ? aoStyles.criterionTodo : c.done ? aoStyles.criterionDone : {}),
                }}>
                  <div
                    onClick={() => toggleCriterion(i)}
                    style={{
                      ...aoStyles.checkBox,
                      cursor: "pointer",
                      background: c.done ? "#10b981" : "transparent",
                      border: c.done ? "none" : c.warn ? "1.5px solid #f59e0b" : "1.5px solid #cbd5e1",
                      color: "#fff",
                    }}
                  >{c.done && "✓"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.label}</div>
                    {c.deadline && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2, fontWeight: 600 }}>⏱ {c.deadline}</div>}
                    {c.value && <div style={{ fontSize: 11, color: "#a65f00", marginTop: 2, fontWeight: 600 }}>⚠ {c.value}</div>}
                  </div>
                  {!c.done && (
                    <button onClick={() => toggleCriterion(i)} style={aoStyles.smBtn}>Valider</button>
                  )}
                </div>
              ))}
              <button onClick={addCriterion} style={{ ...aoStyles.smBtnGhost, alignSelf: "flex-start", marginTop: 4 }}>+ Ajouter un critère</button>
            </div>
          </section>

          {/* Update fields */}
          <section style={aoStyles.section}>
            <div style={aoStyles.sectionHead}>
              <div>
                <h2 style={aoStyles.h2}>Mise à jour des champs</h2>
                <p style={aoStyles.h2sub}>Le passage en {target.label} pré-remplit ces valeurs — modifiez si nécessaire</p>
              </div>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#eef2ff", color: "#4f46e5", fontWeight: 700, letterSpacing: 0.3 }}>AUTO-RENSEIGNÉ</span>
            </div>

            <div style={aoStyles.updateGrid}>
              <AOUpdateField
                label="Montant"
                oldVal={aoFmtEUR(opp.amount)}
                newVal={aoFmtEUR(newAmount)}
                same={newAmount === opp.amount}
              />
              <AOUpdateField
                label="Probabilité"
                oldVal={current.proba + " %"}
                newVal={target.proba + " %"}
                bar={target.proba}
                color={target.color}
              />
              <AOUpdateField
                label="Date de clôture"
                oldVal={opp.close || "—"}
                newVal={newClose || "—"}
                same={newClose === opp.close}
                helper="Modifiable"
              />
              <AOUpdateField
                label="Owner"
                oldVal={opp.owner}
                newVal={opp.amount > 200000 ? opp.owner + " + VP Sales" : opp.owner}
                same={opp.amount <= 200000}
                helper={opp.amount > 200000 ? "VP Sales rejoint sur deal > 200 k€" : null}
              />
            </div>

            <div style={aoStyles.noteRow}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6, display: "block" }}>
                Commentaire de changement d'étape{" "}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>· visible dans l'historique de l'opportunité</span>
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={aoStyles.textarea}
                rows="3"
                placeholder="Contexte du passage d'étape, points clés, prochaines actions…"
              />
            </div>
          </section>

          {/* Tasks for next stage */}
          <section style={aoStyles.section}>
            <div style={aoStyles.sectionHead}>
              <div>
                <h2 style={aoStyles.h2}>Actions à planifier en {target.label}</h2>
                <p style={aoStyles.h2sub}>Ces tâches seront créées automatiquement à l'avancement</p>
              </div>
              <button onClick={addTask} style={aoStyles.smBtn}>+ Ajouter</button>
            </div>

            {tasks.length === 0 ? (
              <div style={{ padding: 18, fontSize: 12, color: "#94a3b8", textAlign: "center", background: "#fafbfc", border: "1px dashed #e2e8f0", borderRadius: 8 }}>
                Aucune tâche par défaut pour cette étape. Cliquez sur <b>+ Ajouter</b> pour en créer.
              </div>
            ) : (
              <div style={aoStyles.taskList}>
                {tasks.map((t, i) => (
                  <div key={i} style={aoStyles.taskRow}>
                    <input type="checkbox" checked={t.check} onChange={() => toggleTask(i)} style={{ accentColor: "#4f46e5" }} />
                    <span style={{
                      ...aoStyles.prioPill,
                      background: t.p === "haute" ? "#fdecec" : "#fef0e6",
                      color: t.p === "haute" ? "#dc2626" : "#ea580c",
                    }}>{t.p === "haute" ? "Haute" : "Moy."}</span>
                    <div style={{ width: 26, textAlign: "center", fontSize: 14 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>⏱ {t.due}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AOAvatar name={t.who} size={20} color="#6366f1" />
                      <span style={{ fontSize: 11, color: "#475569" }}>{t.who.split(" ")[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <aside style={aoStyles.rightCol}>

          {/* Health */}
          <div style={aoStyles.healthCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Santé de l'opportunité</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(16,185,129,0.2)", color: "#86efac", fontWeight: 700 }}>● {pct >= 70 ? "SAINE" : pct >= 40 ? "À SUIVRE" : "À RISQUE"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>{Math.round(pct * 0.6 + (target.proba * 0.4))}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>/ 100</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
              <div style={{ width: Math.round(pct * 0.6 + (target.proba * 0.4)) + "%", height: "100%", background: "linear-gradient(90deg, #a78bfa, #10b981)", borderRadius: 999 }} />
            </div>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
              <AOHealthMetric label="Critères validés" value={pct} color="#10b981" />
              <AOHealthMetric label="Probabilité étape" value={target.proba} color="#a78bfa" />
              <AOHealthMetric label="Vélocité (cycle)" value={78} color="#10b981" />
            </div>
          </div>

          {/* AI insights */}
          <div style={aoStyles.aiCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>★</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Hub Assistant — insights</div>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>Analyse d'opportunités similaires</div>
              </div>
            </div>

            <div style={aoStyles.aiItem}>
              <span style={{ ...aoStyles.aiBullet, background: "#10b981" }}>✓</span>
              <div>
                <div style={{ fontSize: 11.5, color: "#0f172a", lineHeight: 1.5 }}>
                  <strong>{pct >= 70 ? "Bon moment pour avancer." : "Avancement prématuré possible."}</strong>{" "}
                  {pct}% des critères sont validés. Cycle moyen restant : ~22 j.
                </div>
              </div>
            </div>

            <div style={aoStyles.aiItem}>
              <span style={{ ...aoStyles.aiBullet, background: "#4f46e5" }}>i</span>
              <div>
                <div style={{ fontSize: 11.5, color: "#0f172a", lineHeight: 1.5 }}>
                  <strong>Remise habituelle :</strong> 8-12 % en Négociation sur ce segment.
                </div>
              </div>
            </div>
          </div>

          {/* Forecast impact */}
          <div style={aoStyles.impactCard}>
            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Impact forecast</div>

            <div style={aoStyles.impactRow}>
              <div>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>Pondéré avant</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{aoFmtEUR(ponderedBefore)}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{aoFmtEUR(opp.amount)} × {current.proba} %</div>
              </div>
              <span style={{ fontSize: 18, color: "#cbd5e1" }}>→</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, color: "#64748b" }}>Pondéré après</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: gain >= 0 ? "#10b981" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>{aoFmtEUR(ponderedAfter)}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{aoFmtEUR(opp.amount)} × {target.proba} %</div>
              </div>
            </div>

            <div style={{ ...aoStyles.impactGain, background: gain >= 0 ? "#e8f8f1" : "#fdecec", color: gain >= 0 ? "#0e7a55" : "#dc2626" }}>
              <span>{gain >= 0 ? "↗ Gain pondéré" : "↘ Perte pondérée"}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{gain >= 0 ? "+ " : "– "}{aoFmtEUR(Math.abs(gain))}</span>
            </div>
          </div>

          {/* Notify */}
          <div style={aoStyles.notifyCard}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Notifier à l'avancement</div>
            <div style={aoStyles.notifyRow}>
              <input type="checkbox" defaultChecked />
              <AOAvatar name="Claire Renaud" size={20} color="#dc2626" />
              <span style={{ fontSize: 11.5, flex: 1 }}>Claire Renaud · VP Sales</span>
            </div>
            <div style={aoStyles.notifyRow}>
              <input type="checkbox" defaultChecked />
              <AOAvatar name="Karim Ben Salah" size={20} color="#6366f1" />
              <span style={{ fontSize: 11.5, flex: 1 }}>Karim Ben Salah · Co-owner</span>
            </div>
            <div style={aoStyles.notifyRow}>
              <input type="checkbox" />
              <span style={{ width: 20, height: 20, borderRadius: 999, background: "#eef1f5", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>#</span>
              <span style={{ fontSize: 11.5, flex: 1 }}>Canal Slack #deals</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky bottom */}
      <div style={aoStyles.stickyBottom}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            <strong style={{ color: "#0f172a" }}>{remaining} critère{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""}</strong>
            {remaining > 0 && " · vous pouvez avancer malgré tout"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { if (confirm("Marquer cette opportunité comme perdue ?")) confirmAdvance(true); }} style={aoStyles.dangerGhostBtn}>Marquer comme perdu</button>
          <button onClick={() => confirmAdvance(false)} style={aoStyles.primaryBtnBig}>
            ✓ Confirmer le passage en {target.label}
          </button>
        </div>
      </div>
    </div>
  );
};

const aoStyles = {
  frame: { width: "100%", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", paddingBottom: 80 },

  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5" },
  iconBtn: { width: 32, height: 32, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },

  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eef1f5", background: "#fff", flexWrap: "wrap", gap: 16 },
  heroIcon: { width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, #a855f7, #ea580c)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(168,85,247,0.3)" },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "8px 16px", border: "none", background: "linear-gradient(135deg, #ea580c, #f59e0b)", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 8px rgba(234,88,12,0.3)" },

  oppCard: { margin: "20px 28px 0", padding: 0, background: "#fff", border: "1.5px solid #fed7aa", borderRadius: 12, position: "relative", boxShadow: "0 0 0 1px #fed7aa, 0 4px 16px rgba(234,88,12,0.06)" },
  oppCardInner: { display: "flex", padding: 18, alignItems: "stretch", flexWrap: "wrap", gap: 12 },
  oppRef: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#475569", fontWeight: 600 },
  stagePill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 },
  hotPill: { fontSize: 10.5, padding: "1px 6px", borderRadius: 4, background: "#fff1d6", color: "#a65f00", fontWeight: 700 },
  probaBar: { width: "100%", height: 6, background: "#f3e8ff", borderRadius: 999, overflow: "hidden" },

  pipeViz: { margin: "24px 28px 8px", padding: 22, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  pipeRow: { display: "flex", alignItems: "flex-start", overflowX: "auto" },
  pipeNode: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100, position: "relative", padding: "0 4px" },
  pipeDot: { width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 },
  currentTag: { position: "absolute", top: -22, fontSize: 8.5, padding: "2px 6px", borderRadius: 3, background: "#7e22ce", color: "#fff", fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap" },
  nextTag: { position: "absolute", top: -22, fontSize: 8.5, padding: "2px 6px", borderRadius: 3, background: "#ea580c", color: "#fff", fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap" },

  body: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, padding: "20px 28px" },
  leftCol: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  rightCol: { display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "start" },

  section: { padding: 22, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 10, flexWrap: "wrap" },
  h2: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.3 },
  h2sub: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },

  completionPill: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  completionCircle: { position: "relative", width: 32, height: 32 },

  criteriaList: { display: "flex", flexDirection: "column", gap: 8 },
  criterion: { display: "flex", alignItems: "flex-start", gap: 12, padding: 12, border: "1px solid #eef1f5", borderRadius: 8, background: "#fafbfc" },
  criterionDone: { background: "#f0fdf6", borderColor: "#bbf7d0" },
  criterionTodo: { background: "linear-gradient(180deg, #fafbff, #fff)", borderColor: "#c7d2fe", borderStyle: "dashed" },
  criterionWarn: { background: "#fffbeb", borderColor: "#fde68a" },
  checkBox: { width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 },
  smBtn: { padding: "3px 10px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 600 },
  smBtnGhost: { padding: "3px 10px", border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 500 },

  updateGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  noteRow: { padding: 14, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  textarea: { width: "100%", padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box", background: "#fff" },

  taskList: { display: "flex", flexDirection: "column", gap: 6 },
  taskRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  prioPill: { fontSize: 9.5, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.3 },

  healthCard: { padding: 18, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)", borderRadius: 12, color: "#fff", boxShadow: "0 4px 16px rgba(67,56,202,0.2)" },
  aiCard: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  aiItem: { display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  aiBullet: { width: 18, height: 18, borderRadius: 999, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 },

  impactCard: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  impactRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  impactGain: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, marginTop: 10, fontSize: 13, fontWeight: 700 },

  notifyCard: { padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  notifyRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0" },

  stickyBottom: { position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 28px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 16px rgba(15,23,42,0.06)", flexWrap: "wrap", gap: 10, zIndex: 100 },
  dangerGhostBtn: { padding: "8px 14px", border: "1px solid #fecaca", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#dc2626", cursor: "pointer", fontWeight: 500 },
  primaryBtnBig: { padding: "10px 20px", border: "none", background: "linear-gradient(135deg, #ea580c, #f59e0b)", color: "#fff", borderRadius: 8, fontSize: 13.5, cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 14px rgba(234,88,12,0.4)", display: "flex", alignItems: "center" },
};

window.AdvanceOpportunity = AdvanceOpportunity;
