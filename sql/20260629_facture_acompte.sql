-- ════════════════════════════════════════════════════════════════════
-- Facture d'acompte — autorise le type 'facture_acompte'
-- ════════════════════════════════════════════════════════════════════
-- La table commercial_docs avait une contrainte CHECK qui n'autorisait
-- que devis/commande/bl/facture/avoir. On l'élargit à 'facture_acompte'
-- pour persister les factures d'acompte en base (sinon fallback local).
-- ════════════════════════════════════════════════════════════════════

-- Retire l'ancienne contrainte (le nom peut varier — on cible la colonne)
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'commercial_docs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%type%IN%';
  IF c IS NOT NULL THEN
    EXECUTE 'ALTER TABLE commercial_docs DROP CONSTRAINT ' || quote_ident(c);
  END IF;
END $$;

-- Recrée la contrainte en incluant facture_acompte
ALTER TABLE commercial_docs
  ADD CONSTRAINT commercial_docs_type_check
  CHECK (type IN ('devis','commande','bl','facture','facture_acompte','avoir'));
