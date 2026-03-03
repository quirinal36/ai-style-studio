"""Application configuration."""

import os
from pathlib import Path


class Settings:
    BASE_DIR = Path(__file__).resolve().parent
    STORAGE_DIR = BASE_DIR / "storage"
    UPLOADS_DIR = STORAGE_DIR / "uploads"
    RESULTS_DIR = STORAGE_DIR / "results"
    PREVIEWS_DIR = STORAGE_DIR / "previews"
    MODELS_DIR = BASE_DIR / "models"
    PRESETS_DIR = BASE_DIR / "presets"
    GALLERY_FILE = STORAGE_DIR / "gallery.json"

    DEVICE = os.getenv("DEVICE", "cpu")
    MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", "400"))
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

    # Gatys defaults
    DEFAULT_CONTENT_WEIGHT = 1.0
    DEFAULT_STYLE_WEIGHT = 1e6
    DEFAULT_NUM_STEPS = 300
    DEFAULT_LEARNING_RATE = 0.01


settings = Settings()

# Ensure storage directories exist
for d in [settings.UPLOADS_DIR, settings.RESULTS_DIR, settings.PREVIEWS_DIR]:
    d.mkdir(parents=True, exist_ok=True)
