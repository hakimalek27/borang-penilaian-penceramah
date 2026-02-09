#!/bin/bash
# Backup script for BPP PostgreSQL database
# Usage: ./scripts/backup-db.sh
# Cron: 0 2 * * * /var/www/mamkl.my/bpp/scripts/backup-db.sh

BACKUP_DIR="/var/www/mamkl.my/bpp/backups"
DB_NAME="bpp"
DB_USER="bpp_app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bpp_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    echo "[$(date)] Backup berjaya: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    echo "[$(date)] ERROR: Backup gagal!" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Padam backup lama (> 30 hari)
find "$BACKUP_DIR" -name "bpp_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Cleanup: padam backup lebih $KEEP_DAYS hari"
