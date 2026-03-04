import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getPresetStyles } from '../../api/presets';

export default function StylePresets({ onSelect }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPresetStyles()
      .then((data) => setPresets(data.styles))
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const available = presets.filter((p) => p.available);
  if (available.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">또는 프리셋 스타일 선택</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {available.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.image_url)}
            className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <img
              src={preset.image_url}
              alt={preset.name}
              className="w-full h-20 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
              <div className="w-full p-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                <div className="font-medium truncate">{preset.name}</div>
                <div className="text-white/70 truncate">{preset.artist}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
