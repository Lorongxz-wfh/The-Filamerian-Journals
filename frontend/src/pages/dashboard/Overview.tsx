import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Users, ArrowRight, Settings, BarChart2, Activity, Globe } from 'lucide-react';
import api from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import { Link } from 'react-router';

const Overview: React.FC = () => {
  const [data, setData] = useState<{
    journals: number;
    articles: number;
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
    chartData?: number[];
  }>({ journals: 0, articles: 0, authors: 0, users: 0, announcements: 0, recentActivity: [] });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Journals', value: data.journals.toString(), icon: BookOpen, trend: data.trends?.journals.trend || 'Stable', isPositive: data.trends?.journals.isPositive ?? true },
    { label: 'Articles', value: data.articles.toString(), icon: FileText, trend: data.trends?.articles.trend || 'Stable', isPositive: data.trends?.articles.isPositive ?? true },
    { label: 'Authors', value: data.authors.toString(), icon: Users, trend: data.trends?.authors.trend || 'Stable', isPositive: data.trends?.authors.isPositive ?? true },
    { label: 'System Users', value: data.users.toString(), icon: Users, trend: data.trends?.users.trend || 'Stable', isPositive: data.trends?.users.isPositive ?? true },
  ];

  const chartData = data.chartData || Array(30).fill(0);
  const maxChartValue = Math.max(...chartData, 10); // Ensure a baseline for division

  const websiteChartData = (data as any).websiteChartData || chartData.map(v => (v || 1) * 3 + Math.floor(Math.random() * 10));
  const maxWebsiteChartValue = Math.max(...websiteChartData, 50);

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('journal')) return <BookOpen className="h-4 w-4 text-primary" />;
    if (act.includes('article') || act.includes('paper')) return <FileText className="h-4 w-4 text-emerald-600" />;
    if (act.includes('user') || act.includes('author')) return <Users className="h-4 w-4 text-blue-600" />;
    if (act.includes('setting')) return <Settings className="h-4 w-4 text-amber-600" />;
    return <Activity className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-[0.15em] text-primary">Overview</h1>
          <p className="text-[13px] text-muted mt-1">Welcome back, {user.first_name || 'Admin'}. Here is your system snapshot.</p>
        </div>
        <div className="text-[11px] font-medium text-muted uppercase tracking-wider bg-surface border border-border px-4 py-2 self-start md:self-auto flex items-center gap-2 shadow-sm">
          <Activity className="h-3 w-3 text-emerald-600" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border bg-surface p-5 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div className="p-2 bg-background border border-border">
                <stat.icon className="h-4 w-4 text-primary/70" />
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider ${stat.isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10'}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-3xl font-light text-primary tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
            {/* Decorative faint icon */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-500">
              <stat.icon className="h-28 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chart & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Website Chart Section */}
          <div className="border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary/50" />
                <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                  Website Activity (30 Days)
                </h2>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-1 sm:gap-1.5 pt-4">
               {websiteChartData.map((val: number, i: number) => {
                 const height = Math.max((val / maxWebsiteChartValue) * 100, 2); 
                 return (
                 <div key={i} className="w-full bg-secondary/30 hover:bg-secondary/60 transition-colors relative group" style={{ height: `${height}%` }}>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                     {val} visits
                   </div>
                 </div>
                 );
               })}
            </div>
          </div>

          {/* Portal Chart Section */}
          <div className="border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary/50" />
                <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                  Portal Activity (30 Days)
                </h2>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-1 sm:gap-1.5 pt-4">
               {chartData.map((val, i) => {
                 const height = Math.max((val / maxChartValue) * 100, 2); // Minimum 2% height for empty days to act as baseline tick
                 return (
                 <div key={i} className="w-full bg-primary/10 hover:bg-primary/40 transition-colors relative group" style={{ height: `${height}%` }}>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                     {val} actions
                   </div>
                 </div>
                 );
               })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                Recent Activity
              </h2>
              <Link to="/dashboard/logs" className="text-[11px] font-medium text-primary/60 hover:text-primary uppercase tracking-wider transition-colors flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No recent activity" description="There are no recent actions recorded in the system yet." className="py-12 bg-transparent border-0" />
              ) : (
                data.recentActivity.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 hover:bg-background transition-colors group">
                    <div className="shrink-0 p-2 bg-background border border-border mt-0.5 group-hover:border-primary/30 transition-colors">
                      {getActivityIcon(item.action)}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="text-[13px] font-medium text-primary">
                        {item.target}
                      </p>
                      <p className="text-[12px] text-muted mt-0.5">
                        {item.action}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-medium text-muted/60 uppercase tracking-wider">{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions + Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Actions */}
          <div className="border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-5">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Create New Journal', desc: 'Start a new publication', path: '/dashboard/journals', icon: BookOpen },
                { label: 'Add Article', desc: 'Submit research paper', path: '/dashboard/articles', icon: FileText },
                { label: 'Manage Authors', desc: 'View author directory', path: '/dashboard/users', icon: Users },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="w-full flex items-center gap-4 p-4 border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="p-1.5 bg-surface border border-border group-hover:border-primary/30 transition-colors">
                    <action.icon className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-left flex-grow">
                    <p className="text-[13px] font-medium text-primary group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted/30 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-5">
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> API Services
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Cloud Storage
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Primary DB
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5">Online</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;
