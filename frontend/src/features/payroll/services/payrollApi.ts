export interface SalaryRule {
  id: number;
  structure_id?: number;
  code: string;
  name: string;
  category: 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'GROSS' | 'NET';
  sequence: number;
  computation_method: 'Fixed' | 'Percentage' | 'Formula';
  amount?: number | null;
  formula?: string | null;
  cap_amount?: number | null;
  condition_expression?: string | null;
}

export interface SalaryStructure {
  id: number;
  name: string;
  rules?: SalaryRule[];
}

export interface PayrunWarning {
  employee_id: number;
  employee_name: string;
  type: string;
  message: string;
}

export interface Payrun {
  id: number;
  name: string;
  structure_id: number;
  structure_name?: string;
  period_start: string;
  period_end: string;
  status: 'Draft' | 'Validated' | 'Paid';
  created_at?: string;
  employee_count?: number;
  total_gross?: number;
  total_net?: number;
  warnings?: PayrunWarning[];
}

export interface PayslipLine {
  rule_id: number;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
}

export interface PayslipDetail {
  id: number;
  payrun_id: number;
  payrun_name: string;
  period_start: string;
  period_end: string;
  employee_id: number;
  employee_name: string;
  department_name: string;
  job_position: string;
  contract_wage: number;
  basic_wage: number;
  gross_wage: number;
  net_wage: number;
  status: string;
  lines: PayslipLine[];
}

// Fallback Mock Data for standalone frontend testing
const MOCK_STRUCTURES: SalaryStructure[] = [
  {
    id: 1,
    name: 'Standard Monthly Salary',
    rules: [
      { id: 101, code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, computation_method: 'Fixed', amount: 4500 },
      { id: 102, code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, computation_method: 'Percentage', amount: 40 },
      { id: 103, code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, computation_method: 'Fixed', amount: 300 },
      { id: 104, code: 'SUP_ALW', name: 'Supervisor Allowance', category: 'ALLOWANCE', sequence: 40, computation_method: 'Fixed', amount: 500, condition_expression: "job_position == 'Store Supervisor'" },
      { id: 105, code: 'PF', name: 'Provident Fund (Capped)', category: 'DEDUCTION', sequence: 50, computation_method: 'Percentage', amount: 12, cap_amount: 1800 },
      { id: 106, code: 'TAX', name: 'Income Tax', category: 'DEDUCTION', sequence: 60, computation_method: 'Percentage', amount: 10 },
    ],
  },
  {
    id: 2,
    name: 'Executive Leadership Structure',
    rules: [
      { id: 201, code: 'BASIC', name: 'Executive Base', category: 'BASIC', sequence: 10, computation_method: 'Fixed', amount: 9000 },
      { id: 202, code: 'EXEC_ALW', name: 'Executive Allowance', category: 'ALLOWANCE', sequence: 20, computation_method: 'Percentage', amount: 25 },
      { id: 203, code: 'TAX', name: 'Income Tax', category: 'DEDUCTION', sequence: 30, computation_method: 'Percentage', amount: 20 },
    ],
  },
];

const MOCK_PAYRUNS: Payrun[] = [
  {
    id: 1,
    name: 'September 2026 Regular Payrun',
    structure_id: 1,
    structure_name: 'Standard Monthly Salary',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'Draft',
    employee_count: 4,
    total_gross: 24800,
    total_net: 20450,
    warnings: [
      {
        employee_id: 3,
        employee_name: 'David Vance',
        type: 'MISSING_BANK_DETAILS',
        message: 'Employee is missing valid email/bank account details for automated payout.',
      },
    ],
  },
  {
    id: 2,
    name: 'August 2026 Regular Payrun',
    structure_id: 1,
    structure_name: 'Standard Monthly Salary',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'Paid',
    employee_count: 4,
    total_gross: 24800,
    total_net: 20450,
    warnings: [],
  },
];

const MOCK_PAYSLIPS: PayslipDetail[] = [
  {
    id: 1,
    payrun_id: 1,
    payrun_name: 'September 2026 Regular Payrun',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    employee_id: 1,
    employee_name: 'Amara Chen',
    department_name: 'Sales & Retail',
    job_position: 'Store Supervisor',
    contract_wage: 5200,
    basic_wage: 5200,
    gross_wage: 7780,
    net_wage: 6424,
    status: 'Draft',
    lines: [
      { rule_id: 101, code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, amount: 5200 },
      { rule_id: 102, code: 'HRA', name: 'House Rent Allowance (40%)', category: 'ALLOWANCE', sequence: 20, amount: 2080 },
      { rule_id: 103, code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, amount: 300 },
      { rule_id: 104, code: 'SUP_ALW', name: 'Supervisor Allowance', category: 'ALLOWANCE', sequence: 40, amount: 200 },
      { rule_id: 105, code: 'PF', name: 'Provident Fund (Capped $1800)', category: 'DEDUCTION', sequence: 50, amount: 624 },
      { rule_id: 106, code: 'TAX', name: 'Income Tax (10%)', category: 'DEDUCTION', sequence: 60, amount: 732 },
    ],
  },
  {
    id: 2,
    payrun_id: 1,
    payrun_name: 'September 2026 Regular Payrun',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    employee_id: 2,
    employee_name: 'Bhavna Patel',
    department_name: 'Human Resources',
    job_position: 'HR Specialist',
    contract_wage: 4200,
    basic_wage: 4200,
    gross_wage: 6180,
    net_wage: 5122,
    status: 'Draft',
    lines: [
      { rule_id: 101, code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, amount: 4200 },
      { rule_id: 102, code: 'HRA', name: 'House Rent Allowance (40%)', category: 'ALLOWANCE', sequence: 20, amount: 1680 },
      { rule_id: 103, code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, amount: 300 },
      { rule_id: 105, code: 'PF', name: 'Provident Fund (Capped $1800)', category: 'DEDUCTION', sequence: 50, amount: 504 },
      { rule_id: 106, code: 'TAX', name: 'Income Tax (10%)', category: 'DEDUCTION', sequence: 60, amount: 554 },
    ],
  },
];

export class PayrollApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
    try {
      const res = await fetch(`/api/v1/payroll${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token',
        },
        ...options,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn(`[PayrollApiClient] Backend request failed for /api/v1/payroll${endpoint}. Using fallback data.`, err);
      if (fallbackData !== undefined) return fallbackData;
      throw err;
    }
  }

  static async getStructures(): Promise<SalaryStructure[]> {
    return this.request('/structures', {}, MOCK_STRUCTURES);
  }

  static async getPayruns(): Promise<Payrun[]> {
    return this.request('/payruns', {}, MOCK_PAYRUNS);
  }

  static async getPayrunById(id: number): Promise<Payrun> {
    return this.request(`/payruns/${id}`, {}, MOCK_PAYRUNS.find((p) => p.id === id) || MOCK_PAYRUNS[0]);
  }

  static async getPayslipsByPayrun(payrunId: number): Promise<PayslipDetail[]> {
    return this.request(`/payruns/${payrunId}/payslips`, {}, MOCK_PAYSLIPS.filter((p) => p.payrun_id === payrunId));
  }

  static async getPayslipById(id: number): Promise<PayslipDetail> {
    return this.request(`/payslips/${id}`, {}, MOCK_PAYSLIPS.find((p) => p.id === id) || MOCK_PAYSLIPS[0]);
  }

  static async createPayrun(payrun: { name: string; structure_id: number; period_start: string; period_end: string; selected_employee_ids: number[] }): Promise<Payrun> {
    const newId = Date.now();
    const structureName = MOCK_STRUCTURES.find(s => s.id === payrun.structure_id)?.name || 'Standard Monthly Salary';
    
    const newPayrun: Payrun = {
      id: newId,
      name: payrun.name,
      structure_id: payrun.structure_id,
      structure_name: structureName,
      period_start: payrun.period_start,
      period_end: payrun.period_end,
      status: 'Draft',
      employee_count: payrun.selected_employee_ids.length,
      total_gross: payrun.selected_employee_ids.length * 6200,
      total_net: payrun.selected_employee_ids.length * 5100,
      warnings: payrun.selected_employee_ids.includes(3) ? [
        {
          employee_id: 3,
          employee_name: 'David Vance',
          type: 'MISSING_BANK_DETAILS',
          message: 'Employee is missing valid email/bank account details for automated payout.',
        }
      ] : [],
    };

    // Add to in-memory fallback list
    MOCK_PAYRUNS.unshift(newPayrun);

    // Create mock payslips for selected employees
    const empNames: Record<number, { name: string; dept: string; pos: string; wage: number }> = {
      1: { name: 'Amara Chen', dept: 'Sales & Retail', pos: 'Store Supervisor', wage: 5200 },
      2: { name: 'Bhavna Patel', dept: 'Human Resources', pos: 'HR Specialist', wage: 4200 },
      3: { name: 'David Vance', dept: 'Engineering', pos: 'Software Engineer', wage: 6500 },
      4: { name: 'Elena Rostova', dept: 'Finance', pos: 'Accountant', wage: 4800 },
    };

    for (const empId of payrun.selected_employee_ids) {
      const emp = empNames[empId] || { name: `Employee #${empId}`, dept: 'General', pos: 'Staff', wage: 4500 };
      const gross = Math.round(emp.wage * 1.4);
      const net = Math.round(gross * 0.82);

      MOCK_PAYSLIPS.push({
        id: newId + empId,
        payrun_id: newId,
        payrun_name: payrun.name,
        period_start: payrun.period_start,
        period_end: payrun.period_end,
        employee_id: empId,
        employee_name: emp.name,
        department_name: emp.dept,
        job_position: emp.pos,
        contract_wage: emp.wage,
        basic_wage: emp.wage,
        gross_wage: gross,
        net_wage: net,
        status: 'Draft',
        lines: [
          { rule_id: 101, code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, amount: emp.wage },
          { rule_id: 102, code: 'HRA', name: 'House Rent Allowance (40%)', category: 'ALLOWANCE', sequence: 20, amount: Math.round(emp.wage * 0.4) },
          { rule_id: 103, code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, amount: 300 },
          { rule_id: 105, code: 'PF', name: 'Provident Fund (Capped $1800)', category: 'DEDUCTION', sequence: 50, amount: Math.min(Math.round(emp.wage * 0.12), 1800) },
          { rule_id: 106, code: 'TAX', name: 'Income Tax (10%)', category: 'DEDUCTION', sequence: 60, amount: Math.round(gross * 0.1) },
        ],
      });
    }

    return this.request('/payruns', { method: 'POST', body: JSON.stringify(payrun) }, newPayrun);
  }

  static async validatePayrun(id: number): Promise<Payrun> {
    const target = MOCK_PAYRUNS.find(p => p.id === id);
    if (target) target.status = 'Validated';
    return this.request(`/payruns/${id}/validate`, { method: 'POST' }, target || { ...MOCK_PAYRUNS[0], status: 'Validated' });
  }

  static async markPaidPayrun(id: number): Promise<Payrun> {
    const target = MOCK_PAYRUNS.find(p => p.id === id);
    if (target) target.status = 'Paid';
    return this.request(`/payruns/${id}/mark-paid`, { method: 'POST' }, target || { ...MOCK_PAYRUNS[0], status: 'Paid' });
  }

  static async sendPayslips(id: number): Promise<{ total: number; sent: number; failed: number }> {
    return this.request(`/payruns/${id}/send-payslips`, { method: 'POST' }, { total: 4, sent: 3, failed: 1 });
  }
}
