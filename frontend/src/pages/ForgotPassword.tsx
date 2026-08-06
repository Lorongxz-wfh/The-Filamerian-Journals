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
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-8 border border-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-primary">
            Reset Password
          </h1>
          <p className="text-xs text-muted">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-700 mb-0.5">System Maintenance Notice</span>
            Automated email dispatch is currently offline for server maintenance. Please contact your Super Admin directly to retrieve or reset your account password.
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">Check Your Inbox</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/60" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="admin@filamer.edu.ph"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-[13px] font-medium"
              isLoading={loading}
            >
              {loading ? 'Sending Request...' : 'Send Password Reset Link'}
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
