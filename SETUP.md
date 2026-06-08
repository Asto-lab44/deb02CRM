# Hub Astorya — Setup Supabase complet

Après le merge de la PR #3, voici les **3 étapes** à faire dans le dashboard Supabase
pour activer le mode multi-utilisateurs avec persistance réelle.

> Projet Supabase actuel : `cqdgecllzyqimfuovrpp.supabase.co`
> Dashboard : https://supabase.com/dashboard/project/cqdgecllzyqimfuovrpp

---

## 1. Exécuter la migration SQL

Ouvre le **SQL Editor** (icône `</>`) puis colle-y le contenu de
[`supabase/migration-crm.sql`](supabase/migration-crm.sql) et clique **Run**.

Ça crée :
- Colonne `data jsonb` sur la table `clients` (flexible)
- Tables `opportunities`, `contacts`, `actions`
- Colonnes manquantes sur `contracts`
- Row Level Security : utilisateurs authentifiés ont accès complet
- Trigger automatique : quand une opportunité passe au stade `won`, le prospect devient `client`

---

## 2. Activer Email + Password Auth

Dans **Authentication → Providers** :
- Active **Email**
- Décoche **« Confirm email »** (si tu veux que le signup connecte direct sans email de confirmation)

Dans **Authentication → URL Configuration** :
- **Site URL** : `https://deb02-crm.vercel.app`
- **Redirect URLs** : ajoute ces 3 URLs (séparées par des virgules)
  ```
  https://deb02-crm.vercel.app/**
  https://deb02-crm-git-claude-sharp-edison-p3k0r-astorya-s-projects.vercel.app/**
  http://localhost:8000/**
  ```

---

## 3. Créer les 2 comptes

Dans **Authentication → Users → Add user → Create new user** :

| Email | Password (à changer) |
|---|---|
| `achat@astorya.fr` (Romain) | (choisis-en un, à transmettre) |
| `a.morin@astorya.fr` (Augustin) | (choisis-en un, à transmettre) |

> Tu peux aussi te connecter en cochant **« Auto Confirm User »** pour que l'utilisateur soit actif immédiatement.

---

## Vérification

Une fois ces 3 étapes faites :
1. Va sur `https://deb02-crm.vercel.app/login`
2. Connecte-toi avec `achat@astorya.fr` + le mot de passe choisi
3. Tu seras redirigé vers `/` (Accueil ERP)
4. Crée un nouveau prospect → il sera persisté dans Supabase
5. Augustin se connecte de son côté → il voit ton prospect

## Que se passe-t-il si je saute l'étape 1 (SQL) ?

L'app fonctionnera **en mode dégradé** (localStorage). Tous les flows marchent localement
mais les données ne sont pas partagées entre toi et Augustin. Idéal pour test rapide.

## Que se passe-t-il si je saute l'étape 3 (création users) ?

Tu seras redirigé sur `/login` en boucle car `requireAuth()` refusera l'accès aux pages
protégées. Crée au moins 1 compte.
