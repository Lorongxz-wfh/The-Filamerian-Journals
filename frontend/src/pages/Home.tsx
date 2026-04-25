import React from 'react';
import Button from '@/components/ui/Button';
import JournalCard from '@/components/ui/JournalCard';
import { Search, ChevronRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Subtle Hero Section */}
      <section className="pt-12 pb-8 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tight">
            The Filamerian Journals
          </h1>
          <p className="text-base text-slate-500 font-serif leading-relaxed">
            Advancing research and scholarly excellence at Filamer Christian University. 
            Explore our collection of peer-reviewed journals across diverse academic disciplines.
          </p>
          
          {/* Subtle Search Bar */}
          <div className="relative max-w-xl mx-auto pt-4">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search articles, authors, or keywords..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Journals Grid (Left 8-9 Columns) */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
              Academic Journals
            </h2>
            <div className="flex gap-4">
              <button className="text-xs font-bold text-primary border-b-2 border-primary pb-1">All</button>
              <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors pb-1">Science</button>
              <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors pb-1">Education</button>
              <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors pb-1">Arts</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <JournalCard 
              title="FCU Multidisciplinary Research Journal"
              description="A peer-reviewed journal publishing original research from various academic fields."
              date="March 2024"
              volume="15"
              issue="01"
              image="https://picsum.photos/seed/res-1/600/400"
            />
            <JournalCard 
              title="Journal of Christian Education"
              description="Exploring the intersection of faith, learning, and modern pedagogical practices."
              date="December 2023"
              volume="08"
              issue="02"
              image="https://picsum.photos/seed/edu-1/600/400"
            />
            <JournalCard 
              title="The Filamerian Science Review"
              description="Scientific discoveries and engineering innovations from the Filamerian community."
              date="February 2024"
              volume="12"
              issue="01"
              image="https://picsum.photos/seed/sci-1/600/400"
            />
            <JournalCard 
              title="Business & Management Insights"
              description="Critical analysis and research on local and global business trends."
              date="January 2024"
              volume="05"
              issue="01"
              image="https://picsum.photos/seed/bus-1/600/400"
            />
          </div>
          
          <div className="flex justify-center pt-8">
            <Button variant="outline" size="md">
              View All Publications
            </Button>
          </div>
        </div>

        {/* Sidebar (Right 4 Columns) */}
        <div className="lg:col-span-4 space-y-10">
          {/* Announcements Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center justify-between">
              Announcements
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <span className="text-[10px] font-bold text-secondary uppercase">April {10 + i}, 2024</span>
                  <h4 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors leading-snug mt-1">
                    Call for Papers: Special Issue on Community Resilience and Health
                  </h4>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 text-xs font-bold text-primary/60 hover:text-primary transition-colors text-center border-t border-slate-50 pt-4">
              See All Announcements
            </button>
          </div>

          {/* Quick Links / Info */}
          <div className="space-y-6 px-2">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Resources</h3>
            <ul className="space-y-4">
              {['Submission Guidelines', 'Editorial Board', 'Ethics & Malpractice', 'Indexing & Abstracting'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-slate-500 hover:text-primary flex items-center gap-2 group transition-colors font-serif">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-secondary transition-colors" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
