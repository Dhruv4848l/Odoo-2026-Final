import React from 'react';
import {
  AlertTriangle,
  FileSpreadsheet,
  CalendarOff,
  Unplug,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Calculator,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const StorySection: React.FC = () => {
  return (
    <section id="story" className="w-full py-24 px-4 sm:px-6 lg:px-12 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5A5FE8]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#06B6D4]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-600 text-xs font-bold tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>THE OPERATIONAL PARADOX</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A] leading-tight">
            Why Traditional Payroll Fails — <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5A5FE8] to-[#06B6D4]">
              And How PeoplePay Automates It.
            </span>
          </h2>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Payroll is never just math; it is the final cryptographic reconciliation of an organization's lifecycle events. When your tools are disconnected, mistakes compound silently.
          </p>
        </div>

        {/* ================= ACT I: THE THREE CRITICAL PROBLEMS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Problem Card 1 */}
          <div className="bg-[#FFFBFB] rounded-3xl p-7 border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.06)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-100/70 text-red-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-red-500 font-mono">
                CRISIS 01
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A] mt-1 mb-3">
                Spreadsheet Formula Drift
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                87% of legacy payroll pipelines rely on manual Excel formulas. A single broken cell reference or altered tax bracket silently corrupts net salaries across 200 employees, triggering costly audits.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-red-100/80 flex items-center gap-2 text-xs font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>Result: 2.8% Average Discrepancy Rate</span>
            </div>
          </div>

          {/* Problem Card 2 */}
          <div className="bg-[#FFFDF7] rounded-3xl p-7 border border-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <CalendarOff className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 font-mono">
                CRISIS 02
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A] mt-1 mb-3">
                Mid-Month Proration Nightmare
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Employees join on the 12th, get promoted on the 18th, and take unpaid leave on the 24th. Legacy ERPs cannot resolve calendar proration dynamically, forcing HR into manual, error-prone guesswork.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-100/80 flex items-center gap-2 text-xs font-bold text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Result: Hours Wasted in Re-calculations</span>
            </div>
          </div>

          {/* Problem Card 3 */}
          <div className="bg-[#FBFBFF] rounded-3xl p-7 border border-indigo-100 shadow-[0_4px_20px_rgba(90,95,232,0.06)] hover:shadow-[0_12px_30px_rgba(90,95,232,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-[#5A5FE8] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Unplug className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5A5FE8] font-mono">
                CRISIS 03
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A] mt-1 mb-3">
                Disconnected Silo Chaos
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                HR stores employee profiles in one app, attendance is stuck in physical hardware, contracts are scattered PDF scans, and payroll runs in an isolated bureau. No single source of truth exists.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-indigo-100/80 flex items-center gap-2 text-xs font-bold text-[#5A5FE8]">
              <span className="w-2 h-2 rounded-full bg-[#5A5FE8]"></span>
              <span>Result: Inability to Trace Audit Trails</span>
            </div>
          </div>

        </div>

        {/* ================= ACT II: THE PEOPLEPAY AUTONOMOUS SOLUTION ================= */}
        <div className="w-full bg-gradient-to-br from-[#F8F9FD] to-[#F1F3FF] rounded-[32px] p-8 lg:p-12 border border-[#5A5FE8]/15 shadow-[0_15px_40px_rgba(90,95,232,0.08)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Solution Narrative */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5A5FE8]/10 text-[#5A5FE8] text-xs font-extrabold w-max">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>THE ARCHITECTURAL SOLUTION</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight">
                One Continuous Pipeline. <br />
                <span className="text-[#5A5FE8]">Zero Manual Handoffs.</span>
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                PeoplePay eliminates fragmented handoffs by running on a centralized <strong>Supabase PostgreSQL</strong> backbone. Every employee update instantly cascades into the sequenced salary engine with zero manual re-entry.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs text-slate-800 block">Deterministic AST</strong>
                    <span className="text-[11px] text-slate-500">Pythonic rule execution</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs text-slate-800 block">Zero-Overlap Guard</strong>
                    <span className="text-[11px] text-slate-500">Blocks concurrent wages</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs text-slate-800 block">Biometric Sync</strong>
                    <span className="text-[11px] text-slate-500">Prorated hourly calculus</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs text-slate-800 block">Single Click Payout</strong>
                    <span className="text-[11px] text-slate-500">Immediate PDF delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Diagram */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">Workflow Architecture Comparison</span>
                <span className="text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">99.9% Faster</span>
              </div>

              {/* Legacy Way */}
              <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span>Traditional Bureaucracy</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Spreadsheets ➔ Manual Email ➔ Kiosk Punch ➔ Bureau Run ➔ Paper Payslips
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-red-600">4–5 Days</div>
                  <div className="text-[10px] text-slate-400">Manual cycle</div>
                </div>
              </div>

              {/* PeoplePay Way */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-[#5A5FE8]/30 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-extrabold text-[#5A5FE8] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#5A5FE8]" />
                    <span>PeoplePay Autonomous Pipeline</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    PostgreSQL Trigger ➔ Attendance Kiosk ➔ Sequenced Rule AST ➔ 1-Click Disburse
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#10B981]">&lt; 30 Sec</div>
                  <div className="text-[10px] text-slate-400">Zero errors</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
