import { useState } from 'react';
import type { SessionReport } from '../../types';
import { Search } from 'lucide-react';

interface Props { reports: SessionReport[]; activeId: string | null; onSelect: (id: string) => void; }

function riskCls(s: number) {
  if (s >= 60) return { l: 'High risk', c: 'bg-red-50 text-red-600 border-red-200' };
  if (s >= 25) return { l: 'Medium', c: 'bg-amber-50 text-amber-600 border-amber-200' };
  return { l: 'Low risk', c: 'bg-green-50 text-green-600 border-green-200' };
}

export function SessionList({ reports, activeId, onSelect }: Props) {
  const [q, setQ] = useState('');
  const list = reports.filter(r => r.student_name.toLowerCase().includes(q.toLowerCase()) || r.exam_name.toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className="w-[220px] shrink-0 border-r border-gray-100 bg-white flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Session reports</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">{reports.length} sessions · {new Date().toLocaleString('default',{month:'long'})}</p>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
          <input type="text" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} className="w-full pl-7 pr-2 py-1.5 text-[12px] rounded-md border border-gray-200 outline-none focus:border-blue-300 bg-gray-50"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.map(r => { const a = r.id===activeId; const rk = riskCls(r.risk_score); return (
          <button key={r.id} onClick={()=>onSelect(r.id)} className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors ${a?'bg-blue-50/60 border-l-2 border-l-blue-500':'hover:bg-gray-50 border-l-2 border-l-transparent'}`}>
            <p className="text-[12px] font-medium text-gray-900 truncate">{r.student_name}</p>
            <p className="font-mono text-[10px] text-gray-400 mt-0.5 truncate">{r.exam_name} · {r.date}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${rk.c}`}>{rk.l}</span>
              <span className="text-[10px] text-gray-400">{r.total_violations} viol. · {r.duration_minutes}m</span>
            </div>
          </button>
        );})}
        {list.length===0 && <p className="text-[12px] text-gray-400 p-4 text-center">No matches</p>}
      </div>
    </aside>
  );
}
