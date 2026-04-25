import React from 'react';
import Button from '@/components/ui/Button';
import JournalCard from '@/components/ui/JournalCard';
import { Search, ChevronRight, Bookmark } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Subtle Hero Section with Blue Accents */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-primary/[0.03] to-transparent border-b border-primary/5">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Bookmark className="h-3 w-3 text-secondary" />
              Filamer Christian University
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight leading-tight">
              Scholarly Excellence <br />
              <span className="italic font-editorial text-secondary">In Every Discipline.</span>
            </h1>
            
            <p className="text-lg text-slate-600 font-serif leading-relaxed max-w-2xl mx-auto">
              A comprehensive repository of research and innovation, fostering academic 
              growth and global impact through peer-reviewed publications.
            </p>
            
            {/* Search Bar with Blue Focus */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-primary/40" />
              </div>
              <input 
                type="text" 
                placeholder="Search research papers, journals, authors..."
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-primary/10 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm placeholder:text-slate-400"
              />
              <button className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Journals Grid */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between border-b-2 border-primary/5 pb-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-primary uppercase tracking-widest">
                  Academic Journals
                </h2>
                <div className="h-1 w-12 bg-secondary rounded-full" />
              </div>
              <div className="flex gap-6">
                <button className="text-[11px] font-bold text-primary border-b-2 border-primary pb-2">All</button>
                <button className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors pb-2">Science</button>
                <button className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors pb-2">Education</button>
                <button className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors pb-2">Arts</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <JournalCard 
                title="FCU Multidisciplinary Research Journal"
                description="The flagship publication featuring impactful research across all disciplines within the University."
                date="March 2024"
                volume="15"
                issue="01"
                image="https://picsum.photos/seed/res-blue/600/400"
              />
              <JournalCard 
                title="Journal of Christian Education"
                description="Bridging faith and learning through innovative pedagogical research and management."
                date="December 2023"
                volume="08"
                issue="02"
                image="https://picsum.photos/seed/edu-blue/600/400"
              />
              <JournalCard 
                title="The Filamerian Science Review"
                description="Peer-reviewed innovations and scientific breakthroughs from the Filamerian community."
                date="February 2024"
                volume="12"
                issue="01"
                image="https://picsum.photos/seed/sci-blue/600/400"
              />
              <JournalCard 
                title="Business & Management Insights"
                description="Research-driven strategies and insights for sustainable business development."
                date="January 2024"
                volume="05"
                issue="01"
                image="https://picsum.photos/seed/bus-blue/600/400"
              />
            </div>
            
            <div className="flex justify-center pt-10">
              <Button variant="outline" size="lg" className="border-primary/20 text-primary hover:bg-primary/5 rounded-2xl">
                View All Publications
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            {/* Announcements Section */}
            <div className="bg-white border-2 border-primary/5 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12" />
              
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
                Announcements
                <ChevronRight className="h-4 w-4 text-secondary" />
              </h3>
              
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group cursor-pointer relative pl-4 border-l-2 border-primary/10 hover:border-secondary transition-colors">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">April {10 + i}, 2024</span>
                    <h4 className="text-sm font-bold text-primary group-hover:text-primary/80 transition-colors leading-snug mt-2">
                      Call for Papers: Special Issue on Community Resilience and Health
                    </h4>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-10 text-[10px] font-bold text-primary/40 hover:text-primary uppercase tracking-widest transition-colors text-center border-t border-slate-50 pt-6">
                See All News
              </button>
            </div>

            {/* Resources Section */}
            <div className="space-y-8 px-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-grow bg-primary/10" />
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.3em]">Resources</h3>
                <div className="h-px flex-grow bg-primary/10" />
              </div>
              
              <ul className="grid grid-cols-1 gap-5">
                {['Submission Guidelines', 'Editorial Board', 'Ethics & Malpractice', 'Indexing & Abstracting'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 hover:text-primary flex items-center justify-between group transition-colors font-serif italic">
                      {link}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-secondary" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
