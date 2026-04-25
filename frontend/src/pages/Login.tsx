import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import { BookOpen, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to dashboard
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
      <div className="w-full max-w-md space-y-8 bg-white border border-slate-100 p-10 rounded-3xl shadow-xl shadow-primary/5 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary" />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-7 w-7 text-secondary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-bold text-primary">Portal Login</h1>
            <p className="text-sm text-slate-400 font-serif italic">Access the Filamerian Research System</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="admin@filamer.edu.ph"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Password</label>
              <a href="#" className="text-[10px] font-bold text-secondary uppercase hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              'Sign In to System'
            )}
          </Button>
        </form>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400 font-serif">
            Protected academic system. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
