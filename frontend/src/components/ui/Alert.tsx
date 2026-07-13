import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  title?: string;
  children: React.ReactNode;
}

const iconMap = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, ...props }, ref) => {
    const Icon = iconMap[variant];

    const variants = {
      default: 'bg-surface border-border text-foreground',
      destructive: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };

    const iconVariants = {
      default: 'text-muted',
      destructive: 'text-red-600',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-md border p-4 flex gap-3',
          variants[variant],
          className
        )}
        {...props}
      >
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconVariants[variant])} />
        <div className="flex flex-col flex-1">
          {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
          <div className="text-sm opacity-90 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export default Alert;
