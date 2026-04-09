import { Card } from '../ui/Card';
import { SeverityBadge } from '../ui/SeverityBadge';
import type { Alert } from '../../types';

interface AlertFeedProps {
  alerts: Alert[] | null;
}

function borderColor(sev: number): string {
  if (sev >= 5) return 'border-l-red-500';
  if (sev === 4) return 'border-l-amber-500';
  if (sev === 3) return 'border-l-blue-500';
  return 'border-l-gray-300';
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  const list = alerts ?? [];

  return (
    <Card
      title="alert feed"
      action={
        <span className="text-[11px] text-gray-400">
          {list.length} events this session
        </span>
      }
    >
      {list.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No alerts yet — session running cleanly
        </p>
      ) : (
        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto -mx-4 px-4">
          {list.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 py-2.5 border-l-2 pl-3 ${borderColor(a.severity)}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-gray-900">
                    {a.type.replace(/_/g, ' ')}
                  </span>
                  <SeverityBadge severity={a.severity} />
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                  {a.message}
                </p>
              </div>
              <span className="font-mono text-[10px] text-gray-400 shrink-0 mt-0.5">
                {a.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
