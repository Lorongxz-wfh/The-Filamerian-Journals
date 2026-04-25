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
    <div className={cn('bezel-card-outer group cursor-pointer', className)}>
      <div className="bezel-card-inner flex flex-col h-full bg-white overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-6 bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-primary/20" />
            </div>
          )}
          
          {/* Overlay Tag */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-primary shadow-sm backdrop-blur-sm">
              Featured
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-secondary uppercase tracking-widest">
            <Calendar className="w-3 h-3" />
            <span>{date || 'March 2024'}</span>
          </div>
          
          <h3 className="text-xl font-display font-bold text-primary mb-3 leading-tight group-hover:text-secondary transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-sm text-slate-600 line-clamp-3 font-serif leading-relaxed mb-6">
            {description}
          </p>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Current Release</span>
              <span className="text-xs font-bold text-primary">Vol. {volume || '01'} No. {issue || '01'}</span>
            </div>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalCard;
