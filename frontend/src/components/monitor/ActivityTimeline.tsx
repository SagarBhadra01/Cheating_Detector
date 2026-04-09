import { Card } from '../ui/Card';
import { useMemo } from 'react';

export function ActivityTimeline() {
  const bars = useMemo(() => {
    return Array.from({ length: 30 }, () => {
      const r = Math.random();
      if (r < 0.55) return { color: 'bg-green-400', h: 8 + Math.random() * 12 };
      if (r < 0.75) return { color: 'bg-amber-400', h: 20 + Math.random() * 15 };
      if (r < 0.88) return { color: 'bg-red-400', h: 30 + Math.random() * 20 };
      return { color: 'bg-blue-400', h: 14 + Math.random() * 10 };
    });
  }, []);

  return (
    <Card title="activity · last 10 min">
      <div className="flex items-end gap-[3px] h-14">
        {bars.map((b, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${b.color} transition-all`}
            style={{ height: `${b.h}%` }}
          />
        ))}
      </div>
    </Card>
  );
}
