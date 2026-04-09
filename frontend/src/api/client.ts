import axios from 'axios';
import type {
  DetectionState,
  SessionStats,
  Alert,
  GazeDistribution,
  SessionReport,
  Config,
  MetricsData,
  ViolationType,
} from '../types';
import { SEVERITY_MAP } from '../types';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 5000 });

/* ------------------------------------------------------------------ */
/*  API functions — all real, no mock data                             */
/* ------------------------------------------------------------------ */

export async function getDetectionState(): Promise<DetectionState> {
  const { data } = await api.get<DetectionState>('/api/detection/state');
  return data;
}

export async function getSessionStats(): Promise<SessionStats> {
  const { data } = await api.get<SessionStats>('/api/session/stats');
  return data;
}

export async function getAlerts(limit = 20): Promise<Alert[]> {
  const { data } = await api.get('/api/alerts', { params: { limit } });
  // Backend returns AlertEntry[] — normalize to frontend Alert format
  if (!Array.isArray(data)) return [];
  return data.map((a: Record<string, unknown>, i: number) => ({
    id: String(a.id ?? `alert-${i}`),
    type: String(a.violation_type ?? a.type ?? 'UNKNOWN') as ViolationType,
    message: String(a.message ?? ''),
    timestamp: String(a.timestamp ?? ''),
    severity: (a.severity ?? SEVERITY_MAP[String(a.violation_type ?? a.type ?? '') as keyof typeof SEVERITY_MAP] ?? 1) as 1|2|3|4|5,
  }));
}

export async function getGazeDistribution(): Promise<GazeDistribution> {
  const { data } = await api.get<GazeDistribution>('/api/gaze/distribution');
  return data;
}

export async function getSessionReports(): Promise<SessionReport[]> {
  const { data } = await api.get('/api/reports');
  if (!Array.isArray(data)) return [];
  // Backend returns ReportEntry[] (file listings) — convert to frontend SessionReport[]
  // For the live session, we also try to fetch the actual report data
  return data.map((r: Record<string, unknown>, i: number) => ({
    id: String(r.id ?? r.name ?? `report-${i}`),
    student_name: String(r.student_name ?? 'Student'),
    student_id: String(r.student_id ?? ''),
    exam_name: String(r.exam_name ?? r.name ?? 'Exam'),
    date: String(r.date ?? r.created ?? ''),
    duration_minutes: Number(r.duration_minutes ?? 0),
    total_violations: Number(r.total_violations ?? 0),
    risk_score: Number(r.risk_score ?? 0),
    violations: Array.isArray(r.violations) ? r.violations : [],
  })) as SessionReport[];
}

export async function getSessionReport(id: string): Promise<SessionReport> {
  const { data } = await api.get<SessionReport>(`/api/reports/${id}`);
  return data;
}

export function getPdfReportUrl(id: string): string {
  return `${BASE_URL}/api/reports/${id}/pdf`;
}

export async function getConfig(): Promise<Config> {
  const { data } = await api.get<Config>('/api/config');
  return data;
}

export async function updateConfig(config: Partial<Config>): Promise<void> {
  await api.post('/api/config', config);
}

export async function getMetrics(): Promise<MetricsData> {
  const { data } = await api.get<MetricsData>('/api/metrics');
  return data;
}

export function getVideoFeedUrl(): string {
  return `${BASE_URL}/api/video/feed`;
}

export async function startSession(studentId: string, studentName?: string, examName?: string): Promise<void> {
  await api.post('/api/session/start', {
    student_id: studentId,
    student_name: studentName,
    exam_name: examName,
  });
}

export async function stopSession(): Promise<void> {
  await api.post('/api/session/stop');
}
