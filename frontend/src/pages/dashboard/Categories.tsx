import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Plus, Edit2, Trash2, Tag, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
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
  order?: number;
}

interface CategoryRowProps {
  cat: Category;
  idx: number;
  isLast: boolean;
  isReordering: boolean;
  moveCategory: (index: number, direction: 'up' | 'down') => void;
  openModal: (cat: Category) => void;
  setDeleteId: (id: number) => void;
  setIsReordering: (val: boolean) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  cat,
  idx,
  isLast,
  isReordering,
  moveCategory,
  openModal,
  setDeleteId,
  setIsReordering,
}) => {
  const controls = useDragControls();

  if (isReordering) {
    return (
      <Reorder.Item
        value={cat}
        dragListener={false}
        dragControls={controls}
        className="flex items-center justify-between px-5 py-3 transition-colors bg-surface hover:bg-background/50 border-b border-border last:border-b-0"
        whileDrag={{ 
          scale: 1.01,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          zIndex: 50,
          backgroundColor: "var(--surface)"
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-black/5 active:bg-black/10 cursor-grab active:cursor-grabbing touch-none select-none transition-colors bg-primary/10 text-primary"
            onPointerDown={(e) => {
              setIsReordering(true);
              controls.start(e);
            }}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 stroke-[2.5]" />
          </div>

          {/* Up / Down Buttons */}
          <div className="flex flex-col gap-0.5 items-center shrink-0 w-8" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={() => moveCategory(idx, 'up')}
              disabled={idx === 0}
              title="Move Up"
              className="p-1 rounded text-gray-400 hover:text-primary hover:bg-black/5 disabled:opacity-20 transition-all cursor-pointer"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => moveCategory(idx, 'down')}
              disabled={isLast}
              title="Move Down"
              className="p-1 rounded text-gray-400 hover:text-primary hover:bg-black/5 disabled:opacity-20 transition-all cursor-pointer"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Category Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Tag className="h-4 w-4 text-primary/30 shrink-0" />
            <span className="text-[13px] font-semibold text-primary truncate">
              {cat.name}
            </span>
            <span className="text-[11px] font-mono text-muted">
              ({cat.slug})
            </span>
          </div>
        </div>
      </Reorder.Item>
    );
  }

  return (
    <tr className="hover:bg-background transition-colors group">
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
  );
};

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Reordering state
  const [isReordering, setIsReordering] = useState(false);
  const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      const cats = res.data.data || [];
      setCategories(cats);
      setOriginalCategories(cats);
      setIsReordering(false);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newItems = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setCategories(newItems);
  };

  const handleReorderList = (newCats: Category[]) => {
    setCategories(newCats);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const ids = categories.map(c => c.id);
      await api.post('/categories/reorder', { category_ids: ids });
      toast.success('Category order updated successfully');
      setOriginalCategories(categories);
      setIsReordering(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category order');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelReorder = () => {
    setCategories(originalCategories);
    setIsReordering(false);
  };

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
        <div className="flex items-center gap-3">
          {!isReordering ? (
            <>
              {categories.length > 1 && (
                <Button variant="outline" onClick={() => setIsReordering(true)} className="shrink-0 flex items-center gap-2">
                  <GripVertical className="h-4 w-4" /> Edit Order
                </Button>
              )}
              <Button onClick={() => openModal()} className="shrink-0 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Category
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelReorder} disabled={isSavingOrder}>
                Cancel
              </Button>
              <Button onClick={handleSaveOrder} isLoading={isSavingOrder}>
                Save Order
              </Button>
            </>
          )}
        </div>
      </DashboardHeader>

      {/* Search Input & Count Text */}
      {!isReordering && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {!loading && (
            <p className="text-[11px] text-muted">
              Showing {filtered.length > 0 ? 1 : 0}–{filtered.length} of {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          )}
          <div className="w-full sm:w-auto flex justify-end">
            <SearchInput
              placeholder="Search categories..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Reorder Info Banner */}
      {isReordering && (
        <div className="bg-primary/5 border border-primary/20 p-4 text-[13px] text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-primary" />
            <span>Drag items using the handle or use the <strong>Up</strong> and <strong>Down</strong> arrows to adjust category display order.</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="border border-border bg-surface overflow-x-auto max-h-[500px] overflow-y-auto relative">
        {isReordering ? (
          <Reorder.Group axis="y" values={categories} onReorder={handleReorderList} className="divide-y divide-border">
            {categories.map((cat, idx) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                idx={idx}
                isLast={idx === categories.length - 1}
                isReordering={true}
                moveCategory={moveCategory}
                openModal={openModal}
                setDeleteId={setDeleteId}
                setIsReordering={setIsReordering}
              />
            ))}
          </Reorder.Group>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5">
              <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
                <th className="px-5 py-3">Category Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3 hidden md:table-cell">Description</th>
                <th className="px-5 py-3 w-20 text-right">Actions</th>
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
                filtered.map((cat, idx) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    idx={idx}
                    isLast={idx === filtered.length - 1}
                    isReordering={false}
                    moveCategory={moveCategory}
                    openModal={openModal}
                    setDeleteId={setDeleteId}
                    setIsReordering={setIsReordering}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title={editingCategory ? "Edit Category" : "Add Category"}
        isDirty={formData.name !== (editingCategory?.name || '') || formData.slug !== (editingCategory?.slug || '') || formData.description !== (editingCategory?.description || '')}
      >
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
