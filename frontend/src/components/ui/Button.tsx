import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', showArrow = false, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:opacity-90',
      secondary: 'bg-secondary text-primary hover:opacity-90',
      outline: 'border border-primary/20 bg-transparent text-primary hover:bg-primary/5',
      ghost: 'bg-transparent text-primary hover:bg-primary/5',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          showArrow && 'pr-2', // Extra padding for the nested arrow
          className
        )}
        {...props}
      >
        <span>{children}</span>
        
        {showArrow && (
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-110">
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
