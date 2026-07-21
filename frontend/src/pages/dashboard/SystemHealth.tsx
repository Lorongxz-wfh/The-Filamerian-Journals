import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { RefreshCw, FileText, BookOpen, Users } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { Skeleton } from '@/components/ui/Skeleton';

interface RecordCounts {
  articles: number;
  journals: number;
  users: number;
}

interface DatabaseData {
  status: string;
  driver: string;
  type: string;
  host: string;
  size_bytes: number;
}

interface StorageData {
  disk: string;
  type: string;
  bucket: string;
  size_bytes: number;
}

interface HealthData {
  status: string;
  database: DatabaseData;
  storage: StorageData;
  storage_disk?: string;
  counts: RecordCounts;
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
      setHealth({
        status: 'Offline',
        database: { status: 'Disconnected', driver: 'Unknown', type: 'Unknown', host: '', size_bytes: 0 },
        storage: { disk: 'local', type: 'Local Storage', bucket: '', size_bytes: 0 },
        counts: { articles: 0, journals: 0, users: 0 },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const dbStatusText = typeof health?.database === 'object' ? health.database?.status : (typeof health?.database === 'string' ? health.database : 'Disconnected');
  const dbDriverText = typeof health?.database === 'object' ? health.database?.driver : '';
  const dbTypeText = typeof health?.database === 'object' ? health.database?.type : '';
  const dbHostText = typeof health?.database === 'object' ? health.database?.host : '';
  const dbSizeBytes = typeof health?.database === 'object' ? (health.database?.size_bytes || 0) : 0;

  const storageTypeText = typeof health?.storage === 'object' ? health.storage?.type : (health?.storage_disk === 'r2' ? 'Cloudflare R2' : 'Local Storage');
  const storageDiskText = typeof health?.storage === 'object' ? health.storage?.disk : (health?.storage_disk || 'local');
  const storageBucketText = typeof health?.storage === 'object' ? health.storage?.bucket : '';
  const storageSizeBytes = typeof health?.storage === 'object' ? (health.storage?.size_bytes || 0) : 0;

  return (
    <div className="space-y-8 font-sans w-full">
      <DashboardHeader 
        title="System Status" 
      />

      {loading && !health ? (
        <div className="space-y-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
          <Skeleton className="h-[220px] w-full" />
        </div>
      ) : (
        <>
          {/* Main Connection Status Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* API / Backend Card */}
            <div className="bg-card border border-border p-6 flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Backend</span>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.status === 'Operational' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'Operational' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
              </div>
              <div>
                <div className="text-xl font-bold text-primary tracking-tight font-mono">{health?.status}</div>
                <div className="text-xs text-muted mt-2 font-mono uppercase tracking-wider">[ Backend Service Active ]</div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${health?.status === 'Operational' ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}></div>
            </div>

        {/* Database Card */}
        <div className="bg-card border border-border p-6 flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Database</span>
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatusText === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatusText === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-primary tracking-tight font-mono">
              {dbStatusText === 'Connected' ? `Connected (${formatBytes(dbSizeBytes)})` : dbStatusText}
            </div>
            <div className="text-[11px] text-muted mt-2 font-mono">
              {dbTypeText} {dbDriverText ? `(${dbDriverText})` : ''} {dbHostText ? `// ${dbHostText}` : ''}
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${dbStatusText === 'Connected' ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}></div>
        </div>

        {/* Storage Card */}
        <div className="bg-card border border-border p-6 flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Storage</span>
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${storageDiskText === 'r2' ? 'bg-amber-400' : 'bg-zinc-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${storageDiskText === 'r2' ? 'bg-amber-500' : 'bg-zinc-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-primary tracking-tight font-mono">
              {storageTypeText} ({formatBytes(storageSizeBytes)})
            </div>
            <div className="text-[11px] text-muted mt-2 font-mono truncate">
              {storageDiskText === 'r2' ? `Bucket: ${storageBucketText || 'Configured'}` : 'Local Server Drive'}
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${storageDiskText === 'r2' ? 'bg-amber-500/30' : 'bg-zinc-500/30'}`}></div>
        </div>
      </div>

      {/* Record Totals Bento */}
      <div className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Resource Totals</h3>
          <span className="text-xs font-mono text-muted">
            Last Synced: {new Date(health?.timestamp || '').toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 bg-surface p-4 border border-border/50 hover:border-primary/20 transition-colors">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-none">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Articles</div>
              <div className="text-xl font-extrabold text-primary font-mono">{health?.counts.articles}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface p-4 border border-border/50 hover:border-primary/20 transition-colors">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-none">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Journals</div>
              <div className="text-xl font-extrabold text-primary font-mono">{health?.counts.journals}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface p-4 border border-border/50 hover:border-primary/20 transition-colors">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-none">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Registered Users</div>
              <div className="text-xl font-extrabold text-primary font-mono">{health?.counts.users}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Refresh Action */}
      <div className="flex justify-end">
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-mono font-bold text-muted hover:text-primary transition-colors border border-border px-4 py-2 hover:bg-surface"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          [ REFRESH STATUS ]
        </button>
      </div>
        </>
      )}
    </div>
  );
};

export default SystemHealth;
