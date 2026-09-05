import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, Calendar, Clock, DollarSign, LayoutDashboard, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function getNormalizedRole(user: any): string {
  if (!user) return 'employee';
  const roleStr = user.role?.id || user.role?.name || user.role || '';
  const r = String(roleStr).toLowerCase().trim().replace(/\s+/g, '_');
  if (r.includes('admin')) return 'admin';
  if (r.includes('payroll_manager') || r.includes('payroll_mgr')) return 'hr_payroll_manager';
  if (r.includes('payroll_user') || r.includes('payroll_usr')) return 'hr_payroll_user';
  if (r.includes('hr_manager') || r.includes('hr_mgr')) return 'hr_manager';
  return 'employee';
}

export const SubNav: React.FC = () => {
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);

  const navItems = [
    { name: 'Employees', path: '/employees', icon: Users, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager', 'employee'] },
    { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager'] },
    { name: 'Working Schedules', path: '/schedules', icon: Calendar, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager', 'employee'] },
    { name: 'Time Off', path: '/timeoff', icon: Calendar, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user', 'hr_manager', 'employee'] },
    { name: 'Payroll & Payruns', path: '/payroll', icon: DollarSign, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user'] },
    { name: 'Salary Structures & Rules', path: '/payroll/structures', icon: Sliders, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user'] },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr_payroll_manager', 'hr_payroll_user'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(normalizedRole));

  return (
    <nav className="h-12 bg-white border-b border-[#E5E7EB] px-6 flex items-center gap-6 shadow-sm overflow-x-auto">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 h-full text-sm font-semibold border-b-2 transition-all px-1 ${
                isActive
                  ? 'border-[#5B4FE9] text-[#5B4FE9]'
                  : 'border-transparent text-[#6B7280] hover:text-[#1A1A2E]'
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
