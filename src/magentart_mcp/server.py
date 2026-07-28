"""magentart_mcp.server — FastMCP 3.1 MCP server for Magenta RealTime 2.

Uses the in-process JAX backend (magenta-rt[jax]) on NVIDIA GPUs. Apple Silicon
with MLX is required only for live streaming (~200 ms) and MIDI control.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Literal

from fastmcp import Context, FastMCP
from fastmcp.server.providers import SkillsDirectoryProvider
from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import engine

# ── server ────────────────────────────────────────────────────────────────────

mcp = FastMCP(
    "magentart_mcp",
    instructions=(
        "Magenta RealTime 2 music generation (JAX/GPU on Windows, MLX live on Mac). "
        "First run: uv run mrt models init && uv run mrt checkpoints download mrt2_base. "
        "Use magentart_ops(operation='status') to verify assets and model. "
        "Use magentart_ops(operation='load_model') to warm the GPU before generation."
    ),
)

# Register Skills if they exist
skills_path = Path(__file__).parent.parent / "skills"
if skills_path.exists():
    mcp.add_provider(SkillsDirectoryProvider(skills_path))


@mcp.prompt("magentart_recommend_prompts")
def magentart_recommend_prompts(genre: str = "ambient") -> str:
    """Provides recommended prompts for different genres and moods."""
    recommendations = {
        "ambient": [
            "Floating in deep space with distant twinkling stars",
            "Slow ripples in a still mountain lake at dusk",
            "Soft light filtering through a foggy forest canopy",
        ],
        "electronic": [
            "Pulsing 80s neon cityscape with synthwave lead",
            "Deep house beat with a hypnotic bassline and glitch elements",
            "High-energy cyberpunk chase through rain-slicked streets",
        ],
        "jazz": [
            "Smoky underground jazz club with a soft piano solo",
            "Upbeat bossa nova rhythm with light acoustic guitar",
            "Late night rainy street with a lonely saxophone melody",
        ],
    }
    prompts = recommendations.get(genre.lower(), recommendations["ambient"])
    return f"Here are some recommended prompts for the {genre} genre:\n- " + "\n- ".join(prompts)


# Keep last style embedding in memory for 'continue' operations
_last_style: list[float] | None = None

# ── input models ─────────────────────────────────────────────────────────────


class OpsInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    operation: Literal[
        "status",
        "load_model",
        "reset",
        "generate",
        "generate_from_audio",
        "blend",
        "continue",
        "list",
    ] = Field(..., description="The operation to perform.")

    # Parameters for 'generate' / 'blend' / 'continue'
    prompt: str | None = Field(None, description="Style description (for 'generate').")
    prompts: list[str] | None = Field(None, description="2–4 prompts to blend.")
    weights: list[float] | None = Field(None, description="Weights for blending.")
    audio_path: str | None = Field(None, description="Source WAV path (for 'generate_from_audio').")

    duration_seconds: float = Field(default=8.0, ge=2.0, le=120.0)
    output_filename: str | None = Field(None, max_length=100)
    temperature: float | None = Field(None, ge=0.1, le=3.0)
    guidance_weight: float | None = Field(None, ge=0.0, le=7.0)

    # Parameters for 'list'
    limit: int = Field(default=20, ge=1, le=100)

    @field_validator("output_filename")
    @classmethod
    def sanitize_filename(cls, v: str | None) -> str | None:
        if v is None:
            return v
        for ch in r'\/:*?"<>|':
            v = v.replace(ch, "_")
        if not v.endswith(".wav"):
            v += ".wav"
        return v


class AgenticWorkflowInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    goal: str = Field(
        ...,
        description="High-level goal for music creation (e.g. '30s lo-fi beat with jazz hints').",
    )


# ── helpers ───────────────────────────────────────────────────────────────────


def _gen_kwargs(params: OpsInput) -> dict:
    kwargs = {}
    if params.temperature is not None:
        kwargs["temperature"] = params.temperature
    if params.guidance_weight is not None:
        kwargs["guidance_weight"] = params.guidance_weight
    return kwargs


# ── tools ─────────────────────────────────────────────────────────────────────


@mcp.tool(name="magentart_ops")
async def magentart_ops(params: OpsInput, ctx: Context) -> str:
    """PORTMANTEAU PATTERN RATIONALE:
    Consolidates 8 related music generation operations into a single interface.
    Prevents tool explosion while maintaining full functionality.
    Follows FastMCP 3.1+ best practices.

    Args:
        operation (Literal, required): Must be one of:
            - "status": Check model assets and load state.
            - "load_model": Download/warm the JAX model on GPU (first run compiles ~minutes).
            - "reset": Clear stored style and streaming state.
            - "generate": Create music from a text prompt.
            - "generate_from_audio": Create music from an audio file's style.
            - "blend": Interpolate between multiple text prompts.
            - "continue": Extend the previous style with more audio.
            - "list": List the generated files in the output directory.
        prompt (str | None): Text prompt for 'generate'.
        prompts (list[str] | None): 2-4 prompts for 'blend'.
        weights (list[float] | None): Optional weights for 'blend'.
        audio_path (str | None): Absolute path to WAV for 'generate_from_audio'.
        duration_seconds (float): Length of audio (default 8s).
        output_filename (str | None): Specific filename for the WAV output.
        temperature (float | None): Randomness (0.1 - 3.0).
        guidance_weight (float | None): MusicCoCa CFG scale / prompt adherence (0.0 - 7.0).
        limit (int): Max files for 'list'.
    """
    global _last_style
    cid = ctx.correlation_id
    op = params.operation

    try:
        if op == "status":
            result = await engine.get_server_info()
            return json.dumps(result, indent=2)

        if op == "load_model":
            result = await engine.ensure_model_loaded()
            return json.dumps(result, indent=2)

        elif op == "reset":
            engine.reset_generation_state()
            _last_style = None
            return json.dumps(
                {"status": "ok", "message": "Style and streaming state reset."}, indent=2
            )

        elif op == "generate":
            if not params.prompt:
                return '{"error": "prompt required for generate"}'
            style = await engine.embed_text(params.prompt, cid)
            _last_style = style
            n = engine.num_chunks(params.duration_seconds)
            out = engine.output_path(params.output_filename, "gen")
            result = await engine.generate_audio(style, n, out, _gen_kwargs(params))
            return json.dumps(result, indent=2)

        elif op == "generate_from_audio":
            if not params.audio_path:
                return '{"error": "audio_path required"}'
            style = await engine.embed_audio(params.audio_path, cid)
            _last_style = style
            n = engine.num_chunks(params.duration_seconds)
            out = engine.output_path(params.output_filename, "audio_style")
            result = await engine.generate_audio(style, n, out, _gen_kwargs(params))
            return json.dumps(result, indent=2)

        elif op == "blend":
            if not params.prompts:
                return '{"error": "prompts list required"}'
            style = await engine.embed_blend(params.prompts, params.weights, cid)
            _last_style = style
            n = engine.num_chunks(params.duration_seconds)
            out = engine.output_path(params.output_filename, "blend")
            result = await engine.generate_audio(style, n, out, _gen_kwargs(params))
            return json.dumps(result, indent=2)

        elif op == "continue":
            if _last_style is None:
                return '{"error": "no style active"}'
            n = engine.num_chunks(params.duration_seconds)
            out = engine.output_path(params.output_filename, "cont")
            result = await engine.generate_audio(
                _last_style, n, out, _gen_kwargs(params), continue_from_state=True
            )
            return json.dumps(result, indent=2)

        elif op == "list":
            out_dir = Path(engine.OUTPUT_DIR)
            out_dir.mkdir(parents=True, exist_ok=True)
            wavs = sorted(out_dir.glob("*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)
            files = [{"name": p.name, "path": str(p)} for p in wavs[: params.limit]]
            return json.dumps({"output_dir": str(out_dir), "files": files}, indent=2)

    except Exception as e:
        return json.dumps({"status": "error", "message": f"{type(e).__name__}: {e}"}, indent=2)


@mcp.tool(name="magentart_agentic_workflow")
async def magentart_agentic_workflow(params: AgenticWorkflowInput, ctx: Context) -> str:
    """Autonomous music creation and refinement workflow (SEP-1577).

    This tool uses iterative sampling to fulfill high-level music goals.
    """
    ctx.info(f"Starting agentic workflow for goal: {params.goal}")

    # Use ctx.sample() to plan the operations
    plan_request = (
        f"You are the Magenta RT Music Engineer. The user's goal is: '{params.goal}'. "
        "Based on the available 'magentart_ops' tool, identify the best sequence of operations "
        "to achieve this goal. Typically start with 'generate' or 'blend', then potentially "
        "'continue' to reach the desired length. Respond with a concise JSON plan."
    )

    try:
        sample_result = await ctx.sample(
            prompt=plan_request,
            max_tokens=500,
            model_preferences={"cost_weight": 0.5, "speed_weight": 0.5},
        )

        plan_text = sample_result.content[0].text if sample_result.content else "No plan generated."

        ctx.info(f"Generated autonomous plan: {plan_text}")

        # In a fully autonomous loop, we would execute the plan here.
        # For this tool implementation, we return the plan and status.
        return json.dumps(
            {
                "status": "plan_generated",
                "goal": params.goal,
                "autonomous_plan": plan_text,
                "requires_sampling": False,  # Initial sampling complete
                "next_steps": [
                    "Follow the generated autonomous plan.",
                    "Use magentart_ops for each step.",
                    "Verify audio quality after each generation.",
                ],
            },
            indent=2,
        )
    except Exception as e:
        ctx.error(f"Sampling failed: {e}")
        return json.dumps(
            {
                "status": "error",
                "message": f"Agentic sampling failed: {e}",
                "hint": "Ensure your MCP client supports sampling (e.g. Claude Desktop, Cursor).",
            },
            indent=2,
        )


# ── entry point ───────────────────────────────────────────────────────────────


def main() -> None:
    """Entry point for the magentart-mcp console script."""
    import argparse
    import os

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Magenta RT MCP Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=10775, help="Port to listen on")
    parser.add_argument("--http", action="store_true", help="Run in HTTP mode")
    parser.add_argument("--stdio", action="store_true", help="Run in STDIO mode (default)")

    args, unknown = parser.parse_known_args()

    # Determine transport
    transport = "stdio"
    if args.http:
        transport = "http"
    elif os.getenv("MCP_TRANSPORT") == "http":
        transport = "http"

    if transport == "http":
        app = mcp.http_app(path="/")
        from fastapi.middleware.cors import CORSMiddleware

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @app.get("/health")
        async def health():
            return {"status": "ok", "server": "magentart-mcp"}

        mcp.run(transport="http", host=args.host, port=args.port)
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
