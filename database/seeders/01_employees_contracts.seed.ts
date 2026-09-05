import { query } from '../../backend/src/core/db';

export async function seedEmployeesAndContracts() {
  console.log('Seeding Departments, Employees, Schedules & Contracts (Amara Chen Scenario)...');

  // Departments
  const depts = ['Sales & Retail', 'Human Resources', 'Engineering', 'Finance'];
  for (const name of depts) {
    await query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
  }

  const deptRes = await query('SELECT * FROM departments');
  const deptMap = new Map(deptRes.rows.map(d => [d.name, d.id]));

  // Employees
  const employees = [
    { id: 1, first_name: 'Amara', last_name: 'Chen', email: 'amara.chen@company.com', job_position: 'Store Supervisor', dept: 'Sales & Retail' },
    { id: 2, first_name: 'Bhavna', last_name: 'Patel', email: 'bhavna.patel@company.com', job_position: 'HR Specialist', dept: 'Human Resources' },
    { id: 3, first_name: 'David', last_name: 'Vance', email: 'david.vance@company.com', job_position: 'Software Engineer', dept: 'Engineering' },
    { id: 4, first_name: 'Elena', last_name: 'Rostova', email: 'elena.rostova@company.com', job_position: 'Accountant', dept: 'Finance' },
  ];

  for (const e of employees) {
    await query(
      `INSERT INTO employees (id, first_name, last_name, email, job_position, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET job_position = EXCLUDED.job_position`,
      [e.id, e.first_name, e.last_name, e.email, e.job_position, deptMap.get(e.dept)]
    );
  }

  // Working Schedule (Standard 40h)
  const schedRes = await query(`
    INSERT INTO working_schedules (name, hours_per_week)
    VALUES ('Standard 40h Weekly Pattern', 40.0)
    RETURNING id
  `);
  const schedId = schedRes.rows[0]?.id || 1;

  // Contracts (Amara Chen hire Jan 15 at $4,400, promotion June 1 to Store Supervisor at $5,200)
  await query(`
    INSERT INTO contracts (employee_id, start_date, end_date, wage, status, schedule_id)
    VALUES 
      (1, '2026-01-15', '2026-06-01', 4400, 'Expired', $1),
      (1, '2026-06-01', NULL, 5200, 'Running', $1),
      (2, '2026-01-01', NULL, 4200, 'Running', $1),
      (3, '2026-01-01', NULL, 6500, 'Running', $1),
      (4, '2026-01-01', NULL, 4800, 'Running', $1)
  `, [schedId]);
}
