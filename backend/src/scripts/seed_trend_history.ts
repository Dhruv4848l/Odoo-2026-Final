import { pool } from '../core/db';

export async function seedTrendHistory() {
  console.log('🚀 [Seed Trend History] Populating 6-month historical payrun trends...');
  const client = await pool.connect();

  try {
    const historicalMonths = [
      { id: 'pr_2026_05', name: 'May 2026 Regular Payrun', start: '2026-05-01', end: '2026-05-31', gross: 950000, net: 810000, emps: 85 },
      { id: 'pr_2026_06', name: 'June 2026 Regular Payrun', start: '2026-06-01', end: '2026-06-30', gross: 1020000, net: 865000, emps: 92 },
      { id: 'pr_2026_07', name: 'July 2026 Regular Payrun', start: '2026-07-01', end: '2026-07-31', gross: 1080000, net: 915000, emps: 98 },
      { id: 'pr_2026_08', name: 'August 2026 Regular Payrun', start: '2026-08-01', end: '2026-08-31', gross: 1120000, net: 950000, emps: 104 },
      { id: 'pr_1788613944514', name: 'October 2026 Regular Payrun', start: '2026-10-01', end: '2026-10-31', gross: 1220000, net: 1035000, emps: 115 }
    ];

    for (const m of historicalMonths) {
      // Upsert payrun
      await client.query(`
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status, employee_count, total_gross, total_net)
        VALUES ($1, $2, 'struct_1', $3, $4, 'Paid', $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          period_start = EXCLUDED.period_start,
          period_end = EXCLUDED.period_end,
          status = 'Paid',
          employee_count = EXCLUDED.employee_count,
          total_gross = EXCLUDED.total_gross,
          total_net = EXCLUDED.total_net;
      `, [m.id, m.name, m.start, m.end, m.emps, m.gross, m.net]);

      // Seed summary department-level payslips for this payrun so query grouping works
      const depts = ['dept_eng', 'dept_hr', 'dept_sales', 'dept_finance', 'dept_1788611765232', 'dept_it', 'dept_ops'];
      const deptGrossShare = [0.26, 0.22, 0.19, 0.16, 0.10, 0.04, 0.03];
      
      // Clean existing payslips for these specific historical test payruns
      await client.query(`DELETE FROM payslips WHERE payrun_id = $1`, [m.id]);

      for (let i = 0; i < depts.length; i++) {
        const dId = depts[i];
        // Fetch an employee from this department
        const empRes = await client.query(`SELECT id FROM employees WHERE department_id = $1 LIMIT 1`, [dId]);
        const empId = empRes.rows?.[0]?.id || 'emp_001';
        const dGross = Math.round(m.gross * deptGrossShare[i]);
        const dNet = Math.round(m.net * deptGrossShare[i]);

        await client.query(`
          INSERT INTO payslips (id, payrun_id, employee_id, period_start, period_end, basic_wage, gross_wage, total_deductions, net_wage, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Paid')
          ON CONFLICT (id) DO UPDATE SET
            gross_wage = EXCLUDED.gross_wage,
            net_wage = EXCLUDED.net_wage,
            status = 'Paid';
        `, [`ps_${m.id}_${i}`, m.id, empId, m.start, m.end, dNet, dGross, dGross - dNet, dNet]);
      }
    }

    console.log('✅ Historical trend data seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding trend history:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTrendHistory().then(() => process.exit(0)).catch(() => process.exit(1));
