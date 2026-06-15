// ════════════════════════════════════════════════════════════════════
// hub-ai.js — Assistant IA Claude pour rédiger des mails commerciaux
// ════════════════════════════════════════════════════════════════════
//
// Appelle l'API Anthropic (claude-haiku-4-5 par défaut, modèle rapide
// et économique) pour générer un mail de récap commercial.
//
// Sécurité : la clé API est stockée en localStorage côté navigateur
// (acceptable pour usage interne). Pour la prod multi-tenant, à
// déplacer dans une Edge Function Supabase qui injecte la clé en secret.
//
// Usage :
//   const mail = await window.HubAI.generateSalesMail({
//     client_name, contact_name, contact_title,
//     docs: [{ id, type, title, total_ttc, lines }],
//     custom_notes,
//   });
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const KEY_STORAGE = "hubAstorya.anthropic_api_key";
  const MODEL = "claude-haiku-4-5";   // rapide, économique, suffisant
  const API_URL = "https://api.anthropic.com/v1/messages";
  const API_VERSION = "2023-06-01";

  function getApiKey() {
    try { return localStorage.getItem(KEY_STORAGE) || null; }
    catch (e) { return null; }
  }

  function setApiKey(key) {
    try {
      if (!key) localStorage.removeItem(KEY_STORAGE);
      else localStorage.setItem(KEY_STORAGE, key);
    } catch (e) {}
  }

  async function askKeyIfMissing() {
    let key = getApiKey();
    if (key) return key;
    if (window.HubModal && window.HubModal.prompt) {
      key = await window.HubModal.prompt({
        title: "🤖 Clé API Anthropic",
        label: "Clé API (sk-ant-…)",
        placeholder: "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        okLabel: "Enregistrer",
        message: "La clé est stockée localement dans ton navigateur. Crée-en une sur https://console.anthropic.com/settings/keys (≃ 3 € pour 1000 mails générés).",
      });
    } else {
      key = prompt("Clé API Anthropic (sk-ant-…) — stockée localement :");
    }
    if (key && key.startsWith("sk-")) { setApiKey(key); return key; }
    return null;
  }

  /** Appel bas niveau vers /v1/messages. */
  async function callClaude({ system, user, max_tokens = 1500, temperature = 0.7 }) {
    const apiKey = await askKeyIfMissing();
    if (!apiKey) throw new Error("Clé API manquante");
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = (j.error && j.error.message) || JSON.stringify(j); }
      catch (e) { detail = res.statusText; }
      if (res.status === 401) {
        setApiKey(null);
        throw new Error("Clé API invalide ou expirée. Réessaie pour entrer une nouvelle clé.");
      }
      throw new Error("Anthropic API: " + detail);
    }
    const data = await res.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    return text;
  }

  /** Génère un mail commercial de récap structuré.
   *  context : { client_name, contact_name, contact_title?, docs[], custom_notes? }
   *  docs : [{ id, type, title, total_ttc, status }]
   *  Retourne un string mail prêt à coller dans un client mail. */
  async function generateSalesMail(context) {
    const docsList = (context.docs || []).map((d) => {
      const typeLbl = { devis: "Devis", commande: "Bon de commande", bl: "Bon de livraison", facture: "Facture" }[d.type] || d.type;
      const amount = d.total_ttc ? " — " + Number(d.total_ttc).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € TTC" : "";
      return "- " + d.id + " : " + (d.title || typeLbl) + amount;
    }).join("\n");

    const civilité = (context.contact_title || "").toLowerCase().includes("madame") ? "Madame"
      : (context.contact_title || "").toLowerCase().includes("monsieur") ? "Monsieur"
      : "Madame, Monsieur";
    const dernier_nom = (context.contact_name || "").split(" ").slice(-1)[0] || "";

    const system = "Tu es Romain Daviaud, directeur commercial chez Astorya SGI (Nantes), expert en infrastructure IT, cybersécurité et téléphonie d'entreprise. Tu rédiges des mails commerciaux courts, professionnels, structurés, sans flatterie excessive, avec une proposition d'appel téléphonique en clôture. Tu utilises 'vous' et restes formel. Tu valorises les bénéfices concrets (économies, conformité, productivité) sans jargon marketing. Tu signes 'Romain Daviaud · Astorya · 02 85 52 13 95'.";

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

    return callClaude({ system, user, max_tokens: 1200, temperature: 0.7 });
  }

  /** Génère un objet de mail à partir de la liste de docs. */
  async function generateSubject(context) {
    const types = [...new Set((context.docs || []).map((d) => d.type))];
    const ids = (context.docs || []).map((d) => d.id).join(", ");
    if (types.length === 1 && (context.docs || []).length === 1) {
      const t = { devis: "Devis", commande: "Bon de commande", bl: "Bon de livraison", facture: "Facture" }[types[0]] || types[0];
      return t + " " + ids + (context.docs[0].title ? " — " + context.docs[0].title : "");
    }
    return "Récapitulatif de nos propositions — " + (context.docs || []).length + " documents (" + ids + ")";
  }

  /** Optimisation d'un texte mail existant (réécriture). */
  async function optimizeMail({ current_body, instructions }) {
    return callClaude({
      system: "Tu es Romain Daviaud, directeur commercial Astorya SGI. Tu améliores des mails commerciaux pour les rendre plus persuasifs, structurés et orientés bénéfices client, sans devenir verbeux.",
      user: "Voici un mail commercial à optimiser :\n\n```\n" + current_body + "\n```\n\nINSTRUCTIONS : " + (instructions || "Améliore la structure et les arguments commerciaux. Garde le ton professionnel et formel. Max 250 mots.") + "\n\nRéponds UNIQUEMENT avec le mail réécrit, sans préambule.",
      max_tokens: 1200,
      temperature: 0.7,
    });
  }

  window.HubAI = {
    generateSalesMail,
    generateSubject,
    optimizeMail,
    setApiKey,
    getApiKey,
    hasApiKey: () => !!getApiKey(),
    clearKey: () => setApiKey(null),
  };
})();
