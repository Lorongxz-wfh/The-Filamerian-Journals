import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, Search, X, ChevronRight, Sparkles, ShieldCheck, ArrowRight, Lock, User, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import SearchDropdown from '@/components/ui/SearchDropdown';
import { useSettings } from '@/contexts/SettingsContext';

import api from '@/services/api';

type PortalBtnStyle = 'editorial-badge' | 'solid-gold-pill' | 'swiss-line' | 'glass-pill' | 'compact-luxury';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { settings } = useSettings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{ journals: any[]; articles: any[] } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [btnStyle, setBtnStyle] = useState<PortalBtnStyle>(() => {
    return (localStorage.getItem('navbar_portal_btn_style') as PortalBtnStyle) || 'editorial-badge';
  });
  const [styleSwitcherOpen, setStyleSwitcherOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const targetUrl = isLoggedIn ? '/dashboard' : '/login';
  const targetLabel = isLoggedIn ? 'Dashboard' : 'Portal Login';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  interface Category {
    id: number;
    name: string;
    slug: string;
  }
  const [dropdownCategories, setDropdownCategories] = useState<Category[]>([]);

  const handleSelectStyle = (style: PortalBtnStyle) => {
    setBtnStyle(style);
    localStorage.setItem('navbar_portal_btn_style', style);
    setStyleSwitcherOpen(false);
  };

  const renderPortalButton = () => {
    switch (btnStyle) {
      case 'editorial-badge':
        return (
          <Link
            to={targetUrl}
            title={targetLabel}
            className="flex items-center gap-2 px-3.5 py-1.5 border border-secondary/40 text-secondary bg-secondary/5 hover:bg-secondary hover:text-primary font-serif tracking-wider text-[11px] uppercase transition-all duration-200 shadow-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-semibold">{targetLabel}</span>
          </Link>
        );

      case 'solid-gold-pill':
        return (
          <Link
            to={targetUrl}
            title={targetLabel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary text-primary font-sans font-bold text-[11px] uppercase tracking-wider rounded shadow-sm hover:bg-[#f0aa0f] hover:shadow-md hover:-translate-y-px transition-all duration-150"
          >
            {isLoggedIn ? <LayoutDashboard className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>{targetLabel}</span>
          </Link>
        );

      case 'swiss-line':
        return (
          <Link
            to={targetUrl}
            title={targetLabel}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-white/90 hover:border-secondary hover:text-secondary font-sans text-[11px] font-semibold uppercase tracking-widest transition-all duration-150"
          >
            <span>{targetLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        );

      case 'glass-pill':
        return (
          <Link
            to={targetUrl}
            title={targetLabel}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-[11px] font-medium tracking-wide rounded-full backdrop-blur-xs transition-all duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span>{targetLabel}</span>
          </Link>
        );

      case 'compact-luxury':
      default:
        return (
          <Link
            to={targetUrl}
            title={targetLabel}
            className="group flex items-center justify-center h-8 w-8 bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-150 shadow-xs"
          >
            {isLoggedIn ? (
              <LayoutDashboard className="h-4 w-4 group-hover:scale-105 transition-transform" />
            ) : (
              <User className="h-4 w-4 group-hover:scale-105 transition-transform" />
            )}
          </Link>
        );
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/public/categories');
        setDropdownCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch navbar categories', err);
      }
    };
    fetchCats();
  }, [path]);

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

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || ''))) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  return (
    <>
      {settings.maintenance_mode === '1' && (
        <div className="bg-amber-600 text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <span>⚠️ Scheduled System Maintenance Active — Public Access Temporarily Paused</span>
        </div>
      )}
      <nav className="bg-primary sticky top-0 z-50 shadow-md border-b border-white/10">
      <div className="container-custom flex h-16 items-center justify-between gap-4 lg:gap-6">
        {/* Brand — flush left */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="font-display font-normal text-secondary text-xl tracking-wider uppercase leading-none">
            {settings.site_title}
          </span>
        </Link>

        {/* Search — center, fills available space (hidden on Home page to prevent double search) */}
        {path !== '/' ? (
          <div className="hidden md:block flex-grow max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search journals, articles, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsDropdownOpen(true);
                }}
                onKeyDown={handleSearch}
                className="w-full pl-10 pr-16 py-2 bg-[#f4f4f5] border border-transparent text-[13px] text-primary placeholder:text-muted/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-white/30 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                {searchQuery ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setIsDropdownOpen(false); }} 
                    className="text-muted/50 hover:text-primary transition-colors h-4 w-4 flex items-center justify-center pointer-events-auto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-muted/70 bg-white border border-border rounded shadow-2xs">
                    Ctrl K
                  </kbd>
                )}
              </div>
              
              <SearchDropdown 
                query={debouncedSearch}
                results={searchResults}
                loading={isSearchLoading}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                onSelectQuery={(q) => {
                  setSearchQuery(q);
                  setIsDropdownOpen(true);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-grow max-w-md hidden md:block" />
        )}

        {/* Nav links + Login — flush right */}
        <div className="hidden md:flex items-center gap-6 shrink-0 h-full">
          <Link to="/" className={`text-[13px] font-medium tracking-wide h-full flex items-center transition-colors ${path === '/' ? 'text-secondary' : 'text-white/70 hover:text-white'}`}>
            Home
          </Link>
          
          <div className="relative group h-full flex items-center">
            <Link to="/journals" className={`text-[13px] font-medium tracking-wide h-full flex items-center transition-colors ${path.startsWith('/journals') || path.startsWith('/articles') ? 'text-secondary' : 'text-white/70 group-hover:text-white'}`}>
              Journals
            </Link>
            
            {/* UP Diliman Style Dropdown */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-56 w-max max-w-2xl bg-primary border-t-[3px] border-secondary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto flex flex-col">
              <div 
                className="grid bg-white/10 gap-px max-h-[340px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-secondary/40 [&::-webkit-scrollbar-track]:bg-primary" 
                style={{ 
                  gridTemplateColumns: dropdownCategories.length > 10 ? 'repeat(3, minmax(180px, 1fr))' : 
                                       dropdownCategories.length > 5 ? 'repeat(2, minmax(180px, 1fr))' : 
                                       '1fr' 
                }}
              >
                {dropdownCategories.map(cat => (
                  <Link 
                    key={cat.id}
                    to={`/journals?category=${encodeURIComponent(cat.slug)}`} 
                    className="flex px-6 py-4 bg-primary text-[13px] font-medium text-white/80 hover:text-primary hover:bg-secondary transition-colors uppercase tracking-widest"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/journals"
                className="block p-4 text-center text-[12px] font-bold text-secondary uppercase tracking-widest bg-primary/95 hover:bg-secondary hover:text-primary transition-colors border-t border-white/10"
              >
                View All Categories →
              </Link>
            </div>
          </div>

          <Link to="/archives" className={`text-[13px] font-medium tracking-wide h-full flex items-center transition-colors ${path.startsWith('/archives') ? 'text-secondary' : 'text-white/70 hover:text-white'}`}>
            Archives
          </Link>
          <Link to="/about" className={`text-[13px] font-medium tracking-wide h-full flex items-center transition-colors ${path.startsWith('/about') ? 'text-secondary' : 'text-white/70 hover:text-white'}`}>
            About
          </Link>
          <Link to="/contact" className={`text-[13px] font-medium tracking-wide h-full flex items-center transition-colors ${path.startsWith('/contact') ? 'text-secondary' : 'text-white/70 hover:text-white'}`}>
            Contact
          </Link>

            <span className="w-px h-5 bg-white/20 mx-4" />
            
            {/* Interactive Design Variant Selector & Portal Button */}
            <div className="relative flex items-center gap-2">
              {/* Variant Switcher Toggle Button */}
              <button
                type="button"
                onClick={() => setStyleSwitcherOpen(prev => !prev)}
                title="Switch Button Design Style (5 Variants)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider text-white/50 hover:text-secondary hover:bg-white/5 border border-white/15 transition-all cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-secondary" />
                <span>Style Previewer</span>
              </button>

              {/* Style Switcher Dropdown Menu */}
              <AnimatePresence>
                {styleSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-72 bg-primary border-2 border-secondary shadow-2xl p-3 z-50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/15">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-secondary" /> Choose Button Style
                      </span>
                      <button
                        onClick={() => setStyleSwitcherOpen(false)}
                        className="text-white/40 hover:text-white text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      {[
                        { id: 'editorial-badge', name: '1. Oxford Editorial Badge', desc: 'Serif font with subtle gold outline & smooth gold fill' },
                        { id: 'solid-gold-pill', name: '2. Solid Gold Accent Pill', desc: 'High-contrast Filamer Gold pill with dark navy text' },
                        { id: 'swiss-line', name: '3. Swiss Architectural Line', desc: 'Minimalist border with directional arrow icon' },
                        { id: 'glass-pill', name: '4. Institutional Glass Tag', desc: 'Frosted translucent pill with pulsating security beacon' },
                        { id: 'compact-luxury', name: '5. Compact Luxury Icon', desc: 'Minimalist square with gold micro-accent & user icon' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectStyle(item.id as PortalBtnStyle)}
                          className={`text-left p-2 transition-all flex flex-col gap-0.5 border cursor-pointer ${
                            btnStyle === item.id 
                              ? 'bg-secondary/15 border-secondary text-white' 
                              : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] font-bold tracking-wide flex items-center justify-between">
                            {item.name}
                            {btnStyle === item.id && <span className="text-[9px] bg-secondary text-primary px-1 font-mono font-bold">ACTIVE</span>}
                          </span>
                          <span className="text-[10px] text-white/50 leading-tight">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Render Selected Portal Button Variant */}
              {renderPortalButton()}
            </div>
        </div>

        {/* Mobile Menu Trigger */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden h-9 w-9 flex items-center justify-center border border-white/20 text-white/70 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-surface z-[101] md:hidden flex flex-col shadow-2xl border-l border-border"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-primary text-white shrink-0">
                <span className="font-display font-bold text-secondary uppercase tracking-widest text-sm">
                  Menu
                </span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
                {/* Mobile Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsMobileMenuOpen(false);
                        handleSearch(e);
                      }
                    }}
                    className="w-full pl-10 pr-10 py-3 bg-background border border-border text-[13px] text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-primary transition-colors h-4 w-4 flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between pb-3 border-b border-border text-sm font-semibold uppercase tracking-wider ${path === '/' ? 'text-secondary' : 'text-primary'}`}>
                    Home <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                  <Link to="/journals" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between pb-3 border-b border-border text-sm font-semibold uppercase tracking-wider ${path.startsWith('/journals') ? 'text-secondary' : 'text-primary'}`}>
                    Journals <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                  <Link to="/archives" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between pb-3 border-b border-border text-sm font-semibold uppercase tracking-wider ${path.startsWith('/archives') ? 'text-secondary' : 'text-primary'}`}>
                    Archives <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                  <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between pb-3 border-b border-border text-sm font-semibold uppercase tracking-wider ${path.startsWith('/about') ? 'text-secondary' : 'text-primary'}`}>
                    About <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                  <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between pb-3 border-b border-border text-sm font-semibold uppercase tracking-wider ${path.startsWith('/contact') ? 'text-secondary' : 'text-primary'}`}>
                    Contact <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                </div>

                <div className="mt-auto pt-8">
                  {localStorage.getItem('token') ? (
                    <Link
                      to="/dashboard"
                      className="flex w-full items-center justify-center py-3 bg-primary text-white text-[13px] font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center py-3 bg-secondary text-primary text-[13px] font-bold tracking-widest uppercase hover:bg-secondary/90 transition-colors"
                    >
                      Portal Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default Navbar;
