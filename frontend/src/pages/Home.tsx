import React from 'react';
import Button from '@/components/ui/Button';
import JournalCard from '@/components/ui/JournalCard';
import { BookOpen, GraduationCap, Globe, Users } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section - Asymmetric Editorial Style */}
      <section className="relative pt-12 md:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content (Left 7 Columns) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8">
            <div className="inline-flex items-center rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-bold text-secondary uppercase tracking-[0.2em] animate-fade-in">
              Official Research Repository
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-none tracking-tighter text-primary animate-slide-up">
              Advancing Knowledge <br /> 
              <span className="italic font-editorial text-secondary">Through Excellence.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-serif max-w-xl leading-relaxed animate-slide-up delay-100">
              The Filamerian Journals provide a prestigious platform for faculty and students to publish 
              peer-reviewed research that bridges disciplinary divides and impacts the global community.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4 animate-slide-up delay-200">
              <Button size="lg" showArrow>
                Browse All Journals
              </Button>
              <Button variant="outline" size="lg">
                About the Publisher
              </Button>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 pt-12 w-full border-t border-slate-200/50 animate-fade-in delay-300">
              <div>
                <span className="block text-3xl font-display font-bold text-primary">12+</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest">Active Journals</span>
              </div>
              <div>
                <span className="block text-3xl font-display font-bold text-primary">500+</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest">Articles Published</span>
              </div>
              <div>
                <span className="block text-3xl font-display font-bold text-primary">25k+</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest">Global Reads</span>
              </div>
            </div>
          </div>

          {/* Featured Asset (Right 5 Columns) */}
          <div className="lg:col-span-5 relative animate-fade-in delay-200">
            <div className="bezel-card-outer rotate-2 hover:rotate-0 transition-transform duration-700">
              <div className="bezel-card-inner aspect-[3/4] p-0 overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/journal-main/800/1200" 
                  alt="Featured Journal"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Decorative background orb */}
            <div className="absolute -z-10 -top-20 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary">
              Featured Publications
            </h2>
            <p className="text-slate-500 font-serif max-w-xl">
              Explore our top-tier multidisciplinary journals covering Science, Arts, Education, and Business.
            </p>
          </div>
          <Button variant="ghost" showArrow>
            View Archives
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <JournalCard 
            title="FCU Multidisciplinary Research Journal"
            description="The flagship publication featuring impactful research across all disciplines within Filamer Christian University."
            date="January 2024"
            volume="15"
            issue="01"
            image="https://picsum.photos/seed/res1/600/800"
          />
          <JournalCard 
            title="The Filamerian Journal of Education"
            description="Dedicated to advancing pedagogical strategies and educational management in the 21st century."
            date="December 2023"
            volume="08"
            issue="02"
            image="https://picsum.photos/seed/edu1/600/800"
          />
          <JournalCard 
            title="Science and Technology Review"
            description="Focusing on innovation, engineering breakthroughs, and scientific discoveries from the FCU community."
            date="March 2024"
            volume="12"
            issue="01"
            image="https://picsum.photos/seed/sci1/600/800"
          />
        </div>
      </section>

      {/* Philosophy / About Section */}
      <section className="bezel-card-outer bg-primary py-20 px-8 md:px-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <GraduationCap className="w-96 h-96 text-white" />
        </div>
        
        <div className="max-w-4xl space-y-12 relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
            Our commitment to <br />
            <span className="italic font-editorial text-secondary">Academic Integrity.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white">Global Reach</h3>
              <p className="text-slate-300 text-sm font-serif leading-relaxed">
                We ensure that your research is indexed and accessible to scholars worldwide, 
                maximizing its impact and citation potential.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white">Peer Reviewed</h3>
              <p className="text-slate-300 text-sm font-serif leading-relaxed">
                A rigorous double-blind review process ensures the highest quality 
                of scholarly output and academic integrity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
