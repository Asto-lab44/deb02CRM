// ─── Config Supabase ─────────────────────────────────────────────────
// Valeurs publiques du projet Hub Astorya.
//   Dashboard : https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp
//
// La clé `sb_publishable_*` est le nouveau format Supabase (depuis fin
// 2024) équivalent à l'ancienne "anon" JWT — conçue pour être exposée
// côté navigateur, safe à committer.
//
// Ne JAMAIS coller ici une clé `sb_secret_*` ni `service_role`.

window.HubSupabaseConfig = {
  SUPABASE_URL: "https://cqdgecllzyqimfuovrpp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_TXCd5JaM6NWtfaThEAsNDw_AH3nsEnq",
};
