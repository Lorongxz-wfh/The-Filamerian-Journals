import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { FileText, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import ArticleFormModal from '@/components/ui/ArticleFormModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';

interface Article {
  id: number;
  title: string;
  status: string;
  abstract: string | null;
  doi: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  authors: any[];
  keywords?: any[];
  volume: any;
  created_at: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Published': return 'success';
    case 'Pending': return 'secondary';
    case 'Revision': return 'destructive';
    case 'Draft': return 'default';
    default: return 'outline';
  }
};

const articleHasPdf = (article: Article) => !!article.pdf_url;

const Articles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [journalsData, setJournalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Draft'>('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [initialVolumeId, setInitialVolumeId] = useState<string>('');

  // Debounce search filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (debouncedFilter) params.append('search', debouncedFilter);
      if (tab !== 'all') params.append('status', tab);

      const [artRes, jrnRes] = await Promise.all([
        api.get(`/articles?${params.toString()}`),
        api.get('/journals?with_volumes=1')
      ]);
      
      setArticles(artRes.data.data);
      setLastPage(artRes.data.meta?.last_page || 1);
      setJournalsData(jrnRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedFilter, tab]);

  const handleOpenModal = (article: Article | null = null, initialOverrides: any = {}) => {
    setEditingArticle(article);
    setInitialVolumeId(initialOverrides.volume_id || '');
    setIsModalOpen(true);
  };

  useEffect(() => {
    const action = searchParams.get('action');
    const volId = searchParams.get('volume_id');
    if (action === 'new' && volId) {
      handleOpenModal(null, { volume_id: volId });
    } else if (action === 'edit' && searchParams.get('article_id')) {
      const artId = Number(searchParams.get('article_id'));
      if (articles.length > 0) {
        const target = articles.find(a => a.id === artId);
        if (target) {
          handleOpenModal(target);
        }
      }
    }
  }, [searchParams, articles]);

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/articles/${deleteTarget}`);
      await fetchData();
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error('Failed to delete article');
    } finally {
      setDeleteTarget(null);
    }
  };

  const viewPdf = async (article: Article) => {
    if (!article.pdf_url) return;
    setPdfViewUrl(null);
    setIsPdfModalOpen(true);
    
    try {
      const res = await api.get(`/public/articles/${article.id}/download-url`);
      let url = res.data.url;
      if (url.includes('/storage/')) {
        const path = url.split('/storage/')[1];
        url = `${STORAGE_URL}${path}`;
      }
      setPdfViewUrl(url + '#toolbar=0');
    } catch (err) {
      console.error('Failed to get PDF URL:', err);
      toast.error('Could not load PDF document.');
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'Published' as const, label: 'Published' },
    { key: 'Draft' as const, label: 'Draft' },
  ];

  return (
    <div className="space-y-8">
      <DashboardHeader title="Articles">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Submit Article
        </Button>
      </DashboardHeader>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 border border-border bg-surface">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-[12px] font-medium transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SearchInput
          placeholder="Search articles..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRowSkeleton columns={6} rows={5} />
          ) : articles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                <EmptyState title="No articles found" description="There are no articles matching your criteria." className="bg-transparent border-0" />
              </TableCell>
            </TableRow>
          ) : (
            articles.map((article) => (
              <TableRow 
                key={article.id} 
                className={`group ${articleHasPdf(article) ? 'cursor-pointer' : ''}`}
                onClick={() => articleHasPdf(article) && viewPdf(article)}
              >
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary/20 shrink-0" />
                    <span className="text-[13px] font-medium text-primary truncate max-w-[260px]">
                      {article.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted truncate max-w-[180px]">
                  {article.volume?.journal?.title || '-'}
                </TableCell>
                <TableCell className="text-muted">
                  {article.authors?.map(a => a.name).join(', ') || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(article.status)}>
                    {article.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted">{new Date(article.created_at).toLocaleDateString()}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {article.pdf_url && (
                      <IconButton icon={Eye} onClick={() => viewPdf(article)} title="View PDF" />
                    )}
                    <IconButton icon={Edit2} onClick={() => handleOpenModal(article)} title="Edit Article" />
                    <IconButton icon={Trash2} variant="danger" onClick={() => handleDelete(article.id)} title="Delete Article" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && lastPage > 1 && (
        <Pagination
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
        />
      )}

      <ArticleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingArticle={editingArticle}
        journalsData={journalsData}
        initialVolumeId={initialVolumeId}
        onSuccess={fetchData}
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

export default Articles;
