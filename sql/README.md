# Migrations SQL — Hub Astorya

Ordre d'exécution dans Supabase SQL Editor (snippets distincts, idempotents).

## ⚠️ Pré-requis — exécuter `SCHEMA_COMPLET.sql` EN PREMIER

Les tables **cœur** (clients, contacts, opportunities, actions, contracts,
contract_templates, delivery_notes, delivery_note_items, notifications, comments,
tickets, calls, call_transcripts, app_settings, profiles, groups, profile_groups)
ne sont définies par aucune migration historique : elles sont désormais
**reconstruites** dans **`SCHEMA_COMPLET.sql`**, à exécuter **avant** toutes les
migrations datées ci-dessous.

> 🧭 **Pour un redéploiement complet sur un nouveau serveur**, suivre
> **`../DEPLOIEMENT.md`** (procédure pas-à-pas : ordre exact, buckets storage,
> edge functions, auth, recette).
>
> ⚠️ `SCHEMA_COMPLET.sql` est une **reconstruction** déduite du code : la
> **source de vérité reste l'export du schéma réel** (`pg_dump` / Supabase CLI,
> cf. DEPLOIEMENT.md §1). En cas de divergence, l'export fait foi.

`auth.users` est fourni par Supabase Auth (toutes les FK `created_by` en dépendent).
Sans `SCHEMA_COMPLET.sql`, une table cœur manquante provoque `42P01: relation does
not exist` ; le code retombe alors en localStorage (non persisté en base réelle).

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
