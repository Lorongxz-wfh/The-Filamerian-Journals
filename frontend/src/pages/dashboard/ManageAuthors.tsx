import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, MoreVertical, User } from 'lucide-react';
import api, { getFileUrl } from '@/services/api';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { AuthorsTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';
import AuthorFormFields from '@/components/ui/AuthorFormFields';
import AuthorQuickViewModal from '@/components/ui/AuthorQuickViewModal';
import PdfViewerModal from '@/components/ui/PdfViewerModal';

const PER_PAGE = 15;

interface Author {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string | null;
  name: string; // formatted_name
  articles_count?: number;
  created_at: string;
  updated_at: string;
}

interface AuthorForm {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  email: string;
}

const emptyForm: AuthorForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  email: '',
};

const ManageAuthors: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [selectedAuthorForView, setSelectedAuthorForView] = useState<Author | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
  
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'last_name',
    direction: 'asc',
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', PER_PAGE.toString());
      if (debouncedFilter) params.append('search', debouncedFilter);
      const res = await api.get(`/authors?${params.toString()}`);
      setAuthors(res.data.data || []);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFilter]);

  useEffect(() => { fetchAuthors(); }, [fetchAuthors]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !isModalOpen) {
        e.preventDefault();
        setFormError(null);
        setEditingAuthor(null);
        setForm({ first_name: '', middle_name: '', last_name: '', suffix: '', email: '' });
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Client-side sort (since API may not support sort param)
  const sortedAuthors = React.useMemo(() => {
    const items = [...authors];
    items.sort((a, b) => {
      if (sortConfig.key === 'articles_count') {
        const aCount = a.articles_count ?? 0;
        const bCount = b.articles_count ?? 0;
        return sortConfig.direction === 'asc' ? aCount - bCount : bCount - aCount;
      }
      const aVal = (a[sortConfig.key as keyof Author] as string) || '';
      const bVal = (b[sortConfig.key as keyof Author] as string) || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [authors, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUp className="h-3 w-3 opacity-20" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 opacity-100" />
      : <ArrowDown className="h-3 w-3 opacity-100" />;
  };

  const openModal = (author: Author | null = null) => {
    setFormError(null);
    setDuplicateWarning(null);
    setEditingAuthor(author);
    if (author) {
      setForm({
        first_name: author.first_name || '',
        middle_name: author.middle_name || '',
        last_name: author.last_name || '',
        suffix: author.suffix || '',
        email: author.email || '',
      });
    } else {
      setForm(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAuthor(null);
    setForm(emptyForm);
    setFormError(null);
    setDuplicateWarning(null);
  };

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    if (e) e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setDuplicateWarning(null);
    try {
      if (editingAuthor) {
        await api.put(`/authors/${editingAuthor.id}`, form);
        toast.success('Author updated successfully');
      } else {
        await api.post('/authors', { ...form, force });
        toast.success('Author created successfully');
      }
      await fetchAuthors();
      closeModal();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateWarning(err.response.data.message);
      } else {
        setFormError(err.response?.data?.message || 'Failed to save author.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/authors/${deleteTarget}`);
      await fetchAuthors();
      toast.success('Author deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete author.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <DashboardHeader 
        title="Authors"
        helpText="Directory of academic authors, research affiliations, author profiles, and associated published works."
      >
        <Button onClick={() => openModal()} className="shrink-0 flex items-center gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer" title="New Author">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Author</span>
        </Button>
      </DashboardHeader>

      <div className="flex flex-col gap-2.5 sm:gap-4">
        <div className="flex items-center">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search by name or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-border bg-surface flex flex-col">
        <Table containerClassName="max-h-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead isSorted={sortConfig?.key === 'last_name'} className="cursor-pointer transition-colors" onClick={() => requestSort('last_name')}>
                <div className="flex items-center gap-1">Author Name {getSortIcon('last_name')}</div>
              </TableHead>
              <TableHead isSorted={sortConfig?.key === 'email'} className="cursor-pointer transition-colors hidden sm:table-cell" onClick={() => requestSort('email')}>
                <div className="flex items-center gap-1">Email {getSortIcon('email')}</div>
              </TableHead>
              <TableHead isSorted={sortConfig?.key === 'articles_count'} className="cursor-pointer transition-colors text-center" onClick={() => requestSort('articles_count')}>
                <div className="flex items-center justify-center gap-1">Publications {getSortIcon('articles_count')}</div>
              </TableHead>
              <TableHead className="w-10 sm:w-12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <AuthorsTableSkeleton rows={PER_PAGE} />
            ) : sortedAuthors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <EmptyState
                    title="No authors"
                    description="No authors match your search. Create one to get started."
                    className="bg-transparent border-0 py-16"
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedAuthors.map((author) => {
                const fullName = author.name || [author.last_name + ',', author.first_name, author.middle_name, author.suffix].filter(Boolean).join(' ');
                const articlesCount = author.articles_count || 0;

                return (
                  <TableRow 
                    key={author.id} 
                    className="group hover:bg-primary/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedAuthorForView(author)}
                  >
                    <TableCell className="py-2.5 sm:py-3.5">
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 bg-primary/10 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold text-primary shrink-0 rounded mt-0.5 sm:mt-0">
                          {author.first_name ? author.first_name.charAt(0).toUpperCase() : (author.last_name ? author.last_name.charAt(0).toUpperCase() : 'A')}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-[13px] font-medium text-primary truncate">{fullName}</span>
                          {/* Mobile Email subtitle */}
                          <span className="sm:hidden text-[10px] text-muted font-mono truncate">{author.email || '-'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted text-xs font-mono hidden sm:table-cell truncate max-w-[200px]">{author.email || '-'}</TableCell>
                    <TableCell className="text-center py-2.5 sm:py-3.5">
                      <span className={`inline-flex items-center text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                        articlesCount > 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted/10 text-muted'
                      }`}>
                        {articlesCount} <span className="hidden sm:inline">&nbsp;article{articlesCount !== 1 ? 's' : ''}</span>
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right py-2.5 sm:py-3.5">
                      <DropdownMenu
                        trigger={
                          <IconButton icon={MoreVertical} title="Actions" className="h-7 w-7" />
                        }
                      >
                        <DropdownMenuItem onClick={() => setSelectedAuthorForView(author)}>
                          <div className="flex items-center gap-2 text-foreground">
                            <User className="h-4 w-4 text-muted" /> Quick Details
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openModal(author)}>
                          <div className="flex items-center gap-2 text-foreground">
                            <Edit2 className="h-4 w-4 text-muted" /> Edit Author
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(author.id)}>
                          <div className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-4 w-4 text-red-600" /> Delete Author
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
          showingText={`Showing ${total > 0 ? Math.min((page - 1) * PER_PAGE + 1, total) : 0}–${Math.min(page * PER_PAGE, total)} of ${total} author${total !== 1 ? 's' : ''}`}
          loading={loading}
        />
        </div>
      </div>

      <AuthorQuickViewModal
        isOpen={!!selectedAuthorForView}
        onClose={() => setSelectedAuthorForView(null)}
        author={selectedAuthorForView}
        onViewPdf={(art) => {
          if (art.pdf_url) {
            setPdfViewUrl(getFileUrl(art.pdf_url));
            setIsPdfModalOpen(true);
          }
        }}
      />

      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfViewUrl}
        allowDownload={true}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && closeModal()}
        title={editingAuthor ? 'Edit Author' : 'New Author'}
        className="max-w-xl"
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
              {formError}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[13px] rounded space-y-3">
              <p className="font-medium">{duplicateWarning}</p>
              <p className="text-[12px] opacity-90">Would you like to force create a duplicate author anyway?</p>
              <div className="flex items-center gap-2 pt-1">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={(e) => handleSubmit(e, true)} 
                  isLoading={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3"
                >
                  Create Duplicate Anyway
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDuplicateWarning(null)}
                  className="text-xs px-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Shared name grid component */}
          <AuthorFormFields
            values={{
              first_name: form.first_name,
              middle_name: form.middle_name,
              last_name: form.last_name,
              suffix: form.suffix,
            }}
            onChange={(v) => setForm((f) => ({ ...f, ...v }))}
            autoFocus
          />

          <Input
            label="Email (optional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="author@email.com"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingAuthor ? 'Save Changes' : 'Create Author'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Author"
        message="Are you sure you want to delete this author? This may affect articles linked to them."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageAuthors;
