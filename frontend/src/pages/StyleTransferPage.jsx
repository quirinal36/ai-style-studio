import useStyleStore from '../stores/useStyleStore';
import useSSE from '../hooks/useSSE';
import ImageUploader from '../components/style-transfer/ImageUploader';
import ParameterPanel from '../components/style-transfer/ParameterPanel';
import ProgressBar from '../components/style-transfer/ProgressBar';
import ResultViewer from '../components/style-transfer/ResultViewer';
import StylePresets from '../components/style-transfer/StylePresets';
import { Play, Square } from 'lucide-react';

export default function StyleTransferPage() {
  const contentPreview = useStyleStore((s) => s.contentPreview);
  const stylePreview = useStyleStore((s) => s.stylePreview);
  const setContentImage = useStyleStore((s) => s.setContentImage);
  const setStyleImage = useStyleStore((s) => s.setStyleImage);
  const setStylePresetUrl = useStyleStore((s) => s.setStylePresetUrl);
  const isProcessing = useStyleStore((s) => s.isProcessing);
  const taskId = useStyleStore((s) => s.taskId);
  const startTransfer = useStyleStore((s) => s.startTransfer);
  const cancelTransfer = useStyleStore((s) => s.cancelTransfer);
  const error = useStyleStore((s) => s.error);

  // Connect SSE when taskId is available
  useSSE(taskId);

  const canStart = contentPreview && stylePreview && !isProcessing;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gatys Style Transfer</h1>
        <p className="text-sm text-gray-500 mt-1">
          VGG19 기반 최적화 방식으로 콘텐츠와 스타일을 합성합니다
        </p>
      </div>

      {/* Image Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploader
          label="콘텐츠 이미지"
          preview={contentPreview}
          onSelect={setContentImage}
          onClear={() => setContentImage(null)}
        />
        <div className="space-y-2">
          <ImageUploader
            label="스타일 이미지"
            preview={stylePreview}
            onSelect={setStyleImage}
            onClear={() => setStyleImage(null)}
          />
          <StylePresets onSelect={setStylePresetUrl} />
        </div>
      </div>

      {/* Parameters */}
      <ParameterPanel />

      {/* Action Button */}
      <div className="flex justify-center gap-3">
        {isProcessing ? (
          <button
            onClick={cancelTransfer}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Square className="w-5 h-5" />
            변환 취소
          </button>
        ) : (
          <button
            onClick={startTransfer}
            disabled={!canStart}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-5 h-5" />
            변환 시작
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress */}
      <ProgressBar />

      {/* Result */}
      <ResultViewer />
    </div>
  );
}
