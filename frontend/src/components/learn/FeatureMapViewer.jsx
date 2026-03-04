import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { getFeatureMaps } from '../../api/learn';

const LAYERS = ['conv1_1', 'conv2_1', 'conv3_1', 'conv4_1', 'conv4_2', 'conv5_1'];

export default function FeatureMapViewer() {
  const [layer, setLayer] = useState('conv1_1');
  const [image, setImage] = useState(null);
  const [channels, setChannels] = useState([]);
  const [shape, setShape] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (files) => {
    if (files.length > 0) {
      setImage(files[0]);
      setChannels([]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  });

  const handleExtract = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('layer', layer);
    try {
      const data = await getFeatureMaps(formData);
      setChannels(data.channels || []);
      setShape(data.shape || null);
    } catch {
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">특징 맵 시각화</h3>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <input {...getInputProps()} />
            {image ? (
              <span className="text-sm text-gray-700">{image.name}</span>
            ) : (
              <span className="text-sm text-gray-400 flex items-center justify-center gap-1">
                <Upload className="w-4 h-4" /> 이미지 업로드
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">레이어</label>
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {LAYERS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExtract}
          disabled={!image || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '추출'}
        </button>
      </div>

      {shape && (
        <p className="text-xs text-gray-500">
          레이어: {layer} | Shape: [{shape.join(', ')}]
        </p>
      )}

      {channels.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {channels.map((ch) => (
            <div key={ch.channel} className="text-center">
              <img
                src={`data:image/png;base64,${ch.image}`}
                alt={`Channel ${ch.channel}`}
                className="w-full rounded border border-gray-200"
              />
              <span className="text-[10px] text-gray-400">Ch {ch.channel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
