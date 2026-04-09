import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ children, title, action, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10.5px] font-semibold tracking-wider uppercase text-gray-400">
            {title}
          </span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
