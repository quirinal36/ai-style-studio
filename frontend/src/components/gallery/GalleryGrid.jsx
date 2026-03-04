import GalleryCard from './GalleryCard';

export default function GalleryGrid({ items, onSelect, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">아직 갤러리에 작품이 없습니다</p>
        <p className="text-sm mt-1">스타일 변환을 실행하면 자동으로 저장됩니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          item={item}
          onClick={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
}
