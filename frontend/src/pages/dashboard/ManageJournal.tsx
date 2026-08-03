import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumbs';

interface Volume {
  id: number;
  journal_id: number;
  volume_number: number;
  year: number;
}

interface Journal {
  id: number;
  slug?: string;
  title: string;
  volumes: Volume[];
}

const ManageJournal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVol, setExpandedVol] = useState<number | null>(null);

  // Volume Modal
  const [isVolModalOpen, setIsVolModalOpen] = useState(false);
  const [editingVol, setEditingVol] = useState<Volume | null>(null);
  const [volFormData, setVolFormData] = useState({ volume_number: '', year: '' });
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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
        toast.success('Volume updated successfully');
      } else {
        await api.post('/volumes', { ...volFormData, journal_id: journal?.id });
        toast.success('Volume created successfully');
      }
      await fetchJournal();
      setIsVolModalOpen(false);
    } catch (err) {
      toast.error('Failed to save volume');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVolume = (volId: number) => {
    setDeleteTarget(volId);
  };

  const confirmDeleteVolume = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/volumes/${deleteTarget}`);
      await fetchJournal();
      toast.success('Volume deleted successfully');
    } catch (err) {
      toast.error('Failed to delete volume');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!journal && !loading) return <div className="py-10 text-center text-muted text-[13px]">Journal not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        title={<span className="line-clamp-1">{journal?.title || <Skeleton className="h-7 w-64 rounded inline-block" />}</span>}
        preTitle={
          <Breadcrumbs className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/journals">My Journals</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-primary truncate max-w-md">
                  {journal?.title || <Skeleton className="h-4 w-40 inline-block align-middle" />}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumbs>
        }
      >
        <Button onClick={() => handleOpenVolModal()} disabled={!journal} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Volume
        </Button>
      </DashboardHeader>

      {/* Volumes List */}
      <div className="space-y-4">
        {loading && !journal ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border bg-surface p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-48 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : journal?.volumes?.length === 0 ? (
          <div className="border border-border bg-surface p-10 text-center text-[13px] text-muted">
            No volumes added yet. Create one to get started.
          </div>
        ) : (
          journal?.volumes?.map((vol) => (
            <div key={vol.id} className="border border-border bg-surface">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => navigate(`/dashboard/volumes/${vol.id}`)}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-primary/30" />
                  <span className="text-[14px] font-medium text-primary">
                    {vol.volume_number} ({vol.year})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <IconButton icon={Edit2} onClick={() => handleOpenVolModal(vol)} title="Edit" />
                    <IconButton icon={Trash2} variant="danger" onClick={() => deleteVolume(vol.id)} title="Delete" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Volume Modal */}
      <Modal 
        isOpen={isVolModalOpen} 
        onClose={() => !isSubmitting && setIsVolModalOpen(false)} 
        title={editingVol ? 'Edit Volume' : 'New Volume'}
        isDirty={volFormData.volume_number !== (editingVol ? String(editingVol.volume_number) : '') || volFormData.year !== (editingVol ? String(editingVol.year) : String(new Date().getFullYear()))}
      >
        <form onSubmit={submitVolume} className="space-y-4">
          <Input 
            label="Volume Name (e.g. 'Vol. 1 Issue 1' or 'CCS Volume 2')" 
            required 
            type="text" 
            value={volFormData.volume_number} 
            onChange={e => setVolFormData({...volFormData, volume_number: e.target.value})}
            autoFocus
          />
          <Input 
            label="Year" 
            required 
            type="number" 
            value={volFormData.year} 
            onChange={e => setVolFormData({...volFormData, year: e.target.value})}
          />
          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsVolModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{editingVol ? 'Save Changes' : 'Create Volume'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteVolume}
        title="Delete Volume"
        message="Are you sure you want to delete this volume and all associated issues? Published items will be safely archived."
      />
    </div>
  );
};

export default ManageJournal;
