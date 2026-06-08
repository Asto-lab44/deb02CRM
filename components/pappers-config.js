// ────────────────────────────────────────────────────────────────────
// Config Pappers — token API
// ────────────────────────────────────────────────────────────────────
//
// Sign up gratuit sur https://www.pappers.fr/api
// → Récupère ton token et colle-le ci-dessous.
//
// Plan gratuit : 1000 requêtes/mois (largement suffisant pour Astorya
// si on cache les résultats 7 jours).
//
// Le token est exposé côté navigateur. Pappers le sait — c'est leur
// design (rate-limit par token). Si le token est utilisé hors usage
// légitime, ils peuvent le révoquer.
//
// Pour un VRAI cloisonnement : déplacer cet appel côté backend via
// une fonction Edge Supabase (plus tard).
// ────────────────────────────────────────────────────────────────────

window.HubPappersToken = ""; // ← Colle ton token Pappers ici
