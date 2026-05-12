import React, { useState } from 'react';
import { BookOpen, Plus, Search, MoreVertical } from 'lucide-react';

interface JournalItem {
  id: number;
  title: string;
  status: 'Published' | 'Draft' | 'Under Review';
  articles: number;
  lastUpdated: string;
}

const demoJournals: JournalItem[] = [
  { id: 1, title: 'FCU Multidisciplinary Research Journal', status: 'Published', articles: 42, lastUpdated: '2024-03-15' },
  { id: 2, title: 'Journal of Christian Education', status: 'Published', articles: 28, lastUpdated: '2024-02-20' },
  { id: 3, title: 'The Filamerian Science Review', status: 'Under Review', articles: 15, lastUpdated: '2024-03-01' },
  { id: 4, title: 'Business & Management Insights', status: 'Draft', articles: 8, lastUpdated: '2024-01-10' },
  { id: 5, title: 'Arts & Humanities Quarterly', status: 'Draft', articles: 3, lastUpdated: '2024-03-20' },
];

const statusColor: Record<string, string> = {
  Published: 'text-emerald-600 bg-emerald-50',
  Draft: 'text-amber-600 bg-amber-50',
  'Under Review': 'text-blue-600 bg-blue-50',
};

const MyJournals: React.FC = () => {
  const [filter, setFilter] = useState('');
  const filtered = demoJournals.filter((j) =>
    j.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">My Journals</h1>
          <p className="text-[13px] text-muted mt-1">Manage your journal publications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          New Journal
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input
          type="text"
          placeholder="Filter journals..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="border border-border bg-surface">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-center">Articles</div>
          <div className="col-span-2">Last Updated</div>
          <div className="col-span-1"></div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">No journals found.</div>
        ) : (
          filtered.map((journal) => (
            <div
              key={journal.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-background transition-colors group cursor-pointer"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                <span className="text-[13px] font-medium text-primary truncate">{journal.title}</span>
              </div>
              <div className="col-span-2">
                <span className={`text-[11px] font-semibold px-2 py-1 ${statusColor[journal.status]}`}>
                  {journal.status}
                </span>
              </div>
              <div className="col-span-2 text-center text-[13px] text-muted">{journal.articles}</div>
              <div className="col-span-2 text-[13px] text-muted">{journal.lastUpdated}</div>
              <div className="col-span-1 flex justify-end">
                <button className="h-7 w-7 flex items-center justify-center text-muted/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-muted">Showing {filtered.length} of {demoJournals.length} journals</p>
    </div>
  );
};

export default MyJournals;
