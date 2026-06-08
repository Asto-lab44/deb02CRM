// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Validateurs réutilisables pour les formulaires
// ════════════════════════════════════════════════════════════════════
//
// Mode "soft" : renvoie un message d'erreur si invalide, le formulaire
// laisse quand même soumettre (l'erreur s'affiche en rouge sous le champ).
//
// Usage :
//   const err = window.HubValidators.email("toto@");
//   if (err) afficher(err);
//   else continuer;
//
// Tous les validateurs renvoient :
//   - null si valide
//   - { message: "...", level: "error"|"warn" } si invalide
//
// Convention : champ vide → valide (utiliser hubValidators.required pour
// rendre obligatoire en plus).
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  /** Renvoie null si la valeur est vide (laisse au validateur required la
   *  responsabilité de bloquer). */
  function emptyOK(v) { return v == null || (typeof v === "string" && v.trim() === ""); }

  /** Email : regex standard (assez permissive). */
  function email(v) {
    if (emptyOK(v)) return null;
    const re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    return re.test(String(v).trim())
      ? null
      : { message: "Format d'email invalide (ex : prenom.nom@domaine.fr)", level: "error" };
  }

  /** Téléphone FR : accepte +33, 0[1-9]xxx, espaces, points, tirets. */
  function phone(v) {
    if (emptyOK(v)) return null;
    const digits = String(v).replace(/[^\d+]/g, "");
    if (digits.startsWith("+33") && digits.length === 12) return null;
    if (/^0[1-9]\d{8}$/.test(digits)) return null;
    return { message: "Numéro de téléphone invalide (format FR attendu : 06 12 34 56 78 ou +33 6 12 34 56 78)", level: "error" };
  }

  /** SIREN : exactement 9 chiffres + checksum Luhn (algo INSEE). */
  function siren(v) {
    if (emptyOK(v)) return null;
    const digits = String(v).replace(/\D/g, "");
    if (digits.length !== 9) {
      return { message: "Le SIREN doit comporter 9 chiffres (vous en avez " + digits.length + ")", level: "error" };
    }
    // Algorithme Luhn (clé de contrôle SIREN)
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let d = parseInt(digits[i], 10);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0
      ? null
      : { message: "SIREN invalide (clé de contrôle Luhn non valide)", level: "warn" };
  }

  /** SIRET : 14 chiffres (SIREN + NIC) + checksum Luhn. */
  function siret(v) {
    if (emptyOK(v)) return null;
    const digits = String(v).replace(/\D/g, "");
    if (digits.length !== 14) {
      return { message: "Le SIRET doit comporter 14 chiffres (vous en avez " + digits.length + ")", level: "error" };
    }
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let d = parseInt(digits[i], 10);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0
      ? null
      : { message: "SIRET invalide (clé de contrôle Luhn non valide)", level: "warn" };
  }

  /** TVA intra-communautaire FR : FR + 2 chiffres clé + 9 chiffres SIREN. */
  function tva(v) {
    if (emptyOK(v)) return null;
    const cleaned = String(v).replace(/\s/g, "").toUpperCase();
    if (!/^FR\d{2}\d{9}$/.test(cleaned)) {
      return { message: "Format TVA invalide (ex : FR12345678901)", level: "error" };
    }
    return null;
  }

  /** URL : http(s) optionnel + au moins un domaine + tld. */
  function url(v) {
    if (emptyOK(v)) return null;
    const re = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
    return re.test(String(v).trim())
      ? null
      : { message: "URL invalide (ex : https://exemple.fr)", level: "error" };
  }

  /** Champ requis : non vide. */
  function required(v) {
    return emptyOK(v) ? { message: "Champ obligatoire", level: "error" } : null;
  }

  /** Nombre dans une plage [min, max]. */
  function numberRange(v, min, max) {
    if (emptyOK(v)) return null;
    const n = parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
    if (isNaN(n)) return { message: "Doit être un nombre", level: "error" };
    if (min != null && n < min) return { message: "Minimum " + min, level: "error" };
    if (max != null && n > max) return { message: "Maximum " + max, level: "error" };
    return null;
  }

  /** Date au format YYYY-MM-DD, optionnellement dans une plage. */
  function date(v, opts = {}) {
    if (emptyOK(v)) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return { message: "Date invalide", level: "error" };
    if (opts.notInPast) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (d < today) return { message: "La date ne peut pas être dans le passé", level: "warn" };
    }
    if (opts.notInFuture) {
      const today = new Date(); today.setHours(23, 59, 59, 999);
      if (d > today) return { message: "La date ne peut pas être dans le futur", level: "warn" };
    }
    return null;
  }

  // ───────────────────────────────────────────────────────────────────
  // Helpers UI : style d'input + message d'erreur
  // ───────────────────────────────────────────────────────────────────

  /** Style additionnel à fusionner avec un input quand il a une erreur. */
  function errorStyle(err) {
    if (!err) return {};
    return { borderColor: err.level === "warn" ? "#f59e0b" : "#dc2626", boxShadow: err.level === "warn" ? "0 0 0 3px rgba(245,158,11,0.1)" : "0 0 0 3px rgba(220,38,38,0.1)" };
  }

  /** Style pour le message d'erreur sous un champ. */
  function errorMsgStyle(err) {
    if (!err) return { display: "none" };
    return {
      display: "block",
      fontSize: 11.5,
      color: err.level === "warn" ? "#92400e" : "#9b1c1c",
      marginTop: 4,
      fontWeight: 500,
    };
  }

  window.HubValidators = { email, phone, siren, siret, tva, url, required, numberRange, date, errorStyle, errorMsgStyle };
})();
