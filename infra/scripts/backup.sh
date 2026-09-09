#!/usr/bin/env bash
# SAP-ONAC — Respaldo diario de MySQL
set -euo pipefail

CONTAINER_NAME="${MYSQL_CONTAINER:-sap-onac-mysql}"
BACKUP_DIR="${BACKUP_DIR:-/home/sap-onac/backups}"
DB_NAME="${DB_NAME:-sap_onac_prod}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:?Set MYSQL_ROOT_PASSWORD env var}"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "💾 Iniciando respaldo de ${DB_NAME}..."

docker exec "$CONTAINER_NAME" \
  mysqldump -u"$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --routines --triggers --events \
  --databases "$DB_NAME" \
  | gzip > "$FILENAME"

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete

if [ -n "${NAS_HOST:-}" ]; then
  echo "📤 Copiando a NAS remoto..."
  scp "$FILENAME" "${NAS_USER:?}@${NAS_HOST}:${NAS_PATH:?}/"
fi

echo "✅ Respaldo completado: $FILENAME"
ls -lh "$FILENAME" || true
