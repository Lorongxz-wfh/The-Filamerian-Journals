import React, { useState, useRef } from 'react';
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
  const [showFloating, setShowFloating] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFloating(true);
    }, 1500); // 1.5s is a good sweet spot for deliberate hovering
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowFloating(false);
  };

  const FloatingCard = () => {
    if (!showFloating) return null;
    return (
      <div 
        className="absolute z-50 w-64 bg-surface border border-border shadow-2xl p-4 bottom-[105%] left-1/2 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
        onClick={(e) => e.preventDefault()}
      >
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface border-b border-r border-border rotate-45"></div>
        <h4 className="text-[13px] font-bold text-primary uppercase tracking-wider mb-2 leading-tight">
          {title}
        </h4>
        <p className="text-[12px] text-muted line-clamp-4 leading-relaxed mb-3">
          {description}
        </p>
        <div className="flex flex-col gap-1 text-[11px] text-muted/80">
          {publisher && <span><strong className="text-gray-900">Year:</strong> {publisher}</span>}
          {volume && <span><strong className="text-gray-900">Vols:</strong> {volume}</span>}
        </div>
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <Link
        to={`/journals/${slug}`}
        className={cn('group relative flex flex-col h-full text-center transition-[color,background-color,box-shadow,transform] duration-300', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FloatingCard />
        <div className="relative mx-auto w-full max-w-[80px] overflow-hidden mb-6 bg-background shadow-sm hover:shadow-md transition-shadow aspect-[3/4] border border-border shrink-0">
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
        <div className="flex flex-col flex-1 justify-end mt-auto">
          <h3 className="text-xl font-bold text-[#005a9c] uppercase tracking-wider mb-6 leading-snug">
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
        </div>
      </Link>
    );
  }

  // LIST VIEW (Row Style)
  return (
    <Link
      to={`/journals/${slug}`}
      className={cn('group relative flex flex-col md:flex-row items-stretch gap-8 p-6 border border-border bg-transparent hover:bg-surface hover:shadow-md hover:-translate-y-1 transition-[color,background-color,box-shadow,transform] duration-300 mb-4', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <FloatingCard />
      {/* Image (Portrait) */}
      <div className="relative w-[120px] md:w-[140px] shrink-0 overflow-hidden bg-background border border-border">
        {image ? (
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <BookOpen className="w-10 h-10 text-muted/40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full py-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-semibold text-primary uppercase tracking-wider">
            {date || 'March 2024'}
          </span>
          {category && (
            <span className="text-[11px] font-medium text-muted bg-surface border border-border px-2 py-0.5 uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-[22px] font-bold text-[#005a9c] mb-3 leading-snug uppercase tracking-wider transition-colors duration-200">
          {title}
        </h3>

        <p className="text-[14.5px] text-muted line-clamp-2 leading-relaxed mb-5 max-w-3xl">
          {description}
        </p>
        
        {publisher && (
          <div className="text-[12px] text-muted/80 mb-4">
            <span className="font-semibold text-gray-900">Year Published:</span> <span className="text-[#0077cc]">{publisher}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <span className="text-[13px] font-medium text-primary">
            {volume || 'No Volumes'}
          </span>
          <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};

export default JournalCard;
