import { Express } from 'express';
import identityRoutes from './modules/identity-employee/identity.routes.js';
import attendanceRoutes from './modules/attendance-timeoff/attendance.routes.js';
import timeoffRoutes from './modules/attendance-timeoff/timeoff.routes.js';

export function registerRoutes(app: Express) {
  // Base API v1 prefix
  const API_PREFIX = '/api/v1';

  // Dev A — Identity & Core HR Squad
  app.use(API_PREFIX, identityRoutes);

  // Dev B — Time & Presence Squad
  app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
  app.use(`${API_PREFIX}/timeoff`, timeoffRoutes);

  // Dev C — Payroll Engine Squad (Placeholder for auto-mount)
  // Dev D — Reporting Platform Squad (Placeholder for auto-mount)

  console.log('[RoutesLoader] API v1 routes mounted successfully including Dev B (Time & Presence).');
}

