import { useRef, useState, useCallback, useEffect } from 'react';

export default function useWebSocket(url) {
  const wsRef = useRef(null);
  const [isConnected, setConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const onMessageRef = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url || `${protocol}//${window.location.host}/ws/webcam`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'styled_frame') {
        setFps(data.fps || 0);
        onMessageRef.current?.(data);
      }
    };
  }, [url]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const sendFrame = useCallback((base64Data, model) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        data: base64Data,
        model,
      }));
    }
  }, []);

  const changeModel = useCallback((model) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'change_model',
        model,
      }));
    }
  }, []);

  const setOnMessage = useCallback((handler) => {
    onMessageRef.current = handler;
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { isConnected, fps, connect, disconnect, sendFrame, changeModel, setOnMessage };
}
