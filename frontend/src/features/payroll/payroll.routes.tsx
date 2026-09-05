import React from 'react';
import { RouteObject } from 'react-router-dom';
import { PayrunsListPage } from './pages/PayrunsListPage';
import { PayrunProcessingPage } from './pages/PayrunProcessingPage';
import { SalaryStructuresPage } from './pages/SalaryStructuresPage';

export const payrollRoutes: RouteObject[] = [
  {
    path: '/payroll',
    element: <PayrunsListPage />,
  },
  {
    path: '/payroll/structures',
    element: <SalaryStructuresPage />,
  },
  {
    path: '/payroll/payruns/:id',
    element: <PayrunProcessingPage />,
  },
];
