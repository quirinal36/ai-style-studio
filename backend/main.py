"""FastAPI application entry point for AI Style Studio."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from api.router import api_router

app = FastAPI(
    title="AI Style Studio",
    description="Neural Style Transfer 학습 및 체험 플랫폼 API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Static file serving for results/previews
app.mount("/api/results", StaticFiles(directory=settings.RESULTS_DIR), name="results")
app.mount("/api/previews", StaticFiles(directory=settings.PREVIEWS_DIR), name="previews")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
