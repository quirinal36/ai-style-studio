"""Tests for API endpoints."""

import io
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def _make_upload_image(width=64, height=64):
    """Create a test JPEG image for upload."""
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


@pytest.mark.anyio
async def test_health_check(client):
    """Test that the root endpoint is accessible."""
    resp = await client.get("/health")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_gallery_list_empty(client):
    """Test gallery listing returns proper structure."""
    resp = await client.get("/api/gallery")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_gallery_item_not_found(client):
    """Test getting a non-existent gallery item."""
    resp = await client.get("/api/gallery/99999")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_presets_list(client):
    """Test preset styles listing."""
    resp = await client.get("/api/presets/styles")
    assert resp.status_code == 200
    data = resp.json()
    assert "styles" in data
    assert len(data["styles"]) > 0
    for style in data["styles"]:
        assert "id" in style
        assert "name" in style
        assert "artist" in style


@pytest.mark.anyio
async def test_preset_image_not_found(client):
    """Test getting image for non-existent preset."""
    resp = await client.get("/api/presets/styles/nonexistent/image")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_vgg19_info(client):
    """Test VGG19 info endpoint."""
    resp = await client.get("/api/learn/vgg19-info")
    assert resp.status_code == 200
    data = resp.json()
    assert "layers" in data


@pytest.mark.anyio
async def test_models_list(client):
    """Test model listing endpoint."""
    resp = await client.get("/api/style-transfer/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
