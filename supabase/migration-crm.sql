-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Migration CRM complet
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor (UNE SEULE FOIS) :
--   https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp/sql/new
--
-- Ajoute :
--   - Colonne `data jsonb` sur clients (champs flexibles)
--   - Table `opportunities`
--   - Table `contacts` (contacts secondaires d'un client)
--   - Table `actions` (Email/Call/RDV/Tâche/Note — historique + à venir)
--   - RLS pour les 2 utilisateurs autorisés (Romain + Augustin)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Étendre la table clients ────────────────────────────────────
alter table public.clients add column if not exists data jsonb default '{}'::jsonb;
alter table public.clients add column if not exists status text default 'prospect' check (status in ('prospect', 'client', 'archived', 'lost'));
alter table public.clients add column if not exists owner text;
alter table public.clients add column if not exists updated_at timestamptz default now();
alter table public.clients add column if not exists created_by uuid references auth.users(id);

create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_owner on public.clients(owner);
create index if not exists idx_clients_data on public.clients using gin(data);

-- ─── 2. OPPORTUNITÉS ────────────────────────────────────────────────
create table if not exists public.opportunities (
  id           text primary key,                       -- "OPP-XXXX"
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

-- ─── 3. CONTACTS (secondaires d'un client) ──────────────────────────
create table if not exists public.contacts (
  id           text primary key,                       -- "CT-XXXX"
  client_id    text not null references public.clients(id) on delete cascade,
  prenom       text,
  nom          text,
  fonction     text,
  email        text,
  phone        text,
  linkedin     text,
  is_principal boolean default false,
  roles        text[] default '{}',                    -- Décideur, Prescripteur, etc.
  hierarchie   text,                                   -- Opér./Mgr/Dir./C-level
  notes        text,
  data         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  created_by   uuid references auth.users(id)
);

create index if not exists idx_contacts_client on public.contacts(client_id);
create index if not exists idx_contacts_email on public.contacts(email);

-- ─── 4. ACTIONS (timeline + à mener) ────────────────────────────────
create table if not exists public.actions (
  id           text primary key,                       -- "EX-XXXX" ou "ACT-XXXX"
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

-- ─── 5. Étendre la table contracts ──────────────────────────────────
alter table public.contracts add column if not exists opp_id text references public.opportunities(id) on delete set null;
alter table public.contracts add column if not exists products jsonb default '[]'::jsonb;
alter table public.contracts add column if not exists total_ht_y1 numeric(14, 2);
alter table public.contracts add column if not exists tcv numeric(14, 2);
alter table public.contracts add column if not exists margin_pct int;
alter table public.contracts add column if not exists data jsonb default '{}'::jsonb;
alter table public.contracts add column if not exists created_by uuid references auth.users(id);
alter table public.contracts add column if not exists updated_at timestamptz default now();

-- ─── 6. ROW LEVEL SECURITY ──────────────────────────────────────────
-- Les utilisateurs authentifiés (Romain + Augustin) peuvent tout faire.

alter table public.clients       enable row level security;
alter table public.opportunities enable row level security;
alter table public.contacts      enable row level security;
alter table public.actions       enable row level security;
alter table public.contracts     enable row level security;

drop policy if exists "auth_all_clients" on public.clients;
create policy "auth_all_clients" on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_opportunities" on public.opportunities;
create policy "auth_all_opportunities" on public.opportunities
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_contacts" on public.contacts;
create policy "auth_all_contacts" on public.contacts
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_actions" on public.actions;
create policy "auth_all_actions" on public.actions
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_contracts" on public.contracts;
create policy "auth_all_contracts" on public.contracts
  for all to authenticated using (true) with check (true);

-- ─── 7. Triggers updated_at ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_opportunities_updated on public.opportunities;
create trigger trg_opportunities_updated before update on public.opportunities
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_actions_updated on public.actions;
create trigger trg_actions_updated before update on public.actions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contracts_updated on public.contracts;
create trigger trg_contracts_updated before update on public.contracts
  for each row execute function public.set_updated_at();

-- ─── 8. Promotion automatique prospect → client ─────────────────────
-- Quand une opportunité passe au stage "won", on met à jour le client
-- (status: 'prospect' → 'client', client_since: aujourd'hui)
create or replace function public.promote_client_on_won()
returns trigger language plpgsql as $$
begin
  if new.stage = 'won' and (old.stage is null or old.stage <> 'won') then
    update public.clients
       set status = 'client',
           client_since = coalesce(client_since, current_date)
     where id = new.client_id and status = 'prospect';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_promote_client on public.opportunities;
create trigger trg_promote_client after insert or update on public.opportunities
  for each row execute function public.promote_client_on_won();
