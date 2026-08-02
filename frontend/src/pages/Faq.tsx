import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Grid, 
  List, 
  Sparkles,
  ArrowRight,
  MessageSquare,
  Bookmark
} from 'lucide-react';
import api from '@/services/api';
import SearchInput from '@/components/ui/SearchInput';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  audience: string;
  sort_order: number;
}

type ViewMode = 'accordion' | 'tabs' | 'grid';

const CATEGORIES = ['All', 'General', 'Readers', 'Authors', 'Publishing', 'Admin'];

const CATEGORY_ICONS: Record<string, any> = {
  General: Sparkles,
  Readers: BookOpen,
  Authors: Users,
  Publishing: FileText,
  Admin: ShieldCheck,
};

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 1,
    question: 'What is The Filamerian Journals platform?',
    answer: 'The Filamerian Journals is the official academic publishing and journal repository platform for Filamer Christian University. It hosts peer-reviewed undergraduate, graduate, institutional, and multidisciplinary research journals with free open-access reading and PDF downloading.',
    category: 'General',
    audience: 'public',
    sort_order: 1,
  },
  {
    id: 2,
    question: 'Are articles on this platform open access?',
    answer: 'Yes! All published journals and research articles are freely accessible to the public for reading and downloading. No paid subscription or registration is required to read abstracts or download PDF documents.',
    category: 'General',
    audience: 'public',
    sort_order: 2,
  },
  {
    id: 3,
    question: 'How can I search for specific research articles?',
    answer: 'Use the global search bar at the top of the website or press Shift + / to open keyboard shortcuts. You can search by article title, author name, category, or relevant keywords.',
    category: 'Readers',
    audience: 'public',
    sort_order: 3,
  },
  {
    id: 4,
    question: 'How do I cite an article from Filamerian Journals?',
    answer: 'On any article preview or detail page, click the "Cite" button. You can automatically copy citations formatted in APA 7th, MLA 9th, Chicago, or Harvard reference styles.',
    category: 'Readers',
    audience: 'public',
    sort_order: 4,
  },
  {
    id: 5,
    question: 'Can I download PDF copies of research papers?',
    answer: 'Yes. Every published article includes an in-browser PDF viewer with full-screen reading modes and an instant "Download PDF" button.',
    category: 'Readers',
    audience: 'public',
    sort_order: 5,
  },
  {
    id: 6,
    question: 'Who can submit research papers to Filamerian Journals?',
    answer: 'Filamer Christian University faculty, graduate students, undergraduate researchers, and invited external academic contributors are eligible to submit manuscripts for editorial review.',
    category: 'Authors',
    audience: 'all',
    sort_order: 6,
  },
  {
    id: 7,
    question: 'What file formats are accepted for article PDF uploads?',
    answer: 'Full-text manuscripts must be uploaded as PDF files. Cover graphics and supplementary images accept JPG, PNG, and WebP formats.',
    category: 'Authors',
    audience: 'all',
    sort_order: 7,
  },
  {
    id: 8,
    question: 'What is the maximum PDF file upload size limit?',
    answer: 'The default PDF upload limit is configured under System Settings (typically up to 25 MB per document). Large graphic files are automatically optimized.',
    category: 'Authors',
    audience: 'all',
    sort_order: 8,
  },
  {
    id: 9,
    question: 'How does the Journal > Volume > Issue > Article hierarchy work?',
    answer: 'The platform follows standard academic structure: Each Journal contains numbered Volumes (typically one volume per publication year). Volumes contain Issues (e.g., Issue No. 1 - Vol 12), and Articles are assigned to specific Issues and Volumes.',
    category: 'Publishing',
    audience: 'admin',
    sort_order: 9,
  },
  {
    id: 10,
    question: 'How do I add a new article or author in the Dashboard?',
    answer: 'Logged-in staff can navigate to Dashboard > Articles or Dashboard > Authors and press "N" on their keyboard to instantly open the Creation Form modal.',
    category: 'Publishing',
    audience: 'admin',
    sort_order: 10,
  },
  {
    id: 11,
    question: 'What keyboard shortcuts are available in the Dashboard?',
    answer: 'Press Shift + / (or Shift + ?) anywhere in the dashboard to toggle the Keyboard Shortcuts guide. Shortcuts include N (Create New Item), Esc (Close Modal), and Tab navigation.',
    category: 'Admin',
    audience: 'admin',
    sort_order: 11,
  },
  {
    id: 12,
    question: 'How does Role-Based Access Control (RBAC) work?',
    answer: 'Super Admins have full access to User Management, Activity Logs, and System Health. Admins can create and edit Journals, Volumes, and Articles. Non-admin users are restricted from administrative controls.',
    category: 'Admin',
    audience: 'admin',
    sort_order: 12,
  },
  {
    id: 13,
    question: 'What happens when Maintenance Mode is toggled on?',
    answer: 'When Maintenance Mode is active in System Settings, public visitors are shown a scheduled maintenance notice while logged-in Admins retain uninterrupted access to manage the system.',
    category: 'Admin',
    audience: 'admin',
    sort_order: 13,
  },
];

const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('accordion');
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(DEFAULT_FAQS[0].id);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await api.get('/public/faqs');
        if (res.data?.data && res.data.data.length > 0) {
          setFaqs(res.data.data);
          setOpenAccordionId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  // Filter FAQs based on search and selected category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: number) => {
    setOpenAccordionId(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-background font-sans text-primary">
      {/* Hero Header */}
      <section className="bg-surface border-b border-border py-14 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-6 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-mono font-medium">
            <HelpCircle className="h-3.5 w-3.5" /> Knowledge Base & User Guide
          </div>

          <h1 className="text-3xl md:text-5xl font-serif text-primary tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-muted text-sm md:text-base max-w-2xl">
            Explore guides, publishing steps, keyboard shortcuts, and answers to frequently asked questions about The Filamerian Journals repository.
          </p>

          {/* Search & Layout Control Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-3xl">
            <div className="flex-1">
              <SearchInput
                placeholder="Search questions, citations, submission rules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background"
              />
            </div>

            {/* Layout Mode Switcher */}
            <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-md shrink-0 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted px-2 hidden sm:inline">
                Layout:
              </span>
              <button
                onClick={() => setViewMode('accordion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  viewMode === 'accordion'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-primary hover:bg-surface'
                }`}
                title="Accordion List View"
              >
                <List className="h-3.5 w-3.5" />
                <span>Accordion</span>
              </button>

              <button
                onClick={() => setViewMode('tabs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  viewMode === 'tabs'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-primary hover:bg-surface'
                }`}
                title="Tabbed Categories View"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tabs</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-primary hover:bg-surface'
                }`}
                title="Grid Cards View"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <div className="border-b border-border bg-surface/50 px-6 py-4 sticky top-14 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Bookmark;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all shrink-0 rounded-full border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-background border-border text-muted hover:text-primary hover:border-primary/40'
                }`}
              >
                {cat !== 'All' && <Icon className="h-3.5 w-3.5" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border p-8 bg-surface space-y-3">
            <HelpCircle className="h-10 w-10 text-muted mx-auto" />
            <h3 className="text-lg font-serif">No matching questions found</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              Try adjusting your search terms or select a different category above.
            </p>
          </div>
        ) : (
          <>
            {/* VIEW MODE 1: ACCORDION LIST */}
            {viewMode === 'accordion' && (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => {
                  const isOpen = openAccordionId === faq.id;
                  const CategoryIcon = CATEGORY_ICONS[faq.category] || Bookmark;
                  return (
                    <div
                      key={faq.id}
                      className="border border-border bg-surface transition-all duration-200 shadow-sm"
                    >
                      <button
                        onClick={() => toggleAccordion(faq.id)}
                        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-background/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1.5 bg-background border border-border text-secondary shrink-0">
                            <CategoryIcon className="h-4 w-4" />
                          </span>
                          <h3 className="text-sm md:text-base font-medium text-primary">
                            {faq.question}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-background border border-border text-muted hidden sm:inline">
                            {faq.category}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 text-sm text-muted leading-relaxed border-t border-border/60 bg-background/30">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: TABBED CATEGORIES */}
            {viewMode === 'tabs' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-4 py-3 text-xs font-medium transition-all flex items-center justify-between border-l-2 ${
                        selectedCategory === cat
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-transparent text-muted hover:text-primary hover:bg-surface'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] font-mono text-muted/70">
                        {cat === 'All' 
                          ? faqs.length 
                          : faqs.filter(f => f.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Content Panel */}
                <div className="md:col-span-3 space-y-6">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border border-border bg-surface p-6 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-serif font-medium text-primary">
                          {faq.question}
                        </h3>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20">
                          {faq.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: GRID CARDS */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFaqs.map((faq) => {
                  const CategoryIcon = CATEGORY_ICONS[faq.category] || Bookmark;
                  return (
                    <div
                      key={faq.id}
                      className="border border-border bg-surface p-6 space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="p-2 bg-background border border-border text-primary/70">
                            <CategoryIcon className="h-4 w-4" />
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-background border border-border text-muted">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-base font-medium text-primary leading-snug">
                          {faq.question}
                        </h3>
                        <p className="text-xs md:text-sm text-muted leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Bottom Support Banner */}
        <div className="mt-16 border border-border bg-surface p-8 text-center space-y-4 shadow-sm">
          <MessageSquare className="h-8 w-8 text-secondary mx-auto" />
          <h2 className="text-xl font-serif text-primary">Still have questions?</h2>
          <p className="text-sm text-muted max-w-lg mx-auto">
            Can’t find the answer you’re looking for? Reach out directly to the editorial team or send system feedback.
          </p>
          <div className="pt-2">
            <a
              href="mailto:support@filamer.edu.ph"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Contact Support Team <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
