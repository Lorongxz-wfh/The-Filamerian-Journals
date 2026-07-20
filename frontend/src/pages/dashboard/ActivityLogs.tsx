import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';

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
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (debouncedFilter) params.append('search', debouncedFilter);

      const res = await api.get(`/dashboard/logs?${params.toString()}`);
      setLogs(res.data.data);
      setLastPage(res.data.last_page || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, debouncedFilter]);

  return (
    <div className="space-y-8">
      <DashboardHeader title="System Activity Logs">
        <Button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </DashboardHeader>

      <div className="flex justify-end">
        <SearchInput
          placeholder="Search logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRowSkeleton columns={4} rows={5} />
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <EmptyState
                  icon={ShieldAlert}
                  title="No logs found"
                  description="There are no activity logs matching your search."
                  className="bg-transparent border-0"
                />
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-primary font-medium whitespace-nowrap">
                  {log.user ? log.user.name : 'System'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted/90 w-full">
                  {log.description}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {!loading && lastPage > 1 && (
        <Pagination
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default ActivityLogs;
