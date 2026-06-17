// ════════════════════════════════════════════════════════════════════
// modal-guard.js — Garde-fou universel pour fermeture de modale
// ════════════════════════════════════════════════════════════════════
//
// Empêche la perte de saisie quand l'utilisateur clique en dehors d'une
// modale (overlay), appuie sur Échap, ou clique sur la croix de fermeture
// sans avoir sauvegardé.
//
// Usage côté modale :
//
//   <div onClick={() => window.HubModalGuard.tryClose({
//                  hasUnsaved: isDirty,
//                  label: "fiche client",
//                  onSave: async () => { await save(); onClose(); },
//                  onDiscard: () => onClose(),
//                })}>…</div>
//
//   <button onClick={() => window.HubModalGuard.tryClose({...})}>×</button>
//
// L'utilisateur voit alors un dialog 3 boutons :
//   • Enregistrer       → await onSave(), puis ferme
//   • Quitter sans sauv  → onDiscard()
//   • Annuler            → ne fait rien (reste sur la modale)
//
// Si hasUnsaved === false, la fermeture est immédiate (pas de prompt).
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  let _currentDialog = null;

  function buildDialog({ label, onSave, onDiscard, onCancel }) {
    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position: fixed", "inset: 0", "z-index: 100000",
      "background: rgba(15,23,42,0.62)", "backdrop-filter: blur(2px)",
      "display: flex", "align-items: center", "justify-content: center",
      "font-family: 'Inter', system-ui, sans-serif", "color: #0f172a",
      "animation: hubGuardFade 0.12s ease-out",
    ].join(";");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) doCancel();
    });

    const card = document.createElement("div");
    card.style.cssText = [
      "background: #fff", "border-radius: 14px", "padding: 22px 24px 20px",
      "max-width: 460px", "width: calc(100% - 40px)",
      "box-shadow: 0 24px 60px rgba(0,0,0,0.35)", "border: 1px solid #eef1f5",
    ].join(";");
    card.addEventListener("click", (e) => e.stopPropagation());

    const head = document.createElement("div");
    head.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 8px;";
    head.innerHTML = '<span style="font-size:22px">⚠️</span><h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a">Modifications non sauvegardées</h3>';
    card.appendChild(head);

    const msg = document.createElement("p");
    msg.style.cssText = "margin: 4px 0 18px; font-size: 13px; color: #475569; line-height: 1.5;";
    msg.textContent = "Tu as des modifications non sauvegardées" + (label ? " sur " + label : "") + ". Que veux-tu faire ?";
    card.appendChild(msg);

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Annuler";
    btnCancel.style.cssText = "padding:8px 14px;background:#fff;color:#475569;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit";
    btnCancel.onclick = doCancel;

    const btnDiscard = document.createElement("button");
    btnDiscard.textContent = "Quitter sans sauvegarder";
    btnDiscard.style.cssText = "padding:8px 14px;background:#fff;color:#dc2626;border:1px solid #fecaca;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit";
    btnDiscard.onclick = doDiscard;

    const btnSave = document.createElement("button");
    btnSave.textContent = "Enregistrer";
    btnSave.style.cssText = "padding:8px 14px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit";
    btnSave.onclick = doSave;

    actions.appendChild(btnCancel);
    actions.appendChild(btnDiscard);
    if (onSave) actions.appendChild(btnSave);
    card.appendChild(actions);
    overlay.appendChild(card);

    function doCancel() { close(); if (onCancel) try { onCancel(); } catch (e) {} }
    function doDiscard() { close(); if (onDiscard) try { onDiscard(); } catch (e) {} }
    async function doSave() {
      btnSave.disabled = true; btnDiscard.disabled = true; btnCancel.disabled = true;
      btnSave.textContent = "Enregistrement…";
      try { if (onSave) await onSave(); } catch (e) { console.error("[HubModalGuard]", e); }
      close();
    }
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); _currentDialog = null; }

    document.body.appendChild(overlay);
    _currentDialog = overlay;

    // Esc → annule (équivalent à cliquer Annuler)
    const escHandler = (e) => { if (e.key === "Escape") { e.stopPropagation(); doCancel(); document.removeEventListener("keydown", escHandler, true); } };
    document.addEventListener("keydown", escHandler, true);
  }

  function tryClose(opts) {
    opts = opts || {};
    // Pas de modifications → fermeture immédiate
    if (!opts.hasUnsaved) {
      if (opts.onDiscard) opts.onDiscard();
      return;
    }
    // Empêche d'ouvrir 2 dialogs en même temps
    if (_currentDialog) return;
    buildDialog({
      label: opts.label || "",
      onSave: opts.onSave || null,
      onDiscard: opts.onDiscard || null,
      onCancel: opts.onCancel || null,
    });
  }

  // CSS animation keyframes (injecté une seule fois)
  if (!document.getElementById("hub-guard-style")) {
    const st = document.createElement("style");
    st.id = "hub-guard-style";
    st.textContent = "@keyframes hubGuardFade{from{opacity:0}to{opacity:1}}";
    document.head.appendChild(st);
  }

  window.HubModalGuard = { tryClose };
})();
