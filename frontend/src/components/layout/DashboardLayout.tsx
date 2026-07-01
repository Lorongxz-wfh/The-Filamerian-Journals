import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: ['Super Admin', 'Editor', 'Staff', 'Author', 'Reviewer'] },
    { label: 'My Journals', icon: BookOpen, path: '/dashboard/journals', roles: ['Editor', 'Super Admin'] },
    { label: 'Announcements', icon: Bell, path: '/dashboard/announcements', roles: ['Super Admin', 'Editor'] },
    { label: 'Feedback', icon: MessageSquare, path: '/dashboard/feedback', roles: ['Super Admin', 'Editor'] },
  ];

  const adminItems = [
    { label: 'User Manager', icon: Users, path: '/dashboard/users', roles: ['Super Admin'] },
    { label: 'System Settings', icon: Settings, path: '/dashboard/settings', roles: ['Super Admin'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userRoles = user.roles || (user.role ? [user.role] : []);
  
  const hasAccess = (allowedRoles?: string[]) => {
    if (!allowedRoles) return true;
    return allowedRoles.some(role => userRoles.includes(role) || userRoles.includes('Super Admin')); // Super admin sees all their allowed stuff anyway
  };

  const visibleMenuItems = menuItems.filter(item => hasAccess(item.roles));
  const visibleAdminItems = adminItems.filter(item => hasAccess(item.roles));

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center">
          <span className="font-display font-normal text-secondary text-base tracking-wider uppercase leading-none">
            Filamerian
          </span>
          <span className="ml-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Portal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-3 mb-2 block">
            Main Menu
          </span>
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 text-[13px]',
                location.pathname === item.path
                  ? 'bg-secondary text-primary font-semibold'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {visibleAdminItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-3 mb-2 block">
              Administration
            </span>
            {visibleAdminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 text-[13px]',
                  location.pathname === item.path
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div className="h-8 w-8 bg-secondary flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-white truncate leading-none">
              {user.name || 'User'}
            </span>
            <span className="text-[11px] text-white/30 truncate mt-0.5">
              {user.role || 'Member'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-colors text-[13px]"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  if (user && !user.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md bg-surface border border-border p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <h1 className="text-xl text-primary font-display uppercase tracking-wider mb-2">Account Pending</h1>
          <p className="text-[13px] text-muted mb-6">
            Your email is verified, but an administrator has not yet approved your account. 
            You will receive full dashboard access once approved.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-background border border-border text-[13px] font-medium text-primary hover:border-primary/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-primary text-white flex flex-col z-50 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dashboard Header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden h-8 w-8 flex items-center justify-center text-muted hover:text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative w-72 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative h-8 w-8 flex items-center justify-center text-muted hover:text-primary transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <span className="text-[11px] text-muted hidden sm:inline">
              {user.name || 'User'}
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
