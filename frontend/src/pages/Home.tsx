import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { ChevronRight } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';

// Dynamic categories fetched from API

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jrnRes, annRes, setRes, resRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/announcements'),
          api.get('/public/settings'),
          api.get('/public/resources')
        ]);
        setJournals(jrnRes.data.data);
        setAnnouncements(annRes.data.data.slice(0, 3));
        
        const catsString = setRes.data.data.journal_categories || 'Science, Education, Arts, Multidisciplinary';
        const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
        setAvailableCategories(['All', ...catsArray]);
        
        setResources(resRes.data.data);
      } catch (err) {
        console.error('Failed to fetch public data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredJournals = activeTab === 'All'
    ? journals
    : journals.filter((j) =>
        j.category === activeTab || (activeTab === 'All')
      );

  return (
    <div className="flex flex-col gap-16 pb-16 pt-10">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Journals Grid */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4 overflow-x-auto">
              <h2 className="text-lg uppercase tracking-wider shrink-0 mr-8">
                Academic Journals
              </h2>
              <div className="flex gap-6 shrink-0">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`text-[12px] font-medium pb-1 transition-colors ${
                      activeTab === cat
                        ? 'font-semibold text-primary border-b-2 border-primary'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted text-sm">Loading journals...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournals.map((j) => {
                  const latestVol = j.volumes?.[0];
                  const latestIssue = latestVol?.issues?.[0];
                  
                  return (
                    <JournalCard
                      key={j.id}
                      slug={j.slug}
                      title={j.title}
                      description={j.description}
                      date={new Date(j.created_at).toLocaleDateString()}
                      volume={latestVol ? `Vol. ${latestVol.volume_number}` : ''}
                      issue={latestIssue ? `Issue ${latestIssue.issue_number}` : ''}
                      image={j.cover_image ? `${STORAGE_URL}${j.cover_image}` : undefined}
                      category={j.category}
                    />
                  );
                })}
              </div>
            )}

            {!loading && filteredJournals.length === 0 && (
              <div className="py-12 text-center border border-border bg-surface">
                <p className="text-[13px] text-muted">No journals in this category.</p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Link
                to="/journals"
                className="px-6 py-2.5 border border-border text-[13px] font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                View All Publications
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            {/* Announcements */}
            <div className="border border-border bg-surface p-6">
              <Link to="/announcements" className="flex items-center justify-between mb-6 pb-3 border-b border-border group">
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                  Announcements
                </h3>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </Link>

              {loading ? (
                <div className="text-center text-muted text-xs py-4">Loading news...</div>
              ) : (
                <div className="space-y-6">
                  {announcements.map((item, i) => (
                    <Link to="/announcements" key={item.id} className="group block">
                      <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="text-[13px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mt-1">
                        {item.title}
                      </h4>
                      {i < announcements.length - 1 && <div className="border-b border-border mt-4" />}
                    </Link>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-xs text-muted">No announcements posted.</p>
                  )}
                </div>
              )}

              <Link
                to="/announcements"
                className="w-full mt-6 text-[12px] font-medium text-muted hover:text-primary uppercase tracking-wider transition-colors text-center border-t border-border pt-4 block"
              >
                See All News
              </Link>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-grow bg-border" />
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Resources</h3>
                <div className="h-px flex-grow bg-border" />
              </div>

              <ul className="space-y-3">
                {resources.map((res: any) => (
                  <li key={res.id}>
                    <Link to={`/about#${res.slug}`} className="text-[13px] text-muted hover:text-primary flex items-center justify-between group transition-colors">
                      {res.title}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
