import { Link, useLocation } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { useSession } from '../../hooks/useSession';
import type { SessionStats } from '../../types';
import { Clock } from 'lucide-react';

interface TopbarProps {
  stats: SessionStats | null;
}

const tabs = [
  { to: '/monitor', label: 'Monitor' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export function Topbar({ stats }: TopbarProps) {
  const { pathname } = useLocation();
  const elapsed = useSession(
    stats?.session_start ?? new Date().toISOString(),
  );

  const initials = (stats?.student_name ?? 'JD')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex items-center h-12 px-4 border-b border-gray-100 bg-white shrink-0 gap-4">
      {/* Student info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {stats?.student_name ?? 'Student'}
          </span>
          <span className="text-[11px] text-gray-400 ml-1.5">
            {stats?.student_id ?? '—'} · {stats?.exam_name ?? 'Exam'}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Nav tabs */}
      <nav className="hidden sm:flex items-center gap-0.5">
        {tabs.map(({ to, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Live badge */}
      <Badge variant="live">Live</Badge>

      {/* Timer */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-md px-2 py-1 border border-gray-100">
        <Clock className="w-3 h-3 text-gray-400" />
        <span className="font-mono text-[11px] text-gray-600 tabular-nums">
          {elapsed}
        </span>
      </div>
    </header>
  );
}
