# magentart-mcp

> **⚠️ PARKED / NOT USABLE (June 2026)**  
> This project is **currently useless** for practical use. [Magenta RealTime 2](https://magenta.withgoogle.com/magenta-realtime-2) has **no native Windows CUDA** streaming or batch path; native Windows falls back to **CPU JAX**, which is not viable for this workload. Live generation is **Apple Silicon + MLX only**.  
> **Do not invest time here** until Google ships proper **Windows GPU inference** (MRT2 follow-up or v3). This repo is kept private as scaffolding only.  
> **Use instead:** MRT2 Jam/AU apps on a Mac for live | WSL2/Linux `mrt jax` or v1 Docker on NVIDIA for GPU batch | [Lyria RealTime API](https://ai.google.dev/gemini-api/docs/music-generation) for hosted live.

<p align="center">
  <a href="https://github.com/casey/just"><img src="https://img.shields.io/badge/just-ready_to_go-7c5cfc?style=flat-square&logo=just&logoColor=white" alt="Just"></a>
  <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json" alt="Ruff"></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://biomejs.dev"><img src="https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat-square&logo=biome&logoColor=white" alt="Biome"></a>
  <a href="https://github.com/PrefectHQ/fastmcp"><img src="https://img.shields.io/badge/FastMCP-3.2-7c5cfc?style=flat-square" alt="FastMCP"></a>
</p>


> 📖 **[Installation Guide](INSTALL.md)** — quick start, manual setup, and troubleshooting

SOTA FastMCP 3.2 MCP server for [Magenta RealTime 2](https://magenta.withgoogle.com/magenta-realtime-2) — open-weights music generation.

## Quick Start

```powershell
git clone https://github.com/sandraschi/magentart-mcp
cd magentart-mcp
just
```

This opens an interactive dashboard showing all available commands. Run `just models-setup` once, then `just load-model`, then `just run`.

### Manual Setup

If you don't have `just` installed:

## SOTA Compliance (2026)

This server is fully aligned with the February 2026 SOTA standards:
- **FastMCP 3.1.0+**: Modular architecture and async lifecycle.
- **SEP-1577**: Autonomous agentic workflows and iterative sampling.
- **Portmanteau Design**: Consolidation of related tools to minimize agent cognitive load.
- **Correlation Tracing**: Full context injection (`ctx`) and tracing support.

## Model

Magenta RealTime 2 (`mrt2_base` 2.4B or `mrt2_small` 230M), 48 kHz stereo, 40 ms frames.

| Platform | Mode |
|---|---|
| Windows (native) | Offline generation via JAX **CPU** (CUDA needs WSL2/Linux) |
| Windows + WSL2 + CUDA | Offline GPU generation |
| Apple Silicon Mac | Live streaming (~200 ms) + MIDI via MLX |

Apache 2.0 (code) + CC-BY 4.0 (weights).

## Dependencies

- `FastMCP 3.2`
- `magenta-rt[jax]` (editable from `../external/magenta-realtime`)
- JAX (CPU on native Windows; CUDA 12 on Linux/WSL2)


## 🛡️ Industrial Quality Stack

This project adheres to **SOTA 14.1** industrial standards for high-fidelity agentic orchestration:

- **Python (Core)**: [Ruff](https://astral.sh/ruff) for linting and formatting. Zero-tolerance for `print` statements in core handlers (`T201`).
- **Webapp (UI)**: [Biome](https://biomejs.dev/) for sub-millisecond linting. Strict `noConsoleLog` enforcement.
- **Protocol Compliance**: Hardened `stdout/stderr` isolation to ensure crash-resistant JSON-RPC communication.
- **Automation**: [Justfile](./justfile) recipes for all fleet operations (`just lint`, `just fix`, `just dev`).
- **Security**: Automated audits via `bandit` and `safety`.
