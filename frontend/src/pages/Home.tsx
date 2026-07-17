import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { ChevronRight } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layout/PageWrapper';

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

const DEFAULT_ABOUT_US = '<div class="text-center max-w-4xl mx-auto space-y-4 pb-4 border-b border-border mb-4">\n  <h2 class="text-xl font-bold uppercase tracking-wider text-primary">About Us</h2>\n  <p class="text-[14px] text-muted leading-relaxed">\n    <strong>The Filamerian Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n  </p>\n</div>';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
  const [aboutUsHtml, setAboutUsHtml] = useState<string>(DEFAULT_ABOUT_US);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Instantly load from localStorage (Stale-While-Revalidate)
      const cachedHome = localStorage.getItem('filamerian_home_cache');
      if (cachedHome) {
        try {
          const { journals: cJournals, announcements: cAnn, settings: cSettings } = JSON.parse(cachedHome);
          if (cJournals) setJournals(cJournals);
          if (cAnn) setAnnouncements(cAnn);
          if (cSettings) {
            const catsString = cSettings.journal_categories || 'Science, Education, Arts, Multidisciplinary';
            const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
            setAvailableCategories(['All', ...catsArray]);
            if (cSettings.home_about_us) {
              setAboutUsHtml(cSettings.home_about_us);
            }
          }
          setLoading(false); // Stop loading spinner instantly if cache exists
        } catch(e) {}
      }

      // 2. Fetch fresh data in the background
      try {
        const [jrnRes, annRes, setRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/announcements'),
          api.get('/public/settings')
        ]);
        
        const freshJournals = jrnRes.data.data;
        const freshAnnouncements = annRes.data.data.slice(0, 3);
        const freshSettings = setRes.data.data;

        setJournals(freshJournals);
        setAnnouncements(freshAnnouncements);
        
        // Update Local Cache
        localStorage.setItem('filamerian_home_cache', JSON.stringify({
          journals: freshJournals,
          announcements: freshAnnouncements,
          settings: freshSettings
        }));

        const catsString = freshSettings.journal_categories || 'Science, Education, Arts, Multidisciplinary';
        const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
        setAvailableCategories(['All', ...catsArray]);
        
        if (freshSettings.home_about_us) {
          setAboutUsHtml(freshSettings.home_about_us);
        } else {
          setAboutUsHtml(DEFAULT_ABOUT_US);
        }
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
    <PageWrapper className="flex flex-col pb-16 pt-8">
      {/* About Us Section (Dynamic HTML) */}
      {aboutUsHtml && (
        <div 
          className="w-full px-2 lg:px-6"
          dangerouslySetInnerHTML={{ __html: aboutUsHtml }} 
        />
      )}

      <div className="w-full px-2 lg:px-6 flex-1 flex flex-col mt-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          {/* Journals Grid */}
          <div className="lg:col-span-9 flex flex-col space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4 overflow-x-auto">
              <h2 className="text-lg font-bold uppercase tracking-wider shrink-0 mr-8">
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

            <div className="flex-1 flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
                  <Spinner text="Loading journals..." />
                </div>
              ) : filteredJournals.length === 0 ? (
                <EmptyState title="No journals" description="No journals in this category." className="flex-1 flex flex-col items-center justify-center py-12 border border-border bg-surface mt-4 min-h-[40vh]" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredJournals.map((j) => {
                    const latestVol = j.volumes?.[0];
                    
                    return (
                      <JournalCard
                        key={j.id}
                        slug={j.slug}
                        title={j.title}
                        description={j.description}
                        date={latestVol?.year ? latestVol.year.toString() : new Date(j.created_at).getFullYear().toString()}
                        volume={j.volumes?.length ? `${j.volumes.length} Volume/s` : 'No Volumes'}
                        image={j.cover_image ? `${STORAGE_URL}${j.cover_image}` : undefined}
                        category={j.category}
                      />
                    );
                  })}
                </div>
              )}
            </div>

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
          <div className="lg:col-span-3 h-full">
            {/* Announcements */}
            <div className="border border-border bg-surface p-6 h-full flex flex-col">
              <Link to="/announcements" className="flex items-center justify-between mb-6 pb-3 border-b border-border group">
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                  Announcements
                </h3>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </Link>

              {loading ? (
                <Spinner text="Loading news..." size="sm" className="py-8" />
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
                className="w-full mt-auto text-[12px] font-medium text-muted hover:text-primary uppercase tracking-wider transition-colors text-center border-t border-border pt-4 block"
              >
                See All News
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Home;
