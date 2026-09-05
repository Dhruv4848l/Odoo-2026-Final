import { Router, Response } from 'express';
import { query } from '../../core/db.js';
import { generateToken, authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

const router = Router();

// ==========================================
// 1. AUTHENTICATION MODULE (Module 0)
// ==========================================

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' },
    });
  }

  const userRes = await query(
    `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  const user = userRes.rows?.[0];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  const empRes = await query(`SELECT * FROM employees WHERE user_id = $1`, [user.id]);
  const employee = empRes.rows?.[0] || null;

  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.role_id,
    employeeId: employee?.id || null,
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: { id: user.role_id, name: user.role_name },
        employee: employee || null,
      },
    },
  });
});

router.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userRes = await query(
    `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [req.user?.userId || req.user?.id]
  );
  const user = userRes.rows?.[0];
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }

  const empRes = await query(`SELECT * FROM employees WHERE user_id = $1`, [user.id]);
  const employee = empRes.rows?.[0] || null;

  return res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: { id: user.role_id, name: user.role_name },
      employee: employee || null,
    },
  });
});

// Get all roles
router.get('/roles', async (req, res) => {
  const result = await query('SELECT * FROM roles ORDER BY name');
  return res.json({ success: true, data: result.rows || [] });
});

// ==========================================
// 2. DEPARTMENTS
// ==========================================

router.get('/departments', authMiddleware, async (req, res) => {
  const result = await query(`
    SELECT d.*, e.first_name || ' ' || e.last_name AS manager_name
    FROM departments d
    LEFT JOIN employees e ON d.manager_id = e.id
    ORDER BY d.name
  `);
  return res.json({ success: true, data: result.rows || [] });
});

router.post('/departments', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { name, code } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Department name is required.' } });
  }

  const result = await query(
    `INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *`,
    [name, code || name.substring(0, 4).toUpperCase()]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ==========================================
// 3. EMPLOYEES (Module A1 / B1 / B2)
// ==========================================

router.get('/employees', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { search, department_id, status } = req.query;

  let sql = `
    SELECT e.*,
           d.name AS department_name,
           ws.name AS schedule_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  // RBAC Filter: Plain employee can only see own profile
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    conditions.push(`e.id = $${params.length + 1}`);
    params.push(req.user.employeeId);
  }

  if (search) {
    const q = `%${String(search).toLowerCase()}%`;
    conditions.push(`(LOWER(e.first_name) LIKE $${params.length + 1} OR LOWER(e.last_name) LIKE $${params.length + 1} OR LOWER(e.email) LIKE $${params.length + 1} OR LOWER(e.job_position) LIKE $${params.length + 1})`);
    params.push(q);
  }

  if (department_id) {
    conditions.push(`e.department_id = $${params.length + 1}`);
    params.push(Number(department_id));
  }

  if (status) {
    conditions.push(`e.status = $${params.length + 1}`);
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY e.first_name, e.last_name';

  const result = await query(sql, params);
  return res.json({ success: true, data: result.rows || [] });
});

router.get('/employees/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // RBAC Enforcement: Employee cannot view other employees' profiles
  if (req.user?.roleId === 'employee' && String(req.user.employeeId) !== String(id)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You are only authorized to view your own profile.' },
    });
  }

  const empRes = await query(`
    SELECT e.*,
           d.name AS department_name,
           ws.name AS schedule_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
    WHERE e.id = $1
  `, [Number(id)]);

  const employee = empRes.rows?.[0];
  if (!employee) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  // Real smart stats from database
  const contractCountRes = await query(
    `SELECT COUNT(*)::int AS count FROM contracts WHERE employee_id = $1`,
    [Number(id)]
  );

  const attendanceRes = await query(
    `SELECT COUNT(*)::int AS total, COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END)::int AS complete FROM attendances WHERE employee_id = $1`,
    [Number(id)]
  );
  const attData = attendanceRes.rows?.[0] || { total: 0, complete: 0 };
  const attendanceRate = attData.total > 0 ? Math.round((attData.complete / attData.total) * 100) : 100;

  const timeOffRes = await query(
    `SELECT COALESCE(SUM(requested_amount), 0)::float AS days FROM time_off_requests WHERE employee_id = $1 AND status = 'Approved'`,
    [Number(id)]
  );

  return res.json({
    success: true,
    data: {
      ...employee,
      smart_stats: {
        contracts_count: contractCountRes.rows?.[0]?.count || 0,
        attendance_rate: `${attendanceRate}%`,
        time_off_days: timeOffRes.rows?.[0]?.days || 0,
      },
    },
  });
});

router.post('/employees', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const {
    first_name, last_name, email, phone, job_position,
    department_id, working_schedule_id, private_email,
    bank_account_number, bank_name, bank_ifsc, hire_date,
  } = req.body;

  if (!first_name || !last_name || !email || !job_position || !hire_date) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'First name, last name, email, job position, and hire date are required.' },
    });
  }

  // Check for duplicate email
  const dupCheck = await query('SELECT id FROM employees WHERE LOWER(email) = $1', [email.toLowerCase()]);
  if (dupCheck.rows && dupCheck.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_EMAIL', message: 'An employee with this email already exists.' },
    });
  }

  const result = await query(
    `INSERT INTO employees (first_name, last_name, email, phone, job_position, department_id, working_schedule_id, status, date_of_joining, bank_account_number, bank_name, bank_ifsc)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11)
     RETURNING *`,
    [first_name, last_name, email, phone || '', job_position,
     department_id ? Number(department_id) : null,
     working_schedule_id ? Number(working_schedule_id) : null,
     hire_date,
     bank_account_number || '', bank_name || '', bank_ifsc || '']
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

router.put('/employees/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, job_position,
    department_id, working_schedule_id, status,
    bank_account_number, bank_name, bank_ifsc,
  } = req.body;

  const result = await query(
    `UPDATE employees SET
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       job_position = COALESCE($5, job_position),
       department_id = COALESCE($6, department_id),
       working_schedule_id = COALESCE($7, working_schedule_id),
       status = COALESCE($8, status),
       bank_account_number = COALESCE($9, bank_account_number),
       bank_name = COALESCE($10, bank_name),
       bank_ifsc = COALESCE($11, bank_ifsc),
       updated_at = NOW()
     WHERE id = $12 RETURNING *`,
    [first_name, last_name, email, phone, job_position,
     department_id ? Number(department_id) : null,
     working_schedule_id ? Number(working_schedule_id) : null,
     status,
     bank_account_number, bank_name, bank_ifsc,
     Number(id)]
  );

  if (!result.rows || result.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  return res.json({ success: true, data: result.rows[0] });
});

// ==========================================
// 4. CONTRACTS (Module A2) — Overlap Validation
// ==========================================

router.get('/contracts', authMiddleware, async (req, res) => {
  const { employee_id, status } = req.query;

  let sql = `
    SELECT c.*,
           e.first_name || ' ' || e.last_name AS employee_name,
           e.email AS employee_email
    FROM contracts c
    JOIN employees e ON c.employee_id = e.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (employee_id) {
    conditions.push(`c.employee_id = $${params.length + 1}`);
    params.push(Number(employee_id));
  }
  if (status) {
    conditions.push(`c.status = $${params.length + 1}`);
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY c.start_date DESC';

  const result = await query(sql, params);
  return res.json({ success: true, data: result.rows || [] });
});

router.post('/contracts', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { employee_id, contract_name, job_position, wage, start_date, end_date, working_schedule_id, salary_structure_id, notes } = req.body;

  if (!employee_id || !wage || !start_date) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, wage, and start date are required.' },
    });
  }

  // CRITICAL VALIDATION: Overlapping active/running contracts check
  const overlapRes = await query(
    `SELECT id, contract_name, start_date, end_date FROM contracts
     WHERE employee_id = $1 AND status = 'running'
       AND start_date <= $3 AND (end_date IS NULL OR end_date >= $2)`,
    [Number(employee_id), start_date, end_date || '9999-12-31']
  );

  if (overlapRes.rows && overlapRes.rows.length > 0) {
    const existing = overlapRes.rows[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'OVERLAPPING_ACTIVE_CONTRACT',
        message: `Validation Error: Employee already has an active running contract (${existing.contract_name}) covering the requested period. End the existing contract first.`,
      },
    });
  }

  const result = await query(
    `INSERT INTO contracts (employee_id, contract_name, job_position, wage, start_date, end_date, working_schedule_id, salary_structure_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'running')
     RETURNING *`,
    [Number(employee_id), contract_name || 'Employment Contract',
     job_position || 'Staff', Number(wage), start_date, end_date || null,
     working_schedule_id ? Number(working_schedule_id) : null,
     salary_structure_id ? Number(salary_structure_id) : null]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

router.put('/contracts/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const { contract_name, job_position, wage, start_date, end_date, status, working_schedule_id, salary_structure_id } = req.body;

  const result = await query(
    `UPDATE contracts SET
       contract_name = COALESCE($1, contract_name),
       job_position = COALESCE($2, job_position),
       wage = COALESCE($3, wage),
       start_date = COALESCE($4, start_date),
       end_date = COALESCE($5, end_date),
       status = COALESCE($6, status),
       working_schedule_id = COALESCE($7, working_schedule_id),
       salary_structure_id = COALESCE($8, salary_structure_id),
       updated_at = NOW()
     WHERE id = $9 RETURNING *`,
    [contract_name, job_position, wage ? Number(wage) : null,
     start_date, end_date, status,
     working_schedule_id ? Number(working_schedule_id) : null,
     salary_structure_id ? Number(salary_structure_id) : null,
     Number(id)]
  );

  if (!result.rows || result.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Contract not found.' } });
  }

  return res.json({ success: true, data: result.rows[0] });
});

// ==========================================
// 5. WORKING SCHEDULES (Module A3) — Auto-Computed Weekly Hours
// ==========================================

router.get('/schedules', authMiddleware, async (req, res) => {
  const schedRes = await query('SELECT * FROM working_schedules ORDER BY name');
  const schedules = schedRes.rows || [];

  // Enrich with days data
  for (const sched of schedules) {
    const daysRes = await query(
      `SELECT * FROM working_schedule_days WHERE working_schedule_id = $1 ORDER BY day_of_week`,
      [sched.id]
    );
    sched.days = daysRes.rows || [];
    sched.total_hours_per_week = sched.days.reduce((sum: number, d: any) => sum + (Number(d.computed_hours) || 0), 0);
  }

  return res.json({ success: true, data: schedules });
});

router.post('/schedules', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { name, days } = req.body;
  if (!name || !days || !Array.isArray(days)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SCHEDULE', message: 'Schedule name and working days array are required.' },
    });
  }

  const schedRes = await query(
    `INSERT INTO working_schedules (name) VALUES ($1) RETURNING *`,
    [name]
  );

  const schedule = schedRes.rows?.[0];
  if (!schedule) {
    return res.status(500).json({ success: false, error: { message: 'Failed to create schedule.' } });
  }

  // Insert days
  let totalWeekHours = 0;
  const processedDays: any[] = [];

  for (const day of days) {
    const dayRes = await query(
      `INSERT INTO working_schedule_days (working_schedule_id, day_of_week, start_time, end_time, break_hours, is_working_day)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [schedule.id, day.day_of_week, day.start_time, day.end_time, Number(day.break_hours) || 0, day.is_working_day !== false]
    );

    const inserted = dayRes.rows?.[0];
    if (inserted) {
      processedDays.push(inserted);
      totalWeekHours += Number(inserted.computed_hours) || 0;
    }
  }

  return res.status(201).json({
    success: true,
    data: { ...schedule, days: processedDays, total_hours_per_week: totalWeekHours },
  });
});

export default router;
