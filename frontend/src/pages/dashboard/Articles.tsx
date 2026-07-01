import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

interface Article {
  id: number;
  title: string;
  status: string;
  abstract: string | null;
  doi: string | null;
  pdf_url: string | null;
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

// Helper for checking if article has PDF
const articleHasPdf = (article: Article) => !!article.pdf_url;

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [journalsData, setJournalsData] = useState<any[]>([]); // For the issue selector
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Pending' | 'Revision'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    issue_id: '',
    title: '',
    abstract: '',
    doi: '',
    status: 'Pending',
    author_name: '',
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
        author_name: article.authors?.[0]?.name || '',
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
        author_name: '',
        page_start: '',
        page_end: ''
      });
    }
    setPdfFile(null); // Reset file input
    setCoverImage(null);
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
      const payload = new FormData();
      payload.append('issue_id', formData.issue_id);
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('doi', formData.doi);
      payload.append('status', formData.status);
      payload.append('author_name', formData.author_name);
      
      if (pdfFile) {
        payload.append('pdf_path', pdfFile);
      }

      if (coverImage) {
        payload.append('cover_image', coverImage);
      }

      if (editingArticle) {
        payload.append('_method', 'PUT'); // Laravel requirement for multipart PUT
        await api.post(`/articles/${editingArticle.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/articles', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0] as string[];
        setError(firstError[0] || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Failed to save article.');
      }
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

  const viewPdf = async (article: Article) => {
    if (!article.pdf_url) return;
    setPdfViewUrl(null);
    setIsPdfModalOpen(true);
    
    try {
      const res = await api.get(`/articles/${article.id}/download-url`);
      let url = res.data.url;
      if (url.includes('/storage/')) {
        const path = url.split('/storage/')[1];
        url = `${STORAGE_URL}${path}`;
      }
      setPdfViewUrl(url);
    } catch (err) {
      console.error('Failed to get download URL', err);
      alert('Could not load PDF document.');
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
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted">No articles found.</td></tr>
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
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {article.pdf_url && (
                        <button 
                          onClick={() => viewPdf(article)}
                          className="text-muted/40 hover:text-secondary h-6 w-6 flex items-center justify-center"
                          title="View PDF"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleOpenModal(article)} className="text-muted/40 hover:text-primary h-6 w-6 flex items-center justify-center" title="Edit Article">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(article.id)} className="text-muted/40 hover:text-red-500 h-6 w-6 flex items-center justify-center" title="Delete Article">
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
            <div className="md:col-span-2">
              <Input 
                label="Title" required name="title" value={formData.title} onChange={handleInputChange}
              />
            </div>
            
            <div className="md:col-span-2">
              <Select 
                label="Target Issue" required name="issue_id" value={formData.issue_id} onChange={handleInputChange}
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
              </Select>
            </div>

            <div className="md:col-span-2">
              <Input 
                label="Author Name" hint='defaults to "The Filamerian Journals"' name="author_name" value={formData.author_name} onChange={handleInputChange} placeholder="e.g. Dr. Julian Santos"
              />
            </div>

            <div>
              <Select 
                label="Status" name="status" value={formData.status} onChange={handleInputChange}
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                <option value="Revision">Revision</option>
                <option value="Published">Published</option>
              </Select>
            </div>

            <div>
              <Input 
                label="DOI" hint="Optional" name="doi" value={formData.doi} onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea 
                label="Abstract" name="abstract" value={formData.abstract} onChange={handleInputChange} rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider mb-1.5">
                PDF Document
              </label>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-background border border-border text-[13px] text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[12px] file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
              />
              {editingArticle && articleHasPdf(editingArticle) && !pdfFile && (
                <p className="text-[11px] text-muted mt-1">Leave empty to keep the existing PDF.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider mb-1.5">
                Cover Image (Optional)
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-background border border-border text-[13px] text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[12px] file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
              />
              {editingArticle && !coverImage && (
                <p className="text-[11px] text-muted mt-1">Leave empty to keep the existing cover.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Article'}</Button>
          </div>
        </form>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        title="Document Viewer" 
        className="max-w-4xl h-[95vh]"
        bodyClassName="p-3"
      >
        <div className="w-full h-full flex flex-col">
          {pdfViewUrl ? (
            <iframe 
              src={pdfViewUrl} 
              className="w-full flex-grow border-0 bg-white" 
              title="PDF Document Viewer"
            />
          ) : (
            <div className="flex items-center justify-center flex-grow text-muted">Loading document...</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Articles;
