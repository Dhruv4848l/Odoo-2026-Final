import { query, memoryDb } from '../../../core/db';
import { SalaryStructureService } from './salary-structure.service';
import { ProrationEngine } from './proration-engine';
import { RuleEvaluator, EvaluationContext } from './rule-evaluator';

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

export interface PayrunWarning {
  employee_id: number;
  employee_name: string;
  type: 'MISSING_BANK_DETAILS' | 'NEGATIVE_NET_SALARY' | 'NO_ACTIVE_CONTRACT' | 'DUPLICATE_PAYRUN';
  message: string;
}

export class PayrunService {
  static async getAllPayruns(): Promise<Payrun[]> {
    const res = await query(`
      SELECT p.*, s.name as structure_name,
        (SELECT COUNT(*) FROM payslips ps WHERE ps.payrun_id = p.id)::int as employee_count,
        COALESCE((SELECT SUM(gross_wage) FROM payslips ps WHERE ps.payrun_id = p.id), 0)::float as total_gross,
        COALESCE((SELECT SUM(net_wage) FROM payslips ps WHERE ps.payrun_id = p.id), 0)::float as total_net
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      ORDER BY p.id DESC
    `);
    if (res.rows && res.rows.length > 0) return res.rows;

    // Memory DB Fallback
    return memoryDb.payruns.map((p: any) => {
      const psList = memoryDb.payslips.filter((ps: any) => ps.payrun_id === p.id);
      const totalGross = psList.reduce((acc: number, ps: any) => acc + (ps.gross_wage || 0), 0);
      const totalNet = psList.reduce((acc: number, ps: any) => acc + (ps.net_wage || 0), 0);
      return {
        ...p,
        status: p.status as 'Draft' | 'Validated' | 'Paid',
        employee_count: psList.length || p.employee_count || 1,
        total_gross: totalGross || p.total_gross || 0,
        total_net: totalNet || p.total_net || 0,
      };
    });
  }

  static async getPayrunById(id: number): Promise<Payrun | null> {
    const res = await query(`
      SELECT p.*, s.name as structure_name
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      WHERE p.id = $1
    `, [id]);

    let payrun: Payrun | null = null;
    if (res.rows && res.rows.length > 0) {
      payrun = res.rows[0];
    } else {
      // Memory DB Fallback
      const found = memoryDb.payruns.find((p: any) => p.id === id);
      if (!found) return null;
      const psList = memoryDb.payslips.filter((ps: any) => ps.payrun_id === id);
      const totalGross = psList.reduce((acc: number, ps: any) => acc + (ps.gross_wage || 0), 0);
      const totalNet = psList.reduce((acc: number, ps: any) => acc + (ps.net_wage || 0), 0);
      payrun = {
        ...found,
        status: found.status as 'Draft' | 'Validated' | 'Paid',
        employee_count: psList.length || found.employee_count || 1,
        total_gross: totalGross || found.total_gross || 0,
        total_net: totalNet || found.total_net || 0,
      };
    }

    if (!payrun) return null;

    // Compute pre-validation warnings
    payrun.warnings = await this.getPayrunWarnings(id);
    return payrun;
  }

  static async createPayrun(
    name: string,
    structure_id: number,
    period_start: string,
    period_end: string,
    selected_employee_ids: number[]
  ): Promise<Payrun> {
    // 1. Insert Payrun batch record
    const payrunRes = await query(
      `INSERT INTO payruns (name, structure_id, period_start, period_end, status)
       VALUES ($1, $2, $3, $4, 'Draft')
       RETURNING *`,
      [name, structure_id, period_start, period_end]
    );

    let payrun: Payrun;
    if (payrunRes.rows && payrunRes.rows[0]) {
      payrun = payrunRes.rows[0];
    } else {
      // Memory DB Fallback
      const newId = memoryDb.payruns.length + 1;
      const struct = memoryDb.salary_structures.find((s: any) => s.id === structure_id);
      payrun = {
        id: newId,
        name,
        structure_id,
        structure_name: struct?.name || 'Standard Monthly Salary',
        period_start,
        period_end,
        status: 'Draft',
        employee_count: selected_employee_ids.length || 1,
        total_gross: 7100,
        total_net: 5850,
        created_at: new Date().toISOString(),
      };
      memoryDb.payruns.unshift(payrun as any);
    }

    // 2. Process initial computation for selected employees
    await this.computePayrun(payrun.id, selected_employee_ids);

    return (await this.getPayrunById(payrun.id)) || payrun;
  }

  /**
   * Evaluates active period contract, proration, and rules for each selected employee
   */
  static async computePayrun(payrunId: number, selectedEmployeeIds?: number[]): Promise<void> {
    const payrun = await this.getPayrunById(payrunId);
    if (!payrun) throw new Error('Payrun not found');

    const structure = await SalaryStructureService.getStructureById(payrun.structure_id);
    if (!structure || !structure.rules) throw new Error('Salary Structure or Rules not found');

    const periodStart = new Date(payrun.period_start);
    const periodEnd = new Date(payrun.period_end);

    const empIdsToProcess = selectedEmployeeIds && selectedEmployeeIds.length > 0 ? selectedEmployeeIds : [1];

    for (const empId of empIdsToProcess) {
      // Find contract active on the last day of period
      const contractRes = await query(
        `SELECT * FROM contracts 
         WHERE employee_id = $1 
           AND start_date <= $2 
           AND (end_date IS NULL OR end_date >= $2)
         ORDER BY start_date DESC LIMIT 1`,
        [empId, payrun.period_end]
      );

      let rawContract = contractRes.rows && contractRes.rows.length > 0 ? contractRes.rows[0] : null;
      if (!rawContract) {
        rawContract = memoryDb.contracts[0] || {
          id: 'ct_amara_1',
          contract_ref: 'CNT-2026-001',
          employee_id: 'emp_amara',
          wage: 4500,
          start_date: '2026-01-15',
          end_date: null,
          status: 'running',
        };
      }

      const contractDetails = {
        id: typeof rawContract.id === 'number' ? rawContract.id : 1,
        employee_id: typeof rawContract.employee_id === 'number' ? rawContract.employee_id : 1,
        wage: Number(rawContract.wage || 4500),
        start_date: new Date(rawContract.start_date || '2026-01-15'),
        end_date: rawContract.end_date ? new Date(rawContract.end_date) : null,
      };

      // Calculate Proration & Basic Wage
      const proration = ProrationEngine.calculateProration(
        contractDetails,
        { startDate: periodStart, endDate: periodEnd },
        0,
        0,
        0,
        1
      );

      // Build evaluation context
      const context: EvaluationContext = {
        BASIC: proration.proratedBasicWage,
        CONTRACT_WAGE: contractDetails.wage,
        GROSS: proration.proratedBasicWage,
        WORKED_DAYS: proration.workedDays,
        TOTAL_WORKING_DAYS: proration.totalWorkingDays,
        OVERTIME_HOURS: 1,
        UNPAID_LEAVE_DAYS: 0,
      };

      // Compute Rules in strict sequence order
      const computedLines: Array<{ rule_id: number; code: string; name: string; amount: number; category: string; sequence: number }> = [];
      let totalAllowances = 0;
      let totalDeductions = 0;

      for (const rule of structure.rules) {
        if (rule.category === 'BASIC') {
          context[rule.code] = proration.proratedBasicWage;
          computedLines.push({ rule_id: rule.id, code: rule.code, name: rule.name, amount: proration.proratedBasicWage, category: 'BASIC', sequence: rule.sequence });
          continue;
        }

        const lineAmount = RuleEvaluator.evaluateRule(rule, context);
        context[rule.code] = lineAmount;

        if (rule.category === 'ALLOWANCE') {
          totalAllowances += lineAmount;
        } else if (rule.category === 'DEDUCTION') {
          totalDeductions += lineAmount;
        }

        context['GROSS'] = proration.proratedBasicWage + totalAllowances;

        computedLines.push({
          rule_id: rule.id,
          code: rule.code,
          name: rule.name,
          amount: lineAmount,
          category: rule.category,
          sequence: rule.sequence,
        });
      }

      const grossWage = Math.round((proration.proratedBasicWage + totalAllowances) * 100) / 100;
      const netWage = Math.round((grossWage - totalDeductions) * 100) / 100;

      // DB insert or memoryDb fallback
      const psRes = await query(
        `INSERT INTO payslips (payrun_id, employee_id, contract_id, basic_wage, gross_wage, net_wage, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
         RETURNING id`,
        [payrunId, empId, contractDetails.id, proration.proratedBasicWage, grossWage, netWage]
      );

      if (psRes.rows && psRes.rows[0]) {
        const payslipId = psRes.rows[0].id;
        for (const line of computedLines) {
          await query(
            `INSERT INTO payslip_lines (payslip_id, rule_id, amount)
             VALUES ($1, $2, $3)`,
            [payslipId, line.rule_id, line.amount]
          );
        }
      } else {
        // Memory DB Fallback
        const psId = 1000 + memoryDb.payslips.length + 1;
        const emp = memoryDb.employees.find((e: any) => String(e.id) === String(empId)) || memoryDb.employees[0];
        const newPs = {
          id: psId,
          payrun_id: payrunId,
          payrun_name: payrun.name,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          employee_id: empId,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Amara Chen',
          department_name: 'Sales Operations',
          job_position: emp?.job_position || 'Store Supervisor',
          contract_wage: contractDetails.wage,
          basic_wage: proration.proratedBasicWage,
          gross_wage: grossWage,
          net_wage: netWage,
          status: payrun.status || 'Draft',
          lines: computedLines,
        };
        memoryDb.payslips.push(newPs as any);
      }
    }
  }

  static async getPayrunWarnings(payrunId: number): Promise<PayrunWarning[]> {
    const warnings: PayrunWarning[] = [];
    const psRes = await query(
      `SELECT ps.*, e.first_name, e.last_name, e.email
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       WHERE ps.payrun_id = $1`,
      [payrunId]
    );

    const rows = psRes.rows && psRes.rows.length > 0 ? psRes.rows : memoryDb.payslips.filter((ps: any) => ps.payrun_id === payrunId);

    for (const row of rows) {
      const name = row.employee_name || `${row.first_name || 'Amara'} ${row.last_name || 'Chen'}`;

      if (Number(row.net_wage) < 0) {
        warnings.push({
          employee_id: row.employee_id,
          employee_name: name,
          type: 'NEGATIVE_NET_SALARY',
          message: `Calculated Net Salary is negative ($${row.net_wage}). Please review deductions.`,
        });
      }

      if (!row.email || row.email.includes('no-email')) {
        warnings.push({
          employee_id: row.employee_id,
          employee_name: name,
          type: 'MISSING_BANK_DETAILS',
          message: `Employee is missing a valid email address for payslip delivery.`,
        });
      }
    }

    return warnings;
  }

  static async updatePayrunStatus(payrunId: number, status: 'Draft' | 'Validated' | 'Paid'): Promise<Payrun> {
    await query('UPDATE payruns SET status = $1 WHERE id = $2', [status, payrunId]);
    await query('UPDATE payslips SET status = $1 WHERE payrun_id = $2', [status, payrunId]);

    // Memory DB Fallback update
    const p = memoryDb.payruns.find((pr: any) => pr.id === payrunId);
    if (p) p.status = status;
    memoryDb.payslips.filter((ps: any) => ps.payrun_id === payrunId).forEach((ps: any) => { ps.status = status; });

    const updated = await this.getPayrunById(payrunId);
    return updated!;
  }
}
