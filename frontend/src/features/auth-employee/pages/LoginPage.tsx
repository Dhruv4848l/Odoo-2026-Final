import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useAuth, DEFAULT_DEMO_USER, User } from '../../../context/AuthContext';
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
      navigate('/payroll');
    } catch (err: any) {
      console.warn('Backend login failed, using demo account fallback:', err);
      // Fallback demo user sign-in for seamless dev testing
      const roleName = email.includes('admin') ? 'Admin' : email.includes('hr') ? 'HR Manager' : 'HR Payroll Manager';
      const roleId = roleName.toLowerCase().replace(/\s+/g, '_');

      const fallbackUser: User = {
        id: 'usr_demo',
        email,
        role: { id: roleId, name: roleName },
        employee: {
          id: 'emp_demo',
          first_name: email.split('@')[0],
          last_name: 'User',
          email,
          job_position: roleName,
        },
      };

      login('demo-token', fallbackUser);
      navigate('/payroll');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    // Instant login trigger
    const roleName = userEmail.includes('admin') ? 'Admin' : userEmail.includes('hr.manager') ? 'HR Manager' : 'HR Payroll Manager';
    const roleId = roleName.toLowerCase().replace(/\s+/g, '_');

    const fallbackUser: User = {
      id: 'usr_demo',
      email: userEmail,
      role: { id: roleId, name: roleName },
      employee: {
        id: 'emp_demo',
        first_name: userEmail.split('@')[0],
        last_name: 'User',
        email: userEmail,
        job_position: roleName,
      },
    };

    login('demo-token', fallbackUser);
    navigate('/payroll');
  };

  return (
    <div className="min-h-screen bg-[#F6F6FB] flex items-center justify-center p-4">
      <Card variant="modal" className="w-full max-w-md shadow-xl border border-[#E5E7EB]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#5B4FE9] mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-md mb-3">
            360
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">PeoplePay360</h1>
          <p className="text-sm text-[#6B7280] mt-1">HR & Payroll Operations Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#EF4444]/30 rounded-md flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
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
            {loading ? 'Signing in...' : 'Sign In to Platform'}
          </Button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2 text-center">
            Quick Role Switcher (Instant Demo Sign-In)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => quickLogin('admin@peoplepay360.com')}
              className="p-2 bg-slate-50 border border-[#E5E7EB] rounded-md hover:bg-[#EEF0FF] hover:border-[#5B4FE9] text-left transition-all"
            >
              <div className="font-semibold text-[#1A1A2E]">Admin</div>
              <div className="text-[10px] text-[#6B7280]">admin@peoplepay360.com</div>
            </button>

            <button
              onClick={() => quickLogin('hr.manager@peoplepay360.com')}
              className="p-2 bg-slate-50 border border-[#E5E7EB] rounded-md hover:bg-[#EEF0FF] hover:border-[#5B4FE9] text-left transition-all"
            >
              <div className="font-semibold text-[#1A1A2E]">HR Manager</div>
              <div className="text-[10px] text-[#6B7280]">hr.manager@...</div>
            </button>

            <button
              onClick={() => quickLogin('payroll@peoplepay360.com')}
              className="p-2 bg-slate-50 border border-[#E5E7EB] rounded-md hover:bg-[#EEF0FF] hover:border-[#5B4FE9] text-left transition-all"
            >
              <div className="font-semibold text-[#1A1A2E]">Payroll Manager</div>
              <div className="text-[10px] text-[#6B7280]">payroll@peoplepay...</div>
            </button>

            <button
              onClick={() => quickLogin('amara.chen@peoplepay360.com')}
              className="p-2 bg-slate-50 border border-[#E5E7EB] rounded-md hover:bg-[#EEF0FF] hover:border-[#5B4FE9] text-left transition-all"
            >
              <div className="font-semibold text-[#1A1A2E]">Amara Chen (Emp)</div>
              <div className="text-[10px] text-[#6B7280]">amara.chen@...</div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
