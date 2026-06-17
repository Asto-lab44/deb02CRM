-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Patch RLS pour permettre les opérations en anonyme
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans le SQL Editor de Supabase APRÈS schema.sql.
--
-- Ce patch ouvre les écritures aux utilisateurs anonymes (anon role)
-- en complément des authentifiés. Utile pour le mode démo où on
-- n'est pas encore connecté via magic link.
--
-- ⚠️ À DURCIR EN PRODUCTION : retirer les policies anon et n'autoriser
-- que les rôles 'authenticated' filtrés par groupe.
-- ════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  for t in select unnest(array['profiles','groups','profile_groups','clients','contracts','assets','tickets','calls','call_transcripts'])
  loop
    -- Lecture pour anon
    execute format('drop policy if exists "anon_read" on public.%I', t);
    execute format('create policy "anon_read" on public.%I for select to anon using (true)', t);
    -- Écriture pour anon (à RETIRER en prod)
    execute format('drop policy if exists "anon_write" on public.%I', t);
    execute format('create policy "anon_write" on public.%I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

-- Vérif :
--   select * from pg_policies where schemaname = 'public' order by tablename, policyname;
