import { Shield, ShieldOff, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';

interface LockdownControlsProps {
  isLocked: boolean;
  warningCount: number;
  onStart: () => void;
  onStop: () => void;
}

/* ── Detector checklist ─────────────────────────────────────────── */
const DETECTORS = [
  { label: 'Fullscreen enforced',     key: 'fullscreen' },
  { label: 'Tab switch detection',    key: 'tab'        },
  { label: 'Window focus tracking',   key: 'blur'       },
  { label: 'Keyboard blocking',       key: 'keyboard'   },
  { label: 'DevTools detection',      key: 'devtools'   },
  { label: 'Screen record detection', key: 'screen'     },
  { label: 'Multi-display check',     key: 'multi'      },
  { label: 'USB / port detection',    key: 'usb'        },
  { label: 'Display change monitor',  key: 'display'    },
  { label: 'Bluetooth detection',     key: 'bluetooth'  },
  { label: 'Serial port detection',   key: 'serial'     },
];

export function LockdownControls({
  isLocked,
  warningCount,
  onStart,
  onStop,
}: LockdownControlsProps) {

  const handleStop = () => {
    if (window.confirm('Are you sure you want to end the exam lockdown? This will disable all proctoring restrictions.')) {
      onStop();
    }
  };

  return (
    <Card title="exam lockdown">
      {/* ── Status row ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-green-700">Lockdown Active</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-500">Inactive</span>
            </>
          )}
        </div>

        {/* Warning count */}
        {isLocked && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            warningCount > 0
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            <AlertTriangle className="w-3 h-3" />
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2 mb-5">
        {!isLocked ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Start Exam Lockdown
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            <ShieldOff className="w-4 h-4" />
            End Lockdown
          </button>
        )}
      </div>

      {/* ── Detector checklist ── */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Active Detectors
        </p>
        {DETECTORS.map(d => (
          <div key={d.key} className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
              isLocked ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <span className={`text-[12px] font-medium transition-colors ${
              isLocked ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
