// ════════════════════════════════════════════════════════════════════
// crm-hosting-seed.js — ajoute les prospects « hébergement site internet »
// (window.CRMHostingData) à l'espace prospection, une seule fois.
//
// N'agit qu'en mode prospection (window.HubTestMode) → espace isolé
// hubAstorya.test.prospects.v1. Idempotent : rapprochement par nom OU site
// web normalisé ; un prospect déjà présent n'est pas dupliqué.
// window.CRMHostingImport(force) pour (ré)importer manuellement.
// ════════════════════════════════════════════════════════════════════
(function () {
  var KEY = "hubAstorya.test.prospects.v1";
  var normName = function (s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); };
  var normSite = function (s) { return String(s || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""); };

  window.CRMHostingImport = function (force) {
    var data = window.CRMHostingData || [];
    if (!data.length) return 0;
    var arr; try { arr = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { arr = []; }
    var byName = {}, bySite = {};
    arr.forEach(function (c) { byName[normName(c.raison_sociale || c.name)] = true; if (c.web || c.site_web) bySite[normSite(c.web || c.site_web)] = true; });
    var added = 0;
    data.forEach(function (r) {
      if (!force && (byName[normName(r.name)] || (r.site_web && bySite[normSite(r.site_web)]))) return;
      arr.push(Object.assign({ active: true }, r));
      added++;
    });
    if (added) { localStorage.setItem(KEY, JSON.stringify(arr)); console.info("[hébergement] " + added + " prospects ajoutés."); }
    return added;
  };

  // Import automatique à l'entrée en prospection.
  if (window.HubTestMode) { try { window.CRMHostingImport(false); } catch (e) {} }
})();
