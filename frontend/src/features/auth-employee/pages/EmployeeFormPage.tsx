import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { SmartStatButton } from '../../../components/ui/SmartStatButton';
import { apiRequest } from '../../../lib/api';
import { 
  FileText, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Save, 
  ShieldAlert, 
  Key, 
  Shield, 
  Plus, 
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  Palette,
  Check,
  Shuffle,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getNormalizedRole } from '../../../layouts/SubNav';
import { getAiAvatar, PRESET_VECTOR_AVATARS, PresetVectorAvatar } from '../../../lib/avatar';

const DEFAULT_ROLES = [
  { id: 'employee', name: 'Employee', description: 'Own profile, attendance & time off view/actions only' },
  { id: 'hr_manager', name: 'HR Manager', description: 'Full HR access (employees, contracts, schedules, attendance, leaves); blocked from Payroll' },
  { id: 'hr_payroll_user', name: 'HR Payroll User', description: 'All HR access + Payruns view & process + Payroll Dashboard (Read-only rules)' },
  { id: 'hr_payroll_manager', name: 'HR Payroll Manager', description: 'Full HR & Payroll access including Salary Structures & Rules CRUD' },
  { id: 'admin', name: 'Admin', description: 'Full System Administrator access including User Account & Role Management' },
];

const DEFAULT_DAYS = [
  { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Tuesday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Wednesday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Thursday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Friday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
];

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.user;
  const currentNormalizedRole = getNormalizedRole(currentUser);
  const canManageRoles = ['admin', 'hr_manager', 'hr_payroll_manager'].includes(currentNormalizedRole);

  const [activeTab, setActiveTab] = useState<'work' | 'private' | 'leave' | 'security'>('work');
  const [departments, setDepartments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>(DEFAULT_ROLES);
  const [structures, setStructures] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick Add Modals State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  const [showSchedModal, setShowSchedModal] = useState(false);
  const [newSchedName, setNewSchedName] = useState('');
  const [schedDays, setSchedDays] = useState(DEFAULT_DAYS);
  const [creatingSched, setCreatingSched] = useState(false);

  // Vector Avatar Selector State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState<string>('All');
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [randomAvatars, setRandomAvatars] = useState<PresetVectorAvatar[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_position: '',
    department_id: '',
    working_schedule_id: '',
    salary_structure_id: 'struct_1',
    wage: 4500,
    private_email: '',
    bank_account: '',
    avatar_url: '',
    hire_date: new Date().toISOString().split('T')[0],
    role_id: 'employee',
    password: '',
    pto_days: 20,
    sick_days: 10,
  });

  const [smartStats, setSmartStats] = useState({
    contracts_count: 0,
    attendance_rate: '100%',
    time_off_days: 0,
  });

  useEffect(() => {
    fetchMetadata();
    if (!isNew && id) {
      fetchEmployee(id);
    }
  }, [id]);

  const handleShuffleRandomVectors = () => {
    const styles: ('avataaars' | 'lorelei' | 'bottts')[] = ['avataaars', 'lorelei', 'bottts'];
    const names = ['Blaze', 'Zane', 'Sora', 'Vesper', 'Kira', 'Echo', 'Nyx', 'Orion'];
    const newOnes: PresetVectorAvatar[] = names.map((name, i) => {
      const randomSeed = `${name}_${Math.random().toString(36).substring(2, 6)}`;
      const style = styles[i % styles.length];
      return {
        id: `rand_${Date.now()}_${i}`,
        name: name,
        category: 'Generated',
        url: getAiAvatar(randomSeed, style),
      };
    });
    setRandomAvatars(newOnes);
  };

  const handleApplyCustomSeed = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSeedInput.trim()) return;
    const customUrl = getAiAvatar(customSeedInput.trim());
    setFormData((prev) => ({ ...prev, avatar_url: customUrl }));
  };

  const handleSelectAvatar = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
  };

  const allAvailableAvatars = [...PRESET_VECTOR_AVATARS, ...randomAvatars];
  const displayedAvatars = avatarCategory === 'All'
    ? allAvailableAvatars
    : allAvailableAvatars.filter((a) => a.category.toLowerCase() === avatarCategory.toLowerCase());

  const fetchMetadata = async () => {
    try {
      const [deptRes, schedRes, roleRes, structRes] = await Promise.all([
        apiRequest('/departments').catch(() => ({ data: [] })),
        apiRequest('/schedules').catch(() => ({ data: [] })),
        apiRequest('/roles').catch(() => ({ data: DEFAULT_ROLES })),
        apiRequest('/payroll/structures').catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setSchedules(schedRes.data || []);
      setStructures(structRes.data || []);
      if (roleRes.data && roleRes.data.length > 0) {
        setRolesList(roleRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployee = async (empId: string) => {
    try {
      const res = await apiRequest(`/employees/${empId}`);
      const emp = res.data;
      setFormData({
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        job_position: emp.job_position || '',
        department_id: emp.department_id || '',
        working_schedule_id: emp.working_schedule_id || '',
        salary_structure_id: emp.salary_structure_id || 'struct_1',
        wage: emp.wage !== undefined ? emp.wage : 4500,
        private_email: emp.private_email || '',
        bank_account: emp.bank_account || '',
        avatar_url: emp.avatar_url || '',
        hire_date: emp.hire_date || emp.date_of_joining || '',
        role_id: emp.role_id || emp.role?.id || 'employee',
        password: '',
        pto_days: emp.pto_days !== undefined ? emp.pto_days : 20,
        sick_days: emp.sick_days !== undefined ? emp.sick_days : 10,
      });
      if (emp.smart_stats) {
        setSmartStats(emp.smart_stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load employee details');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    setCreatingDept(true);
    try {
      const res = await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify({ name: newDeptName, code: newDeptCode }),
      });
      const created = res.data;
      setShowDeptModal(false);
      setNewDeptName('');
      setNewDeptCode('');
      await fetchMetadata();
      if (created?.id) {
        setFormData((prev) => ({ ...prev, department_id: created.id }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedName) return;
    setCreatingSched(true);
    try {
      const res = await apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({ name: newSchedName, days: schedDays }),
      });
      const created = res.data;
      setShowSchedModal(false);
      setNewSchedName('');
      await fetchMetadata();
      if (created?.id) {
        setFormData((prev) => ({ ...prev, working_schedule_id: created.id }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create schedule');
    } finally {
      setCreatingSched(false);
    }
  };

  // Self-profile identification
  const isSelf = Boolean(
    (currentUser?.employee?.id && currentUser.employee.id === id) ||
    (currentUser?.email && formData.email && currentUser.email.toLowerCase() === formData.email.toLowerCase()) ||
    (!canManageRoles && !isNew)
  );

  // Granular RBAC Privilege Flags
  const canEditWorkDetails = canManageRoles;
  const canEditCompensation = canManageRoles;
  const canEditLeaveBalances = canManageRoles;
  const canEditRoles = canManageRoles;
  const canEditPersonal = canManageRoles || isSelf;

  const handleBack = () => {
    if (!canManageRoles) {
      navigate('/attendance');
    } else {
      navigate('/employees');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      if (isNew) {
        await apiRequest('/employees', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        navigate('/employees');
      } else {
        await apiRequest(`/employees/${id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });

        // Sync local auth user state if editing self so navbar updates immediately
        if (isSelf && currentUser) {
          const updatedUser = {
            ...currentUser,
            employee: {
              ...(currentUser.employee || {}),
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
              private_email: formData.private_email,
              bank_account: formData.bank_account,
              avatar_url: formData.avatar_url,
            }
          };
          localStorage.setItem('pp360_user', JSON.stringify(updatedUser));
          if (auth?.login && auth?.token) {
            auth.login(auth.token, updatedUser as any);
          }
        }

        setSuccessMessage('Profile details successfully updated!');
        setTimeout(() => setSuccessMessage(''), 4000);

        if (!isSelf && canManageRoles) {
          navigate('/employees');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save employee profile');
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleObj = rolesList.find((r) => r.id === formData.role_id) ||
    DEFAULT_ROLES.find((r) => r.id === formData.role_id) || {
      name: formData.role_id,
      description: 'Standard System Access',
    };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">
                {isNew ? 'New Employee Master' : `${formData.first_name} ${formData.last_name}`}
              </h1>
              {isSelf && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Your Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate">{formData.job_position || 'Employee Master Form'}</p>
          </div>
        </div>

        {/* Smart Stat Buttons at top-right */}
        {!isNew && (
          <div className="flex items-center gap-2">
            {canManageRoles && (
              <SmartStatButton
                icon={<FileText className="w-4 h-4" />}
                value={smartStats.contracts_count}
                label="Contracts"
                onClick={() => navigate(`/contracts?employee_id=${id}`)}
              />
            )}
            <SmartStatButton
              icon={<Clock className="w-4 h-4" />}
              value={smartStats.attendance_rate}
              label="Attendance"
              onClick={() => navigate(`/attendance?employee_id=${id}`)}
            />
            <SmartStatButton
              icon={<Calendar className="w-4 h-4" />}
              value={smartStats.time_off_days}
              label="Time Off"
              onClick={() => navigate(`/timeoff?employee_id=${id}`)}
            />
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-tint border border-danger/30 rounded-md text-danger-text text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-6">
          {/* Header Identity Row - AI Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 pb-6 border-b border-border">
            <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
              <div
                onClick={() => canEditPersonal && setShowAvatarPicker(!showAvatarPicker)}
                className={`relative group shrink-0 ${canEditPersonal ? 'cursor-pointer hover:scale-105' : ''} transition-all`}
                title={canEditPersonal ? 'Click to select vector AI avatar' : undefined}
              >
                <img
                  src={formData.avatar_url || getAiAvatar(formData.first_name || 'Employee')}
                  alt={formData.first_name || 'Employee'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/25 shadow-md bg-slate-100 transition-all group-hover:border-primary group-hover:ring-4 group-hover:ring-primary/15"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.first_name || 'User')}`;
                  }}
                />
                {canEditPersonal && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#12141F] text-[#A5B4FC] border border-white/20 shadow-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-primary-200" />
                  AI
                </span>
              </div>

              {canEditPersonal && (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1.5 transition-colors px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/20 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{showAvatarPicker ? 'Close Gallery' : 'Select Avatar'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <Input
                label="First Name *"
                value={formData.first_name}
                disabled={!canEditPersonal}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name *"
                value={formData.last_name}
                disabled={!canEditPersonal}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Vector Avatar Selector Panel */}
          {showAvatarPicker && canEditPersonal && (
            <div className="p-5 bg-gradient-to-br from-[#F8F9FE] to-indigo-50/40 border border-primary/25 rounded-2xl flex flex-col gap-4 animate-fade-in shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-ink">Choose Vector AI Avatar</h3>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                      100% Vector SVG
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-0.5">
                    Click any vector avatar below to select it for your profile, or generate new ones.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShuffleRandomVectors}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-ink flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 hover:border-primary/40"
                    title="Generate new random vector options"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-primary" />
                    <span>Shuffle New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="p-1.5 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {['All', 'Executive', 'Tech', 'Creative', 'Specialist', 'Modern', 'Bot'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAvatarCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      avatarCategory === cat
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Selectable Vector Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-72 overflow-y-auto p-1">
                {displayedAvatars.map((item) => {
                  const currentActiveUrl = formData.avatar_url || getAiAvatar(formData.first_name || 'Employee');
                  const isSelected = (formData.avatar_url === item.url) || (!formData.avatar_url && item.url === currentActiveUrl);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAvatar(item.url)}
                      className={`relative flex flex-col items-center p-2 rounded-2xl bg-white border transition-all cursor-pointer group hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/30 shadow-md bg-primary/[0.04]'
                          : 'border-slate-200 hover:border-primary/50 hover:shadow-xs'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover bg-slate-50 shrink-0 ring-1 ring-black/5"
                      />
                      <span className="text-[10px] font-semibold text-slate-700 truncate max-w-full mt-1.5 text-center">
                        {item.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Seed Input Row */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyCustomSeed();
                  }}
                  className="flex items-center gap-2 flex-1 max-w-md"
                >
                  <input
                    type="text"
                    placeholder="Or type custom vector seed (e.g. Leader, Star)..."
                    value={customSeedInput}
                    onChange={(e) => setCustomSeedInput(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 text-xs bg-white rounded-full border border-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-ink"
                  />
                  <button
                    type="submit"
                    disabled={!customSeedInput.trim()}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    Generate
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    const defaultUrl = getAiAvatar(formData.first_name || 'User');
                    handleSelectAvatar(defaultUrl);
                  }}
                  className="text-xs text-slate-500 hover:text-primary font-medium underline transition-colors cursor-pointer self-start sm:self-center"
                >
                  Reset to default ({formData.first_name || 'Name'})
                </button>
              </div>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex border-b border-border gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('work')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'work' ? 'border-primary text-primary' : 'border-transparent text-slate'
              }`}
            >
              Work Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('private')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-slate'
              }`}
            >
              Private Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leave')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'leave' ? 'border-primary text-primary' : 'border-transparent text-slate'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Leave Balances</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-slate'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Access & Security</span>
            </button>
          </div>

          {/* Tab 1: Work Information */}
          {activeTab === 'work' && (
            <div className="flex flex-col gap-4">
              {!canManageRoles && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-md flex items-center gap-2 text-xs text-amber-900">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Company organization, schedule, and salary structure are managed by HR &amp; Administrators. You can update your contact phone, private email, bank account, and password.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Work Email *"
                  type="email"
                  value={formData.email}
                  disabled={!canEditWorkDetails}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Work Phone"
                  value={formData.phone}
                  disabled={!canEditPersonal}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Job Position *"
                  value={formData.job_position}
                  disabled={!canEditWorkDetails}
                  onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                  required
                />

                {/* Department Select + Quick Add */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate">Department</label>
                    {canManageRoles && (
                      <button
                        type="button"
                        onClick={() => setShowDeptModal(true)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Dept
                      </button>
                    )}
                  </div>
                  <Select
                    value={formData.department_id}
                    disabled={!canEditWorkDetails}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select Department' },
                      ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code || 'DEPT'})` })),
                    ]}
                  />
                </div>

                {/* Working Schedule Select + Quick Add */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate">Working Schedule</label>
                    {canManageRoles && (
                      <button
                        type="button"
                        onClick={() => setShowSchedModal(true)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Schedule
                      </button>
                    )}
                  </div>
                  <Select
                    value={formData.working_schedule_id}
                    disabled={!canEditWorkDetails}
                    onChange={(e) => setFormData({ ...formData, working_schedule_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select Working Schedule' },
                      ...schedules.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                  />
                </div>

                <Input
                  label="Hire Date *"
                  type="date"
                  value={formData.hire_date}
                  disabled={!canEditWorkDetails}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  required
                />

                <Select
                  label="Associated Salary Structure *"
                  value={formData.salary_structure_id}
                  disabled={!canEditCompensation}
                  onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
                  required
                  options={
                    structures.length > 0
                      ? structures.map((s) => ({ value: s.id, label: s.name }))
                      : [
                          { value: 'struct_1', label: 'Standard Monthly Salary' },
                          { value: 'struct_2', label: 'Executive & Management Structure' },
                          { value: 'struct_3', label: 'Sales & Performance Structure' },
                        ]
                  }
                />

                <Input
                  label="Monthly Contract Base Wage ($) *"
                  type="number"
                  value={formData.wage}
                  disabled={!canEditCompensation}
                  onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          )}

          {/* Tab 2: Private Information */}
          {activeTab === 'private' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Private Email"
                type="email"
                value={formData.private_email}
                disabled={!canEditPersonal}
                onChange={(e) => setFormData({ ...formData, private_email: e.target.value })}
              />
              <Input
                label="Bank Account (IBAN / Account No)"
                value={formData.bank_account}
                disabled={!canEditPersonal}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="US00BANK0000000000"
              />
            </div>
          )}

          {/* Tab 3: Leave Balances & Initial Allocations */}
          {activeTab === 'leave' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-md flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-ink space-y-1">
                  <p className="font-bold text-primary">Annual Leave Balances Allocation</p>
                  <p>
                    {canManageRoles
                      ? 'Set annual leave days granted to this employee for the current calendar year. HR Managers can also modify these allocations anytime in Time Off Overview.'
                      : 'Your annual leave allocations are assigned by HR. To submit a leave request, visit the Time Off page.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Paid Time Off (PTO) Days *"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pto_days}
                  disabled={!canEditLeaveBalances}
                  onChange={(e) => setFormData({ ...formData, pto_days: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Sick Leave Days *"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.sick_days}
                  disabled={!canEditLeaveBalances}
                  onChange={(e) => setFormData({ ...formData, sick_days: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          )}

          {/* Tab 4: Access & Security (Roles & Passwords) */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-5">
              <div className="p-4 bg-primary-light/50 border border-primary/20 rounded-md flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-ink space-y-1">
                  <p className="font-bold text-primary">System Authentication &amp; Security</p>
                  <p>
                    {canManageRoles
                      ? 'Assigning a Role and Login Password generates or updates authentication and permissions for this user.'
                      : 'Your system role is managed by Administrators. You can update your login password below.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="System Role *"
                  value={formData.role_id}
                  disabled={!canEditRoles}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  options={rolesList.map((r) => ({
                    value: r.id,
                    label: `${r.name} (${r.id})`,
                  }))}
                />

                <Input
                  label={isNew ? 'Initial Login Password *' : 'Update Password (leave blank to keep unchanged)'}
                  type="password"
                  value={formData.password}
                  placeholder={isNew ? 'password123' : '••••••••'}
                  required={isNew}
                  disabled={!canEditPersonal}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Role Scope Explanation Box */}
              <div className="p-3 bg-canvas border border-border rounded-md text-xs flex flex-col gap-1">
                <span className="font-bold text-ink uppercase text-[10px] tracking-wider text-slate">
                  Selected Role Scope ({selectedRoleObj.name || formData.role_id})
                </span>
                <p className="text-slate">{selectedRoleObj.description}</p>
              </div>
            </div>
          )}

          {/* Footer Form Action Buttons */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </Card>
      </form>

      {/* Quick Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card variant="modal" className="max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">Create New Department</h2>
            </div>
            <p className="text-xs text-slate mb-4">Add a new organizational unit for grouping employees.</p>

            <form onSubmit={handleCreateDepartment} className="flex flex-col gap-4">
              <Input
                label="Department Name *"
                placeholder="e.g. Marketing & Growth"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
              />
              <Input
                label="Department Code"
                placeholder="e.g. MKTG"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
              />

              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creatingDept}>
                  {creatingDept ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Quick Add Schedule Modal */}
      {showSchedModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card variant="modal" className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">Create Working Schedule</h2>
            </div>
            <p className="text-xs text-slate mb-4">Define a weekly shift pattern with start/end times.</p>

            <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
              <Input
                label="Schedule Name *"
                placeholder="e.g. Shift 40h (9 AM - 5 PM)"
                value={newSchedName}
                onChange={(e) => setNewSchedName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {schedDays.map((d, idx) => (
                  <div key={d.day_of_week} className="grid grid-cols-4 gap-2 items-center bg-canvas p-2 rounded border border-border">
                    <span className="text-xs font-bold text-ink">{d.day_of_week}</span>
                    <input
                      type="time"
                      value={d.start_time}
                      onChange={(e) => {
                        const updated = [...schedDays];
                        updated[idx].start_time = e.target.value;
                        setSchedDays(updated);
                      }}
                      className="h-8 px-2 text-xs border border-border rounded bg-white"
                    />
                    <input
                      type="time"
                      value={d.end_time}
                      onChange={(e) => {
                        const updated = [...schedDays];
                        updated[idx].end_time = e.target.value;
                        setSchedDays(updated);
                      }}
                      className="h-8 px-2 text-xs border border-border rounded bg-white"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={d.break_hours}
                        onChange={(e) => {
                          const updated = [...schedDays];
                          updated[idx].break_hours = Number(e.target.value);
                          setSchedDays(updated);
                        }}
                        className="h-8 w-12 px-1 text-xs border border-border rounded bg-white"
                      />
                      <span className="text-[10px] text-slate">h break</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowSchedModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creatingSched}>
                  {creatingSched ? 'Creating...' : 'Save Schedule'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};


