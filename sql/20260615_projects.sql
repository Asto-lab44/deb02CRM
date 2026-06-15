-- ════════════════════════════════════════════════════════════════════
-- Migration : Projects & Livrables (kanban 7 stages)
-- Workflow : recu → preparation → pret_livrer
--           → livre → installe → clos
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor.
-- Idempotente (rejouable).
-- Pré-requis : aucun (les FK vers clients/opportunities sont en text plain
--   pour éviter les contraintes croisées).
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. TABLE projects
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              text PRIMARY KEY,                       -- PRJ-{ts}{rand}
  name            text NOT NULL,
  description     text,
  stage           text NOT NULL DEFAULT 'recu',           -- recu/preparation/pret_livrer/livre/installe/clos
  status          text DEFAULT 'active',                  -- active/archived

  -- Lien vers CRM (text plain, pas de FK pour ne pas bloquer)
  client_id       text,
  client_name     text,
  opportunity_id  text,
  sage_ref        text,                                   -- réf commande Sage

  -- Chef de projet
  pm_id           uuid REFERENCES auth.users(id),
  pm_name         text,

  -- Montants
  amount_ht       numeric(14,2),
  amount_ttc      numeric(14,2),

  -- Échéances
  delivery_due    date,
  delivered_at    timestamptz,
  installed_at    timestamptz,
  closed_at       timestamptz,

  data            jsonb DEFAULT '{}'::jsonb,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_projects_stage   ON projects(stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_client  ON projects(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_opp     ON projects(opportunity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_pm      ON projects(pm_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. project_items — postes / produits / matos lié au projet
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_items (
  id              text PRIMARY KEY,
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position        integer DEFAULT 0,
  ref             text,
  designation     text NOT NULL,
  quantity        numeric(12,3) DEFAULT 1,
  unit            text DEFAULT 'u',
  unit_price_ht   numeric(12,4) DEFAULT 0,
  status          text DEFAULT 'pending',                 -- pending/ordered/received/installed
  data            jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_items_proj ON project_items(project_id, position);

-- ─────────────────────────────────────────────────────────────────
-- 3. project_team — équipe affectée au projet (multi-membre)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_team (
  id              text PRIMARY KEY,
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id      uuid REFERENCES auth.users(id),
  role            text DEFAULT 'member',                  -- pm/lead/member/observer
  created_at      timestamptz DEFAULT now(),
  UNIQUE(project_id, profile_id)
);

-- ─────────────────────────────────────────────────────────────────
-- 4. project_events — timeline (création, changement stage, livraison…)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_events (
  id              text PRIMARY KEY DEFAULT 'PEVT-' || extract(epoch from now())::bigint || substr(md5(random()::text), 0, 7),
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type            text NOT NULL,                          -- created/stage_change/comment/file_upload/delivery/installation/closed
  payload         jsonb DEFAULT '{}'::jsonb,
  author_id       uuid REFERENCES auth.users(id),
  author_name     text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_events_proj ON project_events(project_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- 5. RLS — auth requise partout
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_all_projects        ON projects;
DROP POLICY IF EXISTS auth_all_project_items   ON project_items;
DROP POLICY IF EXISTS auth_all_project_team    ON project_team;
DROP POLICY IF EXISTS auth_all_project_events  ON project_events;

CREATE POLICY auth_all_projects       ON projects       FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_project_items  ON project_items  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_project_team   ON project_team   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_project_events ON project_events FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════
-- Vérifier :
-- SELECT count(*) FROM projects;
-- ═══════════════════════════════════════════════════════════════════
