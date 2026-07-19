import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, X } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    volume_id: '',
    title: '',
    abstract: '',
    doi: '',
    status: 'Pending',
    author_names: [''] as string[],
    keyword_names: [] as string[],
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
        volume_id: String(article.volume?.id || ''),
        title: article.title || '',
        abstract: article.abstract || '',
        doi: article.doi || '',
        status: article.status || 'Pending',
        author_names: article.authors && article.authors.length > 0 ? article.authors.map((a: any) => a.name) : [''],
        keyword_names: article.keywords && article.keywords.length > 0 ? article.keywords.map((k: any) => k.name) : [],
        page_start: '', // Omitted for brevity in edit mode for now, or fetch if available
        page_end: ''
      });
    } else {
      setFormData({
        volume_id: '',
        title: '',
        abstract: '',
        doi: '',
        status: 'Pending',
        author_names: [''],
        keyword_names: [],
        page_start: '',
        page_end: ''
      });
    }
    setPdfFile(null); // Reset file input
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: 'author_names' | 'keyword_names', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'author_names' | 'keyword_names') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field: 'author_names' | 'keyword_names', index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.append('volume_id', formData.volume_id);
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('doi', formData.doi);
      payload.append('status', formData.status);
      
      formData.author_names.forEach(name => {
        if (name.trim()) payload.append('author_names[]', name.trim());
      });
      formData.keyword_names.forEach(name => {
        if (name.trim()) payload.append('keyword_names[]', name.trim());
      });
      
      if (pdfFile) {
        payload.append('pdf_path', pdfFile);
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
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error('Failed to delete article');
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
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                label="Target Volume" required name="volume_id" value={formData.volume_id} onChange={handleInputChange}
              >
                <option value="">Select Journal / Volume</option>
                {journalsData.map(journal => (
                  <optgroup key={`j-${journal.id}`} label={journal.title}>
                    {journal.volumes?.map((vol: any) => (
                      <option key={vol.id} value={vol.id}>
                        Vol {vol.volume_number} ({vol.year})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-medium text-primary uppercase tracking-wider">Authors</label>
                <button type="button" onClick={() => addArrayItem('author_names')} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Author
                </button>
              </div>
              {formData.author_names.map((author, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={author}
                      onChange={(e) => handleArrayChange('author_names', idx, e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="w-full px-3 py-2 border border-border text-[13px] bg-background focus:outline-none focus:border-primary"
                    />
                  </div>
                  {formData.author_names.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem('author_names', idx)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-medium text-primary uppercase tracking-wider">Keywords</label>
                <button type="button" onClick={() => addArrayItem('keyword_names')} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Keyword
                </button>
              </div>
              {formData.keyword_names.map((kw, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={kw}
                      onChange={(e) => handleArrayChange('keyword_names', idx, e.target.value)}
                      placeholder="e.g. Machine Learning"
                      className="w-full px-3 py-2 border border-border text-[13px] bg-background focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button type="button" onClick={() => removeArrayItem('keyword_names', idx)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {formData.keyword_names.length === 0 && (
                 <div className="text-[12px] text-muted italic border border-dashed border-border p-3 text-center">No keywords added.</div>
              )}
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
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider flex justify-between items-center mb-1.5">
                <span>PDF Document</span>
                <span className="text-[10px] text-muted normal-case tracking-normal">Max size: 10MB</span>
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
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingArticle ? 'Save Changes' : 'Create Article'}
            </Button>
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
