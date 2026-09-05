import { query } from '../../../core/db.js';
import { SalaryStructureService } from './salary-structure.service.js';

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

export interface PayrunWarning {
  employee_id: string;
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
      ORDER BY p.created_at DESC
    `);
    return res.rows || [];
  }

  static async getPayrunById(id: string): Promise<Payrun | null> {
    const res = await query(`
      SELECT p.*, s.name as structure_name
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      WHERE p.id = $1
    `, [String(id)]);

    if (!res.rows || res.rows.length === 0) return null;
    
    const payrun = res.rows[0];
    
    const statsRes = await query(`
        SELECT COUNT(*)::int as employee_count,
               COALESCE(SUM(gross_wage), 0)::float as total_gross,
               COALESCE(SUM(net_wage), 0)::float as total_net
        FROM payslips
        WHERE payrun_id = $1
    `, [String(id)]);
    
    if (statsRes.rows && statsRes.rows[0]) {
        payrun.employee_count = statsRes.rows[0].employee_count;
        payrun.total_gross = statsRes.rows[0].total_gross;
        payrun.total_net = statsRes.rows[0].total_net;
    }

    payrun.warnings = await this.getPayrunWarnings(String(id));
    return payrun;
  }

  static async createPayrun(
    name: string,
    structure_id: string,
    period_start: string,
    period_end: string,
    selected_employee_ids?: string[]
  ): Promise<Payrun> {
    const payrunId = `pr_${Date.now()}`;
    const payrunRes = await query(
      `INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
       VALUES ($1, $2, $3, $4, $5, 'Draft')
       RETURNING *`,
      [payrunId, name, String(structure_id), period_start, period_end]
    );

    if (!payrunRes.rows || payrunRes.rows.length === 0) {
      throw new Error('Failed to create payrun');
    }
    
    const payrun = payrunRes.rows[0];

    // Auto-discover employees with active contracts if not specified
    let empIds = selected_employee_ids;
    if (!empIds || empIds.length === 0) {
      const activeEmps = await query(`
        SELECT DISTINCT id AS employee_id FROM employees WHERE status = 'active'
      `);
      empIds = (activeEmps.rows || []).map((r: any) => r.employee_id);
    }

    await this.computePayrun(payrun.id, empIds);

    return (await this.getPayrunById(payrun.id)) || payrun;
  }

  static async computePayrun(payrunId: string, selectedEmployeeIds?: string[]): Promise<void> {
    const payrun = await this.getPayrunById(payrunId);
    if (!payrun) throw new Error('Payrun not found');

    let empIdsToProcess = selectedEmployeeIds && selectedEmployeeIds.length > 0 ? selectedEmployeeIds : [];
    if (empIdsToProcess.length === 0) {
      const activeEmps = await query(`SELECT id AS employee_id FROM employees WHERE status = 'active'`);
      empIdsToProcess = (activeEmps.rows || []).map((r: any) => r.employee_id);
    }

    for (const empId of empIdsToProcess) {
      // Find running contract or fallback contract for employee
      let contractRes = await query(
        `SELECT c.*, e.first_name, e.last_name, e.job_position 
         FROM contracts c
         JOIN employees e ON c.employee_id = e.id
         WHERE c.employee_id = $1 AND c.status = 'running'
         ORDER BY c.start_date DESC LIMIT 1`,
        [String(empId)]
      );

      if (!contractRes.rows || contractRes.rows.length === 0) {
        contractRes = await query(
          `SELECT c.*, e.first_name, e.last_name, e.job_position 
           FROM contracts c
           JOIN employees e ON c.employee_id = e.id
           WHERE c.employee_id = $1
           ORDER BY c.start_date DESC LIMIT 1`,
          [String(empId)]
        );
      }

      let rawContract = contractRes.rows && contractRes.rows.length > 0 ? contractRes.rows[0] : null;
      
      // Auto-generate fallback contract if employee has no contract record yet
      if (!rawContract) {
        const empRes = await query(`SELECT first_name, last_name, job_position FROM employees WHERE id = $1`, [String(empId)]);
        const empInfo = empRes.rows?.[0] || { first_name: 'Employee', last_name: empId, job_position: 'Staff' };
        const fallbackContractId = `ct_${empId}_auto`;
        const fallbackRef = `CNT-AUTO-${Date.now()}`;
        
        await query(
          `INSERT INTO contracts (id, contract_ref, contract_name, employee_id, job_position, wage, start_date, status, salary_structure_id)
           VALUES ($1, $2, $3, $4, $5, 4500.00, NOW(), 'running', $6)
           ON CONFLICT (id) DO NOTHING`,
          [fallbackContractId, fallbackRef, `Employment Contract - ${empInfo.first_name} ${empInfo.last_name}`, String(empId), empInfo.job_position || 'Staff', payrun.structure_id || 'struct_1']
        );

        rawContract = {
          id: fallbackContractId,
          employee_id: String(empId),
          job_position: empInfo.job_position || 'Staff',
          wage: 4500.00,
          salary_structure_id: payrun.structure_id || 'struct_1',
        };
      }

      const baseWage = Number(rawContract.wage || 4500);
      const contractStructId = rawContract.salary_structure_id || payrun.structure_id || 'struct_1';

      const structure = await SalaryStructureService.getStructureById(contractStructId);
      const rules = structure?.rules || [];

      // Calculate Overtime & Unpaid Leave Days
      const overtimeRes = await query(`
        SELECT COALESCE(SUM(overtime_hours), 0)::float as total_overtime
        FROM attendances
        WHERE employee_id = $1 AND attendance_date >= $2 AND attendance_date <= $3
      `, [String(empId), payrun.period_start, payrun.period_end]);
      const overtimeHours = overtimeRes.rows[0]?.total_overtime || 0;

      const unpaidRes = await query(`
        SELECT COALESCE(SUM(tor.requested_amount), 0)::float as unpaid_days
        FROM time_off_requests tor
        JOIN time_off_types tot ON tor.time_off_type_id = tot.id
        WHERE tor.employee_id = $1 
          AND tor.status = 'Approved'
          AND tor.start_date >= $2 
          AND tor.end_date <= $3
          AND tot.is_paid = false
      `, [String(empId), payrun.period_start, payrun.period_end]);
      const unpaidDays = unpaidRes.rows[0]?.unpaid_days || 0;

      // Compute salary components based on structure rules
      let totalAllowances = 0;
      let totalDeductions = 0;
      const computedLines: Array<{ rule_id: string; code: string; name: string; category: string; sequence: number; amount: number }> = [];

      // Temporary running gross for formula calculations
      let runningGross = baseWage;

      for (const rule of rules) {
        // Condition evaluation check if specified
        if (rule.condition_expression) {
          const condStr = String(rule.condition_expression)
            .replace(/\bOVERTIME_HOURS\b/g, String(overtimeHours))
            .replace(/\bUNPAID_DAYS\b/g, String(unpaidDays))
            .replace(/\bBASIC\b/g, String(baseWage));
          try {
            const isTrue = Boolean(Function(`"use strict"; return (${condStr});`)());
            if (!isTrue) continue; // Skip rule if condition is false
          } catch (e) {
            console.warn(`Condition evaluation failed for rule ${rule.code}:`, e);
          }
        }

        let lineAmount = 0;
        if (rule.category === 'BASIC') {
          lineAmount = baseWage;
        } else if (rule.computation_method === 'Fixed') {
          lineAmount = Number(rule.amount || 0);
        } else if (rule.computation_method === 'Percentage') {
          const pct = Number(rule.amount || rule.value || 0) / 100;
          lineAmount = Math.round(baseWage * pct * 100) / 100;
        } else if (rule.computation_method === 'Formula' && rule.formula) {
          const formulaStr = String(rule.formula)
            .replace(/\bBASIC\b/g, String(baseWage))
            .replace(/\bGROSS\b/g, String(runningGross))
            .replace(/\bWORKED_DAYS\b/g, '22')
            .replace(/\bOVERTIME_HOURS\b/g, String(overtimeHours))
            .replace(/\bUNPAID_DAYS\b/g, String(unpaidDays));

          try {
            lineAmount = Number(Function('min', 'max', `"use strict"; return (${formulaStr});`)(Math.min, Math.max)) || 0;
          } catch (e) {
            console.warn(`Formula evaluation failed for rule ${rule.code}:`, e);
            lineAmount = Number(rule.amount || 0);
          }
        } else {
          lineAmount = Number(rule.amount || 0);
        }

        // Apply Cap Amount if ceiling is defined
        if (rule.cap_amount && Number(rule.cap_amount) > 0) {
          lineAmount = Math.min(lineAmount, Number(rule.cap_amount));
        }

        lineAmount = Math.round(lineAmount * 100) / 100;

        if (rule.category === 'ALLOWANCE') {
          totalAllowances += lineAmount;
          runningGross += lineAmount;
        } else if (rule.category === 'DEDUCTION') {
          totalDeductions += lineAmount;
        }

        computedLines.push({
          rule_id: rule.id,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          sequence: rule.sequence,
          amount: lineAmount,
        });
      }

      // Check for unpaid days auto-deduction if no explicit UNPAID rule exists
      if (unpaidDays > 0 && !computedLines.some((l) => l.code === 'UNPAID')) {
        const unpaidDeduction = Math.round((baseWage / 22) * unpaidDays * 100) / 100;
        totalDeductions += unpaidDeduction;
        computedLines.push({
          rule_id: `rule_unpaid_${empId}`,
          code: 'UNPAID',
          name: `Unpaid Leave Deduction (${unpaidDays} Days)`,
          category: 'DEDUCTION',
          sequence: 90,
          amount: unpaidDeduction,
        });
      }

      const grossWage = Math.round((baseWage + totalAllowances) * 100) / 100;
      const netWage = Math.round((grossWage - totalDeductions) * 100) / 100;
      const payslipId = `ps_${payrunId}_${empId}`;

      // Insert/update payslip
      await query(
        `INSERT INTO payslips 
           (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, basic_wage, gross_wage, total_deductions, net_wage, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 22, $8, $9, $10, $11, 'Draft')
         ON CONFLICT (id) DO UPDATE SET
           salary_structure_id = EXCLUDED.salary_structure_id,
           basic_wage = EXCLUDED.basic_wage,
           gross_wage = EXCLUDED.gross_wage,
           total_deductions = EXCLUDED.total_deductions,
           net_wage = EXCLUDED.net_wage`,
        [payslipId, payrunId, String(empId), String(rawContract.id), String(contractStructId), payrun.period_start, payrun.period_end, baseWage, grossWage, totalDeductions, netWage]
      );

      // Clean old payslip lines for recalculation
      await query('DELETE FROM payslip_lines WHERE payslip_id = $1', [payslipId]);

      // Insert fresh payslip line items
      for (let i = 0; i < computedLines.length; i++) {
        const line = computedLines[i];
        const lineId = `psl_${payslipId}_${i}`;
        await query(
          `INSERT INTO payslip_lines (id, payslip_id, salary_rule_id, name, code, category, sequence, amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [lineId, payslipId, String(line.rule_id), line.name, line.code, line.category, line.sequence, line.amount]
        );
      }
    }
  }

  static async getPayrunWarnings(payrunId: string): Promise<PayrunWarning[]> {
    const warnings: PayrunWarning[] = [];
    const psRes = await query(
      `SELECT ps.*, e.first_name, e.last_name, e.email
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       WHERE ps.payrun_id = $1`,
      [String(payrunId)]
    );

    for (const row of psRes.rows || []) {
      const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
      if (Number(row.net_wage) < 0) {
        warnings.push({
          employee_id: row.employee_id,
          employee_name: name,
          type: 'NEGATIVE_NET_SALARY',
          message: `Calculated Net Salary is negative ($${row.net_wage}). Please review deductions.`,
        });
      }
    }
    
    return warnings;
  }

  static async updatePayrunStatus(payrunId: string, status: 'Draft' | 'Validated' | 'Paid'): Promise<Payrun> {
    await query('UPDATE payruns SET status = $1 WHERE id = $2', [status, String(payrunId)]);
    await query('UPDATE payslips SET status = $1 WHERE payrun_id = $2', [status, String(payrunId)]);

    const updated = await this.getPayrunById(String(payrunId));
    return updated!;
  }
}
