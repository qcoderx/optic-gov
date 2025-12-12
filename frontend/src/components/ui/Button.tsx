import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-primary hover:shadow-primary-lg',
  secondary: 'bg-card-dark border border-border-dark hover:border-primary/50 text-white',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/5',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'flex items-center justify-center gap-2 rounded-lg font-bold transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};