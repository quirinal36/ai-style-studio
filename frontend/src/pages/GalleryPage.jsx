import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import useGalleryStore from '../stores/useGalleryStore';
import { getGallery, deleteGalleryItem } from '../api/gallery';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryModal from '../components/gallery/GalleryModal';

export default function GalleryPage() {
  const { items, total, loading, selectedItem, setItems, setLoading, setSelectedItem } = useGalleryStore();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort: 'latest' };
      if (filter !== 'all') params.style_type = filter;
      const data = await getGallery(params);
      setItems(data.items, data.total);
    } catch {
      setItems([], 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!confirm('이 작품을 삭제하시겠습니까?')) return;
    try {
      await deleteGalleryItem(id);
      fetchGallery();
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">갤러리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개의 작품</p>
        </div>
        <div className="flex gap-2">
          {['all', 'gatys', 'fast'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'gatys' ? 'Gatys' : 'Fast'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <GalleryGrid
          items={items}
          onSelect={(item) => setSelectedItem(item)}
          onDelete={handleDelete}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}

      <GalleryModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
