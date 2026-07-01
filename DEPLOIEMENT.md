# Déploiement & portabilité — Hub Astorya

Ce document permet de **remonter intégralement le Hub sur un nouveau serveur /
nouveau projet Supabase**, à partir de zéro, et de vérifier que tout fonctionne.

> Architecture : front **statique** (HTML + composants UMD, aucun build serveur
> requis hors compilation JSX → `dist/`) + **Supabase** (Postgres, Auth, Storage,
> Edge Functions). Aucun backend custom hors Supabase.

---

## 0. Vue d'ensemble des dépendances

| Brique | Détail |
|---|---|
| **Hébergement front** | N'importe quel hébergeur statique (Vercel, Netlify, S3+CloudFront, Nginx…). Config Vercel fournie (`vercel.json`, en-têtes de sécurité + CSP). |
| **Base de données** | Supabase Postgres. Schéma = `sql/SCHEMA_COMPLET.sql` (cœur) + migrations `sql/*.sql`. |
| **Auth** | Supabase Auth — mot de passe **et** magic link (OTP email). |
| **Storage (3 buckets publics)** | `bl-pdfs`, `contract-templates`, `delivery-signatures`. Créés à la volée par le code, mais à provisionner manuellement en prod. |
| **Edge Functions** | `inbound-mail` (réception email → demande de devis, extraction IA). |
| **Clés/секrets** | Voir §5. |

---

## 1. Récupérer le schéma exact de la base ACTUELLE (recommandé)

Le dépôt versionne désormais le schéma cœur reconstruit (`sql/SCHEMA_COMPLET.sql`),
mais **la source de vérité reste la base en service**. Avant toute migration,
exporte le schéma réel de l'instance actuelle :

**Option A — Supabase CLI (préféré)**
```bash
supabase db dump --schema public --project-ref cqdgecllzyqimfuovrpp -f schema_reel.sql
# (nécessite `supabase login` + l'accès au projet)
```

**Option B — pg_dump direct** (connection string dans Dashboard → Settings → Database)
```bash
pg_dump "postgresql://postgres:[MOT_DE_PASSE]@db.cqdgecllzyqimfuovrpp.supabase.co:5432/postgres" \
  --schema=public --schema-only --no-owner --no-privileges -f schema_reel.sql
```

**Option C — Dashboard** : SQL Editor → exécuter une requête d'export, ou
Database → Backups → télécharger un backup logique.

➡️ Garde `schema_reel.sql` comme référence. S'il diverge de
`sql/SCHEMA_COMPLET.sql`, **c'est `schema_reel.sql` qui fait foi** — remplace
alors le fichier reconstruit par l'export réel et commit-le.

---

## 2. Créer le nouveau projet Supabase

1. https://supabase.com/dashboard → **New project**. Choisir région (UE pour RGPD).
2. Noter : **Project URL** (`https://XXXX.supabase.co`) et la clé **publishable**
   (`sb_publishable_…`, Settings → API). Récupérer aussi la **service_role**
   (`sb_secret_…`) — **secrète**, jamais côté front.

---

## 3. Appliquer le schéma (SQL Editor, dans l'ordre)

Si tu pars d'un **export réel** (§1) : exécute-le, puis saute en §3.bis.
Sinon, applique le schéma reconstruit + migrations, **dans cet ordre** :

1. `sql/SCHEMA_COMPLET.sql`  ← tables cœur (clients, contacts, opportunities,
   actions, contracts, contract_templates, delivery_notes, delivery_note_items,
   notifications, comments, tickets, calls, call_transcripts, app_settings,
   profiles, groups, profile_groups, vue v_article_counters)
2. `sql/20260615_projects.sql`
3. `sql/20260615_commercial_docs.sql`
4. `sql/20260615_user_activity.sql`
5. `sql/20260615_intel_tasks.sql`
6. `sql/20260615_stock_catalogue.sql`
7. `sql/20260615_stock_archive.sql`
8. `sql/20260616_intel_leasing_warranties.sql`
9. `sql/20260616_monday_suppliers.sql`
10. `sql/20260618_assets.sql`
11. `sql/20260625_email_templates.sql`
12. `sql/20260625_inbound_requests.sql`
13. `sql/20260629_facture_acompte.sql`
14. `sql/20260630_project_items_delivered_qty.sql`
14b. `sql/20260630_accounting.sql`  ← module comptabilité (plan comptable, journaux, écritures) + FEC
15. `sql/20260616_rls_missing_tables.sql`  ← RLS sur les tables cœur (après leur création)
16. `sql/20260630_security_hardening.sql`  ← durcissement RLS leasing/garanties

> Toutes les migrations sont idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
> `sql/PURGE_test_data.sql` est un utilitaire de nettoyage — **ne pas exécuter**
> en prod sauf besoin explicite.

### 3.bis Vérification post-schéma
```sql
SELECT count(*) FROM clients;
SELECT count(*) FROM opportunities;
SELECT count(*) FROM commercial_articles;          -- seed Astorya
SELECT * FROM commercial_company_settings;          -- 1 ligne société
SELECT commercial_next_doc_number('devis');         -- (year, seq)
-- Vérifier qu'aucune table cœur ne manque :
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' ORDER BY table_name;
```

---

## 4. Storage — créer les 3 buckets

Dashboard → Storage → New bucket (ou via le code, qui les crée en `public` au
1er usage). Créer **publics** :
- `bl-pdfs` (PDF des bons de livraison)
- `contract-templates` (modèles de contrat)
- `delivery-signatures` (signatures manuscrites des BL)

> Vérifier les policies Storage : lecture publique OK (URLs publiques utilisées),
> écriture réservée aux utilisateurs authentifiés.

---

## 5. Edge Functions + secrets

Déployer la fonction `inbound-mail` :
```bash
supabase functions deploy inbound-mail --project-ref XXXX
```
Définir les secrets (Dashboard → Edge Functions → Secrets, ou CLI) :
```bash
supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-…            \  # extraction IA des emails
  INBOUND_WEBHOOK_TOKEN=<jeton-aléatoire-fort> \  # OBLIGATOIRE (sinon 401)
  TEAMS_WEBHOOK_URL=<url-teams-ou-vide> \
  --project-ref XXXX
# SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés automatiquement par Supabase.
```
> ⚠️ Depuis le durcissement, `inbound-mail` **refuse toute requête** si
> `INBOUND_WEBHOOK_TOKEN` n'est pas défini. Le service d'email entrant doit
> envoyer l'en-tête `X-Inbound-Token: <même jeton>`.

---

## 6. Auth — configuration

Dashboard → Authentication :
1. **Providers → Email** : activer. Activer « Confirm email » selon besoin.
   Le Hub supporte mot de passe **et** magic link (OTP).
2. **URL Configuration** :
   - **Site URL** = URL du nouveau front (ex. `https://hub.mondomaine.fr`).
   - **Redirect URLs** : ajouter l'URL du front (et `…/login`, `…/bienvenue`).
   Sans ça, magic link et reset password redirigent vers la mauvaise origine.
3. Créer les utilisateurs (Dashboard → Authentication → Users) ou via l'écran
   Administration du Hub (envoi de magic link).
4. Renseigner la table `profiles` pour chaque user (au minimum `id`=auth uid,
   `name`, `email`, et `extension_3cx` si téléphonie 3CX utilisée).

---

## 7. Brancher le front sur le nouveau Supabase

Éditer **`components/supabase-config.js`** :
```js
window.HubSupabaseConfig = {
  SUPABASE_URL: "https://XXXX.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_…",   // clé publishable du NOUVEAU projet
};
```
> Ne jamais mettre une clé `sb_secret_*` / `service_role` ici (fichier servi au navigateur).

Puis **bumper le cache-buster** pour forcer le rechargement (tous les `?v=…` des
HTML doivent être identiques) :
```bash
grep -rl "v=AAAAMMJJHHMM" --include="*.html" . | xargs sed -i 's/v=ANCIEN/v=NOUVEAU/g'
```

---

## 8. Compiler le front et déployer

```bash
cd tools && npm install && npm run build   # JSX components/*.jsx → dist/components/*.js
```
> `dist/` est **versionné** (servi tel quel, pas de build côté hébergeur). Toujours
> committer `dist/` après un `npm run build`.

Déploiement :
- **Vercel** : `vercel --prod` (utilise `vercel.json` : cleanUrls + en-têtes de
  sécurité + CSP déjà configurés). Vérifier que la CSP `connect-src` autorise la
  nouvelle URL Supabase (`https://*.supabase.co` est déjà couvert).
- **Autre hébergeur statique** : publier la racine du dépôt. Reporter les en-têtes
  de `vercel.json` (HSTS, X-Frame-Options, CSP…) dans la config du serveur (Nginx/Apache).

---

## 9. Checklist de recette (post-déploiement)

- [ ] `/login` : connexion mot de passe **et** magic link OK.
- [ ] Page non connectée → redirection `/login` (anti-flash : pas de contenu visible avant).
- [ ] Créer un client (fiche entreprise + SIRET) → présent en base (`select * from clients`).
- [ ] Créer une opportunité → présente en base.
- [ ] Devis → Commande → BL → Facture ; acompte ; avoir ; règlement.
- [ ] Signer un BL → `delivery_notes.status='signed'`, `project_items.status='delivered'`.
- [ ] Générer/Télécharger un PDF (bucket `bl-pdfs`).
- [ ] Trésorerie : encaissements/avoirs/restes à recouvrer s'affichent.
- [ ] Notifications : la cloche se remplit.
- [ ] (si email entrant) POST signé `X-Inbound-Token` sur `inbound-mail` → demande créée.
- [ ] Console navigateur : aucun « relation does not exist » / « column … does not exist ».

---

## 10. Sécurité à revalider sur la nouvelle instance

- Policies **anon** retirées (cf. `20260616_rls_missing_tables.sql`).
- RLS active sur **toutes** les tables (pas de `USING (true)` résiduel) — cf.
  `20260630_security_hardening.sql`.
- `INBOUND_WEBHOOK_TOKEN` défini (sinon Edge Function fermée par défaut = OK).
- `supabase-config.js` ne contient que la clé **publishable**.
- En-têtes de sécurité (HSTS, CSP, X-Frame-Options) actifs sur le front.

---

## Annexe — Inventaire des tables attendues par le code

**Définies dans les migrations du dépôt** : `projects, project_items, project_team,
project_events, commercial_docs, commercial_doc_lines, commercial_doc_counters,
commercial_articles, commercial_tva_rates, commercial_payment_terms,
commercial_company_settings, commercial_doc_sends, user_sessions, user_events,
leasing_contracts, warranties, suppliers, assets, email_templates, inbound_requests`.

**Reconstruites dans `sql/SCHEMA_COMPLET.sql`** : `clients, contacts, opportunities,
actions, contracts, contract_templates, delivery_notes, delivery_note_items,
notifications, comments, tickets, calls, call_transcripts, app_settings, profiles,
groups, profile_groups` + vue `v_article_counters`.
