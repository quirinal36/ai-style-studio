import { Trash2 } from 'lucide-react';

export default function GalleryCard({ item, onClick, onDelete }) {
  return (
    <div
      className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <img
        src={item.result_url}
        alt="Gallery item"
        className="w-full h-40 object-cover"
      />
      <div className="p-2">
        <div className="text-xs text-gray-500">{item.created_at}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {item.style_type === 'gatys' ? 'Gatys' : 'Fast'} Style
          {item.student_name && ` · ${item.student_name}`}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
