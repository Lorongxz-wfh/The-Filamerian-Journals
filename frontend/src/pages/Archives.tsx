import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronDown, BookOpen, FileText, Quote } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import CitationModal from '@/components/ui/CitationModal';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';

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
  volume_number: number;
  year: number;
  articles: Article[];
}

interface Journal {
  id: number;
  slug: string;
  title: string;
  category: string;
  issn: string;
  volumes: Volume[];
}

const Archives: React.FC = () => {
  const initialArchives = JSON.parse(localStorage.getItem('archives_cache') || '[]');
  const [journals, setJournals] = useState<Journal[]>(initialArchives);
  const [loading, setLoading] = useState(initialArchives.length === 0);

  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);
  const [citationContext, setCitationContext] = useState<any>({});
  
  const [expandedJournal, setExpandedJournal] = useState<number | null>(
    initialArchives.length > 0 ? initialArchives[0].id : null
  );
  const [expandedVolume, setExpandedVolume] = useState<string | null>(null);

  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await api.get('/public/journals?with_volumes=1');
        const data = res.data.data;
        setJournals(data);
        localStorage.setItem('archives_cache', JSON.stringify(data));
        
        if (data.length > 0 && !expandedJournal) {
          setExpandedJournal(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch archives', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [expandedJournal]);

  const toggleJournal = (id: number) => {
    setExpandedJournal(expandedJournal === id ? null : id);
    setExpandedVolume(null);
  };

  const toggleVolume = (key: string) => {
    setExpandedVolume(expandedVolume === key ? null : key);
  };

  const totalArticles = journals.reduce(
    (sum, j) => sum + (j.volumes?.reduce(
      (vs, v) => vs + (v.articles?.length || 0), 0
    ) || 0), 0
  );

  return (
    <PageWrapper className="flex flex-col w-full">
      <div className="w-full space-y-10 flex flex-col">
        {/* Header */}
        <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider font-bold">Archives</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-px bg-border border border-border">
        {[
          { label: 'Journals', value: journals.length },
          { label: 'Volumes', value: journals.reduce((s, j) => s + (j.volumes?.length || 0), 0) },
          { label: 'Articles', value: totalArticles },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4 text-center">
            <p className="text-xl font-semibold text-primary">{s.value}</p>
            <p className="text-[11px] text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Journal Accordion */}
      <div className="flex-1 flex flex-col space-y-3">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
            <Spinner text="Loading archives..." />
          </div>
        ) : journals.length === 0 ? (
          <EmptyState title="No journals found" description="There are no journals with archived volumes yet." className="border border-border bg-surface" />
        ) : (
          journals.map((journal) => {
            const isOpen = expandedJournal === journal.id;
            const articleCount = journal.volumes?.reduce(
              (s, v) => s + (v.articles?.length || 0), 0
            ) || 0;

            return (
              <div key={journal.id} className="border border-border bg-surface">
                {/* Journal Header */}
                <button
                  onClick={() => toggleJournal(journal.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[14px] font-medium text-primary block truncate">{journal.title}</span>
                      <span className="text-[11px] text-muted">
                        {journal.volumes?.length || 0} volume{(journal.volumes?.length || 0) !== 1 ? 's' : ''} · {articleCount} articles · ISSN {journal.issn || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-[11px] text-muted bg-background px-2 py-0.5">{journal.category || 'Uncategorized'}</span>
                    <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="border-t border-border">
                    {journal.volumes?.length === 0 && (
                      <div className="px-6 py-6 text-[12px] text-muted text-center bg-background">No volumes available.</div>
                    )}
                    {journal.volumes?.map((vol) => {
                      const volKey = `${journal.id}-${vol.volume_number}`;
                      const volOpen = expandedVolume === volKey;

                      return (
                        <div key={vol.id} className="border-b border-border last:border-b-0">
                          {/* Volume Row */}
                          <button
                            onClick={() => toggleVolume(volKey)}
                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-background/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-semibold text-primary">Volume {vol.volume_number}</span>
                              <span className="text-[11px] text-muted">({vol.year})</span>
                              <span className="text-[11px] text-muted/60">
                                — {vol.articles?.length || 0} article{(vol.articles?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${volOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Articles */}
                          {volOpen && (
                            <div className="bg-background">
                              <div className="divide-y divide-border">
                                {vol.articles?.map((article) => (
                                  <div 
                                    key={article.id} 
                                    className="px-8 py-3 hover:bg-surface transition-colors group cursor-pointer"
                                    onClick={async () => {
                                      if (!article.pdf_path) return;
                                      if (!localStorage.getItem('token')) {
                                        window.location.href = '/login';
                                        return;
                                      }
                                      setIsPdfModalOpen(true);
                                      setPdfViewUrl(null);
                                      try {
                                        const res = await api.get(`/articles/${article.id}/download-url`);
                                        let url = res.data.url;
                                        if (url.includes('/storage/')) {
                                          const path = url.split('/storage/')[1];
                                          url = `${STORAGE_URL}${path}`;
                                        }
                                        setPdfViewUrl(url + '#toolbar=0');
                                      } catch (err) {
                                        console.error('Failed to get download URL', err);
                                        alert('Could not load PDF document.');
                                        setIsPdfModalOpen(false);
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      {article.cover_path && (
                                        <div className="shrink-0 w-12 h-16 border border-border bg-surface overflow-hidden">
                                          <img src={`${STORAGE_URL}${article.cover_path}`} alt="Cover" className="w-full h-full object-cover" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-primary/20 shrink-0" />
                                          <h4 className="text-[13px] font-medium text-primary group-hover:text-secondary transition-colors truncate">
                                            {article.title}
                                          </h4>
                                        </div>
                                        <p className="text-[11px] text-muted mt-0.5 pl-5">
                                          {article.authors?.map(a => a.name).join(', ') || 'Unknown'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1 pl-5 text-[10px] text-muted/50">
                                          {article.page_start && article.page_end && (
                                            <span>pp. {article.page_start}-{article.page_end}</span>
                                          )}
                                          {article.doi && <span>DOI: {article.doi}</span>}
                                          
                                          {!localStorage.getItem('token') && article.pdf_path && (
                                            <span className="uppercase tracking-wider opacity-50">Login to view PDF</span>
                                          )}

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCitationArticle(article);
                                              setCitationContext({
                                                journalTitle: journal.title,
                                                volumeNumber: vol.volume_number,
                                                year: vol.year
                                              });
                                            }}
                                            className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 ml-auto"
                                          >
                                            <Quote className="h-3 w-3" /> Cite
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {vol.articles?.length === 0 && (
                                  <div className="px-8 py-3 text-[11px] text-muted">No articles found in this volume.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Link to full journal */}
                    <Link
                      to={`/journals/${journal.slug}`}
                      className="block px-6 py-3 text-[12px] font-medium text-primary/50 hover:text-primary transition-colors text-center border-t border-border"
                    >
                      View full journal →
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      </div>

      <CitationModal 
        isOpen={!!citationArticle}
        onClose={() => setCitationArticle(null)}
        article={citationArticle}
        journalTitle={citationContext.journalTitle}
        volumeNumber={citationContext.volumeNumber}
        year={citationContext.year}
      />

      {/* PDF Viewer Modal */}
      <Modal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        title="Document Viewer" 
        className="max-w-4xl h-[95vh]"
        bodyClassName="p-3"
      >
        <div className="w-full h-full flex flex-col">
          {pdfViewUrl ? (
            <iframe 
              src={pdfViewUrl} 
              className="w-full flex-grow border-0 bg-white" 
              title="PDF Document Viewer"
            />
          ) : (
            <div className="flex items-center justify-center flex-grow text-muted">Loading document...</div>
          )}
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default Archives;
