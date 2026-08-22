import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Settings2, Edit2, Trash2, Upload, ArrowUp, ArrowDown, MoreVertical, Copy, Check, EyeOff, Globe } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import api, { getFileUrl } from '@/services/api';
import { truncateMiddle } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import EditDiffModal, { type DiffItem } from '@/components/ui/EditDiffModal';

import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { JournalsTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import FileUploadZone from '@/components/ui/FileUploadZone';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';

interface Journal {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: any;
  category_id: number | null;
  status: 'Published' | 'Draft';
  publisher: string | null;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  pdf_url: string | null;
  volumes?: any[];
  volumes_count?: number;
  articles_count?: number;
  created_at: string;
  updated_at: string;
}

const journalFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  status: z.enum(['Published', 'Draft']),
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
        } else if (sortConfig.key === 'updated_at') {
          aVal = a.updated_at || '';
          bVal = b.updated_at || '';
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

  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCategoryId = watch('category_id');
  const selectedStatus = watch('status');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !isModalOpen) {
        e.preventDefault();
        setServerError(null);
        setEditingJournal(null);
        setPdfFile(null);
        setCoverImage(null);
        reset({ title: '', slug: '', description: '', category_id: '', status: 'Published', publisher: '' });
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // URL Sync
  useEffect(() => {
    const action = searchParams.get('action');
    const editSlug = searchParams.get('edit') || searchParams.get('journal_slug');
    if (action === 'new') {
      handleOpenModal(null, false);
    } else if ((action === 'edit' || editSlug) && editSlug && journals.length > 0) {
      const target = journals.find(j => j.slug === editSlug);
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
        status: journal.status || 'Published',
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
        status: 'Published',
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

  const [pendingUnpublishData, setPendingUnpublishData] = useState<JournalFormData | null>(null);
  const [journalDiffModalOpen, setJournalDiffModalOpen] = useState(false);
  const [pendingJournalDiffs, setPendingJournalDiffs] = useState<DiffItem[]>([]);
  const [pendingJournalSaveData, setPendingJournalSaveData] = useState<JournalFormData | null>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const onSubmit = async (data: JournalFormData) => {
    setServerError(null);

    const isValuesChanged = editingJournal && (
      data.title !== (editingJournal.title || '') ||
      (data.slug || '') !== (editingJournal.slug || '') ||
      (data.description || '') !== (editingJournal.description || '') ||
      data.category_id !== String(editingJournal.category_id || '') ||
      data.status !== (editingJournal.status || 'Published') ||
      (data.publisher || '') !== (editingJournal.publisher || '') ||
      (data.issn || '') !== (editingJournal.issn || '') ||
      (data.frequency || '') !== (editingJournal.frequency || '') ||
      (data.editor || '') !== (editingJournal.editor || '')
    );

    if (editingJournal && !isDirty && !isValuesChanged && !pdfFile && !coverImage) {
      toast.info('No changes were made.');
      handleCloseModal();
      return;
    }

    if (editingJournal) {
      // If editing an existing published journal and switching status to Draft, intercept with title confirmation modal
      if ((editingJournal.status === 'Published' || !editingJournal.status) && data.status === 'Draft') {
        setPendingUnpublishData(data);
        setUnpublishJournal(editingJournal);
        setConfirmUnpublishTitle('');
        setCopiedUnpublishTitle(false);
        return;
      }

      // Calculate diffs
      const diffs: DiffItem[] = [];
      if (editingJournal.title !== data.title) {
        diffs.push({ label: 'Title', oldValue: editingJournal.title || '', newValue: data.title });
      }
      if ((editingJournal.slug || '') !== (data.slug || '')) {
        diffs.push({ label: 'Slug (URL identifier)', oldValue: editingJournal.slug || '', newValue: data.slug || '(Auto-generated)' });
      }
      if (String(editingJournal.category_id || '') !== data.category_id) {
        const oldCat = availableCategories.find(c => String(c.id) === String(editingJournal.category_id));
        const newCat = availableCategories.find(c => String(c.id) === data.category_id);
        diffs.push({ label: 'Discipline / Category', oldValue: oldCat ? oldCat.name : 'None', newValue: newCat ? newCat.name : 'None' });
      }
      if (editingJournal.status !== data.status) {
        diffs.push({ label: 'Publication Status', oldValue: editingJournal.status || 'Published', newValue: data.status });
      }
      if ((editingJournal.publisher || '') !== (data.publisher || '')) {
        diffs.push({ label: 'Year Published', oldValue: editingJournal.publisher || '(Empty)', newValue: data.publisher || '(Empty)' });
      }
      if ((editingJournal.issn || '') !== (data.issn || '')) {
        diffs.push({ label: 'ISSN', oldValue: editingJournal.issn || '(Empty)', newValue: data.issn || '(Empty)' });
      }
      if ((editingJournal.frequency || '') !== (data.frequency || '')) {
        diffs.push({ label: 'Frequency', oldValue: editingJournal.frequency || '(Empty)', newValue: data.frequency || '(Empty)' });
      }
      if ((editingJournal.editor || '') !== (data.editor || '')) {
        diffs.push({ label: 'Editor in Chief', oldValue: editingJournal.editor || '(Empty)', newValue: data.editor || '(Empty)' });
      }
      if ((editingJournal.description || '') !== (data.description || '')) {
        diffs.push({ label: 'Description', oldValue: editingJournal.description ? 'Existing description' : '(Empty)', newValue: data.description ? 'Updated description' : '(Empty)' });
      }
      if (pdfFile) {
        diffs.push({ label: 'PDF Document', oldValue: editingJournal.pdf_url ? 'Existing PDF' : 'None', newValue: pdfFile.name });
      }
      if (coverImage) {
        diffs.push({ label: 'Cover Image', oldValue: editingJournal.cover_image ? 'Existing Image' : 'None', newValue: coverImage.name });
      }

      if (diffs.length > 0) {
        setPendingJournalSaveData(data);
        setPendingJournalDiffs(diffs);
        setJournalDiffModalOpen(true);
        return;
      }
    }

    await executeJournalSave(data);
  };

  const executeJournalSave = async (data: JournalFormData) => {
    if (isSavingJournal) return;
    try {
      setIsSavingJournal(true);
      const payload = new FormData();
      payload.append('title', data.title);
      payload.append('slug', data.slug || '');
      payload.append('description', data.description || '');
      payload.append('category_id', data.category_id);
      payload.append('status', data.status);
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
      setPendingUnpublishData(null);
      setJournalDiffModalOpen(false);
      setPendingJournalSaveData(null);
      toast.success(editingJournal ? 'Journal updated successfully' : 'Journal created successfully');
      await fetchJournals();
    } catch (err: any) {
      console.error('Save failed:', err);
      setServerError(err.response?.data?.message || 'Failed to save journal.');
    } finally {
      setIsSavingJournal(false);
    }
  };

  const [cascadeDeleteJournal, setCascadeDeleteJournal] = useState<Journal | null>(null);
  const [confirmTitleInput, setConfirmTitleInput] = useState('');
  const [copiedTitle, setCopiedTitle] = useState(false);

  // Unpublish Journal state
  const [unpublishJournal, setUnpublishJournal] = useState<Journal | null>(null);
  const [confirmUnpublishTitle, setConfirmUnpublishTitle] = useState('');
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [copiedUnpublishTitle, setCopiedUnpublishTitle] = useState(false);

  const handleUnpublishClick = (journal: Journal) => {
    setPendingUnpublishData(null);
    setUnpublishJournal(journal);
    setConfirmUnpublishTitle('');
    setCopiedUnpublishTitle(false);
  };

  const handlePublishClick = async (journal: Journal) => {
    try {
      await api.put(`/journals/${journal.slug}`, {
        title: journal.title,
        status: 'Published'
      });
      await fetchJournals();
      toast.success(`'${journal.title}' is now published and live on the public site.`);
    } catch (err: any) {
      console.error('Publish failed:', err);
      toast.error(err.response?.data?.message || 'Failed to publish journal.');
    }
  };

  const confirmUnpublish = async () => {
    if (!unpublishJournal || isUnpublishing) return;
    if (confirmUnpublishTitle.trim() !== unpublishJournal.title.trim()) {
      toast.error('Confirmation title does not match.');
      return;
    }
    try {
      setIsUnpublishing(true);
      if (pendingUnpublishData) {
        await executeJournalSave(pendingUnpublishData);
      } else {
        await api.put(`/journals/${unpublishJournal.slug}`, {
          title: unpublishJournal.title,
          status: 'Draft'
        });
        await fetchJournals();
      }
      toast.success(`'${unpublishJournal.title}' and all its volumes/articles are now unpublished (Draft).`);
      setUnpublishJournal(null);
      setPendingUnpublishData(null);
    } catch (err: any) {
      console.error('Unpublish failed:', err);
      toast.error(err.response?.data?.message || 'Failed to unpublish journal.');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleDelete = (journal: Journal) => {
    setCascadeDeleteJournal(journal);
    setConfirmTitleInput('');
    setCopiedTitle(false);
  };

  const confirmCascadeDelete = async () => {
    if (!cascadeDeleteJournal || isDeleting) return;
    if (confirmTitleInput.trim() !== cascadeDeleteJournal.title.trim()) {
      toast.error('Confirmation title does not match.');
      return;
    }
    try {
      setIsDeleting(true);
      await api.delete(`/journals/${cascadeDeleteJournal.slug}`);
      await fetchJournals();
      toast.success(`'${cascadeDeleteJournal.title}' and all its contents moved to Trash Bin`);
      setCascadeDeleteJournal(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete journal.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUp className="h-3 w-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 opacity-100" /> : <ArrowDown className="h-3 w-3 opacity-100" />;
  };

  const [statusTab, setStatusTab] = useState<'all' | 'Published' | 'Draft'>('all');

  const filteredJournals = React.useMemo(() => {
    return sortedJournals.filter(j => {
      if (statusTab !== 'all' && j.status !== statusTab) return false;
      if (categoryFilter && j.category?.slug !== categoryFilter) return false;
      return true;
    });
  }, [sortedJournals, statusTab, categoryFilter]);

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'Published' as const, label: 'Published' },
    { key: 'Draft' as const, label: 'Draft' },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      <DashboardHeader 
        title="Journals"
        helpText="Manage institutional journal collections, create new publications, configure disciplines, and release volumes."
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/import?tab=journals')}
            className="shrink-0 flex items-center gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer"
            title="Import Journals"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button 
            onClick={() => handleOpenModal()}
            className="shrink-0 flex items-center gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer"
            title="New Journal"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Journal</span>
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex flex-col gap-2.5 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2.5 sm:gap-4">
          {/* Status tabs */}
          <div className="grid grid-cols-3 w-full sm:w-auto border border-border bg-surface h-9 items-center p-0.5 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-2.5 sm:px-4 h-full text-xs font-medium transition-colors flex items-center justify-center cursor-pointer ${
                  statusTab === t.key ? 'bg-primary text-white font-semibold' : 'text-muted hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-[11px] sm:text-xs font-medium text-muted uppercase tracking-wider shrink-0 hidden sm:inline">Category:</label>
            <div className="w-full sm:w-[180px]">
              <Select
                className="py-1.5 h-9 text-xs"
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val as string); setPage(1); }}
                options={[
                  { value: '', label: 'All Categories' },
                  ...availableCategories.map(cat => ({ value: cat.slug, label: cat.name }))
                ]}
              />
            </div>
          </div>
          {/* Search input */}
          <div className="w-full sm:w-64">
            <SearchInput 
              placeholder="Search journals..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-border bg-surface flex flex-col">
          <Table containerClassName="max-h-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead isSorted={sortConfig?.key === 'title'} className="cursor-pointer transition-colors" onClick={() => requestSort('title')}>
                  <div className="flex items-center gap-1">Title {getSortIcon('title')}</div>
                </TableHead>
                <TableHead isSorted={sortConfig?.key === 'category'} className="cursor-pointer transition-colors hidden sm:table-cell" onClick={() => requestSort('category')}>
                  <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
                </TableHead>
                <TableHead isSorted={sortConfig?.key === 'updated_at'} className="cursor-pointer transition-colors hidden lg:table-cell" onClick={() => requestSort('updated_at')}>
                  <div className="flex items-center gap-1">Updated {getSortIcon('updated_at')}</div>
                </TableHead>
                <TableHead isSorted={sortConfig?.key === 'editor'} className="cursor-pointer transition-colors hidden md:table-cell" onClick={() => requestSort('editor')}>
                  <div className="flex items-center gap-1">Editor {getSortIcon('editor')}</div>
                </TableHead>
                <TableHead className="w-10 sm:w-12 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <JournalsTableSkeleton rows={5} />
              ) : filteredJournals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <EmptyState title="No journals" description="No journals match your criteria." className="bg-transparent border-0 py-16" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredJournals.map((journal) => (
                  <TableRow
                    key={journal.id}
                    onClick={() => navigate(`/dashboard/journals/${journal.slug}`)}
                    className="group hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <TableCell className="py-2.5 sm:py-3.5">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 text-primary/30 shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-[13px] font-medium text-primary group-hover:text-primary transition-colors truncate" title={journal.title}>
                            {truncateMiddle(journal.title, 42)}
                          </span>
                          {/* Mobile subtitle showing category and editor */}
                          <div className="sm:hidden text-[11px] text-muted truncate mt-0.5">
                            <span className="font-medium text-primary/80">{journal.category?.name || 'General'}</span>
                            {journal.editor && <span> • Ed. {journal.editor}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge 
                              variant={journal.status === 'Draft' ? 'outline' : 'secondary'} 
                              className={journal.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[8px] sm:text-[9px] px-1.5 py-0' : 'text-[8px] sm:text-[9px] px-1.5 py-0'}
                            >
                              {journal.status || 'Published'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted truncate hidden sm:table-cell">
                      {journal.category?.name || '-'}
                    </TableCell>
                    <TableCell className="text-muted text-[12px] hidden lg:table-cell">
                      {journal.updated_at
                        ? new Date(journal.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted truncate hidden md:table-cell">
                      {journal.editor || '-'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right py-2.5 sm:py-3.5">
                      <DropdownMenu
                        trigger={
                          <IconButton icon={MoreVertical} title="Actions" className="h-7 w-7" />
                        }
                      >
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/journals/${journal.slug}`)}>
                              <div className="flex items-center gap-2 text-foreground">
                                <Settings2 className="h-4 w-4 text-muted" /> Manage Volumes
                              </div>
                            </DropdownMenuItem>                            <DropdownMenuItem onClick={() => handleOpenModal(journal)}>
                              <div className="flex items-center gap-2 text-foreground">
                                <Edit2 className="h-4 w-4 text-muted" /> Edit & Details
                              </div>
                            </DropdownMenuItem>
                            {journal.status === 'Draft' ? (
                              <DropdownMenuItem onClick={() => handlePublishClick(journal)}>
                                <div className="flex items-center gap-2 text-emerald-600">
                                  <Globe className="h-4 w-4 text-emerald-600" /> Publish Journal
                                </div>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUnpublishClick(journal)}>
                                <div className="flex items-center gap-2 text-amber-600">
                                  <EyeOff className="h-4 w-4 text-amber-600" /> Unpublish Journal
                                </div>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(journal)}>
                              <div className="flex items-center gap-2 text-red-600">
                                <Trash2 className="h-4 w-4 text-red-600" /> Delete Journal
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            currentPage={page}
            lastPage={lastPage}
            onPageChange={setPage}
            showingText={`Showing ${filteredJournals.length > 0 ? Math.min((page - 1) * 10 + 1, filteredJournals.length) : 0}–${Math.min(page * 10, filteredJournals.length)} of ${filteredJournals.length} journal${filteredJournals.length !== 1 ? 's' : ''}`}
            loading={loading}
          />
        </div>
      </div>

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen && !journalDiffModalOpen && !unpublishJournal} 
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
                label="Slug (URL identifier)" 
                placeholder="auto-generated if blank"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>
            
            <div>
              <Select 
                label="Discipline / Category" 
                required 
                value={selectedCategoryId} 
                onChange={(val) => setValue('category_id', String(val), { shouldValidate: true, shouldDirty: true })}
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
              <Select 
                label="Publication Status" 
                required 
                value={selectedStatus} 
                onChange={(val) => setValue('status', val as 'Published' | 'Draft', { shouldValidate: true, shouldDirty: true })}
                options={[
                  { value: "Published", label: "Published (Visible publicly)" },
                  { value: "Draft", label: "Draft / Hidden (Internal only)" }
                ]}
              />
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
                onChange={(value) => setValue('description', value, { shouldDirty: true })} 
              />
            </div>
            
            <div className="md:col-span-1">
              <FileUploadZone
                label="PDF Document"
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
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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

      {/* Confirmation Modal for Journal Unpublishing */}
      <Modal
        isOpen={!!unpublishJournal}
        onClose={() => !isUnpublishing && setUnpublishJournal(null)}
        title="Unpublish Journal"
        className="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-[13px] text-muted leading-relaxed">
            This action will unpublish <strong className="font-semibold text-foreground">"{unpublishJournal?.title}"</strong> and set all its associated volumes and articles to <span className="font-semibold text-amber-700">Draft</span>. It will be hidden from the public website.
          </p>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                Type <strong className="text-foreground font-medium select-all">"{unpublishJournal?.title}"</strong> to confirm:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (unpublishJournal?.title) {
                    navigator.clipboard.writeText(unpublishJournal.title);
                    setCopiedUnpublishTitle(true);
                    setTimeout(() => setCopiedUnpublishTitle(false), 2000);
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors cursor-pointer shrink-0 ml-2"
                title="Copy title to clipboard"
              >
                {copiedUnpublishTitle ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedUnpublishTitle ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <Input
              type="text"
              value={confirmUnpublishTitle}
              onChange={(e) => setConfirmUnpublishTitle(e.target.value)}
              placeholder={unpublishJournal?.title || 'Enter journal name...'}
              className="text-[13px] font-sans"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setUnpublishJournal(null)}
            disabled={isUnpublishing}
            className="text-xs px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={confirmUnpublish}
            isLoading={isUnpublishing}
            disabled={confirmUnpublishTitle.trim() !== unpublishJournal?.title?.trim() || isUnpublishing}
            className="text-xs px-4 font-semibold text-amber-700 border-amber-300 hover:bg-amber-50 cursor-pointer"
          >
            Unpublish Entire Journal
          </Button>
        </div>
      </Modal>

      {/* Review Journal Changes Modal */}
      <EditDiffModal
        isOpen={journalDiffModalOpen}
        onClose={() => !isSavingJournal && setJournalDiffModalOpen(false)}
        onConfirm={async () => {
          if (pendingJournalSaveData && !isSavingJournal) {
            await executeJournalSave(pendingJournalSaveData);
          }
        }}
        entityName="Journal"
        diffs={pendingJournalDiffs}
        loading={isSavingJournal}
      />

      {/* Clean Confirmation Modal for Journal Deletion */}
      <Modal
        isOpen={!!cascadeDeleteJournal}
        onClose={() => !isDeleting && setCascadeDeleteJournal(null)}
        title="Delete Journal"
        className="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-[13px] text-muted leading-relaxed">
            This action will move <strong className="font-semibold text-foreground">"{cascadeDeleteJournal?.title}"</strong>
            {((cascadeDeleteJournal?.volumes_count && cascadeDeleteJournal.volumes_count > 0) || (cascadeDeleteJournal?.volumes && cascadeDeleteJournal.volumes.length > 0))
              ? ` and its ${cascadeDeleteJournal?.volumes_count ?? cascadeDeleteJournal?.volumes?.length} associated volume(s)`
              : ''}{' '}
            to the Trash Bin. Records remain restorable for 30 days.
          </p>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                Type <strong className="text-foreground font-medium select-all">"{cascadeDeleteJournal?.title}"</strong> to confirm:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (cascadeDeleteJournal?.title) {
                    navigator.clipboard.writeText(cascadeDeleteJournal.title);
                    setCopiedTitle(true);
                    setTimeout(() => setCopiedTitle(false), 2000);
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors cursor-pointer shrink-0 ml-2"
                title="Copy name to clipboard"
              >
                {copiedTitle ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedTitle ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <Input
              type="text"
              value={confirmTitleInput}
              onChange={(e) => setConfirmTitleInput(e.target.value)}
              placeholder={cascadeDeleteJournal?.title || 'Enter journal name...'}
              className="text-[13px] font-sans"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCascadeDeleteJournal(null)}
            disabled={isDeleting}
            className="text-xs px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={confirmCascadeDelete}
            isLoading={isDeleting}
            disabled={confirmTitleInput.trim() !== cascadeDeleteJournal?.title?.trim() || isDeleting}
            className="text-xs px-4 font-semibold cursor-pointer"
          >
            I understand, delete journal
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyJournals;
