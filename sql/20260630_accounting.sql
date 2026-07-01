-- ════════════════════════════════════════════════════════════════════
-- 20260630_accounting.sql — Module COMPTABILITÉ (plan comptable, journaux,
-- écritures en partie double) + base de l'export FEC.
-- ════════════════════════════════════════════════════════════════════
-- Modèle simplifié mais conforme :
--   • accounting_accounts  — plan comptable (n° de compte + libellé)
--   • accounting_journals  — journaux (VE ventes, AC achats, BQ banque, OD…)
--   • accounting_entries   — écritures ÉQUILIBRÉES (débit = crédit). Les lignes
--     de l'écriture sont stockées dans data.lines (jsonb) — cohérent avec le
--     pattern jsonb du Hub, et suffisant pour Grand livre / Balance / FEC
--     (calculés côté application).
--
-- Une ligne de data.lines = { account_id, account_label, aux_num, aux_label,
--   label, debit, credit, lettrage, lettrage_date }
--
-- Idempotent (IF NOT EXISTS). RLS : utilisateur authentifié requis.
-- ════════════════════════════════════════════════════════════════════

-- ── Plan comptable ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_accounts (
  id          text PRIMARY KEY,            -- n° de compte, ex « 411000 »
  label       text NOT NULL,
  kind        text,                        -- client / vente / tva / banque / caisse / general
  created_at  timestamptz DEFAULT now()
);

-- ── Journaux ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_journals (
  code        text PRIMARY KEY,            -- VE / AC / BQ / OD / CA
  label       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── Écritures (partie double) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_entries (
  id            text PRIMARY KEY,          -- genId « ECR-… »
  num           integer,                   -- n° d'écriture séquentiel (FEC EcritureNum)
  journal_code  text NOT NULL REFERENCES accounting_journals(code),
  entry_date    date NOT NULL,
  label         text,
  piece_ref     text,                      -- réf. de la pièce (ex. FAC-2026-0007)
  piece_date    date,
  source_doc_id text,                      -- commercial_docs.id (idempotence)
  source_kind   text,                      -- facture / avoir / reglement / manual
  total_debit   numeric(14,2) DEFAULT 0,
  total_credit  numeric(14,2) DEFAULT 0,
  validated_at  timestamptz,               -- FEC ValidDate
  data          jsonb DEFAULT '{}'::jsonb, -- { lines: [...] }
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acct_entries_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_acct_entries_src  ON accounting_entries(source_doc_id);

-- ── Seed : journaux par défaut ──────────────────────────────────────
INSERT INTO accounting_journals (code, label) VALUES
  ('VE', 'Ventes'),
  ('AC', 'Achats'),
  ('BQ', 'Banque'),
  ('CA', 'Caisse'),
  ('OD', 'Opérations diverses')
ON CONFLICT (code) DO NOTHING;

-- ── Seed : plan comptable minimal (France, PCG) ─────────────────────
INSERT INTO accounting_accounts (id, label, kind) VALUES
  ('411000', 'Clients',                      'client'),
  ('706000', 'Prestations de services',      'vente'),
  ('707000', 'Ventes de marchandises',       'vente'),
  ('44571',  'TVA collectée',                'tva'),
  ('445710', 'TVA collectée 20 %',           'tva'),
  ('4457110','TVA collectée 10 %',           'tva'),
  ('4457155','TVA collectée 5,5 %',          'tva'),
  ('44566',  'TVA déductible',               'tva'),
  ('512000', 'Banque',                       'banque'),
  ('530000', 'Caisse',                       'caisse'),
  ('401000', 'Fournisseurs',                 'fournisseur'),
  ('607000', 'Achats de marchandises',       'achat'),
  ('604000', 'Achats d''études et prestations', 'achat'),
  ('44551',  'TVA à décaisser',              'tva'),
  ('44567',  'Crédit de TVA à reporter',     'tva'),
  ('120000', 'Résultat de l''exercice (bénéfice)', 'resultat'),
  ('129000', 'Résultat de l''exercice (perte)',    'resultat'),
  ('758000', 'Produits divers de gestion',   'general'),
  ('658000', 'Charges diverses de gestion',  'general')
ON CONFLICT (id) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
  tables text[] := ARRAY['accounting_accounts','accounting_journals','accounting_entries'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_authenticated_all', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t || '_authenticated_all', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;
