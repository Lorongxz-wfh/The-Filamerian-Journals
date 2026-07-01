import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user } = response.data;

      // Extract all role names from Spatie roles array
      const roleNames = user.roles?.map((r: any) => r.name) || ['Member'];
      const userData = { ...user, roles: roleNames, role: roleNames[0] };

      // Store token consistently — auth_token matches the API interceptor
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('token', access_token); // ProtectedRoute guard checks 'token'
      localStorage.setItem('user', JSON.stringify(userData));

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
        <div className="flex flex-col items-center text-center space-y-3">
          <h1 className="text-xl text-primary">Portal Login</h1>
          <p className="text-[13px] text-muted">
            Access the Filamerian Research System
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-[13px] font-medium"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <p className="text-[11px] text-muted text-center pt-2">
          Protected academic system. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

export default Login;
