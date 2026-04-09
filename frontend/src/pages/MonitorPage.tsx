import { useState, useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useLockdown } from '../hooks/useLockdown';
import {
  getDetectionState, getSessionStats, getAlerts,
  getGazeDistribution, getMetrics, getVideoFeedUrl,
  startSession, stopSession,
} from '../api/client';
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
import { MetricsPanel } from '../components/monitor/MetricsPanel';
import type { LockdownViolation } from '../types';
import { Camera, CameraOff } from 'lucide-react';

const POLL = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 2000);

export function MonitorPage() {
  /* ── Monitoring state (backend camera) ──────────────────────────── */
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isStarting, setIsStarting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  /* ── Termination alert ────────────────────────────────────────── */
  const [terminationViolation, setTerminationViolation] =
    useState<LockdownViolation | null>(null);

  /* ── Lockdown — with auto-termination callback ────────────────── */
  const { isLocked, violations, warningCount, startLockdown, stopLockdown, clearViolations } =
    useLockdown({
      onTerminate: useCallback((v: LockdownViolation) => {
        setIsMonitoring(false);
        stopSession().catch(() => {});
        setTerminationViolation(v);
      }, []),
    });

  /* ── Polling (only when monitoring is active) ─────────────────── */
  const state   = usePolling(getDetectionState, POLL, [isMonitoring]);
  const stats   = usePolling(getSessionStats, POLL, [isMonitoring]);
  const alerts  = usePolling(() => getAlerts(20), POLL, [isMonitoring]);
  const gaze    = usePolling(getGazeDistribution, POLL, [isMonitoring]);
  const metrics = usePolling(getMetrics, 5000, [isMonitoring]);

  const riskStatus =
    (stats?.risk_score ?? 0) >= 60 ? 'danger' :
    (stats?.risk_score ?? 0) >= 25 ? 'warning' : 'normal';

  /* ── Start monitoring (backend camera + lockdown) ─────────────── */
  const handleStart = useCallback(async () => {
    setError(null);
    setIsStarting(true);
    setTerminationViolation(null);
    try {
      await startSession('STUDENT_001', 'Student', 'Final Exam');
      setIsMonitoring(true);
      startLockdown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start session';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  }, [startLockdown]);

  /* ── Stop monitoring ──────────────────────────────────────────── */
  const handleStop = useCallback(async () => {
    setIsMonitoring(false);
    stopLockdown();
    try { await stopSession(); } catch { /* ignore */ }
  }, [stopLockdown]);

  /* ── Acknowledge termination modal ────────────────────────────── */
  const acknowledgeTermination = useCallback(() => {
    setTerminationViolation(null);
  }, []);

  const videoUrl = isMonitoring ? getVideoFeedUrl() : null;

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
              Backend camera active · Lockdown on
            </span>
          ) : (
            <span className="text-[12px] text-gray-400">
              Click <strong>Start Monitoring</strong> to enable backend camera + exam lockdown
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              {isStarting ? 'Starting…' : 'Start Monitoring'}
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-5 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
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
              videoUrl={videoUrl}
              onStartCamera={handleStart}
              isStarting={isStarting}
            />
            <ActivityTimeline />
          </div>

          {/* Right 40% */}
          <div className="lg:col-span-2 space-y-3">
            <LockdownControls
              isLocked={isLocked}
              warningCount={warningCount}
              onStart={handleStart}
              onStop={handleStop}
            />
            <DetectorGrid state={state} />
            <GazeDistribution gaze={gaze} state={state} />
          </div>
        </div>

        {/* ML Performance Metrics Panel */}
        <MetricsPanel metrics={metrics} />

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
