$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $repoRoot 'extension'
$artifactDir = Join-Path $repoRoot 'artifacts'
$manifestPath = Join-Path $sourceDir 'manifest.json'

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Extension manifest not found: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if (-not $manifest.version) {
  throw 'manifest.json must define a version before packaging.'
}

New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
$packageName = "container-username-assistant-$($manifest.version).zip"
$packagePath = Join-Path $artifactDir $packageName

if (Test-Path -LiteralPath $packagePath) {
  Remove-Item -LiteralPath $packagePath -Force
}

# Compress the contents, not the parent extension folder, so manifest.json is at ZIP root.
Compress-Archive -Path (Join-Path $sourceDir '*') -DestinationPath $packagePath -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($packagePath)
try {
  if (-not $archive.GetEntry('manifest.json')) {
    throw 'Invalid package: manifest.json is not at the ZIP root.'
  }
  if ($archive.GetEntry('README.md') -or $archive.GetEntry('tests/background.test.js')) {
    throw 'Invalid package: repository-only files were included.'
  }
}
finally {
  $archive.Dispose()
}

$hash = Get-FileHash -LiteralPath $packagePath -Algorithm SHA256
Write-Output "Package: $packagePath"
Write-Output "Version: $($manifest.version)"
Write-Output "SHA256: $($hash.Hash)"
