import React from 'react';
import { cn } from '@/lib/utils';
import Pagination from './Pagination';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div className={cn('relative w-full overflow-auto max-h-[520px] bg-surface custom-scrollbar', containerClassName)}>
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm border-collapse', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead 
      ref={ref} 
      className={cn('sticky top-0 z-20 bg-surface border-b border-border shadow-2xs [&_tr]:border-b-0', className)} 
      {...props} 
    />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-background/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isSorted?: boolean;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, isSorted, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 sm:h-12 px-3 sm:px-5 text-left align-middle text-[10px] sm:text-[11px] uppercase tracking-wider transition-colors select-none',
        isSorted
          ? 'bg-black/[0.045] dark:bg-white/[0.07] text-primary font-bold shadow-2xs border-b border-primary/25'
          : 'text-muted font-semibold hover:bg-black/[0.02] dark:hover:bg-white/[0.02]',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-3 sm:p-5 align-middle text-xs sm:text-sm', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
TableCaption.displayName = 'TableCaption';

export interface DataTableFooterProps {
  currentPage?: number;
  lastPage?: number;
  onPageChange?: (page: number) => void;
  showingText?: React.ReactNode;
  loading?: boolean;
  pagination?: React.ReactNode;
  className?: string;
}

const DataTableFooter: React.FC<DataTableFooterProps> = ({
  currentPage = 1,
  lastPage = 1,
  onPageChange,
  showingText,
  loading = false,
  pagination,
  className,
}) => {
  return (
    <div className={cn('border-t border-border bg-surface px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 min-h-[52px]', className)}>
      {/* Left spacer / status indicator */}
      <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted w-1/4">
        {loading && (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
            Updating...
          </span>
        )}
      </div>

      {/* Center Pagination */}
      <div className="flex-1 flex justify-center">
        {pagination ? (
          pagination
        ) : lastPage > 1 && onPageChange ? (
          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            onPageChange={onPageChange}
            className="space-x-1"
          />
        ) : null}
      </div>

      {/* Right Result Count */}
      <div className="w-full sm:w-1/4 flex justify-center sm:justify-end text-right">
        {showingText ? (
          <div className="text-[11px] font-medium text-muted flex items-center gap-2">
            {showingText}
            {loading && (
              <span className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block sm:hidden" />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DataTableFooter,
};

