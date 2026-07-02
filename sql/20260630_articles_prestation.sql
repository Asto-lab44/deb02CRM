-- ───────────────────────────────────────────────────────────────────
-- 20260630_articles_prestation.sql — Articles de prestation « Déploiement »
-- ajoutés au catalogue commercial (sélectionnables dans l'éditeur de devis).
-- Prix HT INDICATIFS — à ajuster à votre grille (UPDATE ou via l'admin).
-- Idempotent : ON CONFLICT (ref) DO NOTHING.
-- ───────────────────────────────────────────────────────────────────
INSERT INTO commercial_articles (id, ref, name, description, category, unit, price_ht, tva_rate, is_service, is_recurring) VALUES
  ('AST-GIT-INIT',     'AST-GIT-INIT',     'Mise en place du dépôt Git',            'Initialisation du dépôt, branches, premier push, gestion des accès.', 'Déploiement', 'forfait', 150.00, 20.00, true, false),
  ('AST-DEPLOY-VERCEL','AST-DEPLOY-VERCEL','Déploiement sur Vercel',                'Connexion du dépôt, build, variables d''environnement, en-têtes de sécurité, mise en production.', 'Déploiement', 'forfait', 350.00, 20.00, true, false),
  ('AST-DOMAINE',      'AST-DOMAINE',      'Nom de domaine (achat + paramétrage)',  'Achat/enregistrement du nom de domaine au nom du client (1 an) et configuration initiale.', 'Déploiement', 'forfait', 45.00, 20.00, true, false),
  ('AST-DOMAINE-RENEW','AST-DOMAINE-RENEW','Renouvellement nom de domaine',         'Renouvellement annuel du nom de domaine (refacturation).', 'Service', 'an', 25.00, 20.00, true, true),
  ('AST-DNS',          'AST-DNS',          'Configuration du nom de domaine (DNS)', 'Enregistrements DNS (A/CNAME), rattachement du domaine, vérification de propagation.', 'Déploiement', 'forfait', 90.00, 20.00, true, false),
  ('AST-SSL',          'AST-SSL',          'Certificat SSL / HTTPS',                'Émission et installation du certificat, forçage HTTPS, redirection http→https.', 'Déploiement', 'forfait', 120.00, 20.00, true, false),
  ('AST-ENV-CONF',     'AST-ENV-CONF',     'Configuration environnement applicatif','Clés de service, connexions base/API, réglages de mise en production.', 'Déploiement', 'forfait', 220.00, 20.00, true, false),
  ('AST-RECETTE',      'AST-RECETTE',      'Recette & mise en production',          'Tests de bout en bout, validation client, bascule en production.', 'Déploiement', 'forfait', 250.00, 20.00, true, false),
  ('AST-FORM',         'AST-FORM',         'Formation / prise en main',             'Session de prise en main (à distance ou sur site).', 'Service', 'heure', 90.00, 20.00, true, false),
  ('AST-MIG-OVH',      'AST-MIG-OVH',      'Transfert du code sur hébergement OVH', 'Provisionnement OVH, transfert code/assets, configuration serveur, mise en service.', 'Déploiement', 'forfait', 600.00, 20.00, true, false),
  ('AST-DNS-OVH',      'AST-DNS-OVH',      'Repointage DNS vers OVH',               'Bascule DNS vers OVH sans coupure, réinstallation du certificat SSL.', 'Déploiement', 'forfait', 150.00, 20.00, true, false),
  ('AST-RECETTE-OVH',  'AST-RECETTE-OVH',  'Recette post-migration OVH',            'Contrôle complet après bascule OVH, corrections d''adaptation.', 'Déploiement', 'forfait', 200.00, 20.00, true, false),
  ('AST-TMA',          'AST-TMA',          'Maintenance & supervision',             'Supervision, mises à jour de sécurité, sauvegardes, support.', 'Service', 'mois', 90.00, 20.00, true, true),
  ('AST-SSL-RENEW',    'AST-SSL-RENEW',    'Renouvellement SSL annuel',             'Renouvellement et réinstallation du certificat si non auto-renouvelé.', 'Service', 'an', 80.00, 20.00, true, true)
ON CONFLICT (ref) DO NOTHING;
