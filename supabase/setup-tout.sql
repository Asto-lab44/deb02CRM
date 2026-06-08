-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — SETUP COMPLET v2 (optimisé production)
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor :
--   https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/sql/new
--
-- Améliorations vs v1 :
--   ✓ Triggers updated_at automatiques sur toutes les tables
--   ✓ Soft-delete (deleted_at) sur clients/opps/contacts/actions/contrats
--   ✓ Index full-text search (français) pour recherche globale rapide
--   ✓ Vues KPI précalculées (clients_by_status, pipeline_par_stage…)
--   ✓ Trigger handle_new_user assigne auto le groupe admin aux nouveaux comptes
--   ✓ Seed profiles + profile_groups pour Romain + Augustin
--   ✓ Index composites optimisés pour les requêtes fréquentes
--   ✓ Realtime activé sur tickets + comments
--   ✓ Helper functions (touch_updated_at, current_user_groups)
--
-- Idempotent : peut être relancé sans danger (CREATE IF NOT EXISTS, etc).
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 0. HELPERS — fonctions PostgreSQL réutilisables
-- ════════════════════════════════════════════════════════════════════

-- Met à jour automatiquement updated_at à chaque UPDATE
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Note : current_user_groups() est créée en bas du script, après les tables.

-- ════════════════════════════════════════════════════════════════════
-- 1. PROFILS UTILISATEURS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique not null,
  name        text not null,
  role        text,
  team        text,
  status      text default 'active' check (status in ('active', 'inactive', 'invited')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_status on public.profiles(status);

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 2. GROUPES & APPARTENANCES
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.groups (
  id          text primary key,
  name        text not null,
  color       text not null default '#64748b',
  description text,
  access      text[] not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

drop trigger if exists trg_groups_touch on public.groups;
create trigger trg_groups_touch before update on public.groups
  for each row execute function public.touch_updated_at();

-- Seed les groupes par défaut (idempotent via on conflict do nothing)
insert into public.groups (id, name, color, description, access) values
  ('admin',        'Administrateurs',           '#dc2626', 'Accès complet à l''ERP, gestion des utilisateurs.',  '{crm,intel,marketing,tech,projects,inventory,accounting,billing,treasury,hr,time,reports,settings}'),
  ('supervision',  'Administrateur · Supervision','#7c3aed', 'Supervision tickets et escalades.',                  '{crm,intel,marketing,tech,projects,inventory,accounting,billing,treasury,hr,time,reports,settings}'),
  ('direction',    'Direction',                 '#4f46e5', 'Comité exécutif — vue 360 sur tous les modules.',    '{crm,intel,marketing,tech,projects,inventory,accounting,billing,treasury,hr,time,reports,settings}'),
  ('commercial',   'Commercial',                '#0ea5e9', 'Vente — pipeline, comptes, opportunités.',           '{crm,intel,marketing,billing,reports}'),
  ('support',      'Support technique',         '#0891b2', 'Hotline N1/N2 — tickets, SLA.',                      '{tech,projects,crm,reports}'),
  ('finance',      'Finance & Compta',          '#10b981', 'Compta, facturation, trésorerie.',                   '{accounting,billing,treasury,reports,hr}'),
  ('marketing',    'Marketing',                 '#ec4899', 'Campagnes, leads, analytics.',                        '{marketing,crm,reports,intel}'),
  ('rh',           'Ressources humaines',       '#8b5cf6', 'Paie, contrats, recrutement.',                       '{hr,time,reports}'),
  ('ops',          'Opérations & Produit',      '#a855f7', 'Roadmap, livrables, stock.',                          '{projects,inventory,tech,reports}')
on conflict (id) do nothing;

create table if not exists public.profile_groups (
  profile_id  uuid references public.profiles on delete cascade,
  group_id    text references public.groups on delete cascade,
  created_at  timestamptz default now(),
  primary key (profile_id, group_id)
);
create index if not exists idx_profile_groups_group on public.profile_groups(group_id);
create index if not exists idx_profile_groups_profile on public.profile_groups(profile_id);

-- ════════════════════════════════════════════════════════════════════
-- 3. CLIENTS (+ colonnes CRM étendues + full-text search + soft-delete)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.clients (
  id            text primary key,
  name          text not null,
  industry      text,
  size          text,
  city          text,
  website       text,
  health_score  int check (health_score between 0 and 100),
  arr_eur       numeric(14, 2),
  client_since  date,
  created_at    timestamptz default now()
);
alter table public.clients add column if not exists data       jsonb default '{}'::jsonb;
alter table public.clients add column if not exists status     text default 'prospect' check (status in ('prospect', 'client', 'archived', 'lost'));
alter table public.clients add column if not exists owner      text;
alter table public.clients add column if not exists updated_at timestamptz default now();
alter table public.clients add column if not exists deleted_at timestamptz;
alter table public.clients add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Full-text search auto-calculé depuis name + ville + secteur + données jsonb
alter table public.clients drop column if exists search_doc;
alter table public.clients add column search_doc tsvector
  generated always as (
    to_tsvector('french',
      coalesce(name, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(industry, '') || ' ' ||
      coalesce(data->>'siren', '') || ' ' ||
      coalesce(data->>'raison_sociale', '') || ' ' ||
      coalesce(data->>'secteur', '') || ' ' ||
      coalesce(website, '')
    )
  ) stored;

create index if not exists idx_clients_name        on public.clients(name);
create index if not exists idx_clients_status      on public.clients(status) where deleted_at is null;
create index if not exists idx_clients_owner       on public.clients(owner) where deleted_at is null;
create index if not exists idx_clients_data        on public.clients using gin(data);
create index if not exists idx_clients_search      on public.clients using gin(search_doc);
create index if not exists idx_clients_created     on public.clients(created_at desc) where deleted_at is null;

drop trigger if exists trg_clients_touch on public.clients;
create trigger trg_clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 4. CONTRATS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.contracts (
  id           uuid primary key default gen_random_uuid(),
  client_id    text not null references public.clients on delete cascade,
  name         text not null,
  tier         text default 'standard' check (tier in ('premium', 'standard', 'none')),
  start_date   date,
  end_date     date,
  status       text default 'active' check (status in ('active', 'expiring', 'expired', 'none')),
  monthly_eur  numeric(14, 2),
  notes        text,
  created_at   timestamptz default now()
);
alter table public.contracts add column if not exists opp_id      text;
alter table public.contracts add column if not exists products    jsonb default '[]'::jsonb;
alter table public.contracts add column if not exists total_ht_y1 numeric(14, 2);
alter table public.contracts add column if not exists tcv         numeric(14, 2);
alter table public.contracts add column if not exists margin_pct  int;
alter table public.contracts add column if not exists data        jsonb default '{}'::jsonb;
alter table public.contracts add column if not exists updated_at  timestamptz default now();
alter table public.contracts add column if not exists deleted_at  timestamptz;
alter table public.contracts add column if not exists created_by  uuid references auth.users(id) on delete set null;
create index if not exists idx_contracts_client on public.contracts(client_id) where deleted_at is null;
create index if not exists idx_contracts_status on public.contracts(status) where deleted_at is null;
create index if not exists idx_contracts_end    on public.contracts(end_date) where deleted_at is null and end_date is not null;

drop trigger if exists trg_contracts_touch on public.contracts;
create trigger trg_contracts_touch before update on public.contracts
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 5. ASSETS (parc IT)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.assets (
  id            text primary key,
  client_id     text not null references public.clients on delete cascade,
  type          text not null check (type in ('laptop', 'desktop', 'server', 'network', 'printer', 'mobile', 'display')),
  hostname      text,
  model         text,
  serial        text,
  os            text,
  assigned_to   text,
  bought_on     date,
  warranty_end  date,
  contract      text,
  site          text,
  status        text default 'active' check (status in ('active', 'stock', 'retired')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_assets_client   on public.assets(client_id);
create index if not exists idx_assets_warranty on public.assets(warranty_end);

drop trigger if exists trg_assets_touch on public.assets;
create trigger trg_assets_touch before update on public.assets
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 6. TICKETS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.tickets (
  id              text primary key,
  client_id       text references public.clients on delete set null,
  title           text not null,
  description     text,
  category        text,
  status          text default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority        text default 'normale' check (priority in ('critique', 'haute', 'normale', 'basse')),
  lifecycle       text check (lifecycle in ('onboarding', 'offboarding')),
  billable        boolean default false,
  billable_note   text,
  assignee_id     uuid references public.profiles on delete set null,
  assignee_team   text,
  escalated_to    uuid references public.profiles on delete set null,
  escalated_group text references public.groups on delete set null,
  escalated_at    timestamptz,
  escalated_reason text,
  sla_due_at      timestamptz,
  opened_at       timestamptz default now(),
  updated_at      timestamptz default now(),
  closed_at       timestamptz
);
alter table public.tickets add column if not exists requester_name text;
alter table public.tickets add column if not exists requester_id   uuid references public.profiles on delete set null;
alter table public.tickets add column if not exists deleted_at     timestamptz;

create index if not exists idx_tickets_status         on public.tickets(status) where deleted_at is null;
create index if not exists idx_tickets_client         on public.tickets(client_id) where deleted_at is null;
create index if not exists idx_tickets_assignee       on public.tickets(assignee_id) where deleted_at is null;
create index if not exists idx_tickets_escalated      on public.tickets(escalated_at) where escalated_at is not null;
create index if not exists idx_tickets_opened_desc    on public.tickets(opened_at desc) where deleted_at is null;
create index if not exists idx_tickets_sla_due        on public.tickets(sla_due_at) where status in ('open','in_progress','waiting');

drop trigger if exists trg_tickets_touch on public.tickets;
create trigger trg_tickets_touch before update on public.tickets
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 7. COMMENTS (fil de conversation des tickets)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    text not null references public.tickets on delete cascade,
  author_id    uuid references public.profiles on delete set null,
  author_name  text not null,
  author_email text,
  body         text not null,
  kind         text not null default 'reply' check (kind in ('reply', 'note', 'system')),
  created_at   timestamptz default now()
);
create index if not exists idx_comments_ticket on public.comments(ticket_id, created_at);

-- ════════════════════════════════════════════════════════════════════
-- 8. OPPORTUNITÉS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.opportunities (
  id           text primary key,
  client_id    text references public.clients(id) on delete cascade,
  name         text not null,
  amount_eur   numeric(14, 2),
  stage        text default 'qualif' check (stage in ('qualif', 'discovery', 'propo', 'nego', 'won', 'lost')),
  proba        int default 20 check (proba between 0 and 100),
  close_date   date,
  owner        text,
  produit      text,
  modules      text[] default '{}',
  type         text default 'new' check (type in ('new', 'extension', 'renewal', 'upsell')),
  source       text,
  duration     text,
  notes        text,
  data         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  created_by   uuid references auth.users(id) on delete set null
);
alter table public.opportunities add column if not exists deleted_at timestamptz;

-- Full-text search sur opportunités
alter table public.opportunities drop column if exists search_doc;
alter table public.opportunities add column search_doc tsvector
  generated always as (
    to_tsvector('french',
      coalesce(name, '') || ' ' ||
      coalesce(produit, '') || ' ' ||
      coalesce(owner, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored;

create index if not exists idx_opportunities_client     on public.opportunities(client_id) where deleted_at is null;
create index if not exists idx_opportunities_stage      on public.opportunities(stage) where deleted_at is null;
create index if not exists idx_opportunities_owner      on public.opportunities(owner) where deleted_at is null;
create index if not exists idx_opportunities_close      on public.opportunities(close_date) where deleted_at is null and close_date is not null;
create index if not exists idx_opportunities_search     on public.opportunities using gin(search_doc);

drop trigger if exists trg_opportunities_touch on public.opportunities;
create trigger trg_opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 9. CONTACTS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.contacts (
  id           text primary key,
  client_id    text not null references public.clients(id) on delete cascade,
  prenom       text,
  nom          text,
  fonction     text,
  email        text,
  phone        text,
  linkedin     text,
  is_principal boolean default false,
  roles        text[] default '{}',
  hierarchie   text,
  notes        text,
  data         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  created_by   uuid references auth.users(id) on delete set null
);
alter table public.contacts add column if not exists deleted_at timestamptz;
create index if not exists idx_contacts_client on public.contacts(client_id) where deleted_at is null;
create index if not exists idx_contacts_email  on public.contacts(email) where deleted_at is null and email is not null;
-- Index unique partiel : un seul contact principal par client
create unique index if not exists idx_contacts_one_principal
  on public.contacts(client_id) where is_principal = true and deleted_at is null;

drop trigger if exists trg_contacts_touch on public.contacts;
create trigger trg_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 10. ACTIONS (timeline + à mener)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.actions (
  id           text primary key,
  client_id    text references public.clients(id) on delete cascade,
  opp_id       text references public.opportunities(id) on delete set null,
  type         text not null check (type in ('email', 'call', 'rdv', 'visio', 'task', 'note', 'in', 'wait', 'stage')),
  title        text not null,
  meta         text,
  due_at       timestamptz,
  due_text     text,
  priority     text default 'moyenne' check (priority in ('haute', 'moyenne', 'basse', 'ai')),
  assigned_to  text,
  status       text default 'todo' check (status in ('todo', 'done', 'cancelled')),
  completed_at timestamptz,
  tag          text,
  tag_color    text,
  icon         text,
  data         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  created_by   uuid references auth.users(id) on delete set null
);
alter table public.actions add column if not exists deleted_at timestamptz;
create index if not exists idx_actions_client       on public.actions(client_id) where deleted_at is null;
create index if not exists idx_actions_opp          on public.actions(opp_id) where deleted_at is null;
create index if not exists idx_actions_status_due   on public.actions(status, due_at) where deleted_at is null;
create index if not exists idx_actions_assigned     on public.actions(assigned_to) where deleted_at is null;

drop trigger if exists trg_actions_touch on public.actions;
create trigger trg_actions_touch before update on public.actions
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 11. APPELS (3CX)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.calls (
  id              uuid primary key default gen_random_uuid(),
  client_id       text references public.clients on delete set null,
  caller_name     text,
  caller_phone    text not null,
  line            text default 'Hotline support',
  direction       text default 'inbound' check (direction in ('inbound', 'outbound')),
  status          text default 'completed' check (status in ('completed', 'missed', 'voicemail')),
  duration_sec    int default 0,
  recording_url   text,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  ticket_id       text references public.tickets on delete set null,
  category        text check (category in ('incident', 'demande', 'probleme', null))
);
create index if not exists idx_calls_client  on public.calls(client_id);
create index if not exists idx_calls_started on public.calls(started_at desc);
create index if not exists idx_calls_ticket  on public.calls(ticket_id);

create table if not exists public.call_transcripts (
  id           uuid primary key default gen_random_uuid(),
  call_id      uuid references public.calls on delete cascade,
  ticket_id    text references public.tickets on delete cascade,
  source       text default 'whisper' check (source in ('whisper', 'deepgram', '3cx', 'manual')),
  text         text not null,
  language     text default 'fr',
  duration_sec int,
  created_at   timestamptz default now()
);
create index if not exists idx_transcripts_ticket on public.call_transcripts(ticket_id);
create index if not exists idx_transcripts_call   on public.call_transcripts(call_id);

-- ════════════════════════════════════════════════════════════════════
-- 12. VUES KPI (statistiques précalculées côté BDD)
-- ════════════════════════════════════════════════════════════════════

-- Stats clients par statut
create or replace view public.v_clients_stats as
  select
    status,
    count(*)::int as count,
    count(*) filter (where created_at > now() - interval '30 days')::int as new_30d
  from public.clients
  where deleted_at is null
  group by status;

-- Stats pipeline opportunités par stage
create or replace view public.v_pipeline_stats as
  select
    stage,
    count(*)::int as count,
    coalesce(sum(amount_eur), 0)::numeric(14,2) as total_eur,
    coalesce(sum(amount_eur * proba / 100), 0)::numeric(14,2) as weighted_eur
  from public.opportunities
  where deleted_at is null
  group by stage;

-- Stats tickets par statut + priorité
create or replace view public.v_tickets_stats as
  select
    status,
    priority,
    count(*)::int as count,
    count(*) filter (where sla_due_at < now() and status in ('open','in_progress','waiting'))::int as sla_overdue
  from public.tickets
  where deleted_at is null
  group by status, priority;

-- Actions à mener par utilisateur
create or replace view public.v_actions_todo as
  select
    assigned_to,
    count(*)::int as count,
    count(*) filter (where due_at < now())::int as overdue,
    count(*) filter (where priority = 'haute')::int as urgent
  from public.actions
  where status = 'todo' and deleted_at is null
  group by assigned_to;

-- ════════════════════════════════════════════════════════════════════
-- 12.5 HELPER : groupes de l'utilisateur courant (après que profile_groups existe)
-- ════════════════════════════════════════════════════════════════════
create or replace function public.current_user_groups()
returns text[]
language sql
stable
as $$
  select coalesce(array_agg(group_id), '{}'::text[])
  from public.profile_groups
  where profile_id = auth.uid()
$$;

-- ════════════════════════════════════════════════════════════════════
-- 13. RLS — Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles         enable row level security;
alter table public.groups           enable row level security;
alter table public.profile_groups   enable row level security;
alter table public.clients          enable row level security;
alter table public.contracts        enable row level security;
alter table public.assets           enable row level security;
alter table public.tickets          enable row level security;
alter table public.comments         enable row level security;
alter table public.opportunities    enable row level security;
alter table public.contacts         enable row level security;
alter table public.actions          enable row level security;
alter table public.calls            enable row level security;
alter table public.call_transcripts enable row level security;

-- Politique : tout user authentifié peut tout faire (les 2 users Astorya
-- sont co-administrateurs). À durcir plus tard avec current_user_groups()
-- si on veut isoler les commerciaux des admins/finance.
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','groups','profile_groups','clients','contracts','assets',
    'tickets','comments','opportunities','contacts','actions',
    'calls','call_transcripts'
  ])
  loop
    execute format('drop policy if exists "authenticated_read" on public.%I', t);
    execute format('drop policy if exists "authenticated_write" on public.%I', t);
    execute format('drop policy if exists "anon_read" on public.%I', t);
    execute format('drop policy if exists "anon_write" on public.%I', t);
    execute format('create policy "authenticated_read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "authenticated_write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 14. TRIGGER auto-création profil + assignation groupe admin au signup
-- ════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'name', new.email);

  insert into public.profiles (id, email, name, status)
  values (new.id, new.email, v_name, 'active')
  on conflict (id) do update set email = excluded.email, name = excluded.name;

  -- Assigne d'office le nouvel user au groupe admin (les 2 users Astorya
  -- sont co-administrateurs)
  insert into public.profile_groups (profile_id, group_id)
  values (new.id, 'admin')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill : profile + groupe admin pour les utilisateurs déjà créés
insert into public.profiles (id, email, name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', u.email)
  from auth.users u
  on conflict (id) do nothing;
insert into public.profile_groups (profile_id, group_id)
  select u.id, 'admin' from auth.users u
  on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
-- 15. REALTIME — notifications live multi-onglets / multi-agents
-- ════════════════════════════════════════════════════════════════════
do $$
begin
  begin alter publication supabase_realtime add table public.tickets;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.comments;     exception when others then null; end;
  begin alter publication supabase_realtime add table public.actions;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.opportunities; exception when others then null; end;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- FIN — SETUP TERMINÉ
-- ════════════════════════════════════════════════════════════════════
-- Vérifications utiles à lancer après :
--   select count(*) from public.profile_groups;  -- doit > 0
--   select * from public.v_clients_stats;        -- doit renvoyer 0 rows si vide
--   select * from public.groups;                 -- doit renvoyer 9 groupes
-- ════════════════════════════════════════════════════════════════════
