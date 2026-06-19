# Download Magenta RealTime 2 resources and JAX checkpoints for magentart-mcp.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Installing/syncing magentart-mcp dependencies..."
uv sync --all-extras

Write-Host "Downloading MusicCoCa + SpectroStream resources..."
uv run mrt models init

$model = if ($env:MAGENTA_RT_MODEL) { $env:MAGENTA_RT_MODEL } else { "mrt2_base" }
Write-Host "Downloading JAX checkpoint: $model"
uv run mrt checkpoints download $model

Write-Host "Done. Warm the model with: just load-model"
