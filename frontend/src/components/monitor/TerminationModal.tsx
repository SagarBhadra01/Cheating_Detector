import { ShieldOff, AlertTriangle, Clock } from 'lucide-react';
import type { LockdownViolation } from '../../types';

interface TerminationModalProps {
  violation: LockdownViolation | null;
  onAcknowledge: () => void;
}

const severityColor: Record<LockdownViolation['severity'], string> = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-yellow-600',
};

const severityBg: Record<LockdownViolation['severity'], string> = {
  high:   'bg-red-50 border-red-300',
  medium: 'bg-amber-50 border-amber-300',
  low:    'bg-yellow-50 border-yellow-300',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function TerminationModal({ violation, onAcknowledge }: TerminationModalProps) {
  if (!violation) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadein_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Red header */}
        <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500">
            <ShieldOff className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Exam Session Terminated</h2>
            <p className="text-sm text-red-200">A policy violation was detected</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Violation detail card */}
          <div className={`border rounded-xl p-4 ${severityBg[violation.severity]}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${severityColor[violation.severity]}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${severityColor[violation.severity]}`}>
                  {violation.label}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 capitalize">
                  Violation type: <span className="font-mono">{violation.type.replace(/_/g, ' ')}</span>
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] text-gray-400 font-mono">
                    {formatTime(violation.timestamp)}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${severityBg[violation.severity]} ${severityColor[violation.severity]}`}>
                {violation.severity}
              </span>
            </div>
          </div>

          {/* Info text */}
          <div className="text-sm text-gray-600 space-y-1.5">
            <p>Your monitoring session has been <strong>automatically stopped</strong> due to the violation above.</p>
            <p className="text-[12px] text-gray-400">
              This violation has been logged. Your proctor may review this incident.
            </p>
          </div>

          {/* What happened checklist */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 text-[12px] text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              Camera monitoring has been stopped
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              Exam lockdown has been lifted
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              Violation has been recorded
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onAcknowledge}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            I Acknowledge This Violation
          </button>
        </div>
      </div>
    </div>
  );
}
