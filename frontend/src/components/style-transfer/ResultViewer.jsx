import useStyleStore from '../../stores/useStyleStore';
import { downloadImage } from '../../utils/imageUtils';
import { Download } from 'lucide-react';

export default function ResultViewer() {
  const contentPreview = useStyleStore((s) => s.contentPreview);
  const stylePreview = useStyleStore((s) => s.stylePreview);
  const resultImage = useStyleStore((s) => s.resultImage);
  const previews = useStyleStore((s) => s.previews);

  // Show latest preview during processing
  const displayResult = resultImage || (previews.length > 0 ? previews[previews.length - 1] : null);

  if (!contentPreview && !displayResult) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">결과</h3>

      <div className="grid grid-cols-3 gap-3">
        {contentPreview && (
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">원본</p>
            <img src={contentPreview} alt="Content" className="w-full h-40 object-contain rounded border border-gray-100 bg-gray-50" />
          </div>
        )}
        {stylePreview && (
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">스타일</p>
            <img src={stylePreview} alt="Style" className="w-full h-40 object-contain rounded border border-gray-100 bg-gray-50" />
          </div>
        )}
        {displayResult && (
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">
              {resultImage ? '결과' : '미리보기'}
            </p>
            <img src={displayResult} alt="Result" className="w-full h-40 object-contain rounded border border-gray-100 bg-gray-50" />
          </div>
        )}
      </div>

      {resultImage && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => downloadImage(resultImage, 'style-transfer-result.png')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PNG 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
