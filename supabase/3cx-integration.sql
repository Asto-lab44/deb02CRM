-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Intégration 3CX (Enterprise)
-- ════════════════════════════════════════════════════════════════════
--
-- À exécuter UNE FOIS dans Supabase Studio → SQL Editor.
-- Idempotent : peut être relancé sans casser l'existant.
--
-- 1. Ajoute la colonne extension_3cx sur profiles
-- 2. Crée la table call_events (alimentée par l'Edge Function 3cx-webhook)
-- 3. Crée la table app_settings pour stocker le secret partagé 3CX
-- 4. Active le realtime sur call_events
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Extension 3CX par utilisateur ───────────────────────────────
alter table public.profiles
  add column if not exists extension_3cx text;

-- ─── 2. Événements d'appel reçus de 3CX ─────────────────────────────
create table if not exists public.call_events (
  id                uuid primary key default gen_random_uuid(),
  caller_number     text not null,                -- numéro entrant normalisé +33...
  caller_name       text,                         -- nom affiché par 3CX (si dispo)
  called_extension  text not null,                -- poste appelé (ex. "201")
  agent_user_id     uuid references public.profiles(id) on delete set null,
  matched_client_id uuid references public.clients(id) on delete set null,
  direction         text not null default 'inbound' check (direction in ('inbound','outbound')),
  status            text not null default 'ringing' check (status in ('ringing','answered','missed','hangup')),
  department        text,                         -- département 3CX (filtré : ASTO uniquement)
  call_id_3cx       text,                         -- ID interne 3CX pour dédup
  payload_raw       jsonb,                        -- archive du JSON brut reçu (debug)
  started_at        timestamptz default now(),
  answered_at       timestamptz,
  ended_at          timestamptz,
  duration_sec      int
);

create index if not exists idx_call_events_agent on public.call_events(agent_user_id, started_at desc);
create index if not exists idx_call_events_3cx   on public.call_events(call_id_3cx);
create index if not exists idx_call_events_status on public.call_events(status, started_at desc);

-- RLS : un utilisateur ne voit que ses propres événements d'appel
alter table public.call_events enable row level security;
drop policy if exists "call_events_select_own" on public.call_events;
create policy "call_events_select_own" on public.call_events
  for select using (auth.uid() = agent_user_id);

drop policy if exists "call_events_service_all" on public.call_events;
create policy "call_events_service_all" on public.call_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Realtime
alter publication supabase_realtime add table public.call_events;

-- ─── 3. Settings applicatifs (secret 3CX) ───────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.app_settings enable row level security;

-- Lecture autorisée uniquement aux admins (rôle 'admin' dans profiles)
drop policy if exists "app_settings_admin_read" on public.app_settings;
create policy "app_settings_admin_read" on public.app_settings
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write" on public.app_settings
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Initialise le secret 3CX (à régénérer depuis l'admin Hub)
insert into public.app_settings (key, value)
values ('3cx_webhook_secret', encode(gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

-- ─── Vérification ───────────────────────────────────────────────────
select 'extension_3cx' as col, count(*) filter (where extension_3cx is not null) as renseigne
from public.profiles
union all
select 'call_events', count(*) from public.call_events
union all
select '3cx_secret', count(*) from public.app_settings where key = '3cx_webhook_secret';
