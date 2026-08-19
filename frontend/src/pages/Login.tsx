import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === '1') {
      setError('Your session has expired. Please log in again to continue.');
    } else if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 600)); // UX delay to ensure loading state is visible
      const response = await api.post('/login', { email, password });
      const { access_token, user } = response.data;

      // Extract all role names from Spatie roles array
      const roleNames = user.roles?.map((r: any) => r.name) || ['Member'];
      const userData = { ...user, roles: roleNames, role: roleNames[0] };

      // Store token consistently — auth_token matches the API interceptor
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('token', access_token); // ProtectedRoute guard checks 'token'
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('last_activity', Date.now().toString());

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 bg-surface border border-border p-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <img src="/TFJ-50pxOutline.svg" alt="The FCU Journals Logo" className="h-16 w-16 object-contain mb-1" />
          <h1 className="text-xl font-bold tracking-tight text-primary font-sans">Portal Login</h1>
          <p className="text-[13px] text-muted">
            Access The FCU Dashboard
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="admin@filamer.edu.ph"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-primary uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-primary transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <a
              href="/forgot-password"
              className="text-[12px] font-medium text-primary/70 hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-[13px] font-medium"
            isLoading={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="pt-2 text-center space-y-3">
          <p className="text-[11px] text-muted/60">
            Protected academic system. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
