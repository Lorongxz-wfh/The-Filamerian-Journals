import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';

const PER_PAGE = 10;

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const ManageAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', PER_PAGE.toString());
      if (debouncedFilter) params.append('search', debouncedFilter);
      const res = await api.get(`/announcements?${params.toString()}`);
      setAnnouncements(res.data.data);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !isModalOpen) {
        e.preventDefault();
        setError(null);
        setEditingItem(null);
        setFormData({ title: '', body: '' });
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleOpenModal = (item: Announcement | null = null) => {
    setError(null);
    setEditingItem(item);
    if (item) {
      setFormData({ title: item.title, body: item.body });
    } else {
      setFormData({ title: '', body: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingItem) {
        await api.put(`/announcements/${editingItem.id}`, formData);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', formData);
        toast.success('Announcement created');
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    try {
      setIsDeleting(true);
      await api.delete(`/announcements/${deleteTarget}`);
      await fetchData();
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <DashboardHeader title="Announcements">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer" title="New Announcement">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Announcement</span>
        </Button>
      </DashboardHeader>

      <div className="flex flex-col gap-2.5 sm:gap-4">
        <div className="flex items-center">
          <div className="w-full sm:w-64">
            <SearchInput 
              placeholder="Search announcements..." 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
            />
          </div>
        </div>

        <div className="border border-border bg-surface flex flex-col">
        <Table containerClassName="max-h-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-44 hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-10 sm:w-12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <ListSkeleton colSpans={[4, 6, 2]} rows={PER_PAGE} />
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <EmptyState 
                    title="No announcements" 
                    description={filter ? "No announcements match your search query." : "No announcements posted yet."} 
                    action={
                      filter ? (
                        <Button variant="ghost" size="sm" onClick={() => setFilter('')}>
                          Clear Search
                        </Button>
                      ) : undefined
                    }
                    className="border-0 bg-transparent py-16" 
                  />
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-2.5 sm:py-3.5">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                      <Megaphone className="h-4 w-4 text-primary/30 shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-[13px] font-medium text-primary line-clamp-1">{item.title}</span>
                        {/* Mobile date subtitle */}
                        <span className="sm:hidden text-[10px] text-muted block mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted hidden sm:table-cell">
                    {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right py-2.5 sm:py-3.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                      trigger={
                        <IconButton icon={MoreVertical} title="Actions" className="h-7 w-7" />
                      }
                    >
                      <DropdownMenuItem onClick={() => handleOpenModal(item)}>
                        <div className="flex items-center gap-2 text-foreground">
                          <Edit2 className="h-4 w-4 text-muted" /> Edit Announcement
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                        <div className="flex items-center gap-2 text-red-600">
                          <Trash2 className="h-4 w-4 text-red-600" /> Delete Announcement
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
          showingText={`Showing ${total > 0 ? Math.min((page - 1) * PER_PAGE + 1, total) : 0}–${Math.min(page * PER_PAGE, total)} of ${total} announcement${total !== 1 ? 's' : ''}`}
          loading={loading}
        />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingItem ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{error}</div>}
          <div>
            <Input 
              label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Call for Papers - Volume 12 Issue 1"
            />
            <p className="text-[11px] text-muted mt-1">Announcements will be featured on the public homepage portal</p>
          </div>
          <RichTextEditor 
            label="Content" 
            value={formData.body} 
            onChange={value => setFormData({...formData, body: value})}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        message="Are you sure you want to remove this announcement from active publication?"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageAnnouncements;
