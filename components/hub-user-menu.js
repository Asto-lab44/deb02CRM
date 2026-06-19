// ════════════════════════════════════════════════════════════════════
// hub-user-menu.js — Bloc utilisateur + bouton déconnexion sur toutes
// les pages où l'authentification est active.
// ════════════════════════════════════════════════════════════════════
//
// Injecte en bas à gauche du viewport (position: fixed) un petit bloc :
//   ┌────────────────────────────────────────┐
//   │ (avatar)  r.daviaud@astorya.fr      ⏻ │   ← carré rouge
//   │           Astorya                       │
//   └────────────────────────────────────────┘
//
// Conditions d'affichage :
//   - HubSupabase est activé ET utilisateur authentifié (api.auth.getUser)
//   - La page n'a pas opté out via window.HubHideUserMenu = true (ex : ERPHome
//     qui a déjà son propre bloc utilisateur intégré dans la sidebar).
//
// Le clic sur ⏻ déclenche un confirm puis signOut + redirection /login.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // Sortie immédiate si la page a son propre bloc utilisateur intégré
  // (la home ERP par exemple). Le flag se positionne AVANT le DOMContentLoaded
  // dans le script de la page concernée.
  if (typeof window === "undefined") return;

  // Détecte la largeur de la première sidebar fixe à gauche pour caler le
  // menu utilisateur dedans (au lieu de le faire dépasser sur le contenu).
  // Tolère plusieurs patterns : <aside>, .sidebar, [data-sidebar], .navbar-left…
  function detectSidebarWidth() {
    try {
      const candidates = document.querySelectorAll("aside, [data-sidebar], .sidebar, .navbar-left, .hub-sidebar");
      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        // Sidebar = élément ancré à gauche, plus haute que large, raisonnable
        if (r.left <= 8 && r.width > 140 && r.width < 320 && r.height > 300) return r.width;
      }
    } catch (e) {}
    return null;
  }

  function render(user) {
    // Si déjà rendu, ne pas dupliquer
    if (document.getElementById("hub-user-menu-floating")) return;

    const sidebarW = detectSidebarWidth();
    // Si une sidebar est détectée → menu calé à l'intérieur, sinon flottant.
    const insideSidebar = sidebarW != null;
    const wrap = document.createElement("div");
    wrap.id = "hub-user-menu-floating";
    wrap.style.cssText = [
      "position: fixed", "bottom: 12px",
      insideSidebar ? "left: 10px" : "left: 14px",
      "z-index: 9000",
      "display: flex", "align-items: center", "gap: 8px",
      "padding: 6px 8px", "background: #fff",
      "border: 1px solid #eef1f5", "border-radius: 10px",
      "box-shadow: 0 4px 14px rgba(15,23,42,0.10)",
      "font-family: 'Inter', system-ui, sans-serif", "font-size: 12px",
      "color: #0f172a",
      // Largeur calée sur la sidebar (avec marges) si présente, sinon 220px
      "width: " + (insideSidebar ? (sidebarW - 20) + "px" : "auto"),
      "max-width: " + (insideSidebar ? (sidebarW - 20) + "px" : "220px"),
      "box-sizing: border-box",
    ].join(";");

    const email = (user && user.email) || "?";
    const initial = String(email).split(/[.@]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

    // Avatar
    const avatar = document.createElement("div");
    avatar.style.cssText = [
      "width: 26px", "height: 26px", "border-radius: 999px",
      "background: #64748b", "color: #fff",
      "display: inline-flex", "align-items: center", "justify-content: center",
      "font-size: 10.5px", "font-weight: 700", "flex-shrink: 0",
    ].join(";");
    avatar.textContent = initial;

    // Bloc texte
    const txt = document.createElement("div");
    txt.style.cssText = "flex: 1; min-width: 0;";
    const line1 = document.createElement("div");
    line1.style.cssText = "font-size: 11.5px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    line1.textContent = email;
    const line2 = document.createElement("div");
    line2.style.cssText = "font-size: 10.5px; color: #64748b;";
    line2.textContent = "Astorya";
    txt.appendChild(line1); txt.appendChild(line2);

    // Bouton déconnexion (carré rouge, comme ERPHome)
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Se déconnecter";
    btn.setAttribute("aria-label", "Se déconnecter");
    btn.textContent = "⏻";
    btn.style.cssText = [
      "width: 26px", "height: 26px", "background: #dc2626",
      "border: 0", "border-radius: 6px", "color: #fff",
      "font-size: 12px", "font-weight: 700", "cursor: pointer",
      "display: inline-flex", "align-items: center", "justify-content: center",
      "box-shadow: 0 1px 2px rgba(220,38,38,0.35)", "flex-shrink: 0",
      "transition: transform 100ms ease, background 100ms ease",
    ].join(";");
    btn.addEventListener("mouseenter", () => { btn.style.background = "#b91c1c"; btn.style.transform = "scale(1.06)"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "#dc2626"; btn.style.transform = "scale(1)"; });
    btn.addEventListener("click", async () => {
      const ok = window.HubModal
        ? await window.HubModal.confirm({ title: "Se déconnecter ?", message: "Tu reviendras sur la page de connexion.", okLabel: "Déconnexion", okStyle: "danger" })
        : confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
      if (!ok) return;
      try { if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut(); } catch (e) {}
      try { if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout(); } catch (e) {}
      window.location.href = "/login";
    });

    wrap.appendChild(avatar);
    wrap.appendChild(txt);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  async function init() {
    // Opt-out : pages qui ont leur propre bloc utilisateur intégré
    if (window.HubHideUserMenu === true) return;
    // Pas de Supabase configuré → pas d'utilisateur, on n'affiche rien
    if (!window.HubSupabase || !window.HubSupabase.enabled) return;
    if (!window.api || !window.api.auth || !window.api.auth.getUser) return;
    try {
      const user = await window.api.auth.getUser();
      if (!user) return; // Pas connecté
      // Premier rendu immédiat (taille fallback si pas de sidebar encore montée).
      render(user);
      // Les apps React montent la sidebar après DOMContentLoaded → on retente
      // un rendu corrigé après 800 ms si une sidebar est apparue entre-temps.
      setTimeout(() => {
        const existing = document.getElementById("hub-user-menu-floating");
        if (!existing) return;
        if (detectSidebarWidth() != null && existing.dataset.aligned !== "1") {
          existing.remove();
          render(user);
          const fresh = document.getElementById("hub-user-menu-floating");
          if (fresh) fresh.dataset.aligned = "1";
        }
      }, 800);
    } catch (e) { /* silencieux */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
