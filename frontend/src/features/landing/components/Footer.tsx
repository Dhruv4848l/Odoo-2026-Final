import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-navy text-gray-400 py-12 px-6 md:px-12 text-xs border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-base">
              P
            </div>
            <span className="text-white font-bold text-base">PeoplePay360</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Integrated HR & Payroll Operations Platform. Reconciling Headcount, Contracts, Schedules & Payroll into one flow.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-2">
          <span className="text-white font-bold uppercase text-[11px] tracking-wider mb-1">HR Modules</span>
          <button onClick={() => navigate('/employees')} className="text-left hover:text-white transition-colors">
            Employee Directory
          </button>
          <button onClick={() => navigate('/contracts')} className="text-left hover:text-white transition-colors">
            Contract Management
          </button>
          <button onClick={() => navigate('/schedules')} className="text-left hover:text-white transition-colors">
            Working Schedules
          </button>
        </div>

        {/* Time & Payroll */}
        <div className="flex flex-col gap-2">
          <span className="text-white font-bold uppercase text-[11px] tracking-wider mb-1">Time & Payroll</span>
          <button onClick={() => navigate('/attendance')} className="text-left hover:text-white transition-colors">
            Attendance Logs
          </button>
          <button onClick={() => navigate('/timeoff')} className="text-left hover:text-white transition-colors">
            Time Off & Allocations
          </button>
          <button onClick={() => navigate('/payroll')} className="text-left hover:text-white transition-colors">
            Payroll Engine
          </button>
        </div>

        {/* Security & System */}
        <div className="flex flex-col gap-2">
          <span className="text-white font-bold uppercase text-[11px] tracking-wider mb-1">Platform</span>
          <button onClick={() => navigate('/dashboard')} className="text-left hover:text-white transition-colors">
            Payroll Analytics
          </button>
          <button onClick={() => navigate('/login')} className="text-left hover:text-white transition-colors">
            Role Access Control
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 PeoplePay360 Operations Platform. All rights reserved.</span>
        <span>SEO-Optimized · High-Performance Motion Engine</span>
      </div>
    </footer>
  );
};
