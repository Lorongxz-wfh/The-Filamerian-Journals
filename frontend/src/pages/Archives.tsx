import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronDown, BookOpen, Calendar, FileText, ExternalLink, Quote } from 'lucide-react';
import api from '@/services/api';
import CitationModal from '@/components/ui/CitationModal';

interface Author {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  abstract: string | null;
  doi: string | null;
  page_start: number | null;
  page_end: number | null;
  pdf_path: string | null;
  authors: Author[];
}

interface Issue {
  id: number;
  issue_number: number;
  published_at: string;
  articles: Article[];
}

interface Volume {
  id: number;
  volume_number: number;
  year: number;
  issues: Issue[];
}

interface Journal {
  id: number;
  slug: string;
  title: string;
  category: string;
  issn: string;
  volumes: Volume[];
}

const Archives: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  // Citation Modal State
  const [citationArticle, setCitationArticle] = useState<any>(null);
  const [citationContext, setCitationContext] = useState<any>({});
  const [expandedJournal, setExpandedJournal] = useState<number | null>(null);
  const [expandedVolume, setExpandedVolume] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await api.get('/public/journals?with_volumes=1');
        const data = res.data.data;
        setJournals(data);
        if (data.length > 0) {
          setExpandedJournal(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch archives', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, []);

  const toggleJournal = (id: number) => {
    setExpandedJournal(expandedJournal === id ? null : id);
    setExpandedVolume(null);
  };

  const toggleVolume = (key: string) => {
    setExpandedVolume(expandedVolume === key ? null : key);
  };

  const totalArticles = journals.reduce(
    (sum, j) => sum + (j.volumes?.reduce(
      (vs, v) => vs + (v.issues?.reduce((is, i) => is + (i.articles?.length || 0), 0) || 0), 0
    ) || 0), 0
  );

  return (
    <div className="container-custom py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider">Archives</h1>
        <p className="text-[14px] text-muted max-w-xl leading-relaxed mt-2">
          Browse past volumes and issues across all journals.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
        {[
          { label: 'Journals', value: journals.length },
          { label: 'Volumes', value: journals.reduce((s, j) => s + (j.volumes?.length || 0), 0) },
          { label: 'Issues', value: journals.reduce((s, j) => s + (j.volumes?.reduce((vs, v) => vs + (v.issues?.length || 0), 0) || 0), 0) },
          { label: 'Articles', value: totalArticles },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4 text-center">
            <p className="text-xl font-semibold text-primary">{s.value}</p>
            <p className="text-[11px] text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Journal Accordion */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-muted">Loading archives...</div>
        ) : journals.length === 0 ? (
          <div className="py-20 text-center border border-border bg-surface text-muted text-[13px]">No journals found.</div>
        ) : (
          journals.map((journal) => {
            const isOpen = expandedJournal === journal.id;
            const articleCount = journal.volumes?.reduce(
              (s, v) => s + (v.issues?.reduce((is, i) => is + (i.articles?.length || 0), 0) || 0), 0
            ) || 0;

            return (
              <div key={journal.id} className="border border-border bg-surface">
                {/* Journal Header */}
                <button
                  onClick={() => toggleJournal(journal.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <BookOpen className="h-4 w-4 text-primary/30 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[14px] font-medium text-primary block truncate">{journal.title}</span>
                      <span className="text-[11px] text-muted">
                        {journal.volumes?.length || 0} volume{(journal.volumes?.length || 0) !== 1 ? 's' : ''} · {articleCount} articles · ISSN {journal.issn || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-[11px] text-muted bg-background px-2 py-0.5">{journal.category || 'Uncategorized'}</span>
                    <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="border-t border-border">
                    {journal.volumes?.length === 0 && (
                      <div className="px-6 py-6 text-[12px] text-muted text-center bg-background">No volumes available.</div>
                    )}
                    {journal.volumes?.map((vol) => {
                      const volKey = `${journal.id}-${vol.volume_number}`;
                      const volOpen = expandedVolume === volKey;

                      return (
                        <div key={vol.id} className="border-b border-border last:border-b-0">
                          {/* Volume Row */}
                          <button
                            onClick={() => toggleVolume(volKey)}
                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-background/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-semibold text-primary">Volume {vol.volume_number}</span>
                              <span className="text-[11px] text-muted">({vol.year})</span>
                              <span className="text-[11px] text-muted/60">
                                — {vol.issues?.length || 0} issue{(vol.issues?.length || 0) !== 1 ? 's' : ''}, {vol.issues?.reduce((s, i) => s + (i.articles?.length || 0), 0) || 0} articles
                              </span>
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${volOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Issues + Articles */}
                          {volOpen && (
                            <div className="bg-background">
                              {vol.issues?.map((issue) => (
                                <div key={issue.id} className="border-t border-border">
                                  <div className="px-6 py-2.5 flex items-center gap-2 bg-background border-b border-border">
                                    <Calendar className="h-3.5 w-3.5 text-secondary" />
                                    <span className="text-[12px] font-semibold text-primary">Issue {issue.issue_number}</span>
                                    <span className="text-[11px] text-muted">— Published: {issue.published_at}</span>
                                    <span className="text-[11px] text-muted/50 ml-auto">{issue.articles?.length || 0} articles</span>
                                  </div>

                                  <div className="divide-y divide-border">
                                    {issue.articles?.map((article) => (
                                      <div key={article.id} className="px-8 py-3 hover:bg-surface transition-colors group cursor-pointer">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-3.5 w-3.5 text-primary/20 shrink-0" />
                                              <h4 className="text-[13px] font-medium text-primary group-hover:text-secondary transition-colors truncate">
                                                {article.title}
                                              </h4>
                                            </div>
                                            <p className="text-[11px] text-muted mt-0.5 pl-5">
                                              {article.authors?.map(a => a.name).join(', ') || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 pl-5 text-[10px] text-muted/50">
                                              {article.page_start && article.page_end && (
                                                <span>pp. {article.page_start}-{article.page_end}</span>
                                              )}
                                              {article.doi && <span>DOI: {article.doi}</span>}
                                              
                                              <button
                                                onClick={() => {
                                                  setCitationArticle(article);
                                                  setCitationContext({
                                                    journalTitle: journal.title,
                                                    volumeNumber: vol.volume_number,
                                                    issueNumber: issue.issue_number,
                                                    year: vol.year
                                                  });
                                                }}
                                                className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1"
                                              >
                                                <Quote className="h-3 w-3" /> Cite
                                              </button>
                                            </div>
                                          </div>
                                          {article.pdf_path && (
                                            localStorage.getItem('token') ? (
                                              <button 
                                                onClick={async () => {
                                                  try {
                                                    const res = await api.get(`/articles/${article.id}/download-url`);
                                                    window.open(res.data.url, '_blank');
                                                  } catch (err) {
                                                    console.error('Failed to get download URL', err);
                                                  }
                                                }}
                                                className="flex items-center gap-1 text-[11px] text-secondary hover:underline opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                              >
                                                <ExternalLink className="h-3 w-3" /> PDF
                                              </button>
                                            ) : (
                                              <Link 
                                                to="/login"
                                                className="flex items-center gap-1 text-[11px] text-muted hover:underline opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                                title="Login required to download PDF"
                                              >
                                                <ExternalLink className="h-3 w-3" /> PDF (Login)
                                              </Link>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {issue.articles?.length === 0 && (
                                      <div className="px-8 py-3 text-[11px] text-muted">No articles found in this issue.</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {vol.issues?.length === 0 && (
                                <div className="px-6 py-4 text-[12px] text-muted bg-background">No issues available.</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Link to full journal */}
                    <Link
                      to={`/journals/${journal.slug}`}
                      className="block px-6 py-3 text-[12px] font-medium text-primary/50 hover:text-primary transition-colors text-center border-t border-border"
                    >
                      View full journal →
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CitationModal 
        isOpen={!!citationArticle}
        onClose={() => setCitationArticle(null)}
        article={citationArticle}
        journalTitle={citationContext.journalTitle}
        volumeNumber={citationContext.volumeNumber}
        issueNumber={citationContext.issueNumber}
        year={citationContext.year}
      />
    </div>
  );
};

export default Archives;
