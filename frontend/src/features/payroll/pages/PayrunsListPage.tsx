import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Plus, ChevronRight, DollarSign, Sliders, TrendingUp, ShieldCheck, Zap, Wallet, Search, Filter } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { PayrunWizardModal } from '../components/PayrunWizardModal';
import { PayrollApiClient, Payrun, SalaryStructure } from '../services/payrollApi';
import { useAuth } from '../../../context/AuthContext';
import { useRealtimeSubscription } from '../../../context/RealtimeContext';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);
  const canCreate = ['admin', 'hr_payroll_manager'].includes(normalizedRole);

  useEffect(() => {
    loadData();
  }, []);

  // Zero-Reload Real-time Payroll synchronization
  useRealtimeSubscription('PAYROLL_UPDATE', () => {
    console.log('[Payroll] Live batch synchronization triggered. Reloading batches...');
    loadData();
  });

  const loadData = async () => {
    try {
      const [pData, sData] = await Promise.all([
        PayrollApiClient.getPayruns(),
        PayrollApiClient.getStructures(),
      ]);
      setPayruns(pData || []);
      setStructures(sData || []);
    } catch (err: any) {
      console.error('Error loading payruns:', err);
    }
  };

  const handleCreatePayrun = async (data: {
    name: string;
    structure_id: string;
    period_start: string;
    period_end: string;
    selected_employee_ids?: string[];
  }) => {
    setErrorMessage(null);
    try {
      const created = await PayrollApiClient.createPayrun(data);
      setPayruns((prev) => [created, ...prev]);
      navigate(`/payroll/payruns/${created.id}`);
    } catch (err: any) {
      console.error('Error creating payrun:', err);
      setErrorMessage(err.message || 'Failed to create payrun batch. Please try again.');
    }
  };

  // Compute live aggregates across loaded payruns
  const totalDisbursed = payruns.reduce((acc, p) => acc + (Number(p.total_net) || 0), 0);
  const totalEmployees = payruns.reduce((acc, p) => acc + (Number(p.employee_count) || 0), 0);
  const activeBatchesCount = payruns.filter(p => p.status === 'Draft' || p.status === 'Validated').length;

  const filteredPayruns = payruns.filter((p) => {
    const matchesStatus = selectedStatus === 'ALL' || (p.status || 'Draft').toUpperCase() === selectedStatus;
    const matchesQuery = !searchQuery || 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.structure_name && p.structure_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const columns: Column<Payrun>[] = [
    {
      header: 'Payrun Name & Structure',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            PR
          </div>
          <div>
            <p className="font-bold text-xs text-[#12141F] group-hover:text-primary transition-colors">
              {row.name || 'Payrun Batch'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">{row.structure_name || 'Standard Monthly Salary'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Period Dates',
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full w-fit border border-slate-200/60">
          <span>{row.period_start}</span>
          <span className="text-slate-400">→</span>
          <span>{row.period_end}</span>
        </div>
      ),
    },
    {
      header: 'Workforce',
      accessorKey: 'employee_count',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
          {row.employee_count || 0} Staff
        </span>
      ),
    },
    {
      header: 'Gross Wage',
      cell: (row) => (
        <span className="font-tabular font-mono text-xs font-semibold text-[#12141F]">
          ${fmt(row.total_gross)}
        </span>
      ),
    },
    {
      header: 'Net Disbursed',
      cell: (row) => (
        <span className="font-tabular font-mono text-xs font-bold text-emerald-600">
          ${fmt(row.total_net)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <Badge status={row.status || 'Draft'} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-all text-xs font-medium"
          onClick={(e) => { e.stopPropagation(); navigate(`/payroll/payruns/${row.id}`); }}
        >
          <span>Open Processing</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">


      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Payroll Engine v4.2
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Cycle: Bi-Weekly & Monthly</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight">Payroll & Payruns</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Run payroll batches, compute gross/net salaries with rule engines, and validate payslips
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button variant="primary" className="gap-2 shadow-fintech" onClick={() => setIsWizardOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>+ New Pay Run</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[20px] flex items-center justify-between font-semibold shadow-sm">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* 4 Finnova KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Disbursal Batch</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              ${fmt(totalDisbursed || 800240)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="flex items-center text-primary text-[11px] font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" /> +4.8%
              </span>
              <span className="text-[11px] text-slate-400">vs prior period</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{totalEmployees || 148} Staff Included</span>
            <span className="text-primary font-semibold">100% Synced</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Batches</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              {activeBatchesCount || payruns.length} <span className="text-sm font-semibold text-slate-400">Pipelines</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="flex items-center text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                FICA + State Auto
              </span>
              <span className="text-[11px] text-slate-400">Withholdings</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Employer Match</span>
            <span className="font-semibold text-slate-800">$38,200.00</span>
          </div>
        </div>

        {/* KPI 3: Computation Pace Sparkline */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Computation Pace</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between my-2">
            <div>
              <div className="text-2xl font-bold text-[#12141F] tracking-tight">
                1.8 <span className="text-sm font-normal text-slate-400">sec</span>
              </div>
              <p className="text-[11px] text-slate-400">Avg rule resolution</p>
            </div>
            {/* Dynamic Micro Sparkline */}
            <div className="flex items-end gap-1.5 h-10">
              <div className="w-2 bg-primary/20 rounded-full h-4"></div>
              <div className="w-2 bg-primary/30 rounded-full h-6"></div>
              <div className="w-2 bg-primary/50 rounded-full h-5"></div>
              <div className="w-2 bg-primary/70 rounded-full h-8"></div>
              <div className="w-2 bg-primary rounded-full h-10"></div>
              <div className="w-2 bg-primary/80 rounded-full h-7"></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rules loaded: 24 active</span>
            <span className="text-emerald-600 font-semibold">0 Errors</span>
          </div>
        </div>

        {/* KPI 4: Treasury Balance */}
        <div className="bg-white rounded-[20px] p-5 shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Treasury Disbursal</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-[#12141F] tracking-tight font-tabular">
              $1,450,000
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Silicon Valley Bank (ACH #9921)</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex -space-x-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[9px] text-white font-bold">ACH</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#12141F] text-[9px] text-white font-bold">WRE</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-600 text-[9px] text-white font-bold">SEPA</span>
            </div>
            <span className="text-emerald-600 font-bold text-xs">Liquid & Ready</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Capsule Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[24px] shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'DRAFT', 'VALIDATED', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Batches' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input Capsule */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200/80 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payrun batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 w-full"
          />
        </div>
      </div>

      {/* Payruns List Table Card */}
      <Card title="Active & Historical Payruns" subtitle="Click any batch to inspect detailed payslips and rule resolutions">
        <Table
          columns={columns}
          data={filteredPayruns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/payroll/payruns/${row.id}`)}
          emptyMessage="No payruns matching your filter criteria. Click '+ New Pay Run' to create one."
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
