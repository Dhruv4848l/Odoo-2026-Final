import React from 'react';
import { Routes, Route, Navigate, RouteObject } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './layouts/Navbar';
import { SubNav } from './layouts/SubNav';
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

// Protected Layout Shell
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
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
      <Route path="/login" element={<LoginPage />} />

      {/* Dev A Modules */}
      <Route
        path="/employees"
        element={
          <ProtectedLayout>
            <EmployeeKanbanPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedLayout>
            <EmployeeFormPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedLayout>
            <ContractListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/schedules"
        element={
          <ProtectedLayout>
            <SchedulePage />
          </ProtectedLayout>
        }
      />

      {/* Dev B Modules */}
      <Route
        path="/attendance"
        element={
          <ProtectedLayout>
            <AttendanceListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/timeoff"
        element={
          <ProtectedLayout>
            <TimeOffOverviewPage />
          </ProtectedLayout>
        }
      />

      {/* Dev C Modules */}
      <Route
        path="/payroll"
        element={
          <ProtectedLayout>
            <PayrunsListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/payroll/structures"
        element={
          <ProtectedLayout>
            <SalaryStructuresPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/payroll/payruns/:id"
        element={
          <ProtectedLayout>
            <PayrunProcessingPage />
          </ProtectedLayout>
        }
      />

      {/* Dev D Module */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
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
  { path: '/', element: <Navigate to="/payroll" replace /> },
  { path: '/employees', element: <EmployeeKanbanPage /> },
  { path: '/attendance', element: <AttendanceListPage /> },
  { path: '/dashboard', element: <PayrollDashboardPage /> },
  ...payrollRoutes,
];
