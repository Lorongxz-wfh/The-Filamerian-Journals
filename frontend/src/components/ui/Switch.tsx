import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-3 cursor-pointer group">
        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "block h-6 w-11 rounded-full border border-border bg-surface transition-colors duration-200 peer-checked:bg-primary peer-checked:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className
          )}></div>
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out peer-checked:translate-x-5" />
        </div>
        {label && (
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export default Switch;
