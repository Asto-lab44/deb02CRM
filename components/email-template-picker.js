// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Email Template Picker
// ════════════════════════════════════════════════════════════════════
//
// Helper portable (pas de JSX, pas de React requis) qui affiche une
// modale de sélection de template d'email puis ouvre Outlook Web avec
// le sujet/corps rendus depuis le contexte fourni.
//
// Usage :
//   await HubEmailTemplatePicker.open({
//     to: "contact@client.fr",           // email destinataire (optionnel)
//     ctx: {                             // contexte pour rendre les variables
//       client_name: "ATPS",
//       contact_prenom: "Jean",
//       contact_nom: "Dupont",
//       contact_fonction: "Directeur",
//       opportunity_name: "Refonte infra",
//       amount: "12 500 €",
//       owner_name: "Romain Daviaud",
//     },
//     categoryHint: "relance",           // filtre par défaut (optionnel)
//     onPicked: (template, rendered) => { /* callback optionnel */ },
//   });
//
// Au choix d'un template, ouvre OWA dans un nouvel onglet via
// api.emailTemplates.composeOutlookWeb().
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const CATEGORIES = [
    { k: "all",          label: "Toutes",       color: "#0f172a" },
    { k: "introduction", label: "Introduction", color: "#3b82f6", bg: "#dbeafe" },
    { k: "relance",      label: "Relance",      color: "#ea580c", bg: "#fed7aa" },
    { k: "devis",        label: "Devis",        color: "#a855f7", bg: "#e9d5ff" },
    { k: "remerciement", label: "Remerciement", color: "#10b981", bg: "#d1fae5" },
    { k: "rdv",          label: "RDV",          color: "#0ea5e9", bg: "#bae6fd" },
    { k: "autre",        label: "Autre",        color: "#64748b", bg: "#e2e8f0" },
  ];
  const catMeta = (k) => CATEGORIES.find((c) => c.k === k) || CATEGORIES[6];

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  async function open(options) {
    options = options || {};
    const to = options.to || "";
    const ctx = options.ctx || {};
    let activeCat = options.categoryHint || "all";

    if (!window.api || !window.api.emailTemplates) {
      if (window.HubToast) window.HubToast.error("Templates indisponibles. Vérifie que api.emailTemplates est chargé.");
      return null;
    }
    let templates = [];
    try { templates = await window.api.emailTemplates.list(); } catch (e) {
      if (window.HubToast) window.HubToast.error("Échec chargement templates : " + (e.message || e));
      return null;
    }

    return new Promise((resolve) => {
      // ── Overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.55);" +
        "z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;" +
        "font-family:'Inter',system-ui,sans-serif;";
      const modal = document.createElement("div");
      modal.style.cssText = "background:#fff;border-radius:14px;width:92%;max-width:780px;" +
        "max-height:90vh;display:flex;flex-direction:column;overflow:hidden;" +
        "box-shadow:0 16px 60px rgba(0,0,0,0.35);";
      overlay.appendChild(modal);

      const close = (result) => {
        document.body.removeChild(overlay);
        resolve(result);
      };
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });

      const render = () => {
        const filtered = activeCat === "all" ? templates : templates.filter((t) => t.category === activeCat);
        const catChips = CATEGORIES.map((c) => {
          const isActive = c.k === activeCat;
          const count = c.k === "all" ? templates.length : templates.filter((t) => t.category === c.k).length;
          return `<button data-cat="${c.k}" style="padding:5px 11px;border:1px solid ${isActive ? c.color : "#e2e8f0"};` +
                 `background:${isActive ? c.color : "#fff"};color:${isActive ? "#fff" : "#475569"};` +
                 `border-radius:7px;font-size:11.5px;font-weight:600;cursor:pointer;` +
                 `display:inline-flex;align-items:center;gap:5px;font-family:inherit;">` +
                 `${escapeHtml(c.label)} <span style="font-size:9.5px;padding:1px 5px;border-radius:999px;` +
                 `background:${isActive ? "rgba(255,255,255,0.25)" : "#eef1f5"};color:${isActive ? "#fff" : "#64748b"};` +
                 `font-weight:700;">${count}</span></button>`;
        }).join("");

        const cards = filtered.length === 0
          ? `<div style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;font-style:italic;">
              Aucun template ${activeCat !== "all" ? "dans cette catégorie" : "configuré"}.
              <br/><br/><a href="/templates-email" style="color:#3730a3;text-decoration:underline;font-weight:600;">
              + Créer un template</a>
            </div>`
          : filtered.map((t) => {
              const meta = catMeta(t.category);
              const preview = (t.body || "").slice(0, 140).replace(/\n+/g, " ") + ((t.body || "").length > 140 ? "…" : "");
              return `<button data-tpl="${t.id}" style="display:block;width:100%;text-align:left;padding:12px 14px;` +
                     `border:1px solid #e2e8f0;background:#fff;border-radius:10px;cursor:pointer;font-family:inherit;` +
                     `margin-bottom:8px;transition:all 120ms;">` +
                     `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">` +
                     `<span style="padding:1px 7px;border-radius:4px;font-size:9.5px;font-weight:700;letter-spacing:0.3px;` +
                     `text-transform:uppercase;background:${meta.bg};color:${meta.color};">${escapeHtml(meta.label)}</span>` +
                     `<span style="font-size:10.5px;color:#94a3b8;">→ Choisir</span>` +
                     `</div>` +
                     `<div style="font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:3px;">${escapeHtml(t.name)}</div>` +
                     `<div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:5px;">` +
                     `${escapeHtml(t.subject || "(sans sujet)")}</div>` +
                     `<div style="font-size:10.5px;color:#475569;line-height:1.4;">${escapeHtml(preview)}</div>` +
                     `</button>`;
            }).join("");

        modal.innerHTML =
          `<header style="padding:18px 22px;border-bottom:1px solid #eef1f5;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;font-weight:700;">
                ${to ? "✉ Envoyer à " + escapeHtml(to) : "📧 Choisir un template d'email"}
              </div>
              <h2 style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a;">Templates email</h2>
            </div>
            <button id="hetp-close" style="width:32px;height:32px;border:none;background:#f1f5f9;border-radius:8px;
                    font-size:18px;cursor:pointer;font-weight:700;font-family:inherit;">×</button>
          </header>
          <div style="padding:12px 22px;background:#fafbfc;border-bottom:1px solid #eef1f5;
                      display:flex;gap:5px;flex-wrap:wrap;">${catChips}</div>
          <div style="flex:1;overflow:auto;padding:14px 22px;">${cards}</div>
          <footer style="padding:12px 22px;border-top:1px solid #eef1f5;background:#fff;
                  display:flex;justify-content:space-between;align-items:center;">
            <a href="/templates-email" style="color:#3730a3;text-decoration:none;font-size:12px;font-weight:600;">
              ⚙ Gérer les templates →
            </a>
            <button id="hetp-cancel" style="padding:7px 14px;border:1px solid #e2e8f0;background:#fff;
                    border-radius:8px;font-size:12.5px;color:#475569;cursor:pointer;font-weight:600;font-family:inherit;">
              Annuler
            </button>
          </footer>`;

        // Listeners
        modal.querySelectorAll("[data-cat]").forEach((b) => {
          b.addEventListener("click", () => { activeCat = b.getAttribute("data-cat"); render(); });
        });
        modal.querySelectorAll("[data-tpl]").forEach((b) => {
          b.addEventListener("mouseenter", () => {
            b.style.borderColor = "#3730a3";
            b.style.boxShadow = "0 2px 8px rgba(55,48,163,0.12)";
          });
          b.addEventListener("mouseleave", () => {
            b.style.borderColor = "#e2e8f0";
            b.style.boxShadow = "none";
          });
          b.addEventListener("click", () => {
            const tpl = templates.find((t) => t.id === b.getAttribute("data-tpl"));
            if (!tpl) return;
            const rendered = window.api.emailTemplates.composeOutlookWeb({ to, template: tpl, ctx });
            if (window.HubToast) window.HubToast.success("📧 Outlook Web ouvert avec « " + tpl.name + " »");
            if (typeof options.onPicked === "function") {
              try { options.onPicked(tpl, rendered); } catch (e) {}
            }
            close({ template: tpl, rendered });
          });
        });
        modal.querySelector("#hetp-close").addEventListener("click", () => close(null));
        modal.querySelector("#hetp-cancel").addEventListener("click", () => close(null));
      };

      document.body.appendChild(overlay);
      render();
    });
  }

  window.HubEmailTemplatePicker = { open };
})();
