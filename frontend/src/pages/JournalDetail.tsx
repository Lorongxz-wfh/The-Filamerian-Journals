import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, BookOpen, ChevronDown } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
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
  pdf_url: string | null;
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
  description: string;
  category: string;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  pdf_url?: string | null;
  volumes: Volume[];
}

const JournalDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVol, setExpandedVol] = useState<number | null>(null);
  

  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const res = await api.get(`/public/journals/${slug}`);
        const data = res.data.data;
        setJournal(data);
        if (data.volumes?.length > 0) {
          setExpandedVol(data.volumes[0].volume_number);
        }
      } catch (err) {
        console.error('Failed to fetch journal', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [slug]);

  if (loading) {
    return (
      <PageWrapper className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner text="Loading journal..." />
      </PageWrapper>
    );
  }

  if (!journal) {
    return (
      <PageWrapper className="container-custom items-center justify-center text-center">
        <p className="text-muted text-sm">Journal not found.</p>
        <Link to="/journals" className="text-[13px] text-primary font-medium mt-4 inline-block hover:text-secondary transition-colors">
          ← Back to Journals
        </Link>
      </PageWrapper>
    );
  }

  const totalArticles = journal.volumes?.reduce(
    (sum, v) => sum + (v.articles?.length || 0), 0
  ) || 0;

  return (
    <PageWrapper className="flex flex-col">
      {/* Back button and metadata header */}
      <Link to="/journals" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-primary transition-colors mb-3">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Journals
      </Link>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
        <div className="lg:col-span-3">
          {journal.cover_image ? (
            <img src={`${STORAGE_URL}${journal.cover_image}`} alt={journal.title} className="w-full max-w-[280px] aspect-[3/4] object-cover border border-border" />
          ) : (
            <div className="w-full max-w-[280px] aspect-[3/4] bg-surface border border-border flex items-center justify-center">
              <span className="text-muted text-[13px]">No Cover</span>
            </div>
          )}
        </div>
        <div className="lg:col-span-9 flex flex-col h-full">
          <div>
            <span className="inline-block text-[11px] font-semibold text-secondary bg-primary px-3 py-1 uppercase tracking-wider mb-3">
              {journal.category || 'Uncategorized'}
            </span>
            <h1 className="text-2xl uppercase tracking-wider font-bold mb-4">{journal.title}</h1>
          </div>
          <p className="text-[14px] text-muted leading-relaxed max-w-4xl">{journal.description || 'No description available.'}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mt-auto">
            {[
              { label: 'ISSN', value: journal.issn || '-' },
              { label: 'Frequency', value: journal.frequency || '-' },
              { label: 'Editor', value: journal.editor || '-' },
              { label: 'Articles', value: String(totalArticles) },
            ].map((m) => (
              <div key={m.label} className="bg-surface p-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{m.label}</p>
                <p className="text-[13px] font-medium text-primary mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Full Journal PDF Action */}
          {journal.pdf_url && (
            <div className="pt-4 flex flex-col items-start gap-2">
              <button 
                onClick={() => {
                  if (!localStorage.getItem('token')) {
                    window.location.href = '/login';
                    return;
                  }
                  setIsPdfModalOpen(true);
                  setPdfViewUrl(`${STORAGE_URL}${journal.pdf_url}#toolbar=0`);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-[13px] font-medium hover:bg-secondary hover:text-primary transition-colors tracking-wide shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                Read Full Journal PDF
              </button>
              {!localStorage.getItem('token') && (
                <span className="text-[11px] text-muted uppercase tracking-wider">Login required to view full document</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Volumes & Articles */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider border-b border-border pb-3">
          Volumes & Articles
        </h2>

        {journal.volumes?.length === 0 && (
          <EmptyState title="No volumes" description="No volumes published yet." className="border border-border bg-surface py-12" />
        )}

        {journal.volumes?.map((vol) => (
          <div key={vol.id} className="border border-border bg-surface">
            <button
              onClick={() => setExpandedVol(expandedVol === vol.volume_number ? null : vol.volume_number)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-background transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-primary/30" />
                <span className="text-[14px] font-medium text-primary">
                  Volume {vol.volume_number} ({vol.year})
                </span>
                <span className="text-[11px] text-muted">
                  — {vol.articles?.length || 0} article{(vol.articles?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted transition-transform ${expandedVol === vol.volume_number ? 'rotate-180' : ''}`} />
            </button>

            {expandedVol === vol.volume_number && (
              <div className="border-t border-border">
                {/* Articles Table */}
                <div className="divide-y divide-border">
                  {vol.articles?.map((article) => (
                    <Link 
                      key={article.id} 
                      to={`/articles/${article.id}`}
                      className="px-5 py-4 hover:bg-background/50 transition-colors group cursor-pointer block"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-grow">
                          <h4 className="text-[13px] font-sans font-bold text-primary group-hover:text-secondary transition-colors leading-snug uppercase">
                            {article.title}
                          </h4>
                          <p className="text-[12px] text-muted mt-1">
                            {article.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
                          </p>
                          {article.abstract && (
                            <p className="text-[12px] text-muted/60 mt-2 leading-relaxed line-clamp-2">
                              {article.abstract}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted/50">
                            {article.page_start && article.page_end && (
                              <span>pp. {article.page_start}-{article.page_end}</span>
                            )}
                            {article.doi && <span>DOI: {article.doi}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 pt-1 flex flex-col gap-2 items-end text-right">
                          <span className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 mt-1">
                            Read →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {vol.articles?.length === 0 && (
                    <div className="px-5 py-4 text-center text-[12px] text-muted">No articles in this volume.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>



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

export default JournalDetail;
