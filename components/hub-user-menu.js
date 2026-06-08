// Menu utilisateur global injecté dans le coin haut-droit de chaque page.
// Affiche le nom + rôle + groupes connectés + bouton Déconnexion.
// S'injecte automatiquement quand DOMContentLoaded + Supabase Auth ready.

(function () {
  "use strict";

  function makeAvatar(name) {
    const initials = (name || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
    return initials || "?";
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function getUser() {
    if (!window.api || !window.api.auth) return null;
    return await window.api.auth.getUser();
  }

  // Résout {name, role, groups} via HubAccess (qui fait le mapping email→USERS)
  function resolveProfile(email) {
    try {
      if (window.HubAccess && window.HubAccess.getCurrentUser) {
        const u = window.HubAccess.getCurrentUser();
        if (u) return u;
      }
    } catch (e) {}
    return { email, name: email, role: "—", groups: [] };
  }

  function ICON(svg) {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">' + svg + '</svg>';
  }
  const ICONS = {
    home:    ICON('<path d="M3 12l9-9 9 9"/><path d="M5 10v11h14V10"/>'),
    crm:     ICON('<path d="M3 3v18h18"/><path d="M7 17l4-4 4 4 5-7"/>'),
    tickets: ICON('<path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 100 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 100-4z"/>'),
    intel:   ICON('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    admin:   ICON('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1A1.7 1.7 0 003.6 8a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H8a1.7 1.7 0 001-1.5V2a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V8a1.7 1.7 0 001.5 1H22a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    logout:  ICON('<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'),
  };

  function render(user) {
    if (document.getElementById("hub-user-menu")) return;
    const profile = resolveProfile(user.email);
    const name = profile.name || user.email;
    const role = profile.role || "—";
    const isAdmin = (profile.groups || []).includes("admin") || (profile.groups || []).includes("supervision");

    const wrap = document.createElement("div");
    wrap.id = "hub-user-menu";
    wrap.style.cssText = "position:fixed;top:14px;right:18px;z-index:9000;font-family:'Inter',system-ui,sans-serif;";

    // Bouton compact : avatar + nom court + chevron
    const btn = document.createElement("button");
    btn.style.cssText = "display:flex;align-items:center;gap:9px;padding:5px 11px 5px 5px;border:1px solid #e5e7eb;background:#fff;border-radius:999px;cursor:pointer;box-shadow:0 1px 3px rgba(15,23,42,0.05),0 4px 12px rgba(15,23,42,0.04);transition:box-shadow .15s, border-color .15s;";
    btn.onmouseover = () => { btn.style.boxShadow = "0 2px 6px rgba(15,23,42,0.08),0 8px 18px rgba(15,23,42,0.06)"; btn.style.borderColor = "#cbd5e1"; };
    btn.onmouseout  = () => { btn.style.boxShadow = "0 1px 3px rgba(15,23,42,0.05),0 4px 12px rgba(15,23,42,0.04)"; btn.style.borderColor = "#e5e7eb"; };

    const av = document.createElement("span");
    av.style.cssText = "position:relative;width:28px;height:28px;border-radius:999px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a855f7 100%);color:#fff;font-size:11.5px;font-weight:700;letter-spacing:.3px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;";
    av.textContent = makeAvatar(name);
    // Petit dot vert "online"
    const dot = document.createElement("span");
    dot.style.cssText = "position:absolute;bottom:-1px;right:-1px;width:9px;height:9px;border-radius:999px;background:#10b981;border:2px solid #fff;";
    av.appendChild(dot);

    const lbl = document.createElement("span");
    lbl.style.cssText = "font-size:12.5px;color:#0f172a;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    lbl.textContent = name;

    const chev = document.createElement("span");
    chev.textContent = "▾";
    chev.style.cssText = "color:#94a3b8;font-size:10px;";

    btn.appendChild(av);
    btn.appendChild(lbl);
    btn.appendChild(chev);

    // ─── Dropdown ───
    const menu = document.createElement("div");
    menu.style.cssText = "display:none;position:absolute;top:100%;right:0;margin-top:8px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 4px 12px rgba(15,23,42,0.06),0 24px 60px rgba(15,23,42,0.18);min-width:280px;overflow:hidden;animation:hubMenuIn .14s ease-out;";

    // Header avec gradient
    const header = document.createElement("div");
    header.style.cssText = "padding:16px 16px 14px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;position:relative;overflow:hidden;";
    header.innerHTML =
      '<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 100% 0%,rgba(124,58,237,.35),transparent 60%);pointer-events:none;"></div>' +
      '<div style="position:relative;display:flex;align-items:center;gap:11px;">' +
        '<div style="width:40px;height:40px;border-radius:999px;background:linear-gradient(135deg,#4f46e5,#a855f7);display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;letter-spacing:.3px;flex-shrink:0;border:2px solid rgba(255,255,255,0.15);">' + escapeHtml(makeAvatar(name)) + '</div>' +
        '<div style="min-width:0;flex:1;">' +
          '<div style="font-size:13.5px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(name) + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.65);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">' + escapeHtml(user.email) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="position:relative;display:flex;align-items:center;gap:6px;margin-top:11px;">' +
        '<span style="width:6px;height:6px;border-radius:999px;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.2);"></span>' +
        '<span style="font-size:11px;color:rgba(255,255,255,0.7);font-weight:500;">Connecté · ' + escapeHtml(role) + '</span>' +
        (isAdmin
          ? '<span style="margin-left:auto;font-size:9.5px;font-weight:800;color:#fbbf24;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);padding:2px 7px;border-radius:999px;letter-spacing:.6px;text-transform:uppercase;">★ Admin</span>'
          : '') +
      '</div>';
    menu.appendChild(header);

    // Items
    const itemsWrap = document.createElement("div");
    itemsWrap.style.cssText = "padding:6px;";
    const items = [
      { label: "Accueil",        href: "/",                              icon: ICONS.home,    color: "#4f46e5" },
      { label: "CRM",            href: "/crm",                           icon: ICONS.crm,     color: "#0ea5e9" },
      { label: "Ticketing",      href: "/ticketing",                     icon: ICONS.tickets, color: "#a855f7" },
      { label: "Intelligence",   href: "/intelligence-concurrentielle",  icon: ICONS.intel,   color: "#dc2626" },
      { label: "Administration", href: "/administration-utilisateurs",   icon: ICONS.admin,   color: "#0f172a" },
    ];
    items.forEach((it) => {
      const a = document.createElement("a");
      a.href = it.href;
      a.style.cssText = "display:flex;align-items:center;gap:11px;padding:9px 12px;font-size:13px;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:500;transition:background .12s;";
      a.innerHTML = '<span style="color:' + it.color + ';display:inline-flex;">' + it.icon + '</span><span>' + escapeHtml(it.label) + '</span>';
      a.onmouseover = () => a.style.background = "#f1f5f9";
      a.onmouseout  = () => a.style.background = "transparent";
      itemsWrap.appendChild(a);
    });
    menu.appendChild(itemsWrap);

    // Séparateur
    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#eef1f5;margin:0 12px;";
    menu.appendChild(sep);

    // Logout
    const logoutWrap = document.createElement("div");
    logoutWrap.style.cssText = "padding:6px;";
    const logout = document.createElement("button");
    logout.style.cssText = "display:flex;align-items:center;gap:11px;width:100%;padding:9px 12px;font-size:13px;color:#dc2626;background:transparent;border:none;cursor:pointer;text-align:left;border-radius:8px;font-weight:600;transition:background .12s;";
    logout.innerHTML = '<span style="display:inline-flex;">' + ICONS.logout + '</span><span>Se déconnecter</span>';
    logout.onmouseover = () => logout.style.background = "#fef2f2";
    logout.onmouseout  = () => logout.style.background = "transparent";
    logout.onclick = async () => {
      if (window.api && window.api.auth && window.api.auth.signOut) await window.api.auth.signOut();
      if (window.HubAccess && window.HubAccess.logout) window.HubAccess.logout();
      window.location.href = "/login";
    };
    logoutWrap.appendChild(logout);
    menu.appendChild(logoutWrap);

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" || !menu.style.display ? "block" : "none";
    };
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) menu.style.display = "none";
    });

    // Animation keyframes
    if (!document.getElementById("hub-user-menu-anim")) {
      const style = document.createElement("style");
      style.id = "hub-user-menu-anim";
      style.textContent = "@keyframes hubMenuIn{from{opacity:0;transform:translateY(-4px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}";
      document.head.appendChild(style);
    }

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    document.body.appendChild(wrap);
  }

  async function init() {
    // Pas de menu sur la page de login
    if (window.location.pathname.indexOf("/login") === 0 || window.location.pathname === "/login.html") return;
    if (window.location.pathname.indexOf("/bienvenue") === 0) return;
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
