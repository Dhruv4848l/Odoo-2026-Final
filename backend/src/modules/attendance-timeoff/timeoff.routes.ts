import { Router, Response } from 'express';
import { query } from '../../core/db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';
import { broadcastEvent } from '../../core/websocket.js';

const router = Router();

// ======================================================================
// 1. TIME OFF TYPES (Module A4 / B4)
// ======================================================================

router.get('/types', authMiddleware, async (req, res) => {
  const result = await query('SELECT * FROM time_off_types ORDER BY name');
  return res.json({ success: true, data: result.rows || [] });
});

router.post('/types', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { name, unit, requires_allocation, approval_workflow, is_paid, display_color } = req.body;

  if (!name || !unit) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Name and unit (Days/Hours) are required for time off type.' },
    });
  }

  const typeId = `tot_${Date.now()}`;
  const result = await query(
    `INSERT INTO time_off_types (id, name, unit, requires_allocation, approval_workflow, is_paid, display_color)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [typeId, name, unit || 'Days',
     requires_allocation !== undefined ? Boolean(requires_allocation) : true,
     approval_workflow || 'by_hr',
     is_paid !== undefined ? Boolean(is_paid) : true,
     display_color || '#5B4FE9']
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

router.put('/types/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const { name, unit, requires_allocation, approval_workflow, is_paid, display_color } = req.body;

  const result = await query(
    `UPDATE time_off_types SET
       name = COALESCE($1, name),
       unit = COALESCE($2, unit),
       requires_allocation = COALESCE($3, requires_allocation),
       approval_workflow = COALESCE($4, approval_workflow),
       is_paid = COALESCE($5, is_paid),
       display_color = COALESCE($6, display_color)
     WHERE id = $7 RETURNING *`,
    [name, unit, requires_allocation, approval_workflow, is_paid, display_color, String(id)]
  );

  if (!result.rows || result.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Time off type not found.' } });
  }

  return res.json({ success: true, data: result.rows[0] });
});

// ======================================================================
// 2. TIME OFF ALLOCATIONS (Module A4 / B4)
// ======================================================================

router.get('/allocations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, time_off_type_id } = req.query;

  let sql = `
    SELECT a.*,
           e.first_name, e.last_name,
           t.name AS type_name, t.display_color, t.unit AS time_off_unit,
           CASE WHEN a.valid_until < CURRENT_DATE THEN 0 ELSE GREATEST(0, a.allocated - a.taken) END AS remaining,
           CASE WHEN a.valid_until < CURRENT_DATE THEN true ELSE false END AS is_expired
    FROM time_off_allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN time_off_types t ON a.time_off_type_id = t.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(String(req.user.employeeId));
  } else if (employee_id) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(String(employee_id));
  }

  if (time_off_type_id) {
    conditions.push(`a.time_off_type_id = $${params.length + 1}`);
    params.push(String(time_off_type_id));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY a.valid_from DESC';

  const result = await query(sql, params);

  const formatted = (result.rows || []).map((row: any) => ({
    ...row,
    employee: { first_name: row.first_name, last_name: row.last_name },
    time_off_type: { name: row.type_name, display_color: row.display_color, unit: row.time_off_unit },
  }));

  return res.json({ success: true, data: formatted });
});

router.get('/allocations/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const empId = await resolveEmployeeId(req.user);

  if (!empId) {
    return res.json({ success: true, data: [] });
  }

  const result = await query(`
    SELECT a.*,
           t.name AS type_name, t.display_color, t.unit AS time_off_unit,
           CASE WHEN a.valid_until < CURRENT_DATE THEN 0 ELSE GREATEST(0, a.allocated - a.taken) END AS remaining,
           CASE WHEN a.valid_until < CURRENT_DATE THEN true ELSE false END AS is_expired
    FROM time_off_allocations a
    JOIN time_off_types t ON a.time_off_type_id = t.id
    WHERE a.employee_id = $1
    ORDER BY a.valid_from DESC
  `, [String(empId)]);

  const formatted = (result.rows || []).map((row: any) => ({
    ...row,
    time_off_type: { name: row.type_name, display_color: row.display_color, unit: row.time_off_unit },
  }));

  return res.json({ success: true, data: formatted });
});

router.post('/allocations', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { employee_id, time_off_type_id, allocated, valid_from, valid_until } = req.body;

  if (!employee_id || !time_off_type_id || allocated === undefined || !valid_from || !valid_until) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, time off type, allocated amount, valid_from and valid_until are required.' },
    });
  }

  const allocId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const result = await query(
    `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
     VALUES ($1, $2, $3, $4, 0, $5, $6) RETURNING *`,
    [allocId, String(employee_id), String(time_off_type_id), Number(allocated), valid_from, valid_until]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

router.put('/allocations/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { id } = req.params;
  const { allocated, valid_from, valid_until } = req.body;

  const result = await query(
    `UPDATE time_off_allocations SET
       allocated = COALESCE($1, allocated),
       valid_from = COALESCE($2, valid_from),
       valid_until = COALESCE($3, valid_until)
     WHERE id = $4 RETURNING *`,
    [allocated !== undefined ? Number(allocated) : null, valid_from, valid_until, String(id)]
  );

  if (!result.rows || result.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Allocation not found.' } });
  }

  return res.json({ success: true, data: result.rows[0] });
});

// ======================================================================
// 3. TIME OFF REQUESTS (Module A4 / B4) — Balance & Overlap Enforcement
// ======================================================================

router.get('/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, status } = req.query;

  let sql = `
    SELECT r.*,
           e.first_name, e.last_name,
           t.name AS type_name, t.display_color, t.unit AS time_off_unit,
           ap.first_name AS approver_first_name, ap.last_name AS approver_last_name
    FROM time_off_requests r
    JOIN employees e ON r.employee_id = e.id
    JOIN time_off_types t ON r.time_off_type_id = t.id
    LEFT JOIN employees ap ON r.approved_by = ap.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    conditions.push(`r.employee_id = $${params.length + 1}`);
    params.push(String(req.user.employeeId));
  } else if (employee_id) {
    conditions.push(`r.employee_id = $${params.length + 1}`);
    params.push(String(employee_id));
  }

  if (status) {
    conditions.push(`r.status = $${params.length + 1}`);
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY r.created_at DESC';

  const result = await query(sql, params);

  const formatted = (result.rows || []).map((row: any) => ({
    ...row,
    employee: { first_name: row.first_name, last_name: row.last_name },
    time_off_type: { name: row.type_name, display_color: row.display_color, unit: row.time_off_unit },
    approved_by_user: row.approver_first_name ? { first_name: row.approver_first_name, last_name: row.approver_last_name } : null,
  }));

  return res.json({ success: true, data: formatted });
});

// Helper function to resolve an ID (employee_id or user_id) to a valid employee.id
async function resolveEmployeeId(user: any, reqBodyEmpId?: string): Promise<string | null> {
  if (reqBodyEmpId) {
    const directCheck = await query('SELECT id FROM employees WHERE id = $1', [String(reqBodyEmpId)]);
    if (directCheck.rows && directCheck.rows.length > 0) {
      return directCheck.rows[0].id;
    }
    const userCheck = await query('SELECT employee_id, email FROM users WHERE id = $1', [String(reqBodyEmpId)]);
    if (userCheck.rows && userCheck.rows.length > 0) {
      const u = userCheck.rows[0];
      if (u.employee_id) {
        const empCheck = await query('SELECT id FROM employees WHERE id = $1', [u.employee_id]);
        if (empCheck.rows && empCheck.rows.length > 0) return empCheck.rows[0].id;
      }
      if (u.email) {
        const empByEmail = await query('SELECT id FROM employees WHERE LOWER(email) = $1', [u.email.toLowerCase()]);
        if (empByEmail.rows && empByEmail.rows.length > 0) return empByEmail.rows[0].id;
      }
    }
  }

  if (user?.employeeId) {
    const empCheck = await query('SELECT id FROM employees WHERE id = $1', [String(user.employeeId)]);
    if (empCheck.rows && empCheck.rows.length > 0) return empCheck.rows[0].id;
  }

  if (user?.email) {
    const empByEmail = await query('SELECT id FROM employees WHERE LOWER(email) = $1', [user.email.toLowerCase()]);
    if (empByEmail.rows && empByEmail.rows.length > 0) return empByEmail.rows[0].id;

    // Auto-create missing employee record for user
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [user.email.toLowerCase()]);
    const usrObj = userRes.rows?.[0];
    const newEmpId = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const firstName = user.email.split('@')[0];
    await query(
      `INSERT INTO employees (id, first_name, last_name, email, phone, job_position, status, hire_date)
       VALUES ($1, $2, 'User', $3, '', 'Staff', 'active', CURRENT_DATE)
       ON CONFLICT (email) DO NOTHING`,
      [newEmpId, firstName, user.email.toLowerCase()]
    );
    if (usrObj) {
      await query('UPDATE users SET employee_id = $1 WHERE id = $2', [newEmpId, usrObj.id]);
    }
    const finalEmp = await query('SELECT id FROM employees WHERE LOWER(email) = $1', [user.email.toLowerCase()]);
    if (finalEmp.rows && finalEmp.rows.length > 0) return finalEmp.rows[0].id;
  }

  return null;
}

router.post('/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { time_off_type_id, start_date, end_date, requested_amount } = req.body;
  const employee_id = await resolveEmployeeId(req.user, req.body.employee_id);

  if (!employee_id || !time_off_type_id || !start_date || !end_date || requested_amount === undefined) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, time off type, start_date, end_date, and requested_amount are required.' },
    });
  }

  const reqAmount = Number(requested_amount);
  if (reqAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Requested amount must be greater than 0.' },
    });
  }

  // Get the time off type
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [String(time_off_type_id)]);
  const type = typeRes.rows?.[0];
  if (!type) {
    return res.status(404).json({ success: false, error: { message: 'Time off type not found.' } });
  }

  // -------------------------------------------------------------------
  // VALIDATION 1: Insufficient Leave Balance check (if allocation required)
  // -------------------------------------------------------------------
  if (type.requires_allocation) {
    const reqYear = start_date ? new Date(start_date).getFullYear() : new Date().getFullYear();
    // Check if employee has an allocation record; if not, auto-grant default allocation
    const allocCheck = await query(
      `SELECT id FROM time_off_allocations WHERE employee_id = $1 AND time_off_type_id = $2`,
      [String(employee_id), String(time_off_type_id)]
    );

    if (!allocCheck.rows || allocCheck.rows.length === 0) {
      const defaultDays = type.id === 'tot_paid' ? 20 : (type.id === 'tot_sick' ? 10 : 15);
      const allocId = `alloc_${employee_id}_${type.id}_${reqYear}`;
      await query(
        `INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
         VALUES ($1, $2, $3, $4, 0, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [allocId, String(employee_id), String(time_off_type_id), defaultDays, `${reqYear}-01-01`, `${reqYear}-12-31`]
      );
    }

    const balanceRes = await query(
      `SELECT COALESCE(SUM(allocated - taken), 0)::float AS total_remaining
       FROM time_off_allocations
       WHERE employee_id = $1 AND time_off_type_id = $2
         AND valid_until >= $3`,
      [String(employee_id), String(time_off_type_id), start_date]
    );

    const totalRemaining = balanceRes.rows?.[0]?.total_remaining || 0;

    if (totalRemaining < reqAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_LEAVE_BALANCE',
          message: `Validation Error: Insufficient leave balance for ${type.name}. Requested: ${reqAmount} ${type.unit}, Available: ${totalRemaining} ${type.unit}. Leave balance must never go negative.`,
        },
      });
    }
  }

  // -------------------------------------------------------------------
  // VALIDATION 2: Overlapping Leave Requests check
  // -------------------------------------------------------------------
  const overlapRes = await query(
    `SELECT id, start_date, end_date FROM time_off_requests
     WHERE employee_id = $1 AND status != 'Refused'
       AND start_date <= $3 AND end_date >= $2`,
    [String(employee_id), start_date, end_date]
  );

  if (overlapRes.rows && overlapRes.rows.length > 0) {
    const existing = overlapRes.rows[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'OVERLAPPING_LEAVE_REQUEST',
        message: `Validation Error: You already have an active leave request (${existing.start_date} to ${existing.end_date}) covering these dates.`,
      },
    });
  }

  const reqId = `tor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const result = await query(
    `INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, requested_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
    [reqId, String(employee_id), String(time_off_type_id), start_date, end_date, reqAmount]
  );

  broadcastEvent({
    type: 'TIMEOFF_UPDATE',
    action: 'REQUEST_SUBMITTED',
    payload: result.rows?.[0],
    notification: {
      title: 'New Leave Request',
      message: `${type?.name || 'Leave'} request for ${reqAmount} day(s) submitted for approval`,
      type: 'info',
    },
  });

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// POST /requests/:id/approve — Approve Request & Deduct Balance
// ----------------------------------------------------------------------
router.post('/requests/:id/approve', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const reqRes = await query('SELECT * FROM time_off_requests WHERE id = $1', [String(id)]);
  if (!reqRes.rows || reqRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = reqRes.rows[0];

  // Get leave type to check if allocation required
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [String(request.time_off_type_id)]);
  const type = typeRes.rows?.[0];

  // Deduct from allocation if required and not already approved
  if (request.status !== 'Approved' && type?.requires_allocation) {
    await query(
      `UPDATE time_off_allocations SET taken = taken + $1
       WHERE employee_id = $2 AND time_off_type_id = $3`,
      [Number(request.requested_amount), String(request.employee_id), String(request.time_off_type_id)]
    );
  }

  const approverId = req.user?.employeeId ? String(req.user.employeeId) : null;
  const result = await query(
    `UPDATE time_off_requests SET status = 'Approved', approved_by = $1
     WHERE id = $2 RETURNING *`,
    [approverId, String(id)]
  );

  broadcastEvent({
    type: 'TIMEOFF_UPDATE',
    action: 'REQUEST_APPROVED',
    payload: result.rows?.[0],
    notification: {
      title: 'Leave Approved',
      message: `Leave request (${request.start_date} to ${request.end_date}) approved`,
      type: 'success',
    },
  });

  return res.json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// POST /requests/:id/refuse — Refuse Request
// ----------------------------------------------------------------------
router.post('/requests/:id/refuse', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const reqRes = await query('SELECT * FROM time_off_requests WHERE id = $1', [String(id)]);
  if (!reqRes.rows || reqRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = reqRes.rows[0];
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [String(request.time_off_type_id)]);
  const type = typeRes.rows?.[0];

  // Revert allocation deduction if it was previously approved
  if (request.status === 'Approved' && type?.requires_allocation) {
    await query(
      `UPDATE time_off_allocations SET taken = GREATEST(0, taken - $1)
       WHERE employee_id = $2 AND time_off_type_id = $3`,
      [Number(request.requested_amount), String(request.employee_id), String(request.time_off_type_id)]
    );
  }

  const approverId = req.user?.employeeId ? String(req.user.employeeId) : null;
  const result = await query(
    `UPDATE time_off_requests SET status = 'Refused', approved_by = $1
     WHERE id = $2 RETURNING *`,
    [approverId, String(id)]
  );

  broadcastEvent({
    type: 'TIMEOFF_UPDATE',
    action: 'REQUEST_REFUSED',
    payload: result.rows?.[0],
    notification: {
      title: 'Leave Refused',
      message: `Leave request (${request.start_date} to ${request.end_date}) refused`,
      type: 'warning',
    },
  });

  return res.json({ success: true, data: result.rows?.[0] });
});

export default router;
