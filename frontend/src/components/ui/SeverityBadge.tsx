interface SeverityBadgeProps {
  severity: 1 | 2 | 3 | 4 | 5;
}

const styles: Record<number, string> = {
  5: 'bg-red-50 text-red-600 border-red-200',
  4: 'bg-amber-50 text-amber-600 border-amber-200',
  3: 'bg-blue-50 text-blue-600 border-blue-200',
  2: 'bg-gray-100 text-gray-600 border-gray-200',
  1: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${styles[severity]}`}
    >
      SEV&nbsp;{severity}
    </span>
  );
}
