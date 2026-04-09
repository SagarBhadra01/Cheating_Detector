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

/* ---------- Protected Dashboard Layout ---------- */
function DashboardLayout() {
  const stats = usePolling(getSessionStats, 5000);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar stats={stats} />
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

/* ---------- Auth Page Wrapper ---------- */
function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080c10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Back to home */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#7a8b9a',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to ExamProctor
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
                colorPrimary: '#00c8ff',
                colorBackground: '#0d1318',
                colorText: '#e8ecf0',
                colorInputBackground: '#111820',
                colorInputText: '#e8ecf0',
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
                colorPrimary: '#00c8ff',
                colorBackground: '#0d1318',
                colorText: '#e8ecf0',
                colorInputBackground: '#111820',
                colorInputText: '#e8ecf0',
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
