param(
  [switch]$IncludeBuildArtifacts
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = $repoRoot

function Get-FullPath {
  param([string]$Path)

  return [System.IO.Path]::GetFullPath($Path)
}

function Assert-InAppDir {
  param([string]$Path)

  $fullPath = Get-FullPath -Path $Path
  $appRoot = Get-FullPath -Path $appDir

  if (-not $fullPath.StartsWith($appRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside the app directory: $fullPath"
  }

  return $fullPath
}

$removed = New-Object System.Collections.Generic.List[string]
$superpowersDir = Join-Path $appDir ".superpowers"

if (Test-Path -LiteralPath $superpowersDir -PathType Container) {
  foreach ($pattern in @(
    "dev-*.out.log",
    "dev-*.err.log",
    "start-app-*.out.log",
    "start-app-*.err.log"
  )) {
    Get-ChildItem -LiteralPath $superpowersDir -Filter $pattern -File -ErrorAction SilentlyContinue |
      ForEach-Object {
        $target = Assert-InAppDir -Path $_.FullName
        Remove-Item -LiteralPath $target -Force
        $removed.Add($target) | Out-Null
      }
  }
}

if ($IncludeBuildArtifacts) {
  foreach ($relativePath in @(".next", "tsconfig.tsbuildinfo")) {
    $targetPath = Join-Path $appDir $relativePath
    if (-not (Test-Path -LiteralPath $targetPath)) {
      continue
    }

    $target = Assert-InAppDir -Path $targetPath
    if (Test-Path -LiteralPath $target -PathType Container) {
      Remove-Item -LiteralPath $target -Recurse -Force
    } else {
      Remove-Item -LiteralPath $target -Force
    }
    $removed.Add($target) | Out-Null
  }
}

if ($removed.Count -eq 0) {
  Write-Host "Nothing to clean."
  exit 0
}

Write-Host "Removed:"
foreach ($item in $removed) {
  Write-Host " - $item"
}
