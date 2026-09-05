import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, CheckCircle, Send, DollarSign, ArrowLeft, 
  Layers, Check, Sparkles, Printer, Mail, User, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { PayslipDetailModal } from '../components/PayslipDetailModal';
import { PayrollApiClient, Payrun, PayslipDetail } from '../services/payrollApi';
import { useAuth } from '../../../context/AuthContext';
import { getNormalizedRole } from '../../../layouts/SubNav';

const fmt = (val: any, decimals = 0): string => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, decimals > 0 ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined);
};

export const PayrunProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [payslips, setPayslips] = useState<PayslipDetail[]>([]);
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);
  const canEdit = ['admin', 'hr_payroll_manager'].includes(normalizedRole);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<'split' | 'table'>('split');

  useEffect(() => {
    if (id) {
      loadPayrunData(id);
    }
  }, [id]);

  const loadPayrunData = async (payrunId: string) => {
    setLoading(true);
    try {
      const [pData, psData] = await Promise.all([
        PayrollApiClient.getPayrunById(payrunId),
        PayrollApiClient.getPayslipsByPayrun(payrunId),
      ]);
      setPayrun(pData);
      setPayslips(psData || []);
      if (psData && psData.length > 0) {
        setSelectedPayslip(psData[0]);
      }
    } catch (err) {
      console.error('Error loading payrun details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!payrun) return;
    try {
      const updated = await PayrollApiClient.validatePayrun(payrun.id);
      setPayrun(updated);
      setActionSuccessMessage('Payrun successfully validated! All salary calculations locked.');
    } catch (err) {
      console.error('Error validating payrun:', err);
    }
  };

  const handleMarkPaid = async () => {
    if (!payrun) return;
    try {
      const updated = await PayrollApiClient.markPaidPayrun(payrun.id);
      setPayrun(updated);
      setActionSuccessMessage('Payrun marked as Paid! Payouts registered.');
    } catch (err) {
      console.error('Error marking payrun paid:', err);
    }
  };

  const handleSendPayslips = async () => {
    if (!payrun) return;
    try {
      const res = await PayrollApiClient.sendPayslips(payrun.id);
      setActionSuccessMessage(`Payslips dispatched successfully! ${res.sent} sent, ${res.failed} failed.`);
    } catch (err) {
      console.error('Error sending payslips:', err);
    }
  };

  const openPayslipDetail = (ps: PayslipDetail) => {
    setSelectedPayslip(ps);
    setIsDetailModalOpen(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-16 space-y-3">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading payrun ledger & calculations...</p>
    </div>
  );

  if (!payrun) return (
    <div className="p-8 text-center bg-white rounded-[24px] shadow-sm max-w-md mx-auto my-12 border border-red-100">
      <p className="text-sm font-bold text-red-600 mb-3">Payrun record not found.</p>
      <Button variant="secondary" onClick={() => navigate('/payroll')}>
        Back to Payruns
      </Button>
    </div>
  );

  const totalGross = payslips.length > 0 
    ? payslips.reduce((acc, curr) => acc + (Number(curr.gross_wage) || 0), 0)
    : Number(payrun.total_gross) || 0;

  const totalNet = payslips.length > 0 
    ? payslips.reduce((acc, curr) => acc + (Number(curr.net_wage) || 0), 0)
    : Number(payrun.total_net) || 0;

  const tableColumns: Column<PayslipDetail>[] = [
    {
      header: 'Employee Name',
      accessorKey: 'employee_name',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {row.employee_name?.charAt(0) || 'E'}
          </div>
          <div>
            <p className="font-bold text-xs text-[#12141F]">{row.employee_name || 'Employee'}</p>
            <p className="text-[11px] text-slate-500 font-medium">{row.job_position || 'Staff'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessorKey: 'department_name',
      cell: (row) => <Badge variant="neutral" showDot={false}>{row.department_name || 'General'}</Badge>,
    },
    {
      header: 'Basic Wage',
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-600 font-tabular">${fmt(row.basic_wage)}</span>,
    },
    {
      header: 'Gross Wage',
      cell: (row) => <span className="font-mono text-xs font-semibold text-[#12141F] font-tabular">${fmt(row.gross_wage)}</span>,
    },
    {
      header: 'Net Disbursal',
      cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600 font-tabular">${fmt(row.net_wage)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <Badge status={row.status || 'Draft'} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => openPayslipDetail(row)}>
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Batch Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/payroll')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#12141F] tracking-tight">{payrun.name || 'Payrun Batch'}</h1>
              <Badge status={payrun.status || 'Draft'} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: <span className="font-mono font-semibold text-slate-700">{payrun.period_start} → {payrun.period_end}</span> · Structure: <span className="font-semibold text-primary">{payrun.structure_name || 'Standard Monthly Salary'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {payrun?.status === 'Draft' && canEdit && (
            <Button variant="primary" className="gap-2 shadow-glow" onClick={handleValidate}>
              <CheckCircle className="w-4 h-4" /> Validate Payrun
            </Button>
          )}
          {payrun?.status === 'Validated' && canEdit && (
            <Button variant="primary" className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md" onClick={handleMarkPaid}>
              <DollarSign className="w-4 h-4" /> Mark as Paid
            </Button>
          )}
          {payrun?.status === 'Paid' && canEdit && (
            <Button variant="secondary" className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-full" onClick={handleSendPayslips}>
              <Send className="w-4 h-4" /> Disburse Payslips (Email)
            </Button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-[20px] text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Pre-validation Warning Banners */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Pre-Validation Payroll Warnings ({payrun.warnings.length})</span>
          </div>
          <div className="space-y-1 pl-6">
            {payrun.warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-amber-900 font-medium">
                • <strong className="font-bold">{w.employee_name || 'Employee'}:</strong> {w.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2-Step Active Batch Workflow Pipeline Bar (Finnova Signature) */}
      <div className="bg-white rounded-[24px] p-5 shadow-fintech border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#12141F]">Active Batch Workflow Pipeline</h2>
              <p className="text-[11px] text-slate-500">Batch ID: <span className="font-mono font-semibold text-slate-800">{payrun.id.slice(0, 14)}</span> • Standard Ruleset</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Phase:</span>
            <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {payrun.status === 'Draft' ? 'Step 2 — Computation & Review' : 'Step 2 — Finalized & Locked'}
            </span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Completed */}
          <div className="p-3.5 bg-slate-50/80 rounded-[18px] border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-primary">Step 1 — Completed</span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="text-xs font-bold text-[#12141F] mt-0.5">Pay Structure & Period Definition</div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                <span className="bg-white px-2 py-0.5 rounded-full font-medium border border-slate-200/60 text-slate-700">
                  {payrun.structure_name || 'Standard Monthly Salary'}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-700 font-mono">{payrun.period_start} — {payrun.period_end}</span>
              </div>
            </div>
          </div>

          {/* Step 2: Active */}
          <div className="p-3.5 bg-primary/5 rounded-[18px] border border-primary/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-glow animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-primary">Step 2 — Computation Pipeline</span>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                  {payrun.status === 'Draft' ? 'In Progress' : 'Verified'}
                </span>
              </div>
              <div className="text-xs font-bold text-[#12141F] mt-0.5">Employee Selection & Rule Engine</div>
              <div className="flex items-center justify-between gap-3 mt-1.5 text-[11px]">
                <span className="font-semibold text-slate-700">
                  {payslips.length} Employees Resolved
                </span>
                <div className="w-32 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Finnova KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-5 shadow-fintech border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Workforce</span>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              {payslips.length || payrun.employee_count || 0}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Headcount</span>
          </div>
          <div className="text-[11px] text-slate-400">All contracts active & mapped</div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-fintech border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Gross Wage</span>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              ${fmt(totalGross)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Pre-deductions base + allowances</div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-fintech border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Net Disbursed</span>
          <div className="my-2">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight font-tabular">
              ${fmt(totalNet)}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">Scheduled via ACH direct transfer</div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-fintech border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Batch State</span>
          <div className="my-2">
            <Badge status={payrun.status || 'Draft'} />
          </div>
          <div className="text-[11px] text-slate-400">
            {payrun.status === 'Paid' ? 'Disbursed to bank ledger' : 'Ready for compliance clearance'}
          </div>
        </div>
      </div>

      {/* SIGNATURE FINNOVA DARK COMMAND DECK (Dual Zone: Master Ledger + Live Payslip Inspection Deck) */}
      <div className="bg-[#12141F] text-white rounded-[32px] p-5 lg:p-6 shadow-deck border border-slate-800">
        {/* Top Deck Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white tracking-tight">Active Payroll Ledger</h3>
            <span className="bg-[#1B1E30] text-primary-fixed text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/5">
              {payslips.length} Payslips Computed
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1B1E30] p-1 rounded-full border border-white/5">
            <button
              onClick={() => setActiveViewMode('split')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeViewMode === 'split' ? 'bg-[#252945] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split Inspection View
            </button>
            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeViewMode === 'table' ? 'bg-[#252945] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Roster Table
            </button>
          </div>
        </div>

        {activeViewMode === 'split' ? (
          /* Dual Zone Split View: Left Roster List + Right Live Rule Breakdown */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Roster Column (5 cols) */}
            <div className="lg:col-span-5 space-y-2 max-h-[580px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>Employee</span>
                <span>Net Disbursal</span>
              </div>

              {payslips.map((ps) => {
                const isSelected = selectedPayslip?.id === ps.id;
                return (
                  <div
                    key={ps.id}
                    onClick={() => setSelectedPayslip(ps)}
                    className={`p-3 rounded-[16px] transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#1E2238] to-[#252945] border-primary shadow-glow text-white'
                        : 'bg-[#171A2A] hover:bg-[#1C2033] border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-primary text-white' : 'bg-[#252945] text-slate-300'
                      }`}>
                        {ps.employee_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{ps.employee_name || 'Employee'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{ps.job_position || 'Staff'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        ${fmt(ps.net_wage, 2)}
                      </div>
                      <Badge status={ps.status || 'Draft'} />
                    </div>
                  </div>
                );
              })}

              {payslips.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No payslips generated for this payrun.
                </div>
              )}
            </div>

            {/* Right Live Inspection Column (7 cols) */}
            <div className="lg:col-span-7 bg-[#171A2A] rounded-[24px] p-5 border border-white/10 space-y-4">
              {selectedPayslip ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {selectedPayslip.employee_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{selectedPayslip.employee_name}</h4>
                        <p className="text-xs text-slate-400">
                          {selectedPayslip.job_position || 'Staff'} • {selectedPayslip.department_name || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full bg-[#1B1E30] text-slate-300 border-white/10 hover:bg-[#252945] text-xs"
                        onClick={() => openPayslipDetail(selectedPayslip)}
                      >
                        Inspect Deep Modal
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-3 bg-[#12141F] p-3 rounded-[16px] border border-white/5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Base Contract</span>
                      <span className="font-mono font-bold text-white text-sm">${fmt(selectedPayslip.contract_wage)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Calculated Gross</span>
                      <span className="font-mono font-bold text-white text-sm">${fmt(selectedPayslip.gross_wage)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-400 block font-medium">Net Disbursal</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">${fmt(selectedPayslip.net_wage, 2)}</span>
                    </div>
                  </div>

                  {/* Sequenced Rules Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Itemized Computation Lines ({selectedPayslip.lines?.length || 0})
                      </span>
                      <span className="text-[11px] text-primary-fixed font-mono">Sequenced Resolution</span>
                    </div>

                    <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                      {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
                        selectedPayslip.lines.map((line, idx) => (
                          <div
                            key={line.rule_id || idx}
                            className="flex items-center justify-between p-2.5 bg-[#12141F] rounded-[12px] border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-[#252945] text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                {line.code}
                              </span>
                              <span className="font-medium text-slate-200">{line.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                line.category === 'DEDUCTION'
                                  ? 'bg-red-500/20 text-red-400'
                                  : line.category === 'BASIC'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-primary/20 text-primary-fixed'
                              }`}>
                                {line.category}
                              </span>
                              <span className={`font-mono font-bold text-xs ${
                                line.category === 'DEDUCTION' ? 'text-red-400' : 'text-slate-100'
                              }`}>
                                {line.category === 'DEDUCTION' ? '-' : ''}${fmt(line.amount, 2)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          No computed rule lines available.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Select an employee from the left ledger to inspect live computation rules.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Full Table View inside Dark Deck */
          <div className="bg-[#171A2A] rounded-[24px] p-2 border border-white/10 overflow-hidden">
            <Table
              columns={tableColumns}
              data={payslips}
              keyExtractor={(row) => row.id}
              onRowClick={openPayslipDetail}
              emptyMessage="No payslips generated for this payrun."
            />
          </div>
        )}
      </div>

      {/* Payslip Detail Drawer / Modal */}
      <PayslipDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        payslip={selectedPayslip}
        onResendEmail={() => alert(`Resent payslip email to ${selectedPayslip?.employee_name}`)}
      />
    </div>
  );
};
