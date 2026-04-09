export type GazeDirection = 'left' | 'center' | 'right';
export type DetectorStatus = 'ok' | 'warning' | 'alert';
export type ViolationType =
  | 'FACE_DISAPPEARED'
  | 'GAZE_AWAY'
  | 'MOUTH_MOVING'
  | 'VOICE_DETECTED'
  | 'MULTIPLE_FACES'
  | 'OBJECT_DETECTED'
  | 'HAND_VIOLATION'
  | 'SPEECH_VIOLATION';

export interface DetectionState {
  face_present: boolean;
  gaze_direction: GazeDirection;
  eye_ratio: number;
  mouth_moving: boolean;
  multiple_faces: boolean;
  objects_detected: boolean;
  detected_object_label: string;
  hand_violation: boolean;
  hand_violation_msg: string;
  eye_alarming: boolean;
  mouth_alarming: boolean;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: ViolationType;
  message: string;
  timestamp: string;
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface SessionStats {
  total_alerts: number;
  face_absent_duration: number;
  gaze_deviations: number;
  risk_score: number;
  session_start: string;
  student_name: string;
  student_id: string;
  exam_name: string;
}

export interface GazeDistribution {
  left: number;
  center: number;
  right: number;
}

export interface ViolationRecord {
  type: ViolationType;
  timestamp: string;
  metadata: Record<string, unknown>;
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface SessionReport {
  id: string;
  student_name: string;
  student_id: string;
  exam_name: string;
  date: string;
  duration_minutes: number;
  total_violations: number;
  risk_score: number;
  violations: ViolationRecord[];
}

export interface Config {
  detection: {
    face: { detection_interval: number; min_confidence: number };
    eyes: {
      gaze_threshold: number;
      blink_threshold: number;
      gaze_sensitivity: number;
    };
    mouth: { movement_threshold: number };
    multi_face: { alert_threshold: number };
    objects: { min_confidence: number; detection_interval: number };
    audio_monitoring: {
      enabled: boolean;
      energy_threshold: number;
      zcr_threshold: number;
      whisper_enabled: boolean;
    };
  };
  logging: {
    alert_cooldown: number;
    alert_system: {
      voice_alerts: boolean;
      alert_volume: number;
      cooldown: number;
    };
  };
  screen: { recording: boolean; fps: number };
}

export const SEVERITY_MAP: Record<ViolationType, 1 | 2 | 3 | 4 | 5> = {
  FACE_DISAPPEARED: 1,
  GAZE_AWAY: 2,
  MOUTH_MOVING: 3,
  VOICE_DETECTED: 3,
  SPEECH_VIOLATION: 3,
  MULTIPLE_FACES: 4,
  OBJECT_DETECTED: 5,
  HAND_VIOLATION: 5,
};

/* ── Lockdown / Browser-integrity types ───────────────────────────── */

export type LockdownViolationType =
  | 'fullscreen_exit'
  | 'tab_switch'
  | 'window_blur'
  | 'right_click'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'devtools_open'
  | 'keyboard_shortcut'
  | 'screen_record_detected'
  | 'multiple_displays_detected'
  | 'external_device_connected'
  | 'display_change_detected'
  | 'bluetooth_device_detected'
  | 'serial_device_detected';

export interface LockdownViolation {
  id: string;
  type: LockdownViolationType;
  timestamp: number;      // Date.now()
  label: string;          // Human-readable label
  severity: 'low' | 'medium' | 'high';
}

/* ── ML Metrics types (from MetricsTracker.to_dict()) ─────────── */

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1_score: number;
  mcc: number;
}

export interface YoloMetrics {
  inference_frames: number;
  raw_detections: number;
  validated_detections: number;
  rejected_detections: number;
  avg_confidence: number;
  max_confidence: number;
  min_confidence: number;
}

export interface MtcnnMetrics {
  inference_frames: number;
  face_detected_frames: number;
  face_absent_frames: number;
  violation_frames: number;
  avg_confidence: number;
}

export interface MetricsData {
  session_duration_s: number;
  total_frames: number;
  avg_fps: number;
  confusion_matrix: ConfusionMatrix;
  classification: ClassificationMetrics;
  per_detector_triggers: Record<string, number>;
  ground_truth_active: boolean;
  yolo?: YoloMetrics;
  mtcnn?: MtcnnMetrics;
}

