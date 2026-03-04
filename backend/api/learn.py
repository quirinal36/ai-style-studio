"""Learning dashboard API endpoints."""

import io
import base64

import torch
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from services.image_processor import validate_image_file, load_image, image_to_tensor
from services.feature_extractor import (
    VGG19FeatureExtractor, gram_matrix,
    VGG19_LAYER_MAP, CONTENT_LAYERS, STYLE_LAYERS,
)

router = APIRouter()

_extractor: VGG19FeatureExtractor | None = None


def get_extractor() -> VGG19FeatureExtractor:
    global _extractor
    if _extractor is None:
        _extractor = VGG19FeatureExtractor(torch.device(settings.DEVICE))
    return _extractor


def tensor_to_heatmap_b64(tensor_2d: np.ndarray) -> str:
    """Convert 2D numpy array to base64 PNG heatmap."""
    fig, ax = plt.subplots(1, 1, figsize=(3, 3), dpi=80)
    ax.imshow(tensor_2d, cmap='viridis', aspect='auto')
    ax.axis('off')
    fig.tight_layout(pad=0)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


VISUALIZE_LAYERS = ["conv1_1", "conv2_1", "conv3_1", "conv4_1", "conv4_2", "conv5_1"]


@router.post("/feature-maps")
async def extract_feature_maps(
    image: UploadFile = File(...),
    layer: str = Form(default="conv1_1"),
):
    """Extract VGG19 feature maps and return as heatmap images."""
    image_bytes = await image.read()
    err = validate_image_file(image.content_type, len(image_bytes))
    if err:
        raise HTTPException(status_code=400, detail=err)

    if layer not in VGG19_LAYER_MAP:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 레이어: {layer}")

    img = load_image(image_bytes, max_size=256)
    tensor = image_to_tensor(img, torch.device(settings.DEVICE))

    extractor = get_extractor()
    with torch.no_grad():
        features = extractor(tensor)

    feat = features[layer].squeeze(0).cpu().numpy()  # (C, H, W)
    num_channels = min(feat.shape[0], 16)  # Show up to 16 channels

    channels = []
    for i in range(num_channels):
        heatmap_b64 = tensor_to_heatmap_b64(feat[i])
        channels.append({
            "channel": i,
            "image": heatmap_b64,
        })

    return {
        "layer": layer,
        "shape": list(feat.shape),
        "channels": channels,
    }


@router.post("/gram-matrix")
async def compute_gram_matrix_endpoint(
    image: UploadFile = File(...),
    layer: str = Form(default="conv1_1"),
):
    """Compute Gram matrix for a given layer and return as heatmap."""
    image_bytes = await image.read()
    err = validate_image_file(image.content_type, len(image_bytes))
    if err:
        raise HTTPException(status_code=400, detail=err)

    if layer not in VGG19_LAYER_MAP:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 레이어: {layer}")

    img = load_image(image_bytes, max_size=256)
    tensor = image_to_tensor(img, torch.device(settings.DEVICE))

    extractor = get_extractor()
    with torch.no_grad():
        features = extractor(tensor)

    feat = features[layer]
    gram = gram_matrix(feat).cpu().numpy()

    heatmap_b64 = tensor_to_heatmap_b64(gram)

    return {
        "layer": layer,
        "shape": list(gram.shape),
        "image": heatmap_b64,
    }


@router.get("/vgg19-info")
async def vgg19_info():
    """Return VGG19 model structure information."""
    layers = []
    for name, idx in sorted(VGG19_LAYER_MAP.items(), key=lambda x: x[1]):
        layer_type = "content" if name in CONTENT_LAYERS else ("style" if name in STYLE_LAYERS else "other")
        # Determine channel count from layer name
        block = int(name[4])
        channels = {1: 64, 2: 128, 3: 256, 4: 512, 5: 512}[block]
        layers.append({
            "name": name,
            "index": idx,
            "type": layer_type,
            "channels": channels,
        })

    return {
        "model": "VGG19",
        "total_params": "143.7M",
        "content_layers": CONTENT_LAYERS,
        "style_layers": STYLE_LAYERS,
        "layers": layers,
    }
