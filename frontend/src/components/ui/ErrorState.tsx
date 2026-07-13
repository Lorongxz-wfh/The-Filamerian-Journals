import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center border border-red-200 bg-red-50 rounded-md animate-in fade-in zoom-in-95 duration-300 ease-out',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-[15px] font-semibold text-red-800 mb-1">{title}</h3>
      <p className="text-[13px] text-red-700/80 max-w-sm mx-auto leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-red-200 text-red-700 hover:bg-red-100">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
