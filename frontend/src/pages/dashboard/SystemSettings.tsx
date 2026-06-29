import React, { useState, useEffect } from 'react';
import { Globe, Mail, Database, Shield, Loader2 } from 'lucide-react';
import api from '@/services/api';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'The Filamerian Journals',
    tagline: 'Scholarly Excellence In Every Discipline',
    contact_email: 'journals@filamer.edu.ph',
    max_upload_size: '10',
    notify_new_submission: '1',
    notify_review_completion: '1',
    notify_user_registration: '0',
    notify_system_health: '1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('');
      await api.post('/settings', { settings });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-muted">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl uppercase tracking-wider">System Settings</h1>
          <p className="text-[13px] text-muted mt-1">Configure portal preferences</p>
        </div>
        {message && (
          <span className="text-[13px] font-medium text-emerald-600">{message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Globe className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">General</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">Site Title</label>
              <input 
                type="text" 
                value={settings.site_title} 
                onChange={(e) => handleChange('site_title', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" 
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">Tagline</label>
              <input 
                type="text" 
                value={settings.tagline} 
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" 
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">Contact Email</label>
              <input 
                type="email" 
                value={settings.contact_email} 
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" 
              />
            </div>
          </div>
        </div>

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
                className="w-20 px-2 py-1 bg-background border border-border text-right focus:outline-none focus:border-primary" 
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
        <div className="border border-border bg-surface p-6 space-y-5">
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
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
