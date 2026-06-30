-- ───────────────────────────────────────────────────────────────────
-- 20260630_project_items_delivered_qty.sql
-- Ajoute la colonne delivered_qty à project_items. Le code (deliveryNotes
-- .sign) renseigne la quantité livrée lors de la signature d'un BL pour
-- marquer l'article projet correspondant comme livré. Sans cette colonne,
-- l'update échouait (« column delivered_qty does not exist ») et le statut
-- « delivered » n'était pas persisté.
--
-- Idempotent : rejouable sans risque.
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE project_items ADD COLUMN IF NOT EXISTS delivered_qty numeric(12,3);
