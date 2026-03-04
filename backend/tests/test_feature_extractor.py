"""Tests for feature_extractor service."""

import sys
from pathlib import Path

import pytest
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.feature_extractor import VGG19FeatureExtractor, gram_matrix
from services.image_processor import image_to_tensor


def _make_tensor(size=64):
    """Create a test image tensor."""
    img = Image.new("RGB", (size, size), color=(128, 128, 128))
    return image_to_tensor(img)


class TestGramMatrix:
    def test_output_shape(self):
        # gram_matrix flattens batch into channels: output is (C, C)
        features = torch.randn(1, 16, 8, 8)
        gram = gram_matrix(features)
        assert gram.shape == (16, 16)

    def test_symmetric(self):
        features = torch.randn(1, 8, 4, 4)
        gram = gram_matrix(features)
        # Gram matrix should be symmetric
        diff = torch.abs(gram - gram.transpose(0, 1))
        assert diff.max().item() < 1e-5


class TestVGG19FeatureExtractor:
    @pytest.fixture(scope="class")
    def extractor(self):
        return VGG19FeatureExtractor()

    def test_extract_style_features(self, extractor):
        tensor = _make_tensor()
        # forward() returns all target layer features
        features = extractor(tensor)
        assert "conv1_1" in features
        assert "conv2_1" in features
        assert features["conv1_1"].dim() == 4

    def test_extract_content_feature(self, extractor):
        tensor = _make_tensor()
        features = extractor(tensor)
        assert "conv4_2" in features
