import React from 'react';
import { Globe, Mail, Database, Shield } from 'lucide-react';

const SystemSettings: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">System Settings</h1>
        <p className="text-[13px] text-muted mt-1">Configure portal preferences</p>
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
              <input type="text" defaultValue="The Filamerian Journals" className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">Tagline</label>
              <input type="text" defaultValue="Scholarly Excellence In Every Discipline" className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">Contact Email</label>
              <input type="email" defaultValue="journals@filamer.edu.ph" className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" />
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
              { label: 'New submission alerts', checked: true },
              { label: 'Review completion alerts', checked: true },
              { label: 'User registration alerts', checked: false },
              { label: 'System health alerts', checked: true },
            ].map((opt) => (
              <label key={opt.label} className="flex items-center justify-between cursor-pointer group">
                <span className="text-[13px] text-primary/80">{opt.label}</span>
                <input type="checkbox" defaultChecked={opt.checked} className="h-4 w-4 accent-primary" />
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
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Max upload size</span>
              <span className="font-medium text-primary">10 MB</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Storage used</span>
              <span className="font-medium text-primary">2.4 GB / 50 GB</span>
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
        <button className="px-6 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
