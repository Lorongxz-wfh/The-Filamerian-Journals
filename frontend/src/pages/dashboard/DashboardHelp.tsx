import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  BookOpen, 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import api from '@/services/api';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from 'sonner';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  audience: string;
  sort_order: number;
  is_published: boolean;
}

const CATEGORIES = ['General', 'Readers', 'Authors', 'Publishing', 'Admin'];

const DashboardHelp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guide' | 'shortcuts' | 'manage'>('guide');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    audience: 'all',
    sort_order: 0,
    is_published: true,
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Super Admin' || user.role === 'Admin';

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faqs');
      if (res.data?.data) {
        setFaqs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage' && isAdmin) {
      fetchFaqs();
    }
  }, [activeTab, isAdmin]);

  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      audience: 'all',
      sort_order: faqs.length + 1,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      audience: faq.audience,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await api.put(`/faqs/${editingFaq.id}`, formData);
        toast.success('FAQ updated successfully!');
      } else {
        await api.post('/faqs', formData);
        toast.success('FAQ created successfully!');
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      toast.error('Failed to save FAQ entry.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this FAQ entry?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      toast.success('FAQ deleted successfully.');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      toast.error('Failed to delete FAQ entry.');
    }
  };

  const filteredFaqs = faqs.filter(
    f => f.question.toLowerCase().includes(filter.toLowerCase()) ||
         f.answer.toLowerCase().includes(filter.toLowerCase()) ||
         f.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans w-full text-primary">
      <DashboardHeader title="Help & System Guide" />

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('guide')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'guide'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          System Workflow Guide
        </button>

        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'shortcuts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          Keyboard Shortcuts
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'manage'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            Manage FAQ Entries ({faqs.length})
          </button>
        )}
      </div>

      {/* TAB 1: SYSTEM WORKFLOW GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Journal Hierarchy Card */}
            <div className="border border-border bg-surface p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <BookOpen className="h-4 w-4 text-primary/70" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Publishing Hierarchy
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                The platform organizes academic research into a 4-tier structure:
              </p>
              <div className="space-y-2 text-xs font-mono bg-background p-3 border border-border">
                <div className="text-primary font-bold">1. Journal (e.g. Arts & Sciences Review)</div>
                <div className="pl-3 text-muted">└── 2. Volume (e.g. Vol. 12 - 2026)</div>
                <div className="pl-6 text-muted">└── 3. Issue (e.g. Issue No. 1)</div>
                <div className="pl-9 text-emerald-600 font-semibold">└── 4. Article (PDF Document)</div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="border border-border bg-surface p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Sparkles className="h-4 w-4 text-secondary" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Adding Content
                </h3>
              </div>
              <ul className="text-xs text-muted space-y-2">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Go to <strong>Dashboard &gt; Articles</strong> and click <strong>+ Article</strong> (or press <kbd className="px-1.5 py-0.5 bg-background border border-border font-mono text-[10px]">N</kbd>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Upload the PDF manuscript file (Max size configurable in System Settings).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Select or create Authors to link to the manuscript.</span>
                </li>
              </ul>
            </div>

            {/* Access Control Card */}
            <div className="border border-border bg-surface p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Roles & Access
                </h3>
              </div>
              <div className="space-y-3 text-xs text-muted">
                <div>
                  <span className="font-semibold text-primary block">Super Admin</span>
                  <span>Full control over System Settings, User Approvals, Activity Logs, and Health.</span>
                </div>
                <div>
                  <span className="font-semibold text-primary block">Admin / Editor</span>
                  <span>Can manage Journals, Volumes, Articles, Authors, and FAQs.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: KEYBOARD SHORTCUTS */}
      {activeTab === 'shortcuts' && (
        <div className="border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Keyboard className="h-5 w-5 text-primary/70" />
            <h3 className="text-sm font-serif font-medium text-primary">
              Global Dashboard Hotkeys
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'N', desc: 'Open creation modal (Articles, Authors, Users)' },
              { key: 'Shift + ?', desc: 'Toggle keyboard shortcuts cheat sheet' },
              { key: 'Esc', desc: 'Close any open modal dialog or overlay' },
              { key: 'Tab', desc: 'Focus next interactive element' },
              { key: 'Enter', desc: 'Submit active modal form' },
              { key: 'Shift + /', desc: 'Focus global search bar' },
            ].map((hk) => (
              <div key={hk.key} className="p-4 border border-border bg-background flex items-center justify-between">
                <span className="text-xs text-muted">{hk.desc}</span>
                <kbd className="px-2 py-1 bg-surface border border-border text-xs font-mono font-bold text-primary shadow-xs">
                  {hk.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN FAQ MANAGEMENT */}
      {activeTab === 'manage' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <SearchInput
              placeholder="Filter FAQs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-72"
            />
            <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add FAQ Entry
            </Button>
          </div>

          {/* FAQs List Table */}
          <div className="border border-border bg-surface overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="p-4">Question</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Audience</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      Loading FAQs...
                    </td>
                  </tr>
                ) : filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      No FAQ entries found.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-background/50 transition-colors">
                      <td className="p-4 font-medium text-primary max-w-xs truncate">
                        {faq.question}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-background border border-border text-muted font-mono uppercase text-[10px]">
                          {faq.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-muted uppercase text-[10px]">
                        {faq.audience}
                      </td>
                      <td className="p-4">
                        {faq.is_published ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-semibold text-[10px] uppercase">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 font-semibold text-[10px] uppercase">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            icon={Edit2}
                            title="Edit FAQ"
                            onClick={() => handleOpenEditModal(faq)}
                          />
                          <IconButton
                            icon={Trash2}
                            variant="danger"
                            title="Delete FAQ"
                            onClick={() => handleDelete(faq.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing FAQ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? 'Edit FAQ Entry' : 'Create FAQ Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
              Question
            </label>
            <Input
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g. How do I download PDF papers?"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
              Answer
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Detailed explanation..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border text-xs focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                Category
              </label>
              <Select
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: String(val) })}
                options={CATEGORIES.map((c) => ({ label: c, value: c }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                Audience
              </label>
              <Select
                value={formData.audience}
                onChange={(val) => setFormData({ ...formData, audience: String(val) })}
                options={[
                  { label: 'All Users', value: 'all' },
                  { label: 'Public Only', value: 'public' },
                  { label: 'Admin Only', value: 'admin' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="is_published" className="text-xs text-primary font-medium">
              Publish immediately on FAQ page
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFaq ? 'Update FAQ' : 'Save FAQ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardHelp;
