import { usePolling } from '../hooks/usePolling';
import { getDetectionState, getSessionStats, getAlerts, getGazeDistribution } from '../api/client';
import { MetricCard } from '../components/monitor/MetricCard';
import { VideoFeed } from '../components/monitor/VideoFeed';
import { ActivityTimeline } from '../components/monitor/ActivityTimeline';
import { DetectorGrid } from '../components/monitor/DetectorGrid';
import { GazeDistribution } from '../components/monitor/GazeDistribution';
import { AlertFeed } from '../components/monitor/AlertFeed';

const POLL = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 2000);

export function MonitorPage() {
  const state = usePolling(getDetectionState, POLL);
  const stats = usePolling(getSessionStats, POLL);
  const alerts = usePolling(() => getAlerts(20), POLL);
  const gaze = usePolling(getGazeDistribution, POLL);

  const riskStatus = (stats?.risk_score ?? 0) >= 60 ? 'danger' : (stats?.risk_score ?? 0) >= 25 ? 'warning' : 'normal';

  return (
    <div className="p-4 space-y-3 overflow-y-auto flex-1">
      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total alerts" value={stats?.total_alerts ?? 0} status={(stats?.total_alerts ?? 0) > 5 ? 'danger' : 'normal'} />
        <MetricCard label="Face absent" value={`${(stats?.face_absent_duration ?? 0).toFixed(1)}s`} status={(stats?.face_absent_duration ?? 0) > 10 ? 'warning' : 'normal'} />
        <MetricCard label="Gaze deviations" value={stats?.gaze_deviations ?? 0} />
        <MetricCard label="Risk score" value={`${stats?.risk_score ?? 0}/100`} status={riskStatus} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Left: 60% — webcam + activity */}
        <div className="lg:col-span-3 space-y-3">
          <VideoFeed state={state} />
          <ActivityTimeline />
        </div>
        {/* Right: 40% — detectors + gaze */}
        <div className="lg:col-span-2 space-y-3">
          <DetectorGrid state={state} />
          <GazeDistribution gaze={gaze} state={state} />
        </div>
      </div>

      {/* Alert feed */}
      <AlertFeed alerts={alerts} />
    </div>
  );
}
