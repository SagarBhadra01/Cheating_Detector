import { useEffect, useState } from 'react';
import { getAlerts } from '../../api/client';
import type { Alert } from '../../types';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function cellColor(v: number) {
  if (v===0) return 'bg-gray-100';
  if (v<=2) return 'bg-green-200';
  if (v<=5) return 'bg-amber-300';
  return 'bg-red-400';
}

/**
 * Weekly heatmap — maps real violations to day-of-week buckets.
 * Uses alert timestamps from the backend.
 */
export function WeeklyHeatmap() {
  const [data, setData] = useState<{day:string; count:number}[]>(
    days.map(d => ({ day: d, count: 0 }))
  );

  useEffect(() => {
    getAlerts(200).then((alerts: Alert[]) => {
      const counts: Record<string, number> = {};
      days.forEach(d => { counts[d] = 0; });

      alerts.forEach(a => {
        try {
          const ts = a.timestamp;
          if (!ts) return;
          const date = new Date(ts);
          // getDay(): 0=Sun, 1=Mon ... 6=Sat → remap to Mon-Sun
          const jsDay = date.getDay();
          const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 ... Sun=6
          const dayName = days[dayIdx];
          if (dayName) counts[dayName]++;
        } catch { /* skip invalid timestamps */ }
      });

      setData(days.map(d => ({ day: d, count: counts[d] ?? 0 })));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400 mb-2">weekly activity heatmap</p>
      <div className="grid grid-cols-7 gap-1.5">
        {data.map(d=>(
          <div key={d.day} className="flex flex-col items-center gap-1" title={`${d.day}: ${d.count} violations`}>
            <div className={`w-full aspect-square rounded-md ${cellColor(d.count)} transition-colors cursor-default flex items-center justify-center`}>
              <span className="text-[10px] font-medium text-gray-700/70">{d.count}</span>
            </div>
            <span className="text-[9px] text-gray-400">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
