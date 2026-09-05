import { Express } from 'express';
import identityRoutes from './modules/identity-employee/identity.routes.js';
import payrollRoutes from './modules/payroll-engine/payroll.routes.js';
import attendanceRoutes from './modules/attendance-timeoff/attendance.routes.js';
import timeoffRoutes from './modules/attendance-timeoff/timeoff.routes.js';
import dashboardRoutes from './modules/reporting-platform/dashboard.routes.js';

export function registerRoutes(app: Express) {
  const API_PREFIX = '/api/v1';

  // Dev A — Identity & Core HR Squad
  app.use(API_PREFIX, identityRoutes);

  // Dev B — Time & Presence Squad
  app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
  app.use(`${API_PREFIX}/timeoff`, timeoffRoutes);

  // Dev C — Payroll Engine Squad
  app.use(`${API_PREFIX}/payroll`, payrollRoutes);

  // Dev D — Reporting & Dashboard Squad
  app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

  // Health check endpoint
  app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
  });

  console.log('[RoutesLoader] API v1 routes mounted successfully including Dev A, Dev B, Dev C, Dev D.');
}

export function loadRoutes(app: Express) {
  registerRoutes(app);
}
