#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════
# deploy-ios.ps1 — Script OFICIAL de build+deploy iOS
#
# SOLO este script puede ejecutar builds de iOS.
# Cualquier intento directo de 'quasar build -m capacitor -T ios'
# será BLOQUEADO por el guardian wrapper.
# ═══════════════════════════════════════════════════════════════
param(
    [switch]$SkipAudit,
    [switch]$Dev,
    [switch]$Staging
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Banner ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " GUARDIAN — Deploy iOS (oficial)" -ForegroundColor Cyan
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
$sessionToken = "ios-$((Get-Date -Format 'yyyyMMddHHmmss'))-$([System.IO.Path]::GetRandomFileName().Replace('.',''))"
$env:GUARDIAN_SESSION = $sessionToken

# ── Ejecutar auditoría del contrato (opcional) ──────────────────
if (-not $SkipAudit) {
    Write-Host " 🔍 Ejecutando auditoría de contrato HTTP/Render..." -ForegroundColor Cyan
    $guardianResult = & node "$PSScriptRoot\guardian-core.mjs" --intercept 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $guardianResult -ForegroundColor Red
        Write-Error " ❌ GUARDIAN: Auditoría falló. Corrige las violaciones antes de continuar."
        exit 1
    }
    Write-Host " ✅ Auditoría superada." -ForegroundColor Green
}

# ── Verificar .env ──────────────────────────────────────────────
$envFile = if ($Staging) {
    "$PSScriptRoot\..\apps\app-ios\.env.staging"
} else {
    "$PSScriptRoot\..\apps\app-ios\.env.production"
}

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $apiUrl = ($envContent | Where-Object { $_ -match 'VITE_API_URL' }) -replace 'VITE_API_URL=', '' -replace '"', '' -replace "'", '' -replace ' ', ''
    if ($apiUrl -ne 'https://api.antojadosmx.mx') {
        Write-Error " ❌ $envFile tiene VITE_API_URL='$apiUrl'. Debe ser 'https://api.antojadosmx.mx'"
        exit 1
    }
    Write-Host " ✅ $(Split-Path $envFile -Leaf) verificado." -ForegroundColor Green
} else {
    Write-Warning " ⚠  No se encontró $envFile"
}

# ── Limpiar DerivedData (evita builds cacheados con violaciones) ─
$derivedData = "$PSScriptRoot\..\apps\app-ios\src-capacitor\ios\DerivedData"
if (Test-Path $derivedData) {
    Write-Host " 🧹 Limpiando DerivedData (previene builds corruptos)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$derivedData\*" -ErrorAction SilentlyContinue
    Write-Host " ✅ DerivedData limpiado." -ForegroundColor Green
}

# ── Build iOS ──────────────────────────────────────────────────
$projectRoot = "$PSScriptRoot\..\apps\app-ios"
Write-Host ""
Write-Host " 🏗  Construyendo iOS App..." -ForegroundColor Cyan
Write-Host ""

Push-Location $projectRoot
try {
    if ($Dev) {
        & npx quasar dev -m capacitor -T ios
    } else {
        & npx quasar build -m capacitor -T ios
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error " ❌ Build de iOS falló."
        exit 1
    }

    Write-Host ""
    Write-Host " ✅ Build de iOS completado exitosamente." -ForegroundColor Green
    Write-Host " 🍎 IPA/.app listo en: apps/app-ios/dist/capacitor/ios" -ForegroundColor Green
} finally {
    Pop-Location
    Remove-Item Env:\GUARDIAN_SESSION -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Deploy iOS completado." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan