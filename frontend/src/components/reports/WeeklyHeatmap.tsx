import { useMemo } from 'react';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function cellColor(v: number) {
  if (v===0) return 'bg-gray-100';
  if (v<=2) return 'bg-green-200';
  if (v<=5) return 'bg-amber-300';
  return 'bg-red-400';
}

export function WeeklyHeatmap() {
  const data = useMemo(()=> days.map(d => ({ day: d, count: Math.floor(Math.random()*10) })), []);

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
