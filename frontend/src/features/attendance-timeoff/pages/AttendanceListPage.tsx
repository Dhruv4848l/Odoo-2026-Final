import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, Plus, Filter, CheckCircle2, FileEdit, 
  TrendingUp, Calendar, User, Search, CheckCircle, ShieldAlert 
} from 'lucide-react';
import { AttendanceWidget } from '../components/AttendanceWidget';
import { ManualAttendanceModal } from '../components/ManualAttendanceModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { useRealtimeSubscription } from '../../../context/RealtimeContext';

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

  // Zero-Reload Real-time Attendance synchronization
  useRealtimeSubscription('ATTENDANCE_UPDATE', () => {
    console.log('[Attendance] Live sync received. Refreshing punches table...');
    fetchData();
  });

  const exceptionsCount = attendances.filter((a) => a.has_exception).length;
  const totalOvertime = attendances.reduce((acc, curr) => acc + (Number(curr.overtime_hours) || 0), 0);
  const totalCheckedIn = attendances.filter((a) => a.check_in && !a.check_out).length;
  const totalRecords = attendances.length;

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Biometric & Web Kiosk Sync
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Real-Time Shifts</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight flex items-center gap-2">
            <span>Attendance & Time Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time check-ins, worked hours, overtime, and resolve missing check-out exceptions
          </p>
        </div>

        {isHR && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              className="gap-2 shadow-fintech"
              onClick={() => {
                setSelectedRecord(null);
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Manual Correction</span>
            </Button>
          </div>
        )}
      </div>

      {/* Interactive Punch Terminal Widget */}
      <AttendanceWidget onStatusChange={fetchData} />

      {/* 4 Finnova KPI Daylight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Recorded Logs</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              {totalRecords} <span className="text-sm font-medium text-slate-400">Entries</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="flex items-center text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" /> 88.75%
              </span>
              <span className="text-[11px] text-slate-400">on-premise rate</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '88.75%' }}></div>
            </div>
          </div>
        </div>

        {/* Metric 2: Average Work Time with Vertical Distribution Bars */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Daily Shift</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between my-2">
            <div>
              <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
                8h 12m
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">+15m vs target 8h</p>
            </div>
            {/* Sparkline */}
            <div className="flex items-end gap-1 h-9">
              <div className="w-2 bg-primary/20 rounded-t h-4"></div>
              <div className="w-2 bg-primary/30 rounded-t h-6"></div>
              <div className="w-2 bg-primary/50 rounded-t h-5"></div>
              <div className="w-2 bg-primary/80 rounded-t h-8"></div>
              <div className="w-2 bg-primary rounded-t h-9"></div>
              <div className="w-2 bg-primary/60 rounded-t h-6"></div>
              <div className="w-2 bg-primary/30 rounded-t h-3"></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target: 8.0 hrs</span>
            <span className="text-emerald-600 font-semibold">Standard Shift</span>
          </div>
        </div>

        {/* Metric 3: Exceptions / Missed Punches */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Missing Check-Outs</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              exceptionsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              {exceptionsCount} <span className="text-sm font-medium text-slate-400">Exceptions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {exceptionsCount > 0 ? 'Action needed prior to payroll run' : 'All checkouts synced'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={exceptionsCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
              {exceptionsCount > 0 ? 'Manual correction required' : 'Zero Discrepancies'}
            </span>
          </div>
        </div>

        {/* Metric 4: Total Overtime Hours */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overtime Accumulation</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              {totalOvertime.toFixed(1)} <span className="text-sm font-medium text-slate-400">Hours</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Verified for payroll rule integration</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-primary font-bold">1.5x Multiplier</span>
            <span className="text-slate-400">Auto-calculated</span>
          </div>
        </div>
      </div>

      {/* Missing Check-Out Exception Warning Alert Banner */}
      {exceptionsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Missing Check-Out Exception Warning ({exceptionsCount})
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Under payroll governance rules, shifts cannot be computed with open-ended hours. Authorized HR managers must resolve prior day records.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterException(!filterException)}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 ${
              filterException
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {filterException ? 'Showing Flagged Only' : 'Filter Flagged Records'}
          </button>
        </div>
      )}

      {/* Filter Capsule Bar */}
      <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isHR && (
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-[#12141F] font-medium outline-none focus:border-primary"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs text-[#12141F] outline-none font-medium"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-[10px] text-slate-400 hover:text-slate-700 ml-1 font-bold"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterException(!filterException)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterException
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exceptions Only</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {attendances.length} Punch Logs
        </div>
      </div>

      {/* Attendance Table Daylight Card */}
      <Card title="Attendance Punch Records" subtitle="Daily shift timelines, check-ins, worked hours, and automated overtime">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Status / Flag</th>
                <th className="py-3 px-4">Audit Trail</th>
                {isHR && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records found matching your filters.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#12141F]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {att.employee?.first_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span>{att.employee ? `${att.employee.first_name} ${att.employee.last_name}` : att.employee_id}</span>
                          <span className="block text-[11px] text-slate-400 font-normal">{att.employee?.department_name || 'Staff'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs font-tabular">
                      {formatDate(att.check_in)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs font-tabular">
                      {att.check_out ? (
                        formatDate(att.check_out)
                      ) : (
                        <span className="text-amber-600 font-bold italic">Missing Check-Out</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#12141F] font-tabular">
                      {att.worked_hours !== null && att.worked_hours !== undefined ? `${att.worked_hours} hrs` : '—'}
                    </td>
                    <td className="py-3 px-4 font-tabular">
                      {att.overtime_hours > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[11px]">
                          +{att.overtime_hours} hrs
                        </span>
                      ) : (
                        <span className="text-slate-400">0 hrs</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {att.status === 'Missing Check-Out' ? (
                        <Badge status="Rejected" />
                      ) : att.is_manual_correction ? (
                        <Badge status="Draft" />
                      ) : (
                        <Badge status="Approved" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                      {att.audit_note || '—'}
                    </td>
                    {isHR && (
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-xs hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelectedRecord(att);
                            setModalOpen(true);
                          }}
                        >
                          Correct
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
