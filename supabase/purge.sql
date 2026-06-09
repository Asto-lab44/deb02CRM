-- ════════════════════════════════════════════════════════════════════
-- Hub Astorya — Purge des données métier
-- ════════════════════════════════════════════════════════════════════
--
-- Vide toutes les tables transactionnelles (clients, opportunités,
-- contrats, tickets, projets, livrables, notifications, etc.) tout en
-- conservant :
--   - le schéma (tables, RLS, triggers, fonctions)
--   - les utilisateurs auth.users + profils (profiles)
--   - les groupes d'accès et droits
--   - les modèles de contrats uploadés en Storage
--
-- À exécuter dans Supabase Studio → SQL Editor.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── Projets & Livrables ───────────────────────────────────────────
TRUNCATE TABLE
  delivery_note_items,
  delivery_notes,
  project_events,
  project_items,
  project_team,
  projects
RESTART IDENTITY CASCADE;

-- ─── Tickets & commentaires ────────────────────────────────────────
TRUNCATE TABLE
  ticket_comments,
  tickets
RESTART IDENTITY CASCADE;

-- ─── Contrats ──────────────────────────────────────────────────────
TRUNCATE TABLE contracts RESTART IDENTITY CASCADE;

-- ─── CRM : opportunités, actions, contacts ─────────────────────────
TRUNCATE TABLE
  actions,
  opportunity_events,
  opportunities,
  contacts
RESTART IDENTITY CASCADE;

-- ─── Clients (en dernier — référencé partout) ──────────────────────
TRUNCATE TABLE clients RESTART IDENTITY CASCADE;

-- ─── Notifications ─────────────────────────────────────────────────
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- ─── Procédures collectives cache ──────────────────────────────────
TRUNCATE TABLE collective_proceedings_cache RESTART IDENTITY CASCADE;

COMMIT;

-- ─── Vérification ──────────────────────────────────────────────────
SELECT 'clients'      AS tbl, COUNT(*) FROM clients
UNION ALL SELECT 'opportunities', COUNT(*) FROM opportunities
UNION ALL SELECT 'contracts',     COUNT(*) FROM contracts
UNION ALL SELECT 'tickets',       COUNT(*) FROM tickets
UNION ALL SELECT 'projects',      COUNT(*) FROM projects
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY tbl;
