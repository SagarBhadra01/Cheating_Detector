import { useState, useEffect } from 'react';
import { getSessionReports, getSessionReport, getPdfReportUrl } from '../api/client';
import { SessionList } from '../components/reports/SessionList';
import { ViolationTimeline } from '../components/reports/ViolationTimeline';
import { ViolationBreakdown } from '../components/reports/ViolationBreakdown';
import { WeeklyHeatmap } from '../components/reports/WeeklyHeatmap';
import { Card } from '../components/ui/Card';
import { SEVERITY_MAP } from '../types';
import type { SessionReport, ViolationType } from '../types';
import { Download, FileText, Video, Camera } from 'lucide-react';

function riskColor(s: number) { if(s>=60) return 'text-red-600'; if(s>=25) return 'text-amber-600'; return 'text-green-600'; }

export function ReportsPage() {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [active, setActive] = useState<SessionReport|null>(null);

  // Fetch reports list from backend
  useEffect(()=>{
    getSessionReports().then(r=>{
      setReports(r);
      if(r.length) setActiveId(r[0].id);
    }).catch(()=>{});
  },[]);

  // When activeId changes, fetch the full report details
  useEffect(()=>{
    if(!activeId) { setActive(null); return; }
    // First check if we already have it in the list with violations
    const cached = reports.find(r=>r.id===activeId);
    if (cached && cached.violations && cached.violations.length > 0) {
      setActive(cached);
      return;
    }
    // Otherwise fetch from backend
    getSessionReport(activeId).then(r=>setActive(r)).catch(()=>{
      // Fallback to cached
      if(cached) setActive(cached);
    });
  },[activeId, reports]);

  const sevScore = active ? active.violations.reduce((a,v)=>a + (SEVERITY_MAP[v.type as ViolationType]??1), 0) : 0;

  const initials = (active?.student_name??'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  // Screenshot-worthy violation types
  const screenshotTypes: ViolationType[] = ['OBJECT_DETECTED','MULTIPLE_FACES','HAND_VIOLATION'];
  const screenshots = active ? active.violations.filter(v=>screenshotTypes.includes(v.type)) : [];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <SessionList reports={reports} activeId={activeId} onSelect={setActiveId}/>

      {active ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{initials}</div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">{active.student_name}</h2>
                <p className="text-[11px] text-gray-400">{active.student_id} · {active.exam_name} · {active.date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"><Video className="w-3.5 h-3.5"/>View video</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"><FileText className="w-3.5 h-3.5"/>Export HTML</button>
              <a href={getPdfReportUrl(active.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-blue-600 text-white hover:bg-blue-700"><Download className="w-3.5 h-3.5"/>Download PDF</a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <Card><p className="text-[11px] text-gray-400 uppercase tracking-wider">Risk score</p><p className={`text-2xl font-medium ${riskColor(active.risk_score)}`}>{active.risk_score}</p></Card>
            <Card><p className="text-[11px] text-gray-400 uppercase tracking-wider">Total violations</p><p className="text-2xl font-medium text-gray-900">{active.total_violations}</p></Card>
            <Card><p className="text-[11px] text-gray-400 uppercase tracking-wider">Duration</p><p className="text-2xl font-medium text-gray-900">{active.duration_minutes}<span className="text-sm text-gray-400"> min</span></p></Card>
            <Card><p className="text-[11px] text-gray-400 uppercase tracking-wider">Severity score</p><p className="text-2xl font-medium text-gray-900">{sevScore}</p></Card>
          </div>

          {/* Two-col: timeline + breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card title="violation timeline" className="lg:col-span-3">
              <ViolationTimeline violations={active.violations}/>
            </Card>
            <div className="lg:col-span-2 space-y-3">
              <Card title="violation breakdown">
                <ViolationBreakdown violations={active.violations}/>
              </Card>
              <Card title="evidence screenshots">
                {screenshots.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {screenshots.slice(0,3).map((v,i)=>(
                      <div key={i} className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1 border border-gray-200">
                        <Camera className="w-4 h-4 text-gray-400"/>
                        <span className="text-[9px] text-gray-400 text-center px-1">{v.type.replace(/_/g,' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[12px] text-gray-400 text-center py-4">No screenshots</p>}
              </Card>
            </div>
          </div>

          {/* Heatmap */}
          <Card>
            <WeeklyHeatmap/>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {reports.length === 0
            ? 'No reports available — start a monitoring session first'
            : 'Select a session to view details'}
        </div>
      )}
    </div>
  );
}
