/**
 * localStorage persistence for session reports.
 * Reports are stored as an array under key 'proctor_session_reports'.
 */

import type { SessionReport } from '../types';

const STORAGE_KEY = 'proctor_session_reports';

/** Get all stored session reports from localStorage */
export function getStoredReports(): SessionReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save a new session report to localStorage */
export function saveReport(report: SessionReport): void {
  try {
    const reports = getStoredReports();
    // Prevent duplicates
    const existing = reports.findIndex(r => r.id === report.id);
    if (existing >= 0) {
      reports[existing] = report;
    } else {
      reports.unshift(report); // newest first
    }
    // Keep max 50 reports
    const trimmed = reports.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/** Clear all stored reports */
export function clearStoredReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
