# Hub Astorya

**CRM / ERP web** pour ASTORYA SGI (ESN / infogérance). Gestion des prospects &
clients, pipeline commercial, chaîne documentaire Sage 50 (devis → commande →
bon de livraison → facture, + factures d'acompte et avoirs), projets &
livraisons, support/hotline, stock, trésorerie — dans une interface unique
adossée à Supabase.

> 📖 **Comprendre le fonctionnement** : [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md)
> 🚀 **Déployer / migrer sur un autre serveur** : [`DEPLOIEMENT.md`](DEPLOIEMENT.md)
> 🗄️ **Base de données** : [`sql/README.md`](sql/README.md) + [`sql/SCHEMA_COMPLET.sql`](sql/SCHEMA_COMPLET.sql)

---

## 1. Stack technique

| Couche | Choix |
|---|---|
| Front | **HTML statique** + composants **React 18 en UMD** (aucun routeur, aucun bundler au runtime) |
| Compilation | JSX `components/*.jsx` → `dist/components/*.js` via **Babel** (`tools/`) |
| Back | **Supabase** : PostgreSQL (+ RLS), Auth (mot de passe + magic link), Storage, Edge Functions (Deno) |
| Hébergement | Statique (Vercel — `vercel.json` fourni, ou tout serveur statique) |
| PDF | **pdfmake** (généré côté navigateur) |

Aucun backend applicatif custom hors Supabase.

---

## 2. Démarrage rapide (développement)

```bash
# 1. Compiler les composants JSX → dist/
cd tools && npm install && npm run build

# 2. Servir la racine du dépôt en statique (exemple)
cd .. && npx serve .        # ou python3 -m http.server

# 3. Ouvrir http://localhost:3000/login (ou le port affiché)
```

La configuration Supabase (URL + clé **publishable**) est dans
[`components/supabase-config.js`](components/supabase-config.js). En l'absence de
Supabase joignable, l'application bascule en **mode dégradé localStorage**
(voir §5).

> ⚠️ `dist/` est **versionné** et servi tel quel (pas de build côté hébergeur).
> **Toujours** relancer `npm run build` et committer `dist/` après une modif de
> `components/*.jsx`.

---

## 3. Structure du dépôt

```
├── *.html                     Une page = un écran (monte un composant UMD)
├── components/
│   ├── api.js                 ★ Couche d'accès données unique (window.api)
│   ├── supabase-config.js     Config projet Supabase (URL + clé publishable)
│   ├── supabase-client.js     Init client Supabase (window.HubSupabase)
│   ├── auth-guard.js          Garde d'authentification + anti-flash
│   ├── constants.js           Constantes & helpers partagés (HubConstants)
│   ├── commercial-pdf.js      ★ Génération PDF des pièces commerciales
│   ├── *.jsx                  Composants React (compilés vers dist/)
│   └── …                      pappers, bodacc, toast, modal, hub-nav, …
├── dist/components/*.js       Composants JSX compilés (versionnés)
├── sql/                       Migrations SQL Supabase (voir sql/README.md)
├── supabase/functions/        Edge Functions Deno (inbound-mail)
├── tools/                     Build Babel (npm run build)
└── vercel.json                Hébergement + en-têtes de sécurité + CSP
```

Chaque fichier `components/*` commence par un **en-tête de commentaire**
décrivant son rôle. `api.js` est découpé en sections numérotées (§1 helpers,
§2 clients, … §7 auth) ; `commercial-pdf.js` est commenté bloc par bloc.

---

## 4. Modules

> ✅ fonctionnel · 🚧 page « Bientôt » (placeholder + roadmap)

| Module | Page | État |
|---|---|---|
| Accueil ERP (tuiles, recherche, notifs) | `index.html` | ✅ |
| CRM — pipeline opportunités | `crm.html` | ✅ |
| Prospects & clients (Pappers/BODACC) | `nouveau-prospect.html`, `fiche-client.html` | ✅ |
| Gestion commerciale (Sage 50) | `gestion-commerciale.html` | ✅ |
| Trésorerie (encaissements/avoirs) | `tresorerie.html` | ✅ |
| Projets & livraisons (BL, signature) | `projets.html`, `projet.html` | ✅ |
| Demandes entrantes (email → devis, IA) | `demandes-entrantes.html` | ✅ |
| Ticketing / hotline 3CX | `ticketing.html` | ✅ |
| Stock (catalogue + parc) | `stock.html` | ✅ |
| Intelligence concurrentielle | `intelligence-concurrentielle.html` | ✅ |
| Templates email, planning, temps & activités, admin | … | ✅ |
| Comptabilité · Facturation · Marketing · Rapports · RH | … | 🚧 |

---

## 5. Conventions & patterns clés

- **`window.api` (api.js)** — point d'entrée unique pour toute lecture/écriture.
  Aucune requête Supabase éparpillée dans les composants.
- **Colonnes réservées + `data` jsonb** — chaque table a quelques colonnes
  « dures » (filtrées/triées) + une colonne `data` jsonb qui absorbe les champs
  variables (évite une migration par nouveau champ).
- **Résilience localStorage** — si Supabase échoue, les écritures tombent en
  `localStorage` (avec toast « mode dégradé »), et les lectures fusionnent
  base + local. L'app ne « plante » jamais ; contrepartie : bien appliquer le
  schéma en base (cf. `DEPLOIEMENT.md`).
- **Chaîne Sage 50** — devis → commande → BL → facture, chaînés par
  `parent_doc_id`, avec cardinalité **stricte 1:1** (une pièce ⇒ au plus un
  enfant de chaque type). Acomptes et avoirs déduits du solde dû.
- **Cache-buster** — chaque `<script src="…?v=AAAAMMJJHHMM">` porte une version,
  incrémentée à chaque livraison pour forcer le rechargement navigateur.
- **Sécurité** — RLS activée sur toutes les tables (utilisateur authentifié
  requis), accès `anon` révoqués ; en-têtes HSTS/CSP/X-Frame-Options via
  `vercel.json` ; garde d'auth anti-flash sur chaque page.

---

## 6. Ce qui reste à faire (roadmap)

- **Modules 🚧** à implémenter : Comptabilité (dont **export FEC**), Facturation
  avancée, Marketing, Rapports/BI, RH & Paie.
- **Tests automatisés** — aucun pour l'instant (à ajouter sur `api.js` et la
  génération PDF en priorité).
- **Durcissement possible** (non requis en mono-société) : contrôle d'accès par
  rôle côté serveur (RLS par groupe), chiffrement du localStorage.
- **Outillage** — automatiser le cache-buster et le build (pré-commit / CI).
- **Schéma** — versionner l'**export réel** du schéma Supabase à côté de
  `sql/SCHEMA_COMPLET.sql` (reconstruction) pour un redéploiement 100 % fidèle.

---

## 7. Index de la documentation

| Fichier | Contenu |
|---|---|
| [`FONCTIONNEMENT.md`](FONCTIONNEMENT.md) | Comment le Hub fonctionne (architecture, flux, modules) |
| [`DEPLOIEMENT.md`](DEPLOIEMENT.md) | Redéploiement complet sur un nouveau serveur/Supabase |
| [`sql/README.md`](sql/README.md) | Ordre d'exécution des migrations SQL |
| [`Hub_Astorya_Documentation_Complete.md`](Hub_Astorya_Documentation_Complete.md) | Documentation commerciale & contractuelle détaillée |

---

*Front statique + Supabase — aucune donnée sensible ni secret serveur n'est
présent dans ce dépôt (seule la clé publishable Supabase, conçue pour être
exposée côté navigateur, figure dans `supabase-config.js`).*
