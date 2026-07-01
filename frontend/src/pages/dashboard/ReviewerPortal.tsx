import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api, { STORAGE_URL } from '@/services/api';

interface Review {
  id: number;
  comments: string | null;
  recommendation: string | null;
  submission: {
    id: number;
    title: string;
    abstract: string | null;
    manuscript_path: string;
  };
}

const ReviewerPortal: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (submissionId: number) => {
    try {
      const res = await api.get(`/articles/${submissionId}/download-url`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert('Error downloading manuscript. It may not exist.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview || !recommendation) return alert('Select a recommendation');
    
    setSubmitting(true);
    try {
      await api.put(`/reviews/${activeReview.id}`, { comments, recommendation });
      alert('Review submitted successfully!');
      setActiveReview(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl uppercase tracking-wider">My Reviews</h1>
        <p className="text-[13px] text-muted mt-1">Evaluate manuscripts assigned to you</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-muted">Loading assignments...</div>
      ) : reviews.length === 0 ? (
        <div className="border border-border bg-surface p-12 text-center space-y-4">
          <Eye className="h-10 w-10 text-muted/30 mx-auto" />
          <div>
            <p className="text-[13px] font-medium text-primary">No pending reviews</p>
            <p className="text-[12px] text-muted mt-1">You have not been assigned any manuscripts yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Review List */}
          <div className="lg:col-span-5 border border-border bg-surface divide-y divide-border">
            <div className="px-5 py-4 bg-background/50 border-b border-border">
              <h2 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Assigned Papers</h2>
            </div>
            {reviews.map((rev) => (
              <button
                key={rev.id}
                onClick={() => {
                  setActiveReview(rev);
                  setComments(rev.comments || '');
                  setRecommendation(rev.recommendation || '');
                }}
                className={`w-full text-left px-5 py-4 hover:bg-background/50 transition-colors ${activeReview?.id === rev.id ? 'bg-background' : ''}`}
              >
                <p className="text-[13px] font-medium text-primary line-clamp-2">{rev.submission.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  {rev.recommendation ? (
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider border border-emerald-500/20 px-1.5 py-0.5 rounded-sm bg-emerald-500/10">Completed</span>
                  ) : (
                    <span className="text-[10px] font-medium text-yellow-600 uppercase tracking-wider border border-yellow-500/20 px-1.5 py-0.5 rounded-sm bg-yellow-500/10">Pending</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active Review Form */}
          <div className="lg:col-span-7">
            {activeReview ? (
              <div className="border border-border bg-surface p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-primary leading-tight">{activeReview.submission.title}</h3>
                  <button 
                    onClick={() => handleDownload(activeReview.submission.id)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-border hover:border-primary/30 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                  >
                    <FileText className="h-3 w-3" /> Download Manuscript PDF
                  </button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Abstract</p>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {activeReview.submission.abstract || 'No abstract provided.'}
                  </p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-6 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      Reviewer Comments <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full bg-background border border-border p-3 text-[13px] focus:outline-none focus:border-primary/50 transition-colors resize-y"
                      placeholder="Provide detailed feedback on methodology, clarity, and contribution..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      Final Recommendation <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`border border-border p-3 flex items-center gap-3 cursor-pointer transition-colors ${recommendation === 'approve' ? 'border-emerald-500/50 bg-emerald-500/5' : 'hover:border-primary/30 bg-background'}`}>
                        <input type="radio" name="rec" value="approve" checked={recommendation === 'approve'} onChange={(e) => setRecommendation(e.target.value)} className="hidden" />
                        <CheckCircle className={`h-4 w-4 ${recommendation === 'approve' ? 'text-emerald-500' : 'text-muted/50'}`} />
                        <span className="text-[12px] font-medium uppercase tracking-wider">Approve</span>
                      </label>
                      <label className={`border border-border p-3 flex items-center gap-3 cursor-pointer transition-colors ${recommendation === 'revise' ? 'border-orange-500/50 bg-orange-500/5' : 'hover:border-primary/30 bg-background'}`}>
                        <input type="radio" name="rec" value="revise" checked={recommendation === 'revise'} onChange={(e) => setRecommendation(e.target.value)} className="hidden" />
                        <AlertCircle className={`h-4 w-4 ${recommendation === 'revise' ? 'text-orange-500' : 'text-muted/50'}`} />
                        <span className="text-[12px] font-medium uppercase tracking-wider">Revise</span>
                      </label>
                      <label className={`border border-border p-3 flex items-center gap-3 cursor-pointer transition-colors ${recommendation === 'reject' ? 'border-red-500/50 bg-red-500/5' : 'hover:border-primary/30 bg-background'}`}>
                        <input type="radio" name="rec" value="reject" checked={recommendation === 'reject'} onChange={(e) => setRecommendation(e.target.value)} className="hidden" />
                        <XCircle className={`h-4 w-4 ${recommendation === 'reject' ? 'text-red-500' : 'text-muted/50'}`} />
                        <span className="text-[12px] font-medium uppercase tracking-wider">Reject</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[12px] font-medium uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Submit Evaluation'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border border-border bg-surface p-12 text-center h-full flex flex-col items-center justify-center">
                <FileText className="h-8 w-8 text-muted/20 mb-3" />
                <p className="text-[12px] text-muted uppercase tracking-wider">Select a paper to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerPortal;
