import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';
import DOMPurify from 'dompurify';
import api, { getFileUrl } from '@/services/api';
import { Seo } from '@/components/ui/Seo';
import PageWrapper from '@/components/layout/PageWrapper';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSettings } from '@/contexts/SettingsContext';

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: any;
  cover_image: string | null;
  volumes?: any[];
  created_at: string;
  updated_at: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

interface Article {
  id: number;
  title: string;
  abstract: string;
  authors?: { name: string }[];
  volume?: { journal?: { title: string } };
  created_at: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jrnRes, latestRes, annRes, catRes] = await Promise.all([
          api.get('/public/journals?with_volumes=1'),
          api.get('/public/articles/latest'),
          api.get('/public/announcements'),
          api.get('/public/categories'),
        ]);

        setJournals(jrnRes.data.data || []);
        setLatestArticles(latestRes.data.data || []);
        setAnnouncements((annRes.data.data || []).slice(0, 3));
        setCategoriesList((catRes.data.data || []).map((c: any) => c.name));
      } catch (err) {
        console.error('Failed to fetch home page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPublishedArticles = useMemo(() => {
    return journals.reduce((sum, j) => {
      const volArticles = j.volumes?.reduce(
        (vSum, v) => vSum + (v.articles_count || v.articles?.length || 0),
        0
      ) || 0;
      return sum + volArticles;
    }, 0);
  }, [journals]);

  const recentJournals = useMemo(
    () =>
      [...journals]
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 6),
    [journals]
  );

  const siteTitle = settings.site_title || 'The Filamerian Journals';
  // Priority: settings.about_us → settings.home_about_us → hardcoded FCU default
  const aboutHtml = settings.about_us || settings.home_about_us || '';;

  return (
    <PageWrapper className="flex flex-col relative pb-16">
      <Seo
        title="Home"
        description={`${siteTitle} — Official online database of academic journals, faculty research, theses, and case studies.`}
      />

      <div className="space-y-12 w-full">

        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Site intro + search + stats */}
          <div className="lg:col-span-8 border border-border bg-surface p-8 lg:p-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-secondary text-[11px] font-bold uppercase tracking-widest">
                <span>Filamer Christian University</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-primary leading-tight">
                {siteTitle}
              </h1>

              {aboutHtml ? (
                <div
                  className="text-muted text-sm leading-relaxed max-w-xl prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aboutHtml) }}
                />
              ) : (
                <p className="text-muted text-sm leading-relaxed max-w-xl">
                  The Filamerian Journals is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.
                </p>
              )}

              {/* Hero Search */}
              <form onSubmit={handleHeroSearch} className="flex items-center gap-2 max-w-xl pt-1">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    placeholder="Search articles, keywords, authors, or DOI..."
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border text-xs text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-colors shrink-0 flex items-center gap-1.5"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Live Stats */}
            <div className="pt-5 flex flex-wrap gap-8 border-t border-border mt-6">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </>
              ) : (
                <>
                  <div>
                    <div className="text-2xl font-bold text-primary font-mono">{journals.length}</div>
                    <div className="text-xs text-muted uppercase tracking-wider font-medium">Academic Journals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary font-mono">{totalPublishedArticles}</div>
                    <div className="text-xs text-muted uppercase tracking-wider font-medium">Published Papers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary font-mono">{categoriesList.length}</div>
                    <div className="text-xs text-muted uppercase tracking-wider font-medium">Research Fields</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Announcements Panel — Fixed height to match natural hero height without expanding */}
          <div className="lg:col-span-4 border border-border bg-background flex flex-col overflow-hidden h-[420px]">
            {/* Header Bar */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Announcements</span>
              </div>
              <Link to="/announcements" className="text-[9px] font-bold uppercase tracking-wider text-secondary hover:text-white transition-colors">
                All News →
              </Link>
            </div>

            {/* Announcements List */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between overflow-y-auto min-h-0">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5 py-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs font-semibold text-primary">No Active Bulletins</p>
                  <p className="text-[10px] text-muted">Check back later for updates.</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <Link to="/announcements" key={item.id} className="group block pb-2.5 border-b border-border/40 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-secondary bg-primary px-1.5 py-0.5 uppercase tracking-wider">
                        Notice
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-bold text-primary group-hover:text-secondary transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <div
                      className="text-[11px] text-muted line-clamp-3 prose prose-sm max-w-none mt-1 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body) }}
                    />
                  </Link>
                ))
              )}
            </div>

            {/* Footer Bar */}
            <div className="bg-surface px-4 py-2 border-t border-border flex items-center justify-between shrink-0">
              <span className="text-[9px] text-muted font-medium">FCU Official Bulletin</span>
              <Link to="/announcements" className="text-[10px] font-bold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-1 group">
                Read All <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Content Sections ─────────────────────────────────────── */}
        <div className="space-y-10 border-t border-border pt-8">

          {/* Latest Articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider text-primary">Latest Articles</h2>
              <Link to="/archives" className="text-xs font-bold text-muted hover:text-primary uppercase tracking-wider">
                Explore Archives →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border bg-surface p-5 h-[230px] space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : latestArticles.length === 0 ? (
              <p className="text-sm text-muted py-4">No articles published yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.slice(0, 3).map((art) => (
                  <Link
                    key={art.id}
                    to={`/articles/${art.id}`}
                    className="border border-border bg-surface p-5 hover:border-primary transition-colors flex flex-col justify-between h-[230px] group"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider inline-block">
                        {art.volume?.journal?.title || 'Journal Paper'}
                      </span>
                      <h4 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors uppercase line-clamp-2 mt-2.5">
                        {art.title}
                      </h4>
                      <p className="text-xs text-muted line-clamp-3">{art.abstract}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-primary pt-3 border-t border-border flex items-center justify-between">
                      Read Paper <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recently Updated Journals */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider text-primary">Recently Updated Journals</h2>
              <Link to="/journals" className="text-xs font-bold text-muted hover:text-primary uppercase tracking-wider">
                View All Journals →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-border bg-surface p-4 flex gap-4 items-center">
                    <Skeleton className="w-16 h-[84px] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentJournals.length === 0 ? (
              <p className="text-sm text-muted py-4">No journals available yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recentJournals.map((j) => (
                  <Link
                    key={j.id}
                    to={`/journals/${j.slug}`}
                    className="border border-border bg-surface p-4 flex gap-4 hover:border-primary hover:shadow-md transition-all group items-center"
                  >
                    {/* Journal Cover */}
                    <div className="w-16 h-[84px] shrink-0 bg-background border border-border overflow-hidden flex items-center justify-center p-1 shadow-xs">
                      {j.cover_image ? (
                        <img
                          src={getFileUrl(j.cover_image)}
                          alt={j.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-[9px] font-bold text-primary text-center uppercase line-clamp-3 leading-tight">
                          {j.title}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <span className="text-[9px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider inline-block">
                        {typeof j.category === 'object' && j.category !== null
                          ? (j.category as any).name
                          : j.category || 'Journal'}
                      </span>
                      <h4 className="text-[13px] font-bold text-primary group-hover:text-secondary transition-colors uppercase line-clamp-2 leading-snug">
                        {j.title}
                      </h4>
                      <span className="text-[11px] text-muted block font-mono">
                        {j.volumes?.length || 0} Volume{(j.volumes?.length || 0) !== 1 ? 's' : ''} Published
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Home;
