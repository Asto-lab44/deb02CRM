-- ════════════════════════════════════════════════════════════════════
-- Migration : RLS sur les tables critiques sans policy
-- ════════════════════════════════════════════════════════════════════
-- L'audit sécurité 2026-06-16 a identifié 8 tables métier critiques
-- sans définition RLS dans le repo. Cette migration les sécurise en
-- exigeant un utilisateur authentifié pour tout accès (lecture +
-- écriture). À terme : remplacer USING (true) par un filtre par tenant
-- ou par groupe via profile_groups.
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'contacts',
    'opportunities',
    'actions',
    'contract_templates',
    'delivery_notes',
    'delivery_note_items',
    'notifications',
    'app_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     t || '_authenticated_all', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
                     t || '_authenticated_all', t);
      RAISE NOTICE '✓ RLS activée sur %', t;
    ELSE
      RAISE NOTICE '↷ Table % n''existe pas — skip', t;
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- IMPORTANT : retirer les policies anon
-- ════════════════════════════════════════════════════════════════════
-- L'audit a trouvé supabase/rls-anon.sql qui ouvre TOUT à l'anon. Si
-- ces policies sont encore actives, elles annulent toute sécurité.
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'clients', 'contracts', 'profiles', 'tickets', 'calls',
    'call_transcripts', 'assets', 'groups', 'profile_groups',
    'contacts', 'opportunities', 'actions', 'contract_templates',
    'commercial_docs', 'commercial_doc_lines', 'commercial_company_settings',
    'projects', 'project_items', 'leasing_contracts', 'warranties',
    'suppliers', 'delivery_notes', 'notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "anon_read" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_write" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_all" ON public.%I', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    END IF;
  END LOOP;
  RAISE NOTICE '✓ Policies anon retirées sur les tables métier';
END $$;
