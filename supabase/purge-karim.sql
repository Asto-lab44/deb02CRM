-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Retire toutes les références à "Karim Ben Salah"
-- ════════════════════════════════════════════════════════════════════
--
-- Réassigne les actions, opportunités, tickets, projets attribués à
-- Karim Ben Salah → Romain Daviaud.
-- À exécuter dans Supabase Studio → SQL Editor.
-- ════════════════════════════════════════════════════════════════════

-- 1. Actions
update public.actions
   set owner_name = 'Romain Daviaud'
 where owner_name ilike 'Karim%';

-- 2. Opportunités
update public.opportunities
   set owner = 'Romain Daviaud'
 where owner ilike 'Karim%';

-- 3. Tickets (assignee_team est text libre)
update public.tickets
   set assignee_team = 'Direction'
 where assignee_team ilike '%Karim%';

-- 4. Projets : chef de projet
update public.projects
   set data = jsonb_set(data, '{pm_name}', '"Romain Daviaud"')
 where data->>'pm_name' ilike 'Karim%';

-- 5. Contacts data
update public.contacts
   set data = jsonb_set(data, '{owner}', '"Romain Daviaud"')
 where data->>'owner' ilike 'Karim%';

-- Vérification
select 'actions' as tbl, count(*) as restants_karim from public.actions where owner_name ilike '%Karim%'
union all select 'opportunities', count(*) from public.opportunities where owner ilike '%Karim%'
union all select 'tickets', count(*) from public.tickets where assignee_team ilike '%Karim%'
union all select 'projects_data', count(*) from public.projects where data::text ilike '%Karim%'
union all select 'contacts_data', count(*) from public.contacts where data::text ilike '%Karim%';
