import { create } from 'zustand';
import { startGatysTransfer, cancelGatysTransfer } from '../api/styleTransfer';

const useStyleStore = create((set, get) => ({
  contentImage: null,
  contentPreview: null,
  styleImage: null,
  stylePreview: null,
  resultImage: null,

  params: {
    contentWeight: 1,
    styleWeight: 1e6,
    numSteps: 300,
    maxSize: 400,
    learningRate: 0.01,
  },

  taskId: null,
  isProcessing: false,
  progress: { step: 0, totalSteps: 0, contentLoss: 0, styleLoss: 0, totalLoss: 0 },
  previews: [],
  lossHistory: [],
  error: null,

  setContentImage: (file) => {
    const preview = file ? URL.createObjectURL(file) : null;
    set({ contentImage: file, contentPreview: preview, resultImage: null, error: null });
  },

  setStyleImage: (file) => {
    const preview = file ? URL.createObjectURL(file) : null;
    set({ styleImage: file, stylePreview: preview, stylePresetUrl: null, resultImage: null, error: null });
  },

  setStylePresetUrl: (url) => {
    set({ styleImage: null, stylePreview: url, stylePresetUrl: url, resultImage: null, error: null });
  },

  setParams: (updates) =>
    set((s) => ({ params: { ...s.params, ...updates } })),

  updateProgress: (data) =>
    set((s) => ({
      progress: {
        step: data.step,
        totalSteps: data.total_steps,
        contentLoss: data.content_loss,
        styleLoss: data.style_loss,
        totalLoss: data.total_loss,
      },
      previews: data.preview_url
        ? [...s.previews, data.preview_url]
        : s.previews,
      lossHistory: [
        ...s.lossHistory,
        {
          step: data.step,
          contentLoss: data.content_loss,
          styleLoss: data.style_loss,
          totalLoss: data.total_loss,
        },
      ],
    })),

  startTransfer: async () => {
    const { contentImage, styleImage, stylePresetUrl, params } = get();
    if (!contentImage || (!styleImage && !stylePresetUrl)) return;

    set({ isProcessing: true, error: null, previews: [], lossHistory: [], resultImage: null });

    let styleFile = styleImage;
    if (!styleFile && stylePresetUrl) {
      try {
        const resp = await fetch(stylePresetUrl);
        const blob = await resp.blob();
        styleFile = new File([blob], 'preset_style.jpg', { type: blob.type });
      } catch {
        set({ isProcessing: false, error: '프리셋 이미지를 불러오지 못했습니다.' });
        return;
      }
    }

    const formData = new FormData();
    formData.append('content_image', contentImage);
    formData.append('style_image', styleFile);
    formData.append('content_weight', params.contentWeight);
    formData.append('style_weight', params.styleWeight);
    formData.append('num_steps', params.numSteps);
    formData.append('max_size', params.maxSize);
    formData.append('learning_rate', params.learningRate);

    try {
      const { task_id } = await startGatysTransfer(formData);
      set({ taskId: task_id });
    } catch (err) {
      set({
        isProcessing: false,
        error: err.response?.data?.detail || '변환 시작에 실패했습니다.',
      });
    }
  },

  cancelTransfer: async () => {
    const { taskId } = get();
    if (!taskId) return;
    try {
      await cancelGatysTransfer(taskId);
    } catch {
      // ignore
    }
    set({ isProcessing: false, taskId: null });
  },

  setResult: (url) => set({ resultImage: url, isProcessing: false, taskId: null }),
  setError: (msg) => set({ error: msg, isProcessing: false, taskId: null }),

  reset: () =>
    set({
      contentImage: null, contentPreview: null,
      styleImage: null, stylePreview: null,
      resultImage: null, taskId: null, isProcessing: false,
      progress: { step: 0, totalSteps: 0, contentLoss: 0, styleLoss: 0, totalLoss: 0 },
      previews: [], lossHistory: [], error: null,
    }),
}));

export default useStyleStore;
