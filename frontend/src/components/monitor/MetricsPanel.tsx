import { Card } from '../ui/Card';
import type { MetricsData } from '../../types';

interface MetricsPanelProps {
  metrics: MetricsData | null;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmt(v: number): string {
  return v.toFixed(4);
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics || !metrics.confusion_matrix) {
    return (
      <Card title="ml performance metrics">
        <p className="text-sm text-gray-400 py-6 text-center">
          Waiting for detection data…
        </p>
      </Card>
    );
  }

  const cm = metrics.confusion_matrix;
  const cl = metrics.classification;
  const dur = metrics.session_duration_s;
  const mins = Math.floor(dur / 60);
  const secs = Math.floor(dur % 60);

  return (
    <div className="space-y-3">
      {/* Session overview */}
      <Card title="session overview">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Duration</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{mins}m {secs}s</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Frames</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{metrics.total_frames.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg FPS</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{metrics.avg_fps}</p>
          </div>
        </div>
      </Card>

      {/* Confusion Matrix */}
      <Card title="confusion matrix">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-[10px] text-green-600 font-semibold uppercase">TP</p>
            <p className="text-xl font-mono font-bold text-green-700">{cm.tp}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-[10px] text-red-600 font-semibold uppercase">FP</p>
            <p className="text-xl font-mono font-bold text-red-700">{cm.fp}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-600 font-semibold uppercase">FN</p>
            <p className="text-xl font-mono font-bold text-amber-700">{cm.fn}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-[10px] text-blue-600 font-semibold uppercase">TN</p>
            <p className="text-xl font-mono font-bold text-blue-700">{cm.tn}</p>
          </div>
        </div>

        {/* Ground truth indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${metrics.ground_truth_active ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[11px] text-gray-500">
            Ground Truth: <strong className={metrics.ground_truth_active ? 'text-red-600' : 'text-green-600'}>
              {metrics.ground_truth_active ? 'VIOLATION' : 'CLEAN'}
            </strong>
          </span>
        </div>
      </Card>

      {/* Classification Metrics */}
      <Card title="classification metrics">
        <div className="space-y-2">
          {[
            { label: 'Accuracy', value: cl.accuracy, color: 'bg-blue-400' },
            { label: 'Precision', value: cl.precision, color: 'bg-green-400' },
            { label: 'Recall (Sensitivity)', value: cl.recall, color: 'bg-amber-400' },
            { label: 'Specificity (TNR)', value: cl.specificity, color: 'bg-purple-400' },
            { label: 'F1 Score', value: cl.f1_score, color: 'bg-cyan-400' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-600 w-32 shrink-0">{m.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                  style={{ width: `${Math.min(100, m.value * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-gray-600 w-16 text-right">
                {pct(m.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
            <span className="text-[11px] text-gray-600 w-32 shrink-0">MCC</span>
            <span className={`text-sm font-mono font-semibold ${cl.mcc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cl.mcc >= 0 ? '+' : ''}{fmt(cl.mcc)}
            </span>
            <span className="text-[10px] text-gray-400 ml-1">(-1 worst → +1 perfect)</span>
          </div>
        </div>
      </Card>

      {/* Per-detector triggers */}
      {Object.keys(metrics.per_detector_triggers).length > 0 && (
        <Card title="per-detector triggers">
          <div className="space-y-1.5">
            {Object.entries(metrics.per_detector_triggers)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => {
                const pctVal = metrics.total_frames > 0
                  ? (count / metrics.total_frames * 100).toFixed(1)
                  : '0.0';
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-600 w-28 truncate">{name.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400"
                        style={{ width: `${Math.min(100, count / (metrics.total_frames || 1) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 w-20 text-right">
                      {count} ({pctVal}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* YOLO metrics */}
      {metrics.yolo && (
        <Card title="yolo object detector (yolov8s)">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ['Inference Frames', metrics.yolo.inference_frames],
              ['Raw Detections', metrics.yolo.raw_detections],
              ['Validated', metrics.yolo.validated_detections],
              ['Rejected (geo)', metrics.yolo.rejected_detections],
              ['Avg Confidence', fmt(metrics.yolo.avg_confidence)],
              ['Max Confidence', fmt(metrics.yolo.max_confidence)],
              ['Min Confidence', fmt(metrics.yolo.min_confidence)],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-[11px] text-gray-500">{String(label)}</span>
                <span className="text-[11px] font-mono font-medium text-gray-700">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MTCNN metrics */}
      {metrics.mtcnn && (
        <Card title="mtcnn face detector">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ['Inference Frames', metrics.mtcnn.inference_frames],
              ['Face Detected', metrics.mtcnn.face_detected_frames],
              ['Face Absent', metrics.mtcnn.face_absent_frames],
              ['Violation Frames', metrics.mtcnn.violation_frames],
              ['Avg Confidence', fmt(metrics.mtcnn.avg_confidence)],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-[11px] text-gray-500">{String(label)}</span>
                <span className="text-[11px] font-mono font-medium text-gray-700">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
