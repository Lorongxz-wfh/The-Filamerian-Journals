import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronDown, BookOpen, FileText, Quote, LayoutGrid, Columns, Calendar, Filter, Eye, Layers, Search, ArrowUpDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import api, { getFileUrl } from '@/services/api';
import CitationModal from '@/components/ui/CitationModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatVolumeName } from '@/lib/utils';

interface Author {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  abstract: string | null;
  doi: string | null;
  page_start: number | null;
  page_end: number | null;
  pdf_path: string | null;
  cover_path: string | null;
  authors: Author[];
}

interface Volume {
  id: number;
  volume_number: number | string;
  year: number;
  articles: Article[];
}

interface Journal {
  id: number;
  slug: string;
  title: string;
  category: any;
  issn: string;
  cover_image: string | null;
  volumes: Volume[];
}

interface VolumeItem {
  id: number;
  volume_number: number | string;
  year: number;
  journal: {
    id: number;
    title: string;
    slug: string;
    categoryName: string;
    issn: string;
    cover_image: string | null;
  };
  articles: Article[];
}

const Archives: React.FC = () => {
  const initialArchives = JSON.parse(localStorage.getItem('archives_cache') || '[]');
  const [journals, setJournals] = useState<Journal[]>(initialArchives);
  const [loading, setLoading] = useState(initialArchives.length === 0);

  // View Mode: 'shelf' (Option 1) | 'split' (Option 2)
  const [viewMode, setViewMode] = useState<'shelf' | 'split'>('shelf');

  // Filters, Search (with 300ms Debounce) & Sort
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'volume_desc'>('newest');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInputValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInputValue]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Selected Volume for Split View and Modals
  const [selectedSplitVolume, setSelectedSplitVolume] = useState<VolumeItem | null>(null);
  const [activeVolumeModal, setActiveVolumeModal] = useState<VolumeItem | null>(null);
  
  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);
  const [citationContext, setCitationContext] = useState<any>({});
  


  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/public/journals?with_volumes=1&page=${currentPage}`);
        setJournals(res.data.data);
        setCurrentPage(res.data.meta?.current_page || 1);
        setLastPage(res.data.meta?.last_page || 1);

        if (currentPage === 1) {
          localStorage.setItem('archives_cache', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('Failed to fetch archives', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [currentPage]);

  // Extract all volume items for Shelf & Split Views
  const allVolumes = useMemo<VolumeItem[]>(() => {
    const list: VolumeItem[] = [];
    journals.forEach((j) => {
      const catName = typeof j.category === 'object' && j.category !== null ? j.category.name : (j.category || 'Uncategorized');
      j.volumes?.forEach((v) => {
        list.push({
          id: v.id,
          volume_number: v.volume_number,
          year: v.year,
          journal: {
            id: j.id,
            title: j.title,
            slug: j.slug,
            categoryName: catName,
            issn: j.issn,
            cover_image: j.cover_image,
          },
          articles: v.articles || [],
        });
      });
    });
    return list;
  }, [journals]);

  // Set initial selected volume for Split View once loaded
  useEffect(() => {
    if (allVolumes.length > 0 && !selectedSplitVolume) {
      setSelectedSplitVolume(allVolumes[0]);
    }
  }, [allVolumes, selectedSplitVolume]);

  // Extract unique available years and categories for filters
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allVolumes.forEach((v) => { if (v.year) years.add(v.year); });
    return Array.from(years).sort((a, b) => b - a);
  }, [allVolumes]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allVolumes.forEach((v) => { if (v.journal.categoryName) cats.add(v.journal.categoryName); });
    return Array.from(cats).sort();
  }, [allVolumes]);



  // Filter & Sort volumes based on user selections
  const filteredVolumes = useMemo(() => {
    const list = allVolumes.filter((v) => {
      const matchesYear = selectedYear === 'all' || String(v.year) === selectedYear;
      const matchesCat = selectedCategory === 'all' || v.journal.categoryName === selectedCategory;
      const matchesSearch = !debouncedSearchQuery || 
        v.journal.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        v.articles.some(a => a.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      return matchesYear && matchesCat && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'newest') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0);
      if (sortBy === 'title_asc') return a.journal.title.localeCompare(b.journal.title);
      if (sortBy === 'title_desc') return b.journal.title.localeCompare(a.journal.title);
      if (sortBy === 'volume_desc') {
        const numA = parseInt(String(a.volume_number).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.volume_number).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      }
      return 0;
    });
  }, [allVolumes, selectedYear, selectedCategory, debouncedSearchQuery, sortBy]);

  // Remove artificial timers — filtering client-side is instant!
  useEffect(() => {
    if (filteredVolumes.length > 0) {
      setSelectedSplitVolume(filteredVolumes[0]);
    } else {
      setSelectedSplitVolume(null);
    }
  }, [filteredVolumes]);

  const groupedByJournal = useMemo(() => {
    const map: { [journalId: number]: { journal: any; volumes: VolumeItem[] } } = {};
    filteredVolumes.forEach((vol) => {
      if (!map[vol.journal.id]) {
        map[vol.journal.id] = { journal: vol.journal, volumes: [] };
      }
      map[vol.journal.id].volumes.push(vol);
    });
    return Object.values(map);
  }, [filteredVolumes]);

  const totalArticlesCount = useMemo(() => {
    return journals.reduce(
      (sum, j) => sum + (j.volumes?.reduce((vs, v) => vs + (v.articles?.length || 0), 0) || 0), 0
    );
  }, [journals]);

  const totalVolumesCount = useMemo(() => {
    return journals.reduce((sum, j) => sum + (j.volumes?.length || 0), 0);
  }, [journals]);

  const handleArticlePdfView = async (articleId: number) => {
    setIsPdfModalOpen(true);
    setPdfViewUrl(null);
    try {
      const res = await api.get(`/public/articles/${articleId}/download-url`);
      let url = res.data.url;
      if (url.includes('/storage/')) {
        const path = url.split('/storage/')[1];
        url = getFileUrl(path);
      }
      setPdfViewUrl(url + '#toolbar=0');
    } catch (err) {
      console.error('Failed to get download URL', err);
      toast.error('Could not load PDF document.');
      setIsPdfModalOpen(false);
    }
  };

  return (
    <PageWrapper className="flex flex-col w-full font-sans">
      <div className="w-full space-y-4 flex flex-col">
        {/* Page Header */}
        <PageHeader 
          title="Archives Repository" 
        />

        {/* Balanced 4-Column Summary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border shadow-xs">
          {[
            { label: 'Journals', value: journals.length },
            { label: 'Archived Volumes', value: totalVolumesCount },
            { label: 'Published Articles', value: totalArticlesCount },
            { label: 'Years Covered', value: availableYears.length > 0 ? `${availableYears[availableYears.length - 1]} – ${availableYears[0]}` : '-' },
          ].map((s) => (
            <div key={s.label} className="bg-surface py-2.5 px-4 flex items-center justify-center gap-2.5 text-center">
              <span className="text-sm font-bold text-primary font-mono">{s.value}</span>
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter, Sort & View Mode Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 border border-border mb-8">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Search within Archives (Debounced) */}
            <div className="relative flex-1 sm:flex-none sm:w-44 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search archive issues..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-background border border-border text-xs font-medium text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider shrink-0 hidden sm:inline">Year:</span>
              <div className="w-24">
                <Select
                  value={selectedYear}
                  onChange={(val) => setSelectedYear(String(val))}
                  options={[
                    { value: 'all', label: 'All Years' },
                    ...availableYears.map((y) => ({ value: String(y), label: String(y) }))
                  ]}
                  className="py-1 px-2 text-xs"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider shrink-0 hidden sm:inline">Field:</span>
              <div className="w-28 sm:w-32">
                <Select
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(String(val))}
                  options={[
                    { value: 'all', label: 'All Fields' },
                    ...availableCategories.map((c) => ({ value: c, label: c }))
                  ]}
                  className="py-1 px-2 text-xs"
                />
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider shrink-0 hidden sm:inline">Sort:</span>
              <div className="w-24 sm:w-28">
                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  options={[
                    { value: 'newest', label: 'Newest' },
                    { value: 'oldest', label: 'Oldest' },
                    { value: 'title_asc', label: 'Title A–Z' },
                    { value: 'title_desc', label: 'Title Z–A' },
                    { value: 'volume_desc', label: 'Vol High–Low' }
                  ]}
                  className="py-1 px-2 text-xs"
                />
              </div>
            </div>

            {(selectedYear !== 'all' || selectedCategory !== 'all' || searchInputValue || sortBy !== 'newest') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); setSearchInputValue(''); setSortBy('newest'); }}
                className="h-[28px] px-2 text-xs text-muted hover:text-red-600 hover:bg-red-50/60 border border-transparent hover:border-red-200 transition-colors shrink-0 flex items-center gap-1 font-medium"
                title="Reset All Filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          {/* View Mode Switcher (Icon-only to stay compact on all screens) */}
          <div className="flex items-center gap-0.5 bg-background border border-border p-0.5 shrink-0 ml-auto">
            <button
              onClick={() => setViewMode('shelf')}
              className={`p-1.5 transition-colors ${
                viewMode === 'shelf' ? 'bg-primary text-white' : 'text-muted hover:text-primary'
              }`}
              title="Shelf View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 transition-colors ${
                viewMode === 'split' ? 'bg-primary text-white' : 'text-muted hover:text-primary'
              }`}
              title="Split View"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          viewMode === 'shelf' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-border bg-surface flex flex-col justify-between p-5 space-y-4 h-[320px]">
                  <Skeleton className="w-full aspect-[3/4] rounded-none" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 border border-border bg-surface p-4 space-y-3 min-h-[400px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-none" />
                ))}
              </div>
              <div className="lg:col-span-7 border border-border bg-surface p-6 space-y-4 min-h-[600px]">
                <Skeleton className="h-32 w-full rounded-none" />
                <Skeleton className="h-20 w-full rounded-none" />
                <Skeleton className="h-20 w-full rounded-none" />
              </div>
            </div>
          )
        ) : viewMode === 'split' ? (
          /* ========================================================= */
          /* OPTION 2: SPLIT VIEW (LIST LEFT, LIVE PREVIEW RIGHT)     */
          /* ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Scrollable Volume Issues List (5/12 cols) */}
            <div className="lg:col-span-5 border border-border bg-surface flex flex-col min-h-[400px] max-h-[700px] overflow-hidden">
              <div className="p-3.5 border-b border-border bg-background flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Select Issue Volume
                </span>
                <span className="text-[11px] font-mono text-muted">{filteredVolumes.length} volumes</span>
              </div>

              <div className="divide-y divide-border overflow-y-auto max-h-[640px] flex-1">
                {filteredVolumes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted flex flex-col items-center justify-center h-full space-y-2">
                    <BookOpen className="h-6 w-6 text-muted/40" />
                    <p className="font-semibold text-primary">No volumes found</p>
                    <p>Try adjusting your search query or filters.</p>
                  </div>
                ) : (
                  filteredVolumes.map((vol) => {
                    const isSelected = selectedSplitVolume?.id === vol.id && selectedSplitVolume?.journal.id === vol.journal.id;

                    return (
                      <button
                        key={`${vol.journal.id}-${vol.id}`}
                        onClick={() => setSelectedSplitVolume(vol)}
                        className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 group relative ${
                          isSelected
                            ? 'bg-primary/5 border-l-4 border-l-primary font-medium'
                            : 'hover:bg-background/80 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider">
                              {formatVolumeName(vol.volume_number)}
                            </span>
                            <span className="text-[11px] font-mono text-muted">({vol.year})</span>
                          </div>
                          <h4 className={`text-[13px] font-bold uppercase line-clamp-1 transition-colors ${
                            isSelected ? 'text-primary' : 'text-primary/90 group-hover:text-primary'
                          }`}>
                            {vol.journal.title}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-muted mt-2">
                            <span>{vol.journal.categoryName}</span>
                            <span className="font-semibold">{vol.articles.length} articles</span>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted shrink-0 -rotate-90 transition-transform ${isSelected ? 'text-primary translate-x-1' : ''}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Selected Issue Preview Panel (7/12 cols) */}
            <div className="lg:col-span-7 border border-border bg-surface flex flex-col p-6 space-y-6 min-h-[600px]">
              {selectedSplitVolume ? (
                <>
                  <div className="border-b border-border pb-6 flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-24 h-32 shrink-0 bg-background border border-border overflow-hidden flex flex-col items-center justify-center p-2 text-center shadow-md">
                      {selectedSplitVolume.journal.cover_image ? (
                        <img
                          src={getFileUrl(selectedSplitVolume.journal.cover_image)}
                          alt={selectedSplitVolume.journal.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-secondary bg-primary px-2.5 py-1 uppercase tracking-wider">
                          {formatVolumeName(selectedSplitVolume.volume_number)}
                        </span>
                        <span className="text-xs font-mono font-bold text-primary border border-border px-2 py-0.5">
                          Year {selectedSplitVolume.year}
                        </span>
                        <span className="text-xs text-muted">
                          ISSN: {selectedSplitVolume.journal.issn || '-'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-primary uppercase tracking-wide">
                        {selectedSplitVolume.journal.title}
                      </h3>

                      <p className="text-xs text-muted">
                        Field: <strong className="text-primary">{selectedSplitVolume.journal.categoryName}</strong> · Contains {selectedSplitVolume.articles.length} published article(s).
                      </p>

                      <div className="pt-2">
                        <Link
                          to={`/journals/${selectedSplitVolume.journal.slug}`}
                          className="text-xs font-semibold text-primary hover:text-secondary transition-colors inline-flex items-center gap-1"
                        >
                          View Main Journal Page →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Table of Contents
                      </h4>
                      <span className="text-[11px] font-mono text-muted">{selectedSplitVolume.articles.length} articles</span>
                    </div>

                    {selectedSplitVolume.articles.length === 0 ? (
                      <div className="p-8 text-center bg-background border border-border text-xs text-muted">
                        No articles published in this volume issue.
                      </div>
                    ) : (
                      <div className="divide-y divide-border border border-border bg-background max-h-[440px] overflow-y-auto">
                        {selectedSplitVolume.articles.map((article) => (
                          <div
                            key={article.id}
                            className="p-4 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[13px] font-bold text-primary group-hover:text-secondary transition-colors uppercase leading-snug">
                                {article.title}
                              </h5>
                              <p className="text-xs text-muted mt-1">
                                {article.authors?.map((a) => a.name).join(', ') || 'Unknown Author'}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-[11px] text-muted/60">
                                {article.page_start && article.page_end && (
                                  <span>pp. {article.page_start}-{article.page_end}</span>
                                )}
                                {article.doi && <span>DOI: {article.doi}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                              <button
                                onClick={() => {
                                  setCitationArticle(article);
                                  setCitationContext({
                                    journalTitle: selectedSplitVolume.journal.title,
                                    volumeNumber: selectedSplitVolume.volume_number,
                                    year: selectedSplitVolume.year,
                                  });
                                }}
                                className="px-3 py-1.5 border border-border text-xs font-semibold text-muted hover:text-primary hover:border-primary transition-colors flex items-center gap-1.5 bg-surface"
                              >
                                <Quote className="h-3 w-3" /> Cite
                              </button>
                              {article.pdf_path && (
                                <button
                                  onClick={() => handleArticlePdfView(article.id)}
                                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold hover:bg-secondary hover:text-primary transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Eye className="h-3 w-3" /> Read PDF
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted space-y-3">
                  <BookOpen className="h-10 w-10 text-primary/20" />
                  <p className="text-sm font-medium text-primary">No Volume Selected</p>
                  <p className="text-xs">No volume issue matches your selected search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'shelf' ? (
          /* ========================================================= */
          /* OPTION 1: VISUAL LIBRARY SHELF (GRID OF VOLUME COVERS)     */
          /* ========================================================= */
          filteredVolumes.length === 0 ? (
            <EmptyState
              title="No volumes found"
              description="No archived volume issues match your selected filters."
              className="border border-border bg-surface py-16"
            />
          ) : (
            <div className="space-y-10">
              {groupedByJournal.map(({ journal, volumes }) => (
                <div key={journal.id} className="space-y-4">
                  {/* Journal Header Bar */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-[14px] font-bold text-primary uppercase tracking-wide">
                        {journal.title}
                      </h3>
                      <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider hidden sm:inline-block">
                        {journal.categoryName}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-muted">
                      {volumes.length} Archived Volume{volumes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Volume Cards Shelf Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {volumes.map((vol) => (
                      <div
                        key={`${vol.journal.id}-${vol.id}`}
                        onClick={() => setActiveVolumeModal(vol)}
                        className="group relative border border-border bg-surface flex flex-col justify-between p-5 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                        <div className="w-full aspect-[3/4] bg-background border border-border overflow-hidden mb-4 relative flex flex-col items-center justify-center p-4 text-center">
                          {vol.journal.cover_image ? (
                            <img
                              src={getFileUrl(vol.journal.cover_image)}
                              alt={vol.journal.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 p-2">
                              <BookOpen className="h-8 w-8 text-primary/30" />
                              <span className="text-[11px] font-bold text-primary uppercase tracking-widest line-clamp-3">
                                {vol.journal.title}
                              </span>
                            </div>
                          )}

                          <div className="absolute top-2 left-2 bg-primary text-secondary px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
                            {formatVolumeName(vol.volume_number)}
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-secondary bg-primary/90 px-2 py-0.5 uppercase tracking-wider inline-block mb-1.5">
                              {vol.journal.categoryName}
                            </span>
                            <h3 className="text-[13px] font-bold text-primary uppercase tracking-wider line-clamp-2 group-hover:text-secondary transition-colors">
                              {vol.journal.title}
                            </h3>
                          </div>

                          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
                            <span className="font-mono">{vol.year}</span>
                            <span className="font-semibold text-primary/80 group-hover:text-primary transition-colors flex items-center gap-1">
                              <Layers className="h-3 w-3" /> {vol.articles.length} article{vol.articles.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {/* Pagination Bar */}
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

      {/* Volume Explorer Modal */}
      {activeVolumeModal && (
        <Modal
          isOpen={!!activeVolumeModal}
          onClose={() => setActiveVolumeModal(null)}
          title={`${activeVolumeModal.journal.title} — ${formatVolumeName(activeVolumeModal.volume_number)} (${activeVolumeModal.year})`}
          className="max-w-4xl"
        >
          <div className="space-y-6 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-primary px-2.5 py-1 inline-block mb-1">
                  {activeVolumeModal.journal.categoryName}
                </span>
                <p className="text-xs text-muted">ISSN: {activeVolumeModal.journal.issn || '-'}</p>
              </div>
              <Link
                to={`/journals/${activeVolumeModal.journal.slug}`}
                onClick={() => setActiveVolumeModal(null)}
                className="text-xs font-semibold text-primary hover:text-secondary transition-colors"
              >
                Go to Journal Main Page →
              </Link>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
                Table of Contents ({activeVolumeModal.articles.length} Articles)
              </h3>

              {activeVolumeModal.articles.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">No articles available in this volume.</p>
              ) : (
                <div className="divide-y divide-border border border-border bg-background">
                  {activeVolumeModal.articles.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-primary leading-snug uppercase">
                          {article.title}
                        </h4>
                        <p className="text-xs text-muted mt-1">
                          {article.authors?.map((a) => a.name).join(', ') || 'Unknown Author'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-muted/60">
                          {article.page_start && article.page_end && (
                            <span>pp. {article.page_start}-{article.page_end}</span>
                          )}
                          {article.doi && <span>DOI: {article.doi}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        <button
                          onClick={() => {
                            setCitationArticle(article);
                            setCitationContext({
                              journalTitle: activeVolumeModal.journal.title,
                              volumeNumber: activeVolumeModal.volume_number,
                              year: activeVolumeModal.year,
                            });
                          }}
                          className="px-3 py-1.5 border border-border text-xs font-semibold text-muted hover:text-primary hover:border-primary transition-colors flex items-center gap-1.5"
                        >
                          <Quote className="h-3 w-3" /> Cite
                        </button>
                        {article.pdf_path && (
                          <button
                            onClick={() => handleArticlePdfView(article.id)}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold hover:bg-secondary hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="h-3 w-3" /> Read PDF
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Citation Modal */}
      <CitationModal
        isOpen={!!citationArticle}
        onClose={() => setCitationArticle(null)}
        article={citationArticle}
        journalTitle={citationContext.journalTitle}
        volumeNumber={citationContext.volumeNumber}
        year={citationContext.year}
      />

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfViewUrl}
        allowDownload={false}
      />
    </PageWrapper>
  );
};

export default Archives;
