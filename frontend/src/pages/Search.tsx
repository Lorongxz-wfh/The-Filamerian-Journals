import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Search as SearchIcon, FileText, BookOpen, ExternalLink } from 'lucide-react';
import api, { STORAGE_URL, API_BASE_URL } from '@/services/api';
import JournalCard from '@/components/ui/JournalCard';

interface SearchResults {
  journals: any[];
  articles: any[];
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({ journals: [], articles: [] });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="container-custom py-12 space-y-10 min-h-[60vh]">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <h1 className="text-2xl uppercase tracking-wider">Search Results</h1>
        <p className="text-[14px] text-muted">
          Showing results for: <span className="font-semibold text-primary">"{query}"</span>
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <SearchIcon className="h-8 w-8 text-muted/30 animate-pulse" />
          <p className="text-[13px] text-muted tracking-wider uppercase">Searching database...</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.journals.map((j) => (
                  <JournalCard
                    key={j.id}
                    slug={j.slug}
                    title={j.title}
                    description={j.description}
                    date={new Date(j.created_at).toLocaleDateString()}
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
                          {article.issue?.volume?.journal?.title || 'Unknown Journal'}
                        </span>
                        <span className="text-[12px] text-muted">
                          Vol. {article.issue?.volume?.volume_number}, Issue {article.issue?.issue_number}
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
                        <a 
                          href={`${API_BASE_URL}/public/articles/${article.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && query && results.journals.length === 0 && results.articles.length === 0 && (
            <div className="py-20 text-center border border-border bg-surface">
              <SearchIcon className="h-6 w-6 text-muted/30 mx-auto mb-4" />
              <p className="text-[13px] text-muted">No results found for "{query}".</p>
              <p className="text-[12px] text-muted mt-1">Try adjusting your keywords or searching for a specific author.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
