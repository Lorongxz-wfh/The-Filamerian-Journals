import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/services/api';
import { Mail, FileText, ExternalLink, Eye, Calendar, BookOpen } from 'lucide-react';

interface AuthorQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: any | null;
  onViewPdf?: (article: any) => void;
}

const AuthorQuickViewModal: React.FC<AuthorQuickViewModalProps> = ({
  isOpen,
  onClose,
  author,
  onViewPdf,
}) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (author && isOpen) {
      const fetchAuthorArticles = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/articles?author_id=${author.id}`);
          setArticles(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch author articles', err);
          setArticles([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAuthorArticles();
    } else {
      setArticles([]);
    }
  }, [author, isOpen]);

  if (!author) return null;

  const fullName = author.name || [author.first_name, author.middle_name, author.last_name, author.suffix].filter(Boolean).join(' ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Author Profile & Contributions">
      <div className="space-y-5 pt-1 text-primary">
        {/* Author Header Card */}
        <div className="p-4 bg-background border border-border flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base rounded shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-primary">
                {fullName}
              </h2>
              {author.email && (
                <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5 font-mono">
                  <Mail className="h-3 w-3 text-muted/60" />
                  <span>{author.email}</span>
                </div>
              )}
            </div>
          </div>

          <Badge variant="secondary" className="font-bold text-[10px] uppercase">
            {articles.length} Article{articles.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Authored Articles List */}
        <div className="space-y-3">
          <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary/60" /> Authored & Co-Authored Publications ({articles.length})
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted space-y-2">
              <div className="inline-block h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
              <p>Loading authored publications...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted border border-dashed border-border bg-background">
              No published articles found for this author.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="p-3 bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                      <span className="text-xs font-semibold text-primary truncate" title={article.title}>
                        {article.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted mt-1">
                      {article.volume?.journal?.title && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <BookOpen className="h-3 w-3 text-muted/60" /> {article.volume.journal.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0 font-mono">
                        <Calendar className="h-3 w-3 text-muted/60" /> {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {article.pdf_url && onViewPdf && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          onViewPdf(article);
                        }}
                        className="text-[11px] h-7 px-2.5 flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3 text-primary" /> View PDF
                      </Button>
                    )}
                    <a
                      href={`/articles/${article.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] h-7 px-2.5 font-medium border border-border bg-surface hover:bg-background transition-colors text-primary"
                    >
                      <ExternalLink className="h-3 w-3 text-muted" /> Public
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-border">
          <Button type="button" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthorQuickViewModal;
