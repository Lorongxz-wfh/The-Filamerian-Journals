import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { FileText, BookOpen, ExternalLink, Quote, ArrowLeft, ChevronDown } from 'lucide-react';
import api, { getFileUrl } from '@/services/api';
import JournalCard from '@/components/ui/JournalCard';
import CitationModal from '@/components/ui/CitationModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';

interface SearchResults {
  journals: any[];
  articles: any[];
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({ journals: [], articles: [] });
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters State
  const [type, setType] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    type: true,
    subject: true,
    year: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);

  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories on load
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/settings');
        const catsString = res.data.data.journal_categories || 'Science, Education, Arts, Multidisciplinary';
        const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
        setAvailableCategories(catsArray);
      } catch (e) {
        console.error('Failed to fetch settings', e);
      }
    };
    fetchSettings();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, type, selectedCategories, fromYear, toYear]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() && selectedCategories.length === 0 && !fromYear.trim() && !toYear.trim()) {
        setResults({ journals: [], articles: [] });
        return;
      }
      
      setLoading(true);
      try {
        const categoryParam = selectedCategories.length > 0 ? selectedCategories.join(',') : '';
        const res = await api.get(`/public/search?q=${encodeURIComponent(query)}&type=${type}&category=${encodeURIComponent(categoryParam)}&from_year=${encodeURIComponent(fromYear)}&to_year=${encodeURIComponent(toYear)}&page=${currentPage}`);
        
        const data = res.data.data;
        if (type === 'all') {
          setResults({ journals: data.journals || [], articles: data.articles || [] });
          setLastPage(1);
        } else if (type === 'journals') {
          setResults({ journals: data.journals?.data || [], articles: [] });
          setLastPage(data.journals?.meta?.last_page || 1);
        } else if (type === 'articles') {
          setResults({ journals: [], articles: data.articles?.data || [] });
          setLastPage(data.articles?.meta?.last_page || 1);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, type, selectedCategories, fromYear, toYear, currentPage]);

  const navigate = useNavigate();

  return (
    <PageWrapper className="flex flex-col">
      {/* Search Header */}
      <PageHeader
        title="Search Results"
        className="mb-8"
        preTitle={
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-primary transition-colors uppercase tracking-wider mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to previous page
          </button>
        }
      >
        <p className="text-[14px] text-muted">
          {query ? (
            <span>
              Showing matches for <strong className="text-primary font-semibold">"{query}"</strong>
            </span>
          ) : (
            'Filter through published academic journals and articles.'
          )}
        </p>
      </PageHeader>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-surface border border-border p-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border pb-3 mb-4">
              Filter Results
            </h3>

            {/* Content Type */}
            <div className="border border-border mb-4">
              <button
                onClick={() => toggleSection('type')}
                className="flex items-center justify-between w-full px-4 py-3 text-[12px] font-semibold text-primary uppercase tracking-wider hover:bg-surface/50 transition-colors"
              >
                Content Type
                <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${openSections.type ? 'rotate-180' : ''}`} />
              </button>
              {openSections.type && (
                <div className="px-4 pb-4 space-y-2.5">
                  {['all', 'journals', 'articles'].map(t => (
                    <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="contentType"
                        checked={type === t}
                        onChange={() => setType(t)}
                        className="w-3.5 h-3.5 accent-[#005a9c] cursor-pointer"
                      />
                      <span className="text-[12px] text-muted group-hover:text-primary transition-colors capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

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
                  {availableCategories.map(cat => (
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
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">From</label>
                      <input
                        type="number"
                        placeholder="e.g. 2020"
                        value={fromYear}
                        onChange={(e) => setFromYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface border border-border text-[12px] focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">To</label>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        value={toYear}
                        onChange={(e) => setToYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface border border-border text-[12px] focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                    </div>
                  </div>
                  {(fromYear || toYear) && (
                    <button
                      onClick={() => { setFromYear(''); setToYear(''); }}
                      className="text-[11px] font-medium text-muted hover:text-red-600 border border-border hover:border-red-300 w-full py-1 transition-colors uppercase tracking-wider text-center cursor-pointer"
                    >
                      Clear Year Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 space-y-12">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[40vh]">
              <Spinner size="lg" text="Searching database..." />
            </div>
          ) : (
            <div className="space-y-12">
              {/* Journals Section */}
          {results.journals.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-[13px] font-semibold text-primary uppercase tracking-wider">Journals ({results.journals.length})</h2>
              </div>
              <div className="flex flex-col gap-4">
                {results.journals.map((j) => (
                  <JournalCard
                    key={j.id}
                    slug={j.slug}
                    title={j.title}
                    description={j.description}
                    date={new Date(j.created_at).getFullYear().toString()}
                    image={getFileUrl(j.cover_image)}
                    category={j.category?.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Articles Section */}
          {results.articles.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-[13px] font-semibold text-primary uppercase tracking-wider">Articles ({results.articles.length})</h2>
              </div>
              <div className="space-y-4">
                {results.articles.map((article) => (
                  <div key={article.id} className="border border-border bg-surface p-6 flex flex-col md:flex-row justify-between md:items-start gap-4 hover:border-primary/30 transition-colors">
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 uppercase tracking-wider">
                          {article.volume?.journal?.title || 'Unknown Journal'}
                        </span>
                        <span className="text-[12px] text-muted">
                          Vol. {article.volume?.volume_number || '-'}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-primary uppercase tracking-wider">
                        {article.title}
                      </h4>
                      <p className="text-[13px] text-muted leading-relaxed line-clamp-3">
                        {article.abstract || 'No abstract available.'}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                        {article.authors?.map((author: any) => (
                          <div key={author.id} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-muted rounded-full" />
                            <span className="text-[12px] font-medium text-primary">
                              {author.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="shrink-0 pt-1 flex flex-col gap-2">
                      {article.pdf_path && (
                        localStorage.getItem('token') ? (
                          <button 
                            onClick={async () => {
                              try {
                                setIsPdfModalOpen(true);
                                setPdfViewUrl(null);
                                const res = await api.get(`/public/articles/${article.id}/download-url`);
                                let url = res.data.url;
                                if (url.includes('/storage/')) {
                                  const path = url.split('/storage/')[1];
                                  url = getFileUrl(path);
                                }
                                setPdfViewUrl(url);
                              } catch (err) {
                                console.error('Failed to get download URL', err);
                                setIsPdfModalOpen(false);
                              }
                            }}
                            className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View PDF
                          </button>
                        ) : (
                          <Link 
                            to="/login"
                            className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
                            title="Login required to download PDF"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View PDF (Login)
                          </Link>
                        )
                      )}
                      <button
                        onClick={() => setCitationArticle(article)}
                        className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider mt-1"
                      >
                        <Quote className="h-3.5 w-3.5" />
                        Cite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* Empty State */}
              {!loading && results.journals.length === 0 && results.articles.length === 0 && (
                <EmptyState 
                  title={query ? `No results found for "${query}"` : "No results found"} 
                  description="Try adjusting your keywords or filters to find what you're looking for." 
                  className="py-20 border border-border bg-surface" 
                />
              )}
              
              {!loading && type !== 'all' && lastPage > 1 && (
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
          )}
        </div>
      </div>

      <CitationModal 
        isOpen={!!citationArticle}
        onClose={() => setCitationArticle(null)}
        article={citationArticle}
        journalTitle={citationArticle?.volume?.journal?.title}
        volumeNumber={citationArticle?.volume?.volume_number}
        year={citationArticle?.volume?.year}
      />

      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfViewUrl}
        allowDownload={false}
      />
    </PageWrapper>
  );
};

export default Search;
