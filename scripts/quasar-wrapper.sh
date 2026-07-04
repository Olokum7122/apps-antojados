#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GUARDIAN WRAPPER — Intercepta el comando 'quasar'
#
# Este script REEMPLAZA el binario quasar en el PATH del proyecto.
# Cuando alguien (agente/humano) intenta ejecutar quasar directamente
# SIN pasar por el script PS1 oficial, este wrapper lo BLOQUEA.
# ═══════════════════════════════════════════════════════════════

# Detectar si venimos de un script PS1 oficial (GUARDIAN_SESSION)
if [ -z "$GUARDIAN_SESSION" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo " 🔒 GUARDIAN: ACCESO DENEGADO"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo " No puedes ejecutar 'quasar' directamente."
    echo " Usa el script PS1 oficial para tu plataforma:"
    echo ""
    echo "   📱 Android:  .\\scripts\\deploy-android.ps1"
    echo "   🍎 iOS:      .\\scripts\\deploy-ios.ps1"
    echo "   🌐 Gateway:  .\\scripts\\deploy-api-gateway.ps1"
    echo ""
    echo " O si ya sabes lo que haces, ejecuta con GUARDIAN_SESSION:"
    echo ""
    echo "   export GUARDIAN_SESSION=manual-\$(date +%s)"
    echo "   quasar [tus argumentos]"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi

# Validar sesión contra el core
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/guardian-core.mjs" --intercept
if [ $? -ne 0 ]; then
    echo " ❌ GUARDIAN: Falló la validación del contrato. Build abortado."
    exit 1
fi

# Si llegamos aquí, la sesión es válida y el contrato se cumple
# Buscar el quasar REAL y ejecutarlo
REAL_QUASAR=""

# Posibles ubicaciones del quasar real
CANDIDATES=(
    "$(dirname "$0")/../node_modules/.bin/quasar"
    "$(dirname "$0")/../node_modules/.bin/quasar.cmd"
    "$(dirname "$0")/../apps/app-ios/node_modules/.bin/quasar"
    "$(dirname "$0")/../apps/android-new/node_modules/.bin/quasar"
    "/usr/local/bin/quasar"
    "/usr/bin/quasar"
)

for c in "${CANDIDATES[@]}"; do
    if [ -f "$c" ]; then
        REAL_QUASAR="$c"
        break
    fi
done

# Buscar con which como fallback
if [ -z "$REAL_QUASAR" ]; then
    REAL_QUASAR=$(which quasar 2>/dev/null || which quasar.cmd 2>/dev/null || echo "")
fi

if [ -z "$REAL_QUASAR" ]; then
    echo " ❌ GUARDIAN: No se encontró quasar real en el sistema."
    echo "   Instálalo con: npm install -g @quasar/cli"
    exit 1
fi

echo " ✅ GUARDIAN: Sesión validada. Ejecutando quasar real desde: $REAL_QUASAR"
echo ""

# Ejecutar el quasar real con todos los argumentos
exec "$REAL_QUASAR" "$@"