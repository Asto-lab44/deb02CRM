// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Système de notifications toast global
// ════════════════════════════════════════════════════════════════════
//
// Remplace les alert() natifs (qui sont bloquants, moches, et figent l'UI)
// par des toasts qui glissent en bas-droite, auto-dismiss après quelques
// secondes, et empilent verticalement si plusieurs.
//
// API :
//   window.HubToast.success("Client créé")
//   window.HubToast.error("Erreur Supabase : RLS bloque")
//   window.HubToast.warn("SIREN non valide mais sauvegarde quand même")
//   window.HubToast.info("Connexion établie")
//
// Options :
//   { duration: 3000 }  // ms avant auto-dismiss (default 4000 pour error/warn, 3000 pour info/success, 0 = pas d'auto-dismiss)
//
// Plain JS, pas de React → utilisable depuis n'importe où.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const STACK_ID = "hub-toast-stack";
  const ANIM_MS = 250;

  /** Crée le container à l'init si absent. */
  function ensureStack() {
    let stack = document.getElementById(STACK_ID);
    if (stack) return stack;
    stack = document.createElement("div");
    stack.id = STACK_ID;
    stack.style.cssText = [
      "position:fixed",
      "bottom:24px",
      "right:24px",
      "z-index:99999",
      "display:flex",
      "flex-direction:column",
      "gap:10px",
      "pointer-events:none",
      "font-family:'Inter',system-ui,sans-serif",
      "max-width:380px",
    ].join(";");
    // Injecte les keyframes une fois
    if (!document.getElementById("hub-toast-styles")) {
      const css = document.createElement("style");
      css.id = "hub-toast-styles";
      css.textContent = `
        @keyframes hub-toast-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes hub-toast-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(40px); opacity: 0; } }
      `;
      document.head.appendChild(css);
    }
    document.body.appendChild(stack);
    return stack;
  }

  const COLORS = {
    success: { bg: "#ecfdf5", fg: "#065f46", border: "#86efac", icon: "✓", iconBg: "#10b981" },
    error:   { bg: "#fef2f2", fg: "#9b1c1c", border: "#fca5a5", icon: "!", iconBg: "#dc2626" },
    warn:    { bg: "#fffbeb", fg: "#78350f", border: "#fde68a", icon: "⚠", iconBg: "#f59e0b" },
    info:    { bg: "#eff6ff", fg: "#1e40af", border: "#93c5fd", icon: "i", iconBg: "#3b82f6" },
  };

  /** Show un toast et renvoie une fonction `dismiss()`. */
  function show(level, message, opts) {
    opts = opts || {};
    const stack = ensureStack();
    const conf = COLORS[level] || COLORS.info;
    const defaultDuration = level === "error" || level === "warn" ? 5000 : 3000;
    const duration = opts.duration != null ? opts.duration : defaultDuration;

    const toast = document.createElement("div");
    toast.style.cssText = [
      "display:flex",
      "align-items:flex-start",
      "gap:11px",
      "padding:12px 14px",
      "background:" + conf.bg,
      "color:" + conf.fg,
      "border:1px solid " + conf.border,
      "border-radius:10px",
      "box-shadow:0 8px 24px rgba(15,23,42,0.15)",
      "font-size:13px",
      "font-weight:500",
      "line-height:1.45",
      "pointer-events:auto",
      "animation:hub-toast-in " + ANIM_MS + "ms ease-out",
      "min-width:260px",
    ].join(";");

    const icon = document.createElement("span");
    icon.textContent = conf.icon;
    icon.style.cssText = [
      "flex-shrink:0",
      "width:22px",
      "height:22px",
      "border-radius:999px",
      "background:" + conf.iconBg,
      "color:#fff",
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      "font-size:13px",
      "font-weight:700",
      "margin-top:1px",
    ].join(";");
    toast.appendChild(icon);

    const text = document.createElement("div");
    text.textContent = String(message);
    text.style.cssText = "flex:1; white-space:pre-wrap; word-break:break-word;";
    toast.appendChild(text);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.title = "Fermer";
    closeBtn.style.cssText = [
      "background:transparent",
      "border:0",
      "color:" + conf.fg,
      "opacity:0.6",
      "font-size:18px",
      "line-height:1",
      "cursor:pointer",
      "padding:0 0 0 4px",
      "margin-top:-2px",
    ].join(";");

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      toast.style.animation = "hub-toast-out " + ANIM_MS + "ms ease-in";
      setTimeout(() => toast.remove(), ANIM_MS);
    };
    closeBtn.onclick = dismiss;
    toast.appendChild(closeBtn);

    stack.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
    return dismiss;
  }

  window.HubToast = {
    success: (msg, opts) => show("success", msg, opts),
    error:   (msg, opts) => show("error", msg, opts),
    warn:    (msg, opts) => show("warn", msg, opts),
    info:    (msg, opts) => show("info", msg, opts),
  };

  // ───────────────────────────────────────────────────────────────────
  // Override global de window.alert() pour utiliser les toasts.
  // Auto-détection du niveau selon le contenu du message.
  // ───────────────────────────────────────────────────────────────────
  const _originalAlert = window.alert;
  window.alert = function (msg) {
    if (msg == null) return _originalAlert.call(window, msg);
    const s = String(msg);
    const lower = s.toLowerCase();
    let level = "info";
    if (/erreur|échec|impossible|fail|✗|❌/i.test(lower)) level = "error";
    else if (/attention|⚠|déjà existe|warning/i.test(lower)) level = "warn";
    else if (/✓|créé|enregistr|sauvegard|mis à jour|envoyé|supprim|ajouté|succ/i.test(lower)) level = "success";
    show(level, s);
  };
})();
