-- ════════════════════════════════════════════════════════════════════
-- Stock & Catalogue : archivage d'un devis/commande
-- ════════════════════════════════════════════════════════════════════
-- Ajoute la colonne stock_archived_at sur commercial_docs.
-- Le code applicatif fallback sur data jsonb si la colonne manque,
-- donc ce script est OPTIONNEL mais recommandé pour performance.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE commercial_docs
  ADD COLUMN IF NOT EXISTS stock_archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_commercial_docs_stock_archived_at
  ON commercial_docs (stock_archived_at)
  WHERE stock_archived_at IS NOT NULL;
