import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { SmartStatButton } from '../../../components/ui/SmartStatButton';
import { apiRequest } from '../../../lib/api';
import { FileText, Clock, Calendar, ArrowLeft, Save, ShieldAlert } from 'lucide-react';

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'work' | 'private'>('work');
  const [departments, setDepartments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_position: '',
    department_id: '',
    working_schedule_id: '',
    private_email: '',
    bank_account: '',
    hire_date: new Date().toISOString().split('T')[0],
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

  const fetchMetadata = async () => {
    try {
      const [deptRes, schedRes] = await Promise.all([
        apiRequest('/departments'),
        apiRequest('/schedules'),
      ]);
      setDepartments(deptRes.data);
      setSchedules(schedRes.data);
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
        private_email: emp.private_email || '',
        bank_account: emp.bank_account || '',
        hire_date: emp.hire_date || '',
      });
      if (emp.smart_stats) {
        setSmartStats(emp.smart_stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load employee details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isNew) {
        await apiRequest('/employees', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest(`/employees/${id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      }
      navigate('/employees');
    } catch (err: any) {
      setError(err.message || 'Failed to save employee profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/employees')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {isNew ? 'New Employee Master' : `${formData.first_name} ${formData.last_name}`}
            </h1>
            <p className="text-xs text-slate">{formData.job_position || 'Employee Master Form'}</p>
          </div>
        </div>

        {/* Smart Stat Buttons at top-right */}
        {!isNew && (
          <div className="flex items-center gap-2">
            <SmartStatButton
              icon={<FileText className="w-4 h-4" />}
              value={smartStats.contracts_count}
              label="Contracts"
              onClick={() => navigate(`/contracts?employee_id=${id}`)}
            />
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

      {error && (
        <div className="p-3 bg-danger-tint border border-danger/30 rounded-md text-danger-text text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-6">
          {/* Header Identity Row */}
          <div className="flex items-start gap-4 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary text-xl border-2 border-primary/20 shrink-0">
              {formData.first_name ? formData.first_name[0] : 'E'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <Input
                label="First Name *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

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
          </div>

          {/* Tab 1: Work Information */}
          {activeTab === 'work' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Work Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Work Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Job Position *"
                value={formData.job_position}
                onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                required
              />
              <Select
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: '', label: 'Select Department' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
              <Select
                label="Working Schedule"
                value={formData.working_schedule_id}
                onChange={(e) => setFormData({ ...formData, working_schedule_id: e.target.value })}
                options={[
                  { value: '', label: 'Select Working Schedule' },
                  ...schedules.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
              <Input
                label="Hire Date *"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />
            </div>
          )}

          {/* Tab 2: Private Information */}
          {activeTab === 'private' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Private Email"
                type="email"
                value={formData.private_email}
                onChange={(e) => setFormData({ ...formData, private_email: e.target.value })}
              />
              <Input
                label="Bank Account (IBAN / Account No)"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="US00BANK0000000000"
              />
            </div>
          )}

          {/* Footer Form Action Buttons */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
