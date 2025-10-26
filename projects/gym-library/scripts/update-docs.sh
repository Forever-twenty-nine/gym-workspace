#!/bin/bash

# Script para mantener la documentación actualizada
# Uso: ./scripts/update-docs.sh

set -e

echo "🔄 Actualizando documentación de Gym Library..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "src/lib" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz de gym-library"
    exit 1
fi

# Ejecutar tests con cobertura
echo "🧪 Ejecutando tests con cobertura..."
npm run test:coverage

# Generar documentación API
echo "📖 Generando documentación API..."
npx typedoc

# Verificar que la documentación se generó correctamente
if [ ! -d "docs/api" ]; then
    echo "❌ Error: No se pudo generar la documentación API"
    exit 1
fi

# Verificar cobertura mínima
COVERAGE_FILE="coverage/coverage-summary.json"
if [ -f "$COVERAGE_FILE" ]; then
    TOTAL_COVERAGE=$(jq '.total.lines.pct' "$COVERAGE_FILE")
    echo "📊 Cobertura total: ${TOTAL_COVERAGE}%"

    if (( $(echo "$TOTAL_COVERAGE < 70" | bc -l) )); then
        echo "⚠️  Advertencia: Cobertura por debajo del 70%"
    fi
else
    echo "⚠️  No se pudo leer el archivo de cobertura"
fi

echo "✅ Documentación actualizada exitosamente!"
echo ""
echo "📁 Archivos generados:"
echo "  - docs/api/ (documentación API)"
echo "  - coverage/ (reportes de cobertura)"
echo ""
echo "🔗 Abrir documentación: file://$(pwd)/docs/api/index.html"