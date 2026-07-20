import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import api, { STORAGE_URL } from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import { Seo } from '@/components/ui/Seo';
import PageWrapper from '@/components/layout/PageWrapper';
import Spinner from '@/components/ui/Spinner';
import { useSettings } from '@/contexts/SettingsContext';

// Dynamic categories fetched from API

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const DEFAULT_ABOUT_US = '<h2 class="text-xl font-bold uppercase tracking-wider text-primary">The Filamerian Journals</h2>\n  <p class="text-[14px] text-muted leading-relaxed">\n    <strong>The Filamerian Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n  </p>';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const { settings } = useSettings();
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const calculatePages = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      // If no scrolling is needed
      if (maxScroll <= 0) {
        setTotalPages(1);
        return;
      }
      // Calculate how many "pages" of clientWidth fit in the total scrollable area
      const pages = Math.ceil(container.scrollWidth / container.clientWidth);
      setTotalPages(pages > 0 ? pages : 1);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 0 && totalPages > 1) {
      const scrollRatio = container.scrollLeft / maxScroll;
      const active = Math.round(scrollRatio * (totalPages - 1));
      setActiveScrollIndex(active);
    }
  };

  const scrollToDot = (index: number) => {
    if (scrollContainerRef.current && totalPages > 1) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = (maxScroll / (totalPages - 1)) * index;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Recalculate pages when articles load or window resizes
    const timer = setTimeout(calculatePages, 100);
    window.addEventListener('resize', calculatePages);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePages);
    };
  }, [latestArticles]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Instantly load from localStorage (Stale-While-Revalidate)
      const cachedHome = localStorage.getItem('filamerian_home_cache');
      if (cachedHome) {
        try {
          const { journals: cJournals, latest: cLatest, announcements: cAnn } = JSON.parse(cachedHome);
          if (cJournals) setJournals(cJournals);
          if (cLatest) setLatestArticles(cLatest);
          if (cAnn) setAnnouncements(cAnn);
          setLoading(false); // Stop loading spinner instantly if cache exists
        } catch(e) {}
      }

      // 2. Fetch fresh data in the background
      try {
        const [jrnRes, latestRes, annRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/articles/latest'),
          api.get('/public/announcements')
        ]);
        
        const freshJournals = jrnRes.data.data;
        const freshLatest = latestRes.data.data;
        const freshAnnouncements = annRes.data.data.slice(0, 3);

        setJournals(freshJournals);
        setLatestArticles(freshLatest);
        setAnnouncements(freshAnnouncements);
        
        // Update Local Cache
        localStorage.setItem('filamerian_home_cache', JSON.stringify({
          journals: freshJournals,
          latest: freshLatest,
          announcements: freshAnnouncements
        }));
      } catch (err) {
        console.error('Failed to fetch public data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const catsString = settings.journal_categories || 'Science, Education, Arts, Multidisciplinary';
  const availableCategories = ['All', ...catsString.split(',').map((s: string) => s.trim()).filter(Boolean)];
  const aboutUsHtml = settings.home_about_us || DEFAULT_ABOUT_US;

  const filteredJournals = activeTab === 'All'
    ? journals
    : journals.filter((j) =>
        j.category === activeTab || (activeTab === 'All')
      );

  return (
    <PageWrapper className="flex flex-col">
  <Seo title="Home" description="Home page of The Filamerian Journals" />
  {/* Hero Section */}
      {/* Hero Section */}
      {aboutUsHtml && (
        <div 
          className="w-full px-[10%] text-center space-y-1.5 border-b border-border mb-5 pb-5"
          dangerouslySetInnerHTML={{ __html: aboutUsHtml }} 
        />
      )}

      <div className="w-full flex-1 flex flex-col">
        {/* Latest Publications */}
        {latestArticles.length > 0 && (
          <div className="mb-12 relative group/carousel">
            <div className="flex items-center justify-between border-b border-border mb-6 overflow-x-auto min-h-[40px] pb-2 gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider shrink-0 text-primary flex items-center gap-3">
                Latest Publications
              </h2>
              
              {/* Scroll Indicators / Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => scroll('left')}
                  className="p-1.5 border border-border text-muted hover:text-primary hover:border-primary transition-colors bg-surface"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="p-1.5 border border-border text-muted hover:text-primary hover:border-primary transition-colors bg-surface"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative"
            >
              {latestArticles.map((article) => (
                <Link key={article.id} to={`/articles/${article.id}`} className="shrink-0 w-[85vw] sm:w-[340px] lg:w-[380px] flex flex-col border border-border bg-surface p-6 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 snap-start h-[260px] group relative overflow-hidden">
                  {/* Subtle accent line on hover */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {article.volume?.journal?.title || 'Unknown Journal'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-primary uppercase tracking-wider mb-3 line-clamp-2 group-hover:text-secondary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[13px] text-muted leading-relaxed line-clamp-3 mb-5 flex-grow">
                    {article.abstract || 'No abstract available.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted uppercase tracking-wider truncate pt-4 border-t border-border">
                    <span className="truncate pr-4">{article.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}</span>
                    <span className="shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dots Indicator */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToDot(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeScrollIndex === i 
                        ? 'w-6 bg-secondary' 
                        : 'w-2 bg-border hover:bg-muted'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-9 xl:gap-[60px] items-start">
          {/* Journals Grid */}
          <div className="lg:col-span-9 flex flex-col">
            <div className="flex items-center justify-between border-b border-border mb-4 overflow-x-auto min-h-[40px] pb-2 gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider shrink-0">
                Academic Journals
              </h2>
              <div className="flex gap-4 sm:gap-6 shrink-0">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`text-[12px] font-medium pb-1 transition-colors ${
                      activeTab === cat
                        ? 'font-semibold text-primary border-b-2 border-primary'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col mb-8">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
                  <Spinner text="Loading journals..." />
                </div>
              ) : filteredJournals.length === 0 ? (
                <EmptyState title="No journals" description="No journals in this category." className="flex-1 flex flex-col items-center justify-center py-12 border border-border bg-surface mt-4 min-h-[40vh]" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredJournals.slice(0, 15).map((j) => {
                    const latestVol = j.volumes?.[0];
                    
                    return (
                      <JournalCard
                        key={j.id}
                        slug={j.slug}
                        title={j.title}
                        description={j.description}
                        date={latestVol?.year ? latestVol.year.toString() : new Date(j.created_at).getFullYear().toString()}
                        volume={j.volumes?.length ? `${j.volumes.length} Volume/s` : 'No Volumes'}
                        image={j.cover_image ? `${STORAGE_URL}${j.cover_image}` : undefined}
                        category={j.category}
                        viewMode="grid"
                        className="h-full flex flex-col justify-start border border-border bg-transparent hover:bg-surface hover:shadow-md hover:-translate-y-1 py-6 px-[15px] max-w-[260px] mx-auto w-full min-h-[320px]"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-center mt-auto">
              <Link
                to="/journals"
                className="px-6 py-2.5 border border-border text-[13px] font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                View All Publications
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-9">
            {/* Announcements */}
            <div className="border border-border bg-surface p-5 h-[425px] flex flex-col">
              <Link to="/announcements" className="flex items-center justify-between mb-6 pb-3 border-b border-border group">
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                  Announcements
                </h3>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </Link>

              {loading ? (
                <Spinner text="Loading news..." size="sm" className="py-8" />
              ) : (
                <div className="space-y-6 flex-1 relative overflow-hidden">
                  {announcements.slice(0, 3).map((item, i) => (
                    <Link to="/announcements" key={item.id} className="group block">
                      <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="text-[13px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mt-1">
                        {item.title}
                      </h4>
                      <div 
                        className="text-[12px] text-muted line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
                      />
                      {i < 2 && <div className="border-b border-border mt-4" />}
                    </Link>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-xs text-muted">No announcements posted.</p>
                  )}
                  
                  {/* Fading effect overlay at the bottom */}
                  {announcements.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-surface via-surface/90 to-transparent flex items-end justify-center pb-2 pointer-events-none">
                       <Link to="/announcements" className="px-6 py-2 bg-[#d83526] hover:bg-red-700 text-white text-[13px] font-medium rounded-full pointer-events-auto transition-all shadow-md hover:shadow-lg">
                         See All News
                       </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="border border-border bg-surface p-5 flex flex-col">
              <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-5 pb-3 border-b border-border">
                Quick Links
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2.5">Browse</h4>
                  <ul className="space-y-2 text-[13px] text-muted">
                    <li><Link to="/journals" className="hover:text-primary transition-colors">All Journals</Link></li>
                    <li><Link to="/archives" className="hover:text-primary transition-colors">Archives & Past Volumes</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2.5">Author Corner</h4>
                  <ul className="space-y-2 text-[13px] text-muted">
                    <li><Link to="/dashboard" className="hover:text-primary transition-colors">Submit Materials</Link></li>
                    <li><Link to="/login" className="hover:text-primary transition-colors">Portal Login</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2.5">About Us</h4>
                  <ul className="space-y-2 text-[13px] text-muted">
                    <li><Link to="/about" className="hover:text-primary transition-colors">Policies & Information</Link></li>
                    <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Home;
