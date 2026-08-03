import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import api from '@/services/api';
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

const PER_PAGE = 15;

interface Author {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string | null;
  name: string; // formatted_name
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingAuthor) {
        await api.put(`/authors/${editingAuthor.id}`, form);
        toast.success('Author updated successfully');
      } else {
        await api.post('/authors', form);
        toast.success('Author created successfully');
      }
      await fetchAuthors();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save author.');
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
    <div className="space-y-8">
      <DashboardHeader title="Authors">
        <Button onClick={() => openModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Author
        </Button>
      </DashboardHeader>

      <div className="flex justify-end items-center">
        <SearchInput
          placeholder="Search by name or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="border border-border bg-surface rounded-lg overflow-hidden shadow-2xs flex flex-col">
        <Table containerClassName="border-0 rounded-none max-h-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('last_name')}>
                <div className="flex items-center gap-1">Last Name {getSortIcon('last_name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('first_name')}>
                <div className="flex items-center gap-1">First Name {getSortIcon('first_name')}</div>
              </TableHead>
              <TableHead>Middle</TableHead>
              <TableHead>Suffix</TableHead>
              <TableHead className="cursor-pointer hover:bg-black/5 transition-colors" onClick={() => requestSort('email')}>
                <div className="flex items-center gap-1">Email {getSortIcon('email')}</div>
              </TableHead>
              <TableHead className="w-12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <AuthorsTableSkeleton rows={PER_PAGE} />
            ) : sortedAuthors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <EmptyState
                    title="No authors"
                    description="No authors match your search. Create one to get started."
                    className="bg-transparent border-0 py-16"
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedAuthors.map((author) => (
                <TableRow key={author.id} className="group">
                  <TableCell className="font-medium text-primary">{author.last_name}</TableCell>
                  <TableCell className="text-muted">{author.first_name}</TableCell>
                  <TableCell className="text-muted">{author.middle_name || '-'}</TableCell>
                  <TableCell className="text-muted">{author.suffix || '-'}</TableCell>
                  <TableCell className="text-muted text-[12px]">{author.email || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <DropdownMenu
                      trigger={
                        <IconButton icon={MoreVertical} title="Actions" />
                      }
                    >
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
              ))
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && closeModal()}
        title={editingAuthor ? 'Edit Author' : 'New Author'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
              {formError}
            </div>
          )}

          {/* Shared 4-field name grid component */}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingAuthor ? 'Save Changes' : 'Create Author'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Author"
        message="Are you sure you want to delete this author? This may affect articles linked to them."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageAuthors;
