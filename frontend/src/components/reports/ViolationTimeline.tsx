import { SeverityBadge } from '../ui/SeverityBadge';
import type { ViolationRecord } from '../../types';

interface Props { violations: ViolationRecord[]; }

function dotColor(s: number) { if(s>=5) return 'bg-red-500'; if(s===4) return 'bg-amber-500'; if(s===3) return 'bg-blue-500'; return 'bg-gray-400'; }

export function ViolationTimeline({ violations }: Props) {
  if (!violations.length) return <p className="text-sm text-gray-400 py-8 text-center">No violations recorded</p>;
  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200"/>
      {violations.map((v,i)=>{
        const t = new Date(v.timestamp);
        const time = t.toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'});
        return (
          <div key={i} className="relative flex items-start gap-3 pb-4">
            <div className={`absolute left-[-15px] top-1 w-[10px] h-[10px] rounded-full border-2 border-white ${dotColor(v.severity)}`}/>
            <span className="font-mono text-[10px] text-gray-400 w-12 shrink-0 pt-0.5">{time}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-gray-900">{v.type.replace(/_/g,' ')}</span>
                <SeverityBadge severity={v.severity}/>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{v.metadata?.duration as string ?? 'Detected'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
