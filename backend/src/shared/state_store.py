"""
Shared State Store — File-based IPC between main.py and dashboard app.py.

main.py writes detection state, metrics, frames after each loop iteration.
app.py reads from these files on each API request.
Uses atomic writes (write-to-temp + rename) to prevent corruption.
"""

import json
import time
import threading
import cv2
import numpy as np
from pathlib import Path
from datetime import datetime


# ── Default data directory ──────────────────────────────────────────────
_STATE_DIR = Path(__file__).resolve().parent.parent.parent / "state"


def _ensure_dir():
    _STATE_DIR.mkdir(parents=True, exist_ok=True)


def _atomic_write_json(filename: str, data: dict):
    """Write JSON atomically: write to .tmp then rename."""
    _ensure_dir()
    target = _STATE_DIR / filename
    tmp = _STATE_DIR / f"{filename}.tmp"
    try:
        with open(tmp, "w") as f:
            json.dump(data, f)
        tmp.replace(target)
    except Exception:
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass


def _read_json(filename: str, default=None):
    """Read JSON file, return default on failure."""
    target = _STATE_DIR / filename
    try:
        if target.exists():
            with open(target, "r") as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError):
        pass
    return default if default is not None else {}


# ══════════════════════════════════════════════════════════════════════════
#  WRITERS — called by main.py after each frame
# ══════════════════════════════════════════════════════════════════════════

_frame_lock = threading.Lock()
_latest_frame_bytes: bytes | None = None


def write_detection_state(state: dict):
    """Write current detection state (face, gaze, mouth, objects, etc.)."""
    _atomic_write_json("detection_state.json", state)


def write_session_stats(stats: dict):
    """Write session statistics (alerts count, face absent duration, etc.)."""
    _atomic_write_json("session_stats.json", stats)


def write_gaze_distribution(gaze: dict):
    """Write gaze distribution percentages."""
    _atomic_write_json("gaze_distribution.json", gaze)


def write_metrics(metrics: dict):
    """Write ML performance metrics from MetricsTracker."""
    _atomic_write_json("metrics.json", metrics)


def write_frame(frame: np.ndarray, quality: int = 75):
    """Encode the annotated frame as JPEG and store in memory + disk."""
    global _latest_frame_bytes
    try:
        _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        data = buf.tobytes()
        with _frame_lock:
            _latest_frame_bytes = data
        # Also write to disk for the MJPEG endpoint
        _ensure_dir()
        frame_path = _STATE_DIR / "latest_frame.jpg"
        tmp_path = _STATE_DIR / "latest_frame.jpg.tmp"
        with open(tmp_path, "wb") as f:
            f.write(data)
        tmp_path.replace(frame_path)
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════
#  READERS — called by app.py on each API request
# ══════════════════════════════════════════════════════════════════════════

def read_detection_state() -> dict:
    return _read_json("detection_state.json", {
        "face_present": False,
        "gaze_direction": "center",
        "eye_ratio": 0.0,
        "mouth_moving": False,
        "multiple_faces": False,
        "objects_detected": False,
        "detected_object_label": "",
        "hand_violation": False,
        "hand_violation_msg": "",
        "eye_alarming": False,
        "mouth_alarming": False,
        "timestamp": "",
    })


def read_session_stats() -> dict:
    return _read_json("session_stats.json", {
        "total_alerts": 0,
        "face_absent_duration": 0.0,
        "gaze_deviations": 0,
        "risk_score": 0,
        "session_start": datetime.now().isoformat(),
        "student_name": "",
        "student_id": "",
        "exam_name": "",
    })


def read_gaze_distribution() -> dict:
    return _read_json("gaze_distribution.json", {
        "left": 0,
        "center": 100,
        "right": 0,
    })


def read_metrics() -> dict:
    return _read_json("metrics.json", {})


def read_frame_bytes() -> bytes | None:
    """Read the latest JPEG frame bytes (from memory first, then disk)."""
    global _latest_frame_bytes
    with _frame_lock:
        if _latest_frame_bytes:
            return _latest_frame_bytes
    # Fallback: read from disk
    frame_path = _STATE_DIR / "latest_frame.jpg"
    try:
        if frame_path.exists():
            return frame_path.read_bytes()
    except IOError:
        pass
    return None
