import { Express } from 'express';
import identityRoutes from './modules/identity-employee/identity.routes.js';
import payrollRoutes from './modules/payroll-engine/payroll.routes.js';

export function registerRoutes(app: Express) {
  const API_PREFIX = '/api/v1';

  // Dev A — Identity & Core HR Squad
  app.use(API_PREFIX, identityRoutes);

  // Dev C — Payroll Engine Squad
  app.use(`${API_PREFIX}/payroll`, payrollRoutes);

  // Health check endpoint
  app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
  });

  console.log('[RoutesLoader] API v1 routes mounted successfully.');
}

export function loadRoutes(app: Express) {
  registerRoutes(app);
}
