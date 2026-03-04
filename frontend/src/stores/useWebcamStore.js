import { create } from 'zustand';

const useWebcamStore = create((set) => ({
  isActive: false,
  currentModel: 'starry_night',
  fps: 0,
  processingTime: 0,

  setActive: (active) => set({ isActive: active }),
  setModel: (model) => set({ currentModel: model }),
  setStats: (fps, processingTime) => set({ fps, processingTime }),
}));

export default useWebcamStore;
