import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { RefreshCw, FileText, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
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
  backend_provider?: string;
  laravel_version?: string;
  php_version?: string;
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
      >
        <button
          onClick={async () => {
            if (!confirm('Seed sample journals, volumes, articles, and categories into database?')) return;
            try {
              toast.loading('Seeding database content...', { id: 'seed-db' });
              await api.post('/system/seed');
              toast.success('Database seeded successfully!', { id: 'seed-db' });
              fetchHealth();
            } catch (err: any) {
              toast.error('Failed to seed: ' + (err.response?.data?.message || err.message), { id: 'seed-db' });
            }
          }}
          className="px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Seed Sample Data
        </button>
      </DashboardHeader>

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
          {/* Status Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Status */}
            <div className="bg-surface border border-border p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">API Core Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  health?.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {health?.status || 'Unknown'}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary font-display">
                {health?.status === 'Operational' ? 'Healthy' : 'Issues Detected'}
              </div>
              <p className="text-[12px] text-muted font-mono">
                Framework: Laravel {health?.laravel_version || 'N/A'} (PHP {health?.php_version || 'N/A'})
              </p>
            </div>

            {/* Database Status */}
            <div className="bg-surface border border-border p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Database ({dbDriverText || 'SQL'})</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  dbStatusText === 'Connected' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {dbStatusText}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary font-display truncate">
                {dbHostText || dbTypeText || 'Active Connection'}
              </div>
              <p className="text-[12px] text-muted font-mono">
                Storage Used: {formatBytes(dbSizeBytes)}
              </p>
            </div>

            {/* Storage Provider */}
            <div className="bg-surface border border-border p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Media Storage</span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {storageDiskText?.toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary font-display truncate">
                {storageTypeText}
              </div>
              <p className="text-[12px] text-muted font-mono">
                {storageBucketText ? `Bucket: ${storageBucketText}` : `Stored Media: ${formatBytes(storageSizeBytes)}`}
              </p>
            </div>
          </div>

          {/* Database Metrics Grid */}
          <div className="bg-surface border border-border p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Database Entity Metrics</h3>
            
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
