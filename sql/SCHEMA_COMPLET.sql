-- ════════════════════════════════════════════════════════════════════
-- SCHEMA_COMPLET.sql — Tables CŒUR non versionnées (reconstruites)
-- ════════════════════════════════════════════════════════════════════
-- Permet un redéploiement FROM SCRATCH du Hub sur un nouveau projet
-- Supabase. Ces tables existent dans la base en service mais n'étaient
-- définies par aucune migration du dépôt ; elles sont ici RECONSTRUITES
-- d'après l'usage du code (components/api.js, hub-data.js, etc.).
--
-- ⚠️ SOURCE DE VÉRITÉ = l'export du schéma RÉEL (cf. DEPLOIEMENT.md §1).
--    Ce fichier est une reconstruction best-effort : les types marqués
--    « ? incertain » sont déduits du code et peuvent différer du réel.
--    En cas de divergence, l'export pg_dump/Supabase fait foi.
--
-- À exécuter EN PREMIER (avant les migrations 20260615_*…). Les clés
-- étrangères vers des tables d'autres migrations (projects, project_items)
-- sont volontairement « soft » (colonne sans REFERENCES) pour éviter tout
-- couplage d'ordre — cohérent avec le reste du dépôt.
--
-- Idempotent : CREATE TABLE IF NOT EXISTS + RLS DROP/CREATE en fin.
-- ════════════════════════════════════════════════════════════════════


-- ── profiles — profil applicatif lié 1:1 à auth.users ───────────────
-- (créé par trigger Auth ; le code ne fait que lire / MAJ extension_3cx)
CREATE TABLE IF NOT EXISTS profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text,
  email          text,
  role           text,                   -- 'Super Admin', 'Direction', …
  team           text,                   -- ? incertain (libellé d'équipe libre)
  extension_3cx  text,
  status         text DEFAULT 'active',  -- 'active' / 'inactive'
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ── groups — groupes d'accès (RBAC) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           text PRIMARY KEY,         -- slug ('admin', 'supervision', …)
  name         text,
  color        text,
  description  text,
  access       jsonb DEFAULT '[]'::jsonb, -- ['crm','intel',…]  -- ? incertain (jsonb vs text[])
  created_at   timestamptz DEFAULT now()
);

-- ── profile_groups — jointure user ↔ groupe ─────────────────────────
CREATE TABLE IF NOT EXISTS profile_groups (
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    text NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, group_id)
);

-- ── app_settings — store clé/valeur (config 3CX, webhooks) ──────────
CREATE TABLE IF NOT EXISTS app_settings (
  key         text PRIMARY KEY,
  value       text,                      -- ? incertain (text vs jsonb)
  updated_at  timestamptz DEFAULT now()
);

-- ── clients — prospects + clients (schemaless via data jsonb) ───────
-- Colonnes réservées top-level (buildClientPatch) ; tout le reste → data.
CREATE TABLE IF NOT EXISTS clients (
  id            text PRIMARY KEY,        -- genId 'ACC-…'
  name          text,                    -- = raison_sociale
  industry      text,                    -- = secteur
  city          text,                    -- = ville
  website       text,                    -- = site_web
  status        text DEFAULT 'prospect', -- 'prospect' / 'client'
  owner         text,
  client_since  date,                    -- ? incertain (date vs text)
  data          jsonb DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  deleted_at    timestamptz
);

-- ── contacts — interlocuteurs d'un client ───────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id            text PRIMARY KEY,        -- genId 'CT-…'
  client_id     text REFERENCES clients(id) ON DELETE CASCADE,
  prenom        text,
  nom           text,
  fonction      text,
  email         text,
  phone         text,
  linkedin      text,
  is_principal  boolean DEFAULT false,
  roles         jsonb DEFAULT '[]'::jsonb,  -- ? incertain (jsonb vs text[])
  hierarchie    text,
  notes         text,
  data          jsonb DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

-- ── opportunities — pipeline commercial ─────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id          text PRIMARY KEY,          -- genId 'OPP-…'
  client_id   text REFERENCES clients(id) ON DELETE SET NULL,
  name        text,
  amount_eur  numeric(12,2) DEFAULT 0,
  stage       text DEFAULT 'qualif',     -- qualif, discovery, propo, nego, won, lost
  proba       integer DEFAULT 20,        -- 0-100
  close_date  date,
  owner       text,
  produit     text,
  modules     jsonb DEFAULT '[]'::jsonb, -- ? incertain (jsonb vs text[])
  type        text DEFAULT 'new',
  source      text,
  duration    text,                      -- ? incertain
  notes       text,
  data        jsonb DEFAULT '{}'::jsonb,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

-- ── actions — timeline d'actions (email/call/rdv/tâche/note) ────────
CREATE TABLE IF NOT EXISTS actions (
  id            text PRIMARY KEY,        -- genId 'EX-…'
  client_id     text REFERENCES clients(id) ON DELETE CASCADE,
  opp_id        text REFERENCES opportunities(id) ON DELETE SET NULL,
  type          text DEFAULT 'task',     -- email,call,rdv,visio,task,note,in,wait,stage
  title         text,
  meta          text,                    -- ? incertain
  due_text      text,                    -- texte libre (pas une date)
  priority      text DEFAULT 'moyenne',  -- haute, moyenne, basse, ai
  assigned_to   text,
  status        text DEFAULT 'todo',     -- todo, done, cancelled
  tag           text,
  tag_color     text,
  icon          text,
  completed_at  timestamptz,
  data          jsonb DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

-- ── contracts — contrats client ─────────────────────────────────────
-- id = uuid auto (la ref métier 'CTR-…' va dans data.ref).
CREATE TABLE IF NOT EXISTS contracts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    text REFERENCES clients(id) ON DELETE CASCADE,
  opp_id       text REFERENCES opportunities(id) ON DELETE SET NULL,
  name         text,
  status       text DEFAULT 'active',    -- active, expiring, expired, none
  tier         text,                     -- ? incertain
  start_date   date,
  end_date     date,
  monthly_eur  numeric(12,2),
  products     jsonb DEFAULT '[]'::jsonb,
  total_ht_y1  numeric(12,2),
  tcv          numeric(12,2),
  margin_pct   numeric,                  -- ? incertain
  notes        text,
  data         jsonb DEFAULT '{}'::jsonb,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz
);

-- ── contract_templates — modèles CGV (PDF Storage + métadonnées) ────
CREATE TABLE IF NOT EXISTS contract_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text,
  version      text DEFAULT 'v1.0',
  description  text,
  pdf_url      text,
  pdf_size_kb  integer,
  cgv_text     text,
  is_active    boolean DEFAULT true,
  is_default   boolean DEFAULT false,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz
);

-- ── tickets — helpdesk / hotline support ────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                text PRIMARY KEY,    -- 'REQ-…' / 'INC-…'
  client_id         text REFERENCES clients(id) ON DELETE SET NULL,
  title             text,
  description       text,
  category          text,
  status            text DEFAULT 'open', -- open, in_progress, waiting, resolved, closed
  priority          text DEFAULT 'normale', -- critique, haute, normale, basse
  lifecycle         text,                -- onboarding, offboarding, null
  billable          boolean DEFAULT false,
  billable_note     text,
  assignee_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assignee_team     text,
  escalated_at      timestamptz,
  escalated_to      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  escalated_reason  text,
  escalated_group   text,
  sla_due_at        timestamptz,
  opened_at         timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  closed_at         timestamptz
);

-- ── comments — commentaires/notes sur un ticket ─────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     text REFERENCES tickets(id) ON DELETE CASCADE,
  author_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name   text,
  author_email  text,
  body          text,
  kind          text DEFAULT 'note',     -- note (interne), reply (visible client)
  created_at    timestamptz DEFAULT now()
);

-- ── calls — journal d'appels 3CX ────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_name    text,
  caller_phone   text,
  duration_sec   integer,
  direction      text,                   -- inbound / outbound
  status         text,                   -- completed, …
  started_at     timestamptz,
  ended_at       timestamptz,
  ticket_id      text REFERENCES tickets(id) ON DELETE SET NULL,
  recording_url  text,
  line           text,
  category       text,
  created_at     timestamptz DEFAULT now()
);

-- ── call_transcripts — transcriptions liées à un appel ──────────────
CREATE TABLE IF NOT EXISTS call_transcripts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid REFERENCES calls(id) ON DELETE CASCADE,
  ticket_id     text REFERENCES tickets(id) ON DELETE SET NULL,
  source        text DEFAULT 'manual',
  text          text,
  duration_sec  integer,
  language      text DEFAULT 'fr',
  created_at    timestamptz DEFAULT now()
);

-- ── delivery_notes — bons de livraison (BL) ─────────────────────────
-- id = number 'BL-<année>-<seq>'. project_id : FK logique « soft » vers
-- projects(id) (table créée par 20260615_projects.sql).
CREATE TABLE IF NOT EXISTS delivery_notes (
  id                text PRIMARY KEY,    -- = number 'BL-2026-0001'
  number            text,
  project_id        text,                -- FK logique soft → projects(id)
  client_id         text REFERENCES clients(id) ON DELETE SET NULL,
  status            text DEFAULT 'draft',-- draft, sent, signed, refused, cancelled
  delivery_date     date,
  delivery_address  text,
  delivery_contact  text,
  signed_at         timestamptz,
  signed_by_name    text,
  signed_by_role    text,
  signature_url     text,
  data              jsonb DEFAULT '{}'::jsonb,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  deleted_at        timestamptz
);

-- ── delivery_note_items — lignes d'un BL ────────────────────────────
-- project_item_id : FK logique « soft » vers project_items(id).
CREATE TABLE IF NOT EXISTS delivery_note_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id  text REFERENCES delivery_notes(id) ON DELETE CASCADE,
  project_item_id   text,               -- FK logique soft → project_items(id)
  designation       text,
  quantity          numeric,            -- ? incertain (numeric vs integer)
  unit              text DEFAULT 'u',
  serial_numbers    text,               -- ? incertain (text vs jsonb)
  verified          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ── notifications — notifications in-app (cloche) ───────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,  -- null = broadcast
  type          text DEFAULT 'info',
  title         text,
  body          text,
  link          text,
  severity      text DEFAULT 'info',     -- info, success, error
  payload       jsonb DEFAULT '{}'::jsonb,
  read_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- NB : la vue v_article_counters n'est PAS ici — elle est définie dans
-- sql/20260618_assets.sql (elle dépend de commercial_articles + assets).


-- ════════════════════════════════════════════════════════════════════
-- RLS — sécurisé par défaut : tout accès exige un user authentifié.
-- (À durcir par tenant/groupe ultérieurement. Cohérent avec le reste
--  du schéma : policy nommée <table>_authenticated_all.)
-- ════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles','groups','profile_groups','app_settings','clients','contacts',
    'opportunities','actions','contracts','contract_templates','tickets',
    'comments','calls','call_transcripts','delivery_notes','delivery_note_items',
    'notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_authenticated_all', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t || '_authenticated_all', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
  RAISE NOTICE '✓ RLS authentifiée activée sur les % tables cœur', array_length(tables,1);
END $$;
