#!/usr/bin/env bash
#
# SAP-ONAC — Diagnóstico del build del backend
# Ejecuta este script si 'pnpm run build' no genera dist/main.js
#
# Uso (desde la raíz del monorepo):
#   bash scripts/diagnose-build.sh
#

set -euo pipefail

BACKEND_DIR="apps/backend"

echo "================================================"
echo "  SAP-ONAC — Diagnóstico de build del backend"
echo "================================================"
echo ""

echo "1. Versión de Node: $(node --version)"
echo "2. Versión de pnpm: $(pnpm --version)"
echo ""

echo "3. Verificando estructura del monorepo:"
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
  echo "   ❌ ERROR: No estás en la raíz del monorepo sap-onac"
  exit 1
fi
echo "   ✓ Estás en la raíz del monorepo"
echo ""

echo "4. Limpiando build previo..."
cd $BACKEND_DIR
rm -rf dist tsconfig.build.tsbuildinfo .turbo coverage 2>/dev/null
echo "   ✓ Limpieza completada"
echo ""

echo "5. Verificando herramientas:"
echo "   - tsc: $(npx tsc --version 2>&1 || echo 'NO ENCONTRADO')"
echo "   - tsc-alias: $(npx tsc-alias --version 2>&1 || echo 'NO ENCONTRADO')"
echo ""

echo "6. Ejecutando build paso a paso:"
echo "   a) tsc -p tsconfig.build.json"
npx tsc -p tsconfig.build.json 2>&1
echo "   Exit code: $?"
echo ""

if [ -f "dist/main.js" ]; then
  echo "   ✅ tsc generó dist/main.js"
  echo ""
  echo "   b) tsc-alias -p tsconfig.build.json"
  npx tsc-alias -p tsconfig.build.json 2>&1
  echo "   Exit code: $?"
  echo ""

  ALIAS_REFS=$(grep -c '@common\|@config\|@modules\|@shared' dist/main.js 2>/dev/null || echo 0)
  echo "   Referencias sin resolver en main.js: $ALIAS_REFS (debe ser 0)"
  echo ""

  echo "7. Resultado final:"
  echo "   ✅ ÉXITO: dist/main.js generado ($(wc -c < dist/main.js) bytes)"
  echo ""
  echo "   Ahora puedes iniciar el backend con:"
  echo "     pnpm --filter @sap-onac/backend start"
else
  echo "   ❌ tsc NO generó dist/main.js"
  echo ""
  echo "7. Diagnosticando errores de TypeScript:"
  npx tsc -p tsconfig.build.json --noEmit 2>&1 | head -30
  echo ""
  echo "8. Configuración tsconfig efectiva:"
  npx tsc -p tsconfig.build.json --showConfig 2>&1 | grep -E "outDir|rootDir|noEmit|incremental" | head -5
fi

echo ""
echo "================================================"
