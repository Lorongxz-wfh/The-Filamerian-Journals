import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md', fullHeight = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn("flex items-center justify-center w-full", fullHeight ? "h-full py-12" : "py-8")}>
      <div className={cn("animate-spin rounded-full border-b-primary border-t-transparent border-l-transparent border-r-transparent", sizeClasses[size], className)}></div>
    </div>
  );
};

export default Spinner;
