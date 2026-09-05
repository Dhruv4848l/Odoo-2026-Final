import { query } from '../../backend/src/core/db';

export async function seedPayrollDemoData() {
  console.log('Seeding PeoplePay360 Payroll Engine demo data (Amara Chen Scenario)...');

  // 1. Seed Default Salary Structure
  const structRes = await query(`
    INSERT INTO salary_structures (name)
    VALUES ('Standard Monthly Salary')
    ON CONFLICT DO NOTHING
    RETURNING id
  `);
  const structureId = structRes.rows[0]?.id || 1;

  // 2. Seed Salary Rules
  const rules = [
    { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', sequence: 10, method: 'Fixed', amount: 4500, formula: null, cap: null },
    { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, method: 'Percentage', amount: 40, formula: null, cap: null },
    { code: 'TA', name: 'Transport Allowance', category: 'ALLOWANCE', sequence: 30, method: 'Fixed', amount: 300, formula: null, cap: null },
    { code: 'SUP_ALW', name: 'Supervisor Allowance', category: 'ALLOWANCE', sequence: 40, method: 'Fixed', amount: 500, formula: null, cap: null, cond: "job_position == 'Store Supervisor'" },
    { code: 'PF', name: 'Provident Fund (Capped)', category: 'DEDUCTION', sequence: 50, method: 'Percentage', amount: 12, formula: null, cap: 1800 },
    { code: 'TAX', name: 'Income Tax', category: 'DEDUCTION', sequence: 60, method: 'Percentage', amount: 10, formula: null, cap: null },
  ];

  for (const r of rules) {
    await query(
      `INSERT INTO salary_rules (structure_id, code, name, category, sequence, computation_method, amount, formula, condition_expression)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO NOTHING`,
      [structureId, r.code, r.name, r.category, r.sequence, r.method, r.amount, r.formula, r.cond || null]
    );
  }

  // 3. Seed Demo Payrun for September 2026
  const payrunRes = await query(`
    INSERT INTO payruns (name, structure_id, period_start, period_end, status)
    VALUES ('September 2026 Regular Payrun', $1, '2026-09-01', '2026-09-30', 'Draft')
    RETURNING id
  `, [structureId]);
  const payrunId = payrunRes.rows[0]?.id || 1;

  console.log(`Successfully seeded Payroll demo data (Payrun ID #${payrunId}, Structure ID #${structureId}).`);
}

if (require.main === module) {
  seedPayrollDemoData().catch(console.error);
}
