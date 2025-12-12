import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  icon,
  error,
  rightElement,
  className,
  id,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={id}
          className="text-white text-sm font-medium pl-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon name={icon} size="sm" />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full bg-[#111813] border text-white text-base rounded-lg transition-all duration-200 outline-none',
            'focus:ring-2 focus:ring-primary/50 focus:border-primary',
            'placeholder:text-text-secondary/50',
            icon ? 'pl-11' : 'pl-4',
            rightElement ? 'pr-12' : 'pr-4',
            'py-3',
            error ? 'border-red-500' : 'border-[#3b5443]',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-xs pl-1">{error}</p>
      )}
    </div>
  );
});