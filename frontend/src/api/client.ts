import axios from 'axios';
import type {
  DetectionState,
  SessionStats,
  Alert,
  GazeDistribution,
  SessionReport,
  Config,
  ViolationType,
} from '../types';
import { SEVERITY_MAP } from '../types';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const api = axios.create({ baseURL: BASE_URL, timeout: 5000 });

/* ------------------------------------------------------------------ */
/*  Mock data factories                                                */
/* ------------------------------------------------------------------ */

const mockDetectionState: DetectionState = {
  face_present: true,
  gaze_direction: 'center',
  eye_ratio: 0.31,
  mouth_moving: false,
  multiple_faces: false,
  objects_detected: false,
  detected_object_label: '',
  hand_violation: false,
  hand_violation_msg: '',
  eye_alarming: false,
  mouth_alarming: false,
  timestamp: new Date().toISOString(),
};

const mockSessionStats: SessionStats = {
  total_alerts: 3,
  face_absent_duration: 4.2,
  gaze_deviations: 7,
  risk_score: 38,
  session_start: new Date(Date.now() - 42 * 60_000).toISOString(),
  student_name: 'John Doe',
  student_id: 'STUDENT_001',
  exam_name: 'Computer Science 101 — Final',
};

function mockAlert(
  i: number,
  type: ViolationType,
  message: string,
  minutesAgo: number,
): Alert {
  const t = new Date(Date.now() - minutesAgo * 60_000);
  return {
    id: `mock-${i}`,
    type,
    message,
    timestamp: t.toLocaleTimeString('en-US', { hour12: false }),
    severity: SEVERITY_MAP[type],
  };
}

const mockAlerts: Alert[] = [
  mockAlert(1, 'GAZE_AWAY', 'Gaze deviated to the left for 3.2 s', 1),
  mockAlert(2, 'MOUTH_MOVING', 'Excessive mouth movement detected', 4),
  mockAlert(3, 'FACE_DISAPPEARED', 'Face not visible for 6 s', 7),
  mockAlert(4, 'OBJECT_DETECTED', 'Cell phone detected (87 %)', 12),
  mockAlert(5, 'MULTIPLE_FACES', '2 faces detected for 8 frames', 18),
  mockAlert(6, 'VOICE_DETECTED', 'Voice activity detected', 22),
  mockAlert(7, 'HAND_VIOLATION', 'Suspicious hand near frame edge', 30),
];

const mockGaze: GazeDistribution = { left: 18, center: 72, right: 10 };

function mockViolation(
  type: ViolationType,
  minutesAgo: number,
): import('../types').ViolationRecord {
  return {
    type,
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    metadata: { duration: 'Detected' },
    severity: SEVERITY_MAP[type],
  };
}

const mockReports: SessionReport[] = [
  {
    id: 'sess-001',
    student_name: 'John Doe',
    student_id: 'STU001',
    exam_name: 'CS 101 Final',
    date: '2026-04-09',
    duration_minutes: 58,
    total_violations: 7,
    risk_score: 62,
    violations: [
      mockViolation('OBJECT_DETECTED', 5),
      mockViolation('GAZE_AWAY', 12),
      mockViolation('MOUTH_MOVING', 18),
      mockViolation('FACE_DISAPPEARED', 25),
      mockViolation('MULTIPLE_FACES', 32),
      mockViolation('HAND_VIOLATION', 40),
      mockViolation('VOICE_DETECTED', 50),
    ],
  },
  {
    id: 'sess-002',
    student_name: 'Alice Chen',
    student_id: 'STU002',
    exam_name: 'Math 201 Midterm',
    date: '2026-04-08',
    duration_minutes: 45,
    total_violations: 2,
    risk_score: 18,
    violations: [
      mockViolation('GAZE_AWAY', 10),
      mockViolation('FACE_DISAPPEARED', 30),
    ],
  },
  {
    id: 'sess-003',
    student_name: 'Raj Patel',
    student_id: 'STU003',
    exam_name: 'Physics 301 Final',
    date: '2026-04-08',
    duration_minutes: 72,
    total_violations: 11,
    risk_score: 85,
    violations: [
      mockViolation('OBJECT_DETECTED', 3),
      mockViolation('OBJECT_DETECTED', 8),
      mockViolation('MULTIPLE_FACES', 14),
      mockViolation('HAND_VIOLATION', 20),
      mockViolation('MOUTH_MOVING', 25),
      mockViolation('VOICE_DETECTED', 28),
      mockViolation('SPEECH_VIOLATION', 33),
      mockViolation('GAZE_AWAY', 40),
      mockViolation('GAZE_AWAY', 48),
      mockViolation('FACE_DISAPPEARED', 55),
      mockViolation('HAND_VIOLATION', 62),
    ],
  },
  {
    id: 'sess-004',
    student_name: 'Emily Watson',
    student_id: 'STU004',
    exam_name: 'English 102 Quiz',
    date: '2026-04-07',
    duration_minutes: 30,
    total_violations: 0,
    risk_score: 5,
    violations: [],
  },
  {
    id: 'sess-005',
    student_name: 'Carlos Reyes',
    student_id: 'STU005',
    exam_name: 'Chem 201 Lab',
    date: '2026-04-07',
    duration_minutes: 50,
    total_violations: 4,
    risk_score: 42,
    violations: [
      mockViolation('MOUTH_MOVING', 10),
      mockViolation('GAZE_AWAY', 20),
      mockViolation('FACE_DISAPPEARED', 35),
      mockViolation('VOICE_DETECTED', 45),
    ],
  },
  {
    id: 'sess-006',
    student_name: 'Mia Thompson',
    student_id: 'STU006',
    exam_name: 'History 101 Final',
    date: '2026-04-06',
    duration_minutes: 65,
    total_violations: 3,
    risk_score: 29,
    violations: [
      mockViolation('GAZE_AWAY', 15),
      mockViolation('MOUTH_MOVING', 30),
      mockViolation('FACE_DISAPPEARED', 50),
    ],
  },
];

const mockConfig: Config = {
  detection: {
    face: { detection_interval: 5, min_confidence: 0.8 },
    eyes: { gaze_threshold: 2, blink_threshold: 0.3, gaze_sensitivity: 15 },
    mouth: { movement_threshold: 8 },
    multi_face: { alert_threshold: 5 },
    objects: { min_confidence: 0.65, detection_interval: 3 },
    audio_monitoring: {
      enabled: true,
      energy_threshold: 0.001,
      zcr_threshold: 0.35,
      whisper_enabled: false,
    },
  },
  logging: {
    alert_cooldown: 5,
    alert_system: { voice_alerts: true, alert_volume: 0.8, cooldown: 10 },
  },
  screen: { recording: true, fps: 15 },
};

/* ------------------------------------------------------------------ */
/*  API functions (with mock fallback)                                 */
/* ------------------------------------------------------------------ */

export async function getDetectionState(): Promise<DetectionState> {
  try {
    const { data } = await api.get<DetectionState>('/api/detection/state');
    return data;
  } catch {
    return { ...mockDetectionState, timestamp: new Date().toISOString() };
  }
}

export async function getSessionStats(): Promise<SessionStats> {
  try {
    const { data } = await api.get<SessionStats>('/api/session/stats');
    return data;
  } catch {
    return { ...mockSessionStats };
  }
}

export async function getAlerts(limit = 20): Promise<Alert[]> {
  try {
    const { data } = await api.get<Alert[]>('/api/alerts', {
      params: { limit },
    });
    return data;
  } catch {
    return mockAlerts.slice(0, limit);
  }
}

export async function getGazeDistribution(): Promise<GazeDistribution> {
  try {
    const { data } = await api.get<GazeDistribution>('/api/gaze/distribution');
    return data;
  } catch {
    return { ...mockGaze };
  }
}

export async function getSessionReports(): Promise<SessionReport[]> {
  try {
    const { data } = await api.get<SessionReport[]>('/api/reports');
    return data;
  } catch {
    return mockReports;
  }
}

export async function getSessionReport(id: string): Promise<SessionReport> {
  try {
    const { data } = await api.get<SessionReport>(`/api/reports/${id}`);
    return data;
  } catch {
    return (
      mockReports.find((r) => r.id === id) ?? mockReports[0]
    );
  }
}

export function getPdfReportUrl(id: string): string {
  return `${BASE_URL}/api/reports/${id}/pdf`;
}

export async function getConfig(): Promise<Config> {
  try {
    const { data } = await api.get<Config>('/api/config');
    return data;
  } catch {
    return { ...mockConfig };
  }
}

export async function updateConfig(config: Partial<Config>): Promise<void> {
  try {
    await api.post('/api/config', config);
  } catch {
    // silent – UI shows toast regardless
  }
}
