-- ════════════════════════════════════════════════════════════════════
-- SCRIPT DE PURGE — Données de test
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor pour faire un test propre.
-- Préserve : utilisateurs, profils, paramètres société, articles seed,
-- fournisseurs seed, taux TVA, conditions paiement.
-- Supprime : devis, commandes, BL, factures, lignes, projets, opps tests,
--            audits envois, événements activité tests.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. GESTION COMMERCIALE
-- Hard delete des lignes (CASCADE supprimera via FK)
DELETE FROM commercial_doc_lines;
DELETE FROM commercial_doc_sends;
DELETE FROM commercial_docs;

-- Reset compteurs de numérotation (les prochains docs reprendront à 1)
DELETE FROM commercial_doc_counters;

-- ─── 2. PROJETS & LIVRABLES
DELETE FROM project_items;
DELETE FROM project_events;
DELETE FROM project_team;
DELETE FROM projects;

-- ─── 3. OPPORTUNITÉS (optionnel — décommente si tu veux les purger aussi)
-- DELETE FROM opportunities;

-- ─── 4. AUDIT TRACKING (optionnel — purge le journal d'activité)
-- DELETE FROM user_events WHERE type IN ('ai_mail', 'login', 'logout', 'lock', 'unlock');
-- DELETE FROM user_sessions;

-- ─── 5. INTEL CONCURRENTIELLE (optionnel)
-- DELETE FROM leasing_contracts;
-- DELETE FROM warranties;

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION post-purge
-- ═══════════════════════════════════════════════════════════════════
SELECT 'commercial_docs' AS table_name, count(*) AS reste FROM commercial_docs
UNION ALL SELECT 'commercial_doc_lines', count(*) FROM commercial_doc_lines
UNION ALL SELECT 'commercial_doc_sends', count(*) FROM commercial_doc_sends
UNION ALL SELECT 'commercial_doc_counters', count(*) FROM commercial_doc_counters
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'project_items', count(*) FROM project_items
UNION ALL SELECT 'project_events', count(*) FROM project_events
UNION ALL SELECT '— préservés —', null
UNION ALL SELECT 'suppliers (catalogue)', count(*) FROM suppliers
UNION ALL SELECT 'commercial_articles (catalogue)', count(*) FROM commercial_articles
UNION ALL SELECT 'commercial_company_settings', count(*) FROM commercial_company_settings;
-- Attendu : tout à 0 sauf suppliers (34), commercial_articles (7), company_settings (1)
