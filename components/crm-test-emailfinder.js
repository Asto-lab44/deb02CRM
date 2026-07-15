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
    // On traite tout prospect à qui il manque l'email OU la fiche Pappers.
    let todo = prospects.filter((c) => (!c.email || !c.pappers) && (c.siret || c.siren));
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
    const pending = [];

    // Traite un prospect. Retourne "pending" si Dropcontact n'a pas fini à temps.
    async function processOne(c) {
      const name = c.raison_sociale || c.name || "";
      // Garde-fou : si la fonction ne répond pas en 25s, on abandonne cet appel
      // (évite de figer tout le batch sur une requête bloquée).
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      let r;
      try {
        r = await fetch("/api/find-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ siret: c.siret || "", siren: c.siren || "", website: c.web || c.site_web || "", name: name }),
          signal: ctrl.signal,
        });
      } catch (e) { clearTimeout(to); throw new Error(e.name === "AbortError" ? "timeout (>25s)" : (e.message || "réseau")); }
      clearTimeout(to);
      if (r.status === 404) throw new Error("Fonction /api/find-email non déployée sur Vercel (attends le déploiement).");
      const j = await r.json();
      // 401/500 renvoient { error } sans champ status : on le remonte lisiblement.
      if (!j.status && (j.error || j.message)) { j.status = "HTTP " + r.status; j.debug = { steps: [j.error || j.message] }; }
      const patch = {};
      if (j && j.website && !(c.web || c.site_web)) { patch.web = j.website; patch.site_web = j.website; }
      // Fiche Pappers complète → stockée sur le prospect + champs utiles remontés.
      if (j && j.pappers) {
        const p = j.pappers;
        patch.pappers = p;
        if (p.site_web && !patch.web) { patch.web = p.site_web; patch.site_web = p.site_web; }
        if (p.telephone && !c.tel) patch.tel = p.telephone;
        if (p.forme_juridique && !c.forme_juridique) patch.forme_juridique = p.forme_juridique;
        if (p.tva_intracom && !c.tva) patch.tva = p.tva_intracom;
        if (p.libelle_naf && !c.secteur) patch.secteur = p.libelle_naf;
        if (p.email && !j.email && !c.email) { patch.email = p.email; patch.contact_principal = Object.assign({}, c.contact_principal || {}, { email: p.email }); }
      }
      if (j && j.email) {
        patch.email = j.email;
        patch.email_source = j.source_url || j.website || null;
        patch.email_verified = !!j.siret_verified;
        patch.contact_principal = Object.assign({}, c.contact_principal || {}, { email: j.email });
      }
      if (Object.keys(patch).length) await window.api.clients.update(c.id, patch);
      try { console.info("[find-email]", name, "→", (j && j.status), (j && j.email) || "", (j && j.website) || "", (j && j.debug && j.debug.steps) || []); } catch (e) {}
      return j || { status: "error" };
    }

    for (const c of todo) {
      const name = c.raison_sociale || c.name || "";
      try {
        const j = await processOne(c);
        if (j.email) { found++; if (j.siret_verified) verified++; }
        else if (j.status === "pending") { pending.push(c); }
        else { notFound++; }
        details.push({ name: name, status: j.status || "?", email: j.email || null, website: j.website || null, steps: (j.debug && j.debug.steps) || [] });
      } catch (e) {
        failed++;
        details.push({ name: name, status: "ERREUR", email: null, website: null, steps: [String(e.message || e)] });
        if (/non déployée|Session expirée/.test(e.message || "")) { throw e; }
      }
      done++;
      if (onProgress) onProgress({ done: done, total: total, name: name });
      await new Promise((res) => setTimeout(res, 400));
    }

    // Relance auto des « pending » : Dropcontact a fini de calculer entre-temps.
    if (pending.length) {
      if (onProgress) onProgress({ done: done, total: total, phase: "Attente Dropcontact " + pending.length + "…" });
      await new Promise((res) => setTimeout(res, 12000));
      let k = 0;
      for (const c of pending) {
        k++;
        if (onProgress) onProgress({ done: done, total: total, phase: "Relance " + k + "/" + pending.length });
        try {
          const j = await processOne(c);
          const d = details.find((x) => x.name === (c.raison_sociale || c.name));
          if (j.email) { found++; if (j.siret_verified) verified++; if (d) { d.status = j.status; d.email = j.email; d.website = j.website; } }
          else { notFound++; if (d) d.status = j.status; }
        } catch (e) { failed++; }
        await new Promise((res) => setTimeout(res, 400));
      }
    }
    return { done: done, found: found, verified: verified, notFound: notFound, failed: failed, total: total, noSiret: noSiret, eligibleWithSite: eligibleWithSite, details: details };
  };
})();
