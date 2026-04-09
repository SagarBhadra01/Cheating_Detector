interface BadgeProps {
  variant: 'live' | 'session' | 'risk-high' | 'risk-med' | 'risk-low' | 'idle';
  children: React.ReactNode;
}

const variantClasses: Record<BadgeProps['variant'], string> = {
  live: 'bg-red-50 text-red-600 border-red-200',
  session: 'bg-blue-50 text-blue-600 border-blue-200',
  'risk-high': 'bg-red-50 text-red-600 border-red-200',
  'risk-med': 'bg-amber-50 text-amber-600 border-amber-200',
  'risk-low': 'bg-green-50 text-green-600 border-green-200',
  idle: 'bg-gray-50 text-gray-500 border-gray-200',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${variantClasses[variant]}`}
    >
      {variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      {children}
    </span>
  );
}
