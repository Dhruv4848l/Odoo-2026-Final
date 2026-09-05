import { Express } from 'express';
import identityRoutes from './modules/identity-employee/identity.routes.js';

export function registerRoutes(app: Express) {
  // Base API v1 prefix
  const API_PREFIX = '/api/v1';

  // Dev A — Identity & Core HR Squad
  app.use(API_PREFIX, identityRoutes);

  // Dev B — Time & Presence Squad (Placeholder for auto-mount)
  // Dev C — Payroll Engine Squad (Placeholder for auto-mount)
  // Dev D — Reporting Platform Squad (Placeholder for auto-mount)

  console.log('[RoutesLoader] API v1 routes mounted successfully.');
}
