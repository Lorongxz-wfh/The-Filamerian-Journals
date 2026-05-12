import React, { useState } from 'react';
import JournalCard from '@/components/ui/JournalCard';
import { Search } from 'lucide-react';
import { journals } from '@/data/journals';

const categories = ['All', 'Science', 'Education', 'Arts', 'Multidisciplinary'] as const;

const Journals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = journals.filter((j) => {
    const matchesCategory = activeTab === 'All' || j.category === activeTab;
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container-custom py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl uppercase tracking-wider">Our Journals</h1>
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

      {/* Category Tabs */}
      <div className="flex gap-1 border border-border bg-surface w-fit">
        {categories.map((cat) => (
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((journal) => (
          <JournalCard
            key={journal.id}
            slug={journal.slug}
            title={journal.title}
            description={journal.description}
            image={journal.image}
            date={journal.date}
            volume={journal.latestVolume}
            issue={journal.latestIssue}
            category={journal.category}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center border border-border bg-surface">
          <p className="text-[13px] text-muted">No journals found.</p>
        </div>
      )}

      <p className="text-[11px] text-muted">Showing {filtered.length} of {journals.length} journals</p>
    </div>
  );
};

export default Journals;
