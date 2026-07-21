import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Activity, Database, Server, HardDrive, Terminal, RefreshCw, Trash2, FileText, Layers, Users, BookOpen } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

interface DiskData {
  total_bytes: number;
  free_bytes: number;
  used_bytes: number;
  percentage: number;
}

interface RecordCounts {
  articles: number;
  journals: number;
  users: number;
  activity_logs: number;
}

interface HealthData {
  status: string;
  php_version: string;
  laravel_version: string;
  database: string;
  database_size_bytes: number;
  counts: RecordCounts;
  storage_disk: string;
  disk: DiskData;
  recent_logs: string[];
  timestamp: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/health');
      setHealth(res.data);
    } catch (error) {
      console.error('Failed to fetch system health', error);
      toast.error('Failed to load system health metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear system logs?')) return;
    try {
      setClearing(true);
      await api.delete('/system/logs');
      toast.success('Logs cleared successfully');
      fetchHealth();
    } catch (error) {
      toast.error('Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredLogs = (health?.recent_logs || []).filter(line => 
    line.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="System Health & Diagnostics" 
        description="Real-time monitoring of application servers, database metrics, and system logs."
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">API Status</span>
            <Activity className={`h-5 w-5 ${health?.status === 'Operational' ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{health?.status}</div>
            <div className="text-xs text-muted mt-1">Laravel v{health?.laravel_version}</div>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Database Status</span>
            <Database className={`h-5 w-5 ${health?.database === 'Connected' ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{health?.database}</div>
            <div className="text-xs text-muted mt-1">DB Size: {formatBytes(health?.database_size_bytes || 0)}</div>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">PHP Environment</span>
            <Server className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">PHP {health?.php_version}</div>
            <div className="text-xs text-muted mt-1">Disk Strategy: {health?.storage_disk.toUpperCase()}</div>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Disk Usage</span>
            <HardDrive className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{health?.disk.percentage}%</div>
            <div className="text-xs text-muted mt-1">
              {formatBytes(health?.disk.used_bytes || 0)} / {formatBytes(health?.disk.total_bytes || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Disk Space & Database Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Bar Card */}
        <div className="bg-surface border border-border p-6 lg:col-span-1 space-y-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent" />
            Storage Utilization
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted">Used Space</span>
              <span className="text-primary font-mono">{formatBytes(health?.disk.used_bytes || 0)} ({health?.disk.percentage}%)</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  (health?.disk.percentage || 0) > 85 ? 'bg-red-500' : (health?.disk.percentage || 0) > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} 
                style={{ width: `${health?.disk.percentage || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-muted font-mono pt-1">
              <span>Free: {formatBytes(health?.disk.free_bytes || 0)}</span>
              <span>Total: {formatBytes(health?.disk.total_bytes || 0)}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Storage Driver</span>
              <span className="font-mono text-primary">{health?.storage_disk}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Check</span>
              <span className="font-mono text-primary">{new Date(health?.timestamp || '').toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Database Record Counts Bento */}
        <div className="bg-surface border border-border p-6 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            Database Record Summary
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-zinc-900/40 border border-border/60 p-4 rounded-lg text-center">
              <FileText className="h-5 w-5 text-emerald-400 mx-auto mb-2 opacity-80" />
              <div className="text-xl font-bold text-primary font-mono">{health?.counts?.articles || 0}</div>
              <div className="text-[11px] text-muted uppercase tracking-wider mt-1">Articles</div>
            </div>

            <div className="bg-zinc-900/40 border border-border/60 p-4 rounded-lg text-center">
              <BookOpen className="h-5 w-5 text-blue-400 mx-auto mb-2 opacity-80" />
              <div className="text-xl font-bold text-primary font-mono">{health?.counts?.journals || 0}</div>
              <div className="text-[11px] text-muted uppercase tracking-wider mt-1">Journals</div>
            </div>

            <div className="bg-zinc-900/40 border border-border/60 p-4 rounded-lg text-center">
              <Users className="h-5 w-5 text-purple-400 mx-auto mb-2 opacity-80" />
              <div className="text-xl font-bold text-primary font-mono">{health?.counts?.users || 0}</div>
              <div className="text-[11px] text-muted uppercase tracking-wider mt-1">Registered Users</div>
            </div>

            <div className="bg-zinc-900/40 border border-border/60 p-4 rounded-lg text-center">
              <Layers className="h-5 w-5 text-amber-400 mx-auto mb-2 opacity-80" />
              <div className="text-xl font-bold text-primary font-mono">{health?.counts?.activity_logs || 0}</div>
              <div className="text-[11px] text-muted uppercase tracking-wider mt-1">Audit Logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Stream Viewer */}
      <div className="bg-surface border border-border overflow-hidden">
        <div className="bg-zinc-900 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Laravel Application Log Stream</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">storage/logs/laravel.log</span>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Filter logs..." 
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs px-3 py-1 rounded focus:outline-none focus:border-accent w-36 sm:w-48 font-mono"
            />
            <Button size="sm" variant="ghost" onClick={fetchHealth} disabled={loading} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearLogs} disabled={clearing} className="h-8 text-red-400 hover:bg-red-500/10 border-red-500/30">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400 h-96 overflow-y-auto space-y-1 select-text">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              const isError = log.includes('.ERROR') || log.includes('Exception') || log.includes('Fatal');
              const isWarning = log.includes('.WARNING');
              const isInfo = log.includes('.INFO');

              return (
                <div 
                  key={index} 
                  className={`py-0.5 border-b border-zinc-900/50 whitespace-pre-wrap break-all ${
                    isError ? 'text-red-400 bg-red-950/20' : isWarning ? 'text-amber-300' : isInfo ? 'text-blue-300' : 'text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-600 select-none mr-3">{String(index + 1).padStart(3, '0')}</span>
                  {log}
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
              {logFilter ? 'No logs matching filter criteria.' : 'System logs are currently empty.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
