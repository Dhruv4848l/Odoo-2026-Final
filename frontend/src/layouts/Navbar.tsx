import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Clock, Search, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface NavbarProps {
  onToggleAttendanceWidget?: () => void;
  currentUser?: { name: string; role: string; avatar?: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleAttendanceWidget,
  currentUser = { name: 'Amara Chen', role: 'HR Payroll Manager' },
}) => {
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;

  const displayName = user?.employee
    ? `${user.employee.first_name} ${user.employee.last_name}`
    : user?.email || currentUser.name;

  const displayRole = user?.role?.name || user?.role?.id || currentUser.role;

  return (
    <header className="w-full flex flex-col sticky top-0 z-40">
      {/* Utility Top Bar (Ink Navy) */}
      <div className="h-[60px] bg-[#14141F] text-white px-6 flex items-center justify-between shadow-md">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5B4FE9] flex items-center justify-center font-bold text-white shadow-sm">
            360
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">PeoplePay<span className="text-[#5B4FE9]">360</span></span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full ml-2 font-mono">v1.0</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Search */}
          <div className="relative hidden md:block w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full h-8 pl-9 pr-3 bg-white/10 text-white placeholder:text-slate-400 text-xs rounded-full border border-white/10 focus:outline-none focus:bg-white/20 transition-all"
            />
          </div>

          {/* Attendance floating trigger button */}
          {onToggleAttendanceWidget && (
            <button
              onClick={onToggleAttendanceWidget}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Clock className="w-4 h-4 text-[#22C55E]" />
              <span>Attendance Widget</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-[#5B4FE9]/30 border border-[#5B4FE9] flex items-center justify-center text-sm font-bold text-white">
              {displayName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">{displayName}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">{displayRole}</span>
            </div>
            {logout && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-full transition-all ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
