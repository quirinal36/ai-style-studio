"""Preset style images API endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/styles")
async def list_preset_styles():
    """List preset style images - to be implemented."""
    return {"styles": []}


@router.get("/styles/{style_id}/image")
async def get_preset_image(style_id: str):
    """Get preset style image file - to be implemented."""
    return {"message": "Not implemented yet"}
