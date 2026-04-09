import { useRef, useState, useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useLockdown } from '../hooks/useLockdown';
import { getDetectionState, getSessionStats, getAlerts, getGazeDistribution } from '../api/client';
import { MetricCard } from '../components/monitor/MetricCard';
import { VideoFeed } from '../components/monitor/VideoFeed';
import { ActivityTimeline } from '../components/monitor/ActivityTimeline';
import { DetectorGrid } from '../components/monitor/DetectorGrid';
import { GazeDistribution } from '../components/monitor/GazeDistribution';
import { AlertFeed } from '../components/monitor/AlertFeed';
import { LockdownBanner } from '../components/monitor/LockdownBanner';
import { LockdownControls } from '../components/monitor/LockdownControls';
import { LockdownViolationFeed } from '../components/monitor/LockdownViolationFeed';
import { TerminationModal } from '../components/monitor/TerminationModal';
import type { LockdownViolation } from '../types';
import { Camera, CameraOff } from 'lucide-react';

const POLL = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 2000);

export function MonitorPage() {
  /* ── Camera state ─────────────────────────────────────────────── */
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError]   = useState<string | null>(null);
  const [isStarting, setIsStarting]     = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── Termination alert ────────────────────────────────────────── */
  const [terminationViolation, setTerminationViolation] =
    useState<LockdownViolation | null>(null);

  /* ── Camera stop helper (internal — used by both user and auto) ── */
  const killCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraStream(null);
  }, []);

  /* ── Lockdown — with auto-termination callback ────────────────── */
  const { isLocked, violations, warningCount, startLockdown, stopLockdown, clearViolations } =
    useLockdown({
      onTerminate: useCallback((v: LockdownViolation) => {
        // Auto-stop camera and show the termination modal
        killCamera();
        setTerminationViolation(v);
      }, [killCamera]),
    });

  /* ── Polling ──────────────────────────────────────────────────── */
  const state  = usePolling(getDetectionState, POLL);
  const stats  = usePolling(getSessionStats, POLL);
  const alerts = usePolling(() => getAlerts(20), POLL);
  const gaze   = usePolling(getGazeDistribution, POLL);

  const riskStatus =
    (stats?.risk_score ?? 0) >= 60 ? 'danger' :
    (stats?.risk_score ?? 0) >= 25 ? 'warning' : 'normal';

  /* ── Start camera → also starts lockdown automatically ───────── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStarting(true);
    setTerminationViolation(null); // clear any previous termination
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraStream(stream);
      // ✅ Auto-start lockdown as soon as camera is active
      startLockdown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(
        msg.includes('denied') || msg.includes('Permission')
          ? 'Camera permission denied. Please allow access and try again.'
          : 'Could not start camera. Check your browser settings.',
      );
    } finally {
      setIsStarting(false);
    }
  }, [startLockdown]);

  /* ── Stop camera → also stops lockdown ───────────────────────── */
  const stopCamera = useCallback(() => {
    killCamera();
    stopLockdown();
  }, [killCamera, stopLockdown]);

  /* ── Acknowledge termination modal ────────────────────────────── */
  const acknowledgeTermination = useCallback(() => {
    setTerminationViolation(null);
  }, []);

  const isMonitoring = !!cameraStream;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">

      {/* ── Termination modal (highest z-index) ── */}
      <TerminationModal
        violation={terminationViolation}
        onAcknowledge={acknowledgeTermination}
      />

      {/* ── Lockdown banner (only when active) ── */}
      {isLocked && (
        <LockdownBanner warningCount={warningCount} violations={violations} />
      )}

      {/* ── Session control bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Camera active · Lockdown on
            </span>
          ) : (
            <span className="text-[12px] text-gray-400">
              Click <strong>Start Monitoring</strong> to enable camera + exam lockdown
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              {isStarting ? 'Starting…' : 'Start Monitoring'}
            </button>
          )}
        </div>
      </div>

      {/* ── Camera error banner ── */}
      {cameraError && (
        <div className="mx-5 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between shrink-0">
          <span>{cameraError}</span>
          <button
            onClick={() => setCameraError(null)}
            className="text-red-400 hover:text-red-600 ml-4 text-xs"
          >✕</button>
        </div>
      )}

      {/* ── Main scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total alerts"
            value={stats?.total_alerts ?? 0}
            status={(stats?.total_alerts ?? 0) > 5 ? 'danger' : 'normal'}
          />
          <MetricCard
            label="Face absent"
            value={`${(stats?.face_absent_duration ?? 0).toFixed(1)}s`}
            status={(stats?.face_absent_duration ?? 0) > 10 ? 'warning' : 'normal'}
          />
          <MetricCard label="Gaze deviations" value={stats?.gaze_deviations ?? 0} />
          <MetricCard
            label="Risk score"
            value={`${stats?.risk_score ?? 0}/100`}
            status={riskStatus}
          />
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {/* Left 60% */}
          <div className="lg:col-span-3 space-y-3">
            <VideoFeed
              state={state}
              stream={cameraStream}
              onStartCamera={startCamera}
              isStarting={isStarting}
            />
            <ActivityTimeline />
          </div>

          {/* Right 40% */}
          <div className="lg:col-span-2 space-y-3">
            <LockdownControls
              isLocked={isLocked}
              warningCount={warningCount}
              onStart={startCamera}   // start camera = start everything
              onStop={stopCamera}     // stop camera = stop everything
            />
            <DetectorGrid state={state} />
            <GazeDistribution gaze={gaze} state={state} />
          </div>
        </div>

        {/* Lockdown violation log */}
        <LockdownViolationFeed
          violations={violations}
          onClear={clearViolations}
        />

        {/* Standard AI alert feed */}
        <AlertFeed alerts={alerts} />

      </div>
    </div>
  );
}
