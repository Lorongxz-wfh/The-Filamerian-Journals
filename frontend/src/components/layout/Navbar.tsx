import { Link } from 'react-router';
import { BookOpen, User, Menu, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

const Navbar = () => {
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tighter text-primary leading-none">
              FILAMERIAN
            </span>
            <span className="text-[9px] font-bold text-secondary tracking-[0.2em] uppercase leading-none mt-1">
              Journals
            </span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 border-r border-slate-200 pr-8 mr-2">
            <Link to="/journals" className="text-xs font-bold text-slate-500 hover:text-primary uppercase tracking-wider transition-colors">
              Journals
            </Link>
            <Link to="/archives" className="text-xs font-bold text-slate-500 hover:text-primary uppercase tracking-wider transition-colors">
              Archives
            </Link>
            <Link to="/announcements" className="text-xs font-bold text-slate-500 hover:text-primary uppercase tracking-wider transition-colors">
              Announcements
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-primary transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <Link to="/login">
              <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg px-4 border-slate-200">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Trigger */}
        <button className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
          <Menu className="h-4 w-4 text-primary" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
