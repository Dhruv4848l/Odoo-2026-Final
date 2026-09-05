import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { PayrunWizardModal } from '../components/PayrunWizardModal';
import { PayrollApiClient, Payrun, SalaryStructure } from '../services/payrollApi';
import { useAuth } from '../../../context/AuthContext';
import { getNormalizedRole } from '../../../layouts/SubNav';

const fmt = (val: any): string => {
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};

export const PayrunsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);
  const canCreate = ['admin', 'hr_payroll_manager'].includes(normalizedRole);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pData, sData] = await Promise.all([
        PayrollApiClient.getPayruns(),
        PayrollApiClient.getStructures(),
      ]);
      setPayruns(pData || []);
      setStructures(sData || []);
    } catch (err) {
      console.error('Error loading payruns:', err);
    }
  };

  const handleCreatePayrun = async (data: {
    name: string;
    structure_id: number;
    period_start: string;
    period_end: string;
    selected_employee_ids: number[];
  }) => {
    try {
      const created = await PayrollApiClient.createPayrun(data);
      setPayruns((prev) => [created, ...prev]);
      navigate(`/payroll/payruns/${created.id}`);
    } catch (err) {
      console.error('Error creating payrun:', err);
    }
  };

  const columns: Column<Payrun>[] = [
    {
      header: 'Payrun Name',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-[#1A1A2E]">{row.name || 'Payrun Batch'}</p>
          <p className="text-[11px] text-[#6B7280]">{row.structure_name || 'Standard Monthly Salary'}</p>
        </div>
      ),
    },
    {
      header: 'Period Dates',
      cell: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {row.period_start} → {row.period_end}
        </span>
      ),
    },
    {
      header: 'Employees',
      accessorKey: 'employee_count',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
          {row.employee_count || 0} Employees
        </span>
      ),
    },
    {
      header: 'Total Gross',
      cell: (row) => <span className="font-mono text-xs font-semibold text-[#14141F]">${fmt(row.total_gross)}</span>,
    },
    {
      header: 'Total Net Salary',
      cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">${fmt(row.total_net)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <Badge status={row.status || 'Draft'} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/payroll/payruns/${row.id}`); }}>
          <span>View Processing</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Payruns & Payroll Batches</h1>
          <p className="text-xs text-[#6B7280]">Process monthly payruns, validate salary calculations, and disburse payslips</p>
        </div>
        {canCreate && (
          <Button variant="primary" className="gap-2" onClick={() => setIsWizardOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Create New Payrun</span>
          </Button>
        )}
      </div>

      {/* Payruns List Table */}
      <Card title="Active & Historical Payruns">
        <Table
          columns={columns}
          data={payruns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/payroll/payruns/${row.id}`)}
          emptyMessage="No payruns created yet. Click 'Create New Payrun' to launch the wizard."
        />
      </Card>

      {/* Payrun Creation Wizard Modal */}
      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        structures={structures}
        onSubmit={handleCreatePayrun}
      />
    </div>
  );
};
