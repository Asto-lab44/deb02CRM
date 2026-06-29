-- ════════════════════════════════════════════════════════════════════
-- inbound_requests — demandes de devis entrantes par email (devis@astorya.fr)
-- ════════════════════════════════════════════════════════════════════
-- Chaque email reçu sur l'adresse dédiée crée une entrée ici + une tâche
-- « 📋 Devis à faire » dans la table actions. L'IA extrait le besoin, les
-- produits mentionnés et l'urgence. Le client est matché par domaine/email.
-- ════════════════════════════════════════════════════════════════════

create table if not exists inbound_requests (
  id              text primary key,
  -- Email source
  from_name       text,
  from_email      text not null,
  to_email        text,
  subject         text,
  body_text       text,
  body_excerpt    text,                    -- 280 premiers caractères pour l'aperçu
  received_at     timestamptz not null default now(),
  has_attachments boolean default false,
  attachments     jsonb default '[]'::jsonb,
  -- Matching client
  client_id       text,                    -- null si non identifié
  contact_id      uuid,
  match_method    text,                    -- 'email_exact' | 'domain' | 'fuzzy_name' | 'none'
  needs_identification boolean default false,
  -- Extraction IA
  ai_summary      text,                    -- résumé 1 ligne du besoin
  ai_products     jsonb default '[]'::jsonb, -- produits/services détectés
  ai_urgency      text,                    -- 'haute' | 'moyenne' | 'basse'
  ai_amount_hint  text,                    -- montant évoqué si présent
  ai_raw          jsonb,                   -- réponse brute IA pour debug
  -- Workflow
  status          text not null default 'a_traiter', -- a_traiter | client_identifie | devis_cree | ignore
  action_id       text,                    -- lien vers l'action créée
  devis_id        text,                    -- lien vers le devis créé (si fait)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists inbound_requests_status_idx on inbound_requests(status);
create index if not exists inbound_requests_client_idx on inbound_requests(client_id);
create index if not exists inbound_requests_received_idx on inbound_requests(received_at desc);

alter table inbound_requests enable row level security;

-- Lecture/écriture pour tous les utilisateurs authentifiés (file partagée)
create policy inbound_requests_read on inbound_requests for select using (auth.uid() is not null);
create policy inbound_requests_write on inbound_requests for insert with check (auth.uid() is not null);
create policy inbound_requests_update on inbound_requests for update using (auth.uid() is not null);
create policy inbound_requests_delete on inbound_requests for delete using (auth.uid() is not null);

-- L'Edge Function utilise service_role → bypass RLS pour insérer les emails
-- entrants même hors session utilisateur.
