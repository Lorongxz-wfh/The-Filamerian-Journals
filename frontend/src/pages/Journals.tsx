import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { Search, LayoutGrid, List, ChevronDown, X, Loader2 } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  publisher: string | null;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
}

const Journals: React.FC = () => {
  const initialJournals = JSON.parse(localStorage.getItem('journals_cache') || '[]');
  const initialCategories = JSON.parse(localStorage.getItem('categories_cache') || '["All"]');

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsTyping(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [sortOption, setSortOption] = useState<string>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [journals, setJournals] = useState<Journal[]>(initialJournals);
  const [availableCategories, setAvailableCategories] = useState<string[]>(initialCategories);
  const [loading, setLoading] = useState(initialJournals.length === 0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedYears, debouncedSearch]);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    subject: true,
    year: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync URL category param
  useEffect(() => {
    if (categoryParam) {
      const cats = categoryParam.split(',').map(c => c.trim()).filter(Boolean);
      setSelectedCategories(cats);
    }
  }, [categoryParam]);

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat) 
      ? selectedCategories.filter(c => c !== cat) 
      : [...selectedCategories, cat];
      
    setSelectedCategories(next);
    
    // Update URL
    if (next.length === 0) {
      navigate('/journals');
    } else {
      navigate(`/journals?category=${next.map(c => encodeURIComponent(c)).join(',')}`);
    }
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      try {
        let url = `/public/journals?with_volumes=1&page=${currentPage}`;
        if (selectedCategories.length > 0) {
          url += `&category=${encodeURIComponent(selectedCategories.join(','))}`;
        }
        if (selectedYears.length > 0) {
          url += `&year=${encodeURIComponent(selectedYears.join(','))}`;
        }
        if (debouncedSearch) {
          url += `&q=${encodeURIComponent(debouncedSearch)}`; // Backend doesn't support 'q' for journals yet, but we'll leave client side filter too
        }

        const [jrnRes, setRes] = await Promise.all([
          api.get(url),
          api.get('/public/settings')
        ]);
        
        const newJournals = jrnRes.data.data;
        setJournals(newJournals);
        setCurrentPage(jrnRes.data.meta?.current_page || 1);
        setLastPage(jrnRes.data.meta?.last_page || 1);

        if (currentPage === 1 && selectedCategories.length === 0 && selectedYears.length === 0) {
          localStorage.setItem('journals_cache', JSON.stringify(newJournals));
        }
        
        const catsString = setRes.data.data.journal_categories || 'Science, Education, Arts, Multidisciplinary';
        const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
        const newCategories = ['All', ...catsArray];
        setAvailableCategories(newCategories);
        localStorage.setItem('categories_cache', JSON.stringify(newCategories));
      } catch (err) {
        console.error('Failed to fetch journals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [currentPage, selectedCategories, selectedYears, debouncedSearch]);

  // Only the actual categories (without "All")
  const actualCategories = useMemo(() =>
    availableCategories.filter(c => c !== 'All'), [availableCategories]
  );

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    journals.forEach(j => {
      if (j.volumes && j.volumes.length > 0) {
        j.volumes.forEach(v => {
          if (v.year) years.add(v.year.toString());
        });
      } else if (j.created_at) {
        years.add(new Date(j.created_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [journals]);

  const filtered = useMemo(() => {
    let result = journals.filter((j) => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(j.category);
      const matchesSearch = j.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (j.description && j.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
        
      let matchesYear = true;
      if (selectedYears.length > 0) {
        const jYear = j.volumes?.[0]?.year?.toString() || (j.created_at ? new Date(j.created_at).getFullYear().toString() : '');
        matchesYear = selectedYears.includes(jYear);
      }
      
      return matchesCategory && matchesSearch && matchesYear;
    });

    result = [...result].sort((a, b) => {
      if (sortOption === 'a-z') return a.title.localeCompare(b.title);
      if (sortOption === 'z-a') return b.title.localeCompare(a.title);
      
      const aDate = a.volumes?.[0]?.year ? new Date(a.volumes[0].year.toString()).getTime() : new Date(a.created_at || 0).getTime();
      const bDate = b.volumes?.[0]?.year ? new Date(b.volumes[0].year.toString()).getTime() : new Date(b.created_at || 0).getTime();
      
      if (sortOption === 'newest') return bDate - aDate;
      if (sortOption === 'oldest') return aDate - bDate;
      
      return 0;
    });
    
    return result;
  }, [journals, selectedCategories, debouncedSearch, selectedYears, sortOption]);

  const hasActiveFilters = selectedCategories.length > 0 || selectedYears.length > 0;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedYears([]);
    navigate('/journals');
  };

  return (
    <PageWrapper className="flex flex-col">
      {/* Page Header */}
      <PageHeader title="Our Journals">
        <div className="relative w-full md:w-72 mt-4 md:mt-0 md:absolute md:right-0 md:bottom-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
          <input
            type="text"
            placeholder="Search journals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 bg-surface border border-border text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isTyping && search && <Loader2 className="h-4 w-4 animate-spin text-muted/40" />}
            {search && !isTyping && (
              <button onClick={() => setSearch('')} className="text-muted/40 hover:text-primary transition-colors h-4 w-4 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Main Layout: Sidebar + Results */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* ── Left Sidebar ── */}
        <aside className="w-full lg:w-[220px] shrink-0">
          <div className="sticky top-24 space-y-1">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Filter By</h3>

            {/* Subject / Discipline */}
            <div className="border border-border">
              <button
                onClick={() => toggleSection('subject')}
                className="flex items-center justify-between w-full px-4 py-3 text-[12px] font-semibold text-primary uppercase tracking-wider hover:bg-surface/50 transition-colors"
              >
                Subject / Discipline
                <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${openSections.subject ? 'rotate-180' : ''}`} />
              </button>
              {openSections.subject && (
                <div className="px-4 pb-4 space-y-2.5">
                  {actualCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-3.5 h-3.5 accent-[#005a9c] cursor-pointer"
                      />
                      <span className="text-[12px] text-muted group-hover:text-primary transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Publication Year */}
            <div className="border border-border">
              <button
                onClick={() => toggleSection('year')}
                className="flex items-center justify-between w-full px-4 py-3 text-[12px] font-semibold text-primary uppercase tracking-wider hover:bg-surface/50 transition-colors"
              >
                Publication Year
                <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${openSections.year ? 'rotate-180' : ''}`} />
              </button>
              {openSections.year && (
                <div className="px-4 pb-4 space-y-2.5">
                  {availableYears.map(year => (
                    <label key={year} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                        className="w-3.5 h-3.5 accent-[#005a9c] cursor-pointer"
                      />
                      <span className="text-[12px] text-muted group-hover:text-primary transition-colors">{year}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full mt-3 py-2 text-[11px] font-medium text-muted hover:text-red-600 border border-border hover:border-red-300 transition-colors uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* ── Results Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Results Header: Active Chips + Sort + View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-6">
            {/* Active Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap min-h-[32px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-medium px-2.5 py-1 uppercase tracking-wider"
                >
                  {cat}
                  <button onClick={() => toggleCategory(cat)} className="hover:text-red-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedYears.map(year => (
                <span
                  key={year}
                  className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary text-[11px] font-medium px-2.5 py-1 uppercase tracking-wider"
                >
                  {year}
                  <button onClick={() => toggleYear(year)} className="hover:text-red-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {!hasActiveFilters && (
                <span className="text-[11px] text-muted">Showing all journals</span>
              )}
            </div>

            {/* Sort + View Controls */}
            <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none border border-border bg-surface pl-3 pr-8 py-1.5 text-[12px] font-medium text-primary focus:outline-none focus:border-primary transition-colors h-[34px] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Title (A-Z)</option>
                <option value="z-a">Title (Z-A)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
            </div>

              <div className="inline-flex items-center border border-border bg-surface rounded-sm h-[34px]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 h-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 h-full flex items-center justify-center transition-colors border-l border-border ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid / List */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
                <Spinner text="Loading journals..." />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No journals found" description="No journals matched your filter criteria." className="py-20 border border-border bg-surface" />
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8" 
                : "flex flex-col space-y-4 w-full"
              }>
                {filtered.map((j) => {
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
                      publisher={j.publisher || undefined}
                      viewMode={viewMode}
                      className={viewMode === 'grid' ? "h-full flex flex-col justify-start border border-border bg-transparent hover:bg-surface hover:shadow-md hover:-translate-y-1 py-6 px-[15px] mx-auto w-full min-h-[320px]" : ""}
                    />
                  );
                })}
              </div>
            )}

            {!loading && lastPage > 1 && (
              <Pagination 
                currentPage={currentPage} 
                lastPage={lastPage} 
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
              />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Journals;
