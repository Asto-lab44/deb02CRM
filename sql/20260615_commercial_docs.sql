-- ════════════════════════════════════════════════════════════════════
-- Migration : Gestion Commerciale (Devis / Commande / BL / Facture)
-- Inspirée de Sage 50c Gestion Commerciale
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor (projet cqdgecllzyqimfuovrpp).
-- Idempotent : peut être rejouée sans casser l'existant.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. TABLE PRINCIPALE : commercial_docs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_docs (
  id              text PRIMARY KEY,                        -- DEV-2026-0001, BC-…, BL-…, FAC-…
  type            text NOT NULL CHECK (type IN ('devis','commande','bl','facture','avoir')),
  status          text NOT NULL DEFAULT 'brouillon',       -- brouillon/envoye/accepte/refuse/transforme/livre/facture/paye/annule
  number_year     integer NOT NULL,
  number_seq      integer NOT NULL,

  -- Client (snapshot pour traçabilité même si client modifié après)
  client_id       text REFERENCES clients(id),
  client_name     text,
  client_address  text,
  client_cp       text,
  client_city     text,
  client_siren    text,
  client_tva      text,
  contact_name    text,
  contact_email   text,

  -- Liens optionnels vers le reste du Hub
  project_id      text REFERENCES projects(id),
  opportunity_id  text REFERENCES opportunities(id),
  parent_doc_id   text REFERENCES commercial_docs(id),     -- chaînage Devis → Commande → BL → Facture

  -- Dates
  doc_date        date NOT NULL DEFAULT CURRENT_DATE,
  valid_until     date,                                    -- devis
  delivered_at    timestamptz,                             -- BL
  payment_due     date,                                    -- facture
  paid_at         timestamptz,                             -- facture

  -- Montants (calculés depuis les lignes via trigger / app code)
  total_ht        numeric(14,2) DEFAULT 0,
  total_tva       numeric(14,2) DEFAULT 0,
  total_ttc       numeric(14,2) DEFAULT 0,
  discount_pct    numeric(5,2) DEFAULT 0,

  -- Métadonnées
  title           text,                                    -- "Devis migration AD AXA"
  notes           text,                                    -- commentaires imprimés
  internal_notes  text,                                    -- notes internes (non imprimées)
  payment_terms_id text,                                   -- ref vers commercial_payment_terms
  owner           text,                                    -- nom commercial
  data            jsonb DEFAULT '{}'::jsonb,

  -- Audit / soft-delete
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz,

  UNIQUE(type, number_year, number_seq)
);

CREATE INDEX IF NOT EXISTS idx_cdocs_type_status ON commercial_docs(type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cdocs_client      ON commercial_docs(client_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cdocs_project     ON commercial_docs(project_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cdocs_opp         ON commercial_docs(opportunity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cdocs_parent      ON commercial_docs(parent_doc_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cdocs_date        ON commercial_docs(doc_date DESC) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. LIGNES DES DOCUMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_doc_lines (
  id              text PRIMARY KEY,
  doc_id          text NOT NULL REFERENCES commercial_docs(id) ON DELETE CASCADE,
  position        integer NOT NULL DEFAULT 0,

  article_id      text,                                    -- réf catalogue commercial_articles
  ref             text,                                    -- code article (snapshot)
  designation     text NOT NULL,
  description     text,

  quantity        numeric(12,3) NOT NULL DEFAULT 1,
  unit            text DEFAULT 'u',                        -- u, h, j, mois, an
  unit_price_ht   numeric(12,4) NOT NULL DEFAULT 0,
  discount_pct    numeric(5,2) DEFAULT 0,
  tva_rate        numeric(5,2) DEFAULT 20.00,

  total_ht        numeric(14,2) DEFAULT 0,                 -- = qty * unit_price * (1 - disc/100)
  total_tva       numeric(14,2) DEFAULT 0,                 -- = total_ht * tva_rate/100
  total_ttc       numeric(14,2) DEFAULT 0,                 -- = total_ht + total_tva

  is_text_only    boolean DEFAULT false,                   -- ligne purement textuelle (séparateur)
  data            jsonb DEFAULT '{}'::jsonb,

  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdoc_lines_doc ON commercial_doc_lines(doc_id, position);

-- ─────────────────────────────────────────────────────────────────
-- 3. COMPTEURS AUTO-NUMÉROTATION (par type + année)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_doc_counters (
  type            text NOT NULL,
  year            integer NOT NULL,
  next_seq        integer NOT NULL DEFAULT 1,
  PRIMARY KEY (type, year)
);

-- RPC : alloue le prochain numéro et incrémente atomiquement
CREATE OR REPLACE FUNCTION commercial_next_doc_number(p_type text)
RETURNS table(out_year integer, out_seq integer)
LANGUAGE plpgsql AS $$
DECLARE
  cur_year integer := EXTRACT(year FROM CURRENT_DATE)::integer;
  new_seq  integer;
BEGIN
  LOOP
    UPDATE commercial_doc_counters
       SET next_seq = next_seq + 1
     WHERE type = p_type AND year = cur_year
     RETURNING next_seq - 1 INTO new_seq;
    EXIT WHEN FOUND;
    BEGIN
      INSERT INTO commercial_doc_counters(type, year, next_seq) VALUES (p_type, cur_year, 2);
      new_seq := 1;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Concurrence : on re-tente l'UPDATE
    END;
  END LOOP;
  RETURN QUERY SELECT cur_year, new_seq;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 4. CATALOGUE ARTICLES / SERVICES (admin)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_articles (
  id              text PRIMARY KEY,
  ref             text UNIQUE NOT NULL,                    -- code Sage (ex: AST-SUITE-USR)
  name            text NOT NULL,
  description     text,
  category        text,                                    -- "Suite", "Cyber", "Hub", "Service", "Matériel"
  unit            text DEFAULT 'u',
  price_ht        numeric(12,4) NOT NULL DEFAULT 0,
  tva_rate        numeric(5,2) DEFAULT 20.00,
  is_service      boolean DEFAULT true,
  is_recurring    boolean DEFAULT false,                   -- abonnement mensuel/annuel
  cost_ht         numeric(12,4),                           -- coût d'achat (marge)
  active          boolean DEFAULT true,
  data            jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carticles_category ON commercial_articles(category) WHERE active;

-- ─────────────────────────────────────────────────────────────────
-- 5. TAUX TVA (référentiel admin)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_tva_rates (
  rate            numeric(5,2) PRIMARY KEY,
  label           text NOT NULL,
  active          boolean DEFAULT true
);

INSERT INTO commercial_tva_rates(rate, label) VALUES
  (20.00, 'Taux normal'),
  (10.00, 'Taux intermédiaire'),
  (5.50,  'Taux réduit'),
  (2.10,  'Taux super réduit'),
  (0.00,  'Exonéré / hors TVA')
ON CONFLICT (rate) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 6. CONDITIONS DE PAIEMENT (référentiel admin)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_payment_terms (
  id              text PRIMARY KEY,
  label           text NOT NULL,
  days            integer DEFAULT 0,
  end_of_month    boolean DEFAULT false,
  active          boolean DEFAULT true
);

INSERT INTO commercial_payment_terms(id, label, days, end_of_month) VALUES
  ('rcpt',  'À réception',                0, false),
  ('net30', '30 jours net',               30, false),
  ('net45', '45 jours net',               45, false),
  ('net60', '60 jours net',               60, false),
  ('eom30', '30 jours fin de mois',       30, true),
  ('eom45', '45 jours fin de mois',       45, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 7. RLS — toutes les tables (auth requise pour tout)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE commercial_docs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_doc_lines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_doc_counters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_tva_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_payment_terms  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_all_docs       ON commercial_docs;
DROP POLICY IF EXISTS auth_all_lines      ON commercial_doc_lines;
DROP POLICY IF EXISTS auth_all_counters   ON commercial_doc_counters;
DROP POLICY IF EXISTS auth_all_articles   ON commercial_articles;
DROP POLICY IF EXISTS auth_read_tva       ON commercial_tva_rates;
DROP POLICY IF EXISTS auth_read_pterms    ON commercial_payment_terms;

CREATE POLICY auth_all_docs       ON commercial_docs           FOR ALL    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_lines      ON commercial_doc_lines      FOR ALL    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_counters   ON commercial_doc_counters   FOR ALL    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_all_articles   ON commercial_articles       FOR ALL    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_read_tva       ON commercial_tva_rates      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY auth_read_pterms    ON commercial_payment_terms  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 8. Compat — ajout opportunity_id sur projects pour le lien CRM
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS opportunity_id text REFERENCES opportunities(id);
CREATE INDEX IF NOT EXISTS idx_projects_opp ON projects(opportunity_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 9. Catalogue d'articles seed (Astorya)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO commercial_articles(id, ref, name, category, unit, price_ht, tva_rate, is_service, is_recurring) VALUES
  ('ART-001', 'AST-SUITE-USR', 'Astorya Suite — Licence utilisateur',     'Suite',   'u',    35.00, 20.00, true, true),
  ('ART-002', 'AST-CYBER-USR', 'Astorya Cyber — Licence utilisateur',     'Cyber',   'u',    18.00, 20.00, true, true),
  ('ART-003', 'AST-HUB-USR',   'Astorya Hub — Licence utilisateur',       'Hub',     'u',    12.00, 20.00, true, true),
  ('ART-004', 'AST-SETUP',     'Mise en service / setup initial',         'Service', 'forfait', 1500.00, 20.00, true, false),
  ('ART-005', 'AST-FORMATION', 'Formation utilisateur (1 journée)',       'Service', 'j',    850.00, 20.00, true, false),
  ('ART-006', 'AST-SUPPORT',   'Support premium (forfait mensuel)',       'Service', 'mois', 250.00, 20.00, true, true),
  ('ART-007', 'AST-MIGR',      'Migration de données',                    'Service', 'forfait', 2500.00, 20.00, true, false)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- Migration terminée. Vérifier avec :
-- SELECT count(*) FROM commercial_docs;
-- SELECT count(*) FROM commercial_articles;
-- SELECT * FROM commercial_tva_rates;
-- ═══════════════════════════════════════════════════════════════════
