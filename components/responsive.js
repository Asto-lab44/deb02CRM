// ════════════════════════════════════════════════════════════════════
// responsive.js — Injecte un burger menu sur smartphone + toggle sidebar
// Travaille en duo avec responsive.css. Aucun framework requis.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const SMARTPHONE_MAX = 640;

  function findSidebar() {
    // On cible le premier <aside> de la page (convention dans toutes les pages)
    return document.querySelector("aside") || document.querySelector("[class*=sidebar]");
  }

  function injectBurger() {
    if (document.querySelector(".hub-mobile-burger")) return;
    const btn = document.createElement("button");
    btn.className = "hub-mobile-burger";
    btn.setAttribute("aria-label", "Ouvrir le menu");
    btn.innerHTML = "☰";
    btn.addEventListener("click", () => {
      const sidebar = findSidebar();
      if (!sidebar) return;
      const opened = sidebar.classList.toggle("hub-sidebar-open");
      btn.innerHTML = opened ? "✕" : "☰";
      // Quand on ouvre, on scroll au top de la sidebar
      if (opened) {
        sidebar.scrollTop = 0;
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
    document.body.appendChild(btn);
  }

  function handleResize() {
    // Ferme la sidebar si on quitte le breakpoint smartphone
    if (window.innerWidth > SMARTPHONE_MAX) {
      const sidebar = findSidebar();
      if (sidebar) sidebar.classList.remove("hub-sidebar-open");
      const btn = document.querySelector(".hub-mobile-burger");
      if (btn) btn.innerHTML = "☰";
      document.body.style.overflow = "";
    }
  }

  // Détection device pour info debug
  function setDeviceAttr() {
    const w = window.innerWidth;
    if (w <= 640) document.body.setAttribute("data-device", "mobile");
    else if (w <= 1024) document.body.setAttribute("data-device", "tablet");
    else document.body.setAttribute("data-device", "desktop");
  }

  function init() {
    setDeviceAttr();
    injectBurger();
    window.addEventListener("resize", () => { setDeviceAttr(); handleResize(); });
    // Fermer la sidebar quand on clique sur un lien à l'intérieur
    document.addEventListener("click", (e) => {
      const sidebar = findSidebar();
      if (!sidebar || !sidebar.classList.contains("hub-sidebar-open")) return;
      const link = e.target.closest("a");
      if (link && sidebar.contains(link)) {
        sidebar.classList.remove("hub-sidebar-open");
        const btn = document.querySelector(".hub-mobile-burger");
        if (btn) btn.innerHTML = "☰";
        document.body.style.overflow = "";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
