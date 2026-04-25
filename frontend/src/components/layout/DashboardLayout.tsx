import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ChevronRight,
  FileText,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Journals', icon: BookOpen, path: '/dashboard/journals' },
    { label: 'Articles', icon: FileText, path: '/dashboard/articles' },
    { label: 'Feedback', icon: MessageSquare, path: '/dashboard/feedback' },
  ];

  const adminItems = [
    { label: 'User Manager', icon: Users, path: '/dashboard/users' },
    { label: 'System Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-primary text-white flex flex-col shadow-2xl z-50">
        {/* Brand */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tighter leading-none">
                FILAMERIAN
              </span>
              <span className="text-[9px] font-bold text-secondary tracking-[0.2em] uppercase mt-1">
                Management
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-6 space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] px-4">Main Menu</span>
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                  location.pathname === item.path 
                    ? "bg-secondary text-primary shadow-lg shadow-secondary/10" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                {location.pathname === item.path && <ChevronRight className="h-3 w-3" />}
              </Link>
            ))}
          </div>

          {user.role === 'Super Admin' && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] px-4">Administration</span>
              {adminItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                    location.pathname === item.path 
                      ? "bg-secondary text-primary shadow-lg shadow-secondary/10" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-bold">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-white/5 rounded-2xl">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm shadow-inner">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate leading-none mb-1">{user.name || 'User'}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-tighter truncate">{user.role || 'Member'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-all font-bold text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Dashboard Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search journals, articles, or users..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-primary leading-none mb-1">System Health</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Operational</span>
              </div>
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
