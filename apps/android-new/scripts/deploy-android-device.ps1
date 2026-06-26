param(
  [string]$DeviceId = "",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Run($Command, $Arguments, $WorkingDirectory) {
  Step "$Command $($Arguments -join ' ')"
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Get-IndexBundle($IndexPath) {
  if (!(Test-Path -LiteralPath $IndexPath)) {
    throw "Missing index.html: $IndexPath"
  }

  $index = Get-Content -LiteralPath $IndexPath -Raw
  $match = [regex]::Match($index, 'src="/assets/([^"]+\.js)"')
  if (!$match.Success) {
    throw "Could not resolve main JS bundle from $IndexPath"
  }

  return $match.Groups[1].Value
}

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistIndex = Join-Path $Root "dist\spa\index.html"
$CapacitorRoot = Join-Path $Root "src-capacitor"
$CapCli = Join-Path $CapacitorRoot "node_modules\.bin\cap.cmd"
$AndroidRoot = Join-Path $CapacitorRoot "android"
$Gradle = Join-Path $AndroidRoot "gradlew.bat"
$PackagedIndex = Join-Path $AndroidRoot "app\src\main\assets\public\index.html"
$ApkPath = Join-Path $AndroidRoot "app\build\outputs\apk\debug\app-debug.apk"
$StateRoot = Join-Path $PSScriptRoot "state"
$LatestApkState = Join-Path $StateRoot "latest-android-apk.json"
$PackageName = "com.atlx.antojadosmx"

Step "Android deploy root: $Root"

if (!$SkipBuild) {
  Run "npm.cmd" @("run", "build") $Root
}

$distBundle = Get-IndexBundle $DistIndex
Step "Build bundle: $distBundle"

if (!(Test-Path -LiteralPath $CapCli)) {
  throw "Missing Capacitor CLI: $CapCli"
}

Run $CapCli @("sync", "android") $CapacitorRoot

$packagedBundle = Get-IndexBundle $PackagedIndex
Step "Packaged bundle: $packagedBundle"

if ($packagedBundle -ne $distBundle) {
  throw "Packaged Android bundle does not match dist build. dist=$distBundle packaged=$packagedBundle"
}

Run $Gradle @("assembleDebug") $AndroidRoot

if (!(Test-Path -LiteralPath $ApkPath)) {
  throw "Missing generated APK: $ApkPath"
}

if (!(Test-Path -LiteralPath $StateRoot)) {
  New-Item -ItemType Directory -Path $StateRoot | Out-Null
}

$gradleBuild = Get-Content -LiteralPath (Join-Path $AndroidRoot "app\build.gradle") -Raw
$versionNameMatch = [regex]::Match($gradleBuild, 'versionName\s+"([^"]+)"')
$versionCodeMatch = [regex]::Match($gradleBuild, 'versionCode\s+(\d+)')
$apkItem = Get-Item -LiteralPath $ApkPath
$apkState = [ordered]@{
  project = "apps/android-new"
  platform = "android"
  artifact_type = "apk-debug"
  artifact_path = (Resolve-Path $ApkPath).Path
  version_name = if ($versionNameMatch.Success) { $versionNameMatch.Groups[1].Value } else { $null }
  version_code = if ($versionCodeMatch.Success) { [int]$versionCodeMatch.Groups[1].Value } else { $null }
  size_bytes = $apkItem.Length
  sha256 = (Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256).Hash
  dist_bundle = $distBundle
  packaged_bundle = $packagedBundle
  created_at = (Get-Date).ToString("o")
  build_script = "apps/android-new/scripts/deploy-android-device.ps1"
}
$apkState | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $LatestApkState -Encoding UTF8

Step "APK pipeline registered"
Write-Host "  APK: $($apkState.artifact_path)" -ForegroundColor DarkGray
Write-Host "  SHA256: $($apkState.sha256)" -ForegroundColor DarkGray

$installArgs = @()
if ($DeviceId.Trim()) {
  $installArgs += @("-s", $DeviceId.Trim())
}
$installArgs += @("install", "-r", "-t", $ApkPath)
Run "adb" $installArgs $Root

$adbArgs = @()
if ($DeviceId.Trim()) {
  $adbArgs += @("-s", $DeviceId.Trim())
}
$adbArgs += @("shell", "monkey", "-p", $PackageName, "-c", "android.intent.category.LAUNCHER", "1")
Run "adb" $adbArgs $Root

Step "Deploy complete: $PackageName launched"
