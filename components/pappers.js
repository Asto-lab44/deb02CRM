// ════════════════════════════════════════════════════════════════════
// Hub Astorya — Wrapper API Pappers (procédures collectives + données entreprise)
// ════════════════════════════════════════════════════════════════════
//
// Pappers = base de données entreprises française très complète.
// API documentation : https://www.pappers.fr/api
//
// Plans :
//   - Gratuit : 1000 req/mois, 100 req/jour (signup pappers.fr/api)
//   - Standard : 5000 req/mois
//   - Pro : illimité
//
// Token API : à configurer dans components/pappers-config.js (gitignored
// idéalement, ou en window.HubPappersToken) :
//   window.HubPappersToken = "XXXX-XXXX-XXXX-XXXX";
//
// API publique :
//   await window.HubPappers.checkSiren(siren)
//     → { status, checked_at, source: "pappers", company?, procedures?, error? }
//
//   status = "ok"      → entreprise active, aucune procédure
//          | "warn"    → procédure collective en cours
//          | "danger"  → liquidation / radiation
//          | "error"   → erreur API/réseau
//          | "unknown" → SIREN invalide ou pas de token
//
// Fallback : si pas de token Pappers, on essaie BODACC via HubBodacc.
// ════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const BASE = "https://api.pappers.fr/v2/entreprise";

  /** Détermine la sévérité depuis une procédure Pappers. */
  function severityFromProc(proc) {
    const t = (proc.type || proc.libelle || "").toLowerCase();
    if (t.includes("liquidation")) return "danger";
    if (t.includes("cessation") || t.includes("radiation")) return "danger";
    if (t.includes("clôture") && (t.includes("insuffisance") || t.includes("faute"))) return "danger";
    if (t.includes("redressement") || t.includes("sauvegarde") || t.includes("conciliation")) return "warn";
    if (t.includes("plan") && (t.includes("continuation") || t.includes("cession"))) return "warn";
    if (t.includes("ouverture")) return "warn";
    return "warn";
  }

  /** Récupère les infos d'une entreprise par SIREN via l'API Pappers. */
  async function checkSiren(siren) {
    const clean = String(siren || "").replace(/\D/g, "");
    if (clean.length !== 9) {
      return { status: "unknown", error: "SIREN invalide", checked_at: new Date().toISOString() };
    }

    // Priorité : 1) localStorage (configurable depuis l'admin), 2) window
    let token = "";
    try { token = localStorage.getItem("hubAstorya.pappers.token") || ""; } catch (e) {}
    if (!token) token = window.HubPappersToken || (window.HubSupabaseConfig && window.HubSupabaseConfig.PAPPERS_TOKEN) || "";
    if (!token) {
      // Fallback automatique sur BODACC si pas de token Pappers
      if (window.HubBodacc && window.HubBodacc.checkSiren) {
        const r = await window.HubBodacc.checkSiren(clean);
        r.source = "bodacc";
        return r;
      }
      return { status: "unknown", error: "Aucun token Pappers configuré (HubPappersToken)", checked_at: new Date().toISOString(), source: "none" };
    }

    const url = BASE + "?siren=" + encodeURIComponent(clean) + "&api_token=" + encodeURIComponent(token);

    try {
      const res = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });
      if (res.status === 404) {
        return { status: "ok", checked_at: new Date().toISOString(), siren: clean, source: "pappers", message: "Entreprise non trouvée sur Pappers." };
      }
      if (res.status === 401 || res.status === 403) {
        return { status: "error", error: "Token Pappers invalide ou révoqué (HTTP " + res.status + ")", checked_at: new Date().toISOString(), siren: clean, source: "pappers" };
      }
      if (res.status === 429) {
        // Quota dépassé → fallback BODACC
        console.warn("[Pappers] quota dépassé, fallback BODACC");
        if (window.HubBodacc) {
          const r = await window.HubBodacc.checkSiren(clean);
          r.source = "bodacc-fallback";
          return r;
        }
        return { status: "error", error: "Quota Pappers dépassé", checked_at: new Date().toISOString(), siren: clean, source: "pappers" };
      }
      if (!res.ok) {
        return { status: "error", error: "HTTP " + res.status, checked_at: new Date().toISOString(), siren: clean, source: "pappers" };
      }

      const data = await res.json();
      const checked_at = new Date().toISOString();

      // Extraction des procédures collectives
      const procs = Array.isArray(data.procedures_collectives) ? data.procedures_collectives : [];
      // Tri par date de jugement décroissante (plus récent d'abord)
      procs.sort((a, b) => (b.date_jugement || "").localeCompare(a.date_jugement || ""));

      // Statut global
      let status = "ok";
      if (procs.length > 0) {
        // Prend la plus récente comme statut courant
        status = severityFromProc(procs[0]);
      }
      // Si entreprise cessée selon état administratif → danger
      if ((data.etat_administratif || "").toLowerCase() === "cessée" || (data.etat_administratif || "").toLowerCase() === "radiee") {
        status = "danger";
      }

      // Object résultat enrichi (en plus de status, on stocke tout pour ClientPage)
      return {
        status,
        checked_at,
        siren: clean,
        source: "pappers",
        company: {
          denomination: data.denomination || data.nom_entreprise || null,
          siren: data.siren,
          siret: data.siege?.siret || null,
          forme_juridique: data.forme_juridique || null,
          date_creation: data.date_creation || null,
          capital: data.capital || null,
          effectif: data.effectif || data.tranche_effectif || null,
          etat_administratif: data.etat_administratif || null,
          code_naf: data.code_naf || data.libelle_code_naf || null,
          libelle_code_naf: data.libelle_code_naf || null,
          tva_intracommunautaire: data.numero_tva_intracommunautaire || null,
          siege: data.siege ? {
            adresse: data.siege.adresse_ligne_1 || null,
            cp: data.siege.code_postal || null,
            ville: data.siege.ville || null,
          } : null,
          dirigeants: Array.isArray(data.representants) ? data.representants.slice(0, 5).map((d) => ({
            nom: d.nom_complet || (d.nom + " " + (d.prenom || "")),
            fonction: d.qualite || null,
          })) : [],
        },
        procedures: procs.map((p) => ({
          type: p.type || p.libelle || "Procédure collective",
          date: p.date_jugement || p.date || null,
          tribunal: p.tribunal || null,
          numero: p.numero_dossier || null,
          rcs: p.numero_rcs || null,
        })),
        // Pour rétro-compat avec le format BODACC :
        announcement: procs.length > 0 ? {
          type: procs[0].type || procs[0].libelle,
          date: procs[0].date_jugement || procs[0].date,
          tribunal: procs[0].tribunal,
          nature: procs[0].libelle || procs[0].type,
        } : null,
        total_count: procs.length,
      };
    } catch (e) {
      return { status: "error", error: e.message || "Erreur réseau", checked_at: new Date().toISOString(), siren: clean, source: "pappers" };
    }
  }

  function isStale(result, days) {
    if (!result || !result.checked_at) return true;
    const t = new Date(result.checked_at).getTime();
    if (isNaN(t)) return true;
    return Date.now() - t > (days || 7) * 24 * 3600 * 1000;
  }

  window.HubPappers = { checkSiren, isStale };
})();
