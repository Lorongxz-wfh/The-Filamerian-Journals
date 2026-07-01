import React, { useState, useEffect } from 'react';
import { FileText, UserPlus, Users, Search } from 'lucide-react';
import api from '@/services/api';

const EditorSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Reviewer Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, usersRes] = await Promise.all([
        api.get('/submissions'),
        api.get('/users')
      ]);
      setSubmissions(subsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !selectedReviewer) return;
    try {
      await api.post(`/submissions/${selectedSub}/assign-reviewer`, { reviewer_id: selectedReviewer });
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign reviewer');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
    try {
      await api.put(`/submissions/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">Editorial Desk</h1>
        <p className="text-[13px] text-muted mt-1">Manage all pending manuscripts and peer review assignments</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-muted">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="border border-border bg-surface p-12 text-center space-y-4">
          <FileText className="h-10 w-10 text-muted/30 mx-auto" />
          <p className="text-[13px] font-medium text-primary">No submissions to manage.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">Manuscript</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[20%]">Author</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[15%]">Status</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[20%]">Reviewers</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-primary line-clamp-1">{sub.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{sub.journal?.title || 'Open Category'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[12px] text-primary">{sub.user?.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 bg-border/50 rounded-sm">
                      {sub.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {sub.reviews?.length > 0 ? (
                      <div className="space-y-1">
                        {sub.reviews.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-muted truncate mr-2" title={r.reviewer?.name}>{r.reviewer?.name}</span>
                            <span className={r.recommendation ? "text-emerald-500" : "text-yellow-500"}>
                              {r.recommendation ? r.recommendation.substring(0,3).toUpperCase() : 'WIP'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted italic">None assigned</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => { setSelectedSub(sub.id); setAssignModalOpen(true); }}
                        className="text-[11px] font-medium text-secondary hover:text-primary transition-colors uppercase tracking-wider"
                      >
                        Assign
                      </button>
                      <select 
                        onChange={(e) => updateStatus(sub.id, e.target.value)}
                        value={sub.status}
                        className="bg-background border border-border text-[11px] p-1.5 focus:outline-none uppercase tracking-wider"
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Reviewing</option>
                        <option value="revisions_required">Revisions</option>
                        <option value="accepted">Accept</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal Overlay */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Assign Reviewer</h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-muted hover:text-primary text-[11px] uppercase tracking-wider">Close</button>
            </div>
            <form onSubmit={handleAssignReviewer} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] text-primary uppercase tracking-wider">Select User</label>
                <select 
                  required
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  className="w-full bg-background border border-border p-3 text-[13px] focus:outline-none focus:border-primary/50"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.roles?.[0]?.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted">Assigning a user will automatically grant them the Reviewer role if they don't have it.</p>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground text-[11px] font-medium uppercase tracking-wider hover:bg-primary/90">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorSubmissions;
