import React, { useState, useEffect } from 'react';
import JournalCard from '@/components/ui/JournalCard';
import { Search, LayoutGrid, List } from 'lucide-react';
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
  publisher: string | null;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
}

const Journals: React.FC = () => {
  const initialJournals = JSON.parse(localStorage.getItem('journals_cache') || '[]');
  const initialCategories = JSON.parse(localStorage.getItem('categories_cache') || '["All"]');

  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [journals, setJournals] = useState<Journal[]>(initialJournals);
  const [availableCategories, setAvailableCategories] = useState<string[]>(initialCategories);
  const [loading, setLoading] = useState(initialJournals.length === 0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const [jrnRes, setRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/settings')
        ]);
        
        const newJournals = jrnRes.data.data;
        setJournals(newJournals);
        localStorage.setItem('journals_cache', JSON.stringify(newJournals));
        
        const catsString = setRes.data.data.journal_categories || 'Science, Education, Arts, Multidisciplinary';
        const catsArray = catsString.split(',').map((s: string) => s.trim()).filter(Boolean);
        const newCategories = ['All', ...catsArray];
        setAvailableCategories(newCategories);
        localStorage.setItem('categories_cache', JSON.stringify(newCategories));
      } catch (err) {
        console.error('Failed to fetch journals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, []);

  const filtered = journals.filter((j) => {
    const matchesCategory = activeTab === 'All' || j.category === activeTab;
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <PageWrapper className="pt-6 pb-12 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl uppercase tracking-wider font-bold">Our Journals</h1>
          <p className="text-[14px] text-muted max-w-xl leading-relaxed">
            Explore our collection of peer-reviewed journals spanning science,
            education, theology, and the humanities.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
          <input
            type="text"
            placeholder="Search journals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs & View Toggle */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex gap-1 border border-border bg-surface w-fit flex-wrap">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 text-[12px] font-medium transition-colors ${
                activeTab === cat
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center border border-border bg-surface rounded-sm h-[38px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 h-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 h-full flex items-center justify-center transition-colors border-l border-border ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid / List */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
            <Spinner text="Loading journals..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No journals found" description="No journals matched your search criteria." className="py-20 border border-border bg-surface" />
        ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col w-full max-w-5xl mx-auto"}>
          {filtered.map((j) => {
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
                publisher={j.publisher || undefined}
                viewMode={viewMode}
              />
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-[11px] text-muted mt-8">Showing {filtered.length} of {journals.length} journals</p>
      )}
      </div>
    </PageWrapper>
  );
};

export default Journals;
