import { Shield, AlertTriangle, Eye } from 'lucide-react';
import type { LockdownViolation } from '../../types';

interface LockdownBannerProps {
  warningCount: number;
  violations: LockdownViolation[];
}

const severityColor: Record<LockdownViolation['severity'], string> = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-yellow-600',
};

const severityBg: Record<LockdownViolation['severity'], string> = {
  high:   'bg-red-50 border-red-200',
  medium: 'bg-amber-50 border-amber-200',
  low:    'bg-yellow-50 border-yellow-200',
};

function relTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function LockdownBanner({ warningCount, violations }: LockdownBannerProps) {
  const last3 = violations.slice(0, 3);

  return (
    <div className="shrink-0 border-b-2 border-red-500 bg-white shadow-sm">
      {/* ── Top strip ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-600">
        <div className="flex items-center gap-2">
          {/* Pulsing lock icon */}
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 animate-ping" />
            <Shield className="relative w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-semibold text-white tracking-wide">
            🔒 Exam in progress — Proctoring Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Eye className="w-3.5 h-3.5 text-red-200" />
          {warningCount > 0 && (
            <span className="flex items-center gap-1 bg-white text-red-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} high-severity warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount === 0 && (
            <span className="text-[11px] text-red-200 font-medium">No warnings yet</span>
          )}
        </div>
      </div>

      {/* ── Recent violations feed (last 3) ── */}
      {last3.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 overflow-x-auto">
          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider shrink-0 mr-1">
            Recent:
          </span>
          {last3.map(v => (
            <span
              key={v.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${severityBg[v.severity]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                v.severity === 'high' ? 'bg-red-500' :
                v.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
              }`} />
              <span className={severityColor[v.severity]}>{v.label}</span>
              <span className="text-gray-400">· {relTime(v.timestamp)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
