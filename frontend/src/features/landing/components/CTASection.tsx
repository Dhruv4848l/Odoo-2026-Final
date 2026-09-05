import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-12 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#F8F9FD] via-[#F1F4FA] to-[#EEF2FF] rounded-[36px] p-8 sm:p-14 border border-[#5A5FE8]/20 shadow-[0_20px_50px_-15px_rgba(90,95,232,0.15)] relative overflow-hidden text-center flex flex-col items-center gap-6">
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#5A5FE8]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#5A5FE8]/20 text-[#5A5FE8] text-xs font-bold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INSTANT ACCESS WORKSPACE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight max-w-2xl leading-tight">
          Ready to Modernize Your Workforce Operations?
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
          Experience zero-error payroll reconciliation with pre-seeded demo accounts across Admin, HR Manager, Payroll User, and Employee roles.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#5A5FE8] hover:bg-[#4E53DE] text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(90,95,232,0.45)] hover:shadow-[0_14px_30px_-5px_rgba(90,95,232,0.6)] transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#5A5FE8]" />
            <span>Sign In with Demo Roles</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            No setup required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#5A5FE8]" />
            200 pre-seeded employees
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4]" />
            Deterministic Pythonic AST
          </span>
        </div>

      </div>
    </section>
  );
};
