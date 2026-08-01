import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { FileText, Plus, Edit2, Trash2, Eye, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import api, { getFileUrl } from '@/services/api';
import { truncateMiddle } from '@/lib/utils';
import ArticleFormModal from '@/components/ui/ArticleFormModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { ArticlesTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';

const PER_PAGE = 10;

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
  updated_at?: string;
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [journalsData, setJournalsData] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Draft'>('all');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [initialVolumeId, setInitialVolumeId] = useState<string>('');

  // Default sort: newest first
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });

  // Category filter (replaces journal filter)
  const [categoryFilter, setCategoryFilter] = useState('');

  const sortedArticles = React.useMemo(() => {
    let sortableItems = [...articles];
    sortableItems.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Article];
      let bVal: any = b[sortConfig.key as keyof Article];
      
      if (sortConfig.key === 'journal') {
        aVal = a.volume?.journal?.title || '';
        bVal = b.volume?.journal?.title || '';
      } else if (sortConfig.key === 'volume') {
        aVal = a.volume?.volume_number || '';
        bVal = b.volume?.volume_number || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [articles, sortConfig]);

  // Client-side pagination derived values
  const totalCount = sortedArticles.length;
  const lastPage = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const pagedArticles = sortedArticles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Debounce search filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  // Reset page when filters/sort change
  useEffect(() => { setPage(1); }, [tab, categoryFilter, debouncedFilter, sortConfig]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedFilter) params.append('search', debouncedFilter);
      if (tab !== 'all') params.append('status', tab);
      if (categoryFilter) params.append('category', categoryFilter);

      const [artRes, jrnRes, catRes] = await Promise.all([
        api.get(`/articles?${params.toString()}`),
        api.get('/journals?with_volumes=1'),
        api.get('/categories'),
      ]);
      
      setArticles(artRes.data.data);
      setJournalsData(jrnRes.data.data);
      setCategoriesData(catRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedFilter, tab, categoryFilter]);

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
        if (target) handleOpenModal(target);
      }
    }
  }, [searchParams, articles]);

  const handleDelete = (id: number) => setDeleteTarget(id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !isModalOpen) {
        e.preventDefault();
        setEditingArticle(null);
        setInitialVolumeId('');
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/articles/${deleteTarget}`);
      await fetchData();
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error('Failed to delete article');
    } finally {
      setIsDeleting(false);
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
        url = getFileUrl(path);
      }
      setPdfViewUrl(url + '#toolbar=0');
    } catch (err) {
      console.error('Failed to get PDF URL:', err);
      toast.error('Could not load PDF document.');
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUp className="h-3 w-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 opacity-100" /> : <ArrowDown className="h-3 w-3 opacity-100" />;
  };

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'Published' as const, label: 'Published' },
    { key: 'Draft' as const, label: 'Draft' },
  ];

  return (
    <div className="space-y-8">
      <DashboardHeader title="Articles">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/import?tab=articles')}
            className="shrink-0 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Article
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Status tabs */}
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
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-muted uppercase tracking-wider">Category:</label>
              <div className="w-[200px]">
                <Select
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val as string)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categoriesData.map(c => ({ value: c.slug, label: c.name }))
                  ]}
                />
              </div>
            </div>
          </div>
          <SearchInput
            placeholder="Search articles..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-[11px] text-muted">
            Showing {Math.min((page - 1) * PER_PAGE + 1, totalCount)}–{Math.min(page * PER_PAGE, totalCount)} of {totalCount} article{totalCount !== 1 ? 's' : ''}
          </p>
        )}

        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('title')}>
              <div className="flex items-center gap-1">Title {getSortIcon('title')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('journal')}>
              <div className="flex items-center gap-1">Journal {getSortIcon('journal')}</div>
            </TableHead>
            <TableHead>Authors</TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('created_at')}>
              <div className="flex items-center gap-1">Submitted {getSortIcon('created_at')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('updated_at')}>
              <div className="flex items-center gap-1">Updated {getSortIcon('updated_at')}</div>
            </TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <ArticlesTableSkeleton rows={PER_PAGE} />
          ) : sortedArticles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                <EmptyState title="No articles" description="No articles match your criteria." className="bg-transparent border-0 py-16" />
              </TableCell>
            </TableRow>
          ) : (
            pagedArticles.map((article) => (
              <TableRow 
                key={article.id} 
                className={`group ${articleHasPdf(article) ? 'cursor-pointer' : ''}`}
                onClick={() => articleHasPdf(article) && viewPdf(article)}
              >
                <TableCell>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary/20 shrink-0" />
                      <span className="text-[13px] font-medium text-primary truncate max-w-[280px]" title={article.title}>
                        {truncateMiddle(article.title, 42)}
                      </span>
                    </div>
                    <div className="mt-1 pl-6">
                      <Badge variant={getStatusVariant(article.status)}>
                        {article.status}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted truncate max-w-[180px]">
                  {article.volume?.journal?.title || '-'}
                </TableCell>
                <TableCell className="text-muted">
                  {article.authors?.map(a => a.name).join(', ') || '-'}
                </TableCell>
                <TableCell className="text-muted">
                  {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell className="text-muted">
                  {article.updated_at
                    ? new Date(article.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
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

      {!loading && totalCount > 0 && (
        <Pagination
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
        />
      )}
      </div>

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
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Articles;
