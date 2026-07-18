import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { FileText, BookOpen, ExternalLink, Quote, ArrowLeft } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import JournalCard from '@/components/ui/JournalCard';
import CitationModal from '@/components/ui/CitationModal';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';

interface SearchResults {
  journals: any[];
  articles: any[];
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({ journals: [], articles: [] });
  const [loading, setLoading] = useState(false);

  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ journals: [], articles: [] });
        return;
      }
      
      setLoading(true);
      try {
        const res = await api.get(`/public/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const navigate = useNavigate();

  return (
    <PageWrapper className="flex flex-col">
      {/* Search Header */}
      <div className="border-b border-border pb-6 mb-8 space-y-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-primary transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to previous page
        </button>
        <div className="space-y-2">
          <h1 className="text-2xl uppercase tracking-wider font-bold">Search Results</h1>
          <p className="text-[14px] text-muted">
            Showing results for: <span className="font-semibold text-primary">"{query}"</span>
          </p>
        </div>
      </div>

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
                    image={j.cover_image ? `${STORAGE_URL}${j.cover_image}` : undefined}
                    category={j.category}
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
                                const res = await api.get(`/articles/${article.id}/download-url`);
                                window.open(res.data.url + '#toolbar=0', '_blank');
                              } catch (err) {
                                console.error('Failed to get download URL', err);
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
          {!loading && query && results.journals.length === 0 && results.articles.length === 0 && (
            <EmptyState 
              title={`No results found for "${query}"`} 
              description="Try adjusting your keywords or searching for a specific author." 
              className="py-20 border border-border bg-surface" 
            />
          )}
        </div>
      )}

      <CitationModal 
        isOpen={!!citationArticle}
        onClose={() => setCitationArticle(null)}
        article={citationArticle}
        journalTitle={citationArticle?.volume?.journal?.title}
        volumeNumber={citationArticle?.volume?.volume_number}
        year={citationArticle?.volume?.year}
      />
    </PageWrapper>
  );
};

export default Search;
