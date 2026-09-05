import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(res.data.token, res.data.user);
      navigate('/employees');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <Card variant="modal" className="w-full max-w-md shadow-xl border border-border">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-md mb-3">
            P
          </div>
          <h1 className="text-2xl font-bold text-ink">PeoplePay360</h1>
          <p className="text-sm text-slate mt-1">HR & Payroll Operations Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-tint border border-danger/30 rounded-md flex items-center gap-2 text-danger-text text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </Button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-6 pt-5 border-t border-border">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-2 text-center">
            Demo Account Switcher (Role-Based Testing)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => quickLogin('admin@peoplepay360.com')}
              className="p-2 bg-gray-50 border border-border rounded-md hover:bg-primary-light hover:border-primary text-left transition-all"
            >
              <div className="font-semibold text-ink">Admin</div>
              <div className="text-[10px] text-slate">admin@peoplepay360.com</div>
            </button>

            <button
              onClick={() => quickLogin('hr.manager@peoplepay360.com')}
              className="p-2 bg-gray-50 border border-border rounded-md hover:bg-primary-light hover:border-primary text-left transition-all"
            >
              <div className="font-semibold text-ink">HR Manager</div>
              <div className="text-[10px] text-slate">hr.manager@...</div>
            </button>

            <button
              onClick={() => quickLogin('payroll@peoplepay360.com')}
              className="p-2 bg-gray-50 border border-border rounded-md hover:bg-primary-light hover:border-primary text-left transition-all"
            >
              <div className="font-semibold text-ink">Payroll Mgr</div>
              <div className="text-[10px] text-slate">payroll@peoplepay...</div>
            </button>

            <button
              onClick={() => quickLogin('amara.chen@peoplepay360.com')}
              className="p-2 bg-gray-50 border border-border rounded-md hover:bg-primary-light hover:border-primary text-left transition-all"
            >
              <div className="font-semibold text-ink">Amara Chen (Emp)</div>
              <div className="text-[10px] text-slate">amara.chen@...</div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
