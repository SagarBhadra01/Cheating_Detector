import { Card } from '../ui/Card';
import type { GazeDistribution as GazeData, DetectionState } from '../../types';

interface GazeDistributionProps {
  gaze: GazeData | null;
  state: DetectionState | null;
}

const barColors: Record<string, string> = {
  left: 'bg-amber-400',
  center: 'bg-green-400',
  right: 'bg-blue-400',
};

export function GazeDistribution({ gaze, state }: GazeDistributionProps) {
  const data = gaze ?? { left: 0, center: 0, right: 0 };
  const ear = state?.eye_ratio ?? 0.3;
  const eyeOpen = ear > 0.25;

  return (
    <Card title="gaze distribution">
      <div className="space-y-2.5">
        {(['left', 'center', 'right'] as const).map((dir) => (
          <div key={dir} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 w-12 capitalize">{dir}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColors[dir]}`}
                style={{ width: `${data[dir]}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-gray-500 w-9 text-right">
              {data[dir]}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-gray-400">Eye Aspect Ratio</span>
          <span className="text-[11px] font-mono text-gray-600">
            {ear.toFixed(2)}{' '}
            <span className={`ml-1 ${eyeOpen ? 'text-green-500' : 'text-amber-500'}`}>
              {eyeOpen ? 'open' : 'closed'}
            </span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              eyeOpen ? 'bg-green-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(100, ear * 200)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
