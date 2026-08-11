import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api, { getFileUrl } from '@/services/api';
import { BookOpen, ExternalLink, Settings2, Tag, Layers } from 'lucide-react';

interface CategoryQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any | null;
}

const CategoryQuickViewModal: React.FC<CategoryQuickViewModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && isOpen) {
      const fetchCategoryJournals = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/journals?category=${encodeURIComponent(category.slug)}`);
          setJournals(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch category journals', err);
          setJournals([]);
        } finally {
          setLoading(false);
        }
      };
      fetchCategoryJournals();
    } else {
      setJournals([]);
    }
  }, [category, isOpen]);

  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Category Details & Journals">
      <div className="space-y-5 pt-1 text-primary">
        {/* Header Information */}
        <div className="space-y-2.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 font-bold uppercase tracking-wider text-[10px]">
              <Tag className="h-3 w-3 mr-1 text-primary" /> Category
            </Badge>
            <span className="font-mono text-xs text-muted">slug: {category.slug}</span>
          </div>

          <h2 className="text-lg font-serif font-semibold text-primary">
            {category.name}
          </h2>

          {category.description ? (
            <p className="text-xs text-muted leading-relaxed bg-background p-3 border border-border">
              {category.description}
            </p>
          ) : (
            <p className="text-xs text-muted italic">No description provided for this category.</p>
          )}
        </div>

        {/* Assigned Journals Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary/60" /> Assigned Journals ({journals.length})
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted space-y-2">
              <div className="inline-block h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
              <p>Loading assigned journals...</p>
            </div>
          ) : journals.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted border border-dashed border-border bg-background">
              No journals currently assigned to this category.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {journals.map((journal) => {
                const coverUrl = journal.cover_image ? getFileUrl(journal.cover_image) : null;
                return (
                  <div
                    key={journal.id}
                    className="p-3 bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={journal.title}
                          className="h-10 w-8 object-cover border border-border shrink-0 rounded-sm"
                        />
                      ) : (
                        <div className="h-10 w-8 bg-surface border border-border flex items-center justify-center shrink-0 rounded-sm">
                          <BookOpen className="h-4 w-4 text-primary/30" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-primary truncate" title={journal.title}>
                          {journal.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5 font-mono">
                          {journal.issn && <span>ISSN: {journal.issn}</span>}
                          {journal.volumes?.length !== undefined && (
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" /> {journal.volumes.length} Volume(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          navigate(`/dashboard/journals/${journal.slug}`);
                        }}
                        className="text-[11px] h-7 px-2.5 flex items-center gap-1"
                      >
                        <Settings2 className="h-3 w-3 text-primary" /> Manage
                      </Button>
                      <a
                        href={`/journals/${journal.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] h-7 px-2.5 font-medium border border-border bg-surface hover:bg-background transition-colors text-primary"
                      >
                        <ExternalLink className="h-3 w-3 text-muted" /> Public
                      </a>
                    </div>
                  </div>
                );
              })}
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

export default CategoryQuickViewModal;
