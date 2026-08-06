import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all 5 complexity requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || err.response?.data?.errors?.token?.[0] || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-8 border border-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-primary">
            Set New Password
          </h1>
          <p className="text-xs text-muted">
            Choose a new secure password for your account.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">Password Reset Successful!</p>
                <p className="mt-1 leading-relaxed">Your password has been updated. Redirecting to login page in 3 seconds...</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider border border-border flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Sign In Now &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Account Email
              </label>
              <input
                id="email"
                type="email"
                required
                readOnly={!!emailParam}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary transition-colors font-mono opacity-80"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && (
              <div className="p-3 bg-background border border-border text-xs space-y-1.5 font-mono">
                <div className="font-sans font-bold text-[11px] uppercase tracking-wider text-muted mb-1">
                  Password Requirements:
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.length ? '✓' : '○'}</span> At least 8 characters long
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.uppercase ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.uppercase ? '✓' : '○'}</span> At least 1 uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.lowercase ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.lowercase ? '✓' : '○'}</span> At least 1 lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.number ? '✓' : '○'}</span> At least 1 number (0-9)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.symbol ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.symbol ? '✓' : '○'}</span> At least 1 special symbol (!@#$%^&*)
                </div>
              </div>
            )}

            <div>
              <label htmlFor="confirm_password" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border text-xs focus:outline-none focus:border-primary transition-colors font-mono"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-[13px] font-medium"
              isLoading={loading}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
