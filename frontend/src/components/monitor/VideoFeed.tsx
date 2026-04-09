import { useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import type { DetectionState } from '../../types';
import { Camera, User } from 'lucide-react';

interface VideoFeedProps {
  state: DetectionState | null;
  stream: MediaStream | null;
  onStartCamera: () => void;
  isStarting: boolean;
}

export function VideoFeed({ state, stream, onStartCamera, isStarting }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const face = state?.face_present ?? true;
  const gaze = state?.gaze_direction ?? 'center';
  const ear  = state?.eye_ratio ?? 0.3;
  const objDetected = state?.objects_detected ?? false;
  const objLabel    = state?.detected_object_label ?? '';

  // Attach stream to <video> element whenever stream changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream]);

  return (
    <Card title="webcam feed">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-gray-100 border border-gray-200"
        style={{ aspectRatio: '16/10' }}
      >
        {stream ? (
          <>
            {/* Live camera video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scan line overlay */}
            <div className="absolute left-0 right-0 h-px bg-blue-500/40 animate-[scandown_3.5s_linear_infinite]" />

            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-500/60 rounded-tl" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-500/60 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-500/60 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-500/60 rounded-br" />

            {/* Face ring overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${
                  face
                    ? 'border-green-500 shadow-[0_0_16px_rgba(22,163,74,0.35)] animate-[ringpulse_2.5s_ease-in-out_infinite]'
                    : 'border-red-500 shadow-[0_0_16px_rgba(220,38,38,0.35)]'
                }`}
              />
            </div>

            {/* Bottom-left badges */}
            <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[9px] text-white font-mono">
                1280×720
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[9px] text-white font-mono">
                {gaze} · EAR {ear.toFixed(2)}
              </span>
            </div>

            {/* Object detection chip */}
            {objDetected && (
              <div className="absolute bottom-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded bg-red-600 text-[10px] text-white font-medium animate-pulse">
                  ⚠ {objLabel || 'object detected'}
                </span>
              </div>
            )}

            {/* Face status chip top-right */}
            <div className="absolute top-2.5 right-2.5">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                  face
                    ? 'bg-green-600/80 text-white'
                    : 'bg-red-600/80 text-white animate-pulse'
                }`}
              >
                <User className="w-3 h-3" />
                {face ? 'Face detected' : 'No face'}
              </span>
            </div>
          </>
        ) : (
          /* ── Idle / not monitoring ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Placeholder face icon */}
            <div className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-white">
              <User className="w-9 h-9 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Camera not started</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Click Start Monitoring to enable webcam
              </p>
            </div>
            <button
              onClick={onStartCamera}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
              {isStarting ? 'Starting…' : 'Start Monitoring'}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
