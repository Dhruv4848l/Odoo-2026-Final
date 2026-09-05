import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Plus, Filter, CheckCircle2, FileEdit } from 'lucide-react';
import { AttendanceWidget } from '../components/AttendanceWidget';
import { ManualAttendanceModal } from '../components/ManualAttendanceModal';
import { useAuth } from '../../../context/AuthContext';

export const AttendanceListPage: React.FC = () => {
  const { user } = useAuth();
  const isHR = ['admin', 'hr_manager', 'hr_payroll_manager'].includes(user?.role?.id || '');

  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterException, setFilterException] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';

      // Fetch attendances
      let url = '/api/v1/attendance?';
      if (filterEmployee) url += `employee_id=${filterEmployee}&`;
      if (filterDate) url += `date=${filterDate}&`;
      if (filterException) url += `has_exception=true&`;

      const attRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const attData = await attRes.json();
      if (attData.success) {
        setAttendances(attData.data || []);
      }

      // Fetch employees for dropdown if HR
      if (isHR) {
        const empRes = await fetch('/api/v1/employees', { headers: { Authorization: `Bearer ${token}` } });
        const empData = await empRes.json();
        if (empData.success) {
          setEmployees(empData.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterEmployee, filterDate, filterException]);

  const exceptionsCount = attendances.filter((a) => a.has_exception).length;
  const totalOvertime = attendances.reduce((acc, curr) => acc + (Number(curr.overtime_hours) || 0), 0);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" />
            <span>Attendance & Time Logs</span>
          </h1>
          <p className="text-xs text-slate mt-1">
            Track daily check-ins, worked hours, overtime, and handle missing checkout exceptions.
          </p>
        </div>

        {isHR && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setModalOpen(true);
            }}
            className="h-10 px-5 bg-primary hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Attendance Correction</span>
          </button>
        )}
      </div>

      {/* Interactive Punch Widget */}
      <AttendanceWidget onStatusChange={fetchData} />

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-primary flex items-center justify-center font-bold">
            {attendances.length}
          </div>
          <div>
            <span className="text-[10px] text-slate font-semibold uppercase tracking-wider">Total Log Entries</span>
            <p className="text-sm font-bold text-ink">Recorded Days</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${exceptionsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {exceptionsCount}
          </div>
          <div>
            <span className="text-[10px] text-slate font-semibold uppercase tracking-wider">Exceptions / Flagged</span>
            <p className="text-sm font-bold text-ink">{exceptionsCount > 0 ? `${exceptionsCount} Action Required` : 'All Clean'}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            {totalOvertime.toFixed(1)}h
          </div>
          <div>
            <span className="text-[10px] text-slate font-semibold uppercase tracking-wider">Total Overtime Hours</span>
            <p className="text-sm font-bold text-ink">Payroll Eligible</p>
          </div>
        </div>
      </div>

      {/* Exception Banner if missing checkouts exist */}
      {exceptionsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Missing Check-Out Exception Warning</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              There are {exceptionsCount} attendance entries missing a check-out timestamp from prior days. Under operational rules, worked hours are not left silent or negative; authorized managers must perform manual corrections.
            </p>
          </div>
          <button
            onClick={() => setFilterException(!filterException)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${filterException ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}`}
          >
            {filterException ? 'Showing Flagged Only' : 'Filter Flagged Records'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter:</span>
          </div>

          {isHR && (
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-ink focus:outline-none focus:border-primary"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-ink focus:outline-none focus:border-primary"
          />

          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-xs text-slate hover:text-ink underline cursor-pointer"
            >
              Clear Date
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterException(!filterException)}
            className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${filterException ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-gray-50 text-slate border-gray-200 hover:bg-gray-100'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exceptions Only</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-slate">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Check In</th>
                <th className="py-3.5 px-4">Check Out</th>
                <th className="py-3.5 px-4">Worked Hours</th>
                <th className="py-3.5 px-4">Overtime</th>
                <th className="py-3.5 px-4">Status / Flag</th>
                <th className="py-3.5 px-4">Audit Trail</th>
                {isHR && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate">
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-primary flex items-center justify-center font-bold text-xs">
                          {att.employee?.first_name?.substring(0, 1) || 'E'}
                        </div>
                        <span>{att.employee ? `${att.employee.first_name} ${att.employee.last_name}` : att.employee_id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-mono text-[11px]">{formatDate(att.check_in)}</td>
                    <td className="py-3.5 px-4 text-gray-700 font-mono text-[11px]">
                      {att.check_out ? (
                        formatDate(att.check_out)
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Missing Check-Out</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      {att.worked_hours !== null && att.worked_hours !== undefined ? `${att.worked_hours} hrs` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.overtime_hours > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                          +{att.overtime_hours} hrs
                        </span>
                      ) : (
                        <span className="text-gray-400">0 hrs</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.status === 'Missing Check-Out' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Missing Check-Out
                        </span>
                      ) : att.is_manual_correction ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <FileEdit className="w-3 h-3" />
                          Manual Correction
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Present
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate text-[11px]">
                      {att.audit_note || '—'}
                    </td>
                    {isHR && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRecord(att);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-primary hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                        >
                          Correct
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Modal */}
      <ManualAttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        existingAttendance={selectedRecord}
        employees={employees}
      />
    </div>
  );
};
