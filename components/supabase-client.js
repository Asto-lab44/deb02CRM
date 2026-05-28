// Initialise le client Supabase si les clés sont configurées. Sinon expose
// un stub null pour que l'app reste en mode démo (login factice via
// localStorage). À charger après le SDK supabase-js et après supabase-config.js.

(function () {
  const cfg = window.HubSupabaseConfig || {};
  const enabled = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

  if (!enabled) {
    window.HubSupabase = { enabled: false, client: null };
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // gère le retour du magic link
      flowType: "pkce",
    },
  });

  window.HubSupabase = { enabled: true, client };
})();
