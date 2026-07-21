import React, { useState, useRef } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { BookOpen, ArrowRight } from 'lucide-react';
import DOMPurify from 'dompurify';

interface JournalCardProps {
  slug: string;
  title: string;
  description: string;
  image?: string;
  volume?: string;
  category?: string | any;
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
  const categoryName = typeof category === 'object' && category !== null ? category.name : category;
  const [showFloating, setShowFloating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div 
          className="text-[12px] text-muted line-clamp-4 leading-relaxed mb-3 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />
        <div className="flex flex-col gap-1 text-[11px] text-muted/80">
          {date && <span><strong className="text-gray-900">Year:</strong> {date}</span>}
          {publisher && <span><strong className="text-gray-900">Publisher:</strong> {publisher}</span>}
          {volume && <span><strong className="text-gray-900">Vols:</strong> {volume}</span>}
        </div>
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <Link
        to={`/journals/${slug}`}
        className={cn('group bg-surface border border-border p-5 flex flex-col justify-between hover:border-primary/40 transition-colors cursor-pointer min-h-[396px] w-[95%] mx-auto text-left relative', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FloatingCard />
        
        <div className="relative mx-auto w-full max-w-[160px] aspect-[3/4] overflow-hidden mb-6 bg-background shadow-sm border border-border shrink-0">
          {image && !imgError ? (
            <img
              src={image}
              alt={title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-2 p-2">
              <BookOpen className="h-8 w-8 text-primary/30" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest line-clamp-3 text-center">
                {title}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col justify-between pt-2">
          <div>
            {categoryName && (
              <span className="text-[10px] font-bold text-secondary bg-primary/90 px-2 py-0.5 uppercase tracking-wider inline-block mb-1.5">
                {categoryName}
              </span>
            )}
            <h3 className="text-[12px] font-bold text-primary uppercase tracking-wider line-clamp-2 group-hover:text-secondary transition-colors">
              {title}
            </h3>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <span className="font-mono">{date || publisher || '-'}</span>
            {volume && volume !== 'No Volumes' && (
              <span className="font-semibold text-primary/80 group-hover:text-primary transition-colors flex items-center gap-1">
                {volume.split(' ')[0]} volume{volume.split(' ')[0] !== '1' ? 's' : ''}
              </span>
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
        {image && !imgError ? (
          <img
            src={image}
            alt={title}
            onError={() => setImgError(true)}
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
          {categoryName && (
            <span className="text-[11px] font-medium text-muted bg-surface border border-border px-2 py-0.5 uppercase tracking-wider">
              {categoryName}
            </span>
          )}
        </div>

        <h3 className="text-[22px] font-bold text-[#005a9c] mb-3 leading-snug uppercase tracking-wider transition-colors duration-200">
          {title}
        </h3>

        <div 
          className="text-[14.5px] text-muted line-clamp-2 leading-relaxed mb-5 max-w-3xl prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />
        
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
