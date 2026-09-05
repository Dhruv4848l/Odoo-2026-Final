import { Router, Response } from 'express';
import { memoryDb } from '../../core/db.js';
import { generateToken, authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

const router = Router();

// ==========================================
// 1. AUTHENTICATION MODULE (Module 0)
// ==========================================

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' },
    });
  }

  const user = memoryDb.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  const role = memoryDb.roles.find((r) => r.id === user.role_id);
  const employee = memoryDb.employees.find((e) => e.id === user.employee_id);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.role_id,
    employeeId: user.employee_id,
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: role || { id: user.role_id, name: user.role_id },
        employee: employee || null,
      },
    },
  });
});

router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = memoryDb.users.find((u) => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }

  const role = memoryDb.roles.find((r) => r.id === user.role_id);
  const employee = memoryDb.employees.find((e) => e.id === user.employee_id);

  return res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: role || { id: user.role_id, name: user.role_id },
      employee: employee || null,
    },
  });
});

// Get all roles
router.get('/roles', (req, res) => {
  return res.json({ success: true, data: memoryDb.roles });
});

// ==========================================
// 2. DEPARTMENTS
// ==========================================

router.get('/departments', authMiddleware, (req, res) => {
  return res.json({ success: true, data: memoryDb.departments });
});

router.post('/departments', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { name, code } = req.body;
  const newDept = {
    id: `dept_${Date.now()}`,
    name,
    code: code || name.substring(0, 4).toUpperCase(),
    manager_id: null,
  };
  memoryDb.departments.push(newDept);
  return res.status(201).json({ success: true, data: newDept });
});

// ==========================================
// 3. EMPLOYEES (Module A1 / B1 / B2)
// ==========================================

router.get('/employees', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { search, department_id, status } = req.query;

  // RBAC Filter: Plain employee can only see own profile unless allowed
  let list = memoryDb.employees;
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    list = list.filter((e) => e.id === req.user?.employeeId);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.job_position.toLowerCase().includes(q)
    );
  }

  if (department_id) {
    list = list.filter((e) => e.department_id === department_id);
  }

  if (status) {
    list = list.filter((e) => e.status === status);
  }

  // Enrich with department and schedule info
  const enriched = list.map((e) => ({
    ...e,
    department: memoryDb.departments.find((d) => d.id === e.department_id) || null,
    schedule: memoryDb.schedules.find((s) => s.id === e.working_schedule_id) || null,
  }));

  return res.json({ success: true, data: enriched });
});

router.get('/employees/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // RBAC Enforcement: Employee cannot view other employees' profiles
  if (req.user?.roleId === 'employee' && req.user.employeeId !== id) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You are only authorized to view your own profile.' },
    });
  }

  const employee = memoryDb.employees.find((e) => e.id === id);
  if (!employee) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  const empContracts = memoryDb.contracts.filter((c) => c.employee_id === id);
  const dept = memoryDb.departments.find((d) => d.id === employee.department_id);
  const schedule = memoryDb.schedules.find((s) => s.id === employee.working_schedule_id);

  return res.json({
    success: true,
    data: {
      ...employee,
      department: dept || null,
      schedule: schedule || null,
      smart_stats: {
        contracts_count: empContracts.length,
        attendance_rate: '96%',
        time_off_days: 3,
      },
    },
  });
});

router.post('/employees', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    job_position,
    department_id,
    working_schedule_id,
    private_email,
    bank_account,
    hire_date,
  } = req.body;

  if (!first_name || !last_name || !email || !job_position || !hire_date) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'First name, last name, email, job position, and hire date are required.' },
    });
  }

  const existing = memoryDb.employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_EMAIL', message: 'An employee with this email already exists.' },
    });
  }

  const newEmployee = {
    id: `emp_${Date.now()}`,
    first_name,
    last_name,
    email,
    phone: phone || '',
    job_position,
    department_id: department_id || null,
    manager_id: null,
    working_schedule_id: working_schedule_id || 'sched_std_40h',
    status: 'active',
    private_email: private_email || email,
    bank_account: bank_account || '',
    hire_date,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${first_name}`,
  };

  memoryDb.employees.push(newEmployee);
  return res.status(201).json({ success: true, data: newEmployee });
});

router.put('/employees/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { id } = req.params;
  const index = memoryDb.employees.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found.' } });
  }

  memoryDb.employees[index] = {
    ...memoryDb.employees[index],
    ...req.body,
  };

  return res.json({ success: true, data: memoryDb.employees[index] });
});

// ==========================================
// 4. CONTRACTS (Module A2) — Overlap Validation
// ==========================================

router.get('/contracts', authMiddleware, (req, res) => {
  const { employee_id, status } = req.query;
  let list = memoryDb.contracts;

  if (employee_id) {
    list = list.filter((c) => c.employee_id === employee_id);
  }
  if (status) {
    list = list.filter((c) => c.status === status);
  }

  const enriched = list.map((c) => ({
    ...c,
    employee: memoryDb.employees.find((e) => e.id === c.employee_id) || null,
  }));

  return res.json({ success: true, data: enriched });
});

router.post('/contracts', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { employee_id, job_position, wage, start_date, end_date, working_schedule_id, notes } = req.body;

  if (!employee_id || !wage || !start_date) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, wage, and start date are required.' },
    });
  }

  // CRITICAL VALIDATION: Overlapping active/running contracts check
  const activeContracts = memoryDb.contracts.filter(
    (c) => c.employee_id === employee_id && c.status === 'running'
  );

  const newStart = new Date(start_date).getTime();
  const newEnd = end_date ? new Date(end_date).getTime() : Infinity;

  for (const existing of activeContracts) {
    const exStart = new Date(existing.start_date).getTime();
    const exEnd = existing.end_date ? new Date(existing.end_date).getTime() : Infinity;

    // Check overlap: (StartA <= EndB) and (EndA >= StartB)
    if (newStart <= exEnd && newEnd >= exStart) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OVERLAPPING_ACTIVE_CONTRACT',
          message: `Validation Error: Employee already has an active running contract (${existing.contract_ref}) covering the requested period. End the existing contract first before starting a new active contract.`,
        },
      });
    }
  }

  const newContract = {
    id: `ct_${Date.now()}`,
    contract_ref: `CNT-2026-0${memoryDb.contracts.length + 1}`,
    employee_id,
    job_position: job_position || 'Staff',
    wage: Number(wage),
    start_date,
    end_date: end_date || null,
    status: 'running',
    working_schedule_id: working_schedule_id || 'sched_std_40h',
    notes: notes || '',
  };

  memoryDb.contracts.push(newContract);
  return res.status(201).json({ success: true, data: newContract });
});

router.put('/contracts/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { id } = req.params;
  const index = memoryDb.contracts.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Contract not found.' } });
  }

  memoryDb.contracts[index] = {
    ...memoryDb.contracts[index],
    ...req.body,
  };

  return res.json({ success: true, data: memoryDb.contracts[index] });
});

// ==========================================
// 5. WORKING SCHEDULES (Module A3) — Auto-Computed Weekly Hours
// ==========================================

router.get('/schedules', authMiddleware, (req, res) => {
  return res.json({ success: true, data: memoryDb.schedules });
});

router.post('/schedules', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { name, days } = req.body;
  if (!name || !days || !Array.isArray(days)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SCHEDULE', message: 'Schedule name and working days array are required.' },
    });
  }

  // Calculate computed hours for each day and total for the week
  let totalWeekHours = 0;
  const processedDays = days.map((day: any) => {
    const [startH, startM] = day.start_time.split(':').map(Number);
    const [endH, endM] = day.end_time.split(':').map(Number);
    const grossHours = endH + endM / 60 - (startH + startM / 60);
    const computedHours = Math.max(0, grossHours - (Number(day.break_hours) || 0));
    totalWeekHours += computedHours;

    return {
      day_of_week: day.day_of_week,
      start_time: day.start_time,
      end_time: day.end_time,
      break_hours: Number(day.break_hours) || 0,
      computed_hours: computedHours,
    };
  });

  const newSchedule = {
    id: `sched_${Date.now()}`,
    name,
    total_hours_per_week: totalWeekHours,
    days: processedDays,
  };

  memoryDb.schedules.push(newSchedule);
  return res.status(201).json({ success: true, data: newSchedule });
});

export default router;
