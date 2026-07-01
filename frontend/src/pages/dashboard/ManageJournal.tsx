import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, BookOpen, Calendar, Edit2, Trash2, ChevronDown } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';

interface Issue {
  id: number;
  volume_id: number;
  issue_number: number;
  published_at: string;
}

interface Volume {
  id: number;
  journal_id: number;
  volume_number: number;
  year: number;
  issues: Issue[];
}

interface Journal {
  id: number;
  title: string;
  volumes: Volume[];
}

const ManageJournal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVol, setExpandedVol] = useState<number | null>(null);

  // Volume Modal
  const [isVolModalOpen, setIsVolModalOpen] = useState(false);
  const [editingVol, setEditingVol] = useState<Volume | null>(null);
  const [volFormData, setVolFormData] = useState({ volume_number: '', year: '' });

  // Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [activeVolId, setActiveVolId] = useState<number | null>(null);
  const [issueFormData, setIssueFormData] = useState({ issue_number: '', published_at: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJournal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/journals/${slug}?with_volumes=1`);
      setJournal(res.data.data);
      if (res.data.data.volumes?.length > 0 && !expandedVol) {
        setExpandedVol(res.data.data.volumes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, [slug]);

  // --- Volume Handlers ---
  const handleOpenVolModal = (vol: Volume | null = null) => {
    setEditingVol(vol);
    setVolFormData({
      volume_number: vol ? String(vol.volume_number) : '',
      year: vol ? String(vol.year) : String(new Date().getFullYear()),
    });
    setIsVolModalOpen(true);
  };

  const submitVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingVol) {
        await api.put(`/volumes/${editingVol.id}`, volFormData);
      } else {
        await api.post('/volumes', { ...volFormData, journal_id: journal?.id });
      }
      await fetchJournal();
      setIsVolModalOpen(false);
    } catch (err) {
      alert('Failed to save volume');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVolume = async (volId: number) => {
    if (!window.confirm('Delete volume and all its issues?')) return;
    try {
      await api.delete(`/volumes/${volId}`);
      await fetchJournal();
    } catch (err) {
      alert('Failed to delete volume');
    }
  };

  // --- Issue Handlers ---
  const handleOpenIssueModal = (volId: number, issue: Issue | null = null) => {
    setActiveVolId(volId);
    setEditingIssue(issue);
    setIssueFormData({
      issue_number: issue ? String(issue.issue_number) : '',
      published_at: issue ? issue.published_at : new Date().toISOString().split('T')[0],
    });
    setIsIssueModalOpen(true);
  };

  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingIssue) {
        await api.put(`/issues/${editingIssue.id}`, issueFormData);
      } else {
        await api.post('/issues', { ...issueFormData, volume_id: activeVolId });
      }
      await fetchJournal();
      setIsIssueModalOpen(false);
    } catch (err) {
      alert('Failed to save issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteIssue = async (issueId: number) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await api.delete(`/issues/${issueId}`);
      await fetchJournal();
    } catch (err) {
      alert('Failed to delete issue');
    }
  };

  if (!journal && !loading) return <div className="py-10 text-center text-muted text-[13px]">Journal not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link to="/dashboard/journals" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Journals
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl uppercase tracking-wider line-clamp-1">{journal?.title || 'Loading...'}</h1>
            <p className="text-[13px] text-muted mt-1">Manage volumes and issues</p>
          </div>
          <Button onClick={() => handleOpenVolModal()} disabled={!journal} className="shrink-0 flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Volume
          </Button>
        </div>
      </div>

      {/* Volumes List */}
      <div className="space-y-4">
        {loading && !journal ? (
          <ListSkeleton colSpans={[12]} rows={4} />
        ) : journal?.volumes?.length === 0 ? (
          <div className="border border-border bg-surface p-10 text-center text-[13px] text-muted">
            No volumes added yet. Create one to get started.
          </div>
        ) : (
          journal?.volumes?.map((vol) => (
            <div key={vol.id} className="border border-border bg-surface">
              {/* Volume Header */}
              <div 
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-background transition-colors cursor-pointer"
                onClick={() => setExpandedVol(expandedVol === vol.id ? null : vol.id)}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-primary/30" />
                  <span className="text-[14px] font-medium text-primary">
                    Volume {vol.volume_number} ({vol.year})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-muted">
                    {vol.issues?.length || 0} issue(s)
                  </span>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenVolModal(vol)} className="text-muted/40 hover:text-primary transition-colors h-7 w-7 flex items-center justify-center">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteVolume(vol.id)} className="text-muted/40 hover:text-red-500 transition-colors h-7 w-7 flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ml-2 ${expandedVol === vol.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Issues List */}
              {expandedVol === vol.id && (
                <div className="border-t border-border bg-background/50">
                  <div className="px-5 py-3 border-b border-border/50 flex justify-between items-center bg-surface/50">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Issues</span>
                    <button 
                      onClick={() => handleOpenIssueModal(vol.id)}
                      className="text-[11px] font-medium text-primary hover:text-secondary flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Issue
                    </button>
                  </div>
                  
                  {vol.issues?.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[12px] text-muted">No issues in this volume.</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {vol.issues?.map(issue => (
                        <div key={issue.id} className="px-5 py-3 flex items-center justify-between hover:bg-background transition-colors group">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-3.5 w-3.5 text-secondary/60" />
                            <span className="text-[13px] font-medium text-primary">Issue {issue.issue_number}</span>
                            <span className="text-[11px] text-muted ml-2">Published: {issue.published_at}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenIssueModal(vol.id, issue)} className="text-muted/60 hover:text-primary hover:bg-black/5 rounded h-6 w-6 flex items-center justify-center transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteIssue(issue.id)} className="text-muted/60 hover:text-red-500 hover:bg-red-500/10 rounded h-6 w-6 flex items-center justify-center transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Volume Modal */}
      <Modal isOpen={isVolModalOpen} onClose={() => !isSubmitting && setIsVolModalOpen(false)} title={editingVol ? 'Edit Volume' : 'New Volume'}>
        <form onSubmit={submitVolume} className="space-y-4">
          <Input 
            label="Volume Number" required type="number" value={volFormData.volume_number} onChange={e => setVolFormData({...volFormData, volume_number: e.target.value})}
          />
          <Input 
            label="Year" required type="number" value={volFormData.year} onChange={e => setVolFormData({...volFormData, year: e.target.value})}
          />
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsVolModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Volume'}</Button>
          </div>
        </form>
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={isIssueModalOpen} onClose={() => !isSubmitting && setIsIssueModalOpen(false)} title={editingIssue ? 'Edit Issue' : 'New Issue'}>
        <form onSubmit={submitIssue} className="space-y-4">
          <Input 
            label="Issue Number" required type="number" value={issueFormData.issue_number} onChange={e => setIssueFormData({...issueFormData, issue_number: e.target.value})}
          />
          <Input 
            label="Publication Date" required type="date" value={issueFormData.published_at} onChange={e => setIssueFormData({...issueFormData, published_at: e.target.value})}
          />
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsIssueModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Issue'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageJournal;
