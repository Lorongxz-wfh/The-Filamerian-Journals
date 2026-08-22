import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Trash2, Archive, ArchiveRestore, ArrowLeft, 
  Download, Table as TableIcon, Mail, ArrowUp, ArrowDown, 
  Eye, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { MessageListSkeleton } from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/Table';

interface FeedbackItem {
  id: number;
  subject: string;
  category: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_archived?: boolean;
}

const Feedback: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user?.role === 'Super Admin';

  // View Mode: Inbox vs Table
  const [viewMode, setViewMode] = useState<'inbox' | 'table'>('inbox');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data & Pagination
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting (default active on Date / created_at desc)
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [exportCategory, setExportCategory] = useState('all');
  const [exportDatePreset, setExportDatePreset] = useState('all');
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const archivedParam = statusFilter === 'all' ? 'all' : (statusFilter === 'archived' ? 'true' : 'false');
      const params = new URLSearchParams({
        archived: archivedParam,
        page: page.toString(),
        sort_by: sortField,
        sort_dir: sortDir,
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (datePreset && datePreset !== 'all' && datePreset !== 'custom') params.append('date_preset', datePreset);
      if (datePreset === 'custom') {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
      }

      const res = await api.get(`/feedbacks?${params.toString()}`);
      setFeedbacks(res.data.data || []);
      setLastPage(res.data.last_page || 1);
      setTotal(res.data.total || (res.data.data ? res.data.data.length : 0));
    } catch (err) {
      console.error('Failed to fetch feedbacks', err);
      toast.error('Failed to load feedback messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    setSelected(null);
  }, [page, statusFilter, debouncedSearch, categoryFilter, datePreset, fromDate, toDate, sortField, sortDir]);

  const handleSelect = async (id: number) => {
    setSelected(id);
    const item = feedbacks.find(f => f.id === id);
    if (item && !item.is_read) {
      try {
        await api.put(`/feedbacks/${id}`, { is_read: true });
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, is_read: true } : f));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  const handleOpenQuickView = async (item: FeedbackItem) => {
    setQuickViewItem(item);
    if (!item.is_read) {
      try {
        await api.put(`/feedbacks/${item.id}`, { is_read: true });
        setFeedbacks(feedbacks.map(f => f.id === item.id ? { ...f, is_read: true } : f));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  const handleToggleArchive = async (id: number, currentArchived: boolean) => {
    try {
      await api.put(`/feedbacks/${id}`, { is_archived: !currentArchived });
      toast.success(currentArchived ? 'Feedback restored to active inbox' : 'Feedback moved to archive');
      if (statusFilter !== 'all') {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      } else {
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, is_archived: !currentArchived } : f));
      }
      if (selected === id) setSelected(null);
      if (quickViewItem?.id === id) setQuickViewItem(null);
    } catch (err) {
      console.error('Failed to update archive status', err);
      toast.error('Failed to update feedback status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/feedbacks/${deleteTargetId}`);
      setFeedbacks(feedbacks.filter(f => f.id !== deleteTargetId));
      if (selected === deleteTargetId) setSelected(null);
      if (quickViewItem?.id === deleteTargetId) setQuickViewItem(null);
      toast.success('Feedback message deleted successfully');
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete feedback', err);
      toast.error('Failed to delete feedback message');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUp className="h-3 w-3 opacity-20" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 opacity-100" /> : <ArrowDown className="h-3 w-3 opacity-100" />;
  };

  const handleOpenExportModal = () => {
    setExportStatus(statusFilter);
    setExportCategory(categoryFilter);
    setExportDatePreset(datePreset);
    setExportFromDate(fromDate);
    setExportToDate(toDate);
    setIsExportModalOpen(true);
  };

  const handleExecuteExportCsv = async () => {
    try {
      setIsExporting(true);
      const archivedParam = exportStatus === 'all' ? 'all' : (exportStatus === 'archived' ? 'true' : 'false');
      const params = new URLSearchParams({
        archived: archivedParam,
        per_page: 'all',
        sort_by: 'created_at',
        sort_dir: 'desc',
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (exportCategory && exportCategory !== 'all') params.append('category', exportCategory);
      if (exportDatePreset && exportDatePreset !== 'all' && exportDatePreset !== 'custom') {
        params.append('date_preset', exportDatePreset);
      }
      if (exportDatePreset === 'custom') {
        if (exportFromDate) params.append('from_date', exportFromDate);
        if (exportToDate) params.append('to_date', exportToDate);
      }

      const res = await api.get(`/feedbacks?${params.toString()}`);
      const exportList: FeedbackItem[] = res.data.data || [];

      if (exportList.length === 0) {
        toast.info('No feedback records found matching the selected export criteria.');
        return;
      }

      const headers = ['ID', 'Date Submitted', 'Category', 'Sender Name', 'Sender Email', 'Subject', 'Message Content', 'Archive Status', 'Read Status'];
      const rows = exportList.map(item => [
        item.id,
        new Date(item.created_at).toISOString().split('T')[0],
        `"${(item.category || 'General').replace(/"/g, '""')}"`,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.email || '').replace(/"/g, '""')}"`,
        `"${(item.subject || '').replace(/"/g, '""')}"`,
        `"${(item.message || '').replace(/"/g, '""')}"`,
        item.is_archived ? 'Archived' : 'Active',
        item.is_read ? 'Read' : 'Unread'
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FCU_Journals_Feedback_${exportStatus}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportModalOpen(false);
      toast.success(`Successfully exported ${exportList.length} feedback records to CSV.`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export feedback records.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedItem = feedbacks.find((f) => f.id === selected);

  const categoryOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Categories' },
      { value: 'System Issue', label: 'System Issue' },
      { value: 'Journal Suggestion', label: 'Journal Suggestion' },
      { value: 'Citation Request', label: 'Citation Request' },
      { value: 'Other', label: 'Other' },
    ];
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4 font-sans relative">
      <DashboardHeader 
        title="User Feedback & Inquiries"
        helpText="Review inquiries, research correspondence, suggestions, and submissions sent through the public repository."
      >
        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Inbox vs Table */}
          <div className="flex items-center gap-0.5 border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('inbox')}
              className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'inbox'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-primary hover:bg-background'
              }`}
              title="Split Inbox View"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Inbox</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-primary hover:bg-background'
              }`}
              title="Full Tabular View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenExportModal}
            className="text-xs flex items-center gap-1.5 border-border hover:bg-background h-9 px-3"
            title="Configure and download CSV export"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export CSV</span>
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex flex-col gap-2.5 sm:gap-4">
        {/* Clean Single Filter Row: Search on Left, followed by Status, Category, and Date */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Input on Left */}
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        {/* Status filter dropdown */}
        <div className="w-full sm:w-36">
          <Select
            className="py-1.5 h-9 text-xs"
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val as any); setPage(1); }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active Only' },
              { value: 'archived', label: 'Archived Only' },
            ]}
          />
        </div>

        {/* Category filter dropdown */}
        <div className="w-full sm:w-44">
          <Select
            className="py-1.5 h-9 text-xs"
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val as string); setPage(1); }}
            options={categoryOptions}
          />
        </div>

        {/* Date filter dropdown */}
        <div className="w-full sm:w-36">
          <Select
            className="py-1.5 h-9 text-xs"
            value={datePreset}
            onChange={(val) => { setDatePreset(val as string); setPage(1); }}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'last_7_days', label: 'Last 7 Days' },
              { value: 'this_month', label: 'This Month' },
              { value: 'last_30_days', label: 'Last 30 Days' },
              { value: 'this_year', label: 'This Year' },
              { value: 'custom', label: 'Custom Range...' }
            ]}
          />
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="h-9 px-2 bg-background border border-border text-xs focus:outline-none focus:border-primary"
              title="From Date"
            />
            <span className="text-xs text-muted">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="h-9 px-2 bg-background border border-border text-xs focus:outline-none focus:border-primary"
              title="To Date"
            />
          </div>
        )}
      </div>

      {/* VIEW MODE 1: MASTER-DETAIL INBOX VIEW */}
      {viewMode === 'inbox' && (
        <div className="border border-border bg-surface h-[480px] overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Message List */}
            <div className="lg:col-span-5 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-border">
              <div className="divide-y divide-border overflow-y-auto flex-grow custom-scrollbar">
                {loading ? (
                  <MessageListSkeleton rows={5} />
                ) : feedbacks.length === 0 ? (
                  <div className="p-8 text-center text-muted text-xs">
                    No feedback messages match your criteria.
                  </div>
                ) : (
                  feedbacks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full text-left px-3.5 py-3 transition-colors cursor-pointer ${
                        selected === item.id
                          ? 'bg-primary/5 border-l-3 border-l-primary'
                          : 'hover:bg-background border-l-3 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs truncate ${!item.is_read ? 'font-bold text-primary' : 'font-medium text-primary/70'}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-muted shrink-0 ml-2">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${!item.is_read ? 'text-primary font-semibold' : 'text-muted'}`}>
                        {item.subject}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20">
                          {item.category || 'General'}
                        </span>
                        {item.is_archived && (
                          <span className="text-[9px] font-bold text-muted bg-muted/10 px-1 py-0.2">
                            Archived
                          </span>
                        )}
                        {!item.is_read && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600">
                            • Unread
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              {lastPage > 1 && (
                <div className="border-t border-border p-2.5 bg-background/50 flex items-center justify-between shrink-0">
                  <Pagination
                    currentPage={page}
                    lastPage={lastPage}
                    onPageChange={setPage}
                    className="mt-0"
                  />
                </div>
              )}
            </div>

            {/* Message Detail (Desktop side-by-side) */}
            <div className="hidden lg:flex lg:col-span-7 p-4 sm:p-5 flex-col h-full overflow-y-auto custom-scrollbar">
              {selectedItem ? (
                <div className="space-y-4 flex-grow flex flex-col">
                  <div className="border-b border-border pb-3 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                            {selectedItem.category || 'General'}
                          </span>
                          {selectedItem.is_archived && (
                            <span className="text-[9px] font-bold text-muted bg-muted/10 px-1.5 py-0.5 border border-border">
                              Archived
                            </span>
                          )}
                        </div>
                        <h2 className="text-[15px] font-bold text-primary leading-snug">{selectedItem.subject}</h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleArchive(selectedItem.id, !!selectedItem.is_archived)}
                          className="px-2.5 py-1 text-xs font-semibold border border-border text-muted hover:text-primary hover:bg-background transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={selectedItem.is_archived ? 'Restore to Active Inbox' : 'Move to Archive'}
                        >
                          {selectedItem.is_archived ? (
                            <>
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <Archive className="h-3.5 w-3.5" />
                              <span>Archive</span>
                            </>
                          )}
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => setDeleteTargetId(selectedItem.id)}
                            className="h-7 w-7 shrink-0 flex items-center justify-center text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-colors border border-border cursor-pointer"
                            title="Permanently Delete Message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] text-muted">
                      <span>From: <span className="font-semibold text-primary">{selectedItem.name}</span></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Email: <a href={`mailto:${selectedItem.email}`} className="text-primary hover:underline font-mono">{selectedItem.email}</a></span>
                      <span className="hidden sm:inline">•</span>
                      <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-primary/85 leading-relaxed whitespace-pre-wrap flex-grow bg-background p-3.5 border border-border font-sans max-h-60 overflow-y-auto">
                    {selectedItem.message}
                  </p>
                  <div className="pt-2.5 border-t border-border mt-auto flex items-center justify-between text-[11px] text-muted">
                    <span>Click below to compose a direct response in your mail client:</span>
                    <a
                      href={`mailto:${selectedItem.email}?subject=Re: ${encodeURIComponent(selectedItem.subject)}`}
                      className="px-3 py-1 bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" /> Reply via Email
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 flex-grow">
                  <MessageSquare className="h-9 w-9 text-muted/20 mb-2" />
                  <p className="text-xs text-muted">Select a message from the list to read</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Slide-in Panel */}
          <div
            className={`absolute inset-0 z-20 bg-surface flex flex-col lg:hidden transition-transform duration-300 ease-out transform ${
              selectedItem ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            }`}
          >
            {selectedItem && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b border-border bg-background flex items-center justify-between gap-2 shrink-0">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-secondary transition-colors cursor-pointer py-1 px-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleArchive(selectedItem.id, !!selectedItem.is_archived)}
                      className="px-2.5 py-1 text-xs font-semibold border border-border text-muted hover:text-primary hover:bg-background transition-colors flex items-center gap-1"
                    >
                      {selectedItem.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      <span>{selectedItem.is_archived ? 'Restore' : 'Archive'}</span>
                    </button>
                    {isSuperAdmin && (
                      <button 
                        onClick={() => setDeleteTargetId(selectedItem.id)}
                        className="h-7 w-7 flex items-center justify-center text-red-500 hover:bg-red-50 border border-border"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 overflow-y-auto flex-grow space-y-3">
                  <div className="border-b border-border pb-3 space-y-1.5">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                      {selectedItem.category || 'General'}
                    </span>
                    <h2 className="text-sm font-bold text-primary leading-snug">
                      {selectedItem.subject}
                    </h2>
                    <div className="flex flex-col gap-0.5 text-[11px] text-muted pt-1">
                      <div>From: <span className="font-semibold text-primary">{selectedItem.name}</span></div>
                      <div>Email: <a href={`mailto:${selectedItem.email}`} className="text-primary underline font-mono">{selectedItem.email}</a></div>
                      <div className="text-[10px] text-muted/80">{new Date(selectedItem.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <p className="text-xs text-primary/85 leading-relaxed whitespace-pre-wrap bg-background p-3 border border-border">
                    {selectedItem.message}
                  </p>

                  <div className="pt-2">
                    <a
                      href={`mailto:${selectedItem.email}?subject=Re: ${encodeURIComponent(selectedItem.subject)}`}
                      className="w-full py-2 bg-primary text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" /> Reply to {selectedItem.name}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FULL TABULAR DATA TABLE */}
      {viewMode === 'table' && (
        <div className="border border-border bg-surface flex flex-col">
          <Table containerClassName="max-h-[480px]">
            <TableHeader>
              <TableRow>
                <TableHead isSorted={sortField === 'created_at'} className="cursor-pointer transition-colors w-[120px]" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">Date {getSortIcon('created_at')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'name'} className="cursor-pointer transition-colors w-[150px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Sender {getSortIcon('name')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'category'} className="cursor-pointer transition-colors w-[130px] hidden sm:table-cell" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'subject'} className="cursor-pointer transition-colors" onClick={() => handleSort('subject')}>
                  <div className="flex items-center gap-1">Subject & Message {getSortIcon('subject')}</div>
                </TableHead>
                <TableHead className="w-[90px] text-center hidden md:table-cell">Status</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted">
                    <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block mr-2" />
                    Loading feedback entries...
                  </TableCell>
                </TableRow>
              ) : feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted">
                    No feedback records match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => handleOpenQuickView(item)}
                    className="group hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <TableCell className="text-muted text-[11px] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs truncate ${!item.is_read ? 'font-bold text-primary' : 'font-medium text-primary/80'}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-muted font-mono truncate">{item.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        {item.category || 'General'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0 max-w-md">
                        <span className={`text-xs truncate ${!item.is_read ? 'font-bold text-primary' : 'font-semibold text-primary/80'}`}>
                          {item.subject}
                        </span>
                        <span className="text-[11px] text-muted line-clamp-1 mt-0.5">
                          {item.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <div className="flex flex-col items-center gap-1">
                        {!item.is_read ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[8px] px-1 py-0 font-bold">
                            Unread
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 font-semibold text-muted">
                            Read
                          </Badge>
                        )}
                        {item.is_archived && (
                          <span className="text-[8px] font-semibold text-muted bg-muted/20 px-1 rounded">Archived</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenQuickView(item)}
                          className="p-1 text-muted hover:text-primary hover:bg-background border border-border"
                          title="Quick View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(item.id, !!item.is_archived)}
                          className="p-1 text-muted hover:text-primary hover:bg-background border border-border"
                          title={item.is_archived ? 'Restore to Active' : 'Archive'}
                        >
                          {item.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeleteTargetId(item.id)}
                            className="p-1 text-red-500/60 hover:text-red-600 hover:bg-red-50 border border-border"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {total > 0 && (
            <div className="border-t border-border p-2.5 bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-muted">
                Showing <strong className="text-primary font-semibold">{feedbacks.length}</strong> of <strong className="text-primary font-semibold">{total}</strong> feedback messages
              </span>
              {lastPage > 1 && (
                <Pagination
                  currentPage={page}
                  lastPage={lastPage}
                  onPageChange={setPage}
                  className="mt-0"
                />
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* QUICK VIEW MODAL (For Table Mode) */}
      {quickViewItem && (
        <Modal
          isOpen={!!quickViewItem}
          onClose={() => setQuickViewItem(null)}
          title="Feedback Message Details"
          className="max-w-lg"
        >
          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5 border-b border-border pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                    {quickViewItem.category || 'General'}
                  </span>
                  {quickViewItem.is_archived && (
                    <span className="text-[9px] font-bold text-muted bg-muted/10 px-1.5 py-0.5 border border-border">
                      Archived
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted">
                  {new Date(quickViewItem.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="text-[15px] font-bold text-primary leading-snug">
                {quickViewItem.subject}
              </h3>
              <div className="text-xs text-muted flex flex-col gap-0.5 pt-1">
                <div>Sender: <strong className="text-primary">{quickViewItem.name}</strong></div>
                <div>Email: <a href={`mailto:${quickViewItem.email}`} className="text-primary font-mono hover:underline">{quickViewItem.email}</a></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Message Content</label>
              <div className="p-3 bg-background border border-border text-xs text-primary/85 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
                {quickViewItem.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleArchive(quickViewItem.id, !!quickViewItem.is_archived)}
                  className="text-xs"
                >
                  {quickViewItem.is_archived ? 'Restore to Inbox' : 'Archive'}
                </Button>
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const id = quickViewItem.id;
                      setQuickViewItem(null);
                      setDeleteTargetId(id);
                    }}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickViewItem(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <a
                  href={`mailto:${quickViewItem.email}?subject=Re: ${encodeURIComponent(quickViewItem.subject)}`}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EXPORT OPTIONS MODAL */}
      {isExportModalOpen && (
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => !isExporting && setIsExportModalOpen(false)}
          title="Export Feedback to CSV"
          className="max-w-md"
        >
          <div className="space-y-4 py-1">
            <p className="text-xs text-muted leading-relaxed">
              Configure the filters below to export an official CSV spreadsheet for academic audit, accreditation, and research records.
            </p>

            <div className="space-y-3 bg-surface p-3.5 border border-border">
              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Feedback Status</label>
                <Select
                  className="py-1.5 h-9 text-xs"
                  value={exportStatus}
                  onChange={(val) => setExportStatus(val as any)}
                  options={[
                    { value: 'all', label: 'All Feedback (Active & Archived)' },
                    { value: 'active', label: 'Active Feedback Only' },
                    { value: 'archived', label: 'Archived Messages Only' },
                  ]}
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Inquiry Category</label>
                <Select
                  className="py-1.5 h-9 text-xs"
                  value={exportCategory}
                  onChange={(val) => setExportCategory(val as string)}
                  options={categoryOptions}
                />
              </div>

              {/* Date Range Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Date Range</label>
                <Select
                  className="py-1.5 h-9 text-xs"
                  value={exportDatePreset}
                  onChange={(val) => setExportDatePreset(val as string)}
                  options={[
                    { value: 'all', label: 'All Time (Entire History)' },
                    { value: 'today', label: 'Today Only' },
                    { value: 'last_7_days', label: 'Last 7 Days' },
                    { value: 'this_month', label: 'This Month' },
                    { value: 'last_30_days', label: 'Last 30 Days' },
                    { value: 'this_year', label: 'This Year' },
                    { value: 'custom', label: 'Custom Date Range...' },
                  ]}
                />
              </div>

              {/* Custom Date Inputs inside Modal */}
              {exportDatePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] font-semibold text-muted block mb-0.5">From Date</label>
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      className="w-full h-8 px-2 bg-background border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted block mb-0.5">To Date</label>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      className="w-full h-8 px-2 bg-background border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteExportCsv}
                isLoading={isExporting}
                className="text-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Download CSV
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Feedback Message"
        message="Are you sure you want to permanently delete this user feedback message? This action cannot be undone."
        confirmText="Delete Message"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Feedback;
