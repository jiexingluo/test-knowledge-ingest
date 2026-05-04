param(
  [string]$BindHost = "127.0.0.1",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = $repoRoot
$packageJson = Join-Path $appDir "package.json"
$nodeModulesDir = Join-Path $appDir "node_modules"

if (-not (Test-Path -LiteralPath $appDir -PathType Container)) {
  throw "App directory not found: $appDir"
}

if (-not (Test-Path -LiteralPath $packageJson -PathType Leaf)) {
  throw "package.json not found: $packageJson"
}

if (-not (Test-Path -LiteralPath $nodeModulesDir -PathType Container)) {
  throw "Dependencies are missing. Run npm install inside $appDir first."
}

Push-Location $appDir
try {
  Write-Host "Repo root : $repoRoot"
  Write-Host "App dir   : $appDir"
  Write-Host "Starting  : http://${BindHost}:$Port"
  & npm.cmd run dev -- --hostname $BindHost --port $Port
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
