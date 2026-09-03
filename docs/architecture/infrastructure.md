# Infrastructure & réseau — Hub Astorya

Schéma visuel : `infrastructure-hub.html` (+ PDF). Tous les échanges en **HTTPS/TLS** ;
secrets et clés de service en **variables d'environnement serveur** (jamais exposés au navigateur).

## Couches

### 1. Postes utilisateurs (client)
- **Navigateur web** — application React 18 (UMD), SPA statique.
- **Outlook (poste)** — envoi d'e-mail pré-rempli (`mailto`).
- **Téléphone 3CX** — appels, clic-pour-appeler.

### 2. Hébergement Edge — Vercel (`hub.astorya.fr`)
- **Front statique** : HTML + React UMD + `dist/` pré-compilé (aucun build serveur).
- **Fonctions serverless `/api/*`** : `find-email`, `send-email`, `calendar-event`, `pappers-proxy`, `3cx-webhook`.
- **En-têtes de sécurité** (`vercel.json`) : HSTS, CSP stricte, X-Frame DENY, nosniff, COOP, Permissions-Policy.
- **Secrets** : variables d'environnement Vercel.
- Cible de continuité : serveur dédié **OVH en France**.

### 3. Base de données — Supabase (`cqdgecllzyqimfuovrpp.supabase.co`)
- **PostgreSQL** (tables métier, soft-delete), **Auth (JWT)**, **RLS** (sécurité au niveau ligne), **Realtime** (wss).
- Accès **client** : clé anon + RLS. Accès **serverless** : `service_role` (serveur uniquement).
- Sauvegardes **PITR** + copie **hors-ligne** (ANSSI 3-2-1).

### 4. CDN & assets (lecture seule, allowlist CSP)
- unpkg · jsDelivr · cdnjs (React, pdfMake, supabase-js) ; Google Fonts (googleapis / gstatic).

### 5. Services externes & API (via serverless avec secrets, ou navigateur via allowlist CSP)
| Service | Rôle |
|---|---|
| Pappers (`api.pappers.fr`) | données légales · via `/api` + proxy |
| Annuaire officiel (`recherche-entreprises.api.gouv.fr`) | SIREN/SIRET |
| BODACC (opendatasoft) | procédures collectives |
| Dropcontact (`api.dropcontact.io`) | e-mails B2B |
| Brave Search (`api.search.brave.com`) | recherche web |
| SendGrid (`api.sendgrid.com`) | envoi e-mail transactionnel |
| Google Calendar (service account) | agenda (Outlook/Graph en option) |
| 3CX | webhook appel entrant → `/api/3cx-webhook` |
| IA — Anthropic / OpenAI | autorisés en CSP (`connect-src`) |

## Cible de souveraineté / reprise (OVH, France)

Consolidation possible de Vercel + GitHub + Supabase managé sur **un serveur dédié OVH**
(auto-hébergé, France) — voir le schéma `migration-ovh.html` et la stack `deploy/ovh/`
(docker-compose : Caddy + hub-api + Supabase self-hosted + Forgejo + sauvegarde 3-2-1).

## Chaîne logicielle (CI/CD)
**Claude Code (web)** → commit/push → **GitHub** (`Asto-lab44/deb02CRM`, branches `claude/*` & `main`) → webhook → **Vercel Build & Deploy** → **`hub.astorya.fr`**.

## Variables d'environnement (serverless)
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAPPERS_API_TOKEN`,
`DROPCONTACT_API_KEY`, `BRAVE_API_KEY`, `SENDGRID_API_KEY`, `EMAIL_FROM`,
`GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`, `CX_WEBHOOK_SECRET`, `PUBLIC_ORIGIN`.

---

*Document d'architecture — ASTORYA S.G.I. · Hub Astorya.*
