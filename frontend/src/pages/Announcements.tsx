import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import api from '@/services/api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/public/announcements');
        setAnnouncements(res.data.data);
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="container-custom py-12 space-y-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider">Announcements</h1>
        <p className="text-[14px] text-muted max-w-xl leading-relaxed mt-2">
          Latest news and updates from The Filamerian Journals editorial office.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-muted">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="py-20 text-center border border-border bg-surface text-muted text-[13px]">No announcements posted yet.</div>
        ) : (
          announcements.map((item) => (
            <article key={item.id} className="border border-border bg-surface p-6 hover:bg-background transition-colors cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-secondary" />
                <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mb-2">
                {item.title}
              </h2>
              <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap">{item.content}</p>
              <div className="flex items-center gap-1 mt-3 text-[12px] font-medium text-primary/50 group-hover:text-primary transition-colors">
                Read more <ChevronRight className="h-3 w-3" />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
