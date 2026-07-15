// ════════════════════════════════════════════════════════════════════
// crm-test-outreach.js — génération des actions de prospection.
//
// Pour CHAQUE prospect de l'espace prospection : crée une OPPORTUNITÉ liée
// (étape « Prospect ») + une ACTION « envoi de l'email de présentation »
// rattachée à cette opportunité. Le texte de l'email sera fourni plus tard
// (l'action porte meta.template = "presentation_entreprise").
//
// Idempotent : un prospect déjà traité (outreach_generated) est ignoré.
// N'agit qu'en mode prospection (window.HubTestMode) → espace isolé.
// window.CRMTestGenerateOutreach(onProgress) → { done, created, skipped }.
// ════════════════════════════════════════════════════════════════════
(function () {
  window.CRMTestGenerateOutreach = async function (onProgress) {
    if (!window.api || !window.api.clients || !window.api.opportunities || !window.api.actions) return { done: 0, created: 0, skipped: 0 };
    const list = await window.api.clients.list({ active: true });
    const prospects = (list || []).filter((c) => (c.status || "prospect") !== "client");
    let done = 0, created = 0, skipped = 0;
    const total = prospects.length;
    if (onProgress) onProgress({ done: 0, total: total, name: "" });
    for (const c of prospects) {
      if (c.outreach_generated) { skipped++; done++; if (onProgress) onProgress({ done: done, total: total, name: c.raison_sociale || c.name || "" }); continue; }
      try {
        const name = c.raison_sociale || c.name || "Prospect";
        const opp = await window.api.opportunities.create({
          client_id: c.id, client_name: name,
          name: "Prospection — " + name,
          stage: "qualif", proba: 20, amount: 0,
          type: "prospection", produit: "Email de présentation", source: "Prospection",
        });
        const action = await window.api.actions.create({
          client_id: c.id, opp_id: opp && opp.id ? opp.id : null,
          type: "email", title: "Envoyer l'email de présentation Astorya",
          due: "À programmer", status: "todo",
          tag: "Emailing", tagColor: "#7c3aed",
          // meta = sous-titre (chaîne) ; le modèle est stocké à part.
          meta: "Email de présentation",
          template: "presentation_entreprise",
        });
        await window.api.clients.update(c.id, {
          outreach_generated: true,
          outreach_opp_id: opp && opp.id ? opp.id : null,
          outreach_action_id: action && action.id ? action.id : null,
        });
        created++;
      } catch (e) { console.warn("[outreach]", c.id, e); }
      done++;
      if (onProgress) onProgress({ done: done, total: total, name: c.raison_sociale || c.name || "" });
    }
    return { done: done, created: created, skipped: skipped };
  };
})();
