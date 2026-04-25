import React from 'react';
import { BookOpen, FileText, Users, Eye, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const Overview: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const stats = [
    { label: 'Total Journals', value: '12', icon: BookOpen, color: 'bg-blue-500', trend: '+2 this month' },
    { label: 'Total Articles', value: '458', icon: FileText, color: 'bg-emerald-500', trend: '+14 this week' },
    { label: 'Total Reads', value: '25.4k', icon: Eye, color: 'bg-amber-500', trend: '+1.2k today' },
    { label: 'Active Users', value: '84', icon: Users, color: 'bg-rose-500', trend: '+3 this week' },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-sans font-extrabold text-primary">
            Welcome back, {user.name || 'Scholar'}
          </h1>
          <p className="text-sm text-slate-500 font-sans leading-relaxed">
            Here's what's happening with the Filamerian Research System today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Calendar className="h-4 w-4 text-secondary" />
          <span className="text-xs font-bold text-primary">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg shadow-current/10", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-sans font-extrabold text-primary">{stat.value}</span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity (Left 8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Recent Journal Activity</h3>
            <button className="text-xs font-bold text-secondary uppercase hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-bold text-primary truncate leading-none mb-1.5">
                    Vol. 15 No. 1 (2024) - Multidisciplinary Research Journal
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Updated 2 hours ago by Editor Sarah
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                  Published
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (Right 4 Columns) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-primary text-white p-8 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen className="h-24 w-24" />
            </div>
            <h3 className="text-lg font-sans font-extrabold mb-4 relative z-10">Launch New Journal</h3>
            <p className="text-xs text-white/60 font-sans leading-relaxed mb-8 relative z-10">
              Ready to expand the collection? Start a new publication cycle and invite contributors.
            </p>
            <button className="w-full py-3 bg-secondary text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
              Create New Journal
            </button>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">System Notifications</h3>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    New user registration pending for <span className="font-bold text-primary">Dr. Julian Santos</span> (Staff)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
