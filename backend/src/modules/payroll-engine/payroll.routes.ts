import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { authenticateToken, requireRoles } from '../../core/auth';

const router = Router();

// Apply auth token middleware to all payroll routes
router.use(authenticateToken);

// RBAC enforcement: HR Manager is blocked from payroll screens/routes per spec Section 2
const payrollRoles = ['HR Payroll User', 'HR Payroll Manager', 'Admin'];

// Structures & Rules
router.get('/structures', requireRoles(payrollRoles), PayrollController.getStructures);
router.get('/structures/:id', requireRoles(payrollRoles), PayrollController.getStructureById);
router.post('/structures', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.createStructure);
router.post('/rules', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.addSalaryRule);
router.put('/rules/:id', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.updateSalaryRule);

// Payruns
router.get('/payruns', requireRoles(payrollRoles), PayrollController.getPayruns);
router.get('/payruns/:id', requireRoles(payrollRoles), PayrollController.getPayrunById);
router.post('/payruns', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.createPayrun);
router.post('/payruns/:id/validate', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.validatePayrun);
router.post('/payruns/:id/mark-paid', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.markPaidPayrun);
router.post('/payruns/:id/send-payslips', requireRoles(['HR Payroll Manager', 'Admin']), PayrollController.sendPayslips);

// Payslips
router.get('/payslips/:id', requireRoles(payrollRoles), PayrollController.getPayslipById);
router.get('/payruns/:payrunId/payslips', requireRoles(payrollRoles), PayrollController.getPayslipsByPayrun);

export default router;
