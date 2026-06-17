-- ════════════════════════════════════════════════════════════════════
-- Migration : Intelligence Concurrentielle — leasing_contracts + warranties
-- ════════════════════════════════════════════════════════════════════
-- Tables nécessaires pour l'import LOCAM / GRENKE et les garanties matériel
-- qui alimentent /intelligence-concurrentielle (rappels d'échéances).
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. TABLE leasing_contracts (LOCAM, GRENKE, FRANFINANCE…)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leasing_contracts (
  id                   text PRIMARY KEY,                  -- LEA-{ts}{rand}
  bailleur             text NOT NULL,                     -- LOCAM | GRENKE | FRANFINANCE…
  ref_contrat          text,                              -- N° Dossier LOCAM / Contract No. GRENKE
  client_id            text,
  client_siren         text,
  client_name          text,
  designation          text,                              -- Bien financé / sublessee
  montant_ht           numeric(14,2),                     -- Montant financé HT
  montant_loyer_ttc    numeric(14,2),                     -- Loyer TTC ou Instalment
  periodicite          text,                              -- mensuelle / trimestrielle / annuelle
  nb_loyers            integer,
  date_debut           date,                              -- 1ère échéance / Start
  date_fin             date,                              -- Dernière échéance / End
  status               text DEFAULT 'actif',              -- actif | tacite | termine | resilie
  commercial           text,
  notes                text,
  data                 jsonb DEFAULT '{}'::jsonb,         -- toutes les colonnes natives du bailleur
  created_by           uuid,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz,
  deleted_at           timestamptz
);

-- Index pour les requêtes d'Intelligence Concurrentielle
CREATE INDEX IF NOT EXISTS idx_leasing_date_fin   ON leasing_contracts(date_fin);
CREATE INDEX IF NOT EXISTS idx_leasing_bailleur   ON leasing_contracts(bailleur);
CREATE INDEX IF NOT EXISTS idx_leasing_status     ON leasing_contracts(status);
CREATE INDEX IF NOT EXISTS idx_leasing_client     ON leasing_contracts(client_id);
-- Déduplication (bailleur, ref_contrat) → un seul contrat par couple
CREATE UNIQUE INDEX IF NOT EXISTS uniq_leasing_bailleur_ref
  ON leasing_contracts(bailleur, ref_contrat)
  WHERE deleted_at IS NULL AND ref_contrat IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. TABLE warranties (garanties matériel)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warranties (
  id                   text PRIMARY KEY,                  -- WAR-{ts}{rand}
  client_id            text,
  client_name          text,
  manufacturer         text,                              -- HP, Dell, Lenovo, Synology…
  model                text,
  type                 text DEFAULT 'serveur',            -- serveur | poste | NAS | switch…
  garantie_type        text,                              -- standard | NBD | 4H | premier care
  serial_number        text,
  date_debut           date,
  date_fin             date,                              -- date d'expiration de garantie
  status               text DEFAULT 'actif',              -- actif | expiree | renouvelee
  commercial           text,
  notes                text,
  data                 jsonb DEFAULT '{}'::jsonb,
  created_by           uuid,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz,
  deleted_at           timestamptz
);

CREATE INDEX IF NOT EXISTS idx_warranties_date_fin ON warranties(date_fin);
CREATE INDEX IF NOT EXISTS idx_warranties_client   ON warranties(client_id);
CREATE INDEX IF NOT EXISTS idx_warranties_status   ON warranties(status);

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — accès pour les utilisateurs authentifiés
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE leasing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leasing_contracts_all_authenticated" ON leasing_contracts;
CREATE POLICY "leasing_contracts_all_authenticated"
  ON leasing_contracts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "warranties_all_authenticated" ON warranties;
CREATE POLICY "warranties_all_authenticated"
  ON warranties FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
