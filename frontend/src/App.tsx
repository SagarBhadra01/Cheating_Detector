import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MonitorPage } from './pages/MonitorPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { usePolling } from './hooks/usePolling';
import { getSessionStats } from './api/client';
import { MonitorProvider, useMonitorContext } from './hooks/useMonitorContext';

/* ---------- Protected Dashboard Layout ---------- */
function DashboardInner() {
  const stats = usePolling(getSessionStats, 5000);
  const { isMonitoring } = useMonitorContext();
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar stats={stats} isMonitoring={isMonitoring} />
        <Routes>
          <Route path="monitor" element={<MonitorPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="monitor" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardLayout() {
  return (
    <MonitorProvider>
      <DashboardInner />
    </MonitorProvider>
  );
}

/* ---------- Auth Page Wrapper ---------- */
function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Dot grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Back to home */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
            }}
          >
            ← Back to ShieldX
          </button>
        </div>
        {mode === 'sign-in' ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/monitor"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#111827',
                colorInputBackground: '#f9fafb',
                colorInputText: '#111827',
              },
            }}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/monitor"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#111827',
                colorInputBackground: '#f9fafb',
                colorInputText: '#111827',
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- App Root ---------- */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

        {/* Protected dashboard */}
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <DashboardLayout />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
