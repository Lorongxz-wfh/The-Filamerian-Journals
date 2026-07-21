import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Settings2, Edit2, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import api, { getFileUrl } from '@/services/api';
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

const journalFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  publisher: z.string().optional(),
  issn: z.string().optional(),
  frequency: z.string().optional(),
  editor: z.string().optional(),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

const MyJournals: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedJournals = React.useMemo(() => {
    let sortableItems = [...journals];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Journal];
        let bVal: any = b[sortConfig.key as keyof Journal];
        
        if (sortConfig.key === 'category') {
          aVal = a.category?.name || '';
          bVal = b.category?.name || '';
        } else if (sortConfig.key === 'volumes') {
          aVal = a.volumes?.length || 0;
          bVal = b.volumes?.length || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [journals, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      category_id: '',
      publisher: '',
      issn: '',
      frequency: '',
      editor: ''
    }
  });

  const selectedCategoryId = watch('category_id');
  const descriptionValue = watch('description') || '';

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
      if (categoryFilter) params.append('category', categoryFilter);

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
  }, [page, debouncedFilter, categoryFilter]);

  // URL Sync
  useEffect(() => {
    const action = searchParams.get('action');
    const slug = searchParams.get('journal_slug');
    if (action === 'new') {
      handleOpenModal(null, false);
    } else if (action === 'edit' && slug && journals.length > 0) {
      const target = journals.find(j => j.slug === slug);
      if (target) {
        handleOpenModal(target, false);
      }
    }
  }, [searchParams, journals]);

  const handleOpenModal = (journal: Journal | null = null, updateUrl = true) => {
    setServerError(null);
    if (journal) {
      setEditingJournal(journal);
      if (updateUrl) setSearchParams({ action: 'edit', journal_slug: journal.slug });
      reset({
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
      if (updateUrl) setSearchParams({ action: 'new' });
      reset({
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJournal(null);
    setPdfFile(null);
    setCoverImage(null);
    reset();
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('action');
    newParams.delete('journal_slug');
    setSearchParams(newParams);
  };

  const onSubmit = async (data: JournalFormData) => {
    setServerError(null);

    if (editingJournal && !isDirty && !pdfFile && !coverImage) {
      toast.info('No changes were made.');
      handleCloseModal();
      return;
    }

    try {
      const payload = new FormData();
      payload.append('title', data.title);
      payload.append('slug', data.slug || '');
      payload.append('description', data.description || '');
      payload.append('category_id', data.category_id);
      payload.append('publisher', data.publisher || '');
      payload.append('issn', data.issn || '');
      payload.append('frequency', data.frequency || '');
      payload.append('editor', data.editor || '');

      if (pdfFile) {
        payload.append('pdf_path', pdfFile);
      }

      if (coverImage) {
        payload.append('cover_image', coverImage);
      }

      if (editingJournal) {
        payload.append('_method', 'PUT');
        await api.post(`/journals/${editingJournal.slug}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/journals', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      handleCloseModal();
      toast.success(editingJournal ? 'Journal updated successfully' : 'Journal created successfully');
      await fetchJournals();
    } catch (err: any) {
      console.error('Save failed:', err);
      setServerError(err.response?.data?.message || 'Failed to save journal.');
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

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUp className="h-3 w-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 opacity-100" /> : <ArrowDown className="h-3 w-3 opacity-100" />;
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="My Journals">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/import?tab=journals')}
            className="shrink-0 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button 
            onClick={() => handleOpenModal()}
            className="shrink-0 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Journal
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-medium text-muted uppercase tracking-wider">Filter:</label>
            <div className="w-[200px]">
              <Select
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val as string); setPage(1); }}
                options={[
                  { value: '', label: 'All Categories' },
                  ...availableCategories.map(cat => ({ value: cat.slug, label: cat.name }))
                ]}
              />
            </div>
          </div>
          <SearchInput 
            placeholder="Search journals by title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('title')}>
              <div className="flex items-center gap-1">Title {getSortIcon('title')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('category')}>
              <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors text-center" onClick={() => requestSort('volumes')}>
              <div className="flex items-center justify-center gap-1">Volumes {getSortIcon('volumes')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('editor')}>
              <div className="flex items-center gap-1">Editor {getSortIcon('editor')}</div>
            </TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRowSkeleton columns={5} rows={5} />
          ) : sortedJournals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <EmptyState title="No journals" description="No journals match your criteria." className="bg-transparent border-0 py-16" />
              </TableCell>
            </TableRow>
          ) : (
            sortedJournals.map((journal) => (
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
                  <div className="flex items-center justify-end gap-1">
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
      </div>

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && handleCloseModal()}
        title={editingJournal ? 'Edit Journal' : 'Create New Journal'}
        className="max-w-2xl"
        isDirty={isDirty || !!pdfFile || !!coverImage}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded">
              {serverError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="Title" 
                required 
                placeholder="e.g. FCU Multidisciplinary Research Journal"
                error={errors.title?.message}
                {...register('title')}
                autoFocus
              />
            </div>
            
            <div>
              <Input 
                label="Slug" 
                hint="Auto-generated if empty" 
                placeholder="Auto-generated if empty"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>

            <div>
              <Select 
                label="Category" 
                required 
                value={selectedCategoryId} 
                onChange={(val) => setValue('category_id', String(val), { shouldValidate: true })}
                options={[
                  { value: "", label: "Select Category" },
                  ...availableCategories.map(cat => ({
                    value: String(cat.id), label: cat.name
                  }))
                ]}
              />
              {errors.category_id && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.category_id.message}</p>
              )}
            </div>
            
            <div>
              <Input 
                label="Year Published" 
                placeholder="e.g. 2024"
                error={errors.publisher?.message}
                {...register('publisher')}
              />
            </div>

            <div>
              <Input 
                label="ISSN" 
                placeholder="e.g. 2651-7701"
                error={errors.issn?.message}
                {...register('issn')}
              />
            </div>

            <div>
              <Input 
                label="Frequency" 
                placeholder="e.g. Biannual, Quarterly"
                error={errors.frequency?.message}
                {...register('frequency')}
              />
            </div>
            
            <div className="md:col-span-2">
              <Input 
                label="Editor in Chief" 
                placeholder="e.g. Dr. Julian Santos"
                error={errors.editor?.message}
                {...register('editor')}
              />
            </div>

            <div className="md:col-span-2">
              <RichTextEditor 
                label="Description" 
                value={descriptionValue} 
                onChange={(value) => setValue('description', value)} 
              />
            </div>
            
            <div className="md:col-span-1">
              <FileUploadZone
                label="PDF Document"
                hint="Max size: 10MB"
                accept=".pdf,application/pdf"
                iconType="pdf"
                selectedFile={pdfFile}
                existingUrl={editingJournal?.pdf_url ? getFileUrl(editingJournal.pdf_url) : undefined}
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
                existingUrl={editingJournal?.cover_image ? getFileUrl(editingJournal.cover_image) : undefined}
                onFileSelect={(file) => setCoverImage(file)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
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
