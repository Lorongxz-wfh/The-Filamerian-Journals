import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Search, Megaphone } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/public/announcements');
        setAnnouncements(res.data.data);
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(
      (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  const totalPages = Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE);
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnnouncements, currentPage]);

  return (
    <PageWrapper className="flex flex-col w-full font-sans">
      <div className="w-full space-y-6 flex flex-col">
        {/* Page Header */}
        <PageHeader title="Announcements & Notices">
          <p className="text-xs text-muted mt-1.5 font-sans">
            Official Call for Papers, Editorial Updates & Academic Research Announcements
          </p>
        </PageHeader>

        {/* Toolbar Filter & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 border border-border shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search announcements & notices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border text-xs font-medium text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5 text-secondary" />
            <span>Showing {filteredAnnouncements.length} Announcement{filteredAnnouncements.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[40vh]">
              <Spinner text="Loading announcements..." />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <EmptyState 
              title="No announcements found" 
              description={searchQuery ? "No matching announcements found for your search query." : "No announcements posted yet."} 
              className="border border-border bg-surface py-16" 
            />
          ) : (
            paginatedAnnouncements.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              return (
                <article 
                  key={item.id} 
                  onClick={() => toggleExpand(item.id)}
                  className="group border border-border bg-surface hover:border-primary/40 transition-colors duration-200 cursor-pointer p-6 sm:p-7 shadow-xs"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-secondary px-2.5 py-1 text-[11px] font-bold font-mono uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                          <Calendar className="h-3 w-3 text-secondary shrink-0" />
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-serif font-bold text-primary group-hover:text-secondary transition-colors leading-snug mb-3">
                      {item.title}
                    </h2>

                    <div 
                      className={`prose prose-sm max-w-none text-xs sm:text-[13px] text-muted leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
                    />

                    <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors">
                      <span>{isExpanded ? 'Show Less' : 'Read Full Announcement'}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-secondary' : ''}`} />
                    </div>
                </article>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              lastPage={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Announcements;
