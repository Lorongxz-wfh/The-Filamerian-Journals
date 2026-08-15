import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Upload, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Command, 
  Key
} from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';
import SearchInput from '@/components/ui/SearchInput';

const DashboardHelp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('workflows');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const adminFaqs = [
    {
      id: 'faq-1',
      category: 'Publishing Workflows',
      question: 'How do I create a new journal issue or volume?',
      answer: 'Navigate to "Journals" in the dashboard sidebar, select your target journal, and click "Manage Volumes & Issues". From there, click "New Volume" to specify the volume number, year, issue number, and title.'
    },
    {
      id: 'faq-2',
      category: 'Publishing Workflows',
      question: 'How do I upload and publish research articles?',
      answer: 'Go to "Articles" or enter a specific volume under "Journals". Click "New Article", fill in the title, abstract, keywords, publication date, upload the PDF manuscript file, and associate the respective authors.'
    },
    {
      id: 'faq-3',
      category: 'Data Management',
      question: 'What format should I use for Bulk Imports?',
      answer: 'Under "Bulk Import", you can upload articles in CSV format with columns: journal_slug, volume_number, title, abstract, doi, keywords, published_at. Ensure PDF files referenced match the uploaded filenames.'
    },
    {
      id: 'faq-4',
      category: 'User Roles & Permissions',
      question: 'What is the difference between Super Admin and Admin?',
      answer: 'Super Admins have full access to User Account approvals, Activity Logs, System Settings, Maintenance Mode, and Error Logs. Admins have editorial control over Journals, Volumes, Articles, Authors, and Announcements.'
    },
    {
      id: 'faq-5',
      category: 'System Administration',
      question: 'What happens when Maintenance Mode is activated?',
      answer: 'When Maintenance Mode is turned ON in System Settings, non-admin visitors see a maintenance banner on the public portal. System API write endpoints are restricted while Admins can continue managing content.'
    },
    {
      id: 'faq-6',
      category: 'Troubleshooting',
      question: 'Why is a PDF preview not loading properly?',
      answer: 'Verify that the uploaded PDF is valid and not password-protected. Make sure your server storage permissions allow public read access to uploaded files in storage/app/public.'
    }
  ];

  const filteredFaqs = adminFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      <DashboardHeader 
        title="Help & Manual" 
        className="mb-2 sm:mb-4"
      />

      {/* Quick Stats / Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="border border-border bg-surface p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-primary uppercase tracking-wider">Editorial Management</h4>
            <p className="text-[11px] sm:text-[12px] text-muted mt-0.5 sm:mt-1 leading-relaxed">
              Step-by-step guides for journal creation, volume indexing, and manuscript publishing.
            </p>
          </div>
        </div>

        <div className="border border-border bg-surface p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
          </div>
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-primary uppercase tracking-wider">System & Security</h4>
            <p className="text-[11px] sm:text-[12px] text-muted mt-0.5 sm:mt-1 leading-relaxed">
              Super Admin controls for user approvals, security toggles, logs, and maintenance mode.
            </p>
          </div>
        </div>

        <div className="border border-border bg-surface p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Command className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-primary uppercase tracking-wider">Power Shortcuts</h4>
            <p className="text-[11px] sm:text-[12px] text-muted mt-0.5 sm:mt-1 leading-relaxed">
              Keyboard navigation cheat sheet (`Ctrl+K`, `/`) for instant search across all modules.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-border flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar pt-1 sm:pt-2 pb-0.5">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
            activeTab === 'workflows'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Core Workflows</span>
          <span className="sm:hidden">Workflows</span>
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
            activeTab === 'faqs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Admin FAQs & Troubleshooting</span>
          <span className="sm:hidden">FAQs & Help</span>
        </button>
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
            activeTab === 'shortcuts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <Key className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Keyboard Shortcuts</span>
          <span className="sm:hidden">Shortcuts</span>
        </button>
      </div>

      {/* Tab 1: Core Workflows */}
      {activeTab === 'workflows' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Guide Card 1 */}
          <div className="border border-border bg-surface p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3 border-b border-border pb-2.5 sm:pb-3">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">1. Creating & Managing Journals</h3>
            </div>
            <div className="text-[13px] text-muted space-y-3 leading-relaxed">
              <p>
                As an Admin or Super Admin, you can manage the university's journal collection under the <strong>Journals</strong> section.
              </p>
              <ul className="space-y-2 list-disc list-inside text-primary/80 pl-2">
                <li><strong>Creating a Journal:</strong> Click "New Journal", set title, description, department, and cover image.</li>
                <li><strong>Volumes & Issues:</strong> Click on any journal to view its volume list. Volumes organize articles by publication year and issue number.</li>
                <li><strong>Reordering Articles:</strong> Drag and drop or use reorder controls within a volume to set the order of appearance.</li>
              </ul>
            </div>
          </div>

          {/* Guide Card 2 */}
          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">2. Publishing Manuscripts & Uploading PDFs</h3>
            </div>
            <div className="text-[13px] text-muted space-y-3 leading-relaxed">
              <p>
                Manuscript management is performed via the <strong>Articles</strong> tab or directly inside a specific volume:
              </p>
              <ul className="space-y-2 list-disc list-inside text-primary/80 pl-2">
                <li><strong>Required Fields:</strong> Title, Abstract, Keywords, Publication Date, Volume, and PDF File.</li>
                <li><strong>Author Assignment:</strong> Assign registered or custom authors to each paper for proper indexing.</li>
                <li><strong>Public Access:</strong> Once published, articles become searchable and downloadable on the public portal.</li>
              </ul>
            </div>
          </div>

          {/* Guide Card 3 */}
          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">3. Bulk Article Importing</h3>
            </div>
            <div className="text-[13px] text-muted space-y-3 leading-relaxed">
              <p>
                Use the <strong>Bulk Import</strong> tool to upload multiple articles simultaneously:
              </p>
              <ul className="space-y-2 list-disc list-inside text-primary/80 pl-2">
                <li>Download the sample CSV template from the Bulk Import page.</li>
                <li>Fill in article details and ensure PDF files match exact filenames.</li>
                <li>Upload the CSV to process and automatically bind articles to target volumes.</li>
              </ul>
            </div>
          </div>

          {/* Guide Card 4 */}
          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">4. Super Admin Controls & System Settings</h3>
            </div>
            <div className="text-[13px] text-muted space-y-3 leading-relaxed">
              <p>
                Super Admins possess root authority over portal configuration:
              </p>
              <ul className="space-y-2 list-disc list-inside text-primary/80 pl-2">
                <li><strong>User Approvals:</strong> Approve or reject pending staff registrations under <strong>User Accounts</strong>.</li>
                <li><strong>Maintenance Mode:</strong> Activate Maintenance Mode in <strong>System Settings</strong> to temporarily pause public modifications.</li>
                <li><strong>Activity Logs:</strong> Monitor real-time audit trails of system events under <strong>Activity Logs</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Admin FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="border border-border bg-surface p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Admin Knowledge Base</h3>
                <p className="text-[12px] text-muted mt-0.5">Frequently asked operational questions and troubleshooting steps.</p>
              </div>
              <div className="w-full sm:w-72">
                <SearchInput 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search admin FAQs..."
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {filteredFaqs.length === 0 ? (
                <p className="text-center text-[13px] text-muted py-8">No matching FAQs found for "{searchQuery}".</p>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="border border-border bg-background overflow-hidden">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 uppercase tracking-wider shrink-0">
                          {faq.category}
                        </span>
                        <h4 className="text-[13px] font-semibold text-primary">{faq.question}</h4>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted transition-transform shrink-0 ${openFaqId === faq.id ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    {openFaqId === faq.id && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 text-[13px] text-muted leading-relaxed bg-surface/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Keyboard Shortcuts */}
      {activeTab === 'shortcuts' && (
        <div className="border border-border bg-surface p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Keyboard Navigation Cheat Sheet</h3>
            <p className="text-[12px] text-muted mt-0.5">Use keyboard shortcuts to navigate the dashboard quickly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border bg-background p-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-primary">Global Search</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-primary bg-surface border border-border rounded">Ctrl + K</kbd>
            </div>
            <div className="border border-border bg-background p-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-primary">Open Shortcuts Help</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-primary bg-surface border border-border rounded">?</kbd>
            </div>
            <div className="border border-border bg-background p-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-primary">Close Modal / Dropdown</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-primary bg-surface border border-border rounded">Esc</kbd>
            </div>
            <div className="border border-border bg-background p-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-primary">Focus Search Bar</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-primary bg-surface border border-border rounded">/</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHelp;
