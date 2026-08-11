import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Filter, Calendar } from 'lucide-react';
import api from '@/services/api';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, DataTableFooter } from '@/components/ui/Table';
import { ActivityLogsTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import DashboardHeader from '@/components/ui/DashboardHeader';

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

  const renderActionBadge = (action: string) => {
    const act = action.toLowerCase();
    let badgeStyle = 'bg-slate-500/10 text-slate-700 border-slate-300/60';

    if (act.includes('login') || act.includes('logged in') || act.includes('approved')) {
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
    } else if (act.includes('fail') || act.includes('delete') || act.includes('remove')) {
      badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30';
    } else if (act.includes('create') || act.includes('add')) {
      badgeStyle = 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    } else if (act.includes('update') || act.includes('edit')) {
      badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 border text-[10px] font-bold tracking-wider uppercase font-mono whitespace-nowrap rounded-none ${badgeStyle}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-4 font-sans w-full">
      <DashboardHeader title="System Activity Logs">
        <Button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 text-xs font-mono"
          variant="outline"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </DashboardHeader>

      {/* Sleek, Compact Inline Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-2 w-48">
            <Filter className="h-3.5 w-3.5 text-muted shrink-0" />
            <div className="w-full">
              <Select
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(String(val));
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'login', label: 'Logins & Auth' },
                  { value: 'create', label: 'Created Items' },
                  { value: 'update', label: 'Updated Items' },
                  { value: 'delete', label: 'Deleted Items' },
                ]}
              />
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-2 w-44">
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
              className="text-xs font-mono text-muted hover:text-primary transition-colors underline ml-2"
            >
              Reset Filters
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
                <TableHead className="w-[180px] font-semibold">Date & Time</TableHead>
                <TableHead className="w-[160px] font-semibold">User</TableHead>
                <TableHead className="w-[150px] font-semibold">Action</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <ActivityLogsTableSkeleton rows={6} />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
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
                  <TableRow key={log.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="text-xs font-mono text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary whitespace-nowrap">
                      {log.user ? log.user.name : 'System'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-xs text-muted/90 leading-relaxed font-sans">
                      {log.description}
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
    </div>
  );
};

export default ActivityLogs;
