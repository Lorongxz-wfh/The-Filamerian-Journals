import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded bg-muted/20", className)}
      {...props}
    />
  );
};

export const TableRowSkeleton: React.FC<{ columns: number, rows?: number }> = ({ columns, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border last:border-b-0">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <Skeleton className="h-4 w-full max-w-[80%] rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

const spanClasses: Record<number, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
};

export const ListSkeleton: React.FC<{ colSpans: number[], rows?: number }> = ({ colSpans, rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
          {colSpans.map((span, j) => (
            <div key={j} className={spanClasses[span] || 'col-span-1'}>
              <Skeleton className="h-4 w-full max-w-[80%] rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const MessageListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-5 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
      <div className="flex justify-end pt-4 border-t border-border mt-6">
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </div>
  );
};
