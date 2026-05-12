import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface FeedbackItem {
  id: number;
  subject: string;
  from: string;
  message: string;
  date: string;
  read: boolean;
}

const demoFeedback: FeedbackItem[] = [
  { id: 1, subject: 'Issue with article upload', from: 'Dr. Julian Santos', message: 'I was unable to upload my revised manuscript. The system returned a 413 error. The file is within the stated 10MB limit.', date: '2024-03-20', read: false },
  { id: 2, subject: 'Request for volume extension', from: 'Prof. Maria Reyes', message: 'Could we extend the submission deadline for Vol. 16 by two weeks? Several faculty members have requested additional time.', date: '2024-03-18', read: false },
  { id: 3, subject: 'Indexing status inquiry', from: 'Dr. Ana Villanueva', message: 'When will the Business & Management Insights journal be indexed in Scopus? We submitted the application last quarter.', date: '2024-03-15', read: true },
  { id: 4, subject: 'Great new interface!', from: 'Prof. Carlo Tan', message: 'Just wanted to say the updated portal looks much more professional. The navigation is intuitive and clean.', date: '2024-03-12', read: true },
  { id: 5, subject: 'Reviewer assignment question', from: 'Dr. Elena Bautista', message: 'How do I assign external reviewers to submissions? I cannot find the option in my editor dashboard.', date: '2024-03-10', read: true },
];

const Feedback: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const selectedItem = demoFeedback.find((f) => f.id === selected);

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">Feedback</h1>
        <p className="text-[13px] text-muted mt-1">Messages and inquiries from users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Message List */}
        <div className="lg:col-span-5 border border-border bg-surface divide-y divide-border overflow-auto max-h-[600px]">
          {demoFeedback.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`w-full text-left px-5 py-4 transition-colors ${
                selected === item.id
                  ? 'bg-primary/5 border-l-2 border-l-primary'
                  : 'hover:bg-background border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[13px] truncate ${!item.read ? 'font-semibold text-primary' : 'font-medium text-primary/70'}`}>
                  {item.from}
                </span>
                <span className="text-[11px] text-muted shrink-0 ml-3">{item.date}</span>
              </div>
              <p className={`text-[12px] truncate ${!item.read ? 'text-primary/80' : 'text-muted'}`}>
                {item.subject}
              </p>
            </button>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-7 border border-border bg-surface p-6">
          {selectedItem ? (
            <div className="space-y-6">
              <div className="border-b border-border pb-4 space-y-2">
                <h2 className="text-[15px] font-semibold text-primary">{selectedItem.subject}</h2>
                <div className="flex items-center gap-4 text-[12px] text-muted">
                  <span>From: <span className="font-medium text-primary/70">{selectedItem.from}</span></span>
                  <span>{selectedItem.date}</span>
                </div>
              </div>
              <p className="text-[13px] text-primary/80 leading-relaxed">{selectedItem.message}</p>
              <div className="pt-4 border-t border-border">
                <textarea
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button className="px-5 py-2 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors">
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <MessageSquare className="h-8 w-8 text-muted/20 mb-3" />
              <p className="text-[13px] text-muted">Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
