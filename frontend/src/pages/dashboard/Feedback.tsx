import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { MessageListSkeleton } from '@/components/ui/Skeleton';

interface FeedbackItem {
  id: number;
  subject: string;
  category: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const Feedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get('/feedbacks');
      setFeedbacks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch feedbacks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSelect = async (id: number) => {
    setSelected(id);
    const item = feedbacks.find(f => f.id === id);
    if (item && !item.is_read) {
      try {
        await api.put(`/feedbacks/${id}`, { is_read: true });
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, is_read: true } : f));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/feedbacks/${id}`);
      setFeedbacks(feedbacks.filter(f => f.id !== id));
      if (selected === id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete feedback', err);
    }
  };

  const selectedItem = feedbacks.find((f) => f.id === selected);

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">Feedback</h1>
        <p className="text-[13px] text-muted mt-1">Messages and inquiries from users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Message List */}
        <div className="lg:col-span-5 border border-border bg-surface divide-y divide-border overflow-auto max-h-[600px]">
          {loading ? (
            <MessageListSkeleton rows={6} />
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center text-muted text-[13px]">
              No messages found.
            </div>
          ) : (
            feedbacks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  selected === item.id
                    ? 'bg-primary/5 border-l-2 border-l-primary'
                    : 'hover:bg-background border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[13px] truncate ${!item.is_read ? 'font-semibold text-primary' : 'font-medium text-primary/70'}`}>
                    {item.name}
                  </span>
                  <span className="text-[11px] text-muted shrink-0 ml-3">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-[12px] truncate ${!item.is_read ? 'text-primary/80 font-medium' : 'text-muted'}`}>
                  {item.subject}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-7 border border-border bg-surface p-6 flex flex-col h-full">
          {selectedItem ? (
            <div className="space-y-6 flex-grow flex flex-col">
              <div className="border-b border-border pb-4 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider mb-2">
                      {selectedItem.category || 'General'}
                    </span>
                    <h2 className="text-[15px] font-semibold text-primary leading-snug">{selectedItem.subject}</h2>
                  </div>
                  <button 
                    onClick={() => handleDelete(selectedItem.id)}
                    className="h-8 w-8 shrink-0 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-50 transition-colors rounded"
                    title="Delete message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[12px] text-muted">
                  <span>From: <span className="font-medium text-primary/70">{selectedItem.name}</span></span>
                  <span className="hidden sm:inline">•</span>
                  <span>Email: <a href={`mailto:${selectedItem.email}`} className="text-primary hover:underline">{selectedItem.email}</a></span>
                  <span className="hidden sm:inline">•</span>
                  <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[13px] text-primary/80 leading-relaxed whitespace-pre-wrap flex-grow">{selectedItem.message}</p>
              <div className="pt-4 border-t border-border mt-auto">
                <p className="text-[11px] text-muted mb-2">Note: Replying directly is not supported in this demo. Click the email above to reply via your email client.</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 flex-grow">
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
