"""WebSocket webcam real-time style transfer endpoint."""

import base64
import time

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings
from services.fast_transfer import FastStyleTransfer

router = APIRouter()


def decode_base64_frame(data: str) -> np.ndarray:
    """Decode base64 JPEG string to BGR numpy array."""
    img_bytes = base64.b64decode(data)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return frame


def encode_frame_base64(frame: np.ndarray) -> str:
    """Encode BGR numpy array to base64 JPEG string."""
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return base64.b64encode(buffer).decode('utf-8')


@router.websocket("/ws/webcam")
async def webcam_endpoint(websocket: WebSocket):
    """Real-time webcam style transfer via WebSocket."""
    await websocket.accept()

    fast_transfer = FastStyleTransfer(settings.MODELS_DIR)
    current_model = "starry_night"
    frame_count = 0
    fps_start = time.time()
    current_fps = 0.0

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "change_model":
                current_model = data.get("model", current_model)
                continue

            if data.get("type") == "frame":
                frame_data = data.get("data", "")
                model = data.get("model", current_model)
                if model != current_model:
                    current_model = model

                frame = decode_base64_frame(frame_data)
                if frame is None:
                    continue

                start = time.time()
                try:
                    result = fast_transfer.transform_frame(frame, current_model)
                except FileNotFoundError:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"모델 '{current_model}'을 찾을 수 없습니다.",
                    })
                    continue

                elapsed_ms = (time.time() - start) * 1000

                # Calculate FPS
                frame_count += 1
                elapsed_total = time.time() - fps_start
                if elapsed_total >= 1.0:
                    current_fps = frame_count / elapsed_total
                    frame_count = 0
                    fps_start = time.time()

                result_b64 = encode_frame_base64(result)

                await websocket.send_json({
                    "type": "styled_frame",
                    "data": result_b64,
                    "fps": round(current_fps, 1),
                    "processing_time_ms": round(elapsed_ms, 1),
                })

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()
