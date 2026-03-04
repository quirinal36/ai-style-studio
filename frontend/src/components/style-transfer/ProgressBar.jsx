import useStyleStore from '../../stores/useStyleStore';
import { formatLoss } from '../../utils/formatUtils';

export default function ProgressBar() {
  const { step, totalSteps, contentLoss, styleLoss, totalLoss } = useStyleStore((s) => s.progress);
  const isProcessing = useStyleStore((s) => s.isProcessing);

  if (!isProcessing && step === 0) return null;

  const percent = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">진행 상태</h3>

      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Step: {step} / {totalSteps}</span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {step > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-md p-2">
            <div className="text-xs text-blue-600">Content Loss</div>
            <div className="text-sm font-mono font-medium text-blue-800">{formatLoss(contentLoss)}</div>
          </div>
          <div className="bg-purple-50 rounded-md p-2">
            <div className="text-xs text-purple-600">Style Loss</div>
            <div className="text-sm font-mono font-medium text-purple-800">{formatLoss(styleLoss)}</div>
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <div className="text-xs text-gray-600">Total Loss</div>
            <div className="text-sm font-mono font-medium text-gray-800">{formatLoss(totalLoss)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
