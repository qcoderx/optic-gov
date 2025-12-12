import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  filled?: boolean;
}

const sizeClasses = {
  sm: 'text-[18px]',
  md: 'text-[24px]',
  lg: 'text-[28px]',
  xl: 'text-[32px]',
};

export const Icon = ({ 
  name, 
  size = 'md', 
  filled = false, 
  className, 
  ...props 
}: IconProps) => {
  return (
    <span
      className={clsx(
        'material-symbols-outlined select-none',
        sizeClasses[size],
        filled && 'font-variation-settings-fill-1',
        className
      )}
      {...props}
    >
      {name}
    </span>
  );
};