import { query } from '../../../core/db.js';

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
  lines: Array<{
    rule_id: number;
    code: string;
    name: string;
    category: string;
    sequence: number;
    amount: number;
  }>;
}

export class PayslipService {
  static async getPayslipById(id: number): Promise<PayslipDetail | null> {
    const psRes = await query(
      `SELECT ps.*, pr.name as payrun_name, pr.period_start, pr.period_end,
              e.first_name, e.last_name, e.job_position, d.name as department_name,
              c.wage as contract_wage
       FROM payslips ps
       JOIN payruns pr ON ps.payrun_id = pr.id
       JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       JOIN contracts c ON ps.contract_id = c.id
       WHERE ps.id = $1`,
      [id]
    );

    if (psRes.rows && psRes.rows.length > 0) {
      const row = psRes.rows[0];

      const linesRes = await query(
        `SELECT pl.amount, sr.id as rule_id, sr.code, sr.name, sr.category, sr.sequence
         FROM payslip_lines pl
         JOIN salary_rules sr ON pl.rule_id = sr.id
         WHERE pl.payslip_id = $1
         ORDER BY sr.sequence ASC`,
        [id]
      );

      return {
        id: row.id,
        payrun_id: row.payrun_id,
        payrun_name: row.payrun_name,
        period_start: row.period_start,
        period_end: row.period_end,
        employee_id: row.employee_id,
        employee_name: `${row.first_name} ${row.last_name}`,
        department_name: row.department_name || 'General',
        job_position: row.job_position || 'Staff',
        contract_wage: Number(row.contract_wage),
        basic_wage: Number(row.basic_wage),
        gross_wage: Number(row.gross_wage),
        net_wage: Number(row.net_wage),
        status: row.status,
        lines: (linesRes.rows || []).map(l => ({
          rule_id: l.rule_id,
          code: l.code,
          name: l.name,
          category: l.category,
          sequence: l.sequence,
          amount: Number(l.amount)
        }))
      };
    }

    return null;
  }

  static async getPayslipsByPayrunId(payrunId: number): Promise<PayslipDetail[]> {
    const res = await query('SELECT id FROM payslips WHERE payrun_id = $1 ORDER BY id ASC', [payrunId]);
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

  static async sendBulkPayslipEmails(payrunId: number): Promise<{ total: number; sent: number; failed: number; logs: any[] }> {
    const payslips = await this.getPayslipsByPayrunId(payrunId);
    let sentCount = 0;
    let failedCount = 0;
    const logs: any[] = [];

    for (const ps of payslips) {
      const empRes = await query('SELECT email FROM employees WHERE id = $1', [ps.employee_id]);
      let email = empRes.rows && empRes.rows[0]?.email;

      if (email && email.includes('@') && !email.includes('no-email')) {
        sentCount++;
        const logRes = await query(
          `INSERT INTO email_logs (recipient_email, subject, payslip_id, status)
           VALUES ($1, $2, $3, 'Sent')
           RETURNING *`,
          [email, `Payslip for ${ps.payrun_name}`, ps.id]
        );
        if (logRes.rows && logRes.rows[0]) {
            logs.push(logRes.rows[0]);
        }
      } else {
        failedCount++;
        const logRes = await query(
          `INSERT INTO email_logs (recipient_email, subject, payslip_id, status, error_message)
           VALUES ($1, $2, $3, 'Failed', 'Invalid or missing recipient email address')
           RETURNING *`,
          [email || 'invalid-email', `Payslip for ${ps.payrun_name}`, ps.id]
        );
        if (logRes.rows && logRes.rows[0]) {
            logs.push(logRes.rows[0]);
        }
      }
    }

    return { total: payslips.length, sent: sentCount, failed: failedCount, logs };
  }
}
