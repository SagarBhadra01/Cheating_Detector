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
      className={`bg-white border border-gray-100 rounded-xl p-4 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
            {title}
          </span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
