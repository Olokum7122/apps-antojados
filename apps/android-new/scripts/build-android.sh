#!/usr/bin/env bash
# ============================================================
# build-android.sh
# Build completo para Android: Quasar → Capacitor sync → Gradle build
# Uso:
#   ./scripts/build-android.sh                    # Build debug APK
#   ./scripts/build-android.sh --release          # Build release APK/AAB
#   ./scripts/build-android.sh --bundle           # Build release AAB (Play Store)
#   ./scripts/build-android.sh --install          # Build debug + install en dispositivo
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CAPACITOR_DIR="$PROJECT_DIR/src-capacitor"
ANDROID_DIR="$CAPACITOR_DIR/android"

CONFIGURATION="debug"
BUILD_TYPE="debug"
INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --release)
      CONFIGURATION="release"
      BUILD_TYPE="release"
      ;;
    --bundle)
      CONFIGURATION="release"
      BUILD_TYPE="bundleRelease"
      ;;
    --install)
      INSTALL=true
      ;;
    *)
      echo "⚠️  Argumento desconocido: $arg"
      echo "Uso: $0 [--release|--bundle|--install]"
      exit 1
      ;;
  esac
done

echo "┌─────────────────────────────────────────────────┐"
echo "│   AntojadosMX Android - Build & Deploy           │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "  Configuración: $CONFIGURATION"
echo "  Build type:    $BUILD_TYPE"
echo "  Install:       $INSTALL"
echo ""

# ── Step 1: Quasar build (con modo correcto) ──
echo "▸ Step 1/4: Building Quasar web app..."
cd "$PROJECT_DIR"
if [ "$CONFIGURATION" = "release" ]; then
  echo "  → Modo production (cargando .env.production)"
  NODE_ENV=production quasar build
else
  echo "  → Modo development"
  quasar build
fi
echo "  ✅ Quasar build complete"

# ── Step 2: Capacitor sync ──
echo "▸ Step 2/4: Syncing Capacitor..."
cd "$CAPACITOR_DIR"
npx cap sync android
echo "  ✅ Capacitor sync complete"

# ── Step 3: Gradle build ──
echo "▸ Step 3/4: Building Android with Gradle..."
cd "$ANDROID_DIR"

if [ "$BUILD_TYPE" = "bundleRelease" ]; then
  ./gradlew bundleRelease
  echo ""
  echo "  ✅ AAB generado en:"
  echo "     android/app/build/outputs/bundle/release/app-release.aab"
elif [ "$BUILD_TYPE" = "release" ]; then
  ./gradlew assembleRelease
  echo ""
  echo "  ✅ APK release generado en:"
  echo "     android/app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  echo ""
  echo "  ✅ APK debug generado en:"
  echo "     android/app/build/outputs/apk/debug/app-debug.apk"
fi

# ── Step 4: Install (opcional) ──
if [ "$INSTALL" = true ]; then
  echo "▸ Step 4/4: Installing on device..."
  if [ "$BUILD_TYPE" = "bundleRelease" ]; then
    echo "  ⚠️  No se puede instalar un AAB directamente. Usa bundletool o instala el APK debug."
  else
    cd "$ANDROID_DIR"
    if [ "$BUILD_TYPE" = "release" ]; then
      ./gradlew installRelease
    else
      ./gradlew installDebug
    fi
    echo "  ✅ App installed on device"
  fi
fi

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│            ✅ Build Successful!                  │"
echo "└─────────────────────────────────────────────────┘"
