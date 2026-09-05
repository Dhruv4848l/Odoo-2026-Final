import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Shield, Award, Layers, Check, X, Filter } from 'lucide-react';
import { RequestTimeOffModal } from '../components/RequestTimeOffModal';
import { TimeOffTypesModal } from '../components/TimeOffTypesModal';
import { TimeOffAllocationsModal } from '../components/TimeOffAllocationsModal';
import { useAuth } from '../../../context/AuthContext';

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            <span>Time Off & Leave Management</span>
          </h1>
          <p className="text-xs text-slate mt-1">
            Manage leave requests, view active allocations, and configure leave policies.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isHR && (
            <>
              <button
                onClick={() => setTypesModalOpen(true)}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-slate font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>New Leave Type</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAlloc(null);
                  setAllocModalOpen(true);
                }}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-slate font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Grant Allocation</span>
              </button>
            </>
          )}

          <button
            onClick={() => setRequestModalOpen(true)}
            className="h-10 px-5 bg-primary hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Leave Requests</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'allocations' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Allocations & Balances</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
            {allocations.length}
          </span>
        </button>

        {isHR && (
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'types' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Leave Types Policy</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
              {types.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: LEAVE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate">
              <Filter className="w-4 h-4 text-primary" />
              <span>Status Filter:</span>
            </div>
            <div className="flex items-center gap-2">
              {['', 'Pending', 'Approved', 'Refused'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                    statusFilter === st ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-slate border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st || 'All Requests'}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-slate">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4">Dates</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Approver</th>
                    {isHR && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate">
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    requests.map((reqItem) => (
                      <tr key={reqItem.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="py-3.5 px-4 font-semibold text-ink">
                          {reqItem.employee ? `${reqItem.employee.first_name} ${reqItem.employee.last_name}` : reqItem.employee_id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: reqItem.time_off_type?.display_color || '#5B4FE9' }}
                          >
                            {reqItem.time_off_type?.name || 'Leave'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-mono text-[11px]">
                          {reqItem.start_date} to {reqItem.end_date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-ink">
                          {reqItem.requested_amount} {reqItem.time_off_type?.unit || 'Days'}
                        </td>
                        <td className="py-3.5 px-4">
                          {reqItem.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Approved
                            </span>
                          ) : reqItem.status === 'Refused' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3 h-3" />
                              Refused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {reqItem.approved_by_user ? `${reqItem.approved_by_user.first_name} ${reqItem.approved_by_user.last_name}` : '—'}
                        </td>
                        {isHR && (
                          <td className="py-3.5 px-4 text-right">
                            {reqItem.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(reqItem.id)}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-full shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRefuse(reqItem.id)}
                                  className="h-8 px-3 border border-red-500 text-red-600 hover:bg-red-50 font-semibold text-[11px] rounded-full transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Refuse</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[11px] italic">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map((alloc) => {
            const pct = alloc.allocated ? Math.min(100, Math.round((alloc.taken / alloc.allocated) * 100)) : 0;
            return (
              <div key={alloc.id} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: alloc.time_off_type?.display_color || '#5B4FE9' }}
                    />
                    <h3 className="font-bold text-sm text-ink">{alloc.time_off_type?.name || 'Leave Type'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
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
                  <p className="text-xs font-semibold text-slate">
                    Employee: <span className="text-ink">{alloc.employee.first_name} {alloc.employee.last_name}</span>
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate">Taken: {alloc.taken}</span>
                    <span className="text-primary font-bold">Remaining: {alloc.remaining}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 text-right">
                    Total Granted: {alloc.allocated} {alloc.time_off_type?.unit || 'Days'}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate">
                  <span>Validity Window:</span>
                  <span className="font-mono text-ink font-medium">{alloc.valid_from} to {alloc.valid_until}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: LEAVE TYPES POLICY */}
      {activeTab === 'types' && isHR && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-slate">
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Requires Allocation</th>
                <th className="py-3.5 px-4">Payroll Integration</th>
                <th className="py-3.5 px-4">Approval Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.display_color || '#5B4FE9' }} />
                    <span>{t.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">{t.unit}</td>
                  <td className="py-3.5 px-4">
                    {t.requires_allocation ? (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold text-[11px]">Enforced</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[11px]">No Allocation</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {t.is_paid ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-[11px]">Paid Leave</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold text-[11px]">Unpaid Leave</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 uppercase font-mono text-[11px]">{t.approval_workflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
