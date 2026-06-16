// Nouveau contrat — formulaire de création fonctionnel

const NCAvatar = ({ name, size = 22, color }) => {
  if (!name) return null;
  const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("");
  const palette = { N: "#a855f7", K: "#6366f1", S: "#10b981", T: "#f59e0b", E: "#0ea5e9", L: "#dc2626", J: "#8b5cf6", M: "#dc2626", C: "#dc2626" };
  const bg = color || palette[initials[0]] || "#64748b";
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
  );
};

const NCSectionHead = ({ num, title, subtitle, status }) => {
  const statusMeta = {
    done: { bg: "#e8f8f1", color: "#0e7a55", icon: "✓" },
    active: { bg: "#eef2ff", color: "#4f46e5", icon: num },
    todo: { bg: "#fafbfc", color: "#94a3b8", icon: num },
  };
  const s = statusMeta[status] || statusMeta.todo;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eef1f5" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{s.icon}</div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.2 }}>{title}</h2>
        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
};

const NCFormRow = ({ label, subtitle, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{label}</span>
      {required && <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>}
      {subtitle && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{subtitle}</span>}
    </div>
    {children}
  </div>
);

const NCCondRow = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9", gap: 14 }}>
    <span style={{ fontSize: 11.5, color: "#64748b", width: 150, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1 }}>{value}</div>
  </div>
);

const NCTotalRow = ({ label, v, color, strong, strongLarge }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: strong || strongLarge ? "2px solid #eef1f5" : "1px solid #f1f5f9", marginTop: strongLarge ? 4 : 0 }}>
    <span style={{ fontSize: strongLarge ? 13 : 11.5, color: strong || strongLarge ? "#0f172a" : "#64748b", fontWeight: strong || strongLarge ? 700 : 500 }}>{label}</span>
    <span style={{ fontSize: strongLarge ? 14 : strong ? 13 : 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: strong || strongLarge ? 700 : 600, color: color || "#0f172a" }}>{v}</span>
  </div>
);

const NCLifecycleItem = ({ date, label, active, warn, final }) => (
  <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
    <div style={{
      width: 8, height: 8, borderRadius: 999, marginTop: 5,
      background: active ? "#4f46e5" : warn ? "#f59e0b" : final ? "#dc2626" : "#cbd5e1",
      boxShadow: active ? "0 0 0 4px rgba(79,70,229,0.2)" : "none",
      flexShrink: 0,
    }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#0f172a", fontWeight: 600 }}>{date}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{label}</div>
    </div>
  </div>
);

const fmtEUR = (n) => {
  if (!isFinite(n)) return "0 €";
  return Math.round(n).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};

const fmtDateFR = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch (e) { return iso; }
};

const NewContract = () => {
  const params = (typeof window !== "undefined") ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const clientId = params.get("client") || "";
  const oppId = params.get("opp") || "";

  // ── Client lookup
  const [clientObj, setClientObj] = React.useState(null);
  React.useEffect(() => {
    if (!clientId || !window.api) return;
    window.api.clients.getById(clientId).then((data) => { if (data) setClientObj(data); }).catch(() => {});
  }, [clientId]);

  const clientName = (clientObj && (clientObj.name || clientObj.raison_sociale)) || (clientId ? "Chargement…" : "Aucun client sélectionné");
  const clientSiren = (clientObj && (clientObj.siren || clientObj.siret)) || "—";
  const clientInitials = (clientName.split(" ").slice(0, 2).map(s => s[0]).join("") || "??").toUpperCase();

  // ── State
  const [contractType, setContractType] = React.useState("saas");      // saas | licence | service | renew
  const [category, setCategory] = React.useState("new");                // new | extension | upsell
  const [duration, setDuration] = React.useState(36);                   // mois
  const [tacite, setTacite] = React.useState(true);
  const [indexation, setIndexation] = React.useState("Aucune");
  const [indexCap, setIndexCap] = React.useState(3);
  const [paymentDelay, setPaymentDelay] = React.useState("30j");        // 15j | 30j | 45fdm | 60j
  const [billingPeriod, setBillingPeriod] = React.useState("annual");   // monthly | quarterly | annual
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [currency, setCurrency] = React.useState("EUR");
  const [signMethod, setSignMethod] = React.useState("qualified");
  const [signatory, setSignatory] = React.useState({ name: "", role: "" });
  const [savedTick, setSavedTick] = React.useState(0);
  // Preview avant envoi pour signature
  const [previewOpen, setPreviewOpen] = React.useState(false);
  // Modèles juridiques (CGV) chargés depuis l'admin
  const [templates, setTemplates] = React.useState([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  React.useEffect(() => {
    if (!window.api || !window.api.contractTemplates) return;
    window.api.contractTemplates.list().then((list) => {
      setTemplates(list || []);
      // Pré-sélectionne le modèle marqué par défaut, sinon le premier
      const def = (list || []).find((t) => t.is_default) || (list || [])[0];
      if (def) setSelectedTemplate(def);
    }).catch(() => {});
  }, []);

  // ── Products
  const [products, setProducts] = React.useState([
    { id: "p1", name: "Astorya Suite Enterprise", sku: "AST-SUITE-ENT", desc: "Plateforme commerciale complète · accès illimité modules · support N2 inclus", unit: 240, qty: 750, discount: 12, periodicity: "annual", color: "#a855f7" },
    { id: "p2", name: "Astorya Cyber — module conformité", sku: "AST-CYBER", desc: "Add-on DORA · audits trimestriels · 5 utilisateurs admin", unit: 22000, qty: 1, discount: 0, periodicity: "annual", color: "#dc2626" },
    { id: "p3", name: "Implémentation & onboarding", sku: "SVC-ONB-ENT", desc: "Déploiement 12 semaines · formation 30 utilisateurs clés · migration données", unit: 3600, qty: 12, discount: 0, periodicity: "oneshot", color: "#0ea5e9" },
  ]);
  const [annexes, setAnnexes] = React.useState([
    { id: "a1", label: "SLA niveau Premium" },
    { id: "a2", label: "DPA — RGPD" },
  ]);
  const [clauses, setClauses] = React.useState([
    { id: "c1", tag: "NÉGOCIÉ", text: "Pénalité SLA à 5 % si dispo < 99,5 %" },
    { id: "c2", tag: "NÉGOCIÉ", text: "Sortie anticipée possible à M+18 si non-conformité DORA" },
  ]);

  // ── Totals (computed)
  const sums = React.useMemo(() => {
    let recurringHT = 0, oneshotHT = 0, discountTotal = 0;
    products.forEach((p) => {
      const gross = (Number(p.unit) || 0) * (Number(p.qty) || 0);
      const disc  = gross * (Number(p.discount) || 0) / 100;
      const net   = gross - disc;
      discountTotal += disc;
      if (p.periodicity === "oneshot") oneshotHT += net; else recurringHT += net;
    });
    const totalY1HT = recurringHT + oneshotHT;
    const tva = totalY1HT * 0.20;
    const totalY1TTC = totalY1HT + tva;
    const years = duration / 12;
    const tcv = recurringHT * years + oneshotHT;
    const cost = tcv * 0.62;
    const margin = tcv - cost;
    const marginPct = tcv > 0 ? Math.round((margin / tcv) * 100) : 0;
    return { recurringHT, oneshotHT, discountTotal, totalY1HT, tva, totalY1TTC, tcv, cost, margin, marginPct };
  }, [products, duration]);

  // ── Auto-save (mocked)
  React.useEffect(() => {
    const t = setInterval(() => setSavedTick((v) => v + 1), 8000);
    return () => clearInterval(t);
  }, []);

  // ── Dates
  const endDate = React.useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + duration);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [startDate, duration]);

  // ── Mutations
  const updateProduct = (id, patch) => setProducts((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p));
  const removeProduct = (id) => setProducts((ps) => ps.filter((p) => p.id !== id));
  // addProduct : ajoute une ligne directement avec valeurs par défaut, l'user
  // édite ensuite les champs inline (prix/qty/périodicité) — UX plus rapide
  // qu'une suite de prompts.
  const addProduct = () => {
    const palette = ["#a855f7", "#dc2626", "#0ea5e9", "#10b981", "#f59e0b", "#6366f1"];
    setProducts((ps) => [...ps, {
      id: "p" + Date.now(),
      name: "Nouveau produit",
      sku: "—",
      desc: "",
      unit: 0,
      qty: 1,
      discount: 0,
      periodicity: "annual",
      color: palette[ps.length % palette.length]
    }]);
    if (window.HubToast) window.HubToast.info("Ligne ajoutée — éditez les champs ci-dessus");
  };
  const removeAnnexe = (id) => setAnnexes((a) => a.filter((x) => x.id !== id));
  const addAnnexe = async () => {
    const l = window.HubModal
      ? await window.HubModal.prompt({ title: "Nouvelle annexe", label: "Intitulé", placeholder: "ex : RIB Astorya" })
      : prompt("Intitulé de l'annexe :");
    if (l && l.trim()) setAnnexes((a) => [...a, { id: "a" + Date.now(), label: l.trim() }]);
  };
  const removeClause = (id) => setClauses((a) => a.filter((x) => x.id !== id));
  const addClause = async () => {
    const l = window.HubModal
      ? await window.HubModal.prompt({ title: "Clause spécifique", label: "Texte de la clause", multiline: true, placeholder: "Description de la clause négociée…" })
      : prompt("Clause spécifique :");
    if (l && l.trim()) setClauses((a) => [...a, { id: "c" + Date.now(), tag: "NÉGOCIÉ", text: l.trim() }]);
  };

  // ── Submit
  const submitContract = async (action) => {
    if (products.length === 0) { alert("Ajoutez au moins une ligne produit"); return; }
    const ctrRef = "CTR-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
    const titleParts = products.slice(0, 2).map((p) => p.name).join(" + ");
    const ctr = {
      id: ctrRef,
      client_id: clientId || "ACC-DEMO",
      client_name: clientName,
      opp_id: oppId || null,
      name: titleParts || "Contrat " + clientName,
      type: { saas: "Abonnement SaaS", licence: "Licence perpétuelle", service: "Prestation", renew: "Renouvellement" }[contractType] || "Contrat",
      category,
      products,
      duration,
      tacite,
      indexation,
      indexCap,
      payment_delay: paymentDelay,
      billing_period: billingPeriod,
      currency,
      start: startDate,
      end: endDate,
      sign_method: signMethod,
      annexes,
      clauses,
      total_ht_y1: sums.totalY1HT,
      tcv: sums.tcv,
      margin_pct: sums.marginPct,
      amount: fmtEUR(sums.totalY1HT) + " / an",
      status: action === "send" ? "pending_signature" : "draft",
      created_at: new Date().toISOString(),
    };
    // Validation côté "envoyer pour signature" : signataire obligatoire
    if (action === "send" && !signatory.name.trim()) {
      alert("⚠ Renseignez le nom du signataire avant d'envoyer pour signature");
      return;
    }
    let saved = null;
    try {
      saved = await window.api.contracts.create(ctr);
    } catch (e) {
      console.warn("submitContract:", e);
      alert("Erreur de sauvegarde : " + (e.message || e));
      return;
    }
    // Si "envoyer pour signature" : crée aussi une action de suivi pour
    // le commercial (rappel signature) si on a une API actions.
    if (action === "send" && window.api.actions && window.api.actions.create) {
      try {
        await window.api.actions.create({
          client_id: clientId,
          type: "task",
          title: "Suivi signature contrat " + ctrRef + " — " + (signatory.name || ""),
          meta: "Envoyer relance si pas signé sous 5 jours",
          due_text: "Sous 5 jours",
          priority: "haute",
          icon: "✍",
          tag: "Signature",
          tagColor: "#a855f7",
        });
      } catch (e) { console.warn("[NewContract] action création:", e); }
    }
    if (action === "send") {
      alert("✓ Contrat " + ctrRef + " envoyé pour signature à " + (signatory.name || "le signataire") + " — action de suivi créée");
    } else {
      alert("✓ Brouillon enregistré : " + ctrRef);
    }
    if (clientId) window.location.href = "/fiche-client?id=" + encodeURIComponent(clientId);
    else window.location.href = "/crm";
  };

  // ── helpers de rendu pour le segmented control durée
  const segDur = (val, label) => (
    <button onClick={() => setDuration(val)} style={{ ...ncStyles.segBtn, ...(duration === val ? ncStyles.segBtnActive : {}) }}>{label}</button>
  );
  const segPay = (val, label) => (
    <button onClick={() => setPaymentDelay(val)} style={{ ...ncStyles.segBtn, ...(paymentDelay === val ? ncStyles.segBtnActive : {}) }}>{label}</button>
  );
  const segBill = (val, label) => (
    <button onClick={() => setBillingPeriod(val)} style={{ ...ncStyles.segBtn, ...(billingPeriod === val ? ncStyles.segBtnActive : {}) }}>{label}</button>
  );
  const segCat = (val, label) => (
    <button onClick={() => setCategory(val)} style={{ ...ncStyles.segBtn, ...(category === val ? ncStyles.segBtnActive : {}) }}>{label}</button>
  );

  const typeCards = [
    { k: "saas", icon: "↻", label: "Abonnement SaaS", hint: "Récurrent annuel" },
    { k: "licence", icon: "📦", label: "Licence perpétuelle", hint: "One-shot" },
    { k: "service", icon: "🛠", label: "Prestation", hint: "Régie / forfait" },
    { k: "renew", icon: "🔄", label: "Renouvellement", hint: "Reconduction" },
  ];

  return (
    <div style={ncStyles.frame}>
      {/* Topbar */}
      <header style={ncStyles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b", flexWrap: "wrap" }}>
          <a href="/crm" style={{ color: "#64748b", textDecoration: "none" }}>CRM</a><span style={{ color: "#cbd5e1" }}>/</span>
          <span>Contrats</span><span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Nouveau contrat</span>
          <span style={ncStyles.refMono}>CTR-{new Date().getFullYear()}-DRAFT</span>
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>● Auto-save · il y a {savedTick * 8 % 60} sec</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => history.back()} style={ncStyles.ghostBtn}>Annuler</button>
          <button onClick={() => setPreviewOpen(true)} style={ncStyles.primaryBtn}>Créer & envoyer pour signature</button>
        </div>
      </header>

      {/* Title row */}
      <div style={ncStyles.titleRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={ncStyles.heroIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/></svg>
          </div>
          <div>
            <h1 style={ncStyles.h1}>Nouveau contrat</h1>
            <p style={ncStyles.subtitle}>Configurer un contrat — abonnement, services ou prestation ponctuelle</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={ncStyles.liveKpi}>
            <div style={ncStyles.liveKpiK}>Total HT</div>
            <div style={ncStyles.liveKpiV}>{fmtEUR(sums.totalY1HT)}</div>
          </div>
          <div style={ncStyles.liveKpi}>
            <div style={ncStyles.liveKpiK}>TCV {duration} mois</div>
            <div style={{ ...ncStyles.liveKpiV, color: "#4f46e5" }}>{fmtEUR(sums.tcv)}</div>
          </div>
          <div style={ncStyles.liveKpi}>
            <div style={ncStyles.liveKpiK}>Marge estimée</div>
            <div style={{ ...ncStyles.liveKpiV, color: "#10b981" }}>{sums.marginPct} %</div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={ncStyles.stepper}>
        {[
          { n: 1, label: "Type & rattachement", done: true },
          { n: 2, label: "Client & contact", done: true },
          { n: 3, label: "Produits & pricing", active: true },
          { n: 4, label: "Conditions juridiques" },
          { n: 5, label: "Signature & envoi" },
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div style={ncStyles.stepItem}>
              <div style={{
                ...ncStyles.stepDot,
                background: s.done ? "#10b981" : s.active ? "#4f46e5" : "#fff",
                border: s.done || s.active ? "none" : "1.5px solid #cbd5e1",
                color: s.done || s.active ? "#fff" : "#94a3b8",
              }}>{s.done ? "✓" : s.n}</div>
              <span style={{ fontSize: 12, fontWeight: s.active ? 700 : 500, color: s.done ? "#10b981" : s.active ? "#0f172a" : "#94a3b8" }}>{s.label}</span>
            </div>
            {i < arr.length - 1 && <div style={{ ...ncStyles.stepLine, background: s.done ? "#10b981" : "#eef1f5" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Body */}
      <div style={ncStyles.body}>
        <div style={ncStyles.bodyGrid}>

          {/* LEFT — form */}
          <div style={ncStyles.formCol}>

            {/* Row 1 : Type & rattachement + Client signataire */}
            <div style={ncStyles.pairGrid}>

            {/* SECTION 1 */}
            <section style={ncStyles.section}>
              <NCSectionHead num="01" title="Type & rattachement" subtitle="Nature du contrat et opportunité d'origine" status="done" />

              <div style={ncStyles.formGrid2}>
                <NCFormRow label="Type de contrat" required>
                  <div style={ncStyles.typeRow}>
                    {typeCards.map((t) => (
                      <div
                        key={t.k}
                        onClick={() => setContractType(t.k)}
                        style={{ ...ncStyles.typeCard, ...(contractType === t.k ? ncStyles.typeCardOn : {}) }}
                      >
                        <div style={ncStyles.typeIcon}>{t.icon}</div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: contractType === t.k ? 700 : 600, color: contractType === t.k ? "#0f172a" : "#475569" }}>{t.label}</div>
                          <div style={{ fontSize: 10.5, color: contractType === t.k ? "#64748b" : "#94a3b8" }}>{t.hint}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NCFormRow>

                <NCFormRow label="Catégorie">
                  <div style={ncStyles.segCtrl}>
                    {segCat("new", "Nouveau")}
                    {segCat("extension", "Extension")}
                    {segCat("upsell", "Upsell")}
                  </div>
                </NCFormRow>
              </div>

              <NCFormRow label="Opportunité d'origine" subtitle="Reprise automatique des conditions négociées">
                {oppId ? (
                  <div style={ncStyles.linkedOpp}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1e40af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{clientInitials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={ncStyles.refMono}>{oppId}</span>
                          <span style={{ ...ncStyles.stagePill, background: "#fef0e6", color: "#ea580c" }}>● Négociation</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 3 }}>{clientName}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { if (clientId) window.location.href = "/nouvelle-opportunite?client=" + encodeURIComponent(clientId); }} style={{ ...ncStyles.addChip, padding: "8px 14px", cursor: "pointer" }}>+ Créer une opportunité</button>
                )}
              </NCFormRow>
            </section>

            {/* SECTION 2 */}
            <section style={ncStyles.section}>
              <NCSectionHead num="02" title="Client & contact signataire" subtitle="Entité contractante et signataire habilité" status="done" />

              <div style={ncStyles.formGrid2}>
                <NCFormRow label="Entité contractante" required>
                  <div style={ncStyles.linkedCardMini}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: "#1e40af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700 }}>{clientInitials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{clientName}</div>
                      <div style={{ fontSize: 10.5, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>SIREN {clientSiren}</div>
                    </div>
                  </div>
                </NCFormRow>

                <NCFormRow label="Signataire habilité" required>
                  <div style={ncStyles.linkedCardMini}>
                    <NCAvatar name={signatory.name || "?"} size={26} color="#a855f7" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        value={signatory.name}
                        onChange={(e) => setSignatory({ ...signatory, name: e.target.value })}
                        placeholder="Nom complet"
                        style={{ ...ncStyles.input, padding: "4px 8px", fontSize: 12, border: "none", background: "transparent" }}
                      />
                      <input
                        value={signatory.role}
                        onChange={(e) => setSignatory({ ...signatory, role: e.target.value })}
                        placeholder="Fonction"
                        style={{ ...ncStyles.input, padding: "4px 8px", fontSize: 11, border: "none", background: "transparent", color: "#64748b" }}
                      />
                    </div>
                  </div>
                </NCFormRow>
              </div>
            </section>

            </div>{/* /Row 1 */}

            {/* SECTION 3 — pleine largeur (table) */}
            <section style={{ ...ncStyles.section, ...ncStyles.sectionActive }}>
              <NCSectionHead num="03" title="Produits & pricing" subtitle="Lignes du contrat, remises, abonnement" status="active" />

              <div style={ncStyles.table}>
                <div style={ncStyles.tableHead}>
                  <div style={{ width: 24 }}>≡</div>
                  <div style={{ flex: 1.5 }}>Produit / référence</div>
                  <div style={{ width: 90, textAlign: "right" }}>PU HT</div>
                  <div style={{ width: 70, textAlign: "center" }}>Qté</div>
                  <div style={{ width: 90, textAlign: "right" }}>Remise %</div>
                  <div style={{ width: 110, textAlign: "right" }}>Total HT</div>
                  <div style={{ width: 32 }}></div>
                </div>

                {products.map((p) => {
                  const gross = (Number(p.unit) || 0) * (Number(p.qty) || 0);
                  const net = gross * (1 - (Number(p.discount) || 0) / 100);
                  return (
                    <div key={p.id} style={ncStyles.tableRow}>
                      <div style={{ width: 24, color: "#cbd5e1", cursor: "grab" }}>⋮⋮</div>
                      <div style={{ flex: 1.5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color }} />
                          <input
                            value={p.name}
                            onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                            style={{ ...ncStyles.input, padding: "3px 6px", fontSize: 13, fontWeight: 600, border: "none", background: "transparent" }}
                          />
                          <span style={ncStyles.skuChip}>{p.sku}</span>
                          {p.periodicity === "oneshot" && (
                            <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "#fffbeb", color: "#a65f00", fontWeight: 700 }}>ONE-SHOT</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, paddingLeft: 16 }}>{p.desc}</div>
                      </div>
                      <div style={{ width: 90, textAlign: "right" }}>
                        <input
                          value={p.unit}
                          onChange={(e) => updateProduct(p.id, { unit: e.target.value.replace(/[^\d.]/g, "") })}
                          style={{ ...ncStyles.qtyInput, width: 80, textAlign: "right" }}
                        />
                      </div>
                      <div style={{ width: 70, textAlign: "center" }}>
                        <input
                          value={p.qty}
                          onChange={(e) => updateProduct(p.id, { qty: e.target.value.replace(/[^\d.]/g, "") })}
                          style={ncStyles.qtyInput}
                        />
                      </div>
                      <div style={{ width: 90, textAlign: "right" }}>
                        <input
                          value={p.discount}
                          onChange={(e) => updateProduct(p.id, { discount: e.target.value.replace(/[^\d.]/g, "") })}
                          style={{ ...ncStyles.qtyInput, width: 60, textAlign: "right" }}
                        />
                      </div>
                      <div style={{ width: 110, textAlign: "right" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(net)}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.periodicity === "oneshot" ? "one-shot" : "annuel"}</div>
                      </div>
                      <div style={{ width: 32 }}>
                        <button onClick={() => removeProduct(p.id)} style={ncStyles.rowMenu} title="Supprimer">×</button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={addProduct} style={ncStyles.addLine}>+ Ajouter une ligne · rechercher un article du catalogue</button>
              </div>

              <div style={ncStyles.totalsGrid}>
                <div style={ncStyles.condBlock}>
                  <h4 style={ncStyles.condH}>Conditions commerciales</h4>

                  <NCCondRow label="Durée d'engagement" value={
                    <div style={ncStyles.segCtrl}>
                      {segDur(12, "12 mois")}
                      {segDur(36, "36 mois")}
                      {segDur(60, "60 mois")}
                    </div>
                  } />
                  <NCCondRow label="Tacite reconduction" value={
                    <div style={ncStyles.toggleRow}>
                      <span
                        onClick={() => setTacite((v) => !v)}
                        style={{ ...ncStyles.toggle, background: tacite ? "#4f46e5" : "#cbd5e1" }}
                      >
                        <span style={{ ...ncStyles.toggleDot, left: tacite ? 14 : 2 }} />
                      </span>
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{tacite ? "Activée — préavis 90 j" : "Désactivée"}</span>
                    </div>
                  } />
                  <NCCondRow label="Indexation annuelle" value={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select value={indexation} onChange={(e) => setIndexation(e.target.value)} style={{ ...ncStyles.select100, padding: "5px 10px" }}>
                        <option>Aucune</option>
                        <option>SYNTEC</option>
                        <option>INSEE IPC</option>
                      </select>
                      <span style={{ fontSize: 11, color: "#64748b" }}>plafonnée à</span>
                      <input
                        value={indexCap}
                        onChange={(e) => setIndexCap(e.target.value.replace(/[^\d.]/g, ""))}
                        style={ncStyles.numInput}
                      />
                      <span style={{ fontSize: 12, color: "#475569" }}>%</span>
                    </div>
                  } />
                  <NCCondRow label="Délai paiement" value={
                    <div style={ncStyles.segCtrl}>
                      {segPay("15j", "15 j")}
                      {segPay("30j", "30 j net")}
                      {segPay("45fdm", "45 j fdm")}
                      {segPay("60j", "60 j")}
                    </div>
                  } />
                  <NCCondRow label="Périodicité facturation" value={
                    <div style={ncStyles.segCtrl}>
                      {segBill("monthly", "Mensuel")}
                      {segBill("quarterly", "Trim.")}
                      {segBill("quarterly_due", "Trim. terme à échoir")}
                      {segBill("annual", "Annuel avance")}
                    </div>
                  } />
                </div>

                <div style={ncStyles.totalsBlock}>
                  <h4 style={ncStyles.condH}>Récapitulatif financier</h4>

                  <NCTotalRow label="Sous-total abonnement HT" v={fmtEUR(sums.recurringHT)} />
                  <NCTotalRow label="Sous-total services HT" v={fmtEUR(sums.oneshotHT)} />
                  {sums.discountTotal > 0 && (
                    <NCTotalRow label="Remise commerciale" v={"– " + fmtEUR(sums.discountTotal)} color="#10b981" />
                  )}
                  <NCTotalRow label="Total HT année 1" v={fmtEUR(sums.totalY1HT)} strong />
                  <NCTotalRow label="TVA 20 %" v={fmtEUR(sums.tva)} />
                  <NCTotalRow label="Total TTC année 1" v={fmtEUR(sums.totalY1TTC)} strongLarge />

                  <div style={ncStyles.totalBox}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>TCV sur {duration} mois (HT)</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.7, marginTop: 4 }}>{fmtEUR(sums.tcv)}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{fmtEUR(sums.recurringHT)} récurrent annuel + {fmtEUR(sums.oneshotHT)} one-shot</div>
                    <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Coûts estimés</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>{fmtEUR(sums.cost)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Marge nette</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac", marginTop: 2 }}>{fmtEUR(sums.margin)} · {sums.marginPct} %</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Row 3 : Conditions + Signature */}
            <div style={ncStyles.pairGrid}>

            {/* SECTION 4 */}
            <section style={ncStyles.section}>
              <NCSectionHead num="04" title="Conditions juridiques & dates" subtitle="Cadre légal et calendrier contractuel" status="todo" />

              <div style={ncStyles.formGrid3}>
                <NCFormRow label="Date de début" required>
                  {(() => {
                    const V = window.HubValidators;
                    const dateErr = V && V.date(startDate, { notInPast: true });
                    return <>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ ...ncStyles.input, fontFamily: "'JetBrains Mono', monospace", ...(dateErr ? V.errorStyle(dateErr) : {}) }}
                      />
                      {dateErr && <div style={V.errorMsgStyle(dateErr)}>{dateErr.message}</div>}
                    </>;
                  })()}
                </NCFormRow>
                <NCFormRow label="Date de fin">
                  <input
                    type="date"
                    value={endDate}
                    readOnly
                    style={{ ...ncStyles.input, fontFamily: "'JetBrains Mono', monospace", background: "#fafbfc" }}
                  />
                  <div style={ncStyles.inputHelp}>Auto-calculé selon durée d'engagement</div>
                </NCFormRow>
                <NCFormRow label="Devise">
                  <input value="EUR (€)" readOnly disabled
                         title="Devise verrouillée"
                         style={{ ...ncStyles.input, fontFamily: "'JetBrains Mono', monospace", background: "#fafbfc", color: "#475569", cursor: "not-allowed" }} />
                </NCFormRow>
              </div>

              <div style={ncStyles.formGrid2}>
                <NCFormRow label="Modèle juridique" required>
                  {templates.length === 0 ? (
                    <div style={{ ...ncStyles.docPick, background: "#fff7ed", borderColor: "#fdba74" }}>
                      <span style={{ fontSize: 18 }}>⚠</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#9a3412" }}>Aucun modèle CGV uploadé</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Va dans <a href="/administration-utilisateurs" style={{ color: "#3730a3", textDecoration: "underline" }}>Administration → Modèles de contrat</a> pour uploader ton PDF.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplate ? selectedTemplate.id : ""}
                      onChange={(e) => setSelectedTemplate(templates.find((t) => t.id === e.target.value) || null)}
                      style={{ ...ncStyles.input, fontSize: 13 }}
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.version}{t.is_default ? " · DÉFAUT" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedTemplate && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>📄 {selectedTemplate.pdf_size_kb || "?"} Ko</span>
                      <span>·</span>
                      <span>{selectedTemplate.cgv_text ? Math.round(selectedTemplate.cgv_text.length / 100) / 10 + "k caractères extraits" : "Aucun texte extrait"}</span>
                      {selectedTemplate.pdf_url && (
                        <>
                          <span>·</span>
                          <a href={selectedTemplate.pdf_url} target="_blank" rel="noopener" style={{ color: "#3730a3", fontWeight: 600 }}>👁 Voir PDF source</a>
                        </>
                      )}
                    </div>
                  )}
                </NCFormRow>
                <NCFormRow label="Annexes">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {annexes.map((a) => (
                      <div key={a.id} style={ncStyles.annexRow}>
                        <span style={{ color: "#a855f7" }}>📎</span>
                        <span style={{ flex: 1, fontSize: 12, color: "#0f172a" }}>{a.label}</span>
                        <span onClick={() => removeAnnexe(a.id)} style={{ ...ncStyles.removeChip, cursor: "pointer" }}>×</span>
                      </div>
                    ))}
                    <button onClick={addAnnexe} style={{ ...ncStyles.addChip, alignSelf: "flex-start" }}>+ Ajouter une annexe</button>
                  </div>
                </NCFormRow>
              </div>

              <NCFormRow label="Clauses spécifiques" subtitle="Négociées hors standard">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {clauses.map((c) => (
                    <div key={c.id} style={ncStyles.clauseRow}>
                      <span style={{ ...ncStyles.clauseTag, background: "#eef2ff", color: "#4338ca" }}>{c.tag}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "#0f172a" }}>{c.text}</span>
                      <span onClick={() => removeClause(c.id)} style={{ ...ncStyles.removeChip, cursor: "pointer" }}>×</span>
                    </div>
                  ))}
                  <button onClick={addClause} style={{ ...ncStyles.addChip, alignSelf: "flex-start" }}>+ Ajouter une clause</button>
                </div>
              </NCFormRow>
            </section>

            {/* SECTION 5 */}
            <section style={ncStyles.section}>
              <NCSectionHead num="05" title="Signature & workflow" subtitle="Validation interne et signature électronique" status="todo" />

              <NCFormRow label="Mode de signature" required>
                <div style={ncStyles.signMethods}>
                  {[
                    { k: "qualified", emoji: "✍", title: "Signature électronique qualifiée", desc: "Via DocuSign — valeur juridique probante · délai moyen 2 j", badge: "eIDAS" },
                    { k: "simple", emoji: "📧", title: "Signature simple", desc: "Scan retour PDF · à éviter > 50 k€" },
                    { k: "manual", emoji: "🖋", title: "Signature manuscrite", desc: "Original papier — RDV physique requis" },
                  ].map((m) => (
                    <label
                      key={m.k}
                      onClick={() => setSignMethod(m.k)}
                      style={{ ...ncStyles.signMethod, ...(signMethod === m.k ? ncStyles.signMethodOn : {}) }}
                    >
                      <input type="radio" name="sign" checked={signMethod === m.k} onChange={() => setSignMethod(m.k)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{m.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: signMethod === m.k ? 700 : 600, color: signMethod === m.k ? "#0f172a" : "#475569" }}>{m.title}</span>
                          {m.badge && <span style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#4f46e5", color: "#fff", fontWeight: 700 }}>{m.badge}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: signMethod === m.k ? "#64748b" : "#94a3b8", marginTop: 3 }}>{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </NCFormRow>
            </section>

            </div>{/* /Row 3 */}

            {/* Bottom actions */}
            <div style={ncStyles.actionsRow}>
              <button onClick={() => history.back()} style={ncStyles.ghostBtn}>← Précédent</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => submitContract("draft")} style={ncStyles.ghostBtn}>Enregistrer brouillon</button>
                <button onClick={() => setPreviewOpen(true)} style={ncStyles.primaryBtn}>Continuer → Envoi signature</button>
              </div>
            </div>
          </div>

          {/* RIGHT — preview */}
          <aside style={ncStyles.previewCol}>
            <div style={ncStyles.pdfMock}>
              <div style={ncStyles.pdfHead}>
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Aperçu document</span>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#10b981", color: "#fff", fontWeight: 700 }}>● LIVE</span>
              </div>

              <div style={ncStyles.pdfPaper}>
                <div style={ncStyles.pdfHeader}>
                  <div style={ncStyles.pdfLogo}>H</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#0f172a", letterSpacing: 0.5 }}>HUB ASTORYA SAS</div>
                    <div style={{ fontSize: 7, color: "#64748b" }}>184 rue de Rivoli — 75001 Paris</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 7.5, color: "#94a3b8", fontWeight: 600 }}>CONTRAT N°</div>
                    <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>CTR-{new Date().getFullYear()}-DRAFT</div>
                  </div>
                </div>

                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", letterSpacing: -0.2 }}>Contrat de souscription</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{products[0] ? products[0].name : "—"} — {clientName}</div>

                  <div style={{ marginTop: 10, padding: 8, background: "#fafbfc", borderRadius: 4, fontSize: 8, lineHeight: 1.5, color: "#475569" }}>
                    <strong style={{ color: "#0f172a" }}>Entre les soussignés :</strong><br/>
                    Hub Astorya SAS, ci-après « le Prestataire »<br/>
                    et {clientName}, ci-après « le Client »
                  </div>

                  <div style={ncStyles.pdfTableHead}>
                    <span style={{ flex: 1 }}>Désignation</span>
                    <span style={{ width: 24, textAlign: "center" }}>Qté</span>
                    <span style={{ width: 60, textAlign: "right" }}>Total HT</span>
                  </div>
                  {products.map((p) => {
                    const net = (Number(p.unit) || 0) * (Number(p.qty) || 0) * (1 - (Number(p.discount) || 0) / 100);
                    return (
                      <div key={p.id} style={ncStyles.pdfLine}>
                        <span style={{ flex: 1, color: "#0f172a", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ width: 24, textAlign: "center" }}>{p.qty}</span>
                        <span style={{ width: 60, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmtEUR(net)}</span>
                      </div>
                    );
                  })}
                  <div style={{ ...ncStyles.pdfLine, background: "#0f172a", color: "#fff", padding: "5px 8px", marginTop: 4 }}>
                    <span style={{ flex: 1, fontWeight: 700 }}>TOTAL HT ANNÉE 1</span>
                    <span style={{ width: 60, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{fmtEUR(sums.totalY1HT)}</span>
                  </div>

                  <div style={{ marginTop: 12, padding: "5px 8px", background: "#eef2ff", borderRadius: 4, fontSize: 7, color: "#3730a3", textAlign: "center" }}>
                    Page 1 / {products.length + 3} · {annexes.length} annexe{annexes.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Lifecycle */}
            <div style={ncStyles.lifecycle}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Cycle de vie du contrat</div>
              <NCLifecycleItem date={fmtDateFR(startDate)} label="Date de début" active />
              <NCLifecycleItem date={fmtDateFR((() => { const d = new Date(startDate); d.setFullYear(d.getFullYear() + 1); return d.toISOString(); })())} label={"Échéance récurrente · " + fmtEUR(sums.recurringHT)} />
              {tacite && <NCLifecycleItem date={fmtDateFR((() => { const d = new Date(endDate); d.setDate(d.getDate() - 90); return d.toISOString(); })())} label="Préavis non-reconduction (T-90j)" warn />}
              <NCLifecycleItem date={fmtDateFR(endDate)} label={"Fin du contrat" + (tacite ? " · renouvellement auto" : "")} final />
            </div>

            {/* Alerts */}
            <div style={{ ...ncStyles.alertBlock, background: "#fff8f7", borderColor: "#fecaca" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Points d'attention</span>
              </div>
              {sums.discountTotal / Math.max(1, sums.totalY1HT + sums.discountTotal) > 0.10 && (
                <div style={ncStyles.alertItem}>
                  <span style={{ color: "#dc2626", fontSize: 10 }}>●</span>
                  <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>Remise globale > seuil standard 10 % → approbation Finance requise</span>
                </div>
              )}
              <div style={ncStyles.alertItem}>
                <span style={{ color: sums.marginPct >= 35 ? "#10b981" : "#f59e0b", fontSize: 10 }}>●</span>
                <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>Marge nette {sums.marginPct} % {sums.marginPct >= 35 ? "> objectif équipe (35 %)" : "< objectif équipe (35 %)"}</span>
              </div>
              {sums.totalY1HT > 150000 && (
                <div style={ncStyles.alertItem}>
                  <span style={{ color: "#f59e0b", fontSize: 10 }}>●</span>
                  <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>Montant {">"} 150 k€ — validation Direction Finance obligatoire</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Preview PDF avant signature */}
      {previewOpen && window.ContractPreview && (
        <ContractPreview
          contract={{
            id: "CTR-" + new Date().getFullYear() + "-DRAFT",
            client_id: clientId,
            client_name: clientName,
            name: products.slice(0, 2).map((p) => p.name).join(" + "),
            products,
            annexes,
            clauses,
            sums,
            start: startDate,
            end: endDate,
            duration,
            tacite,
            indexation,
            indexCap,
            payment_delay: paymentDelay,
            billing_period: billingPeriod,
            signatory,
          }}
          clientObj={clientObj}
          templateName={selectedTemplate ? (selectedTemplate.name + " " + selectedTemplate.version) : "CGV Astorya Suite v4.2 — FR"}
          cgvText={selectedTemplate ? selectedTemplate.cgv_text : null}
          templatePdfUrl={selectedTemplate ? selectedTemplate.pdf_url : null}
          onClose={() => setPreviewOpen(false)}
          onConfirm={() => { setPreviewOpen(false); submitContract("send"); }}
        />
      )}
    </div>
  );
};

const ncStyles = {
  frame: { width: "100%", minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column" },

  topbar: { padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  refMono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8", padding: "1px 6px", borderRadius: 4, background: "#fafbfc", border: "1px solid #eef1f5", marginLeft: 4 },
  ghostBtn: { padding: "7px 13px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 500 },
  primaryBtn: { padding: "7px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(79,70,229,0.3)" },

  titleRow: { padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eef1f5", background: "#fff", flexWrap: "wrap", gap: 16 },
  heroIcon: { width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, #4f46e5, #4338ca, #312e81)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7, margin: 0 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  liveKpi: { padding: "10px 16px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  liveKpiK: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 },
  liveKpiV: { fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: -0.4, marginTop: 2 },

  stepper: { display: "flex", alignItems: "center", padding: "14px 28px", borderBottom: "1px solid #eef1f5", background: "#fafbfc", gap: 8, flexWrap: "wrap" },
  stepItem: { display: "flex", alignItems: "center", gap: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 },
  stepLine: { flex: 1, height: 2, borderRadius: 999, maxWidth: 100, minWidth: 20 },

  body: { padding: 20 },
  bodyGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, gridAutoRows: "min-content" },
  formCol: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  pairGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" },

  section: { padding: 20, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  sectionActive: { boxShadow: "0 0 0 1px rgba(79,70,229,0.08), 0 4px 16px rgba(79,70,229,0.06)" },

  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f172a", outline: "none", boxSizing: "border-box" },
  inputHelp: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  select100: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#0f172a" },
  numInput: { width: 50, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", textAlign: "center" },
  qtyInput: { width: 50, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", textAlign: "center", fontWeight: 600 },
  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formGrid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },

  segCtrl: { display: "inline-flex", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2, background: "#fff", flexWrap: "wrap" },
  segBtn: { padding: "5px 10px", border: "none", background: "transparent", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 500 },
  segBtnActive: { background: "#0f172a", color: "#fff", fontWeight: 600 },

  typeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  typeCard: { display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: "#fff" },
  typeCardOn: { background: "linear-gradient(180deg, #eef2ff, #fff)", borderColor: "#4f46e5", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" },
  typeIcon: { width: 30, height: 30, borderRadius: 7, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 },

  linkedOpp: { display: "flex", alignItems: "center", gap: 12, padding: 14, background: "linear-gradient(135deg, #fafbff, #fff)", border: "1px solid #c7d2fe", borderRadius: 10 },
  linkedCardMini: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  changeBtn: { padding: "3px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, fontSize: 11, color: "#475569", cursor: "pointer", fontWeight: 500 },
  stagePill: { display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 },
  contactChip: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999 },
  removeChip: { color: "#cbd5e1", cursor: "pointer", fontSize: 13, lineHeight: 1 },
  addChip: { padding: "3px 10px", border: "1px dashed #cbd5e1", background: "transparent", borderRadius: 999, fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 500 },

  table: { border: "1px solid #eef1f5", borderRadius: 10, overflow: "hidden", marginBottom: 14 },
  tableHead: { display: "flex", alignItems: "center", padding: "10px 14px", background: "#fafbfc", borderBottom: "1px solid #eef1f5", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", background: "#fff" },
  skuChip: { fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#eef1f5", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },
  rowMenu: { width: 24, height: 24, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 16 },
  addLine: { width: "100%", padding: "12px", border: "none", borderTop: "1px dashed #cbd5e1", background: "#fafbfc", fontSize: 12, color: "#4f46e5", cursor: "pointer", fontWeight: 600, textAlign: "left", paddingLeft: 14 },

  totalsGrid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 },
  condBlock: { padding: 14, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 10 },
  condH: { fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.4 },
  totalsBlock: { padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 10 },

  toggleRow: { display: "flex", alignItems: "center", gap: 8 },
  toggle: { width: 28, height: 16, borderRadius: 999, position: "relative", display: "inline-block", cursor: "pointer" },
  toggleDot: { position: "absolute", top: 2, width: 12, height: 12, borderRadius: 999, background: "#fff", transition: "left .2s" },

  totalBox: { padding: 14, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)", borderRadius: 10, marginTop: 12, color: "#fff" },

  docPick: { display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 8 },
  annexRow: { display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 6 },
  clauseRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fafbfc", border: "1px solid #eef1f5", borderRadius: 6 },
  clauseTag: { fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 },

  signMethods: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  signMethod: { display: "flex", alignItems: "flex-start", gap: 8, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" },
  signMethodOn: { background: "linear-gradient(180deg, #fafbff, #fff)", borderColor: "#4f46e5", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" },

  actionsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginTop: 4, flexWrap: "wrap", gap: 12 },

  previewCol: { display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "start" },
  pdfMock: { padding: 14, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },
  pdfHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pdfPaper: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4, overflow: "hidden", boxShadow: "0 4px 16px rgba(15,23,42,0.08)" },
  pdfHeader: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "2px solid #0f172a" },
  pdfLogo: { width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 },
  pdfTableHead: { display: "flex", padding: "5px 8px", borderBottom: "1px solid #cbd5e1", marginTop: 10, fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 },
  pdfLine: { display: "flex", padding: "4px 8px", fontSize: 8, color: "#475569", borderBottom: "1px solid #f1f5f9" },

  lifecycle: { padding: 16, background: "#fff", border: "1px solid #eef1f5", borderRadius: 12 },

  alertBlock: { padding: 14, border: "1px solid", borderRadius: 12 },
  alertItem: { display: "flex", gap: 8, padding: "5px 0" },
};

window.NewContract = NewContract;
