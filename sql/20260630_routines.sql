-- ───────────────────────────────────────────────────────────────────
-- 20260630_routines.sql — Routines & clôtures (plan de charge comptable).
-- routine_tasks : définition des tâches récurrentes (fréquence + tuile liée).
-- routine_completions : « fait » par période (task_id + period_key).
-- Idempotent. RLS : utilisateur authentifié requis.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_tasks (
  id          text PRIMARY KEY,           -- 'RT-01'…
  service     text,                        -- TRESORERIE / ACHATS / …
  action      text NOT NULL,
  frequency   text NOT NULL,               -- quotidien / hebdo / quinzaine / mensuel
  module_key  text,                         -- tuile liée (accounting, contracts, treasury…)
  assignee    text,
  position    integer DEFAULT 0,
  active      boolean DEFAULT true,
  data        jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routine_completions (
  id          text PRIMARY KEY,
  task_id     text NOT NULL,
  period_key  text NOT NULL,               -- 2026-07 / 2026-W27 / 2026-07-Q2 / 2026-07-02
  done_by     text,
  done_at     timestamptz DEFAULT now(),
  UNIQUE(task_id, period_key)
);
CREATE INDEX IF NOT EXISTS idx_routine_compl_period ON routine_completions(period_key);

-- Seed des 32 tâches (périmètre Astorya). Idempotent.
INSERT INTO routine_tasks (id, service, action, frequency, module_key, position) VALUES
  ('RT-01','TRESORERIE','Saisir les banques via Bankin','hebdo','accounting',1),
  ('RT-02','TRESORERIE','Rapprochement bancaire','hebdo','accounting',2),
  ('RT-03','TRESORERIE','Lettrage','hebdo','accounting',3),
  ('RT-04','ACHATS','Vérification des factures fournisseur à régler','hebdo','accounting',4),
  ('RT-05','ACHATS','Règlement des factures fournisseur','hebdo','accounting',5),
  ('RT-06','RELANCES','Relance clients','quinzaine','treasury',6),
  ('RT-07','RELANCES','Veille des retours des dossiers Agir','hebdo','accounting',7),
  ('RT-08','CLIENTS','Traitement des mails clients','quotidien','tech',8),
  ('RT-09','FACTURATION','Vérification des abonnements CSP avant le 05','mensuel','contracts',9),
  ('RT-10','FACTURATION','Facturation récurrente : MANATEL + BE CLOUD + ERP + ALSO','mensuel','contracts',10),
  ('RT-11','FACTURATION','Envoi des factures récurrentes','mensuel','commercial',11),
  ('RT-12','FACTURATION','Intégration en comptabilité des écritures récurrentes','mensuel','accounting',12),
  ('RT-13','TRESORERIE','Prélèvements des factures récurrentes (15 du mois)','mensuel','contracts',13),
  ('RT-14','TRESORERIE','Prélèvements des factures ponctuelles','quinzaine','commercial',14),
  ('RT-15','SALARIES','Envoi des éléments de paie à Catherine','mensuel','hr',15),
  ('RT-16','SALARIES','Saisie des écritures comptables de paie','mensuel','accounting',16),
  ('RT-17','FACTURATION','Facturation ponctuelle','hebdo','commercial',17),
  ('RT-18','FACTURATION','Vérification des factures ponctuelles','mensuel','commercial',18),
  ('RT-19','SUIVI','Point chiffre d''affaires à Romain','mensuel','reports',19),
  ('RT-20','SUIVI','Point trésorerie à Romain','mensuel','treasury',20),
  ('RT-21','SUIVI','Point relance','mensuel','treasury',21),
  ('RT-22','FISCAL','Déclaration de TVA','mensuel','accounting',22),
  ('RT-23','CLIENTS','Point résiliation (vérification avec Laurent)','mensuel','contracts',23),
  ('RT-24','CLIENTS','Résiliation des contrats','quotidien','contracts',24),
  ('RT-25','FACTURATION','Facturation Page Pack','mensuel','contracts',25),
  ('RT-26','FACTURATION','Vérification des BL non passés en livrable','mensuel','projects',26),
  ('RT-27','FACTURATION','MAJ des contrats selon les envois des techniciens','quotidien','contracts',27),
  ('RT-28','TRESORERIE','Contrôle des prélèvements et ajustement des rejets','mensuel','treasury',28),
  ('RT-29','CLIENTS','Envoi chez Agir des dossiers non recouvrés > 3 mois','mensuel','accounting',29),
  ('RT-30','ACHATS','Vérification et saisie des NDF','mensuel','accounting',30),
  ('RT-31','ACHATS','Saisie des achats fournisseurs','quotidien','accounting',31),
  ('RT-32','CLIENTS','Suivi des clients en liquidation / redressement','mensuel','intel',32)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE t text; tables text[] := ARRAY['routine_tasks','routine_completions'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_authenticated_all', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t || '_authenticated_all', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;
