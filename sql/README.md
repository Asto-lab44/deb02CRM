# Migrations SQL — Hub Astorya

Ordre d'exécution dans Supabase SQL Editor (snippets distincts, idempotents).

## ⚠️ Pré-requis

Les tables **core** suivantes doivent exister dans le projet Supabase **avant** d'exécuter les migrations de ce dossier :

| Table | Utilisée par | Statut |
|---|---|---|
| `auth.users` | Toutes les FK `created_by` | Fourni par Supabase Auth |
| `profiles` | UI Administration, fetchProfiles | Schéma à valider (custom) |
| `clients` | CRM, fiche client, gestion co. | Schéma à valider (custom) |
| `contacts` | Fiche client, contact principal | Schéma à valider (custom) |
| `opportunities` | CRM Pipeline, AdvanceOpp | Schéma à valider (custom) |
| `actions` | Timeline activité | Schéma à valider (custom) |
| `contracts` | Fiche client > Contrats | Schéma à valider (custom) |

> Si une de ces tables manque (erreur `42P01: relation does not exist`), il faut la créer manuellement. Les fallbacks localStorage masquent l'absence, mais les écritures ne sont pas persistées en BDD réelle.

## 📋 Migrations à exécuter (ordre)

| # | Fichier | Tables créées | Fonctions |
|---|---|---|---|
| 1 | `20260615_projects.sql` | `projects`, `project_items`, `project_team`, `project_events` | — |
| 2 | `20260615_commercial_docs.sql` | `commercial_docs`, `commercial_doc_lines`, `commercial_doc_counters`, `commercial_articles`, `commercial_tva_rates`, `commercial_payment_terms`, `commercial_company_settings`, `commercial_doc_sends` | `commercial_next_doc_number(p_type)` |
| 3 | `20260615_user_activity.sql` | `user_sessions`, `user_events` | `activity_heartbeat(p_session_id)`, `activity_dashboard_stats()` |
| 4 | `20260615_intel_tasks.sql` | `leasing_contracts`, `warranties` | — |

## ✅ Vérification post-exécution

```sql
-- Phase 1 (projets)
SELECT count(*) FROM projects;          -- 0 ou +
SELECT count(*) FROM project_events;    -- 0 ou +

-- Phase 2 (commercial)
SELECT count(*) FROM commercial_articles;        -- 7 (seed Astorya)
SELECT * FROM commercial_company_settings;       -- 1 ligne ASTORYA SGI
SELECT * FROM commercial_tva_rates;              -- 5 taux
SELECT commercial_next_doc_number('devis');      -- renvoie (year, seq)

-- Phase 3 (activity)
SELECT count(*) FROM user_sessions;
SELECT activity_dashboard_stats();               -- jsonb

-- Phase 4 (intel)
SELECT count(*) FROM leasing_contracts;
SELECT count(*) FROM warranties;
```

## 🔒 RLS

Toutes les migrations activent RLS avec une policy `auth_all_X` qui requiert simplement un user authentifié. Pour multi-tenant strict, à durcir au cas par cas.

## 🐛 Si erreur 42P01 ('relation does not exist')

Cela signifie qu'une table référencée par une FK n'existe pas dans Supabase. Toutes les FK croisées (vers `clients`, `opportunities`, `projects`) sont **soft** : si la table n'existe pas, le code applicatif tombe en fallback localStorage sans crash. Les migrations sont résilientes (FK vers `clients`/`opportunities` enlevées dans les versions récentes).
