import { Router, Response } from 'express';
import { query } from '../../core/db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

const router = Router();

// Helper: Calculate worked hours and overtime hours
function calculateHours(checkInIso: string, checkOutIso: string, standardDailyHours = 8) {
  const inTime = new Date(checkInIso).getTime();
  const outTime = new Date(checkOutIso).getTime();
  const durationMs = outTime - inTime;
  if (durationMs <= 0) return { workedHours: 0, overtimeHours: 0 };

  const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
  const overtime = Math.max(0, Math.round((totalHours - standardDailyHours) * 100) / 100);
  return { workedHours: totalHours, overtimeHours: overtime };
}

// ----------------------------------------------------------------------
// 1. GET /attendance — List attendances with filter & exception handling
// ----------------------------------------------------------------------
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, date, month, status, has_exception } = req.query;

  let sql = `
    SELECT a.*,
           e.first_name, e.last_name, e.email AS employee_email,
           CASE
             WHEN a.check_out IS NOT NULL THEN 'Present'
             WHEN a.check_out IS NULL AND a.check_in < NOW() - INTERVAL '16 hours' THEN 'Missing Check-Out'
             ELSE 'Checked In'
           END AS computed_status,
           CASE
             WHEN (a.check_out IS NULL AND a.check_in < NOW() - INTERVAL '16 hours') OR a.is_manual_correction = true THEN true
             ELSE false
           END AS has_exception
    FROM attendances a
    JOIN employees e ON a.employee_id = e.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  // Plain Employee RBAC scoping
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(Number(req.user.employeeId));
  } else if (employee_id) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(Number(employee_id));
  }

  if (date) {
    conditions.push(`a.check_in::date = $${params.length + 1}`);
    params.push(date);
  }

  if (month) {
    conditions.push(`TO_CHAR(a.check_in, 'YYYY-MM') = $${params.length + 1}`);
    params.push(month);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY a.check_in DESC';

  const result = await query(sql, params);
  let rows = result.rows || [];

  if (has_exception === 'true') {
    rows = rows.filter((a: any) => a.has_exception);
  }

  if (status) {
    rows = rows.filter((a: any) => a.computed_status.toLowerCase() === String(status).toLowerCase());
  }

  return res.json({ success: true, data: rows });
});

// ----------------------------------------------------------------------
// 2. GET /attendance/current — Get current active session for employee
// ----------------------------------------------------------------------
router.get('/current', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const empId = req.user?.employeeId;
  if (!empId) {
    return res.json({ success: true, data: null });
  }

  const result = await query(
    `SELECT * FROM attendances WHERE employee_id = $1 AND check_out IS NULL ORDER BY check_in DESC LIMIT 1`,
    [Number(empId)]
  );

  return res.json({ success: true, data: result.rows?.[0] || null });
});

// ----------------------------------------------------------------------
// 3. POST /attendance/check-in — Employee Check In
// ----------------------------------------------------------------------
router.post('/check-in', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const employee_id = req.user?.employeeId || req.body.employee_id;
  if (!employee_id) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_EMPLOYEE', message: 'Employee ID is required.' } });
  }

  // Verify no open check-in exists
  const existingRes = await query(
    `SELECT id FROM attendances WHERE employee_id = $1 AND check_out IS NULL`,
    [Number(employee_id)]
  );

  if (existingRes.rows && existingRes.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_IN', message: 'Employee is already checked in. Please check out first.' },
    });
  }

  const result = await query(
    `INSERT INTO attendances (employee_id, check_in, is_manual_correction)
     VALUES ($1, NOW(), false)
     RETURNING *`,
    [Number(employee_id)]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// 4. POST /attendance/check-out — Employee Check Out
// ----------------------------------------------------------------------
router.post('/check-out', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const employee_id = req.user?.employeeId || req.body.employee_id;
  if (!employee_id) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_EMPLOYEE', message: 'Employee ID is required.' } });
  }

  const activeRes = await query(
    `SELECT * FROM attendances WHERE employee_id = $1 AND check_out IS NULL ORDER BY check_in DESC LIMIT 1`,
    [Number(employee_id)]
  );

  if (!activeRes.rows || activeRes.rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CHECKED_IN', message: 'No active check-in session found for this employee.' },
    });
  }

  const currentRecord = activeRes.rows[0];
  const checkOutTime = new Date().toISOString();
  const { workedHours, overtimeHours } = calculateHours(currentRecord.check_in, checkOutTime);

  const result = await query(
    `UPDATE attendances SET check_out = NOW(), worked_hours = $1, overtime_hours = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [workedHours, overtimeHours, currentRecord.id]
  );

  return res.json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// 5. POST /attendance — Manual Attendance Entry (HR / Admin)
// ----------------------------------------------------------------------
router.post('/', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, check_in, check_out, audit_note } = req.body;

  if (!employee_id || !check_in) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee ID and check_in time are required.' },
    });
  }

  let workedHours = null;
  let overtimeHours = 0;
  if (check_out) {
    const computed = calculateHours(check_in, check_out);
    workedHours = computed.workedHours;
    overtimeHours = computed.overtimeHours;
  }

  const result = await query(
    `INSERT INTO attendances (employee_id, check_in, check_out, worked_hours, overtime_hours, is_manual_correction, audit_note)
     VALUES ($1, $2, $3, $4, $5, true, $6)
     RETURNING *`,
    [Number(employee_id), check_in, check_out || null, workedHours, overtimeHours,
     audit_note || `Manually created by ${req.user?.email}`]
  );

  return res.status(201).json({ success: true, data: result.rows?.[0] });
});

// ----------------------------------------------------------------------
// 6. PUT /attendance/:id — Manual Attendance Correction with Audit Log
// ----------------------------------------------------------------------
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { check_in, check_out, audit_note } = req.body;

  if (!audit_note) {
    return res.status(400).json({
      success: false,
      error: { code: 'AUDIT_NOTE_REQUIRED', message: 'An audit note explaining the correction is required for manual adjustments.' },
    });
  }

  const existingRes = await query('SELECT * FROM attendances WHERE id = $1', [Number(id)]);
  if (!existingRes.rows || existingRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: { message: 'Attendance record not found.' } });
  }

  const original = existingRes.rows[0];
  const newCheckIn = check_in || original.check_in;
  const newCheckOut = check_out !== undefined ? check_out : original.check_out;

  let workedHours = original.worked_hours;
  let overtimeHours = original.overtime_hours;

  if (newCheckIn && newCheckOut) {
    const computed = calculateHours(newCheckIn, newCheckOut);
    workedHours = computed.workedHours;
    overtimeHours = computed.overtimeHours;
  }

  const updatedAuditNote = `[Edited on ${new Date().toISOString()} by ${req.user?.email}]: ${audit_note} (Original check_in: ${original.check_in}, check_out: ${original.check_out})`;
  const fullAuditNote = original.audit_note ? `${original.audit_note} | ${updatedAuditNote}` : updatedAuditNote;

  const result = await query(
    `UPDATE attendances SET
       check_in = $1, check_out = $2, worked_hours = $3, overtime_hours = $4,
       is_manual_correction = true, audit_note = $5, updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [newCheckIn, newCheckOut, workedHours, overtimeHours, fullAuditNote, Number(id)]
  );

  return res.json({ success: true, data: result.rows?.[0] });
});

export default router;
