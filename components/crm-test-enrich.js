// ════════════════════════════════════════════════════════════════════
// crm-test-enrich.js — enrichissement des clients du CRM test.
//
// Les clients importés de l'Excel n'ont que nom + CA + abonnements. Ici on
// complète chaque fiche (SIREN, SIRET, adresse, code NAF, forme juridique,
// TVA intracom, effectif…) en deux temps :
//   1) résolution du nom → entreprise via l'annuaire ouvert
//      recherche-entreprises.api.gouv.fr (gratuit, sans quota) ;
//   2) enrichissement légal via Pappers (window.HubPappers.checkSiren) :
//      procédures collectives, dirigeants — mis en cache 7 j côté proxy.
//
// N'agit qu'en mode test : lit/écrit l'espace isolé
// hubAstorya.test.prospects.v1. Idempotent : ne retraite pas un client qui a
// déjà un SIREN. window.CRMTestEnrich(onProgress) → { done, enriched, failed }.
// ════════════════════════════════════════════════════════════════════
(function () {
  var KEY = "hubAstorya.test.prospects.v1";
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {} }

  function formatSiren(s) { s = String(s || "").replace(/\D/g, ""); return s.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"); }
  function formatSiret(s) { s = String(s || "").replace(/\D/g, ""); return s.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4"); }
  // Clé TVA intracom française : (12 + 3 * (SIREN mod 97)) mod 97.
  function computeTva(siren) {
    var n = parseInt(String(siren || "").replace(/\D/g, ""), 10);
    if (!n) return "";
    var key = (12 + 3 * (n % 97)) % 97;
    return "FR" + String(key).padStart(2, "0") + " " + formatSiren(siren);
  }

  // Résolution nom → entreprise (annuaire ouvert INSEE/INPI).
  async function resolveByName(name) {
    var url = "https://recherche-entreprises.api.gouv.fr/search?q=" + encodeURIComponent(name) + "&page=1&per_page=1";
    var r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    var j = await r.json();
    var e = (j.results || [])[0];
    if (!e) return null;
    var siege = e.siege || {};
    var siren = e.siren || "";
    var addr = siege.geo_adresse
      || [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ")
      || siege.adresse || "";
    var street = addr;
    if (siege.code_postal) street = street.replace(siege.code_postal, "").trim();
    if (siege.libelle_commune) street = street.replace(new RegExp(siege.libelle_commune, "i"), "").trim();
    street = street.replace(/[\s,]+$/, "");
    return {
      matched_name: e.nom_complet || e.nom_raison_sociale || name,
      siren: formatSiren(siren),
      siret: formatSiret(siege.siret || ""),
      naf: e.activite_principale || siege.activite_principale || "",
      secteur: e.libelle_activite_principale || siege.libelle_activite_principale || "",
      adresse: street,
      ville: siege.libelle_commune || "",
      code_postal: siege.code_postal || "",
      tva: computeTva(siren),
      forme_juridique: e.nature_juridique || "",
      tranche_effectif: e.tranche_effectif_salarie || "",
      date_creation: e.date_creation || "",
      etat_administratif: e.etat_administratif || "",
    };
  }

  window.CRMTestEnrich = async function (onProgress) {
    var arr = load();
    var todo = arr.filter(function (c) { return !c.siren && !c.pappers_enriched; });
    var total = todo.length, done = 0, enriched = 0, failed = 0;
    if (onProgress) onProgress({ done: 0, total: total, name: "" });
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (c.siren || c.pappers_enriched) continue;
      try {
        var info = await resolveByName(c.raison_sociale || c.name || "");
        if (info) {
          Object.keys(info).forEach(function (k) { if (info[k]) c[k] = info[k]; });
          // Étape 2 : Pappers (données légales) si SIREN trouvé.
          if (c.siren && window.HubPappers && window.HubPappers.checkSiren) {
            try {
              var p = await window.HubPappers.checkSiren(c.siren);
              if (p && p.status !== "error") {
                c.pappers = {
                  status: p.status, denomination: p.denomination || null,
                  procedures: p.procedures || p.procedures_collectives || null,
                  dirigeants: p.dirigeants || null, effectif: p.effectif || null,
                  checked_at: p.checked_at || null, source: p.source || "pappers",
                };
              }
            } catch (e) { /* Pappers optionnel — on garde l'enrichissement gouv */ }
          }
          c.pappers_enriched = true;
          enriched++;
        } else { failed++; }
      } catch (e) { failed++; }
      done++;
      if (done % 5 === 0) save(arr); // sauvegarde progressive (résumable)
      if (onProgress) onProgress({ done: done, total: total, name: c.raison_sociale || c.name || "" });
      await sleep(250); // politesse vis-à-vis des API
    }
    save(arr);
    return { done: done, enriched: enriched, failed: failed };
  };
})();
