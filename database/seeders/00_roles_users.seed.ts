import { query } from '../../backend/src/core/db';

export async function seedRolesAndUsers() {
  console.log('Seeding Roles and Users...');

  const roles = [
    { id: 1, name: 'Employee', description: 'Self-service view only' },
    { id: 2, name: 'HR Manager', description: 'Full HR access, blocked from payroll' },
    { id: 3, name: 'HR Payroll User', description: 'Payrun and payslip view/edit' },
    { id: 4, name: 'HR Payroll Manager', description: 'Full payroll and structure CRUD' },
    { id: 5, name: 'Admin', description: 'Full system access' },
  ];

  for (const r of roles) {
    await query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [r.id, r.name, r.description]
    );
  }
}
