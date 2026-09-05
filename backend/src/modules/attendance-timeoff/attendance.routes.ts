import { Router, Response } from 'express';
import { memoryDb } from '../../core/db.js';
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
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, date, month, status, has_exception } = req.query;

  let list = (memoryDb as any).attendances || [];

  // Plain Employee RBAC scoping
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    list = list.filter((a: any) => String(a.employee_id) === String(req.user?.employeeId));
  } else if (employee_id) {
    list = list.filter((a: any) => String(a.employee_id) === String(employee_id));
  }

  // Filter by Date (YYYY-MM-DD)
  if (date) {
    list = list.filter((a: any) => a.check_in && a.check_in.startsWith(String(date)));
  }

  // Filter by Month (YYYY-MM)
  if (month) {
    list = list.filter((a: any) => a.check_in && a.check_in.startsWith(String(month)));
  }

  // Enrich & calculate missing checkout exception flag
  const enriched = list.map((att: any) => {
    const employee = (memoryDb as any).employees.find((e: any) => String(e.id) === String(att.employee_id));

    // Check if missing checkout (check_in date is earlier than today and check_out is null)
    const checkInDate = new Date(att.check_in);
    const isPastDate = new Date().getTime() - checkInDate.getTime() > 16 * 60 * 60 * 1000;
    const isMissingCheckout = !att.check_out && isPastDate;

    let computedStatus = 'Present';
    if (!att.check_out) {
      computedStatus = isMissingCheckout ? 'Missing Check-Out' : 'Checked In';
    }

    return {
      ...att,
      employee: employee ? { id: employee.id, first_name: employee.first_name, last_name: employee.last_name, email: employee.email } : null,
      has_exception: isMissingCheckout || Boolean(att.is_manual_correction),
      status: computedStatus,
    };
  });

  if (has_exception === 'true') {
    return res.json({ success: true, data: enriched.filter((a: any) => a.has_exception) });
  }

  if (status) {
    return res.json({ success: true, data: enriched.filter((a: any) => a.status.toLowerCase() === String(status).toLowerCase()) });
  }

  return res.json({ success: true, data: enriched });
});

// ----------------------------------------------------------------------
// 2. GET /attendance/current — Get current active session for employee
// ----------------------------------------------------------------------
router.get('/current', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const empId = req.user?.employeeId;
  if (!empId) {
    return res.json({ success: true, data: null });
  }

  const active = ((memoryDb as any).attendances || []).find(
    (a: any) => String(a.employee_id) === String(empId) && !a.check_out
  );

  return res.json({ success: true, data: active || null });
});

// ----------------------------------------------------------------------
// 3. POST /attendance/check-in — Employee Check In
// ----------------------------------------------------------------------
router.post('/check-in', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const employee_id = req.user?.employeeId || req.body.employee_id;
  if (!employee_id) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_EMPLOYEE', message: 'Employee ID is required.' } });
  }

  // Verify no open check-in exists
  const existingActive = ((memoryDb as any).attendances || []).find(
    (a: any) => String(a.employee_id) === String(employee_id) && !a.check_out
  );

  if (existingActive) {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_IN', message: 'Employee is already checked in. Please check out first.' },
    });
  }

  const newAttendance = {
    id: `att_${Date.now()}`,
    employee_id,
    check_in: new Date().toISOString(),
    check_out: null,
    worked_hours: null,
    overtime_hours: 0,
    is_manual_correction: false,
    audit_note: null,
  };

  if (!(memoryDb as any).attendances) (memoryDb as any).attendances = [];
  (memoryDb as any).attendances.push(newAttendance);

  return res.status(201).json({ success: true, data: newAttendance });
});

// ----------------------------------------------------------------------
// 4. POST /attendance/check-out — Employee Check Out
// ----------------------------------------------------------------------
router.post('/check-out', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const employee_id = req.user?.employeeId || req.body.employee_id;
  if (!employee_id) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_EMPLOYEE', message: 'Employee ID is required.' } });
  }

  const activeIndex = ((memoryDb as any).attendances || []).findIndex(
    (a: any) => String(a.employee_id) === String(employee_id) && !a.check_out
  );

  if (activeIndex === -1) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CHECKED_IN', message: 'No active check-in session found for this employee.' },
    });
  }

  const checkOutTime = new Date().toISOString();
  const currentRecord = (memoryDb as any).attendances[activeIndex];
  const { workedHours, overtimeHours } = calculateHours(currentRecord.check_in, checkOutTime);

  (memoryDb as any).attendances[activeIndex] = {
    ...currentRecord,
    check_out: checkOutTime,
    worked_hours: workedHours,
    overtime_hours: overtimeHours,
  };

  return res.json({ success: true, data: (memoryDb as any).attendances[activeIndex] });
});

// ----------------------------------------------------------------------
// 5. POST /attendance — Manual Attendance Entry (HR / Admin)
// ----------------------------------------------------------------------
router.post('/', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req: AuthenticatedRequest, res: Response) => {
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

  const newAttendance = {
    id: `att_${Date.now()}`,
    employee_id,
    check_in,
    check_out: check_out || null,
    worked_hours: workedHours,
    overtime_hours: overtimeHours,
    is_manual_correction: true,
    audit_note: audit_note || `Manually created by ${req.user?.email}`,
  };

  if (!(memoryDb as any).attendances) (memoryDb as any).attendances = [];
  (memoryDb as any).attendances.push(newAttendance);

  return res.status(201).json({ success: true, data: newAttendance });
});

// ----------------------------------------------------------------------
// 6. PUT /attendance/:id — Manual Attendance Correction with Audit Log
// ----------------------------------------------------------------------
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { check_in, check_out, audit_note } = req.body;

  const list = (memoryDb as any).attendances || [];
  const index = list.findIndex((a: any) => String(a.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Attendance record not found.' } });
  }

  if (!audit_note) {
    return res.status(400).json({
      success: false,
      error: { code: 'AUDIT_NOTE_REQUIRED', message: 'An audit note explaining the correction is required for manual adjustments.' },
    });
  }

  const original = list[index];
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

  (memoryDb as any).attendances[index] = {
    ...original,
    check_in: newCheckIn,
    check_out: newCheckOut,
    worked_hours: workedHours,
    overtime_hours: overtimeHours,
    is_manual_correction: true,
    audit_note: original.audit_note ? `${original.audit_note} | ${updatedAuditNote}` : updatedAuditNote,
  };

  return res.json({ success: true, data: (memoryDb as any).attendances[index] });
});

export default router;
