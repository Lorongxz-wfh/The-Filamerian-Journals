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
  category?: string;
  publisher?: string;
  date?: string;
  className?: string;
  viewMode?: 'list' | 'grid';
}

const JournalCard: React.FC<JournalCardProps> = ({
  slug,
  title,
  description,
  image,
  volume,
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
        <div className="relative mx-auto max-w-[220px] overflow-hidden mb-6 bg-background shadow-sm hover:shadow-md transition-shadow aspect-[3/4] border border-border">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-surface border border-border">
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
              <span className="font-bold text-gray-900">Year Published</span>
              <span className="text-[#0077cc]">{publisher}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // LIST VIEW (Row Style)
  return (
    <Link
      to={`/journals/${slug}`}
      className={cn('group flex items-start gap-6 py-6 border-b border-border hover:bg-black/[0.02] transition-colors duration-200 px-4 -mx-4', className)}
    >
      {/* Image (Portrait) */}
      <div className="relative w-32 shrink-0 aspect-[3/4] overflow-hidden bg-background border border-border">
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
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
            {date || 'March 2024'}
          </span>
          {category && (
            <span className="text-[11px] font-medium text-muted bg-surface border border-border px-2 py-0.5 uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-primary mb-2 leading-snug group-hover:text-secondary transition-colors duration-200">
          {title}
        </h3>

        <p className="text-[14px] text-muted line-clamp-2 leading-relaxed mb-4 max-w-3xl">
          {description}
        </p>
        
        {publisher && (
          <div className="text-[12px] text-muted/80 mb-4">
            <span className="font-semibold text-primary/70">Year Published:</span> {publisher}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-primary">
            {volume || 'No Volumes'}
          </span>
          <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
};

export default JournalCard;
