import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Zap, Download, Loader2 } from 'lucide-react';
import { fastStyleTransfer, getModels } from '../api/styleTransfer';
import { downloadImage } from '../utils/imageUtils';

export default function FastStylePage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    getModels()
      .then((data) => {
        setModels(data.models || []);
        if (data.models?.length > 0) setSelectedModel(data.models[0].model_name);
      })
      .catch(() => setModels([]));
  }, []);

  const onDrop = (files) => {
    if (files.length > 0) {
      setImage(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
      setResultUrl(null);
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleTransfer = async () => {
    if (!image || !selectedModel) return;
    setProcessing(true);
    setError(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('model_name', selectedModel);

    try {
      const data = await fastStyleTransfer(formData);
      setResultUrl(data.result_url);
      setProcessingTime(data.processing_time_ms);
    } catch (err) {
      setError(err.response?.data?.detail || '변환에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fast Style Transfer</h1>
        <p className="text-sm text-gray-500 mt-1">
          사전학습된 모델로 즉시 스타일을 적용합니다 (1초 이내)
        </p>
      </div>

      {/* Image Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-sm font-medium text-gray-700 mb-2 block">입력 이미지</span>
          {imagePreview ? (
            <div className="relative group">
              <img src={imagePreview} alt="Input" className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-gray-100" />
              <button
                onClick={() => { setImage(null); setImagePreview(null); setResultUrl(null); }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">클릭 또는 드래그하여 업로드</p>
            </div>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700 mb-2 block">결과</span>
          {resultUrl ? (
            <img src={resultUrl} alt="Result" className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-gray-100" />
          ) : (
            <div className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-400">
                {processing ? '변환 중...' : '스타일을 선택하고 변환하세요'}
              </p>
            </div>
          )}
          {resultUrl && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">처리 시간: {processingTime}ms</span>
              <button
                onClick={() => downloadImage(resultUrl, 'fast-style-result.jpg')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Download className="w-3.5 h-3.5" /> 다운로드
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <span className="text-sm font-medium text-gray-700 mb-2 block">스타일 선택</span>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {models.map((m) => (
            <button
              key={m.model_name}
              onClick={() => setSelectedModel(m.model_name)}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                selectedModel === m.model_name
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-800">{m.display_name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>
            </button>
          ))}
          {models.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full text-center py-4">
              모델을 로드하는 중... (download_models.sh 실행 필요)
            </p>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-center">
        <button
          onClick={handleTransfer}
          disabled={!image || !selectedModel || processing}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {processing ? '변환 중...' : '스타일 적용'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
