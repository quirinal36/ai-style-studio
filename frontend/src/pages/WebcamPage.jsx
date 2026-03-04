import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Camera, Pause, Square, Play } from 'lucide-react';
import useWebcam from '../hooks/useWebcam';
import useWebSocket from '../hooks/useWebSocket';
import { downloadImage } from '../utils/imageUtils';

const STYLE_MODELS = [
  { key: 'starry_night', label: 'Starry Night', shortcut: '1' },
  { key: 'the_scream', label: 'The Scream', shortcut: '2' },
  { key: 'mosaic', label: 'Mosaic', shortcut: '3' },
  { key: 'candy', label: 'Candy', shortcut: '4' },
  { key: 'udnie', label: 'Udnie', shortcut: '5' },
  { key: 'rain_princess', label: 'Rain Princess', shortcut: '6' },
];

export default function WebcamPage() {
  const { videoRef, isActive, start, stop, captureFrame } = useWebcam({ width: 320, height: 240 });
  const { isConnected, fps, connect, disconnect, sendFrame, changeModel, setOnMessage } = useWebSocket();

  const [currentModel, setCurrentModel] = useState('starry_night');
  const [processingTime, setProcessingTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const styledCanvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Handle received styled frames
  useEffect(() => {
    setOnMessage((data) => {
      setProcessingTime(data.processing_time_ms || 0);
      // Draw styled frame to canvas
      if (styledCanvasRef.current && data.data) {
        const img = new Image();
        img.onload = () => {
          const ctx = styledCanvasRef.current.getContext('2d');
          styledCanvasRef.current.width = img.width;
          styledCanvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = `data:image/jpeg;base64,${data.data}`;
      }
    });
  }, [setOnMessage]);

  // Capture and send frames
  useEffect(() => {
    if (isActive && isConnected && !paused) {
      intervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) sendFrame(frame, currentModel);
      }, 100); // ~10 fps capture rate
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, isConnected, paused, captureFrame, sendFrame, currentModel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < STYLE_MODELS.length) {
        const model = STYLE_MODELS[idx].key;
        setCurrentModel(model);
        changeModel(model);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changeModel]);

  const handleStart = async () => {
    try {
      await start();
      connect();
    } catch {
      alert('웹캠 접근 권한을 허용해주세요.');
    }
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    stop();
    disconnect();
  };

  const handleSnapshot = () => {
    if (styledCanvasRef.current) {
      const url = styledCanvasRef.current.toDataURL('image/png');
      downloadImage(url, `webcam-snapshot-${Date.now()}.png`);
    }
  };

  const handleModelChange = useCallback((model) => {
    setCurrentModel(model);
    changeModel(model);
  }, [changeModel]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">웹캠 실시간 변환</h1>
        <p className="text-sm text-gray-500 mt-1">
          웹캠 영상에 실시간으로 스타일을 적용합니다
        </p>
      </div>

      {/* Video Displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Video className="w-4 h-4" /> 원본 웹캠
          </p>
          <div className="bg-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
            />
            {!isActive && (
              <div className="absolute text-gray-400 text-sm">웹캠을 시작하세요</div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Camera className="w-4 h-4" /> 스타일 적용
          </p>
          <div className="bg-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
            <canvas ref={styledCanvasRef} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {isActive && (
        <div className="flex gap-4 justify-center text-sm text-gray-600">
          <span>FPS: <strong>{fps}</strong></span>
          <span>처리시간: <strong>{processingTime}ms</strong></span>
          <span>해상도: <strong>320x240</strong></span>
        </div>
      )}

      {/* Style Selection */}
      <div>
        <span className="text-sm font-medium text-gray-700 mb-2 block">
          스타일 선택 (키보드 1~6)
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STYLE_MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModelChange(m.key)}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                currentModel === m.key
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-xs text-gray-400">({m.shortcut})</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Play className="w-5 h-5" /> 시작
          </button>
        ) : (
          <>
            <button
              onClick={handleSnapshot}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Camera className="w-4 h-4" /> 스냅샷
            </button>
            <button
              onClick={() => setPaused(!paused)}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? '재개' : '일시정지'}
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" /> 정지
            </button>
          </>
        )}
      </div>
    </div>
  );
}
