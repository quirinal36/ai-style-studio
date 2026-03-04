import { useRef, useState, useCallback } from 'react';

export default function useWebcam({ width = 320, height = 240 } = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setActive] = useState(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch (err) {
      console.error('Webcam access error:', err);
      throw err;
    }
  }, [width, height]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isActive) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, width, height);
    // Return base64 JPEG without the data URL prefix
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
    return dataUrl.split(',')[1];
  }, [isActive, width, height]);

  return { videoRef, isActive, start, stop, captureFrame };
}
