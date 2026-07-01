import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, required, children, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            required={required}
            className={cn(
              "w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary appearance-none pr-10 transition-colors",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
