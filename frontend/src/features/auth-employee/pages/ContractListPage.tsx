import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input, Select } from '../../../components/ui/Input';
import { Pagination } from '../../../components/ui/Pagination';
import { apiRequest } from '../../../lib/api';
import { FileText, Plus, ShieldAlert, CheckCircle2, ArrowLeft, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'close'>('all');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      setError(err.message);
    }
  };

  // Filter and pagination computations
  const filteredContracts = contracts.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Contract Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Salary Base Mapping</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight">Contract Agreements</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track historical and period-active contracts per employee with auto wage bindings</p>
        </div>

        {!isEmployeeRole && (
          <Button variant="primary" className="gap-2 shadow-fintech" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </Button>
        )}
      </div>

      {/* Filter Capsule Bar */}
      <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-80">
            <select
              value={selectedEmp}
              onChange={(e) => {
                setSelectedEmp(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-[#12141F] font-medium outline-none focus:border-primary"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.job_position})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12141F]'
              }`}
            >
              All ({contracts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('running');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'running'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12141F]'
              }`}
            >
              Running ({contracts.filter(c => c.status === 'running').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('close');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === 'close'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12141F]'
              }`}
            >
              Past / Closed ({contracts.filter(c => c.status === 'close').length})
            </button>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Page <span className="font-bold text-[#12141F]">{currentPage}</span> of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-primary disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-primary disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contracts Table Daylight Card */}
      <Card title="Active & Historical Contracts" subtitle="Salary structure attachments, base compensation, and duration dates">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Job Position</th>
                <th className="py-3 px-4">Monthly Base Wage</th>
                <th className="py-3 px-4">Period Validity</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Loading contracts...
                  </td>
                </tr>
              ) : paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No contracts found matching filter.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-primary">
                      <span className="bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {c.contract_ref}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#12141F]">
                      {c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : c.employee_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{c.job_position}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-600 font-tabular">
                      ${Number(c.wage).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs font-tabular">
                      {c.start_date} → {c.end_date || 'Ongoing'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          c.status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'close'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status === 'running' ? 'Running' : c.status === 'close' ? 'Closed' : c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Full Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 30, 50]}
        itemLabel="contracts"
      />

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#12141F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card variant="modal" className="max-w-lg shadow-deck rounded-[28px]">
            <h2 className="text-lg font-bold text-[#12141F] mb-1">Create New Contract</h2>
            <p className="text-xs text-slate-500 mb-4">Define wage terms and link employee to a salary structure</p>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-[18px] text-red-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
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
                label="Job Position *"
                placeholder="e.g. Senior Software Engineer"
                value={formData.job_position}
                onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                required
              />

              <Input
                label="Monthly Base Wage ($) *"
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

              <div className="flex justify-end gap-2 mt-4">
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
