import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/brand/Logo';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#F8F9FD] border-t border-slate-200/80 text-slate-500 py-14 px-4 sm:px-6 lg:px-12 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-3">
          <Logo size="md" variant="light" showSubtitle={true} subtitleText="Autonomous HR & Payroll Platform" />
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs mt-1">
            Reconciles headcount, contracts, schedules, attendance, and salary rules into verified payslips — built on Supabase PostgreSQL.
          </p>
        </div>

        {/* HR Modules */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[#0F172A] font-extrabold uppercase text-[11px] tracking-wider mb-1 font-mono">
            HR Modules
          </span>
          <button onClick={() => navigate('/employees')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Employee Directory (200 Staff)
          </button>
          <button onClick={() => navigate('/contracts')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Contract Management &amp; Overlap Guard
          </button>
          <button onClick={() => navigate('/schedules')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Working Schedule Patterns
          </button>
        </div>

        {/* Time & Payroll */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[#0F172A] font-extrabold uppercase text-[11px] tracking-wider mb-1 font-mono">
            Time &amp; Payroll
          </span>
          <button onClick={() => navigate('/attendance')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Attendance Logs &amp; Punch Kiosk
          </button>
          <button onClick={() => navigate('/timeoff')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Time Off &amp; Allocations
          </button>
          <button onClick={() => navigate('/payroll')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Autonomous Payrun Engine
          </button>
        </div>

        {/* Platform & Security */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[#0F172A] font-extrabold uppercase text-[11px] tracking-wider mb-1 font-mono">
            Security &amp; RBAC
          </span>
          <button onClick={() => navigate('/dashboard')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Executive Compensation Analytics
          </button>
          <button onClick={() => navigate('/salary-rules')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            Salary Structures &amp; Rule AST
          </button>
          <button onClick={() => navigate('/login')} className="text-left hover:text-[#5A5FE8] transition-colors cursor-pointer">
            5-Tier RBAC Access Portal
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
        <span>© 2026 PeoplePay Platform. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span>Supabase PostgreSQL Cloud</span>
          <span>·</span>
          <span>Deterministic Odoo AST Engine</span>
          <span>·</span>
          <span>Vite &amp; React</span>
        </div>
      </div>
    </footer>
  );
};
