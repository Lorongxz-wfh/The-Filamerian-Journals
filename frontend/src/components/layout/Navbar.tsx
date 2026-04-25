import { Link } from 'react-router';
import { BookOpen, User, Menu } from 'lucide-react';
import Button from '@/components/ui/Button';

const Navbar = () => {
  return (
    <nav className="border-b border-primary/5 bg-background/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="container-custom flex h-20 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg]">
            <BookOpen className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tighter text-primary leading-none">
              FILAMERIAN
            </span>
            <span className="text-[10px] font-bold text-secondary tracking-[0.3em] uppercase">
              Journals
            </span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/journals" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            Journals
          </Link>
          <Link to="/archives" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            Archives
          </Link>
          <Link to="/announcements" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            Announcements
          </Link>
          
          <div className="h-4 w-px bg-slate-200" />
          
          <Link to="/login">
            <Button size="sm" variant="ghost" className="gap-2">
              <User className="h-4 w-4" />
              Portal Login
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100">
          <Menu className="h-5 w-5 text-primary" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
