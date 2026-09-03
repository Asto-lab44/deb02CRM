# Déploiement & migration OVH — Hub Astorya

Cible **PRA / souveraineté** : héberger tout le Hub sur **un serveur dédié OVH (France)**
et remplacer **Vercel** (edge + serverless), **GitHub** (source + CI) et **Supabase managé**
par des services **auto-hébergés**.

> ⚠️ **Squelette de référence** à adapter. Un serveur unique est un **point de défaillance
> unique** : prévoir une **sauvegarde hors-site** (OVH Backup Storage) et idéalement un **2ᵉ serveur**
> (réplica). Voir `docs/architecture/pra.md`.

## 0. Serveur recommandé
- **OVH Rise-1** — Xeon E-2386G (6c/12t), 32 Go DDR4 ECC, 2×512 Go NVMe RAID logiciel, ~55–65 €/mo HT.
- Datacenter **France** (GRA / RBX / SBG). Debian 12 + Docker + Docker Compose.
- Pour la croissance / redondance : **Rise-2** (jusqu'à 128 Go, 2×1,92 To) ou **2× Rise-1**.

## Composants (ce dossier)
| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Caddy (TLS/edge) + `hub-api` (fonctions `/api`) + Forgejo (Git) + backup |
| `Caddyfile` | Reverse proxy + TLS auto + en-têtes de sécurité (équiv. `vercel.json`) |
| `server.mjs` | Adaptateur qui monte les fonctions Vercel `/api/*.js` sur un serveur Node |
| `.env.example` | Modèle de secrets (copier en `.env`, **ne pas committer**) |
| `backup.sh` | Sauvegarde logique PostgreSQL (3-2-1) + réplication hors-site |

## 1. Préparer le serveur
```bash
# Debian 12, en root
apt update && apt install -y docker.io docker-compose-plugin git rsync
git clone https://github.com/Asto-lab44/deb02CRM /opt/hub-astorya
cd /opt/hub-astorya/deploy/ovh
cp .env.example .env && nano .env     # renseigner les secrets
```

## 2. Compiler le front (si besoin)
```bash
cd /opt/hub-astorya/tools && npm ci && npm run build   # génère dist/
```
Caddy sert ensuite `dist/` + les `*.html` directement (pas de build serveur permanent).

## 3. Base de données — Supabase self-hosted (remplace Supabase managé)
Le Hub utilise `@supabase/supabase-js` : on déploie le **Supabase self-hosted officiel**
(qui fournit Postgres + Auth + PostgREST + Realtime + Storage + la gateway Kong).
```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase
cp /opt/supabase/docker/.env.example /opt/supabase/docker/.env
# → générer POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY (doc Supabase)
cd /opt/supabase/docker && docker compose up -d
```
Reporter `ANON_KEY` / `SERVICE_ROLE_KEY` / `POSTGRES_PASSWORD` dans `deploy/ovh/.env`.
Le réseau Docker créé s'appelle `supabase_default` (utilisé par notre compose).

**Migration des données** depuis le Supabase managé actuel :
```bash
# Export depuis le projet managé (dashboard → Database → connection string)
pg_dump "$SRC_SUPABASE_URL" --no-owner --no-privileges -Fc -f hub.dump
# Import dans le Supabase self-hosted
pg_restore -d "postgres://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres" --no-owner hub.dump
```
Vérifier les **policies RLS** et les rôles après import.

## 4. Démarrer l'overlay Hub (Caddy + API + Git)
```bash
cd /opt/hub-astorya/deploy/ovh
docker compose up -d
docker compose logs -f caddy hub-api
```

## 5. DNS (bascule)
Créer les enregistrements **A** vers l'IP du serveur OVH :
`hub.astorya.fr`, `supabase.astorya.fr`, `git.astorya.fr`.
Caddy obtient les certificats Let's Encrypt automatiquement.
> Astuce PRA : baisser le **TTL** avant bascule pour accélérer la propagation.

## 6. Git (remplace GitHub)
1. Créer l'organisation/dépôt dans **Forgejo** (`git.astorya.fr`).
2. Ajouter un remote miroir : `git remote add ovh https://git.astorya.fr/asto/deb02CRM && git push ovh --all`.
3. CI/déploiement : hook Forgejo Actions → `git pull` + `docker compose up -d` (ou script `deploy.sh`).

## 7. Sauvegarde (indispensable au PRA)
- `backup.sh` fait un `pg_dump` compressé quotidien (planifier via **cron hôte**).
- **Répliquer hors-site** (décommenter `rsync`/`rclone` dans `backup.sh`) + garder une **copie hors-ligne** (anti-rançongiciel). Règle **3-2-1**.
- PITR : activer l'**archivage WAL** de PostgreSQL pour un RPO fin (cf. doc Supabase self-host / `postgresql.conf`).

## 8. Rollback
Tant que Vercel + Supabase managé restent actifs, un **rollback DNS** (repointer vers Vercel)
ramène l'ancienne infra en minutes. Ne décommissionner l'ancienne qu'après **période d'observation**.

---

### Correspondance avec l'ancienne infra
| Avant (managé) | Après (OVH, auto-hébergé) |
|---|---|
| Vercel edge + TLS + CDN | **Caddy** (reverse proxy + Let's Encrypt) |
| Vercel serverless `/api` | **hub-api** (Node, `server.mjs`) |
| Supabase managé | **Supabase self-hosted** (Docker officiel) |
| GitHub | **Forgejo** (Git + CI) |
| Sauvegardes managées / PITR | **backup.sh** + WAL + réplication hors-site |

*Réf. : `docs/architecture/infrastructure.md`, `pra.md`, `pca.md`.*
