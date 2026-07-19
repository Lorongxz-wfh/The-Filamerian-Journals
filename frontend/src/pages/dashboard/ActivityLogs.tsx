import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import DashboardHeader from '@/components/ui/DashboardHeader';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/logs?page=${page}`);
      setLogs(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <DashboardHeader title="System Activity Logs">
        <Button
          onClick={() => fetchLogs(currentPage)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </DashboardHeader>

      <div className="bg-surface border border-border">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No logs recorded"
            description="There is no activity recorded in the system yet."
          />
        ) : (
          <>
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
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-primary font-medium whitespace-nowrap">
                      {log.user ? log.user.name : 'System'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-secondary/10 text-secondary border border-secondary/20">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted/90 w-full">
                      {log.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex justify-between items-center bg-background">
                <span className="text-sm text-muted">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => fetchLogs(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => fetchLogs(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
