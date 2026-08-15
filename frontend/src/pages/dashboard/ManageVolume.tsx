import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Reorder, useDragControls } from 'framer-motion';
import { ArrowUp, ArrowDown, Plus, Trash2, Edit2, GripVertical, Eye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import api, { getFileUrl } from '@/services/api';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumbs';
import ArticleFormModal from '@/components/ui/ArticleFormModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import { Skeleton } from '@/components/ui/Skeleton';

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

interface ArticleRowProps {
  article: Article;
  index: number;
  isLast: boolean;
  isReordering: boolean;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  onEdit: (article: Article) => void;
  onViewPdf: (article: Article) => void;
  onDelete: (id: number) => void;
  setIsReordering: (val: boolean) => void;
}

const ArticleRow: React.FC<ArticleRowProps> = ({
  article,
  index,
  isLast,
  isReordering,
  moveUp,
  moveDown,
  onEdit,
  onViewPdf,
  onDelete,
  setIsReordering,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={article}
      dragListener={false}
      dragControls={controls}
      className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 transition-colors bg-surface hover:bg-background/50 border-b border-border/50 last:border-b-0"
      whileDrag={{ 
        scale: 1.01,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        zIndex: 50,
        backgroundColor: "var(--surface)"
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <div
          className={`p-1 sm:p-1.5 rounded text-gray-400 hover:text-primary hover:bg-black/5 active:bg-black/10 cursor-grab active:cursor-grabbing touch-none select-none transition-colors shrink-0 ${
            isReordering ? 'bg-primary/10 text-primary' : 'hover:opacity-100'
          }`}
          onPointerDown={(e) => {
            setIsReordering(true);
            controls.start(e);
          }}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 stroke-[2.5]" />
        </div>

        {/* Up / Down Arrow buttons */}
        <div className="flex flex-col gap-0.5 items-center shrink-0 w-6 sm:w-8" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={() => {
              setIsReordering(true);
              moveUp(index);
            }} 
            disabled={index === 0}
            title="Move Up"
            className="p-1 rounded text-gray-400 hover:text-primary hover:bg-black/5 active:bg-black/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsReordering(true);
              moveDown(index);
            }} 
            disabled={isLast}
            title="Move Down"
            className="p-1 rounded text-gray-400 hover:text-primary hover:bg-black/5 active:bg-black/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Article Details */}
        <div className="flex flex-col min-w-0 cursor-pointer" onClick={() => onEdit(article)}>
          <span className="text-xs sm:text-[14px] font-semibold text-primary truncate hover:underline">
            {article.title}
          </span>
          <span className="text-[11px] sm:text-[12px] text-muted truncate">
            {article.authors?.map((a: any) => a.name).join(', ') || 'Unknown Authors'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2 sm:pl-4" onClick={(e) => e.stopPropagation()}>
        <span className={`hidden xs:inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${statusColor[article.status] || 'bg-gray-100 text-gray-700'}`}>
          {article.status}
        </span>
        <DropdownMenu
          trigger={
            <IconButton icon={MoreVertical} title="Actions" />
          }
        >
          {article.pdf_url && (
            <DropdownMenuItem onClick={() => onViewPdf(article)}>
              <div className="flex items-center gap-2 text-foreground">
                <Eye className="h-4 w-4 text-muted" /> View PDF
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(article)}>
            <div className="flex items-center gap-2 text-foreground">
              <Edit2 className="h-4 w-4 text-muted" /> Edit Article
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(article.id)}>
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4 text-red-600" /> Delete Article
            </div>
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </Reorder.Item>
  );
};

const ManageVolume: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [volume, setVolume] = useState<Volume | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ordering state
  const [articles, setArticles] = useState<Article[]>([]);
  const [originalArticles, setOriginalArticles] = useState<Article[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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
      setOriginalArticles(sorted);
      setHasOrderChanged(false);
      setIsReordering(false);
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
      setOriginalArticles(articles);
      setHasOrderChanged(false);
      setIsReordering(false);
    } catch (err) {
      toast.error('Failed to save order.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const cancelOrder = () => {
    setArticles(originalArticles);
    setHasOrderChanged(false);
    setIsReordering(false);
  };

  const handleReorder = (newArticles: Article[]) => {
    const updatedArticles = newArticles.map((a, idx) => ({ ...a, order: idx + 1 }));
    setArticles(updatedArticles);
    setHasOrderChanged(true);
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
        title={<span className="line-clamp-1">{volume ? `${volume.volume_number} (${volume.year})` : <Skeleton className="h-7 w-48 rounded inline-block" />}</span>}
        preTitle={
          <Breadcrumbs className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/journals">Journals</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {volume?.journal ? (
                  <BreadcrumbLink href={`/dashboard/journals/${volume.journal.slug}`}>
                    {volume.journal.title}
                  </BreadcrumbLink>
                ) : (
                  <Skeleton className="h-4 w-32 inline-block align-middle" />
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-primary">
                  {volume ? `Volume ${volume.volume_number} (${volume.year})` : <Skeleton className="h-4 w-24 inline-block align-middle" />}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumbs>
        }
      >
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer" title="Add Article">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Article</span>
        </Button>
      </DashboardHeader>

      {/* Articles List for Ordering */}
      <div className="border border-border bg-surface shadow-sm">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between min-h-[56px]">
          <h3 className="text-[13px] font-bold text-primary uppercase tracking-wider">
            Articles ({loading ? '...' : articles.length})
          </h3>
          <div className="flex items-center gap-2">
            {isReordering || hasOrderChanged ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={cancelOrder} 
                  disabled={isSavingOrder}
                  size="sm" 
                  className="h-8 text-[11px] px-3"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveOrder} 
                  isLoading={isSavingOrder} 
                  size="sm" 
                  className="h-8 text-[11px] px-3"
                >
                  Save Order
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsReordering(true)}
                size="sm"
                className="h-8 text-[11px] px-3 flex items-center gap-1.5"
              >
                <GripVertical className="h-3.5 w-3.5" />
                Edit Order
              </Button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 bg-surface">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1 items-center shrink-0 w-9">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <div className="space-y-2 flex-1 max-w-md">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-muted">
            No articles in this volume yet. Go to Articles to add one.
          </div>
        ) : (
          <Reorder.Group axis="y" values={articles} onReorder={handleReorder} className="divide-y divide-border">
            {articles.map((article, index) => (
              <ArticleRow
                key={article.id}
                article={article}
                index={index}
                isLast={index === articles.length - 1}
                isReordering={isReordering || hasOrderChanged}
                moveUp={moveUp}
                moveDown={moveDown}
                onEdit={handleOpenModal}
                onViewPdf={viewPdf}
                onDelete={(id) => setDeleteTarget(id)}
                setIsReordering={setIsReordering}
              />
            ))}
          </Reorder.Group>
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
        message="Are you sure you want to remove this article from the volume? It will be safely stored in the Trash Bin."
      />
    </div>
  );
};

export default ManageVolume;
