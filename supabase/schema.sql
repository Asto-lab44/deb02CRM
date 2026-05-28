-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Schéma Supabase
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans le SQL Editor de votre projet Supabase :
--   https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/sql/new
-- Copiez-collez ce fichier entier et cliquez "Run".
--
-- Crée 8 tables, leurs index, contraintes, RLS policies et données
-- de seed pour reproduire la maquette en base.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILS UTILISATEURS ─────────────────────────────────────────
-- Étend auth.users avec les métadonnées métier (nom, rôle, équipe).
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
  access      text[] not null default '{}',   -- liste des modules autorisés (crm, intel, …)
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

-- ─── 3. CLIENTS ──────────────────────────────────────────────────────
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

create index if not exists idx_clients_name on public.clients(name);

-- ─── 4. CONTRATS DE MAINTENANCE ──────────────────────────────────────
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

-- ─── 5. PARC INFORMATIQUE ────────────────────────────────────────────
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
  id              text primary key,                      -- INC-2841, REQ-1192…
  client_id       text references public.clients on delete set null,
  title           text not null,
  description     text,
  category        text,                                  -- "Matériel · Imprimante"
  status          text default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority        text default 'normale' check (priority in ('critique', 'haute', 'normale', 'basse')),
  lifecycle       text check (lifecycle in ('onboarding', 'offboarding')),  -- nullable
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

-- ─── 7. APPELS HOTLINE (3CX CDR) ─────────────────────────────────────
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

-- ─── 8. RETRANSCRIPTIONS D'APPEL ─────────────────────────────────────
create table if not exists public.call_transcripts (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references public.calls on delete cascade,
  ticket_id   text references public.tickets on delete cascade,  -- ticket auquel la retranscription est rattachée
  source      text default 'whisper' check (source in ('whisper', 'deepgram', '3cx', 'manual')),
  text        text not null,
  language    text default 'fr',
  duration_sec int,
  created_at  timestamptz default now()
);

create index if not exists idx_transcripts_ticket on public.call_transcripts(ticket_id);

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
-- Politique de départ permissive (lecture/écriture pour tout user
-- authentifié). À durcir plus tard avec des règles par groupe.

alter table public.profiles         enable row level security;
alter table public.groups           enable row level security;
alter table public.profile_groups   enable row level security;
alter table public.clients          enable row level security;
alter table public.contracts        enable row level security;
alter table public.assets           enable row level security;
alter table public.tickets          enable row level security;
alter table public.calls            enable row level security;
alter table public.call_transcripts enable row level security;

-- Helper pour appliquer la même policy à toutes les tables
do $$
declare t text;
begin
  for t in select unnest(array['profiles','groups','profile_groups','clients','contracts','assets','tickets','calls','call_transcripts'])
  loop
    execute format('drop policy if exists "authenticated_read" on public.%I', t);
    execute format('drop policy if exists "authenticated_write" on public.%I', t);
    execute format('create policy "authenticated_read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "authenticated_write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════════════════════════════

-- Auto-création du profil au signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update du champ updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_tickets_updated_at on public.tickets;
create trigger touch_tickets_updated_at before update on public.tickets
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_assets_updated_at on public.assets;
create trigger touch_assets_updated_at before update on public.assets
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- SEED DATA — reprend les données de la maquette
-- ════════════════════════════════════════════════════════════════════

-- Groupes par défaut
insert into public.groups (id, name, color, description, access) values
  ('admin',       'Administrateurs',             '#dc2626', 'Accès complet à l''ERP.',                        array['crm','intel','marketing','tech','projects','inventory','accounting','billing','treasury','hr','time','reports','settings']),
  ('supervision', 'Administrateur · Supervision', '#7c3aed', 'Cellule supervision — escalades & arbitrage.',  array['crm','intel','marketing','tech','projects','inventory','accounting','billing','treasury','hr','time','reports','settings']),
  ('direction',   'Direction',                    '#4f46e5', 'Comité exécutif — vue 360.',                    array['crm','intel','marketing','tech','projects','inventory','accounting','billing','treasury','hr','time','reports','settings']),
  ('commercial',  'Commercial',                   '#0ea5e9', 'Équipes vente — pipeline, comptes.',             array['crm','intel','marketing','billing','reports']),
  ('support',     'Support technique',            '#0891b2', 'Hotline N1/N2 — tickets, SLA.',                  array['tech','projects','crm','reports']),
  ('finance',     'Finance & Compta',             '#10b981', 'Comptabilité, facturation, trésorerie.',         array['accounting','billing','treasury','reports','hr']),
  ('marketing',   'Marketing',                    '#ec4899', 'Campagnes, contenu, leads.',                     array['marketing','crm','reports','intel']),
  ('rh',          'Ressources humaines',          '#8b5cf6', 'Paie, contrats, recrutement.',                   array['hr','time','reports']),
  ('ops',         'Opérations & Produit',         '#a855f7', 'Roadmap, livrables, stock.',                     array['projects','inventory','tech','reports'])
on conflict (id) do update set
  name = excluded.name, color = excluded.color, description = excluded.description, access = excluded.access;

-- Clients principaux
insert into public.clients (id, name, industry, size, city, website, health_score, arr_eur, client_since) values
  ('ACC-0184', 'AXA Wealth France',    'Asset Management',  '12 000 employés', 'Paris · La Défense', 'axa-im.fr',          78, 184000, '2024-03-01'),
  ('ACC-0211', 'MAIF Innovation',      'Assurance',         '8 500 employés',  'Niort',              'maif.fr',            82, 96000,  '2023-09-15'),
  ('ACC-0156', 'Crédit Agricole Sud',  'Banque',            '3 200 employés',  'Toulouse',           'ca-sud.fr',          54, 42000,  '2022-06-01'),
  ('ACC-0298', 'Allianz France',       'Assurance',         '10 000 employés', 'Paris',              'allianz.fr',         71, 128000, '2024-01-20'),
  ('ACC-0103', 'BNP Paribas AM',       'Asset Management',  '5 000 employés',  'Paris',              'bnpparibas-am.com',  48, 76000,  '2023-02-14'),
  ('ACC-0177', 'La Banque Postale',    'Banque',            '15 000 employés', 'Paris',              'labanquepostale.fr', 88, 156000, '2024-05-10')
on conflict (id) do update set
  name = excluded.name, industry = excluded.industry, size = excluded.size, city = excluded.city,
  website = excluded.website, health_score = excluded.health_score, arr_eur = excluded.arr_eur,
  client_since = excluded.client_since;

-- Contrats de maintenance par client (résume l'état actuel des indicateurs verts/orange/rouge)
insert into public.contracts (client_id, name, tier, start_date, end_date, status, monthly_eur) values
  ('ACC-0184', 'Premium 24/7',      'premium',  '2024-03-01', '2027-02-28', 'active',   4800),
  ('ACC-0211', 'Premium 24/7',      'premium',  '2023-09-15', '2026-12-31', 'active',   3200),
  ('ACC-0156', 'Aucun',             'none',     null,         null,         'none',     0),
  ('ACC-0298', 'Standard 9-18h',    'standard', '2023-07-12', '2026-07-12', 'expiring', 1800),
  ('ACC-0103', 'Aucun',             'none',     null,         null,         'none',     0),
  ('ACC-0177', 'Standard 9-18h',    'standard', '2024-05-10', '2027-09-30', 'active',   2200);

-- ════════════════════════════════════════════════════════════════════
-- Fin du schéma. Vérifications utiles après exécution :
--   select count(*) from public.groups;     -- doit retourner 9
--   select count(*) from public.clients;    -- doit retourner 6
--   select count(*) from public.contracts;  -- doit retourner 6
-- ════════════════════════════════════════════════════════════════════
