import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  data: {
    title: string;
    message: string;
    type: string;
    action_url: string | null;
  };
  created_at: string;
  read_at: string | null;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: ['Super Admin', 'Admin'] },
    { label: 'My Journals', icon: BookOpen, path: '/dashboard/journals', roles: ['Admin', 'Super Admin'] },
    { label: 'Articles', icon: FileText, path: '/dashboard/articles', roles: ['Admin', 'Super Admin'] },
    { label: 'Announcements', icon: Bell, path: '/dashboard/announcements', roles: ['Super Admin', 'Admin'] },
    { label: 'Feedback', icon: MessageSquare, path: '/dashboard/feedback', roles: ['Super Admin', 'Admin'] },
  ];

  const adminItems = [
    { label: 'System Health', icon: LayoutDashboard, path: '/dashboard/health', roles: ['Super Admin'] },
    { path: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare, roles: ['Admin', 'Super Admin'] },
    { path: '/dashboard/resources', label: 'Resources', icon: FileText, roles: ['Admin', 'Super Admin'] },
    { path: '/dashboard/users', label: 'User Manager', icon: Users, roles: ['Super Admin'] },
    { label: 'System Settings', icon: Settings, path: '/dashboard/settings', roles: ['Super Admin'] },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(r => setTimeout(r, 600)); // UX delay to show loading state
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/unread');
      setNotifications(res.data.data);
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [location.pathname]);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
      setIsNotifOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string, url: string | null) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
      setIsNotifOpen(false);
      if (url) navigate(url);
    } catch (err) {
      console.error(err);
    }
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
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-colors text-[13px] disabled:opacity-50"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Sign Out
            </>
          )}
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
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative h-8 w-8 flex items-center justify-center text-muted hover:text-primary transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-surface"></span>
                )}
              </button>

              <div 
                className={cn(
                  "absolute right-0 mt-2 w-80 bg-surface border border-border shadow-xl z-50 origin-top-right transition-all duration-200 ease-out",
                  isNotifOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                )}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[11px] text-secondary hover:underline flex items-center gap-1">
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12px] text-muted">No new notifications</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => markAsRead(notif.id, notif.data.action_url)}
                          className="px-4 py-3 hover:bg-background transition-colors cursor-pointer"
                        >
                          <p className="text-[13px] font-medium text-primary mb-0.5">{notif.data.title}</p>
                          <p className="text-[12px] text-muted line-clamp-2">{notif.data.message}</p>
                          <span className="text-[10px] text-muted/60 mt-2 block">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-border p-2">
                  <Link 
                    to="/dashboard/notifications" 
                    onClick={() => setIsNotifOpen(false)}
                    className="block w-full text-center py-2 text-[12px] text-muted hover:text-primary transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            </div>
            
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
