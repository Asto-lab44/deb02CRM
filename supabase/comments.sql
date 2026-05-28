-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Table comments (fil de conversation des tickets)
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor, APRÈS schema.sql.
--
-- Stocke les messages (réponses client + notes internes) postés depuis
-- la fiche ticket. Realtime activé pour qu'un agent voie en direct ce
-- qu'un autre poste.
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

-- RLS
alter table public.comments enable row level security;

drop policy if exists "authenticated_read" on public.comments;
create policy "authenticated_read" on public.comments for select to authenticated using (true);

drop policy if exists "authenticated_write" on public.comments;
create policy "authenticated_write" on public.comments for all to authenticated using (true) with check (true);

-- Variante anon (mode démo — à RETIRER en prod)
drop policy if exists "anon_read" on public.comments;
create policy "anon_read" on public.comments for select to anon using (true);

drop policy if exists "anon_write" on public.comments;
create policy "anon_write" on public.comments for all to anon using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.comments;

-- Vérif :
--   select count(*) from public.comments;
