// ════════════════════════════════════════════════════════════════════
// AdvanceOpportunity — Faire avancer une opportunité (méthode SPANCO)
// ════════════════════════════════════════════════════════════════════
// Refonte épurée alignée sur la charte Hub :
//  - Header sobre (blanc, comme la fiche client)
//  - Stepper SPANCO compact (5 étapes : Prospect → Approche → Négociation
//    → Conclusion → Ordre)
//  - 3 cards : Infos opp éditables / Critères / Commentaire de passage
//  - Panneau Santé conservé à droite
//  - Accent indigo #3730a3 (cohérent avec le reste du Hub)
//
// Mapping interne stage BDD → label SPANCO :
//   qualif      → Prospect    (20%)
//   discovery   → Approche    (35%)
//   propo       → Négociation (55%)
//   nego        → Conclusion  (75%)
//   won         → Ordre       (100%)
// ════════════════════════════════════════════════════════════════════

const aoFmtEUR = (n) => {
  const v = Number(n);
  if (!isFinite(v)) return "0 €";
  return Math.round(v).toLocaleString("fr-FR").replace(/,/g, " ") + " €";
};

const AdvanceOpportunity = () => {
  const params = (typeof window !== "undefined") ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const oppRef = params.get("opp") || null;
  const clientId = params.get("client") || "";

  const [oppData, setOppData] = React.useState(null);
  React.useEffect(() => {
    if (!oppRef || !window.api) return;
    window.api.opportunities.getById(oppRef).then((data) => {
      if (data) setOppData({
        ...data,
        ref: data.id || data.ref,
        amount: data.amount_eur != null ? data.amount_eur : data.amount,
        client_name: data.client_name || (data.data && data.data.client_name) || "",
      });
    }).catch((e) => console.warn("[AdvanceOpp] getById:", e));
  }, [oppRef]);

  // SPANCO : 5 étapes mappées sur les stages BDD historiques
  const stages = [
    { k: "qualif",    spanco: "Prospect",    letter: "P", proba: 20,  color: "#94a3b8" },
    { k: "discovery", spanco: "Approche",    letter: "A", proba: 35,  color: "#3b82f6" },
    { k: "propo",     spanco: "Négociation", letter: "N", proba: 55,  color: "#a855f7" },
    { k: "nego",      spanco: "Conclusion",  letter: "C", proba: 75,  color: "#ea580c" },
    { k: "won",       spanco: "Ordre",       letter: "O", proba: 100, color: "#10b981" },
  ];

  // Hooks AVANT le return conditionnel (règle des hooks)
  const opp = oppData || { ref: oppRef, name: "Chargement…", client_name: "", stage: "qualif", amount: 0, proba: 20, owner: "Vous", close: "" };
  const curIdx = Math.max(0, stages.findIndex((s) => s.k === opp.stage));
  const [targetIdx, setTargetIdx] = React.useState(Math.min(stages.length - 1, curIdx + 1));
  React.useEffect(() => { setTargetIdx(Math.min(stages.length - 1, curIdx + 1)); }, [curIdx]);
  const current = stages[curIdx];
  const target = stages[targetIdx];

  // Champs éditables — pré-remplis depuis la BDD
  const [editName, setEditName]                   = React.useState("");
  const [editAmount, setEditAmount]               = React.useState("");
  const [editBesoin, setEditBesoin]               = React.useState("");
  const [editConcurrent, setEditConcurrent]       = React.useState("");
  const [editConcurrentAmount, setEditConcurrentAmount] = React.useState("");
  const [editContractEnd, setEditContractEnd]     = React.useState("");
  const [editDecisionDate, setEditDecisionDate]   = React.useState("");
  const [editNotes, setEditNotes]                 = React.useState("");
  const [comment, setComment]                     = React.useState("");
  React.useEffect(() => {
    if (!oppData) return;
    setEditName(oppData.name || "");
    setEditAmount(oppData.amount != null ? String(oppData.amount) : "");
    setEditBesoin(oppData.besoin || (oppData.data && oppData.data.besoin) || "");
    setEditConcurrent(oppData.concurrent || (oppData.data && oppData.data.concurrent) || "");
    setEditConcurrentAmount(oppData.concurrent_amount || (oppData.data && oppData.data.concurrent_amount) || "");
    setEditContractEnd(oppData.contract_end || (oppData.data && oppData.data.contract_end) || "");
    setEditDecisionDate(oppData.close_date || "");
    setEditNotes(oppData.notes || (oppData.data && oppData.data.notes) || "");
  }, [oppData]);

  // Critères de sortie (auto-générés par stage cible)
  const defaultCriteria = {
    discovery: [
      { label: "Besoin client documenté",      done: true },
      { label: "Interlocuteur identifié",      done: true },
      { label: "Budget approximatif validé",   done: true },
      { label: "Calendrier projet estimé",     done: false },
    ],
    propo: [
      { label: "Rendez vous client en présentiel ou en visioconférence réalisé", done: true },
      { label: "Cartographie des décideurs (≥ 3)",        done: true },
      { label: "Valeurs ajoutées de la solution proposée validées", done: true },
      { label: "Création de l'offre concurrentielle financière SASP (génération d'un tableau situation actuelle - situation proposée)", done: false },
    ],
    nego: [
      { label: "Proposition commerciale envoyée",          done: true },
      { label: "Décideurs identifiés (≥ 3 personas)",     done: true },
      { label: "Budget confirmé par CFO",                 done: false },
      { label: "Sponsor exécutif client confirmé : la réussite du projet et l'alignement du projet sur la vision et la stratégie de l'entreprise", done: false },
    ],
    won: [
      { label: "Conditions juridiques arrêtées",   done: false },
      { label: "Bon de commande / Contrat d'engagement / Dossier de financement signé", done: false },
      { label: "Signataire confirmé",              done: false },
    ],
  };
  const [criteria, setCriteria] = React.useState(defaultCriteria[target.k] || []);
  React.useEffect(() => { setCriteria(defaultCriteria[target.k] || []); }, [target.k]);
  const toggleCriterion = (i) => setCriteria((cs) => cs.map((c, idx) => idx === i ? { ...c, done: !c.done } : c));
  const passed = criteria.filter((c) => c.done).length;
  const totalC = criteria.length;
  const pct = totalC > 0 ? Math.round((passed / totalC) * 100) : 100;

  // Early return après les hooks
  if (!oppRef) {
    return (
      <div style={{ padding: 40, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Aucune opportunité sélectionnée</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>Choisissez une opportunité dans le pipeline pour la faire avancer.</div>
        <a href="/crm" style={{ padding: "8px 14px", background: "#3730a3", color: "#fff", textDecoration: "none", borderRadius: 7, fontSize: 13, fontWeight: 600 }}>← Voir le pipeline</a>
      </div>
    );
  }

  // Métriques santé
  const amountNum = Number(editAmount) || 0;
  const ponderedBefore = amountNum * (current.proba / 100);
  const ponderedAfter  = amountNum * (target.proba / 100);
  const gain = ponderedAfter - ponderedBefore;
  const healthScore = Math.min(100, Math.round(pct * 0.5 + target.proba * 0.5));
  const healthTone = healthScore >= 70 ? { label: "Saine", color: "#065f46", bg: "#dcfce7" }
                    : healthScore >= 40 ? { label: "À surveiller", color: "#92400e", bg: "#fef3c7" }
                    : { label: "À risque", color: "#991b1b", bg: "#fee2e2" };

  // Enregistrer les modifications de la fiche SANS changer d'étape SPANCO.
  // Permet de sauver les champs édités (nom, montant, besoin, concurrent,
  // contract_end, notes, date de décision…) à tout moment du workflow.
  const [savingOpp, setSavingOpp] = React.useState(false);
  const saveOpp = async () => {
    const amountFinal = parseFloat(String(editAmount || "0").replace(/[^\d.]/g, "")) || 0;
    setSavingOpp(true);
    try {
      await window.api.opportunities.update(opp.ref, {
        amount_eur: amountFinal,
        close_date: editDecisionDate || null,
        notes: editNotes || null,
        name: editName || opp.name,
        besoin: editBesoin || null,
        concurrent: editConcurrent || null,
        concurrent_amount: editConcurrentAmount || null,
        contract_end: editContractEnd || null,
      });
      if (window.HubToast) window.HubToast.success("✓ Modifications enregistrées");
    } catch (e) {
      console.warn("saveOpp:", e);
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
    } finally {
      setSavingOpp(false);
    }
  };

  // Confirmer le passage
  const confirmAdvance = async (asLost) => {
    const newStage = asLost ? "lost" : target.k;
    const amountFinal = parseFloat(String(editAmount || "0").replace(/[^\d.]/g, "")) || 0;
    if (!asLost && passed < totalC) {
      const proceed = window.HubModal
        ? await window.HubModal.confirm({
            title: "Avancer en " + target.spanco + " ?",
            message: "Il reste " + (totalC - passed) + " critère" + (totalC - passed > 1 ? "s" : "") + " non validé" + (totalC - passed > 1 ? "s" : "") + ".",
            okLabel: "Avancer malgré tout",
          })
        : confirm("Il reste " + (totalC - passed) + " critère(s) non validé(s). Continuer ?");
      if (!proceed) return;
    }
    try {
      await window.api.opportunities.update(opp.ref, {
        stage: newStage,
        proba: asLost ? 0 : target.proba,
        amount_eur: amountFinal,
        close_date: editDecisionDate || null,
        notes: comment || editNotes || null,
        name: editName || opp.name,
        besoin: editBesoin || null,
        concurrent: editConcurrent || null,
        concurrent_amount: editConcurrentAmount || null,
        contract_end: editContractEnd || null,
      });
    } catch (e) {
      console.warn("confirmAdvance:", e);
      if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
      return;
    }

    // ⚡ Création automatique d'actions liées au passage d'étape.
    // Prospect (qualif) → Approche (discovery) : créer une action
    // « Préparation de la rédaction de l'offre commerciale » pour cadrer
    // le besoin et préparer le chiffrage avant Négociation.
    if (!asLost
        && (opp.stage || "qualif") === "qualif"
        && newStage === "discovery"
        && window.api.actions && window.api.actions.create) {
      try {
        const clientId = oppData && (oppData.client_id || (oppData.data && oppData.data.client_id));
        await window.api.actions.create({
          client_id: clientId || null,
          opp_id: opp.ref,
          type: "task",
          title: "Préparation de la rédaction de l'offre commerciale — " + (editName || opp.name || ""),
          meta: "Opportunité « " + (editName || opp.name || opp.ref) + " » passée en Approche : cadrer le besoin, identifier les décideurs et préparer la trame du devis.",
          due_text: "Sous 7 jours",
          due: "Sous 7 jours",
          priority: "haute",
          icon: "📝",
          tag: "Préparation offre",
          tagColor: "#3b82f6",
        });
        if (window.HubToast) window.HubToast.info("📝 Action « Préparation de la rédaction de l'offre commerciale » créée");
      } catch (e) { console.warn("[AdvanceOpp] création action préparation offre:", e); }
    }

    // Approche (discovery) → Négociation (propo) : créer une action
    // « Envoi de l'offre commerciale » assignée au commercial courant
    // (échéance 5 jours par défaut, priorité haute).
    if (!asLost
        && (opp.stage || "qualif") === "discovery"
        && newStage === "propo"
        && window.api.actions && window.api.actions.create) {
      try {
        const clientId = oppData && (oppData.client_id || (oppData.data && oppData.data.client_id));
        await window.api.actions.create({
          client_id: clientId || null,
          opp_id: opp.ref,
          type: "task",
          title: "Envoi de l'offre commerciale — " + (editName || opp.name || ""),
          meta: "Opportunité « " + (editName || opp.name || opp.ref) + " » passée en Négociation : envoyer le devis chiffré sous 5 jours.",
          due_text: "Sous 5 jours",
          due: "Sous 5 jours",
          priority: "haute",
          icon: "✉",
          tag: "Offre commerciale",
          tagColor: "#a855f7",
        });
        if (window.HubToast) window.HubToast.info("✉ Action « Envoi de l'offre commerciale » créée");
      } catch (e) { console.warn("[AdvanceOpp] création action offre:", e); }
    }

    // ⚡ CASCADE EXPLICITE COTÉ CLIENT pour passage en Ordre (won)
    // Filet de sécurité au cas où le hook backend silencieusement échoue.
    // Visible étape par étape via toast pour debug.
    let cascadeReport = "";
    if (!asLost && newStage === "won") {
      try {
        const docs = await window.api.commercialDocs.list({ opportunity_id: opp.ref });
        const devisToCascade = (docs || []).filter((d) =>
          d.type === "devis" &&
          d.status !== "transforme" &&
          d.status !== "annule" &&
          d.status !== "refuse"
        );
        let nbCmd = 0, nbBL = 0;
        for (const devis of devisToCascade) {
          try {
            await window.api.commercialDocs.update(devis.id, { status: "accepte" });
            const cmd = await window.api.commercialDocs.transform(devis.id, "commande");
            if (cmd) {
              nbCmd++;
              try {
                await window.api.commercialDocs.update(cmd.id, { status: "accepte" });
                const bl = await window.api.commercialDocs.transform(cmd.id, "bl");
                if (bl) nbBL++;
              } catch (eBL) { console.warn("[client cascade BL]", devis.id, eBL); }
            }
          } catch (eC) { console.warn("[client cascade CMD]", devis.id, eC); }
        }
        if (nbCmd > 0 || nbBL > 0) {
          cascadeReport = " · " + nbCmd + " commande(s) + " + nbBL + " BL générés";
        } else if (devisToCascade.length > 0) {
          cascadeReport = " · cascade partielle (voir console)";
        }
      } catch (e) {
        console.warn("[client cascade]", e);
      }
    }

    if (window.HubToast) window.HubToast.success(asLost ? "✓ Opportunité marquée comme perdue" : "✓ Avancée en " + target.spanco + cascadeReport);
    setTimeout(() => {
      window.location.href = clientId ? "/fiche-client?id=" + encodeURIComponent(clientId) : "/crm";
    }, 1200);
  };

  return (
    <div style={S.frame}>
      {/* HEADER sobre */}
      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#64748b" }}>
          <a href="/" title="Retour Hub Astorya"
             style={{ color: "#64748b", textDecoration: "none" }}
             onMouseEnter={(e) => e.currentTarget.style.color = "#4f46e5"}
             onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}>CRM</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <a href="/crm" title="Ouvrir le pipeline commercial"
             style={{ color: "#64748b", textDecoration: "none" }}
             onMouseEnter={(e) => e.currentTarget.style.color = "#4f46e5"}
             onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}>Pipeline</a>
          <span style={{ color: "#cbd5e1" }}>/</span>
          {clientId ? (
            <a href={"/fiche-client?id=" + encodeURIComponent(clientId)}
               title="Ouvrir la fiche client"
               style={{ fontVariantNumeric: "tabular-nums", fontSize: 11.5, color: "#3730a3", textDecoration: "none", fontWeight: 600 }}
               onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
               onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>{opp.ref}</a>
          ) : (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 11.5, color: "#475569" }}>{opp.ref}</span>
          )}
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Faire avancer</span>
        </div>
        <a href={clientId ? "/fiche-client?id=" + clientId : "/crm"} style={S.closeBtn}>×</a>
      </header>

      <div style={S.titleRow}>
        <div style={{ minWidth: 0 }}>
          <h1 style={S.h1}>{opp.name}</h1>
          <p style={S.subtitle}>
            <a href={clientId ? "/fiche-client?id=" + clientId : "#"} style={{ color: "#3730a3", textDecoration: "none", fontWeight: 500 }}>{opp.client_name || "Client"}</a>
            <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>
            Étape actuelle : <strong style={{ color: current.color }}>{current.spanco}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <a href={clientId ? "/fiche-client?id=" + clientId : "/crm"} style={S.btnGhost}>{curIdx >= stages.length - 1 ? "← Retour" : "Annuler"}</a>
          {clientId && (
            <a href={"/gestion-commerciale?client=" + encodeURIComponent(clientId) + (opp.ref ? "&opp=" + encodeURIComponent(opp.ref) : "")}
               title="Voir les devis et documents commerciaux liés à ce client"
               style={{ ...S.btnGhost, borderColor: "#3b82f6", color: "#1d4ed8", background: "#eff6ff", textDecoration: "none" }}>
              📋 Devis en cours
            </a>
          )}
          <button onClick={async () => {
            try {
              const amtN = parseFloat(String(editAmount || "0").replace(/[^\d.]/g, "")) || 0;
              // Crée un devis pré-rempli avec les données de l'opp
              const devis = await window.api.commercialDocs.create({
                type: "devis",
                status: "brouillon",
                client_id: opp.client_id || null,
                client_name: opp.client_name || null,
                opportunity_id: opp.ref || null,
                title: editName || opp.name || "Devis " + (opp.client_name || ""),
                notes: editBesoin || null,
                internal_notes: editNotes || null,
                owner: opp.owner || null,
                lines: amtN > 0 ? [{
                  // L'article n'est PAS le nom de l'opportunité. On laisse
                  // la désignation vide pour forcer l'utilisateur à saisir
                  // un vrai article (ou ajouter une ligne depuis le catalogue).
                  designation: "",
                  description: editBesoin ? "Issu de l'opportunité « " + (editName || opp.name) + " » — " + editBesoin : null,
                  quantity: 1,
                  unit: "forfait",
                  unit_price_ht: amtN,
                  total_ht: amtN,
                  tva_rate: 20,
                  total_tva: amtN * 0.2,
                  total_ttc: amtN * 1.2,
                  discount_pct: 0,
                }] : [],
              });
              if (window.HubToast) window.HubToast.success("✓ Devis " + devis.id + " créé — ouverture de la gestion commerciale");
              // On stocke l'URL actuelle pour pouvoir y revenir après save du devis
              const returnTo = window.location.pathname + window.location.search;
              setTimeout(() => { window.location.href = "/gestion-commerciale?open=" + encodeURIComponent(devis.id) + "&returnTo=" + encodeURIComponent(returnTo); }, 600);
            } catch (e) {
              if (window.HubToast) window.HubToast.error("Erreur création devis : " + (e.message || e));
            }
          }} style={{ ...S.btnGhost, borderColor: "#f59e0b", color: "#b45309", background: "#fef0e6" }}>📄 Créer un devis</button>
          {/* Picker template email — ouvre la modale puis Outlook Web pré-rempli
              avec le contexte de l'opportunité courante (client + contact + opp). */}
          <button onClick={async () => {
            if (!window.HubEmailTemplatePicker) {
              if (window.HubToast) window.HubToast.warn("Picker indisponible — recharge la page");
              return;
            }
            let recipient = "", contact = null;
            if (clientId && window.api && window.api.contacts) {
              try {
                const conts = await window.api.contacts.list({ client_id: clientId });
                contact = (conts || []).find((c) => c.is_principal) || (conts || [])[0] || null;
                recipient = (contact && contact.email) || "";
              } catch (e) {}
            }
            window.HubEmailTemplatePicker.open({
              to: recipient,
              ctx: {
                client_name: opp.client_name || "",
                raison_sociale: opp.client_name || "",
                contact_prenom: (contact && contact.prenom) || "",
                contact_nom: (contact && contact.nom) || "",
                contact_fonction: (contact && contact.fonction) || "",
                opportunity_name: editName || opp.name || "",
                amount: editAmount ? (Number(editAmount).toLocaleString("fr-FR") + " €") : "",
                owner_name: opp.owner || "",
              },
            });
          }} style={{ ...S.btnGhost, borderColor: "#a855f7", color: "#7e22ce", background: "#f5efff" }}
             title="Envoyer un email avec un template — Outlook Web pré-rempli">
            📧 Email
          </button>
          {/* Enregistrer la fiche sans avancer l'étape — utile pour mettre à jour
              une date concurrent, un montant, une note... sans déclencher de SPANCO */}
          <button onClick={saveOpp} disabled={savingOpp}
                  style={{ ...S.btnGhost, borderColor: "#10b981", color: "#047857", background: "#ecfdf5",
                           cursor: savingOpp ? "wait" : "pointer", opacity: savingOpp ? 0.6 : 1 }}
                  title="Sauvegarder les modifications de la fiche sans changer d'étape SPANCO">
            {savingOpp ? "⏳ Enregistrement…" : "💾 Enregistrer"}
          </button>
          {/* Supprimer définitivement l'opportunité — disponible à tout moment */}
          <button onClick={async () => {
            const ok = window.HubModal
              ? await window.HubModal.confirm({
                  title: "Supprimer définitivement l'opportunité ?",
                  message: "« " + (editName || opp.name || opp.ref) + " » sera supprimée. Action irréversible. Les projets liés seront détachés (pas supprimés).",
                  okLabel: "Supprimer définitivement",
                  okStyle: "danger",
                })
              : confirm("Supprimer définitivement « " + (editName || opp.name || opp.ref) + " » ? Action irréversible.");
            if (!ok) return;
            try {
              await window.api.opportunities.remove(opp.ref);
              if (window.HubToast) window.HubToast.success("✓ Opportunité supprimée");
              window.location.href = clientId ? "/fiche-client?id=" + encodeURIComponent(clientId) : "/crm";
            } catch (e) {
              if (window.HubToast) window.HubToast.error("Erreur : " + (e.message || e));
            }
          }} style={{ ...S.btnGhost, borderColor: "#fecaca", color: "#dc2626", background: "#fef2f2" }}
             title="Supprime définitivement cette opportunité (action irréversible)">
            🗑 Supprimer
          </button>
          {curIdx < stages.length - 1 && targetIdx > curIdx && (
            <button
              onClick={() => confirmAdvance(false)}
              style={target.k === "won"
                ? { ...S.btnPrimary, background: "#10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }
                : S.btnPrimary}
              title={target.k === "won" ? "Passage en Ordre : cascade automatique de tous les devis → Commande → BL + génération commande d'achat" : ""}
            >
              {target.k === "won" ? "⚡ Avancer en Ordre + cascade →" : "✓ Avancer en " + target.spanco + " →"}
            </button>
          )}
        </div>
      </div>

      {/* STEPPER SPANCO — boutons rectangulaires style « workflow Sage »
          (Devis → Commande → BL → Facture). Une pilule colorée par étape,
          flèches → entre les étapes. Cliquable pour repositionner la cible. */}
      <div style={S.spancoStepper}>
        {stages.map((s, i) => {
          const isCurrent = i === curIdx;
          const isPast = i < curIdx;
          const isTarget = i === targetIdx && !isCurrent;
          const clickable = i >= curIdx;
          // Statut affiché dans le badge à droite de chaque pilule
          const statusBadge =
            isPast    ? { label: "VALIDÉ",       bg: "rgba(255,255,255,0.25)", color: "#fff" }
            : isCurrent ? { label: "ACTUELLE",   bg: "rgba(255,255,255,0.25)", color: "#fff" }
            : isTarget  ? { label: "CIBLE",      bg: s.color, color: "#fff" }
            : null;
          // Style de la pilule
          const pillBg =
            isPast || isCurrent ? s.color
            : isTarget          ? "#fff"
            : "#fafbfc";
          const pillBorder =
            isPast || isCurrent ? s.color
            : isTarget          ? s.color
            : "#e2e8f0";
          const pillColor =
            isPast || isCurrent ? "#fff"
            : isTarget          ? s.color
            : "#94a3b8";
          return (
            <React.Fragment key={s.k}>
              <div onClick={(e) => { e.stopPropagation(); if (clickable) setTargetIdx(i); }}
                   style={{
                     ...S.spancoPill,
                     background: pillBg,
                     border: "1.5px solid " + pillBorder,
                     color: pillColor,
                     cursor: clickable ? "pointer" : "default",
                     boxShadow: isCurrent ? "0 2px 8px " + s.color + "55" : isTarget ? "0 0 0 3px " + s.color + "22" : "none",
                     userSelect: "none",
                   }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: isPast || isCurrent ? "rgba(255,255,255,0.2)" : isTarget ? s.color + "22" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  color: isPast || isCurrent ? "#fff" : isTarget ? s.color : "#94a3b8",
                }}>
                  {isPast || isCurrent ? "✓" : s.letter}
                </span>
                <div style={{ flex: 1, lineHeight: 1.15 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.spanco}</div>
                  <div style={{ fontSize: 9.5, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{s.proba} %</div>
                </div>
                {statusBadge && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5,
                    padding: "2px 7px", borderRadius: 4,
                    background: statusBadge.bg, color: statusBadge.color,
                  }}>{statusBadge.label}</span>
                )}
              </div>
              {i < stages.length - 1 && (
                <span style={{ fontSize: 16, color: "#cbd5e1", fontWeight: 700, padding: "0 2px", flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* BODY 2 colonnes */}
      <div style={S.body}>
        {/* MAIN — 3 cards */}
        <div style={S.main}>

          {/* Card 1 : Infos opp éditables */}
          <section style={S.card}>
            <header style={S.cardHead}>
              <h2 style={S.h2}>📋 Informations de l'opportunité</h2>
              <span style={S.badgeEdit}>Modifiable</span>
            </header>

            <div style={S.formGrid}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Nom de l'opportunité</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Montant estimé (€)</label>
                <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ ...S.input, fontVariantNumeric: "tabular-nums" }} />
              </div>
              <div>
                <label style={S.label}>Date de décision potentielle</label>
                <input type="date" value={editDecisionDate} onChange={(e) => setEditDecisionDate(e.target.value)} style={{ ...S.input, fontVariantNumeric: "tabular-nums" }} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>💡 Besoin exprimé</label>
                <textarea value={editBesoin} onChange={(e) => setEditBesoin(e.target.value)} rows="2" style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }} placeholder="Modernisation, contraintes, contexte concurrentiel…" />
              </div>

              <div>
                <label style={S.label}>⚔ Concurrent actuel</label>
                <input value={editConcurrent} onChange={(e) => setEditConcurrent(e.target.value)} style={S.input} placeholder="Salesforce, Pega…" />
              </div>
              <div>
                <label style={S.label}>Montant concurrent (k€/an)</label>
                <input type="number" value={editConcurrentAmount} onChange={(e) => setEditConcurrentAmount(e.target.value)} style={{ ...S.input, fontVariantNumeric: "tabular-nums" }} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>📅 Échéance du contrat actuel (chez le concurrent)</label>
                <input type="date" value={editContractEnd} onChange={(e) => setEditContractEnd(e.target.value)} style={{ ...S.input, fontVariantNumeric: "tabular-nums" }} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>📝 Notes internes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows="2" style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }} placeholder="Contexte additionnel, contacts mutuels, anecdotes…" />
              </div>
            </div>
          </section>

          {/* Card 2 : Critères — masquée quand opp déjà à l'étape finale */}
          {curIdx < stages.length - 1 && (
          <section style={S.card}>
            <header style={S.cardHead}>
              <div>
                <h2 style={S.h2}>✓ Critères pour passer en {target.spanco}</h2>
                <p style={S.h2sub}>Validez les conditions de sortie de l'étape {current.spanco}</p>
              </div>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: pct === 100 ? "#dcfce7" : "#eef2ff", color: pct === 100 ? "#065f46" : "#3730a3", fontWeight: 700 }}>
                {passed}/{totalC}{pct === 100 ? " ✓" : ""}
              </span>
            </header>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {criteria.length === 0 && (
                <div style={{ padding: 18, fontSize: 12.5, color: "#94a3b8", textAlign: "center", background: "#fafbfc", border: "1px dashed #e2e8f0", borderRadius: 8 }}>
                  Pas de critère pour cette transition.
                </div>
              )}
              {criteria.map((c, i) => (
                <label key={i} onClick={() => toggleCriterion(i)}
                       style={{
                         display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                         border: "1px solid " + (c.done ? "#86efac" : "#e2e8f0"),
                         background: c.done ? "#f0fdf4" : "#fff",
                         borderRadius: 8, cursor: "pointer",
                       }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: c.done ? "#10b981" : "#fff", border: c.done ? 0 : "1.5px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, flexShrink: 0 }}>
                    {c.done && "✓"}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: "#0f172a", fontWeight: c.done ? 500 : 600 }}>{c.label}</span>
                </label>
              ))}
            </div>
          </section>
          )}

          {/* Card 3 : Commentaire de passage — masqué à l'étape finale */}
          {curIdx < stages.length - 1 && (
          <section style={S.card}>
            <header style={S.cardHead}>
              <div>
                <h2 style={S.h2}>💬 Commentaire de changement d'étape</h2>
                <p style={S.h2sub}>Visible dans l'historique de l'opportunité</p>
              </div>
            </header>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3"
                      style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }}
                      placeholder="Contexte du passage d'étape, points clés, prochaines actions…" />
          </section>
          )}
        </div>

        {/* SIDEBAR — Panneau Santé / Carte finale selon l'état */}
        <aside style={S.aside}>
          {curIdx >= stages.length - 1 ? (
            <div style={{ ...S.healthCard, background: "linear-gradient(135deg, #065f46, #10b981)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Opportunité finalisée</span>
                <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, letterSpacing: 0.3 }}>● SIGNÉ</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{current.spanco}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 14 }}>L'opportunité a atteint l'étape finale du pipeline. Le contrat est signé et entré en production commerciale.</div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Montant signé</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{aoFmtEUR(amountNum)}</span>
              </div>
            </div>
          ) : (
            <>
              <div style={S.healthCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Santé de l'opportunité</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: healthTone.bg, color: healthTone.color, fontWeight: 700, letterSpacing: 0.3 }}>● {healthTone.label.toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 42, fontWeight: 700, color: "#fff", letterSpacing: -1.2, lineHeight: 1 }}>{healthScore}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>/ 100</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
                  <div style={{ width: healthScore + "%", height: "100%", background: "linear-gradient(90deg, #a78bfa, #10b981)", borderRadius: 999 }} />
                </div>
                <Metric label="Critères validés" value={pct} color="#10b981" />
                <Metric label="Probabilité étape" value={target.proba} color="#a78bfa" />
                <Metric label="Avancement SPANCO" value={Math.round(((targetIdx + 1) / stages.length) * 100)} color="#0ea5e9" />
              </div>

              <div style={S.forecastCard}>
                <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Impact si passage</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 3 }}>Avant</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", textDecoration: "line-through" }}>{aoFmtEUR(ponderedBefore)}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{aoFmtEUR(amountNum)} × {current.proba}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 3 }}>Après</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: target.color }}>{aoFmtEUR(ponderedAfter)}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{aoFmtEUR(amountNum)} × {target.proba}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: "7px 10px", borderRadius: 7, background: gain >= 0 ? "#dcfce7" : "#fee2e2", color: gain >= 0 ? "#065f46" : "#991b1b", fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                  <span>{gain >= 0 ? "↗ Gain pondéré" : "↘ Perte pondérée"}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{gain >= 0 ? "+ " : "– "}{aoFmtEUR(Math.abs(gain))}</span>
                </div>
              </div>
            </>
          )}

          {/* DOCUMENTS COMMERCIAUX LIÉS — devis/commandes/BL/factures sur cette opp */}
          <LinkedDocsCard oppRef={opp.ref} />
        </aside>
      </div>

      {/* BOTTOM bar fixe */}
      <div style={S.bottomBar}>
        {curIdx >= stages.length - 1 ? (
          <>
            <div style={{ flex: 1, fontSize: 13, color: "#0f172a" }}>
              <strong style={{ color: "#065f46" }}>✓ Opportunité en {current.spanco}</strong>
              <span style={{ color: "#64748b", marginLeft: 8 }}>— étape finale du pipeline atteinte.</span>
            </div>
            <a href={clientId ? "/fiche-client?id=" + encodeURIComponent(clientId) : "/crm"} style={{ ...S.btnPrimaryBig, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>← Retour à la fiche client</a>
          </>
        ) : targetIdx <= curIdx ? (
          <>
            <button onClick={async () => {
              const ok = window.HubModal
                ? await window.HubModal.confirm({ title: "Marquer l'opportunité comme perdue ?", message: "L'opp passera à 0% de probabilité et restera dans l'historique.", okLabel: "Marquer perdu", okStyle: "danger" })
                : confirm("Marquer comme perdu ?");
              if (ok) confirmAdvance(true);
            }} style={S.btnLose}>✕ Marquer comme perdu</button>
            <button onClick={saveOpp} disabled={savingOpp}
                    style={{ padding: "12px 22px", background: "#fff", color: "#047857", border: "1.5px solid #10b981",
                             borderRadius: 9, fontSize: 14, fontWeight: 700,
                             cursor: savingOpp ? "wait" : "pointer", opacity: savingOpp ? 0.6 : 1 }}
                    title="Sauvegarder les modifications de la fiche sans changer d'étape">
              {savingOpp ? "⏳ Enregistrement…" : "💾 Enregistrer les modifications"}
            </button>
            <div style={{ fontSize: 12.5, color: "#64748b" }}>Sélectionnez une étape suivante dans le stepper ci-dessus pour faire avancer l'opportunité.</div>
          </>
        ) : (
          <>
            <button onClick={async () => {
              const ok = window.HubModal
                ? await window.HubModal.confirm({ title: "Marquer l'opportunité comme perdue ?", message: "L'opp passera à 0% de probabilité et restera dans l'historique.", okLabel: "Marquer perdu", okStyle: "danger" })
                : confirm("Marquer comme perdu ?");
              if (ok) confirmAdvance(true);
            }} style={S.btnLose}>✕ Marquer comme perdu</button>
            <button onClick={saveOpp} disabled={savingOpp}
                    style={{ padding: "12px 22px", background: "#fff", color: "#047857", border: "1.5px solid #10b981",
                             borderRadius: 9, fontSize: 14, fontWeight: 700,
                             cursor: savingOpp ? "wait" : "pointer", opacity: savingOpp ? 0.6 : 1 }}
                    title="Sauvegarder les modifications de la fiche sans changer d'étape SPANCO">
              {savingOpp ? "⏳ Enregistrement…" : "💾 Enregistrer les modifications"}
            </button>
            <button onClick={() => confirmAdvance(false)} style={S.btnPrimaryBig}>✓ Confirmer le passage en {target.spanco} →</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// LinkedDocsCard — Carte latérale "Documents commerciaux liés"
// Affiche tous les devis/commandes/BL/factures liés à cette opportunité
// avec lien rapide d'ouverture dans /gestion-commerciale?open=
// ─────────────────────────────────────────────────────────────────
const LinkedDocsCard = ({ oppRef }) => {
  const [docs, setDocs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!oppRef || !window.api || !window.api.commercialDocs) { setLoading(false); return; }
    (async () => {
      try {
        const list = await window.api.commercialDocs.list({ opportunity_id: oppRef });
        setDocs(list || []);
      } catch (e) { setDocs([]); }
      setLoading(false);
    })();
  }, [oppRef]);

  const TYPE_META = {
    devis:    { icon: "📄", label: "Devis",    color: "#3b82f6" },
    commande: { icon: "📋", label: "Commande", color: "#a855f7" },
    bl:       { icon: "🚚", label: "BL",       color: "#ea580c" },
    facture:  { icon: "💶", label: "Facture",  color: "#10b981" },
  };
  const STATUS_LABEL = { brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé", transforme: "Transformé", livre: "Livré", paye: "Payé", annule: "Annulé" };

  return (
    <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>📁 Documents liés</span>
        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontWeight: 600 }}>{docs.length}</span>
      </div>
      {loading ? (
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: 8 }}>Chargement…</div>
      ) : docs.length === 0 ? (
        <div style={{ fontSize: 11.5, color: "#94a3b8", textAlign: "center", padding: 12, fontStyle: "italic" }}>
          Aucun document commercial pour cette opportunité.<br/>
          Clique sur <strong style={{ color: "#b45309" }}>📄 Créer un devis</strong> en haut pour en générer un.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {docs.map((d) => {
            const m = TYPE_META[d.type] || { icon: "📎", label: d.type, color: "#64748b" };
            const amt = d.total_ttc ? (Number(d.total_ttc) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" : "—";
            return (
              <a
                key={d.id}
                href={"/gestion-commerciale?open=" + encodeURIComponent(d.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 7,
                  background: m.color + "10", border: "1px solid " + m.color + "40",
                  textDecoration: "none", color: "inherit", cursor: "pointer",
                }}
                title={"Ouvrir " + d.id + " dans la Gestion Commerciale"}
              >
                <span style={{ fontSize: 14 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{d.id}</div>
                  <div style={{ fontSize: 10.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.label} · {STATUS_LABEL[d.status] || d.status} · {amt}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>→</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", flex: 1 }}>{label}</span>
    <div style={{ width: 90, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: value + "%", height: "100%", background: color, borderRadius: 999 }} />
    </div>
    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</span>
  </div>
);

const S = {
  frame: { minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a", paddingBottom: 88 },

  topbar: { padding: "12px 28px", borderBottom: "1px solid #eef1f5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#94a3b8", fontSize: 18, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  titleRow: { padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.6, margin: 0 },
  subtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  btnGhost: { padding: "8px 16px", background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none", cursor: "pointer" },
  btnPrimary: { padding: "9px 18px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px rgba(55,48,163,0.3)" },

  spancoStepper: { display: "flex", alignItems: "center", padding: "20px 28px", background: "#fff", borderBottom: "1px solid #eef1f5", gap: 6, flexWrap: "wrap" },
  spancoPill: { flex: 1, minWidth: 160, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, transition: "all 180ms" },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, padding: "20px 28px" },
  main: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  aside: { display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "start" },

  card: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 18 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  h2: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.2 },
  h2sub: { fontSize: 11.5, color: "#64748b", margin: "3px 0 0" },
  badgeEdit: { fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#a16207", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", boxSizing: "border-box" },

  healthCard: { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)", borderRadius: 12, padding: 18, color: "#fff" },
  forecastCard: { background: "#fff", border: "1px solid #eef1f5", borderRadius: 12, padding: 16 },

  bottomBar: { position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 28px", background: "#fff", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 12px rgba(0,0,0,0.04)", zIndex: 100 },
  btnLose: { padding: "10px 18px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimaryBig: { padding: "12px 24px", background: "#3730a3", color: "#fff", border: 0, borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(55,48,163,0.35)" },
};

window.AdvanceOpportunity = AdvanceOpportunity;
