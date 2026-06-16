-- ════════════════════════════════════════════════════════════════════
-- Stock & Catalogue : import des fournisseurs depuis Monday "1.0 - Achat hebdomadaire"
-- ════════════════════════════════════════════════════════════════════
-- Synchronise la liste des fournisseurs du dropdown Monday
-- (board 745054784, column fournisseur_mkm6r10y) dans la table suppliers.
-- ON CONFLICT (name) DO NOTHING → ne touche pas aux fournisseurs déjà créés.
-- ════════════════════════════════════════════════════════════════════

INSERT INTO suppliers(id, name, category) VALUES
  ('SUP-ATHENA',      'Athena global services', 'Sécurité'),
  ('SUP-SOFT4EUR',    'SOFT4EUROPE',            'Distributeur'),
  ('SUP-SUPPMUR',     'SUPPORT MURAUX',         'Matériel'),
  ('SUP-SENDBLAST',   'SendBlaster',            'SaaS'),
  ('SUP-NEZUMI',      'NEZUMI',                 'SaaS'),
  ('SUP-UBIQUITI',    'UBIQUITI',               'Constructeur'),
  ('SUP-SITEMARCH',   'SITE MARCHAND',          'Distributeur'),
  ('SUP-ALTOSPAM',    'ALTOSPAM',               'Sécurité'),
  ('SUP-ITANCIA',     'ITANCIA',                'Téléphonie'),
  ('SUP-ALSO',        'ALSO',                   'Distributeur'),
  ('SUP-TS2LOG',      'TS2log',                 'Logiciel'),
  ('SUP-CDISCOUNT',   'CDISCOUNT',              'Distributeur'),
  ('SUP-STUDIOCALL',  'STUDIOCALL',             'SaaS'),
  ('SUP-BATTERYDIR',  'BATTERY DIRECT',         'Matériel'),
  ('SUP-WEBSOFT',     'WEBSOFTSOLUS',           'Logiciel'),
  ('SUP-ALIEXPRESS',  'ALIEXPRESS',             'Distributeur'),
  ('SUP-BACKMARKET',  'BACKMARKET',             'Reconditionné'),
  ('SUP-ADHOCCUSTY',  'ADHOC CUSTY',            'Distributeur'),
  ('SUP-BROTHERMPS',  'BROTHER MPS',            'Constructeur'),
  ('SUP-APOGEA',      'APOGEA',                 'Distributeur'),
  ('SUP-ADAPTPC',     'ADAPTATEUR-PC',          'Matériel'),
  ('SUP-TRADEMOS',    'TRADEMOS',               'Distributeur'),
  ('SUP-MGF',         'MGF',                    'Distributeur'),
  ('SUP-DARTY',       'DARTY',                  'Distributeur'),
  ('SUP-FREEPRO',     'Free Pro',               'Téléphonie'),
  ('SUP-MARCEA',      'MARCEA',                 'Distributeur'),
  ('SUP-BOOSTMAIL',   'BOOST MY MAIL',          'SaaS'),
  ('SUP-GOOGLE',      'GOOGLE',                 'SaaS')
ON CONFLICT (name) DO NOTHING;
