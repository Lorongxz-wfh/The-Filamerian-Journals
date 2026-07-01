import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Activity, Database, Server, HardDrive } from 'lucide-react';

interface HealthData {
  status: string;
  php_version: string;
  database: string;
  storage_disk: string;
  timestamp: string;
}

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
        php_version: 'Unknown',
        database: 'Disconnected',
        storage_disk: 'Unknown',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'API Status',
      value: health?.status,
      icon: Activity,
      color: health?.status === 'Operational' ? 'text-emerald-500' : 'text-red-500',
    },
    {
      title: 'Database Connection',
      value: health?.database,
      icon: Database,
      color: health?.database === 'Connected' ? 'text-emerald-500' : 'text-red-500',
    },
    {
      title: 'PHP Version',
      value: health?.php_version,
      icon: Server,
      color: 'text-blue-500',
    },
    {
      title: 'Storage Strategy',
      value: health?.storage_disk.toUpperCase(),
      icon: HardDrive,
      color: health?.storage_disk === 'r2' ? 'text-amber-500' : 'text-zinc-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-primary">System Health</h1>
        <p className="text-muted text-sm mt-1">Real-time status of backend services and infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-surface border border-border p-5 flex flex-col items-center text-center">
            <card.icon className={`h-8 w-8 mb-4 ${card.color}`} strokeWidth={1.5} />
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">{card.title}</h3>
            <p className="text-lg font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border p-6 mt-8">
        <h3 className="text-sm font-semibold text-white mb-4">Diagnostic Information</h3>
        <div className="space-y-3 font-mono text-xs text-muted">
          <div className="flex justify-between border-b border-border pb-2">
            <span>Last Ping</span>
            <span>{new Date(health?.timestamp || '').toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span>Frontend Environment</span>
            <span>{import.meta.env.MODE}</span>
          </div>
          <div className="flex justify-between">
            <span>Browser Time</span>
            <span>{new Date().toISOString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
