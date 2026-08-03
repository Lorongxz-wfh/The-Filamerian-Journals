import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { FileText, BookOpen, Users } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';

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

  const [errors, setErrors] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<number | null>(null);

  useEffect(() => {
    fetchHealth();
    fetchErrors();
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

  const fetchErrors = async () => {
    try {
      setLoadingErrors(true);
      const res = await api.get('/system/errors');
      setErrors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch system error logs', err);
    } finally {
      setLoadingErrors(false);
    }
  };

  const toggleResolveError = async (id: number) => {
    try {
      await api.put(`/system/errors/${id}/resolve`);
      fetchErrors();
    } catch (err) {
      console.error('Failed to toggle error status', err);
    }
  };

  const handleClearResolvedErrors = async () => {
    try {
      await api.delete('/system/errors/clear');
      fetchErrors();
    } catch (err) {
      console.error('Failed to clear resolved logs', err);
    }
  };

  const dbStatusText = typeof health?.database === 'object' ? health.database?.status : (typeof health?.database === 'string' ? health.database : 'Disconnected');
  const dbDriverText = typeof health?.database === 'object' ? health.database?.driver : 'MySQL';
  const dbSizeBytes = typeof health?.database === 'object' ? (health.database?.size_bytes || 0) : 0;

  const storageTypeText = typeof health?.storage === 'object' ? health.storage?.type : (health?.storage_disk === 'r2' ? 'Cloudflare R2' : 'Local Storage');
  const storageDiskText = typeof health?.storage === 'object' ? health.storage?.disk : (health?.storage_disk || 'local');
  const storageSizeBytes = typeof health?.storage === 'object' ? (health.storage?.size_bytes || 0) : 0;

  return (
    <div className="space-y-8 font-sans w-full">
      <DashboardHeader title="System Health" />

      <div className="space-y-8">
        {/* Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Application</span>
              {loading && !health ? (
                <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {health?.status || 'Operational'}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
                {loading && !health ? (
                  <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                ) : (
                  health?.laravel_version ? `Laravel ${health.laravel_version}` : 'Laravel 12'
                )}
              </p>
              <p className="text-xs text-muted font-mono">{health?.php_version ? `PHP ${health.php_version}` : ''}</p>
            </div>
          </div>

          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Database ({loading && !health ? '...' : dbDriverText.toUpperCase()})
              </span>
              {loading && !health ? (
                <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {dbStatusText}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
                {loading && !health ? (
                  <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                ) : (
                  formatBytes(dbSizeBytes)
                )}
              </p>
              <p className="text-xs text-muted font-mono">Active Connection</p>
            </div>
          </div>

          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Storage Provider</span>
              {loading && !health ? (
                <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {storageDiskText.toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
                {loading && !health ? (
                  <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                ) : (
                  formatBytes(storageSizeBytes)
                )}
              </p>
              <p className="text-xs text-muted font-mono">{storageTypeText}</p>
            </div>
          </div>
        </div>

        {/* Database Entity Metrics */}
        <div className="bg-surface border border-border p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Database Entity Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-surface p-4 border border-border/50">
              <div className="p-3 bg-emerald-500/10 text-emerald-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Articles</div>
                <div className="text-xl font-extrabold text-primary font-mono min-h-[28px] flex items-center">
                  {loading && !health ? (
                    <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                  ) : (
                    health?.counts.articles ?? 0
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-surface p-4 border border-border/50">
              <div className="p-3 bg-blue-500/10 text-blue-500">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Journals</div>
                <div className="text-xl font-extrabold text-primary font-mono min-h-[28px] flex items-center">
                  {loading && !health ? (
                    <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                  ) : (
                    health?.counts.journals ?? 0
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-surface p-4 border border-border/50">
              <div className="p-3 bg-purple-500/10 text-purple-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Registered Users</div>
                <div className="text-xl font-extrabold text-primary font-mono min-h-[28px] flex items-center">
                  {loading && !health ? (
                    <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                  ) : (
                    health?.counts.users ?? 0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* System Error Tracker & QA Logs */}
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">System Error Tracker & QA Exception Logs</h2>
                <span className="text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5">
                  {errors.filter(e => !e.is_resolved).length} Unresolved
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchErrors}
                  className="px-2.5 py-1 text-xs border border-border hover:bg-background transition-colors"
                >
                  Refresh Logs
                </button>
                <button
                  onClick={handleClearResolvedErrors}
                  className="px-2.5 py-1 text-xs border border-border text-muted hover:text-primary hover:bg-background transition-colors"
                >
                  Clear Resolved
                </button>
              </div>
            </div>

            {loadingErrors ? (
              <div className="py-8 flex items-center justify-center gap-2 text-muted text-[13px]">
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                Fetching exception logs...
              </div>
            ) : errors.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-600">No Exception Logged</p>
                <p className="text-[11px] text-muted">System is running cleanly without recorded errors.</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden border border-border">
                {errors.map((err) => (
                  <div key={err.id} className="p-3 text-[12px] space-y-2 hover:bg-background/50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 shrink-0 ${
                          err.level === 'client_error' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {err.level}
                        </span>
                        <span className="font-mono text-xs font-semibold text-primary truncate">
                          {err.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-muted">
                          {new Date(err.created_at).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => setExpandedErrorId(expandedErrorId === err.id ? null : err.id)}
                          className="text-[11px] text-primary hover:underline"
                        >
                          {expandedErrorId === err.id ? 'Hide Stack Trace' : 'View Stack Trace'}
                        </button>
                        <button
                          onClick={() => toggleResolveError(err.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            err.is_resolved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-background border border-border text-muted hover:text-primary'
                          }`}
                        >
                          {err.is_resolved ? 'Resolved' : 'Mark Resolved'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-muted">
                      <span>Path: {err.path || '-'}</span>
                      {err.file && <span>File: {err.file}:{err.line}</span>}
                      {err.user && <span>User: {err.user.name} ({err.user.email})</span>}
                    </div>

                    {expandedErrorId === err.id && err.stack_trace && (
                      <pre className="p-3 bg-black/90 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-48 border border-border">
                        {err.stack_trace}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default SystemHealth;
