import { Card } from '../ui/Card';
import { useEffect, useState } from 'react';
import { getAlerts } from '../../api/client';
import { SEVERITY_MAP } from '../../types';
import type { Alert, ViolationType } from '../../types';

/**
 * Activity timeline — shows real alert activity from the backend.
 * Each bar represents an alert; its height = severity, color = severity level.
 */

function barProps(severity: number) {
  if (severity >= 5) return { color: 'bg-red-400', h: 85 };
  if (severity === 4) return { color: 'bg-amber-400', h: 65 };
  if (severity === 3) return { color: 'bg-blue-400', h: 45 };
  if (severity === 2) return { color: 'bg-yellow-400', h: 30 };
  return { color: 'bg-green-400', h: 15 };
}

export function ActivityTimeline() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getAlerts(30).then(setAlerts).catch(() => {});
    const id = setInterval(() => {
      getAlerts(30).then(setAlerts).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // If no alerts, show empty bars
  const bars = alerts.length > 0
    ? alerts.slice(0, 30).map(a => {
        const sev = a.severity ?? SEVERITY_MAP[a.type as ViolationType] ?? 1;
        return barProps(sev);
      })
    : Array.from({ length: 30 }, () => ({ color: 'bg-gray-200', h: 8 }));

  return (
    <Card
      title="activity · recent alerts"
      action={
        <span className="text-[11px] text-gray-400">{alerts.length} events</span>
      }
    >
      <div className="flex items-end gap-[3px] h-14">
        {bars.map((b, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${b.color} transition-all duration-300`}
            style={{ height: `${b.h}%` }}
          />
        ))}
      </div>
      {alerts.length === 0 && (
        <p className="text-[10px] text-gray-400 text-center mt-2">
          No activity yet
        </p>
      )}
    </Card>
  );
}
