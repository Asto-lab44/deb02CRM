// ════════════════════════════════════════════════════════════════════
// test-mode.js — « CRM test » / bac à sable à données isolées.
//
// Objectif : offrir un CRM (et les pages liées : fiche client, opportunités…)
// totalement séparé de la production, sans toucher au schéma Supabase.
//
// Principe : quand le mode test est actif, api.js
//   1) coupe Supabase (supa() → null) → tout passe par localStorage ;
//   2) préfixe les clés localStorage par « test. » (lsKey) → espace de noms
//      distinct. La prod (hubAstorya.clients.v1) et le test
//      (hubAstorya.test.clients.v1) ne se voient jamais.
//
// Activation (dans l'onglet courant) :
//   • URL ?test=1  → active + mémorise (sessionStorage) pour la navigation ;
//   • URL ?test=0  → désactive et purge le drapeau ;
//   • page d'accueil sans paramètre → repasse en prod (l'accueil = prod).
// Un bandeau rouge permanent rappelle qu'on est en test, avec un lien Quitter.
//
// IMPORTANT : ce fichier DOIT être chargé AVANT api.js sur chaque page.
// ════════════════════════════════════════════════════════════════════
(function () {
  try {
    var q = window.location.search || "";
    var path = window.location.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
    var isHome = path === "/" || path === "/index" || path === "/accueil-simple";
    var on = /[?&]test=1/.test(q);
    var off = /[?&]test=0/.test(q);

    if (off) {
      sessionStorage.removeItem("hubTestMode");
    } else if (on) {
      sessionStorage.setItem("hubTestMode", "1");
    } else if (isHome) {
      // L'accueil sans paramètre = retour à la production par défaut.
      sessionStorage.removeItem("hubTestMode");
    }
    window.HubTestMode = sessionStorage.getItem("hubTestMode") === "1";
  } catch (e) {
    window.HubTestMode = false;
  }

  if (!window.HubTestMode) return;

  // Espace prospection : TOUT compte est un prospect. On repasse
  // systématiquement les « client » en « prospect » dans l'espace isolé,
  // sur toutes les pages (CRM, fiche client, listes…).
  try {
    var PKEY = "hubAstorya.test.prospects.v1";
    var parr = JSON.parse(localStorage.getItem(PKEY) || "[]");
    var pchg = 0;
    parr.forEach(function (c) { if (c && c.status === "client") { c.status = "prospect"; pchg++; } });
    if (pchg) localStorage.setItem(PKEY, JSON.stringify(parr));
  } catch (e) {}

  // Bandeau permanent « MODE TEST ».
  function mountBanner() {
    if (document.getElementById("hub-test-banner")) return;
    var bar = document.createElement("div");
    bar.id = "hub-test-banner";
    bar.style.cssText = [
      "position:fixed", "top:0", "left:0", "right:0", "z-index:99999",
      "background:#7c3aed", "color:#fff", "font:600 12.5px/1 'Inter',system-ui,sans-serif",
      "padding:7px 14px", "display:flex", "align-items:center", "justify-content:center",
      "gap:14px", "box-shadow:0 1px 6px rgba(0,0,0,.25)",
    ].join(";");
    var sep = (window.location.search ? "&" : "?");
    var exitHref = window.location.pathname + window.location.search + sep + "test=0";
    var pill = "color:#fff;background:rgba(255,255,255,.18);padding:3px 10px;border-radius:999px;text-decoration:none;font-weight:700;cursor:pointer;border:0;font:inherit;";
    bar.innerHTML =
      "<span>🧭 CRM PROSPECTION — données séparées du CRM principal (aucune écriture sur les comptes réels)</span>";
    // Bouton de (ré)import des clients — présent seulement là où le jeu de
    // données est chargé (page CRM).
    if (window.CRMTestData && window.CRMTestData.clients) {
      var n = window.CRMTestData.clients.length;
      var reimport = document.createElement("button");
      reimport.textContent = "↻ Réimporter les clients (" + n + ")";
      reimport.style.cssText = pill;
      reimport.onclick = function () {
        if (!confirm("Réimporter les " + n + " clients depuis l'Excel dans l'espace prospection ?\n\nCela remplace les clients de prospection actuels (le CRM principal n'est pas touché).")) return;
        if (window.CRMTestReseed) { window.CRMTestReseed(true); window.location.reload(); }
      };
      bar.appendChild(reimport);

      // Enrichissement Pappers / annuaire ouvert (page CRM uniquement).
      if (window.CRMTestEnrich) {
        var enr = document.createElement("button");
        enr.textContent = "🔎 Enrichir via Pappers";
        enr.style.cssText = pill;
        enr.onclick = function () {
          if (enr.disabled) return;
          if (!confirm("Compléter les fiches clients de la prospection (SIREN, adresse, forme juridique, procédures) via l'annuaire officiel + Pappers ?\n\nCela peut prendre 1 à 2 minutes. Le CRM principal n'est pas touché.")) return;
          enr.disabled = true; enr.style.opacity = "0.75";
          window.CRMTestEnrich(function (p) {
            enr.textContent = "⏳ Enrichissement " + p.done + "/" + p.total + "…";
          }).then(function (res) {
            enr.textContent = "✓ " + res.enriched + " enrichis";
            alert("Enrichissement terminé : " + res.enriched + " fiches complétées" + (res.failed ? ", " + res.failed + " sans correspondance" : "") + ".");
            window.location.reload();
          }).catch(function (e) { enr.disabled = false; enr.style.opacity = "1"; alert("Erreur : " + (e.message || e)); });
        };
        bar.appendChild(enr);
      }
    }
    var exit = document.createElement("a");
    exit.href = exitHref; exit.textContent = "Revenir au CRM principal"; exit.style.cssText = pill;
    bar.appendChild(exit);
    document.body.appendChild(bar);
    // Décale le contenu pour ne pas masquer la 1re ligne.
    var pad = document.createElement("style");
    pad.textContent = "body{padding-top:32px !important;}";
    document.head.appendChild(pad);
  }

  // Bandeau désactivé à la demande (barre violette retirée). Le mode
  // prospection reste actif ; on revient au CRM principal via l'en-tête du
  // CRM ou en retournant à l'accueil. mountBanner conservé mais non appelé.
  void mountBanner;
})();
