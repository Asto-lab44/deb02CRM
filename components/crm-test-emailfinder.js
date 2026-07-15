// ════════════════════════════════════════════════════════════════════
// crm-test-emailfinder.js — recherche automatique des emails des prospects.
//
// Pour chaque prospect (sans email), appelle la fonction serveur
// /api/find-email qui : trouve le site, lit les mentions légales, VÉRIFIE le
// SIRET, et renvoie l'email. On stocke l'email trouvé sur la fiche (espace
// prospection isolé). Idempotent : un prospect qui a déjà un email est ignoré.
//
// window.CRMTestFindEmails(onProgress) → { done, found, verified, failed }.
// ════════════════════════════════════════════════════════════════════
(function () {
  async function jwt() {
    try {
      const c = window.HubSupabase && window.HubSupabase.client;
      if (!c) return null;
      const s = await c.auth.getSession();
      return (s && s.data && s.data.session && s.data.session.access_token) || null;
    } catch (e) { return null; }
  }

  window.CRMTestFindEmails = async function (onProgress, opts) {
    opts = opts || {};
    if (!window.api || !window.api.clients) return { done: 0, found: 0, verified: 0, failed: 0 };
    const token = await jwt();
    if (!token) throw new Error("Connexion Supabase requise (la recherche passe par le serveur).");

    const all = await window.api.clients.list({ active: true });
    const prospects = (all || []).filter((c) => (c.status || "prospect") !== "client");
    let todo = prospects.filter((c) => !c.email && (c.siret || c.siren));
    // Mode test : ne traite que les N premiers (par CA décroissant pour tester
    // sur des prospects représentatifs).
    if (opts.limit) todo = todo.slice().sort((a, b) => (Number(b.ca_2324) || 0) - (Number(a.ca_2324) || 0)).slice(0, opts.limit);
    const eligibleWithSite = todo.filter((c) => c.web || c.site_web).length;
    let done = 0, found = 0, verified = 0, notFound = 0, failed = 0;
    const details = [];
    const total = todo.length;
    // Diagnostic : prospects sans SIREN/SIRET (non éligibles) et sans site.
    const noSiret = prospects.filter((c) => !c.email && !(c.siret || c.siren)).length;
    if (!total) {
      return { done: 0, found: 0, verified: 0, notFound: 0, failed: 0, total: 0, noSiret: noSiret, eligibleWithSite: 0, empty: true };
    }
    if (onProgress) onProgress({ done: 0, total: total, name: "" });

    for (const c of todo) {
      const name = c.raison_sociale || c.name || "";
      try {
        const r = await fetch("/api/find-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ siret: c.siret || "", siren: c.siren || "", website: c.web || c.site_web || "", name: name }),
        });
        if (r.status === 404) throw new Error("Fonction /api/find-email non déployée sur Vercel (attends le déploiement).");
        if (r.status === 401) throw new Error("Session expirée — reconnecte-toi puis relance.");
        const j = await r.json();
        // On enregistre le site web capturé même si aucun email n'est trouvé.
        const patch = {};
        if (j && j.website && !(c.web || c.site_web)) { patch.web = j.website; patch.site_web = j.website; }
        if (j && j.email) {
          patch.email = j.email;
          patch.email_source = j.source_url || j.website || null;
          patch.email_verified = !!j.siret_verified;
          patch.contact_principal = Object.assign({}, c.contact_principal || {}, { email: j.email });
        }
        if (Object.keys(patch).length) await window.api.clients.update(c.id, patch);
        if (j && j.email) { found++; if (j.siret_verified) verified++; } else { notFound++; }
        details.push({ name: name, status: (j && j.status) || "?", email: (j && j.email) || null, website: (j && j.website) || null, steps: (j && j.debug && j.debug.steps) || [] });
        try { console.info("[find-email]", name, "→", (j && j.status), (j && j.email) || "", (j && j.website) || "", (j && j.debug && j.debug.steps) || []); } catch (e) {}
      } catch (e) {
        failed++;
        if (/non déployée|Session expirée/.test(e.message || "")) { throw e; } // stop net
      }
      done++;
      if (onProgress) onProgress({ done: done, total: total, name: name });
      await new Promise((res) => setTimeout(res, 400)); // politesse (le serveur fait plusieurs requêtes)
    }
    return { done: done, found: found, verified: verified, notFound: notFound, failed: failed, total: total, noSiret: noSiret, eligibleWithSite: eligibleWithSite, details: details };
  };
})();
