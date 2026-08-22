import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Filter, Calendar, Eye, Copy, Check, Clock, User as UserIcon, Layers, FileText, Activity, Download } from 'lucide-react';
import api from '@/services/api';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, DataTableFooter } from '@/components/ui/Table';
import { ActivityLogsTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';

interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  description: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email?: string;
  } | null;
}

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (periodFilter !== 'all') params.append('period', periodFilter);

      const res = await api.get(`/dashboard/logs?${params.toString()}`);
      setLogs(res.data.data);
      setLastPage(res.data.last_page || 1);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, periodFilter]);

  const copyLogDetails = (log: ActivityLog) => {
    const payload = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Log details copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['ID', 'User', 'Email', 'Action', 'Target Type', 'Description', 'Timestamp'];
    const rows = logs.map(l => [
      l.id,
      `"${l.user?.name || 'System / Guest'}"`,
      `"${l.user?.email || 'N/A'}"`,
      `"${l.action || ''}"`,
      `"${getCleanTargetType(l.target_type)}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Activity logs exported successfully');
  };

  const getCleanTargetType = (targetType: string | null) => {
    if (!targetType) return 'System Setting / Global';
    const parts = targetType.split('\\');
    return parts[parts.length - 1] || targetType;
  };

  const renderActionBadge = (action: string) => {
    const act = action.toLowerCase();
    let badgeStyle = 'bg-slate-500/10 text-slate-700 border-slate-300/60';

    if (act.includes('login') || act.includes('logged in') || act.includes('approved')) {
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
    } else if (act.includes('fail') || act.includes('delete') || act.includes('remove') || act.includes('purge')) {
      badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30';
    } else if (act.includes('create') || act.includes('add') || act.includes('import')) {
      badgeStyle = 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    } else if (act.includes('update') || act.includes('edit') || act.includes('reorder')) {
      badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 border text-[10px] font-bold tracking-wider uppercase font-mono whitespace-nowrap rounded-none ${badgeStyle}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 font-sans w-full">
      <DashboardHeader 
        title="Activity Logs"
        helpText="Audit log trail recording administrative events, content publications, metadata updates, user status changes, and system activities."
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono h-9 px-2.5 sm:px-4 cursor-pointer"
            variant="outline"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            onClick={() => fetchLogs()}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono h-9 px-2.5 sm:px-4 cursor-pointer"
            variant="outline"
            title="Refresh Logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </DashboardHeader>

      {/* Sleek, Compact Inline Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-44 xs:w-52">
            <Filter className="h-3.5 w-3.5 text-muted shrink-0" />
            <div className="w-full">
              <Select
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(String(val));
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Activities' },
                  { value: 'publications', label: 'Content & Publications' },
                  { value: 'users', label: 'User Governance' },
                  { value: 'trash', label: 'Trash & Restores' },
                  { value: 'system', label: 'System & Config' },
                  { value: 'login', label: 'Logins & Auth' },
                ]}
              />
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-32 xs:w-40">
            <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
            <div className="w-full">
              <Select
                value={periodFilter}
                onChange={(val) => {
                  setPeriodFilter(String(val));
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                ]}
              />
            </div>
          </div>

          {/* Clear Filters Action */}
          {(actionFilter !== 'all' || periodFilter !== 'all') && (
            <button
              onClick={() => {
                setActionFilter('all');
                setPeriodFilter('all');
                setPage(1);
              }}
              className="text-xs font-mono text-muted hover:text-primary transition-colors underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Card Container */}
      <div className="border border-border bg-surface flex flex-col">
        <div className="max-h-[520px] overflow-y-auto overflow-x-auto relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px] sm:w-[180px] font-semibold">Date & Time</TableHead>
                <TableHead className="w-[160px] font-semibold hidden sm:table-cell">User</TableHead>
                <TableHead className="w-[110px] sm:w-[150px] font-semibold">Action</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="w-10 sm:w-[70px] text-right font-semibold"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <ActivityLogsTableSkeleton rows={6} />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <EmptyState
                      icon={ShieldAlert}
                      title="No activity logs found"
                      description="There are no system logs matching your selected filters."
                      className="bg-transparent border-0 py-8"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-primary/5 cursor-pointer transition-colors group"
                  >
                    <TableCell className="text-[11px] sm:text-xs font-mono text-muted py-2.5 sm:py-3.5">
                      <div className="flex flex-col min-w-0">
                        <span className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-muted/70">
                          {new Date(log.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {/* Mobile user subtitle */}
                        <span className="sm:hidden text-[10px] font-medium text-primary/80 mt-0.5 truncate">
                          {log.user ? log.user.name : 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary whitespace-nowrap hidden sm:table-cell">
                      {log.user ? log.user.name : 'System'}
                    </TableCell>
                    <TableCell className="py-2.5 sm:py-3.5">
                      {renderActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-[11px] sm:text-xs text-muted/90 leading-relaxed font-sans py-2.5 sm:py-3.5">
                      <span className="line-clamp-2">{log.description}</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 sm:py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        title="View Log Details"
                        className="inline-flex items-center justify-center h-7 w-7 text-muted hover:text-primary hover:bg-black/5 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataTableFooter
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
          showingText={`Showing ${total > 0 ? Math.min((page - 1) * 15 + 1, total) : 0}–${Math.min(page * 15, total)} of ${total} log${total !== 1 ? 's' : ''}`}
          loading={loading}
        />
      </div>

      {/* Activity Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Activity Log Details"
          className="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header Badge & ID Banner */}
            <div className="flex items-center justify-between p-3.5 bg-background border border-border">
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-secondary" />
                <span className="text-xs font-mono font-bold text-primary">
                  LOG ID #{selectedLog.id}
                </span>
              </div>
              {renderActionBadge(selectedLog.action)}
            </div>

            {/* Description Card */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Activity Summary & Updates Made
              </span>
              <div className="p-3.5 bg-background border border-border text-[13px] font-sans text-primary leading-relaxed font-medium">
                {selectedLog.description}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* User / Performer */}
              <div className="p-3 bg-background border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> Initiated By
                </span>
                <p className="text-xs font-semibold text-primary">
                  {selectedLog.user ? selectedLog.user.name : 'System Automated Process'}
                </p>
                {selectedLog.user?.email && (
                  <p className="text-[11px] font-mono text-muted">
                    {selectedLog.user.email}
                  </p>
                )}
                <span className="text-[10px] font-mono text-muted/70 block">
                  {selectedLog.user_id ? `User ID: #${selectedLog.user_id}` : 'Internal Event'}
                </span>
              </div>

              {/* Timestamp */}
              <div className="p-3 bg-background border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Timestamp
                </span>
                <p className="text-xs font-mono font-semibold text-primary">
                  {new Date(selectedLog.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </p>
                <span className="text-[10px] font-mono text-muted/70 block">
                  ISO: {selectedLog.created_at}
                </span>
              </div>

              {/* Target Entity Type */}
              <div className="p-3 bg-background border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Target Entity
                </span>
                <p className="text-xs font-semibold text-primary">
                  {getCleanTargetType(selectedLog.target_type)}
                </p>
                <span className="text-[10px] font-mono text-muted/70 block truncate" title={selectedLog.target_type || ''}>
                  {selectedLog.target_type || 'Global Operation'}
                </span>
              </div>

              {/* Target ID */}
              <div className="p-3 bg-background border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Target Record ID
                </span>
                <p className="text-xs font-mono font-semibold text-primary">
                  {selectedLog.target_id ? `#${selectedLog.target_id}` : 'N/A (Non-relational)'}
                </p>
                <span className="text-[10px] font-mono text-muted/70 block">
                  {selectedLog.target_id ? 'Referenced Primary Key' : 'Configuration Change'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => copyLogDetails(selectedLog)}
                className="flex items-center gap-1.5 text-xs font-mono"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied JSON' : 'Copy Log JSON'}
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setSelectedLog(null)}
                className="text-xs uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActivityLogs;

