"""API router aggregation."""

from fastapi import APIRouter

from api.style_transfer import router as style_transfer_router
from api.gallery import router as gallery_router
from api.learn import router as learn_router
from api.presets import router as presets_router
from api.webcam import router as webcam_router

api_router = APIRouter()

api_router.include_router(style_transfer_router, prefix="/style-transfer", tags=["Style Transfer"])
api_router.include_router(gallery_router, prefix="/gallery", tags=["Gallery"])
api_router.include_router(learn_router, prefix="/learn", tags=["Learn"])
api_router.include_router(presets_router, prefix="/presets", tags=["Presets"])
api_router.include_router(webcam_router, tags=["Webcam"])
