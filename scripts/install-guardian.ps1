#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════
# install-guardian.ps1 — Instala el sistema GUARDIAN
#
# Lo que hace:
#   1. Crea los wrappers que interceptan 'quasar'
#   2. Los coloca en el PATH del proyecto (PRIMERO que los reales)
#   3. Configura pre-commit hook
#   4. Actualiza package.json con scripts guardian
# ═══════════════════════════════════════════════════════════════

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PROJECT_ROOT = "$PSScriptRoot\.."
$SCRIPTS_DIR = $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " GUARDIAN — Instalación del sistema de cumplimiento" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Dar permisos de ejecución a los wrappers ────────────────
Write-Host " 📜 Configurando permisos de ejecución..." -ForegroundColor Cyan

# En Windows, los .sh necesitan Git Bash; en macOS/Linux se usa chmod
if ($IsMacOS -or $IsLinux) {
    & chmod +x "$SCRIPTS_DIR\quasar-wrapper.sh"
    Write-Host "   ✅ quasar-wrapper.sh: ejecutable" -ForegroundColor Green
} else {
    Write-Host "   📝 Windows: los wrappers .sh se ejecutarán via Git Bash o WSL" -ForegroundColor Yellow
}

# ── 2. Crear directorio .guardian en el proyecto ────────────────
$guardianDir = "$PROJECT_ROOT\.guardian"
if (-not (Test-Path $guardianDir)) {
    New-Item -ItemType Directory -Path $guardianDir -Force | Out-Null
}
Write-Host "   ✅ .guardian/ creado" -ForegroundColor Green

# ── 3. Crear scripts de intercepción en .guardian/bin ──────────
$guardianBin = "$guardianDir\bin"
if (-not (Test-Path $guardianBin)) {
    New-Item -ItemType Directory -Path $guardianBin -Force | Out-Null
}

# Wrapper PS1 para quasar (funciona en cualquier PowerShell)
$quasarWrapperPs1 = @"
#!/usr/bin/env pwsh
# GUARDIAN WRAPPER — quasar.ps1
# Este archivo es colocado PRIMERO en el PATH por install-guardian.ps1

if (-not `$env:GUARDIAN_SESSION) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host " 🔒 GUARDIAN: ACCESO DENEGADO" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host " No puedes ejecutar 'quasar' directamente." -ForegroundColor White
    Write-Host " Usa el script PS1 oficial:" -ForegroundColor White
    Write-Host ""
    Write-Host "   📱 Android:  .\scripts\deploy-android.ps1" -ForegroundColor Cyan
    Write-Host "   🍎 iOS:      .\scripts\deploy-ios.ps1" -ForegroundColor Cyan
    Write-Host "   🌐 Gateway:  .\scripts\deploy-api-gateway.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " O si sabes lo que haces:" -ForegroundColor Yellow
    Write-Host "   `$env:GUARDIAN_SESSION = 'manual-'+[DateTime]::UtcNow.Ticks" -ForegroundColor Yellow
    Write-Host "   quasar [tus argumentos]" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Validar sesión
`$guardianResult = & node "$SCRIPTS_DIR\guardian-core.mjs" --intercept 2>&1
if (`$LASTEXITCODE -ne 0) {
    Write-Host " ❌ GUARDIAN: `$guardianResult" -ForegroundColor Red
    exit 1
}

# Ejecutar quasar real
`$realQuasar = & where.exe quasar.cmd 2>`$null
if (-not `$realQuasar) {
    `$realQuasar = & where.exe quasar 2>`$null
}
if (-not `$realQuasar) {
    Write-Error " ❌ No se encontró quasar real en el PATH del sistema."
    exit 1
}

Write-Host " ✅ GUARDIAN: Sesión validada. Ejecutando quasar..." -ForegroundColor Green
& "`$realQuasar" @args
"@

Set-Content -Path "$guardianBin\quasar.ps1" -Value $quasarWrapperPs1 -Encoding UTF8
Write-Host "   ✅ .guardian/bin/quasar.ps1 creado" -ForegroundColor Green

# Wrapper CMD para quasar (compatibilidad con cmd.exe)
$quasarWrapperCmd = @"
@echo off
REM GUARDIAN WRAPPER — quasar.cmd
REM Este archivo es colocado PRIMERO en el PATH por install-guardian.ps1

IF "%GUARDIAN_SESSION%"=="" (
    echo.
    echo ===========================================================
    echo  GUARDIAN: ACCESO DENEGADO
    echo ===========================================================
    echo.
    echo No puedes ejecutar 'quasar' directamente.
    echo Usa el script PS1 oficial:
    echo.
    echo   Android:  .\scripts\deploy-android.ps1
    echo   iOS:      .\scripts\deploy-ios.ps1
    echo   Gateway:  .\scripts\deploy-api-gateway.ps1
    echo.
    exit /b 1
)

REM Ejecutar quasar real
where quasar.cmd >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    quasar.cmd %*
) ELSE (
    where quasar >nul 2>nul
    IF %ERRORLEVEL% EQU 0 (
        quasar %*
    ) ELSE (
        echo ERROR: No se encontro quasar real
        exit /b 1
    )
)
"@

Set-Content -Path "$guardianBin\quasar.cmd" -Value $quasarWrapperCmd -Encoding ASCII
Write-Host "   ✅ .guardian/bin/quasar.cmd creado" -ForegroundColor Green

# ── 4. Agregar .guardian/bin al PATH del proyecto ───────────────
$profileScript = @"
# ═══════════════════════════════════════════════════════════════
# GUARDIAN — PATH override for project
# Coloca los wrappers del guardian PRIMERO en el PATH
# ═══════════════════════════════════════════════════════════════
`$guardianBin = Join-Path (Split-Path -Parent `$PSScriptRoot) ".guardian\bin"
if (Test-Path `$guardianBin) {
    `$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Process")
    if (`$currentPath -notlike "*`$guardianBin*") {
        [Environment]::SetEnvironmentVariable("PATH", "`$guardianBin;`$currentPath", "Process")
    }
}
"@

$profilePath = "$PROJECT_ROOT\profile.ps1"
Set-Content -Path $profilePath -Value $profileScript -Encoding UTF8
Write-Host "   ✅ profile.ps1 creado (carga PATH del guardian)" -ForegroundColor Green

# ── 5. Crear script .guardian/activate.ps1 para activar el entorno ─
$activateScript = @"
#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════
# activate.ps1 — Activa el entorno GUARDIAN
# Ejecuta esto al abrir una nueva terminal en el proyecto
# ═══════════════════════════════════════════════════════════════

`$guardianBin = Join-Path `$PSScriptRoot "bin"
if (Test-Path `$guardianBin) {
    `$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Process")
    if (`$currentPath -notlike "*`$guardianBin*") {
        [Environment]::SetEnvironmentVariable("PATH", "`$guardianBin;`$currentPath", "Process")
        Write-Host " ✅ GUARDIAN activado. Wrappers en PATH." -ForegroundColor Green
    } else {
        Write-Host " ✅ GUARDIAN ya estaba activo." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host " Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   npm run guard          Escanear código (--strict)" -ForegroundColor White
Write-Host "   npm run guard:report   Reporte de violaciones" -ForegroundColor White
Write-Host "   .\scripts\deploy-android.ps1  Build Android oficial" -ForegroundColor White
Write-Host "   .\scripts\deploy-ios.ps1      Build iOS oficial" -ForegroundColor White
Write-Host "   .\scripts\deploy-api-gateway.ps1  Deploy Gateway" -ForegroundColor White
"@

Set-Content -Path "$guardianDir\activate.ps1" -Value $activateScript -Encoding UTF8
Write-Host "   ✅ .guardian/activate.ps1 creado" -ForegroundColor Green

# ── 6. Actualizar package.json con scripts guardian ────────────
$packageJsonPath = "$PROJECT_ROOT\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    if (-not $packageJson.scripts.guard) {
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard' -Value 'node scripts/guardian-core.mjs --strict' -Force
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard:report' -Value 'node scripts/guardian-core.mjs --report' -Force
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard:android' -Value 'pwsh scripts/deploy-android.ps1' -Force
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard:ios' -Value 'pwsh scripts/deploy-ios.ps1' -Force
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard:api' -Value 'pwsh scripts/deploy-api-gateway.ps1' -Force
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'guard:install' -Value 'pwsh scripts/install-guardian.ps1' -Force
        
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath -Encoding UTF8
        Write-Host "   ✅ package.json actualizado con scripts guardian" -ForegroundColor Green
    } else {
        Write-Host "   📝 package.json ya tenía scripts guardian" -ForegroundColor Yellow
    }
}

# ── 7. Configurar pre-commit hook (Husky o manual) ────────────
$hooksDir = "$PROJECT_ROOT\.husky"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

$preCommitHook = @'
#!/bin/sh
# GUARDIAN — pre-commit hook
# Ejecuta auditoría antes de cada commit
. "$(dirname "$0")/../.guardian/activate.ps1" 2>/dev/null || true
echo "🔍 GUARDIAN: Verificando código antes de commit..."
node "$(dirname "$0")/../scripts/guardian-core.mjs" --strict
if [ $? -ne 0 ]; then
    echo "❌ GUARDIAN: Violaciones detectadas. Commit rechazado."
    echo "   Corre: npm run guard:report"
    exit 1
fi
'@

Set-Content -Path "$hooksDir\pre-commit" -Value $preCommitHook -Encoding UTF8

if ($IsMacOS -or $IsLinux) {
    & chmod +x "$hooksDir\pre-commit"
}

Write-Host "   ✅ .husky/pre-commit hook creado" -ForegroundColor Green

# ── 8. Activar el entorno ahora mismo ──────────────────────────
$guardianBinPath = "$guardianDir\bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Process")
if ($currentPath -notlike "*$guardianBinPath*") {
    [Environment]::SetEnvironmentVariable("PATH", "$guardianBinPath;$currentPath", "Process")
    Write-Host "   ✅ GUARDIAN activado en esta sesión" -ForegroundColor Green
}

# ── 9. Resumen ────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host " ✅ GUARDIAN instalado correctamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host " Resumen del sistema:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔒 INTERCEPTORES ACTIVOS:" -ForegroundColor White
Write-Host "      quasar → ${guardianBinPath}\quasar.ps1" -ForegroundColor White
Write-Host "      quasar → ${guardianBinPath}\quasar.cmd" -ForegroundColor White
Write-Host ""
Write-Host "   📜 SCRIPTS PS1 OFICIALES:" -ForegroundColor White
Write-Host "      📱 .\scripts\deploy-android.ps1" -ForegroundColor White
Write-Host "      🍎 .\scripts\deploy-ios.ps1" -ForegroundColor White
Write-Host "      🌐 .\scripts\deploy-api-gateway.ps1" -ForegroundColor White
Write-Host ""
Write-Host "   🛡  COMANDOS npm:" -ForegroundColor White
Write-Host "      npm run guard          → Auditoría estricta" -ForegroundColor White
Write-Host "      npm run guard:report   → Solo reporte" -ForegroundColor White
Write-Host ""
Write-Host "   ⚠  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   El interceptor SOLO funciona en la terminal actual." -ForegroundColor Yellow
Write-Host "   Para terminales nuevas, ejecuta:" -ForegroundColor Yellow
Write-Host "      .\.guardian\activate.ps1" -ForegroundColor Yellow
Write-Host "   O agrega .guardian\bin a tu PATH global." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green