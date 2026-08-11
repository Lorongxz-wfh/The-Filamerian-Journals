import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { FileText, Plus, Edit2, Trash2, Eye, Upload, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import api, { getFileUrl } from '@/services/api';
import ArticleFormModal from '@/components/ui/ArticleFormModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ArticlesTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useSmartPolling } from '@/hooks/useSmartPolling';

import ArticleQuickViewModal from '@/components/ui/ArticleQuickViewModal';

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
  const [selectedArticleForView, setSelectedArticleForView] = useState<Article | null>(null);
  
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

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
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
      if (!isBackground) toast.error('Failed to load articles');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 180-Second (3 Minute) Smart Background Polling for Articles (paused when modal open)
  useSmartPolling(() => fetchData(true), 180000, isModalOpen);

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
            <div className="flex gap-1 border border-border bg-surface h-9 items-center shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 h-full text-[12px] font-medium transition-colors flex items-center justify-center ${
                    tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-muted uppercase tracking-wider shrink-0">Category:</label>
              <div className="w-[200px]">
                <Select
                  className="py-1.5 h-9 text-[12px]"
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

        <div className="border border-border bg-surface flex flex-col">
          <Table containerClassName="max-h-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('title')}>
                  <div className="flex items-center gap-1">Title {getSortIcon('title')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('journal')}>
                  <div className="flex items-center gap-1">Journal & Volume {getSortIcon('journal')}</div>
                </TableHead>
                <TableHead>Lead Author</TableHead>
                <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('updated_at')}>
                  <div className="flex items-center gap-1">Updated {getSortIcon('updated_at')}</div>
                </TableHead>
                <TableHead className="w-12 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <ArticlesTableSkeleton rows={PER_PAGE} />
              ) : sortedArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <EmptyState title="No articles" description="No articles match your criteria." className="bg-transparent border-0 py-16" />
                  </TableCell>
                </TableRow>
              ) : (
                pagedArticles.map((article) => {
                  const leadAuthor = article.authors?.[0]?.name || '-';
                  const coAuthorsCount = (article.authors?.length || 0) - 1;
                  const journalTitle = article.volume?.journal?.title || '-';
                  const volNum = article.volume?.volume_number ? `Vol. ${article.volume.volume_number}` : '';

                  return (
                    <TableRow 
                      key={article.id} 
                      className="group hover:bg-primary/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedArticleForView(article)}
                    >
                      <TableCell>
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary/30 shrink-0" />
                            <span className="text-[13px] font-medium text-primary line-clamp-1 group-hover:text-primary transition-colors" title={article.title}>
                              {article.title}
                            </span>
                          </div>
                          <div className="mt-1 pl-6">
                            <Badge 
                              variant={article.status === 'Draft' ? 'outline' : 'secondary'}
                              className={article.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 font-semibold' : 'text-[9px] px-1.5 py-0 font-semibold'}
                            >
                              {article.status || 'Published'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        <div className="truncate max-w-[200px]" title={journalTitle}>
                          <span className="font-medium text-primary/90">{journalTitle}</span>
                          {volNum && <span className="text-muted/70 text-[11px] block">{volNum}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[150px] font-medium text-primary/80">{leadAuthor}</span>
                          {coAuthorsCount > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono text-muted bg-surface">
                              +{coAuthorsCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted text-xs whitespace-nowrap">
                        {article.updated_at
                          ? new Date(article.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <DropdownMenu
                          trigger={
                            <IconButton icon={MoreVertical} title="Actions" />
                          }
                        >
                          <DropdownMenuItem onClick={() => setSelectedArticleForView(article)}>
                            <div className="flex items-center gap-2 text-foreground">
                              <FileText className="h-4 w-4 text-muted" /> Quick Details
                            </div>
                          </DropdownMenuItem>
                          {article.pdf_url && (
                            <DropdownMenuItem onClick={() => viewPdf(article)}>
                              <div className="flex items-center gap-2 text-foreground">
                                <Eye className="h-4 w-4 text-muted" /> View PDF
                              </div>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleOpenModal(article)}>
                            <div className="flex items-center gap-2 text-foreground">
                              <Edit2 className="h-4 w-4 text-muted" /> Edit Article
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(article.id)}>
                            <div className="flex items-center gap-2 text-red-600">
                              <Trash2 className="h-4 w-4 text-red-600" /> Delete Article
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            currentPage={page}
            lastPage={lastPage}
            onPageChange={setPage}
            showingText={`Showing ${totalCount > 0 ? Math.min((page - 1) * PER_PAGE + 1, totalCount) : 0}–${Math.min(page * PER_PAGE, totalCount)} of ${totalCount} article${totalCount !== 1 ? 's' : ''}`}
            loading={loading}
          />
        </div>
      </div>

      <ArticleQuickViewModal
        isOpen={!!selectedArticleForView}
        onClose={() => setSelectedArticleForView(null)}
        article={selectedArticleForView}
        onEdit={handleOpenModal}
        onViewPdf={viewPdf}
      />

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
        message="Are you sure you want to delete this article? It will be moved to the Trash Bin where it can be restored within 30 days."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Articles;
