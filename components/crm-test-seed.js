// ════════════════════════════════════════════════════════════════════
// crm-test-seed.js — amorçage du CRM test (bac à sable) avec les clients
// importés depuis l'Excel (window.CRMTestData, cf. crm-test-data.js).
//
// N'agit QU'EN mode test (window.HubTestMode) : écrit dans l'espace de noms
// isolé « hubAstorya.test.prospects.v1 » (les clients du CRM sont stockés
// sous la ressource « prospects », voir api.js). N'écrase jamais des données
// déjà présentes — import une seule fois, à la première entrée.
//
// window.CRMTestReseed(force) permet de (ré)importer manuellement :
//   • force=false → n'importe que si l'espace est vide ;
//   • force=true  → remplace le contenu par le jeu de l'Excel.
//
// DOIT être chargé APRÈS api.js et crm-test-data.js, AVANT le rendu du CRM.
// ════════════════════════════════════════════════════════════════════
(function () {
  var KEY = "hubAstorya.test.prospects.v1";

  function currentCount() {
    try { return (JSON.parse(localStorage.getItem(KEY) || "[]") || []).length; } catch (e) { return 0; }
  }

  window.CRMTestReseed = function (force) {
    var clients = (window.CRMTestData && window.CRMTestData.clients) || [];
    if (!clients.length) return 0;
    if (!force && currentCount() > 0) return currentCount();
    try {
      localStorage.setItem(KEY, JSON.stringify(clients));
      console.info("[CRM test] " + clients.length + " clients importés dans le bac à sable.");
      return clients.length;
    } catch (e) { console.warn("[CRM test] import impossible", e); return 0; }
  };

  // Amorçage automatique à la première entrée en mode test.
  if (window.HubTestMode && currentCount() === 0) {
    window.CRMTestReseed(false);
  }
})();
