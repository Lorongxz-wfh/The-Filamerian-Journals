import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md', fullHeight = false, text }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center w-full gap-3", fullHeight ? "h-full py-12" : "py-8")}>
      <div className={cn("animate-spin rounded-full border-b-primary border-t-transparent border-l-transparent border-r-transparent", sizeClasses[size], className)}></div>
      {text && <span className="text-[13px] text-muted animate-pulse">{text}</span>}
    </div>
  );
};

export default Spinner;
