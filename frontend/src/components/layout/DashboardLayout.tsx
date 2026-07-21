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
  Loader2,
  Globe,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { Outlet } from 'react-router';
import SplashLoader from '@/components/ui/SplashLoader';
import { useDebounce } from '@/hooks/useDebounce';
import SearchDropdown from '@/components/ui/SearchDropdown';
import { toast } from 'sonner';


interface DashboardLayoutProps {}

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

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{ journals: any[]; articles: any[] } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      setIsDropdownOpen(false);
      return;
    }
    
    const fetchResults = async () => {
      setIsSearchLoading(true);
      setIsDropdownOpen(true);
      try {
        const res = await api.get(`/public/search?q=${encodeURIComponent(debouncedSearch)}`);
        setSearchResults(res.data.data);
      } catch (err) {
        console.error('Live search failed', err);
      } finally {
        setIsSearchLoading(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);
  
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsDropdownOpen(false);
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: ['Super Admin', 'Admin'] },
    { label: 'My Journals', icon: BookOpen, path: '/dashboard/journals', roles: ['Admin', 'Super Admin'] },
    { label: 'Articles', icon: FileText, path: '/dashboard/articles', roles: ['Admin', 'Super Admin'] },
    { label: 'Import', icon: Upload, path: '/dashboard/import', roles: ['Admin', 'Super Admin'] },
    { label: 'Announcements', icon: Bell, path: '/dashboard/announcements', roles: ['Super Admin', 'Admin'] },
    { label: 'Feedback', icon: MessageSquare, path: '/dashboard/feedback', roles: ['Super Admin', 'Admin'] },
  ];

  const adminItems = [
    { path: '/dashboard/categories', label: 'Categories', icon: BookOpen, roles: ['Super Admin', 'Admin'] },
    { path: '/dashboard/users', label: 'User Management', icon: Users, roles: ['Super Admin'] },
    { path: '/dashboard/logs', label: 'Activity Logs', icon: FileText, roles: ['Super Admin'] },
    { label: 'Website Settings', icon: Globe, path: '/dashboard/website', roles: ['Super Admin'] },
    { label: 'System Settings', icon: Settings, path: '/dashboard/settings', roles: ['Super Admin'], inDev: true },
    { label: 'System Health', icon: LayoutDashboard, path: '/dashboard/health', roles: ['Super Admin'], inDev: true },
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

    // 60-Minute Session Inactivity Timeout Listener
    const TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
    const updateActivity = () => {
      localStorage.setItem('last_activity', Date.now().toString());
    };

    if (!localStorage.getItem('last_activity')) {
      updateActivity();
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, updateActivity));

    const checkTimeout = setInterval(() => {
      const lastActivity = Number(localStorage.getItem('last_activity') || Date.now());
      if (Date.now() - lastActivity > TIMEOUT_MS) {
        toast.warning('Session expired due to 60 minutes of inactivity. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_activity');
        navigate('/login');
      }
    }, 15000); // Check every 15 seconds

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
      clearInterval(checkTimeout);
    };
  }, [location.pathname, navigate]);

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

  const allPortalItems = [...menuItems, ...adminItems].filter(item => 
    item.roles.includes(user.role || 'Member')
  );

  const pageResults = debouncedSearch.trim()
    ? allPortalItems.filter(item => item.label.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : [];

  const SidebarContent = () => (
    <>
      <div className="h-14 flex items-center px-6 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <BookOpen className="h-5 w-5 text-secondary group-hover:text-white transition-colors" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white uppercase tracking-[0.15em] group-hover:text-secondary transition-colors leading-none">
              The Filamerian
            </span>
            <span className="text-[9px] font-semibold text-white/50 uppercase tracking-[0.3em] mt-0.5">
              Dashboard
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6 dark-scrollbar">
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 text-[13px]',
                location.pathname === item.path
                  ? 'bg-secondary/10 text-secondary font-semibold border-l-2 border-secondary'
                  : 'text-white/50 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
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
                // onClick removed to keep sidebar open after navigation
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 text-[13px]',
                  location.pathname === item.path
                    ? 'bg-secondary/10 text-secondary font-semibold border-l-2 border-secondary'
                    : 'text-white/50 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                )}
              >
                <div className="flex items-center gap-3 flex-grow">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {(item as any).inDev && (
                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 uppercase tracking-widest shrink-0">
                    Dev
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 shrink-0 mt-auto">
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
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
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
    <div className="h-screen bg-surface flex text-primary font-sans overflow-hidden">
      <SplashLoader />
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
          'fixed inset-y-0 left-0 w-64 min-w-[16rem] shrink-0 bg-primary text-white flex flex-col z-50 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto',
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
        {SidebarContent()}
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dashboard Header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
          
          <div className="flex items-center min-w-[40px]">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden h-8 w-8 flex items-center justify-center text-muted hover:text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Center Search */}
          <div className="flex-1 max-w-md px-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onKeyDown={handleSearch}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
              />
              <SearchDropdown 
                query={debouncedSearch}
                results={searchResults}
                pages={pageResults}
                loading={isSearchLoading}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end min-w-[40px] gap-4">

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
