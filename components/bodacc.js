// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Wrapper API BODACC (procédures collectives)
// ════════════════════════════════════════════════════════════════════
//
// BODACC = Bulletin Officiel des Annonces Civiles et Commerciales.
// Source officielle française pour toutes les annonces légales :
// sauvegarde, redressement, liquidation, plan de cession, etc.
//
// API publique opendatasoft, gratuite, sans clé :
//   https://bodacc-datadila.opendatasoft.com
//
// API :
//   await window.HubBodacc.checkSiren(siren)
//     → { status, checked_at, announcement?, total_count?, error? }
//
//   status = "ok"      → aucune procédure trouvée
//          | "warn"    → procédure en cours (sauvegarde, redressement…)
//          | "danger"  → liquidation judiciaire ou clôture pour insuffisance
//          | "error"   → erreur réseau ou format
//          | "unknown" → SIREN invalide
//
//   window.HubBodacc.isStale(result, days=7) → true si > N jours
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const BASE = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records";

  /** Détermine la sévérité d'une annonce selon son type/libellé. */
  function severity(typeLib) {
    const t = (typeLib || "").toLowerCase();
    // Cas DANGER : disparition de l'entreprise
    if (t.includes("liquidation")) return "danger";
    if (t.includes("clôture") && t.includes("insuffisance")) return "danger";
    if (t.includes("cessation")) return "danger";
    // Cas WARN : procédure en cours
    if (t.includes("redressement")) return "warn";
    if (t.includes("sauvegarde")) return "warn";
    if (t.includes("conciliation")) return "warn";
    if (t.includes("plan") && (t.includes("continuation") || t.includes("cession"))) return "warn";
    if (t.includes("ouverture")) return "warn";
    // Cas OK : résolution / clôture positive
    if (t.includes("résolution") || t.includes("résolu")) return "ok";
    // Par défaut, si c'est dans la famille "procédure collective", on warn
    return "warn";
  }

  /** Lance un check BODACC pour un SIREN.
   *  Retourne un objet structuré utilisable par le badge UI. */
  async function checkSiren(siren) {
    const clean = String(siren || "").replace(/\D/g, "");
    if (clean.length !== 9) {
      return { status: "unknown", error: "SIREN invalide (doit faire 9 chiffres)", checked_at: new Date().toISOString() };
    }

    // BODACC stocke les sirens dans le champ `registre` au format array stringifié.
    // On utilise `like` pour matcher.
    const q = `registre like "${clean}"`;
    const url = BASE + "?where=" + encodeURIComponent(q) + "&limit=20&order_by=dateparution desc";

    try {
      const res = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });
      if (!res.ok) {
        return { status: "error", error: "HTTP " + res.status, checked_at: new Date().toISOString(), siren: clean };
      }
      const json = await res.json();
      const recs = (json && json.results) || [];

      // Garde uniquement la famille "procedure_collective"
      const procs = recs.filter((r) => r.familleavis === "procedure_collective");

      if (procs.length === 0) {
        return {
          status: "ok",
          checked_at: new Date().toISOString(),
          siren: clean,
          message: "Aucune procédure collective publiée au BODACC.",
          total_searched: recs.length,
        };
      }

      // Prend la plus récente (le tri par dateparution desc devrait déjà l'avoir)
      const latest = procs[0];
      const typeLib = latest.typeavis_lib || latest.publicationavis_facette || latest.nature || "Procédure collective";
      const status = severity(typeLib);

      return {
        status,
        checked_at: new Date().toISOString(),
        siren: clean,
        announcement: {
          type: typeLib,
          date: latest.dateparution || null,
          tribunal: latest.tribunal || null,
          nature: latest.nature || null,
          ref: latest.id || latest.numerodepartement || null,
          ville: latest.ville_lib || latest.ville || null,
          pdf_url: latest.url_complete || null,
        },
        total_count: procs.length,
      };
    } catch (e) {
      return { status: "error", error: e.message || "Erreur réseau", checked_at: new Date().toISOString(), siren: clean };
    }
  }

  /** Vrai si le check a plus de `days` jours (ou s'il est manquant). */
  function isStale(result, days) {
    if (!result || !result.checked_at) return true;
    const t = new Date(result.checked_at).getTime();
    if (isNaN(t)) return true;
    const age = Date.now() - t;
    return age > (days || 7) * 24 * 3600 * 1000;
  }

  /** Format human-readable d'un résultat (pour les toasts). */
  function format(result) {
    if (!result) return "Statut inconnu";
    if (result.status === "ok") return "RAS — aucune procédure publiée au BODACC.";
    if (result.status === "unknown") return "SIREN invalide.";
    if (result.status === "error") return "Erreur BODACC : " + (result.error || "?");
    if (result.announcement) {
      return result.announcement.type + " — " + (result.announcement.date || "date inconnue") + " · " + (result.announcement.tribunal || "tribunal inconnu");
    }
    return "Procédure collective publiée";
  }

  window.HubBodacc = { checkSiren, isStale, format };
})();
