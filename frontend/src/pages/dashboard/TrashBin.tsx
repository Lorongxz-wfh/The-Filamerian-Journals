import React, { useState, useEffect, useMemo } from 'react';
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
  CheckSquare,
  X,
  MoreVertical,
  HelpCircle,
  CornerDownRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import IconButton from '@/components/ui/IconButton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrashedItem {
  id: number;
  type: 'article' | 'volume' | 'journal';
  title?: string;
  volume_number?: string | number;
  year?: number;
  volume_id?: number;
  journal_id?: number;
  deleted_at: string;
  days_remaining: number;
  volume?: {
    id?: number;
    volume_number: string | number;
    year: number;
    journal_id?: number;
    journal?: {
      id?: number;
      title: string;
    };
  };
  journal?: {
    id?: number;
    title: string;
  };
  category?: {
    name: string;
  };
}

interface HierarchicalTrashItem extends TrashedItem {
  level: number;
  treeParentKey?: string;
  hasChildren?: boolean;
  childCount?: number;
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

  // Toggle select mode for checkboxes
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Bulk Selection State
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Action Modals State
  const [selectedItem, setSelectedItem] = useState<TrashedItem | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'forceDelete' | 'batchRestore' | 'batchForceDelete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Collapsible hierarchy state
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const toggleCollapse = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getItemTitle = (item: TrashedItem) => {
    if (item.title) return item.title;
    if (item.type === 'volume') {
      const volStr = String(item.volume_number || '').replace(/^Vol(?:ume)?\.?\s*/i, '');
      return `Volume ${volStr}${item.year ? ` (${item.year})` : ''}`;
    }
    return `Item #${item.id}`;
  };

  const getItemContext = (item: TrashedItem) => {
    if (item.type === 'article') {
      const jTitle = item.volume?.journal?.title || item.journal?.title;
      const volNum = item.volume?.volume_number ? String(item.volume.volume_number).replace(/^Vol(?:ume)?\.?\s*/i, '') : '';
      if (jTitle && volNum) return `${jTitle} • Vol. ${volNum}`;
      if (jTitle) return jTitle;
      if (volNum) return `Volume ${volNum}`;
      return 'Academic Article';
    }
    if (item.type === 'volume') {
      return item.journal?.title || 'Journal Volume';
    }
    return item.category?.name || 'Journal Collection';
  };

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

  const filteredItems = useMemo<HierarchicalTrashItem[]>(() => {
    if (activeTab !== 'all') {
      const items = (activeTab === 'article' ? articles : activeTab === 'volume' ? volumes : journals);
      return items
        .filter((item) => {
          const titleText = getItemTitle(item);
          return !searchQuery || titleText.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .map((item) => ({ ...item, level: 0 }));
    }

    const trashedJournalIds = new Set(journals.map((j) => j.id));
    const trashedVolumeIds = new Set(volumes.map((v) => v.id));
    const result: HierarchicalTrashItem[] = [];

    // 1. Trashed Journals (Parent Level 0)
    journals.forEach((journal) => {
      const journalKey = `journal-${journal.id}`;
      const isJournalCollapsed = collapsedKeys.has(journalKey);

      const childVolumes = volumes.filter(
        (v) => (v.journal_id === journal.id) || (v.journal?.id === journal.id)
      );
      const childArticlesUnderJournalVolumes = articles.filter((a) => {
        const volId = a.volume_id || a.volume?.id;
        return childVolumes.some((v) => v.id === volId);
      });
      const directArticlesUnderJournal = articles.filter((a) => {
        const jId = a.volume?.journal?.id || a.volume?.journal_id;
        const volId = a.volume_id || a.volume?.id;
        return jId === journal.id && (!volId || !childVolumes.some((v) => v.id === volId));
      });

      const totalChildren = childVolumes.length + childArticlesUnderJournalVolumes.length + directArticlesUnderJournal.length;

      const matchesJournal = !searchQuery || (journal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchingChildVolumes = childVolumes.filter(
        (v) => !searchQuery || getItemTitle(v).toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchingArticles = [...childArticlesUnderJournalVolumes, ...directArticlesUnderJournal].filter(
        (a) => !searchQuery || (a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );

      if (matchesJournal || matchingChildVolumes.length > 0 || matchingArticles.length > 0) {
        result.push({
          ...journal,
          level: 0,
          hasChildren: totalChildren > 0,
          childCount: totalChildren,
        });

        // Only append children if journal is not collapsed
        if (!isJournalCollapsed) {
          childVolumes.forEach((volume) => {
            const volumeKey = `volume-${volume.id}`;
            const isVolumeCollapsed = collapsedKeys.has(volumeKey);
            const articlesUnderVolume = articles.filter(
              (a) => (a.volume_id === volume.id) || (a.volume?.id === volume.id)
            );
            result.push({
              ...volume,
              level: 1,
              treeParentKey: journalKey,
              hasChildren: articlesUnderVolume.length > 0,
              childCount: articlesUnderVolume.length,
            });

            if (!isVolumeCollapsed) {
              articlesUnderVolume.forEach((article) => {
                result.push({
                  ...article,
                  level: 2,
                  treeParentKey: volumeKey,
                });
              });
            }
          });

          directArticlesUnderJournal.forEach((article) => {
            result.push({
              ...article,
              level: 1,
              treeParentKey: journalKey,
            });
          });
        }
      }
    });

    // 2. Trashed Volumes whose Journal is NOT in trash
    volumes.forEach((volume) => {
      const parentJournalId = volume.journal_id || volume.journal?.id;
      if (parentJournalId && trashedJournalIds.has(parentJournalId)) {
        return;
      }

      const volumeKey = `volume-${volume.id}`;
      const isVolumeCollapsed = collapsedKeys.has(volumeKey);
      const childArticles = articles.filter(
        (a) => (a.volume_id === volume.id) || (a.volume?.id === volume.id)
      );

      const matchesVolume = !searchQuery || getItemTitle(volume).toLowerCase().includes(searchQuery.toLowerCase());
      const matchingArticles = childArticles.filter(
        (a) => !searchQuery || (a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );

      if (matchesVolume || matchingArticles.length > 0) {
        result.push({
          ...volume,
          level: 0,
          hasChildren: childArticles.length > 0,
          childCount: childArticles.length,
        });

        if (!isVolumeCollapsed) {
          childArticles.forEach((article) => {
            result.push({
              ...article,
              level: 1,
              treeParentKey: volumeKey,
            });
          });
        }
      }
    });

    // 3. Trashed Articles whose Volume & Journal are NOT in trash
    articles.forEach((article) => {
      const volId = article.volume_id || article.volume?.id;
      const jId = article.volume?.journal?.id;

      if ((volId && trashedVolumeIds.has(volId)) || (jId && trashedJournalIds.has(jId))) {
        return;
      }

      const matchesArticle = !searchQuery || (article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      if (matchesArticle) {
        result.push({
          ...article,
          level: 0,
        });
      }
    });

    return result;
  }, [activeTab, articles, volumes, journals, searchQuery, collapsedKeys]);

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
        title={
          <span className="inline-flex items-center gap-2">
            Trash Bin
            <span className="group relative inline-flex items-center">
              <HelpCircle className="h-4 w-4 text-muted/60 hover:text-primary cursor-pointer transition-colors" />
              <span className="absolute left-0 top-full mt-2 hidden group-hover:block w-64 p-2.5 bg-primary text-white text-[11px] font-normal normal-case tracking-normal rounded shadow-md z-50 pointer-events-none leading-relaxed">
                Soft-deleted articles, volumes, and journals are retained for 30 days before permanent deletion from storage.
              </span>
            </span>
          </span>
        }
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            containerClassName="w-32 xs:w-44 sm:w-72"
            className="h-9 text-xs"
          />
          <Button
            type="button"
            variant={isSelectMode ? "primary" : "outline"}
            onClick={() => {
              if (isSelectMode) {
                setSelectedKeys([]);
              }
              setIsSelectMode(!isSelectMode);
            }}
            className="h-9 text-xs flex items-center gap-1.5 px-2.5 sm:px-3 shrink-0 font-medium cursor-pointer"
            title={isSelectMode ? "Cancel Selection" : "Bulk Select"}
          >
            {isSelectMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isSelectMode ? 'Cancel' : 'Select'}</span>
          </Button>
          <button
            onClick={fetchTrashItems}
            disabled={loading}
            className="h-9 w-9 border border-border bg-surface hover:bg-background text-muted hover:text-primary transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title="Refresh Trash Bin"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </DashboardHeader>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2 sm:pb-3">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar pr-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            All ({allItems.length})
          </button>
          <button
            onClick={() => setActiveTab('article')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeTab === 'article'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Articles ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeTab === 'volume'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Volumes ({volumes.length})
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeTab === 'journal'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            Journals ({journals.length})
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Toolbar when items selected */}
      {isSelectMode && selectedKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary/10 border border-primary/20 p-3.5 rounded-lg gap-4 transition-all shadow-xs">
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
              className="bg-surface text-primary border-border hover:bg-background text-[12px] font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 inline" />
              Restore Selected ({selectedKeys.length})
            </Button>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionType('batchForceDelete')}
                className="bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20 text-[12px] font-medium"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 inline" />
                Purge Selected ({selectedKeys.length})
              </Button>
            )}
          </div>
        </div>
      )}


      <div className="border border-border bg-surface flex flex-col">
        <Table containerClassName="max-h-[520px]">
          <TableHeader>
            <TableRow>
              {isSelectMode && (
                <TableHead className="w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.every(i => selectedKeys.includes(`${i.type}-${i.id}`))}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-primary cursor-pointer h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead>Item Name / Title</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Original Context</TableHead>
              <TableHead className="hidden lg:table-cell">Deleted On</TableHead>
              <TableHead className="hidden sm:table-cell">Retention</TableHead>
              <TableHead className="w-10 sm:w-12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  {isSelectMode && (
                    <TableCell className="w-10 text-center py-3.5">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
                  )}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-4 shrink-0" />
                      <div className="space-y-1 w-full max-w-[280px]">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2 sm:hidden" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3.5 w-36" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-3.5 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-3.5 w-20" />
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <Skeleton className="h-7 w-7 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSelectMode ? 7 : 6} className="p-0">
                  <EmptyState
                    icon={Trash2}
                    title="Trash Bin is Empty"
                    description={searchQuery ? "No deleted items match your search criteria." : "Soft-deleted articles, volumes, and journals will appear here for 30 days."}
                    className="border-0 bg-transparent py-12"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const itemKey = `${item.type}-${item.id}`;
                const isSelected = selectedKeys.includes(itemKey);
                const title = getItemTitle(item);
                const context = getItemContext(item);
                const isCollapsed = collapsedKeys.has(itemKey);

                const indentClass = item.level === 2
                  ? 'pl-9 sm:pl-14'
                  : item.level === 1
                  ? 'pl-5 sm:pl-7'
                  : 'pl-0';

                return (
                  <TableRow key={itemKey} className={`hover:bg-primary/5 transition-colors ${isSelected ? 'bg-primary/5' : ''} ${item.level > 0 ? 'bg-muted/[0.02]' : ''}`}>
                    {isSelectMode && (
                      <TableCell className="text-center py-2.5 sm:py-3.5">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(itemKey)}
                          className="rounded border-border accent-primary cursor-pointer h-4 w-4"
                        />
                      </TableCell>
                    )}

                    <TableCell className={`font-medium text-foreground py-2.5 sm:py-3.5 ${indentClass}`}>
                      <div className="flex items-start gap-2 min-w-0">
                        {item.level > 0 && (
                          <CornerDownRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${item.level === 2 ? 'text-muted/40' : 'text-muted/70'}`} />
                        )}
                        {item.type === 'article' && <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                        {item.type === 'volume' && <Layers className="h-4 w-4 text-secondary shrink-0 mt-0.5" />}
                        {item.type === 'journal' && <BookOpen className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="line-clamp-1 text-xs sm:text-[13px] font-semibold">{title}</span>
                            {activeTab === 'all' && item.hasChildren && item.childCount && item.childCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollapse(itemKey);
                                }}
                                className="inline-flex items-center gap-1 text-[9px] font-mono font-medium text-muted hover:text-primary transition-colors cursor-pointer bg-muted/10 hover:bg-muted/20 border border-border px-1.5 py-0.5 shrink-0"
                                title={isCollapsed ? "Click to expand nested items" : "Click to collapse nested items"}
                              >
                                {isCollapsed ? <ChevronRight className="h-2.5 w-2.5 text-muted" /> : <ChevronDown className="h-2.5 w-2.5 text-muted" />}
                                <span>{item.childCount} nested</span>
                              </button>
                            )}
                          </div>
                          {/* Mobile subtitle */}
                          <div className="sm:hidden text-[10px] text-muted truncate mt-0.5">
                            <span className="capitalize font-medium text-primary/80">{item.type}</span>
                            <span> • {context}</span>
                            <span className="text-amber-600 font-medium"> • {item.days_remaining}d left</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-widest text-primary/70 bg-surface border border-border">
                        {item.type}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted text-[12px] hidden md:table-cell truncate max-w-[200px]">
                      {context}
                    </TableCell>

                    <TableCell className="text-muted text-[12px] hidden lg:table-cell whitespace-nowrap">
                      {new Date(item.deleted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {item.days_remaining} days left
                      </span>
                    </TableCell>

                    <TableCell className="text-right py-2.5 sm:py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        trigger={
                          <IconButton icon={MoreVertical} title="Actions" className="h-7 w-7" />
                        }
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedItem(item);
                            setActionType('restore');
                          }}
                        >
                          <div className="flex items-center gap-2 text-emerald-600">
                            <RotateCcw className="h-4 w-4 text-emerald-600" /> Restore Item
                          </div>
                        </DropdownMenuItem>
                        {isSuperAdmin && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType('forceDelete');
                            }}
                          >
                            <div className="flex items-center gap-2 text-red-600">
                              <Trash2 className="h-4 w-4 text-red-600" /> Purge Permanently
                            </div>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          showingText={loading ? 'Loading trash bin items...' : `Showing ${filteredItems.length} of ${allItems.length} deleted item${allItems.length !== 1 ? 's' : ''}`}
        />
        </div>

      {/* Individual Restore Confirmation Modal */}
      <Modal
        isOpen={actionType === 'restore'}
        onClose={() => setActionType(null)}
        title="Confirm Item Restoration"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
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
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg text-[12px] text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Proceeding with permanent purge will permanently wipe database records and remove associated PDF/image files from Cloudflare R2 storage.
            </p>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Item to purge: <strong>"{selectedItem?.title || `Volume ${selectedItem?.volume_number}`}"</strong>
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleForceDelete} 
              isLoading={actionLoading}
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
          <p className="text-[13px] text-muted-foreground leading-relaxed">
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
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg text-[12px] text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Proceeding with batch purge will permanently erase <strong>{selectedKeys.length} selected items</strong> from the database and delete all attached files from Cloudflare R2 storage.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleBatchForceDelete} 
              isLoading={actionLoading}
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
