import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getFileUrl } from '@/services/api';
import { Eye, Edit2, Download, Calendar, BookOpen, Users, Tag, Hash } from 'lucide-react';

interface ArticleQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any | null;
  onEdit?: (article: any) => void;
  onViewPdf?: (article: any) => void;
}

const ArticleQuickViewModal: React.FC<ArticleQuickViewModalProps> = ({
  isOpen,
  onClose,
  article,
  onEdit,
  onViewPdf,
}) => {
  if (!article) return null;

  const pdfUrl = article.pdf_url ? getFileUrl(article.pdf_url) : null;
  const journalTitle = article.volume?.journal?.title || 'Standalone Article';
  const volumeNumber = article.volume?.volume_number ? `Vol. ${article.volume.volume_number}` : '';
  const issueNumber = article.volume?.issue_number ? `Issue ${article.volume.issue_number}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Article Details & Preview">
      <div className="space-y-5 pt-1 text-primary">
        {/* Header Block */}
        <div className="space-y-2.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge
              variant={article.status === 'Draft' ? 'outline' : 'secondary'}
              className={article.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' : 'font-bold'}
            >
              {article.status || 'Published'}
            </Badge>
            {article.volume?.journal?.category && (
              <Badge variant="outline" className="text-muted">
                {article.volume.journal.category.name || article.volume.journal.category}
              </Badge>
            )}
          </div>

          <h2 className="text-lg font-serif font-semibold text-primary leading-snug">
            {article.title}
          </h2>

          {article.doi && (
            <div className="text-xs font-mono text-muted flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted/60" />
              <span>DOI: {article.doi}</span>
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background p-4 border border-border text-xs">
          <div className="space-y-1">
            <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary/60" /> Journal / Volume
            </div>
            <div className="font-medium text-primary">
              {journalTitle}
              {(volumeNumber || issueNumber) && (
                <span className="text-muted text-[11px] block mt-0.5 font-sans">
                  {[volumeNumber, issueNumber].filter(Boolean).join(' • ')}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary/60" /> Timestamps
            </div>
            <div className="text-muted space-y-0.5">
              <div>Submitted: <span className="font-medium text-primary">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
              {article.updated_at && (
                <div>Last Updated: <span className="font-medium text-primary">{new Date(article.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Authors */}
        <div className="space-y-2">
          <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary/60" /> Author(s)
          </div>
          {article.authors && article.authors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {article.authors.map((auth: any, idx: number) => (
                <Badge key={auth.id || idx} variant="outline" className="text-xs py-1 px-2.5 bg-surface text-primary border-border font-medium">
                  {auth.name} {auth.email ? `(${auth.email})` : ''}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No authors listed</p>
          )}
        </div>

        {/* Abstract */}
        {article.abstract && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="font-bold text-muted uppercase tracking-wider text-[10px]">
              Abstract
            </div>
            <p className="text-xs text-primary/80 leading-relaxed bg-background p-3.5 border border-border max-h-48 overflow-y-auto font-sans">
              {article.abstract}
            </p>
          </div>
        )}

        {/* Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary/60" /> Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {article.keywords.map((kw: any, idx: number) => (
                <span key={kw.id || idx} className="text-[11px] font-mono px-2 py-0.5 bg-primary/5 text-primary border border-primary/10">
                  #{typeof kw === 'string' ? kw : kw.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="flex items-center gap-2">
            {pdfUrl && onViewPdf && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onViewPdf(article);
                }}
                className="text-xs flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4 text-primary" /> View PDF
              </Button>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border bg-surface hover:bg-background transition-colors text-primary"
              >
                <Download className="h-3.5 w-3.5 text-muted" /> Download PDF
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(article);
                }}
                className="text-xs flex items-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Article
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ArticleQuickViewModal;
