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

  // Nav items ordered with Dashboard explicitly FIRST for Admin & Payroll roles
  const getNavItemsByRole = () => {
    switch (normalizedRole) {
      case 'admin':
      case 'hr_payroll_manager':
      case 'hr_payroll_user':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Employees', path: '/employees', icon: Users },
          { name: 'Contracts', path: '/contracts', icon: FileText },
          { name: 'Working Schedules', path: '/schedules', icon: Calendar },
          { name: 'Attendance', path: '/attendance', icon: Clock },
          { name: 'Time Off', path: '/timeoff', icon: Calendar },
          { name: 'Payroll & Payruns', path: '/payroll', icon: DollarSign },
          { name: 'Salary Structures & Rules', path: '/payroll/structures', icon: Sliders },
        ];

      case 'hr_manager':
        return [
          { name: 'Employees', path: '/employees', icon: Users },
          { name: 'Contracts', path: '/contracts', icon: FileText },
          { name: 'Working Schedules', path: '/schedules', icon: Calendar },
          { name: 'Attendance', path: '/attendance', icon: Clock },
          { name: 'Time Off', path: '/timeoff', icon: Calendar },
        ];

      case 'employee':
      default:
        return [
          { name: 'Attendance', path: '/attendance', icon: Clock },
          { name: 'Time Off', path: '/timeoff', icon: Calendar },
          { name: 'Employees', path: '/employees', icon: Users },
        ];
    }
  };

  const visibleItems = getNavItemsByRole();

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/payroll'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white font-bold shadow-glow scale-[1.02]'
                    : 'text-[#5A5D72] hover:text-[#12141F] hover:bg-[#F2F3F8]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
