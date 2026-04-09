import { useEffect, useState } from 'react';
import {
  Monitor, Eye, MousePointer, Copy, Keyboard,
  AlertTriangle, Shield, EyeOff, Usb, MonitorSmartphone,
  Bluetooth, Cable,
} from 'lucide-react';
import type { LockdownViolation, LockdownViolationType } from '../../types';
import { Card } from '../ui/Card';

interface LockdownViolationFeedProps {
  violations: LockdownViolation[];
  onClear: () => void;
}

/* ── Icon map ───────────────────────────────────────────────────── */
const iconMap: Record<LockdownViolationType, React.ReactNode> = {
  fullscreen_exit:           <EyeOff   className="w-3.5 h-3.5" />,
  tab_switch:                <Monitor  className="w-3.5 h-3.5" />,
  window_blur:               <Eye      className="w-3.5 h-3.5" />,
  right_click:               <MousePointer className="w-3.5 h-3.5" />,
  copy_attempt:              <Copy     className="w-3.5 h-3.5" />,
  paste_attempt:             <Copy     className="w-3.5 h-3.5" />,
  devtools_open:             <AlertTriangle className="w-3.5 h-3.5" />,
  keyboard_shortcut:         <Keyboard className="w-3.5 h-3.5" />,
  screen_record_detected:    <Monitor  className="w-3.5 h-3.5" />,
  multiple_displays_detected:<Shield   className="w-3.5 h-3.5" />,
  external_device_connected: <Usb      className="w-3.5 h-3.5" />,
  display_change_detected:   <MonitorSmartphone className="w-3.5 h-3.5" />,
  bluetooth_device_detected: <Bluetooth className="w-3.5 h-3.5" />,
  serial_device_detected:    <Cable    className="w-3.5 h-3.5" />,
};

const severityDot: Record<LockdownViolation['severity'], string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-yellow-400',
};

const severityText: Record<LockdownViolation['severity'], string> = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-yellow-600',
};

const severityBorder: Record<LockdownViolation['severity'], string> = {
  high:   'border-l-red-400',
  medium: 'border-l-amber-400',
  low:    'border-l-yellow-400',
};

/* ── Relative time hook (updates every second) ───────────────────── */
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function relTime(ts: number, now: number): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/* ── Component ─────────────────────────────────────────────────── */
export function LockdownViolationFeed({ violations, onClear }: LockdownViolationFeedProps) {
  const now = useNow();

  return (
    <Card
      title="lockdown violations"
      action={
        violations.length > 0 ? (
          <button
            onClick={onClear}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium"
          >
            Clear all
          </button>
        ) : undefined
      }
    >
      {violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Shield className="w-8 h-8 text-green-300" />
          <p className="text-sm text-gray-400">No violations detected</p>
          <p className="text-[11px] text-gray-300">Exam integrity maintained</p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
          {violations.map((v, idx) => (
            <div
              key={v.id}
              className={`flex items-center gap-3 py-2 px-2.5 border-l-2 rounded-r-md transition-all ${severityBorder[v.severity]} ${
                idx === 0 ? 'bg-gray-50 animate-[fadein_0.25s_ease-out]' : 'bg-white'
              }`}
            >
              {/* Severity dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${severityDot[v.severity]}`} />

              {/* Icon */}
              <span className={`shrink-0 ${severityText[v.severity]}`}>
                {iconMap[v.type]}
              </span>

              {/* Label */}
              <span className="flex-1 text-[12px] font-medium text-gray-700 truncate">
                {v.label}
              </span>

              {/* Severity badge */}
              <span className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${severityText[v.severity]}`}>
                {v.severity}
              </span>

              {/* Timestamp */}
              <span className="font-mono text-[10px] text-gray-400 shrink-0 w-14 text-right">
                {relTime(v.timestamp, now)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
