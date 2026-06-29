import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Article {
  id: number;
  title: string;
  status: string;
  abstract: string | null;
  doi: string | null;
  authors: any[];
  issue: any;
  created_at: string;
}

const statusColor: Record<string, string> = {
  Published: 'text-emerald-600 bg-emerald-50',
  Pending: 'text-amber-600 bg-amber-50',
  Revision: 'text-rose-600 bg-rose-50',
  Draft: 'text-gray-600 bg-gray-50',
};

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [journalsData, setJournalsData] = useState<any[]>([]); // For the issue selector
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Pending' | 'Revision'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    issue_id: '',
    title: '',
    abstract: '',
    doi: '',
    status: 'Pending',
    page_start: '',
    page_end: ''
  });

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

  const handleOpenModal = (article: Article | null = null) => {
    setError(null);
    setEditingArticle(article);
    if (article) {
      setFormData({
        issue_id: String(article.issue?.id || ''),
        title: article.title || '',
        abstract: article.abstract || '',
        doi: article.doi || '',
        status: article.status || 'Pending',
        page_start: '', // Omitted for brevity in edit mode for now, or fetch if available
        page_end: ''
      });
    } else {
      setFormData({
        issue_id: '',
        title: '',
        abstract: '',
        doi: '',
        status: 'Pending',
        page_start: '',
        page_end: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingArticle) {
        await api.put(`/articles/${editingArticle.id}`, formData);
      } else {
        await api.post('/articles', formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await api.delete(`/articles/${id}`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete article');
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
    { key: 'Pending' as const, label: 'Pending', count: articles.filter((a) => a.status === 'Pending').length },
    { key: 'Revision' as const, label: 'Revision', count: articles.filter((a) => a.status === 'Revision').length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">Articles</h1>
          <p className="text-[13px] text-muted mt-1">Manage research paper submissions</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Submit Article
        </Button>
      </div>

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
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
          <input
            type="text"
            placeholder="Search articles..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Journal</th>
              <th className="px-5 py-3">Authors</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted">Loading articles...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted">No articles found.</td></tr>
            ) : (
              filtered.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-b-0 hover:bg-background transition-colors group cursor-default">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary/20 shrink-0" />
                      <span className="text-[13px] font-medium text-primary truncate max-w-[260px]">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted truncate max-w-[180px]">
                    {article.issue?.volume?.journal?.title || '-'}
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(article)} className="text-muted/40 hover:text-primary h-6 w-6 flex items-center justify-center">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(article.id)} className="text-muted/40 hover:text-red-500 h-6 w-6 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingArticle ? 'Edit Article' : 'Submit Article'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Title *</label>
              <input 
                type="text" name="title" required value={formData.title} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Target Issue *</label>
              <select 
                name="issue_id" required value={formData.issue_id} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary appearance-none"
              >
                <option value="">Select Journal / Volume / Issue</option>
                {journalsData.map(journal => (
                  <optgroup key={`j-${journal.id}`} label={journal.title}>
                    {journal.volumes?.map((vol: any) => (
                      vol.issues?.map((issue: any) => (
                        <option key={issue.id} value={issue.id}>
                          Vol {vol.volume_number} ({vol.year}) — Issue {issue.issue_number}
                        </option>
                      ))
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Status</label>
              <select 
                name="status" value={formData.status} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary appearance-none"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                <option value="Revision">Revision</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">DOI</label>
              <input 
                type="text" name="doi" value={formData.doi} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Abstract</label>
              <textarea 
                name="abstract" value={formData.abstract} onChange={handleInputChange} rows={4}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Article'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Articles;
