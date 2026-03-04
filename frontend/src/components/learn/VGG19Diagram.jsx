import { useState } from 'react';

const LAYERS = [
  { name: 'conv1_1', channels: 64, type: 'style', desc: '가장자리, 색상 등 저수준 특징 감지' },
  { name: 'conv2_1', channels: 128, type: 'style', desc: '텍스처, 패턴 등 중저수준 특징' },
  { name: 'conv3_1', channels: 256, type: 'style', desc: '반복 패턴, 복잡한 텍스처' },
  { name: 'conv4_1', channels: 512, type: 'style', desc: '고수준 텍스처와 스타일 패턴' },
  { name: 'conv4_2', channels: 512, type: 'content', desc: '콘텐츠 표현 레이어 - 객체 구조 보존' },
  { name: 'conv5_1', channels: 512, type: 'style', desc: '가장 추상적인 스타일 특징' },
];

export default function VGG19Diagram() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">VGG19 레이어 구조</h3>
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-4">
        <div className="px-3 py-4 bg-gray-100 rounded-lg text-center text-xs text-gray-600 shrink-0">
          Input<br/>Image
        </div>
        {LAYERS.map((layer, i) => (
          <div key={layer.name} className="flex items-center gap-2 shrink-0">
            <div className="text-gray-300 text-lg">&rarr;</div>
            <button
              onClick={() => setSelected(selected === layer.name ? null : layer.name)}
              className={`px-3 py-4 rounded-lg text-center text-xs transition-all cursor-pointer border-2 ${
                layer.type === 'content'
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-purple-50 border-purple-300 text-purple-700'
              } ${selected === layer.name ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
            >
              <div className="font-bold">{layer.name}</div>
              <div className="mt-1 text-[10px] opacity-70">{layer.channels}ch</div>
              <div className={`mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                layer.type === 'content' ? 'bg-blue-200' : 'bg-purple-200'
              }`}>
                {layer.type === 'content' ? 'Content' : 'Style'}
              </div>
            </button>
          </div>
        ))}
        <div className="text-gray-300 text-lg">&rarr;</div>
        <div className="px-3 py-4 bg-gray-100 rounded-lg text-center text-xs text-gray-600 shrink-0">
          Output
        </div>
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-800">
            {selected} ({LAYERS.find(l => l.name === selected)?.type === 'content' ? 'Content Layer' : 'Style Layer'})
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {LAYERS.find(l => l.name === selected)?.desc}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            채널 수: {LAYERS.find(l => l.name === selected)?.channels}
          </p>
        </div>
      )}

      <div className="flex gap-4 mt-4 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-200 inline-block" /> Style Layer
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Content Layer
        </span>
      </div>
    </div>
  );
}
