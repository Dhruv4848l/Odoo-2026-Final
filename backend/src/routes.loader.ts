import { Express } from 'express';
import payrollRoutes from './modules/payroll-engine/payroll.routes';

export function loadRoutes(app: Express) {
  // Module base path per spec Section 11: /api/v1/...
  app.use('/api/v1/payroll', payrollRoutes);

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
  });
}
