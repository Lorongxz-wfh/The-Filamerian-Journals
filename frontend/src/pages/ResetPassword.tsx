import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 bg-surface border border-border p-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <h1 className="text-xl text-primary font-serif">Set New Password</h1>
          <p className="text-[13px] text-muted">
            Choose a new secure password for your account
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Password Reset Successful!</p>
                <p className="mt-1 leading-relaxed">Your password has been updated. Redirecting to login in 3 seconds...</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full py-3 text-[13px] font-medium bg-primary text-white flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Sign In Now &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[12px] font-medium text-primary uppercase tracking-wider block">
                Account Email
              </label>
              <input
                id="email"
                type="email"
                required
                readOnly={!!emailParam}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors opacity-80"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[12px] font-medium text-primary uppercase tracking-wider block">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
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

            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="text-[12px] font-medium text-primary uppercase tracking-wider block">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-[13px] font-medium"
              isLoading={loading}
              disabled={!isPasswordValid}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
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

export default ResetPassword;
