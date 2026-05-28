// ─── Config Supabase ─────────────────────────────────────────────────
// Collez ici les valeurs publiques de votre projet :
//   1. https://supabase.com/dashboard/project/_/settings/api
//   2. Project URL → SUPABASE_URL ci-dessous
//   3. anon (public) key → SUPABASE_ANON_KEY ci-dessous
//
// La clé "anon" est conçue pour être publique, elle peut être commit en clair.
// Ne JAMAIS coller ici la clé service_role.
//
// Si les deux champs restent à null, l'application reste en mode "démo" avec
// le login factice (window.HubAccess.login) — utile pour développer sans
// dépendre d'un backend.

window.HubSupabaseConfig = {
  SUPABASE_URL: null,        // ex. "https://abcd1234.supabase.co"
  SUPABASE_ANON_KEY: null,   // ex. "eyJhbGciOiJIUzI1NiIs..." (JWT public)
};
