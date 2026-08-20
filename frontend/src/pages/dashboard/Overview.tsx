import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Users, ArrowRight, Settings, BarChart2, Activity, Globe, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import { Link } from 'react-router';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSmartPolling } from '@/hooks/useSmartPolling';

const Overview: React.FC = () => {
  const [data, setData] = useState<{
    journals: number;
    articles: number;
    drafts: number;
    authors: number;
    users: number;
    announcements: number;
    recentActivity: Array<{ action: string; target: string; time: string }>;
    trends?: {
      journals: { trend: string; isPositive: boolean };
      articles: { trend: string; isPositive: boolean };
      authors: { trend: string; isPositive: boolean };
      users: { trend: string; isPositive: boolean };
    };
    chartData?: Array<{ date: string; actions: number }>;
    websiteChartData?: Array<{ date: string; views: number; downloads: number }>;
    vercel?: {
      status: string;
      latest_deployment?: {
        url: string;
        state: string;
        branch: string;
        commit_msg: string;
        created_at: string;
      };
    };
  }>({ journals: 0, articles: 0, drafts: 0, authors: 0, users: 0, announcements: 0, recentActivity: [] });

  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const statsRes = await api.get('/dashboard/stats');
      setData(statsRes.data);
      
      if (user.role === 'Super Admin') {
        const healthRes = await api.get('/system/health');
        setSystemHealth(healthRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 120-Second (2 Minute) Smart Background Polling for Overview stats
  useSmartPolling(() => fetchData(true), 120000);

  useEffect(() => {
    fetchData();
  }, []);

  const stats = [
    { label: 'Journals', value: data.journals.toString(), icon: BookOpen, trend: data.trends?.journals.trend || 'Stable', isPositive: data.trends?.journals.isPositive ?? true },
    { label: 'Published Articles', value: data.articles.toString(), icon: FileText, trend: data.trends?.articles.trend || 'Stable', isPositive: data.trends?.articles.isPositive ?? true },
    { label: 'Draft Articles', value: data.drafts.toString(), icon: FileText, trend: '-', isPositive: false, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Authors', value: data.authors.toString(), icon: Users, trend: data.trends?.authors.trend || 'Stable', isPositive: data.trends?.authors.isPositive ?? true },
    { label: 'System Users', value: data.users.toString(), icon: Users, trend: data.trends?.users.trend || 'Stable', isPositive: data.trends?.users.isPositive ?? true },
  ];

  const portalChartData = data.chartData || [];

  const websiteChartData = data.websiteChartData || [];

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('journal')) return <BookOpen className="h-4 w-4 text-primary" />;
    if (act.includes('article') || act.includes('paper')) return <FileText className="h-4 w-4 text-emerald-600" />;
    if (act.includes('user') || act.includes('author')) return <Users className="h-4 w-4 text-blue-600" />;
    if (act.includes('setting')) return <Settings className="h-4 w-4 text-amber-600" />;
    return <Activity className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Page Header */}
      <DashboardHeader 
        title="Overview"
        helpText="Executive summary of published journals, articles, drafts, registered authors, system health status, and reader engagement analytics."
      >
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="h-9 w-9 border border-border bg-surface hover:bg-background text-muted hover:text-primary transition-colors shrink-0 flex items-center justify-center cursor-pointer"
          title="Refresh Overview Stats"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </DashboardHeader>

      {/* Stats Grid - 2 Columns on Mobile, 5 Columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.label} 
            className={`border border-border bg-surface p-3 sm:p-5 relative overflow-hidden group hover:border-primary/30 transition-colors ${
              i === 4 ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2.5 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-background border border-border">
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70" />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 sm:px-2 uppercase tracking-wider ${stat.color ? `${stat.color} ${stat.bg}` : (stat.isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10')}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-light text-primary tracking-tight min-h-[28px] sm:min-h-[36px] flex items-center">
                {loading ? (
                  <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium text-muted uppercase tracking-wider mt-0.5 sm:mt-1 truncate">
                {stat.label}
              </p>
            </div>
            {/* Decorative faint icon */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-500">
              <stat.icon className="h-20 w-20 sm:h-28 sm:w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: Chart & Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Website Chart Section */}
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-3 sm:pb-4 sm:mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary/70" />
                  <h2 className="text-[11px] sm:text-[12px] font-semibold text-primary uppercase tracking-wider">
                    Website Activity (30 Days)
                  </h2>
                </div>
                {/* Right-aligned legend */}
                <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#002d72] shrink-0" />
                    <span className="text-foreground font-medium">Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
                    <span className="text-foreground font-medium">PDF Reads</span>
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-64 pt-2 sm:pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={websiteChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#002d72" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#002d72" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface border border-border p-2.5 shadow-md text-xs font-sans space-y-1.5 min-w-[150px]">
                              <div className="border-b border-border/80 pb-1 font-mono font-semibold text-foreground">
                                {label}
                              </div>
                              <div className="space-y-1 text-[11px]">
                                {payload.map((entry: any, index: number) => (
                                  <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                      <span className="text-muted">{entry.name}</span>
                                    </div>
                                    <span className="font-mono font-semibold text-foreground">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#002d72" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="Article Views" />
                    <Area type="monotone" dataKey="downloads" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorDownloads)" name="PDF Reads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Portal Activity (Stacked Multi-Category Bar Chart) */}
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-3 sm:pb-4 sm:mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary/70" />
                  <h2 className="text-[11px] sm:text-[12px] font-semibold text-primary uppercase tracking-wider">
                    Portal Activity (30 Days)
                  </h2>
                </div>
                {/* Multi-category Stacked Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#002d72] shrink-0" />
                    <span className="text-foreground font-medium">Content</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#d97706] shrink-0" />
                    <span className="text-foreground font-medium">Users</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#059669] shrink-0" />
                    <span className="text-foreground font-medium">Trash/Restores</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#64748b] shrink-0" />
                    <span className="text-foreground font-medium">System</span>
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-64 pt-2 sm:pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0);
                          return (
                            <div className="bg-surface border border-border p-2.5 shadow-md text-xs font-sans space-y-1.5 min-w-[170px]">
                              <div className="flex items-center justify-between border-b border-border/80 pb-1 font-mono">
                                <span className="font-semibold text-foreground">{label}</span>
                                <span className="font-bold text-primary">{total} Total Actions</span>
                              </div>
                              <div className="space-y-1 text-[11px]">
                                {payload.map((entry: any, index: number) => (
                                  entry.value > 0 ? (
                                    <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: entry.color }} />
                                        <span className="text-muted">{entry.name}</span>
                                      </div>
                                      <span className="font-mono font-semibold text-foreground">{entry.value}</span>
                                    </div>
                                  ) : null
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="publications" stackId="a" fill="#002d72" name="Content & Articles" />
                    <Bar dataKey="users" stackId="a" fill="#d97706" name="User Management" />
                    <Bar dataKey="trash" stackId="a" fill="#059669" name="Trash & Restores" />
                    <Bar dataKey="system" stackId="a" fill="#64748b" radius={[2, 2, 0, 0]} name="System & Config" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-3.5 sm:p-5">
              <h2 className="text-[11px] sm:text-[12px] font-semibold text-primary uppercase tracking-wider">
                Recent Activity
              </h2>
              <Link to="/dashboard/logs" className="text-[10px] sm:text-[11px] font-medium text-primary/60 hover:text-primary uppercase tracking-wider transition-colors flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No recent activity" description="There are no recent actions recorded in the system yet." className="py-12 bg-transparent border-0" />
              ) : (
                data.recentActivity.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 hover:bg-background transition-colors group">
                    <div className="shrink-0 p-1.5 sm:p-2 bg-background border border-border mt-0.5 group-hover:border-primary/30 transition-colors">
                      {getActivityIcon(item.action)}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="text-[12px] sm:text-[13px] font-medium text-primary line-clamp-1">
                        {item.target}
                      </p>
                      <p className="text-[11px] sm:text-[12px] text-muted mt-0.5 line-clamp-1">
                        {item.action}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] sm:text-[11px] font-medium text-muted/60 uppercase tracking-wider">{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions + Info */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          
          {/* Quick Actions */}
          <div className="border border-border bg-surface p-4 sm:p-5 shadow-sm">
            <h3 className="text-[11px] sm:text-[12px] font-semibold text-primary uppercase tracking-wider mb-3.5 sm:mb-5">
              Quick Actions
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { label: 'Create New Journal', desc: 'Start a new publication', path: '/dashboard/journals', icon: BookOpen },
                { label: 'Add Article', desc: 'Submit research paper', path: '/dashboard/articles', icon: FileText },
                { label: 'Manage Authors', desc: 'View author directory', path: '/dashboard/authors', icon: Users },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="p-1.5 bg-surface border border-border group-hover:border-primary/30 transition-colors shrink-0">
                    <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-left flex-grow min-w-0">
                    <p className="text-[12px] sm:text-[13px] font-medium text-primary group-hover:text-primary transition-colors truncate">{action.label}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* System Info - Super Admin Only */}
          {user.role === 'Super Admin' && (() => {
            const dbStatus = typeof systemHealth?.database === 'object' ? systemHealth.database.status : (systemHealth?.database || 'Loading...');
            const storageText = typeof systemHealth?.storage === 'object' ? systemHealth.storage.type : (systemHealth?.storage_disk ? systemHealth.storage_disk.toUpperCase() : 'Loading...');
            return (
              <div className="border border-border bg-surface p-5 shadow-sm">
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-5">
                  System Health
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <div className={`h-1.5 w-1.5 rounded-full ${systemHealth?.status === 'Operational' ? 'bg-emerald-500' : 'bg-red-500'}`} /> API Services
                    </div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 ${systemHealth?.status === 'Operational' ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'}`}>
                      {systemHealth?.status || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Cloud Storage
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5">
                      {storageText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <div className={`h-1.5 w-1.5 rounded-full ${dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`} /> Primary DB
                    </div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 ${dbStatus === 'Connected' ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'}`}>
                      {dbStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Vercel Cloud API
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5">
                      {data.vercel?.status || 'Connected'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Vercel Live Deployment Status */}
          {data.vercel && data.vercel.latest_deployment && (
            <div className="border border-border bg-surface p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-secondary" />
                  Vercel Live Build
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 uppercase tracking-wider">
                  Live
                </span>
              </div>
              
              <div className="bg-background border border-border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider">
                    Branch: {data.vercel.latest_deployment.branch}
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    {data.vercel.latest_deployment.created_at}
                  </span>
                </div>
                <p className="text-[12px] font-medium text-primary line-clamp-1">
                  {data.vercel.latest_deployment.commit_msg}
                </p>
                <a 
                  href={`https://${data.vercel.latest_deployment.url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-mono text-primary/70 hover:text-primary transition-colors underline block truncate"
                >
                  {data.vercel.latest_deployment.url}
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Overview;
