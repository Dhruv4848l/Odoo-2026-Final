import { query } from '../../../core/db.js';
import { SalaryStructureService } from './salary-structure.service.js';
import { ProrationEngine } from './proration-engine.js';
import { RuleEvaluator, EvaluationContext } from './rule-evaluator.js';

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
    return res.rows || [];
  }

  static async getPayrunById(id: number): Promise<Payrun | null> {
    const res = await query(`
      SELECT p.*, s.name as structure_name
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (!res.rows || res.rows.length === 0) return null;
    
    const payrun = res.rows[0];
    
    const statsRes = await query(`
        SELECT COUNT(*)::int as employee_count,
               COALESCE(SUM(gross_wage), 0)::float as total_gross,
               COALESCE(SUM(net_wage), 0)::float as total_net
        FROM payslips
        WHERE payrun_id = $1
    `, [id]);
    
    if (statsRes.rows && statsRes.rows[0]) {
        payrun.employee_count = statsRes.rows[0].employee_count;
        payrun.total_gross = statsRes.rows[0].total_gross;
        payrun.total_net = statsRes.rows[0].total_net;
    }

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

    if (!payrunRes.rows || payrunRes.rows.length === 0) {
        throw new Error('Failed to create payrun');
    }
    
    const payrun = payrunRes.rows[0];

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

    const empIdsToProcess = selectedEmployeeIds && selectedEmployeeIds.length > 0 ? selectedEmployeeIds : [];

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

      const rawContract = contractRes.rows && contractRes.rows.length > 0 ? contractRes.rows[0] : null;
      if (!rawContract) {
          // If no contract found, we skip
          continue;
      }

      const contractDetails = {
        id: typeof rawContract.id === 'number' ? rawContract.id : 1,
        employee_id: typeof rawContract.employee_id === 'number' ? rawContract.employee_id : 1,
        wage: Number(rawContract.wage || 0),
        start_date: new Date(rawContract.start_date),
        end_date: rawContract.end_date ? new Date(rawContract.end_date) : null,
      };

      // Calculate Proration & Basic Wage
      const proration = ProrationEngine.calculateProration(
        contractDetails,
        { startDate: periodStart, endDate: periodEnd },
        0,
        0,
        0,
        0
      );

      // Build evaluation context
      const context: EvaluationContext = {
        BASIC: proration.proratedBasicWage,
        CONTRACT_WAGE: contractDetails.wage,
        GROSS: proration.proratedBasicWage,
        WORKED_DAYS: proration.workedDays,
        TOTAL_WORKING_DAYS: proration.totalWorkingDays,
        OVERTIME_HOURS: 0,
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

      // DB insert
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

    const rows = psRes.rows || [];

    for (const row of rows) {
      const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();

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

    const updated = await this.getPayrunById(payrunId);
    return updated!;
  }
}
