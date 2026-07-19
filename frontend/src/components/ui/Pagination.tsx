import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, lastPage, onPageChange, className }) => {
  if (lastPage <= 1) return null;

  // Generate page numbers
  const pages: (number | string)[] = [];
  
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', lastPage);
    } else if (currentPage >= lastPage - 3) {
      pages.push(1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage);
    }
  }

  return (
    <div className={cn('flex items-center justify-center space-x-1 mt-8', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center text-muted hover:text-primary hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted transition-colors"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page, idx) => (
        <React.Fragment key={idx}>
          {page === '...' ? (
            <div className="w-9 h-9 flex items-center justify-center text-muted">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={cn(
                'w-9 h-9 flex items-center justify-center text-[13px] font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-surface hover:text-primary'
              )}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="w-9 h-9 flex items-center justify-center text-muted hover:text-primary hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted transition-colors"
        aria-label="Next Page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
