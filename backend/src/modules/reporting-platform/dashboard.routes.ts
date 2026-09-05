import { Router, Response } from 'express';
import { query } from '../../core/db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../core/auth.js';

const router = Router();

// ======================================================================
// 1. DASHBOARD — Aggregated KPIs (Module A7 / B9)
// ======================================================================

router.get('/summary', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, department } = req.query;

    // --- KPI 1: Total Salary Fund (Monthly) ---
    let sfSql = `
      SELECT COALESCE(SUM(ps.net_wage), 0)::float AS total_net,
             COALESCE(SUM(ps.gross_wage), 0)::float AS total_gross,
             COUNT(ps.id)::int AS payslip_count
      FROM payslips ps
      JOIN payruns pr ON ps.payrun_id = pr.id
      JOIN employees e ON ps.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pr.status IN ('COMPUTED', 'VALIDATED', 'Paid')
    `;
    const sfParams: any[] = [];
    if (period) {
      sfSql += ` AND TO_CHAR(pr.period_start, 'Mon YYYY') = $${sfParams.length + 1}`;
      sfParams.push(period);
    }
    if (department) {
      sfSql += ` AND d.name = $${sfParams.length + 1}`;
      sfParams.push(department);
    }
    
    const salaryFundRes = await query(sfSql, sfParams);
    const salaryFund = salaryFundRes.rows?.[0] || { total_net: 0, total_gross: 0, payslip_count: 0 };

    // --- KPI 2: Active Headcount ---
    let hcSql = `
      SELECT COUNT(*)::int AS active_employees
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'active'
    `;
    const hcParams: any[] = [];
    if (department) {
      hcSql += ` AND d.name = $${hcParams.length + 1}`;
      hcParams.push(department);
    }
    const headcountRes = await query(hcSql, hcParams);
    const headcount = headcountRes.rows?.[0]?.active_employees || 0;

    // --- KPI 3: Avg Salary per Employee ---
    const avgSalary = headcount > 0 ? Math.round((salaryFund.total_net / headcount) * 100) / 100 : 0;

    // --- KPI 4: Approved Time Off Days ---
    let toSql = `
      SELECT COALESCE(SUM(tor.requested_amount), 0)::float AS approved_days
      FROM time_off_requests tor
      JOIN employees e ON tor.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE tor.status = 'Approved'
    `;
    const toParams: any[] = [];
    if (period) {
      toSql += ` AND TO_CHAR(tor.start_date, 'Mon YYYY') = $${toParams.length + 1}`;
      toParams.push(period);
    }
    if (department) {
      toSql += ` AND d.name = $${toParams.length + 1}`;
      toParams.push(department);
    }
    const timeOffRes = await query(toSql, toParams);
    const approvedTimeOff = timeOffRes.rows?.[0]?.approved_days || 0;

    // --- KPI 5: Attendance Health Rate ---
    let attSql = `
      SELECT 
        COUNT(*)::int AS total_records,
        COUNT(CASE WHEN a.check_out IS NOT NULL THEN 1 END)::int AS complete_records,
        COUNT(CASE WHEN a.check_out IS NULL AND a.check_in < NOW() - INTERVAL '16 hours' THEN 1 END)::int AS missing_checkouts
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const attParams: any[] = [];
    if (period) {
      attSql += ` AND TO_CHAR(a.check_in, 'Mon YYYY') = $${attParams.length + 1}`;
      attParams.push(period);
    }
    if (department) {
      attSql += ` AND d.name = $${attParams.length + 1}`;
      attParams.push(department);
    }
    const attendanceRes = await query(attSql, attParams);
    const attData = attendanceRes.rows?.[0] || { total_records: 0, complete_records: 0, missing_checkouts: 0 };
    const attendanceRate = attData.total_records > 0 
      ? Math.round((attData.complete_records / attData.total_records) * 1000) / 10 
      : 100;

    // --- KPI 6: Pending Time Off Requests ---
    let pendSql = `
      SELECT COUNT(*)::int AS pending_requests
      FROM time_off_requests tor
      JOIN employees e ON tor.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE tor.status = 'Pending'
    `;
    const pendParams: any[] = [];
    if (period) {
      pendSql += ` AND TO_CHAR(tor.start_date, 'Mon YYYY') = $${pendParams.length + 1}`;
      pendParams.push(period);
    }
    if (department) {
      pendSql += ` AND d.name = $${pendParams.length + 1}`;
      pendParams.push(department);
    }
    const pendingRes = await query(pendSql, pendParams);
    const pendingTimeOff = pendingRes.rows?.[0]?.pending_requests || 0;

    return res.json({
      success: true,
      data: {
        salary_fund: {
          total_net: salaryFund.total_net,
          total_gross: salaryFund.total_gross,
          payslip_count: salaryFund.payslip_count,
        },
        active_headcount: headcount,
        avg_salary_per_employee: avgSalary,
        approved_time_off_days: approvedTimeOff,
        attendance_health: {
          rate: attendanceRate,
          total_records: attData.total_records,
          missing_checkouts: attData.missing_checkouts,
        },
        pending_time_off_requests: pendingTimeOff,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 2. DASHBOARD — Salary Cost by Department
// ======================================================================

router.get('/salary-by-department', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period } = req.query;
    let sql = `
      SELECT d.name AS department, 
             COALESCE(SUM(ps.gross_wage), 0)::float AS total_gross,
             COALESCE(SUM(ps.net_wage), 0)::float AS total_net,
             COUNT(DISTINCT ps.employee_id)::int AS employee_count
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      JOIN payruns pr ON ps.payrun_id = pr.id
      WHERE pr.status IN ('COMPUTED', 'VALIDATED', 'Paid')
    `;
    const params: any[] = [];
    if (period) {
      sql += ` AND TO_CHAR(pr.period_start, 'Mon YYYY') = $1`;
      params.push(period);
    }
    sql += ` GROUP BY d.name ORDER BY total_gross DESC`;
    
    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 3. DASHBOARD — Monthly Net Salary Trend
// ======================================================================

router.get('/salary-trend', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { department } = req.query;
    let sql = `
      SELECT TO_CHAR(pr.period_start, 'Mon YYYY') AS month_label,
             pr.period_start,
             COALESCE(SUM(ps.net_wage), 0)::float AS total_net,
             COALESCE(SUM(ps.gross_wage), 0)::float AS total_gross,
             COUNT(ps.id)::int AS payslip_count
      FROM payslips ps
      JOIN payruns pr ON ps.payrun_id = pr.id
      JOIN employees e ON ps.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pr.status IN ('COMPUTED', 'VALIDATED', 'Paid')
    `;
    const params: any[] = [];
    if (department) {
       sql += ` AND d.name = $1`;
       params.push(department);
    }
    sql += ` GROUP BY pr.period_start, TO_CHAR(pr.period_start, 'Mon YYYY') ORDER BY pr.period_start ASC`;
    
    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 4. DASHBOARD — Payslip Status Breakdown
// ======================================================================

router.get('/payslip-status', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, department } = req.query;
    let sql = `
      SELECT ps.status, COUNT(*)::int AS count
      FROM payslips ps
      JOIN payruns pr ON ps.payrun_id = pr.id
      JOIN employees e ON ps.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (period) {
      sql += ` AND TO_CHAR(pr.period_start, 'Mon YYYY') = $${params.length + 1}`;
      params.push(period);
    }
    if (department) {
      sql += ` AND d.name = $${params.length + 1}`;
      params.push(department);
    }
    sql += ` GROUP BY ps.status ORDER BY ps.status`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 5. DASHBOARD — Proactive Alerts & Warnings
// ======================================================================

router.get('/alerts', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts: Array<{ type: string; severity: string; message: string; count?: number }> = [];
    const { department } = req.query;
    
    let deptFilter = department ? `AND d.name = '${department}'` : '';
    let deptJoin = department ? `LEFT JOIN departments d ON e.department_id = d.id` : '';

    // Alert 1: Employees missing bank details
    const bankRes = await query(`
      SELECT COUNT(*)::int AS count FROM employees e
      ${deptJoin}
      WHERE e.status = 'active' AND (e.bank_account_number IS NULL OR e.bank_account_number = '')
      ${deptFilter}
    `);
    const missingBank = bankRes.rows?.[0]?.count || 0;
    if (missingBank > 0) {
      alerts.push({
        type: 'MISSING_BANK_DETAILS',
        severity: 'warning',
        message: `${missingBank} employee(s) missing bank details. Update profiles before next Payrun disbursement.`,
        count: missingBank,
      });
    }

    // Alert 2: Missing attendance check-outs
    const missCheckoutRes = await query(`
      SELECT COUNT(*)::int AS count FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      ${deptJoin}
      WHERE a.check_out IS NULL AND a.check_in < NOW() - INTERVAL '16 hours'
      ${deptFilter}
    `);
    const missingCheckouts = missCheckoutRes.rows?.[0]?.count || 0;
    if (missingCheckouts > 0) {
      alerts.push({
        type: 'MISSING_CHECKOUT',
        severity: 'warning',
        message: `${missingCheckouts} attendance record(s) with missing check-out flagged as exceptions.`,
        count: missingCheckouts,
      });
    }

    // Alert 3: Pending time off requests
    const pendingRes = await query(`
      SELECT COUNT(*)::int AS count FROM time_off_requests tor
      JOIN employees e ON tor.employee_id = e.id
      ${deptJoin}
      WHERE tor.status = 'Pending'
      ${deptFilter}
    `);
    const pendingCount = pendingRes.rows?.[0]?.count || 0;
    if (pendingCount > 0) {
      alerts.push({
        type: 'PENDING_LEAVE_REQUESTS',
        severity: 'info',
        message: `${pendingCount} time off request(s) pending approval.`,
        count: pendingCount,
      });
    }

    // Alert 4: Employees with no active contract
    const noContractRes = await query(`
      SELECT COUNT(*)::int AS count FROM employees e
      ${deptJoin}
      WHERE e.status = 'active'
      ${deptFilter}
        AND NOT EXISTS (
          SELECT 1 FROM contracts c 
          WHERE c.employee_id = e.id AND c.status = 'Running'
        )
    `);
    const noContract = noContractRes.rows?.[0]?.count || 0;
    if (noContract > 0) {
      alerts.push({
        type: 'NO_ACTIVE_CONTRACT',
        severity: 'critical',
        message: `${noContract} active employee(s) without a running contract. They cannot be included in payruns.`,
        count: noContract,
      });
    }

    return res.json({ success: true, data: alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 6. DASHBOARD — Attendance Overview
// ======================================================================

router.get('/attendance-overview', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, department } = req.query;
    let sql = `
      SELECT 
        COUNT(CASE WHEN a.check_out IS NOT NULL THEN 1 END)::int AS present,
        COUNT(CASE WHEN a.check_out IS NULL AND a.check_in < NOW() - INTERVAL '16 hours' THEN 1 END)::int AS missing_checkout,
        COUNT(CASE WHEN a.is_manual_correction = true THEN 1 END)::int AS manual_corrections
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (period) {
      sql += ` AND TO_CHAR(a.check_in, 'Mon YYYY') = $${params.length + 1}`;
      params.push(period);
    }
    if (department) {
      sql += ` AND d.name = $${params.length + 1}`;
      params.push(department);
    }

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows?.[0] || { present: 0, missing_checkout: 0, manual_corrections: 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 7. DASHBOARD — Time Off Overview
// ======================================================================

router.get('/timeoff-overview', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, department } = req.query;
    
    // We filter by tor.start_date for the period filter if provided
    let sql = `
      SELECT 
        tot.name AS type_name,
        COALESCE(SUM(tor.requested_amount), 0)::float AS approved_days,
        COUNT(CASE WHEN tor.status = 'Pending' THEN 1 END)::int AS pending,
        COALESCE(SUM(CASE WHEN tor.status = 'Approved' THEN toa.allocated - toa.taken ELSE 0 END), 0)::float AS remaining_balance
      FROM time_off_types tot
      LEFT JOIN time_off_requests tor ON tor.time_off_type_id = tot.id
      LEFT JOIN employees e ON tor.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN time_off_allocations toa ON toa.time_off_type_id = tot.id AND toa.employee_id = tor.employee_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (period) {
      sql += ` AND TO_CHAR(tor.start_date, 'Mon YYYY') = $${params.length + 1}`;
      params.push(period);
    }
    if (department) {
      sql += ` AND d.name = $${params.length + 1}`;
      params.push(department);
    }
    sql += ` GROUP BY tot.name`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 8. DASHBOARD — Department Overview
// ======================================================================

router.get('/department-overview', authMiddleware, requireRole(['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { department } = req.query;
    let sql = `
      SELECT d.name AS department,
             COUNT(e.id)::int AS headcount,
             COALESCE(AVG(c.wage), 0)::float AS avg_salary
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
      WHERE 1=1
    `;
    const params: any[] = [];
    if (department) {
      sql += ` AND d.name = $1`;
      params.push(department);
    }
    sql += ` GROUP BY d.name ORDER BY headcount DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 9. AUDIT LOGS — Read (Dev D owned table)
// ======================================================================

router.get('/audit-logs', authMiddleware, requireRole(['admin', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table_name, limit: queryLimit } = req.query;
    const lim = Number(queryLimit) || 50;

    let sql = `SELECT * FROM audit_logs`;
    const params: any[] = [];

    if (table_name) {
      sql += ` WHERE table_name = $1`;
      params.push(table_name);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(lim);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ======================================================================
// 10. EMAIL LOGS — Read (Dev D owned table)
// ======================================================================

router.get('/email-logs', authMiddleware, requireRole(['admin', 'hr_payroll_manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payslip_id, status, limit: queryLimit } = req.query;
    const lim = Number(queryLimit) || 50;

    let sql = `SELECT * FROM email_logs`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (payslip_id) {
      conditions.push(`payslip_id = $${params.length + 1}`);
      params.push(Number(payslip_id));
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY sent_at DESC LIMIT $${params.length + 1}`;
    params.push(lim);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
