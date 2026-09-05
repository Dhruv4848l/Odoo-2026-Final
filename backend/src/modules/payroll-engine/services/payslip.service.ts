import { query } from '../../../core/db.js';

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
  lines: Array<{
    rule_id: string;
    code: string;
    name: string;
    category: string;
    sequence: number;
    amount: number;
  }>;
}

export class PayslipService {
  static async getPayslipById(id: string): Promise<PayslipDetail | null> {
    const psRes = await query(
      `SELECT ps.*, pr.name as payrun_name, pr.period_start, pr.period_end,
              e.first_name, e.last_name, e.job_position, d.name as department_name,
              COALESCE(c.wage, ps.basic_wage) as contract_wage
       FROM payslips ps
       LEFT JOIN payruns pr ON ps.payrun_id = pr.id
       LEFT JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN contracts c ON ps.contract_id = c.id
       WHERE ps.id = $1`,
      [String(id)]
    );

    if (psRes.rows && psRes.rows.length > 0) {
      const row = psRes.rows[0];

      const linesRes = await query(
        `SELECT pl.amount, pl.id as line_id, pl.salary_rule_id as rule_id, pl.code, pl.name, pl.category, pl.sequence
         FROM payslip_lines pl
         WHERE pl.payslip_id = $1
         ORDER BY pl.sequence ASC`,
        [String(id)]
      );

      return {
        id: row.id,
        payrun_id: row.payrun_id,
        payrun_name: row.payrun_name || 'Payrun Batch',
        period_start: row.period_start,
        period_end: row.period_end,
        employee_id: row.employee_id,
        employee_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_id,
        department_name: row.department_name || 'General',
        job_position: row.job_position || 'Staff',
        contract_wage: Number(row.contract_wage || 0),
        basic_wage: Number(row.basic_wage || 0),
        gross_wage: Number(row.gross_wage || 0),
        net_wage: Number(row.net_wage || 0),
        status: row.status,
        lines: (linesRes.rows || []).map(l => ({
          rule_id: l.rule_id || l.line_id,
          code: l.code || 'COMP',
          name: l.name || 'Component',
          category: l.category || 'ALLOWANCE',
          sequence: Number(l.sequence || 10),
          amount: Number(l.amount || 0)
        }))
      };
    }

    return null;
  }

  static async getPayslipsByPayrunId(payrunId: string): Promise<PayslipDetail[]> {
    const res = await query('SELECT id FROM payslips WHERE payrun_id = $1 ORDER BY id ASC', [String(payrunId)]);
    if (res.rows && res.rows.length > 0) {
      const details: PayslipDetail[] = [];
      for (const r of res.rows) {
        const ps = await this.getPayslipById(r.id);
        if (ps) details.push(ps);
      }
      return details;
    }

    return [];
  }

  static async getPayslipsByEmployeeId(employeeId: string): Promise<PayslipDetail[]> {
    const res = await query('SELECT id FROM payslips WHERE employee_id = $1 ORDER BY period_end DESC', [String(employeeId)]);
    if (res.rows && res.rows.length > 0) {
      const details: PayslipDetail[] = [];
      for (const r of res.rows) {
        const ps = await this.getPayslipById(r.id);
        if (ps) details.push(ps);
      }
      return details;
    }

    return [];
  }

  static async sendBulkPayslipEmails(payrunId: string): Promise<{ total: number; sent: number; failed: number; logs: any[] }> {
    const payslips = await this.getPayslipsByPayrunId(payrunId);
    let sentCount = 0;
    let failedCount = 0;
    const logs: any[] = [];

    for (const ps of payslips) {
      const empRes = await query('SELECT email FROM employees WHERE id = $1', [ps.employee_id]);
      let email = empRes.rows && empRes.rows[0]?.email;

      const emailLogId = `elog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      if (email && email.includes('@') && !email.includes('no-email')) {
        sentCount++;
        const logRes = await query(
          `INSERT INTO email_logs (id, recipient_email, subject, payslip_id, status)
           VALUES ($1, $2, $3, $4, 'Sent')
           RETURNING *`,
          [emailLogId, email, `Payslip for ${ps.payrun_name}`, ps.id]
        );
        if (logRes.rows && logRes.rows[0]) {
          logs.push(logRes.rows[0]);
        }
      } else {
        failedCount++;
        const logRes = await query(
          `INSERT INTO email_logs (id, recipient_email, subject, payslip_id, status, error_message)
           VALUES ($1, $2, $3, $4, 'Failed', 'Invalid or missing recipient email address')
           RETURNING *`,
          [emailLogId, email || 'invalid-email', `Payslip for ${ps.payrun_name}`, ps.id]
        );
        if (logRes.rows && logRes.rows[0]) {
          logs.push(logRes.rows[0]);
        }
      }
    }

    return { total: payslips.length, sent: sentCount, failed: failedCount, logs };
  }
}
