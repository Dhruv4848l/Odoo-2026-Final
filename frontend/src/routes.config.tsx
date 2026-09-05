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
import { PlaceholderModulePage } from './features/placeholder/PlaceholderModulePage';

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

      {/* Dev B Module Placeholder */}
      <Route
        path="/attendance"
        element={
          <ProtectedLayout>
            <PlaceholderModulePage
              title="Attendance Management"
              squad="Dev B — Time & Presence Squad"
              description="Check-in/out widget, attendance logs & missing checkout flags"
              icon="attendance"
            />
          </ProtectedLayout>
        }
      />
      <Route
        path="/timeoff"
        element={
          <ProtectedLayout>
            <PlaceholderModulePage
              title="Time Off & Allocations"
              squad="Dev B — Time & Presence Squad"
              description="Leave requests, balance tracking & approval workflows"
              icon="timeoff"
            />
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
      <Route path="*" element={<Navigate to="/employees" replace />} />
    </Routes>
  );
};
