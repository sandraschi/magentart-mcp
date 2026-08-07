# setup_venv.ps1 - Create Windows venv for magentart-mcp + Magenta RT 2 JAX backend
# Run from D:\Dev\repos\magentart-mcp\

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Syncing dependencies with uv..."
uv sync --all-extras

Write-Host "Done. Next: .\scripts\download_models.ps1"
