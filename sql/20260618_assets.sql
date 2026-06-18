-- ════════════════════════════════════════════════════════════════════
-- Migration : Assets — Référencement du stock interne (parc matériel)
-- ════════════════════════════════════════════════════════════════════
-- Un asset = une instance physique d'un article du catalogue, suivie
-- de l'achat (BL fournisseur) jusqu'à l'affectation à un client final.
-- Le référentiel des produits reste commercial_articles ; assets
-- réfère uniquement les instances individuelles (n° de série, lot…).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assets (
  id                text PRIMARY KEY,                       -- ASSET-{ts}{rand}
  article_id        text,                                   -- → commercial_articles.id (peut être null si non catalogué)
  article_ref       text,                                   -- snapshot ref article (dénormalisé pour vue rapide)
  article_label     text,                                   -- snapshot désignation
  serial_number     text,                                   -- n° de série / IMEI / MAC
  lot               text,                                   -- n° de lot / palette
  supplier          text,                                   -- nom fournisseur (snapshot)
  purchase_doc_id   text,                                   -- → commercial_docs (BL fournisseur / commande)
  purchase_price_ht numeric(12,4),
  received_at       timestamptz,                            -- date d'entrée en stock
  location          text,                                   -- emplacement physique (étagère, salle, site)
  status            text DEFAULT 'disponible',              -- disponible / reserve / affecte / sav / hs / vendu
  client_id         text,                                   -- → clients.id (si affecté)
  client_name       text,                                   -- snapshot raison sociale
  project_id        text,                                   -- → projects.id (si lié à un livrable)
  affected_at       timestamptz,                            -- date d'affectation au client
  warranty_end      date,                                   -- fin de garantie constructeur
  notes             text,
  data              jsonb DEFAULT '{}'::jsonb,
  active            boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  deleted_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_assets_article    ON assets(article_id)    WHERE active;
CREATE INDEX IF NOT EXISTS idx_assets_status     ON assets(status)        WHERE active;
CREATE INDEX IF NOT EXISTS idx_assets_client     ON assets(client_id)     WHERE active;
CREATE INDEX IF NOT EXISTS idx_assets_project    ON assets(project_id)    WHERE active;
CREATE INDEX IF NOT EXISTS idx_assets_serial     ON assets(serial_number) WHERE active;
CREATE INDEX IF NOT EXISTS idx_assets_purchase   ON assets(purchase_doc_id) WHERE active;

-- ─────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_all_assets ON assets;
CREATE POLICY auth_all_assets ON assets FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

REVOKE ALL ON assets FROM anon;
GRANT  ALL ON assets TO   authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Vue agrégée : compteurs live par article catalogue
-- (utilisée par l'onglet "Catalogue produits" du module Stock)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_article_counters AS
SELECT
  a.id  AS article_id,
  a.ref AS article_ref,
  a.designation AS article_label,
  COUNT(ast.id) FILTER (WHERE ast.status = 'disponible')                    AS in_stock,
  COUNT(ast.id) FILTER (WHERE ast.status = 'reserve')                       AS reserved,
  COUNT(ast.id) FILTER (WHERE ast.status = 'affecte' OR ast.status='vendu') AS sold,
  COUNT(ast.id) FILTER (WHERE ast.status = 'sav')                           AS in_sav,
  COUNT(ast.id) FILTER (WHERE ast.status = 'hs')                            AS broken
FROM commercial_articles a
LEFT JOIN assets ast
  ON ast.article_id = a.id AND COALESCE(ast.active, true) = true
WHERE COALESCE(a.active, true) = true
GROUP BY a.id, a.ref, a.designation;

-- ═══════════════════════════════════════════════════════════════════
-- Vérification
--   SELECT count(*) FROM assets;
--   SELECT * FROM v_article_counters ORDER BY in_stock DESC LIMIT 20;
-- ═══════════════════════════════════════════════════════════════════
