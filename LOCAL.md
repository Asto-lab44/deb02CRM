# Lancer Hub Astorya / deb02CRM en local

Guide pour récupérer le projet et le rendre fonctionnel sur une instance
locale. Tout le code est dans ce dépôt — il n'y a rien à récupérer
ailleurs.

## Architecture en 30 secondes

- **Site statique** : fichiers `.html` à la racine, React chargé via CDN.
- **Composants** : sources JSX dans `components/`, pré-compilées en JS
  dans `dist/` (déjà commité).
- **Backend** : projet **Supabase hébergé** (cloud). L'URL et la clé
  publique `anon` sont dans `components/supabase-config.js`.
- **Fonctions serverless** (`api/`) : email, 3CX, calendar — accessoires,
  ne tournent que sur Vercel ou via `vercel dev`.

## Prérequis

- **Node.js ≥ 18** (testé sur Node 22). C'est tout pour faire tourner
  l'app. Pas de base de données à installer (Supabase est hébergé).

## 1. Récupérer le code

```bash
git clone <url-du-repo> deb02CRM
cd deb02CRM
```

## 2. Lancer l'app (1 commande, zéro install)

```bash
node tools/serve.js
```

Puis ouvre **http://localhost:3000**.

> Le port est configurable : `PORT=8080 node tools/serve.js`.

Ce petit serveur reproduit le routage "clean URLs" de Vercel
(`/crm` → `crm.html`, etc.). **Important** : n'ouvre PAS les fichiers en
`file://` directement — la navigation interne (liens `/crm`,
`/fiche-client`…) renverrait des 404.

## 3. Backend Supabase — deux options

### Option A — utiliser le Supabase hébergé existant (le plus simple)

Rien à faire. La config dans `components/supabase-config.js` pointe déjà
vers le projet cloud avec une clé publique `anon` (safe côté navigateur).
L'app lit/écrit directement dessus. Nécessite juste un accès internet.

### Option B — Supabase 100 % local (isolé, pour dev)

Si tu veux une base locale indépendante :

```bash
# installer le CLI Supabase : https://supabase.com/docs/guides/cli
supabase init
supabase start          # lance Postgres + Auth + API en local (Docker)
```

`supabase start` affiche une **API URL** locale (ex.
`http://localhost:54321`) et une **anon key** locale. Reporte-les dans
`components/supabase-config.js` :

```js
window.HubSupabaseConfig = {
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "<anon key affichée par supabase start>",
};
```

Puis applique le schéma et les données de démo :

```bash
supabase db reset       # applique migrations si configurées
# — ou manuellement via le SQL Editor local (http://localhost:54323) :
#   1) supabase/schema.sql
#   2) supabase/seeds.sql
#   3) supabase/rls-anon.sql   (policies)
#   4) supabase/comments.sql
```

> Mode démo : si les clés Supabase sont vides/invalides, l'app bascule
> automatiquement sur un mode démo (login factice via localStorage,
> données inline). Utile pour tester l'UI sans backend.

## 4. Modifier un composant (rebuild JSX)

Les `.jsx` sont compilés en `.js` dans `dist/`. Après toute modif d'un
composant :

```bash
cd tools
npm install     # une seule fois — installe Babel
npm run build   # recompile components/*.jsx -> dist/
```

Recharge la page (le serveur local désactive le cache).

## 5. (Optionnel) Fonctions serverless api/

Les endpoints `api/send-email.js`, `api/3cx-webhook.js`,
`api/calendar-event.js` sont des fonctions Vercel. Pour les exécuter en
local :

```bash
npm i -g vercel
vercel dev      # sert le statique + les fonctions api/ + clean URLs
```

Définis alors les variables d'environnement attendues (voir
`DEVELOPMENT.md` § « Variables d'environnement ») dans un `.env` local.
Sans elles, ces 3 features (email sortant, appels 3CX, calendar) sont
inactives — le reste de l'app fonctionne normalement.

## Récapitulatif

| Besoin | Commande |
|---|---|
| Lancer l'app | `node tools/serve.js` → http://localhost:3000 |
| Recompiler le JSX | `cd tools && npm run build` |
| Backend local complet | `supabase start` + appliquer les SQL |
| Fonctions api/ en local | `vercel dev` |
