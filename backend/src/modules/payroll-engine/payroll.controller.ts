import { Request, Response } from 'express';
import { SalaryStructureService } from './services/salary-structure.service';
import { PayrunService } from './services/payrun.service';
import { PayslipService } from './services/payslip.service';
import { PdfGeneratorService } from './services/pdf-generator.service';

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
      const id = parseInt(req.params.id);
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
      const { name } = req.body;
      const structure = await SalaryStructureService.createStructure(name);
      res.status(201).json({ success: true, data: structure });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async addSalaryRule(req: Request, res: Response) {
    try {
      const rule = await SalaryStructureService.addSalaryRule(req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async updateSalaryRule(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const rule = await SalaryStructureService.updateSalaryRule(id, req.body);
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
      const id = parseInt(req.params.id);
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
      const payrun = await PayrunService.createPayrun(
        name,
        structure_id,
        period_start,
        period_end,
        selected_employee_ids || [1, 2, 3]
      );
      res.status(201).json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async validatePayrun(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const payrun = await PayrunService.updatePayrunStatus(id, 'Validated');
      res.json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async markPaidPayrun(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const payrun = await PayrunService.updatePayrunStatus(id, 'Paid');
      res.json({ success: true, data: payrun });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async sendPayslips(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await PayslipService.sendBulkPayslipEmails(id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  // Payslips
  static async getPayslipById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const payslip = await PayslipService.getPayslipById(id);
      if (!payslip) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
      }
      res.json({ success: true, data: payslip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async getPayslipsByPayrun(req: Request, res: Response) {
    try {
      const payrunId = parseInt(req.params.payrunId);
      const payslips = await PayslipService.getPayslipsByPayrunId(payrunId);
      res.json({ success: true, data: payslips });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }

  static async downloadPayslipPdf(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
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
