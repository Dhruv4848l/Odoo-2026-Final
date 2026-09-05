import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, Calendar, Clock, DollarSign, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SubNav: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.id || 'employee';

  const navItems = [
    { name: 'Employees', path: '/employees', icon: Users, roles: ['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'] },
    { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'] },
    { name: 'Working Schedules', path: '/schedules', icon: Calendar, roles: ['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'] },
    { name: 'Time Off', path: '/timeoff', icon: Calendar, roles: ['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'] },
    { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: ['admin', 'hr_payroll_user', 'hr_payroll_manager'] },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr_payroll_user', 'hr_payroll_manager'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="h-12 bg-white border-b border-border px-6 flex items-center gap-6 shadow-xs overflow-x-auto">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 h-full text-sm font-semibold border-b-2 transition-all px-1 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate hover:text-ink'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
