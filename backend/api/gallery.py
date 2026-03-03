"""Gallery API endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_gallery():
    """List gallery items - to be implemented."""
    return {"items": [], "total": 0}


@router.get("/{gallery_id}")
async def get_gallery_item(gallery_id: int):
    """Get gallery item detail - to be implemented."""
    return {"message": "Not implemented yet"}


@router.delete("/{gallery_id}")
async def delete_gallery_item(gallery_id: int):
    """Delete gallery item - to be implemented."""
    return {"message": "Not implemented yet"}
