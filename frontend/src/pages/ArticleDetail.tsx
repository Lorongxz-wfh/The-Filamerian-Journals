import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, BookOpen, Quote } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import CitationModal from '@/components/ui/CitationModal';
import Modal from '@/components/ui/Modal';
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
  authors: Author[];
  volume: {
    volume_number: string;
    year: number;
    journal: {
      title: string;
      slug: string;
      issn: string;
      publisher: string;
    };
  };
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);
  const [citationContext, setCitationContext] = useState<any>({});

  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/public/articles/${id}`);
        setArticle(res.data.data);
        
        // Track the view silently
        api.post(`/public/articles/${id}/view`).catch(e => console.error(e));
      } catch (err) {
        console.error('Failed to fetch article', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  // Inject Google Scholar Meta Tags
  useEffect(() => {
    if (!article) return;

    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('citation_title', article.title);
    if (article.volume?.year) {
      setMetaTag('citation_publication_date', article.volume.year.toString());
    }
    if (article.volume?.journal?.title) {
      setMetaTag('citation_journal_title', article.volume.journal.title);
    }
    if (article.volume?.volume_number) {
      setMetaTag('citation_volume', article.volume.volume_number);
    }
    if (article.doi) {
      setMetaTag('citation_doi', article.doi);
    }
    if (article.volume?.journal?.issn) {
      setMetaTag('citation_issn', article.volume.journal.issn);
    }
    if (article.page_start && article.page_end) {
      setMetaTag('citation_firstpage', article.page_start.toString());
      setMetaTag('citation_lastpage', article.page_end.toString());
    }
    if (article.pdf_url) {
      setMetaTag('citation_pdf_url', window.location.origin + STORAGE_URL + article.pdf_url);
    }
    
    // Handle multiple authors
    const existingAuthors = document.querySelectorAll('meta[name="citation_author"]');
    existingAuthors.forEach(node => node.remove());
    
    if (article.authors && article.authors.length > 0) {
      article.authors.forEach(author => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'citation_author');
        meta.setAttribute('content', author.name);
        document.head.appendChild(meta);
      });
    }

    return () => {
      // Cleanup on unmount
      const tagsToRemove = [
        'citation_title', 'citation_publication_date', 'citation_journal_title',
        'citation_volume', 'citation_doi', 'citation_issn', 'citation_firstpage', 
        'citation_lastpage', 'citation_pdf_url', 'citation_author'
      ];
      tagsToRemove.forEach(tag => {
        const nodes = document.querySelectorAll(`meta[name="${tag}"]`);
        nodes.forEach(node => node.remove());
      });
    };
  }, [article]);

  if (loading) {
    return (
      <PageWrapper className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner text="Loading article..." />
      </PageWrapper>
    );
  }

  if (!article) {
    return (
      <PageWrapper className="container-custom items-center justify-center text-center">
        <p className="text-muted text-sm">Article not found.</p>
        <Link to="/journals" className="text-[13px] text-primary font-medium mt-4 inline-block hover:text-secondary transition-colors">
          ← Back to Journals
        </Link>
      </PageWrapper>
    );
  }

  const handleReadPDF = async () => {
    if (!article.pdf_url) return;
    setIsPdfModalOpen(true);
    setPdfViewUrl(null);
    try {
      const res = await api.get(`/public/articles/${article.id}/download-url`);
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
  };

  return (
    <PageWrapper className="flex flex-col w-full">
      <Link to={article.volume?.journal?.slug ? `/journals/${article.volume.journal.slug}` : "/journals"} className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-primary transition-colors mb-3">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {article.volume?.journal?.title || 'Journal'}
      </Link>

      <div className="bg-surface border border-border p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          <div className="space-y-2 flex-1">
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              {article.volume?.journal?.title} • Volume {article.volume?.volume_number} ({article.volume?.year})
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
              {article.title}
            </h1>
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <p className="text-[14px] text-muted">
                <span className="font-medium text-primary">Authors:</span> {article.authors?.map(a => a.name).join(', ') || 'Unknown'}
              </p>
              <div className="flex flex-wrap items-center gap-6 text-[13px] text-muted">
                {article.volume?.year && <p><span className="font-medium text-primary">Year:</span> {article.volume.year}</p>}
                {article.doi && <p><span className="font-medium text-primary">DOI:</span> {article.doi}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 md:w-48">
            <button
              onClick={handleReadPDF}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-primary text-white text-[13px] font-medium hover:bg-secondary hover:text-primary transition-colors tracking-wide"
            >
              <BookOpen className="h-4 w-4" />
              {article.pdf_url ? 'Read Article' : 'No PDF'}
            </button>
            
            <button
              onClick={() => {
                setCitationArticle(article);
                setCitationContext({
                  journalTitle: article.volume?.journal?.title,
                  volumeNumber: article.volume?.volume_number,
                  year: article.volume?.year
                });
              }}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-surface border border-border text-primary text-[13px] font-medium hover:bg-background transition-colors tracking-wide"
            >
              <Quote className="h-4 w-4" />
              Cite
            </button>

            {!localStorage.getItem('token') && article.pdf_url && (
              <p className="text-[10px] text-center text-muted uppercase tracking-wider mt-1">
                Login required
              </p>
            )}
          </div>
        </div>

        {article.abstract && (
          <div className="pt-6 border-t border-border space-y-3">
            <h3 className="text-[12px] font-bold text-primary uppercase tracking-wider">Abstract</h3>
            <p className="text-[14px] text-muted leading-relaxed text-justify">
              {article.abstract}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {citationArticle && (
        <CitationModal 
          isOpen={true} 
          onClose={() => setCitationArticle(null)} 
          article={citationArticle} 
          journalTitle={citationContext.journalTitle}
          volumeNumber={citationContext.volumeNumber}
          year={citationContext.year}
        />
      )}

      <Modal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} title={article.title} className="max-w-5xl h-[90vh]">
        <div className="h-full w-full bg-muted/10 p-4 pt-0">
          {pdfViewUrl ? (
            <iframe
              src={pdfViewUrl}
              className="w-full h-full border-0 rounded bg-white shadow-sm"
              title={`PDF viewer for ${article.title}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-3">
              <Spinner text="Loading document viewer..." />
            </div>
          )}
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default ArticleDetail;
