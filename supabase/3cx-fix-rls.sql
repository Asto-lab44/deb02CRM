-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Correctif RLS app_settings
-- ════════════════════════════════════════════════════════════════════
--
-- La policy initiale exigeait profiles.role = 'admin' (champ texte
-- libre), or les utilisateurs ont des rôles type "Direction" et
-- l'appartenance admin se gère via la table profile_groups.
--
-- Cette migration aligne la policy sur profile_groups.group_id = 'admin'.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "app_settings_admin_read"  on public.app_settings;
drop policy if exists "app_settings_admin_write" on public.app_settings;

create policy "app_settings_admin_read" on public.app_settings
  for select using (
    exists (
      select 1 from public.profile_groups pg
      where pg.profile_id = auth.uid() and pg.group_id = 'admin'
    )
  );

create policy "app_settings_admin_write" on public.app_settings
  for all using (
    exists (
      select 1 from public.profile_groups pg
      where pg.profile_id = auth.uid() and pg.group_id = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profile_groups pg
      where pg.profile_id = auth.uid() and pg.group_id = 'admin'
    )
  );

-- ─── Vérification ─────────────────────────────────────────────────
select 'Tes groupes' as info, string_agg(group_id, ', ') as groupes
from public.profile_groups
where profile_id = auth.uid();
