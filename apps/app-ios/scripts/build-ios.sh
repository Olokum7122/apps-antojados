#!/usr/bin/env bash
# ============================================================
# build-ios.sh
# Build completo para iOS: Quasar → Capacitor sync → Xcode build
# Uso:
#   ./scripts/build-ios.sh                    # Build debug para simulador
#   ./scripts/build-ios.sh --release           # Build release para dispositivo/archive
#   ./scripts/build-ios.sh --archive           # Archive para App Store / TestFlight
#   ./scripts/build-ios.sh --simulator         # Forzar build para simulador
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CAPACITOR_DIR="$PROJECT_DIR/src-capacitor"
IOS_DIR="$CAPACITOR_DIR/ios/App"
# Nombre del scheme en Xcode (debe coincidir con el target)
SCHEME="App"
CONFIGURATION="Debug"
DESTINATION=""
ARCHIVE=false

for arg in "$@"; do
  case "$arg" in
    --release)
      CONFIGURATION="Release"
      ;;
    --archive)
      CONFIGURATION="Release"
      ARCHIVE=true
      ;;
    --simulator)
      DESTINATION="generic/platform=iOS Simulator"
      ;;
    *)
      echo "⚠️  Argumento desconocido: $arg"
      echo "Uso: $0 [--release|--archive|--simulator]"
      exit 1
      ;;
  esac
done

echo "┌─────────────────────────────────────────────────┐"
echo "│      AntojadosMX iOS - Build & Deploy           │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "  Configuración: $CONFIGURATION"
echo "  Archive:       $ARCHIVE"
echo ""

# ── Step 1: Quasar build (con modo correcto) ──
echo "▸ Step 1/4: Building Quasar web app..."
cd "$PROJECT_DIR"
if [ "$CONFIGURATION" = "Release" ]; then
  echo "  → Modo production (cargando .env.production)"
  NODE_ENV=production quasar build
else
  echo "  → Modo development"
  quasar build
fi
echo "  ✅ Quasar build complete"

# ── Step 2: Copy to Capacitor www ──
echo "▸ Step 2/4: Copying web assets to Capacitor www..."
rm -rf "$CAPACITOR_DIR/www"
cp -r dist/spa "$CAPACITOR_DIR/www"
echo "  ✅ Web assets copied to www/"

# ── Step 3: Capacitor sync ──
echo "▸ Step 3/4: Syncing Capacitor..."
cd "$CAPACITOR_DIR"
npx cap sync ios
echo "  ✅ Capacitor sync complete"

# ── Step 4: Xcode build ──
if [ "$ARCHIVE" = true ]; then
  echo "▸ Step 4/4: Archiving for App Store / TestFlight..."
  cd "$IOS_DIR"
  xcodebuild archive \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$PROJECT_DIR/build/antojadosmx-ios.xcarchive" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Automatic
  echo "  ✅ Archive created: build/antojadosmx-ios.xcarchive"
  echo ""
  echo "  Para exportar a .ipa (App Store):"
  echo "  xcodebuild -exportArchive \\"
  echo "    -archivePath build/antojadosmx-ios.xcarchive \\"
  echo "    -exportPath build/ \\"
  echo "    -exportOptionsPlist export-options.plist \\"
  echo "    -allowProvisioningUpdates"
else
  echo "▸ Step 4/4: Building Xcode project..."
  cd "$IOS_DIR"
  if [ -z "$DESTINATION" ]; then
    # Build genérico (funciona para dispositivo conectado)
    xcodebuild build \
      -scheme "$SCHEME" \
      -configuration "$CONFIGURATION" \
      -allowProvisioningUpdates \
      CODE_SIGN_STYLE=Automatic
  else
    xcodebuild build \
      -scheme "$SCHEME" \
      -configuration "$CONFIGURATION" \
      -destination "$DESTINATION" \
      -allowProvisioningUpdates \
      CODE_SIGN_STYLE=Automatic
  fi
  echo "  ✅ Xcode build complete"
fi

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│              ✅ Build Successful!                │"
echo "└─────────────────────────────────────────────────┘"
