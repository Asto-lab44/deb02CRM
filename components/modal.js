// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Modal moderne (prompt / confirm / choice)
// ════════════════════════════════════════════════════════════════════
//
// Remplace les prompt() / confirm() natifs du navigateur (popups Chrome
// moches et bloquants) par des modals élégants asynchrones.
//
// API (toutes retournent une Promise) :
//
//   const text = await window.HubModal.prompt({
//     title: "Nouvel élément",
//     label: "Nom :",
//     placeholder: "ex: Astorya Suite",
//     default: "",
//     multiline: false,
//   });
//   // text = string ou null si annulé
//
//   const ok = await window.HubModal.confirm({
//     title: "Supprimer définitivement ?",
//     message: "Cette action est irréversible.",
//     okLabel: "Supprimer",
//     okStyle: "danger", // ou "primary"
//   });
//   // ok = true / false
//
//   const chosen = await window.HubModal.choice({
//     title: "Assigner à",
//     options: [
//       { value: "u-1", label: "Romain Daviaud", sub: "Direction" },
//       { value: "u-2", label: "Augustin Morin", sub: "Direction" },
//     ],
//   });
//   // chosen = value ou null si annulé
//
// Plain JS, pas de React. Modal injecté en DOM directement.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ───── Style injection (once) ──────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById("hub-modal-styles")) return;
    const css = document.createElement("style");
    css.id = "hub-modal-styles";
    css.textContent = `
      .hub-modal-overlay {
        position: fixed; inset: 0; background: rgba(15,23,42,0.55);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: hub-modal-bg-in .15s ease-out;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .hub-modal-card {
        background: #fff; border-radius: 14px;
        box-shadow: 0 24px 60px rgba(15,23,42,0.35), 0 8px 24px rgba(15,23,42,0.15);
        max-width: 460px; width: 100%;
        animation: hub-modal-in .2s cubic-bezier(.16,1,.3,1);
        overflow: hidden;
      }
      .hub-modal-head {
        padding: 18px 22px 0;
      }
      .hub-modal-title {
        font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px;
        letter-spacing: -0.2px;
      }
      .hub-modal-msg {
        font-size: 13px; color: #64748b; margin: 4px 0 0; line-height: 1.5;
      }
      .hub-modal-body {
        padding: 14px 22px 0;
      }
      .hub-modal-input {
        width: 100%; padding: 10px 12px; box-sizing: border-box;
        border: 1px solid #e2e8f0; border-radius: 8px;
        font-size: 13.5px; color: #0f172a; outline: none;
        font-family: inherit;
        transition: border-color .12s, box-shadow .12s;
      }
      .hub-modal-input:focus {
        border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
      }
      .hub-modal-textarea { min-height: 80px; resize: vertical; line-height: 1.5; }
      .hub-modal-foot {
        padding: 18px 22px; display: flex; gap: 8px; justify-content: flex-end;
        border-top: 1px solid #f1f5f9; margin-top: 18px;
      }
      .hub-modal-btn {
        padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
        cursor: pointer; border: 0;
        transition: opacity .1s, transform .05s;
        font-family: inherit;
      }
      .hub-modal-btn:active { transform: translateY(1px); }
      .hub-modal-btn-ghost { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
      .hub-modal-btn-ghost:hover { background: #f8fafc; }
      .hub-modal-btn-primary { background: #0f172a; color: #fff; }
      .hub-modal-btn-primary:hover { opacity: 0.9; }
      .hub-modal-btn-danger { background: #dc2626; color: #fff; }
      .hub-modal-btn-danger:hover { background: #b91c1c; }
      .hub-modal-choice-list {
        max-height: 280px; overflow-y: auto; margin: 0 -22px;
        border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
      }
      .hub-modal-choice-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 22px;
        cursor: pointer;
        border-bottom: 1px solid #f8fafc;
        transition: background .08s;
      }
      .hub-modal-choice-item:hover { background: #f8fafc; }
      .hub-modal-choice-item:last-child { border-bottom: 0; }
      .hub-modal-choice-av {
        width: 30px; height: 30px; border-radius: 999px;
        background: linear-gradient(135deg, #4f46e5, #a855f7); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 11.5px; flex-shrink: 0;
      }
      .hub-modal-choice-meta { flex: 1; min-width: 0; }
      .hub-modal-choice-label { font-size: 13.5px; font-weight: 600; color: #0f172a; }
      .hub-modal-choice-sub { font-size: 11.5px; color: #64748b; margin-top: 1px; }
      @keyframes hub-modal-bg-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes hub-modal-in   { from { transform: translateY(20px) scale(.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    `;
    document.head.appendChild(css);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ───── prompt() : champ texte ──────────────────────────────────────
  function modalPrompt(opts) {
    opts = opts || {};
    ensureStyles();
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "hub-modal-overlay";
      overlay.innerHTML = `
        <div class="hub-modal-card" role="dialog" aria-modal="true">
          <div class="hub-modal-head">
            <h2 class="hub-modal-title">${escapeHtml(opts.title || "Saisir une valeur")}</h2>
            ${opts.message ? `<p class="hub-modal-msg">${escapeHtml(opts.message)}</p>` : ""}
          </div>
          <div class="hub-modal-body">
            ${opts.label ? `<label style="font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:6px;">${escapeHtml(opts.label)}</label>` : ""}
            ${opts.multiline
              ? `<textarea class="hub-modal-input hub-modal-textarea" placeholder="${escapeHtml(opts.placeholder || "")}">${escapeHtml(opts.default || "")}</textarea>`
              : `<input type="${escapeHtml(opts.inputType || "text")}" class="hub-modal-input" placeholder="${escapeHtml(opts.placeholder || "")}" value="${escapeHtml(opts.default || "")}" />`}
          </div>
          <div class="hub-modal-foot">
            <button class="hub-modal-btn hub-modal-btn-ghost" data-action="cancel">${escapeHtml(opts.cancelLabel || "Annuler")}</button>
            <button class="hub-modal-btn hub-modal-btn-primary" data-action="ok">${escapeHtml(opts.okLabel || "Valider")}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = overlay.querySelector(".hub-modal-input");
      setTimeout(() => input && input.focus(), 50);
      const cleanup = (val) => {
        overlay.remove();
        resolve(val);
      };
      overlay.querySelector('[data-action="cancel"]').onclick = () => cleanup(null);
      overlay.querySelector('[data-action="ok"]').onclick = () => cleanup(input ? input.value : "");
      overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(null); });
      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cleanup(null);
        else if (e.key === "Enter" && !opts.multiline && (e.target === input)) cleanup(input.value);
      });
    });
  }

  // ───── confirm() : oui / non ───────────────────────────────────────
  function modalConfirm(opts) {
    opts = opts || {};
    ensureStyles();
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "hub-modal-overlay";
      const isDanger = opts.okStyle === "danger";
      overlay.innerHTML = `
        <div class="hub-modal-card" role="dialog" aria-modal="true">
          <div class="hub-modal-head">
            <h2 class="hub-modal-title">${escapeHtml(opts.title || "Confirmer ?")}</h2>
            ${opts.message ? `<p class="hub-modal-msg" style="white-space:pre-wrap;">${escapeHtml(opts.message)}</p>` : ""}
          </div>
          <div class="hub-modal-foot">
            <button class="hub-modal-btn hub-modal-btn-ghost" data-action="cancel">${escapeHtml(opts.cancelLabel || "Annuler")}</button>
            <button class="hub-modal-btn ${isDanger ? "hub-modal-btn-danger" : "hub-modal-btn-primary"}" data-action="ok">${escapeHtml(opts.okLabel || "Confirmer")}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const cleanup = (val) => { overlay.remove(); resolve(val); };
      overlay.querySelector('[data-action="cancel"]').onclick = () => cleanup(false);
      overlay.querySelector('[data-action="ok"]').onclick = () => cleanup(true);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(false); });
      setTimeout(() => overlay.querySelector('[data-action="ok"]').focus(), 50);
      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cleanup(false);
        else if (e.key === "Enter") cleanup(true);
      });
    });
  }

  // ───── choice() : sélection dans une liste ────────────────────────
  function modalChoice(opts) {
    opts = opts || {};
    ensureStyles();
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "hub-modal-overlay";
      const items = (opts.options || []).map((o) => {
        const initials = String(o.label || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
        return `
          <div class="hub-modal-choice-item" data-value="${escapeHtml(o.value)}">
            <span class="hub-modal-choice-av">${escapeHtml(initials)}</span>
            <div class="hub-modal-choice-meta">
              <div class="hub-modal-choice-label">${escapeHtml(o.label)}</div>
              ${o.sub ? `<div class="hub-modal-choice-sub">${escapeHtml(o.sub)}</div>` : ""}
            </div>
          </div>
        `;
      }).join("");
      overlay.innerHTML = `
        <div class="hub-modal-card" role="dialog" aria-modal="true">
          <div class="hub-modal-head">
            <h2 class="hub-modal-title">${escapeHtml(opts.title || "Sélectionner")}</h2>
            ${opts.message ? `<p class="hub-modal-msg">${escapeHtml(opts.message)}</p>` : ""}
          </div>
          <div class="hub-modal-choice-list">${items}</div>
          <div class="hub-modal-foot">
            <button class="hub-modal-btn hub-modal-btn-ghost" data-action="cancel">${escapeHtml(opts.cancelLabel || "Annuler")}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const cleanup = (val) => { overlay.remove(); resolve(val); };
      overlay.querySelector('[data-action="cancel"]').onclick = () => cleanup(null);
      overlay.querySelectorAll(".hub-modal-choice-item").forEach((el) => {
        el.onclick = () => cleanup(el.getAttribute("data-value"));
      });
      overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(null); });
      overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") cleanup(null); });
    });
  }

  window.HubModal = { prompt: modalPrompt, confirm: modalConfirm, choice: modalChoice };
})();
