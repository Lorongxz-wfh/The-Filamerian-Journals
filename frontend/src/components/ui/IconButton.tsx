import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'success';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon: Icon, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'text-muted/60 hover:text-primary hover:bg-black/5',
      danger: 'text-muted/60 hover:text-red-500 hover:bg-red-500/10',
      success: 'text-muted/60 hover:text-emerald-500 hover:bg-emerald-50',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'h-7 w-7 rounded flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
