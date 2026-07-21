import React, { useState, useEffect } from 'react';
import { Mail, Database, Shield } from 'lucide-react';
import api from '@/services/api';
import { FormSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    max_upload_size: '10',
    notify_new_submission: '1',
    notify_review_completion: '1',
    notify_user_registration: '0',
    notify_system_health: '1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/settings');
        if (Object.keys(res.data.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked ? '1' : '0' }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/settings', { settings });
      toast.success('System settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="System Settings" />

      {loading ? (
        <FormSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Mail className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Email Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'notify_new_submission', label: 'New submission alerts' },
              { key: 'notify_review_completion', label: 'Review completion alerts' },
              { key: 'notify_user_registration', label: 'User registration alerts' },
              { key: 'notify_system_health', label: 'System health alerts' },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-[13px] text-primary/80">{opt.label}</span>
                <input 
                  type="checkbox" 
                  checked={settings[opt.key] === '1'} 
                  onChange={(e) => handleCheckboxChange(opt.key, e.target.checked)}
                  className="h-4 w-4 accent-primary" 
                />
              </label>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Database className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Storage</h2>
          </div>
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between py-1.5 border-b border-border items-center">
              <span className="text-muted">Max upload size (MB)</span>
              <input 
                type="number" 
                value={settings.max_upload_size}
                onChange={(e) => handleChange('max_upload_size', e.target.value)}
                className="w-20 px-2 py-1 bg-background border border-border text-[13px] text-right focus:outline-none focus:border-primary transition-colors" 
              />
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Storage used</span>
              <span className="font-medium text-primary">0.0 GB / 50 GB</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Allowed formats</span>
              <span className="font-medium text-primary">PDF, DOCX, JPG, PNG</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="border border-border bg-surface p-6 space-y-5 lg:col-span-2 max-w-2xl">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Shield className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Security</h2>
          </div>
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Authentication</span>
              <span className="font-medium text-emerald-600">Sanctum Active</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">RBAC</span>
              <span className="font-medium text-emerald-600">Spatie Enabled</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Session timeout</span>
              <span className="font-medium text-primary">120 minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSave}
          isLoading={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
        </>
      )}
    </div>
  );
};

export default SystemSettings;
