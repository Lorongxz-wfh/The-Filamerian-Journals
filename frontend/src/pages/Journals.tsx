import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import JournalCard from '@/components/ui/JournalCard';
import { Search, SlidersHorizontal } from 'lucide-react';

interface Journal {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  // Add other fields as needed
}

const Journals: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const response = await api.get('/journals');
        // The API resource collection returns data wrapped in a 'data' property
        setJournals(response.data.data);
      } catch (err) {
        console.error('Error fetching journals:', err);
        setError('Failed to load journals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, []);

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tight">
            Our Journals
          </h1>
          <p className="text-slate-500 font-serif max-w-xl">
            Explore our collection of peer-reviewed journals. From science to theology, 
            we provide a platform for diverse scholarly voices.
          </p>
        </div>
        
        {/* Search & Filter Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter journals..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-primary hover:bg-slate-50 transition-all shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Journals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[400px] bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-rose-500 font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {journals.map((journal) => (
            <JournalCard 
              key={journal.id}
              title={journal.title}
              description={journal.description}
              image={journal.cover_image || undefined}
              // We'll need to update JournalCard to accept ID for navigation
            />
          ))}
        </div>
      )}
      
      {journals.length === 0 && !loading && !error && (
        <div className="p-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-slate-400 font-serif italic">No journals found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Journals;
