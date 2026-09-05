import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Send, DollarSign, ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { PayslipDetailModal } from '../components/PayslipDetailModal';
import { PayrollApiClient, Payrun, PayslipDetail } from '../services/payrollApi';

const fmt = (val: any): string => {
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};

export const PayrunProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [payslips, setPayslips] = useState<PayslipDetail[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      const numId = Number(id);
      loadPayrunData(numId);
    }
  }, [id]);

  const loadPayrunData = async (payrunId: number) => {
    setLoading(true);
    try {
      const [pData, psData] = await Promise.all([
        PayrollApiClient.getPayrunById(payrunId),
        PayrollApiClient.getPayslipsByPayrun(payrunId),
      ]);
      setPayrun(pData);
      setPayslips(psData || []);
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

  const columns: Column<PayslipDetail>[] = [
    {
      header: 'Employee Name',
      accessorKey: 'employee_name',
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-[#1A1A2E]">{row.employee_name || 'Employee'}</p>
          <p className="text-[11px] text-[#6B7280]">{row.job_position || 'Staff'}</p>
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
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">${fmt(row.basic_wage)}</span>,
    },
    {
      header: 'Gross Wage',
      cell: (row) => <span className="font-mono text-xs font-semibold text-[#14141F]">${fmt(row.gross_wage)}</span>,
    },
    {
      header: 'Net Wage',
      cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">${fmt(row.net_wage)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <Badge status={row.status || 'Draft'} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => openPayslipDetail(row)}>
          View Breakdown
        </Button>
      ),
    },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading payrun details...</div>;
  if (!payrun) return <div className="p-8 text-center text-red-500 font-semibold">Payrun record not found.</div>;

  const totalGross = payslips.length > 0 
    ? payslips.reduce((acc, curr) => acc + (Number(curr.gross_wage) || 0), 0)
    : Number(payrun.total_gross) || 0;

  const totalNet = payslips.length > 0 
    ? payslips.reduce((acc, curr) => acc + (Number(curr.net_wage) || 0), 0)
    : Number(payrun.total_net) || 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="icon" onClick={() => navigate('/payroll')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1A1A2E]">{payrun.name || 'Payrun Batch'}</h1>
              <Badge status={payrun.status || 'Draft'} />
            </div>
            <p className="text-xs text-[#6B7280]">
              Period: {payrun.period_start} to {payrun.period_end} · Structure: {payrun.structure_name || 'Standard Monthly Salary'}
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-3">
          {payrun.status === 'Draft' && (
            <Button variant="finalize" onClick={handleValidate} className="gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Validate Payrun</span>
            </Button>
          )}
          {payrun.status === 'Validated' && (
            <Button variant="finalize" onClick={handleMarkPaid} className="gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Mark Paid</span>
            </Button>
          )}
          <Button variant="primary" onClick={handleSendPayslips} className="gap-2">
            <Send className="w-4 h-4" />
            <span>Send Payslips (Bulk Email)</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="text-[#16A34A] font-bold">×</button>
        </div>
      )}

      {/* Pre-validation Warning Banners (Amber Tinted Cards) */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
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

      {/* Payroll KPI Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">TOTAL EMPLOYEES</p>
          <p className="text-2xl font-bold text-[#1A1A2E] mt-1">{payslips.length || payrun.employee_count || 0}</p>
        </Card>
        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">TOTAL GROSS WAGE</p>
          <p className="text-2xl font-bold text-[#14141F] mt-1">${fmt(totalGross)}</p>
        </Card>
        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">TOTAL NET DISBURSED</p>
          <p className="text-2xl font-bold text-[#22C55E] mt-1">${fmt(totalNet)}</p>
        </Card>
        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">PAYRUN STATE</p>
          <div className="mt-2">
            <Badge status={payrun.status || 'Draft'} />
          </div>
        </Card>
      </div>

      {/* Payslips Datatable */}
      <Card title="Employee Payslip Summary Breakdown" subtitle="Click any row to inspect itemized salary rules">
        <Table
          columns={columns}
          data={payslips}
          keyExtractor={(row) => row.id}
          onRowClick={openPayslipDetail}
          emptyMessage="No payslips generated for this payrun."
        />
      </Card>

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
