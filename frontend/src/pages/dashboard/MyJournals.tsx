import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Plus, Search, Settings2, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface Journal {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  publisher: string | null;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  pdf_url: string | null;
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
    publisher: '',
    issn: '',
    frequency: '',
    editor: ''
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Science', 'Education', 'Arts', 'Multidisciplinary'
  ]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const [journalsRes, settingsRes] = await Promise.all([
        api.get('/journals?with_volumes=1'),
        api.get('/public/settings')
      ]);
      setJournals(journalsRes.data.data);
      const data = settingsRes.data?.data || {};
      const catsString = data.journal_categories || 'Science, Education, Arts, Multidisciplinary';
      const catsArray = typeof catsString === 'string' 
        ? catsString.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Science', 'Education', 'Arts', 'Multidisciplinary'];
      
      setAvailableCategories(catsArray.length > 0 ? catsArray : ['Science', 'Education', 'Arts', 'Multidisciplinary']);
    } catch (err) {
      console.error('Failed to fetch journals or settings:', err);
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
        publisher: journal.publisher || '',
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
        publisher: '',
        issn: '',
        frequency: '',
        editor: ''
      });
    }
    setPdfFile(null);
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
      payload.append('title', formData.title);
      payload.append('slug', formData.slug);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('publisher', formData.publisher);
      payload.append('issn', formData.issn);
      payload.append('frequency', formData.frequency);
      payload.append('editor', formData.editor);

      if (pdfFile) {
        payload.append('pdf_path', pdfFile);
      }

      if (coverImage) {
        payload.append('cover_image', coverImage);
      }

      if (editingJournal) {
        payload.append('_method', 'PUT'); // Laravel requirement for multipart PUT
        await api.post(`/journals/${editingJournal.slug}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/journals', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
      <DashboardHeader title="My Journals">
        <Button 
          onClick={() => handleOpenModal()}
          className="shrink-0 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Journal
        </Button>
      </DashboardHeader>

      {/* Search */}
      <SearchInput 
        placeholder="Filter journals..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {/* Table */}
      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        <div className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5 grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-center">Volumes</div>
          <div className="col-span-2">Editor</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <ListSkeleton colSpans={[5, 2, 2, 2, 1]} rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No journals" description="No journals found." className="border-0 bg-transparent py-16" />
        ) : (
          filtered.map((journal) => (
            <div
              key={journal.id}
              onClick={() => navigate(`/dashboard/journals/${journal.slug}`)}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-background transition-colors group cursor-pointer"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary group-hover:text-secondary transition-colors truncate">{journal.title}</span>
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
                <IconButton 
                  icon={Settings2} 
                  onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/journals/${journal.slug}`); }} 
                  title="Manage Volumes" 
                />
                <IconButton 
                  icon={Edit2} 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(journal); }} 
                  title="Edit" 
                />
                <IconButton 
                  icon={Trash2} 
                  variant="danger" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(journal.slug); }} 
                  title="Delete" 
                />
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
          
          <div className="text-[12px] text-muted italic mb-4">
            (* indicates required field)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="Title" required name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. FCU Multidisciplinary Research Journal"
              />
            </div>
            
            <div>
              <Input 
                label="Slug" hint="Auto-generated if empty" name="slug" value={formData.slug} onChange={handleInputChange} placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <Select 
                label="Category" required name="category" value={formData.category} onChange={handleInputChange}
              >
                <option value="">Select Category</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <Input 
                label="Year Published" name="publisher" value={formData.publisher} onChange={handleInputChange} placeholder="e.g. 2024"
              />
            </div>

            <div>
              <Input 
                label="ISSN" name="issn" value={formData.issn} onChange={handleInputChange} placeholder="e.g. 2651-7701"
              />
            </div>

            <div>
              <Input 
                label="Frequency" name="frequency" value={formData.frequency} onChange={handleInputChange} placeholder="e.g. Biannual, Quarterly"
              />
            </div>
            
            <div className="md:col-span-2">
              <Input 
                label="Editor in Chief" name="editor" value={formData.editor} onChange={handleInputChange} placeholder="e.g. Dr. Julian Santos"
              />
            </div>

            <div className="md:col-span-2">
              <Textarea 
                label="Description" name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Brief description of the journal's scope and focus..."
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider flex justify-between items-center mb-1.5">
                <span>PDF Document</span>
                <span className="text-[10px] text-muted normal-case tracking-normal">Max size: 10MB</span>
              </label>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-background border border-border text-[13px] text-muted file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider flex justify-between items-center mb-1.5">
                <span>Cover Image</span>
                <span className="text-[10px] text-muted normal-case tracking-normal">Format: JPG/PNG, Max: 5MB</span>
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-background border border-border text-[13px] text-muted file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingJournal ? 'Update Journal' : 'Create Journal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyJournals;
