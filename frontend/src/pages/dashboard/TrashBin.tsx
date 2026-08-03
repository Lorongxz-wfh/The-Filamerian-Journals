import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  FileText, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrashedItem {
  id: number;
  type: 'article' | 'volume' | 'journal';
  title?: string;
  volume_number?: string | number;
  year?: number;
  deleted_at: string;
  days_remaining: number;
  volume?: {
    volume_number: string | number;
    year: number;
    journal?: {
      title: string;
    };
  };
  journal?: {
    title: string;
  };
  category?: {
    name: string;
  };
}

const TrashBin: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user?.roles?.some((r: any) => r.name === 'Super Admin') || user?.role === 'Super Admin';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'volume' | 'journal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [articles, setArticles] = useState<TrashedItem[]>([]);
  const [volumes, setVolumes] = useState<TrashedItem[]>([]);
  const [journals, setJournals] = useState<TrashedItem[]>([]);

  // Bulk Selection State
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Action Modals State
  const [selectedItem, setSelectedItem] = useState<TrashedItem | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'forceDelete' | 'batchRestore' | 'batchForceDelete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trash');
      setArticles(res.data.articles || []);
      setVolumes(res.data.volumes || []);
      setJournals(res.data.journals || []);
    } catch (err) {
      console.error('Failed to fetch trash items', err);
      toast.error('Could not load trash items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const allItems: TrashedItem[] = [...articles, ...volumes, ...journals];

  const filteredItems = allItems.filter((item) => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const titleText = item.title || `Volume ${item.volume_number}`;
    const matchesSearch = !searchQuery || titleText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleSelectAll = () => {
    const allFilteredKeys = filteredItems.map(item => `${item.type}-${item.id}`);
    const isAllSelected = allFilteredKeys.length > 0 && allFilteredKeys.every(k => selectedKeys.includes(k));
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allFilteredKeys);
    }
  };

  const toggleSelectItem = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleRestore = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      await api.post(`/trash/${selectedItem.type}/${selectedItem.id}/restore`);
      toast.success(`Successfully restored ${selectedItem.type === 'article' ? 'article' : selectedItem.type === 'volume' ? 'volume' : 'journal'}.`);
      setSelectedItem(null);
      setActionType(null);
      fetchTrashItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceDelete = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      await api.delete(`/trash/${selectedItem.type}/${selectedItem.id}/force`);
      toast.success(`Permanently deleted ${selectedItem.type} and erased files from storage.`);
      setSelectedItem(null);
      setActionType(null);
      fetchTrashItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to purge item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedKeys.length === 0) return;
    setActionLoading(true);
    try {
      const items = selectedKeys.map(k => {
        const parts = k.split('-');
        const type = parts[0];
        const id = parseInt(parts[1], 10);
        return { type, id };
      });
      const res = await api.post('/trash/batch-restore', { items });
      toast.success(res.data.message || `Successfully restored ${items.length} item(s).`);
      setSelectedKeys([]);
      setActionType(null);
      fetchTrashItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore selected items.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchForceDelete = async () => {
    if (selectedKeys.length === 0) return;
    setActionLoading(true);
    try {
      const items = selectedKeys.map(k => {
        const parts = k.split('-');
        const type = parts[0];
        const id = parseInt(parts[1], 10);
        return { type, id };
      });
      const res = await api.delete('/trash/batch-force', { data: { items } });
      toast.success(res.data.message || `Permanently deleted ${items.length} item(s) and wiped storage.`);
      setSelectedKeys([]);
      setActionType(null);
      fetchTrashItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to purge selected items.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <DashboardHeader 
        title="30-Day Trash Bin & Storage Cleanup" 
        className="mb-4"
      />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            All Items ({allItems.length})
          </button>
          <button
            onClick={() => setActiveTab('article')}
            className={`px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === 'article'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Articles ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === 'volume'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Volumes ({volumes.length})
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === 'journal'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Journals ({journals.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deleted items..."
            className="w-full sm:w-64"
          />
          <button
            onClick={fetchTrashItems}
            disabled={loading}
            className="p-2 border border-border bg-surface hover:bg-background text-muted hover:text-primary transition-colors shrink-0"
            title="Refresh Trash Bin"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar when items selected */}
      {selectedKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary/10 border border-primary/20 p-3.5 gap-4 transition-all">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[13px] font-semibold text-primary">
              {selectedKeys.length} item{selectedKeys.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActionType('batchRestore')}
              className="bg-surface text-primary border-border hover:bg-background text-[12px]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 inline" />
              Restore Selected ({selectedKeys.length})
            </Button>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionType('batchForceDelete')}
                className="bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20 text-[12px]"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 inline" />
                Purge Selected ({selectedKeys.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table & Results Header */}
      <div className="flex justify-between items-center text-[12px] font-mono text-muted px-1">
        {loading ? (
          <Skeleton className="h-4 w-36 rounded shrink-0 my-0.5" />
        ) : (
          <span>Showing {filteredItems.length} of {allItems.length} deleted items</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash Bin is Empty"
          description={searchQuery ? "No deleted items match your search criteria." : "Soft-deleted articles, volumes, and journals will appear here for 30 days."}
        />
      ) : (
        <div className="border border-border bg-surface overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider bg-background/50">
                <th className="py-3 px-4 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.every(i => selectedKeys.includes(`${i.type}-${i.id}`))}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-primary cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-3 px-4">Item Name / Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Original Context</th>
                <th className="py-3 px-4">Deleted On</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => {
                const itemKey = `${item.type}-${item.id}`;
                const isSelected = selectedKeys.includes(itemKey);
                const title = item.title || `Volume ${item.volume_number} (${item.year})`;
                const context = item.type === 'article'
                  ? `${item.volume?.journal?.title || 'Journal'} → Vol. ${item.volume?.volume_number || ''}`
                  : item.type === 'volume'
                  ? item.journal?.title || 'Journal'
                  : item.category?.name || 'Journal Collection';

                return (
                  <tr key={itemKey} className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-surface/50'}`}>
                    <td className="py-3.5 px-4 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(itemKey)}
                        className="rounded border-border accent-primary cursor-pointer h-4 w-4"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-primary">
                      <div className="flex items-center gap-2.5">
                        {item.type === 'article' && <FileText className="h-4 w-4 text-primary shrink-0" />}
                        {item.type === 'volume' && <Layers className="h-4 w-4 text-secondary shrink-0" />}
                        {item.type === 'journal' && <BookOpen className="h-4 w-4 text-primary shrink-0" />}
                        <span className="line-clamp-1">{title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                        item.type === 'article'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : item.type === 'volume'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted text-[12px]">
                      {context}
                    </td>

                    <td className="py-3.5 px-4 text-muted text-[12px]">
                      {new Date(item.deleted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.days_remaining} days left</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setActionType('restore');
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
                        Restore
                      </Button>

                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setActionType('forceDelete');
                          }}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
                          Purge
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Individual Restore Confirmation Modal */}
      <Modal
        isOpen={actionType === 'restore'}
        onClose={() => setActionType(null)}
        title="Confirm Item Restoration"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-muted leading-relaxed">
            Are you sure you want to restore <strong>"{selectedItem?.title || `Volume ${selectedItem?.volume_number}`}"</strong> back to active publishing status?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRestore} isLoading={actionLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
              Restore Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Individual Force Delete Modal */}
      <Modal
        isOpen={actionType === 'forceDelete'}
        onClose={() => setActionType(null)}
        title="Permanent Purge & Storage Wipe"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded text-[12px] text-red-600 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>WARNING:</strong> This action cannot be undone! The database record will be permanently erased and all attached PDF/image files will be deleted from Cloudflare R2 storage.
            </p>
          </div>
          <p className="text-[13px] text-muted">
            Item to purge: <strong>"{selectedItem?.title || `Volume ${selectedItem?.volume_number}`}"</strong>
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleForceDelete} 
              isLoading={actionLoading} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5 inline" />
              Permanently Purge & Wipe R2
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Restore Confirmation Modal */}
      <Modal
        isOpen={actionType === 'batchRestore'}
        onClose={() => setActionType(null)}
        title="Confirm Batch Item Restoration"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-muted leading-relaxed">
            Are you sure you want to restore the <strong>{selectedKeys.length} selected item(s)</strong> back to active publishing status?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBatchRestore} isLoading={actionLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
              Restore {selectedKeys.length} Items
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Force Delete Modal */}
      <Modal
        isOpen={actionType === 'batchForceDelete'}
        onClose={() => setActionType(null)}
        title="Permanent Batch Purge & Storage Wipe"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded text-[12px] text-red-600 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>WARNING:</strong> This action cannot be undone! All <strong>{selectedKeys.length} selected items</strong> and their attached PDF/image files will be permanently wiped from database and Cloudflare R2 storage.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleBatchForceDelete} 
              isLoading={actionLoading} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5 inline" />
              Permanently Purge {selectedKeys.length} Items
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrashBin;
