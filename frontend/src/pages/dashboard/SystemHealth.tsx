import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Activity, Database, Server, HardDrive, Terminal, RefreshCw, Trash2, FileText, Layers, Users, BookOpen, Cpu } from 'lucide-react';
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
    <div className="space-y-8 font-sans">
      <DashboardHeader 
        title="System Health & Diagnostics" 
        description="Real-time telemetric monitoring of core backend services, database storage, and runtime event streams."
      />

      {/* Analog/Techy Status Bar Header */}
      <div className="bg-card border border-border p-3 flex flex-wrap items-center justify-between text-xs font-mono text-muted gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-primary uppercase tracking-widest text-[11px]">SYS.HEALTH // TELEMETRY OK</span>
        </div>
        <div className="flex items-center gap-6 text-[11px]">
          <span>SERVER: <strong className="text-primary font-mono">ONLINE</strong></span>
          <span>LAST PING: <strong className="text-primary font-mono">{new Date(health?.timestamp || '').toLocaleTimeString()}</strong></span>
          <button 
            onClick={fetchHealth} 
            disabled={loading}
            className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors uppercase tracking-wider font-semibold"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">[ API.CORE ]</span>
            <Activity className={`h-5 w-5 ${health?.status === 'Operational' ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-primary">{health?.status}</div>
            <div className="text-[11px] font-mono text-muted mt-1 flex items-center gap-1">
              <Cpu className="h-3 w-3 text-muted/70" /> Laravel v{health?.laravel_version}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/40"></div>
        </div>

        <div className="bg-card border border-border p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">[ DB.ENGINE ]</span>
            <Database className={`h-5 w-5 ${health?.database === 'Connected' ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-primary">{health?.database}</div>
            <div className="text-[11px] font-mono text-muted mt-1">
              Footprint: <strong className="text-primary font-mono">{formatBytes(health?.database_size_bytes || 0)}</strong>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500/40"></div>
        </div>

        <div className="bg-card border border-border p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">[ RUNTIME.ENV ]</span>
            <Server className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-primary">PHP {health?.php_version}</div>
            <div className="text-[11px] font-mono text-muted mt-1">
              Disk Driver: <strong className="text-primary font-mono">{health?.storage_disk.toUpperCase()}</strong>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500/40"></div>
        </div>

        <div className="bg-card border border-border p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">[ DISK.VOL ]</span>
            <HardDrive className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-primary">{health?.disk.percentage}% USED</div>
            <div className="text-[11px] font-mono text-muted mt-1">
              {formatBytes(health?.disk.used_bytes || 0)} / {formatBytes(health?.disk.total_bytes || 0)}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500/40"></div>
        </div>
      </div>

      {/* Storage Utilization & DB Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analog Storage Gauge */}
        <div className="bg-card border border-border p-6 lg:col-span-1 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-accent" />
              [ STORAGE_UTILIZATION ]
            </h3>
            <span className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded uppercase font-semibold">
              LOCAL DISK
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted">Capacity Used</span>
              <span className="text-primary font-bold">{formatBytes(health?.disk.used_bytes || 0)} ({health?.disk.percentage}%)</span>
            </div>
            
            {/* Segmented Analog Gauge Bar */}
            <div className="w-full bg-border/40 p-1 border border-border/80">
              <div 
                className={`h-3 transition-all duration-500 ${
                  (health?.disk.percentage || 0) > 85 
                    ? 'bg-red-500' 
                    : (health?.disk.percentage || 0) > 65 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`} 
                style={{ width: `${health?.disk.percentage || 0}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted pt-2 border-t border-border/40">
              <div>FREE: <strong className="text-primary font-mono">{formatBytes(health?.disk.free_bytes || 0)}</strong></div>
              <div className="text-right">TOTAL: <strong className="text-primary font-mono">{formatBytes(health?.disk.total_bytes || 0)}</strong></div>
            </div>
          </div>
        </div>

        {/* Database Record Summary Bento */}
        <div className="bg-card border border-border p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              [ DATABASE_RECORD_SUMMARY ]
            </h3>
            <span className="text-[10px] font-mono text-muted">LIVE SYNCED</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-border p-4 text-center hover:border-primary/40 transition-colors">
              <FileText className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold font-mono text-primary">{health?.counts?.articles || 0}</div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Articles</div>
            </div>

            <div className="bg-surface border border-border p-4 text-center hover:border-primary/40 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold font-mono text-primary">{health?.counts?.journals || 0}</div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Journals</div>
            </div>

            <div className="bg-surface border border-border p-4 text-center hover:border-primary/40 transition-colors">
              <Users className="h-5 w-5 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold font-mono text-primary">{health?.counts?.users || 0}</div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Users</div>
            </div>

            <div className="bg-surface border border-border p-4 text-center hover:border-primary/40 transition-colors">
              <Layers className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold font-mono text-primary">{health?.counts?.activity_logs || 0}</div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest mt-1">Audit Logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Stream Console */}
      <div className="bg-card border border-border overflow-hidden shadow-md">
        <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest">[ EVENT_LOG_CONSOLE ]</span>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">laravel.log</span>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Search log stream..." 
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs px-3 py-1 font-mono focus:outline-none focus:border-accent w-40 sm:w-56"
            />
            <Button size="sm" variant="ghost" onClick={fetchHealth} disabled={loading} className="h-8 text-zinc-300 hover:text-white">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearLogs} disabled={clearing} className="h-8 text-red-400 border-red-500/40 hover:bg-red-500/10">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-300 h-96 overflow-y-auto space-y-1 select-text border-t border-zinc-900">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              const isError = log.includes('.ERROR') || log.includes('Exception') || log.includes('Fatal');
              const isWarning = log.includes('.WARNING');
              const isInfo = log.includes('.INFO');

              return (
                <div 
                  key={index} 
                  className={`py-1 px-2 font-mono whitespace-pre-wrap break-all border-l-2 transition-colors ${
                    isError ? 'border-red-500 bg-red-950/30 text-red-300' : isWarning ? 'border-amber-500 bg-amber-950/20 text-amber-300' : isInfo ? 'border-blue-500 bg-blue-950/20 text-blue-300' : 'border-transparent text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-600 select-none mr-3 font-mono">{String(index + 1).padStart(3, '0')}</span>
                  {log}
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono italic">
              {logFilter ? '> No log events match query.' : '> Event stream is currently empty.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
