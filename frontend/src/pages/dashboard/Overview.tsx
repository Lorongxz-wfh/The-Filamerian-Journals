import React from 'react';
import { BookOpen, FileText, Users, Eye, ArrowRight } from 'lucide-react';

const Overview: React.FC = () => {
  const stats = [
    { label: 'Journals', value: '12', icon: BookOpen },
    { label: 'Articles', value: '458', icon: FileText },
    { label: 'Views', value: '25,482', icon: Eye },
    { label: 'Authors', value: '84', icon: Users },
  ];

  const recentActivity = [
    { action: 'New article submitted', target: 'Community Health Practices in Western Visayas', time: '2h ago' },
    { action: 'Volume published', target: 'FCU Research Journal Vol. 15', time: '1d ago' },
    { action: 'Author registered', target: 'Dr. Maria Santos, College of Education', time: '2d ago' },
    { action: 'Issue finalized', target: 'Science Review Issue 3, 2024', time: '3d ago' },
    { action: 'Article accepted', target: 'Pedagogical Innovations in Faith-Based Education', time: '4d ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">Dashboard</h1>
        <p className="text-[13px] text-muted mt-1">System overview and recent activity</p>
      </div>

      {/* Stats Row — flat, no cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface p-5 flex items-center gap-4">
            <stat.icon className="h-5 w-5 text-primary/40" />
            <div>
              <p className="text-2xl font-semibold text-primary leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Recent Activity
            </h2>
            <button className="text-[11px] text-muted hover:text-primary transition-colors">
              View All
            </button>
          </div>

          <div className="border border-border bg-surface divide-y divide-border">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 group hover:bg-background transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-primary truncate">
                    {item.target}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {item.action}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-[11px] text-muted/60">{item.time}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions */}
          <div className="border border-border bg-surface p-5 space-y-4">
            <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Create New Journal', desc: 'Start a new publication' },
                { label: 'Add Article', desc: 'Submit research paper' },
                { label: 'Manage Authors', desc: 'View author directory' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center justify-between px-4 py-3 text-left border border-border hover:border-primary/30 transition-colors group"
                >
                  <div>
                    <p className="text-[13px] font-medium text-primary">{action.label}</p>
                    <p className="text-[11px] text-muted">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted/30 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="border border-border bg-surface p-5 space-y-3">
            <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              System Status
            </h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted">API</span>
                <span className="text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted">Storage</span>
                <span className="text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted">Database</span>
                <span className="text-emerald-600 font-medium">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
