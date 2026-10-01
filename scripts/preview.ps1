param([Parameter(Mandatory)][string]$RunId)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (Test-Path .artifact) { Remove-Item -Recurse -Force .artifact }
if (Test-Path .site-preview) { Remove-Item -Recurse -Force .site-preview }
if ((Test-Path .artifact) -or (Test-Path .site-preview)) { throw "Failed to remove old directories" }
gh run download $RunId -R kaiser62/kaiser62.github.io -n github-pages -D .artifact
if ($LASTEXITCODE -ne 0) { throw "gh run download failed ($LASTEXITCODE)" }
if (-not (Test-Path .artifact/artifact.tar)) { throw 'artifact.tar not found' }
New-Item -ItemType Directory -Force .site-preview | Out-Null
tar -xf .artifact/artifact.tar -C .site-preview
if ($LASTEXITCODE -ne 0) { throw "tar extraction failed ($LASTEXITCODE)" }
Write-Host "Preview ready in .site-preview/"
