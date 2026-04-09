import { Card } from '../ui/Card';
import type { DetectionState } from '../../types';
import { User } from 'lucide-react';

interface VideoFeedProps {
  state: DetectionState | null;
}

export function VideoFeed({ state }: VideoFeedProps) {
  const face = state?.face_present ?? true;
  const gaze = state?.gaze_direction ?? 'center';
  const ear = state?.eye_ratio ?? 0.3;
  const objDetected = state?.objects_detected ?? false;
  const objLabel = state?.detected_object_label ?? '';

  return (
    <Card title="webcam feed">
      {/* Feed viewport */}
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-900"
           style={{ aspectRatio: '16/10' }}>
        {/* Scan line */}
        <div className="absolute left-0 right-0 h-px bg-blue-400/50 animate-[scandown_3.5s_linear_infinite]" />

        {/* Corner brackets */}
        {/* Top-left */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400/70 rounded-tl" />
        {/* Top-right */}
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400/70 rounded-tr" />
        {/* Bottom-left */}
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400/70 rounded-bl" />
        {/* Bottom-right */}
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400/70 rounded-br" />

        {/* Center face indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${
              face
                ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] animate-[ringpulse_2.5s_ease-in-out_infinite]'
                : 'border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)]'
            }`}
          >
            <User className={`w-7 h-7 ${face ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <span className={`text-[11px] font-medium ${face ? 'text-green-400' : 'text-red-400'}`}>
            {face ? 'Face detected' : 'Face not detected'}
          </span>
          <span className="text-[10px] text-gray-400">
            Gaze: {gaze} · EAR: {ear.toFixed(2)}
          </span>
        </div>

        {/* Bottom-left badges */}
        <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-gray-300 font-mono">
            1280×720
          </span>
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-gray-300 font-mono">
            30 fps
          </span>
        </div>

        {/* Bottom-right object chip */}
        {objDetected && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded bg-red-600 text-[10px] text-white font-medium animate-pulse">
              ⚠ {objLabel || 'object detected'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
