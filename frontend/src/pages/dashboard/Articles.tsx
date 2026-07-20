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

const statusColor: Record<string, string> = {
  Published: 'text-emerald-600 bg-emerald-50',
  Pending: 'text-amber-600 bg-amber-50',
  Revision: 'text-rose-600 bg-rose-50',
  Draft: 'text-gray-600 bg-gray-50',
};

const articleHasPdf = (article: Article) => !!article.pdf_url;

const Articles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [journalsData, setJournalsData] = useState<any[]>([]); // For the issue selector
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Draft'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [initialVolumeId, setInitialVolumeId] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artRes, jrnRes] = await Promise.all([
        api.get('/articles'),
        api.get('/journals?with_volumes=1')
      ]);
      setArticles(artRes.data.data);
      setJournalsData(jrnRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      // Find the article and open edit modal
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

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(filter.toLowerCase());
    const matchesTab = tab === 'all' || a.status === tab;
    return matchesSearch && matchesTab;
  });

  const tabs = [
    { key: 'all' as const, label: 'All', count: articles.length },
    { key: 'Published' as const, label: 'Published', count: articles.filter((a) => a.status === 'Published').length },
    { key: 'Draft' as const, label: 'Draft', count: articles.filter((a) => a.status === 'Draft').length },
  ];

  return (
    <div className="space-y-8">
      <DashboardHeader title="Articles">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Submit Article
        </Button>
      </DashboardHeader>

      {/* Tabs + Search */}
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
              {t.label} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <SearchInput
          placeholder="Search articles..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5">
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Journal</th>
              <th className="px-5 py-3">Authors</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableRowSkeleton columns={6} rows={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState title="No articles found" description="There are no articles matching your criteria." className="bg-transparent border-0 py-16" />
                </td>
              </tr>
            ) : (
              filtered.map((article) => (
                <tr 
                  key={article.id} 
                  className={`border-b border-border last:border-b-0 hover:bg-background transition-colors group ${articleHasPdf(article) ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => articleHasPdf(article) && viewPdf(article)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary/20 shrink-0" />
                      <span className="text-[13px] font-medium text-primary truncate max-w-[260px]">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted truncate max-w-[180px]">
                    {article.volume?.journal?.title || '-'}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted">
                    {article.authors?.map(a => a.name).join(', ') || '-'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2 py-1 ${statusColor[article.status] || statusColor['Pending']}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted">{new Date(article.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {article.pdf_path && (
                        <IconButton icon={Eye} onClick={() => viewPdf(article)} title="View PDF" />
                      )}
                      <IconButton icon={Edit2} onClick={() => handleOpenModal(article)} title="Edit Article" />
                      <IconButton icon={Trash2} variant="danger" onClick={() => handleDelete(article.id)} title="Delete Article" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

      {/* Delete Confirmation */}
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
