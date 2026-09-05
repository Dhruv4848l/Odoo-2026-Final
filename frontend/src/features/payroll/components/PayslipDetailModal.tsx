import React from 'react';
import { Printer, Mail } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { PayslipDetail, PayslipLine } from '../services/payrollApi';

const fmt = (val: any, decimals = 0): string => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, decimals > 0 ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined);
};

export interface PayslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipDetail | null;
  onResendEmail?: () => void;
}

export const PayslipDetailModal: React.FC<PayslipDetailModalProps> = ({
  isOpen,
  onClose,
  payslip,
  onResendEmail,
}) => {
  if (!payslip) return null;

  const handlePrintPDF = () => {
    window.print();
  };

  const columns: Column<PayslipLine>[] = [
    {
      header: 'Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono bg-slate-100 text-[#14141F] px-2 py-0.5 rounded text-xs font-semibold">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Rule Name',
      accessorKey: 'name',
      cell: (row) => <span className="font-semibold text-xs text-[#1A1A2E]">{row.name}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => {
        let variant: 'positive' | 'neutral' | 'warning' | 'danger' | 'info' = 'info';
        if (row.category === 'BASIC') variant = 'positive';
        if (row.category === 'DEDUCTION') variant = 'danger';
        return <Badge variant={variant} showDot={false}>{row.category}</Badge>;
      },
    },
    {
      header: 'Amount ($)',
      cell: (row) => (
        <span className={`font-mono text-xs font-bold ${row.category === 'DEDUCTION' ? 'text-red-600' : 'text-[#14141F]'}`}>
          {row.category === 'DEDUCTION' ? '-' : ''}${fmt(row.amount, 2)}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip Detail — ${payslip.employee_name || 'Employee'}`}
      subtitle={`${payslip.payrun_name || 'Payrun'} (${payslip.period_start} to ${payslip.period_end})`}
      maxWidth="4xl"
      footer={
        <>
          <Button variant="secondary" onClick={handlePrintPDF} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </Button>
          {onResendEmail && (
            <Button variant="primary" onClick={onResendEmail} className="gap-2">
              <Mail className="w-4 h-4" />
              <span>Resend Payslip Email</span>
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Payslip Header Card */}
        <div className="bg-gradient-to-r from-[#14141F] to-[#252538] text-white p-5 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">{payslip.employee_name || 'Employee'}</h2>
              <Badge status={payslip.status || 'Draft'} />
            </div>
            <p className="text-xs text-slate-300">
              {payslip.job_position || 'Staff'} · {payslip.department_name || 'General'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 font-medium">NET SALARY PAYOUT</p>
            <p className="text-2xl font-bold font-mono text-[#22C55E]">
              ${fmt(payslip.net_wage, 2)}
            </p>
          </div>
        </div>

        {/* Contract & Proration Highlights */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-[#E5E7EB] text-xs">
          <div>
            <span className="text-[#6B7280] font-semibold block">Base Contract Wage:</span>
            <span className="font-mono font-bold text-[#1A1A2E] text-sm">${fmt(payslip.contract_wage)}</span>
          </div>
          <div>
            <span className="text-[#6B7280] font-semibold block">Prorated Basic Wage:</span>
            <span className="font-mono font-bold text-[#5B4FE9] text-sm">${fmt(payslip.basic_wage)}</span>
          </div>
          <div>
            <span className="text-[#6B7280] font-semibold block">Calculated Gross Wage:</span>
            <span className="font-mono font-bold text-[#14141F] text-sm">${fmt(payslip.gross_wage)}</span>
          </div>
        </div>

        {/* Sequenced Rule Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Itemized Salary Rule Computation Breakdown</h4>
          <Table
            columns={columns}
            data={payslip.lines || []}
            keyExtractor={(row) => row.rule_id}
          />
        </div>
      </div>
    </Modal>
  );
};
