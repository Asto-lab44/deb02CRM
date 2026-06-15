// ════════════════════════════════════════════════════════════════════
// hub-ai.js — Assistant IA Claude (proxy Edge Function Supabase)
// ════════════════════════════════════════════════════════════════════
//
// Appelle l'Edge Function /functions/v1/ai-mail qui injecte la clé
// API Anthropic depuis les secrets Supabase. Aucune clé n'est exposée
// côté navigateur — tous les appels passent par le proxy authentifié.
//
// Déploiement de l'Edge Function (une seule fois) :
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
//   supabase functions deploy ai-mail
//
// Usage :
//   const mail = await window.HubAI.generateSalesMail({
//     client_name, contact_name, contact_title,
//     docs: [{ id, type, title, total_ttc }],
//     custom_notes,
//   });
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  function supaClient() {
    return window.HubSupabase && window.HubSupabase.enabled
      ? window.HubSupabase.client
      : null;
  }

  /** Appel bas niveau via Edge Function (auth JWT injecté automatiquement). */
  async function callClaudeViaEdge({ system, user, max_tokens = 1500, temperature = 0.7, model }) {
    const s = supaClient();
    if (!s) throw new Error("Supabase non configuré");

    // Récupère le JWT pour l'auth de l'Edge Function
    const { data: sessionData } = await s.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Vous devez être connecté pour utiliser l'assistant IA");

    const { data, error } = await s.functions.invoke("ai-mail", {
      body: { system, user, max_tokens, temperature, model },
    });

    if (error) {
      // Détection d'erreur configuration côté serveur
      const msg = error.message || String(error);
      if (/not configured|non configurée|Missing/i.test(msg)) {
        throw new Error("Assistant IA non configuré côté serveur. L'administrateur doit définir le secret ANTHROPIC_API_KEY dans Supabase.");
      }
      throw new Error(msg);
    }
    if (data && data.error) throw new Error(data.error);
    if (!data || typeof data.text !== "string") throw new Error("Réponse IA invalide");
    return data.text;
  }

  /** Génère un mail commercial de récap structuré.
   *  context : { client_name, contact_name, contact_title?, docs[], custom_notes? } */
  async function generateSalesMail(context) {
    const docsList = (context.docs || []).map((d) => {
      const typeLbl = { devis: "Devis", commande: "Bon de commande", bl: "Bon de livraison", facture: "Facture" }[d.type] || d.type;
      const amount = d.total_ttc
        ? " — " + Number(d.total_ttc).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € TTC"
        : "";
      return "- " + d.id + " : " + (d.title || typeLbl) + amount;
    }).join("\n");

    const titre = (context.contact_title || "").toLowerCase();
    const civilité = titre.includes("madame") || titre.includes("mme") ? "Madame"
      : titre.includes("monsieur") || titre.includes("mr") || titre.includes("m.") ? "Monsieur"
      : "Madame, Monsieur";
    const dernier_nom = (context.contact_name || "").split(" ").slice(-1)[0] || "";

    const system =
      "Tu es Romain Daviaud, directeur commercial chez Astorya SGI (Nantes), expert en infrastructure IT, " +
      "cybersécurité, téléphonie d'entreprise et solutions cloud. Tu rédiges des mails commerciaux courts, " +
      "professionnels, structurés, sans flatterie excessive, avec une proposition d'appel téléphonique en " +
      "clôture. Tu utilises 'vous' et restes formel. Tu valorises les bénéfices concrets (économies, " +
      "conformité RGPD, productivité, sécurité) sans jargon marketing. Tu signes 'Romain Daviaud · " +
      "Astorya · 02 85 52 13 95'.";

    const user = `Rédige le mail de récapitulatif commercial pour le client ci-dessous.

CLIENT : ${context.client_name || "—"}
CONTACT : ${civilité} ${dernier_nom}${context.contact_title ? " (" + context.contact_title + ")" : ""}

DOCUMENTS ANNEXÉS :
${docsList || "(aucun)"}

CONTEXTE LIBRE ÉVENTUEL :
${context.custom_notes || "(aucun)"}

STRUCTURE ATTENDUE :
1. Salutation personnalisée (${civilité} ${dernier_nom})
2. Phrase d'intro : "Suite à vos différentes demandes vous pouvez trouver ci-joint."
3. La liste des devis/documents avec une courte explication PERSUASIVE pour chacun (1 ligne) — pas juste la référence. Mets en valeur les BÉNÉFICES (économies, sécurité, productivité, mobilité, etc.) selon le titre du doc.
4. Si plusieurs devis : ajoute un paragraphe sur le récap financier comparatif (coûts actuels vs offre Astorya) — proposer un tableau si pertinent.
5. Phrase de clôture proposant un appel téléphonique pour expliquer en détail.
6. Signature de Romain.

CONTRAINTES :
- Pas plus de 250 mots au total.
- Ton professionnel mais chaleureux.
- Pas de bullet-points markdown (## ou **), juste des tirets pour la liste.
- Pas d'objet de mail (juste le corps).
- Optimise les arguments commerciaux : pour chaque doc, identifie le bénéfice client principal et formule-le en 1 phrase courte.

Rédige UNIQUEMENT le corps du mail, sans préambule ni explication.`;

    return callClaudeViaEdge({ system, user, max_tokens: 1200, temperature: 0.7 });
  }

  /** Optimisation d'un texte mail existant (réécriture). */
  async function optimizeMail({ current_body, instructions }) {
    const system =
      "Tu es Romain Daviaud, directeur commercial Astorya SGI. Tu améliores des mails commerciaux " +
      "pour les rendre plus persuasifs, structurés et orientés bénéfices client, sans devenir verbeux.";
    const user =
      "Voici un mail commercial à optimiser :\n\n```\n" + current_body + "\n```\n\n" +
      "INSTRUCTIONS : " + (instructions || "Améliore la structure et les arguments commerciaux. Garde le ton professionnel et formel. Max 250 mots.") +
      "\n\nRéponds UNIQUEMENT avec le mail réécrit, sans préambule.";
    return callClaudeViaEdge({ system, user, max_tokens: 1200, temperature: 0.7 });
  }

  /** Génère l'objet du mail à partir des docs. */
  function generateSubject(context) {
    const docs = context.docs || [];
    const types = [...new Set(docs.map((d) => d.type))];
    const ids = docs.map((d) => d.id).join(", ");
    if (types.length === 1 && docs.length === 1) {
      const t = { devis: "Devis", commande: "Bon de commande", bl: "Bon de livraison", facture: "Facture" }[types[0]] || types[0];
      return t + " " + ids + (docs[0].title ? " — " + docs[0].title : "");
    }
    return "Récapitulatif de nos propositions — " + docs.length + " documents (" + ids + ")";
  }

  /** Vérifie que l'Edge Function est joignable. */
  async function ping() {
    try {
      await callClaudeViaEdge({
        user: "Réponds juste 'OK'.",
        max_tokens: 10,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  window.HubAI = {
    generateSalesMail,
    optimizeMail,
    generateSubject,
    ping,
    // Compat ancienne API (no-op : on n'utilise plus localStorage)
    setApiKey: () => {},
    getApiKey: () => null,
    hasApiKey: () => true, // toujours dispo si Edge déployée
    clearKey: () => {},
  };
})();
