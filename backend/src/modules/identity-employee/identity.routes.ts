import { Router, Response } from 'express';
import { query, memoryDb } from '../../core/db.js';
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

  let user: any = null;
  const userRes = await query(
    `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE LOWER(u.email) = $1`,
    [email.toLowerCase()]
  );

  if (userRes.rows && userRes.rows.length > 0) {
    user = userRes.rows[0];
  } else {
    // Memory DB fallback
    const memUser = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (memUser) {
      const roleObj = memoryDb.roles.find((r) => r.id === memUser.role_id);
      user = {
        id: memUser.id,
        email: memUser.email,
        password: memUser.password,
        password_hash: memUser.password,
        role_id: memUser.role_id,
        role_name: roleObj?.name || memUser.role_id,
        employee_id: memUser.employee_id,
      };
    }
  }

  if (!user || (user.password !== password && user.password_hash !== password)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  let employee: any = null;
  if (user.employee_id) {
    const empRes = await query(`SELECT * FROM employees WHERE id = $1 OR LOWER(email) = $2`, [user.employee_id, user.email.toLowerCase()]);
    if (empRes.rows && empRes.rows.length > 0) {
      employee = empRes.rows[0];
    } else {
      employee = memoryDb.employees.find((e) => e.id === user.employee_id || e.email?.toLowerCase() === user.email?.toLowerCase()) || null;
    }
  } else {
    const empRes = await query(`SELECT * FROM employees WHERE LOWER(email) = $1`, [user.email.toLowerCase()]);
    if (empRes.rows && empRes.rows.length > 0) {
      employee = empRes.rows[0];
    } else {
      employee = memoryDb.employees.find((e) => e.email?.toLowerCase() === user.email?.toLowerCase()) || null;
    }
  }

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
  const targetId = req.user?.userId || req.user?.id;
  let user: any = null;
  const userRes = await query(
    `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [targetId]
  );
  if (userRes.rows && userRes.rows.length > 0) {
    user = userRes.rows[0];
  } else {
    const memUser = memoryDb.users.find((u) => u.id === targetId || u.email?.toLowerCase() === req.user?.email?.toLowerCase());
    if (memUser) {
      const roleObj = memoryDb.roles.find((r) => r.id === memUser.role_id);
      user = {
        id: memUser.id,
        email: memUser.email,
        role_id: memUser.role_id,
        role_name: roleObj?.name || memUser.role_id,
      };
    }
  }

  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }

  let employee: any = null;
  const empRes = await query(`SELECT * FROM employees WHERE id = $1 OR LOWER(email) = $2`, [user.employee_id || null, user.email.toLowerCase()]);
  if (empRes.rows && empRes.rows.length > 0) {
    employee = empRes.rows[0];
  } else {
    employee = memoryDb.employees.find((e) => e.email?.toLowerCase() === user.email?.toLowerCase()) || null;
  }

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
  let roles = result.rows || [];
  if (!roles || roles.length === 0) {
    roles = memoryDb.roles;
  }
  return res.json({ success: true, data: roles });
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
  let depts = result.rows || [];
  if (!depts || depts.length === 0) {
    depts = memoryDb.departments;
  }
  return res.json({ success: true, data: depts });
});

router.post('/departments', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { name, code } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Department name is required.' } });
  }

  const deptId = `dept_${Date.now()}`;
  const deptCode = code || name.substring(0, 4).toUpperCase();

  const result = await query(
    `INSERT INTO departments (id, name, code) VALUES ($1, $2, $3) RETURNING *`,
    [deptId, name, deptCode]
  );

  let newDept = result.rows?.[0];
  if (!newDept) {
    newDept = { id: deptId, name, code: deptCode, manager_id: null };
    memoryDb.departments.push(newDept);
  }

  return res.status(201).json({ success: true, data: newDept });
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
    params.push(String(req.user.employeeId));
  }

  if (search) {
    const q = `%${String(search).toLowerCase()}%`;
    conditions.push(`(LOWER(e.first_name) LIKE $${params.length + 1} OR LOWER(e.last_name) LIKE $${params.length + 1} OR LOWER(e.email) LIKE $${params.length + 1} OR LOWER(e.job_position) LIKE $${params.length + 1})`);
    params.push(q);
  }

  if (department_id) {
    conditions.push(`e.department_id = $${params.length + 1}`);
    params.push(String(department_id));
  }

  if (status) {
    conditions.push(`e.status = $${params.length + 1}`);
    params.push(String(status));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY e.first_name, e.last_name';

  const result = await query(sql, params);
  let list = result.rows || [];
  if (!list || list.length === 0) {
    list = memoryDb.employees;
  }
  return res.json({ success: true, data: list });
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

  let employee: any = null;
  const empRes = await query(`
    SELECT e.*,
           d.name AS department_name,
           ws.name AS schedule_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
    WHERE e.id = $1
  `, [String(id)]);

  if (empRes.rows && empRes.rows.length > 0) {
    employee = empRes.rows[0];
  } else {
    employee = memoryDb.employees.find((e) => String(e.id) === String(id));
  }

  if (!employee) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  // Fetch linked user account role
  let roleId = 'employee';
  const userAcc = await query(`SELECT role_id FROM users WHERE LOWER(email) = $1 OR employee_id = $2`, [employee.email?.toLowerCase(), String(employee.id)]);
  if (userAcc.rows && userAcc.rows.length > 0) {
    roleId = userAcc.rows[0].role_id;
  } else {
    const memUser = memoryDb.users.find((u) => u.employee_id === employee.id || u.email?.toLowerCase() === employee.email?.toLowerCase());
    if (memUser) roleId = memUser.role_id;
  }

  // Real smart stats from database
  const contractCountRes = await query(
    `SELECT COUNT(*)::int AS count FROM contracts WHERE employee_id = $1`,
    [String(id)]
  );

  const attendanceRes = await query(
    `SELECT COUNT(*)::int AS total, COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END)::int AS complete FROM attendances WHERE employee_id = $1`,
    [String(id)]
  );
  const attData = attendanceRes.rows?.[0] || { total: 0, complete: 0 };
  const attendanceRate = attData.total > 0 ? Math.round((attData.complete / attData.total) * 100) : 100;

  const timeOffRes = await query(
    `SELECT COALESCE(SUM(requested_amount), 0)::float AS days FROM time_off_requests WHERE employee_id = $1 AND status = 'Approved'`,
    [String(id)]
  );

  const allocsRes = await query(
    `SELECT time_off_type_id, allocated FROM time_off_allocations WHERE employee_id = $1`,
    [String(id)]
  );
  const ptoAlloc = allocsRes.rows?.find((a: any) => a.time_off_type_id === 'tot_paid');
  const sickAlloc = allocsRes.rows?.find((a: any) => a.time_off_type_id === 'tot_sick');

  // Fetch active contract salary structure and wage
  const activeContractRes = await query(
    `SELECT c.salary_structure_id, c.wage, s.name as structure_name
     FROM contracts c
     LEFT JOIN salary_structures s ON c.salary_structure_id = s.id
     WHERE c.employee_id = $1 AND c.status = 'running'
     ORDER BY c.start_date DESC LIMIT 1`,
    [String(id)]
  );
  const activeContract = activeContractRes.rows?.[0] || null;

  return res.json({
    success: true,
    data: {
      ...employee,
      role_id: roleId,
      salary_structure_id: activeContract?.salary_structure_id || 'struct_1',
      structure_name: activeContract?.structure_name || 'Standard Monthly Salary',
      wage: activeContract?.wage ? Number(activeContract.wage) : 4500.00,
      pto_days: ptoAlloc ? Number(ptoAlloc.allocated) : 20,
      sick_days: sickAlloc ? Number(sickAlloc.allocated) : 10,
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
    role_id, password, pto_days, sick_days, salary_structure_id, wage
  } = req.body;

  if (!first_name || !last_name || !email || !job_position || !hire_date) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'First name, last name, email, job position, and hire date are required.' },
    });
  }

  const assignedRole = role_id || 'employee';
  const userPassword = password || 'password123';
  const empId = `emp_${Date.now()}`;

  // Check for duplicate email
  const dupCheck = await query('SELECT id FROM employees WHERE LOWER(email) = $1', [email.toLowerCase()]);
  if (dupCheck.rows && dupCheck.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_EMAIL', message: 'An employee with this email already exists.' },
    });
  }

  let newEmp: any = null;
  const result = await query(
    `INSERT INTO employees (id, first_name, last_name, email, phone, job_position, department_id, working_schedule_id, status, hire_date, private_email, bank_account)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11)
     RETURNING *`,
    [empId, first_name, last_name, email, phone || '', job_position,
     department_id || null, working_schedule_id || null, hire_date,
     private_email || '', bank_account_number || '']
  );

  newEmp = result.rows?.[0] || {
    id: empId,
    first_name,
    last_name,
    email,
    phone: phone || '',
    job_position,
    department_id: department_id || null,
    working_schedule_id: working_schedule_id || null,
    status: 'active',
    private_email: private_email || '',
    bank_account: bank_account_number || '',
    hire_date,
    role_id: assignedRole,
  };

  if (!result.rows || result.rows.length === 0) {
    memoryDb.employees.push(newEmp);
  }

  // Create linked running contract with salary structure
  const contractId = `ct_${empId}_1`;
  const contractRef = `CNT-${Date.now()}`;
  const structId = salary_structure_id || 'struct_1';
  const empWage = wage ? Number(wage) : 4500.00;

  await query(
    `INSERT INTO contracts (id, contract_ref, contract_name, employee_id, job_position, wage, start_date, status, working_schedule_id, salary_structure_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'running', $8, $9)
     ON CONFLICT (id) DO NOTHING`,
    [contractId, contractRef, `Employment Contract - ${first_name} ${last_name}`, empId, job_position, empWage, hire_date, working_schedule_id || null, structId]
  );

  // Create linked user account
  const userId = `usr_${Date.now()}`;
  await query(
    `INSERT INTO users (id, email, password_hash, password, role_id, employee_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash, password = EXCLUDED.password, employee_id = EXCLUDED.employee_id`,
    [userId, email.toLowerCase(), userPassword, userPassword, assignedRole, empId]
  );

  // Grant Initial Leave Allocations
  const curYear = new Date().getFullYear();
  const validFrom = `${curYear}-01-01`;
  const validUntil = `${curYear}-12-31`;
  const grantedPto = pto_days !== undefined ? Number(pto_days) : 20;
  const grantedSick = sick_days !== undefined ? Number(sick_days) : 10;

  if (grantedPto >= 0) {
    await query(
      `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
       VALUES ($1, $2, 'tot_paid', $3, 0, $4, $5)
       ON CONFLICT (id) DO UPDATE SET allocated = EXCLUDED.allocated`,
      [`alloc_${empId}_pto`, empId, grantedPto, validFrom, validUntil]
    );
  }

  if (grantedSick >= 0) {
    await query(
      `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
       VALUES ($1, $2, 'tot_sick', $3, 0, $4, $5)
       ON CONFLICT (id) DO UPDATE SET allocated = EXCLUDED.allocated`,
      [`alloc_${empId}_sick`, empId, grantedSick, validFrom, validUntil]
    );
  }

  return res.status(201).json({ success: true, data: { ...newEmp, role_id: assignedRole, salary_structure_id: structId, wage: empWage, pto_days: grantedPto, sick_days: grantedSick } });
});

router.put('/employees/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, job_position,
    department_id, working_schedule_id, status,
    bank_account_number, bank_name, bank_ifsc,
    role_id, password, pto_days, sick_days, salary_structure_id, wage
  } = req.body;

  let updatedEmp: any = null;
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
       bank_account = COALESCE($9, bank_account),
       updated_at = NOW()
     WHERE id = $10 RETURNING *`,
    [first_name, last_name, email, phone, job_position,
     department_id || null, working_schedule_id || null, status,
     bank_account_number, String(id)]
  );

  if (result.rows && result.rows.length > 0) {
    updatedEmp = result.rows[0];
  } else {
    const empIdx = memoryDb.employees.findIndex((e) => String(e.id) === String(id));
    if (empIdx >= 0) {
      const emp = memoryDb.employees[empIdx];
      if (first_name) emp.first_name = first_name;
      if (last_name) emp.last_name = last_name;
      if (email) emp.email = email;
      if (phone) emp.phone = phone;
      if (job_position) emp.job_position = job_position;
      if (department_id) emp.department_id = department_id;
      if (working_schedule_id) emp.working_schedule_id = working_schedule_id;
      if (status) emp.status = status;
      if (bank_account_number) emp.bank_account = bank_account_number;
      updatedEmp = emp;
    }
  }

  if (!updatedEmp) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  // Update active contract salary structure and wage
  if (salary_structure_id || wage) {
    const activeContract = await query(
      `SELECT id FROM contracts WHERE employee_id = $1 AND status = 'running' ORDER BY start_date DESC LIMIT 1`,
      [String(id)]
    );

    if (activeContract.rows && activeContract.rows.length > 0) {
      await query(
        `UPDATE contracts SET
           salary_structure_id = COALESCE($1, salary_structure_id),
           wage = COALESCE($2, wage),
           job_position = COALESCE($3, job_position),
           updated_at = NOW()
         WHERE id = $4`,
        [salary_structure_id || null, wage ? Number(wage) : null, job_position || null, activeContract.rows[0].id]
      );
    } else {
      const contractId = `ct_${id}_1`;
      const contractRef = `CNT-${Date.now()}`;
      await query(
        `INSERT INTO contracts (id, contract_ref, contract_name, employee_id, job_position, wage, start_date, status, salary_structure_id)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'running', $7)
         ON CONFLICT (id) DO NOTHING`,
        [contractId, contractRef, `Employment Contract - ${updatedEmp.first_name} ${updatedEmp.last_name}`, String(id), updatedEmp.job_position || 'Staff', wage ? Number(wage) : 4500.00, salary_structure_id || 'struct_1']
      );
    }
  }

  if (password) {
    await query(
      `UPDATE users SET role_id = COALESCE($1, role_id), password_hash = $2, password = $2 WHERE employee_id = $3 OR LOWER(email) = $4`,
      [role_id || null, password, String(id), (email || updatedEmp.email).toLowerCase()]
    );
  } else if (role_id) {
    await query(
      `UPDATE users SET role_id = $1 WHERE employee_id = $2 OR LOWER(email) = $3`,
      [role_id, String(id), (email || updatedEmp.email).toLowerCase()]
    );
  }

  // Update Leave Allocations if provided
  const curYear = new Date().getFullYear();
  const validFrom = `${curYear}-01-01`;
  const validUntil = `${curYear}-12-31`;

  if (pto_days !== undefined) {
    await query(
      `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
       VALUES ($1, $2, 'tot_paid', $3, 0, $4, $5)
       ON CONFLICT (id) DO UPDATE SET allocated = EXCLUDED.allocated`,
      [`alloc_${id}_pto`, String(id), Number(pto_days), validFrom, validUntil]
    );
  }

  if (sick_days !== undefined) {
    await query(
      `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
       VALUES ($1, $2, 'tot_sick', $3, 0, $4, $5)
       ON CONFLICT (id) DO UPDATE SET allocated = EXCLUDED.allocated`,
      [`alloc_${id}_sick`, String(id), Number(sick_days), validFrom, validUntil]
    );
  }

  return res.json({ success: true, data: { ...updatedEmp, role_id: role_id || 'employee', salary_structure_id, wage } });
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
    params.push(String(employee_id));
  }
  if (status) {
    conditions.push(`c.status = $${params.length + 1}`);
    params.push(String(status));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY c.start_date DESC';

  const result = await query(sql, params);
  let contracts = result.rows || [];
  if (!contracts || contracts.length === 0) {
    contracts = memoryDb.contracts;
  }
  return res.json({ success: true, data: contracts });
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
    [String(employee_id), start_date, end_date || '9999-12-31']
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

  const contractId = `ct_${Date.now()}`;
  const contractRef = `CNT-${Date.now()}`;

  const result = await query(
    `INSERT INTO contracts (id, contract_ref, contract_name, employee_id, job_position, wage, start_date, end_date, working_schedule_id, salary_structure_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'running')
     RETURNING *`,
    [contractId, contractRef, contract_name || 'Employment Contract', String(employee_id),
     job_position || 'Staff', Number(wage), start_date, end_date || null,
     working_schedule_id ? String(working_schedule_id) : null,
     salary_structure_id ? String(salary_structure_id) : null]
  );

  const newContract = result.rows?.[0] || {
    id: contractId, contract_ref: contractRef, contract_name: contract_name || 'Employment Contract',
    employee_id: String(employee_id), job_position: job_position || 'Staff', wage: Number(wage),
    start_date, end_date: end_date || null, status: 'running'
  };

  if (!result.rows || result.rows.length === 0) {
    memoryDb.contracts.push(newContract);
  }

  return res.status(201).json({ success: true, data: newContract });
});

router.put('/contracts/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const { contract_name, job_position, wage, start_date, end_date, status, working_schedule_id, salary_structure_id } = req.body;

  const existingRes = await query('SELECT * FROM contracts WHERE id = $1', [String(id)]);
  let existing = existingRes.rows?.[0] || memoryDb.contracts.find((c) => String(c.id) === String(id));
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Contract not found.' } });
  }

  const newStartDate = start_date || existing.start_date;
  const newEndDate = end_date !== undefined ? end_date : existing.end_date;
  const newStatus = status || existing.status;

  if (newStatus === 'running') {
    const overlapRes = await query(
      `SELECT id, contract_name, start_date, end_date FROM contracts
       WHERE employee_id = $1 AND status = 'running' AND id != $2
         AND start_date <= $4 AND (end_date IS NULL OR end_date >= $3)`,
      [existing.employee_id, String(id), newStartDate, newEndDate || '9999-12-31']
    );

    if (overlapRes.rows && overlapRes.rows.length > 0) {
      const conflict = overlapRes.rows[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'OVERLAPPING_ACTIVE_CONTRACT',
          message: `Validation Error: Employee already has an active running contract (${conflict.contract_name}) covering the requested period. End the existing contract first.`,
        },
      });
    }
  }

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
     working_schedule_id ? String(working_schedule_id) : null,
     salary_structure_id ? String(salary_structure_id) : null,
     String(id)]
  );

  let updated = result.rows?.[0];
  if (!updated) {
    const cIdx = memoryDb.contracts.findIndex((c) => String(c.id) === String(id));
    if (cIdx >= 0) {
      if (contract_name) memoryDb.contracts[cIdx].contract_name = contract_name;
      if (wage) memoryDb.contracts[cIdx].wage = Number(wage);
      if (status) memoryDb.contracts[cIdx].status = status;
      updated = memoryDb.contracts[cIdx];
    }
  }

  return res.json({ success: true, data: updated });
});

// ==========================================
// 5. WORKING SCHEDULES (Module A3) — Auto-Computed Weekly Hours
// ==========================================

router.get('/schedules', authMiddleware, async (req, res) => {
  const schedRes = await query('SELECT * FROM working_schedules ORDER BY name');
  let schedules = schedRes.rows || [];

  if (!schedules || schedules.length === 0) {
    schedules = memoryDb.schedules;
  } else {
    for (const sched of schedules) {
      const daysRes = await query(
        `SELECT * FROM working_schedule_days WHERE schedule_id = $1 ORDER BY day_of_week`,
        [sched.id]
      );
      sched.days = daysRes.rows || [];
      sched.total_hours_per_week = sched.days.reduce((sum: number, d: any) => sum + (Number(d.computed_hours) || 0), 0);
    }
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

  const schedId = `sched_${Date.now()}`;
  let totalWeekHours = 0;
  const processedDays: any[] = [];

  for (const day of days) {
    const [sH, sM] = String(day.start_time || '09:00').split(':').map(Number);
    const [eH, eM] = String(day.end_time || '17:00').split(':').map(Number);
    const gross = (eH + eM / 60) - (sH + sM / 60);
    const computed_hours = Math.max(0, gross - (Number(day.break_hours) || 0));
    totalWeekHours += computed_hours;
    processedDays.push({ ...day, computed_hours });
  }

  const schedRes = await query(
    `INSERT INTO working_schedules (id, name, total_hours_per_week) VALUES ($1, $2, $3) RETURNING *`,
    [schedId, name, totalWeekHours]
  );

  let schedule = schedRes.rows?.[0];
  const insertedDays: any[] = [];

  if (schedule) {
    for (let i = 0; i < processedDays.length; i++) {
      const d = processedDays[i];
      const dayId = `wsd_${Date.now()}_${i}`;
      const dayRes = await query(
        `INSERT INTO working_schedule_days (id, schedule_id, day_of_week, start_time, end_time, break_hours, computed_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [dayId, schedId, d.day_of_week, d.start_time, d.end_time, Number(d.break_hours) || 0, d.computed_hours]
      );
      if (dayRes.rows?.[0]) {
        insertedDays.push(dayRes.rows[0]);
      }
    }
  } else {
    schedule = { id: schedId, name, total_hours_per_week: totalWeekHours, days: processedDays };
    memoryDb.schedules.push(schedule);
  }

  return res.status(201).json({
    success: true,
    data: { ...schedule, days: insertedDays.length > 0 ? insertedDays : processedDays, total_hours_per_week: totalWeekHours },
  });
});

export default router;
