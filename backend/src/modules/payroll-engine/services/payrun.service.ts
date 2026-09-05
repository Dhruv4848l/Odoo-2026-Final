import { query } from '../../../core/db';
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
    return res.rows;
  }

  static async getPayrunById(id: number): Promise<Payrun | null> {
    const res = await query(`
      SELECT p.*, s.name as structure_name
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const payrun = res.rows[0];

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
    const payrun = payrunRes.rows[0];

    // 2. Process initial computation for selected employees
    await this.computePayrun(payrun.id, selected_employee_ids);

    return payrun;
  }

  /**
   * Evaluates active period contract, proration, and rules for each selected employee
   */
  static async computePayrun(payrunId: number, selectedEmployeeIds?: number[]): Promise<void> {
    const payrunRes = await query('SELECT * FROM payruns WHERE id = $1', [payrunId]);
    if (payrunRes.rows.length === 0) throw new Error('Payrun not found');
    const payrun = payrunRes.rows[0];

    // Delete existing payslips if re-computing
    if (!selectedEmployeeIds) {
      const existingPs = await query('SELECT employee_id FROM payslips WHERE payrun_id = $1', [payrunId]);
      selectedEmployeeIds = existingPs.rows.map(r => r.employee_id);
    } else {
      await query('DELETE FROM payslips WHERE payrun_id = $1', [payrunId]);
    }

    const structure = await SalaryStructureService.getStructureById(payrun.structure_id);
    if (!structure || !structure.rules) throw new Error('Salary Structure or Rules not found');

    const periodStart = new Date(payrun.period_start);
    const periodEnd = new Date(payrun.period_end);

    for (const empId of selectedEmployeeIds) {
      // Find contract active on the last day of period (Dev C Edge Case 5 simplification)
      const contractRes = await query(
        `SELECT * FROM contracts 
         WHERE employee_id = $1 
           AND start_date <= $2 
           AND (end_date IS NULL OR end_date >= $2)
         ORDER BY start_date DESC LIMIT 1`,
        [empId, payrun.period_end]
      );

      if (contractRes.rows.length === 0) {
        console.warn(`No active contract found for employee ID ${empId} on ${payrun.period_end}`);
        continue;
      }
      const contract = contractRes.rows[0];

      // Reconcile Attendance & Time Off data for period
      const attendanceRes = await query(
        `SELECT COALESCE(SUM(worked_hours), 0) as total_worked_hours,
                COALESCE(SUM(overtime_hours), 0) as total_overtime
         FROM attendances
         WHERE employee_id = $1 AND check_in >= $2 AND check_in <= $3`,
        [empId, payrun.period_start, payrun.period_end]
      );
      const overtimeHours = Number(attendanceRes.rows[0]?.total_overtime || 0);

      const leaveRes = await query(
        `SELECT r.requested_amount, t.is_paid
         FROM time_off_requests r
         JOIN time_off_types t ON r.time_off_type_id = t.id
         WHERE r.employee_id = $1 AND r.status = 'Approved'
           AND r.start_date >= $2 AND r.end_date <= $3`,
        [empId, payrun.period_start, payrun.period_end]
      );

      let unpaidLeaveDays = 0;
      let paidLeaveDays = 0;
      for (const leave of leaveRes.rows) {
        if (leave.is_paid) {
          paidLeaveDays += Number(leave.requested_amount);
        } else {
          unpaidLeaveDays += Number(leave.requested_amount);
        }
      }

      // Calculate Proration & Basic Wage
      const proration = ProrationEngine.calculateProration(
        contract,
        { startDate: periodStart, endDate: periodEnd },
        0,
        unpaidLeaveDays,
        paidLeaveDays,
        overtimeHours
      );

      // Build evaluation context
      const context: EvaluationContext = {
        BASIC: proration.proratedBasicWage,
        CONTRACT_WAGE: Number(contract.wage),
        GROSS: proration.proratedBasicWage,
        WORKED_DAYS: proration.workedDays,
        TOTAL_WORKING_DAYS: proration.totalWorkingDays,
        OVERTIME_HOURS: overtimeHours,
        UNPAID_LEAVE_DAYS: unpaidLeaveDays,
      };

      // Compute Rules in strict sequence order
      const computedLines: Array<{ rule_id: number; code: string; amount: number; category: string }> = [];
      let totalAllowances = 0;
      let totalDeductions = 0;

      for (const rule of structure.rules) {
        if (rule.category === 'BASIC') {
          context[rule.code] = proration.proratedBasicWage;
          computedLines.push({ rule_id: rule.id, code: rule.code, amount: proration.proratedBasicWage, category: 'BASIC' });
          continue;
        }

        const lineAmount = RuleEvaluator.evaluateRule(rule, context);
        context[rule.code] = lineAmount;

        if (rule.category === 'ALLOWANCE') {
          totalAllowances += lineAmount;
        } else if (rule.category === 'DEDUCTION') {
          totalDeductions += lineAmount;
        }

        // Keep GROSS updated for downstream tax/deduction calculations
        context['GROSS'] = proration.proratedBasicWage + totalAllowances;

        computedLines.push({
          rule_id: rule.id,
          code: rule.code,
          amount: lineAmount,
          category: rule.category
        });
      }

      const grossWage = Math.round((proration.proratedBasicWage + totalAllowances) * 100) / 100;
      const netWage = Math.round((grossWage - totalDeductions) * 100) / 100;

      // Insert Payslip record
      const psRes = await query(
        `INSERT INTO payslips (payrun_id, employee_id, contract_id, basic_wage, gross_wage, net_wage, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
         RETURNING id`,
        [payrunId, empId, contract.id, proration.proratedBasicWage, grossWage, netWage]
      );
      const payslipId = psRes.rows[0].id;

      // Insert Payslip Line items
      for (const line of computedLines) {
        await query(
          `INSERT INTO payslip_lines (payslip_id, rule_id, amount)
           VALUES ($1, $2, $3)`,
          [payslipId, line.rule_id, line.amount]
        );
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

    for (const row of psRes.rows) {
      const name = `${row.first_name} ${row.last_name}`;

      // Check negative net wage (Dev C Edge Case 3)
      if (Number(row.net_wage) < 0) {
        warnings.push({
          employee_id: row.employee_id,
          employee_name: name,
          type: 'NEGATIVE_NET_SALARY',
          message: `Calculated Net Salary is negative ($${row.net_wage}). Please review deductions.`,
        });
      }

      // Check missing email / bank details (Dev C Edge Case 7 & 9)
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
