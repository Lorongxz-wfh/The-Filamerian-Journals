import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, BookOpen, Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import axios from 'axios';

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
  description: string;
  category: string;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  volumes: Volume[];
}

const JournalDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVol, setExpandedVol] = useState<number | null>(null);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/public/journals/${slug}`);
        const data = res.data.data;
        setJournal(data);
        if (data.volumes?.length > 0) {
          setExpandedVol(data.volumes[0].volume_number);
        }
      } catch (err) {
        console.error('Failed to fetch journal', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [slug]);

  if (loading) {
    return <div className="container-custom py-20 text-center text-muted">Loading journal...</div>;
  }

  if (!journal) {
    return (
      <div className="container-custom py-20 text-center">
        <p className="text-muted text-sm">Journal not found.</p>
        <Link to="/journals" className="text-[13px] text-primary font-medium mt-4 inline-block hover:text-secondary transition-colors">
          ← Back to Journals
        </Link>
      </div>
    );
  }

  const totalArticles = journal.volumes?.reduce(
    (sum, v) => sum + (v.issues?.reduce((s, i) => s + (i.articles?.length || 0), 0) || 0), 0
  ) || 0;

  return (
    <div className="container-custom py-10 space-y-10">
      {/* Back Link */}
      <Link to="/journals" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-primary transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Journals
      </Link>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          {journal.cover_image ? (
            <img src={`http://127.0.0.1:8000/storage/${journal.cover_image}`} alt={journal.title} className="w-full aspect-[3/2] object-cover border border-border" />
          ) : (
            <div className="w-full aspect-[3/2] bg-surface border border-border flex items-center justify-center">
              <span className="text-muted text-[13px]">No Cover</span>
            </div>
          )}
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div>
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">{journal.category || 'Uncategorized'}</span>
            <h1 className="text-2xl uppercase tracking-wider mt-1">{journal.title}</h1>
          </div>
          <p className="text-[14px] text-muted leading-relaxed">{journal.description || 'No description available.'}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mt-4">
            {[
              { label: 'ISSN', value: journal.issn || '-' },
              { label: 'Frequency', value: journal.frequency || '-' },
              { label: 'Editor', value: journal.editor || '-' },
              { label: 'Articles', value: String(totalArticles) },
            ].map((m) => (
              <div key={m.label} className="bg-surface p-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{m.label}</p>
                <p className="text-[13px] font-medium text-primary mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Volumes & Issues */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider border-b border-border pb-3">
          Volumes & Issues
        </h2>

        {journal.volumes?.length === 0 && (
          <div className="py-12 text-center text-muted text-[13px]">No volumes published yet.</div>
        )}

        {journal.volumes?.map((vol) => (
          <div key={vol.id} className="border border-border bg-surface">
            <button
              onClick={() => setExpandedVol(expandedVol === vol.volume_number ? null : vol.volume_number)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-background transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-primary/30" />
                <span className="text-[14px] font-medium text-primary">
                  Volume {vol.volume_number} ({vol.year})
                </span>
                <span className="text-[11px] text-muted">
                  — {vol.issues?.length || 0} issue{(vol.issues?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted transition-transform ${expandedVol === vol.volume_number ? 'rotate-180' : ''}`} />
            </button>

            {expandedVol === vol.volume_number && (
              <div className="border-t border-border">
                {vol.issues?.map((issue) => (
                  <div key={issue.id} className="border-b border-border last:border-b-0">
                    <div className="px-5 py-3 bg-background flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      <span className="text-[12px] font-semibold text-primary">
                        Issue {issue.issue_number}
                      </span>
                      <span className="text-[11px] text-muted">— Published: {issue.published_at}</span>
                    </div>

                    {/* Articles Table */}
                    <div className="divide-y divide-border">
                      {issue.articles?.map((article) => (
                        <div key={article.id} className="px-5 py-4 hover:bg-background/50 transition-colors group cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-grow">
                              <h4 className="text-[13px] font-medium text-primary group-hover:text-secondary transition-colors leading-snug">
                                {article.title}
                              </h4>
                              <p className="text-[12px] text-muted mt-1">
                                {article.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
                              </p>
                              {article.abstract && (
                                <p className="text-[12px] text-muted/60 mt-2 leading-relaxed line-clamp-2">
                                  {article.abstract}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-[11px] text-muted/50">
                                {article.page_start && article.page_end && (
                                  <span>pp. {article.page_start}-{article.page_end}</span>
                                )}
                                {article.doi && <span>DOI: {article.doi}</span>}
                              </div>
                            </div>
                            <div className="shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                              {article.pdf_path && (
                                <a 
                                  href={`http://127.0.0.1:8000/storage/${article.pdf_path}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" /> PDF
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {issue.articles?.length === 0 && (
                        <div className="px-5 py-4 text-center text-[12px] text-muted">No articles in this issue.</div>
                      )}
                    </div>
                  </div>
                ))}
                {vol.issues?.length === 0 && (
                  <div className="px-5 py-4 text-center text-[12px] text-muted">No issues in this volume.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalDetail;
