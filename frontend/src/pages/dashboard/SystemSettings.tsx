import React, { useState, useEffect } from 'react';
import { Database, Shield, Server, CheckCircle2, HardDrive } from 'lucide-react';
import api from '@/services/api';
import { SystemSettingsSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    max_pdf_upload_size: '10',
    max_image_upload_size: '5',
    session_timeout: '120',
    maintenance_mode: '0',
  });
  const [usedStorageBytes, setUsedStorageBytes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsRes, healthRes] = await Promise.allSettled([
          api.get('/public/settings'),
          api.get('/system/health'),
        ]);

        if (settingsRes.status === 'fulfilled' && Object.keys(settingsRes.value.data?.data || {}).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsRes.value.data.data }));
        }

        if (healthRes.status === 'fulfilled') {
          const health = healthRes.value.data;
          const storageSize = typeof health?.storage === 'object' ? (health.storage?.size_bytes || 0) : 0;
          setUsedStorageBytes(storageSize);
        }
      } catch (err) {
        console.error('Failed to fetch settings or system health', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: prev[key] === '1' ? '0' : '1' }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/settings', { settings });
      toast.success('System settings saved successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans w-full">
      <DashboardHeader title="System Settings" />

      {loading ? (
        <SystemSettingsSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Storage & Upload Configuration */}
            <div className="border border-border bg-surface p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <Database className="h-4 w-4 text-primary/50" />
                  <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Storage & File Limits</h2>
                </div>

                <div className="space-y-4 text-[13px]">
                  {/* Max PDF Upload Size */}
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <div>
                      <span className="font-medium text-primary block">Max PDF Upload Size (MB)</span>
                      <span className="text-[11px] text-muted">Applies to all article and journal PDF documents</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input 
                        type="number" 
                        min="1"
                        max="500"
                        value={settings.max_pdf_upload_size || '10'}
                        onChange={(e) => handleChange('max_pdf_upload_size', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-background border border-border text-[13px] text-right font-mono focus:outline-none focus:border-primary transition-colors" 
                      />
                      <span className="text-xs font-mono text-muted">MB</span>
                    </div>
                  </div>

                  {/* Max Image Upload Size */}
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <div>
                      <span className="font-medium text-primary block">Max Image Upload Size (MB)</span>
                      <span className="text-[11px] text-muted">Applies to cover images and resource graphics</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        value={settings.max_image_upload_size || '5'}
                        onChange={(e) => handleChange('max_image_upload_size', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-background border border-border text-[13px] text-right font-mono focus:outline-none focus:border-primary transition-colors" 
                      />
                      <span className="text-xs font-mono text-muted">MB</span>
                    </div>
                  </div>

                  {/* Storage Quota Cap */}
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <div>
                      <span className="font-medium text-primary block">Storage Quota Cap Limit (GB)</span>
                      <span className="text-[11px] text-muted">Configurable visual disk quota capacity target</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input 
                        type="number" 
                        min="1"
                        max="10000"
                        value={settings.storage_quota_cap_gb || '50'}
                        onChange={(e) => handleChange('storage_quota_cap_gb', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-background border border-border text-[13px] text-right font-mono focus:outline-none focus:border-primary transition-colors" 
                      />
                      <span className="text-xs font-mono text-muted">GB</span>
                    </div>
                  </div>

                  {/* Storage Usage Meter with Progress Bar */}
                  <div className="space-y-2 py-3 border-b border-border/60">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-muted flex items-center gap-1.5 font-medium">
                        <HardDrive className="h-3.5 w-3.5 text-primary/70" />
                        Media Storage Capacity Meter
                      </span>
                      <span className="font-mono text-xs text-primary font-semibold">
                        {formatBytes(usedStorageBytes)} / {settings.storage_quota_cap_gb || 50} GB
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    {(() => {
                      const capGb = parseFloat(settings.storage_quota_cap_gb || '50') || 50;
                      const capBytes = capGb * 1024 * 1024 * 1024;
                      const percentage = Math.min(100, Math.max(0.1, (usedStorageBytes / capBytes) * 100));
                      return (
                        <div className="space-y-1">
                          <div className="w-full bg-background border border-border h-2.5 overflow-hidden p-0.5">
                            <div 
                              className="bg-primary h-full transition-all duration-500 ease-out" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-muted">
                            <span>{percentage.toFixed(3)}% Used</span>
                            <span>{(capGb - (usedStorageBytes / (1024 * 1024 * 1024))).toFixed(2)} GB Available</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Supported Formats */}
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted">Allowed Formats</span>
                    <div className="flex items-center gap-1">
                      {['PDF', 'DOCX', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
                        <span key={fmt} className="text-[10px] font-mono font-bold bg-background border border-border px-1.5 py-0.5 text-primary uppercase">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Authentication */}
            <div className="border border-border bg-surface p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <Shield className="h-4 w-4 text-primary/50" />
                  <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Security & Governance</h2>
                </div>

                <div className="space-y-4 text-[13px]">
                  {/* Maintenance Mode Switch */}
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <div>
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        Maintenance Mode
                        {settings.maintenance_mode === '1' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.2">
                            Active
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-muted">Restrict non-admin public access during maintenance</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('maintenance_mode')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.maintenance_mode === '1' ? 'bg-primary' : 'bg-muted/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.maintenance_mode === '1' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Session Timeout */}
                  <div className="flex items-center justify-between py-2 border-b border-border/60">
                    <div>
                      <span className="font-medium text-primary block">Session Timeout</span>
                      <span className="text-[11px] text-muted">Inactivity duration before requiring re-login</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input 
                        type="number" 
                        min="15"
                        max="1440"
                        value={settings.session_timeout || '120'}
                        onChange={(e) => handleChange('session_timeout', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-background border border-border text-[13px] text-right font-mono focus:outline-none focus:border-primary transition-colors" 
                      />
                      <span className="text-xs font-mono text-muted">min</span>
                    </div>
                  </div>

                  {/* Auth Framework Badges */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted">Authentication Engine</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Laravel Sanctum
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted">Access Control (RBAC)</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Spatie Permission
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Server className="h-3.5 w-3.5" />
              <span>All changes take effect immediately across API services.</span>
            </div>
            <Button 
              onClick={handleSave}
              isLoading={saving}
              className="px-6"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
