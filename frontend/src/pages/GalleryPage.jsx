import { Images } from 'lucide-react';

export default function GalleryPage() {
  return (
    <div className="text-center py-20">
      <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">갤러리</h1>
      <p className="text-gray-500">M5 마일스톤에서 구현 예정</p>
    </div>
  );
}
