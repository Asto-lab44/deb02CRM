// ════════════════════════════════════════════════════════════════════
// responsive.js — Burger drawer + ferme sidebar au clic externe
// Travaille en duo avec responsive.css. iPhone/Android friendly.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const SMARTPHONE_MAX = 768;
  let _backdrop = null;

  function findSidebar() {
    return document.querySelector("aside") || document.querySelector("[class*=sidebar]");
  }

  function ensureBackdrop() {
    if (_backdrop) return _backdrop;
    _backdrop = document.createElement("div");
    _backdrop.className = "hub-sidebar-backdrop";
    _backdrop.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9050;display:none;-webkit-tap-highlight-color:transparent;";
    _backdrop.addEventListener("click", closeSidebar);
    _backdrop.addEventListener("touchstart", (e) => { e.preventDefault(); closeSidebar(); }, { passive: false });
    document.body.appendChild(_backdrop);
    return _backdrop;
  }

  function openSidebar() {
    const sidebar = findSidebar();
    if (!sidebar) return;
    sidebar.classList.add("hub-sidebar-open");
    ensureBackdrop().style.display = "block";
    document.body.style.overflow = "hidden";
    const btn = document.querySelector(".hub-mobile-burger");
    if (btn) btn.innerHTML = "✕";
  }

  function closeSidebar() {
    const sidebar = findSidebar();
    if (sidebar) sidebar.classList.remove("hub-sidebar-open");
    if (_backdrop) _backdrop.style.display = "none";
    document.body.style.overflow = "";
    const btn = document.querySelector(".hub-mobile-burger");
    if (btn) btn.innerHTML = "☰";
  }

  function toggleSidebar() {
    const sidebar = findSidebar();
    if (!sidebar) return;
    if (sidebar.classList.contains("hub-sidebar-open")) closeSidebar();
    else openSidebar();
  }

  function injectBurger() {
    if (document.querySelector(".hub-mobile-burger")) return;
    const btn = document.createElement("button");
    btn.className = "hub-mobile-burger";
    btn.setAttribute("aria-label", "Menu");
    btn.innerHTML = "☰";
    btn.addEventListener("click", (e) => { e.stopPropagation(); toggleSidebar(); });
    document.body.appendChild(btn);
  }

  function setDeviceAttr() {
    const w = window.innerWidth;
    if (w <= 420) document.body.setAttribute("data-device", "phone-small");
    else if (w <= 768) document.body.setAttribute("data-device", "mobile");
    else if (w <= 1024) document.body.setAttribute("data-device", "tablet");
    else document.body.setAttribute("data-device", "desktop");
  }

  function handleResize() {
    setDeviceAttr();
    if (window.innerWidth > SMARTPHONE_MAX) closeSidebar();
  }

  function init() {
    setDeviceAttr();
    injectBurger();
    ensureBackdrop();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => setTimeout(handleResize, 200));

    // Fermer au clic sur un lien interne
    document.addEventListener("click", (e) => {
      const sidebar = findSidebar();
      if (!sidebar || !sidebar.classList.contains("hub-sidebar-open")) return;
      const link = e.target.closest("a");
      if (link && sidebar.contains(link)) {
        // Petit délai pour laisser la navigation se faire
        setTimeout(closeSidebar, 50);
      }
    });

    // Empêcher le scroll horizontal accidentel
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    document.body.style.maxWidth = "100vw";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
