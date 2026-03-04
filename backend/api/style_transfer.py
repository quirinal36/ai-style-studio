"""Style transfer API endpoints."""

import asyncio
import json
import time

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse

from config import settings
from services.image_processor import (
    validate_image_file,
    load_image,
    save_image,
    tensor_to_image,
)
from services.gatys_transfer import GatysStyleTransfer, TransferParams, ProgressInfo
from services.task_manager import task_manager, TaskStatus

router = APIRouter()

# Shared Gatys service instance (loads VGG19 once)
_gatys_service: GatysStyleTransfer | None = None


def get_gatys_service() -> GatysStyleTransfer:
    global _gatys_service
    if _gatys_service is None:
        _gatys_service = GatysStyleTransfer(device=settings.DEVICE)
    return _gatys_service


@router.post("/gatys")
async def gatys_transfer(
    content_image: UploadFile = File(...),
    style_image: UploadFile = File(...),
    content_weight: float = Form(default=1.0),
    style_weight: float = Form(default=1e6),
    num_steps: int = Form(default=300),
    max_size: int = Form(default=400),
    learning_rate: float = Form(default=0.01),
    student_name: str = Form(default=""),
):
    """Start a Gatys style transfer task."""
    # Validate content image
    content_bytes = await content_image.read()
    err = validate_image_file(content_image.content_type, len(content_bytes))
    if err:
        raise HTTPException(status_code=400, detail=err)

    # Validate style image
    style_bytes = await style_image.read()
    err = validate_image_file(style_image.content_type, len(style_bytes))
    if err:
        raise HTTPException(status_code=400, detail=err)

    # Clamp parameters
    max_size = min(max_size, settings.MAX_IMAGE_SIZE)
    num_steps = max(10, min(num_steps, 500))

    # Create task
    try:
        task_id = await task_manager.create_task()
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))

    # Load images
    content_img = load_image(content_bytes, max_size=max_size)
    style_img = load_image(style_bytes, max_size=max_size)

    params = TransferParams(
        content_weight=content_weight,
        style_weight=style_weight,
        num_steps=num_steps,
        max_size=max_size,
        learning_rate=learning_rate,
    )

    # Run in background
    task_info = task_manager.get_task(task_id)

    async def run_transfer():
        await task_manager.start_task(task_id)
        try:
            service = get_gatys_service()

            async def on_progress(info: ProgressInfo):
                progress_data = {
                    "step": info.step,
                    "total_steps": info.total_steps,
                    "content_loss": round(info.content_loss, 4),
                    "style_loss": round(info.style_loss, 6),
                    "total_loss": round(info.total_loss, 4),
                }
                # Save preview if available
                if info.preview_image:
                    preview_name = save_image(
                        info.preview_image, settings.PREVIEWS_DIR,
                        prefix=f"{task_id}_step{info.step}_",
                    )
                    progress_data["preview_url"] = f"/api/previews/{preview_name}"

                await task_manager.update_progress(task_id, progress_data)

            result_image = await service.run(
                content_img, style_img, params,
                callback=on_progress,
                cancel_event=task_info.cancel_event,
            )

            # Save final result
            result_name = save_image(result_image, settings.RESULTS_DIR, prefix=f"{task_id}_")
            elapsed = time.time() - task_info.started_at

            await task_manager.complete_task(task_id, {
                "result_url": f"/api/results/{result_name}",
                "elapsed_seconds": round(elapsed, 1),
            })

        except Exception as e:
            await task_manager.fail_task(task_id, str(e))

    asyncio.create_task(run_transfer())

    return {
        "task_id": task_id,
        "status": "processing",
        "message": "스타일 변환이 시작되었습니다.",
    }


@router.get("/gatys/{task_id}/status")
async def gatys_status(task_id: str):
    """Stream task progress via Server-Sent Events."""
    try:
        task_manager.get_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_stream():
        last_step = -1
        while True:
            try:
                task = task_manager.get_task(task_id)
            except KeyError:
                break

            # Send progress updates
            if task.progress and task.progress.get("step", 0) != last_step:
                last_step = task.progress.get("step", 0)
                yield f"event: progress\ndata: {json.dumps(task.progress)}\n\n"

            # Send completion
            if task.status == TaskStatus.COMPLETED:
                yield f"event: complete\ndata: {json.dumps(task.result)}\n\n"
                break

            # Send error
            if task.status == TaskStatus.ERROR:
                yield f"event: error\ndata: {json.dumps({'message': task.error})}\n\n"
                break

            # Send cancellation
            if task.status == TaskStatus.CANCELLED:
                yield f"event: cancelled\ndata: {json.dumps({'message': '변환이 취소되었습니다.'})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/gatys/{task_id}/cancel")
async def gatys_cancel(task_id: str):
    """Cancel a running Gatys transfer task."""
    try:
        cancelled = await task_manager.cancel_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")

    if not cancelled:
        raise HTTPException(status_code=400, detail="태스크가 실행 중이 아닙니다.")

    return {"message": "변환이 취소되었습니다.", "task_id": task_id}


@router.post("/fast")
async def fast_transfer(
    image: UploadFile = File(...),
    model_name: str = Form(...),
):
    """Apply Fast Style Transfer to an uploaded image."""
    image_bytes = await image.read()
    err = validate_image_file(image.content_type, len(image_bytes))
    if err:
        raise HTTPException(status_code=400, detail=err)

    from services.fast_transfer import FastStyleTransfer
    import cv2
    import numpy as np
    import time as _time

    service = FastStyleTransfer(settings.MODELS_DIR)

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다.")

    # Resize if too large
    h, w = img.shape[:2]
    max_dim = settings.MAX_IMAGE_SIZE
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    try:
        start = _time.time()
        result = service.transform_image(img, model_name)
        elapsed_ms = (_time.time() - start) * 1000
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save result
    import uuid
    filename = f"fast_{uuid.uuid4().hex[:12]}.jpg"
    filepath = settings.RESULTS_DIR / filename
    cv2.imwrite(str(filepath), result)

    return {
        "result_url": f"/api/results/{filename}",
        "processing_time_ms": round(elapsed_ms, 1),
        "model_used": model_name,
    }


@router.get("/models")
async def list_models():
    """List available pre-trained style transfer models."""
    from services.fast_transfer import FastStyleTransfer

    service = FastStyleTransfer(settings.MODELS_DIR)
    return {"models": service.get_available_models()}
