"""Gallery API endpoints with JSON file-based storage."""

import json
import time
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from config import settings

router = APIRouter()


def _load_gallery() -> list[dict]:
    """Load gallery data from JSON file."""
    if not settings.GALLERY_FILE.exists():
        return []
    try:
        return json.loads(settings.GALLERY_FILE.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, IOError):
        return []


def _save_gallery(items: list[dict]):
    """Save gallery data to JSON file."""
    settings.GALLERY_FILE.write_text(
        json.dumps(items, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )


def add_gallery_item(
    content_url: str,
    style_url: str,
    result_url: str,
    params: dict,
    student_name: str = "",
    style_type: str = "gatys",
) -> int:
    """Add a new item to the gallery. Returns the item ID."""
    items = _load_gallery()
    new_id = max((item["id"] for item in items), default=0) + 1
    items.append({
        "id": new_id,
        "content_url": content_url,
        "style_url": style_url,
        "result_url": result_url,
        "params": params,
        "student_name": student_name,
        "style_type": style_type,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    })
    _save_gallery(items)
    return new_id


@router.get("")
async def list_gallery(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="latest"),
    style_type: Optional[str] = Query(default=None),
):
    """List gallery items with pagination, sorting, and filtering."""
    items = _load_gallery()

    # Filter
    if style_type:
        items = [i for i in items if i.get("style_type") == style_type]

    # Sort
    if sort == "latest":
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page

    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{gallery_id}")
async def get_gallery_item(gallery_id: int):
    """Get a single gallery item by ID."""
    items = _load_gallery()
    for item in items:
        if item["id"] == gallery_id:
            return item
    raise HTTPException(status_code=404, detail="갤러리 항목을 찾을 수 없습니다.")


@router.delete("/{gallery_id}")
async def delete_gallery_item(gallery_id: int):
    """Delete a gallery item by ID."""
    items = _load_gallery()
    new_items = [i for i in items if i["id"] != gallery_id]
    if len(new_items) == len(items):
        raise HTTPException(status_code=404, detail="갤러리 항목을 찾을 수 없습니다.")
    _save_gallery(new_items)
    return {"message": "삭제되었습니다.", "id": gallery_id}
