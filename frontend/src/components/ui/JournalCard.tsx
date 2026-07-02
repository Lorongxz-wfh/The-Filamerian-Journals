import React from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { BookOpen, ArrowRight } from 'lucide-react';

interface JournalCardProps {
  slug: string;
  title: string;
  description: string;
  image?: string;
  volume?: string;
  issue?: string;
  date?: string;
  category?: string;
  publisher?: string;
  className?: string;
  viewMode?: 'list' | 'grid';
}

const JournalCard: React.FC<JournalCardProps> = ({
  slug,
  title,
  description,
  image,
  volume,
  issue,
  date,
  category,
  publisher,
  className,
  viewMode = 'list',
}) => {
  if (viewMode === 'grid') {
    return (
      <Link
        to={`/journals/${slug}`}
        className={cn('group block text-center transition-all duration-300', className)}
      >
        <div className="relative overflow-hidden mb-6 bg-background shadow-sm hover:shadow-md transition-shadow">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-80 bg-surface">
              <BookOpen className="w-12 h-12 text-muted/30" />
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-[#005a9c] uppercase tracking-wider mb-4 leading-snug">
          {title}
        </h3>

        <div className="flex flex-col items-center gap-1 text-[13px]">
          {category && (
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-900">Category</span>
              <span className="text-[#0077cc]">{category}</span>
            </div>
          )}
          {publisher && (
            <div className="flex flex-col items-center mt-2">
              <span className="font-bold text-gray-900">Publisher</span>
              <span className="text-[#0077cc]">{publisher}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // LIST VIEW (Default / Original)
  return (
    <Link
      to={`/journals/${slug}`}
      className={cn('group block bg-surface border border-border overflow-hidden hover:border-primary/30 transition-colors duration-200', className)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-background border-b border-border">
        {image ? (
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-8 h-8 text-muted/40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
            {date || 'March 2024'}
          </span>
          {category && (
            <span className="text-[10px] font-medium text-muted bg-background px-2 py-0.5 uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-base font-sans font-semibold text-primary mb-2 leading-snug group-hover:text-secondary transition-colors duration-200">
          {title}
        </h3>

        <p className="text-[13px] text-muted line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[12px] font-medium text-primary/70">
            Vol. {volume || '01'} No. {issue || '01'}
          </span>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
};

export default JournalCard;
