import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { getFileUrl } from '@/services/api';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ArticleFormModal from '@/components/ui/ArticleFormModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import { Eye } from 'lucide-react';

interface Author {
  id: number;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
}

interface Article {
  id: number;
  title: string;
  status: string;
  order: number;
  authors: Author[];
  pdf_url?: string | null;
  pdf_path?: string | null;
}

interface Volume {
  id: number;
  volume_number: string;
  year: number;
  journal_id: number;
  journal?: { title: string; slug: string };
  articles: Article[];
}

const statusColor: Record<string, string> = {
  Published: 'text-emerald-600 bg-emerald-50',
  Pending: 'text-amber-600 bg-amber-50',
  Revision: 'text-rose-600 bg-rose-50',
  Draft: 'text-gray-600 bg-gray-50',
};

const ManageVolume: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [volume, setVolume] = useState<Volume | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ordering state
  const [articles, setArticles] = useState<Article[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [journalsData, setJournalsData] = useState<any[]>([]);

  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  const fetchVolume = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/volumes/${id}`);
      setVolume(res.data.data);
      // Sort articles by order just to be safe
      const sorted = (res.data.data.articles || []).sort((a: Article, b: Article) => a.order - b.order);
      setArticles(sorted);
      setHasOrderChanged(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load volume.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolume();
    
    // Fetch journals for the modal dropdown
    api.get('/journals?with_volumes=1')
      .then(res => setJournalsData(res.data.data))
      .catch(err => console.error('Failed to load journals', err));
  }, [id]);

  const handleOpenModal = (article: Article | null = null) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const viewPdf = async (article: Article) => {
    if (!article.pdf_url) return;
    setPdfViewUrl(null);
    setIsPdfModalOpen(true);
    
    try {
      const res = await api.get(`/public/articles/${article.id}/download-url`);
      let url = res.data.url;
      // Convert to storage url if necessary
      if (url.includes('/storage/')) {
        const path = url.split('/storage/')[1];
        url = getFileUrl(path);
      }
      setPdfViewUrl(url + '#toolbar=0');
    } catch (err) {
      console.error('Failed to get PDF URL:', err);
      toast.error('Could not load PDF document.');
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newArticles = [...articles];
    const temp = newArticles[index];
    newArticles[index] = newArticles[index - 1];
    newArticles[index - 1] = temp;
    setArticles(newArticles);
    setHasOrderChanged(true);
  };

  const moveDown = (index: number) => {
    if (index === articles.length - 1) return;
    const newArticles = [...articles];
    const temp = newArticles[index];
    newArticles[index] = newArticles[index + 1];
    newArticles[index + 1] = temp;
    setArticles(newArticles);
    setHasOrderChanged(true);
  };

  const saveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const article_ids = articles.map(a => a.id);
      await api.post(`/volumes/${id}/reorder`, { article_ids });
      toast.success('Order saved successfully!');
      setHasOrderChanged(false);
    } catch (err) {
      toast.error('Failed to save order.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/articles/${deleteTarget}`);
      await fetchVolume();
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error('Failed to delete article');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!volume && !loading) return <div className="py-10 text-center text-muted text-[13px]">Volume not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        title={<span className="line-clamp-1">{volume ? `${volume.volume_number} (${volume.year})` : 'Loading...'}</span>}
        preTitle={
          <div className="flex items-center gap-2 text-[12px] text-muted mb-4">
            <Link to={`/dashboard/journals/${volume?.journal?.slug || ''}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to {volume?.journal?.title || 'Journal'}
            </Link>
          </div>
        }
      >
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Article
        </Button>
      </DashboardHeader>

      {/* Articles List for Ordering */}
      <div className="border border-border bg-surface shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-primary uppercase tracking-wider">
            Articles ({articles.length})
          </h3>
          {hasOrderChanged && (
            <Button onClick={saveOrder} isLoading={isSavingOrder} size="sm" className="h-8 text-[11px] px-3">
              Save Order
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-[13px] text-muted">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-muted">
            No articles in this volume yet. Go to Articles to add one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {articles.map((article, index) => (
              <div 
                key={article.id} 
                className={`flex items-center justify-between px-5 py-3 transition-all cursor-grab active:cursor-grabbing ${
                  draggedItemIndex === index ? 'opacity-40 border-2 border-primary/50 scale-[0.98] shadow-md z-10 relative bg-surface' : 'hover:bg-background/50'
                } ${
                  dragOverItemIndex === index && draggedItemIndex !== index ? 'bg-primary/5 border-t-2 border-t-primary' : ''
                }`}
                onClick={() => handleOpenModal(article)}
                draggable
                onDragStart={(e) => {
                  setDraggedItemIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', index.toString());
                  // Optional: use a ghost image or just rely on default
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverItemIndex(index);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragLeave={() => {
                  if (dragOverItemIndex === index) {
                    setDragOverItemIndex(null);
                  }
                }}
                onDragEnd={() => {
                  setDraggedItemIndex(null);
                  setDragOverItemIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverItemIndex(null);
                  setDraggedItemIndex(null);
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  const toIndex = index;
                  if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                    const newArticles = [...articles];
                    const [movedArticle] = newArticles.splice(fromIndex, 1);
                    newArticles.splice(toIndex, 0, movedArticle);
                    const updatedArticles = newArticles.map((a, idx) => ({ ...a, order: idx + 1 }));
                    setArticles(updatedArticles);
                    setHasOrderChanged(true);
                  }
                }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 items-center shrink-0 w-8" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => moveUp(index)} 
                      disabled={index === 0}
                      className="text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => moveDown(index)} 
                      disabled={index === articles.length - 1}
                      className="text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-primary truncate">
                      {article.title}
                    </span>
                    <span className="text-[12px] text-muted truncate">
                      {article.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 pl-4" onClick={(e) => e.stopPropagation()}>
                  <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusColor[article.status] || 'bg-gray-100 text-gray-700'}`}>
                    {article.status}
                  </span>
                  <div className="flex items-center gap-2">
                    {article.pdf_url && (
                      <IconButton icon={Eye} onClick={() => viewPdf(article)} title="View PDF" />
                    )}
                    <IconButton icon={Edit2} onClick={() => handleOpenModal(article)} title="Edit" />
                    <IconButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(article.id)} title="Delete" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ArticleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingArticle={editingArticle}
        journalsData={journalsData}
        initialVolumeId={id}
        onSuccess={fetchVolume}
      />

      <PdfViewerModal 
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfViewUrl}
        allowDownload={true}
      />

      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
      />
    </div>
  );
};

export default ManageVolume;
