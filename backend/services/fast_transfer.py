"""Johnson et al. (2016) Fast Style Transfer service using OpenCV DNN."""

import time
from pathlib import Path

import cv2
import numpy as np

# Model metadata for UI display
MODEL_INFO = {
    "starry_night": {"name": "Starry Night", "description": "고흐 - 별이 빛나는 밤", "artist": "Vincent van Gogh"},
    "the_scream": {"name": "The Scream", "description": "뭉크 - 절규", "artist": "Edvard Munch"},
    "mosaic": {"name": "Mosaic", "description": "모자이크 패턴", "artist": "Byzantine"},
    "candy": {"name": "Candy", "description": "캔디 스타일", "artist": "Unknown"},
    "udnie": {"name": "Udnie", "description": "피카비아 - Udnie", "artist": "Francis Picabia"},
    "rain_princess": {"name": "Rain Princess", "description": "비 오는 풍경", "artist": "Leonid Afremov"},
    "la_muse": {"name": "La Muse", "description": "피카소 스타일", "artist": "Pablo Picasso"},
    "feathers": {"name": "Feathers", "description": "깃털 패턴", "artist": "Unknown"},
}


class FastStyleTransfer:
    """Fast Style Transfer using pre-trained .t7 models via OpenCV DNN."""

    def __init__(self, models_dir: str | Path):
        self.models_dir = Path(models_dir)
        self._loaded_models: dict[str, cv2.dnn.Net] = {}

    def get_available_models(self) -> list[dict]:
        """List available .t7 model files with metadata."""
        models = []
        for path in sorted(self.models_dir.glob("*.t7")):
            name = path.stem
            info = MODEL_INFO.get(name, {"name": name, "description": name, "artist": "Unknown"})
            models.append({
                "model_name": name,
                "display_name": info["name"],
                "description": info["description"],
                "artist": info["artist"],
                "file_size_mb": round(path.stat().st_size / (1024 * 1024), 1),
            })
        return models

    def _load_model(self, model_name: str) -> cv2.dnn.Net:
        """Load a .t7 model, caching after first load."""
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]

        model_path = self.models_dir / f"{model_name}.t7"
        if not model_path.exists():
            raise FileNotFoundError(
                f"모델 파일을 찾을 수 없습니다: {model_name}.t7. "
                f"backend/download_models.sh를 실행해주세요."
            )

        net = cv2.dnn.readNetFromTorch(str(model_path))
        self._loaded_models[model_name] = net
        return net

    def transform_image(self, image: np.ndarray, model_name: str) -> np.ndarray:
        """Apply style transfer to a single image (BGR format).

        Args:
            image: Input BGR image (numpy array).
            model_name: Name of the .t7 model file (without extension).

        Returns:
            Styled BGR image (numpy array).
        """
        net = self._load_model(model_name)

        h, w = image.shape[:2]
        blob = cv2.dnn.blobFromImage(image, 1.0, (w, h), (103.939, 116.779, 123.68), swapRB=False)
        net.setInput(blob)
        output = net.forward()

        # Reshape output: (1, C, H, W) -> (H, W, C) and denormalize
        result = output.squeeze(0).transpose(1, 2, 0)
        result += np.array([103.939, 116.779, 123.68])
        result = np.clip(result, 0, 255).astype(np.uint8)

        return result

    def transform_frame(self, frame: np.ndarray, model_name: str) -> np.ndarray:
        """Transform a webcam frame optimized for real-time (320x240).

        Resizes input to 320x240 for consistent CPU performance.
        """
        target_h, target_w = 240, 320
        resized = cv2.resize(frame, (target_w, target_h))
        return self.transform_image(resized, model_name)
