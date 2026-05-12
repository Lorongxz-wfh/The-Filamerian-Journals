import React, { useState } from 'react';
import { Link } from 'react-router';
import JournalCard from '@/components/ui/JournalCard';
import { ChevronRight } from 'lucide-react';
import { journals } from '@/data/journals';

const categories = ['All', 'Science', 'Education', 'Arts'] as const;

const announcements = [
  { date: 'April 11, 2024', title: 'Call for Papers: Special Issue on Community Resilience and Health' },
  { date: 'March 28, 2024', title: 'FCU Multidisciplinary Research Journal Now Indexed in ASEAN Citation Index' },
  { date: 'March 20, 2024', title: 'Editorial Board Meeting — April 2024' },
];

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');

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
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg uppercase tracking-wider">
                Academic Journals
              </h2>
              <div className="flex gap-6">
                {categories.map((cat) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJournals.map((j) => (
                <JournalCard
                  key={j.id}
                  slug={j.slug}
                  title={j.title}
                  description={j.description}
                  date={j.date}
                  volume={j.latestVolume}
                  issue={j.latestIssue}
                  image={j.image}
                />
              ))}
            </div>

            {filteredJournals.length === 0 && (
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

              <div className="space-y-6">
                {announcements.map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                      {item.date}
                    </span>
                    <h4 className="text-[13px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mt-1">
                      {item.title}
                    </h4>
                    {i < announcements.length - 1 && <div className="border-b border-border mt-4" />}
                  </div>
                ))}
              </div>

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
                {['Submission Guidelines', 'Editorial Board', 'Ethics & Malpractice', 'Indexing & Abstracting'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[13px] text-muted hover:text-primary flex items-center justify-between group transition-colors">
                      {link}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </a>
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
