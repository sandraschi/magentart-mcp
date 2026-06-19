# magentart-mcp Justfile
import 'scripts/just/fleet.just'
# magentart-mcp Justfile
# Windows/PowerShell compatible

set shell := ["powershell", "-Command"]

# Open the interactive recipe dashboard in the browser
default:
    @just --list

stats:
    uv run python tools/repo_stats.py

# Initialize environment
init:
    ./setup_venv.ps1

# Run the MCP server in stdio mode
run:
    uv run magentart-mcp

# Run tests with coverage
test:
    $env:PYTHONPATH="."; uv run pytest -v --cov=magentart_mcp --cov-report=term-missing

# Lint and format code with Ruff
lint:
    uv run ruff check --fix .
    Set-Location '{{justfile_directory()}}\webapp\frontend'
    npx @biomejs/biome ci .
    uv run ruff format .

# Download MRT2 resources + checkpoint (first-time setup)
models-init:
    uv run mrt models init

models-download:
    uv run mrt checkpoints download mrt2_base

models-setup:
    ./scripts/download_models.ps1

# Warm-load JAX model on GPU (slow first compile)
load-model:
    uv run python -c "import asyncio; from magentart_mcp import engine; print(asyncio.run(engine.ensure_model_loaded()))"
