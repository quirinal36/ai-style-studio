import useStyleStore from '../../stores/useStyleStore';

const SIZE_OPTIONS = [200, 300, 400];

export default function ParameterPanel() {
  const params = useStyleStore((s) => s.params);
  const setParams = useStyleStore((s) => s.setParams);
  const isProcessing = useStyleStore((s) => s.isProcessing);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">파라미터 설정</h3>

      <div>
        <label className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Content Weight (α)</span>
          <span className="font-mono">{params.contentWeight}</span>
        </label>
        <input
          type="range"
          min="0.1" max="100" step="0.1"
          value={params.contentWeight}
          onChange={(e) => setParams({ contentWeight: parseFloat(e.target.value) })}
          disabled={isProcessing}
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <label className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Style Weight (β)</span>
          <span className="font-mono">{params.styleWeight.toExponential(0)}</span>
        </label>
        <input
          type="range"
          min="4" max="8" step="0.1"
          value={Math.log10(params.styleWeight)}
          onChange={(e) => setParams({ styleWeight: Math.pow(10, parseFloat(e.target.value)) })}
          disabled={isProcessing}
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <label className="flex justify-between text-xs text-gray-600 mb-1">
          <span>반복 횟수 (Steps)</span>
          <span className="font-mono">{params.numSteps}</span>
        </label>
        <input
          type="range"
          min="50" max="500" step="10"
          value={params.numSteps}
          onChange={(e) => setParams({ numSteps: parseInt(e.target.value) })}
          disabled={isProcessing}
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">이미지 크기</label>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => setParams({ maxSize: size })}
              disabled={isProcessing}
              className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                params.maxSize === size
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex justify-between text-xs text-gray-600 mb-1">
          <span>학습률 (Learning Rate)</span>
          <span className="font-mono">{params.learningRate}</span>
        </label>
        <input
          type="range"
          min="0.001" max="0.1" step="0.001"
          value={params.learningRate}
          onChange={(e) => setParams({ learningRate: parseFloat(e.target.value) })}
          disabled={isProcessing}
          className="w-full accent-indigo-600"
        />
      </div>
    </div>
  );
}
