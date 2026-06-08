// Menu utilisateur global injecté dans le coin haut-droit de chaque page.
// Affiche l'email connecté + bouton Déconnexion.
// S'injecte automatiquement quand DOMContentLoaded + Supabase Auth ready.

(function () {
  "use strict";

  function makeAvatar(name) {
    const initials = (name || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
    return initials || "?";
  }

  async function getUser() {
    if (!window.api || !window.api.auth) return null;
    return await window.api.auth.getUser();
  }

  function render(user) {
    if (document.getElementById("hub-user-menu")) return;
    const wrap = document.createElement("div");
    wrap.id = "hub-user-menu";
    wrap.style.cssText = "position:fixed;top:12px;right:18px;z-index:9000;font-family:Inter,system-ui,sans-serif;";

    const btn = document.createElement("button");
    btn.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #e2e8f0;background:#fff;border-radius:999px;cursor:pointer;box-shadow:0 2px 6px rgba(15,23,42,0.06);";
    const av = document.createElement("span");
    av.style.cssText = "width:24px;height:24px;border-radius:999px;background:linear-gradient(135deg,#4f46e5,#4338ca);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;";
    av.textContent = makeAvatar(user.email);
    const lbl = document.createElement("span");
    lbl.style.cssText = "font-size:12px;color:#0f172a;font-weight:500;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    lbl.textContent = user.email;
    const chev = document.createElement("span");
    chev.textContent = "▾";
    chev.style.cssText = "color:#94a3b8;font-size:10px;";
    btn.appendChild(av); btn.appendChild(lbl); btn.appendChild(chev);

    const menu = document.createElement("div");
    menu.style.cssText = "display:none;position:absolute;top:100%;right:0;margin-top:6px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.12);min-width:240px;padding:4px;";

    const info = document.createElement("div");
    info.style.cssText = "padding:10px 12px;border-bottom:1px solid #f1f5f9;";
    info.innerHTML = '<div style="font-size:12.5px;font-weight:700;color:#0f172a;">' + (user.email || "—") + '</div><div style="font-size:11px;color:#64748b;margin-top:2px;">Connecté</div>';
    menu.appendChild(info);

    const items = [
      { label: "🏠 Accueil",       href: "/" },
      { label: "📊 CRM",            href: "/crm" },
      { label: "⚙ Administration", href: "/administration-utilisateurs" },
    ];
    items.forEach((it) => {
      const a = document.createElement("a");
      a.href = it.href;
      a.style.cssText = "display:block;padding:8px 12px;font-size:12.5px;color:#0f172a;text-decoration:none;border-radius:5px;";
      a.textContent = it.label;
      a.onmouseover = () => a.style.background = "#f1f5f9";
      a.onmouseout = () => a.style.background = "transparent";
      menu.appendChild(a);
    });

    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#eef1f5;margin:4px 0;";
    menu.appendChild(sep);

    const logout = document.createElement("button");
    logout.style.cssText = "display:block;width:100%;padding:8px 12px;font-size:12.5px;color:#dc2626;background:transparent;border:none;cursor:pointer;text-align:left;border-radius:5px;font-weight:600;";
    logout.textContent = "↩ Déconnexion";
    logout.onmouseover = () => logout.style.background = "#fef2f2";
    logout.onmouseout = () => logout.style.background = "transparent";
    logout.onclick = async () => {
      await window.api.auth.signOut();
      window.location.href = "/login";
    };
    menu.appendChild(logout);

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    };
    document.addEventListener("click", () => { menu.style.display = "none"; });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    document.body.appendChild(wrap);
  }

  async function init() {
    // Pas de menu sur la page de login
    if (window.location.pathname.indexOf("/login") === 0 || window.location.pathname === "/login.html") return;
    let tries = 0;
    while (tries < 30) {
      if (window.api && window.api.auth) {
        const user = await getUser();
        if (user) {
          render(user);
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 200));
      tries++;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
