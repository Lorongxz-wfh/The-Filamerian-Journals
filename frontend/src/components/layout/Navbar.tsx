import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, Search } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  return (
    <nav className="bg-primary sticky top-0 z-50">
      <div className="w-full px-6 lg:px-12 flex h-16 items-center justify-between gap-6">
        {/* Brand — flush left */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="font-display font-normal text-secondary text-xl tracking-wider uppercase leading-none">
            The Filamerian Journals
          </span>
        </Link>

        {/* Search — center, fills available space */}
        <div className="hidden md:block flex-grow max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
            <input
              type="text"
              placeholder="Search journals, articles, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-9 pr-4 py-2 bg-white border border-white text-[13px] text-primary placeholder:text-muted/50 focus:outline-none focus:border-border transition-colors"
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-primary border-t-[3px] border-secondary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto">
              <div className="flex flex-col py-2">
                <Link to="/journals?category=Science" className="px-6 py-4 text-[13px] font-medium text-white/80 hover:text-primary hover:bg-secondary transition-colors uppercase tracking-widest border-b border-white/10 last:border-0">
                  Science
                </Link>
                <Link to="/journals?category=Education" className="px-6 py-4 text-[13px] font-medium text-white/80 hover:text-primary hover:bg-secondary transition-colors uppercase tracking-widest border-b border-white/10 last:border-0">
                  Education
                </Link>
                <Link to="/journals?category=Arts" className="px-6 py-4 text-[13px] font-medium text-white/80 hover:text-primary hover:bg-secondary transition-colors uppercase tracking-widest border-b border-white/10 last:border-0">
                  Arts
                </Link>
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
