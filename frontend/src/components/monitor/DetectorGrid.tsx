import { Card } from '../ui/Card';
import type { DetectionState } from '../../types';

interface DetectorGridProps {
  state: DetectionState | null;
}

interface Row {
  label: string;
  getValue: (s: DetectionState) => string;
  getStatus: (s: DetectionState) => 'ok' | 'warning' | 'alert';
}

const rows: Row[] = [
  {
    label: 'Face',
    getValue: (s) => (s.face_present ? 'Present' : 'Absent'),
    getStatus: (s) => (s.face_present ? 'ok' : 'alert'),
  },
  {
    label: 'Gaze',
    getValue: (s) => s.gaze_direction,
    getStatus: (s) => (s.eye_alarming ? 'alert' : s.gaze_direction !== 'center' ? 'warning' : 'ok'),
  },
  {
    label: 'Mouth',
    getValue: (s) => (s.mouth_moving ? 'Moving' : 'Still'),
    getStatus: (s) => (s.mouth_alarming ? 'alert' : s.mouth_moving ? 'warning' : 'ok'),
  },
  {
    label: 'Multi-face',
    getValue: (s) => (s.multiple_faces ? 'Detected' : 'Clear'),
    getStatus: (s) => (s.multiple_faces ? 'alert' : 'ok'),
  },
  {
    label: 'Objects',
    getValue: (s) => (s.objects_detected ? s.detected_object_label || 'Detected' : 'Clear'),
    getStatus: (s) => (s.objects_detected ? 'alert' : 'ok'),
  },
  {
    label: 'Audio',
    getValue: () => 'Monitoring',
    getStatus: () => 'ok',
  },
  {
    label: 'Hands',
    getValue: (s) => (s.hand_violation ? s.hand_violation_msg || 'Alert' : 'Clear'),
    getStatus: (s) => (s.hand_violation ? 'alert' : 'ok'),
  },
  {
    label: 'Hardware',
    getValue: () => 'Normal',
    getStatus: () => 'ok',
  },
];

const dotColor: Record<string, string> = {
  ok: 'bg-green-400',
  warning: 'bg-amber-400',
  alert: 'bg-red-400',
};

export function DetectorGrid({ state }: DetectorGridProps) {
  return (
    <Card title="detectors">
      <div className="grid grid-cols-2 gap-x-4 gap-y-0">
        {rows.map((row) => {
          const status = state ? row.getStatus(state) : 'ok';
          const value = state ? row.getValue(state) : '—';
          return (
            <div
              key={row.label}
              className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {status !== 'ok' && (
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full ${dotColor[status]} opacity-75 animate-ping`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${dotColor[status]}`}
                />
              </span>
              <span className="text-[12px] font-medium text-gray-700 w-16 shrink-0">
                {row.label}
              </span>
              <span className="text-[11px] text-gray-400 truncate capitalize">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
