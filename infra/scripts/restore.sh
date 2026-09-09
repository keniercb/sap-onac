#!/usr/bin/env bash
# SAP-ONAC — Restaurar MySQL desde un backup
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <ruta_al_backup_sql_gz>"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${MYSQL_CONTAINER:-sap-onac-mysql}"
DB_NAME="${DB_NAME:-sap_onac_prod}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:?Set MYSQL_ROOT_PASSWORD env var}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ No se encontró el archivo: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  Esto va a SOBREESCRIBIR la base de datos '${DB_NAME}'."
read -rp "¿Continuar? (escriba SI): " CONFIRM
[ "$CONFIRM" = "SI" ] || { echo "Operación cancelada."; exit 0; }

echo "♻️  Restaurando desde $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" \
  mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

echo "✅ Restauración completada."
