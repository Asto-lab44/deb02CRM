-- ───────────────────────────────────────────────────────────────────
-- 20260630_security_hardening.sql
-- Durcissement RLS : les tables leasing_contracts et warranties avaient
-- des policies « USING (true) WITH CHECK (true) », ce qui autorisait
-- la lecture/écriture sans session authentifiée valide (la simple clé
-- publishable suffisait). On exige désormais une identité authentifiée,
-- aligné sur le reste du schéma (auth.uid() IS NOT NULL).
--
-- Idempotent : peut être rejoué sans risque.
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE leasing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leasing_contracts_all_authenticated" ON leasing_contracts;
CREATE POLICY "leasing_contracts_all_authenticated"
  ON leasing_contracts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "warranties_all_authenticated" ON warranties;
CREATE POLICY "warranties_all_authenticated"
  ON warranties FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
