"""Magenta RT Webapp Backend — FastAPI bridge to magenta_rt Docker server.

Ports: Backend 10899, Frontend 10898
Calls magenta_rt HTTP/WS API directly (same as MCP server engine).
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Allow importing engine from the MCP package
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from magentart_mcp import engine

app = FastAPI(title="Magenta RT Webapp API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(engine.OUTPUT_DIR)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ── models ────────────────────────────────────────────────────────────────────


class GenerateRequest(BaseModel):
    prompt: str
    duration_seconds: float = 8.0
    output_filename: Optional[str] = None
    temperature: Optional[float] = None
    guidance_weight: Optional[float] = None


class BlendRequest(BaseModel):
    prompts: list[str]
    weights: Optional[list[float]] = None
    duration_seconds: float = 8.0
    output_filename: Optional[str] = None


# ── routes ────────────────────────────────────────────────────────────────────


@app.get("/api/status")
async def get_status():
    """Check Magenta RT Docker server health."""
    try:
        return await engine.get_server_info()
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/generate")
async def generate(req: GenerateRequest):
    """Generate audio from a text prompt."""
    try:
        style = await engine.embed_text(req.prompt)
        n = engine.num_chunks(req.duration_seconds)
        fname = req.output_filename or f"gen_{time.strftime('%Y%m%d-%H%M%S')}.wav"
        if not fname.endswith(".wav"):
            fname += ".wav"
        out = str(OUTPUT_DIR / fname)
        result = await engine.generate_audio(style, n, out)
        if result["status"] == "ok":
            result["prompt"] = req.prompt
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/blend")
async def blend(req: BlendRequest):
    """Generate audio blending multiple prompts."""
    try:
        style = await engine.embed_blend(req.prompts, req.weights)
        n = engine.num_chunks(req.duration_seconds)
        fname = req.output_filename or f"blend_{time.strftime('%Y%m%d-%H%M%S')}.wav"
        if not fname.endswith(".wav"):
            fname += ".wav"
        out = str(OUTPUT_DIR / fname)
        result = await engine.generate_audio(style, n, out)
        if result["status"] == "ok":
            result["prompts"] = req.prompts
            total = sum(req.weights) if req.weights else len(req.prompts)
            used = [w / total for w in (req.weights or [1.0] * len(req.prompts))]
            result["weights_used"] = [round(w, 3) for w in used]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/outputs")
async def list_outputs(limit: int = 30):
    """List generated WAV files, newest first."""
    wavs = sorted(OUTPUT_DIR.glob("*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)
    files = [
        {
            "name": p.name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "modified": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(p.stat().st_mtime)),
            "url": f"/api/outputs/{p.name}",
        }
        for p in wavs[:limit]
    ]
    return {"files": files, "count": len(files), "output_dir": str(OUTPUT_DIR)}


@app.get("/api/outputs/{filename}")
async def serve_output(filename: str):
    """Stream a generated WAV file."""
    path = OUTPUT_DIR / filename
    if not path.exists() or not path.suffix == ".wav":
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(path), media_type="audio/wav", filename=filename)


@app.delete("/api/outputs/{filename}")
async def delete_output(filename: str):
    """Delete a generated WAV file."""
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"deleted": filename}


@app.get("/api/tools")
async def list_tools():
    """Return the list of available MCP tools with descriptions."""
    return {
        "tools": [
            {
                "name": "magentart_status",
                "title": "Server Status",
                "description": "Check if the Magenta RT Docker server is running and reachable.",
                "readonly": True,
            },
            {
                "name": "magentart_generate",
                "title": "Generate from Prompt",
                "description": "Generate audio from a single text style prompt via Magenta RT.",
                "readonly": False,
                "params": ["prompt", "duration_seconds", "temperature", "guidance_weight"],
            },
            {
                "name": "magentart_generate_blend",
                "title": "Blend Multiple Prompts",
                "description": "Generate audio by blending 2–4 style prompts with optional weights.",
                "readonly": False,
                "params": ["prompts", "weights", "duration_seconds"],
            },
            {
                "name": "magentart_continue",
                "title": "Continue Generation",
                "description": "Generate more audio using the last embedded style.",
                "readonly": False,
                "params": ["duration_seconds"],
            },
            {
                "name": "magentart_list_outputs",
                "title": "List Outputs",
                "description": "List WAV files in the output directory, newest first.",
                "readonly": True,
            },
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=10899, reload=False)
