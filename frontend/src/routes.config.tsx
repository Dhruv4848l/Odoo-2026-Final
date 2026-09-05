import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { payrollRoutes } from './features/payroll/payroll.routes';
import { EmployeesKanbanPage } from './features/auth-employee/pages/EmployeesKanbanPage';
import { AttendanceListPage } from './features/attendance-timeoff/pages/AttendanceListPage';
import { PayrollDashboardPage } from './features/dashboard-reports/pages/PayrollDashboardPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/payroll" replace />,
  },
  {
    path: '/employees',
    element: <EmployeesKanbanPage />,
  },
  {
    path: '/attendance',
    element: <AttendanceListPage />,
  },
  {
    path: '/dashboard',
    element: <PayrollDashboardPage />,
  },
  ...payrollRoutes,
];
