import json
from unittest.mock import AsyncMock, patch

import pytest

from magentart_mcp.server import OpsInput, magentart_ops


@pytest.fixture
def mock_ctx():
    ctx = AsyncMock()
    ctx.correlation_id = "test-id"
    return ctx


@pytest.mark.asyncio
async def test_magentart_ops_status(mock_server_info, mock_ctx):
    with patch("magentart_mcp.engine.get_server_info", new_callable=AsyncMock) as mock_info:
        mock_info.return_value = mock_server_info
        params = OpsInput(operation="status")
        result = await magentart_ops(params, mock_ctx)
        data = json.loads(result)
        assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_magentart_ops_generate(mock_style_embedding, mock_ctx):
    with (
        patch("magentart_mcp.engine.embed_text", new_callable=AsyncMock) as mock_embed,
        patch("magentart_mcp.engine.generate_audio", new_callable=AsyncMock) as mock_gen,
    ):
        mock_embed.return_value = mock_style_embedding
        mock_gen.return_value = {
            "status": "ok",
            "output_path": "/tmp/test.wav",
            "duration_seconds": 8.0,
        }

        params = OpsInput(operation="generate", prompt="test prompt")
        result = await magentart_ops(params, mock_ctx)
        data = json.loads(result)
        assert data["status"] == "ok"
        assert "/tmp/test.wav" in data["output_path"]


@pytest.mark.asyncio
async def test_magentart_ops_list(mock_ctx):
    with (
        patch("magentart_mcp.engine.OUTPUT_DIR", "/tmp/outputs"),
        patch("pathlib.Path.mkdir"),
        patch("pathlib.Path.glob") as mock_glob,
    ):
        mock_glob.return_value = []
        params = OpsInput(operation="list", limit=5)
        result = await magentart_ops(params, mock_ctx)
        data = json.loads(result)
        assert "outputs" in data["output_dir"]
