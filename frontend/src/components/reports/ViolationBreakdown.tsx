import type { ViolationRecord, ViolationType } from '../../types';
import { SEVERITY_MAP } from '../../types';

interface Props { violations: ViolationRecord[]; }

function barColor(s: number) { if(s>=5) return 'bg-red-400'; if(s===4) return 'bg-amber-400'; if(s===3) return 'bg-blue-400'; return 'bg-gray-300'; }

export function ViolationBreakdown({ violations }: Props) {
  const counts: Record<string,number> = {};
  violations.forEach(v => { counts[v.type] = (counts[v.type]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const max = sorted.length ? sorted[0][1] : 1;

  return (
    <div className="space-y-2">
      {sorted.map(([type,count])=>(
        <div key={type} className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600 w-28 truncate">{type.replace(/_/g,' ')}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor(SEVERITY_MAP[type as ViolationType]??1)}`} style={{width:`${(count/max)*100}%`}}/>
          </div>
          <span className="text-[11px] font-mono text-gray-500 w-5 text-right">{count}</span>
        </div>
      ))}
      {sorted.length===0 && <p className="text-[12px] text-gray-400 text-center py-4">No data</p>}
    </div>
  );
}
