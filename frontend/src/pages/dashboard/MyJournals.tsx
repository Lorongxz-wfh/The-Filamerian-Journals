import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Plus, Settings2, Edit2, Trash2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';

import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FileUploadZone from '@/components/ui/FileUploadZone';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';

interface Journal {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: any;
  category_id: number | null;
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
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    publisher: '',
    issn: '',
    frequency: '',
    editor: ''
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('with_volumes', '1');
      if (debouncedFilter) params.append('search', debouncedFilter);

      const [journalsRes, categoriesRes] = await Promise.all([
        api.get(`/journals?${params.toString()}`),
        api.get('/categories')
      ]);
      setJournals(journalsRes.data.data);
      setLastPage(journalsRes.data.meta?.last_page || 1);
      setAvailableCategories(categoriesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch journals or settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [page, debouncedFilter]);

  const handleOpenModal = (journal: Journal | null = null) => {
    setError(null);
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        title: journal.title || '',
        slug: journal.slug || '',
        description: journal.description || '',
        category_id: journal.category_id ? String(journal.category_id) : '',
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
        category_id: '',
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
      payload.append('category_id', formData.category_id);
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

  const handleDelete = (slug: string) => {
    setDeleteTarget(slug);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/journals/${deleteTarget}`);
      await fetchJournals();
      toast.success('Journal deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete journal.');
    } finally {
      setDeleteTarget(null);
    }
  };

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

      <div className="flex justify-end">
        <SearchInput 
          placeholder="Search journals by title..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Volumes</TableHead>
            <TableHead>Editor</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRowSkeleton columns={5} rows={5} />
          ) : journals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <EmptyState title="No journals" description="No journals match your criteria." className="bg-transparent border-0 py-16" />
              </TableCell>
            </TableRow>
          ) : (
            journals.map((journal) => (
              <TableRow
                key={journal.id}
                onClick={() => navigate(`/dashboard/journals/${journal.slug}`)}
                className="group cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                    <span className="text-[13px] font-medium text-primary group-hover:text-secondary transition-colors truncate">
                      {journal.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted truncate">
                  {journal.category?.name || '-'}
                </TableCell>
                <TableCell className="text-center text-muted">
                  {journal.volumes?.length || 0}
                </TableCell>
                <TableCell className="text-muted truncate">
                  {journal.editor || '-'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton 
                      icon={Settings2} 
                      onClick={() => navigate(`/dashboard/journals/${journal.slug}`)} 
                      title="Manage Volumes" 
                    />
                    <IconButton 
                      icon={Edit2} 
                      onClick={() => handleOpenModal(journal)} 
                      title="Edit Journal" 
                    />
                    <IconButton 
                      icon={Trash2} 
                      variant="danger" 
                      onClick={() => handleDelete(journal.slug)} 
                      title="Delete Journal" 
                    />
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
                label="Category" required name="category_id" 
                value={formData.category_id} 
                onChange={(val) => handleInputChange({ target: { name: 'category_id', value: val } } as any)}
                options={[
                  { value: "", label: "Select Category" },
                  ...availableCategories.map(cat => ({
                    value: String(cat.id), label: cat.name
                  }))
                ]}
              />
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
              <RichTextEditor 
                label="Description" 
                value={formData.description} 
                onChange={(value) => setFormData({...formData, description: value})} 
              />
            </div>
            
            <div className="md:col-span-1">
              <FileUploadZone
                label="PDF Document"
                hint="Max size: 10MB"
                accept=".pdf,application/pdf"
                iconType="pdf"
                selectedFile={pdfFile}
                existingUrl={editingJournal?.pdf_url}
                onFileSelect={(file) => setPdfFile(file)}
              />
            </div>

            <div className="md:col-span-1">
              <FileUploadZone
                label="Cover Image"
                hint="Format: JPG/PNG, Max: 5MB"
                accept="image/*"
                iconType="image"
                selectedFile={coverImage}
                existingUrl={editingJournal?.cover_image}
                onFileSelect={(file) => setCoverImage(file)}
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

      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Journal"
        message="Are you sure you want to delete this journal? This action cannot be undone."
      />
    </div>
  );
};

export default MyJournals;
