import React from 'react';
import { Bell, Search, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-[60px] bg-navy text-white px-6 flex items-center justify-between shadow-md">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-lg text-white shadow-sm">
          P
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-wide text-white">PeoplePay360</span>
          <span className="text-[10px] text-gray-400 font-medium">HR & Payroll Platform</span>
        </div>
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees, contracts..."
            className="w-full h-8 pl-9 pr-3 bg-white/10 text-white placeholder:text-gray-400 text-xs rounded-full border border-white/10 focus:outline-none focus:bg-white/20 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-danger absolute top-1.5 right-1.5 ring-2 ring-navy" />
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all">
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile & Role Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <img
              src={user.employee?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
              alt="Avatar"
              className="w-8 h-8 rounded-full bg-gray-700 object-cover ring-2 ring-primary/40"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-white">
                {user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.email}
              </span>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary-light" />
                <span className="text-[10px] text-gray-300 font-medium uppercase">{user.role?.name || user.role?.id}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-full transition-all ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
