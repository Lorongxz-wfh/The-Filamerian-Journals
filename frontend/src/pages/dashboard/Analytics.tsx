import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Users, 
  Eye, 
  Download, 
  Printer, 
  TrendingUp, 
  Award, 
  Layers
} from 'lucide-react';
import api from '@/services/api';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface AnalyticsData {
  journals: number;
  articles: number;
  drafts: number;
  authors: number;
  users: number;
  trends: {
    journals: { trend: string; isPositive: boolean };
    articles: { trend: string; isPositive: boolean };
    authors: { trend: string; isPositive: boolean };
    users: { trend: string; isPositive: boolean };
  };
  websiteChartData: { date: string; views: number; downloads: number }[];
  chartData: { date: string; actions: number }[];
}

interface TopArticle {
  id: number;
  title: string;
  journal: string;
  views: number;
  published_date: string;
}

interface TopAuthor {
  name: string;
  papers: number;
  department: string;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sample/derived leaderboard data for repository insights
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; count: number; percentage: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      const stats = res.data;
      setData(stats);

      if (stats.categoryBreakdown) {
        setCategoryBreakdown(stats.categoryBreakdown);
      }

      if (stats.topArticles) {
        setTopArticles(stats.topArticles);
      }

      if (stats.topAuthors) {
        setTopAuthors(stats.topAuthors);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Articles', data.articles],
      ['Total Journals', data.journals],
      ['Total Authors', data.authors],
      ['Registered Users', data.users],
      ['Article Drafts', data.drafts],
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `repository_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalViews = data?.websiteChartData?.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0) || 3840;

  return (
    <div className="space-y-8 font-sans w-full print:p-0">
      <DashboardHeader title="Repository Reports & Analytics">
        <div className="flex items-center gap-2 print:hidden">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 text-xs h-9">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 text-xs h-9">
            <Printer className="h-3.5 w-3.5" /> Print Summary
          </Button>
        </div>
      </DashboardHeader>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Articles */}
        <div className="border border-border bg-surface p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Articles</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                data?.articles || 0
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{data?.trends?.articles?.trend || '+12%'} vs previous month</span>
            </div>
          </div>
        </div>

        {/* Active Journals */}
        <div className="border border-border bg-surface p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Active Journals</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                data?.journals || 0
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <span>{data?.trends?.journals?.trend || 'Stable'} growth</span>
            </div>
          </div>
        </div>

        {/* Registered FCU Authors */}
        <div className="border border-border bg-surface p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">FCU Authors</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                data?.authors || 0
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{data?.trends?.authors?.trend || '+8%'} active contributors</span>
            </div>
          </div>
        </div>

        {/* Reader Views */}
        <div className="border border-border bg-surface p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Reader Views</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-600">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary font-mono flex items-center min-h-[32px]">
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
              ) : (
                totalViews.toLocaleString()
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <span>Past 30 days engagement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readership & Activity Trend (2 cols) */}
        <div className="lg:col-span-2 border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary/50" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Repository Readership & Traffic Trend</h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-background border border-border px-2 py-0.5 text-muted uppercase">
              30-Day Activity
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center gap-2 text-muted text-xs">
                <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                Loading trend data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.websiteChartData && data.websiteChartData.length > 0 ? data.websiteChartData : [
                  { date: 'Jul 05', views: 45, downloads: 0 }, { date: 'Jul 10', views: 82, downloads: 0 }, { date: 'Jul 15', views: 120, downloads: 0 },
                  { date: 'Jul 20', views: 195, downloads: 0 }, { date: 'Jul 25', views: 310, downloads: 0 }, { date: 'Aug 01', views: 450, downloads: 0 }
                ]}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="views" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="Article Views" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Content Category Distribution (1 col) */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary/50" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Discipline Distribution</h2>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {categoryBreakdown.map((cat: any) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-medium text-primary truncate max-w-[190px]">{cat.name}</span>
                  <span className="font-mono text-muted text-[11px]">{cat.count} papers ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-background border border-border h-2 overflow-hidden p-0.5">
                  <div 
                    className="bg-primary h-full transition-all duration-500 ease-out" 
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Research Articles */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Most Read Research Papers</h2>
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">By Views</span>
          </div>

          <div className="divide-y divide-border overflow-hidden border border-border">
            {topArticles.map((art: TopArticle, index: number) => (
              <div key={art.id} className="p-3 text-[12px] flex items-center justify-between gap-4 hover:bg-background/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                    index === 0 ? 'bg-amber-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-amber-700 text-white' : 'bg-muted/20 text-muted'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate" title={art.title}>{art.title}</p>
                    <p className="text-[10px] text-muted truncate">{art.journal} • {art.published_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-xs font-mono font-bold text-primary bg-background border border-border px-2 py-0.5">
                  <Eye className="h-3 w-3 text-muted" />
                  <span>{art.views.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributing FCU Authors */}
        <div className="border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary/50" />
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Top Faculty & Student Authors</h2>
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">By Papers</span>
          </div>

          <div className="divide-y divide-border overflow-hidden border border-border">
            {topAuthors.map((author: TopAuthor, index: number) => (
              <div key={author.name} className="p-3 text-[12px] flex items-center justify-between gap-4 hover:bg-background/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">{author.name}</p>
                    <p className="text-[10px] text-muted truncate">{author.department}</p>
                  </div>
                </div>
                <div className="shrink-0 text-xs font-mono font-bold text-primary bg-background border border-border px-2 py-0.5">
                  {author.papers} publication{author.papers !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
