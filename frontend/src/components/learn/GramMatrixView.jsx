import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { getGramMatrix } from '../../api/learn';

const LAYERS = ['conv1_1', 'conv2_1', 'conv3_1', 'conv4_1', 'conv5_1'];

export default function GramMatrixView() {
  const [layer, setLayer] = useState('conv1_1');
  const [image, setImage] = useState(null);
  const [gramImage, setGramImage] = useState(null);
  const [shape, setShape] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (files) => {
    if (files.length > 0) {
      setImage(files[0]);
      setGramImage(null);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  });

  const handleCompute = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('layer', layer);
    try {
      const data = await getGramMatrix(formData);
      setGramImage(data.image);
      setShape(data.shape);
    } catch {
      setGramImage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">Gram Matrix 시각화</h3>

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
          onClick={handleCompute}
          disabled={!image || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '계산'}
        </button>
      </div>

      {gramImage && (
        <div className="flex flex-col items-center gap-2">
          <img
            src={`data:image/png;base64,${gramImage}`}
            alt="Gram Matrix"
            className="max-w-xs rounded border border-gray-200"
          />
          {shape && (
            <p className="text-xs text-gray-500">
              Gram Matrix Shape: [{shape.join(' x ')}]
            </p>
          )}
        </div>
      )}
    </div>
  );
}
