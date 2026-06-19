# Installation

## 🚀 Quick Start (recommended)

```powershell
# Install just if you don't have it
winget install Casey.Just    # Windows
# scoop install just          # Windows (alternative)
# brew install just           # macOS
# sudo apt install just       # Debian/Ubuntu
# cargo install just          # Linux (Rust)

git clone https://github.com/sandraschi/magentart-mcp
cd magentart-mcp
just
```

The interactive recipe dashboard opens in your browser. From there:

```powershell
just bootstrap   # install all dependencies
just serve       # start the server
just web         # start the frontend (if applicable)
```

> **Why not `pip install`?** MCP servers bundle webapps, configs, project scaffolding, and tooling that a flat Python package can't deliver. PyPI offers no safety advantage — it doesn't audit packages either. `just` gives you the complete, ready-to-run stack.

---

## 🐌 Traditional Setup

If you prefer not to use `just`:

1. Install [Python 3.11+](https://python.org) and [uv](https://docs.astral.sh/uv/)
2. Clone repos (magentart-mcp + magenta-realtime v2 as sibling):
   ```powershell
   git clone https://github.com/sandraschi/magentart-mcp
   git clone --recurse-submodules https://github.com/magenta/magenta-realtime external/magenta-realtime
   cd magentart-mcp
   ```
3. Install dependencies:
   ```powershell
   uv sync --all-extras
   ```
4. Download models (once):
   ```powershell
   uv run mrt models init
   uv run mrt checkpoints download mrt2_base
   ```
5. Start the MCP server:
   ```powershell
   uv run magentart-mcp
   ```

> **GPU on Windows:** JAX CUDA requires WSL2 or Linux. Native Windows uses JAX CPU (slow but works). Live streaming (~200 ms) requires Apple Silicon + MLX.

---

## ❓ Troubleshooting

| Issue | Fix |
|---|---|
| `just` not found | Install via `winget install Casey.Just`, `scoop install just`, or `brew install just` |
| Models missing | `just models-setup` or `uv run mrt models init` + `uv run mrt checkpoints download mrt2_base` |
| First generation slow | `just load-model` (JAX compile) |
| Want GPU on Windows | Use WSL2 + CUDA; native Windows is JAX CPU only |
| Port conflict | Run `just kill-all` to clear fleet ports (10700–11000) |
| Something else | [Open a GitHub issue](https://github.com/sandraschi/magentart-mcp/issues) |

---

*See the main [README](README.md) for feature overview and documentation.*
