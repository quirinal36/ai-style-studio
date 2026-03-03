"""Style transfer API endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/gatys")
async def gatys_transfer():
    """Gatys style transfer - to be implemented."""
    return {"message": "Not implemented yet"}


@router.get("/gatys/{task_id}/status")
async def gatys_status(task_id: str):
    """Get Gatys transfer status via SSE - to be implemented."""
    return {"message": "Not implemented yet"}


@router.post("/gatys/{task_id}/cancel")
async def gatys_cancel(task_id: str):
    """Cancel Gatys transfer - to be implemented."""
    return {"message": "Not implemented yet"}


@router.post("/fast")
async def fast_transfer():
    """Fast style transfer - to be implemented."""
    return {"message": "Not implemented yet"}


@router.get("/models")
async def list_models():
    """List available pre-trained models - to be implemented."""
    return {"message": "Not implemented yet"}
