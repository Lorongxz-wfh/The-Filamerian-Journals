import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { BookOpen, FileText, ArrowRight, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileUrl } from '@/services/api';

import HighlightText from '@/components/ui/HighlightText';

interface SearchDropdownProps {
  query: string;
  results: { journals: any[]; articles: any[] } | null;
  pages?: { label: string; path: string; icon: any }[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ query, results, pages, loading, isOpen, onClose, className }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !query.trim()) return null;

  const journals = results?.journals.slice(0, 3) || [];
  const articles = results?.articles.slice(0, 3) || [];
  const pageResults = pages?.slice(0, 3) || [];
  const hasResults = journals.length > 0 || articles.length > 0 || pageResults.length > 0;

  return (
    <div 
      ref={dropdownRef}
      className={cn(
        "absolute top-[calc(100%+8px)] left-0 w-full bg-surface border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden",
        className
      )}
    >
      <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
        {loading && !pageResults.length ? (
          <div className="flex items-center justify-center p-8 text-muted">
            <Loader2 className="w-5 h-5 animate-spin mr-3" />
            <span className="text-[13px]">Searching...</span>
          </div>
        ) : !hasResults ? (
          <div className="p-6 text-center text-muted">
            <p className="text-[13px]">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Pages (Portal Search) */}
            {pageResults.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Pages
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {pageResults.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <Link 
                        key={i} 
                        to={p.path}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 hover:bg-background transition-colors group"
                      >
                        <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="text-[13px] font-semibold text-primary uppercase tracking-wider group-hover:text-secondary transition-colors">
                          <HighlightText text={p.label} query={query} />
                        </h4>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Journals */}
            {journals.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Journals
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {journals.map(j => (
                    <Link 
                      key={j.id} 
                      to={`/journals/${j.slug}`}
                      onClick={onClose}
                      className="flex items-start gap-3 p-3 hover:bg-background transition-colors group"
                    >
                      <div className="w-10 h-14 bg-background border border-border shrink-0 overflow-hidden relative flex items-center justify-center">
                        {j.cover_image && (
                          <img 
                            src={getFileUrl(j.cover_image)} 
                            alt={j.title} 
                            className="w-full h-full object-cover relative z-10" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                          <BookOpen className="w-4 h-4 text-primary/40" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-primary uppercase tracking-wider truncate group-hover:text-secondary transition-colors">
                          <HighlightText text={j.title} query={query} />
                        </h4>
                        <p className="text-[12px] text-muted line-clamp-1 mt-0.5">
                          <HighlightText text={j.description || ''} query={query} />
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {articles.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Articles
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {articles.map(a => (
                    <Link 
                      key={a.id} 
                      to={`/articles/${a.id}`} 
                      onClick={onClose}
                      className="block p-3 hover:bg-background transition-colors group"
                    >
                      <h4 className="text-[13px] font-semibold text-primary uppercase tracking-wider line-clamp-2 group-hover:text-secondary transition-colors">
                        <HighlightText text={a.title} query={query} />
                      </h4>
                      <p className="text-[12px] text-muted mt-1 truncate">
                        <HighlightText 
                          text={a.authors?.map((author: any) => author.name).join(', ') || 'No authors listed'} 
                          query={query} 
                        />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View All Button */}
      {hasResults && (
        <Link 
          to={isDashboard ? `/dashboard/articles` : `/search?q=${encodeURIComponent(query)}`}
          onClick={onClose}
          className="block w-full p-4 text-center text-[12px] font-bold text-primary uppercase tracking-wider bg-background border-t border-border hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          View all results for "{query}" <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

export default SearchDropdown;
