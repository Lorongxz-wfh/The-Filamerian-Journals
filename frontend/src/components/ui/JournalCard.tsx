import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

interface JournalCardProps {
  title: string;
  description: string;
  image?: string;
  volume?: string;
  issue?: string;
  date?: string;
  className?: string;
}

const JournalCard: React.FC<JournalCardProps> = ({
  title,
  description,
  image,
  volume,
  issue,
  date,
  className,
}) => {
  return (
    <div className={cn('group cursor-pointer bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300', className)}>
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-slate-50 border-b border-slate-50">
        {image ? (
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-10 h-10 text-slate-200" />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] font-bold text-primary shadow-sm backdrop-blur-sm">
            Current
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
          <Calendar className="w-3 h-3" />
          <span>{date || 'March 2024'}</span>
        </div>
        
        <h3 className="text-lg font-display font-bold text-primary mb-2 leading-tight group-hover:text-secondary transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-xs text-slate-500 line-clamp-2 font-serif leading-relaxed mb-4">
          {description}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">Release info</span>
            <span className="text-xs font-bold text-primary/80">Vol. {volume || '01'} No. {issue || '01'}</span>
          </div>
          
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 transition-all duration-300 group-hover:border-primary group-hover:text-primary">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalCard;
