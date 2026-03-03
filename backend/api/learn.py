"""Learning dashboard API endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/feature-maps")
async def extract_feature_maps():
    """Extract VGG19 feature maps - to be implemented."""
    return {"message": "Not implemented yet"}


@router.post("/gram-matrix")
async def compute_gram_matrix():
    """Compute and visualize Gram matrix - to be implemented."""
    return {"message": "Not implemented yet"}


@router.get("/vgg19-info")
async def vgg19_info():
    """Get VGG19 model structure info - to be implemented."""
    return {"message": "Not implemented yet"}
