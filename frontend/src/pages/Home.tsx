import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { ChevronRight, ChevronLeft, ArrowRight, Search } from 'lucide-react';
import DOMPurify from 'dompurify';
import api, { getFileUrl } from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import { Seo } from '@/components/ui/Seo';
import PageWrapper from '@/components/layout/PageWrapper';
import Spinner from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSettings } from '@/contexts/SettingsContext';

// Dynamic categories fetched from API

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: any;
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearchQuery.trim())}`);
    }
  };
  const [isTabChanging, setIsTabChanging] = useState<boolean>(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (cat: string) => {
    if (cat === activeTab) return;
    setIsTabChanging(true);
    setActiveTab(cat);
    setTimeout(() => setIsTabChanging(false), 200);
  };

  const { settings } = useSettings();
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -clientWidth : clientWidth, behavior: 'smooth' });
    }
  };

  const calculatePages = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 1) {
      setTotalPages(1);
      return;
    }
    // Count pages as how many full clientWidths fit, capped at number of articles
    const pages = Math.ceil(container.scrollWidth / container.clientWidth);
    setTotalPages(Math.max(1, pages));
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 0) {
      const scrollRatio = container.scrollLeft / maxScroll;
      const active = Math.min(Math.round(scrollRatio * (totalPages - 1)), totalPages - 1);
      setActiveScrollIndex(active);
    }
  };

  const scrollToDot = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0 || totalPages <= 1) return;
    const targetScroll = (maxScroll / (totalPages - 1)) * index;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  // Use ResizeObserver to reliably detect when the container's scroll size changes
  // (fires after paint, unlike setTimeout which often fires before DOM is laid out)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(() => {
      calculatePages();
    });
    observerRef.current.observe(container);

    // Also recalculate on window resize
    window.addEventListener('resize', calculatePages);
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('resize', calculatePages);
    };
  }, [latestArticles, calculatePages]);

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
        const [jrnRes, latestRes, annRes, catRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/articles/latest'),
          api.get('/public/announcements'),
          api.get('/public/categories')
        ]);
        
        const freshJournals = jrnRes.data.data;
        const freshLatest = latestRes.data.data;
        const freshAnnouncements = annRes.data.data.slice(0, 3);
        const freshCategories = (catRes.data.data || []).map((c: any) => c.name);

        setJournals(freshJournals);
        setLatestArticles(freshLatest);
        setAnnouncements(freshAnnouncements);
        setCategoriesList(freshCategories);
        
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

  const availableCategories = ['All', ...categoriesList];
  
  const showTagline = settings.show_tagline === 'true';
  const showAboutUs = settings.show_about_us !== 'false';
  const aboutUsHtml = settings.home_about_us || DEFAULT_ABOUT_US;

  const filteredJournals = activeTab === 'All'
    ? journals
    : journals.filter((j) => {
        const catName = typeof j.category === 'object' && j.category !== null ? (j.category as any).name : j.category;
        return catName === activeTab;
      });

  const [homeLayout, setHomeLayout] = useState<'original' | 'editorial' | 'bento' | 'minimal'>('original');

  return (
    <PageWrapper className="flex flex-col relative pb-16">
      <Seo title="Home" description="Home page of The Filamerian Journals" />

      {/* Floating Demo Switcher (Local Host Only) */}
      <div className="fixed bottom-6 right-6 z-[999] bg-primary/95 text-white p-2.5 rounded-full shadow-2xl border border-secondary flex items-center gap-1.5 backdrop-blur-md">
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest px-2">Demo Revamp:</span>
        <button
          onClick={() => setHomeLayout('original')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            homeLayout === 'original' ? 'bg-secondary text-primary shadow-sm' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setHomeLayout('editorial')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            homeLayout === 'editorial' ? 'bg-secondary text-primary shadow-sm' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          Option 1: Editorial
        </button>
        <button
          onClick={() => setHomeLayout('bento')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            homeLayout === 'bento' ? 'bg-secondary text-primary shadow-sm' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          Option 2: Bento Grid
        </button>
        <button
          onClick={() => setHomeLayout('minimal')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            homeLayout === 'minimal' ? 'bg-secondary text-primary shadow-sm' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          Option 3: Minimal
        </button>
      </div>

      {/* ========================================================= */}
      {/* OPTION 1: EDITORIAL ACADEMIC SHOWCASE                    */}
      {/* ========================================================= */}
      {homeLayout === 'editorial' && (
        <div className="space-y-12 w-full">
          {/* Editorial Hero Banner */}
          <div className="border border-border bg-surface p-8 lg:p-12 relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-secondary text-[11px] font-bold uppercase tracking-widest">
                <span>Filamer Christian University</span> · <span>Open Access Repository</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-primary leading-tight">
                Peer-Reviewed Scholarly Journals & Faculty Research
              </h1>
              <p className="text-muted text-sm leading-relaxed max-w-xl">
                Explore interdisciplinary research, capstones, case studies, and faculty theses published across various academic disciplines.
              </p>

              {/* Interactive Search Hero Bar */}
              <form onSubmit={handleHeroSearch} className="flex items-center gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    placeholder="Search articles, keywords, authors, or DOI..."
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-colors shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  Search
                </button>
              </form>
              
              {/* Quick Metrics Bar */}
              <div className="pt-4 flex flex-wrap gap-8 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-primary font-mono">{journals.length || 12}</div>
                  <div className="text-xs text-muted uppercase tracking-wider font-medium">Academic Journals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary font-mono">150+</div>
                  <div className="text-xs text-muted uppercase tracking-wider font-medium">Published Papers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary font-mono">{categoriesList.length || 4}</div>
                  <div className="text-xs text-muted uppercase tracking-wider font-medium">Research Fields</div>
                </div>
              </div>
            </div>

            {/* Right Side: Featured Journal Cover Highlight */}
            <div className="lg:col-span-5 border border-primary/20 bg-background p-6 space-y-4 shadow-xl relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-primary px-2.5 py-1 inline-block">
                Editor's Pick Highlight
              </span>
              <h3 className="text-lg font-bold text-primary uppercase line-clamp-2">
                {journals[0]?.title || 'The Filamerian Multidisciplinary Journal'}
              </h3>
              <p className="text-xs text-muted line-clamp-3">
                {journals[0]?.description || 'Featured volume containing peer-reviewed studies in education, technology, and health sciences.'}
              </p>
              <Link
                to={journals[0] ? `/journals/${journals[0].slug}` : '/journals'}
                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-secondary uppercase tracking-wider pt-2"
              >
                Read Featured Issue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Carousel & Main Grid */}
          {latestArticles.length > 0 && (
            <div className="border-t border-border pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-primary">Latest Research Output</h2>
                <Link to="/archives" className="text-xs font-bold text-muted hover:text-primary uppercase tracking-wider">Explore Archives →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.slice(0, 3).map((art) => (
                  <Link key={art.id} to={`/articles/${art.id}`} className="border border-border bg-surface p-6 hover:border-primary transition-colors flex flex-col justify-between h-[240px]">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider">{art.volume?.journal?.title || 'Journal Paper'}</span>
                      <h4 className="text-sm font-bold text-primary uppercase line-clamp-2">{art.title}</h4>
                      <p className="text-xs text-muted line-clamp-3">{art.abstract}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-primary pt-4 border-t border-border flex items-center justify-between">Read Paper <ArrowRight className="h-3 w-3" /></span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* OPTION 2: MODERN BENTO GRID                               */}
      {/* ========================================================= */}
      {homeLayout === 'bento' && (
        <div className="space-y-8 w-full">
          {/* Bento Grid Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Hero Card (8 cols) */}
            <div className="lg:col-span-8 border border-border bg-primary text-white p-8 lg:p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
              <div className="space-y-4 z-10">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest border border-secondary px-3 py-1 inline-block">
                  Filamer Christian University
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold uppercase tracking-wide !text-white">
                  The Filamerian Journals Database
                </h1>
                <p className="text-white/80 text-xs sm:text-sm max-w-lg leading-relaxed">
                  Access published academic journals, faculty research papers, thesis archives, and case studies.
                </p>
              </div>
              <div className="pt-6 z-10 flex items-center gap-4">
                <Link to="/journals" className="px-5 py-2 bg-secondary text-primary font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">
                  Browse Publications
                </Link>
                <Link to="/archives" className="px-5 py-2 border border-white/30 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors">
                  Search Archives
                </Link>
              </div>
            </div>

            {/* Quick Stats Bento Box (4 cols) */}
            <div className="lg:col-span-4 border border-border bg-surface p-6 flex flex-col justify-between space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">Repository Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="text-xs text-muted uppercase font-semibold">Active Journals</span>
                  <span className="text-base font-bold text-primary font-mono">{journals.length || 12}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="text-xs text-muted uppercase font-semibold">Total Articles</span>
                  <span className="text-base font-bold text-primary font-mono">150+</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background border border-border">
                  <span className="text-xs text-muted uppercase font-semibold">Access Level</span>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 uppercase">Free Open Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Research Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journals.slice(0, 6).map((j) => (
              <div key={j.id} className="border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-primary transition-all">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider">
                    {typeof j.category === 'object' && j.category !== null ? j.category.name : j.category}
                  </span>
                  <h4 className="text-sm font-bold text-primary uppercase line-clamp-2">{j.title}</h4>
                  <p className="text-xs text-muted line-clamp-3">{j.description}</p>
                </div>
                <Link to={`/journals/${j.slug}`} className="text-xs font-semibold text-primary hover:text-secondary pt-3 border-t border-border flex items-center justify-between">
                  View Journal <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OPTION 3: MINIMALIST POLISH                               */}
      {/* ========================================================= */}
      {homeLayout === 'minimal' && (
        <div className="space-y-12 w-full">
          <div className="text-center space-y-3 max-w-2xl mx-auto py-4">
            <span className="text-[11px] font-bold text-secondary bg-primary px-3 py-1 uppercase tracking-widest inline-block">Official University Database</span>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-primary">The Filamerian Journals</h1>
            <p className="text-xs text-muted leading-relaxed">
              Official online database of published academic journals, case studies, capstones, and faculty research at Filamer Christian University.
            </p>
          </div>

          {/* 3 Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-border py-8">
            <Link to="/journals" className="p-6 border border-border bg-surface hover:bg-background transition-colors space-y-2 text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Academic Journals</h4>
              <p className="text-xs text-muted">Browse active research publications by academic discipline.</p>
            </Link>
            <Link to="/archives" className="p-6 border border-border bg-surface hover:bg-background transition-colors space-y-2 text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Archive Library</h4>
              <p className="text-xs text-muted">Search past volumes and issue collections across all years.</p>
            </Link>
            <Link to="/announcements" className="p-6 border border-border bg-surface hover:bg-background transition-colors space-y-2 text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">University News</h4>
              <p className="text-xs text-muted">Read call for papers, submission guidelines, and updates.</p>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ORIGINAL LAYOUT (CURRENT DEFAULT)                        */}
      {/* ========================================================= */}
      {homeLayout === 'original' && (
        <>
          {/* Hero Section */}
          {((settings.tagline && showTagline) || (aboutUsHtml && showAboutUs)) && (
            <div className="w-full px-[10%] text-center mb-5 flex flex-col items-center">
              {settings.tagline && showTagline && (
                <div className="mb-4 text-[12px] font-bold text-secondary uppercase tracking-widest bg-primary px-4 py-1.5 inline-block">
                  {settings.tagline}
                </div>
              )}
              {aboutUsHtml && showAboutUs && (
                <div 
                  className="space-y-1.5 w-full"
                  dangerouslySetInnerHTML={{ __html: aboutUsHtml }} 
                />
              )}
            </div>
          )}

          <div className="w-full flex-1 flex flex-col">
            {/* Latest Publications */}
            {latestArticles.length > 0 && (
              <div className="mb-12 relative group/carousel">
                <div className="flex items-center justify-between border-b border-border mb-6 overflow-x-auto min-h-[40px] pb-2 gap-4">
                  <h2 className="text-lg font-bold uppercase tracking-wider shrink-0 text-primary flex items-center gap-3">
                    Latest Articles
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
                    <Link key={article.id} to={`/articles/${article.id}`} className="shrink-0 w-[85vw] sm:w-[340px] lg:w-[380px] flex flex-col border border-primary bg-primary p-6 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 snap-start h-[260px] group relative overflow-hidden">
                      {/* Subtle Gold accent line on hover */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {article.volume?.journal?.title || 'Unknown Journal'}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-white uppercase tracking-wider mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[13px] text-white/80 leading-relaxed line-clamp-3 mb-5 flex-grow">
                        {article.abstract || 'No abstract available.'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-white/70 uppercase tracking-wider truncate pt-4 border-t border-white/20">
                        <span className="truncate pr-4">{article.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/70 group-hover:text-secondary group-hover:translate-x-1 transition-all mr-3" />
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border mb-4 min-h-[40px] pb-2 gap-4">
                  <h2 className="text-lg font-bold uppercase tracking-wider shrink-0">
                    Academic Journals
                  </h2>
                  <div className="flex items-center overflow-x-auto max-w-full sm:max-w-[60%] md:max-w-[70%] gap-4 sm:gap-6 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleTabChange(cat)}
                        className={`text-[12px] font-medium pb-1 transition-colors whitespace-nowrap shrink-0 ${
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
                  {loading || isTabChanging ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border border-border p-5 space-y-4 max-w-[260px] mx-auto w-full h-[320px]">
                          <Skeleton className="h-40 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
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
                            image={getFileUrl(j.cover_image)}
                            category={typeof j.category === 'object' && j.category !== null ? (j.category as any).name : j.category}
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
                <div className="border border-border bg-surface p-5 flex flex-col">
                  <Link to="/announcements" className="flex items-center justify-between mb-4 pb-3 border-b border-border group">
                    <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                      Announcements
                    </h3>
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                  </Link>

                  {loading ? (
                    <Spinner text="Loading news..." size="sm" className="py-8" />
                  ) : (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div>
                        {announcements.slice(0, 3).map((item, i) => (
                          <Link to="/announcements" key={item.id} className="group block">
                            <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            <h4 className="text-[13px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mt-0.5">
                              {item.title}
                            </h4>
                            <div 
                              className="text-[12px] text-muted line-clamp-2 prose prose-sm max-w-none mt-1"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
                            />
                            {i < 2 && <div className="border-b border-border mt-3.5" />}
                          </Link>
                        ))}
                        {announcements.length === 0 && (
                          <p className="text-xs text-muted">No announcements posted.</p>
                        )}
                      </div>
                      
                      {/* Clean bottom button */}
                      {announcements.length > 0 && (
                        <div className="pt-3 border-t border-border mt-4 flex justify-center">
                           <Link to="/announcements" className="px-5 py-1.5 bg-[#d83526] hover:bg-red-700 text-white text-xs font-medium rounded-full transition-all shadow-xs hover:shadow-sm">
                             See All News
                           </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
};

export default Home;
