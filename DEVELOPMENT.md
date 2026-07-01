# Hub Astorya — Plan de mise en production

> ⚠️ **DOCUMENT HISTORIQUE (archive).** Ce fichier trace une étape ancienne de
> la transformation maquette → application et **peut contenir des références
> périmées** (ex. `supabase/schema.sql` / `supabase/seeds.sql`, qui ne sont plus
> dans le dépôt). Pour l'état à jour, voir :
> [`README.md`](README.md) · [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md) ·
> [`DEPLOIEMENT.md`](DEPLOIEMENT.md) · [`sql/README.md`](sql/README.md).

Document de travail pour suivre l'avancement de la transformation
maquette → application réelle.

## État actuel (après cette session)

### Backend
- **Supabase Auth** activé (magic link, flow implicit)
- **Schéma Supabase complet** dans `supabase/schema.sql` — 8 tables :
  `profiles`, `groups`, `profile_groups`, `clients`, `contracts`,
  `assets`, `tickets`, `calls`, `call_transcripts`
- **Seed data** dans `supabase/seeds.sql` — 11 tickets + 30 assets
  + 6 clients + 9 groupes
- **Row Level Security** activée sur toutes les tables (policies
  permissives pour `authenticated` — à durcir par groupe ensuite)
- **Trigger** auto-création du profil au signup (`handle_new_user`)

### Frontend
- **Couche d'accès** : `components/hub-data.js` — wrapper Supabase
  pour lectures/écritures + Realtime subscription
- **`TicketList`** lit depuis Supabase si configuré, sinon fallback
  vers les données inline (maquette préservée pour mode démo)
- **`AssetInventoryModal`** (Parc IT) lit depuis Supabase pour le
  client courant (actuellement hardcodé sur ACC-0184 = AXA)

### Stubs API (Vercel Functions)
- `api/3cx-webhook.js` — endpoint POST pour les appels entrants 3CX
- `api/send-email.js` — proxy SendGrid pour les boutons "Email"
- `api/calendar-event.js` — création d'événement Google Calendar

## À faire pour activer chaque feature

### 1. Auth réelle (Supabase) — déjà activée
- Site URL et Redirect URLs à configurer dans Supabase Dashboard
- Voir issue ouverte sur le redirect `localhost:3000`

### 2. Tickets persistés en base
- [ ] Exécuter `supabase/schema.sql` puis `supabase/seeds.sql` dans
  Supabase SQL Editor
- [ ] Vérifier que `/ticketing` affiche les tickets de la base
- [ ] Refactor `TicketDetail` pour lire/écrire depuis Supabase
- [ ] Implémenter les mutations (changement statut, escalade)
  via `window.HubData.updateTicket()`

### 3. 3CX (appels)
- [ ] Définir `CX_WEBHOOK_SECRET` dans Vercel Env Variables
- [ ] Définir `SUPABASE_SERVICE_ROLE_KEY` dans Vercel Env (clé secrète)
- [ ] Configurer 3CX → URL Call Action vers `/api/3cx-webhook`
- [ ] Brancher la popup `HotlinePopup` sur l'événement Supabase
  Realtime (table `calls`) au lieu du bouton "Simuler appel"

### 4. Groupes/users en base
- [ ] Refactor `UserManagement.jsx` pour lire `groups` et
  `profile_groups` depuis Supabase
- [ ] Adapter `access-store.js` (déjà partiel) pour récupérer le
  groupe du user via la table `profile_groups`
- [ ] CRUD groupes via `supa.from('groups').insert/update/delete`

### 5. CRM + parc IT en base
- [ ] Refactor `ClientPage` pour récupérer le client courant via
  `window.HubData.fetchClientById(id)` (id depuis l'URL)
- [ ] Refactor `CRMAccount` pour lire la liste clients depuis Supabase
- [ ] Le parc IT (assets) est déjà branché — vérifier qu'il s'affiche
  bien après exécution des seeds

### 7. Email (SendGrid)
- [ ] Créer compte SendGrid, vérifier le domaine `astorya.fr`
- [ ] Définir `SENDGRID_API_KEY` et `EMAIL_FROM` dans Vercel
- [ ] Brancher les boutons "✉ Email" sur `fetch('/api/send-email')`

### 8. Reporting réel
- [ ] Vue Supabase qui agrège `calls` par mois × catégorie :
  ```sql
  create view monthly_call_stats as
    select client_id, date_trunc('month', started_at) as month,
           category, count(*) as nb
    from calls group by 1, 2, 3;
  ```
- [ ] `CallStatsModal` lit depuis cette vue
- [ ] Sync CMDB → table `assets` (job cron Supabase Edge ou import CSV)

## Variables d'environnement à configurer dans Vercel

```
SUPABASE_URL                     = https://cqdgecllzyqimfuovrpp.supabase.co
SUPABASE_SERVICE_ROLE_KEY        = sb_secret_... (jamais commit)
CX_WEBHOOK_SECRET                = <à générer, partager avec 3CX>
SENDGRID_API_KEY                 = SG.xxxxx
EMAIL_FROM                       = notifications@astorya.fr
GOOGLE_SA_EMAIL                  = hub-astorya@<projet>.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY            = "-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID               = equipe@astorya.fr
```

## Ordre conseillé pour la suite
1. Exécuter les SQL `schema.sql` + `seeds.sql` → voir les tickets
   et le parc IT s'afficher depuis Supabase
2. Configurer Site URL Supabase pour faire fonctionner le magic link
3. Refactor `TicketDetail` pour les mutations
4. Brancher 3CX (dépend du webhook secret et de votre admin 3CX)
5. Ajouter SendGrid pour les emails sortants
6. Le reste (Calendar, CMDB sync, reporting) suit naturellement
