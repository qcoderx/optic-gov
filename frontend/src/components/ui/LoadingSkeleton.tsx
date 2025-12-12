import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const LoadingSkeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = false,
  className,
  ...props 
}: LoadingSkeletonProps) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-700',
        width,
        height,
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      {...props}
    />
  );
};