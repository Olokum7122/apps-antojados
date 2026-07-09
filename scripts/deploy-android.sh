#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# deploy-android.sh — Script OFICIAL de build+deploy Android
#
# SOLO este script puede ejecutar builds de Android.
# Reemplazo del .ps1 para entornos macOS (sin PowerShell).
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
ANDROID_APP_DIR="$PROJECT_DIR/apps/android-new"
ANDROID_SDK="$HOME/Library/Android/sdk"
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# ── Flags ─────────────────────────────────────────────────────
SKIP_AUDIT=false
DEV_MODE=false

for arg in "$@"; do
  case "$arg" in
    --skip-audit) SKIP_AUDIT=true ;;
    --dev)        DEV_MODE=true ;;
    --help|-h)
      echo "Uso: $0 [--skip-audit] [--dev]"
      exit 0
      ;;
    *)
      echo "⚠️  Argumento desconocido: $arg"
      echo "Uso: $0 [--skip-audit] [--dev]"
      exit 1
      ;;
  esac
done

# ── Verificar Java ─────────────────────────────────────────────
if [ ! -f "$JAVA_HOME/bin/java" ]; then
  echo " ❌ Java JDK no encontrado en: $JAVA_HOME"
  echo "    Instálalo manualmente o configura JAVA_HOME"
  exit 1
fi
export JAVA_HOME="$JAVA_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_SDK/platform-tools:$ANDROID_SDK/build-tools/37.0.0:$ANDROID_SDK/emulator:$ANDROID_SDK/tools/bin:$PATH"
export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"

echo " ✅ Java: $(java -version 2>&1 | head -1)"
echo " ✅ ANDROID_SDK: $ANDROID_HOME"

# ── Banner ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " GUARDIAN — Deploy Android (oficial) - macOS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Verificar versión del pipeline ──────────────────────────────
if [ -f "$SCRIPT_DIR/VERSION" ]; then
  LOCAL_VERSION=$(cat "$SCRIPT_DIR/VERSION")
  echo " 📋 Pipeline version: $LOCAL_VERSION"
else
  echo " ❌ scripts/VERSION no encontrado. Pipeline corrupto."
  exit 1
fi

# ── Generar token de sesión ──────────────────────────────────────
SESSION_TOKEN="android-$(date +%Y%m%d%H%M%S)-$(openssl rand -hex 16 2>/dev/null || echo 'fallback')"
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
ENV_FILE="$ANDROID_APP_DIR/.env.production"
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

# ── Build Quasar web ───────────────────────────────────────────
echo ""
echo " 🏗  Construyendo Quasar web app (Android)..."
echo ""

cd "$ANDROID_APP_DIR"

if [ "$DEV_MODE" = true ]; then
  NODE_ENV=development npx quasar build
else
  NODE_ENV=production npx quasar build
fi

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo " ❌ Quasar build falló."
  exit 1
fi
echo " ✅ Quasar build complete"

# ── Capacitor sync ────────────────────────────────────────────
echo "▸ Syncing Capacitor Android..."
cd "$ANDROID_APP_DIR/src-capacitor"
npx cap sync android
echo "  ✅ Capacitor sync complete"

# ── Gradle build ──────────────────────────────────────────────
echo ""
echo " 🏗  Compilando APK Android debug..."
echo ""

cd "$ANDROID_APP_DIR/src-capacitor/android"

if [ "$DEV_MODE" = true ]; then
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo " ❌ Gradle build falló."
  exit 1
fi
echo " ✅ APK generado."

# ── Verificar APK ─────────────────────────────────────────────
FULL_APK_PATH="$ANDROID_APP_DIR/src-capacitor/android/$APK_PATH"
if [ -f "$FULL_APK_PATH" ]; then
  echo " 📦 APK: $FULL_APK_PATH"
  APK_SIZE=$(du -h "$FULL_APK_PATH" | cut -f1)
  echo "    Tamaño: $APK_SIZE"
else
  echo " ⚠  No se encontró APK en la ruta esperada."
  echo "    Buscando..."
  find "$ANDROID_APP_DIR/src-capacitor/android" -name "*.apk" 2>/dev/null
fi

# ── Verificar ADB y emulador ──────────────────────────────────
echo ""
echo " 📱 Verificando ADB..."
ADB_BIN="$ANDROID_SDK/platform-tools/adb"
if [ -f "$ADB_BIN" ]; then
  DEVICES=$("$ADB_BIN" devices 2>/dev/null | grep -v "List of devices" | grep -v "^$" | wc -l | tr -d ' ')
  if [ "$DEVICES" -gt 0 ]; then
    echo "    Dispositivos/Emuladores detectados: $DEVICES"
    "$ADB_BIN" devices -l 2>/dev/null
  else
    echo "    No hay dispositivos/emuladores conectados."
    echo "    Para probar, conecta un dispositivo o inicia un emulador:"
    echo "    $ANDROID_SDK/emulator/emulator -avd <avd_name>"
  fi
else
  echo "    ADB no encontrado."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🔄 Proceso de Android completado."
echo "═══════════════════════════════════════════════════════════════"

unset GUARDIAN_SESSION