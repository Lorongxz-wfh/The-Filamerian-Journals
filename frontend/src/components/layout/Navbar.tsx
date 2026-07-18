import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import SearchDropdown from '@/components/ui/SearchDropdown';
import api from '@/services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{ journals: any[]; articles: any[] } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [dropdownCategories, setDropdownCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('categories_cache') || '["All", "Science", "Education", "Arts", "Multidisciplinary"]');
      setDropdownCategories(cached.filter((c: string) => c !== 'All'));
    } catch {
      setDropdownCategories(["Science", "Education", "Arts", "Multidisciplinary"]);
    }
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  return (
    <nav className="bg-primary sticky top-0 z-50">
      <div className="container-custom flex h-16 items-center justify-between gap-4 lg:gap-6">
        {/* Brand — flush left */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="font-display font-normal text-secondary text-xl tracking-wider uppercase leading-none">
            The Filamerian Journals
          </span>
        </Link>

        {/* Search — center, fills available space */}
        <div className="hidden md:block flex-grow max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
            <input
              type="text"
              placeholder="Search journals, articles, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-[#f4f4f5] border border-transparent text-[13px] text-primary placeholder:text-muted/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-white/30 transition-all"
            />
            
            <SearchDropdown 
              query={debouncedSearch}
              results={searchResults}
              loading={isSearchLoading}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        </div>

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
            <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-48 w-max max-w-2xl bg-primary border-t-[3px] border-secondary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto">
              <div 
                className="grid bg-white/10 gap-px" 
                style={{ 
                  gridTemplateColumns: dropdownCategories.length > 10 ? 'repeat(3, minmax(180px, 1fr))' : 
                                       dropdownCategories.length > 5 ? 'repeat(2, minmax(180px, 1fr))' : 
                                       '1fr' 
                }}
              >
                {dropdownCategories.map(cat => (
                  <Link 
                    key={cat}
                    to={`/journals?category=${encodeURIComponent(cat)}`} 
                    className="flex px-6 py-4 bg-primary text-[13px] font-medium text-white/80 hover:text-primary hover:bg-secondary transition-colors uppercase tracking-widest"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
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
          
          <div className="flex items-center h-full ml-2">
            <span className="w-px h-5 bg-white/20 mr-6" />
            {localStorage.getItem('token') ? (
              <Link
                to="/dashboard"
                className="text-[13px] font-semibold text-secondary hover:text-secondary/80 transition-colors tracking-wide"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-[13px] font-semibold text-secondary hover:text-secondary/80 transition-colors tracking-wide"
              >
                Portal Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Trigger */}
        <button className="md:hidden h-9 w-9 flex items-center justify-center border border-white/20 text-white/70 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
