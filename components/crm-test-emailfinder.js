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

  window.CRMTestFindEmails = async function (onProgress) {
    if (!window.api || !window.api.clients) return { done: 0, found: 0, verified: 0, failed: 0 };
    const token = await jwt();
    if (!token) throw new Error("Connexion Supabase requise (la recherche passe par le serveur).");

    const all = await window.api.clients.list({ active: true });
    const prospects = (all || []).filter((c) => (c.status || "prospect") !== "client");
    const todo = prospects.filter((c) => !c.email && (c.siret || c.siren));
    const eligibleWithSite = todo.filter((c) => c.web || c.site_web).length;
    let done = 0, found = 0, verified = 0, notFound = 0, failed = 0;
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
        if (j && j.email) {
          await window.api.clients.update(c.id, {
            email: j.email,
            email_source: j.source_url || null,
            email_verified: !!j.siret_verified,
            contact_principal: Object.assign({}, c.contact_principal || {}, { email: j.email }),
          });
          found++;
          if (j.siret_verified) verified++;
        } else { notFound++; }
      } catch (e) {
        failed++;
        if (/non déployée|Session expirée/.test(e.message || "")) { throw e; } // stop net
      }
      done++;
      if (onProgress) onProgress({ done: done, total: total, name: name });
      await new Promise((res) => setTimeout(res, 400)); // politesse (le serveur fait plusieurs requêtes)
    }
    return { done: done, found: found, verified: verified, notFound: notFound, failed: failed, total: total, noSiret: noSiret, eligibleWithSite: eligibleWithSite };
  };
})();
