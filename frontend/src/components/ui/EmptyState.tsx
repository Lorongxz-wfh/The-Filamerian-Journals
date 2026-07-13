import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300 ease-out',
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border mb-4">
          <Icon className="h-5 w-5 text-muted" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-[15px] font-medium text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-muted max-w-sm mx-auto leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
