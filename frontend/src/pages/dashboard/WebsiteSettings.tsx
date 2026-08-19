import React, { useState, useEffect } from 'react';
import { Globe, FileText, Plus, Search, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import api from '@/services/api';
import Input from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
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
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isSuperAdmin = currentUser?.roles?.some((r: any) => r.name === 'Super Admin') || currentUser?.role === 'Super Admin';

  // --- General Settings State ---
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'The FCU Journals',
    tagline: 'Scholarly Excellence In Every Discipline',
    contact_email: 'thefcujournals@gmail.com',
    contact_phone: '+63 9123456789',
    journal_categories: 'Science, Education, Arts, Multidisciplinary',
    home_about_us: '<p class="text-sm text-muted leading-relaxed">\n  <strong>The FCU Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n</p>',
    show_tagline: 'false',
    show_about_us: 'true',
    footer_col1_title: 'NAVIGATION',
    footer_col1_l1_text: 'Home Portal', footer_col1_l1_url: '/',
    footer_col1_l2_text: 'Browse Journals', footer_col1_l2_url: '/journals',
    footer_col1_l3_text: 'Volume Archives', footer_col1_l3_url: '/archives',
    footer_col1_l4_text: 'About Repository', footer_col1_l4_url: '/about',
    footer_col1_l5_text: 'Contact Editorial Office', footer_col1_l5_url: '/contact',
    footer_col2_title: 'PUBLISHING POLICIES',
    footer_col2_l1_text: 'Open Access Policy', footer_col2_l1_url: '/about',
    footer_col2_l2_text: 'Repository Guidelines', footer_col2_l2_url: '/about',
    footer_col2_l3_text: 'Publication Ethics', footer_col2_l3_url: '/about',
    footer_col2_l4_text: 'Journal Policies', footer_col2_l4_url: '/about',
    footer_col2_l5_text: 'Staff & Admin Login', footer_col2_l5_url: '/login',
    footer_col3_title: 'RESOURCES & LINKS',
    footer_col3_l1_text: '', footer_col3_l1_url: '',
    footer_col3_l2_text: '', footer_col3_l2_url: '',
    footer_col3_l3_text: '', footer_col3_l3_url: '',
    footer_col3_l4_text: '', footer_col3_l4_url: '',
    footer_col3_l5_text: '', footer_col3_l5_url: '',
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
      <div className="border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Home Page Settings</h2>
          </div>
          {loadingSettings && (
            <span className="text-[11px] text-muted flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              Syncing settings...
            </span>
          )}
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
              value={settings.home_about_us || 'The FCU Journals is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.'}
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
    </div>
  );

  const footerTabContent = (
    <div className="space-y-8 w-full">
      {!isSuperAdmin && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[13px] font-medium flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
          Footer link settings can only be edited by Super Admins.
        </div>
      )}

      <div className="border border-border bg-surface p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-primary/40" />
            <div>
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Footer Navigation Columns</h2>
              <p className="text-[12px] text-muted">Configure the 3 customizable link columns displayed in the website footer. Leave rows empty to hide them.</p>
            </div>
          </div>
          {loadingSettings && (
            <span className="text-[11px] text-muted flex items-center gap-1.5 font-medium shrink-0">
              <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              Syncing settings...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((colNum) => (
            <div key={colNum} className="border border-border bg-background p-4 space-y-4">
              <div className="border-b border-border pb-2">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">Column {colNum} Header</span>
                <Input 
                  label={`Main Title`} 
                  disabled={!isSuperAdmin}
                  value={settings[`footer_col${colNum}_title`] || (colNum === 1 ? 'NAVIGATION' : colNum === 2 ? 'PUBLISHING POLICIES' : '')} 
                  onChange={(e) => handleSettingsChange(`footer_col${colNum}_title`, e.target.value)}
                  placeholder="e.g. NAVIGATION"
                />
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Links (Up to 5)</span>
                {[1, 2, 3, 4, 5].map((linkNum) => (
                  <div key={linkNum} className="p-2 border border-border bg-surface space-y-2">
                    <span className="text-[10px] font-mono text-muted uppercase">Link #{linkNum}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="Text Title (e.g. Home)"
                        value={settings[`footer_col${colNum}_l${linkNum}_text`] || ''}
                        onChange={(e) => handleSettingsChange(`footer_col${colNum}_l${linkNum}_text`, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border text-[12px] focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="URL / Path (e.g. /about)"
                        value={settings[`footer_col${colNum}_l${linkNum}_url`] || ''}
                        onChange={(e) => handleSettingsChange(`footer_col${colNum}_l${linkNum}_url`, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border text-[12px] focus:outline-none focus:border-primary font-mono disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSaveSettings}
            isLoading={savingSettings}
          >
            {savingSettings ? 'Saving...' : 'Save Footer Settings'}
          </Button>
        </div>
      )}
    </div>
  );

  const contactTabContent = (
    <div className="space-y-8 w-full">
      <div className="border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-primary/40" />
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Contact Page Settings</h2>
          </div>
          {loadingSettings && (
            <span className="text-[11px] text-muted flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              Syncing settings...
            </span>
          )}
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

  return (
    <div className="space-y-2">
      <DashboardHeader 
        title="Website Settings" 
        helpText="Customize public website branding, hero titles, about us content, contact details, and footer navigation links."
        className="mb-2" 
      />

      <Tabs 
        tabs={[
          { id: 'home', label: 'Home', content: homeTabContent },
          { id: 'footer', label: 'Footer Links', content: footerTabContent },
          { id: 'about', label: 'About', content: resourcesContent },
          { id: 'contact', label: 'Contact', content: contactTabContent }
        ]}
      />
      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteResource}
        title="Delete Resource Page"
        message="Are you sure you want to delete this resource page from the public index?"
      />
    </div>
  );
};

export default WebsiteSettings;
