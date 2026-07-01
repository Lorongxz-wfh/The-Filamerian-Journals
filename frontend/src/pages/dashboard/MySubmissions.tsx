import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import api from '@/services/api';

interface Submission {
  id: number;
  title: string;
  abstract: string | null;
  status: string;
  created_at: string;
  journal: {
    title: string;
  } | null;
  reviews: any[];
}

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get('/submissions');
        setSubmissions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-yellow-500/10 text-yellow-600 text-[11px] font-medium uppercase tracking-wider border border-yellow-500/20"><Clock className="w-3 h-3" /> Pending</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-blue-500/10 text-blue-600 text-[11px] font-medium uppercase tracking-wider border border-blue-500/20"><Eye className="w-3 h-3" /> Under Review</span>;
      case 'revisions_required':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-orange-500/10 text-orange-600 text-[11px] font-medium uppercase tracking-wider border border-orange-500/20"><AlertCircle className="w-3 h-3" /> Revisions</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-emerald-500/10 text-emerald-600 text-[11px] font-medium uppercase tracking-wider border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Accepted</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-red-500/10 text-red-600 text-[11px] font-medium uppercase tracking-wider border border-red-500/20"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-gray-500/10 text-gray-600 text-[11px] font-medium uppercase tracking-wider border border-gray-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">My Submissions</h1>
          <p className="text-[13px] text-muted mt-1">Track the status of your research manuscripts</p>
        </div>
        <Link 
          to="/dashboard/submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[12px] font-medium uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          Submit Manuscript
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-muted">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="border border-border bg-surface p-12 text-center space-y-4">
          <FileText className="h-10 w-10 text-muted/30 mx-auto" />
          <div>
            <p className="text-[13px] font-medium text-primary">No submissions yet</p>
            <p className="text-[12px] text-muted mt-1">You haven't submitted any manuscripts for review.</p>
          </div>
          <Link 
            to="/dashboard/submit"
            className="inline-block px-4 py-2 border border-border hover:border-primary/30 text-[12px] font-medium uppercase tracking-wider transition-colors mt-4"
          >
            Submit Your First Paper
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">Manuscript Title</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[20%]">Target Journal</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[15%]">Status</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[15%]">Submitted</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[10%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-medium text-primary line-clamp-1">{sub.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-muted line-clamp-1">{sub.journal?.title || 'Open Category'}</p>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[12px] text-muted">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-[11px] font-semibold text-primary uppercase tracking-wider hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
