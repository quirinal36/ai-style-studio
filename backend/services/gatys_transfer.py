"""Gatys et al. (2015) Neural Style Transfer service.

Implements the optimization-based style transfer using VGG19 features.
Content is preserved via conv4_2 features, style via Gram matrices of
conv1_1 through conv5_1.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Callable, Awaitable

import torch
from PIL import Image

from services.feature_extractor import (
    VGG19FeatureExtractor,
    gram_matrix,
    CONTENT_LAYERS,
    STYLE_LAYERS,
    DEFAULT_STYLE_WEIGHTS,
)
from services.image_processor import image_to_tensor, tensor_to_image


@dataclass
class TransferParams:
    content_weight: float = 1.0
    style_weight: float = 1e6
    num_steps: int = 300
    max_size: int = 400
    learning_rate: float = 0.01


@dataclass
class ProgressInfo:
    step: int = 0
    total_steps: int = 0
    content_loss: float = 0.0
    style_loss: float = 0.0
    total_loss: float = 0.0
    preview_image: Image.Image | None = None
    is_complete: bool = False


# Type alias for progress callback
ProgressCallback = Callable[[ProgressInfo], Awaitable[None]]


class GatysStyleTransfer:
    """Gatys et al. (2015) Neural Style Transfer using VGG19."""

    PREVIEW_INTERVAL = 50  # Generate preview every N steps

    def __init__(self, device: str = "cpu"):
        self.device = torch.device(device)
        self.extractor = VGG19FeatureExtractor(self.device)
        self.style_layer_weights = DEFAULT_STYLE_WEIGHTS

    def _compute_content_loss(
        self,
        gen_features: dict[str, torch.Tensor],
        content_features: dict[str, torch.Tensor],
    ) -> torch.Tensor:
        """Compute content loss as MSE between feature maps at content layers."""
        loss = torch.tensor(0.0, device=self.device)
        for layer in CONTENT_LAYERS:
            loss += torch.nn.functional.mse_loss(
                gen_features[layer], content_features[layer]
            )
        return loss

    def _compute_style_loss(
        self,
        gen_features: dict[str, torch.Tensor],
        style_features: dict[str, torch.Tensor],
    ) -> torch.Tensor:
        """Compute style loss as weighted MSE between Gram matrices at style layers."""
        loss = torch.tensor(0.0, device=self.device)
        for layer in STYLE_LAYERS:
            gen_gram = gram_matrix(gen_features[layer])
            style_gram = gram_matrix(style_features[layer])
            layer_loss = torch.nn.functional.mse_loss(gen_gram, style_gram)
            loss += self.style_layer_weights[layer] * layer_loss
        return loss

    async def run(
        self,
        content_image: Image.Image,
        style_image: Image.Image,
        params: TransferParams,
        callback: ProgressCallback | None = None,
        cancel_event: asyncio.Event | None = None,
    ) -> Image.Image:
        """Run style transfer optimization loop.

        Args:
            content_image: Content PIL Image (already resized).
            style_image: Style PIL Image (already resized).
            params: Transfer hyperparameters.
            callback: Async callback for progress updates.
            cancel_event: Event to signal cancellation.

        Returns:
            Result PIL Image.
        """
        # Convert images to tensors
        content_tensor = image_to_tensor(content_image, self.device)
        style_tensor = image_to_tensor(style_image, self.device)

        # Resize style to match content dimensions
        if style_tensor.shape != content_tensor.shape:
            style_tensor = torch.nn.functional.interpolate(
                style_tensor,
                size=content_tensor.shape[2:],
                mode="bilinear",
                align_corners=False,
            )

        # Extract target features (computed once)
        with torch.no_grad():
            content_features = self.extractor(content_tensor)
            style_features = self.extractor(style_tensor)

        # Initialize generated image as a copy of content
        generated = content_tensor.clone().requires_grad_(True)

        optimizer = torch.optim.Adam([generated], lr=params.learning_rate)

        for step in range(1, params.num_steps + 1):
            # Check for cancellation
            if cancel_event and cancel_event.is_set():
                break

            optimizer.zero_grad()

            gen_features = self.extractor(generated)

            content_loss = self._compute_content_loss(gen_features, content_features)
            style_loss = self._compute_style_loss(gen_features, style_features)
            total_loss = params.content_weight * content_loss + params.style_weight * style_loss

            total_loss.backward()
            optimizer.step()

            # Send progress update
            if callback and (step % 10 == 0 or step == 1 or step == params.num_steps):
                preview = None
                if step % self.PREVIEW_INTERVAL == 0 or step == params.num_steps:
                    preview = tensor_to_image(generated)

                info = ProgressInfo(
                    step=step,
                    total_steps=params.num_steps,
                    content_loss=content_loss.item(),
                    style_loss=style_loss.item(),
                    total_loss=total_loss.item(),
                    preview_image=preview,
                    is_complete=(step == params.num_steps),
                )
                await callback(info)

            # Yield control to event loop periodically
            if step % 5 == 0:
                await asyncio.sleep(0)

        return tensor_to_image(generated)
