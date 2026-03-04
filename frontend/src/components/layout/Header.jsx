import { NavLink } from 'react-router-dom';
import { Palette, Video, BookOpen, Images, Zap } from 'lucide-react';

const navItems = [
  { to: '/style-transfer', label: '스타일 변환', icon: Palette },
  { to: '/fast-style', label: 'Fast 변환', icon: Zap },
  { to: '/webcam', label: '실시간', icon: Video },
  { to: '/learn', label: '학습', icon: BookOpen },
  { to: '/gallery', label: '갤러리', icon: Images },
];

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <Palette className="w-6 h-6" />
          AI Style Studio
        </NavLink>

        <nav className="flex gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
