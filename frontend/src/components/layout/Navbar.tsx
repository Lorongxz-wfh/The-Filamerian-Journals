import { Link } from 'react-router';
import { BookOpen, Menu, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

const Navbar = () => {
  return (
    <nav className="border-b-2 border-primary/10 bg-white sticky top-0 z-50">
      <div className="container-custom flex h-20 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl tracking-tighter text-primary leading-none">
              FILAMERIAN
            </span>
            <span className="text-[10px] font-bold text-secondary tracking-[0.3em] uppercase leading-none mt-1.5">
              Journals
            </span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            <Link to="/journals" className="text-xs font-bold text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
              Journals
            </Link>
            <Link to="/archives" className="text-xs font-bold text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
              Archives
            </Link>
            <Link to="/announcements" className="text-xs font-bold text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
              Announcements
            </Link>
          </div>
          
          <div className="flex items-center gap-5 border-l border-slate-100 pl-10">
            <button className="text-slate-400 hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/login">
              <Button size="sm" className="h-10 text-xs rounded-lg px-6 shadow-md shadow-primary/10">
                Portal Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Trigger */}
        <button className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          <Menu className="h-5 w-5 text-primary" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
