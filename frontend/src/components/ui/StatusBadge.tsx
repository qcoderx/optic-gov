import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'live';
  className?: string;
}

const variants = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  live: 'border-primary/30 bg-primary/10 text-primary',
};

export const StatusBadge = ({ 
  children, 
  variant = 'info', 
  className 
}: StatusBadgeProps) => {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider w-fit',
        variants[variant],
        className
      )}
    >
      {variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
      {children}
    </div>
  );
};