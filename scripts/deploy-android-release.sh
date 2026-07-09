#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# deploy-android-release.sh — Build APK y súbelo a Contabo
#
# Requiere: llave SSH configurada para root@185.187.235.253
# (o export CONTABO_PASS si no hay llave, requiere sshpass)
#
# Uso:
#   bash apps-antojados/scripts/deploy-android-release.sh
#   bash apps-antojados/scripts/deploy-android-release.sh --debug  # sin subir, solo build
#
# Resultado: el APK se sirve en:
#   https://api.antojadosmx.mx/downloads/antojadosmx-latest.apk
#
# El landing con QR está en:
#   https://api.antojadosmx.mx/downloads/ (o explorer.antojadosmx.mx/landing/)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_APP_DIR="$SCRIPT_DIR/../apps/android-new"
ANDROID_SDK="$HOME/Library/Android/sdk"
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
CONTABO_HOST="${CONTABO_HOST:-185.187.235.253}"
CONTABO_USER="${CONTABO_USER:-root}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
DEBUG_MODE=false

for arg in "$@"; do
  case "$arg" in
    --debug) DEBUG_MODE=true ;;
    --help|-h)
      echo "Uso: $0 [--debug]"
      echo "  --debug   Solo build, no sube a Contabo"
      exit 0
      ;;
    *) echo "⚠️  Argumento desconocido: $arg"; exit 1 ;;
  esac
done

# ── Java ────────────────────────────────────────────────────────
if [ ! -f "$JAVA_HOME/bin/java" ]; then
  echo " ❌ Java JDK no encontrado."
  exit 1
fi
export JAVA_HOME="$JAVA_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_SDK/platform-tools:$ANDROID_SDK/build-tools/37.0.0:$ANDROID_SDK/emulator:$PATH"
export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"

echo " ✅ $(java -version 2>&1 | head -1)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🚀  Build APK + Deploy a Contabo"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Quasar build ─────────────────────────────────────────────
echo "▸ [1/4] Quasar build..."
cd "$ANDROID_APP_DIR"
NODE_ENV=production npx quasar build
echo "  ✅"

# ── 2. Capacitor sync ──────────────────────────────────────────
echo "▸ [2/4] Capacitor sync..."
cd "$ANDROID_APP_DIR/src-capacitor"
npx cap sync android
echo "  ✅"

# ── 3. Gradle build (APK debug) ────────────────────────────────
echo "▸ [3/4] Gradle assembleDebug..."
cd "$ANDROID_APP_DIR/src-capacitor/android"
./gradlew assembleDebug
APK_PATH="$ANDROID_APP_DIR/src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
  echo " ❌ APK no generado"
  exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo "  📦 $APK_PATH ($APK_SIZE)"

if [ "$DEBUG_MODE" = true ]; then
  echo ""
  echo " ⏸  [DEBUG] Build listo. No se subió a Contabo."
  echo "    APK: $APK_PATH"
  exit 0
fi

# ── 4. Subir a Contabo ────────────────────────────────────────
echo "▸ [4/4] Subiendo a Contabo..."

# Intentar con SSH key primero
if ssh -o BatchMode=yes $SSH_OPTS "${CONTABO_USER}@${CONTABO_HOST}" "echo OK" 2>/dev/null; then
  echo "  🔑 Usando SSH key..."
  scp $SSH_OPTS "$APK_PATH" "${CONTABO_USER}@${CONTABO_HOST}:/opt/api_antojados/downloads/antojadosmx-latest.apk"
elif [ -n "${CONTABO_PASS:-}" ] && command -v sshpass &>/dev/null; then
  echo "  🔑 Usando sshpass..."
  sshpass -p "$CONTABO_PASS" scp $SSH_OPTS "$APK_PATH" "${CONTABO_USER}@${CONTABO_HOST}:/opt/api_antojados/downloads/antojadosmx-latest.apk"
else
  echo " ❌ No hay acceso SSH a Contabo."
  echo "    - Configura llave SSH: ssh-copy-id root@185.187.235.253"
  echo "    - O exporta CONTABO_PASS e instala sshpass"
  echo ""
  echo " 📦 APK local disponible: $APK_PATH"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " ✅  Deploy completado!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📱 Descarga en tu celular:"
echo "     https://api.antojadosmx.mx/downloads/antojadosmx-latest.apk"
echo ""
echo "  🔗 Abre en el navegador:"
echo "     https://api.antojadosmx.mx/downloads/"
echo ""