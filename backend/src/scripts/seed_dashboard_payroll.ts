import { pool } from '../core/db';

export async function seedDashboardPayroll() {
  const startTime = Date.now();
  console.log('🚀 [Seed Dashboard Payroll] Generating payslips and department salary allocations in Supabase...');

  const client = await pool.connect();

  try {
    // 1. Ensure September 2026 payrun exists with status 'Paid' or 'Validated'
    console.log('📋 Step 1: Ensuring September 2026 payrun exists...');
    const prCheck = await client.query(`SELECT id FROM payruns WHERE id = 'pr_2026_09'`);
    if (prCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
        VALUES ('pr_2026_09', 'September 2026 Regular Payrun', 'struct_1', '2026-09-01', '2026-09-30', 'Paid')
        ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      await client.query(`
        UPDATE payruns 
        SET status = 'Paid', period_start = '2026-09-01', period_end = '2026-09-30'
        WHERE id = 'pr_2026_09'
      `);
    }

    // 2. Fetch all employees with running contracts
    console.log('👥 Step 2: Fetching employees with running contracts...');
    const runningContractsRes = await client.query(`
      SELECT c.id as contract_id, c.employee_id, c.wage, c.salary_structure_id,
             e.first_name, e.last_name, e.department_id, d.name as department_name
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE c.status = 'running'
    `);

    const contracts = runningContractsRes.rows || [];
    console.log(`Found ${contracts.length} running contracts across departments.`);

    // 3. Generate computed payslips for each running contract for September 2026
    console.log('💵 Step 3: Computing payslip items (gross, deductions, net)...');
    const payslips: any[] = [];
    const payslipLines: any[] = [];

    let totalGrossSum = 0;
    let totalNetSum = 0;

    for (const c of contracts) {
      const psId = `ps_pr_2026_09_${c.employee_id}`;
      const baseWage = Number(c.wage) || 4500;
      
      // Standard allowances: HRA (20%), Transport (8%), Special (10%)
      const hra = Math.round(baseWage * 0.20 * 100) / 100;
      const transport = Math.round(baseWage * 0.08 * 100) / 100;
      const special = Math.round(baseWage * 0.10 * 100) / 100;
      const grossWage = Math.round((baseWage + hra + transport + special) * 100) / 100;

      // Deductions: Tax (10%), Provident Fund (5%), Insurance ($150)
      const tax = Math.round(grossWage * 0.10 * 100) / 100;
      const pf = Math.round(baseWage * 0.05 * 100) / 100;
      const insurance = 150.00;
      const totalDeductions = Math.round((tax + pf + insurance) * 100) / 100;

      const netWage = Math.round((grossWage - totalDeductions) * 100) / 100;

      totalGrossSum += grossWage;
      totalNetSum += netWage;

      payslips.push({
        id: psId,
        payrun_id: 'pr_2026_09',
        employee_id: c.employee_id,
        contract_id: c.contract_id,
        salary_structure_id: c.salary_structure_id || 'struct_1',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        worked_days: 22,
        basic_wage: baseWage,
        gross_wage: grossWage,
        gross_salary: grossWage,
        total_deductions: totalDeductions,
        net_wage: netWage,
        net_salary: netWage,
        status: 'Paid'
      });

      // Lines
      payslipLines.push(
        { id: `psl_${psId}_1`, payslip_id: psId, name: 'Basic Wage', code: 'BASIC', category: 'BASIC', sequence: 10, amount: baseWage },
        { id: `psl_${psId}_2`, payslip_id: psId, name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'ALLOWANCE', sequence: 20, amount: hra },
        { id: `psl_${psId}_3`, payslip_id: psId, name: 'Transport Allowance', code: 'TRANS', category: 'ALLOWANCE', sequence: 25, amount: transport },
        { id: `psl_${psId}_4`, payslip_id: psId, name: 'Special Allowance', code: 'SPECIAL', category: 'ALLOWANCE', sequence: 30, amount: special },
        { id: `psl_${psId}_5`, payslip_id: psId, name: 'Income Tax (TDS)', code: 'TAX', category: 'DEDUCTION', sequence: 50, amount: tax },
        { id: `psl_${psId}_6`, payslip_id: psId, name: 'Provident Fund (PF)', code: 'PF', category: 'DEDUCTION', sequence: 55, amount: pf },
        { id: `psl_${psId}_7`, payslip_id: psId, name: 'Group Health Insurance', code: 'INS', category: 'DEDUCTION', sequence: 60, amount: insurance }
      );
    }

    // 4. Batch insert payslips in chunks
    console.log(`💾 Step 4: Batch inserting ${payslips.length} payslips into Supabase...`);
    const chunkSize = 50;
    for (let i = 0; i < payslips.length; i += chunkSize) {
      const chunk = payslips.slice(i, i + chunkSize);
      const values: any[] = [];
      const valueStrings: string[] = [];

      chunk.forEach((ps, idx) => {
        const offset = idx * 13;
        valueStrings.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`
        );
        values.push(
          ps.id, ps.payrun_id, ps.employee_id, ps.contract_id, ps.salary_structure_id,
          ps.period_start, ps.period_end, ps.worked_days, ps.basic_wage,
          ps.gross_wage, ps.total_deductions, ps.net_wage, ps.status
        );
      });

      const sql = `
        INSERT INTO payslips (
          id, payrun_id, employee_id, contract_id, salary_structure_id,
          period_start, period_end, worked_days, basic_wage,
          gross_wage, total_deductions, net_wage, status
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          basic_wage = EXCLUDED.basic_wage,
          gross_wage = EXCLUDED.gross_wage,
          total_deductions = EXCLUDED.total_deductions,
          net_wage = EXCLUDED.net_wage,
          status = EXCLUDED.status;
      `;
      await client.query(sql, values);
    }

    // 5. Update payrun stats on pr_2026_09
    console.log('📊 Step 5: Updating payrun record summary...');
    await client.query(`
      UPDATE payruns
      SET employee_count = $1,
          total_gross = $2,
          total_net = $3,
          status = 'Paid'
      WHERE id = 'pr_2026_09'
    `, [payslips.length, totalGrossSum, totalNetSum]);

    // 6. Verify Dashboard Data
    console.log('🔍 Step 6: Verifying Dashboard queries...');
    const sfCheck = await client.query(`
      SELECT COALESCE(SUM(ps.net_wage), 0)::float AS total_net,
             COALESCE(SUM(ps.gross_wage), 0)::float AS total_gross,
             COUNT(ps.id)::int AS payslip_count
      FROM payslips ps
      JOIN payruns pr ON ps.payrun_id = pr.id
      WHERE LOWER(pr.status) IN ('computed', 'validated', 'paid', 'confirmed', 'draft')
        AND TO_CHAR(pr.period_start, 'Mon YYYY') = 'Sep 2026';
    `);

    const deptCheck = await client.query(`
      SELECT d.name AS department, 
             COALESCE(SUM(ps.gross_wage), 0)::float AS total_gross,
             COALESCE(SUM(ps.net_wage), 0)::float AS total_net,
             COUNT(DISTINCT ps.employee_id)::int AS employee_count
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      JOIN payruns pr ON ps.payrun_id = pr.id
      WHERE LOWER(pr.status) IN ('computed', 'validated', 'paid', 'confirmed', 'draft')
        AND TO_CHAR(pr.period_start, 'Mon YYYY') = 'Sep 2026'
      GROUP BY d.name ORDER BY total_gross DESC;
    `);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================ PAYROLL SEEDING COMPLETE ================');
    console.log(`⏱️ Duration: ${elapsed}s`);
    console.log('💰 Total Salary Fund for Sep 2026:', sfCheck.rows[0]);
    console.log('🏢 Cost by Department for Sep 2026:', deptCheck.rows);
    console.log('==========================================================\n');

  } catch (err) {
    console.error('❌ [Seed Dashboard Payroll Error]:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Auto-run if invoked directly
seedDashboardPayroll().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
