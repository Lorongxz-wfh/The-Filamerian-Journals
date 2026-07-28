import React, { useState, useEffect } from 'react';
import { Globe, FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Input from '@/components/ui/Input';
import { FormSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import EmptyState from '@/components/ui/EmptyState';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Resource {
  id: number;
  title: string;
  slug: string;
  content: string;
  order: number;
}

const WebsiteSettings: React.FC = () => {
  // --- General Settings State ---
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'The Filamerian Journals',
    tagline: 'Scholarly Excellence In Every Discipline',
    contact_email: 'journals@filamer.edu.ph',
    contact_phone: '(036) 6210-471',
    journal_categories: 'Science, Education, Arts, Multidisciplinary',
    home_about_us: '<div class="text-center max-w-4xl mx-auto space-y-4 pb-4 border-b border-border mb-4">\n  <h2 class="text-lg font-bold uppercase tracking-wider text-primary">The Filamerian Journals</h2>\n  <p class="text-[14px] text-muted leading-relaxed">\n    <strong>The Filamerian Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n  </p>\n</div>',
    show_tagline: 'false',
    show_about_us: 'true',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // --- Resources State ---
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [filter, setFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', order: '0' });
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchResources();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/public/settings');
      if (Object.keys(res.data.data).length > 0) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data.data);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // --- Handlers for Settings ---
  const handleSettingsChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.post('/settings', { settings });
      toast.success('Website settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save website settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // --- Handlers for Resources ---
  const handleOpenModal = (item: Resource | null = null) => {
    setResourceError(null);
    setEditingItem(item);
    if (item) {
      setFormData({ 
        title: item.title, 
        slug: item.slug, 
        content: item.content || '', 
        order: String(item.order) 
      });
    } else {
      setFormData({ title: '', slug: '', content: '', order: '0' });
    }
    setIsModalOpen(true);
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingResource(true);
    setResourceError(null);
    try {
      if (editingItem) {
        await api.put(`/resources/${editingItem.id}`, formData);
        toast.success('Resource updated!');
      } else {
        const payload = { ...formData };
        if (!payload.slug) {
          payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        await api.post('/resources', payload);
        toast.success('Resource created!');
      }
      await fetchResources();
      setIsModalOpen(false);
    } catch (err: any) {
      setResourceError(err.response?.data?.message || 'Failed to save resource.');
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const handleDeleteResource = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDeleteResource = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/resources/${deleteTarget}`);
      toast.success('Resource deleted!');
      await fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredResources = resources.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

  // --- Tab Contents ---
  const homeTabContent = (
    <div className="space-y-8 w-full">
      {loadingSettings ? (
        <FormSkeleton rows={6} />
      ) : (
        <>
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary/40" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Home Page Settings</h2>
            </div>
            <div className="space-y-4">
              <Input 
                label="Site Title" 
                value={settings.site_title} 
                onChange={(e) => handleSettingsChange('site_title', e.target.value)}
              />
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[12px] font-medium text-primary uppercase tracking-wider">Hero Text</label>
                </div>
                <RichTextEditor 
                  value={settings.home_about_us || 'The Filamerian Journals is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.'}
                  onChange={(val) => handleSettingsChange('home_about_us', val)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveSettings}
              isLoading={savingSettings}
            >
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );


  const archivesTabContent = (
    <div className="space-y-8 w-full">
      <div className="border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Globe className="h-4 w-4 text-primary/40" />
          <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Archives Page Settings</h2>
        </div>
        <EmptyState title="Coming Soon" description="Settings for the archives page are empty for now." className="border-0 bg-transparent py-8" />
      </div>
    </div>
  );

  const contactTabContent = (
    <div className="space-y-8 w-full">
      {loadingSettings ? (
        <FormSkeleton rows={2} />
      ) : (
        <>
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary/40" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Contact Page Settings</h2>
            </div>
            <div className="space-y-4">
              <Input 
                label="Contact Email" type="email"
                value={settings.contact_email} 
                onChange={(e) => handleSettingsChange('contact_email', e.target.value)}
              />
              <Input 
                label="Contact Phone" type="text"
                value={settings.contact_phone} 
                onChange={(e) => handleSettingsChange('contact_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveSettings}
              isLoading={savingSettings}
            >
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const resourcesContent = (
    <div className="space-y-8 w-full">
      <div className="border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">About Page Resources</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2 h-8 text-[11px] px-3">
            <Plus className="h-3 w-3" /> New Resource
          </Button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
          <input
            type="text"
            placeholder="Filter resources..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
          />
        </div>

        <div className="border border-border bg-background overflow-x-auto max-h-[500px] overflow-y-auto relative">
          <div className="sticky top-0 bg-surface z-10 shadow-sm shadow-black/5 grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-4">Slug</div>
            <div className="col-span-2"></div>
          </div>
          
          {loadingResources ? (
            <ListSkeleton colSpans={[1, 5, 4, 2]} rows={5} />
          ) : filteredResources.length === 0 ? (
            <EmptyState title="No resources" description="No resources found." className="border-0 bg-transparent py-16" />
          ) : (
            filteredResources.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface transition-colors group cursor-default items-center">
                <div className="col-span-1 text-center text-[13px] text-muted">{item.order}</div>
                <div className="col-span-5 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary/30 shrink-0" />
                  <span className="text-[13px] font-medium text-primary truncate">{item.title}</span>
                </div>
                <div className="col-span-4 text-[12px] text-muted truncate">{item.slug}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(item)} className="text-muted/60 hover:text-primary hover:bg-black/5 rounded h-7 w-7 flex items-center justify-center transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteResource(item.id)} className="text-muted/60 hover:text-red-500 hover:bg-red-500/10 rounded h-7 w-7 flex items-center justify-center transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmittingResource && setIsModalOpen(false)} title={editingItem ? 'Edit Resource' : 'New Resource'} className="max-w-3xl">
        <form onSubmit={handleSubmitResource} className="space-y-4">
          {resourceError && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{resourceError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <Input 
                label="Order" required type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <Input 
                label="Slug" hint="Auto" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto"
              />
            </div>
          </div>

          <RichTextEditor 
            label="Content" value={formData.content} onChange={val => setFormData({...formData, content: val})}
          />
          
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmittingResource}>Cancel</Button>
            <Button type="submit" disabled={isSubmittingResource}>{isSubmittingResource ? 'Saving...' : 'Save Resource'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const footerTabContent = (
    <div className="space-y-8 w-full">
      {loadingSettings ? (
        <FormSkeleton rows={6} />
      ) : (
        <>
          {/* Column 1: School & Contact Info */}
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary/40" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Footer Column 1 (School Info & Address)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="University / Institution Name" 
                value={settings.footer_school_name || ''} 
                onChange={(e) => handleSettingsChange('footer_school_name', e.target.value)}
                placeholder="Filamer Christian University"
              />
              <Input 
                label="Subtagline" 
                value={settings.footer_school_subtitle || ''} 
                onChange={(e) => handleSettingsChange('footer_school_subtitle', e.target.value)}
                placeholder="A globally linked Christian university"
              />
              <Input 
                label="Address" 
                value={settings.footer_address || ''} 
                onChange={(e) => handleSettingsChange('footer_address', e.target.value)}
                placeholder="Roxas Avenue, Roxas City, Capiz, Philippines"
              />
              <Input 
                label="Footer Email" 
                value={settings.footer_email || ''} 
                onChange={(e) => handleSettingsChange('footer_email', e.target.value)}
                placeholder="info@filamer.edu.ph"
              />
              <Input 
                label="Footer Phone" 
                value={settings.footer_phone || ''} 
                onChange={(e) => handleSettingsChange('footer_phone', e.target.value)}
                placeholder="(036) 621-2317"
              />
            </div>
          </div>

          {/* Column 2 & Column 3: Navigation Links */}
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary/40" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Footer Column 2 & 3 (Navigation Links)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input 
                  label="Quick Links Title" 
                  value={settings.footer_quick_links_title || ''} 
                  onChange={(e) => handleSettingsChange('footer_quick_links_title', e.target.value)}
                  placeholder="Quick Links"
                />
                <Input 
                  label="Quick Links (Separated by Comma)" 
                  value={settings.footer_quick_links || ''} 
                  onChange={(e) => handleSettingsChange('footer_quick_links', e.target.value)}
                  placeholder="About, Academics, Admission, Organizations, Data Privacy Act, Sitemap"
                />
              </div>
              <div className="space-y-4">
                <Input 
                  label="Journal Links Title" 
                  value={settings.footer_journal_links_title || ''} 
                  onChange={(e) => handleSettingsChange('footer_journal_links_title', e.target.value)}
                  placeholder="The Filamerian Journals"
                />
                <Input 
                  label="Journal Links (Separated by Comma)" 
                  value={settings.footer_journal_links || ''} 
                  onChange={(e) => handleSettingsChange('footer_journal_links', e.target.value)}
                  placeholder="Submission Guidelines, Editorial Board, Publication Ethics, Open Access Policy, Contact Editorial Office"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Facebook */}
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary/40" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Footer Bottom Bar (Copyright & Social)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input 
                  label="Copyright Line" 
                  value={settings.footer_copyright || ''} 
                  onChange={(e) => handleSettingsChange('footer_copyright', e.target.value)}
                  placeholder="© Filamer Christian University, Inc. All rights reserved."
                />
              </div>
              <div>
                <Input 
                  label="Facebook Label" 
                  value={settings.footer_facebook_text || ''} 
                  onChange={(e) => handleSettingsChange('footer_facebook_text', e.target.value)}
                  placeholder="Official Facebook Page"
                />
              </div>
              <div className="md:col-span-3">
                <Input 
                  label="Facebook URL" 
                  value={settings.footer_facebook_url || ''} 
                  onChange={(e) => handleSettingsChange('footer_facebook_url', e.target.value)}
                  placeholder="https://facebook.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveSettings}
              isLoading={savingSettings}
            >
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      <DashboardHeader title="Website Settings" className="mb-2" />

      <Tabs 
        tabs={[
          { id: 'home', label: 'Home', content: homeTabContent },
          { id: 'archives', label: 'Archives', content: archivesTabContent },
          { id: 'about', label: 'About', content: resourcesContent },
          { id: 'contact', label: 'Contact', content: contactTabContent },
          { id: 'footer', label: 'Footer', content: footerTabContent }
        ]}
      />
      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteResource}
        title="Delete Resource Page"
        message="Are you sure you want to delete this resource page? This action cannot be undone."
      />
    </div>
  );
};

export default WebsiteSettings;
