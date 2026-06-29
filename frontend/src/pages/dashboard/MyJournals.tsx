import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Plus, Search, Settings2, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Journal {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
  updated_at: string;
}

const MyJournals: React.FC = () => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    issn: '',
    frequency: '',
    editor: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/journals?with_volumes=1');
      setJournals(response.data.data);
    } catch (err) {
      console.error('Failed to fetch journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleOpenModal = (journal: Journal | null = null) => {
    setError(null);
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        title: journal.title || '',
        slug: journal.slug || '',
        description: journal.description || '',
        category: journal.category || '',
        issn: journal.issn || '',
        frequency: journal.frequency || '',
        editor: journal.editor || ''
      });
    } else {
      setEditingJournal(null);
      setFormData({
        title: '',
        slug: '',
        description: '',
        category: '',
        issn: '',
        frequency: '',
        editor: ''
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
      if (editingJournal) {
        await api.put(`/journals/${editingJournal.slug}`, formData);
      } else {
        await api.post('/journals', formData);
      }
      await fetchJournals();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save journal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/journals/${slug}`);
      await fetchJournals();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete journal.');
    }
  };

  const filtered = journals.filter((j) =>
    j.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">My Journals</h1>
          <p className="text-[13px] text-muted mt-1">Manage your journal publications</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Journal
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input
          type="text"
          placeholder="Filter journals..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="border border-border bg-surface">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-center">Volumes</div>
          <div className="col-span-2">Editor</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">Loading journals...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">No journals found.</div>
        ) : (
          filtered.map((journal) => (
            <div
              key={journal.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-background transition-colors group cursor-default"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary truncate">{journal.title}</span>
              </div>
              <div className="col-span-2 text-[13px] text-muted truncate">
                {journal.category || '-'}
              </div>
              <div className="col-span-2 text-center text-[13px] text-muted">
                {journal.volumes?.length || 0}
              </div>
              <div className="col-span-2 text-[13px] text-muted truncate">
                {journal.editor || '-'}
              </div>
              <div className="col-span-1 flex justify-end gap-2">
                <button 
                  onClick={() => navigate(`/dashboard/journals/${journal.slug}`)}
                  className="h-7 w-7 flex items-center justify-center text-muted/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  title="Manage Volumes & Issues"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleOpenModal(journal)}
                  className="h-7 w-7 flex items-center justify-center text-muted/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(journal.slug)}
                  className="h-7 w-7 flex items-center justify-center text-muted/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-muted">Showing {filtered.length} of {journals.length} journals</p>

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingJournal ? 'Edit Journal' : 'Create New Journal'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Title *</label>
              <input 
                type="text" name="title" required value={formData.title} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. FCU Multidisciplinary Research Journal"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Slug</label>
              <input 
                type="text" name="slug" value={formData.slug} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Category</label>
              <select 
                name="category" value={formData.category} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="">Select Category</option>
                <option value="Science">Science</option>
                <option value="Education">Education</option>
                <option value="Arts">Arts</option>
                <option value="Multidisciplinary">Multidisciplinary</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">ISSN</label>
              <input 
                type="text" name="issn" value={formData.issn} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 2651-7701"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Frequency</label>
              <input 
                type="text" name="frequency" value={formData.frequency} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Biannual, Quarterly"
              />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Editor in Chief</label>
              <input 
                type="text" name="editor" value={formData.editor} onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Dr. Julian Santos"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Description</label>
              <textarea 
                name="description" value={formData.description} onChange={handleInputChange} rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Brief description of the journal's scope and focus..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingJournal ? 'Update Journal' : 'Create Journal')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyJournals;
