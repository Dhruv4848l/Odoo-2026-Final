import { Router, Response } from 'express';
import { memoryDb } from '../../core/db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

const router = Router();

// ======================================================================
// 1. TIME OFF TYPES (Module A4 / B4)
// ======================================================================

router.get('/types', authMiddleware, (req, res) => {
  const types = (memoryDb as any).time_off_types || [];
  return res.json({ success: true, data: types });
});

router.post('/types', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { name, unit, requires_allocation, approval_workflow, is_paid, display_color } = req.body;

  if (!name || !unit) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Name and unit (Days/Hours) are required for time off type.' },
    });
  }

  const newType = {
    id: `tot_${Date.now()}`,
    name,
    unit: unit || 'Days',
    requires_allocation: requires_allocation !== undefined ? Boolean(requires_allocation) : true,
    approval_workflow: approval_workflow || 'by_hr',
    is_paid: is_paid !== undefined ? Boolean(is_paid) : true,
    display_color: display_color || '#5B4FE9',
  };

  if (!(memoryDb as any).time_off_types) (memoryDb as any).time_off_types = [];
  (memoryDb as any).time_off_types.push(newType);

  return res.status(201).json({ success: true, data: newType });
});

router.put('/types/:id', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { id } = req.params;
  const list = (memoryDb as any).time_off_types || [];
  const index = list.findIndex((t: any) => String(t.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Time off type not found.' } });
  }

  list[index] = { ...list[index], ...req.body };
  return res.json({ success: true, data: list[index] });
});

// ======================================================================
// 2. TIME OFF ALLOCATIONS (Module A4 / B4)
// ======================================================================

router.get('/allocations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, time_off_type_id } = req.query;

  let list = (memoryDb as any).time_off_allocations || [];

  // Plain employee RBAC check
  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    list = list.filter((a: any) => String(a.employee_id) === String(req.user?.employeeId));
  } else if (employee_id) {
    list = list.filter((a: any) => String(a.employee_id) === String(employee_id));
  }

  if (time_off_type_id) {
    list = list.filter((a: any) => String(a.time_off_type_id) === String(time_off_type_id));
  }

  const nowStr = new Date().toISOString().split('T')[0];

  const enriched = list.map((alloc: any) => {
    const employee = (memoryDb as any).employees.find((e: any) => String(e.id) === String(alloc.employee_id));
    const type = (memoryDb as any).time_off_types.find((t: any) => String(t.id) === String(alloc.time_off_type_id));
    const remaining = Math.max(0, Number(alloc.allocated) - Number(alloc.taken || 0));
    const isExpired = alloc.valid_until && alloc.valid_until < nowStr;

    return {
      ...alloc,
      employee: employee ? { id: employee.id, first_name: employee.first_name, last_name: employee.last_name } : null,
      time_off_type: type || null,
      remaining: isExpired ? 0 : remaining,
      is_expired: isExpired,
    };
  });

  return res.json({ success: true, data: enriched });
});

router.get('/allocations/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const empId = req.user?.employeeId;
  if (!empId) {
    return res.json({ success: true, data: [] });
  }

  const list = ((memoryDb as any).time_off_allocations || []).filter(
    (a: any) => String(a.employee_id) === String(empId)
  );

  const nowStr = new Date().toISOString().split('T')[0];

  const enriched = list.map((alloc: any) => {
    const type = (memoryDb as any).time_off_types.find((t: any) => String(t.id) === String(alloc.time_off_type_id));
    const remaining = Math.max(0, Number(alloc.allocated) - Number(alloc.taken || 0));
    const isExpired = alloc.valid_until && alloc.valid_until < nowStr;

    return {
      ...alloc,
      time_off_type: type || null,
      remaining: isExpired ? 0 : remaining,
      is_expired: isExpired,
    };
  });

  return res.json({ success: true, data: enriched });
});

router.post('/allocations', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req, res) => {
  const { employee_id, time_off_type_id, allocated, valid_from, valid_until } = req.body;

  if (!employee_id || !time_off_type_id || !allocated || !valid_from || !valid_until) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Employee, time off type, allocated amount, valid_from and valid_until are required.' },
    });
  }

  const newAlloc = {
    id: `alloc_${Date.now()}`,
    employee_id,
    time_off_type_id,
    allocated: Number(allocated),
    taken: 0,
    valid_from,
    valid_until,
  };

  if (!(memoryDb as any).time_off_allocations) (memoryDb as any).time_off_allocations = [];
  (memoryDb as any).time_off_allocations.push(newAlloc);

  return res.status(201).json({ success: true, data: newAlloc });
});

// ======================================================================
// 3. TIME OFF REQUESTS (Module A4 / B4) — Balance & Overlap Enforcement
// ======================================================================

router.get('/requests', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, status } = req.query;

  let list = (memoryDb as any).time_off_requests || [];

  if (req.user?.roleId === 'employee' && req.user.employeeId) {
    list = list.filter((r: any) => String(r.employee_id) === String(req.user?.employeeId));
  } else if (employee_id) {
    list = list.filter((r: any) => String(r.employee_id) === String(employee_id));
  }

  if (status) {
    list = list.filter((r: any) => String(r.status).toLowerCase() === String(status).toLowerCase());
  }

  const enriched = list.map((reqItem: any) => {
    const employee = (memoryDb as any).employees.find((e: any) => String(e.id) === String(reqItem.employee_id));
    const type = (memoryDb as any).time_off_types.find((t: any) => String(t.id) === String(reqItem.time_off_type_id));
    const approver = reqItem.approved_by
      ? (memoryDb as any).employees.find((e: any) => String(e.id) === String(reqItem.approved_by))
      : null;

    return {
      ...reqItem,
      employee: employee ? { id: employee.id, first_name: employee.first_name, last_name: employee.last_name } : null,
      time_off_type: type || null,
      approved_by_user: approver ? { first_name: approver.first_name, last_name: approver.last_name } : null,
    };
  });

  return res.json({ success: true, data: enriched });
});

router.post('/requests', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const employee_id = req.user?.roleId === 'employee' && req.user.employeeId ? req.user.employeeId : req.body.employee_id;
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

  if (new Date(end_date).getTime() < new Date(start_date).getTime()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATE_RANGE', message: 'End date cannot be earlier than start date.' },
    });
  }

  const type = ((memoryDb as any).time_off_types || []).find((t: any) => String(t.id) === String(time_off_type_id));
  if (!type) {
    return res.status(404).json({ success: false, error: { message: 'Time off type not found.' } });
  }


  // -------------------------------------------------------------------
  // VALIDATION 1: Insufficient Leave Balance check (if allocation required)
  // -------------------------------------------------------------------
  if (type.requires_allocation) {
    const allocations = ((memoryDb as any).time_off_allocations || []).filter(
      (a: any) =>
        String(a.employee_id) === String(employee_id) &&
        String(a.time_off_type_id) === String(time_off_type_id) &&
        a.valid_from <= start_date &&
        a.valid_until >= end_date
    );

    const totalRemaining = allocations.reduce((sum: number, a: any) => sum + (Number(a.allocated) - Number(a.taken || 0)), 0);

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
  const reqStart = new Date(start_date).getTime();
  const reqEnd = new Date(end_date).getTime();

  const existingActiveRequests = ((memoryDb as any).time_off_requests || []).filter(
    (r: any) => String(r.employee_id) === String(employee_id) && r.status !== 'Refused'
  );

  for (const existing of existingActiveRequests) {
    const exStart = new Date(existing.start_date).getTime();
    const exEnd = new Date(existing.end_date).getTime();

    // Check date overlap: (StartA <= EndB) and (EndA >= StartB)
    if (reqStart <= exEnd && reqEnd >= exStart) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OVERLAPPING_LEAVE_REQUEST',
          message: `Validation Error: You already have an active leave request (${existing.start_date} to ${existing.end_date}) covering these dates. Duplicate overlapping leave requests cannot be created.`,
        },
      });
    }
  }

  const newRequest = {
    id: `tor_${Date.now()}`,
    employee_id,
    time_off_type_id,
    start_date,
    end_date,
    requested_amount: reqAmount,
    status: 'Pending',
    approved_by: null,
    created_at: new Date().toISOString(),
  };

  if (!(memoryDb as any).time_off_requests) (memoryDb as any).time_off_requests = [];
  (memoryDb as any).time_off_requests.push(newRequest);

  return res.status(201).json({ success: true, data: newRequest });
});

// ----------------------------------------------------------------------
// POST /requests/:id/approve — Approve Request & Deduct Balance
// ----------------------------------------------------------------------
router.post('/requests/:id/approve', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const list = (memoryDb as any).time_off_requests || [];
  const index = list.findIndex((r: any) => String(r.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = list[index];
  const type = ((memoryDb as any).time_off_types || []).find((t: any) => String(t.id) === String(request.time_off_type_id));

  // Deduct from allocation if required and not already approved
  if (request.status !== 'Approved' && type?.requires_allocation) {
    const allocations = (memoryDb as any).time_off_allocations || [];
    let targetAlloc = allocations.find(
      (a: any) =>
        String(a.employee_id) === String(request.employee_id) &&
        String(a.time_off_type_id) === String(request.time_off_type_id) &&
        a.valid_from <= request.start_date &&
        a.valid_until >= request.end_date
    );

    if (!targetAlloc) {
      targetAlloc = allocations.find(
        (a: any) =>
          String(a.employee_id) === String(request.employee_id) &&
          String(a.time_off_type_id) === String(request.time_off_type_id)
      );
    }

    if (targetAlloc) {
      targetAlloc.taken = Number(targetAlloc.taken || 0) + Number(request.requested_amount);
    }

  }

  list[index] = {
    ...request,
    status: 'Approved',
    approved_by: req.user?.employeeId || 'emp_admin',
  };

  return res.json({ success: true, data: list[index] });
});

// ----------------------------------------------------------------------
// POST /requests/:id/refuse — Refuse Request
// ----------------------------------------------------------------------
router.post('/requests/:id/refuse', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_manager']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const list = (memoryDb as any).time_off_requests || [];
  const index = list.findIndex((r: any) => String(r.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Leave request not found.' } });
  }

  const request = list[index];
  const type = ((memoryDb as any).time_off_types || []).find((t: any) => String(t.id) === String(request.time_off_type_id));

  // Revert allocation deduction if it was previously approved
  if (request.status === 'Approved' && type?.requires_allocation) {
    const allocations = (memoryDb as any).time_off_allocations || [];
    const targetAlloc = allocations.find(
      (a: any) =>
        String(a.employee_id) === String(request.employee_id) &&
        String(a.time_off_type_id) === String(request.time_off_type_id)
    );

    if (targetAlloc) {
      targetAlloc.taken = Math.max(0, Number(targetAlloc.taken || 0) - Number(request.requested_amount));
    }
  }

  list[index] = {
    ...request,
    status: 'Refused',
    approved_by: req.user?.employeeId || 'emp_admin',
  };

  return res.json({ success: true, data: list[index] });
});

export default router;
