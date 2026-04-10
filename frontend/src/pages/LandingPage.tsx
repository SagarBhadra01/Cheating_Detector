import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import {
  Eye, Shield, Mic, Hand, MonitorSmartphone,
  Scan, User
} from 'lucide-react';
import '../styles/landing.css';

/* ================================================================
   ShieldX — Landing Page
   Surveillance / Biometric Terminal Aesthetic
   ================================================================ */

/* ---------- Timer Hook ---------- */
function useElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ---------- Intersection Observer for fade-ups ---------- */
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ---------- 3D Tilt Hook ---------- */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    };

    const handleLeave = () => {
      el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      el.style.transition = 'transform 0.4s ease';
      setTimeout(() => { el.style.transition = 'transform 0.15s ease'; }, 400);
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);
  return ref;
}


/* =================================================================
   COMPONENT: Landing Page
   ================================================================= */
export function LandingPage() {
  const elapsed = useElapsedTimer();
  const tiltRef = useTilt();
  const featuresRef = useFadeUp();
  const metricsRef = useFadeUp();
  const previewRef = useFadeUp();
  const ctaRef = useFadeUp();

  // Mini bar chart random heights
  const barHeights = [60, 80, 45, 90, 70, 55, 85, 65, 75, 50];

  return (
    <div className="landing-page">

      {/* ========== NAVBAR ========== */}
      <nav className="nav-glass">
        <div className="nav-inner">
          {/* Left: Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="logo-box">
              <div className="scan-line" />
              <div className="eye-icon" />
            </div>
            <span className="wordmark">ShieldX</span>
            <span className="ai-tag">AI v2.0</span>
          </div>

          {/* Center: Nav Links */}
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#metrics">Metrics</a></li>
            <li><a href="#preview">Preview</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          {/* Right: CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SignedOut>
              <Link to="/sign-in" className="btn-ghost">Sign In</Link>
              <Link to="/sign-up" className="btn-primary">Get Started</Link>
            </SignedOut>
            <SignedIn>
              <Link to="/monitor" className="btn-primary">Dashboard</Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: { width: 34, height: 34 }
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="hero-section">
        {/* Left Column */}
        <div>
          <div className="hero-eyebrow">
            <span className="blink-dot" />
            REAL-TIME INTEGRITY MONITORING
          </div>

          <h1 className="hero-title">
            AI-Powered Exam<br />
            <span className="cyan">Proctoring</span> System
          </h1>

          <p className="hero-subtitle">
            Advanced multi-modal detection engine combining computer vision,
            audio analysis, and behavioral biometrics to ensure exam integrity
            with zero tolerance for false positives.
          </p>

          <div className="hero-actions">
            <Link to="/sign-up" className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
              Start Monitoring
            </Link>
            <a href="#preview" className="btn-outline" style={{ padding: '12px 28px', fontSize: 15 }}>
              View Live Demo
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-block">
              <div className="stat-value">99.7%</div>
              <div className="stat-label">Detection Accuracy</div>
            </div>
            <div className="stat-block green">
              <div className="stat-value">&lt;40ms</div>
              <div className="stat-label">Avg. Latency</div>
            </div>
            <div className="stat-block purple">
              <div className="stat-value">12</div>
              <div className="stat-label">Active Detectors</div>
            </div>
          </div>
        </div>

        {/* Right Column: HUD Preview Card */}
        <div ref={tiltRef} className="hud-card" style={{ transition: 'transform 0.15s ease' }}>
          {/* Title bar */}
          <div className="hud-titlebar">
            <div className="traffic-lights">
              <span className="red" />
              <span className="yellow" />
              <span className="green" />
            </div>
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          </div>

          {/* Body grid */}
          <div className="hud-body">
            {/* Integrity Score */}
            <div className="hud-cell">
              <div className="hud-cell-label">Integrity Score</div>
              <div className="hud-cell-value">94.2</div>
              <div className="mini-bars">
                {barHeights.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, #16a34a, rgba(22,163,74,0.25))`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Gaze Zone */}
            <div className="hud-cell">
              <div className="hud-cell-label">Gaze Zone</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af' }}>
                <span>L</span><span style={{ flex: 1, textAlign: 'center' }}>C</span><span>R</span>
              </div>
              <div className="gaze-zone">
                <div className="gaze-dot" />
              </div>
            </div>

            {/* Active Detectors */}
            <div className="hud-cell">
              <div className="hud-cell-label">Active Detectors</div>
              <div className="detector-list">
                <div className="detector-row">
                  <span className="pip green" />
                  <span className="det-name">Face Detection</span>
                  <span className="det-status">OK</span>
                </div>
                <div className="detector-row">
                  <span className="pip green" />
                  <span className="det-name">Gaze Tracking</span>
                  <span className="det-status">OK</span>
                </div>
                <div className="detector-row">
                  <span className="pip amber" />
                  <span className="det-name">Audio Monitor</span>
                  <span className="det-status">WARN</span>
                </div>
                <div className="detector-row">
                  <span className="pip green" />
                  <span className="det-name">Object Detect</span>
                  <span className="det-status">OK</span>
                </div>
                <div className="detector-row">
                  <span className="pip red" />
                  <span className="det-name">Multi-Face</span>
                  <span className="det-status">ALERT</span>
                </div>
              </div>
            </div>

            {/* Alerts + Timer */}
            <div className="hud-cell">
              <div className="hud-cell-label">Session Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ALERTS</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: '#d97706' }}>
                    07
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ELAPSED</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: '#2563eb' }}>
                    {elapsed}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== METRICS STRIP ========== */}
      <div ref={metricsRef} id="metrics" className="metrics-strip fade-up">
        <div className="metric-cell">
          <div className="metric-number cyan">24,891</div>
          <div className="metric-label">Exams Monitored</div>
          <div className="metric-trend up">↑ 12.4%</div>
        </div>
        <div className="metric-cell">
          <div className="metric-number green">99.7%</div>
          <div className="metric-label">Detection Rate</div>
          <div className="metric-trend up">↑ 0.3%</div>
        </div>
        <div className="metric-cell">
          <div className="metric-number amber">0.02%</div>
          <div className="metric-label">False Positive Rate</div>
          <div className="metric-trend down">↓ 0.01%</div>
        </div>
        <div className="metric-cell">
          <div className="metric-number purple">38ms</div>
          <div className="metric-label">Avg. Latency</div>
          <div className="metric-trend down">↓ 4ms</div>
        </div>
      </div>

      {/* ========== FEATURES GRID ========== */}
      <section ref={featuresRef} id="features" className="features-section fade-up">
        <h2 className="section-title">Multi-Modal Detection Engine</h2>
        <p className="section-subtitle">
          Six independent AI detectors working in parallel to ensure complete exam integrity
        </p>

        <div className="features-grid">
          <div className="feature-card" data-accent="cyan">
            <div className="feature-icon"><Eye size={22} /></div>
            <div className="feature-title">Gaze Tracking</div>
            <div className="feature-desc">
              Real-time eye movement analysis using facial landmark detection.
              Tracks gaze direction, blink rate, and detects sustained off-screen looking.
            </div>
          </div>

          <div className="feature-card" data-accent="red">
            <div className="feature-icon"><Scan size={22} /></div>
            <div className="feature-title">Object Detection</div>
            <div className="feature-desc">
              YOLO-based real-time object detection identifies unauthorized devices —
              phones, tablets, earbuds, and notes — with 95%+ confidence.
            </div>
          </div>

          <div className="feature-card" data-accent="amber">
            <div className="feature-icon"><Mic size={22} /></div>
            <div className="feature-title">Audio Monitoring</div>
            <div className="feature-desc">
              Continuous microphone analysis detects voice activity, whispered speech,
              and ambient noise. Optional Whisper transcription for evidence.
            </div>
          </div>

          <div className="feature-card" data-accent="green">
            <div className="feature-icon"><Shield size={22} /></div>
            <div className="feature-title">Face Authentication</div>
            <div className="feature-desc">
              Biometric face verification ensures the registered student is present
              throughout. Detects face absence and multiple persons.
            </div>
          </div>

          <div className="feature-card" data-accent="purple">
            <div className="feature-icon"><Hand size={22} /></div>
            <div className="feature-title">Gesture Analysis</div>
            <div className="feature-desc">
              MediaPipe hand tracking detects suspicious hand movements near screen edges,
              potential sign-language communication, and phone handling.
            </div>
          </div>

          <div className="feature-card" data-accent="cyan">
            <div className="feature-icon"><MonitorSmartphone size={22} /></div>
            <div className="feature-title">Environment Lock</div>
            <div className="feature-desc">
              Secure browser enforcement with screen recording, tab-switch detection,
              virtual camera blocking, and forbidden application monitoring.
            </div>
          </div>
        </div>
      </section>

      {/* ========== APP PREVIEW ========== */}
      <section ref={previewRef} id="preview" className="app-preview-section fade-up">
        <h2 className="section-title">Monitoring Dashboard</h2>
        <p className="section-subtitle">
          Real-time surveillance interface with live detection feeds and instant alerts
        </p>

        <div className="browser-frame">
          {/* Browser toolbar */}
          <div className="browser-toolbar">
            <div className="dots">
              <span className="r" />
              <span className="y" />
              <span className="g" />
            </div>
            <div className="browser-url-bar">shieldx.ai/monitor</div>
          </div>

          {/* Browser content */}
          <div className="browser-content">
            {/* Sidebar */}
            <div className="mock-sidebar">
              <div className="mock-logo">
                <div className="logo-dot">
                  <Shield size={14} color="#080c10" />
                </div>
                ShieldX
              </div>

              <div className="mock-nav-item active">
                <span className="nav-dot" style={{ background: 'var(--accent)' }} />
                Monitor
              </div>
              <div className="mock-nav-item">
                <span className="nav-dot" style={{ background: 'var(--success)' }} />
                Reports
              </div>
              <div className="mock-nav-item">
                <span className="nav-dot" style={{ background: 'var(--purple)' }} />
                Settings
              </div>
              <div className="mock-nav-item">
                <span className="nav-dot" style={{ background: 'var(--warning)' }} />
                Students
              </div>

              <div className="mock-version">v2.4.1-beta</div>
            </div>

            {/* Main area */}
            <div className="mock-main">
              {/* Metric row */}
              <div className="mock-metrics-row">
                <div className="mock-metric-card">
                  <div className="mini-label">Total Alerts</div>
                  <div className="mini-value cyan">07</div>
                </div>
                <div className="mock-metric-card">
                  <div className="mini-label">Face Absent</div>
                  <div className="mini-value amber">4.2s</div>
                </div>
                <div className="mock-metric-card">
                  <div className="mini-label">Gaze Deviations</div>
                  <div className="mini-value green">12</div>
                </div>
                <div className="mock-metric-card">
                  <div className="mini-label">Risk Score</div>
                  <div className="mini-value red">38/100</div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="mock-bottom-row">
                {/* Webcam feed */}
                <div className="mock-webcam">
                  <div className="scan" />
                  <div className="corner tl" />
                  <div className="corner tr" />
                  <div className="corner bl" />
                  <div className="corner br" />
                  <div className="face-circle">
                    <User size={24} />
                  </div>
                </div>

                {/* Detector grid */}
                <div className="mock-detectors">
                  <div className="det-title">Detectors</div>
                  {[
                    { name: 'Face', status: 'Present', color: 'green' },
                    { name: 'Gaze', status: 'Center', color: 'green' },
                    { name: 'Mouth', status: 'Still', color: 'green' },
                    { name: 'Objects', status: 'Clear', color: 'green' },
                    { name: 'Audio', status: 'Warn', color: 'amber' },
                    { name: 'Hands', status: 'Clear', color: 'green' },
                  ].map((d) => (
                    <div className="detector-row" key={d.name}>
                      <span className={`pip ${d.color}`} />
                      <span className="det-name">{d.name}</span>
                      <span className="det-status">{d.status}</span>
                    </div>
                  ))}
                </div>

                {/* Alert feed */}
                <div className="mock-alerts">
                  <div className="alert-title">Alert Feed</div>
                  <div className="mock-alert-item sev-danger">
                    <div className="alert-time">14:23:08</div>
                    <div className="alert-msg">Cell phone detected (87%)</div>
                  </div>
                  <div className="mock-alert-item sev-warning">
                    <div className="alert-time">14:19:42</div>
                    <div className="alert-msg">Gaze deviated left 3.2s</div>
                  </div>
                  <div className="mock-alert-item sev-info">
                    <div className="alert-time">14:15:11</div>
                    <div className="alert-msg">Voice activity detected</div>
                  </div>
                  <div className="mock-alert-item sev-warning">
                    <div className="alert-time">14:12:05</div>
                    <div className="alert-msg">Face absent for 6s</div>
                  </div>
                  <div className="mock-alert-item sev-danger">
                    <div className="alert-time">14:08:33</div>
                    <div className="alert-msg">2 faces detected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section ref={ctaRef} id="pricing" className="cta-section fade-up">
        <div className="cta-card">
          <h2 className="cta-title">Ready to Secure Your Exams?</h2>
          <p className="cta-subtitle">
            Deploy ShieldX in minutes. No hardware required — just a browser and a webcam.
          </p>
          <div className="cta-buttons">
            <Link to="/sign-up" className="btn-primary" style={{ padding: '14px 36px', fontSize: 15 }}>
              Start Free Trial
            </Link>
            <a href="#features" className="btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className="logo-box" style={{ width: 24, height: 24, borderWidth: 1.5 }}>
            <div className="eye-icon" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', letterSpacing: 1 }}>ShieldX</span>
        </div>
        <div style={{ marginTop: 10, color: 'var(--text-subtle)' }}>
          © 2026 ShieldX. AI-Powered Integrity Monitoring. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
