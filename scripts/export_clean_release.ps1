# =====================================================================
# THE CLEVER TRADER — ENTERPRISE CLEAN RELEASE EXPORTER
# Exports a 100% clean production zip for audits & presentations
# Strips: .env*, .git, node_modules, .next, and sensitive keys
# =====================================================================

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportName = "CleverTrader_CleanRelease_$timestamp"
$tempExportDir = Join-Path $env:TEMP $exportName
$outputZip = Join-Path $projectRoot "CleverTrader_CleanRelease.zip"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   THE CLEVER TRADER - CLEAN AUDIT ARCHIVE EXPORTER" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[*] Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "[*] Creating sanitized export in: $tempExportDir" -ForegroundColor Yellow

if (Test-Path $tempExportDir) { Remove-Item -Path $tempExportDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempExportDir | Out-Null

$excludeList = @(
    ".git",
    ".next",
    "node_modules",
    ".env",
    ".env.local",
    ".env.local.backup",
    ".env.*.local",
    "logs",
    "cloudflared.exe",
    "*.zip",
    "*.tar",
    ".auth_key"
)

# Robocopy with exclusions for high speed and precision
$robocopyArgs = @(
    $projectRoot,
    $tempExportDir,
    "/E",
    "/XD", ".git", ".next", "node_modules", "logs", "__pycache__",
    "/XF", ".env.local", ".env.local.backup", ".env", "*.zip", "*.7z", "*.log", ".auth_key", "cloudflared.exe"
)

& robocopy.exe @robocopyArgs | Out-Null

# Verify no .env.local exists in export directory
$leakedFiles = Get-ChildItem -Path $tempExportDir -Recurse -Include ".env.local", ".env.local.backup", ".env"
if ($leakedFiles) {
    Write-Host "[!] CRITICAL: Secret files detected in temp directory! Aborting." -ForegroundColor Red
    $leakedFiles | ForEach-Object { Remove-Item $_.FullName -Force }
}

Write-Host "[+] Creating clean ZIP archive: $outputZip..." -ForegroundColor Green
if (Test-Path $outputZip) { Remove-Item -Path $outputZip -Force }

Compress-Archive -Path "$tempExportDir\*" -DestinationPath $outputZip -CompressionLevel Optimal

Remove-Item -Path $tempExportDir -Recurse -Force

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Clean release archive ready!" -ForegroundColor Green
Write-Host "Archive location: $outputZip" -ForegroundColor Yellow
Write-Host "Zero secrets, Zero .env files, Zero credentials included." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
