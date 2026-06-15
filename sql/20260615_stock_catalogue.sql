-- ════════════════════════════════════════════════════════════════════
-- Migration : Stock & Catalogue — Achats hebdomadaires
-- Inspirée du tableau Monday "1.0 - Achat hebdomadaire"
-- ════════════════════════════════════════════════════════════════════
-- Étend commercial_doc_lines avec les colonnes nécessaires pour gérer
-- le cycle d'achat fournisseur sur chaque ligne d'un devis/commande.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS commercial_doc_lines pour gestion achat
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='commercial_doc_lines') THEN
    -- Fournisseur retenu pour acheter cet article
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS supplier text';
    -- Référence fournisseur (code article chez le fournisseur)
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS supplier_ref text';
    -- Prix d'achat unitaire HT (différent de unit_price_ht qui est le prix de vente)
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS purchase_price_ht numeric(12,4)';
    -- Statut achat : panier / demande / commandé / reçu
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS purchase_status text DEFAULT ''panier''';
    -- Statut réception : en_cours / ok / bloque / en_stock / partielle / na / differe
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS reception_status text DEFAULT ''en_cours''';
    -- Date de réception effective
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS received_at timestamptz';
    -- N° de série pour suivi
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS serial_number text';
    -- Date d'achat planifiée (semaine d'achat)
    EXECUTE 'ALTER TABLE commercial_doc_lines ADD COLUMN IF NOT EXISTS purchase_date date';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Table catalogue des fournisseurs (référentiel)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id              text PRIMARY KEY,                       -- SUP-{ts}{rand}
  name            text NOT NULL UNIQUE,
  category        text,                                   -- Distributeur / Logiciel / SaaS / Matériel
  email           text,
  tel             text,
  website         text,
  contact_name    text,
  delivery_days   integer DEFAULT 5,                       -- délai moyen de livraison
  payment_terms   text,                                    -- 30j fin de mois, à réception, etc.
  notes           text,
  active          boolean DEFAULT true,
  data            jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active) WHERE active;
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- ─────────────────────────────────────────────────────────────────
-- 3. Seed des fournisseurs depuis le tableau Monday
-- ─────────────────────────────────────────────────────────────────
INSERT INTO suppliers(id, name, category) VALUES
  ('SUP-SENETIC',    'SENETIC',         'Distributeur'),
  ('SUP-OVH',        'OVH',             'Hébergement'),
  ('SUP-AMAZON',     'AMAZON',          'Distributeur'),
  ('SUP-ACTUAL',     'ACTUAL SYSTEM',   'Distributeur'),
  ('SUP-WITHSEC',    'WITHSECURE',      'Sécurité'),
  ('SUP-EDOX',       'EDOX',            'Distributeur'),
  ('SUP-ONEDIRECT',  'ONEDIRECT',       'Téléphonie'),
  ('SUP-GLOBALSIGN', 'GLOBALSIGN',      'Sécurité'),
  ('SUP-INMAC',      'INMAC',           'Distributeur'),
  ('SUP-BECLOUD',    'BE-CLOUD',        'Cloud'),
  ('SUP-FACTORIAL',  'FACTORIAL',       'SaaS'),
  ('SUP-UNYC',       'UNYC',            'Téléphonie'),
  ('SUP-CIDIT',      'CID-IT',          'Distributeur'),
  ('SUP-PC21',       'PC21',            'Distributeur'),
  ('SUP-WATESOFT',   'WATESOFT',        'Logiciel'),
  ('SUP-GRENKE',     'GRENKE',          'Leasing'),
  ('SUP-LOCAM',      'LOCAM',           'Leasing'),
  ('SUP-INGRAM',     'INGRAM',          'Distributeur'),
  ('SUP-TDSYNNEX',   'TD SYNNEX',       'Distributeur'),
  ('SUP-MAILINBLACK','MAILINBLACK',     'Sécurité'),
  ('SUP-SAGE',       'SAGE',            'Logiciel'),
  ('SUP-ESET',       'ESET',            'Sécurité'),
  ('SUP-3CX',        '3CX',             'Téléphonie'),
  ('SUP-EBP',        'EBP',             'Logiciel'),
  ('SUP-AUTODESK',   'AUTODESK',        'Logiciel'),
  ('SUP-FOXIT',      'FOXIT',           'Logiciel'),
  ('SUP-LDLC',       'LDLC PRO',        'Distributeur'),
  ('SUP-LENOVO',     'LENOVO',          'Constructeur'),
  ('SUP-HP',         'HP',              'Constructeur'),
  ('SUP-DEXXON',     'DEXXON',          'Distributeur'),
  ('SUP-RENEWTECH',  'Renewtech',       'Reconditionné'),
  ('SUP-COLISSIMO',  'COLISSIMO',       'Logistique'),
  ('SUP-ASTORYA',    'ASTORYA',         'Interne'),
  ('SUP-STOCK',      'EN STOCK',        'Interne')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_all_suppliers ON suppliers;
CREATE POLICY auth_all_suppliers ON suppliers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 5. VUE matérialisée des achats hebdomadaires (lignes à acheter
--    extraites des devis acceptés/transformés)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_purchase_matrix AS
SELECT
  l.id AS line_id,
  l.doc_id,
  d.id AS doc_ref,
  d.type AS doc_type,
  d.status AS doc_status,
  d.client_name,
  d.doc_date,
  COALESCE(l.purchase_date, d.doc_date) AS purchase_date,
  -- Semaine ISO d'achat
  date_part('week', COALESCE(l.purchase_date, d.doc_date)) AS week_number,
  date_part('year', COALESCE(l.purchase_date, d.doc_date)) AS year_number,
  l.position,
  l.ref,
  l.designation,
  l.description,
  l.quantity,
  l.unit,
  l.unit_price_ht AS sell_price_ht,
  l.purchase_price_ht,
  l.tva_rate,
  l.supplier,
  l.supplier_ref,
  l.purchase_status,
  l.reception_status,
  l.received_at,
  l.serial_number,
  -- Calculs
  (l.quantity * COALESCE(l.purchase_price_ht, 0)) AS total_purchase_ht,
  (l.quantity * COALESCE(l.unit_price_ht, 0)) AS total_sell_ht,
  CASE
    WHEN COALESCE(l.purchase_price_ht, 0) > 0
    THEN ROUND(((l.unit_price_ht - l.purchase_price_ht) / l.purchase_price_ht * 100)::numeric, 2)
    ELSE NULL
  END AS margin_pct
FROM commercial_doc_lines l
JOIN commercial_docs d ON d.id = l.doc_id
WHERE d.deleted_at IS NULL
  AND d.type IN ('devis', 'commande')
  AND d.status IN ('accepte', 'transforme', 'envoye')
  AND NOT l.is_text_only;

-- ═══════════════════════════════════════════════════════════════════
-- Vérification
-- SELECT count(*) FROM suppliers;          -- doit retourner 34
-- SELECT count(*) FROM v_purchase_matrix;
-- ═══════════════════════════════════════════════════════════════════
