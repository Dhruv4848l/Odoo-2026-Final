import { Router, Response } from 'express';
import { query } from '../../core/db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

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

  const result = await query(
    `INSERT INTO time_off_types (name, unit, requires_allocation, approval_workflow, is_paid, display_color)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, unit || 'Days',
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
       display_color = COALESCE($6, display_color),
       updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [name, unit, requires_allocation, approval_workflow, is_paid, display_color, Number(id)]
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
           t.name AS type_name, t.display_color,
           CASE WHEN a.valid_until < CURRENT_DATE THEN 0 ELSE GREATEST(0, a.allocated - a.taken) END AS remaining,
           CASE WHEN a.valid_until < CURRENT_DATE THEN true ELSE false END AS is_expired
    FROM time_off_allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN time_off_types t ON a.time_off_type_id = t.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  // Plain employee RBAC check
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(Number(req.user.employeeId));
  } else if (employee_id) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(Number(employee_id));
  }

  if (time_off_type_id) {
    conditions.push(`a.time_off_type_id = $${params.length + 1}`);
    params.push(Number(time_off_type_id));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY a.valid_from DESC';

  const result = await query(sql, params);
  return res.json({ success: true, data: result.rows || [] });
});

router.get('/allocations/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const empId = req.user?.employeeId;
  if (!empId) {
    return res.json({ success: true, data: [] });
  }

  const result = await query(`
    SELECT a.*,
           t.name AS type_name, t.display_color,
           CASE WHEN a.valid_until < CURRENT_DATE THEN 0 ELSE GREATEST(0, a.allocated - a.taken) END AS remaining,
           CASE WHEN a.valid_until < CURRENT_DATE THEN true ELSE false END AS is_expired
    FROM time_off_allocations a
    JOIN time_off_types t ON a.time_off_type_id = t.id
    WHERE a.employee_id = $1
    ORDER BY a.valid_from DESC
  `, [Number(empId)]);

  return res.json({ success: true, data: result.rows || [] });
});

router.post('/allocations', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req, res) => {
  const { employee_id, time_off_type_id, allocated, valid_from, valid_until } = req.body;

  if (!employee_id || !time_off_type_id || !allocated || !valid_from || !valid_until) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, time off type, allocated amount, valid_from and valid_until are required.' },
    });
  }

  const result = await query(
    `INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
     VALUES ($1, $2, $3, 0, $4, $5) RETURNING *`,
    [Number(employee_id), Number(time_off_type_id), Number(allocated), valid_from, valid_until]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ======================================================================
// 3. TIME OFF REQUESTS (Module A4 / B4) — Balance & Overlap Enforcement
// ======================================================================

router.get('/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, status } = req.query;

  let sql = `
    SELECT r.*,
           e.first_name, e.last_name,
           t.name AS type_name, t.display_color,
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
    params.push(Number(req.user.employeeId));
  } else if (employee_id) {
    conditions.push(`r.employee_id = $${params.length + 1}`);
    params.push(Number(employee_id));
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
  return res.json({ success: true, data: result.rows || [] });
});

router.post('/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const employee_id = (req.user?.roleId === 'employee' && req.user.employeeId) ? req.user.employeeId : req.body.employee_id;
  const { time_off_type_id, start_date, end_date, requested_amount } = req.body;

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
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [Number(time_off_type_id)]);
  const type = typeRes.rows?.[0];
  if (!type) {
    return res.status(404).json({ success: false, error: { message: 'Time off type not found.' } });
  }

  // -------------------------------------------------------------------
  // VALIDATION 1: Insufficient Leave Balance check (if allocation required)
  // -------------------------------------------------------------------
  if (type.requires_allocation) {
    const balanceRes = await query(
      `SELECT COALESCE(SUM(allocated - taken), 0)::float AS total_remaining
       FROM time_off_allocations
       WHERE employee_id = $1 AND time_off_type_id = $2
         AND valid_from <= $3 AND valid_until >= $4`,
      [Number(employee_id), Number(time_off_type_id), start_date, end_date]
    );

    const totalRemaining = balanceRes.rows?.[0]?.total_remaining || 0;

    if (totalRemaining < reqAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_LEAVE_BALANCE',
          message: `Validation Error: Insufficient leave balance for ${type.name}. Requested: ${reqAmount} ${type.unit}, Available: ${totalRemaining} ${type.unit}. Leave balance must never go silently negative.`,
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
    [Number(employee_id), start_date, end_date]
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

  const result = await query(
    `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, requested_amount, status)
     VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
    [Number(employee_id), Number(time_off_type_id), start_date, end_date, reqAmount]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// POST /requests/:id/approve — Approve Request & Deduct Balance
// ----------------------------------------------------------------------
router.post('/requests/:id/approve', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const reqRes = await query('SELECT * FROM time_off_requests WHERE id = $1', [Number(id)]);
  if (!reqRes.rows || reqRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = reqRes.rows[0];

  // Get leave type to check if allocation required
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [request.time_off_type_id]);
  const type = typeRes.rows?.[0];

  // Deduct from allocation if required and not already approved
  if (request.status !== 'Approved' && type?.requires_allocation) {
    await query(
      `UPDATE time_off_allocations SET taken = taken + $1, updated_at = NOW()
       WHERE employee_id = $2 AND time_off_type_id = $3
         AND valid_from <= $4 AND valid_until >= $5`,
      [Number(request.requested_amount), request.employee_id, request.time_off_type_id,
       request.start_date, request.end_date]
    );
  }

  const result = await query(
    `UPDATE time_off_requests SET status = 'Approved', approved_by = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [Number(req.user?.employeeId) || null, Number(id)]
  );

  return res.json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// POST /requests/:id/refuse — Refuse Request
// ----------------------------------------------------------------------
router.post('/requests/:id/refuse', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const reqRes = await query('SELECT * FROM time_off_requests WHERE id = $1', [Number(id)]);
  if (!reqRes.rows || reqRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = reqRes.rows[0];
  const typeRes = await query('SELECT * FROM time_off_types WHERE id = $1', [request.time_off_type_id]);
  const type = typeRes.rows?.[0];

  // Revert allocation deduction if it was previously approved
  if (request.status === 'Approved' && type?.requires_allocation) {
    await query(
      `UPDATE time_off_allocations SET taken = GREATEST(0, taken - $1), updated_at = NOW()
       WHERE employee_id = $2 AND time_off_type_id = $3`,
      [Number(request.requested_amount), request.employee_id, request.time_off_type_id]
    );
  }

  const result = await query(
    `UPDATE time_off_requests SET status = 'Refused', approved_by = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [Number(req.user?.employeeId) || null, Number(id)]
  );

  return res.json({ success: true, data: result.rows?.[0] });
});

export default router;
