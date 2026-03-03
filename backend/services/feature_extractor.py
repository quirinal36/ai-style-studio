"""VGG19 feature extraction utilities for Neural Style Transfer."""

import torch
import torch.nn as nn
from torchvision import models

# VGG19 layer name → index mapping
# VGG19.features is a Sequential of Conv2d, ReLU, MaxPool2d layers
VGG19_LAYER_MAP = {
    "conv1_1": 0,   # Conv2d(3, 64)
    "conv1_2": 2,   # Conv2d(64, 64)
    "conv2_1": 5,   # Conv2d(64, 128)
    "conv2_2": 7,   # Conv2d(128, 128)
    "conv3_1": 10,  # Conv2d(128, 256)
    "conv3_2": 12,  # Conv2d(256, 256)
    "conv3_3": 14,  # Conv2d(256, 256)
    "conv3_4": 16,  # Conv2d(256, 256)
    "conv4_1": 19,  # Conv2d(256, 512)
    "conv4_2": 21,  # Conv2d(512, 512)  ← Content layer
    "conv4_3": 23,  # Conv2d(512, 512)
    "conv4_4": 25,  # Conv2d(512, 512)
    "conv5_1": 28,  # Conv2d(512, 512)
    "conv5_2": 30,  # Conv2d(512, 512)
    "conv5_3": 32,  # Conv2d(512, 512)
    "conv5_4": 34,  # Conv2d(512, 512)
}

CONTENT_LAYERS = ["conv4_2"]
STYLE_LAYERS = ["conv1_1", "conv2_1", "conv3_1", "conv4_1", "conv5_1"]

# Per-layer style weights (earlier layers = more weight for texture details)
DEFAULT_STYLE_WEIGHTS = {
    "conv1_1": 1.0,
    "conv2_1": 0.8,
    "conv3_1": 0.5,
    "conv4_1": 0.3,
    "conv5_1": 0.1,
}


class VGG19FeatureExtractor(nn.Module):
    """Extract intermediate features from VGG19 for style transfer."""

    def __init__(self, device: torch.device = None):
        super().__init__()
        if device is None:
            device = torch.device("cpu")
        self.device = device

        vgg = models.vgg19(weights=models.VGG19_Weights.DEFAULT).features.to(device)
        vgg.eval()
        for param in vgg.parameters():
            param.requires_grad_(False)

        self.slices = nn.ModuleDict()
        self.target_layers = set(CONTENT_LAYERS + STYLE_LAYERS)

        # Build sub-networks for each target layer
        sorted_targets = sorted(self.target_layers, key=lambda l: VGG19_LAYER_MAP[l])
        prev_idx = 0
        for layer_name in sorted_targets:
            end_idx = VGG19_LAYER_MAP[layer_name] + 1
            # Use '_' instead of illegal characters for ModuleDict keys
            safe_name = layer_name.replace(".", "_")
            self.slices[safe_name] = nn.Sequential(*list(vgg.children())[prev_idx:end_idx]).to(device)
            prev_idx = end_idx

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        """Extract features from all target layers.

        Args:
            x: Input tensor of shape (1, 3, H, W), ImageNet-normalized.

        Returns:
            Dict mapping layer names to feature tensors.
        """
        features = {}
        sorted_targets = sorted(self.target_layers, key=lambda l: VGG19_LAYER_MAP[l])
        h = x
        for layer_name in sorted_targets:
            safe_name = layer_name.replace(".", "_")
            h = self.slices[safe_name](h)
            features[layer_name] = h
        return features

    def extract_single_layer(self, x: torch.Tensor, layer_name: str) -> torch.Tensor:
        """Extract features from a single specified layer."""
        target_idx = VGG19_LAYER_MAP[layer_name] + 1
        sorted_targets = sorted(self.target_layers, key=lambda l: VGG19_LAYER_MAP[l])

        h = x
        for name in sorted_targets:
            safe_name = name.replace(".", "_")
            h = self.slices[safe_name](h)
            if name == layer_name:
                return h
            if VGG19_LAYER_MAP[name] >= VGG19_LAYER_MAP[layer_name]:
                break
        return h


def gram_matrix(tensor: torch.Tensor) -> torch.Tensor:
    """Compute the Gram matrix of a feature map.

    Args:
        tensor: Feature tensor of shape (1, C, H, W)

    Returns:
        Gram matrix of shape (C, C), normalized by the number of elements.
    """
    b, c, h, w = tensor.size()
    features = tensor.view(b * c, h * w)
    G = torch.mm(features, features.t())
    return G.div(b * c * h * w)
