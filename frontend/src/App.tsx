import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MonitorPage } from './pages/MonitorPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { usePolling } from './hooks/usePolling';
import { getSessionStats } from './api/client';

export default function App() {
  const stats = usePolling(getSessionStats, 5000);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar stats={stats} />
          <Routes>
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/monitor" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
