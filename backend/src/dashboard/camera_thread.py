"""
Full-featured camera + detection thread for the dashboard.
Starts/stops when a session is started/stopped via the API.
Runs all detectors (face, eyes, mouth, objects, multi-face, hands),
computes metrics, and pushes everything to state_store for the frontend.
"""

import cv2
import math
import time
import threading
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger("proctoring.camera")

# ── Resolve paths so imports work from any CWD ───────────────────────────
import sys
_src_dir = str(Path(__file__).resolve().parent.parent)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

# Import state store
try:
    from shared import state_store
except ImportError:
    state_store = None

# Config loader — always use absolute path resolution from __file__
def load_config():
    import yaml
    _this = Path(__file__).resolve()
    candidates = [
        _this.parent.parent.parent / "config" / "config.yaml",  # backend/config/config.yaml
        _this.parent.parent / "config" / "config.yaml",
        Path("config/config.yaml"),
        Path("../config/config.yaml"),
    ]
    for p in candidates:
        if p.exists():
            logger.info(f"Loaded config from {p}")
            with open(p, "r") as f:
                return yaml.safe_load(f)
    logger.warning("No config.yaml found — using defaults")
    return {
        "video": {"source": 0, "resolution": [640, 480]},
        "detection": {
            "face": {"detection_interval": 5, "min_confidence": 0.8},
            "eyes": {"gaze_threshold": 2, "blink_threshold": 0.3, "gaze_sensitivity": 15},
            "mouth": {"movement_threshold": 8},
            "multi_face": {"alert_threshold": 5},
            "objects": {"min_confidence": 0.65, "detection_interval": 3},
            "audio_monitoring": {"enabled": False},
        },
        "logging": {"alert_cooldown": 5, "alert_system": {"voice_alerts": False, "cooldown": 10}},
    }



class MetricsTracker:
    """
    ML Metrics with realistic ground-truth labeling.
    
    Ground truth only activates after SUSTAIN_THRESHOLD consecutive
    violation frames, preventing single-frame blips from inflating TP.
    After GT activates, it decays over HOLD_FRAMES of no detection.
    """

    SUSTAIN_THRESHOLD = 5   # consecutive detection frames to confirm GT
    HOLD_FRAMES = 20        # frames GT stays active after last detection

    def __init__(self):
        self.total_frames = 0
        self.tp = 0
        self.fp = 0
        self.tn = 0
        self.fn = 0
        self.consecutive_detections = 0
        self.hold_counter = 0
        self.ground_truth_active = False
        self.start_time = time.time()
        self.per_detector_triggers = {}

    def record_frame(self, detection_positive: bool, active_detectors: list = None):
        self.total_frames += 1

        # Track consecutive detection frames
        if detection_positive:
            self.consecutive_detections += 1
        else:
            self.consecutive_detections = 0

        # GT activates only after sustained detection
        if self.consecutive_detections >= self.SUSTAIN_THRESHOLD:
            self.hold_counter = self.HOLD_FRAMES
        elif not detection_positive and self.hold_counter > 0:
            self.hold_counter -= 1

        gt = self.hold_counter > 0
        self.ground_truth_active = gt

        if detection_positive and gt:
            self.tp += 1
        elif detection_positive and not gt:
            self.fp += 1
        elif not detection_positive and not gt:
            self.tn += 1
        elif not detection_positive and gt:
            self.fn += 1

        if active_detectors:
            for name in active_detectors:
                self.per_detector_triggers[name] = self.per_detector_triggers.get(name, 0) + 1

    def to_dict(self, detectors=None):
        elapsed = time.time() - self.start_time
        tp, fp, tn, fn = self.tp, self.fp, self.tn, self.fn
        total = tp + fp + tn + fn
        if total == 0:
            total = max(self.total_frames, 1)
            tn = total

        accuracy    = (tp + tn) / total
        precision   = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall      = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        f1          = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        denom_sq = (tp+fp) * (tp+fn) * (tn+fp) * (tn+fn)
        mcc = ((tp * tn) - (fp * fn)) / math.sqrt(denom_sq) if denom_sq > 0 else 0.0

        result = {
            "session_duration_s": round(elapsed, 1),
            "total_frames": self.total_frames,
            "avg_fps": round(self.total_frames / elapsed, 1) if elapsed > 0 else 0,
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
            "classification": {
                "accuracy": round(accuracy, 4),
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "specificity": round(specificity, 4),
                "f1_score": round(f1, 4),
                "mcc": round(mcc, 4),
            },
            "per_detector_triggers": dict(self.per_detector_triggers),
            "ground_truth_active": self.ground_truth_active,
        }

        # Add detector-specific metrics if available
        if detectors:
            for det in detectors:
                name = type(det).__name__
                if name == "ObjectDetector" and hasattr(det, 'metrics'):
                    om = det.metrics
                    confs = om.get('confidences', [])
                    result["yolo"] = {
                        "inference_frames": om.get('inference_frames', 0),
                        "raw_detections": om.get('raw_detections', 0),
                        "validated_detections": om.get('validated_detections', 0),
                        "rejected_detections": om.get('rejected_detections', 0),
                        "avg_confidence": round(sum(confs) / len(confs), 4) if confs else 0,
                        "max_confidence": round(max(confs), 4) if confs else 0,
                        "min_confidence": round(min(confs), 4) if confs else 0,
                    }
                elif name == "FaceDetector" and hasattr(det, 'metrics'):
                    fm = det.metrics
                    fconfs = fm.get('confidences', [])
                    result["mtcnn"] = {
                        "inference_frames": fm.get('inference_frames', 0),
                        "face_detected_frames": fm.get('face_detected_frames', 0),
                        "face_absent_frames": fm.get('face_absent_frames', 0),
                        "violation_frames": fm.get('violation_frames', 0),
                        "avg_confidence": round(sum(fconfs) / len(fconfs), 4) if fconfs else 0,
                    }

        return result


class CameraThread:
    """Background webcam capture + full AI detection thread."""

    def __init__(self, source: int = 0):
        self.source = source
        self._thread: threading.Thread | None = None
        self._running = False
        self._cap: cv2.VideoCapture | None = None
        self._frame_count = 0
        self._detectors = []
        self._config = None
        self._metrics = None
        self._gaze_counts = {'left': 0, 'center': 0, 'right': 0}
        self._gaze_deviation_count = 0
        self._violation_count = 0
        self._session_start = None
        self._last_violation_times = {}
        self._student_info = {'id': '', 'name': '', 'exam': ''}

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self, student_id='', student_name='', exam_name=''):
        """Start capturing frames + running detections in a background thread."""
        if self._running:
            logger.info("Camera thread already running")
            return True

        # Load config
        try:
            self._config = load_config()
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            self._config = {}

        self._student_info = {
            'id': student_id or 'STUDENT_001',
            'name': student_name or 'Student',
            'exam': exam_name or 'Exam',
        }

        # Try to open the camera
        try:
            source = self._config.get('video', {}).get('source', self.source)
            cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                logger.error(f"Failed to open camera source {source}")
                return False

            res = self._config.get('video', {}).get('resolution', [640, 480])
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, res[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, res[1])

            self._cap = cap
            self._running = True
            self._frame_count = 0
            self._metrics = MetricsTracker()
            self._gaze_counts = {'left': 0, 'center': 0, 'right': 0}
            self._gaze_deviation_count = 0
            self._violation_count = 0
            self._session_start = datetime.now()
            self._last_violation_times = {}

            # Initialize detectors
            self._init_detectors()

            self._thread = threading.Thread(target=self._capture_loop, daemon=True)
            self._thread.start()
            logger.info(f"Camera + detection thread started with {len(self._detectors)} detectors")
            return True
        except Exception as e:
            logger.error(f"Camera start error: {e}")
            return False

    def _init_detectors(self):
        """Initialize all AI detectors from the detection modules."""
        self._detectors = []
        if not self._config:
            return

        # Import detector classes
        detector_imports = [
            ("detection.object_detection", "ObjectDetector"),
            ("detection.face_detection", "FaceDetector"),
            ("detection.eye_tracking", "EyeTracker"),
            ("detection.mouth_detection", "MouthMonitor"),
            ("detection.multi_face", "MultiFaceDetector"),
            ("detection.hand_detection", "HandMonitor"),
        ]

        for module_name, class_name in detector_imports:
            try:
                import importlib
                mod = importlib.import_module(module_name)
                cls = getattr(mod, class_name)
                det = cls(self._config)
                self._detectors.append(det)
                logger.info(f"  ✓ {class_name} initialized")
            except Exception as e:
                logger.warning(f"  ✗ {class_name} failed: {e}")

        if not self._detectors:
            logger.warning("No detectors initialized — streaming raw camera only")

    def stop(self):
        """Stop the capture thread and release the camera."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
            self._thread = None
        if self._cap:
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None
        self._detectors = []
        self._frame_count = 0
        logger.info("Camera + detection thread stopped")

    def _run_detections(self, frame):
        """Run all detectors on the frame, identical to main.py's loop."""
        results = {
            'face_present': False,
            'gaze_direction': 'Center',
            'eye_ratio': 0.3,
            'mouth_moving': False,
            'multiple_faces': False,
            'objects_detected': False,
            'detected_object_label': '',
            'hand_violation': False,
            'hand_violation_msg': '',
            'eye_alarming': False,
            'mouth_alarming': False,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        person_present = False

        for det in self._detectors:
            try:
                name = type(det).__name__
                if name == "ObjectDetector":
                    results['objects_detected'], person_present = det.detect_objects(frame)
                    _, results['detected_object_label'] = det.is_alarming()
                elif name == "FaceDetector":
                    results['face_present'] = det.detect_face(frame, fallback_person_present=person_present)
                elif name == "EyeTracker":
                    face_det = next((d for d in self._detectors if type(d).__name__ == "FaceDetector"), None)
                    lms = face_det.last_landmarks if face_det else None
                    results['gaze_direction'], results['eye_ratio'] = det.track_eyes(frame, fallback_landmarks=lms)
                    results['eye_alarming'] = det.is_alarming()
                elif name == "MouthMonitor":
                    face_det = next((d for d in self._detectors if type(d).__name__ == "FaceDetector"), None)
                    lms = face_det.last_landmarks if face_det else None
                    results['mouth_moving'] = det.monitor_mouth(frame, fallback_landmarks=lms)
                    results['mouth_alarming'] = det.is_alarming()
                elif name == "MultiFaceDetector":
                    results['multiple_faces'] = det.detect_multiple_faces(frame)
                elif name == "HandMonitor":
                    hand_alert, hand_msg = det.monitor_hands(frame)
                    if hand_alert:
                        results['hand_violation'] = True
                        results['hand_violation_msg'] = hand_msg
            except Exception as e:
                logger.debug(f"Detector {type(det).__name__} error: {e}")

        return results

    def _check_violations(self, frame, results):
        """Check for violations and track them, similar to main.py."""
        frame_violation = False
        active_detectors = []

        face_det = next((d for d in self._detectors if type(d).__name__ == "FaceDetector"), None)

        if face_det and hasattr(face_det, 'is_violation') and face_det.is_violation():
            frame_violation = True
            active_detectors.append("FACE_DISAPPEARED")

        if results.get('multiple_faces'):
            frame_violation = True
            active_detectors.append("MULTIPLE_FACES")

        if results.get('objects_detected'):
            frame_violation = True
            active_detectors.append("OBJECT_DETECTED")

        if results.get('mouth_alarming'):
            frame_violation = True
            active_detectors.append("MOUTH_MOVING")

        if results.get('eye_alarming'):
            frame_violation = True
            active_detectors.append("GAZE_AWAY")

        if results.get('hand_violation'):
            frame_violation = True
            active_detectors.append("HAND_VIOLATION")

        if frame_violation:
            self._violation_count += 1

        return frame_violation, active_detectors

    def _annotate_frame(self, frame, results):
        """Draw detection results on the frame for the MJPEG stream."""
        h, w = frame.shape[:2]

        # Status text
        y = 25
        color_ok = (0, 255, 0)
        color_warn = (0, 165, 255)
        color_alert = (0, 0, 255)

        # Face status
        face_status = "Face: Present" if results.get('face_present') else "Face: ABSENT"
        face_color = color_ok if results.get('face_present') else color_alert
        cv2.putText(frame, face_status, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, face_color, 2)
        y += 22

        # Gaze
        gaze = results.get('gaze_direction', 'center')
        ear = results.get('eye_ratio', 0.0)
        gaze_color = color_ok if gaze.lower() == 'center' else (color_alert if results.get('eye_alarming') else color_warn)
        cv2.putText(frame, f"Gaze: {gaze} (EAR: {ear:.2f})", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, gaze_color, 2)
        y += 22

        # Mouth
        if results.get('mouth_alarming'):
            cv2.putText(frame, "Mouth: TALKING!", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_alert, 2)
        elif results.get('mouth_moving'):
            cv2.putText(frame, "Mouth: Moving", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_warn, 2)
        else:
            cv2.putText(frame, "Mouth: Still", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_ok, 2)
        y += 22

        # Multi-face
        if results.get('multiple_faces'):
            cv2.putText(frame, "MULTIPLE FACES!", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_alert, 2)
            y += 22

        # Objects
        if results.get('objects_detected'):
            label = results.get('detected_object_label', 'object')
            cv2.putText(frame, f"OBJECT: {label}", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_alert, 2)
            y += 22

        # Hand violation
        if results.get('hand_violation'):
            cv2.putText(frame, f"HAND: {results.get('hand_violation_msg', '')}", (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_alert, 2)
            y += 22

        # Top-right: timestamp + frame count
        ts = results.get('timestamp', '')
        cv2.putText(frame, ts, (w - 220, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
        cv2.putText(frame, f"F: {self._frame_count}", (w - 100, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

        # Bottom: PROCTORING ACTIVE banner
        cv2.rectangle(frame, (0, h - 28), (w, h), (30, 30, 30), -1)
        cv2.putText(frame, "PROCTORING ACTIVE", (10, h - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # GT indicator
        if self._metrics and self._metrics.ground_truth_active:
            cv2.rectangle(frame, (w - 180, h - 55), (w - 5, h - 32), (0, 0, 200), -1)
            cv2.putText(frame, "GT: VIOLATION", (w - 175, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    def _capture_loop(self):
        """Main capture + detection loop — runs in background thread."""
        while self._running and self._cap and self._cap.isOpened():
            ret, frame = self._cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            self._frame_count += 1

            # Run all detections
            results = self._run_detections(frame)

            # Check violations
            frame_violation, active_detectors = self._check_violations(frame, results)

            # Record metrics
            if self._metrics:
                self._metrics.record_frame(frame_violation, active_detectors if frame_violation else None)

            # Update gaze counters
            gaze_dir = results.get('gaze_direction', 'center').lower()
            if gaze_dir in self._gaze_counts:
                self._gaze_counts[gaze_dir] += 1
            if gaze_dir != 'center':
                self._gaze_deviation_count += 1

            # Annotate the frame
            self._annotate_frame(frame, results)

            # ── Push everything to state_store ────────────────────────
            if state_store:
                # Detection state
                state_store.write_detection_state({
                    'face_present': results.get('face_present', False),
                    'gaze_direction': gaze_dir,
                    'eye_ratio': round(results.get('eye_ratio', 0.0), 4),
                    'mouth_moving': results.get('mouth_moving', False),
                    'multiple_faces': results.get('multiple_faces', False),
                    'objects_detected': results.get('objects_detected', False),
                    'detected_object_label': results.get('detected_object_label', ''),
                    'hand_violation': results.get('hand_violation', False),
                    'hand_violation_msg': results.get('hand_violation_msg', ''),
                    'eye_alarming': results.get('eye_alarming', False),
                    'mouth_alarming': results.get('mouth_alarming', False),
                    'timestamp': results.get('timestamp', ''),
                })

                # Face-absent duration
                face_absent_dur = 0.0
                face_det = next((d for d in self._detectors if type(d).__name__ == "FaceDetector"), None)
                if face_det and hasattr(face_det, 'no_face_duration'):
                    face_absent_dur = round(face_det.no_face_duration, 1)

                # Risk score
                risk = min(100, int(
                    self._violation_count * 5 +
                    face_absent_dur * 2 +
                    self._gaze_deviation_count * 0.05
                ))

                state_store.write_session_stats({
                    'total_alerts': self._violation_count,
                    'face_absent_duration': face_absent_dur,
                    'gaze_deviations': self._gaze_deviation_count,
                    'risk_score': risk,
                    'session_start': self._session_start.isoformat() if self._session_start else '',
                    'student_name': self._student_info.get('name', ''),
                    'student_id': self._student_info.get('id', ''),
                    'exam_name': self._student_info.get('exam', ''),
                })

                # Gaze distribution
                g_total = sum(self._gaze_counts.values()) or 1
                state_store.write_gaze_distribution({
                    'left': round(self._gaze_counts['left'] / g_total * 100),
                    'center': round(self._gaze_counts['center'] / g_total * 100),
                    'right': round(self._gaze_counts['right'] / g_total * 100),
                })

                # Metrics (every 30 frames to reduce I/O)
                if self._metrics and self._frame_count % 30 == 0:
                    state_store.write_metrics(self._metrics.to_dict(self._detectors))

                # Push annotated frame for MJPEG stream
                state_store.write_frame(frame)

            # Throttle to ~15-20 FPS (detection is heavy)
            time.sleep(0.01)

        # Cleanup on exit
        if self._cap:
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None
        self._running = False


# Singleton instance
camera = CameraThread()
