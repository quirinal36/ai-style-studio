"""Preset style images API endpoints."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from config import settings

router = APIRouter()

PRESET_STYLES = [
    {"id": "starry_night", "name": "별이 빛나는 밤", "artist": "Vincent van Gogh", "file": "starry_night.jpg"},
    {"id": "the_scream", "name": "절규", "artist": "Edvard Munch", "file": "the_scream.jpg"},
    {"id": "composition_vii", "name": "구성 VII", "artist": "Wassily Kandinsky", "file": "composition_vii.jpg"},
    {"id": "great_wave", "name": "가나가와 해변의 큰 파도", "artist": "Katsushika Hokusai", "file": "great_wave.jpg"},
    {"id": "weeping_woman", "name": "우는 여인", "artist": "Pablo Picasso", "file": "weeping_woman.jpg"},
    {"id": "water_lilies", "name": "수련", "artist": "Claude Monet", "file": "water_lilies.jpg"},
]


@router.get("/styles")
async def list_preset_styles():
    """List available preset style images."""
    styles = []
    for preset in PRESET_STYLES:
        filepath = settings.PRESETS_DIR / preset["file"]
        styles.append({
            "id": preset["id"],
            "name": preset["name"],
            "artist": preset["artist"],
            "image_url": f"/api/presets/styles/{preset['id']}/image",
            "available": filepath.exists(),
        })
    return {"styles": styles}


@router.get("/styles/{style_id}/image")
async def get_preset_image(style_id: str):
    """Serve a preset style image file."""
    preset = next((p for p in PRESET_STYLES if p["id"] == style_id), None)
    if not preset:
        raise HTTPException(status_code=404, detail="프리셋 스타일을 찾을 수 없습니다.")

    filepath = settings.PRESETS_DIR / preset["file"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="프리셋 이미지 파일이 없습니다.")

    return FileResponse(filepath, media_type="image/jpeg")
