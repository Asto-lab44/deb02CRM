// auth-guard.js — Garde d'authentification centralisée + anti-flash.
//
// Objectif : empêcher tout affichage de contenu applicatif avant la
// confirmation d'une session Supabase valide. Sans ça, les pages rendaient
// brièvement leur contenu (React monte #root sur DOMContentLoaded) avant que
// la redirection /login asynchrone ne prenne effet — fuite visuelle.
//
// Mécanique :
//   1. On masque immédiatement #root (style injecté en tête de page).
//   2. Au chargement, on vérifie la session. Valide → on révèle ; sinon →
//      redirection /login (le contenu reste masqué entre-temps).
//   3. Filet de sécurité : si la vérif n'aboutit pas en 5 s (réseau lent),
//      on révèle quand même pour ne pas laisser une page blanche.
//
// Dépend uniquement de window.HubSupabase (supabase-client.js). À inclure
// juste après supabase-client.js sur toutes les pages SAUF login.
(function () {
  var HIDE_ID = "authGuardHide";
  function hide() {
    try {
      if (document.getElementById(HIDE_ID)) return;
      var style = document.createElement("style");
      style.id = HIDE_ID;
      style.textContent = "#root{visibility:hidden!important}";
      (document.head || document.documentElement).appendChild(style);
    } catch (e) { /* ignore */ }
  }
  function reveal() {
    var s = document.getElementById(HIDE_ID);
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }
  function redirect() {
    try { window.location.replace("/login"); }
    catch (e) { window.location.href = "/login"; }
  }

  hide();

  function check() {
    // Mode démo / Supabase non configuré : pas d'auth possible, on affiche.
    if (!window.HubSupabase || !window.HubSupabase.enabled || !window.HubSupabase.client) {
      reveal();
      return;
    }
    var done = false;
    // Filet de sécurité anti-page-blanche.
    var safety = setTimeout(function () { if (!done) reveal(); }, 5000);
    window.HubSupabase.client.auth.getSession().then(function (r) {
      done = true; clearTimeout(safety);
      if (r && r.data && r.data.session) reveal();
      else redirect();
    }).catch(function () {
      done = true; clearTimeout(safety);
      redirect();
    });
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", check);
  } else {
    check();
  }
})();
