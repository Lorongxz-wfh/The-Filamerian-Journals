import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ListSkeleton } from '@/components/ui/Skeleton';

interface Resource {
  id: number;
  title: string;
  slug: string;
  content: string;
  order: number;
}

const ManageResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', order: '0' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources');
      setResources(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item: Resource | null = null) => {
    setError(null);
    setEditingItem(item);
    if (item) {
      setFormData({ 
        title: item.title, 
        slug: item.slug, 
        content: item.content || '', 
        order: String(item.order) 
      });
    } else {
      setFormData({ title: '', slug: '', content: '', order: '0' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingItem) {
        await api.put(`/resources/${editingItem.id}`, formData);
      } else {
        // Auto generate slug if empty
        const payload = { ...formData };
        if (!payload.slug) {
          payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        await api.post('/resources', payload);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this resource page?')) return;
    try {
      await api.delete(`/resources/${id}`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const filtered = resources.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">Resources</h1>
          <p className="text-[13px] text-muted mt-1">Manage public informational pages</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Resource
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input
          type="text"
          placeholder="Filter resources..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary"
        />
      </div>

      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        <div className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5 grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-1 text-center">Order</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-4">Slug</div>
          <div className="col-span-2"></div>
        </div>
        
        {loading ? (
          <ListSkeleton colSpans={[1, 5, 4, 2]} rows={5} />
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">No resources found.</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-background transition-colors group cursor-default items-center">
              <div className="col-span-1 text-center text-[13px] text-muted">{item.order}</div>
              <div className="col-span-5 flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary truncate">{item.title}</span>
              </div>
              <div className="col-span-4 text-[12px] text-muted truncate">{item.slug}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => handleOpenModal(item)} className="text-muted/60 hover:text-primary hover:bg-black/5 rounded h-7 w-7 flex items-center justify-center transition-all">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-muted/60 hover:text-red-500 hover:bg-red-500/10 rounded h-7 w-7 flex items-center justify-center transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingItem ? 'Edit Resource' : 'New Resource'} className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <Input 
                label="Order" required type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <Input 
                label="Slug" hint="Auto" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto"
              />
            </div>
          </div>

          <Textarea 
            label="Content (HTML Supported)" hint="<a href='https://www.w3schools.com/html/' target='_blank' rel='noreferrer' class='text-secondary hover:underline'>HTML Guide</a>" required rows={12} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="font-mono" placeholder="<h3>Heading</h3><p>Content goes here...</p><ul><li>Point 1</li></ul>"
          />
          
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Resource'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageResources;
