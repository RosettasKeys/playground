[CmdletBinding()]
param(
    [int]$Port = 4173
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot

Set-Location -LiteralPath $projectRoot

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) {
    Write-Host 'Installing project dependencies...' -ForegroundColor Cyan
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
}

Write-Host 'Building the compiled browser assets...' -ForegroundColor Cyan
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'The production build failed.' }

$previewUrl = "http://127.0.0.1:$Port/"
Write-Host ''
Write-Host 'ITOps preview is starting at:' -ForegroundColor Green
Write-Host "  $previewUrl" -ForegroundColor White
Write-Host ''
Write-Host 'Open that exact URL. Press Ctrl+C here when you are finished.' -ForegroundColor Yellow
Write-Host 'This compiled preview avoids raw .jsx MIME handling entirely.' -ForegroundColor DarkGray
Write-Host ''

& npm.cmd run preview -- --host 127.0.0.1 --port $Port --strictPort
