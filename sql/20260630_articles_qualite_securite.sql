-- ───────────────────────────────────────────────────────────────────
-- 20260630_articles_qualite_securite.sql — Articles « Qualité, sécurité & audit »
-- ajoutés au catalogue commercial (sélectionnables dans l'éditeur de devis).
-- Prix HT INDICATIFS — à ajuster à votre grille. Idempotent.
-- ───────────────────────────────────────────────────────────────────
INSERT INTO commercial_articles (id, ref, name, description, category, unit, price_ht, tva_rate, is_service, is_recurring) VALUES
  -- Correction de bugs & support correctif
  ('AST-BUG-UNIT',   'AST-BUG-UNIT',   'Correction de bug (à l''heure)',            'Diagnostic et correction d''une anomalie, tests de non-régression, livraison.', 'Qualité', 'heure', 95.00, 20.00, true, false),
  ('AST-BUG-PACK5',  'AST-BUG-PACK5',  'Pack correction de bugs (5 h)',             'Forfait de 5 heures de corrections d''anomalies, priorisées avec le client.', 'Qualité', 'forfait', 430.00, 20.00, true, false),
  ('AST-SUPPORT-J',  'AST-SUPPORT-J',  'Intervention corrective (journée)',         'Journée dédiée de corrections et ajustements.', 'Qualité', 'jour', 650.00, 20.00, true, false),
  -- Audits
  ('AST-AUDIT-CODE', 'AST-AUDIT-CODE', 'Audit de code & revue qualité',             'Revue du code (dette technique, duplication, robustesse, gestion d''erreurs) + rapport priorisé.', 'Audit', 'forfait', 900.00, 20.00, true, false),
  ('AST-AUDIT-SEC',  'AST-AUDIT-SEC',  'Audit de sécurité applicative (OWASP)',     'Analyse des vulnérabilités (auth, XSS, injections, secrets, en-têtes) + plan de remédiation.', 'Audit', 'forfait', 1200.00, 20.00, true, false),
  ('AST-AUDIT-RLS',  'AST-AUDIT-RLS',  'Audit sécurité base de données & RLS',      'Contrôle des politiques d''accès (Row Level Security), isolation des données, accès anonymes.', 'Audit', 'forfait', 700.00, 20.00, true, false),
  ('AST-AUDIT-FONC', 'AST-AUDIT-FONC', 'Audit fonctionnel & intégrité',             'Vérification des flux, champs persistés, boutons/actions, cohérence des données.', 'Audit', 'forfait', 650.00, 20.00, true, false),
  ('AST-AUDIT-PERF', 'AST-AUDIT-PERF', 'Audit de performance & optimisation',       'Analyse des temps de chargement, requêtes, taille des bundles + optimisations.', 'Audit', 'forfait', 750.00, 20.00, true, false),
  ('AST-AUDIT-RGPD', 'AST-AUDIT-RGPD', 'Audit de conformité RGPD',                  'Registre, bases légales, durées de conservation, droits des personnes, sous-traitants.', 'Audit', 'forfait', 800.00, 20.00, true, false),
  ('AST-PENTEST',    'AST-PENTEST',    'Test d''intrusion léger (pentest)',         'Tests offensifs ciblés en environnement autorisé + rapport de findings.', 'Audit', 'forfait', 1500.00, 20.00, true, false),
  -- Durcissement & sécurisation
  ('AST-SEC-HARDEN', 'AST-SEC-HARDEN', 'Durcissement du code & configuration',      'En-têtes de sécurité (HSTS/CSP), gestion des secrets, gardes d''authentification, anti-XSS.', 'Sécurité', 'forfait', 850.00, 20.00, true, false),
  ('AST-SEC-RLS-FIX','AST-SEC-RLS-FIX','Mise en conformité RLS / policies',         'Correction et durcissement des politiques d''accès base de données.', 'Sécurité', 'forfait', 500.00, 20.00, true, false),
  ('AST-SEC-PATCH',  'AST-SEC-PATCH',  'Application de correctifs de sécurité',     'Application de correctifs et vérification (à l''heure).', 'Sécurité', 'heure', 95.00, 20.00, true, false),
  ('AST-DEP-UPDATE', 'AST-DEP-UPDATE', 'Mise à jour des dépendances & socle',       'Montée de version des dépendances, tests de non-régression.', 'Sécurité', 'forfait', 350.00, 20.00, true, false),
  ('AST-TESTS',      'AST-TESTS',      'Mise en place de tests automatisés',        'Écriture de tests (logique métier, non-régression) + intégration.', 'Qualité', 'jour', 650.00, 20.00, true, false),
  ('AST-MONITOR',    'AST-MONITOR',    'Mise en place supervision / alerting',      'Monitoring de disponibilité, alertes, tableau de bord technique.', 'Sécurité', 'forfait', 400.00, 20.00, true, false),
  -- Récurrent
  ('AST-SEC-VEILLE', 'AST-SEC-VEILLE', 'Veille & correctifs de sécurité',           'Veille continue, application des correctifs de sécurité et mises à jour critiques.', 'Sécurité', 'mois', 120.00, 20.00, true, true)
ON CONFLICT (ref) DO NOTHING;
