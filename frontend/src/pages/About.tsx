import React, { useState, useEffect } from 'react';
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

const About: React.FC = () => {
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
        
        // If we didn't have an active tab set from cache, set it now
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

  return (
    <PageWrapper className="flex flex-col">
      <PageHeader title="About Us" />

      <div className="flex-1 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 shrink-0">
          <div className="flex flex-col gap-1 border border-border bg-surface p-2 sticky top-24">
            {loading ? (
              <Spinner text="Loading..." size="sm" className="py-4" />
            ) : resources.length === 0 ? (
              <EmptyState title="No resources" description="No resources available." className="p-4" />
            ) : (
              resources.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setActiveTab(res.slug)}
                  className={`text-left px-4 py-2.5 text-[13px] font-bold transition-colors ${
                    activeTab === res.slug
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-primary hover:bg-background'
                  }`}
                >
                  {res.title}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:w-3/4 flex flex-col">
          <div className="flex-1 bg-surface border border-border p-8 lg:p-10 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Spinner text="Loading content..." />
              </div>
            ) : activeResource ? (
              <div 
                className="space-y-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:font-normal prose-headings:text-primary prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed prose-li:text-muted prose-a:text-secondary prose-blockquote:border prose-blockquote:border-border prose-blockquote:bg-primary/5 prose-blockquote:p-4 prose-blockquote:italic prose-blockquote:text-primary/80"
                dangerouslySetInnerHTML={{ __html: activeResource.content || '' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-[13px]">
                Select a topic from the sidebar.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default About;
