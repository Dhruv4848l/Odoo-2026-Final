import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, CheckCircle, XCircle, Clock, Shield, 
  Award, Layers, Check, X, Filter, Sparkles, ChevronRight 
} from 'lucide-react';
import { RequestTimeOffModal } from '../components/RequestTimeOffModal';
import { TimeOffTypesModal } from '../components/TimeOffTypesModal';
import { TimeOffAllocationsModal } from '../components/TimeOffAllocationsModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { useRealtimeSubscription } from '../../../context/RealtimeContext';

export const TimeOffOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const isHR = ['admin', 'hr_manager', 'hr_payroll_manager'].includes(user?.role?.id || '');

  const [activeTab, setActiveTab] = useState<'requests' | 'allocations' | 'types'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState<boolean>(false);
  const [typesModalOpen, setTypesModalOpen] = useState<boolean>(false);
  const [allocModalOpen, setAllocModalOpen] = useState<boolean>(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';

      // Fetch Requests
      let reqUrl = '/api/v1/timeoff/requests';
      if (statusFilter) reqUrl += `?status=${statusFilter}`;
      const reqRes = await fetch(reqUrl, { headers: { Authorization: `Bearer ${token}` } });
      const reqData = await reqRes.json();
      if (reqData.success) setRequests(reqData.data || []);

      // Fetch Allocations
      const allocUrl = isHR ? '/api/v1/timeoff/allocations' : '/api/v1/timeoff/allocations/my';
      const allocRes = await fetch(allocUrl, { headers: { Authorization: `Bearer ${token}` } });
      const allocData = await allocRes.json();
      if (allocData.success) setAllocations(allocData.data || []);

      // Fetch Types
      const typesRes = await fetch('/api/v1/timeoff/types', { headers: { Authorization: `Bearer ${token}` } });
      const typesData = await typesRes.json();
      if (typesData.success) setTypes(typesData.data || []);

      // Fetch Employees for HR
      if (isHR) {
        const empRes = await fetch('/api/v1/employees', { headers: { Authorization: `Bearer ${token}` } });
        const empData = await empRes.json();
        if (empData.success) setEmployees(empData.data || []);
      }
    } catch (err) {
      console.error('Error fetching timeoff data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, isHR]);

  // Zero-Reload Real-time Time Off synchronization
  useRealtimeSubscription('TIMEOFF_UPDATE', () => {
    console.log('[TimeOff] Live sync received. Refreshing requests and allocations...');
    fetchData();
  });

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const res = await fetch(`/api/v1/timeoff/requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve request', err);
    }
  };

  const handleRefuse = async (id: string) => {
    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const res = await fetch(`/api/v1/timeoff/requests/${id}/refuse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to refuse request', err);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Leave & Absence Balances
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Payroll Proration Integrated</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight">Time Off & Leaves</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave requests, manage vacation quotas, and configure statutory paid/unpaid policies
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isHR && (
            <>
              <Button
                variant="secondary"
                className="gap-1.5 rounded-full text-xs border-slate-200"
                onClick={() => setTypesModalOpen(true)}
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>New Leave Type</span>
              </Button>
              <Button
                variant="secondary"
                className="gap-1.5 rounded-full text-xs border-slate-200"
                onClick={() => {
                  setSelectedAlloc(null);
                  setAllocModalOpen(true);
                }}
              >
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>Grant Allocation</span>
              </Button>
            </>
          )}

          <Button
            variant="primary"
            className="gap-2 shadow-fintech"
            onClick={() => setRequestModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Request Time Off</span>
          </Button>
        </div>
      </div>

      {/* Pill Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Leave Requests</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {requests.length}
          </span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Allocations & Balances</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'allocations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {allocations.length}
          </span>
        </button>

        {isHR && (
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${
              activeTab === 'types'
                ? 'bg-primary text-white shadow-glow'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Leave Types Policy</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'types' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {types.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: LEAVE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Status Filter Capsule */}
          <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['', 'Pending', 'Approved', 'Refused'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    statusFilter === st
                      ? 'bg-primary text-white shadow-glow'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st || 'All Requests'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {requests.length} Requests Filed
            </span>
          </div>

          {/* Requests Table Card */}
          <Card title="Time Off Requests" subtitle="Workflow approvals, leave categories, and multi-tier manager authorizations">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approver</th>
                    {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No leave requests found. Click 'Request Time Off' to submit a new entry.
                      </td>
                    </tr>
                  ) : (
                    requests.map((reqItem) => (
                      <tr key={reqItem.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#12141F]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {reqItem.employee?.first_name?.charAt(0) || 'E'}
                            </div>
                            <span>
                              {reqItem.employee ? `${reqItem.employee.first_name} ${reqItem.employee.last_name}` : reqItem.employee_id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: reqItem.time_off_type?.display_color || '#5A5FE8' }}
                          >
                            {reqItem.time_off_type?.name || 'Leave'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono text-xs font-tabular">
                          {reqItem.start_date} → {reqItem.end_date}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#12141F] font-tabular">
                          {reqItem.requested_amount} {reqItem.time_off_type?.unit || 'Days'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={reqItem.status || 'Draft'} />
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {reqItem.approved_by_user ? `${reqItem.approved_by_user.first_name} ${reqItem.approved_by_user.last_name}` : '—'}
                        </td>
                        {isHR && (
                          <td className="py-3 px-4 text-right">
                            {reqItem.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApprove(reqItem.id)}
                                  className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRefuse(reqItem.id)}
                                  className="h-8 px-3.5 border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-[11px] rounded-full transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Refuse</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allocations.map((alloc) => {
            const pct = alloc.allocated ? Math.min(100, Math.round((alloc.taken / alloc.allocated) * 100)) : 0;
            return (
              <div 
                key={alloc.id} 
                className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-fintech hover:shadow-fintech-hover space-y-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: alloc.time_off_type?.display_color || '#5A5FE8' }}
                    />
                    <h3 className="font-bold text-sm text-[#12141F]">{alloc.time_off_type?.name || 'Leave Type'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {alloc.time_off_type?.unit || 'Days'}
                    </span>
                    {isHR && (
                      <button
                        onClick={() => {
                          setSelectedAlloc(alloc);
                          setAllocModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {isHR && alloc.employee && (
                  <p className="text-xs font-semibold text-slate-500">
                    Employee: <span className="text-[#12141F] font-bold">{alloc.employee.first_name} {alloc.employee.last_name}</span>
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Taken: {alloc.taken}</span>
                    <span className="text-emerald-600 font-bold">Remaining: {alloc.remaining}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Total Granted: {alloc.allocated} {alloc.time_off_type?.unit || 'Days'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Validity Window:</span>
                  <span className="font-mono text-[#12141F] font-semibold">{alloc.valid_from} → {alloc.valid_until}</span>
                </div>
              </div>
            );
          })}
          {allocations.length === 0 && (
            <div className="col-span-full p-12 bg-white rounded-[24px] border border-slate-100 text-center text-slate-400 text-xs">
              No leave allocations granted yet. Click 'Grant Allocation' to assign quotas.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAVE TYPES POLICY */}
      {activeTab === 'types' && isHR && (
        <Card title="Leave Policy Guidelines" subtitle="Configured leave classes, approval steps, and automatic payroll proration flags">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Requires Allocation</th>
                  <th className="py-3 px-4">Payroll Integration</th>
                  <th className="py-3 px-4">Approval Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-[#12141F] flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.display_color || '#5A5FE8' }} />
                      <span>{t.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{t.unit}</td>
                    <td className="py-3.5 px-4">
                      {t.requires_allocation ? (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[11px]">
                          Enforced Quota
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px]">
                          No Quota
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.is_paid ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                          Paid Leave
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[11px]">
                          Unpaid (Salary Deduction)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{t.approval_workflow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <RequestTimeOffModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={fetchData}
        leaveTypes={types}
        allocations={allocations}
      />

      <TimeOffTypesModal
        isOpen={typesModalOpen}
        onClose={() => setTypesModalOpen(false)}
        onSuccess={fetchData}
      />

      <TimeOffAllocationsModal
        isOpen={allocModalOpen}
        onClose={() => {
          setAllocModalOpen(false);
          setSelectedAlloc(null);
        }}
        onSuccess={fetchData}
        employees={employees}
        leaveTypes={types}
        initialAllocation={selectedAlloc}
      />
    </div>
  );
};
