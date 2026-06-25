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

Run $Gradle @("installDebug") $AndroidRoot

$adbArgs = @()
if ($DeviceId.Trim()) {
  $adbArgs += @("-s", $DeviceId.Trim())
}
$adbArgs += @("shell", "monkey", "-p", $PackageName, "-c", "android.intent.category.LAUNCHER", "1")
Run "adb" $adbArgs $Root

Step "Deploy complete: $PackageName launched"
