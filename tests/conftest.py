import pytest


@pytest.fixture
def mock_server_info():
    return {
        "status": "ok",
        "backend": "jax",
        "model": "mrt2_base",
        "sample_rate": 48000,
        "frame_rate_hz": 25,
        "num_channels": 2,
        "resources_ready": True,
        "checkpoint_ready": True,
    }


@pytest.fixture
def mock_style_embedding():
    return [0.1] * 768
