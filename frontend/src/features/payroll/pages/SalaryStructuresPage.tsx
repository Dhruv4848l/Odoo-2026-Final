import React, { useEffect, useState } from 'react';
import { Plus, Sliders, Code, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { PayrollApiClient, SalaryStructure, SalaryRule } from '../services/payrollApi';

import { useAuth } from '../../../context/AuthContext';
import { getNormalizedRole } from '../../../layouts/SubNav';

export const SalaryStructuresPage: React.FC = () => {
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);
  const canManageRules = ['admin', 'hr_payroll_manager'].includes(normalizedRole);

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<number>(1);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState<boolean>(false);

  // New Rule Form State
  const [newRule, setNewRule] = useState<{
    code: string;
    name: string;
    category: 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'GROSS' | 'NET';
    sequence: number;
    computation_method: 'Fixed' | 'Percentage' | 'Formula';
    amount: string;
    formula: string;
    cap_amount: string;
    condition_expression: string;
  }>({
    code: '',
    name: '',
    category: 'ALLOWANCE',
    sequence: 50,
    computation_method: 'Percentage',
    amount: '10',
    formula: '',
    cap_amount: '',
    condition_expression: '',
  });

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    try {
      const data = await PayrollApiClient.getStructures();
      setStructures(data);
      if (data.length > 0) setSelectedStructureId(data[0].id);
    } catch (err) {
      console.error('Error loading structures:', err);
    }
  };

  const currentStructure = structures.find((s) => s.id === selectedStructureId) || structures[0];

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStructure) return;

    try {
      const created = await PayrollApiClient.createSalaryRule({
        structure_id: currentStructure.id,
        code: newRule.code.toUpperCase(),
        name: newRule.name,
        category: newRule.category,
        sequence: Number(newRule.sequence),
        computation_method: newRule.computation_method,
        amount: newRule.amount ? Number(newRule.amount) : null,
        formula: newRule.formula || null,
        cap_amount: newRule.cap_amount ? Number(newRule.cap_amount) : null,
        condition_expression: newRule.condition_expression || null,
      });

      const updated = structures.map((s) => {
        if (s.id === currentStructure.id) {
          const rules = [...(s.rules || []), created].sort((a, b) => a.sequence - b.sequence);
          return { ...s, rules };
        }
        return s;
      });

      setStructures(updated);
      setIsAddRuleModalOpen(false);
      setNewRule({
        code: '',
        name: '',
        category: 'ALLOWANCE',
        sequence: 50,
        computation_method: 'Percentage',
        amount: '10',
        formula: '',
        cap_amount: '',
        condition_expression: '',
      });
    } catch (err) {
      console.error('Error creating salary rule:', err);
    }
  };

  const columns: Column<SalaryRule>[] = [
    {
      header: 'Seq',
      accessorKey: 'sequence',
      cell: (row) => <span className="font-mono text-xs text-slate-500 font-bold">#{row.sequence}</span>,
    },
    {
      header: 'Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono bg-slate-100 text-[#14141F] px-2 py-0.5 rounded text-xs font-semibold border border-slate-200">
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
        if (row.category === 'ALLOWANCE') variant = 'info';
        if (row.category === 'DEDUCTION') variant = 'danger';
        return <Badge variant={variant} showDot={false}>{row.category}</Badge>;
      },
    },
    {
      header: 'Method',
      accessorKey: 'computation_method',
      cell: (row) => <span className="text-xs font-medium text-slate-600">{row.computation_method}</span>,
    },
    {
      header: 'Calculation Details',
      cell: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {row.computation_method === 'Fixed' && <span className="font-mono text-slate-700">${row.amount}</span>}
          {row.computation_method === 'Percentage' && <span className="font-mono text-slate-700">{row.amount}% of Basic</span>}
          {row.computation_method === 'Formula' && <span className="font-mono text-xs bg-slate-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{row.formula}</span>}
          {row.cap_amount && <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded inline-block w-fit">Cap: ${row.cap_amount}</span>}
          {row.condition_expression && <span className="text-[10px] text-purple-700 font-mono italic">If: {row.condition_expression}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Salary Structure Setup</h1>
          <p className="text-xs text-[#6B7280]">Configure sequenced salary rules, percentages, formulas, and caps</p>
        </div>
        {canManageRules ? (
          <Button variant="primary" className="gap-2" onClick={() => setIsAddRuleModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Salary Rule</span>
          </Button>
        ) : (
          <Badge variant="neutral" showDot={false}>Read-Only Access (HR Payroll User)</Badge>
        )}
      </div>

      {/* Structure Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3">
        {structures.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStructureId(s.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              s.id === selectedStructureId
                ? 'bg-[#5B4FE9] text-white shadow-sm'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-slate-50'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      {currentStructure && (
        <Card title={`${currentStructure.name} — Sequenced Execution Rules`} subtitle="Rules run in strict sequence order from top to bottom">
          <Table
            columns={columns}
            data={currentStructure.rules || []}
            keyExtractor={(row) => row.id}
            emptyMessage="No rules configured for this structure."
          />
        </Card>
      )}

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddRuleModalOpen}
        onClose={() => setIsAddRuleModalOpen(false)}
        title="Add Salary Rule"
        subtitle={`Adding rule to ${currentStructure?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddRuleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateRule}>Save Rule</Button>
          </>
        }
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rule Code (Monospace)"
              placeholder="e.g. HRA, PF, OVERTIME"
              value={newRule.code}
              onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
              required
            />
            <Input
              label="Rule Name"
              placeholder="e.g. House Rent Allowance"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Category"
              value={newRule.category}
              onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
              options={[
                { value: 'BASIC', label: 'BASIC (Base Wage)' },
                { value: 'ALLOWANCE', label: 'ALLOWANCE (+)' },
                { value: 'DEDUCTION', label: 'DEDUCTION (-)' },
              ]}
            />
            <Input
              label="Execution Sequence"
              type="number"
              value={newRule.sequence}
              onChange={(e) => setNewRule({ ...newRule, sequence: Number(e.target.value) })}
              required
            />
            <Select
              label="Computation Method"
              value={newRule.computation_method}
              onChange={(e) => setNewRule({ ...newRule, computation_method: e.target.value as any })}
              options={[
                { value: 'Fixed', label: 'Fixed Amount ($)' },
                { value: 'Percentage', label: 'Percentage (%)' },
                { value: 'Formula', label: 'Formula Expression' },
              ]}
            />
          </div>

          {newRule.computation_method !== 'Formula' ? (
            <Input
              label={newRule.computation_method === 'Fixed' ? 'Fixed Amount ($)' : 'Percentage (%)'}
              type="number"
              value={newRule.amount}
              onChange={(e) => setNewRule({ ...newRule, amount: e.target.value })}
            />
          ) : (
            <Input
              label="Formula Expression"
              placeholder="e.g. min(BASIC * 0.12, 1800)"
              value={newRule.formula}
              onChange={(e) => setNewRule({ ...newRule, formula: e.target.value })}
              helperText="Available variables: BASIC, GROSS, WORKED_DAYS, OVERTIME_HOURS, min(), max()"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cap Amount ($ Optional Ceiling)"
              placeholder="e.g. 1800"
              value={newRule.cap_amount}
              onChange={(e) => setNewRule({ ...newRule, cap_amount: e.target.value })}
              helperText="Enforces maximum ceiling on rule result"
            />
            <Input
              label="Condition Expression (Optional)"
              placeholder="e.g. OVERTIME_HOURS > 0"
              value={newRule.condition_expression}
              onChange={(e) => setNewRule({ ...newRule, condition_expression: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
