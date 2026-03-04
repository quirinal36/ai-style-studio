import { create } from 'zustand';

const useGalleryStore = create((set) => ({
  items: [],
  total: 0,
  loading: false,
  selectedItem: null,

  setItems: (items, total) => set({ items, total }),
  setLoading: (loading) => set({ loading }),
  setSelectedItem: (item) => set({ selectedItem: item }),
}));

export default useGalleryStore;
