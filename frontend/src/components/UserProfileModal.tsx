import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  CreditCard, 
  Shield, 
  Check, 
  Camera, 
  Lock, 
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export function getDefaultAvatar(email?: string, roleId?: string): string {
  const e = (email || '').toLowerCase();
  if (e.includes('admin')) return PRESET_AVATARS[0];
  if (e.includes('hr.manager') || e.includes('hrmgr')) return PRESET_AVATARS[2];
  if (e.includes('payroll')) return PRESET_AVATARS[1];
  if (e.includes('amara')) return PRESET_AVATARS[3];
  return PRESET_AVATARS[4];
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const roleId = user?.role?.id?.toLowerCase() || 'employee';
  const isAdminOrHR = ['admin', 'hr_manager', 'hr_payroll_manager'].includes(roleId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [privateEmail, setPrivateEmail] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const emp: any = user.employee || {};
      setFirstName(emp.first_name || (user.email.split('@')[0]) || '');
      setLastName(emp.last_name || (roleId.includes('admin') ? 'Administrator' : 'User'));
      setPhone(emp.phone || '+1 (555) 234-5678');
      setPrivateEmail(emp.private_email || `${user.email.split('@')[0]}.personal@gmail.com`);
      setBankAccount(emp.bank_account || 'US98BANK1020304050');
      setJobPosition(emp.job_position || user.role?.name || 'Staff');
      setAvatarUrl(emp.avatar_url || getDefaultAvatar(user.email, roleId));
    }
  }, [user, roleId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload: any = {
        phone,
        private_email: privateEmail,
        bank_account: bankAccount,
        avatar_url: avatarUrl,
      };

      if (isAdminOrHR) {
        payload.first_name = firstName;
        payload.last_name = lastName;
        payload.job_position = jobPosition;
      }

      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Update auth context state with updated employee
      if (user) {
        const updatedUser: any = {
          ...user,
          employee: {
            id: user.employee?.id || 'emp_user',
            email: user.employee?.email || user.email,
            first_name: isAdminOrHR ? firstName : user.employee?.first_name || firstName,
            last_name: isAdminOrHR ? lastName : user.employee?.last_name || lastName,
            phone,
            private_email: privateEmail,
            bank_account: bankAccount,
            job_position: isAdminOrHR ? jobPosition : user.employee?.job_position || jobPosition,
            avatar_url: avatarUrl,
          },
        };
        const token = localStorage.getItem('pp360_token') || 'demo-token';
        login(token, updatedUser);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      // Fallback local update if offline
      if (user) {
        const updatedUser: any = {
          ...user,
          employee: {
            id: user.employee?.id || 'emp_user',
            email: user.employee?.email || user.email,
            first_name: isAdminOrHR ? firstName : user.employee?.first_name || firstName,
            last_name: isAdminOrHR ? lastName : user.employee?.last_name || lastName,
            phone,
            private_email: privateEmail,
            bank_account: bankAccount,
            job_position: isAdminOrHR ? jobPosition : user.employee?.job_position || jobPosition,
            avatar_url: avatarUrl,
          },
        };
        const token = localStorage.getItem('pp360_token') || 'demo-token';
        login(token, updatedUser);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 800);
      } else {
        setError(err?.message || 'Could not update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeColor = isAdminOrHR
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#12141F] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-bold text-white shadow-glow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Account &amp; Profile Settings</h2>
              <p className="text-xs text-slate-400">Manage identity, contact, and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          
          {/* Avatar & Identity Banner */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/30 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
              <button
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                title="Change Avatar"
                className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-xl shadow-sm hover:scale-105 transition-transform"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-base text-[#12141F] truncate">
                  {firstName} {lastName}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                  {user?.role?.name || user?.role?.id || 'Staff'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{jobPosition}</p>
            </div>
          </div>

          {/* Avatar Preset Selector */}
          {showCustomAvatarInput && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-fade-in">
              <span className="text-[11px] font-bold text-slate-700 block">Choose Profile Photo</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      avatarUrl === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-10 h-10 object-cover" />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste an image URL..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Role Privileges Banner */}
          <div className="flex items-start gap-2.5 p-3 bg-[#5A5FE8]/5 border border-[#5A5FE8]/20 rounded-2xl text-xs text-slate-600">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#12141F]">Privilege Policy: </span>
              {isAdminOrHR ? (
                <span>You have administrative clearance to edit identity, positioning, and workforce credentials.</span>
              ) : (
                <span>As a standard employee, personal contact info and direct payout details can be updated. Department &amp; legal title are maintained by HR.</span>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  disabled={!isAdminOrHR}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  disabled={!isAdminOrHR}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Work Email (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Corporate Work Email
                </label>
                <span className="text-[10px] text-slate-400 font-mono">SSO Managed (Read Only)</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Contact Information (Editable for All) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={privateEmail}
                    onChange={(e) => setPrivateEmail(e.target.value)}
                    placeholder="personal@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Job Title & Bank Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Job Title
                  </label>
                  {!isAdminOrHR && <span className="text-[10px] text-slate-400">HR Managed</span>}
                </div>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={jobPosition}
                    disabled={!isAdminOrHR}
                    onChange={(e) => setJobPosition(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payout Bank Account
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="US00BANK00000000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-xs text-[#12141F] font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-glow transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
