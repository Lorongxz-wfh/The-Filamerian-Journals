import React, { useState } from 'react';
import { Link } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/forgot-password', { email });
      setSuccessMessage(res.data.message || 'If your email is registered, you will receive a reset link shortly.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a minute before trying again.');
      } else {
        setError(err.response?.data?.message || 'Unable to process your request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 bg-surface border border-border p-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <h1 className="text-xl text-primary font-serif">Reset Password</h1>
          <p className="text-[13px] text-muted">
            Enter your registered email address below
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[12px] flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-700 mb-0.5">System Maintenance Notice</span>
            Automated email dispatch is currently offline for server maintenance. Please contact your Super Admin directly to retrieve or reset your password.
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Request Processed</p>
                <p className="mt-1 leading-relaxed">{successMessage}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider border border-border flex items-center justify-center gap-2 hover:bg-background transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[12px] font-medium text-primary uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="admin@filamer.edu.ph"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-[13px] font-medium"
              isLoading={loading}
            >
              {loading ? 'Processing...' : 'Send Password Reset Link'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
