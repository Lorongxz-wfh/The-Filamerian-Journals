import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, ShieldCheck, Award, CheckCircle, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';

interface Resource {
  id: number;
  title: string;
  slug: string;
  content: string;
  order: number;
}

const getResourceIcon = (slug: string) => {
  if (slug.includes('submission')) return FileText;
  if (slug.includes('editorial')) return BookOpen;
  if (slug.includes('ethics')) return ShieldCheck;
  if (slug.includes('indexing')) return Award;
  return FileText;
};

const About: React.FC = () => {
  const location = useLocation();
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = location.hash.replace('#', '');
    return hash || '';
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/public/resources');
        const data = res.data.data;
        setResources(data);
        
        if (!activeTab || !data.find((r: Resource) => r.slug === activeTab)) {
          const hash = location.hash.replace('#', '');
          if (hash && data.find((r: Resource) => r.slug === hash)) {
            setActiveTab(hash);
          } else if (data.length > 0) {
            setActiveTab(data[0].slug);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [location.hash, activeTab]);

  const activeResource = resources.find(r => r.slug === activeTab);
  const IconComponent = activeResource ? getResourceIcon(activeResource.slug) : FileText;

  return (
    <PageWrapper className="flex flex-col">
      {/* Page Header */}
      <PageHeader title="About Us" className="mb-8" />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-24">
          <div className="border border-border bg-surface shadow-xs">
            <div className="px-4 py-3 border-b border-border bg-background/50">
              <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Documentation & Guidelines
              </h3>
            </div>
            
            <div className="p-1.5 space-y-1">
              {loading ? (
                <Spinner text="Loading..." size="sm" className="py-6" />
              ) : resources.length === 0 ? (
                <EmptyState title="No resources" description="No documentation published." className="p-4 border-0" />
              ) : (
                resources.map((res) => {
                  const ItemIcon = getResourceIcon(res.slug);
                  const isActive = activeTab === res.slug;
                  return (
                    <button
                      key={res.id}
                      onClick={() => {
                        setActiveTab(res.slug);
                        window.history.replaceState(null, '', `#${res.slug}`);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 text-[13px] font-medium transition-all group ${
                        isActive
                          ? 'bg-primary text-white shadow-xs font-semibold'
                          : 'text-muted hover:text-primary hover:bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ItemIcon className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-secondary' : 'text-muted/60 group-hover:text-primary'
                        }`} />
                        <span className="truncate">{res.title}</span>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isActive ? 'text-white translate-x-0.5' : 'text-muted/40 opacity-0 group-hover:opacity-100'
                      }`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 w-full min-w-0">
          <div className="bg-surface border border-border shadow-xs overflow-hidden min-h-[500px] flex flex-col">
            {/* Content Top Bar */}
            {activeResource && (
              <div className="px-6 py-4 border-b border-border bg-background/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-[14px] font-bold text-primary uppercase tracking-wider">
                  {activeResource.title}
                </h2>
              </div>
            )}

            {/* Main Article Body with Animation */}
            <div className="p-6 sm:p-8 lg:p-10 flex-1">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <Spinner text="Loading documentation..." />
                </div>
              ) : activeResource ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeResource.slug}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="prose prose-sm max-w-none 
                      prose-headings:font-display prose-headings:font-bold prose-headings:text-primary prose-headings:uppercase prose-headings:tracking-wider 
                      prose-h2:text-[16px] prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-6 prose-h2:mb-4
                      prose-h3:text-[14px] prose-h3:mt-4 prose-h3:mb-2
                      prose-p:text-muted prose-p:leading-relaxed prose-p:text-[13.5px]
                      prose-li:text-muted prose-li:text-[13.5px] prose-li:marker:text-primary
                      prose-strong:text-primary prose-strong:font-semibold
                      prose-a:text-secondary prose-a:underline hover:prose-a:text-primary
                      prose-blockquote:border-l-2 prose-blockquote:border-secondary prose-blockquote:bg-primary/5 prose-blockquote:p-4 prose-blockquote:not-italic prose-blockquote:text-primary/90"
                    dangerouslySetInnerHTML={{ __html: activeResource.content || '' }}
                  />
                </AnimatePresence>
              ) : (
                <div className="flex items-center justify-center h-full text-muted text-[13px] py-20">
                  Select a policy or guideline from the documentation menu.
                </div>
              )}
            </div>

            {/* Bottom Footer Notice inside Card */}
            <div className="px-6 py-4 border-t border-border bg-background/30 flex flex-wrap items-center justify-between text-[11.5px] text-muted gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Filamer Christian University Academic Standard</span>
              </div>
              <span className="font-mono text-[11px]">Updated Annually</span>
            </div>
          </div>
        </main>
      </div>
    </PageWrapper>
  );
};

export default About;
