import React from 'react';
import { Routes, Route, Navigate, RouteObject } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './layouts/Navbar';
import { SubNav, getNormalizedRole } from './layouts/SubNav';
import { LoginPage } from './features/auth-employee/pages/LoginPage';
import { EmployeeKanbanPage } from './features/auth-employee/pages/EmployeeKanbanPage';
import { EmployeeFormPage } from './features/auth-employee/pages/EmployeeFormPage';
import { ContractListPage } from './features/auth-employee/pages/ContractListPage';
import { SchedulePage } from './features/auth-employee/pages/SchedulePage';
import { AttendanceListPage } from './features/attendance-timeoff/pages/AttendanceListPage';
import { TimeOffOverviewPage } from './features/attendance-timeoff/pages/TimeOffOverviewPage';
import { PayrollDashboardPage } from './features/dashboard-reports/pages/PayrollDashboardPage';
import { PayrunsListPage } from './features/payroll/pages/PayrunsListPage';
import { PayrunProcessingPage } from './features/payroll/pages/PayrunProcessingPage';
import { SalaryStructuresPage } from './features/payroll/pages/SalaryStructuresPage';
import { LandingPage } from './features/landing/pages/LandingPage';
import { payrollRoutes } from './features/payroll/payroll.routes';

const ALL_ROLES = ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager', 'employee'];
const HR_ROLES = ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager'];
const PAYROLL_ROLES = ['admin', 'hr_payroll_manager', 'hr_payroll_user'];

// Protected Layout Shell with RBAC Guarding
const ProtectedLayout: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles = ALL_ROLES,
}) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = getNormalizedRole(user);

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    let fallbackPath = '/employees';
    if (normalizedRole === 'employee') fallbackPath = '/attendance';
    if (normalizedRole === 'hr_manager') fallbackPath = '/employees';
    if (PAYROLL_ROLES.includes(normalizedRole)) fallbackPath = '/payroll';

    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      <SubNav />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Dev A Modules */}
      <Route
        path="/employees"
        element={
          <ProtectedLayout allowedRoles={ALL_ROLES}>
            <EmployeeKanbanPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/employees/new"
        element={
          <ProtectedLayout allowedRoles={HR_ROLES}>
            <EmployeeFormPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedLayout allowedRoles={ALL_ROLES}>
            <EmployeeFormPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedLayout allowedRoles={HR_ROLES}>
            <ContractListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/schedules"
        element={
          <ProtectedLayout allowedRoles={HR_ROLES}>
            <SchedulePage />
          </ProtectedLayout>
        }
      />

      {/* Dev B Modules */}
      <Route
        path="/attendance"
        element={
          <ProtectedLayout allowedRoles={ALL_ROLES}>
            <AttendanceListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/timeoff"
        element={
          <ProtectedLayout allowedRoles={ALL_ROLES}>
            <TimeOffOverviewPage />
          </ProtectedLayout>
        }
      />

      {/* Dev C Modules — Blocked for HR Manager & Employee */}
      <Route
        path="/payroll"
        element={
          <ProtectedLayout allowedRoles={PAYROLL_ROLES}>
            <PayrunsListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/payroll/structures"
        element={
          <ProtectedLayout allowedRoles={PAYROLL_ROLES}>
            <SalaryStructuresPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/payroll/payruns/:id"
        element={
          <ProtectedLayout allowedRoles={PAYROLL_ROLES}>
            <PayrunProcessingPage />
          </ProtectedLayout>
        }
      />

      {/* Dev D Module — Blocked for HR Manager & Employee */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout allowedRoles={PAYROLL_ROLES}>
            <PayrollDashboardPage />
          </ProtectedLayout>
        }
      />

      {/* Default Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/landing', element: <LandingPage /> },
  { path: '/employees', element: <EmployeeKanbanPage /> },
  { path: '/attendance', element: <AttendanceListPage /> },
  { path: '/dashboard', element: <PayrollDashboardPage /> },
  ...payrollRoutes,
];
