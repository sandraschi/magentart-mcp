from unittest.mock import AsyncMock, patch

import pytest

from magentart_mcp import engine


@pytest.mark.asyncio
async def test_get_server_info():
    with patch("magentart_mcp.engine._assets_status") as mock_assets:
        mock_assets.return_value = {
            "magenta_home": "/tmp/magenta",
            "resources_ready": True,
            "checkpoint_ready": True,
            "checkpoint_path": "/tmp/magenta/checkpoints/mrt2_base.safetensors",
            "model": "mrt2_base",
        }
        info = await engine.get_server_info()
        assert info["status"] == "ok"
        assert info["sample_rate"] == 48000
        assert info["backend"] == "jax"


@pytest.mark.asyncio
async def test_embed_text():
    with patch("magentart_mcp.engine.ensure_model_loaded", new_callable=AsyncMock) as mock_ready:
        mock_ready.return_value = {"status": "ok"}
        with patch("magentart_mcp.engine._get_system_sync") as mock_system:
            import numpy as np

            mock_system.return_value.embed_style.return_value = np.ones(768, dtype=np.float32)
            style = await engine.embed_text("test prompt")
            assert len(style) == 768
            mock_system.return_value.embed_style.assert_called_once_with(
                "test prompt", use_mapper=True
            )


def test_num_chunks():
    assert engine.num_chunks(1.0) == 25
    assert engine.num_chunks(4.0) == 100
    assert engine.num_chunks(0.04) == 1


def test_output_path():
    with patch("magentart_mcp.engine.OUTPUT_DIR", "/tmp/outputs"):
        path = engine.output_path("test.wav", "prefix")
        assert "test.wav" in path
        assert "/tmp/outputs" in path.replace("\\", "/")


@pytest.mark.asyncio
async def test_embed_blend():
    with patch("magentart_mcp.engine.embed_text", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1] * 768
        blended = await engine.embed_blend(["prompt1", "prompt2"], [0.5, 0.5])
        assert isinstance(blended, list)
        assert len(blended) == 768
        assert mock_embed.call_count == 2
