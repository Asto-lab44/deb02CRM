-- ───────────────────────────────────────────────────────────────────
-- 20260630_commercial_attachments.sql — Bibliothèque de documents
-- commerciaux (plaquettes, cas clients, CGV, certifs…) proposés à l'envoi
-- d'une pièce. Les documents vivent sur SharePoint : on stocke leur LIEN
-- (pas le binaire), inséré dans le corps de l'email.
-- Idempotent. RLS : utilisateur authentifié requis.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commercial_attachments (
  id           text PRIMARY KEY,          -- genId 'ATT-…'
  name         text NOT NULL,
  category     text,                       -- Plaquette / Cas client / CGV / Certification / Sécurité…
  url          text NOT NULL,              -- lien SharePoint (ou autre)
  description  text,
  suggest      boolean DEFAULT true,       -- proposé par défaut à l'envoi
  active       boolean DEFAULT true,
  position     integer DEFAULT 0,
  data         jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Exemples (URLs à remplacer par vos liens SharePoint) — idempotent.
INSERT INTO commercial_attachments (id, name, category, url, description, suggest, position) VALUES
  ('ATT-PLAQUETTE', 'Plaquette commerciale ASTORYA', 'Plaquette',     'https://sharepoint.example/plaquette.pdf', 'Présentation de la société et des offres.', true, 1),
  ('ATT-CGV',       'Conditions Générales de Vente',  'CGV',           'https://sharepoint.example/cgv.pdf',       'CGV en vigueur.', true, 2),
  ('ATT-CAS',       'Cas clients / références',        'Cas client',    'https://sharepoint.example/cas-clients.pdf','Témoignages et références.', false, 3),
  ('ATT-CERTIF',    'Certifications & assurances',     'Certification', 'https://sharepoint.example/certifications.pdf','Certifs, RC pro, assurances.', false, 4),
  ('ATT-SECU',      'Note sécurité / RGPD',            'Sécurité',      'https://sharepoint.example/securite-rgpd.pdf','Engagements sécurité et conformité.', false, 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE commercial_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commercial_attachments_authenticated_all ON commercial_attachments;
CREATE POLICY commercial_attachments_authenticated_all ON commercial_attachments
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
REVOKE ALL ON commercial_attachments FROM anon;
