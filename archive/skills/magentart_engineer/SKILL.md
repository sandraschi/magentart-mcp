---
name: magentart_engineer
description: Expert in Magenta RealTime 2 music generation via magentart-mcp
---

# Magenta RealTime 2 MCP Skill

**Description:** Music generation via Magenta RealTime 2 (MRT2) on JAX/GPU (Windows/Linux) or MLX (Mac live streaming).

## Setup (once)

```powershell
just models-setup
just load-model
```

## Tools

- `magentart_ops(operation='status')` — Check assets, checkpoint, and model load state.
- `magentart_ops(operation='load_model')` — Warm JAX model on GPU (first compile is slow).
- `magentart_ops(operation='generate', prompt='...', duration_seconds=8)` — Text-to-music WAV.
- `magentart_ops(operation='generate_from_audio', audio_path='...')` — Style from reference WAV.
- `magentart_ops(operation='blend', prompts=[...], weights=[...])` — Blend text styles.
- `magentart_ops(operation='continue', duration_seconds=4)` — Extend prior generation state.
- `magentart_agentic_workflow(goal="...")` — Plan multi-step generation.

## Models

- `mrt2_base` — higher quality (default; set `MAGENTA_RT_MODEL`)
- `mrt2_small` — faster, smaller

## Platform notes

- **Windows + RTX:** offline GPU generation; not live-streaming latency.
- **Mac Apple Silicon:** use Google's MLX apps/plugins for live MIDI/streaming.
