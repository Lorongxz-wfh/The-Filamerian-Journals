import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Trash2, Archive, ArchiveRestore, ArrowLeft, 
  Download, Table as TableIcon, Mail, ArrowUp, ArrowDown, 
  Eye
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

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'inbox' | 'table'>('inbox');

  // Data & Pagination
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Export & Delete state
  const [isExporting, setIsExporting] = useState(false);
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
      const isArchived = activeTab === 'archived';
      const params = new URLSearchParams({
        archived: isArchived ? 'true' : 'false',
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
  }, [page, activeTab, debouncedSearch, categoryFilter, datePreset, fromDate, toDate, sortField, sortDir]);

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
      setFeedbacks(feedbacks.filter(f => f.id !== id));
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

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const isArchived = activeTab === 'archived';
      const params = new URLSearchParams({
        archived: isArchived ? 'true' : 'false',
        per_page: 'all',
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
      const exportList: FeedbackItem[] = res.data.data || [];

      if (exportList.length === 0) {
        toast.info('No feedback records found to export.');
        return;
      }

      const headers = ['ID', 'Date Submitted', 'Category', 'Sender Name', 'Sender Email', 'Subject', 'Message', 'Status'];
      const rows = exportList.map(item => [
        item.id,
        new Date(item.created_at).toISOString().split('T')[0],
        `"${(item.category || 'General').replace(/"/g, '""')}"`,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.email || '').replace(/"/g, '""')}"`,
        `"${(item.subject || '').replace(/"/g, '""')}"`,
        `"${(item.message || '').replace(/"/g, '""')}"`,
        item.is_archived ? 'Archived' : (item.is_read ? 'Read' : 'Unread')
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FCU_Journals_Feedback_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportList.length} feedback records to CSV.`);
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
    <div className="space-y-4 sm:space-y-6 font-sans relative">
      <DashboardHeader 
        title="User Feedback & Inquiries"
        helpText="Review inquiries, research correspondence, suggestions, and submissions sent through the public repository."
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Active vs Archived tabs */}
          <div className="flex items-center gap-0.5 border border-border bg-surface p-0.5">
            <button
              onClick={() => { setActiveTab('active'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-primary hover:bg-background'
              }`}
            >
              Active Feedback
            </button>
            <button
              onClick={() => { setActiveTab('archived'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-primary hover:bg-background'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived
            </button>
          </div>

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
              <span className="hidden md:inline">Inbox</span>
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
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={isExporting}
            className="text-xs flex items-center gap-1.5 border-border hover:bg-background"
            title="Download CSV report of current filtered feedback"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </DashboardHeader>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 bg-surface border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search sender, email, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-44">
            <Select
              className="py-1.5 h-9 text-xs"
              value={categoryFilter}
              onChange={(val) => { setCategoryFilter(val as string); setPage(1); }}
              options={categoryOptions}
            />
          </div>

          {/* Date Range Preset Filter */}
          <div className="w-full sm:w-40">
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
                className="h-9 px-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary"
                title="From Date"
              />
              <span className="text-xs text-muted">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-9 px-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary"
                title="To Date"
              />
            </div>
          )}
        </div>

        <div className="text-xs text-muted self-end md:self-center shrink-0">
          Showing <span className="font-semibold text-primary">{feedbacks.length}</span> of <span className="font-semibold text-primary">{total}</span>
        </div>
      </div>

      {/* VIEW MODE 1: MASTER-DETAIL INBOX VIEW */}
      {viewMode === 'inbox' && (
        <div className="relative border border-border bg-surface min-h-[480px] sm:min-h-[520px] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Message List */}
            <div className="lg:col-span-5 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-border max-h-[540px] sm:max-h-[620px]">
              <div className="divide-y divide-border overflow-y-auto flex-grow custom-scrollbar">
                {loading ? (
                  <MessageListSkeleton rows={6} />
                ) : feedbacks.length === 0 ? (
                  <div className="p-8 text-center text-muted text-xs sm:text-[13px]">
                    {activeTab === 'archived' ? 'No archived feedback messages found.' : 'No feedback messages match your criteria.'}
                  </div>
                ) : (
                  feedbacks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full text-left px-3.5 sm:px-5 py-3 sm:py-4 transition-colors cursor-pointer ${
                        selected === item.id
                          ? 'bg-primary/5 border-l-3 border-l-primary'
                          : 'hover:bg-background border-l-3 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs sm:text-[13px] truncate ${!item.is_read ? 'font-bold text-primary' : 'font-medium text-primary/70'}`}>
                          {item.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-muted shrink-0 ml-2 sm:ml-3">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-[11px] sm:text-[12px] truncate ${!item.is_read ? 'text-primary font-semibold' : 'text-muted'}`}>
                        {item.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                          {item.category || 'General'}
                        </span>
                        {!item.is_read && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600">
                            • Unread
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              {lastPage > 1 && (
                <div className="border-t border-border p-3 sm:p-4 bg-background/50 flex items-center justify-between">
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
            <div className="hidden lg:flex lg:col-span-7 p-6 flex-col h-full min-h-[400px]">
              {selectedItem ? (
                <div className="space-y-6 flex-grow flex flex-col">
                  <div className="border-b border-border pb-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
                          {selectedItem.category || 'General'}
                        </span>
                        <h2 className="text-[16px] font-bold text-primary leading-snug">{selectedItem.subject}</h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleArchive(selectedItem.id, activeTab === 'archived')}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-border text-muted hover:text-primary hover:bg-background transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={activeTab === 'archived' ? 'Restore to Active Inbox' : 'Move to Archive'}
                        >
                          {activeTab === 'archived' ? (
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
                            className="h-8 w-8 shrink-0 flex items-center justify-center text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-colors border border-border cursor-pointer"
                            title="Permanently Delete Message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[12px] text-muted">
                      <span>From: <span className="font-semibold text-primary">{selectedItem.name}</span></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Email: <a href={`mailto:${selectedItem.email}`} className="text-primary hover:underline font-mono">{selectedItem.email}</a></span>
                      <span className="hidden sm:inline">•</span>
                      <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-primary/85 leading-relaxed whitespace-pre-wrap flex-grow bg-background p-4 border border-border font-sans">
                    {selectedItem.message}
                  </p>
                  <div className="pt-3 border-t border-border mt-auto flex items-center justify-between text-xs text-muted">
                    <span>Click the email link above to open your mail client.</span>
                    <a
                      href={`mailto:${selectedItem.email}?subject=Re: ${encodeURIComponent(selectedItem.subject)}`}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" /> Reply to Sender
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 flex-grow">
                  <MessageSquare className="h-10 w-10 text-muted/20 mb-3" />
                  <p className="text-[13px] text-muted">Select a message from the list to view full details</p>
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
                <div className="p-3.5 border-b border-border bg-background flex items-center justify-between gap-2 shrink-0">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-secondary transition-colors cursor-pointer py-1 px-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to List</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleArchive(selectedItem.id, activeTab === 'archived')}
                      className="px-2.5 py-1 text-xs font-semibold border border-border text-muted hover:text-primary hover:bg-background transition-colors flex items-center gap-1"
                    >
                      {activeTab === 'archived' ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      <span>{activeTab === 'archived' ? 'Restore' : 'Archive'}</span>
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

                <div className="p-4 overflow-y-auto flex-grow space-y-4">
                  <div className="border-b border-border pb-3.5 space-y-2">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {selectedItem.category || 'General'}
                    </span>
                    <h2 className="text-base font-bold text-primary leading-snug">
                      {selectedItem.subject}
                    </h2>
                    <div className="flex flex-col gap-1 text-xs text-muted pt-1">
                      <div>From: <span className="font-semibold text-primary">{selectedItem.name}</span></div>
                      <div>Email: <a href={`mailto:${selectedItem.email}`} className="text-primary underline font-mono text-[11px]">{selectedItem.email}</a></div>
                      <div className="text-[11px] text-muted/80">{new Date(selectedItem.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] text-primary/85 leading-relaxed whitespace-pre-wrap bg-background p-3.5 border border-border">
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
          <Table containerClassName="max-h-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead isSorted={sortField === 'created_at'} className="cursor-pointer transition-colors w-[130px]" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">Date {getSortIcon('created_at')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'name'} className="cursor-pointer transition-colors w-[160px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Sender {getSortIcon('name')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'category'} className="cursor-pointer transition-colors w-[140px] hidden sm:table-cell" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
                </TableHead>
                <TableHead isSorted={sortField === 'subject'} className="cursor-pointer transition-colors" onClick={() => handleSort('subject')}>
                  <div className="flex items-center gap-1">Subject & Message {getSortIcon('subject')}</div>
                </TableHead>
                <TableHead className="w-[100px] text-center hidden md:table-cell">Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
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
                      {!item.is_read ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0 font-bold">
                          Unread
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold text-muted">
                          Read
                        </Badge>
                      )}
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
                          onClick={() => handleToggleArchive(item.id, activeTab === 'archived')}
                          className="p-1 text-muted hover:text-primary hover:bg-background border border-border"
                          title={activeTab === 'archived' ? 'Restore to Active' : 'Archive'}
                        >
                          {activeTab === 'archived' ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
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

          {lastPage > 1 && (
            <div className="border-t border-border p-3 sm:p-4 bg-background/50 flex items-center justify-between">
              <span className="text-xs text-muted">
                Page {page} of {lastPage}
              </span>
              <Pagination
                currentPage={page}
                lastPage={lastPage}
                onPageChange={setPage}
                className="mt-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Quick View Modal (For Table Mode) */}
      {quickViewItem && (
        <Modal
          isOpen={!!quickViewItem}
          onClose={() => setQuickViewItem(null)}
          title="Feedback Message Details"
          className="max-w-lg"
        >
          <div className="space-y-4 py-1">
            <div className="space-y-2 border-b border-border pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                  {quickViewItem.category || 'General'}
                </span>
                <span className="text-[11px] text-muted">
                  {new Date(quickViewItem.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-primary leading-snug">
                {quickViewItem.subject}
              </h3>
              <div className="text-xs text-muted flex flex-col gap-1">
                <div>Sender: <strong className="text-primary">{quickViewItem.name}</strong></div>
                <div>Email: <a href={`mailto:${quickViewItem.email}`} className="text-primary font-mono hover:underline">{quickViewItem.email}</a></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Message Content</label>
              <div className="p-3.5 bg-background border border-border text-xs sm:text-[13px] text-primary/85 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {quickViewItem.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleArchive(quickViewItem.id, activeTab === 'archived')}
                  className="text-xs"
                >
                  {activeTab === 'archived' ? 'Restore to Inbox' : 'Archive'}
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
