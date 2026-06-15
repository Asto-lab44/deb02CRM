-- ════════════════════════════════════════════════════════════════════
-- Migration : Intelligence concurrentielle — Tâches & échéances
-- ════════════════════════════════════════════════════════════════════
-- 3 sources de tâches commerciales à anticiper :
-- 1. Leasing : fin de contrats Locam / Grenke (interne Astorya, à racheter)
-- 2. Garanties : fin de garantie constructeur serveur (CMDB interne)
-- 3. Concurrents : date d'anniversaire / fin de contrat concurrent
--    (depuis les opportunités CRM avec concurrent renseigné)
-- ════════════════════════════════════════════════════════════════════
-- Tables 1 & 2 créées ici. Source 3 = vue sur opportunities (rien à créer).
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. LEASING CONTRACTS — locam / grenke / bnp / etc.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leasing_contracts (
  id              text PRIMARY KEY,                       -- LEA-{ts}{rand}
  bailleur        text NOT NULL,                          -- 'Locam' | 'Grenke' | 'BNP Lease' | autre
  ref_contrat     text,                                   -- N° contrat bailleur
  client_id       text,                                   -- ref clients(id) en text plain (pas de FK)
  client_name     text NOT NULL,                          -- snapshot

  -- Matériel financé
  designation     text,                                   -- "Serveur Dell PowerEdge T440 + 5 PC HP"
  montant_ht      numeric(14,2),                          -- montant total financé
  duree_mois      integer DEFAULT 36,                     -- durée du leasing en mois

  -- Dates
  date_debut      date,
  date_fin        date NOT NULL,                          -- date d'échéance — critère principal
  loyer_mensuel   numeric(12,2),

  -- Suivi commercial
  status          text DEFAULT 'actif',                   -- actif | termine | rachat | annule
  commercial      text,                                   -- nom commercial Astorya en charge
  notes           text,
  data            jsonb DEFAULT '{}'::jsonb,

  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_leasing_date_fin   ON leasing_contracts(date_fin) WHERE deleted_at IS NULL AND status = 'actif';
CREATE INDEX IF NOT EXISTS idx_leasing_bailleur   ON leasing_contracts(bailleur) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leasing_client     ON leasing_contracts(client_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. WARRANTIES — garanties constructeur (CMDB serveur/matériel)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warranties (
  id              text PRIMARY KEY,                       -- WAR-{ts}{rand}
  type            text NOT NULL DEFAULT 'serveur',        -- serveur | switch | poste | onduleur | autre
  manufacturer    text NOT NULL,                          -- Dell, HP, Lenovo, Cisco, APC…
  model           text,                                   -- "PowerEdge T440"
  serial_number   text,                                   -- N° série

  client_id       text,
  client_name     text NOT NULL,

  -- Couverture
  garantie_type   text DEFAULT 'standard',                -- standard | premium | next_business_day | 4h
  date_achat      date,
  date_fin        date NOT NULL,                          -- échéance garantie

  -- Suivi
  status          text DEFAULT 'actif',                   -- actif | expire | renouvele
  contrat_renouvele_id text,                              -- ref vers prochaine garantie (FK ignorée)
  commercial      text,
  notes           text,
  data            jsonb DEFAULT '{}'::jsonb,

  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_warranties_date_fin    ON warranties(date_fin) WHERE deleted_at IS NULL AND status = 'actif';
CREATE INDEX IF NOT EXISTS idx_warranties_manufacturer ON warranties(manufacturer) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warranties_client      ON warranties(client_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — auth requise partout
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE leasing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_all_leasing    ON leasing_contracts;
DROP POLICY IF EXISTS auth_all_warranties ON warranties;

CREATE POLICY auth_all_leasing    ON leasing_contracts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_warranties ON warranties        FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════
-- Vérifier :
-- SELECT count(*) FROM leasing_contracts;
-- SELECT count(*) FROM warranties;
-- ═══════════════════════════════════════════════════════════════════
