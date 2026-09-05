import { Request, Response } from 'express';
import { SalaryStructureService } from './services/salary-structure.service.js';
import { PayrunService } from './services/payrun.service.js';
import { PayslipService } from './services/payslip.service.js';
import { PdfGeneratorService } from './services/pdf-generator.service.js';
import { AuthenticatedRequest } from '../../core/auth.js';
import { broadcastEvent } from '../../core/websocket.js';

export class PayrollController {
  // Salary Structures & Rules
  static async getStructures(req: Request, res: Response) {
    try {
      const structures = await SalaryStructureService.getAllStructures();
      res.json({ success: true, data: structures });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async getStructureById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const structure = await SalaryStructureService.getStructureById(id);
      if (!structure) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Structure not found' } });
      }
      res.json({ success: true, data: structure });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async createStructure(req: Request, res: Response) {
    try {
      const { name, code, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Structure name is required.' } });
      }
      const structure = await SalaryStructureService.createStructure(name, code, description);
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'STRUCTURE_CREATED',
        payload: structure,
        notification: {
          title: 'Salary Structure Added',
          message: `Structure "${name}" created in Payroll Engine`,
          type: 'info',
        },
      });
      res.status(201).json({ success: true, data: structure });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async addSalaryRule(req: Request, res: Response) {
    try {
      const { structure_id, name, code } = req.body;
      if (!structure_id || !name || !code) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Structure ID, rule name, and code are required.' } });
      }
      const rule = await SalaryStructureService.addSalaryRule(req.body);
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'RULE_ADDED',
        payload: rule,
        notification: {
          title: 'Salary Rule Added',
          message: `Rule "${name}" added with code ${code}`,
          type: 'info',
        },
      });
      res.status(201).json({ success: true, data: rule });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async updateSalaryRule(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const rule = await SalaryStructureService.updateSalaryRule(id, req.body);
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'RULE_UPDATED',
        payload: rule,
        notification: {
          title: 'Salary Rule Modified',
          message: `Rule ${id} formula and sequence updated`,
          type: 'info',
        },
      });
      res.json({ success: true, data: rule });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  // Payruns
  static async getPayruns(req: Request, res: Response) {
    try {
      const payruns = await PayrunService.getAllPayruns();
      res.json({ success: true, data: payruns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async getPayrunById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payrun = await PayrunService.getPayrunById(id);
      if (!payrun) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payrun not found' } });
      }
      res.json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async createPayrun(req: Request, res: Response) {
    try {
      const { name, structure_id, period_start, period_end, selected_employee_ids } = req.body;
      if (!name || !structure_id || !period_start || !period_end) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Name, structure ID, period_start, and period_end are required.' }
        });
      }
      const payrun = await PayrunService.createPayrun(
        name,
        structure_id,
        period_start,
        period_end,
        selected_employee_ids
      );
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'PAYRUN_CREATED',
        payload: payrun,
        notification: {
          title: 'Payrun Initialized',
          message: `Batch "${name}" created with ${(payrun as any)?.payslips_count || (payrun as any)?.payslips?.length || 0} employee payslips`,
          type: 'info',
        },
      });
      res.status(201).json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async validatePayrun(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payrun = await PayrunService.updatePayrunStatus(id, 'Validated');
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'PAYRUN_VALIDATED',
        payload: payrun,
        notification: {
          title: 'Payrun Validated',
          message: `Batch "${payrun.name}" validated by payroll officer`,
          type: 'success',
        },
      });
      res.json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async markPaidPayrun(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payrun = await PayrunService.updatePayrunStatus(id, 'Paid');
      broadcastEvent({
        type: 'PAYROLL_UPDATE',
        action: 'PAYRUN_PAID',
        payload: payrun,
        notification: {
          title: 'Payroll Disbursed',
          message: `Batch "${payrun.name}" marked as Paid. Bank disbursals released.`,
          type: 'success',
        },
      });
      res.json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async sendPayslips(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await PayslipService.sendBulkPayslipEmails(id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  // Payslips
  static async getPayslipById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payslip = await PayslipService.getPayslipById(id);
      if (!payslip) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
      }
      res.json({ success: true, data: payslip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async getMyPayslips(req: AuthenticatedRequest, res: Response) {
    try {
      const empId = req.user?.employeeId;
      if (!empId) {
        return res.json({ success: true, data: [] });
      }
      const payslips = await PayslipService.getPayslipsByEmployeeId(String(empId));
      res.json({ success: true, data: payslips });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async getPayslipsByPayrun(req: Request, res: Response) {
    try {
      const payrunId = String(req.params.payrunId);
      const payslips = await PayslipService.getPayslipsByPayrunId(payrunId);
      res.json({ success: true, data: payslips });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async downloadPayslipPdf(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payslip = await PayslipService.getPayslipById(id);
      if (!payslip) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
      }

      const pdfBuffer = await PdfGeneratorService.generatePayslipPdf(payslip);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
}
