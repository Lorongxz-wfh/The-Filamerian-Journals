import React, { useState, useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { useNavigate } from 'react-router';
import { MessageListSkeleton } from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/ui/DashboardHeader';

interface Notification {
  id: string;
  data: {
    title: string;
    message: string;
    type: string;
    action_url: string | null;
  };
  created_at: string;
  read_at: string | null;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string, url: string | null) => {
    try {
      await api.post(`/notifications/${id}/read`);
      if (url) {
        navigate(url);
      } else {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <DashboardHeader 
        title="Notifications"
        helpText="System alerts, publication notices, reviewer assignments, account approvals, and security updates."
      >
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-4 bg-background border border-border text-primary text-xs font-medium hover:border-primary/50 transition-colors shrink-0 cursor-pointer"
          title="Mark all as read"
        >
          <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span className="hidden sm:inline">Mark all as read</span>
          <span className="sm:hidden">Mark All</span>
        </button>
      </DashboardHeader>

      <div className="border border-border bg-surface">
        {loading ? (
          <MessageListSkeleton rows={8} />
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-xs sm:text-[13px] text-muted">No notifications found.</div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => markAsRead(notif.id, notif.data.action_url)}
                className={`p-3.5 sm:p-5 hover:bg-background transition-colors cursor-pointer flex gap-3 sm:gap-4 group ${!notif.read_at ? 'bg-primary/5' : ''}`}
              >
                <div className="shrink-0 pt-1">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${!notif.read_at ? 'bg-secondary' : 'bg-transparent'}`}></div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-[14px] ${!notif.read_at ? 'font-semibold text-primary' : 'font-medium text-muted'}`}>
                      {notif.data.title}
                    </h3>
                    <span className="text-[11px] text-muted">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted mb-2 leading-relaxed max-w-3xl">
                    {notif.data.message}
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <button 
                    onClick={(e) => deleteNotif(e, notif.id)}
                    className="h-8 w-8 flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
