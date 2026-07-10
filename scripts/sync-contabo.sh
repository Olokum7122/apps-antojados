#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# sync-contabo.sh — Sincroniza Api_getaway_antojadosmx → Contabo
#
# USO:
#   ./scripts/sync-contabo.sh              # Sync completo + restart PM2
#   ./scripts/sync-contabo.sh --dry-run    # Solo muestra qué se sincronizaría
#   ./scripts/sync-contabo.sh --no-restart # Sync sin reiniciar PM2
#
# EJECUCIÓN MANUAL:
#   npm run sync:contabo
#
# EJECUCIÓN DESDE QUASAR (beforeBuild):
#   Se llama automáticamente en quasar.config.js beforeBuild
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuración ──────────────────────────────────────────────────────────
SSH_HOST="185.187.235.253"
SSH_USER="root"
LOCAL_GATEWAY_DIR="$(cd "$(dirname "$0")/../Api_getaway_antojadosmx" && pwd)"
REMOTE_DIR="/opt/api_antojados"

# ─── Colores para output ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🔄 Sincronizando Gateway → Contabo (${SSH_HOST})        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Local:${NC}  ${LOCAL_GATEWAY_DIR}"
echo -e "  ${YELLOW}Remoto:${NC} ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
echo ""

# ─── Flags ─────────────────────────────────────────────────────────────────
DRY_RUN=false
NO_RESTART=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --no-restart) NO_RESTART=true ;;
  esac
done

RSYNC_OPTS="-avz --delete --exclude=node_modules --exclude=.env --exclude=downloads --exclude=uploads --exclude=*.log"

if [ "$DRY_RUN" = true ]; then
  RSYNC_OPTS="${RSYNC_OPTS} --dry-run"
  echo -e "  ${YELLOW}🔍 Modo dry-run — solo mostrando cambios...${NC}"
  echo ""
fi

# ─── 1. Rsync de archivos ─────────────────────────────────────────────────
echo -e "  ${CYAN}📂 Transfiriendo archivos...${NC}"

rsync ${RSYNC_OPTS} \
  --rsync-path="rsync" \
  -e "ssh -o StrictHostKeyChecking=no" \
  "${LOCAL_GATEWAY_DIR}/" \
  "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

RSYNC_EXIT=$?

if [ $RSYNC_EXIT -ne 0 ]; then
  echo -e "  ${RED}❌ Error en rsync (exit code: ${RSYNC_EXIT})${NC}"
  exit $RSYNC_EXIT
fi

echo -e "  ${GREEN}✅ Archivos sincronizados correctamente${NC}"
echo ""

# ─── 2. Restart PM2 ───────────────────────────────────────────────────────
if [ "$DRY_RUN" = false ] && [ "$NO_RESTART" = false ]; then
  echo -e "  ${CYAN}🔄 Reiniciando api_antojados en PM2...${NC}"

  ssh ${SSH_USER}@${SSH_HOST} "pm2 restart api_antojados" 2>&1

  echo -e "  ${GREEN}✅ PM2 reiniciado${NC}"
  echo ""

  # ─── 3. Verificar estado ────────────────────────────────────────────────
  echo -e "  ${CYAN}🔍 Verificando estado...${NC}"
  sleep 2
  ssh ${SSH_USER}@${SSH_HOST} "pm2 show api_antojados | grep -E 'status|uptime|restarts'" 2>&1

  echo ""
  echo -e "  ${GREEN}✅ Sincronización completada exitosamente${NC}"
elif [ "$DRY_RUN" = true ]; then
  echo -e "  ${YELLOW}🔍 Dry-run — no se reinició PM2${NC}"
else
  echo -e "  ${YELLOW}⏭️  Saltando reinicio PM2 (flag --no-restart)${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅ Sincronización completada                                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
