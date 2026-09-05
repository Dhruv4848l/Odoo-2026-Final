import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input, Select } from '../../../components/ui/Input';
import { apiRequest } from '../../../lib/api';
import { FileText, Plus, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

export const ContractListPage: React.FC = () => {
  const { user } = useAuth();
  const isEmployeeRole = user?.role?.id === 'employee';

  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const empIdFilter = searchParams.get('employee_id') || '';

  const [selectedEmp, setSelectedEmp] = useState(empIdFilter);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    employee_id: empIdFilter,
    job_position: '',
    wage: 4500,
    salary_structure_id: 'struct_1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  const navigate = useNavigate();

  const fetchContracts = async () => {
    try {
      const url = selectedEmp ? `/contracts?employee_id=${selectedEmp}` : '/contracts';
      const res = await apiRequest(url);
      setContracts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesAndStructures = async () => {
    try {
      const [empRes, structRes] = await Promise.all([
        apiRequest('/employees'),
        apiRequest('/payroll/structures').catch(() => ({ data: [] })),
      ]);
      setEmployees(empRes.data || []);
      setStructures(structRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchEmployeesAndStructures();
  }, [selectedEmp]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await apiRequest('/contracts', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      fetchContracts();
    } catch (err: any) {
      // Surfacing the critical overlapping contract validation error!
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Contract Management</h1>
          <p className="text-sm text-slate">Track historical and period-active contracts per employee</p>
        </div>

        {!isEmployeeRole && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Contract
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Select
            label="Filter by Employee"
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            options={[
              { value: '', label: 'All Employees' },
              ...employees.map((e) => ({
                value: e.id,
                label: `${e.first_name} ${e.last_name} (${e.job_position})`,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Contracts Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas border-b border-border text-slate text-xs font-semibold uppercase">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Employee</th>
              <th className="p-4">Job Position</th>
              <th className="p-4">Monthly Wage</th>
              <th className="p-4">Period</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate">
                  Loading contracts...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate">
                  No contracts found.
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.id} className="hover:bg-primary-light/30 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-primary">{c.contract_ref}</td>
                  <td className="p-4 font-semibold text-ink">
                    {c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : c.employee_id}
                  </td>
                  <td className="p-4 text-slate">{c.job_position}</td>
                  <td className="p-4 font-semibold text-ink">${Number(c.wage).toLocaleString()} / mo</td>
                  <td className="p-4 text-slate text-xs">
                    {c.start_date} → {c.end_date || 'Ongoing'}
                  </td>
                  <td className="p-4">
                    <Badge status={c.status === 'running' ? 'running' : 'expired'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card variant="modal" className="max-w-lg">
            <h2 className="text-xl font-bold text-ink mb-4">Create New Contract</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger-tint border border-danger/40 rounded-md text-danger-text text-xs flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold">Overlapping Contract Rule Violation</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateContract} className="flex flex-col gap-4">
              <Select
                label="Select Employee *"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
                options={[
                  { value: '', label: 'Select Employee' },
                  ...employees.map((e) => ({
                    value: e.id,
                    label: `${e.first_name} ${e.last_name} (${e.job_position})`,
                  })),
                ]}
              />

              <Input
                label="Job Position Position *"
                placeholder="e.g. Store Supervisor"
                value={formData.job_position}
                onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                required
              />

              <Input
                label="Monthly Wage ($) *"
                type="number"
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                required
              />

              <Select
                label="Salary Structure *"
                value={formData.salary_structure_id}
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
                <Input
                  label="End Date (Optional)"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save & Validate Contract
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
