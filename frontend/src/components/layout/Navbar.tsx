import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, Search, X, ChevronRight, BookOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import SearchDropdown from '@/components/ui/SearchDropdown';
import { useSettings } from '@/contexts/SettingsContext';

import api from '@/services/api';

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  interface Category {
    id: number;
    name: string;
    slug: string;
  }
  const [dropdownCategories, setDropdownCategories] = useState<Category[]>([]);

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
        {/* Desktop Navbar Layout (>= md) */}
        <div className="container-custom hidden md:flex h-16 items-center justify-between gap-4 lg:gap-6">
          {/* Brand — flush left */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img src="/TFJ-SVG.svg" alt="The FCU Journals Logo" className="h-9 w-9 object-contain shrink-0" />
            <span className="font-display font-normal text-secondary text-xl tracking-wider uppercase leading-none">
              {settings.site_title}
            </span>
          </Link>

          {/* Search — center, fills available space (hidden on Home page to prevent double search) */}
          {path !== '/' ? (
            <div className="flex-grow max-w-md">
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
                      className="text-muted/50 hover:text-primary transition-colors h-4 w-4 flex items-center justify-center pointer-events-auto cursor-pointer"
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
            <div className="flex-grow max-w-md" />
          )}

          {/* Nav links + Login — flush right */}
          <div className="flex items-center gap-6 shrink-0 h-full">
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

            <div className="flex items-center h-full">
              <span className="w-px h-5 bg-white/20 mx-4" />
              {localStorage.getItem('token') ? (
                <Link
                  to="/dashboard"
                  title="Dashboard"
                  aria-label="Go to Dashboard"
                  className="h-9 w-9 rounded-sm flex items-center justify-center border border-secondary/40 text-secondary bg-secondary/10 hover:bg-secondary/20 hover:border-secondary transition-all duration-200 active:scale-95 shadow-xs cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  title="Portal Login"
                  aria-label="Portal Login"
                  className="h-9 w-9 rounded-sm flex items-center justify-center border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/[0.08] transition-all duration-200 active:scale-95 shadow-xs cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navbar Layout (< md): Left Menu Button, Center Brand, Right Portal Login */}
        <div className="container-custom flex md:hidden h-16 items-center justify-between gap-3 px-4">
          {/* Left: Mobile Menu Trigger */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="h-9 w-9 flex items-center justify-center border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/[0.08] transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Center: Brand Name (Centered and fitted) */}
          <Link to="/" className="flex-1 min-w-0 flex items-center justify-center gap-2 px-2">
            <img src="/TFJ-SVG.svg" alt="The FCU Journals Logo" className="h-6 w-6 object-contain shrink-0" />
            <span className="font-display font-normal text-secondary text-[15px] sm:text-lg tracking-wider uppercase leading-tight truncate">
              {settings.site_title}
            </span>
          </Link>

          {/* Right: Dashboard / Login Icon */}
          <div className="shrink-0">
            {localStorage.getItem('token') ? (
              <Link
                to="/dashboard"
                title="Dashboard"
                aria-label="Go to Dashboard"
                className="h-9 w-9 rounded-sm flex items-center justify-center border border-secondary/40 text-secondary bg-secondary/10 hover:bg-secondary/20 hover:border-secondary transition-all duration-200 active:scale-95 shadow-xs"
              >
                <BookOpen className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                title="Portal Login"
                aria-label="Portal Login"
                className="h-9 w-9 rounded-sm flex items-center justify-center border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/[0.08] transition-all duration-200 active:scale-95 shadow-xs"
              >
                <BookOpen className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

      {/* Mobile Menu Drawer (Slides out from LEFT) */}
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-surface z-[101] md:hidden flex flex-col shadow-2xl border-r border-border"
            >
              <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-border bg-primary text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="/TFJ-SVG.svg" alt="The FCU Journals Logo" className="h-6 w-6 object-contain shrink-0" />
                  <span className="font-display font-bold text-secondary uppercase tracking-widest text-sm">
                    Navigation Menu
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                  aria-label="Close Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 flex flex-col justify-between gap-6">
                <div className="space-y-6">
                  {/* Mobile Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                    <input
                      type="text"
                      placeholder="Search journals, articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsMobileMenuOpen(false);
                          handleSearch(e);
                        }
                      }}
                      className="w-full pl-9 pr-9 py-2.5 bg-background border border-border text-xs text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-primary transition-colors h-4 w-4 flex items-center justify-center cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        path === '/'
                          ? 'bg-primary text-secondary border-l-3 border-secondary'
                          : 'text-primary hover:bg-background'
                      }`}
                    >
                      <span>Home</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>

                    <Link
                      to="/journals"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        path.startsWith('/journals') || path.startsWith('/articles')
                          ? 'bg-primary text-secondary border-l-3 border-secondary'
                          : 'text-primary hover:bg-background'
                      }`}
                    >
                      <span>Journals</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>

                    {/* Quick Category links under Journals */}
                    {dropdownCategories.length > 0 && (
                      <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-border/40 ml-4">
                        {dropdownCategories.slice(0, 4).map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/journals?category=${encodeURIComponent(cat.slug)}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-1 text-[11px] font-medium text-muted hover:text-primary transition-colors uppercase tracking-wider truncate"
                          >
                            · {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    <Link
                      to="/archives"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        path.startsWith('/archives')
                          ? 'bg-primary text-secondary border-l-3 border-secondary'
                          : 'text-primary hover:bg-background'
                      }`}
                    >
                      <span>Archives</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>

                    <Link
                      to="/about"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        path.startsWith('/about')
                          ? 'bg-primary text-secondary border-l-3 border-secondary'
                          : 'text-primary hover:bg-background'
                      }`}
                    >
                      <span>About Us</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>

                    <Link
                      to="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        path.startsWith('/contact')
                          ? 'bg-primary text-secondary border-l-3 border-secondary'
                          : 'text-primary hover:bg-background'
                      }`}
                    >
                      <span>Contact Us</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>
                  </div>
                </div>

                {/* Bottom Portal / Dashboard Action */}
                <div className="pt-6 border-t border-border mt-auto">
                  {localStorage.getItem('token') ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 py-3 bg-primary text-white text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <BookOpen className="h-4 w-4 text-secondary" />
                      <span>Open Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 py-3 bg-secondary text-primary text-xs font-bold tracking-widest uppercase hover:bg-secondary/90 transition-colors shadow-xs"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Portal Login</span>
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
