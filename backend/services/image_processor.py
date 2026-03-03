"""Image pre/post-processing utilities for Neural Style Transfer."""

import io
import uuid
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

# ImageNet normalization stats
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image_file(content_type: str, file_size: int) -> str | None:
    """Validate image file type and size. Returns error message or None."""
    if content_type not in ALLOWED_MIME_TYPES:
        return f"지원하지 않는 이미지 형식입니다. 지원 형식: JPG, PNG, WEBP"
    if file_size > MAX_UPLOAD_SIZE:
        return f"파일 크기가 10MB를 초과합니다."
    return None


def load_image(image_bytes: bytes, max_size: int = 400) -> Image.Image:
    """Load image from bytes and resize to max_size while keeping aspect ratio."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = image.size
    scale = max_size / max(w, h)
    if scale < 1.0:
        new_w, new_h = int(w * scale), int(h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)
    return image


def image_to_tensor(image: Image.Image, device: torch.device = None) -> torch.Tensor:
    """Convert PIL Image to normalized PyTorch tensor for VGG19.

    Returns tensor of shape (1, 3, H, W) with ImageNet normalization.
    """
    if device is None:
        device = torch.device("cpu")

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    tensor = transform(image).unsqueeze(0).to(device)
    return tensor


def tensor_to_image(tensor: torch.Tensor) -> Image.Image:
    """Convert normalized PyTorch tensor back to PIL Image.

    Reverses ImageNet normalization and clamps to [0, 1].
    """
    img = tensor.cpu().clone().detach().squeeze(0)
    # Denormalize
    for c, (mean, std) in enumerate(zip(IMAGENET_MEAN, IMAGENET_STD)):
        img[c] = img[c] * std + mean
    img = img.clamp(0, 1)
    img = transforms.ToPILImage()(img)
    return img


def save_image(image: Image.Image, output_dir: Path, prefix: str = "", fmt: str = "PNG") -> str:
    """Save PIL Image to output_dir with a UUID filename. Returns the filename."""
    ext = "png" if fmt.upper() == "PNG" else "jpg"
    filename = f"{prefix}{uuid.uuid4().hex[:12]}.{ext}"
    filepath = output_dir / filename
    if fmt.upper() == "JPEG" or fmt.upper() == "JPG":
        image.save(filepath, "JPEG", quality=95)
    else:
        image.save(filepath, "PNG")
    return filename


def generate_unique_filename(extension: str = ".png") -> str:
    """Generate a UUID-based filename to prevent path traversal."""
    return f"{uuid.uuid4().hex}{extension}"
