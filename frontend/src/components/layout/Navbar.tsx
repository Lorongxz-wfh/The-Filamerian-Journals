import { Link } from 'react-router';
import { Menu, Search } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-primary sticky top-0 z-50">
      <div className="container-custom flex h-16 items-center justify-between gap-6">
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
              className="w-full pl-9 pr-4 py-2 bg-white border border-white text-[13px] text-primary placeholder:text-muted/50 focus:outline-none focus:border-border transition-colors"
            />
          </div>
        </div>

        {/* Nav links + Login — flush right */}
        <div className="hidden md:flex items-center gap-8 shrink-0">
          <Link to="/journals" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors tracking-wide">
            Journals
          </Link>
          <Link to="/archives" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors tracking-wide">
            Archives
          </Link>
          <Link to="/about" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors tracking-wide">
            About
          </Link>
          <Link to="/contact" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors tracking-wide">
            Contact
          </Link>
          <span className="w-px h-5 bg-white/20" />
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

        {/* Mobile Menu Trigger */}
        <button className="md:hidden h-9 w-9 flex items-center justify-center border border-white/20 text-white/70 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
