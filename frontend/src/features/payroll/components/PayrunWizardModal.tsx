import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { SalaryStructure } from '../services/payrollApi';

export interface PayrunWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  structures: SalaryStructure[];
  onSubmit: (data: {
    name: string;
    structure_id: string;
    period_start: string;
    period_end: string;
    selected_employee_ids?: string[];
  }) => void;
}

export const PayrunWizardModal: React.FC<PayrunWizardModalProps> = ({
  isOpen,
  onClose,
  structures,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState<string>('October 2026 Regular Payrun');
  const [structureId, setStructureId] = useState<string>(structures[0]?.id || 'struct_1');
  const [periodStart, setPeriodStart] = useState<string>('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2026-10-31');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (structures.length > 0 && (!structureId || structureId === 'struct_1')) {
      setStructureId(structures[0].id);
    }
  }, [structures]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const res = await fetch('/api/v1/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped = data.data.map((e: any) => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          department: e.department_name || 'General',
          position: e.job_position || 'Staff',
          contractWage: 4500,
        }));
        setEmployees(mapped);
        setSelectedIds(mapped.map((m: any) => m.id));
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic employees for Payrun wizard.', err);
    }
  };

  const toggleSelectEmployee = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e.id));
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleFinish = () => {
    onSubmit({
      name,
      structure_id: structureId,
      period_start: periodStart,
      period_end: periodEnd,
      selected_employee_ids: selectedIds,
    });
    onClose();
    setStep(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'New Payrun Wizard — Step 1: Scope & Period' : 'New Payrun Wizard — Step 2: Employee Selection'}
      subtitle={step === 1 ? 'Define payrun batch name, structure, and pay period dates' : 'Select eligible employees for this pay period'}
      footer={
        <>
          {step === 2 && (
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {step === 1 ? (
            <Button variant="primary" onClick={handleNext}>Continue to Employees →</Button>
          ) : (
            <Button variant="primary" onClick={handleFinish} disabled={selectedIds.length === 0}>
              Create & Compute Payrun ({selectedIds.length})
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <Input
            label="Payrun Batch Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. October 2026 Regular Payrun"
            required
          />
          <Select
            label="Salary Structure"
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            options={structures.map((s) => ({ value: s.id, label: s.name }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period Start Date"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />
            <Input
              label="Period End Date"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-[#E5E7EB]">
            <span className="text-xs font-semibold text-[#1A1A2E]">
              {selectedIds.length} of {employees.length} employees selected
            </span>
            <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
              {selectedIds.length === employees.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg max-h-60 overflow-y-auto bg-white">
            {employees.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => toggleSelectEmployee(emp.id)}
                    className="w-4 h-4 text-[#5B4FE9] rounded border-slate-300 focus:ring-[#5B4FE9]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1A1A2E]">{emp.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{emp.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="neutral" showDot={false}>{emp.department}</Badge>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
