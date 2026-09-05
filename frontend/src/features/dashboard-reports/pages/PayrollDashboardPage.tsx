import React from 'react';
import { DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export const PayrollDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A2E]">Payroll & Executive Dashboard</h1>
        <p className="text-xs text-[#6B7280]">Live aggregated KPIs across Employee, Contract, Attendance, Time Off, and Payroll data</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">TOTAL SALARY COST (MONTHLY)</p>
          <p className="text-3xl font-bold text-[#5B4FE9] font-mono mt-1">$49,600</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">↑ +4.2% vs last month</p>
        </Card>

        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">ACTIVE HEADCOUNT</p>
          <p className="text-3xl font-bold text-[#14141F] font-mono mt-1">4 Employees</p>
          <p className="text-xs text-slate-500 font-semibold mt-2">100% active contracts</p>
        </Card>

        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">ATTENDANCE HEALTH RATE</p>
          <p className="text-3xl font-bold text-[#22C55E] font-mono mt-1">97.8%</p>
          <p className="text-xs text-amber-600 font-semibold mt-2">1 missing check-out flag</p>
        </Card>

        <Card variant="kpi">
          <p className="text-[11px] font-semibold text-[#6B7280]">UNAPPROVED TIME OFF</p>
          <p className="text-3xl font-bold text-[#F59E0B] font-mono mt-1">1 Request</p>
          <p className="text-xs text-slate-500 font-semibold mt-2">Parental leave pending</p>
        </Card>
      </div>

      {/* Proactive Alerts Section */}
      <Card title="Proactive Executive Alerts & Warnings">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>3 Employees Missing Bank Details:</strong> Update profiles before October 2026 Payrun disbursement.</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
            <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span><strong>Contract Switch Recorded:</strong> Amara Chen promoted to Store Supervisor ($5,200/mo effective June 1).</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
