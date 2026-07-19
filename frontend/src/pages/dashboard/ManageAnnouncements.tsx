import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react';
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      await fetchData();
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = announcements.filter(a => a.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <DashboardHeader title="Announcements">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </DashboardHeader>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <SearchInput 
          placeholder="Search announcements..." 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
        />
      </div>

      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        <div className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5 grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-8">Title</div>
          <div className="col-span-3">Date</div>
          <div className="col-span-1"></div>
        </div>
        
        {loading ? (
          <ListSkeleton colSpans={[4, 6, 2]} rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No announcements" description="No announcements found." className="border-0 bg-transparent py-16" />
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-background transition-colors group cursor-default items-center">
              <div className="col-span-8 flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary truncate">{item.title}</span>
              </div>
              <div className="col-span-3 text-[12px] text-muted">{new Date(item.created_at).toLocaleDateString()}</div>
              <div className="col-span-1 flex justify-end gap-2">
                <IconButton icon={Edit2} onClick={() => handleOpenModal(item)} title="Edit" />
                <IconButton icon={Trash2} variant="danger" onClick={() => handleDelete(item.id)} title="Delete" />
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingItem ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{error}</div>}
          <Input 
            label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
          />
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
    </div>
  );
};

export default ManageAnnouncements;
