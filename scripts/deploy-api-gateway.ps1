#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════
# deploy-api-gateway.ps1 — Script OFICIAL de deploy del API Gateway
#
# SOLO este script puede desplegar el API Gateway.
# Valida que las rutas internas no se filtren a producción.
# ═══════════════════════════════════════════════════════════════
param(
    [switch]$SkipAudit,
    [switch]$RestartOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Banner ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " GUARDIAN — Deploy API Gateway (oficial)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Verificar versión del pipeline ──────────────────────────────
$localVersion = Get-Content "$PSScriptRoot\VERSION" -ErrorAction SilentlyContinue
if (-not $localVersion) {
    Write-Error "scripts/VERSION no encontrado. Pipeline corrupto."
    exit 1
}

try {
    $remoteVersion = & git ls-remote origin HEAD "refs/heads/main:scripts/VERSION" 2>$null
    if ($remoteVersion -and $remoteVersion -ne $localVersion) {
        Write-Host " 🟡 Pipeline desactualizado. Local: $localVersion, Remoto: $remoteVersion" -ForegroundColor Yellow
        Write-Host " ➜ Actualizando pipeline..." -ForegroundColor Yellow
        & git pull origin main --ff-only 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ Pipeline actualizado. Re-ejecuta este script." -ForegroundColor Green
            exit 0
        } else {
            Write-Warning "No se pudo actualizar automáticamente. Haz git pull manual."
        }
    }
} catch {
    Write-Warning "No se pudo verificar versión remota (sin conexión?)."
}

# ── Generar token de sesión ──────────────────────────────────────
$sessionToken = "api-$((Get-Date -Format 'yyyyMMddHHmmss'))-$([System.IO.Path]::GetRandomFileName().Replace('.',''))"
$env:GUARDIAN_SESSION = $sessionToken

# ── Auditoría específica del Gateway ───────────────────────────
if (-not $SkipAudit) {
    Write-Host " 🔍 Auditar rutas del Gateway..." -ForegroundColor Cyan

    # Verificar que no haya IPs/puertos internos en rutas de producción
    $gatewayFiles = @(
        "$PSScriptRoot\..\Api_getaway_antojadosmx\src\routes\v1\*.js"
        "$PSScriptRoot\..\Api_getaway_antojadosmx\src\services\**\*.js"
    )

    $violationsFound = $false
    foreach ($pattern in $gatewayFiles) {
        $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $content = Get-Content $file -Raw
            if ($content -match 'http://(localhost|185\.|127\.)') {
                Write-Host "   ❌ [CRITICAL] $($file.Name): Contiene HTTP directo en ruta de producción." -ForegroundColor Red
                $violationsFound = $true
            }
        }
    }

    # Verificar que EXPLORER_API_URL en index.js tenga variable de entorno (no hardcodeado)
    $indexFile = "$PSScriptRoot\..\Api_getaway_antojadosmx\src\index.js"
    if (Test-Path $indexFile) {
        $indexContent = Get-Content $indexFile -Raw
        if ($indexContent -match "EXPLORER_API_URL\s*=\s*process\.env\.EXPLORER_API_URL") {
            Write-Host "   ✅ EXPLORER_API_URL usa variable de entorno." -ForegroundColor Green
        } else {
            Write-Host "   ❌ [CRITICAL] EXPLORER_API_URL está hardcodeado. Debe usar process.env." -ForegroundColor Red
            $violationsFound = $true
        }
    }

    if ($violationsFound) {
        Write-Error " ❌ Auditoría del Gateway falló. Corrige las violaciones."
        exit 1
    }

    Write-Host " ✅ Auditoría del Gateway superada." -ForegroundColor Green
}

# ── Configuración de deploy ─────────────────────────────────────
$gatewayDir = "$PSScriptRoot\..\Api_getaway_antojadosmx"
$CONTABO_HOST = if ($env:CONTABO_HOST) { $env:CONTABO_HOST } else { "185.187.235.253" }
$CONTABO_USER = if ($env:CONTABO_USER) { $env:CONTABO_USER } else { "root" }
$REMOTE_DIR   = if ($env:REMOTE_DIR)   { $env:REMOTE_DIR }   else { "/opt/atlx-gateway" }

# ── Verificar conectividad SSH ──────────────────────────────────
Write-Host " 🔌 Verificando conectividad con servidor..." -ForegroundColor Cyan
$sshTest = & ssh -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10 "${CONTABO_USER}@${CONTABO_HOST}" "echo OK" 2>&1
if ($sshTest -notmatch "OK") {
    Write-Host ""
    Write-Host " ⚠  No hay conexión SSH automática al servidor." -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Para deploy manual:" -ForegroundColor White
    Write-Host "   1. Copia el código:" -ForegroundColor White
    Write-Host "      scp -r $gatewayDir\src\* ${CONTABO_USER}@${CONTABO_HOST}:${REMOTE_DIR}/src/" -ForegroundColor White
    Write-Host "   2. Instala dependencias:" -ForegroundColor White
    Write-Host "      ssh ${CONTABO_USER}@${CONTABO_HOST} 'cd ${REMOTE_DIR} && npm ci --omit=dev'" -ForegroundColor White
    Write-Host "   3. Reinicia:" -ForegroundColor White
    Write-Host "      ssh ${CONTABO_USER}@${CONTABO_HOST} 'pm2 restart antojados-gateway'" -ForegroundColor White
    Write-Host ""
    Write-Host " O configura una llave SSH y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 0
}

# ── Deploy Gateway ──────────────────────────────────────────────
Write-Host ""
Write-Host " 🚀 Desplegando API Gateway..." -ForegroundColor Cyan
Write-Host ""

$sshTarget = "${CONTABO_USER}@${CONTABO_HOST}"

try {
    if (-not $RestartOnly) {
        Write-Host "   Copiando código..."
        & scp -r -o StrictHostKeyChecking=no -o ConnectTimeout=15 `
            "$gatewayDir\src\*" "${sshTarget}:${REMOTE_DIR}/src/"
        & scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 `
            "$gatewayDir\package.json" `
            "$gatewayDir\package-lock.json" `
            "${sshTarget}:${REMOTE_DIR}/"

        Write-Host "   Instalando dependencias..."
        & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 $sshTarget `
            "cd ${REMOTE_DIR} && npm ci --omit=dev"
    }

    Write-Host "   Reiniciando servicio..."
    & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 $sshTarget `
        "cd ${REMOTE_DIR} && (pm2 reload antojados-gateway 2>/dev/null || pm2 restart antojados-gateway 2>/dev/null || pm2 start src/index.js --name antojados-gateway && pm2 save)"

    Write-Host ""
    Write-Host " ✅ API Gateway desplegado exitosamente." -ForegroundColor Green
} catch {
    Write-Error " ❌ Error durante el deploy: $_"
    exit 1
} finally {
    Remove-Item Env:\GUARDIAN_SESSION -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Deploy API Gateway completado." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan