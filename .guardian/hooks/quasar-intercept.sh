#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GUARDIAN — Shell wrapper for quasar interception (macOS/Linux)
#
# Este script debe estar en el PATH primero.
# Se activa via alias en .zshrc o profile
# ═══════════════════════════════════════════════════════════════

if [ -z "$GUARDIAN_SESSION" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo " 🔒 GUARDIAN: ACCESO DENEGADO"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo " No puedes ejecutar 'quasar' directamente."
    echo " Usa el script oficial para tu plataforma:"
    echo ""
    echo "   📱 Android:   scripts/deploy-android.ps1"
    echo "   🍎 iOS:       scripts/deploy-ios.ps1"
    echo "   🌐 Gateway:   scripts/deploy-api-gateway.ps1"
    echo ""
    echo " O ejecuta con GUARDIAN_SESSION si sabes lo que haces:"
    echo ""
    echo "   export GUARDIAN_SESSION=\"manual-\$(date +%s%3N)\""
    echo "   quasar [tus argumentos]"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi

# Validar sesión contra el core
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
node "$SCRIPT_DIR/scripts/guardian-core.mjs" --intercept
if [ $? -ne 0 ]; then
    echo " ❌ GUARDIAN: Falló la validación del contrato. Build abortado."
    exit 1
fi

# Ejecutar quasar real
REAL_QUASAR=$(which quasar 2>/dev/null)
if [ -z "$REAL_QUASAR" ]; then
    # Buscar en node_modules
    REAL_QUASAR="$SCRIPT_DIR/node_modules/.bin/quasar"
    if [ ! -f "$REAL_QUASAR" ]; then
        REAL_QUASAR="$SCRIPT_DIR/apps/app-ios/node_modules/.bin/quasar"
    fi
    if [ ! -f "$REAL_QUASAR" ]; then
        echo " ❌ GUARDIAN: No se encontró quasar real."
        exit 1
    fi
fi

echo " ✅ GUARDIAN: Sesión validada. Ejecutando quasar..."
exec "$REAL_QUASAR" "$@"