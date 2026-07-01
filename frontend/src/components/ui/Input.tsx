import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[12px] font-medium text-primary uppercase tracking-wider flex justify-between items-center">
            <span>
              {label} {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            {hint && <span className="text-muted lowercase">{hint}</span>}
          </label>
        )}
        <input
          ref={ref}
          required={required}
          className={cn(
            "w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
