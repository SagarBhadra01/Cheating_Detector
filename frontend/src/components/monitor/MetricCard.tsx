import { Card } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  status?: 'normal' | 'warning' | 'danger';
}

const valueClass: Record<string, string> = {
  normal:  'text-gray-900',
  warning: 'text-amber-600',
  danger:  'text-red-600',
};

const dotClass: Record<string, string> = {
  normal:  'bg-green-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
};

const bgClass: Record<string, string> = {
  normal:  '',
  warning: 'border-amber-200 bg-amber-50/40',
  danger:  'border-red-200 bg-red-50/40',
};

export function MetricCard({ label, value, sub, status = 'normal' }: MetricCardProps) {
  return (
    <Card className={bgClass[status]}>
      <div className="flex items-start justify-between">
        <span className="text-[10.5px] font-semibold tracking-wider uppercase text-gray-400">
          {label}
        </span>
        <span className={`relative flex h-2 w-2 mt-0.5 shrink-0`}>
          {status !== 'normal' && (
            <span className={`absolute inline-flex h-full w-full rounded-full ${dotClass[status]} opacity-60 animate-ping`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass[status]}`} />
        </span>
      </div>
      <p className={`text-2xl font-semibold mt-1.5 font-mono tabular-nums ${valueClass[status]}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}
