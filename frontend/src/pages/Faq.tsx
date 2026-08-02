import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  FileText, 
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
  const [expandedId, setExpandedId] = useState<number | null>(DEFAULT_FAQS[0].id);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await api.get('/public/faqs');
        if (res.data?.data && res.data.data.length > 0) {
          setFaqs(res.data.data);
          setExpandedId(res.data.data[0].id);
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

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-background font-sans text-primary">
      {/* Header Banner */}
      <section className="bg-surface border-b border-border py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 text-xs font-mono font-medium">
            <HelpCircle className="h-3.5 w-3.5" /> User Guide & Support Center
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-tight">
            User Guide & Frequently Asked Questions
          </h1>
          <p className="text-muted text-sm md:text-base max-w-2xl">
            Find instructions, research guidelines, citation rules, and system answers organized by topic.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl">
            <SearchInput
              placeholder="Search guide by keyword, title, citations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background"
            />
          </div>
        </div>
      </section>

      {/* Main Tabbed Layout Container */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Category Tabs Sidebar */}
          <div className="border border-border bg-surface p-2 shadow-xs space-y-1 sticky top-20">
            <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-muted font-bold border-b border-border/60 mb-1">
              Categories
            </div>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Bookmark;
              const isSelected = selectedCategory === cat;
              const count = cat === 'All' 
                ? faqs.length 
                : faqs.filter(f => f.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-all flex items-center justify-between border-l-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-transparent text-muted hover:text-primary hover:bg-background/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cat !== 'All' && <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-secondary' : 'text-muted'}`} />}
                    <span>{cat}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                    isSelected 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-background border-border text-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Cards Panel */}
          <div className="md:col-span-3 space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border p-8 bg-surface space-y-3">
                <HelpCircle className="h-10 w-10 text-muted mx-auto" />
                <h3 className="text-lg font-serif">No matching questions found</h3>
                <p className="text-sm text-muted max-w-md mx-auto">
                  Try adjusting your search query or select another category from the sidebar.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                const CategoryIcon = CATEGORY_ICONS[faq.category] || Bookmark;

                return (
                  <div
                    key={faq.id}
                    className="border border-border bg-surface transition-all duration-200 shadow-xs hover:border-primary/40"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-background/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="p-1.5 bg-background border border-border text-secondary shrink-0 mt-0.5">
                          <CategoryIcon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <h3 className="text-sm md:text-base font-medium text-primary leading-snug">
                            {faq.question}
                          </h3>
                          <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wider text-muted/80">
                            {faq.category}
                          </span>
                        </div>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-muted shrink-0 transition-transform duration-200 mt-1 ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 text-xs md:text-sm text-muted leading-relaxed border-t border-border/60 bg-background/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer Help Banner */}
        <div className="mt-14 border border-border bg-surface p-8 text-center space-y-3 shadow-xs">
          <MessageSquare className="h-7 w-7 text-secondary mx-auto" />
          <h2 className="text-lg font-serif text-primary">Need additional editorial or technical support?</h2>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Contact the Filamerian Journals office directly for manuscript inquiries or technical assistance.
          </p>
          <div className="pt-2">
            <a
              href="mailto:support@filamer.edu.ph"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Contact Support Office <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
