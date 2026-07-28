"""Magenta RT engine — in-process Magenta RealTime 2 via JAX.

Architecture:
  magentart-mcp (FastMCP on Windows)
      ↕ direct Python import
  magenta_rt.jax.MagentaRT2System
      ↕ JAX + CUDA
  RTX 4090

Real-time streaming (~200 ms, MIDI) is Apple Silicon + MLX only. On Windows we
run batch/offline generation via JAX (CPU natively; GPU in WSL2/Linux).
"""

from __future__ import annotations

import asyncio
import os
import time
from pathlib import Path
from typing import Any

import numpy as np

MODEL_NAME = os.environ.get("MAGENTA_RT_MODEL", "mrt2_base")
MAGENTA_HOME = os.environ.get("MAGENTA_HOME", str(Path.home() / "Documents" / "Magenta"))
OUTPUT_DIR = os.environ.get(
    "MAGENTA_RT_OUTPUT_DIR",
    r"D:\Dev\repos\magentart-mcp\outputs",
)

FRAMES_PER_SECOND = 25
SAMPLE_RATE = 48000
NUM_CHANNELS = 2
FRAME_DURATION_S = 1.0 / FRAMES_PER_SECOND

_system = None
_system_lock = asyncio.Lock()
_loaded_model: str | None = None
_streaming_state: Any = None
_last_style: Any = None


def _configure_paths() -> None:
    from magenta_rt import paths

    paths.set_magenta_home(Path(MAGENTA_HOME) / "magenta-rt-v2")


def _assets_status() -> dict[str, Any]:
    from magenta_rt import paths

    _configure_paths()
    home = paths.magenta_home()
    musiccoca = paths.musiccoca_dir()
    checkpoint = paths.checkpoints_dir() / f"{MODEL_NAME}.safetensors"
    return {
        "magenta_home": str(home),
        "resources_ready": (musiccoca / "text_encoder.tflite").exists(),
        "checkpoint_ready": checkpoint.exists(),
        "checkpoint_path": str(checkpoint),
        "model": MODEL_NAME,
    }


def _get_system_sync():
    global _system, _loaded_model

    from magenta_rt import MagentaRT2Jax

    _configure_paths()
    if _system is None or _loaded_model != MODEL_NAME:
        _system = MagentaRT2Jax(size=MODEL_NAME)
        _loaded_model = MODEL_NAME
    return _system


async def ensure_model_loaded() -> dict[str, Any]:
    async with _system_lock:
        assets = _assets_status()
        if not assets["resources_ready"]:
            return {
                "status": "error",
                "message": "MusicCoCa/SpectroStream resources missing.",
                "hint": "Run: uv run mrt models init",
                **assets,
            }
        if not assets["checkpoint_ready"]:
            return {
                "status": "error",
                "message": f"Checkpoint missing for {MODEL_NAME}.",
                "hint": f"Run: uv run mrt checkpoints download {MODEL_NAME}",
                **assets,
            }
        await asyncio.to_thread(_get_system_sync)
        return {
            "status": "ok",
            "message": f"Model {MODEL_NAME} loaded (JAX/CUDA backend)",
            **assets,
        }


async def get_server_info() -> dict[str, Any]:
    assets = _assets_status()
    ready = assets["resources_ready"] and assets["checkpoint_ready"]
    info: dict[str, Any] = {
        "status": "ok" if ready else "needs_setup",
        "backend": "jax",
        "model": MODEL_NAME,
        "sample_rate": SAMPLE_RATE,
        "frame_rate_hz": FRAMES_PER_SECOND,
        "frame_duration_ms": 40,
        "num_channels": NUM_CHANNELS,
        "realtime_streaming": False,
        "realtime_note": (
            "Live streaming with ~200 ms latency and MIDI uses Apple Silicon + MLX. "
            "Windows + RTX uses JAX for offline GPU generation."
        ),
        "model_loaded": _system is not None,
        **assets,
    }
    if not assets["resources_ready"]:
        info["hint"] = "Run: uv run mrt models init"
    elif not assets["checkpoint_ready"]:
        info["hint"] = f"Run: uv run mrt checkpoints download {MODEL_NAME}"
    return info


def reset_generation_state() -> None:
    global _streaming_state, _last_style

    _streaming_state = None
    _last_style = None


async def embed_text(prompt: str, correlation_id: str | None = None) -> list[float]:
    del correlation_id
    ready = await ensure_model_loaded()
    if ready["status"] != "ok":
        raise RuntimeError(ready.get("message", "Model not ready"))

    def _embed():
        system = _get_system_sync()
        return system.embed_style(prompt, use_mapper=True)

    embedding = await asyncio.to_thread(_embed)
    return np.asarray(embedding, dtype=np.float32).tolist()


async def embed_audio(audio_path: str, correlation_id: str | None = None) -> list[float]:
    del correlation_id
    ready = await ensure_model_loaded()
    if ready["status"] != "ok":
        raise RuntimeError(ready.get("message", "Model not ready"))

    path = Path(audio_path)
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    def _embed():
        from magenta_rt import audio

        system = _get_system_sync()
        wav = audio.Waveform.from_file(str(path))
        embedding = system.embed_style(wav)
        return np.asarray(embedding, dtype=np.float32).tolist()

    return await asyncio.to_thread(_embed)


async def embed_blend(
    prompts: list[str],
    weights: list[float] | None = None,
    correlation_id: str | None = None,
) -> list[float]:
    del correlation_id
    if weights is None:
        weights = [1.0 / len(prompts)] * len(prompts)
    embeddings = [np.array(await embed_text(p), dtype=np.float32) for p in prompts]
    total = sum(weights)
    blended = sum(e * (w / total) for e, w in zip(embeddings, weights, strict=False))
    return blended.tolist()


async def generate_audio(
    style_embedding: list[float],
    num_chunks: int,
    output_path: str,
    generation_kwargs: dict | None = None,
    *,
    continue_from_state: bool = False,
) -> dict[str, Any]:
    """Generate audio and save WAV.

    ``num_chunks`` is the frame count (25 frames = 1 second at 40 ms/frame).
    """
    frames = max(1, num_chunks)

    ready = await ensure_model_loaded()
    if ready["status"] != "ok":
        return ready

    kwargs = generation_kwargs or {}
    temperature = kwargs.get("temperature")
    cfg_musiccoca = kwargs.get("guidance_weight", kwargs.get("cfg_musiccoca"))

    global _streaming_state, _last_style

    def _generate(frames: int):
        system = _get_system_sync()
        style = np.array(style_embedding, dtype=np.float32)
        state = _streaming_state if continue_from_state else None
        gen_kwargs: dict[str, Any] = {}
        if temperature is not None:
            gen_kwargs["temperature"] = temperature
        if cfg_musiccoca is not None:
            gen_kwargs["cfg_musiccoca"] = cfg_musiccoca
        wav, new_state = system.generate(style=style, frames=frames, state=state)
        return wav, new_state

    try:
        t0 = time.time()
        wav, new_state = await asyncio.to_thread(_generate, frames)
        elapsed = time.time() - t0
    except Exception as e:  # noqa: BLE001
        return {"status": "error", "message": f"{type(e).__name__}: {e}"}

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    wav.write(str(out))

    _streaming_state = new_state
    _last_style = style_embedding

    duration = wav.num_samples / wav.sample_rate
    return {
        "status": "ok",
        "output_path": str(out.resolve()),
        "duration_seconds": round(duration, 2),
        "frames": frames,
        "generation_seconds": round(elapsed, 2),
        "backend": "jax",
        "model": MODEL_NAME,
        "realtime_capable": False,
    }


def num_chunks(duration_seconds: float) -> int:
    """Return frame count for a target duration (25 frames/s, 40 ms each)."""
    return max(1, round(duration_seconds * FRAMES_PER_SECOND))


def _auto_filename(prefix: str) -> str:
    return f"{prefix}_{time.strftime('%Y%m%d-%H%M%S')}.wav"


def output_path(filename: str | None, prefix: str) -> str:
    fname = filename or _auto_filename(prefix)
    return str(Path(OUTPUT_DIR) / fname)
