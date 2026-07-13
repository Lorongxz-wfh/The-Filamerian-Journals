import React from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

interface LoadingOverlayProps {
  text?: string;
  className?: string;
  blur?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  text = 'Loading...', 
  className,
  blur = true
}) => {
  return (
    <div 
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-background/50 animate-in fade-in duration-300',
        blur && 'backdrop-blur-sm',
        className
      )}
    >
      <div className="bg-surface border border-border px-8 py-6 rounded-md shadow-lg flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-300 ease-out">
        <Spinner size="md" fullHeight={false} className="!py-0" />
        <span className="text-[13px] font-medium text-primary uppercase tracking-wider">{text}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
