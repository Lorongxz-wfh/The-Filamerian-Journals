import React, { useState } from 'react';
import { FileText, Plus, Search, ExternalLink } from 'lucide-react';

interface ArticleItem {
  id: number;
  title: string;
  journal: string;
  authors: string;
  status: 'Published' | 'Pending' | 'Revision';
  submittedAt: string;
}

const demoArticles: ArticleItem[] = [
  { id: 1, title: 'Community Resilience in Post-Pandemic Capiz', journal: 'FCU Multidisciplinary Research Journal', authors: 'Santos, J.; Reyes, M.', status: 'Published', submittedAt: '2024-02-10' },
  { id: 2, title: 'Pedagogical Innovations in Faith-Based Education', journal: 'Journal of Christian Education', authors: 'Dela Cruz, A.', status: 'Published', submittedAt: '2024-01-22' },
  { id: 3, title: 'AI-Driven Approaches to Marine Biodiversity Monitoring', journal: 'The Filamerian Science Review', authors: 'Garcia, R.; Lim, K.', status: 'Pending', submittedAt: '2024-03-05' },
  { id: 4, title: 'Sustainable Supply Chain Models for Island Economies', journal: 'Business & Management Insights', authors: 'Villanueva, P.', status: 'Revision', submittedAt: '2024-03-12' },
  { id: 5, title: 'Cultural Heritage Preservation through Digital Archives', journal: 'Arts & Humanities Quarterly', authors: 'Bautista, L.; Tan, S.', status: 'Pending', submittedAt: '2024-03-18' },
  { id: 6, title: 'Effects of Blended Learning on Student Engagement', journal: 'Journal of Christian Education', authors: 'Ramos, E.', status: 'Published', submittedAt: '2024-01-05' },
];

const statusColor: Record<string, string> = {
  Published: 'text-emerald-600 bg-emerald-50',
  Pending: 'text-amber-600 bg-amber-50',
  Revision: 'text-rose-600 bg-rose-50',
};

const Articles: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'Published' | 'Pending' | 'Revision'>('all');

  const filtered = demoArticles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(filter.toLowerCase()) ||
      a.authors.toLowerCase().includes(filter.toLowerCase());
    const matchesTab = tab === 'all' || a.status === tab;
    return matchesSearch && matchesTab;
  });

  const tabs = [
    { key: 'all' as const, label: 'All', count: demoArticles.length },
    { key: 'Published' as const, label: 'Published', count: demoArticles.filter((a) => a.status === 'Published').length },
    { key: 'Pending' as const, label: 'Pending', count: demoArticles.filter((a) => a.status === 'Pending').length },
    { key: 'Revision' as const, label: 'Revision', count: demoArticles.filter((a) => a.status === 'Revision').length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">Articles</h1>
          <p className="text-[13px] text-muted mt-1">Manage research paper submissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          Submit Article
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 border border-border bg-surface">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-[12px] font-medium transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {t.label} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
          <input
            type="text"
            placeholder="Search articles..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Journal</th>
              <th className="px-5 py-3">Authors</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted">
                  No articles found.
                </td>
              </tr>
            ) : (
              filtered.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-border last:border-b-0 hover:bg-background transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary/20 shrink-0" />
                      <span className="text-[13px] font-medium text-primary truncate max-w-[260px]">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted truncate max-w-[180px]">{article.journal}</td>
                  <td className="px-5 py-4 text-[12px] text-muted">{article.authors}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2 py-1 ${statusColor[article.status]}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted">{article.submittedAt}</td>
                  <td className="px-5 py-4">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted/40 hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted">Showing {filtered.length} of {demoArticles.length} articles</p>
    </div>
  );
};

export default Articles;
