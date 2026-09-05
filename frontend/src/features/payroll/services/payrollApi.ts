export interface SalaryRule {
  id: string;
  structure_id?: string;
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
  id: string;
  name: string;
  code?: string;
  description?: string;
  rules?: SalaryRule[];
}

export interface PayrunWarning {
  employee_id: string;
  employee_name: string;
  type: string;
  message: string;
}

export interface Payrun {
  id: string;
  name: string;
  structure_id: string;
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
  rule_id: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
}

export interface PayslipDetail {
  id: string;
  payrun_id: string;
  payrun_name: string;
  period_start: string;
  period_end: string;
  employee_id: string;
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

// Fallback Mock Data for standalone offline testing
const MOCK_STRUCTURES: SalaryStructure[] = [
  {
    id: 'struct_1',
    name: 'Standard Monthly Salary',
    code: 'STD_MONTHLY',
    description: 'Default structure for full-time regular employees',
    rules: [
      { id: 'rule_101', code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, computation_method: 'Fixed', amount: 4500 },
      { id: 'rule_102', code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, computation_method: 'Percentage', amount: 40 },
      { id: 'rule_103', code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, computation_method: 'Fixed', amount: 300 },
      { id: 'rule_104', code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 50, computation_method: 'Percentage', amount: 12 },
      { id: 'rule_105', code: 'TAX', name: 'Income Tax', category: 'DEDUCTION', sequence: 60, computation_method: 'Percentage', amount: 10 },
    ],
  },
  {
    id: 'struct_2',
    name: 'Executive & Management Structure',
    code: 'EXEC_MGMT',
    description: 'Structure with high performance and supervisor allowances',
    rules: [
      { id: 'rule_201', code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, computation_method: 'Fixed', amount: 8500 },
      { id: 'rule_202', code: 'HRA', name: 'Executive HRA', category: 'ALLOWANCE', sequence: 20, computation_method: 'Percentage', amount: 40 },
      { id: 'rule_203', code: 'SUP_ALW', name: 'Executive Supervisor Allowance', category: 'ALLOWANCE', sequence: 30, computation_method: 'Fixed', amount: 800 },
      { id: 'rule_204', code: 'TA', name: 'Executive Transport Allowance', category: 'ALLOWANCE', sequence: 40, computation_method: 'Fixed', amount: 500 },
      { id: 'rule_205', code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 50, computation_method: 'Percentage', amount: 12 },
      { id: 'rule_206', code: 'TAX', name: 'Executive Income Tax', category: 'DEDUCTION', sequence: 60, computation_method: 'Percentage', amount: 15 },
    ],
  },
];

const MOCK_PAYRUNS: Payrun[] = [
  {
    id: 'pr_2026_09',
    name: 'September 2026 Regular Payrun',
    structure_id: 'struct_1',
    structure_name: 'Standard Monthly Salary',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'Draft',
    employee_count: 3,
    total_gross: 23900,
    total_net: 18642,
    warnings: [],
  },
  {
    id: 'pr_2026_08',
    name: 'August 2026 Monthly Payrun',
    structure_id: 'struct_1',
    structure_name: 'Standard Monthly Salary',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'Paid',
    employee_count: 3,
    total_gross: 23900,
    total_net: 18642,
    warnings: [],
  },
];

export class PayrollApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
    const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
    try {
      const res = await fetch(`/api/v1/payroll${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  static async createSalaryStructure(struct: { name: string; code?: string; description?: string }): Promise<SalaryStructure> {
    return this.request('/structures', { method: 'POST', body: JSON.stringify(struct) });
  }

  static async createSalaryRule(rule: Partial<SalaryRule> & { structure_id: string }): Promise<SalaryRule> {
    return this.request('/rules', { method: 'POST', body: JSON.stringify(rule) });
  }

  static async getPayruns(): Promise<Payrun[]> {
    return this.request('/payruns', {}, MOCK_PAYRUNS);
  }

  static async getPayrunById(id: string): Promise<Payrun> {
    return this.request(`/payruns/${id}`, {}, MOCK_PAYRUNS.find((p) => String(p.id) === String(id)) || MOCK_PAYRUNS[0]);
  }

  static async getPayslipsByPayrun(payrunId: string): Promise<PayslipDetail[]> {
    return this.request(`/payruns/${payrunId}/payslips`, {}, []);
  }

  static async getPayslipById(id: string): Promise<PayslipDetail> {
    return this.request(`/payslips/${id}`);
  }

  static async getMyPayslips(): Promise<PayslipDetail[]> {
    return this.request('/payslips/my', {}, []);
  }

  static async createPayrun(payrun: { name: string; structure_id: string; period_start: string; period_end: string; selected_employee_ids?: string[] }): Promise<Payrun> {
    return this.request('/payruns', { method: 'POST', body: JSON.stringify(payrun) });
  }

  static async validatePayrun(id: string): Promise<Payrun> {
    return this.request(`/payruns/${id}/validate`, { method: 'POST' });
  }

  static async markPaidPayrun(id: string): Promise<Payrun> {
    return this.request(`/payruns/${id}/mark-paid`, { method: 'POST' });
  }

  static async sendPayslips(id: string): Promise<{ total: number; sent: number; failed: number }> {
    return this.request(`/payruns/${id}/send-payslips`, { method: 'POST' });
  }
}
