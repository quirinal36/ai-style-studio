import { useEffect, useRef } from 'react';
import useStyleStore from '../stores/useStyleStore';

export default function useSSE(taskId) {
  const eventSourceRef = useRef(null);
  const updateProgress = useStyleStore((s) => s.updateProgress);
  const setResult = useStyleStore((s) => s.setResult);
  const setError = useStyleStore((s) => s.setError);

  useEffect(() => {
    if (!taskId) return;

    const es = new EventSource(`/api/style-transfer/gatys/${taskId}/status`);
    eventSourceRef.current = es;

    es.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      updateProgress(data);
    });

    es.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      setResult(data.result_url);
      es.close();
    });

    es.addEventListener('error', (e) => {
      if (e.data) {
        const data = JSON.parse(e.data);
        setError(data.message);
      } else {
        setError('연결이 끊어졌습니다.');
      }
      es.close();
    });

    es.addEventListener('cancelled', () => {
      setError('변환이 취소되었습니다.');
      es.close();
    });

    return () => {
      es.close();
    };
  }, [taskId, updateProgress, setResult, setError]);

  return eventSourceRef;
}
