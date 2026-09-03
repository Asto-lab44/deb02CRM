#!/bin/sh
# backup.sh — Sauvegarde logique PostgreSQL (règle 3-2-1, conforme ANSSI).
# Prévu pour tourner en cron (voir docker-compose: service "backup").
# 1 copie locale chiffrée + à répliquer hors-site (OVH Backup Storage / rsync).
set -eu

STAMP=$(date +%Y%m%d-%H%M%S)
DIR=/backups
OUT="$DIR/hub-$STAMP.sql.gz"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"

echo "[backup] dump $PGDATABASE @ $PGHOST -> $OUT"
pg_dump --no-owner --no-privileges | gzip -9 > "$OUT"

# Purge des sauvegardes locales au-delà de la rétention
find "$DIR" -name 'hub-*.sql.gz' -mtime +"$RETENTION" -delete || true

# --- À DÉCOMMENTER : réplication HORS-SITE (indispensable au PRA) ---
# rsync -az "$OUT" backup@offsite:/srv/hub-backups/         # 2e site
# ou : rclone copy "$OUT" ovh-backup-storage:hub-backups/   # OVH Backup Storage
# Idéalement, garder aussi une copie HORS-LIGNE (déconnectée) — anti-rançongiciel.

echo "[backup] done"
