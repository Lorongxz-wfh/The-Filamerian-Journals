import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import api from '@/services/api';

interface Resource {
  id: number;
  title: string;
  slug: string;
  content: string;
  order: number;
}

const About: React.FC = () => {
  const location = useLocation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/public/resources');
        const data = res.data.data;
        setResources(data);
        
        // If hash is in URL, select that tab, else first tab
        const hash = location.hash.replace('#', '');
        if (hash && data.find((r: Resource) => r.slug === hash)) {
          setActiveTab(hash);
        } else if (data.length > 0) {
          setActiveTab(data[0].slug);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [location.hash]);

  const activeResource = resources.find(r => r.slug === activeTab);

  return (
    <div className="container-custom py-12 space-y-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider">About & Resources</h1>
        <p className="text-[14px] text-muted max-w-xl leading-relaxed mt-2">
          Information for authors, reviewers, and readers regarding our publication standards and policies.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 shrink-0">
          <div className="flex flex-col gap-1 border border-border bg-surface p-2 sticky top-24">
            {loading ? (
              <div className="p-4 text-center text-muted text-[13px]">Loading...</div>
            ) : resources.length === 0 ? (
              <div className="p-4 text-center text-muted text-[13px]">No resources available.</div>
            ) : (
              resources.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setActiveTab(res.slug)}
                  className={`text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
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

        <div className="lg:w-3/4">
          <div className="bg-surface border border-border p-8 lg:p-10 min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted">Loading content...</div>
            ) : activeResource ? (
              <div 
                className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed prose-li:text-muted prose-a:text-secondary"
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
    </div>
  );
};

export default About;
