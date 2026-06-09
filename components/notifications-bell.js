// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Cloche de notifications (top-right global)
// ════════════════════════════════════════════════════════════════════
//
// Injecte une cloche 🔔 à côté du menu utilisateur (top-right).
// Affiche le compteur de notifs non-lues + dropdown avec liste.
// Realtime via supabase.channel pour update auto.
//
// API utilisée :
//   window.api.notifications.list()
//   window.api.notifications.unreadCount()
//   window.api.notifications.markRead(id)
//   window.api.notifications.markAllRead()
//
// Toast pop-up sur nouvelle notif via window.HubToast.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  let wrap = null;
  let badge = null;
  let dropdown = null;
  let open = false;
  let notifs = [];
  let unreadCount = 0;
  let channel = null;
  let lastNotifId = null;

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "il y a " + Math.round(diff) + "s";
    if (diff < 3600) return "il y a " + Math.round(diff / 60) + " min";
    if (diff < 86400) return "il y a " + Math.round(diff / 3600) + " h";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  function severityColor(s) {
    return { info: "#3b82f6", success: "#10b981", warn: "#f59e0b", error: "#dc2626" }[s] || "#475569";
  }

  function render() {
    if (!badge || !dropdown) return;
    // Badge count
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
    // Dropdown content
    if (!open) { dropdown.style.display = "none"; return; }
    dropdown.style.display = "block";
    dropdown.innerHTML = "";
    // Header
    const head = document.createElement("div");
    head.style.cssText = "padding:14px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;";
    head.innerHTML = '<div style="font-size:13.5px;font-weight:700;color:#0f172a;">Notifications ' + (unreadCount > 0 ? '<span style="font-size:10.5px;padding:2px 8px;background:#fee2e2;color:#9b1c1c;border-radius:999px;margin-left:6px;font-weight:700;">' + unreadCount + '</span>' : '') + '</div>';
    if (unreadCount > 0) {
      const ma = document.createElement("button");
      ma.textContent = "Tout marquer lu";
      ma.style.cssText = "background:transparent;border:0;color:#3730a3;font-size:11.5px;font-weight:600;cursor:pointer;padding:4px 6px;";
      ma.onclick = async (e) => {
        e.stopPropagation();
        await window.api.notifications.markAllRead();
        unreadCount = 0;
        notifs = notifs.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }));
        render();
      };
      head.appendChild(ma);
    }
    dropdown.appendChild(head);
    // List
    if (notifs.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:30px 16px;text-align:center;color:#94a3b8;font-size:12.5px;";
      empty.textContent = "Aucune notification.";
      dropdown.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.style.cssText = "max-height:400px;overflow-y:auto;";
      notifs.slice(0, 30).forEach((n) => {
        const row = document.createElement("a");
        row.href = n.link || "#";
        const isUnread = !n.read_at;
        row.style.cssText = "display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid #f8fafc;text-decoration:none;color:inherit;cursor:pointer;background:" + (isUnread ? "#fefce8" : "transparent") + ";transition:background .08s;";
        row.onmouseover = () => { row.style.background = "#f8fafc"; };
        row.onmouseout = () => { row.style.background = isUnread ? "#fefce8" : "transparent"; };
        row.onclick = async (e) => {
          if (isUnread) {
            await window.api.notifications.markRead(n.id);
            unreadCount = Math.max(0, unreadCount - 1);
          }
          // Le href s'occupe de la navigation
        };
        const dotColor = severityColor(n.severity);
        const dot = document.createElement("span");
        dot.style.cssText = "width:8px;height:8px;border-radius:999px;background:" + dotColor + ";flex-shrink:0;margin-top:6px;";
        row.appendChild(dot);
        const content = document.createElement("div");
        content.style.cssText = "flex:1;min-width:0;";
        content.innerHTML =
          '<div style="font-size:12.5px;font-weight:' + (isUnread ? "700" : "500") + ';color:#0f172a;line-height:1.4;">' + escapeHtml(n.title) + '</div>' +
          (n.body ? '<div style="font-size:11.5px;color:#64748b;margin-top:2px;line-height:1.4;">' + escapeHtml(n.body) + '</div>' : '') +
          '<div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">' + fmtTime(n.created_at) + '</div>';
        row.appendChild(content);
        list.appendChild(row);
      });
      dropdown.appendChild(list);
    }
  }

  async function reload() {
    if (!window.api || !window.api.notifications) return;
    try {
      notifs = await window.api.notifications.list();
      unreadCount = notifs.filter((n) => !n.read_at).length;
      render();
    } catch (e) { console.warn("[bell] reload:", e); }
  }

  function startRealtime() {
    if (!window.HubSupabase || !window.HubSupabase.enabled) return;
    const supa = window.HubSupabase.client;
    channel = supa.channel("notifications-bell-" + Math.random().toString(36).slice(2, 8))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new;
        if (n && n.id !== lastNotifId) {
          lastNotifId = n.id;
          // Toast pop-up
          if (window.HubToast) {
            const sev = n.severity || "info";
            window.HubToast[sev === "warn" ? "warn" : sev === "error" ? "error" : sev === "success" ? "success" : "info"](n.title + (n.body ? " — " + n.body : ""));
          }
          reload();
        }
      })
      .subscribe();
  }

  function build() {
    // Conteneur fixé à côté du menu utilisateur
    wrap = document.createElement("div");
    wrap.id = "hub-notifications-bell";
    wrap.style.cssText = "position:fixed;top:14px;right:190px;z-index:9001;font-family:'Inter',system-ui,sans-serif;";

    const btn = document.createElement("button");
    btn.title = "Notifications";
    btn.style.cssText = "position:relative;width:38px;height:38px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(15,23,42,0.05);transition:box-shadow .15s,border-color .15s;";
    btn.onmouseover = () => { btn.style.boxShadow = "0 2px 6px rgba(15,23,42,0.08)"; btn.style.borderColor = "#cbd5e1"; };
    btn.onmouseout = () => { btn.style.boxShadow = "0 1px 3px rgba(15,23,42,0.05)"; btn.style.borderColor = "#e5e7eb"; };
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>';
    badge = document.createElement("span");
    badge.style.cssText = "position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#dc2626;color:#fff;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;border:2px solid #fff;letter-spacing:-0.5px;";
    btn.appendChild(badge);
    wrap.appendChild(btn);

    dropdown = document.createElement("div");
    dropdown.style.cssText = "position:absolute;top:46px;right:0;width:380px;max-width:calc(100vw - 40px);background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 24px 60px rgba(15,23,42,0.18);display:none;overflow:hidden;";
    wrap.appendChild(dropdown);

    btn.onclick = (e) => {
      e.stopPropagation();
      open = !open;
      if (open) reload();
      render();
    };
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        open = false;
        render();
      }
    });

    document.body.appendChild(wrap);
  }

  async function init() {
    if (window.location.pathname.indexOf("/login") === 0) return;
    if (window.location.pathname.indexOf("/bienvenue") === 0) return;
    // Attends que api.auth soit prêt et que l'user soit connecté
    let tries = 0;
    while (tries < 30) {
      if (window.api && window.api.auth && window.api.notifications) {
        const user = await window.api.auth.getUser();
        if (user) {
          build();
          reload();
          startRealtime();
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
