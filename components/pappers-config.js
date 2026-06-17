// ────────────────────────────────────────────────────────────────────
// Config Pappers — DÉSORMAIS via proxy authentifié
// ────────────────────────────────────────────────────────────────────
//
// Le token Pappers (et son quota 1000 req/mois) ne doit PLUS être
// embarqué dans le bundle JS public. Il est conservé en variable
// d'environnement Vercel (PAPPERS_API_TOKEN) et utilisé par
// l'endpoint serveur /api/pappers-proxy qui :
//   1. Vérifie le JWT Supabase de l'utilisateur appelant
//   2. Forward la requête vers api.pappers.fr avec le token serveur
//   3. Mise en cache 7 jours pour économiser le quota
//
// Migration progressive : si HubPappersToken est encore défini, le code
// l'utilise (fallback transitoire). Idéal = ne plus jamais le définir.
// ────────────────────────────────────────────────────────────────────

window.HubPappersProxyUrl = "/api/pappers-proxy";
// window.HubPappersToken = "..."; // ⚠ NE PLUS METTRE EN CLAIR ICI
