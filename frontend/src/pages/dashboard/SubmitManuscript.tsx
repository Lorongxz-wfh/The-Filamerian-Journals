import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

const SubmitManuscript: React.FC = () => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journalId, setJournalId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await api.get('/public/journals');
        setJournals(res.data.data); // Assuming paginated response based on previous files
      } catch (err) {
        console.error(err);
      }
    };
    fetchJournals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload a PDF manuscript.');

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    if (journalId) formData.append('journal_id', journalId);
    formData.append('pdf', file);

    try {
      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard/submissions');
    } catch (err) {
      console.error(err);
      alert('Failed to submit manuscript.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider mb-4"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <h1 className="text-xl uppercase tracking-wider">Submit Manuscript</h1>
        <p className="text-[13px] text-muted mt-1">Upload your research paper for peer review</p>
      </div>

      <div className="border border-border bg-surface p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Manuscript Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border p-3 text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Enter full title of the paper"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Target Journal (Optional)
            </label>
            <select
              value={journalId}
              onChange={(e) => setJournalId(e.target.value)}
              className="w-full bg-background border border-border p-3 text-[13px] focus:outline-none focus:border-primary/50 transition-colors appearance-none"
            >
              <option value="">Open Category / Unsure</option>
              {journals.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Abstract
            </label>
            <textarea
              rows={5}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full bg-background border border-border p-3 text-[13px] focus:outline-none focus:border-primary/50 transition-colors resize-y"
              placeholder="Provide a brief summary of your research..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Manuscript File (PDF Only) <span className="text-red-500">*</span>
            </label>
            
            <div className="relative border-2 border-dashed border-border hover:border-primary/30 transition-colors bg-background p-8 flex flex-col items-center justify-center gap-3">
              <input 
                type="file" 
                accept="application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-[13px] font-medium text-primary text-center">{file.name}</p>
                  <p className="text-[11px] text-muted uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted/50" />
                  <p className="text-[13px] font-medium text-primary text-center">Click or drag file to upload</p>
                  <p className="text-[11px] text-muted uppercase tracking-wider">Maximum file size: 10MB</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[12px] font-medium uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitManuscript;
