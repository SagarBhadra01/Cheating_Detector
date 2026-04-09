import { Link, useLocation } from 'react-router-dom';
import { Monitor, FileText, Shield } from 'lucide-react';

const nav = [
  { to: '/monitor', icon: Monitor, label: 'Monitor' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  //{ to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex flex-col items-center w-12 bg-white border-r border-gray-200 py-3 gap-1 shrink-0">
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
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
          </Link>
        );
      })}
    </aside>
  );
}
