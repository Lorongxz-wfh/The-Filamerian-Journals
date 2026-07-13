import React from 'react';
import { cn } from '@/lib/utils';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex items-start space-x-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="radio"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded-full border border-border bg-surface transition-all duration-150 ease-out',
              'peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              'group-active:scale-95',
              className
            )}
          />
          <div className="absolute h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition-all duration-150 ease-out scale-0 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none" />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 mt-1">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted mt-1.5">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);
Radio.displayName = 'Radio';

export default Radio;
