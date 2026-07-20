import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      toast.success('Category deleted successfully');
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.slug.toLowerCase().includes(filter.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <DashboardHeader title="Journal Categories">
        <Button onClick={() => openModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </DashboardHeader>

      {/* Search Input */}
      <div className="flex justify-end">
        <SearchInput
          placeholder="Search categories..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5">
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Category Name</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3 hidden md:table-cell">Description</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableRowSkeleton columns={4} rows={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <EmptyState title="No categories found" description="There are no categories matching your criteria." className="bg-transparent border-0 py-16" />
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-background transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Tag className="h-4 w-4 text-primary/30 shrink-0" />
                      <span className="text-[13px] font-medium text-primary truncate">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted font-mono">
                    {cat.slug}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted hidden md:table-cell truncate max-w-xs">
                    {cat.description || '-'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon={Edit2} title="Edit" onClick={() => openModal(cat)} />
                      <IconButton icon={Trash2} title="Delete" variant="danger" onClick={() => setDeleteId(cat.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name" required 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
          />
          <Input 
            label="Slug (optional)" hint="Auto-generated if left blank"
            value={formData.slug} 
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
          />
          <Textarea 
            label="Description" 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          />
          <div className="flex justify-end pt-4 gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Category'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Journals currently assigned to this category will lose their association."
        confirmText="Delete"
      />
    </div>
  );
};

export default Categories;
