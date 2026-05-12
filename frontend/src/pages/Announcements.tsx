import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

const demoAnnouncements = [
  { id: 1, title: 'Call for Papers: Special Issue on Community Resilience and Health', date: 'April 11, 2024', body: 'We invite researchers to submit original manuscripts exploring community resilience strategies in post-pandemic settings. Deadline: June 30, 2024.' },
  { id: 2, title: 'FCU Multidisciplinary Research Journal Now Indexed in ASEAN Citation Index', date: 'March 28, 2024', body: 'We are pleased to announce that the FCU Multidisciplinary Research Journal has been accepted for indexing in the ASEAN Citation Index (ACI).' },
  { id: 3, title: 'Editorial Board Meeting — April 2024', date: 'March 20, 2024', body: 'The quarterly editorial board meeting will be held on April 15, 2024 at 2:00 PM. All editors and associate editors are required to attend.' },
  { id: 4, title: 'Updated Submission Guidelines', date: 'March 10, 2024', body: 'Authors are advised to follow the updated manuscript formatting guidelines effective March 15, 2024. Key changes include revised citation format and abstract word limits.' },
  { id: 5, title: 'Filamerian Science Review — Open Access Policy', date: 'February 25, 2024', body: 'Starting Volume 13, The Filamerian Science Review will adopt a full Open Access policy under Creative Commons Attribution 4.0.' },
];

const Announcements: React.FC = () => {
  return (
    <div className="container-custom py-12 space-y-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider">Announcements</h1>
        <p className="text-[14px] text-muted max-w-xl leading-relaxed mt-2">
          Latest news and updates from The Filamerian Journals editorial office.
        </p>
      </div>

      <div className="space-y-4">
        {demoAnnouncements.map((item) => (
          <article key={item.id} className="border border-border bg-surface p-6 hover:bg-background transition-colors cursor-pointer group">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-secondary" />
              <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">{item.date}</span>
            </div>
            <h2 className="text-[15px] font-semibold text-primary group-hover:text-secondary transition-colors leading-snug mb-2">
              {item.title}
            </h2>
            <p className="text-[13px] text-muted leading-relaxed">{item.body}</p>
            <div className="flex items-center gap-1 mt-3 text-[12px] font-medium text-primary/50 group-hover:text-primary transition-colors">
              Read more <ChevronRight className="h-3 w-3" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
