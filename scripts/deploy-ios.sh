#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# deploy-ios.sh — Script OFICIAL de build+deploy iOS para macOS
#
# SOLO este script puede ejecutar builds de iOS.
# Reemplazo del .ps1 para entornos macOS (sin PowerShell).
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
IOS_APP_DIR="$PROJECT_DIR/apps/app-ios"

# ── Flags ─────────────────────────────────────────────────────
SKIP_AUDIT=false
DEV_MODE=false
STAGING=false

for arg in "$@"; do
  case "$arg" in
    --skip-audit) SKIP_AUDIT=true ;;
    --dev)        DEV_MODE=true ;;
    --staging)    STAGING=true ;;
    --help|-h)
      echo "Uso: $0 [--skip-audit] [--dev] [--staging]"
      exit 0
      ;;
    *)
      echo "⚠️  Argumento desconocido: $arg"
      echo "Uso: $0 [--skip-audit] [--dev] [--staging]"
      exit 1
      ;;
  esac
done

# ── Banner ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " GUARDIAN — Deploy iOS (oficial) - macOS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Verificar versión del pipeline ──────────────────────────────
LOCAL_VERSION=""
if [ -f "$SCRIPT_DIR/VERSION" ]; then
  LOCAL_VERSION=$(cat "$SCRIPT_DIR/VERSION")
fi

if [ -z "$LOCAL_VERSION" ]; then
  echo " ❌ scripts/VERSION no encontrado. Pipeline corrupto."
  exit 1
fi
echo " 📋 Pipeline version: $LOCAL_VERSION"

# ── Generar token de sesión ──────────────────────────────────────
SESSION_TOKEN="ios-$(date +%Y%m%d%H%M%S)-$(openssl rand -hex 16 2>/dev/null || echo 'fallback')"
export GUARDIAN_SESSION="$SESSION_TOKEN"
echo " 🔑 Sesión generada: ${SESSION_TOKEN:0:20}..."

# ── Ejecutar auditoría del contrato (opcional) ──────────────────
if [ "$SKIP_AUDIT" = false ]; then
  echo " 🔍 Ejecutando auditoría de contrato HTTP/Render..."
  if ! node "$SCRIPT_DIR/guardian-core.mjs" --intercept 2>&1; then
    echo " ❌ GUARDIAN: Auditoría falló. Corrige las violaciones antes de continuar."
    exit 1
  fi
  echo " ✅ Auditoría superada."
fi

# ── Verificar .env ──────────────────────────────────────────────
if [ "$STAGING" = true ]; then
  ENV_FILE="$IOS_APP_DIR/.env.staging"
else
  ENV_FILE="$IOS_APP_DIR/.env.production"
fi

if [ -f "$ENV_FILE" ]; then
  API_URL=$(grep 'VITE_API_URL' "$ENV_FILE" | sed "s/VITE_API_URL=//" | tr -d '"' | tr -d "'" | tr -d ' ')
  if [ "$API_URL" != "https://api.antojadosmx.mx" ]; then
    echo " ❌ $ENV_FILE tiene VITE_API_URL='$API_URL'. Debe ser 'https://api.antojadosmx.mx'"
    exit 1
  fi
  echo " ✅ $(basename "$ENV_FILE") verificado."
else
  echo " ⚠  No se encontró $ENV_FILE"
fi

# ── Build Quasar (web) ─────────────────────────────────────────
echo ""
echo " 🏗  Construyendo Quasar web app..."
echo ""

cd "$IOS_APP_DIR"

NODE_ENV=production npx quasar build

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo " ❌ Quasar build falló."
  exit 1
fi
echo " ✅ Quasar build complete"

# ── Copy web assets to Capacitor www ──────────────────────────
echo "▸ Copiando assets web a Capacitor www..."
rm -rf "$IOS_APP_DIR/src-capacitor/www"
cp -r dist/spa "$IOS_APP_DIR/src-capacitor/www"
echo "  ✅ Web assets copied to www/"

# ── Capacitor sync ────────────────────────────────────────────
echo "▸ Syncing Capacitor..."
cd "$IOS_APP_DIR/src-capacitor"
npx cap sync ios
echo "  ✅ Capacitor sync complete"

# ── Build + Deploy para Simulador ─────────────────────────────
echo ""
echo " 🚀 Compilando e instalando en iPhone 17 Pro Max Simulator..."
echo ""

cd "$IOS_APP_DIR/src-capacitor/ios/App"

# Build para simulador sin code signing
xcodebuild build \
  -scheme "App" \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=iPhone 17 Pro Max" \
  -derivedDataPath "$IOS_APP_DIR/dist/capacitor/ios-sim" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGN_STYLE=Manual \
  2>&1

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo " ❌ Build para simulador falló."
  exit 1
fi
echo " ✅ Build para simulador completado."

# ── Obtener ruta del .app compilado ────────────────────────────
BUILD_DIR="$IOS_APP_DIR/dist/capacitor/ios-sim/Build/Products/Debug-iphonesimulator"
APP_PATH="$BUILD_DIR/App.app"

if [ -d "$APP_PATH" ]; then
  echo " 📦 App compilada en: $APP_PATH"
  
  # Instalar en simulador
  echo " 📲 Instalando en iPhone 17 Pro Max..."
  xcrun simctl install "iPhone 17 Pro Max" "$APP_PATH" 2>&1
  echo " ✅ App instalada en simulador"
  
  # Lanzar la app
  echo " ▶️  Lanzando app..."
  xcrun simctl launch "iPhone 17 Pro Max" "com.atlx.antojadosmx" 2>&1
  echo " ✅ App lanzada en iPhone 17 Pro Max!"
else
  echo " ❌ No se encontró la app compilada en: $APP_PATH"
  echo "    Abre el proyecto en Xcode:"
  echo "    xed $IOS_APP_DIR/src-capacitor/ios/App"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🔄 Proceso de iOS completado."
echo "═══════════════════════════════════════════════════════════════"

unset GUARDIAN_SESSION