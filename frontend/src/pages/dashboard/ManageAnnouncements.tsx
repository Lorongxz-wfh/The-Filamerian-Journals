import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
      } else {
        await api.post('/announcements', formData);
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
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const filtered = announcements.filter(a => a.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">Announcements</h1>
          <p className="text-[13px] text-muted mt-1">Manage public news and updates</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input
          type="text"
          placeholder="Filter announcements..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary"
        />
      </div>

      <div className="border border-border bg-surface">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-8">Title</div>
          <div className="col-span-3">Date</div>
          <div className="col-span-1"></div>
        </div>
        
        {loading ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">No announcements found.</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-background transition-colors group cursor-default items-center">
              <div className="col-span-8 flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary truncate">{item.title}</span>
              </div>
              <div className="col-span-3 text-[12px] text-muted">{new Date(item.created_at).toLocaleDateString()}</div>
              <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(item)} className="text-muted/40 hover:text-primary h-7 w-7 flex items-center justify-center">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-muted/40 hover:text-red-500 h-7 w-7 flex items-center justify-center">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingItem ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Title *</label>
            <input 
              type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Content *</label>
            <textarea 
              required rows={6} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Announcement'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageAnnouncements;
