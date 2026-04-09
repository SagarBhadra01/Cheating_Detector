import { Card } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  status?: 'normal' | 'warning' | 'danger';
}

const statusClass: Record<string, string> = {
  normal: 'text-gray-900',
  warning: 'text-amber-600',
  danger: 'text-red-600',
};

const dotClass: Record<string, string> = {
  normal: 'bg-green-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
};

export function MetricCard({
  label,
  value,
  sub,
  status = 'normal',
}: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
          {label}
        </span>
        <span className={`w-2 h-2 rounded-full mt-1 ${dotClass[status]}`} />
      </div>
      <p className={`text-2xl font-medium mt-1 ${statusClass[status]}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
      )}
    </Card>
  );
}
