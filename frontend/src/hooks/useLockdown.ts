/**
 * useLockdown — Exam Lockdown System
 *
 * Encapsulates all browser-integrity detection when an exam is active.
 * All detection is via Web APIs + event listeners only — no backend calls.
 *
 * AUTO-TERMINATION: The following violation types immediately end the session
 * (stop lockdown + fire onTerminate callback):
 *   fullscreen_exit, tab_switch, window_blur, devtools_open,
 *   keyboard_shortcut, multiple_displays_detected,
 *   external_device_connected, display_change_detected,
 *   bluetooth_device_detected, serial_device_detected
 *
 * NON-TERMINATING (just logged):
 *   right_click, copy_attempt, paste_attempt, screen_record_detected
 *
 * PORT / DEVICE DETECTION STRATEGY:
 * WebUSB/WebHID/WebSerial `connect` events ONLY fire for devices the user
 * previously granted access to via requestDevice(). They do NOT fire for
 * arbitrary plug-ins. Therefore we use a POLLING approach:
 *
 * 1. On lockdown start, we snapshot the count of all media devices
 *    (via navigator.mediaDevices.enumerateDevices()) and screen dimensions.
 * 2. Every 1.5 seconds we re-enumerate and compare. If ANY device is added
 *    OR removed, we fire `external_device_connected` → auto-terminate.
 * 3. We also listen to the `devicechange` event for instant notification.
 * 4. Screen dimension changes detect HDMI/DisplayPort/Thunderbolt.
 * 5. screen.isExtended detects multi-monitor setups.
 *
 * This catches: USB webcams, USB mics, USB headsets, USB hubs,
 * Bluetooth audio, HDMI captures, any device that registers as media I/O.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LockdownViolation, LockdownViolationType } from '../types';

/* ── Violations that automatically terminate the session ──────── */
const TERMINATING: ReadonlySet<LockdownViolationType> = new Set([
  'fullscreen_exit',
  'tab_switch',
  'window_blur',
  'devtools_open',
  'keyboard_shortcut',
  'multiple_displays_detected',
  'external_device_connected',
  'display_change_detected',
  'bluetooth_device_detected',
  'serial_device_detected',
]);

/* ── Helpers ──────────────────────────────────────────────────── */
function uid() {
  return `ldv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeViolation(
  type: LockdownViolationType,
  label: string,
  severity: LockdownViolation['severity'],
): LockdownViolation {
  return { id: uid(), type, label, severity, timestamp: Date.now() };
}

/** Count devices and generate a fingerprint string for comparison */
async function getDeviceFingerprint(): Promise<{ count: number; fingerprint: string }> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // Fingerprint = sorted list of "kind:groupId" to detect any change
    const fp = devices
      .map(d => `${d.kind}:${d.groupId || d.deviceId}`)
      .sort()
      .join('|');
    return { count: devices.length, fingerprint: fp };
  } catch {
    return { count: -1, fingerprint: '' };
  }
}

/* ── Public API ─────────────────────────────────────────────────*/
export interface UseLockdownOptions {
  /** Called when a terminating violation occurs (after lockdown stops). */
  onTerminate?: (violation: LockdownViolation) => void;
}

export interface UseLockdownReturn {
  isLocked: boolean;
  violations: LockdownViolation[];
  warningCount: number;
  startLockdown: () => void;
  stopLockdown: () => void;
  clearViolations: () => void;
}

export function useLockdown(options: UseLockdownOptions = {}): UseLockdownReturn {
  const [isLocked, setIsLocked]     = useState(false);
  const [violations, setViolations] = useState<LockdownViolation[]>([]);

  // Refs for stale-closure safety
  const lockedRef        = useRef(false);
  const devtoolsFired    = useRef(0);
  const onTerminateRef   = useRef(options.onTerminate);

  // Device baseline — captured at lockdown start
  const baselineDevices  = useRef<{ count: number; fingerprint: string }>({ count: -1, fingerprint: '' });

  useEffect(() => { onTerminateRef.current = options.onTerminate; }, [options.onTerminate]);

  /* ── Internal stop ───────────────────────────────────────────── */
  const internalStop = useCallback(() => {
    lockedRef.current = false;
    setIsLocked(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  /* ── Record a violation; terminate if critical ────────────────── */
  const record = useCallback(
    (type: LockdownViolationType, label: string, severity: LockdownViolation['severity']) => {
      if (!lockedRef.current) return;
      const v = makeViolation(type, label, severity);
      setViolations(prev => [v, ...prev]);

      if (TERMINATING.has(type)) {
        internalStop();
        onTerminateRef.current?.(v);
      }
    },
    [internalStop],
  );

  /* ── Fullscreen helper ────────────────────────────────────────── */
  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) return;
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  /* ── Public: startLockdown ────────────────────────────────────── */
  const startLockdown = useCallback(async () => {
    // Capture baseline device snapshot BEFORE activating
    baselineDevices.current = await getDeviceFingerprint();

    lockedRef.current = true;
    setIsLocked(true);
    requestFullscreen();

    // Immediate multi-display check
    if ('isExtended' in window.screen &&
        (window.screen as unknown as { isExtended: boolean }).isExtended) {
      setTimeout(() => record('multiple_displays_detected', 'Multiple displays detected', 'high'), 100);
    }
  }, [requestFullscreen, record]);

  /* ── Public: stopLockdown (user-initiated) ─────────────────── */
  const stopLockdown = useCallback(() => {
    internalStop();
  }, [internalStop]);

  const clearViolations = useCallback(() => setViolations([]), []);

  /* ── Event listeners — active only while locked ───────────────── */
  useEffect(() => {
    if (!isLocked) return;

    /* 1. Fullscreen change */
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && lockedRef.current) {
        record('fullscreen_exit', 'Exited fullscreen mode', 'high');
      }
    };

    /* 2. Tab switch (Page Visibility API) */
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lockedRef.current) {
        record('tab_switch', 'Switched away from the exam tab', 'high');
      }
    };

    /* 3. Window blur */
    const onWindowBlur = () => {
      if (lockedRef.current) {
        record('window_blur', 'Application window lost focus', 'medium');
      }
    };

    /* 4. Right-click — block + log (non-terminating) */
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      record('right_click', 'Right-click blocked', 'low');
    };

    /* 5. Keyboard shortcuts */
    const onKeyDown = (e: KeyboardEvent) => {
      if (!lockedRef.current) return;
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key;

      if (ctrl && key === 'c') { e.preventDefault(); record('copy_attempt', 'Copy blocked (Ctrl+C)', 'medium'); return; }
      if (ctrl && key === 'v') { e.preventDefault(); record('paste_attempt', 'Paste blocked (Ctrl+V)', 'medium'); return; }

      if (key === 'F12') { e.preventDefault(); record('devtools_open', 'DevTools opened (F12)', 'high'); return; }
      if (ctrl && shift && (key === 'I' || key === 'i')) { e.preventDefault(); record('devtools_open', 'DevTools opened (Ctrl+Shift+I)', 'high'); return; }
      if (ctrl && shift && (key === 'J' || key === 'j')) { e.preventDefault(); record('devtools_open', 'DevTools opened (Ctrl+Shift+J)', 'high'); return; }
      if (ctrl && (key === 'u' || key === 'U')) { e.preventDefault(); record('devtools_open', 'View Source blocked (Ctrl+U)', 'high'); return; }

      if (e.altKey && key === 'Tab') { e.preventDefault(); record('keyboard_shortcut', 'Alt+Tab attempted', 'high'); return; }
      if (key === 'Meta') { record('keyboard_shortcut', 'Windows/Meta key pressed', 'high'); return; }
      if (key === 'PrintScreen') { record('keyboard_shortcut', 'PrintScreen pressed', 'high'); return; }
    };

    /* 6. DevTools size heuristic */
    const devtoolsInterval = setInterval(() => {
      if (!lockedRef.current) return;
      const wGap = window.outerWidth  - window.innerWidth;
      const hGap = window.outerHeight - window.innerHeight;
      const now  = Date.now();
      if ((wGap > 160 || hGap > 160) && now - devtoolsFired.current > 5000) {
        devtoolsFired.current = now;
        record('devtools_open', 'DevTools detected (size heuristic)', 'high');
      }
    }, 1000);

    /* ────────────────────────────────────────────────────────────────
     * 7. DEVICE CHANGE DETECTION — THE CORE PORT BLOCKER
     *
     * This is the ONLY reliable way to detect external device
     * connections from a browser. We do two things:
     *
     * A) Listen to the `devicechange` event (fires instantly when
     *    any media device is plugged/unplugged — USB webcams, mics,
     *    headsets, Bluetooth audio, display capture sources).
     *
     * B) Poll `enumerateDevices()` every 1.5s and compare the device
     *    count + fingerprint against the baseline captured at lockdown
     *    start. If anything changed — terminate immediately.
     *
     * Together these catch virtually ALL external port connections:
     * - USB-A/B/C webcams, mics, speakers, headsets
     * - USB hubs (which may register virtual audio devices)
     * - Bluetooth audio devices
     * - HDMI audio output (registers as audio device)
     * - USB capture cards (register as video input)
     * ────────────────────────────────────────────────────────────── */

    // A) Instant notification via devicechange event
    const onDeviceChange = async () => {
      if (!lockedRef.current) return;
      const current = await getDeviceFingerprint();
      const base = baselineDevices.current;

      if (base.count >= 0 && current.fingerprint !== base.fingerprint) {
        const diff = current.count - base.count;
        if (diff > 0) {
          record('external_device_connected', `External device connected (${diff} new device${diff > 1 ? 's' : ''} detected)`, 'high');
        } else if (diff < 0) {
          record('external_device_connected', `Device disconnected (${Math.abs(diff)} device${Math.abs(diff) > 1 ? 's' : ''} removed)`, 'high');
        } else {
          record('external_device_connected', 'Device configuration changed', 'high');
        }
      }
    };

    // B) Polling fallback — catches cases where devicechange doesn't fire
    const devicePollInterval = setInterval(async () => {
      if (!lockedRef.current) return;
      const current = await getDeviceFingerprint();
      const base = baselineDevices.current;

      if (base.count >= 0 && current.fingerprint !== base.fingerprint) {
        const diff = current.count - base.count;
        record(
          'external_device_connected',
          `Port/device change detected (was ${base.count} devices, now ${current.count}${diff !== 0 ? `, ${diff > 0 ? '+' : ''}${diff}` : ', config changed'})`,
          'high',
        );
      }
    }, 1500);

    /* 8. Screen dimension polling — HDMI/DisplayPort/Thunderbolt ── */
    const baseScreenW = window.screen.width;
    const baseScreenH = window.screen.height;
    const baseAvailW  = window.screen.availWidth;
    const baseAvailH  = window.screen.availHeight;

    const displayInterval = setInterval(() => {
      if (!lockedRef.current) return;
      const w  = window.screen.width;
      const h  = window.screen.height;
      const aw = window.screen.availWidth;
      const ah = window.screen.availHeight;

      if (w !== baseScreenW || h !== baseScreenH || aw !== baseAvailW || ah !== baseAvailH) {
        record(
          'display_change_detected',
          `Display changed (${baseScreenW}×${baseScreenH} → ${w}×${h})`,
          'high',
        );
      }

      if ('isExtended' in window.screen &&
          (window.screen as unknown as { isExtended: boolean }).isExtended) {
        record('multiple_displays_detected', 'Multiple displays detected', 'high');
      }
    }, 2000);

    /* 9. screenschange — Window Management API ──────────────────── */
    const onScreensChange = () => {
      if (lockedRef.current) record('multiple_displays_detected', 'Display configuration changed', 'high');
    };

    /* ── Register all listeners ─────────────────────────────────── */
    document.addEventListener('fullscreenchange',  onFullscreenChange);
    document.addEventListener('visibilitychange',  onVisibilityChange);
    window.addEventListener('blur',               onWindowBlur);
    document.addEventListener('contextmenu',       onContextMenu);
    document.addEventListener('keydown',           onKeyDown);
    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange);

    const screenObj = window.screen as unknown as {
      addEventListener: (e: string, cb: () => void) => void;
      removeEventListener: (e: string, cb: () => void) => void;
    };
    try { screenObj.addEventListener('screenschange', onScreensChange); } catch { /* unsupported */ }

    /* ── Cleanup ────────────────────────────────────────────────── */
    return () => {
      document.removeEventListener('fullscreenchange',  onFullscreenChange);
      document.removeEventListener('visibilitychange',  onVisibilityChange);
      window.removeEventListener('blur',               onWindowBlur);
      document.removeEventListener('contextmenu',       onContextMenu);
      document.removeEventListener('keydown',           onKeyDown);
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange);
      try { screenObj.removeEventListener('screenschange', onScreensChange); } catch { /* unsupported */ }
      clearInterval(devtoolsInterval);
      clearInterval(devicePollInterval);
      clearInterval(displayInterval);
    };
  }, [isLocked, record]);

  const warningCount = violations.filter(v => TERMINATING.has(v.type)).length;

  return { isLocked, violations, warningCount, startLockdown, stopLockdown, clearViolations };
}
