import { Link, useLocation } from 'react-router-dom';
import { Monitor, FileText, Settings, Shield } from 'lucide-react';

const nav = [
  { to: '/monitor', icon: Monitor, label: 'Monitor' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex flex-col items-center w-12 bg-gray-900 py-3 gap-1 shrink-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 mb-4">
        <Shield className="w-4 h-4 text-white" />
      </div>

      {nav.map(({ to, icon: Icon, label }) => {
        const active = pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            title={label}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              active
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
          </Link>
        );
      })}
    </aside>
  );
}
