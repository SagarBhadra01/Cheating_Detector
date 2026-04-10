# ShieldX — AI Proctoring Dashboard

A production-grade React + TypeScript frontend for an AI-powered exam cheating detection system.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** — lightning-fast dev server & build
- **Tailwind CSS v4** — utility-first styling
- **React Router v7** — client-side routing (3 pages)
- **Recharts** — data visualization (available for charts)
- **Axios** — HTTP client with full mock fallback
- **Lucide React** — icon library

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Start dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Pages

| Route | Description |
|-------|------------|
| `/monitor` | Live monitoring — metrics, webcam feed, detector grid, gaze distribution, alert feed |
| `/reports` | Session reports — master-detail with timeline, breakdown, heatmap |
| `/settings` | Configuration — threshold sliders, feature toggles, save/reset |

## Project Structure

```
src/
├── types/index.ts              # All TypeScript interfaces + SEVERITY_MAP
├── api/client.ts               # API calls with mock fallback
├── hooks/
│   ├── usePolling.ts           # Generic interval polling hook
│   └── useSession.ts           # Elapsed timer hook (HH:MM:SS)
├── components/
│   ├── layout/                 # Sidebar, Topbar
│   ├── monitor/                # MetricCard, VideoFeed, ActivityTimeline,
│   │                             DetectorGrid, GazeDistribution, AlertFeed
│   ├── reports/                # SessionList, ViolationTimeline,
│   │                             ViolationBreakdown, WeeklyHeatmap
│   ├── settings/               # ThresholdSlider, ToggleRow
│   └── ui/                     # Badge, Card, SeverityBadge
├── pages/
│   ├── MonitorPage.tsx
│   ├── ReportsPage.tsx
│   └── SettingsPage.tsx
└── App.tsx                     # Root with router + layout
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend API base URL |
| `VITE_POLL_INTERVAL_MS` | `2000` | Polling interval in ms |

## Offline Mode

All API calls return **realistic mock data** on failure — the UI never breaks when the backend is offline. This makes development and demos possible without running the Python backend.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Type-check + production build
npm run preview    # Preview production build
```
