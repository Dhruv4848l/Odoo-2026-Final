import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { PlaceholderModulePage } from './features/placeholder/PlaceholderModulePage';
import { LandingPage } from './features/landing/pages/LandingPage';


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
      <main className="flex-1">{children}</main>
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


      {/* Dev C Module Placeholder */}
      <Route
        path="/payroll"
        element={
          <ProtectedLayout>
            <PlaceholderModulePage
              title="Payroll Engine & Payruns"
              squad="Dev C — Payroll Engine Squad"
              description="Salary structures, 2-step payrun wizard & payslip generation"
              icon="payroll"
            />
          </ProtectedLayout>
        }
      />

      {/* Dev D Module Placeholder */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <PlaceholderModulePage
              title="Payroll Dashboard & Analytics"
              squad="Dev D — Reporting & Platform Squad"
              description="Live headcount, salary cost charts & proactive warnings"
              icon="dashboard"
            />
          </ProtectedLayout>
        }
      />

      {/* Default Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
