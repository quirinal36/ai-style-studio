"""Tests for image_processor service."""

import io
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.image_processor import (
    validate_image_file,
    load_image,
    image_to_tensor,
    tensor_to_image,
)


def _make_test_image(width=100, height=100, fmt="JPEG"):
    """Create a test image and return its bytes."""
    img = Image.new("RGB", (width, height), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


class TestValidateImageFile:
    def test_valid_jpeg(self):
        assert validate_image_file("image/jpeg", 1000) is None

    def test_valid_png(self):
        assert validate_image_file("image/png", 1000) is None

    def test_invalid_type(self):
        err = validate_image_file("text/plain", 1000)
        assert err is not None

    def test_too_large(self):
        err = validate_image_file("image/jpeg", 20 * 1024 * 1024)
        assert err is not None

    def test_zero_size_is_valid_mime(self):
        # validate_image_file only checks MIME type and max size
        # Zero-size files will fail at load_image stage
        err = validate_image_file("image/jpeg", 0)
        assert err is None


class TestLoadImage:
    def test_loads_pil_image(self):
        data = _make_test_image()
        img = load_image(data, max_size=400)
        assert isinstance(img, Image.Image)
        assert img.mode == "RGB"

    def test_resizes_large_image(self):
        data = _make_test_image(800, 600)
        img = load_image(data, max_size=400)
        assert max(img.size) <= 400

    def test_does_not_upscale(self):
        data = _make_test_image(50, 50)
        img = load_image(data, max_size=400)
        assert img.size == (50, 50)


class TestTensorConversion:
    def test_roundtrip(self):
        data = _make_test_image(64, 64)
        img = load_image(data, max_size=400)
        tensor = image_to_tensor(img)
        assert tensor.dim() == 4
        assert tensor.shape[0] == 1
        assert tensor.shape[1] == 3

        result = tensor_to_image(tensor)
        assert isinstance(result, Image.Image)
        assert result.size == (64, 64)
