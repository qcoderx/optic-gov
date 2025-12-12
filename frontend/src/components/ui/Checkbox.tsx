import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

export const Checkbox = ({ label, error, className, ...props }: CheckboxProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <div className="flex h-6 items-center">
          <input
            type="checkbox"
            className={clsx(
              'h-4 w-4 rounded border-[#3b5443] bg-[#111813] text-primary cursor-pointer',
              'focus:ring-offset-0 focus:ring-2 focus:ring-primary/50 transition-all',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
        </div>
        <div className="text-sm leading-6">
          <label className="text-text-secondary cursor-pointer">
            {label}
          </label>
        </div>
      </div>
      {error && (
        <p className="text-red-400 text-xs pl-7">{error}</p>
      )}
    </div>
  );
};