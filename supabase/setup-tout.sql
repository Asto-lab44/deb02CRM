-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — SETUP COMPLET (un seul fichier à coller, une seule fois)
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor :
--   https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/sql/new
--
-- Crée TOUTES les tables nécessaires : clients, opportunités, contacts,
-- actions, tickets, comments, contracts, profiles, etc.
-- Idempotent : sans danger si déjà appliqué partiellement.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILS UTILISATEURS ─────────────────────────────────────────
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

-- ─── 2. GROUPES & APPARTENANCES ──────────────────────────────────────
create table if not exists public.groups (
  id          text primary key,
  name        text not null,
  color       text not null default '#64748b',
  description text,
  access      text[] not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create table if not exists public.profile_groups (
  profile_id  uuid references public.profiles on delete cascade,
  group_id    text references public.groups on delete cascade,
  created_at  timestamptz default now(),
  primary key (profile_id, group_id)
);
create index if not exists idx_profile_groups_group on public.profile_groups(group_id);

-- ─── 3. CLIENTS (+ colonnes étendues CRM) ────────────────────────────
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
alter table public.clients add column if not exists data jsonb default '{}'::jsonb;
alter table public.clients add column if not exists status text default 'prospect' check (status in ('prospect', 'client', 'archived', 'lost'));
alter table public.clients add column if not exists owner text;
alter table public.clients add column if not exists updated_at timestamptz default now();
alter table public.clients add column if not exists created_by uuid references auth.users(id);
create index if not exists idx_clients_name on public.clients(name);
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_owner on public.clients(owner);
create index if not exists idx_clients_data on public.clients using gin(data);

-- ─── 4. CONTRATS ─────────────────────────────────────────────────────
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
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_contracts_status on public.contracts(status);

-- ─── 5. ASSETS (parc IT) ─────────────────────────────────────────────
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
create index if not exists idx_assets_client on public.assets(client_id);
create index if not exists idx_assets_warranty on public.assets(warranty_end);

-- ─── 6. TICKETS ──────────────────────────────────────────────────────
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
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_client on public.tickets(client_id);
create index if not exists idx_tickets_assignee on public.tickets(assignee_id);
create index if not exists idx_tickets_escalated on public.tickets(escalated_at) where escalated_at is not null;

-- ─── 7. COMMENTS (fil de conversation des tickets) ───────────────────
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

-- ─── 8. OPPORTUNITÉS ─────────────────────────────────────────────────
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
  created_by   uuid references auth.users(id)
);
create index if not exists idx_opportunities_client on public.opportunities(client_id);
create index if not exists idx_opportunities_stage on public.opportunities(stage);
create index if not exists idx_opportunities_owner on public.opportunities(owner);

-- ─── 9. CONTACTS (secondaires) ───────────────────────────────────────
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
  created_by   uuid references auth.users(id)
);
create index if not exists idx_contacts_client on public.contacts(client_id);
create index if not exists idx_contacts_email on public.contacts(email);

-- ─── 10. ACTIONS (timeline + à mener) ────────────────────────────────
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
  created_by   uuid references auth.users(id)
);
create index if not exists idx_actions_client on public.actions(client_id);
create index if not exists idx_actions_status on public.actions(status);
create index if not exists idx_actions_due on public.actions(due_at);

-- ─── 11. APPELS (3CX) ────────────────────────────────────────────────
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
create index if not exists idx_calls_client on public.calls(client_id);
create index if not exists idx_calls_started on public.calls(started_at);

create table if not exists public.call_transcripts (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references public.calls on delete cascade,
  ticket_id   text references public.tickets on delete cascade,
  source      text default 'whisper' check (source in ('whisper', 'deepgram', '3cx', 'manual')),
  text        text not null,
  language    text default 'fr',
  duration_sec int,
  created_at  timestamptz default now()
);
create index if not exists idx_transcripts_ticket on public.call_transcripts(ticket_id);

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (toutes les tables, authenticated = tout droit)
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
    execute format('create policy "authenticated_read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "authenticated_write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- TRIGGER : auto-créer un profile à chaque signup Supabase Auth
-- ════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
-- REALTIME pour les comments (notifie les autres agents en direct)
-- ════════════════════════════════════════════════════════════════════
do $$
begin
  begin
    alter publication supabase_realtime add table public.comments;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.tickets;
  exception when others then null;
  end;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- FIN — exécute, puis recharge l'app (Ctrl+Shift+R) et recrée tes objets.
-- ════════════════════════════════════════════════════════════════════
