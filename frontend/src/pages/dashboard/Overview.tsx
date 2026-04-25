import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Users, 
  Eye, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Overview: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const stats = [
    { label: 'Total Journals', value: '12', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2 this month' },
    { label: 'Total Articles', value: '458', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+14 this week' },
    { label: 'Total Reads', value: '25,482', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+1.2k today' },
    { label: 'Active Users', value: '84', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+3 this week' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-sans font-extrabold text-primary tracking-tight">
            Welcome back, {user.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="text-sm text-slate-500 font-sans leading-relaxed flex items-center gap-2">
            System status: <span className="flex items-center gap-1.5 text-emerald-500 font-bold uppercase text-[10px] tracking-widest"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational</span>
          </p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Calendar className="h-4 w-4 text-secondary" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Bento Grid 2.0 - Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label} 
            variants={item}
            className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-3xl data-mono font-extrabold text-primary leading-none block">{stat.value}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bento Layout: Activity & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Asymmetric Activity Feed (7 Columns) */}
        <motion.div variants={item} className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Institutional Feed</h3>
              <p className="text-[11px] text-slate-400 font-sans italic">Latest research publications and metadata updates</p>
            </div>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-slate-100 transition-all">
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-5 p-5 rounded-3xl border border-transparent hover:border-slate-50 hover:bg-slate-50/50 transition-all duration-300 cursor-pointer group">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6 text-primary/20 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-bold text-primary truncate leading-tight mb-1">
                    {i === 1 ? 'Community Resilience in Capiz: A Post-Pandemic Study' : 'Multidisciplinary Research Journal - Vol. 15 No. 1'}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span className="text-secondary">Journal Archive</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span>Updated 2h ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-primary uppercase">View</span>
                  <ChevronRight className="h-3 w-3 text-secondary" />
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-10 py-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-400 hover:text-primary hover:bg-slate-100 transition-all uppercase tracking-widest">
            Load Full System History
          </button>
        </motion.div>

        {/* Quick Actions & System Info (5 Columns) */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div variants={item} className="bg-primary text-white p-10 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
              <BookOpen className="h-32 w-32" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-sans font-extrabold tracking-tight">Expand the Collection</h3>
                <p className="text-sm text-white/50 font-sans leading-relaxed max-w-[28ch]">
                  Ready to launch a new publication cycle? Start a journal and invite your editorial board.
                </p>
              </div>
              <button className="flex items-center gap-3 px-6 py-4 bg-secondary text-primary rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-secondary/10">
                <Plus className="h-4 w-4" />
                Create New Journal
              </button>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.3em] mb-10 border-b border-slate-50 pb-6">System Notifications</h3>
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-5 relative">
                  <div className="h-3 w-3 rounded-full bg-secondary mt-1 shrink-0 shadow-sm shadow-secondary/50" />
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-600 font-sans leading-relaxed">
                      New author registration pending for <span className="font-bold text-primary">Dr. Julian Santos</span> (Science Faculty)
                    </p>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Awaiting Approval</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Overview;
