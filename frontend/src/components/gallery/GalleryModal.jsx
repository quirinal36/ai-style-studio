import { X, Download } from 'lucide-react';
import { downloadImage } from '../../utils/imageUtils';

export default function GalleryModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">작품 상세</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Images */}
          <div className="grid grid-cols-3 gap-3">
            {item.content_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">원본</p>
                <img src={item.content_url} alt="Content" className="w-full rounded border border-gray-200 object-contain h-36" />
              </div>
            )}
            {item.style_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">스타일</p>
                <img src={item.style_url} alt="Style" className="w-full rounded border border-gray-200 object-contain h-36" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">결과</p>
              <img src={item.result_url} alt="Result" className="w-full rounded border border-gray-200 object-contain h-36" />
            </div>
          </div>

          {/* Params */}
          {item.params && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">파라미터</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                {Object.entries(item.params).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-gray-400">{key}:</span> {String(val)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{item.created_at} {item.student_name && `· ${item.student_name}`}</span>
            <button
              onClick={() => downloadImage(item.result_url, `gallery-${item.id}.png`)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Download className="w-3.5 h-3.5" /> 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
