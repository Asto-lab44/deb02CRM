-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Call Control 3CX (réponse / raccrochage depuis le Hub)
-- ════════════════════════════════════════════════════════════════════
--
-- Ajoute 3 paramètres à app_settings nécessaires à l'Edge Function
-- 3cx-call-control qui pilote la téléphonie depuis le popup CTI.
--
-- À exécuter UNE FOIS dans Supabase Studio → SQL Editor.
-- Ces valeurs sont ensuite renseignées depuis Hub → Administration →
-- Intégrations API → carte « Pilotage 3CX ».
-- ════════════════════════════════════════════════════════════════════

insert into public.app_settings (key, value) values
  ('3cx_server_url',    'https://telcomastorya.my3cx.fr:5001'),
  ('3cx_client_id',     ''),
  ('3cx_client_secret', '')
on conflict (key) do nothing;

-- ─── Vérification ─────────────────────────────────────────────────
select key,
       case when value = '' then '❌ À renseigner depuis l''admin Hub'
            when length(value) > 20 then left(value, 6) || '...' || right(value, 4)
            else value end as preview
from public.app_settings
where key like '3cx_%'
order by key;
