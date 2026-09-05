import { Router } from 'express';
import { PayrollController } from './payroll.controller.js';
import { authMiddleware, requireRole } from '../../core/auth.js';

const router = Router();

// Apply auth token middleware to all payroll routes
router.use(authMiddleware);

// RBAC Roles Definitions:
// admin, hr_payroll_manager: full access (create/edit rules, create/process payruns)
// hr_payroll_user: view structures, create/process payruns, view payslips (read-only rules)
// employee: view own payslips only
const payrollViewRoles = ['admin', 'hr_payroll_manager', 'hr_payroll_user'];
const payrollManagerRoles = ['admin', 'hr_payroll_manager'];
const payrunOperateRoles = ['admin', 'hr_payroll_manager', 'hr_payroll_user'];

// Salary Structures & Rules
router.get('/structures', requireRole(payrollViewRoles), PayrollController.getStructures);
router.get('/structures/:id', requireRole(payrollViewRoles), PayrollController.getStructureById);
router.post('/structures', requireRole(payrollManagerRoles), PayrollController.createStructure);
router.post('/rules', requireRole(payrollManagerRoles), PayrollController.addSalaryRule);
router.put('/rules/:id', requireRole(payrollManagerRoles), PayrollController.updateSalaryRule);

// Payruns
router.get('/payruns', requireRole(payrollViewRoles), PayrollController.getPayruns);
router.get('/payruns/:id', requireRole(payrollViewRoles), PayrollController.getPayrunById);
router.post('/payruns', requireRole(payrunOperateRoles), PayrollController.createPayrun);
router.post('/payruns/:id/validate', requireRole(payrunOperateRoles), PayrollController.validatePayrun);
router.post('/payruns/:id/mark-paid', requireRole(payrunOperateRoles), PayrollController.markPaidPayrun);
router.post('/payruns/:id/send-payslips', requireRole(payrunOperateRoles), PayrollController.sendPayslips);

// Payslips
router.get('/payslips/my', PayrollController.getMyPayslips);
router.get('/payslips/:id', PayrollController.getPayslipById);
router.get('/payslips/:id/pdf', PayrollController.downloadPayslipPdf);
router.get('/payruns/:payrunId/payslips', requireRole(payrollViewRoles), PayrollController.getPayslipsByPayrun);

export default router;
