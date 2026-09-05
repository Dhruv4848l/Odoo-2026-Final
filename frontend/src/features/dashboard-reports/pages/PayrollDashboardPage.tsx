import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, AlertTriangle, TrendingUp, Clock, Calendar,
  Building2, ShieldCheck, Mail, FileText, ChevronDown, RefreshCw
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface DashboardSummary {
  salary_fund: { total_net: number; total_gross: number; payslip_count: number };
  active_headcount: number;
  avg_salary_per_employee: number;
  approved_time_off_days: number;
  attendance_health: { rate: number; total_records: number; missing_checkouts: number };
  pending_time_off_requests: number;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  count?: number;
}

interface DeptSalary {
  department: string;
  total_gross: number;
  total_net: number;
  employee_count: number;
}

interface SalaryTrend {
  month_label: string;
  total_net: number;
  total_gross: number;
  payslip_count: number;
}

interface PayslipStatus {
  status: string;
  count: number;
}

interface AttendanceOverview {
  present: number;
  missing_checkout: number;
  manual_corrections: number;
}

interface DeptOverview {
  department: string;
  headcount: number;
  avg_salary: number;
}

async function fetchDashboard(endpoint: string, period?: string, dept?: string) {
  const token = localStorage.getItem('token') || 'demo-token';
  const params = new URLSearchParams();
  if (period && period !== 'All Periods') params.append('period', period);
  if (dept && dept !== 'All Departments') params.append('department', dept);
  
  const queryString = params.toString();
  const url = `${API_BASE}/dashboard/${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export const PayrollDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [deptSalary, setDeptSalary] = useState<DeptSalary[]>([]);
  const [salaryTrend, setSalaryTrend] = useState<SalaryTrend[]>([]);
  const [payslipStatus, setPayslipStatus] = useState<PayslipStatus[]>([]);
  const [attOverview, setAttOverview] = useState<AttendanceOverview | null>(null);
  const [deptOverview, setDeptOverview] = useState<DeptOverview[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodFilter, setPeriodFilter] = useState('Sep 2026');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [sum, alt, dept, trend, status, att, deptOv] = await Promise.all([
        fetchDashboard('summary', periodFilter, deptFilter),
        fetchDashboard('alerts', periodFilter, deptFilter),
        fetchDashboard('salary-by-department', periodFilter, deptFilter),
        fetchDashboard('salary-trend', periodFilter, deptFilter),
        fetchDashboard('payslip-status', periodFilter, deptFilter),
        fetchDashboard('attendance-overview', periodFilter, deptFilter),
        fetchDashboard('department-overview', periodFilter, deptFilter),
      ]);
      setSummary(sum);
      setAlerts(alt || []);
      setDeptSalary(dept || []);
      setSalaryTrend(trend || []);
      setPayslipStatus(status || []);
      setAttOverview(att);
      setDeptOverview(deptOv || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  const severityStyles: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const severityIcons: Record<string, React.ReactNode> = {
    critical: <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    info: <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />,
  };

  const statusColors: Record<string, string> = {
    Draft: '#6B7280',
    Computed: '#3B82F6',
    Validated: '#F59E0B',
    Paid: '#22C55E',
    Cancelled: '#EF4444',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-[#5B4FE9] animate-spin" />
        <span className="ml-3 text-sm text-[#6B7280]">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Payroll Dashboard</h1>
          <p className="text-xs text-[#6B7280]">
            Live aggregated KPIs — powered by real HR & Payroll data across all modules
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="appearance-none bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-xs font-medium text-[#374151] pr-7 cursor-pointer"
            >
              <option>Sep 2026</option>
              <option>Aug 2026</option>
              <option>Jul 2026</option>
              <option>All Periods</option>
            </select>
            <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-xs font-medium text-[#374151] pr-7 cursor-pointer"
            >
              <option>All Departments</option>
              <option>Sales Operations</option>
              <option>Engineering</option>
              <option>Human Resources</option>
              <option>Finance & Accounting</option>
            </select>
            <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
          </div>

          <button
            onClick={loadDashboard}
            className="flex items-center gap-1.5 bg-[#5B4FE9] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#4A3FD8] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {summary?.salary_fund.payslip_count === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-600" />
          No payroll data processed yet. Please run your first Payrun to see dashboard insights.
        </div>
      )}
      <div className="grid grid-cols-6 gap-4">
        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-[#5B4FE9]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Total Net Salary Fund</p>
          </div>
          <p className="text-2xl font-bold text-[#5B4FE9] font-mono">
            {formatCurrency(summary?.salary_fund.total_net || 0)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {summary?.salary_fund.payslip_count || 0} payslip(s) this period
          </p>
        </Card>

        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#14141F]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Active Headcount</p>
          </div>
          <p className="text-2xl font-bold text-[#14141F] font-mono">
            {summary?.active_headcount || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Employees currently active</p>
        </Card>

        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-[#8B5CF6]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Avg Salary / Employee</p>
          </div>
          <p className="text-2xl font-bold text-[#8B5CF6] font-mono">
            {formatCurrency(summary?.avg_salary_per_employee || 0)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Net salary per head</p>
        </Card>

        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#3B82F6]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Approved Time Off</p>
          </div>
          <p className="text-2xl font-bold text-[#3B82F6] font-mono">
            {summary?.approved_time_off_days || 0} <span className="text-sm font-normal">Days</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Across all leave types</p>
        </Card>

        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Attendance Audits</p>
          </div>
          <p className="text-2xl font-bold text-[#22C55E] font-mono">
            {summary?.attendance_health.rate || 0}%
          </p>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            {summary?.attendance_health.missing_checkouts || 0} missing check-out(s)
          </p>
        </Card>

        <Card variant="kpi">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Pending Requests</p>
          </div>
          <p className="text-2xl font-bold text-[#F59E0B] font-mono">
            {summary?.pending_time_off_requests || 0}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Time off awaiting approval</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Salary Cost by Department */}
        <Card title="Salary Cost by Department">
          <div className="space-y-3 mt-2">
            {deptSalary.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-4">No payroll data available yet</p>
            ) : (
              deptSalary.map((dept, i) => {
                const maxGross = Math.max(...deptSalary.map(d => d.total_gross), 1);
                const barWidth = Math.max(8, (dept.total_gross / maxGross) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-[#374151]">{dept.department}</span>
                      <span className="font-mono text-[#5B4FE9]">{formatCurrency(dept.total_gross)}</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#5B4FE9] to-[#8B5CF6] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{dept.employee_count} employee(s)</p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Monthly Net Salary Trend */}
        <Card title="Monthly Net Salary Trend">
          <div className="space-y-2 mt-2">
            {salaryTrend.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-4">No trend data available yet</p>
            ) : (
              salaryTrend.map((month, i) => {
                const maxNet = Math.max(...salaryTrend.map(m => m.total_net), 1);
                const barWidth = Math.max(8, (month.total_net / maxNet) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-[#6B7280] w-16 flex-shrink-0">
                      {month.month_label}
                    </span>
                    <div className="flex-1 bg-[#F3F4F6] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#374151] w-16 text-right">
                      {formatCurrency(month.total_net)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Payslip Status & Alerts */}
        <Card title="Payslip Status & Payroll Alerts">
          <div className="space-y-3 mt-2">
            {/* Status split */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase mb-2">Status Split</p>
              {payslipStatus.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-2">No payslips yet</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {payslipStatus.map((ps, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold"
                      style={{
                        borderColor: statusColors[ps.status] || '#6B7280',
                        color: statusColors[ps.status] || '#6B7280',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColors[ps.status] || '#6B7280' }}
                      />
                      {ps.status}: {ps.count}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Alerts inline */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase mb-2">Current Alerts</p>
              {alerts.length === 0 ? (
                <p className="text-xs text-emerald-600 font-semibold">✓ No active alerts</p>
              ) : (
                <div className="space-y-1.5">
                  {alerts.slice(0, 3).map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[10px] font-semibold ${severityStyles[alert.severity] || severityStyles.info}`}
                    >
                      {severityIcons[alert.severity] || severityIcons.info}
                      <span className="truncate">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Attendance Overview */}
        <Card title="Attendance Overview">
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 bg-emerald-50 rounded-lg">
              <p className="text-lg font-bold text-emerald-600 font-mono">{attOverview?.present || 0}</p>
              <p className="text-[9px] text-emerald-700 font-semibold">Present</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <p className="text-lg font-bold text-amber-600 font-mono">{attOverview?.missing_checkout || 0}</p>
              <p className="text-[9px] text-amber-700 font-semibold">Missing</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600 font-mono">{attOverview?.manual_corrections || 0}</p>
              <p className="text-[9px] text-blue-700 font-semibold">Manual</p>
            </div>
          </div>
        </Card>

        {/* Time Off Overview */}
        <Card title="Time Off Overview">
          <div className="mt-2">
            {deptOverview.length === 0 && (
              <p className="text-xs text-[#9CA3AF] text-center py-2">No data</p>
            )}
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-[#6B7280] border-b">
                  <th className="text-left py-1 font-semibold">Type</th>
                  <th className="text-right py-1 font-semibold">Approved</th>
                  <th className="text-right py-1 font-semibold">Pending</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-1.5 font-semibold text-[#374151]">Paid Time Off</td>
                  <td className="py-1.5 text-right font-mono">{summary?.approved_time_off_days || 0}</td>
                  <td className="py-1.5 text-right font-mono text-amber-600">{summary?.pending_time_off_requests || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Department Overview */}
        <Card title="Department Overview">
          <div className="mt-2">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-[#6B7280] border-b">
                  <th className="text-left py-1 font-semibold">Department</th>
                  <th className="text-right py-1 font-semibold">Headcount</th>
                  <th className="text-right py-1 font-semibold">Avg Salary</th>
                </tr>
              </thead>
              <tbody>
                {deptOverview.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-[#9CA3AF]">No data</td>
                  </tr>
                ) : (
                  deptOverview.map((dept, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="py-1.5 font-semibold text-[#374151]">{dept.department}</td>
                      <td className="py-1.5 text-right font-mono">{dept.headcount}</td>
                      <td className="py-1.5 text-right font-mono text-[#5B4FE9]">{formatCurrency(dept.avg_salary)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Models to Aggregate */}
        <Card title="Models to Aggregate">
          <div className="space-y-1.5 mt-2">
            {[
              { name: 'Employees / Departments', icon: <Users className="w-3.5 h-3.5" />, desc: 'headcount, seniority, grouping' },
              { name: 'Contracts', icon: <FileText className="w-3.5 h-3.5" />, desc: 'wages, statuses, duration' },
              { name: 'Attendance', icon: <Clock className="w-3.5 h-3.5" />, desc: 'presence, overtime, exceptions' },
              { name: 'Payruns / Payslips', icon: <DollarSign className="w-3.5 h-3.5" />, desc: 'salary totals, paid vs pending, trend data' },
              { name: 'Time Off Requests', icon: <Calendar className="w-3.5 h-3.5" />, desc: 'leave balance and trend breakdown' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#F9FAFB] transition-colors">
                <div className="text-[#5B4FE9]">{item.icon}</div>
                <div>
                  <p className="text-[10px] font-semibold text-[#374151]">{item.name}</p>
                  <p className="text-[9px] text-[#9CA3AF]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Proactive Alerts Section (Full Width) */}
      {alerts.length > 0 && (
        <Card title="Proactive Executive Alerts & Warnings">
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border text-xs font-semibold ${severityStyles[alert.severity] || severityStyles.info}`}
              >
                <div className="flex items-center gap-3">
                  {severityIcons[alert.severity] || severityIcons.info}
                  <span>{alert.message}</span>
                </div>
                {alert.type === 'MISSING_CHECKOUT' && (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/attendance')} className="bg-white">
                    Resolve Now
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
